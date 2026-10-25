package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.SystemClock;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.lang.ref.WeakReference;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import javax.net.ssl.HttpsURLConnection;

/**
 * LT72: read-only Google Drive update manifest. No installation, proxy,
 * permissions, Firebase mutation, WebView session, or overlay dependency.
 */
public final class UpdateCenter {
    private static final String MANIFEST_ID="15IrWg9FpiNteZcsmUSBtyfd4v2Hmcbrf";
    private static final String MANIFEST_URL="https://drive.google.com/uc?export=download&id="+MANIFEST_ID;
    private static final String MANIFEST_FALLBACK=
        "https://drive.usercontent.google.com/download?id="+MANIFEST_ID+"&export=download&confirm=t";
    private static final String SCHEMA="pokesearch-update-v1";
    private static final String PREFS="prefs";
    private static final String DISMISSED_KEY="homeDriveUpdateDismissedCode";
    private static final long CHECK_INTERVAL_MS=5*60*1000L;
    private static final int MAX_BYTES=16384;
    private static final Object LOCK=new Object();
    private static final ArrayList<WeakReference<MainActivity>> WAITERS=new ArrayList<>();
    private static final ExecutorService IO=Executors.newSingleThreadExecutor(task->{
        Thread t=new Thread(task,"PokeSearch-Drive-Updates");
        t.setDaemon(true);return t;
    });
    private static boolean inFlight=false;
    private static long lastCheckAt=0L;
    private static Manifest latest=null;

    private UpdateCenter() {}

    public static final class Manifest {
        public final int versionCode;
        public final String versionName,apkName,apkFileId,apkUrl,apkSha256;
        public final String message,description,status;
        public final boolean enabled,forceUpdate;
        public final JSONArray notes;
        private Manifest(int versionCode,String versionName,String apkName,
                         String apkFileId,String apkUrl,String apkSha256,
                         String message,String description,String status,
                         boolean enabled,boolean forceUpdate,JSONArray notes) {
            this.versionCode=versionCode;this.versionName=VersionNames.canonical(versionName);this.apkName=apkName;
            this.apkFileId=apkFileId;this.apkUrl=apkUrl;this.apkSha256=apkSha256;
            this.message=message;this.description=description;this.status=status;
            this.enabled=enabled;this.forceUpdate=forceUpdate;this.notes=notes;
        }
    }

    /** Pure eligibility policy; dismissed codes only hide that exact version. */
    static boolean shouldShow(Manifest manifest,int installedCode,int dismissedCode) {
        return manifest!=null && UpdatePolicy.shouldDisplay(manifest.enabled,
            manifest.versionCode,installedCode,dismissedCode);
    }

    public static boolean isEligible(Activity activity,Manifest manifest) {
        if (manifest==null) return false;
        int installed=BuildConfig.VERSION_CODE;
        int dismissed=activity.getSharedPreferences(PREFS,0).getInt(DISMISSED_KEY,-1);
        return shouldShow(manifest,installed,dismissed);
    }

    public static void dismiss(Activity activity,int versionCode) {
        if(versionCode>0)
            activity.getSharedPreferences(PREFS,0).edit()
                .putInt(DISMISSED_KEY,versionCode).apply();
    }

    /** Refresh on Home opening, but never duplicate a request on resume/theme changes. */
    public static void check(MainActivity activity) {
        Manifest cached;
        synchronized(LOCK) {
            cached=latest;
            long now=SystemClock.elapsedRealtime();
            if(inFlight) {
                addWaiter(activity);
                return;
            }
            if(lastCheckAt!=0 && now-lastCheckAt>=0 &&
               now-lastCheckAt<CHECK_INTERVAL_MS) {
                deliver(activity,cached);
                return;
            }
            inFlight=true;
            lastCheckAt=now;
            addWaiter(activity);
        }
        IO.execute(()->{
            Manifest fetched=null;
            try {
                String json=downloadJson(MANIFEST_URL);
                if(json==null) json=downloadJson(MANIFEST_FALLBACK);
                if(json!=null) fetched=parse(json);
            }catch(Exception ignored) {
                // No network, HTML confirmation pages and malformed responses
                // never block the Home or display an unverified update.
            }
            ArrayList<WeakReference<MainActivity>> callbacks;
            synchronized(LOCK) {
                latest=fetched;
                inFlight=false;
                callbacks=new ArrayList<>(WAITERS);
                WAITERS.clear();
            }
            for(WeakReference<MainActivity> ref:callbacks) {
                MainActivity target=ref.get();
                if(target!=null) deliver(target,fetched);
            }
        });
    }
    private static void addWaiter(MainActivity activity) {
        for(WeakReference<MainActivity> item:WAITERS)if(item.get()==activity)return;
        WAITERS.add(new WeakReference<>(activity));
    }
    private static void deliver(MainActivity activity,Manifest m) {
        activity.runOnUiThread(()->{
            if(!activity.isFinishing()&&!activity.isDestroyed())
                activity.onDriveUpdateLoaded(m);
        });
    }

    private static boolean trustedHost(String host) {
        if(host==null)return false;
        String h=host.toLowerCase(java.util.Locale.US);
        return h.equals("drive.google.com")||h.equals("drive.usercontent.google.com")||
            h.equals("docs.google.com")||h.equals("googleusercontent.com")||
            h.endsWith(".googleusercontent.com");
    }
    /** Bounded HTTPS reader. Reject Drive login/confirmation HTML instead of parsing it. */
    private static String downloadJson(String address) {
        try {
            URL url=new URL(address);
            for(int redirect=0;redirect<5;redirect++) {
                if(!"https".equalsIgnoreCase(url.getProtocol())||!trustedHost(url.getHost()))
                    return null;
                HttpsURLConnection c=(HttpsURLConnection)url.openConnection();
                c.setInstanceFollowRedirects(false);
                c.setConnectTimeout(4000);
                c.setReadTimeout(4000);
                c.setUseCaches(false);
                c.setRequestProperty("Accept","application/json,text/plain;q=0.9,*/*;q=0.1");
                try {
                    int status=c.getResponseCode();
                    if(status==301||status==302||status==303||status==307||status==308) {
                        String next=c.getHeaderField("Location");
                        if(next==null||next.length()>2048)return null;
                        url=new URL(url,next);
                        continue;
                    }
                    if(status!=200)return null;
                    String contentType=c.getContentType();
                    if(contentType!=null && contentType.toLowerCase(java.util.Locale.US)
                        .contains("text/html"))return null;
                    try(InputStream in=c.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){
                        byte[] buffer=new byte[2048];int size;
                        while((size=in.read(buffer))!=-1){
                            if(out.size()+size>MAX_BYTES)return null;
                            out.write(buffer,0,size);
                        }
                        String body=new String(out.toByteArray(),StandardCharsets.UTF_8).trim();
                        return body.startsWith("{")?body:null;
                    }
                }finally{c.disconnect();}
            }
        }catch(Exception ignored){}
        return null;
    }

    /** Fail-closed validation; public JSON is untrusted input. */
    static Manifest parse(String json) {
        if(json==null||json.length()>MAX_BYTES)return null;
        try {
            JSONObject o=new JSONObject(json);
            if(!SCHEMA.equals(o.optString("schema")))return null;
            Object enabled=o.opt("enabled"),force=o.opt("forceUpdate");
            if(!(enabled instanceof Boolean)||!(force instanceof Boolean))return null;
            Object rawCode=o.opt("versionCode");
            if(!(rawCode instanceof Integer||rawCode instanceof Long))return null;
            long code=((Number)rawCode).longValue();
            if(code<=0||code>Integer.MAX_VALUE)return null;
            String name=o.getString("versionName").trim();
            String apkName=o.getString("apkName").trim();
            if(!UpdatePolicy.validVersion(name,apkName))return null;
            String fileId=o.getString("apkFileId").trim();
            String url=o.getString("apkUrl").trim();
            if(!UpdatePolicy.safeDownloadLink(fileId,url))return null;
            String hash=o.getString("apkSha256").trim().toLowerCase(java.util.Locale.US);
            if(!UpdatePolicy.validHash(hash))return null;
            String message=o.getString("message").trim();
            String description=o.getString("description").trim();
            String status=o.getString("status").trim();
            if(message.isEmpty()||message.length()>120||description.length()>280||
                status.isEmpty()||status.length()>80)return null;
            JSONArray notes=o.optJSONArray("notes");
            if(notes==null||notes.length()>30)return null;
            return new Manifest((int)code,name,apkName,fileId,url,hash,
                message,description,status,(Boolean)enabled,(Boolean)force,notes);
        }catch(Exception ignored){return null;}
    }

    /** Explicit browser navigation only; Google may show a download confirmation. */
    public static void openDownload(Activity activity,Manifest info) {
        if(!isEligible(activity,info))return;
        try {
            Intent intent=new Intent(Intent.ACTION_VIEW,Uri.parse(info.apkUrl));
            intent.addCategory(Intent.CATEGORY_BROWSABLE);
            activity.startActivity(intent);
        }catch(Exception ignored){
            android.widget.Toast.makeText(activity,
                "Não foi possível abrir o Google Drive no navegador.",android.widget.Toast.LENGTH_SHORT).show();
        }
    }
}

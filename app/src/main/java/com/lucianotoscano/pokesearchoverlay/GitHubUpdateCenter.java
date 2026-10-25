package com.lucianotoscano.pokesearchoverlay;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import androidx.core.content.FileProvider;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import javax.net.ssl.HttpsURLConnection;

/** HTTPS GitHub Release discovery and in-app APK QA installer.
 * The GitHub API is the TLS-authenticated metadata source; every APK is
 * independently checked against the pin of the EXISTING signing certificate.
 * No URL, GitHub token, API response, reveal code or JWT is shown in UI/logs.
 * Only manually approved stable Releases may be discovered by installed apps.
 */
public final class GitHubUpdateCenter {
    private GitHubUpdateCenter(){}
    private static final String API="https://api.github.com/repos/LucianoToscano/PokeSearch/releases/latest";
    private static final String ASSET_PREFIX="https://github.com/LucianoToscano/PokeSearch/releases/download/";
    private static final String CERT="34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e";
    private static final String CHANNEL="pokesearch-updates";
    private static final String PREFS="prefs";
    private static final int MAX_META=256*1024;
    private static final long MAX_APK=150_000_000L;
    private static final long MIN_INTERVAL_MS=5*60*1000L;
    private static final AtomicBoolean DOWNLOADING=new AtomicBoolean(false);
    private static final ExecutorService IO=Executors.newSingleThreadExecutor();
    private static final Handler MAIN=new Handler(Looper.getMainLooper());
    private static volatile long lastCheck=0L;
    private static volatile Release cached=null;
    public static final class Release {
        public final int versionCode;
        public final long size;
        public final String versionName,assetName,url,sha256,notes;
        private Release(int code,String name,String file,String url,String hash,long length,String message) {
            versionCode=code;versionName=name;assetName=file;this.url=url;
            sha256=hash;size=length;notes=message;
        }
    }
    public static boolean eligible(Context context,Release r) {
        if(r==null||r.versionCode<=BuildConfig.VERSION_CODE)return false;
        return context.getSharedPreferences(PREFS,0).getInt("githubUpdateIgnoredCode",-1)!=r.versionCode;
    }
    public static void ignore(Context context,int code){
        if(code>0)context.getSharedPreferences(PREFS,0).edit()
            .putInt("githubUpdateIgnoredCode",code).apply();
    }
    public static void later(Context context,int code){
        if(code>0)context.getSharedPreferences(PREFS,0).edit()
            .putInt("githubUpdateLaterCode",code).apply();
    }
    public static boolean alertsEnabled(Context c) {
        return c.getSharedPreferences(PREFS,0).getBoolean("githubUpdateAlertsEnabled",true);
    }
    public static void setAlerts(Context c,boolean enabled) {
        c.getSharedPreferences(PREFS,0).edit().putBoolean("githubUpdateAlertsEnabled",enabled).apply();
    }
    public static void schedule(Context c) {
        try {
            Constraints constraints=new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED).build();
            PeriodicWorkRequest request=new PeriodicWorkRequest.Builder(
                PollWorker.class,30,TimeUnit.MINUTES).setConstraints(constraints).build();
            WorkManager.getInstance(c.getApplicationContext()).enqueueUniquePeriodicWork(
                "pokesearch-approved-release",ExistingPeriodicWorkPolicy.KEEP,request);
        }catch(RuntimeException ignored){}
    }
    public static final class PollWorker extends Worker {
        public PollWorker(Context context,WorkerParameters params){super(context,params);}
        @Override public Result doWork() {
            try {
                Context context=getApplicationContext();
                Release r=checkRemote();
                if(eligible(context,r))notifyIfNew(context,r);
                return Result.success();
            }catch(Exception ignored){return Result.retry();}
        }
    }
    public static void check(MainActivity activity) {
        long now=android.os.SystemClock.elapsedRealtime();
        if(lastCheck!=0&&now>=lastCheck&&now-lastCheck<MIN_INTERVAL_MS){
            Release r=cached;
            MAIN.post(()->{if(!activity.isFinishing()&&!activity.isDestroyed())
                activity.onGithubUpdateLoaded(r);});
            return;
        }
        lastCheck=now;
        IO.execute(()->{
            Release r=checkRemote();cached=r;
            if(r!=null&&eligible(activity,r))notifyIfNew(activity.getApplicationContext(),r);
            MAIN.post(()->{if(!activity.isFinishing()&&!activity.isDestroyed())
                activity.onGithubUpdateLoaded(r);});
        });
    }
    private static boolean metadataHost(String host) {
        return "api.github.com".equals(host);
    }
    private static boolean assetHost(String host) {
        return "github.com".equals(host)||
            "release-assets.githubusercontent.com".equals(host)||
            "objects.githubusercontent.com".equals(host);
    }
    private static HttpsURLConnection open(String address,boolean asset) throws Exception {
        URL u=new URL(address);
        for(int n=0;n<5;n++){
            if(!"https".equalsIgnoreCase(u.getProtocol())||
                !(asset?assetHost(u.getHost()):metadataHost(u.getHost()))||
                u.getUserInfo()!=null||u.getPort()!=-1)throw new SecurityException("Untrusted update endpoint");
            HttpsURLConnection c=(HttpsURLConnection)u.openConnection();
            c.setInstanceFollowRedirects(false);c.setConnectTimeout(6500);c.setReadTimeout(10000);
            c.setRequestProperty("User-Agent","PokeSearch-Android-Updater");
            c.setRequestProperty("Accept",asset?"application/octet-stream":"application/vnd.github+json");
            int code=c.getResponseCode();
            if(code>=300&&code<400){
                String location=c.getHeaderField("Location");c.disconnect();
                if(location==null||location.length()>4096)throw new SecurityException("Invalid redirect");
                u=new URL(u,location);continue;
            }
            if(code!=200){c.disconnect();throw new IllegalStateException("No approved update");}
            return c;
        }
        throw new SecurityException("Too many redirects");
    }
    private static String readMetadata(HttpsURLConnection c) throws Exception {
        try(InputStream in=c.getInputStream();java.io.ByteArrayOutputStream out=new java.io.ByteArrayOutputStream()){
            byte[] buf=new byte[4096];int n;
            while((n=in.read(buf))!=-1){if(out.size()+n>MAX_META)throw new SecurityException("Metadata too large");out.write(buf,0,n);}
            return out.toString(StandardCharsets.UTF_8.name());
        }finally{c.disconnect();}
    }
    /** A Release created by an unauthorized push or Draft is never eligible. */
    static Release parse(String json) {
        try{
            JSONObject doc=new JSONObject(json);
            if(doc.optBoolean("draft",true)||doc.optBoolean("prerelease",true)||
               !doc.has("published_at")||doc.isNull("published_at"))return null;
            java.util.regex.Matcher tag=java.util.regex.Pattern
                .compile("^v(0\\.\\d{2}\\.\\d{2,})-(\\d{5,10})$")
                .matcher(doc.optString("tag_name",""));
            if(!tag.matches())return null;
            String name=tag.group(1);long parsed=Long.parseLong(tag.group(2));
            if(parsed<1||parsed>Integer.MAX_VALUE)return null;
            int code=(int)parsed;
            String wanted="PokeSearch-v"+name+"-LT.apk";
            JSONArray assets=doc.optJSONArray("assets");
            if(assets==null||assets.length()>100)return null;
            for(int i=0;i<assets.length();i++){
                JSONObject a=assets.optJSONObject(i);if(a==null)continue;
                if(!wanted.equals(a.optString("name"))||!"uploaded".equals(a.optString("state")))continue;
                String url=a.optString("browser_download_url","");
                if(!url.startsWith(ASSET_PREFIX)||!url.endsWith("/"+wanted)||
                    url.contains("?")||url.contains("#"))return null;
                String digest=a.optString("digest","").toLowerCase(Locale.US);
                if(!digest.matches("sha256:[a-f0-9]{64}"))return null;
                long size=a.optLong("size",0L);
                if(size<10_000L||size>MAX_APK)return null;
                String notes=doc.optString("body","").replaceAll("[\\p{Cntrl}&&[^\\n]]"," ");
                notes=notes.length()>160?notes.substring(0,160):notes;
                return new Release(code,name,wanted,url,digest.substring(7),size,notes);
            }
        }catch(Exception ignored){}
        return null;
    }
    private static Release checkRemote(){
        try{
            // GitHub API (TLS) supplies version/tag/size/SHA-256 digest. Final
            // installed identity is independently pinned to the APK signature.
            return parse(readMetadata(open(API,false)));
        }catch(Exception ignored){return null;}
    }
    private static void notifyIfNew(Context c,Release r){
        if(!alertsEnabled(c)||!eligible(c,r))return;
        if(Build.VERSION.SDK_INT>=33&&c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=
            PackageManager.PERMISSION_GRANTED)return;
        android.content.SharedPreferences prefs=c.getSharedPreferences(PREFS,0);
        if(prefs.getInt("githubUpdateLastNotified",-1)==r.versionCode||
           prefs.getInt("githubUpdateLaterCode",-1)==r.versionCode)return;
        try{
            NotificationManager manager=(NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE);
            if(manager==null)return;
            if(Build.VERSION.SDK_INT>=26){
                NotificationChannel ch=new NotificationChannel(CHANNEL,"PokeSearch — Atualizações",
                    NotificationManager.IMPORTANCE_DEFAULT);
                manager.createNotificationChannel(ch);
            }
            Intent launch=new Intent(c,MainActivity.class);
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent pending=PendingIntent.getActivity(c,10031,launch,
                PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
            android.app.Notification note=new android.app.Notification.Builder(c,CHANNEL)
                .setSmallIcon(android.R.drawable.stat_sys_download_done)
                .setContentTitle("PokeSearch — nova versão disponível")
                .setContentText("Versão "+r.versionName+" pronta para baixar")
                .setAutoCancel(true).setContentIntent(pending).build();
            manager.notify(10031,note);
            prefs.edit().putInt("githubUpdateLastNotified",r.versionCode).apply();
        }catch(RuntimeException ignored){}
    }
    private interface Progress {void report(int value,String detail,File verified);}
    private static void download(Context context,Release release,AtomicBoolean cancel,Progress cb){
        if(!DOWNLOADING.compareAndSet(false,true)){MAIN.post(()->cb.report(-1,"Download já iniciado",null));return;}
        IO.execute(()->{
            File file=null,tmp=null;
            try{
                File folder=new File(context.getCacheDir(),"updates");
                if(!folder.exists()&&!folder.mkdirs())throw new IllegalStateException("Storage unavailable");
                file=new File(folder,"pokesearch-"+release.versionCode+".apk");
                tmp=new File(folder,"pokesearch-"+release.versionCode+".partial");
                // Revalidate even if a file was cached by a former run.
                if(file.exists()&&validPackage(context,file,release)){
                    File done=file;MAIN.post(()->cb.report(100,"Arquivo verificado",done));return;
                }
                if(file.exists())file.delete();
                MessageDigest digest=MessageDigest.getInstance("SHA-256");
                HttpsURLConnection http=open(release.url,true);
                long total=0;long lastUpdate=0;
                try(InputStream in=http.getInputStream();FileOutputStream out=new FileOutputStream(tmp)){
                    byte[] buffer=new byte[8192];int n;
                    while((n=in.read(buffer))!=-1){
                        if(cancel.get())throw new InterruptedException("Cancelled");
                        total+=n;if(total>MAX_APK||total>release.size)throw new SecurityException("Invalid APK size");
                        out.write(buffer,0,n);digest.update(buffer,0,n);
                        long now=android.os.SystemClock.elapsedRealtime();
                        if(now-lastUpdate>250){
                            lastUpdate=now;int percentage=(int)Math.min(99,total*100/release.size);
                            MAIN.post(()->cb.report(percentage,"Baixando atualização",null));
                        }
                    }
                    out.getFD().sync();
                }finally{http.disconnect();}
                if(cancel.get())throw new InterruptedException("Cancelled");
                String actual=hex(digest.digest());
                if(total!=release.size||!actual.equals(release.sha256)||
                    !validPackage(context,tmp,release))throw new SecurityException("APK failed integrity verification");
                if(!tmp.renameTo(file))throw new IllegalStateException("Could not finalize download");
                File done=file;
                MAIN.post(()->cb.report(100,"APK verificado",done));
            }catch(InterruptedException e){
                MAIN.post(()->cb.report(-1,"Download cancelado",null));
            }catch(Exception e){
                MAIN.post(()->cb.report(-1,"Não foi possível validar o APK",null));
            }finally{
                if(tmp!=null&&tmp.exists())tmp.delete();
                DOWNLOADING.set(false);
            }
        });
    }
    private static String hex(byte[] raw) {
        StringBuilder s=new StringBuilder();for(byte b:raw)s.append(String.format(Locale.US,"%02x",b&255));return s.toString();
    }
    private static boolean validPackage(Context c,File file,Release r){
        try{
            PackageManager pm=c.getPackageManager();
            int flags=Build.VERSION.SDK_INT>=28?
                PackageManager.GET_SIGNING_CERTIFICATES:PackageManager.GET_SIGNATURES;
            PackageInfo p=pm.getPackageArchiveInfo(file.getAbsolutePath(),flags);
            if(p==null||!c.getPackageName().equals(p.packageName))return false;
            long code=Build.VERSION.SDK_INT>=28?p.getLongVersionCode():p.versionCode;
            if(code!=r.versionCode||code<=BuildConfig.VERSION_CODE)return false;
            if(p.applicationInfo!=null&&(p.applicationInfo.flags&
                android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE)!=0)return false;
            Signature[] signers=Build.VERSION.SDK_INT>=28?
                p.signingInfo.getApkContentsSigners():p.signatures;
            if(signers==null||signers.length!=1)return false;
            MessageDigest sha=MessageDigest.getInstance("SHA-256");
            return CERT.equals(hex(sha.digest(signers[0].toByteArray())));
        }catch(Exception ignored){return false;}
    }
    public static void install(Activity activity,File apk){
        if(apk==null||!apk.isFile())return;
        try{
            if(Build.VERSION.SDK_INT>=26&&!activity.getPackageManager().canRequestPackageInstalls()){
                Intent manage=new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:"+activity.getPackageName()));
                activity.startActivity(manage);return;
            }
            Uri content=FileProvider.getUriForFile(activity,
                activity.getPackageName()+".updates",apk);
            Intent install=new Intent(Intent.ACTION_VIEW);
            install.setDataAndType(content,"application/vnd.android.package-archive");
            install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            activity.startActivity(install);
        }catch(Exception ignored){
            android.widget.Toast.makeText(activity,"Instalação não disponível neste aparelho",android.widget.Toast.LENGTH_LONG).show();
        }
    }
    public static void showDialog(MainActivity activity,Release release){
        if(!eligible(activity,release))return;
        final AtomicBoolean cancelled=new AtomicBoolean(false);
        final LinearLayout layout=new LinearLayout(activity);layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(32,16,32,8);
        final TextView info=new TextView(activity);
        info.setText("Versão "+release.versionName+"\\n"+
            (release.notes.isEmpty()?"Correções e melhorias.":release.notes));
        final ProgressBar bar=new ProgressBar(activity,null,android.R.attr.progressBarStyleHorizontal);
        bar.setMax(100);bar.setProgress(0);bar.setVisibility(android.view.View.GONE);
        layout.addView(info);layout.addView(bar);
        AlertDialog dialog=new AlertDialog.Builder(activity)
            .setTitle("PokeSearch — atualização")
            .setView(layout).setNegativeButton("Depois",(d,w)->later(activity,release.versionCode))
            .setNeutralButton("Ignorar versão",(d,w)->ignore(activity,release.versionCode))
            .setPositiveButton("Baixar atualização",null).create();
        dialog.setOnDismissListener(d->cancelled.set(true));
        dialog.setOnShowListener(v->dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(click->{
            android.widget.Button button=dialog.getButton(AlertDialog.BUTTON_POSITIVE);
            button.setEnabled(false);bar.setVisibility(android.view.View.VISIBLE);
            download(activity.getApplicationContext(),release,cancelled,(percent,msg,apk)->{
                if(activity.isFinishing()||activity.isDestroyed())return;
                info.setText(msg+(percent>=0?" — "+percent+"%":""));
                if(percent>=0)bar.setProgress(percent);
                if(apk!=null){
                    button.setText("Instalar atualização");button.setEnabled(true);
                    button.setOnClickListener(v2->install(activity,apk));
                }else if(percent<0){button.setText("Tentar novamente");button.setEnabled(true);
                    button.setOnClickListener(v3->{
                        // Restart through a fresh dialog to avoid reusing a canceled task.
                        dialog.dismiss();showDialog(activity,release);
                    });
                }
            });
        }));
        dialog.show();
    }
}

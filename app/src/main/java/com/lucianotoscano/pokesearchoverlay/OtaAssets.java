package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.webkit.WebResourceResponse;
import androidx.webkit.WebViewAssetLoader;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.Base64;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import javax.net.ssl.HttpsURLConnection;

/**
 * LT173 signed resource OTA. Never loads an unsigned HTML/JS file into Native WebViews.
 * The same permanent APK signer must sign manifest.json (raw bytes); every resource
 * is independently SHA-256 checked. Assets activate together at the next app process.
 * No APK code, permissions, cookies, profile data, or Firebase keys are patched.
 */
final class OtaAssets {
    static final String ORIGIN="https://appassets.androidplatform.net";
    private static final String PREFIX=ORIGIN+"/assets/";
    private static final String CHANNEL="https://raw.githubusercontent.com/LucianoToscano/PokeSearch/main/ota/channel.json";
    private static final String ASSET_BASE="https://github.com/LucianoToscano/PokeSearch/releases/download/ota-";
    private static final String SCHEMA="pokesearch-signed-assets-v1";
    private static final int MIN_OTA_APK=54378;
    private static final int MAX_META=32768;
    private static final int MAX_FILE=3*1024*1024;
    private static final int MAX_PACK=8*1024*1024;
    private static final Set<String> PATCHABLE;
    private static final int MAX_FILES=64;
    static {
        Set<String> paths=new HashSet<>();
        Collections.addAll(paths,
            "dock.html","detail.html","sprite_offline.js","sprite_visual_scale.js",
            "visual_editor.js","pokemon_card_presentation.js","pvpoke-overall-ranks.js",
            "pvpoke-iv-gamemaster.js","probe.js","release_notes.json","pokemon_catalog.json");
        PATCHABLE=Collections.unmodifiableSet(paths);
    }
    private static final ExecutorService IO=Executors.newSingleThreadExecutor();
    private static final AtomicBoolean CHECKING=new AtomicBoolean(false);
    private static volatile boolean loaded;
    private static volatile Map<String,File> active=Collections.emptyMap();
    private OtaAssets() {}

    static String webUrl(String asset){ return PREFIX+asset; }
    private static boolean patchable(String name){
        return PATCHABLE.contains(name)||name.matches(
            "(?:pokemon-sprites/(?:base|shiny|forms|costumes)|result-icons/(?:base|modes)|weather-icons(?:/v2)?)/[A-Za-z0-9_.-]{1,150}\\.png");
    }
    private static String releaseAsset(String name){
        return name.indexOf('/')<0?name:
            Base64.getUrlEncoder().withoutPadding().encodeToString(
                name.getBytes(StandardCharsets.UTF_8))+".asset";
    }

    /** Do not start OTA during an unsigned local debug build or older LT172. */
    private static boolean enabled(){
        return BuildConfig.VERSION_CODE>=MIN_OTA_APK &&
            BuildConfig.EXPECTED_SIGNING_CERT_SHA256!=null &&
            BuildConfig.EXPECTED_SIGNING_CERT_SHA256.matches("[0-9a-f]{64}");
    }
    static void checkAsync(Context context){
        if(!enabled()||!CHECKING.compareAndSet(false,true))return;
        Context app=context.getApplicationContext();
        IO.execute(()->{
            try{check(app);}catch(Exception ignored){
                // Offline/invalid updates leave installed assets untouched.
            }finally{CHECKING.set(false);}
        });
    }
    static WebViewAssetLoader loader(Context context){
        Context app=context.getApplicationContext();
        return new WebViewAssetLoader.Builder()
            .setDomain("appassets.androidplatform.net")
            .addPathHandler("/assets/",path->response(app,path))
            .build();
    }
    static WebResourceResponse intercept(Context c,WebViewAssetLoader loader,Uri uri){
        WebResourceResponse local=loader.shouldInterceptRequest(uri);
        return local!=null?local:VerifiedSpriteCache.fromDisk(c,uri);
    }
    private static WebResourceResponse response(Context c,String path){
        if(path==null||path.startsWith("/")||path.contains("..")||
            !path.matches("[A-Za-z0-9_./-]{1,180}"))return null;
        try{
            String mime=path.endsWith(".html")?"text/html":
                path.endsWith(".js")?"application/javascript":
                path.endsWith(".json")?"application/json":
                path.endsWith(".css")?"text/css":
                path.endsWith(".png")?"image/png":
                path.endsWith(".svg")?"image/svg+xml":
                path.endsWith(".webp")?"image/webp":"application/octet-stream";
            InputStream content=open(c,path);
            // Preserve signed source bytes and legacy test contracts. In the
            // protected HTTPS origin only, translate packaged Android asset
            // URLs to this very same local asset loader. Without this, Chromium
            // blocks file:// sprites requested by an https:// page.
            if(path.endsWith(".html")||path.endsWith(".js")){
                byte[] original=read(content,MAX_FILE);
                String translated=new String(original,StandardCharsets.UTF_8)
                    .replace("file:///android_asset/",PREFIX);
                return new WebResourceResponse(mime,"UTF-8",
                    new ByteArrayInputStream(translated.getBytes(StandardCharsets.UTF_8)));
            }
            return new WebResourceResponse(mime,
                mime.startsWith("image/")?null:"UTF-8",content);
        }catch(Exception ignored){return null;}
    }
    static InputStream open(Context c,String name)throws java.io.IOException{
        ensureLoaded(c);
        File candidate=active.get(name);
        if(candidate!=null){
            try{return new FileInputStream(candidate);}
            catch(java.io.IOException ignored){}
        }
        return c.getAssets().open(name);
    }
    private static synchronized void ensureLoaded(Context c){
        if(loaded)return;
        loaded=true;
        if(!enabled())return;
        try{
            File root=new File(c.getFilesDir(),"ota-packs");
            android.content.SharedPreferences p=c.getSharedPreferences("ota-packs",0);
            int wanted=p.getInt("active",0);
            Map<String,File> verified=verifyStored(c,new File(root,"pack-"+wanted),wanted);
            if(verified==null){
                int previous=p.getInt("previous",0);
                verified=verifyStored(c,new File(root,"pack-"+previous),previous);
                if(verified!=null)p.edit().putInt("active",previous).commit();
            }
            if(verified!=null)active=Collections.unmodifiableMap(verified);
        }catch(Exception ignored){}
    }
    private static Map<String,File> verifyStored(Context c,File dir,int version){
        if(version<=0||!dir.isDirectory())return null;
        try{
            byte[] manifest=readFile(new File(dir,"manifest.json"),MAX_META);
            byte[] signature=readFile(new File(dir,"manifest.sig"),1024);
            if(!verifySignature(c,manifest,signature))return null;
            JSONObject data=new JSONObject(new String(manifest,StandardCharsets.UTF_8));
            Map<String,File> files=parseFiles(data,version);
            if(files==null)return null;
            Map<String,File> resolved=new HashMap<>();
            JSONArray list=data.getJSONArray("files");
            for(int i=0;i<list.length();i++){
                JSONObject item=list.getJSONObject(i);
                String name=item.getString("path");
                File f=new File(dir,name);
                if(!f.isFile()||f.length()!=item.getInt("size")||
                   !sha256(f).equals(item.getString("sha256")))return null;
                resolved.put(name,f);
            }
            return resolved;
        }catch(Exception ignored){return null;}
    }
    // Manifest contains a cumulative snapshot of overridden assets. Unlisted
    // assets always come from the signed installed APK.
    private static Map<String,File> parseFiles(JSONObject o,int version)throws Exception{
        if(!SCHEMA.equals(o.getString("schema"))||o.getInt("packVersion")!=version||
            o.getInt("minAppVersionCode")>BuildConfig.VERSION_CODE||
            o.optInt("maxAppVersionCode",Integer.MAX_VALUE)<BuildConfig.VERSION_CODE)
            return null;
        JSONArray a=o.getJSONArray("files");
        if(a.length()<1||a.length()>MAX_FILES)return null;
        Set<String> names=new HashSet<>();
        int sum=0;
        Map<String,File> result=new HashMap<>();
        for(int i=0;i<a.length();i++){
            JSONObject f=a.getJSONObject(i);
            String name=f.getString("path");
            int size=f.getInt("size");
            String hash=f.getString("sha256");
            if(!patchable(name)||!names.add(name)||size<1||size>MAX_FILE||
                !hash.matches("[a-f0-9]{64}"))return null;
            sum+=size;if(sum>MAX_PACK)return null;
            result.put(name,null);
        }
        return result;
    }
    private static boolean verifySignature(Context c,byte[] manifest,byte[] signature){
        if(!enabled())return false;
        try{
            int flags=Build.VERSION.SDK_INT>=28?PackageManager.GET_SIGNING_CERTIFICATES:
                PackageManager.GET_SIGNATURES;
            PackageInfo info=c.getPackageManager().getPackageInfo(c.getPackageName(),flags);
            Signature[] signers=Build.VERSION.SDK_INT>=28?
                info.signingInfo.getApkContentsSigners():info.signatures;
            if(signers==null||signers.length!=1)return false;
            byte[] certBytes=signers[0].toByteArray();
            String actual=hex(MessageDigest.getInstance("SHA-256").digest(certBytes));
            if(!BuildConfig.EXPECTED_SIGNING_CERT_SHA256.equals(actual))return false;
            X509Certificate certificate=(X509Certificate)CertificateFactory.getInstance("X.509")
                .generateCertificate(new ByteArrayInputStream(certBytes));
            PublicKey key=certificate.getPublicKey();
            String algorithm="RSA".equalsIgnoreCase(key.getAlgorithm())?
                "SHA256withRSA":"EC".equalsIgnoreCase(key.getAlgorithm())?
                "SHA256withECDSA":null;
            if(algorithm==null)return false;
            java.security.Signature verifier=java.security.Signature.getInstance(algorithm);
            verifier.initVerify(key);verifier.update(manifest);
            byte[] raw=Base64.getDecoder().decode(
                new String(signature,StandardCharsets.US_ASCII).trim());
            return verifier.verify(raw);
        }catch(Exception ignored){return false;}
    }
    private static void check(Context c)throws Exception{
        ensureLoaded(c);
        JSONObject pointer=new JSONObject(new String(download(CHANNEL,MAX_META),
            StandardCharsets.UTF_8));
        int version=pointer.getInt("packVersion");
        if(version<=0)return;
        int current=c.getSharedPreferences("ota-packs",0).getInt("active",0);
        if(version<=current)return;
        String remote=ASSET_BASE+version+"/";
        byte[] manifest=download(remote+"manifest.json",MAX_META);
        byte[] sig=download(remote+"manifest.sig",1024);
        if(!verifySignature(c,manifest,sig))return;
        JSONObject data=new JSONObject(new String(manifest,StandardCharsets.UTF_8));
        Map<String,File> selected=parseFiles(data,version);
        if(selected==null)return;
        File root=new File(c.getFilesDir(),"ota-packs");
        if(!root.isDirectory()&&!root.mkdirs())return;
        File staging=new File(root,"stage-"+version);
        if(staging.exists())removeTree(staging);
        if(!staging.mkdir())return;
        try{
            write(new File(staging,"manifest.json"),manifest);
            write(new File(staging,"manifest.sig"),sig);
            JSONArray list=data.getJSONArray("files");
            for(int i=0;i<list.length();i++){
                JSONObject item=list.getJSONObject(i);
                String name=item.getString("path"),hash=item.getString("sha256");
                int size=item.getInt("size");
                byte[] bytes=null;
                File old=active.get(name);
                if(old!=null&&old.length()==size&&sha256(old).equals(hash))
                    bytes=readFile(old,MAX_FILE);
                if(bytes==null)bytes=download(remote+releaseAsset(name),MAX_FILE);
                if(bytes.length!=size||
                    !hex(MessageDigest.getInstance("SHA-256").digest(bytes)).equals(hash))
                    throw new SecurityException("Asset hash mismatch");
                write(new File(staging,name),bytes);
            }
            File target=new File(root,"pack-"+version);
            if(target.exists())removeTree(target);
            if(!staging.renameTo(target))throw new java.io.IOException("Atomic pack rename failed");
            // Do not hot-swap live WebViews or probe scripts midway through a session.
            // The verified pack activates together on the next application process.
            c.getSharedPreferences("ota-packs",0).edit()
                .putInt("previous",current).putInt("active",version).commit();
        }finally{if(staging.exists())removeTree(staging);}
    }
    private static void removeTree(File f){
        if(f.isDirectory()){
            File[] items=f.listFiles();
            if(items!=null)for(File child:items)removeTree(child);
        }
        f.delete();
    }
    private static void write(File f,byte[] bytes)throws Exception{
        File parent=f.getParentFile();
        if(parent!=null&&!parent.isDirectory()&&!parent.mkdirs())
            throw new java.io.IOException("Could not create resource directory");
        try(FileOutputStream out=new FileOutputStream(f)){
            out.write(bytes);out.getFD().sync();
        }
    }
    private static byte[] readFile(File f,int max)throws Exception{
        try(InputStream in=new FileInputStream(f)){return read(in,max);}
    }
    private static byte[] read(InputStream in,int max)throws Exception{
        try(ByteArrayOutputStream out=new ByteArrayOutputStream()){
            byte[] buffer=new byte[8192];int n;
            while((n=in.read(buffer))!=-1){
                if(out.size()+n>max)throw new SecurityException("Oversized response");
                out.write(buffer,0,n);
            }
            return out.toByteArray();
        }
    }
    private static byte[] download(String address,int max)throws Exception{
        URL url=new URL(address);
        for(int redirect=0;redirect<5;redirect++){
            String host=url.getHost();
            if(!"https".equalsIgnoreCase(url.getProtocol())||url.getPort()!=-1||
                url.getUserInfo()!=null||
                !("raw.githubusercontent.com".equals(host)||"github.com".equals(host)||
                  "release-assets.githubusercontent.com".equals(host)||
                  "objects.githubusercontent.com".equals(host)))
                throw new SecurityException("Untrusted OTA URL");
            HttpsURLConnection conn=(HttpsURLConnection)url.openConnection();
            conn.setInstanceFollowRedirects(false);
            conn.setConnectTimeout(6500);conn.setReadTimeout(10000);
            conn.setRequestProperty("User-Agent","PokeSearch-Signed-OTA");
            try{
                int status=conn.getResponseCode();
                if(status>=300&&status<400){
                    String next=conn.getHeaderField("Location");
                    if(next==null||next.length()>4096)throw new SecurityException("Bad redirect");
                    url=new URL(url,next);continue;
                }
                if(status!=200)throw new java.io.IOException("OTA not available");
                return read(conn.getInputStream(),max);
            }finally{conn.disconnect();}
        }
        throw new SecurityException("Excessive redirects");
    }
    private static String sha256(File file)throws Exception{
        MessageDigest digest=MessageDigest.getInstance("SHA-256");
        try(InputStream in=new FileInputStream(file)){
            byte[] buf=new byte[8192];int n;
            while((n=in.read(buf))!=-1)digest.update(buf,0,n);
        }
        return hex(digest.digest());
    }
    private static String hex(byte[] bytes){
        StringBuilder b=new StringBuilder();
        for(byte x:bytes)b.append(String.format(java.util.Locale.US,"%02x",x&0xff));
        return b.toString();
    }
}

package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.Manifest;
import android.content.Context;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import androidx.core.content.FileProvider;
import androidx.work.Constraints;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import java.util.concurrent.TimeUnit;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import javax.net.ssl.HttpsURLConnection;

/** Preview-only OTA console. No auth tokens or production certificate material. */
public final class FastDevConsoleActivity extends Activity {
    private static final String API =
        "https://api.github.com/repos/LucianoToscano/PokeSearch/releases?per_page=30";
    private static final String DOWNLOAD =
        "https://github.com/LucianoToscano/PokeSearch/releases/download/fastdev-";
    private static final String ASSET = "PokeSearch-FastDev-Preview.apk";
    private static final long MAX_APK = 180_000_000L;
    private static final String CHANNEL="fastdev-preview-updates";
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private final Handler main=new Handler(Looper.getMainLooper());
    private TextView status;
    private volatile boolean busy=false;
    private volatile Preview available;
    private static final class Preview {
        final int code; final String url,sha;
        final long size;
        Preview(int code,String url,String sha,long size) {
            this.code=code;this.url=url;this.sha=sha;this.size=size;
        }
    }
    @Override public void onCreate(Bundle b) {
        super.onCreate(b);
        ScrollView scroll=new ScrollView(this);
        LinearLayout root=new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        int p=(int)(18*getResources().getDisplayMetrics().density);
        root.setPadding(p,p,p,p);
        scroll.addView(root);
        TextView header=new TextView(this);
        header.setText("PokeSearch FastDev");
        header.setTextSize(25);
        root.addView(header);
        status=new TextView(this);
        status.setText("Preview "+BuildConfig.VERSION_NAME+" ("+BuildConfig.VERSION_CODE+
            ")\nAtualizações preservam os dados deste aplicativo.");
        status.setPadding(0,p/2,0,p/2);
        root.addView(status);
        button(root,"Verificar atualização FastDev",v->check());
        button(root,"Instalar atualização encontrada",v->installAvailable());
        button(root,"Live Preview (HTML)",v->
            startActivity(new Intent(this,FastDevLiveActivity.class)));
        button(root,"Abrir o PokeSearch de testes",v->
            startActivity(new Intent(this,MainActivity.class)));
        TextView note=new TextView(this);
        note.setText("\nO APK oficial é separado. Android pode pedir confirmação da instalação. "+
            "A versão FastDev usa somente pré-releases de testes publicados.");
        root.addView(note);
        setContentView(scroll);
        scheduleUpdateChecks();
        check(); // lightweight foreground check; no silent installation
    }
    private void button(LinearLayout root,String text,View.OnClickListener action) {
        Button b=new Button(this);b.setText(text);b.setAllCaps(false);
        root.addView(b);b.setOnClickListener(action);
    }
    private void show(String text) {
        main.post(()->{if(!isFinishing()&&!isDestroyed())status.setText(text);});
    }
    private void check() {
        if(busy)return;
        busy=true;
        show("Consultando o canal FastDev...");
        io.execute(()->{
            try {
                Preview p=latest();
                available=p;
                show(p==null
                  ? "FastDev "+BuildConfig.VERSION_CODE+": nenhuma atualização mais recente."
                  : "Preview "+p.code+" disponível. Toque em Instalar atualização.");
            }catch(Exception error){show("Consulta falhou: "+error.getMessage());}
            finally{busy=false;}
        });
    }
    private static boolean allowedHost(String host) {
        return "github.com".equals(host)||"api.github.com".equals(host)
            ||"release-assets.githubusercontent.com".equals(host)
            ||"objects.githubusercontent.com".equals(host);
    }
    private static HttpsURLConnection open(String address) throws Exception {
        URL url=new URL(address);
        for(int i=0;i<6;i++){
            if(!"https".equalsIgnoreCase(url.getProtocol())||
               !allowedHost(url.getHost())||url.getPort()!=-1||url.getUserInfo()!=null)
                throw new SecurityException("Host HTTPS inválido");
            HttpsURLConnection c=(HttpsURLConnection)url.openConnection();
            c.setInstanceFollowRedirects(false);
            c.setConnectTimeout(10000);c.setReadTimeout(30000);
            c.setRequestProperty("User-Agent","PokeSearch-FastDev");
            c.setRequestProperty("Accept","application/vnd.github+json");
            int response=c.getResponseCode();
            if(response>=300&&response<400){
                String to=c.getHeaderField("Location");c.disconnect();
                if(to==null||to.length()>4096)throw new SecurityException("Redirect inválido");
                url=new URL(url,to);continue;
            }
            if(response!=200){c.disconnect();throw new IllegalStateException("HTTP "+response);}
            return c;
        }
        throw new SecurityException("Redirecionamentos demais");
    }
    private static String readText(HttpsURLConnection c,int max) throws Exception {
        try(InputStream in=c.getInputStream();java.io.ByteArrayOutputStream bytes=
            new java.io.ByteArrayOutputStream()){
            byte[] buf=new byte[8192];int n;
            while((n=in.read(buf))!=-1){
                if(bytes.size()+n>max)throw new SecurityException("Resposta excessiva");
                bytes.write(buf,0,n);
            }
            return bytes.toString(StandardCharsets.UTF_8.name());
        }finally{c.disconnect();}
    }
    private static Preview latest() throws Exception {
        JSONArray all=new JSONArray(readText(open(API),512*1024));
        Preview best=null;
        for(int i=0;i<all.length();i++){
            JSONObject release=all.optJSONObject(i);
            if(release==null||release.optBoolean("draft",true)||
               !release.optBoolean("prerelease",false))continue;
            String tag=release.optString("tag_name","");
            if(!tag.matches("fastdev-[0-9]{7,10}"))continue;
            long number=Long.parseLong(tag.substring(8));
            if(number<=BuildConfig.VERSION_CODE||number>Integer.MAX_VALUE)continue;
            JSONArray assets=release.optJSONArray("assets");
            if(assets==null)continue;
            for(int j=0;j<assets.length();j++){
                JSONObject a=assets.optJSONObject(j);
                if(a==null||!ASSET.equals(a.optString("name")))continue;
                String link=a.optString("browser_download_url","");
                String sha=a.optString("digest","");
                long size=a.optLong("size",-1);
                if(!link.startsWith(DOWNLOAD+number+"/")||
                   !link.endsWith("/"+ASSET)||size<10000||size>MAX_APK||
                   !sha.matches("sha256:[0-9a-fA-F]{64}"))continue;
                if(best==null||best.code<number)best=new Preview((int)number,link,
                    sha.substring(7).toLowerCase(Locale.ROOT),size);
            }
        }
        return best;
    }
    /** Background discovery notifies; Android installer is always user-driven. */
    private void scheduleUpdateChecks() {
        try {
            Constraints constraints=new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED).build();
            PeriodicWorkRequest request=new PeriodicWorkRequest.Builder(
                PollWorker.class,30,TimeUnit.MINUTES).setConstraints(constraints).build();
            WorkManager.getInstance(getApplicationContext()).enqueueUniquePeriodicWork(
                "fastdev-preview-updates",ExistingPeriodicWorkPolicy.KEEP,request);
        }catch(RuntimeException ignored){}
    }
    public static final class PollWorker extends Worker {
        public PollWorker(Context context,WorkerParameters parameters) {
            super(context,parameters);
        }
        @Override public Result doWork() {
            try {
                Preview newer=latest();
                if(newer==null)return Result.success();
                Context ctx=getApplicationContext();
                if(Build.VERSION.SDK_INT>=33 &&
                   ctx.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=
                       PackageManager.PERMISSION_GRANTED)return Result.success();
                NotificationManager manager=(NotificationManager)ctx.getSystemService(
                    Context.NOTIFICATION_SERVICE);
                if(manager==null)return Result.success();
                if(Build.VERSION.SDK_INT>=26)
                    manager.createNotificationChannel(new NotificationChannel(
                        CHANNEL,"FastDev — versões de teste",NotificationManager.IMPORTANCE_DEFAULT));
                Intent open=new Intent(ctx,FastDevConsoleActivity.class);
                int flags=PendingIntent.FLAG_UPDATE_CURRENT;
                if(Build.VERSION.SDK_INT>=23)flags|=PendingIntent.FLAG_IMMUTABLE;
                PendingIntent tap=PendingIntent.getActivity(ctx,0,open,flags);
                Notification.Builder note=Build.VERSION.SDK_INT>=26
                    ?new Notification.Builder(ctx,CHANNEL):new Notification.Builder(ctx);
                note.setSmallIcon(android.R.drawable.stat_sys_download_done)
                    .setContentTitle("Atualização FastDev disponível")
                    .setContentText("Versão "+newer.code+" — toque para atualizar")
                    .setAutoCancel(true).setContentIntent(tap);
                manager.notify(34577,note.build());
                return Result.success();
            }catch(Exception ignored){return Result.retry();}
        }
    }
    private static String digest(byte[] bytes) throws Exception {
        MessageDigest md=MessageDigest.getInstance("SHA-256");md.update(bytes);
        return hex(md.digest());
    }
    private static String hex(byte[] bytes) {
        StringBuilder out=new StringBuilder();
        for(byte b:bytes)out.append(String.format(Locale.ROOT,"%02x",b&0xff));
        return out.toString();
    }
    private static Signature[] signatures(PackageInfo info) {
        if(info==null)return null;
        if(Build.VERSION.SDK_INT>=28 && info.signingInfo!=null)
            return info.signingInfo.getApkContentsSigners();
        return info.signatures;
    }
    private static long version(PackageInfo info) {
        return Build.VERSION.SDK_INT>=28 ? info.getLongVersionCode() : info.versionCode;
    }
    private void validateApk(File apk,Preview preview) throws Exception {
        PackageManager pm=getPackageManager();
        int flags=Build.VERSION.SDK_INT>=28
            ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
        PackageInfo archive=pm.getPackageArchiveInfo(apk.getAbsolutePath(),flags);
        PackageInfo installed=pm.getPackageInfo(getPackageName(),flags);
        if(archive==null||!getPackageName().equals(archive.packageName)||
            version(archive)!=preview.code||
            version(archive)<=version(installed))
            throw new SecurityException("APK não corresponde ao pacote/versão FastDev");
        Signature[] a=signatures(archive), b=signatures(installed);
        if(a==null||b==null||a.length!=1||b.length!=1||
           !digest(a[0].toByteArray()).equals(digest(b[0].toByteArray())))
            throw new SecurityException("Certificado do APK diferente do FastDev instalado");
    }
    private void installAvailable() {
        Preview p=available;
        if(p==null){check();return;}
        if(busy)return;
        if(Build.VERSION.SDK_INT>=26&&!getPackageManager().canRequestPackageInstalls()){
            new AlertDialog.Builder(this).setTitle("Permitir instalação")
                .setMessage("Autorize instalações por este FastDev no Android, "+
                    "depois volte e toque em Instalar atualização.")
                .setPositiveButton("Abrir configurações",(dialog,id)->{
                    Intent intent=new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:"+getPackageName()));
                    startActivity(intent);
                }).setNegativeButton("Cancelar",null).show();
            return;
        }
        busy=true;
        show("Baixando Preview "+p.code+"...");
        io.execute(()->{
            try {
                File directory=new File(getCacheDir(),"updates");
                if(!directory.isDirectory()&&!directory.mkdirs())
                    throw new IllegalStateException("Sem diretório para APK");
                File temp=new File(directory,"fastdev-"+p.code+".partial");
                File apk=new File(directory,"fastdev-"+p.code+".apk");
                MessageDigest md=MessageDigest.getInstance("SHA-256");
                long total=0;
                HttpsURLConnection c=open(p.url);
                try(InputStream in=c.getInputStream();FileOutputStream out=new FileOutputStream(temp)){
                    byte[] buf=new byte[16384];int n;
                    while((n=in.read(buf))!=-1){
                        total+=n;
                        if(total>MAX_APK||total>p.size)
                            throw new SecurityException("APK maior que o declarado");
                        md.update(buf,0,n);out.write(buf,0,n);
                    }
                }finally{c.disconnect();}
                if(total!=p.size||!hex(md.digest()).equals(p.sha))
                    throw new SecurityException("SHA-256 do APK não confere");
                if(!temp.renameTo(apk))throw new IllegalStateException("Falha ao preparar APK");
                validateApk(apk,p);
                main.post(()->{
                    busy=false;
                    if(isFinishing()||isDestroyed())return;
                    try{
                        Uri uri=FileProvider.getUriForFile(this,
                            getPackageName()+".updates",apk);
                        Intent install=new Intent(Intent.ACTION_VIEW);
                        install.setDataAndType(uri,"application/vnd.android.package-archive");
                        install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        startActivity(install);
                        status.setText("Instalador Android aberto para FastDev "+p.code);
                    }catch(Exception e){status.setText("Instalação: "+e.getMessage());}
                });
            }catch(Exception error){
                show("Não foi possível atualizar: "+error.getMessage());
                busy=false;
            }
        });
    }
    @Override protected void onDestroy(){
        io.shutdownNow();
        super.onDestroy();
    }
}

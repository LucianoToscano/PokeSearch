package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Pattern;

/** LT400: catalogue-only APK; copyrighted PNGs fetched to private cache only
 * after a direct user action. Never fetches, shares or uploads PGSStats.
 */
final class PokedexSpriteStore {
    interface Listener { void updated(String statusJson); }
    private static final String PINNED_COMMIT="db10df75d6f6f92018d9786af0aecc4ef";
    private static final String BASE="https://raw.githubusercontent.com/PokeMiners/pogo_assets/";
    private static final String[] PATHS={
        "Images/Pokemon%20-%20256x256/Addressable%20Assets/",
        "Images/Pokemon%20-%20256x256/"
    };
    private static final Pattern SAFE=Pattern.compile("[A-Za-z0-9_.-]{1,150}\\.png");
    private static final Pattern SHA=Pattern.compile("[a-f0-9]{40}");
    private static final long MAX_FILE=4*1024*1024;
    private final Context app;
    private final File dir;
    private final Listener listener;
    private final Map<String,Sprite> catalog=new HashMap<>();
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private final AtomicBoolean cancel=new AtomicBoolean(false);
    private final String manifest;
    private volatile boolean busy=false;
    private volatile int processed=0,totalQueued=0;
    private volatile String error="",mode="";
    private static final class Sprite {
        final String key,name,sha,group;
        final long size;
        Sprite(String prefix,JSONArray x){
            group=prefix;name=x.optString(0,"");key=prefix+":"+name;
            size=x.optLong(1,-1);sha=x.optString(2,"");
        }
        boolean valid(){
            return SAFE.matcher(name).matches()&&size>0&&size<=MAX_FILE&&SHA.matcher(sha).matches();
        }
    }
    PokedexSpriteStore(Context context,Listener callback){
        app=context.getApplicationContext();listener=callback;
        dir=new File(app.getFilesDir(),"pokedex_sprites");
        String s="{}";
        try(InputStream in=app.getAssets().open("pokedex_sprite_manifest.json")){
            ByteArrayOutputStream out=new ByteArrayOutputStream();
            byte[] b=new byte[8192];int n;
            while((n=in.read(b))!=-1){
                if(out.size()>850000-n)throw new IOException("Catálogo demasiado grande");
                out.write(b,0,n);
            }
            s=new String(out.toByteArray(),StandardCharsets.UTF_8);
            JSONObject obj=new JSONObject(s);
            if(!PINNED_COMMIT.equals(obj.optString("commit")))
                throw new IOException("Catálogo de versão não reconhecida");
            read(obj.optJSONArray("files"),"a");
            read(obj.optJSONArray("legacy"),"l");
        }catch(Exception ignored){s="{}";catalog.clear();}
        manifest=s;
    }
    private void read(JSONArray arr,String prefix){
        if(arr==null)return;
        for(int i=0;i<arr.length();i++){
            JSONArray a=arr.optJSONArray(i);if(a==null)continue;
            Sprite item=new Sprite(prefix,a);
            if(item.valid())catalog.put(item.key,item);
        }
    }
    String manifest(){return manifest;}
    private File destination(Sprite file){
        return new File(new File(dir,file.group),file.name);
    }
    private boolean present(Sprite item){
        File stored=destination(item);
        return stored.isFile()&&stored.length()==item.size;
    }
    InputStream openLocal(String group,String filename)throws IOException{
        if(!("a".equals(group)||"l".equals(group))||
           !SAFE.matcher(filename).matches())return null;
        Sprite e=catalog.get(group+":"+filename);
        if(e==null||!present(e))return null;
        return new FileInputStream(destination(e));
    }
    String cachedKeys(){
        JSONArray keys=new JSONArray();
        for(Sprite s:catalog.values())if(present(s))keys.put(s.key);
        return keys.toString();
    }
    String status(){
        int all=0,primary=0,older=0;long bytes=0;
        for(Sprite s:catalog.values()){
            if(!present(s))continue;
            all++;bytes+=s.size;
            if("a".equals(s.group))primary++;else older++;
        }
        JSONObject row=new JSONObject();
        try{
            row.put("total",catalog.size());
            row.put("primaryTotal",count("a"));row.put("legacyTotal",count("l"));
            row.put("downloaded",all);row.put("primaryDownloaded",primary);
            row.put("legacyDownloaded",older);row.put("bytes",bytes);
            row.put("busy",busy);row.put("done",processed);row.put("queued",totalQueued);
            row.put("mode",mode);row.put("error",error);
        }catch(Exception ignored){}
        return row.toString();
    }
    private int count(String group){
        int n=0;for(Sprite s:catalog.values())if(group.equals(s.group))n++;return n;
    }
    void start(String requestedMode,String requestedList){
        if(busy)return;
        if(!("collection".equals(requestedMode)||"all".equals(requestedMode)||
             "legacy".equals(requestedMode)))return;
        final List<Sprite> queue=new ArrayList<>();
        if("collection".equals(requestedMode)){
            try{
                JSONArray keys=new JSONArray(requestedList);
                if(keys.length()>10000)return;
                Set<String> unique=new HashSet<>();
                for(int i=0;i<keys.length();i++){
                    String key=keys.optString(i,"");
                    Sprite item=catalog.get(key);
                    if(item!=null&&unique.add(key))queue.add(item);
                }
            }catch(Exception ignored){return;}
        }else for(Sprite s:catalog.values()){
            if("all".equals(requestedMode)&&"a".equals(s.group)||
               "legacy".equals(requestedMode)&&"l".equals(s.group))
                queue.add(s);
        }
        queue.sort((a,b)->a.key.compareTo(b.key));
        cancel.set(false);busy=true;processed=0;totalQueued=queue.size();
        error="";mode=requestedMode;
        worker.execute(()->{
            try{
                for(Sprite e:queue){
                    if(cancel.get()||Thread.currentThread().isInterrupted())break;
                    if(!present(e))download(e);
                    processed++;
                    if(processed%25==0||processed==queue.size())inform();
                }
            }catch(Exception x){
                error=x.getMessage()==null?"Falha na transferência":
                      x.getMessage().substring(0,Math.min(160,x.getMessage().length()));
            }finally{
                if(cancel.get())error="Download interrompido; imagens completas preservadas.";
                busy=false;inform();
            }
        });
        inform();
    }
    private void download(Sprite asset)throws Exception{
        File target=destination(asset);
        File parent=target.getParentFile();
        if(!parent.isDirectory()&&!parent.mkdirs())
            throw new IOException("Armazenamento de sprites indisponível.");
        File pending=new File(parent,asset.name+".pending");
        HttpURLConnection http=null;
        try{
            URL url=new URL(BASE+PINNED_COMMIT+"/"+PATHS["a".equals(asset.group)?0:1]+asset.name);
            http=(HttpURLConnection)url.openConnection();
            http.setInstanceFollowRedirects(false);
            http.setConnectTimeout(13000);http.setReadTimeout(25000);
            http.setRequestProperty("User-Agent","PokeSearch-private-sprite-cache/1");
            if(http.getResponseCode()!=200)
                throw new IOException("HTTP "+http.getResponseCode()+": "+asset.name);
            long transferred=0;
            try(InputStream input=http.getInputStream();FileOutputStream out=new FileOutputStream(pending)){
                byte[] bytes=new byte[16384];int n;
                while((n=input.read(bytes))!=-1){
                    if(cancel.get()||Thread.currentThread().isInterrupted())
                        throw new IOException("Download cancelado");
                    transferred+=n;
                    if(transferred>asset.size||transferred>MAX_FILE)
                        throw new IOException("Imagem maior que a esperada");
                    out.write(bytes,0,n);
                }
                out.getFD().sync();
            }
            if(transferred!=asset.size||!asset.sha.equals(gitSha(pending,transferred)))
                throw new IOException("Imagem falhou validação de integridade: "+asset.name);
            if(!pending.renameTo(target))
                throw new IOException("Falha ao salvar arquivo: "+asset.name);
        }finally{
            if(http!=null)http.disconnect();
            if(pending.isFile())pending.delete();
        }
    }
    private static String gitSha(File file,long size)throws Exception{
        MessageDigest dig=MessageDigest.getInstance("SHA-1");
        dig.update(("blob "+size).getBytes(StandardCharsets.UTF_8));
        dig.update((byte)0);
        try(InputStream in=new FileInputStream(file)){
            byte[] buf=new byte[16384];int n;
            while((n=in.read(buf))!=-1)dig.update(buf,0,n);
        }
        StringBuilder s=new StringBuilder();
        for(byte b:dig.digest())s.append(String.format(Locale.ROOT,"%02x",b&255));
        return s.toString();
    }
    void cancel(){cancel.set(true);}
    void clear(){
        if(busy)return;
        worker.execute(()->{
            if(busy)return;
            for(Sprite item:catalog.values()){
                File file=destination(item);
                if(file.isFile())file.delete();
            }
            processed=0;error="";inform();
        });
    }
    private void inform(){if(listener!=null)listener.updated(status());}
    void shutdown(){cancel.set(true);worker.shutdownNow();}
}

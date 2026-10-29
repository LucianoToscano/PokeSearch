package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.net.Uri;
import android.webkit.WebResourceResponse;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;
import java.util.HashMap;
import java.util.Locale;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Read-only, app-private sprite bridge shared by the native Favorites picker
 * and the menu/results WebViews. Only exact verified base PokeAPI sprite paths
 * may be downloaded in the WebView background callback. Never guess forms,
 * costumes, tokens or substitute another species. */
final class VerifiedSpriteCache {
    private static final Pattern RAW=Pattern.compile(
        "^https://raw\\.githubusercontent\\.com/PokeAPI/sprites/master/sprites/pokemon/(shiny/)?([0-9]{1,4})\\.png$");
    private static final Pattern MIRROR=Pattern.compile(
        "^https://cdn\\.jsdelivr\\.net/gh/PokeAPI/sprites@master/sprites/pokemon/(shiny/)?([0-9]{1,4})\\.png$");
    private static final Pattern PINNED_FORM=Pattern.compile(
        "^https://raw\\.githubusercontent\\.com/PokeAPI/sprites/d8c2fb78563e28ad7b3abe938cf6e79998d04e90/sprites/pokemon/(shiny/)?(10[0-9]{3})\\.png$");
    private static final String FORM_ORIGIN=
        "https://raw.githubusercontent.com/PokeAPI/sprites/d8c2fb78563e28ad7b3abe938cf6e79998d04e90/sprites/pokemon/";
    // Exact Pokémon GO artwork only. A filename is accepted solely if it
    // exists in the pinned source-tree manifest bundled in the signed APK.
    private static final String GO_COMMIT="c2a686eb08ace6e890d8fe3d2134c76988db87b5";
    private static final String GO_DIR="Images/Pokemon%20-%20256x256/Addressable%20Assets/";
    private static final String GO_RAW="https://raw.githubusercontent.com/PokeMiners/pogo_assets/"+
        GO_COMMIT+"/"+GO_DIR;
    private static final String GO_MIRROR="https://cdn.jsdelivr.net/gh/PokeMiners/pogo_assets@"+
        GO_COMMIT+"/"+GO_DIR;
    private static final Pattern GO_NAME=Pattern.compile(
        "^pm[0-9]{1,4}\\.[fc][A-Z0-9_]+(?:\\.g2)?(?:\\.s)?\\.icon\\.png$");
    private static final Map<String,String> GO_HASHES=new ConcurrentHashMap<>();
    private static final Map<String,Long> GO_FAILURES=new ConcurrentHashMap<>();
    private static volatile boolean goIndexRead;
    private static final Object GO_INDEX_LOCK=new Object();
    private static void loadGOIndex(Context context){
        if(goIndexRead)return;
        synchronized(GO_INDEX_LOCK){
            if(goIndexRead)return;
            try(java.io.BufferedReader lines=new java.io.BufferedReader(
                new java.io.InputStreamReader(context.getAssets().open("go-exact-sprites.tsv"),
                    java.nio.charset.StandardCharsets.UTF_8))){
                String line;int count=0;
                while((line=lines.readLine())!=null&&count<2000){
                    if(line.startsWith("#")||line.isEmpty())continue;
                    String[] pair=line.split("\\t",-1);
                    if(pair.length!=2||!GO_NAME.matcher(pair[0]).matches()||
                        !pair[1].matches("[0-9a-f]{40}"))continue;
                    GO_HASHES.put(pair[0],pair[1]);count++;
                }
            }catch(IOException ignored){}
            goIndexRead=true;
        }
    }
    private static File goDisk(Context context,String name){
        return new File(new File(context.getCacheDir(),"verified-go-form-icons-v1"),name);
    }
    private static boolean matchesBlob(byte[] png,String expected){
        try{
            MessageDigest md=MessageDigest.getInstance("SHA-1");
            md.update(("blob "+png.length).getBytes(java.nio.charset.StandardCharsets.UTF_8));
            md.update((byte)0);
            md.update(png);
            byte[] digest=md.digest();
            StringBuilder actual=new StringBuilder(40);
            for(byte b:digest)actual.append(String.format(Locale.ROOT,"%02x",b&255));
            return actual.toString().equals(expected);
        }catch(NoSuchAlgorithmException ignored){return false;}
    }
    private static WebResourceResponse goCached(Context context,String name,String expected){
        File file=goDisk(context,name);
        if(!validPng(file))return null;
        byte[] data;
        try(FileInputStream in=new FileInputStream(file)){
            ByteArrayOutputStream out=new ByteArrayOutputStream((int)file.length());
            byte[] buffer=new byte[4096];int count;
            while((count=in.read(buffer))!=-1)out.write(buffer,0,count);
            data=out.toByteArray();
        }catch(IOException e){return null;}
        if(!matchesBlob(data,expected)){file.delete();return null;}
        file.setLastModified(System.currentTimeMillis());
        return new WebResourceResponse("image/png",null,new java.io.ByteArrayInputStream(data));
    }
    private static boolean goFetch(Context context,String name,String expected){
        // A request never carries credentials; no endpoint of PoGoCoordinates
        // is queried by the sprite cache. Both URLs use the same pinned commit.
        for(String base:new String[]{GO_RAW,GO_MIRROR}){
            HttpURLConnection conn=null;
            try{
                conn=(HttpURLConnection)new URL(base+name).openConnection();
                conn.setConnectTimeout(2300);conn.setReadTimeout(2300);
                conn.setInstanceFollowRedirects(false);
                if(conn.getResponseCode()!=200||conn.getContentLength()>256*1024)continue;
                String type=conn.getContentType();
                if(type!=null&&!type.toLowerCase(Locale.ROOT).startsWith("image/png"))continue;
                ByteArrayOutputStream buffer=new ByteArrayOutputStream(24000);
                try(InputStream input=conn.getInputStream()){
                    byte[] chunk=new byte[4096];int n;
                    while((n=input.read(chunk))!=-1){
                        if(buffer.size()+n>256*1024){buffer.reset();break;}
                        buffer.write(chunk,0,n);
                    }
                }
                byte[] data=buffer.toByteArray();
                if(data.length<33||data[0]!=(byte)0x89||data[1]!='P'||
                    data[2]!='N'||data[3]!='G'||!matchesBlob(data,expected))continue;
                android.graphics.BitmapFactory.Options opts=
                    new android.graphics.BitmapFactory.Options();
                opts.inJustDecodeBounds=true;
                android.graphics.BitmapFactory.decodeByteArray(data,0,data.length,opts);
                if(opts.outWidth<8||opts.outHeight<8||
                    opts.outWidth>1024||opts.outHeight>1024)continue;
                File file=goDisk(context,name),dir=file.getParentFile();
                if(dir==null||!(dir.isDirectory()||dir.mkdirs()))continue;
                File tmp=new File(dir,name+".tmp");
                try(FileOutputStream output=new FileOutputStream(tmp)){
                    output.write(data);output.flush();
                }
                if(!tmp.renameTo(file)){tmp.delete();continue;}
                File[] cached=dir.listFiles((d,n)->n.endsWith(".png"));
                if(cached!=null&&cached.length>160){
                    java.util.Arrays.sort(cached,(a,b)->Long.compare(a.lastModified(),b.lastModified()));
                    for(int i=0;i<cached.length-128;i++)cached[i].delete();
                }
                return true;
            }catch(IOException ignored){}
            finally{if(conn!=null)conn.disconnect();}
        }
        return false;
    }
    private static WebResourceResponse goResponse(Context context,String url){
        final String name;
        if(url.startsWith(GO_RAW))name=url.substring(GO_RAW.length());
        else if(url.startsWith(GO_MIRROR))name=url.substring(GO_MIRROR.length());
        else return null;
        if(!GO_NAME.matcher(name).matches())return null;
        loadGOIndex(context);
        String expected=GO_HASHES.get(name);
        if(expected==null)return null;
        WebResourceResponse available=goCached(context,name,expected);
        if(available!=null)return available;
        long now=System.currentTimeMillis();
        Long last=GO_FAILURES.get(name);
        if(last!=null&&now-last<60000L)return null;
        synchronized(STRIPES[(name.hashCode()&Integer.MAX_VALUE)%STRIPES.length]){
            available=goCached(context,name,expected);
            if(available!=null)return available;
            if(!goFetch(context,name,expected)){
                GO_FAILURES.put(name,now);
                if(GO_FAILURES.size()>256)GO_FAILURES.clear();
                return null; // WebView can continue ordinary image loading
            }
            GO_FAILURES.remove(name);
            return goCached(context,name,expected);
        }
    }
    private static final Object[] STRIPES=new Object[32];
    private static final Map<Integer,Long> FAILURES=new ConcurrentHashMap<>();
    static{
        for(int i=0;i<STRIPES.length;i++)STRIPES[i]=new Object();
    }
    private VerifiedSpriteCache(){}
    private static File verifiedDisk(Context context,int dex,boolean shiny){
        return new File(new File(context.getCacheDir(),"verified-base-sprites-v1"),(shiny?"shiny-":"")+dex+".png");
    }
    private static boolean validPng(File f){
        if(!f.isFile()||f.length()<8||f.length()>256*1024)return false;
        try(FileInputStream in=new FileInputStream(f)){
            return in.read()==0x89&&in.read()=='P'&&in.read()=='N'&&in.read()=='G';
        }catch(IOException e){return false;}
    }
    /** First choice: exact verified sprite packaged into the APK at build time.
     * This remains available even after Android clears disk cache and with no network.
     * Never map a costume, variant or unknown species to this base image. */
    static InputStream bundledSprite(Context context,int dex,boolean shiny){
        if(context==null||dex<1||dex>1025)return null;
        try{
            return context.getAssets().open(
                "pokemon-sprites/"+(shiny?"shiny/":"base/")+dex+".png");
        }catch(IOException ignored){return null;}
    }
    private static WebResourceResponse bundledResponse(Context context,int dex,boolean shiny){
        InputStream sprite=bundledSprite(context,dex,shiny);
        return sprite==null?null:new WebResourceResponse("image/png",null,sprite);
    }

    private static WebResourceResponse cached(Context context,int dex,boolean shiny){
        File f=verifiedDisk(context,dex,shiny);
        if(!validPng(f))return null;
        try{return new WebResourceResponse("image/png",null,new FileInputStream(f));}
        catch(IOException ignored){return null;}
    }
    private static boolean prefetch(Context context,int dex,boolean shiny,String suffix,boolean form){
        final String[] urls=form?
            new String[]{FORM_ORIGIN+suffix}:
            new String[]{
                "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+suffix,
                "https://cdn.jsdelivr.net/gh/PokeAPI/sprites@master/sprites/pokemon/"+suffix
            };
        for(String url:urls){
            HttpURLConnection conn=null;
            try{
                conn=(HttpURLConnection)new URL(url).openConnection();
                conn.setConnectTimeout(2200);conn.setReadTimeout(2200);
                conn.setInstanceFollowRedirects(false);
                if(conn.getResponseCode()!=200)continue;
                String contentType=conn.getContentType();
                if(contentType!=null&&!contentType.toLowerCase(java.util.Locale.ROOT).startsWith("image/png"))continue;
                if(conn.getContentLength()>256*1024)continue;
                ByteArrayOutputStream bytes=new ByteArrayOutputStream(15000);
                try(InputStream input=conn.getInputStream()){
                    byte[] data=new byte[4096];int n;
                    while((n=input.read(data))!=-1){
                        if(bytes.size()+n>256*1024){bytes.reset();break;}
                        bytes.write(data,0,n);
                    }
                }
                byte[] png=bytes.toByteArray();
                if(png.length<8||png[0]!=(byte)0x89||png[1]!='P'||
                   png[2]!='N'||png[3]!='G')continue;
                android.graphics.BitmapFactory.Options bounds=
                    new android.graphics.BitmapFactory.Options();
                bounds.inJustDecodeBounds=true;
                android.graphics.BitmapFactory.decodeByteArray(png,0,png.length,bounds);
                if(bounds.outWidth<8||bounds.outHeight<8||
                   bounds.outWidth>1024||bounds.outHeight>1024)continue;
                File file=verifiedDisk(context,dex,shiny),dir=file.getParentFile();
                if(dir==null||!(dir.isDirectory()||dir.mkdirs()))continue;
                File tmp=new File(dir,(shiny?"shiny-":"")+dex+".tmp");
                try(FileOutputStream output=new FileOutputStream(tmp)){
                    output.write(png);output.flush();
                }
                if(!tmp.renameTo(file)){tmp.delete();continue;}
                // Bounded disk cache, shared with PokemonPicker. LRU eviction.
                File[] cached=dir.listFiles((parent,name)->name.endsWith(".png"));
                if(cached!=null&&cached.length>80){
                    java.util.Arrays.sort(cached,(a,b)->Long.compare(a.lastModified(),b.lastModified()));
                    for(int i=0;i<cached.length-64;i++)cached[i].delete();
                }
                return true;
            }catch(IOException ignored){}
            finally{if(conn!=null)conn.disconnect();}
        }
        return false;
    }
    static WebResourceResponse fromDisk(Context context,Uri requestUrl){
        if(context==null||requestUrl==null)return null;
        String url=requestUrl.toString();
        // Fixed-commit GO icons are fetched and cached with a Git-blob SHA-1
        // from the signed allowlist, so first-load network and subsequent
        // offline reads share exactly the same source artwork.
        if(url.startsWith(GO_RAW)||url.startsWith(GO_MIRROR))
            return goResponse(context,url);
        Matcher raw=RAW.matcher(url),mirror=MIRROR.matcher(url),variety=PINNED_FORM.matcher(url);
        boolean baseRaw=raw.matches(),baseMirror=mirror.matches(),form=variety.matches();
        if(!baseRaw&&!baseMirror&&!form)return null;
        boolean shiny="shiny/".equals(baseRaw?raw.group(1):
            baseMirror?mirror.group(1):variety.group(1));
        String number=baseRaw?raw.group(2):baseMirror?mirror.group(2):variety.group(2);
        int dex;
        try{dex=Integer.parseInt(number);}catch(NumberFormatException ignored){return null;}
        if(dex<1||dex>10000)return null;
        // Offline-first: serve packaged bytes before mutable disk cache/network.
        WebResourceResponse fromBundle=bundledResponse(context,dex,shiny);
        if(fromBundle!=null)return fromBundle;
        WebResourceResponse fromCache=cached(context,dex,shiny);
        if(fromCache!=null)return fromCache;
        int key=shiny?dex+10001:dex;
        Long failedAt=FAILURES.get(key);
        long now=System.currentTimeMillis();
        if(failedAt!=null&&now-failedAt<60000L)return null;
        synchronized(STRIPES[key%STRIPES.length]){
            fromCache=cached(context,dex,shiny);
            if(fromCache!=null)return fromCache;
            // No main-thread I/O: shouldInterceptRequest already runs on a
            // WebView worker. A failed fetch falls back to the WebView's
            // normal network handling and is throttled for 60 seconds.
            boolean ok=prefetch(context,dex,shiny,(shiny?"shiny/":"")+number+".png",form);
            if(!ok){
                FAILURES.put(key,now);
                if(FAILURES.size()>128)FAILURES.clear();
                return null;
            }
            FAILURES.remove(key);
            return cached(context,dex,shiny);
        }
    }
}

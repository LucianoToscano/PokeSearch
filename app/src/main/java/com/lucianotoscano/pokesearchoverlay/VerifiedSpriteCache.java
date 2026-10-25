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
    private static WebResourceResponse cached(Context context,int dex,boolean shiny){
        File f=verifiedDisk(context,dex,shiny);
        if(!validPng(f))return null;
        try{return new WebResourceResponse("image/png",null,new FileInputStream(f));}
        catch(IOException ignored){return null;}
    }
    private static boolean prefetch(Context context,int dex,boolean shiny,String suffix){
        final String[] urls={
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
        Matcher raw=RAW.matcher(url),mirror=MIRROR.matcher(url);
        if(!raw.matches()&&!mirror.matches())return null;
        boolean shiny="shiny/".equals(raw.matches()?raw.group(1):mirror.group(1));
        String number=raw.matches()?raw.group(2):mirror.group(2);
        int dex;
        try{dex=Integer.parseInt(number);}catch(NumberFormatException ignored){return null;}
        if(dex<1||dex>10000)return null;
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
            boolean ok=prefetch(context,dex,shiny,(shiny?"shiny/":"")+number+".png");
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

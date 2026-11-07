package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.util.Locale;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.RejectedExecutionException;
import java.util.function.Consumer;

/**
 * LT293 — Analyze the ALREADY VERIFIED provider sprite without WebView canvas
 * CORS restrictions. This is read-only alpha geometry, never a sprite proxy.
 * Requests contain no cookies, login tokens, coordinates or search parameters
 * added by PokeSearch. HTTPS image hosts are explicitly restricted.
 */
final class VerifiedSpriteGeometry {
    private VerifiedSpriteGeometry(){}

    private static final int MAX_BYTES=384*1024;
    private static final int SIZE=96;
    private static final ThreadPoolExecutor POOL=new ThreadPoolExecutor(
        2,2,30,TimeUnit.SECONDS,new ArrayBlockingQueue<>(24),
        new ThreadPoolExecutor.AbortPolicy());
    private static final class CacheRow{
        final String bounds;
        final long expires;
        CacheRow(String result,long expiry){bounds=result;expires=expiry;}
    }
    private static final Map<String,CacheRow> CACHE=
        new LinkedHashMap<String,CacheRow>(128,0.75f,true){
            @Override protected boolean removeEldestEntry(Map.Entry<String,CacheRow> item){
                return size()>128;
            }
        };

    static boolean allowed(String raw){
        if(raw==null||raw.length()<16||raw.length()>1600||
            raw.indexOf('\n')>=0||raw.indexOf('\r')>=0)return false;
        try{
            URI uri=new URI(raw);
            if(!"https".equalsIgnoreCase(uri.getScheme())||
                uri.getUserInfo()!=null||
                (uri.getPort()!=-1&&uri.getPort()!=443)||
                uri.getFragment()!=null)return false;
            String host=uri.getHost();
            if(host==null)return false;
            host=host.toLowerCase(Locale.ROOT);
            if(host.equals("pogocoordinates.com")||
                host.endsWith(".pogocoordinates.com"))return true;
            return host.equals("raw.githubusercontent.com")||
                host.equals("cdn.jsdelivr.net")||
                host.equals("images.weserv.nl")||
                host.equals("static.wikia.nocookie.net")||
                host.equals("assets.pokemon.com");
        }catch(Exception invalid){return false;}
    }

    /** On a bounded background pool; callback never runs on a WebView thread. */
    static boolean request(Context context,String src,Consumer<String> onResult){
        if(context==null||onResult==null||!allowed(src))return false;
        try{
            POOL.execute(()->{
                String result=null;
                long now=System.currentTimeMillis();
                synchronized(CACHE){
                    CacheRow known=CACHE.get(src);
                    if(known!=null&&known.expires>now)result=known.bounds;
                    else if(known!=null)CACHE.remove(src);
                }
                if(result==null){
                    result=measure(src);
                    // Do not re-fetch images with failed permissions/CORS
                    // on every three-minute refresh. Empty == unavailable.
                    synchronized(CACHE){
                        CACHE.put(src,new CacheRow(result==null?"":result,
                            now+(result==null?60_000L:30*60_000L)));
                    }
                }
                onResult.accept(result==null||result.isEmpty()?null:result);
            });
            return true;
        }catch(RejectedExecutionException busy){return false;}
    }

    private static String measure(String address){
        HttpURLConnection conn=null;
        Bitmap bitmap=null,scaled=null;
        try{
            URL url=new URL(address);
            conn=(HttpURLConnection)url.openConnection();
            conn.setRequestMethod("GET");
            conn.setInstanceFollowRedirects(false);
            conn.setConnectTimeout(2600);
            conn.setReadTimeout(3200);
            conn.setUseCaches(true);
            conn.setRequestProperty("Accept","image/png,image/webp,image/gif,image/jpeg");
            if(conn.getResponseCode()!=HttpURLConnection.HTTP_OK||
               conn.getContentLength()>MAX_BYTES)return null;
            String mime=conn.getContentType();
            if(mime==null||!mime.toLowerCase(Locale.ROOT).startsWith("image/"))
                return null;
            ByteArrayOutputStream bytes=new ByteArrayOutputStream(24000);
            try(InputStream input=conn.getInputStream()){
                byte[] chunk=new byte[4096];int n;
                while((n=input.read(chunk))!=-1){
                    if(bytes.size()+n>MAX_BYTES)return null;
                    bytes.write(chunk,0,n);
                }
            }
            byte[] data=bytes.toByteArray();
            if(data.length<64)return null;
            BitmapFactory.Options opts=new BitmapFactory.Options();
            opts.inJustDecodeBounds=true;
            BitmapFactory.decodeByteArray(data,0,data.length,opts);
            if(opts.outWidth<8||opts.outHeight<8||
                opts.outWidth>2048||opts.outHeight>2048)return null;
            opts.inJustDecodeBounds=false;
            int largest=Math.max(opts.outWidth,opts.outHeight),sample=1;
            while(largest/sample>256)sample*=2;
            opts.inSampleSize=sample;
            bitmap=BitmapFactory.decodeByteArray(data,0,data.length,opts);
            if(bitmap==null)return null;
            final int w=bitmap.getWidth(),h=bitmap.getHeight();
            final int dw=Math.max(1,SIZE*w/Math.max(w,h));
            final int dh=Math.max(1,SIZE*h/Math.max(w,h));
            scaled=Bitmap.createScaledBitmap(bitmap,dw,dh,true);
            int[] rgba=new int[dw*dh];
            scaled.getPixels(rgba,0,dw,0,0,dw,dh);
            int left=SIZE,right=-1,top=SIZE,bottom=-1,count=0;
            final int x0=(SIZE-dw)/2,y0=(SIZE-dh)/2;
            for(int y=0;y<dh;y++)for(int x=0;x<dw;x++){
                if(((rgba[y*dw+x]>>>24)&255)<38)continue;
                final int px=x0+x,py=y0+y;
                left=Math.min(left,px);right=Math.max(right,px);
                top=Math.min(top,py);bottom=Math.max(bottom,py);count++;
            }
            if(count<22||right-left<3||bottom-top<3)return null;
            return "{\"left\":"+left+",\"right\":"+right+
                ",\"top\":"+top+",\"bottom\":"+bottom+"}";
        }catch(Exception blocked){
            return null;
        }finally{
            if(scaled!=null&&scaled!=bitmap)scaled.recycle();
            if(bitmap!=null)bitmap.recycle();
            if(conn!=null)conn.disconnect();
        }
    }
}

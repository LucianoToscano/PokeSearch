package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.LruCache;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * As dez artes fornecidas pelo proprietário em 512×512, sem downscale,
 * recriação ou recompressão: Normal/Hover; P1 e P2 também Ativo/Ativo_Hover.
 * ZIPs ZIP_STORED divididos apenas para distribuição no repositório.
 * Todas as funções antigas da Home continuam independentes dos desenhos.
 */
final class HomeMenuIconPack {
    private static boolean loaded=false;
    private static final Map<String,byte[]> originals=new HashMap<>();
    private static final LruCache<String,Bitmap> cache=
        new LruCache<String,Bitmap>(18*1024*1024){
            @Override protected int sizeOf(String key,Bitmap value){
                return value==null?0:value.getByteCount();
            }
        };
    private HomeMenuIconPack(){}

    static synchronized Bitmap image(Context context,int number,String state){
        if(number<1||number>10)return null;
        String variant="normal";
        if("hover".equals(state)||"ativo".equals(state)||
            "ativo_hover".equals(state))variant=state;
        String key=String.format(java.util.Locale.ROOT,
            "%02d_%s.png",number,variant);
        Bitmap found=cache.get(key);
        if(found!=null&&!found.isRecycled())return found;
        if(!loaded)load(context.getApplicationContext());
        byte[] png=originals.get(key);
        if(png==null)return null;
        BitmapFactory.Options options=new BitmapFactory.Options();
        options.inScaled=false; // Preserva os 512px mestres.
        Bitmap bitmap=BitmapFactory.decodeByteArray(png,0,png.length,options);
        if(bitmap!=null)cache.put(key,bitmap);
        return bitmap;
    }
    /** Equaliza as áreas visíveis SEM reduzir, recortar ou recomprimir os PNG 512px. */
    static void fitVisibleArtwork(android.widget.ImageView view,Bitmap image){
        if(view==null||image==null||image.isRecycled())return;
        view.setScaleType(android.widget.ImageView.ScaleType.MATRIX);
        view.post(()->{
            if(image.isRecycled()||!(view.getDrawable() instanceof
                    android.graphics.drawable.BitmapDrawable))return;
            Bitmap shown=((android.graphics.drawable.BitmapDrawable)view.getDrawable()).getBitmap();
            if(shown!=image)return; // Evitar hover atrasado substituindo outro estado.
            int w=view.getWidth(),h=view.getHeight();
            if(w<=0||h<=0)return;
            int l=image.getWidth(),t=image.getHeight(),r=0,b=0;
            // Examinar somente alpha; dados originais não são modificados.
            final int step=2, alphaThreshold=20;
            for(int y=0;y<image.getHeight();y+=step)
                for(int x=0;x<image.getWidth();x+=step)
                    if(android.graphics.Color.alpha(image.getPixel(x,y))>alphaThreshold){
                        if(x<l)l=x;if(x>r)r=x;
                        if(y<t)t=y;if(y>b)b=y;
                    }
            if(r<l||b<t){view.setScaleType(android.widget.ImageView.ScaleType.FIT_CENTER);return;}
            float width=Math.max(1,r-l+1),height=Math.max(1,b-t+1);
            float scale=Math.min((w*.94f)/width,(h*.94f)/height);
            android.graphics.Matrix matrix=new android.graphics.Matrix();
            matrix.setScale(scale,scale);
            matrix.postTranslate(w*.5f-(l+r)*.5f*scale,
                h*.5f-(t+b)*.5f*scale);
            view.setImageMatrix(matrix);
        });
    }
    private static void load(Context context){
        for(int i=1;i<=5;i++){
            String file="menu_icons_512_"+i+".zip";
            try(InputStream stream=context.getAssets().open(file);
                ZipInputStream zip=new ZipInputStream(stream)){
                ZipEntry entry;
                while((entry=zip.getNextEntry())!=null){
                    if(entry.isDirectory())continue;
                    String name=entry.getName();
                    if(!name.matches("menu_icons/(0[1-9]|10)_(normal|hover|ativo|ativo_hover)\\.png"))
                        continue;
                    ByteArrayOutputStream out=new ByteArrayOutputStream(140000);
                    byte[] buffer=new byte[8192];
                    int count,total=0;
                    while((count=zip.read(buffer))!=-1){
                        total+=count;
                        if(total>1024*1024)throw new java.io.IOException("PNG excessivo");
                        out.write(buffer,0,count);
                    }
                    originals.put(name.substring("menu_icons/".length()),out.toByteArray());
                    zip.closeEntry();
                }
            }catch(Exception ignored){
                // Falha segura: a Home mantém o ícone existente neste atalho.
            }
        }
        loaded=true;
    }
}

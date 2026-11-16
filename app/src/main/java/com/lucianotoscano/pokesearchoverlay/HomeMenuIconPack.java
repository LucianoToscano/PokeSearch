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
    // LT349: row ImageViews may initially have zero/narrow width before the
    // weighted Home toolbar settles. Recompute on actual layout changes rather
    // than leaving a tiny matrix frozen from the first frame.
    private static final java.util.WeakHashMap<android.widget.ImageView,
        android.view.View.OnLayoutChangeListener> artworkListeners=new java.util.WeakHashMap<>();
    private static final java.util.WeakHashMap<Bitmap,android.graphics.Rect>
        visibleBounds=new java.util.WeakHashMap<>();

    /** Equaliza a arte visível em toda mudança de medida, sem resample. */
    static void fitVisibleArtwork(android.widget.ImageView view,Bitmap image){
        if(view==null||image==null||image.isRecycled())return;
        view.setScaleType(android.widget.ImageView.ScaleType.MATRIX);
        if(!artworkListeners.containsKey(view)){
            android.view.View.OnLayoutChangeListener listener=(v,left,top,right,bottom,
                    oldLeft,oldTop,oldRight,oldBottom)->{
                if((right-left)!=(oldRight-oldLeft)||
                   (bottom-top)!=(oldBottom-oldTop)){
                    if(v instanceof android.widget.ImageView){
                        android.widget.ImageView iv=(android.widget.ImageView)v;
                        if(iv.getDrawable() instanceof
                                android.graphics.drawable.BitmapDrawable){
                            Bitmap now=((android.graphics.drawable.BitmapDrawable)
                                iv.getDrawable()).getBitmap();
                            applyVisibleMatrix(iv,now);
                        }
                    }
                }
            };
            artworkListeners.put(view,listener);
            view.addOnLayoutChangeListener(listener);
        }
        view.post(()->applyVisibleMatrix(view,image));
    }
    private static void applyVisibleMatrix(android.widget.ImageView view,Bitmap image){
        if(image==null||image.isRecycled()||
            !(view.getDrawable() instanceof android.graphics.drawable.BitmapDrawable))return;
        Bitmap shown=((android.graphics.drawable.BitmapDrawable)view.getDrawable()).getBitmap();
        if(shown!=image)return;
        int w=view.getWidth()-view.getPaddingLeft()-view.getPaddingRight();
        int h=view.getHeight()-view.getPaddingTop()-view.getPaddingBottom();
        if(w<=0||h<=0)return;
        android.graphics.Rect bounds=visibleBounds.get(image);
        if(bounds==null){
            int l=image.getWidth(),t=image.getHeight(),r=-1,b=-1;
            for(int y=0;y<image.getHeight();y+=2){
                for(int x=0;x<image.getWidth();x+=2){
                    if(android.graphics.Color.alpha(image.getPixel(x,y))>64){
                        l=Math.min(l,x);r=Math.max(r,x);
                        t=Math.min(t,y);b=Math.max(b,y);
                    }
                }
            }
            if(r<l||b<t)return;
            bounds=new android.graphics.Rect(l,t,r+1,b+1);
            visibleBounds.put(image,bounds);
        }
        // Layout width/height, NEVER placeholder width from inflation time.
        float scale=Math.min(w*.97f/Math.max(1,bounds.width()),
            h*.97f/Math.max(1,bounds.height()));
        android.graphics.Matrix matrix=new android.graphics.Matrix();
        matrix.setScale(scale,scale);
        matrix.postTranslate(view.getPaddingLeft()+w*.5f-bounds.centerX()*scale,
            view.getPaddingTop()+h*.5f-bounds.centerY()*scale);
        view.setScaleType(android.widget.ImageView.ScaleType.MATRIX);
        view.setImageMatrix(matrix);
    }
    /**
     * Topo ÓPTICO da imagem da Pokébola em pixels físicos, no pai.
     * A borda real da arte é medida via alpha, não por uma estimativa em dp.
     * Usa a mesma matriz e limiar dos ícones já normalizados.
     */
    static int opticalTopInParentPx(android.widget.ImageView view){
        if(view==null||view.getHeight()<=0||
            !(view.getDrawable() instanceof android.graphics.drawable.BitmapDrawable))
            return -1;
        Bitmap image=((android.graphics.drawable.BitmapDrawable)view.getDrawable()).getBitmap();
        if(image==null||image.isRecycled())return -1;
        int first=-1;
        for(int y=0;y<image.getHeight()&&first<0;y+=2){
            for(int x=0;x<image.getWidth();x+=2){
                if(android.graphics.Color.alpha(image.getPixel(x,y))>64){
                    first=y;break;
                }
            }
        }
        if(first<0)return -1;
        float[] top={image.getWidth()*.5f,first};
        view.getImageMatrix().mapPoints(top);
        return view.getTop()+view.getPaddingTop()+Math.round(top[1]);
    }

    /** Horizontal center of the ACTUALLY visible artwork in parent pixels.
     * A 512px source may include asymmetric transparent padding; the middle
     * of its ImageView is not necessarily the center of the Pokébola. */
    static int opticalCenterXInParentPx(android.widget.ImageView view){
        if(view==null||view.getWidth()<=0||
            !(view.getDrawable() instanceof android.graphics.drawable.BitmapDrawable))
            return -1;
        Bitmap bitmap=((android.graphics.drawable.BitmapDrawable)view.getDrawable()).getBitmap();
        if(bitmap==null||bitmap.isRecycled())return -1;
        android.graphics.Rect bounds=visibleBounds.get(bitmap);
        if(bounds==null){
            applyVisibleMatrix(view,bitmap);
            bounds=visibleBounds.get(bitmap);
        }
        if(bounds==null)return -1;
        float[] center={bounds.exactCenterX(),bounds.exactCenterY()};
        view.getImageMatrix().mapPoints(center);
        return view.getLeft()+view.getPaddingLeft()+Math.round(center[0]);
    }

    // LT376e: alpha bounds may include optical sparkle/shadow outside the
    // actual Pokébola. Locate the bright center BUTTON (bounded on both
    // sides by its dark ring), not just the bitmap silhouette center.
    // Fallback to the alpha center when the artwork has no reliable ring.
    private static final java.util.WeakHashMap<Bitmap,Float> buttonCenters=
        new java.util.WeakHashMap<>();
    static int opticalPokeballButtonXInParentPx(android.widget.ImageView view){
        int fallback=opticalCenterXInParentPx(view);
        if(view==null||fallback<0||
            !(view.getDrawable() instanceof android.graphics.drawable.BitmapDrawable))
            return fallback;
        Bitmap bitmap=((android.graphics.drawable.BitmapDrawable)view.getDrawable()).getBitmap();
        if(bitmap==null||bitmap.isRecycled())return fallback;
        Float cached=buttonCenters.get(bitmap);
        if(cached==null){
            float found=Float.NaN;
            android.graphics.Rect box=visibleBounds.get(bitmap);
            if(box!=null){
                int width=box.width(),height=box.height();
                float score=Float.MAX_VALUE;
                final int x0=box.left+width/9,x1=box.right-width/9;
                final int y0=box.top+Math.round(height*.37f);
                final int y1=box.top+Math.round(height*.64f);
                for(int y=y0;y<y1;y+=2){
                    int begin=-1;
                    for(int x=x0;x<=x1;x++){
                        boolean light=false;
                        if(x<x1){
                            int pixel=bitmap.getPixel(x,y);
                            int r=android.graphics.Color.red(pixel),
                                g=android.graphics.Color.green(pixel),
                                b=android.graphics.Color.blue(pixel);
                            light=android.graphics.Color.alpha(pixel)>150&&
                                r>185&&g>185&&b>185&&
                                Math.max(r,Math.max(g,b))-Math.min(r,Math.min(g,b))<75;
                        }
                        if(light){if(begin<0)begin=x;continue;}
                        if(begin<0)continue;
                        int run=x-begin;
                        float center=(begin+x-1)*.5f;
                        if(run>=width*.028f&&run<=width*.25f&&
                            Math.abs(center-box.exactCenterX())<=width*.28f){
                            int offset=Math.max(2,width/125);
                            int left=bitmap.getPixel(Math.max(box.left,begin-offset),y);
                            int right=bitmap.getPixel(Math.min(box.right-1,x+offset-1),y);
                            int leftBrightness=(android.graphics.Color.red(left)+
                                android.graphics.Color.green(left)+android.graphics.Color.blue(left))/3;
                            int rightBrightness=(android.graphics.Color.red(right)+
                                android.graphics.Color.green(right)+android.graphics.Color.blue(right))/3;
                            if(leftBrightness<135&&rightBrightness<135){
                                float candidate=Math.abs(center-box.exactCenterX())+
                                    1.5f*Math.abs(y-box.exactCenterY());
                                if(candidate<score){score=candidate;found=center;}
                            }
                        }
                        begin=-1;
                    }
                }
            }
            cached=found;
            buttonCenters.put(bitmap,cached);
        }
        if(Float.isNaN(cached))return fallback;
        float[] mapped={cached,bitmap.getHeight()*.5f};
        view.getImageMatrix().mapPoints(mapped);
        return view.getLeft()+view.getPaddingLeft()+Math.round(mapped[0]);
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

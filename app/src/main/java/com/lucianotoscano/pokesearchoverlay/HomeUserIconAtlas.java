package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import java.io.InputStream;

/**
 * LT393: 4x4 atlas of the ORIGINAL owner-submitted Iconehome artwork.
 * Grid indices are stable (0..15). The two Home Pokeballs use the
 * ORIGINAL white/off user art when disabled. The only empty atlas cell
 * belongs to the Assistant, which retains its existing native artwork.
 * The source file is a resized app-display derivative; it is not a
 * generated replacement icon and no external image host is required.
 */
final class HomeUserIconAtlas {
    private static final String ASSET="home-user-icons-atlas.png";
    private static final int TILE=256;
    private static final Bitmap[] cached=new Bitmap[16];
    private static Bitmap atlas;
    private static boolean attempted;
    private HomeUserIconAtlas(){}

    static synchronized Bitmap icon(Context context,int position){
        if(position<0||position>=16||position==3)return null;
        if(cached[position]!=null&&!cached[position].isRecycled())
            return cached[position];
        if(!attempted){
            attempted=true;
            try(InputStream in=context.getApplicationContext().getAssets().open(ASSET)){
                BitmapFactory.Options opt=new BitmapFactory.Options();
                opt.inScaled=false;
                atlas=BitmapFactory.decodeStream(in,null,opt);
                if(atlas==null||atlas.getWidth()!=4*TILE||
                    atlas.getHeight()!=4*TILE)atlas=null;
            }catch(Exception ignored){atlas=null;}
        }
        if(atlas==null)return null;
        int x=(position%4)*TILE, y=(position/4)*TILE;
        Bitmap out=Bitmap.createBitmap(atlas,x,y,TILE,TILE);
        cached[position]=out;
        return out;
    }
}

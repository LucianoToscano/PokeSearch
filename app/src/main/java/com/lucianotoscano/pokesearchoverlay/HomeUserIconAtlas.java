package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import java.io.InputStream;

/**
 * LT393: 4x4 atlas of the ORIGINAL owner-submitted Iconehome artwork.
 * Grid indices are stable (0..15). LT394 fills cells 0/1 with the owner's
 * white OFF Pokéball, cell 7 with the requested monochrome Rocket artwork,
 * and provides safe optical margins for Quests and Comunidade.
 * The visual assets are bundled offline and require no external host.
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

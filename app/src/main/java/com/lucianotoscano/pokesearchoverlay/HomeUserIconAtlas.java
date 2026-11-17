package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import java.io.InputStream;

/**
 * LT393: 4x4 atlas of the ORIGINAL owner-submitted Iconehome artwork.
 * Grid indices are stable (0..15). The two Home Pokeballs use the
 * ORIGINAL white/off user art when disabled. LT397: the owner's three
 * new designs replace only Assistant (3), Trocas (13) and the Grupo
 * symbol of Comunidade (15), from a separate, optimized 3-tile strip.
 * The source file is a resized app-display derivative; it is not a
 * generated replacement icon and no external image host is required.
 */
final class HomeUserIconAtlas {
    private static final String ASSET="home-user-icons-atlas.png";
    private static final String OWNER_ASSET="home-lt397-owner-icons.png";
    private static final int TILE=256;
    private static final Bitmap[] cached=new Bitmap[16];
    private static Bitmap atlas;
    private static Bitmap ownerAtlas;
    private static boolean attempted;
    private static boolean ownerAttempted;
    private HomeUserIconAtlas(){}

    static synchronized Bitmap icon(Context context,int position){
        if(position<0||position>=16)return null;
        if(cached[position]!=null&&!cached[position].isRecycled())
            return cached[position];
        // The source drawings are retained unmodified in shape and color.
        // Each is centered/normalized in a 256px transparent tile, ensuring
        // equal icon geometry with no runtime network or dynamic tinting.
        if(position==3||position==13||position==15){
            if(!ownerAttempted){
                ownerAttempted=true;
                try(InputStream in=context.getApplicationContext().getAssets().open(OWNER_ASSET)){
                    BitmapFactory.Options opt=new BitmapFactory.Options();
                    opt.inScaled=false;
                    ownerAtlas=BitmapFactory.decodeStream(in,null,opt);
                    if(ownerAtlas==null||ownerAtlas.getWidth()!=3*TILE||
                        ownerAtlas.getHeight()!=TILE)ownerAtlas=null;
                }catch(Exception ignored){ownerAtlas=null;}
            }
            if(ownerAtlas!=null){
                int x=position==3?0:position==13?TILE:2*TILE;
                cached[position]=Bitmap.createBitmap(ownerAtlas,x,0,TILE,TILE);
                return cached[position];
            }
            if(position==3)return null; // preserve native assistant fallback
        }
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

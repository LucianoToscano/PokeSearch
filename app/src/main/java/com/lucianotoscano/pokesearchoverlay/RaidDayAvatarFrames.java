package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import java.io.InputStream;

/**
 * Sprite do treinador enviado pelo usuário, previamente recortado em 12 quadros
 * transparentes. Ativo somente no balão do Assistente do Dia de Reides.
 * Mantém pixels nítidos ao ampliar (sem interpolação nem animação em rede).
 */
public final class RaidDayAvatarFrames {
    public static final int CELL=64, COLS=6, COUNT=12;
    public static final int[] SIZES_PX={50,75,100};
    public static final String PREF_SIZE="raid_day_avatar_size_px";
    public static final String PREF_MOTION="raid_day_avatar_motion";
    public static final int IDLE_A=0, IDLE_B=1;
    public static final int WALK_0=2, WALK_1=3, WALK_2=4, WALK_3=5;
    public static final int RUN_0=6, RUN_1=7, WAVE=8;
    public static final int QUESTION=9, ALERT=10, OK=11;

    private final Bitmap atlas;
    private final Bitmap[] crops;
    private final Drawable[] images;
    private RaidDayAvatarFrames(Context context,Bitmap bitmap){
        atlas=bitmap;
        crops=new Bitmap[COUNT];
        images=new Drawable[COUNT];
        for(int i=0;i<COUNT;i++){
            Bitmap crop=Bitmap.createBitmap(atlas,(i%COLS)*CELL,
                (i/COLS)*CELL,CELL,CELL);
            crops[i]=crop;
            BitmapDrawable drawable=new BitmapDrawable(context.getResources(),crop);
            drawable.setFilterBitmap(false);
            drawable.setAntiAlias(false);
            images[i]=drawable;
        }
    }
    public static RaidDayAvatarFrames load(Context context){
        try(InputStream stream=context.getAssets().open("raid_day_avatar_atlas.png")){
            BitmapFactory.Options opts=new BitmapFactory.Options();
            opts.inScaled=false;
            Bitmap atlas=BitmapFactory.decodeStream(stream,null,opts);
            if(atlas==null)return null;
            if(atlas.getWidth()!=COLS*CELL||atlas.getHeight()!=2*CELL){
                atlas.recycle();return null;
            }
            return new RaidDayAvatarFrames(context,atlas);
        }catch(Exception error){
            return null; // ícone de passe anterior continua funcional
        }
    }
    public Drawable frame(int index){
        if(index<0||index>=COUNT)return images[IDLE_A];
        return images[index];
    }
    public void release(){
        for(Bitmap bitmap:crops)if(bitmap!=null&&!bitmap.isRecycled())bitmap.recycle();
        if(atlas!=null&&!atlas.isRecycled())atlas.recycle();
    }
    private RaidDayAvatarFrames(){throw new AssertionError();}
}

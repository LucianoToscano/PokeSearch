package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Mirrors the SAME result-icon PNG paths used by dock.html/getResultIcon,
 * rather than imposing a fixed Pokeball illustration on Home.
 * Search configuration for P1 and P2 remains isolated.
 */
final class HomeFloatingModeIcon {
    private static final Map<String,Bitmap> bitmaps=new HashMap<>();
    private HomeFloatingModeIcon(){}

    private static SharedPreferences prefs(Context context,boolean secondary){
        return context.getSharedPreferences(secondary?"prefs_secondary":"prefs",0);
    }
    private static String normalized(SharedPreferences p){
        String mode=p.getString("mode","raw").trim().toLowerCase(Locale.ROOT)
            .replace(' ','_').replace('-','_');
        if("raw".equals(mode)){
            int a=p.getInt("rawAttack",0),d=p.getInt("rawDefense",0),
                s=p.getInt("rawStamina",0);
            if(a==15&&d==15&&s==15)return "hundo";
            if(a==0&&d==0&&s==0)return "nundo";
            return "custom";
        }
        if("percent".equals(mode)||"percentage".equals(mode)){
            int min=p.getInt("ivPercentMin",0),
                max=p.getInt("ivPercentMax",100);
            if(min==100&&max==100)return "hundo";
            if(min==0&&max==0)return "nundo";
            return "percent";
        }
        switch(mode){
            case "iv":case "iv100":case "shundo":case "hundo":return "hundo";
            case "iv0":case "shnundo":case "nundo":return "nundo";
            case "gl":case "great":return "gl";
            case "ul":case "ultra":return "ul";
            case "ml":case "master":return "ml";
            case "cup":case "cup_league":return "cup";
            case "custom":return "custom";
            default:return "none";
        }
    }
    static String family(Context context,boolean secondary){
        return normalized(prefs(context,secondary));
    }
    static String label(Context context,boolean secondary){
        SharedPreferences p=prefs(context,secondary);
        String family=normalized(p);
        switch(family){
            case "hundo":return "100%";
            case "nundo":return "0%";
            case "gl":return "GL";
            case "ul":return "UL";
            case "ml":return "ML";
            case "cup":return "CUP";
            case "percent":return "%";
            case "custom":return "IV";
            default:return "";
        }
    }
    static synchronized Bitmap icon(Context context,boolean secondary){
        String family=family(context,secondary);
        String path;
        switch(family){
            case "ul":path="result-icons/ultra-league.png";break;
            case "gl":path="result-icons/base/base-gl.png";break;
            case "ml":path="result-icons/base/base-ml.png";break;
            case "cup":case "none":path="result-icons/base/base-none.png";break;
            default:path="result-icons/base/base-custom.png";break;
        }
        Bitmap cached=bitmaps.get(path);
        if(cached!=null&&!cached.isRecycled())return cached;
        try(InputStream in=context.getApplicationContext().getAssets().open(path)){
            BitmapFactory.Options opts=new BitmapFactory.Options();
            opts.inScaled=false;
            Bitmap out=BitmapFactory.decodeStream(in,null,opts);
            if(out!=null)bitmaps.put(path,out);
            return out;
        }catch(Exception missing){return null;}
    }
}

package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.net.Uri;
import android.webkit.WebResourceResponse;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Read-only, app-private sprite bridge shared by the native Favorites picker
 * and the menu/results WebViews. No request interception for unverified forms,
 * no synthetic costumes, tokens, remote redirects, or network calls. */
final class VerifiedSpriteCache {
    private static final Pattern RAW=Pattern.compile(
        "^https://raw\\.githubusercontent\\.com/PokeAPI/sprites/master/sprites/pokemon/([0-9]{1,4})\\.png$");
    private static final Pattern MIRROR=Pattern.compile(
        "^https://cdn\\.jsdelivr\\.net/gh/PokeAPI/sprites@master/sprites/pokemon/([0-9]{1,4})\\.png$");
    private VerifiedSpriteCache(){}
    static WebResourceResponse fromDisk(Context context,Uri requestUrl){
        if(context==null||requestUrl==null)return null;
        String url=requestUrl.toString();
        Matcher raw=RAW.matcher(url),mirror=MIRROR.matcher(url);
        if(!raw.matches()&&!mirror.matches())return null;
        String number=raw.matches()?raw.group(1):mirror.group(1);
        int dex;
        try{dex=Integer.parseInt(number);}catch(NumberFormatException ignored){return null;}
        if(dex<1||dex>10000)return null;
        File f=new File(new File(context.getCacheDir(),"verified-base-sprites-v1"),dex+".png");
        if(!f.isFile()||f.length()<8||f.length()>256*1024)return null;
        try{
            FileInputStream in=new FileInputStream(f);
            if(in.read()!=0x89||in.read()!='P'||in.read()!='N'||in.read()!='G'){
                in.close();return null;
            }
            in.close();
            return new WebResourceResponse("image/png",null,new FileInputStream(f));
        }catch(IOException ignored){return null;}
    }
}

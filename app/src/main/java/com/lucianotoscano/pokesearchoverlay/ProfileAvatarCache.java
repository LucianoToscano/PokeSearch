package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Slot-private, bounded avatar cache. An entry is usable only for the exact
 * confirmed identity and trusted avatar URL. The caller owns URL validation.
 * No account cookies, HTTP headers, tokens or raw identity enter filenames.
 */
final class ProfileAvatarCache {
    private static final int MAX_FILE_BYTES=350_000;
    private static final int MAX_EDGE=320;
    private static final String KEY="profileAvatarCacheSignature";
    private ProfileAvatarCache(){}

    private static SharedPreferences prefs(Context context,int slot){
        if(slot!=1&&slot!=2)throw new IllegalArgumentException("slot");
        return PogoAccountSlots.prefs(context,slot);
    }
    private static File file(Context context,int slot){
        if(slot!=1&&slot!=2)throw new IllegalArgumentException("slot");
        return new File(context.getFilesDir(),"pogo-avatar-slot-"+slot+".jpg");
    }
    private static String signature(int slot,String displayName,String url){
        if(displayName==null||displayName.trim().isEmpty()||url==null||url.isEmpty())
            return "";
        try{
            byte[] input=(slot+"\n"+displayName+"\n"+url).getBytes(StandardCharsets.UTF_8);
            byte[] digest=MessageDigest.getInstance("SHA-256").digest(input);
            StringBuilder s=new StringBuilder(digest.length*2);
            for(byte b:digest)s.append(String.format(java.util.Locale.ROOT,"%02x",b&255));
            return s.toString();
        }catch(Exception ignored){return "";}
    }
    static Bitmap load(Context context,int slot,String displayName,String url){
        String expected=signature(slot,displayName,url);
        if(expected.isEmpty()||!expected.equals(prefs(context,slot).getString(KEY,"")))
            return null;
        File image=file(context,slot);
        if(!image.isFile()||image.length()==0||image.length()>MAX_FILE_BYTES)return null;
        try{
            BitmapFactory.Options options=new BitmapFactory.Options();
            options.inJustDecodeBounds=true;
            BitmapFactory.decodeFile(image.getAbsolutePath(),options);
            if(options.outWidth<1||options.outHeight<1||
                options.outWidth>MAX_EDGE||options.outHeight>MAX_EDGE)return null;
            return BitmapFactory.decodeFile(image.getAbsolutePath());
        }catch(Exception ignored){return null;}
    }
    static void save(Context context,int slot,String displayName,String url,Bitmap bitmap){
        String sig=signature(slot,displayName,url);
        if(sig.isEmpty()||bitmap==null)return;
        Bitmap small=null;
        try{
            int w=bitmap.getWidth(),h=bitmap.getHeight();
            if(w<1||h<1)return;
            double ratio=Math.min(1.0,MAX_EDGE/(double)Math.max(w,h));
            small=Bitmap.createScaledBitmap(bitmap,
                Math.max(1,(int)(w*ratio)),Math.max(1,(int)(h*ratio)),true);
            ByteArrayOutputStream bytes=new ByteArrayOutputStream();
            if(!small.compress(Bitmap.CompressFormat.JPEG,86,bytes)||
                bytes.size()<1||bytes.size()>MAX_FILE_BYTES)return;
            File target=file(context,slot),temp=new File(context.getFilesDir(),
                "pogo-avatar-slot-"+slot+".tmp");
            try(FileOutputStream stream=new FileOutputStream(temp)){
                stream.write(bytes.toByteArray());
                stream.getFD().sync();
            }
            // Fail closed if the replacement cannot complete; never assign
            // the signature to a partially written or unknown image.
            if(!temp.renameTo(target)){
                temp.delete();
                return;
            }
            prefs(context,slot).edit().putString(KEY,sig).apply();
        }catch(Exception ignored){
            new File(context.getFilesDir(),"pogo-avatar-slot-"+slot+".tmp").delete();
        }finally{
            if(small!=null&&small!=bitmap)small.recycle();
        }
    }
    static void clear(Context context,int slot){
        prefs(context,slot).edit().remove(KEY).apply();
        file(context,slot).delete();
        new File(context.getFilesDir(),"pogo-avatar-slot-"+slot+".tmp").delete();
    }
}

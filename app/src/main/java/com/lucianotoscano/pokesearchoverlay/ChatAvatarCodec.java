package com.lucianotoscano.pokesearchoverlay;

import android.content.ContentResolver;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.util.Base64;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

/** User-initiated, optional public chat avatar. No Google profile access. */
final class ChatAvatarCodec {
    static final String PREFIX="data:image/jpeg;base64,";
    static final int MAX_DATA_CHARS=24000;
    private ChatAvatarCodec(){}
    static String fromGallery(ContentResolver resolver,Uri uri) throws Exception {
        if(uri==null || !"content".equals(uri.getScheme()))
            throw new IllegalArgumentException("Invalid gallery URI");
        BitmapFactory.Options bounds=new BitmapFactory.Options();
        bounds.inJustDecodeBounds=true;
        try(InputStream stream=resolver.openInputStream(uri)){
            if(stream==null)throw new IllegalArgumentException("Gallery unavailable");
            BitmapFactory.decodeStream(stream,null,bounds);
        }
        if(bounds.outWidth<16||bounds.outHeight<16||
           bounds.outWidth>12000||bounds.outHeight>12000)
            throw new IllegalArgumentException("Invalid image dimensions");
        BitmapFactory.Options options=new BitmapFactory.Options();
        int size=Math.max(bounds.outWidth,bounds.outHeight);
        options.inSampleSize=1;
        while(size/options.inSampleSize>192)options.inSampleSize*=2;
        Bitmap source;
        try(InputStream stream=resolver.openInputStream(uri)){
            if(stream==null)throw new IllegalArgumentException("Cannot load photo");
            source=BitmapFactory.decodeStream(stream,null,options);
        }
        if(source==null)throw new IllegalArgumentException("Image format not supported");
        int w=source.getWidth(),h=source.getHeight();
        int side=Math.min(w,h);
        Bitmap square=Bitmap.createBitmap(source,(w-side)/2,(h-side)/2,side,side);
        Bitmap small=Bitmap.createScaledBitmap(square,96,96,true);
        ByteArrayOutputStream out=new ByteArrayOutputStream();
        small.compress(Bitmap.CompressFormat.JPEG,62,out);
        if(source!=square)source.recycle();
        if(square!=small)square.recycle();
        small.recycle();
        byte[] bytes=out.toByteArray();
        if(bytes.length>17000)throw new IllegalArgumentException("Photo too large");
        String encoded=PREFIX+Base64.encodeToString(bytes,Base64.NO_WRAP);
        if(encoded.length()>MAX_DATA_CHARS)throw new IllegalArgumentException("Photo exceeds limit");
        return encoded;
    }
    static Bitmap decode(String value){
        if(value==null||!value.startsWith(PREFIX)||value.length()>MAX_DATA_CHARS)return null;
        try{
            byte[] data=Base64.decode(value.substring(PREFIX.length()),Base64.DEFAULT);
            if(data.length<40||data.length>17000)return null;
            BitmapFactory.Options bounds=new BitmapFactory.Options();
            bounds.inJustDecodeBounds=true;
            BitmapFactory.decodeByteArray(data,0,data.length,bounds);
            if(bounds.outWidth<16||bounds.outHeight<16||
               bounds.outWidth>192||bounds.outHeight>192)return null;
            return BitmapFactory.decodeByteArray(data,0,data.length);
        }catch(IllegalArgumentException|OutOfMemoryError error){return null;}
    }
}

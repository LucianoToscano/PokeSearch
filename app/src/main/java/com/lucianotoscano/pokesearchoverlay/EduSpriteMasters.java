package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

/** LT330: 68 fontes PNG 512 reais, carregadas sob demanda sem atlas 4096x4608 na RAM. */
final class EduSpriteMasters {
    static final int COUNT = 68;
    static final int CELL = 512;
    static final int PARTS = 13;
    static final long SIZE_BYTES = 10372393L;
    static final String SHA256 =
        "f1957b7f6446d82ed9fdb9ace8b0b5d950dfc10f0709aa1618054a366791ac25";
    private static final String PREFIX = "edu_avatar_masters_512_lt330.part";
    private static final String CACHE_FILE = "edu_avatar_masters_512_lt330.zip";
    private final ZipFile archive;

    private EduSpriteMasters(ZipFile input){archive=input;}

    static EduSpriteMasters load(Context context){
        File destination = new File(context.getCacheDir(), CACHE_FILE);
        try {
            if (!validFile(destination)) {
                File stage = File.createTempFile("edu512-", ".zip.tmp", context.getCacheDir());
                boolean copied = false;
                try {
                    try (FileOutputStream output = new FileOutputStream(stage)) {
                        byte[] buffer = new byte[16384];
                        for (int i=0; i<PARTS; i++) {
                            String part = PREFIX + (i < 10 ? "0" : "") + i;
                            try (InputStream source = context.getAssets().open(part)) {
                                for (int n; (n=source.read(buffer))!=-1;) output.write(buffer,0,n);
                            }
                        }
                        output.flush();
                    }
                    if (!validFile(stage)) throw new IOException("Edu 512: SHA-256 invalido");
                    if (destination.exists() && !destination.delete())
                        throw new IOException("Edu 512: cache antigo bloqueado");
                    if (!stage.renameTo(destination))
                        throw new IOException("Edu 512: nao foi possivel ativar o cache");
                    copied=true;
                } finally {
                    if(!copied) stage.delete();
                }
            }
            ZipFile zip = new ZipFile(destination);
            boolean complete = zip.size()==COUNT;
            for(int i=0; complete&&i<COUNT;i++) {
                ZipEntry e=zip.getEntry((i<10?"0":"")+i+".png");
                complete=e!=null&&e.getSize()>1000&&e.getSize()<3000000;
            }
            if(!complete){zip.close();throw new IOException("Edu 512: indice de PNGs incompleto");}
            return new EduSpriteMasters(zip);
        }catch(IOException | NoSuchAlgorithmException | SecurityException ignored){
            // Falha de armazenamento, cache ou arquivo nao pode ocultar a colecao 128.
            return null;
        }
    }

    Bitmap frame(int index){
        if(index<0||index>=COUNT)return null;
        ZipEntry entry = archive.getEntry((index<10?"0":"")+index+".png");
        if(entry==null)return null;
        try(InputStream input=archive.getInputStream(entry)){
            BitmapFactory.Options options = new BitmapFactory.Options();
            options.inScaled=false;
            Bitmap image=BitmapFactory.decodeStream(input,null,options);
            if(image!=null && image.getWidth()==CELL&&image.getHeight()==CELL)
                return image;
            if(image!=null)image.recycle();
        }catch(IOException|RuntimeException ignored){
            // Fallback controlado para o atlas 128, sem crash do assistente.
        }
        return null;
    }

    void close(){try{archive.close();}catch(IOException ignored){}}

    private static boolean validFile(File file) throws IOException, NoSuchAlgorithmException {
        if(!file.isFile()||file.length()!=SIZE_BYTES)return false;
        MessageDigest digest=MessageDigest.getInstance("SHA-256");
        try(InputStream input=new FileInputStream(file)){
            byte[] buffer=new byte[32768];
            for(int n;(n=input.read(buffer))!=-1;) digest.update(buffer,0,n);
        }
        StringBuilder hex=new StringBuilder(64);
        for(byte b:digest.digest()){
            int v=b&255;
            hex.append(Character.forDigit(v>>>4,16));
            hex.append(Character.forDigit(v&15,16));
        }
        return SHA256.equals(hex.toString());
    }
}

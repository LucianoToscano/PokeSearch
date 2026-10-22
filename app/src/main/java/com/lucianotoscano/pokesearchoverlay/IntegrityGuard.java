package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.content.pm.SigningInfo;
import android.content.pm.ApplicationInfo;
import android.os.Build;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/** Defense in depth for distributed builds; certificate and seven local asset pins. */
public final class IntegrityGuard {
    private static final String PACKAGE = "com.lucianotoscano.pokesearch";
    private static final String OFFICIAL_PIX_SHA256 = "c2862867b812f44058a0a4c78d69ead87cb5195a0cd00072575e1a2d29c707fe";
    private IntegrityGuard() {}
    static boolean matchesPix(String payload) {
        if(payload==null)return false;
        try {
            byte[] expected=fromHex(OFFICIAL_PIX_SHA256);
            return expected!=null && MessageDigest.isEqual(
                MessageDigest.getInstance("SHA-256").digest(payload.getBytes(StandardCharsets.UTF_8)),expected);
        }catch(Exception e){return false;}
    }
    private static byte[] fromHex(String hex) {
        if(hex==null||!hex.matches("(?i)[0-9a-f]{64}"))return null;
        byte[] out=new byte[32];
        for(int i=0;i<32;i++)out[i]=(byte)Integer.parseInt(hex.substring(i*2,i*2+2),16);
        return out;
    }
    private static boolean signerMatches(Signature signer,byte[] expected)throws Exception{
        return signer!=null && MessageDigest.isEqual(
            MessageDigest.getInstance("SHA-256").digest(signer.toByteArray()),expected);
    }
    private static boolean assetsMatch(Context c){
        String hashes=BuildConfig.EXPECTED_ASSET_SHA256;
        if(hashes==null||hashes.isEmpty())return false;
        String[] entries=hashes.split(";",-1);
        if(entries.length!=7)return false;
        try{
            for(String entry:entries){
                int eq=entry.indexOf('=');
                if(eq<=0||eq==entry.length()-1)return false;
                String path=entry.substring(0,eq);
                byte[] expected=fromHex(entry.substring(eq+1));
                if(expected==null||path.contains("..")||path.indexOf('/')>=0)return false;
                MessageDigest hash=MessageDigest.getInstance("SHA-256");
                try(InputStream in=c.getAssets().open(path)){
                    byte[] chunk=new byte[8192];
                    for(int n;(n=in.read(chunk))!=-1;)hash.update(chunk,0,n);
                }
                if(!MessageDigest.isEqual(hash.digest(),expected))return false;
            }
            return true;
        }catch(Exception e){return false;}
    }
    public static boolean verify(Context c) {
        if(c==null||!PACKAGE.equals(c.getPackageName())||!matchesPix(PixSupport.PAYLOAD))return false;
        try{
            PackageManager pm=c.getPackageManager();
            int mode=Build.VERSION.SDK_INT>=28?PackageManager.GET_SIGNING_CERTIFICATES:PackageManager.GET_SIGNATURES;
            PackageInfo info=pm.getPackageInfo(PACKAGE,mode);
            long vc=Build.VERSION.SDK_INT>=28?info.getLongVersionCode():info.versionCode;
            byte[] expected=fromHex(BuildConfig.EXPECTED_SIGNING_CERT_SHA256);
            if(expected==null)
                return vc==51&&(c.getApplicationInfo().flags&ApplicationInfo.FLAG_DEBUGGABLE)!=0;
            Signature[] current;
            if(Build.VERSION.SDK_INT>=28){
                SigningInfo sign=info.signingInfo;
                if(sign==null)return false;
                current=sign.getApkContentsSigners();
            }else current=info.signatures;
            return current!=null&&current.length==1&&signerMatches(current[0],expected)&&assetsMatch(c);
        }catch(Exception e){return false;}
    }
}

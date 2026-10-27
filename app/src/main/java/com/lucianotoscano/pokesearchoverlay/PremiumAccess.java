package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.os.SystemClock;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import org.json.JSONObject;
import org.json.JSONArray;
import java.net.HttpURLConnection;
import java.net.URL;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import android.os.Handler;
import android.os.Looper;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

/** Transient server-issued access lease. No wall-clock checks or persisted grants. */
final class PremiumAccess {
    interface AccessCallback { void done(boolean allowed,boolean premium); }
    interface ResultCallback { void done(Map<String,Object> result,String error); }
    private static final long LEASE_MS=65000L;
    private static long leaseElapsed=-1L;
    private static boolean globallyAllowed=false,secondAllowed=false;
    private static long lastRequest=0L;
    private PremiumAccess(){}
    static boolean controlled(){return BuildConfig.CONTROLLED_DISTRIBUTION;}
    static synchronized void invalidateLease(){
        ++lastRequest; // A response started under an old account must not restore access.
        globallyAllowed=false;
        secondAllowed=false;
        leaseElapsed=-1L;
    }
    static synchronized boolean permitted(boolean secondary){
        if(!controlled())return true; // Normal, non-distribution app stays untouched.
        return leaseElapsed>=0&&SystemClock.elapsedRealtime()>=leaseElapsed&&
          SystemClock.elapsedRealtime()-leaseElapsed<LEASE_MS&&
          globallyAllowed&&(!secondary||secondAllowed);
    }
    static void verify(Context context,AccessCallback callback){
        if(!controlled()){callback.done(true,true);return;}
        Map<String,Object> payload=new HashMap<>();
        payload.put("versionCode",BuildConfig.VERSION_CODE);
        final long seq;
        synchronized(PremiumAccess.class){seq=++lastRequest;}
        call(context,"checkDistributionAccess",payload,(response,error)->{
            synchronized(PremiumAccess.class){
                if(seq!=lastRequest){
                    callback.done(permitted(false),permitted(true));
                    return;
                }
            }
            boolean global=error==null&&Boolean.TRUE.equals(response.get("allowed"));
            boolean premium=global&&Boolean.TRUE.equals(response.get("premium"));
            synchronized(PremiumAccess.class){
                globallyAllowed=global;secondAllowed=premium;
                leaseElapsed=error==null?SystemClock.elapsedRealtime():-1L;
            }
            callback.done(global,premium);
        });
    }
    static void redeem(Context context,String licenseKey,ResultCallback cb){
        Map<String,Object> data=new HashMap<>();data.put("licenseKey",licenseKey);
        call(context,"redeemPremiumKey",data,cb);
    }
    static void createPix(Context context,String email,String cpf,ResultCallback cb){
        Map<String,Object> data=new HashMap<>();
        data.put("versionCode",BuildConfig.VERSION_CODE);
        data.put("email",email);data.put("cpf",cpf);
        call(context,"createPremiumPix",data,cb);
    }
    static void adminOverview(Context context,ResultCallback cb){
        call(context,"adminPremiumOverview",new HashMap<>(),cb);
    }
    static void adminDistribution(Context context,boolean global,int versionCode,
                                  boolean enabled,ResultCallback cb){
        Map<String,Object> data=new HashMap<>();
        data.put("scope",global?"global":"version");
        data.put("enabled",enabled);
        if(!global)data.put("versionCode",versionCode);
        call(context,"adminDistributionControl",data,cb);
    }
    static void offer(Context context,ResultCallback cb){
        call(context,"getPremiumOffer",new HashMap<>(),cb);
    }
    static void issueLicense(Context context,String duration,String targetUid,
                             boolean extend,ResultCallback cb){
        Map<String,Object> data=new HashMap<>();
        data.put("duration",duration);
        if(targetUid!=null&&!targetUid.isEmpty())data.put("uid",targetUid);
        data.put("extend",extend);
        call(context,"adminIssuePremiumKey",data,cb);
    }
    static void adjustExpiry(Context context,String uid,int days,ResultCallback cb){
        Map<String,Object> values=new HashMap<>();
        values.put("uid",uid);values.put("action","extendDays");values.put("days",days);
        call(context,"adminAdjustPremiumExpiry",values,cb);
    }
    static void setExpiry(Context context,String uid,long utcMs,ResultCallback cb){
        Map<String,Object> values=new HashMap<>();
        values.put("uid",uid);values.put("action","setExpiresAt");values.put("expiresAt",utcMs);
        call(context,"adminAdjustPremiumExpiry",values,cb);
    }
    static void adminSettings(Context context,Map<String,Object> values,ResultCallback cb){
        call(context,"adminPremiumSettings",values,cb);
    }
    static void order(Context context,String orderId,ResultCallback cb){
        Map<String,Object> data=new HashMap<>();data.put("orderId",orderId);
        call(context,"getPremiumOrder",data,cb);
    }
    private static void call(Context context,String name,Map<String,Object> data,ResultCallback cb){
        final Context appContext=context.getApplicationContext();
        try{
            // Premium uses a different named FirebaseAuth instance; the Stats app
            // remains anonymous so installs/online counts are not re-registered.
            FirebaseAuth auth=PremiumGoogleLogin.auth(appContext);
            boolean anonymousAllowed="checkDistributionAccess".equals(name)||
                    "getPremiumOffer".equals(name);
            if(!anonymousAllowed&&!PremiumGoogleLogin.isGoogleSignedIn(appContext)){
                cb.done(new HashMap<>(),"Entre com sua conta Google para usar o Premium.");
                return;
            }
            if(auth.getCurrentUser()==null){
                auth.signInAnonymously()
                    .addOnSuccessListener(x->invoke(auth,name,data,cb))
                    .addOnFailureListener(e->cb.done(new HashMap<>(),"Autenticação indisponível."));
            }else invoke(auth,name,data,cb);
        }catch(RuntimeException ex){cb.done(new HashMap<>(),"Firebase indisponível.");}
    }
    private static void invoke(FirebaseAuth auth,String name,Map<String,Object> data,
                               ResultCallback cb){
        final FirebaseUser user=auth.getCurrentUser();
        if(user==null){cb.done(new HashMap<>(),"Usuário não autenticado.");return;}
        user.getIdToken(false).addOnSuccessListener(token->{
            String jwt=token.getToken();
            if(jwt==null||jwt.isEmpty()){
                cb.done(new HashMap<>(),"Token de autenticação indisponível.");return;
            }
            new Thread(()->httpRequest(name,data,jwt,cb),"PS-Premium-HTTPS").start();
        }).addOnFailureListener(e->cb.done(new HashMap<>(),"Falha no login Firebase."));
    }
    private static void httpRequest(String name,Map<String,Object> data,String jwt,
                                    ResultCallback cb){
        HttpURLConnection connection=null;
        final Handler main=new Handler(Looper.getMainLooper());
        try{
            // HTTPS backend on Netlify; all grants and payment decisions stay server-side.
            URL url=new URL(BuildConfig.PREMIUM_BACKEND_URL+"/"+name);
            if(!"https".equalsIgnoreCase(url.getProtocol()))
                throw new IllegalStateException("HTTPS required");
            connection=(HttpURLConnection)url.openConnection();
            connection.setRequestMethod("POST");
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(12000);
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type","application/json; charset=utf-8");
            connection.setRequestProperty("Accept","application/json");
            connection.setRequestProperty("Authorization","Bearer "+jwt);
            byte[] bytes=new JSONObject(data).toString().getBytes(StandardCharsets.UTF_8);
            if(bytes.length>12000)throw new IllegalArgumentException("Pedido muito grande");
            try(java.io.OutputStream stream=connection.getOutputStream()){stream.write(bytes);}
            int status=connection.getResponseCode();
            InputStream response=status>=400?connection.getErrorStream():connection.getInputStream();
            if(response==null)throw new IllegalStateException("Sem resposta");
            ByteArrayOutputStream output=new ByteArrayOutputStream();
            byte[] chunk=new byte[4096];int n;
            try(InputStream source=response){
                while((n=source.read(chunk))!=-1){
                    if(output.size()+n>65536)throw new IllegalStateException("Resposta muito grande");
                    output.write(chunk,0,n);
                }
            }
            JSONObject parsed=new JSONObject(output.toString("UTF-8"));
            if(status>=200&&status<300){
                final Map<String,Object> mapped=toMap(parsed);
                main.post(()->cb.done(mapped,null));
            }else{
                final String message=parsed.optString("error","Servidor Premium indisponível.");
                main.post(()->cb.done(new HashMap<>(),message));
            }
        }catch(Exception ignored){
            main.post(()->cb.done(new HashMap<>(),"Falha no servidor Premium."));
        }finally{
            if(connection!=null)connection.disconnect();
        }
    }
    private static Object fromJson(Object value){
        if(value==null||value==JSONObject.NULL)return null;
        if(value instanceof JSONObject)return toMap((JSONObject)value);
        if(value instanceof JSONArray){
            JSONArray a=(JSONArray)value;
            List<Object> out=new ArrayList<>();
            for(int i=0;i<a.length();i++)out.add(fromJson(a.opt(i)));
            return out;
        }
        return value;
    }
    private static Map<String,Object> toMap(JSONObject json){
        Map<String,Object> out=new HashMap<>();
        Iterator<String> keys=json.keys();
        while(keys.hasNext()){
            String key=keys.next();
            out.put(key,fromJson(json.opt(key)));
        }
        return out;
    }
}

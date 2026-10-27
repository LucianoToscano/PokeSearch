package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.os.SystemClock;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.functions.FirebaseFunctions;
import com.google.firebase.functions.HttpsCallableResult;
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
            com.google.firebase.FirebaseApp firebase=FirebaseStats.getNamedApp(appContext);
            FirebaseAuth auth=FirebaseAuth.getInstance(firebase);
            if(auth.getCurrentUser()==null){
                auth.signInAnonymously().addOnSuccessListener(x->invoke(firebase,name,data,cb))
                   .addOnFailureListener(e->cb.done(new HashMap<>(),"Autenticação indisponível."));
            }else invoke(firebase,name,data,cb);
        }catch(RuntimeException ex){cb.done(new HashMap<>(),"Firebase indisponível.");}
    }
    @SuppressWarnings("unchecked")
    private static void invoke(com.google.firebase.FirebaseApp app,String name,
                               Map<String,Object> data,ResultCallback cb){
        FirebaseFunctions.getInstance(app,"us-central1").getHttpsCallable(name)
            .call(data).addOnSuccessListener((HttpsCallableResult task)->{
                Object value=task.getData();
                if(value instanceof Map)cb.done((Map<String,Object>)value,null);
                else cb.done(new HashMap<>(),"Resposta inválida do servidor.");
            }).addOnFailureListener(e->cb.done(new HashMap<>(),"Falha na validação online."));
    }
}

package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONObject;

/**
 * Counts only successful provider reveal requests observed by this installation.
 * Not an account balance: the provider may be used on the website or elsewhere.
 * Account switching is deliberately NOT inferred from trainer selection.
 */
final class CoordsQuotaStore {
    private static final String PREF="coords-reveal-observed-v1";
    private static final long MAX_OFFICIAL_AGE_MS=120_000L;
    private CoordsQuotaStore(){}
    static void successfulReveal(Context context,JSONObject serverQuota){
        SharedPreferences p=context.getSharedPreferences(PREF,Context.MODE_PRIVATE);
        int old=p.getInt("observed",0);
        SharedPreferences.Editor e=p.edit().putInt("observed",
            old>=1_000_000?1_000_000:old+1);
        // The only accepted authoritative numbers are explicitly reveal-scoped,
        // validated by the same-origin JS policy, and short-lived.
        int limit=serverQuota==null?-1:serverQuota.optInt("limit",-1);
        int remaining=serverQuota==null?-1:serverQuota.optInt("remaining",-1);
        if(serverQuota!=null&&"official".equals(serverQuota.optString("kind"))&&
            limit>0&&limit<=1_000_000&&remaining>=0&&remaining<=limit) {
            e.putInt("officialLimit",limit).putInt("officialRemaining",remaining)
                .putLong("officialSeenAt",System.currentTimeMillis());
        }else{
            e.remove("officialLimit").remove("officialRemaining").remove("officialSeenAt");
        }
        e.apply();
    }
    static JSONObject snapshot(Context context){
        SharedPreferences p=context.getSharedPreferences(PREF,Context.MODE_PRIVATE);
        JSONObject data=new JSONObject();
        try{
            data.put("observedOnDevice",Math.max(0,p.getInt("observed",0)));
            long age=System.currentTimeMillis()-p.getLong("officialSeenAt",0L);
            int max=p.getInt("officialLimit",-1),left=p.getInt("officialRemaining",-1);
            boolean verified=age>=0&&age<=MAX_OFFICIAL_AGE_MS&&max>0&&
                max<=1_000_000&&left>=0&&left<=max;
            data.put("official",verified);
            if(verified){data.put("limit",max);data.put("remaining",left);}
        }catch(Exception ignored){}
        return data;
    }
}

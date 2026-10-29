package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONObject;

/**
 * Local device observations, NOT a PoGoCoordinates account quota.
 * The official remainder, if one is explicitly disclosed on an authenticated
 * reveal, is delivered only in that live callback: never cached across logins.
 * Both Pokeballs use the same app preferences and therefore share this count.
 */
final class CoordsQuotaStore {
    private static final String PREF="coords-reveal-observed-v1";
    private CoordsQuotaStore(){}
    static void successfulReveal(Context context,JSONObject ignoredServerQuota){
        SharedPreferences p=context.getSharedPreferences(PREF,Context.MODE_PRIVATE);
        int old=p.getInt("observed",0);
        p.edit().putInt("observed",old>=1_000_000?1_000_000:old+1)
            // Old LT145 experiments cached an unscoped quota. Remove it.
            .remove("officialLimit").remove("officialRemaining")
            .remove("officialSeenAt").apply();
    }
    static JSONObject snapshot(Context context){
        return snapshot(context,null);
    }
    static JSONObject snapshot(Context context,JSONObject liveQuota){
        SharedPreferences p=context.getSharedPreferences(PREF,Context.MODE_PRIVATE);
        JSONObject data=new JSONObject();
        try{
            data.put("observedOnDevice",Math.max(0,p.getInt("observed",0)));
            int limit=liveQuota==null?-1:liveQuota.optInt("limit",-1);
            int remaining=liveQuota==null?-1:liveQuota.optInt("remaining",-1);
            boolean verified=liveQuota!=null&&
                "official".equals(liveQuota.optString("kind"))&&
                limit>0&&limit<=1_000_000&&remaining>=0&&remaining<=limit;
            data.put("official",verified);
            if(verified){
                data.put("limit",limit);
                data.put("remaining",remaining);
            }
        }catch(Exception ignored){}
        return data;
    }
}

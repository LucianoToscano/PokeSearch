package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;
import android.webkit.WebView;
import android.webkit.CookieManager;
import android.webkit.WebStorage;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import androidx.webkit.ProfileStore;
import androidx.webkit.Profile;

/**
 * Account slots are WebView storage profiles, not merely two login labels.
 * Slot 1 remains Android WebView's Default to preserve all LT169 sessions.
 * Slot 2 is completely isolated on devices supporting MULTI_PROFILE.
 * No bearer token, OAuth cookie or trainer code is copied between slots.
 */
public final class PogoAccountSlots {
    private PogoAccountSlots() {}
    public static final String PROFILE_TWO="pokesearch_pogo_slot2";
    private static final String P1_KEY="pogo_p1_account_slot", P2_KEY="pogo_p2_account_slot";
    public static boolean secondSupported(){
        return WebViewFeature.isFeatureSupported(WebViewFeature.MULTI_PROFILE);
    }
    public static boolean available(int slot){
        return slot==1||(slot==2&&secondSupported());
    }
    public static SharedPreferences prefs(Context context,int slot){
        return context.getSharedPreferences(slot==2?"pogo_account_slot2":"prefs",
            Context.MODE_PRIVATE);
    }
    public static int assigned(Context context,boolean secondary){
        int selected=context.getSharedPreferences("prefs",Context.MODE_PRIVATE)
            .getInt(secondary?P2_KEY:P1_KEY,1);
        return selected==2?2:1;
    }
    public static boolean assign(Context context,boolean secondary,int slot){
        if(!available(slot))return false;
        context.getSharedPreferences("prefs",Context.MODE_PRIVATE).edit()
            .putInt(secondary?P2_KEY:P1_KEY,slot).apply();
        return true;
    }
    /** Must run before ANY evaluateJavascript, getSettings or navigation. */
    public static void bind(WebView view,int slot){
        if(slot==1)return;
        if(!secondSupported())
            throw new IllegalStateException("WebView MULTI_PROFILE unavailable");
        WebViewCompat.setProfile(view,PROFILE_TWO);
    }
    public static CookieManager cookies(int slot){
        if(slot==1)return CookieManager.getInstance();
        if(!secondSupported())
            throw new IllegalStateException("WebView MULTI_PROFILE unavailable");
        return ProfileStore.getInstance().getOrCreateProfile(PROFILE_TWO).getCookieManager();
    }
    public static void flush(int slot){cookies(slot).flush();}
    /** Only clears the chosen account's browser storage and verified identity. */
    public static void signOut(Context ctx,int slot,Runnable done){
        SharedPreferences.Editor edit=prefs(ctx,slot).edit();
        for(String key:new String[]{"sessionStatus","profileDisplayName",
            "profileProvider","profileAvatarUrl","profileTrainerState",
            "profileTrainerName","profileTrainerCode","profileTrainerDetails",
            "profileTrainerList","profileSelectedTrainerCode","profileTrainerTeam",
            "profileTrainerLevel"})edit.remove(key);
        edit.putString("sessionStatus","desconectado").apply();
        if(slot==2&&!secondSupported()){done.run();return;}
        CookieManager cookie=cookies(slot);
        cookie.removeAllCookies(success->{
            cookie.flush();
            if(slot==1)WebStorage.getInstance().deleteAllData();
            else ProfileStore.getInstance().getOrCreateProfile(PROFILE_TWO)
                    .getWebStorage().deleteAllData();
            done.run();
        });
    }
}

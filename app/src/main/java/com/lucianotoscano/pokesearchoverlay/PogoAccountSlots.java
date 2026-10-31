package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;
import android.webkit.CookieManager;
import android.webkit.WebView;
import androidx.webkit.Profile;
import androidx.webkit.ProfileStore;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Account 1 retains Android's existing default WebView profile and original
 * prefs (no migration/logout). Account 2 uses a distinct persistent WebView
 * profile and preferences; it must NEVER fall back to the default cookie jar.
 */
final class PogoAccountSlots {
    static final String NAME_2="pokesearch_pogocoordinates_account_2";
    static final String CHANGE="com.lucianotoscano.pokesearchoverlay.ACCOUNT_BINDING_CHANGED";
    private PogoAccountSlots(){}

    static boolean supportsSecond(){
        return WebViewFeature.isFeatureSupported(WebViewFeature.MULTI_PROFILE);
    }
    static SharedPreferences prefs(Context context,int slot){
        return context.getSharedPreferences(slot==2?"pogo_account_2":"prefs",Context.MODE_PRIVATE);
    }
    static int assigned(Context context,boolean secondary){
        int selected=context.getSharedPreferences("prefs",Context.MODE_PRIVATE)
            .getInt(secondary?"pogoOverlayAccount2":"pogoOverlayAccount1",1);
        return selected==2?2:1;
    }
    static int overlayNumber(boolean secondary){return secondary?2:1;}
    static String trainerSetting(boolean secondary){
        return secondary?"pogoOverlayTrainer2":"pogoOverlayTrainer1";
    }
    static void bind(Context context,boolean secondary,int account,String trainer){
        if(account!=1&&account!=2)throw new IllegalArgumentException("account");
        if(account==2&&!supportsSecond())
            throw new IllegalStateException("WebView does not support isolated account 2");
        if(account==2&&!loggedIn(context,account))
            throw new IllegalStateException("Connect account 2 first");
        String verified=trainer;
        if(verified==null||!verified.matches("[0-9]{12}")||
                !hasTrainer(context,account,verified))verified="";
        context.getSharedPreferences("prefs",Context.MODE_PRIVATE).edit()
            .putInt(secondary?"pogoOverlayAccount2":"pogoOverlayAccount1",account)
            .putString(trainerSetting(secondary),verified).apply();
        android.content.Intent changed=new android.content.Intent(CHANGE)
            .setPackage(context.getPackageName())
            .putExtra("overlay",overlayNumber(secondary));
        context.sendBroadcast(changed);
    }
    /**
     * October 2026 provider state: account-only selection, no active trainer
     * entitlement in the app. Preserve every previous trainer preference for
     * possible future support; switching account must not clear saved links.
     */
    static void bindAccountOnly(Context context,boolean secondary,int account){
        if(account!=1&&account!=2)throw new IllegalArgumentException("account");
        if(account==2&&!supportsSecond())
            throw new IllegalStateException("WebView cannot isolate account 2");
        context.getSharedPreferences("prefs",Context.MODE_PRIVATE).edit()
            .putInt(secondary?"pogoOverlayAccount2":"pogoOverlayAccount1",account).apply();
        android.content.Intent changed=new android.content.Intent(CHANGE)
            .setPackage(context.getPackageName())
            .putExtra("overlay",overlayNumber(secondary));
        context.sendBroadcast(changed);
    }
    static boolean loggedIn(Context context,int slot){
        return "autenticada".equals(prefs(context,slot).getString("sessionStatus",""));
    }
    static String trainer(Context context,boolean secondary){
        int slot=assigned(context,secondary);
        SharedPreferences account=prefs(context,slot);
        SharedPreferences binding=context.getSharedPreferences("prefs",Context.MODE_PRIVATE);
        String key=trainerSetting(secondary);
        // Explicit "Sem treinador" must remain OFF for Shiny, even when
        // the current provider account has a valid linked trainer.
        if(binding.contains(key)){
            String selected=binding.getString(key,"");
            return hasTrainer(context,slot,selected)?selected:"";
        }
        // Preserve pre-LT170 selections only for never-configured overlays.
        String fallback=account.getString("profileTrainerCode","");
        return hasTrainer(context,slot,fallback)?fallback:"";
    }
    static boolean hasTrainer(Context context,int slot,String code){
        if(code==null||!code.matches("[0-9]{12}")||!loggedIn(context,slot))return false;
        try{
            JSONArray list=new JSONArray(prefs(context,slot).getString("profileTrainerList","[]"));
            for(int i=0;i<list.length();i++){
                JSONObject item=list.optJSONObject(i);
                if(item!=null&&code.equals(item.optString("code","")) &&
                   item.optString("name","").matches("[A-Za-z][A-Za-z0-9_.-]{2,39}"))
                   return true;
            }
        }catch(org.json.JSONException ignored){}
        return false;
    }
    /** Call before settings/evaluateJavascript/navigation on the fresh WebView. */
    static void attach(WebView web,int slot){
        if(slot==2){
            if(!supportsSecond())throw new IllegalStateException("No separate WebView profiles");
            WebViewCompat.setProfile(web,NAME_2);
        }
    }
    static CookieManager cookieManager(int slot){
        if(slot==1)return CookieManager.getInstance();
        if(!supportsSecond())throw new IllegalStateException("No separate WebView profiles");
        Profile profile=ProfileStore.getInstance().getOrCreateProfile(NAME_2);
        return profile.getCookieManager();
    }
    static void logout(Context context,int slot,Runnable after){
        if(slot!=1&&slot!=2)throw new IllegalArgumentException("slot");
        SharedPreferences.Editor edit=prefs(context,slot).edit();
        edit.putString("sessionStatus","desconectado");
        for(String key:new String[]{"profileDisplayName","profileProvider","profileAvatarUrl",
            "profileTrainerName","profileTrainerCode","profileTrainerDetails",
            "profileTrainerState","profileTrainerList","profileSelectedTrainerCode",
            "profileTrainerTeam","profileTrainerLevel"})edit.remove(key);
        edit.apply();
        CookieManager cookies=cookieManager(slot);
        cookies.removeAllCookies(success->{
            cookies.flush();
            if(slot==2){
                // Profile-owned storage only: never delete default profile data.
                ProfileStore.getInstance().getOrCreateProfile(NAME_2)
                    .getWebStorage().deleteAllData();
            }else android.webkit.WebStorage.getInstance().deleteAllData();
            if(after!=null)after.run();
        });
        for(boolean secondary:new boolean[]{false,true}){
            if(assigned(context,secondary)!=slot)continue;
            android.content.Intent i=new android.content.Intent(CHANGE)
                .setPackage(context.getPackageName())
                .putExtra("overlay",overlayNumber(secondary));
            context.sendBroadcast(i);
        }
    }
}

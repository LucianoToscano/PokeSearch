package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * LT368: UI preferences for one compact Search Central.
 * Selection never starts an engine or grants Accessibility gesture consent.
 * Isolated by PGSharp/Pokemod profile; unknown hosts are preview-only.
 */
final class PgsSmartSearchSettings {
    static final String MONITOR="monitor", CLICK="click",
        HUNT="hunt", SEQUENCE="sequence";
    private static final String MODE="selected_action",
        GESTURES="gesture_consent", AUTO_TIME="automatic_defaults";
    private PgsSmartSearchSettings(){}

    private static SharedPreferences prefs(Context c){
        String host=PgsAutoHostPolicy.profile(PgsAutoHostSettings.current(c));
        return c.getSharedPreferences("pgs_smart_central_"+host+"_v1",
            Context.MODE_PRIVATE);
    }
    static String normalized(String mode){
        if(CLICK.equals(mode)||HUNT.equals(mode)||SEQUENCE.equals(mode))
            return mode;
        return MONITOR;
    }
    static String mode(Context c){
        return normalized(prefs(c).getString(MODE,MONITOR));
    }
    static void selectMode(Context c,String mode){
        prefs(c).edit().putString(MODE,normalized(mode)).apply();
    }
    static boolean gestureConsent(Context c){
        return prefs(c).getBoolean(GESTURES,false);
    }
    static void setGestureConsent(Context c,boolean enabled){
        prefs(c).edit().putBoolean(GESTURES,enabled).apply();
    }
    static boolean automaticDefaults(Context c){
        return prefs(c).getBoolean(AUTO_TIME,true);
    }
    static void setAutomaticDefaults(Context c,boolean enabled){
        prefs(c).edit().putBoolean(AUTO_TIME,enabled).apply();
    }
}

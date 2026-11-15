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
    // LT370 goals describe user intent, NOT proof of catching or shiny detection.
    static final String GOAL_SHINY="shiny_review";
    static final String GOAL_CATCH="catch_assist";
    static final String GOAL_BOTH="shiny_and_catch_assist";
    static final String SCOPE_ALL="available",SCOPE_FAVORITES="favorites";
    private static final String MODE="selected_action",
        GESTURES="gesture_consent", AUTO_TIME="automatic_defaults",
        GOAL="smart_goal",SCOPE="smart_scope",SMART_REPEAT="smart_repeat";
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
    static String normalizedGoal(String goal){
        if(GOAL_SHINY.equals(goal)||GOAL_CATCH.equals(goal)||
            GOAL_BOTH.equals(goal))return goal;
        return GOAL_SHINY;
    }
    static String goal(Context c){
        return normalizedGoal(prefs(c).getString(GOAL,GOAL_SHINY));
    }
    static void selectGoal(Context c,String goal){
        prefs(c).edit().putString(GOAL,normalizedGoal(goal)).apply();
    }
    static String scope(Context c){
        return SCOPE_ALL.equals(prefs(c).getString(SCOPE,SCOPE_FAVORITES))
            ?SCOPE_ALL:SCOPE_FAVORITES;
    }
    static void selectScope(Context c,String scope){
        prefs(c).edit().putString(SCOPE,
            SCOPE_ALL.equals(scope)?SCOPE_ALL:SCOPE_FAVORITES).apply();
    }
    static boolean repeat(Context c){
        return prefs(c).getBoolean(SMART_REPEAT,true);
    }
    static void setRepeat(Context c,boolean enabled){
        prefs(c).edit().putBoolean(SMART_REPEAT,enabled).apply();
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

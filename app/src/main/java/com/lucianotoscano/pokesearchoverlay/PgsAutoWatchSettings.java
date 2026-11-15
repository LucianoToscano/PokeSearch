package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;

/** Opt-in separado de contas, P1/P2, filtros, Auto Click e alertas Shiny. */
final class PgsAutoWatchSettings {
    private static final String PREF="pgs_auto_watch_v1",KEY="enabled";
    private PgsAutoWatchSettings(){}
    static boolean enabled(Context context){
        return context.getSharedPreferences(PREF,Context.MODE_PRIVATE)
            .getBoolean(KEY,false);
    }
    static void setEnabled(Context context,boolean enabled){
        context.getSharedPreferences(PREF,Context.MODE_PRIVATE).edit()
            .putBoolean(KEY,enabled).apply();
    }
}

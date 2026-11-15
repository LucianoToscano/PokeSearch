package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * LT366: opt-in INDEPENDENTE para PGSharp e Pokemod, nunca misturado com
 * contas Google, P1/P2, filtros nem serviço de notificação do sistema.
 */
final class PgsAutoHuntSettings {
    static final String ENABLED="enabled";
    static final String WAIT="wait_seconds";
    static final String MAX_CLICKS="max_clicks";
    static final String MAP_RETRY="map_capture_retry";
    static final String FIX_MAP="retry_map_capture";
    static final String CLICK_ENABLED="click_confirmed_sprite";
    static final String STOP_IV100="stop_iv100";
    static final String STOP_DITTO="stop_ditto";
    static final String RINGTONE="ringtone";
    static final String VIBRATE="vibrate";
    static final String SHOW_INFO="show_info";
    static final String SHOW_COOLDOWN="show_cooldown";
    private PgsAutoHuntSettings(){}

    static SharedPreferences forCurrent(Context context){
        return forProfile(context,PgsAutoHostSettings.current(context));
    }
    static SharedPreferences forProfile(Context context,String profile){
        // OTHER is preview only; never activate gestures from unknown profiles.
        String type=PgsAutoHostPolicy.profile(profile);
        return context.getSharedPreferences("pgs_hunt_settings_"+type+"_v1",
            Context.MODE_PRIVATE);
    }
    static boolean enabled(Context context){
        String profile=PgsAutoHostSettings.current(context);
        return !PgsAutoHostPolicy.OTHER.equals(profile)&&
            forProfile(context,profile).getBoolean(ENABLED,false);
    }
    static int waitSeconds(Context context){
        return PgsAutoHuntPolicy.waitSeconds(forCurrent(context)
            .getInt(WAIT,PgsAutoHuntPolicy.DEFAULT_WAIT_SECONDS));
    }
    static int maxClicks(Context context){
        return PgsAutoHuntPolicy.maxClicks(forCurrent(context)
            .getInt(MAX_CLICKS,PgsAutoHuntPolicy.DEFAULT_MAX_CLICKS));
    }
    static int mapCaptureRetries(Context context){
        return PgsAutoHuntPolicy.mapCaptureRetries(forCurrent(context)
            .getInt(MAP_RETRY,PgsAutoHuntPolicy.DEFAULT_MAP_CAPTURE_RETRIES));
    }
}

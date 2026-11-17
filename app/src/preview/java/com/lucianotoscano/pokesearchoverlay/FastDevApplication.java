package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.app.Application;
import android.os.Bundle;

/**
 * Preview-only lifecycle hook. Open the real PokeSearch home, not a debug
 * console; discover and prepare signed OTA updates without user navigation.
 * The Android package installer still requires the user's confirmation.
 */
public final class FastDevApplication extends Application
        implements Application.ActivityLifecycleCallbacks {
    @Override public void onCreate(){
        super.onCreate();
        registerActivityLifecycleCallbacks(this);
        FastDevConsoleActivity.scheduleUpdateChecks(this);
    }
    @Override public void onActivityResumed(Activity activity){
        if(!(activity instanceof MainActivity))return;
        FastDevConsoleActivity.tryInstallReady(activity);
        FastDevConsoleActivity.checkAutomatically(activity);
    }
    @Override public void onActivityCreated(Activity activity,Bundle state){}
    @Override public void onActivityStarted(Activity activity){}
    @Override public void onActivityPaused(Activity activity){}
    @Override public void onActivityStopped(Activity activity){}
    @Override public void onActivitySaveInstanceState(Activity activity,Bundle state){}
    @Override public void onActivityDestroyed(Activity activity){}
}

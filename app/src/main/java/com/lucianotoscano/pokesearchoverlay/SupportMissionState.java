package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.PowerManager;
import android.os.SystemClock;
import java.security.SecureRandom;

/** Locally persisted optional mission. No background timer, remote service or donation telemetry. */
public final class SupportMissionState {
    private static final String PREFS = "prefs";
    public static final String OPENS = "support_app_open_count";
    public static final String USAGE = "support_effective_usage_ms";
    public static final String CURRENT = "support_current_style_id";
    public static final String LAST = "support_last_style_id";
    public static final String UNREAD = "support_mission_badge_unread";
    public static final String DISMISSED = "support_mission_dismissed_at_ms";
    public static final String NEXT = "support_mission_next_eligible_at_ms";

    public static final int HIDDEN = 0, NEW = 1, SEEN = 2;
    private static final SecureRandom RANDOM = new SecureRandom();
    // A launcher event is counted once; not on theme, rotation, menu or WebView reload.
    private static long lastLauncherAt = -1;
    private static boolean homeActive = false;
    private static long homeAt = -1;
    private static long lastOverlayInteractionAt = -1;

    private SupportMissionState() {}
    private static SharedPreferences pref(Context context) {
        return context.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }
    private static boolean screenOn(Context c) {
        PowerManager power = (PowerManager)c.getSystemService(Context.POWER_SERVICE);
        return power != null && power.isInteractive();
    }
    /**
     * Only actual Android launcher MAIN/LAUNCHER intents, not task resumes, service
     * callbacks, menus or Activity recreation from an existing saved state.
     */
    public static synchronized void onLauncherIntent(Activity activity, Intent intent, Bundle savedState) {
        if (savedState != null || intent == null ||
            !Intent.ACTION_MAIN.equals(intent.getAction()) ||
            !intent.hasCategory(Intent.CATEGORY_LAUNCHER)) return;
        long now = SystemClock.elapsedRealtime();
        // Ignore duplicate launch intents during one startup; subsequent launches count.
        if (lastLauncherAt >= 0 && now >= lastLauncherAt && now - lastLauncherAt < 3000) return;
        lastLauncherAt = now;
        SharedPreferences p = pref(activity);
        int n = p.getInt(OPENS, 0);
        if (n < Integer.MAX_VALUE) p.edit().putInt(OPENS, n + 1).apply();
    }
    private static void credit(Context c, long millis) {
        if (millis <= 0) return;
        SharedPreferences p = pref(c);
        long old = Math.max(0L, p.getLong(USAGE, 0L));
        p.edit().putLong(USAGE, millis > Long.MAX_VALUE - old ? Long.MAX_VALUE : old + millis).apply();
    }
    /**
     * Only a focused, resumed native Home with the screen interactive accrues time.
     * Called on focus/resume/pause and a five-second UI tick. No background accrual.
     */
    public static synchronized void homeVisibility(Activity a, boolean visible) {
        long now = SystemClock.elapsedRealtime();
        if (homeActive && homeAt >= 0 && screenOn(a)) {
            // Bounded to the observed heartbeat, not a gap while device slept.
            credit(a, Math.min(Math.max(0, now - homeAt), 5500));
        }
        homeActive = visible && screenOn(a);
        homeAt = homeActive ? now : -1;
        if (homeActive) lastOverlayInteractionAt = -1; // never credit simultaneously
    }
    public static synchronized void homeTick(Activity a) {
        if (!homeActive) return;
        if (!screenOn(a)) { homeActive = false; homeAt = -1; return; }
        long now = SystemClock.elapsedRealtime();
        if (homeAt >= 0) credit(a, Math.min(Math.max(0, now - homeAt), 5500));
        homeAt = now;
    }
    /**
     * Overlay time is bounded by actual touches: a touch credits the interval
     * since the previous touch, at most 30s and only within a 60s active window.
     * No credit for passive service, notifications, autorefresh or screen-off.
     */
    public static synchronized void overlayTouch(Context c) {
        long now = SystemClock.elapsedRealtime();
        if (!screenOn(c) || homeActive) { lastOverlayInteractionAt = -1; return; }
        if (lastOverlayInteractionAt >= 0 && now >= lastOverlayInteractionAt) {
            long gap = now - lastOverlayInteractionAt;
            if (gap <= 60000L) credit(c, Math.min(gap, 30000L));
        }
        lastOverlayInteractionAt = now;
    }
    public static synchronized void overlayStopped() { lastOverlayInteractionAt = -1; }

    /** Returns HIDDEN, NEW or SEEN, and creates exactly one persisted cycle when due. */
    public static synchronized int badge(Context context) {
        SharedPreferences p = pref(context);
        if (!SupportMissionPolicy.eligible(p.getInt(OPENS, 0),p.getLong(USAGE,0))) return HIDDEN;
        long now = System.currentTimeMillis();
        long next = p.getLong(NEXT, 0);
        if (SupportMissionPolicy.coolingDown(now, next)) return HIDDEN;
        int style = p.getInt(CURRENT, -1);
        if (style < 0 || style >= SupportMissionPolicy.WEIGHTS.length) {
            int last = p.getInt(LAST, -1);
            int total = SupportMissionPolicy.availableWeight(last);
            style = SupportMissionPolicy.chooseWeighted(last,RANDOM.nextInt(total));
            p.edit().putInt(CURRENT,style).putBoolean(UNREAD,true)
                .remove(DISMISSED).remove(NEXT).apply();
        }
        return p.getBoolean(UNREAD,true) ? NEW : SEEN;
    }
    /** Marks current cycle as seen; does not dismiss or draw another theme. */
    public static synchronized int open(Context context) {
        if (badge(context) == HIDDEN) return -1;
        SharedPreferences p = pref(context);
        int style = p.getInt(CURRENT,-1);
        p.edit().putBoolean(UNREAD,false).apply();
        return style;
    }
    /** User-controlled FUGIR, X or Back: hide both icons for 15 days. */
    public static synchronized void dismiss(Context context) {
        SharedPreferences p = pref(context);
        if (badge(context) == HIDDEN) return;
        int style = p.getInt(CURRENT,-1);
        long now = System.currentTimeMillis();
        p.edit().putInt(LAST,style).putInt(CURRENT,-1).putBoolean(UNREAD,false)
            .putLong(DISMISSED,now)
            .putLong(NEXT,SupportMissionPolicy.nextEligibleAt(now)).apply();
    }
}

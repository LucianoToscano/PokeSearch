package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;

/** Offline expiry gate ONLY for the isolated WhatsApp beta, with no UI alert. */
public final class FriendsExpiryGuard {
    // 2026-10-21 19:53 BRT -> 2026-11-10 19:53 BRT (20 days).
    private static final long START_UTC_MILLIS = 1_792_623_180_000L;
    private static final long EXPIRY_UTC_MILLIS = 1_794_351_180_000L;
    private static final long MAX_CLOCK_ROLLBACK_MILLIS = 120_000L;
    private static final String STORE = "friends_beta_clock_v1";
    private static final String HIGH_WATER_MARK = "latest_utc";
    private FriendsExpiryGuard() {}

    public static synchronized boolean isAllowed(Context context) {
        if (context == null) return false;
        long now = System.currentTimeMillis();
        if (now < START_UTC_MILLIS || now >= EXPIRY_UTC_MILLIS) return false;
        SharedPreferences preferences = context.getSharedPreferences(STORE, Context.MODE_PRIVATE);
        long highest = preferences.getLong(HIGH_WATER_MARK, 0L);
        if (highest > now && highest - now > MAX_CLOCK_ROLLBACK_MILLIS) return false;
        if (now > highest) {
            // Synchronous write reduces trivial rollback across force-stop and restart.
            if (!preferences.edit().putLong(HIGH_WATER_MARK, now).commit()) return false;
        }
        return true;
    }
}

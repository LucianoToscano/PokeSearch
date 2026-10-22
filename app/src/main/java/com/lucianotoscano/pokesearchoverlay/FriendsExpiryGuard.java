package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.SystemClock;

/** Silent offline distribution deadline; compiled build timestamp is immutable across reinstalls. */
public final class FriendsExpiryGuard {
    private static final long MAX_ROLLBACK_MILLIS = 120_000L;
    private static final String STORE = "pokesearch_friends_clock_v2";
    private static final String HIGHEST_WALL_TIME = "highest_wall_utc";
    private static long lastWallUtcMillis = -1L;
    private static long lastElapsedMillis = -1L;
    private FriendsExpiryGuard() {}

    public static synchronized boolean isAllowed(Context context) {
        if (!BuildConfig.FRIENDS_DISTRIBUTION) return true;
        if (context == null) return false;
        long build = BuildConfig.FRIENDS_BUILD_UTC_MILLIS;
        long expiry = BuildConfig.FRIENDS_EXPIRY_UTC_MILLIS;
        if (build <= 0L || expiry - build != 15L * 24 * 60 * 60 * 1000) return false;
        long now = System.currentTimeMillis();
        if (now < build || now >= expiry) return false;
        long elapsed = SystemClock.elapsedRealtime();
        if (lastWallUtcMillis > 0L && lastElapsedMillis >= 0L &&
                elapsed >= lastElapsedMillis &&
                now + MAX_ROLLBACK_MILLIS < lastWallUtcMillis + (elapsed - lastElapsedMillis))
            return false;
        SharedPreferences state = context.getSharedPreferences(STORE, Context.MODE_PRIVATE);
        long highest = state.getLong(HIGHEST_WALL_TIME, 0L);
        if (highest > now && highest - now > MAX_ROLLBACK_MILLIS) return false;
        if (now > highest && (highest == 0L || now - highest >= 60_000L)) {
            if (!state.edit().putLong(HIGHEST_WALL_TIME, now).commit()) return false;
        }
        lastWallUtcMillis = now;
        lastElapsedMillis = elapsed;
        return true;
    }
}

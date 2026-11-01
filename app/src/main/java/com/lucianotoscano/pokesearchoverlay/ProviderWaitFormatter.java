package com.lucianotoscano.pokesearchoverlay;

/** Display-only formatter; never alters the provider's rate-limit deadline. */
final class ProviderWaitFormatter {
    private ProviderWaitFormatter() {}

    static String format429(long remainingSeconds) {
        long seconds = Math.max(1L, remainingSeconds);
        if (seconds >= 3600L) {
            // Round total minutes before splitting into hours/minutes.
            // Avoid overflow for unexpectedly large Retry-After values.
            long totalMinutes = seconds / 60L + (seconds % 60L == 0L ? 0L : 1L);
            return "API 429 · " + (totalMinutes / 60L) + "h" +
                (totalMinutes % 60L) + "m";
        }
        return "API 429 · " + (seconds / 60L) + "m" +
            String.format(java.util.Locale.US, "%02d", seconds % 60L) + "s";
    }
}

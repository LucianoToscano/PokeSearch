package com.lucianotoscano.pokesearchoverlay;

/** Pure rules: independently testable without Android, network or Firebase. */
public final class SupportMissionPolicy {
    public static final int REQUIRED_OPENS = 3;
    public static final long REQUIRED_USAGE_MS = 10L * 60L * 1000L;
    public static final long COOLDOWN_MS = 15L * 24L * 60L * 60L * 1000L;
    public static final int[] WEIGHTS = {40, 30, 20, 10};
    private SupportMissionPolicy() {}

    /** Credit only a recent, interactive interval between real overlay touches. */
    public static long overlayTouchCredit(long previousAtMs, long nowMs, boolean screenInteractive) {
        if (!screenInteractive || previousAtMs < 0 || nowMs < previousAtMs) return 0L;
        long gap = nowMs - previousAtMs;
        return gap <= 60000L ? Math.min(gap, 30000L) : 0L;
    }

    public static boolean eligible(int opens, long effectiveUsageMs) {
        return opens >= REQUIRED_OPENS && effectiveUsageMs >= REQUIRED_USAGE_MS;
    }
    public static boolean coolingDown(long nowMs, long nextEligibleAtMs) {
        return nextEligibleAtMs > 0 && nowMs < nextEligibleAtMs;
    }
    public static long nextEligibleAt(long dismissedAtMs) {
        if (dismissedAtMs <= 0) return 0;
        return dismissedAtMs > Long.MAX_VALUE - COOLDOWN_MS
            ? Long.MAX_VALUE : dismissedAtMs + COOLDOWN_MS;
    }
    public static int availableWeight(int previousStyle) {
        int total = 0;
        for (int i = 0; i < WEIGHTS.length; i++)
            if (i != previousStyle) total += WEIGHTS[i];
        return total;
    }
    /** Ticket range [0, availableWeight(previousStyle)); never repeat last style. */
    public static int chooseWeighted(int previousStyle, int ticket) {
        int total = availableWeight(previousStyle);
        if (ticket < 0 || ticket >= total)
            throw new IllegalArgumentException("Invalid weighted draw");
        for (int i = 0; i < WEIGHTS.length; i++) {
            if (i == previousStyle) continue;
            if (ticket < WEIGHTS[i]) return i;
            ticket -= WEIGHTS[i];
        }
        throw new IllegalStateException("Impossible draw");
    }
}

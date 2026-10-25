package com.lucianotoscano.pokesearchoverlay;

/** Pure pixel-spacing policy shared by the dock anchor and native results width.
 * The old Editor Visual slider stored a row pitch whose neutral point is 31.
 * Pixel additions only start ABOVE that neutral baseline.
 */
final class ResultsSpacingPolicy {
    static final int DEFAULT_TOP_GAP_PX = 2;
    static final int LEGACY_NEUTRAL_ROW_SPACING = 31;
    static final int MAX_ADDITIONAL_GAP_PX = 34;

    private ResultsSpacingPolicy() {}

    static int additionalRowGapPx(int storedSpacing) {
        return Math.max(0, Math.min(MAX_ADDITIONAL_GAP_PX,
            storedSpacing - LEGACY_NEUTRAL_ROW_SPACING));
    }
}

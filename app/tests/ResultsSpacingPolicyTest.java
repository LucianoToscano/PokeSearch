package com.lucianotoscano.pokesearchoverlay;

public final class ResultsSpacingPolicyTest {
    private static int checks = 0;
    private static void equal(int expected, int actual, String label) {
        if (actual != expected) throw new AssertionError(label
            + ": expected=" + expected + ", actual=" + actual);
        checks++;
    }
    public static void main(String[] args) {
        equal(2, ResultsSpacingPolicy.DEFAULT_TOP_GAP_PX,
            "Pokeball to list normal physical px gap");
        equal(0, ResultsSpacingPolicy.additionalRowGapPx(31),
            "legacy neutral preference never makes 31px card gaps");
        equal(0, ResultsSpacingPolicy.additionalRowGapPx(0),
            "old zero preference cannot create negative gap");
        equal(0, ResultsSpacingPolicy.additionalRowGapPx(30),
            "below-neutral setting is compact");
        equal(1, ResultsSpacingPolicy.additionalRowGapPx(32),
            "one pixel of explicitly added row gap");
        equal(2, ResultsSpacingPolicy.additionalRowGapPx(33),
            "two pixels of explicitly added row gap");
        equal(19, ResultsSpacingPolicy.additionalRowGapPx(50),
            "user-configured spacing is preserved as explicit extra gap");
        equal(34, ResultsSpacingPolicy.additionalRowGapPx(65),
            "maximum configured spacing");
        equal(34, ResultsSpacingPolicy.additionalRowGapPx(99),
            "out-of-range values fail clamped");
        System.out.println("LT77 Stage 2 ResultsSpacingPolicyTest: "
            + checks + "/" + checks + " PASS");
    }
}

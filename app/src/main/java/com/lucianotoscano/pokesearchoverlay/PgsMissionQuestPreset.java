package com.lucianotoscano.pokesearchoverlay;

import java.util.Locale;

/**
 * LT408.1: explicit field-research preset observed in the owner's
 * PoGo Coordinates screenshots. A search result is not a completed quest.
 * No web scraping, client-control, or automatic candy attribution.
 */
final class PgsMissionQuestPreset {
    static final String SOURCE="PoGo Coordinates";
    static final String REWARD_TYPE="Candy";
    static final String SPECIES="Eternatus";
    static final int DEX=890;
    static final String TASK="Make an Excellent Throw";
    static final int CANDY_COUNT=25;
    static final int SCREENSHOT_FREE_RESULT_LIMIT=10;

    private PgsMissionQuestPreset(){}

    private static String normalized(String value){
        return value==null?"":value.trim().replaceAll("\\s+"," ")
            .toLowerCase(Locale.ROOT);
    }

    /** Compares the selected site fields; no fuzzy pokemon/quest substitution. */
    static boolean matchesSiteSelection(String rewardType,String species,String task){
        return normalized(REWARD_TYPE).equals(normalized(rewardType))
            && (normalized(SPECIES).equals(normalized(species))
                || "#890".equals(normalized(species))
                || "890".equals(normalized(species)))
            && normalized(TASK).equals(normalized(task));
    }

    /**
     * Matches the exact visible reward label, e.g. "Eternatus Candy ×25".
     * Coordinates alone, "Candy" or an unrelated species never qualify.
     */
    static boolean matchesVisibleReward(String rewardLabel){
        return normalized(rewardLabel)
            .matches("^eternatus candy\\s*[x×]\\s*25$");
    }

    static String copyableFilter(){
        return "PoGo Coordinates > Quests\n"
            +"Reward type: Candy\n"
            +"Candy Pokémon: Eternatus (#890)\n"
            +"Task: Make an Excellent Throw\n"
            +"Expected quest reward: Eternatus Candy x25";
    }

    static int fullTrios(int confirmedRewards){
        return Math.max(0,confirmedRewards)/3;
    }
}

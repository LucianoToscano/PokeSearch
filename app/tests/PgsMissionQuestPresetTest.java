package com.lucianotoscano.pokesearchoverlay;

public final class PgsMissionQuestPresetTest {
    private static void ok(boolean value,String message){
        if(!value)throw new AssertionError(message);
    }
    public static void main(String[] args){
        ok(PgsMissionQuestPreset.DEX==890,"Eternatus dex");
        ok(PgsMissionQuestPreset.CANDY_COUNT==25,"screenshot candy count");
        ok(PgsMissionQuestPreset.SCREENSHOT_FREE_RESULT_LIMIT==10,
            "screenshot free account limit, not GPX cap");
        ok(PgsMissionQuestPreset.matchesSiteSelection(
            "Candy","Eternatus","Make an Excellent Throw"),"correct site selection");
        ok(PgsMissionQuestPreset.matchesSiteSelection(
            " CANDY ","#890"," Make  an  Excellent  Throw "),
            "normalizes extra whitespace and dex label");
        ok(!PgsMissionQuestPreset.matchesSiteSelection(
            "Pokemon","Eternatus","Make an Excellent Throw"),"wrong type rejected");
        ok(!PgsMissionQuestPreset.matchesSiteSelection(
            "Candy","Scorbunny","Make an Excellent Throw"),"wrong pokemon rejected");
        ok(!PgsMissionQuestPreset.matchesSiteSelection(
            "Candy","Eternatus","Catch Pokemon"),"wrong task rejected");
        ok(!PgsMissionQuestPreset.matchesSiteSelection(
            "Candy","Eternatus",null),"empty task rejected");
        ok(PgsMissionQuestPreset.matchesVisibleReward(
            "Eternatus Candy ×25"),"screen reward label");
        ok(PgsMissionQuestPreset.matchesVisibleReward(
            "  Eternatus Candy x 25 "),"ASCII reward label");
        ok(!PgsMissionQuestPreset.matchesVisibleReward(
            "Eternatus Candy x5"),"wrong quantity rejected");
        ok(!PgsMissionQuestPreset.matchesVisibleReward(
            "Scorbunny Candy x25"),"wrong species rejected");
        ok(!PgsMissionQuestPreset.matchesVisibleReward(
            "Candy x25"),"missing species rejected");
        ok(!PgsMissionQuestPreset.matchesVisibleReward(
            null),"null label rejected");
        ok(PgsMissionQuestPreset.fullTrios(0)==0,"zero redeemed");
        ok(PgsMissionQuestPreset.fullTrios(2)==0,"incomplete trio");
        ok(PgsMissionQuestPreset.fullTrios(3)==1,"one completed trio");
        ok(PgsMissionQuestPreset.fullTrios(10)==3,"free screenshot batch");
        ok(PgsMissionQuestPreset.fullTrios(500)==166,"larger GPX supported");
        System.out.println("LT408 PoGo Coordinates Eternatus screenshot preset PASS");
    }
}

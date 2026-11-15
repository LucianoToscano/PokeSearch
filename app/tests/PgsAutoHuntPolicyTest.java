package com.lucianotoscano.pokesearchoverlay;

public final class PgsAutoHuntPolicyTest {
    static void ok(boolean condition,String label){
        if(!condition)throw new AssertionError(label);
    }
    public static void main(String[] args){
        ok(PgsAutoHuntPolicy.waitSeconds(35)==35,"35s option exact");
        ok(PgsAutoHuntPolicy.waitSeconds(0)==35,"invalid wait default");
        ok(PgsAutoHuntPolicy.waitSeconds(181)==35,"wait bounded");
        ok(PgsAutoHuntPolicy.maxClicks(10)==10,"10 clicks bounded");
        ok(PgsAutoHuntPolicy.maxClicks(100)==10,"over-limit defaults");
        ok(PgsAutoHuntPolicy.mapCaptureRetries(3)==3,"up to 3 frame retries");
        ok(!PgsAutoHuntPolicy.mayKeepScanning(true,10,10),"must stop on cap");
        ok(PgsAutoHuntPolicy.mayKeepScanning(true,9,10),"one remains");
        ok(PgsAutoHuntPolicy.mayKeepScanning(false,100,1),
            "non Auto Hunt uses unchanged engine");
        ok(PgsAutoHuntPolicy.nextDelayMs(true,35)==35000L,"manual wait");
        ok(PgsAutoHuntPolicy.nextDelayMs(false,35)==500L,"legacy interval");
        ok(PgsAutoHuntPolicy.mentionsExactTarget(
            "Pikachu IV:100 CP:999","Pikachu"),"word match");
        ok(!PgsAutoHuntPolicy.mentionsExactTarget(
            "Not Pikachus IV:100","Pikachu"),"no substring match");
        ok(PgsAutoHuntPolicy.IV100.equals(PgsAutoHuntPolicy.explicitNotice(
            "IV:100 Pikachu","Pikachu")),"IV100 with exact target");
        ok(PgsAutoHuntPolicy.IV100.equals(PgsAutoHuntPolicy.explicitNotice(
            "Pikachu 15/15/15","Pikachu")),"IV100 three stats");
        ok(PgsAutoHuntPolicy.NONE.equals(PgsAutoHuntPolicy.explicitNotice(
            "IV:100 Charizard","Pikachu")),"other species ignored");
        ok(PgsAutoHuntPolicy.NONE.equals(PgsAutoHuntPolicy.explicitNotice(
            "Great Pikachu","Pikachu")),"no inferred perfect");
        ok(PgsAutoHuntPolicy.DITTO.equals(PgsAutoHuntPolicy.explicitNotice(
            "Found Ditto","Ditto")),"explicit Ditto detection");
        ok(PgsAutoHuntPolicy.NONE.equals(PgsAutoHuntPolicy.explicitNotice(
            "Looking for Ditto","Ditto")),"generic mention no evidence");
        ok(PgsAutoHuntPolicy.NONE.equals(PgsAutoHuntPolicy.explicitNotice(
            "Found Ditto","Pikachu")),"target mismatch");
        System.out.println("LT366 per-profile Auto Hunt policy, wait and conservative signals PASS");
    }
}

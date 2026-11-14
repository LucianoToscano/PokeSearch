package com.lucianotoscano.pokesearchoverlay;
public final class PgsAutoTargetPolicyTest {
    private static void eq(boolean actual,boolean expected,String label){
        if(actual!=expected)throw new AssertionError(label+" expected "+expected+" actual "+actual);
    }
    private static void eq(int actual,int expected,String label){
        if(actual!=expected)throw new AssertionError(label+" expected "+expected+" actual "+actual);
    }
    public static void main(String[] args){
        eq(PgsAutoTargetPolicy.mode("POINT")==PgsAutoTargetPolicy.Mode.POINT,true,"point");
        eq(PgsAutoTargetPolicy.mode("broken")==PgsAutoTargetPolicy.Mode.SPRITE,true,"fallback");
        eq(PgsAutoTargetPolicy.valid(.5f,.5f,1080,2340,1080,2340),true,"screen match");
        eq(PgsAutoTargetPolicy.valid(.5f,.5f,1080,2340,2340,1080),false,"orientation invalidates");
        eq(PgsAutoTargetPolicy.valid(.5f,.05f,1080,2340,1080,2340),false,"top bar unsafe");
        eq(PgsAutoTargetPolicy.pointX(.5f,1080),540,"x");
        eq(PgsAutoTargetPolicy.pointY(.5f,2340,PgsAutoTargetPolicy.Mode.POKESTOP,24),1194,"offset");
        eq(PgsAutoTargetPolicy.safeToTap(true,true,true,true),false,"manual passenger prompt");
        eq(PgsAutoTargetPolicy.safeToTap(true,false,true,true),true,"all conditions");
        eq(PgsAutoTargetPolicy.shouldRepeat(PgsAutoTargetPolicy.Trigger.NO_SHINY,true,false,false,true),false,"no inferred shiny absence");
        eq(PgsAutoTargetPolicy.shouldRepeat(PgsAutoTargetPolicy.Trigger.NO_SHINY,true,false,true,false),true,"explicit shiny check");
        eq(PgsAutoTargetPolicy.shouldRepeat(PgsAutoTargetPolicy.Trigger.TIMER,false,false,true,true),false,"never click without map");
        System.out.println("LT345 PGS target policy PASS");
    }
}

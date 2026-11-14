package com.lucianotoscano.pokesearchoverlay;

public final class PgsAutoCyclePolicyTest {
    static int checks=0;
    static void check(boolean condition,String description){
        checks++;if(!condition)throw new AssertionError(description);
    }
    public static void main(String[] args){
        check(PgsAutoCyclePolicy.mapTimeoutSeconds(60)==60,"timeout default");
        check(PgsAutoCyclePolicy.mapTimeoutSeconds(999)==60,"timeout invalid");
        check(PgsAutoCyclePolicy.shinyCheckSeconds(2)==2,"shiny check 2");
        check(PgsAutoCyclePolicy.shinyCheckSeconds(120)==2,"check invalid");
        check(!PgsAutoCyclePolicy.mapTimedOut(59000,1000,60),"not yet timeout");
        check(PgsAutoCyclePolicy.mapTimedOut(61000,1000,60),"timeout exact");
        check(!PgsAutoCyclePolicy.readyToAdvance(1999,1000,2),"not 2s");
        check(PgsAutoCyclePolicy.readyToAdvance(3000,1000,2),"2s advance");
        check(!PgsAutoCyclePolicy.readyToAdvance(9000,0,2),"unknown map");
        check(PgsAutoCyclePolicy.shouldPauseForTarget("Shiny found: Lucario","Lucario",true,true),
            "lucario shiny confirmed");
        check(PgsAutoCyclePolicy.shouldPauseForTarget("Lucario shiny detected","Lucario",true,true),
            "reordered name");
        check(PgsAutoCyclePolicy.shouldPauseForTarget("Brilhante encontrado: Lucario","Lucario",true,true),
            "Portuguese positive");
        check(!PgsAutoCyclePolicy.shouldPauseForTarget("Shiny found: Pikachu","Lucario",true,true),
            "another species");
        check(!PgsAutoCyclePolicy.shouldPauseForTarget("Shiny: true","Lucario",true,true),
            "unknown species");
        check(!PgsAutoCyclePolicy.shouldPauseForTarget("Shiny found: Lucarion","Lucario",true,true),
            "not substring");
        check(!PgsAutoCyclePolicy.shouldPauseForTarget("Shiny found: Lucario","Lucario",true,false),
            "not at target");
        check(!PgsAutoCyclePolicy.shouldPauseForTarget("Shiny found: Lucario","Lucario",false,true),
            "not running");
        check(!PgsAutoCyclePolicy.shouldPauseForTarget("Shiny found: Lucario","",true,true),
            "missing target");
        check(!PgsAutoCyclePolicy.shouldPauseForTarget("Not shiny: Lucario","Lucario",true,true),
            "negative");
        check(PgsAutoCyclePolicy.EMPTY_FEED_RETRY_SECONDS==3,"automatic empty feed retry");
        System.out.println("PGS Cycle Policy "+checks+"/"+checks+" PASS");
    }
}

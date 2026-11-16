package com.lucianotoscano.pokesearchoverlay;

/** Pure no-Android safety tests for PGSharp/Pokemod visual proof. */
public final class PgsAutoHostProbePolicyTest {
    private static void eq(Object expected,Object actual,String name){
        if(!expected.equals(actual))
            throw new AssertionError(name+": expected "+expected+" got "+actual);
    }
    private static void yes(boolean expected,boolean actual,String name){
        if(expected!=actual)throw new AssertionError(name);
    }
    public static void main(String[] args){
        eq(PgsAutoHostPolicy.OTHER,
            PgsAutoHostProbePolicy.choose(false,false),"no evidence");
        eq(PgsAutoHostPolicy.OTHER,
            PgsAutoHostProbePolicy.choose(true,true),"ambiguous matches");
        eq(PgsAutoHostPolicy.PGSHARP,
            PgsAutoHostProbePolicy.choose(true,false),"pgsharp stable");
        eq(PgsAutoHostPolicy.POKEMOD,
            PgsAutoHostProbePolicy.choose(false,true),"pokemod stable");
        yes(false,PgsAutoHostProbePolicy.safeToProbe(false,false,false,1,0),
            "no game");
        yes(false,PgsAutoHostProbePolicy.safeToProbe(true,true,false,1,0),
            "safety warning");
        yes(false,PgsAutoHostProbePolicy.safeToProbe(true,false,true,1,0),
            "running");
        yes(false,PgsAutoHostProbePolicy.safeToProbe(true,false,false,0,0),
            "no images");
        yes(true,PgsAutoHostProbePolicy.safeToProbe(true,false,false,0,1),
            "pokemod model");
        System.out.println("LT370 host visual proof 9/9 PASS");
    }
}
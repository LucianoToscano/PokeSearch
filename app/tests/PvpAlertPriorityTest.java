package com.lucianotoscano.pokesearchoverlay;

public final class PvpAlertPriorityTest {
    private static void check(boolean value,String message) {
        if(!value)throw new AssertionError(message);
    }
    public static void main(String[] args) {
        check(PvpAlertPriority.verifiedClassRank("gl",true,true,"#1",1)==1,"GL #1");
        check(PvpAlertPriority.verifiedClassRank("ul",true,true,"10",10)==10,"UL #10");
        check(PvpAlertPriority.verifiedClassRank("gl",true,true,"#50",50)==50,"GL #50");
        check(PvpAlertPriority.verifiedClassRank("gl",true,true,"#51",50)==0,"invalid rank");
        check(PvpAlertPriority.verifiedClassRank("gl",true,true,"#2",1)==0,"over limit");
        check(PvpAlertPriority.verifiedClassRank("gl",false,true,"1",50)==0,"unconfirmed");
        check(PvpAlertPriority.verifiedClassRank("gl",true,false,"1",50)==0,"unverified target");
        check(PvpAlertPriority.verifiedClassRank("ml",true,true,"1",50)==0,"unsupported ML filter");
        check(PvpAlertPriority.verifiedClassRank("gl",true,true,"RG #1",50)==0,"not overall rank");
        check(PvpAlertPriority.verifiedClassRank("gl",true,true,"",50)==0,"missing rank");
        check(PvpAlertPriority.higherPriority(1,5),"prioritize Top1");
        check(!PvpAlertPriority.higherPriority(5,1),"do not downgrade Top1");
        check(!PvpAlertPriority.higherPriority(0,1),"unknown rank ignored");
        // LT325: ordering of an EXISTING alert, never a new channel.
        check(PvpAlertPriority.verifiedHundo(true,true,"15/15/15","100"),
            "verified perfect with consistent percent");
        check(PvpAlertPriority.verifiedHundo(true,true,"15/15/15",""),
            "verified raw perfect with missing optional percent");
        check(PvpAlertPriority.verifiedHundo(true,true,"15/15/15","100.00"),
            "verified raw perfect with precise percent");
        check(!PvpAlertPriority.verifiedHundo(false,true,"15/15/15","100"),
            "unconfirmed source ignored");
        check(!PvpAlertPriority.verifiedHundo(true,false,"15/15/15","100"),
            "unverified encounter ignored");
        check(!PvpAlertPriority.verifiedHundo(true,true,"14/15/15","100"),
            "rounded percentage cannot invent perfect");
        check(!PvpAlertPriority.verifiedHundo(true,true,"15/15/15","98"),
            "contradictory percentage ignored");
        check(PvpAlertPriority.higherValuePriority(0,true,0,false),
            "verified Hundo outranks ordinary result in existing slot");
        check(!PvpAlertPriority.higherValuePriority(0,false,0,true),
            "ordinary cannot suppress a Hundo");
        check(PvpAlertPriority.higherValuePriority(1,false,0,true),
            "verified Top PvP retains priority above Hundo");
        check(!PvpAlertPriority.higherValuePriority(0,true,1,false),
            "Hundo cannot suppress verified Top PvP");
        check(PvpAlertPriority.higherValuePriority(1,false,5,false),
            "Top 1 still outranks Top 5");
        check(!PvpAlertPriority.higherValuePriority(10,true,1,false),
            "Top 1 still wins even if candidate is Hundo");
        System.out.println("LT325 PvpAlertPriority: 26 cases PASS");
    }
}

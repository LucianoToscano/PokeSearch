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
        System.out.println("LT253 PvpAlertPriority: 13 cases PASS");
    }
}

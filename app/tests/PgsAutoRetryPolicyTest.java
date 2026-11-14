package com.lucianotoscano.pokesearchoverlay;

public final class PgsAutoRetryPolicyTest {
    private static void check(boolean ok,String what){
        if(!ok)throw new AssertionError(what);
    }
    public static void main(String[] args){
        check(PgsAutoRetryPolicy.delaySeconds(0,60,120,120)==60,"first at 60 seconds");
        check(PgsAutoRetryPolicy.delaySeconds(1,60,120,120)==60,"second at 120 total seconds");
        check(PgsAutoRetryPolicy.delaySeconds(2,60,120,120)==120,"repeat every 120 seconds");
        check(PgsAutoRetryPolicy.delaySeconds(9,60,120,180)==180,"configurable loop");
        check(PgsAutoRetryPolicy.delaySeconds(1,120,60,120)==1,"monotonic second target");
        check(!PgsAutoRetryPolicy.shouldPauseOnEmpty(),"empty list never pauses");
        System.out.println("PASS PGS: revarredura 60/120, ciclo e lista vazia");
    }
}

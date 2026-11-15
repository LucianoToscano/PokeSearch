package com.lucianotoscano.pokesearchoverlay;

public final class PgsAutoScanDeadlinePolicyTest {
    private static void check(boolean value,String description){
        if(!value)throw new AssertionError(description);
    }
    public static void main(String[] args){
        check(!PgsAutoScanDeadlinePolicy.exceeded(100,100,4500),"fresh scan");
        check(!PgsAutoScanDeadlinePolicy.exceeded(100,4600,4500),"boundary allowed");
        check(PgsAutoScanDeadlinePolicy.exceeded(100,4601,4500),"over deadline fails closed");
        check(PgsAutoScanDeadlinePolicy.exceeded(100,99,4500),"clock rollback fails closed");
        check(PgsAutoScanDeadlinePolicy.exceeded(-1,500,4500),"invalid start fails closed");
        check(PgsAutoScanDeadlinePolicy.exceeded(100,101,-1),"invalid limit fails closed");
        check(!PgsAutoScanDeadlinePolicy.candidateLimitExceeded(256,256),"exact candidate ceiling");
        check(PgsAutoScanDeadlinePolicy.candidateLimitExceeded(257,256),"overflow fails closed");
        check(PgsAutoScanDeadlinePolicy.candidateLimitExceeded(-1,256),"negative count rejected");
        System.out.println("LT358 hard deadline and candidates 9/9 PASS");
    }
}

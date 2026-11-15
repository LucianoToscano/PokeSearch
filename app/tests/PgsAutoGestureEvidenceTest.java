package com.lucianotoscano.pokesearchoverlay;

/** Executável no Java 17, sem Android ou simulação de PGSharp. */
public final class PgsAutoGestureEvidenceTest {
    private static void check(boolean condition,String why){
        if(!condition)throw new AssertionError(why);
    }
    public static void main(String[] args){
        int[] before={20,40,60,80,100,120};
        int[] unchanged={20,40,60,80,100,120};
        int[] slight={22,42,62,82,102,122};
        int[] changed={80,100,120,140,160,180};
        check(PgsAutoGestureEvidence.meanColorDelta(before,unchanged)==0f,
            "unchanged scene delta must be zero");
        check(!PgsAutoGestureEvidence.visualChangeCandidate(before,unchanged),
            "stable unchanged map is not game response evidence");
        check(!PgsAutoGestureEvidence.visualChangeCandidate(before,slight),
            "minor UI noise is not sufficient response evidence");
        check(PgsAutoGestureEvidence.visualChangeCandidate(before,changed),
            "large enough observed scene change is a candidate, not teleport proof");
        check(!PgsAutoGestureEvidence.visualChangeCandidate(before,new int[]{1}),
            "display size/orientation mismatch must fail closed");
        check(!PgsAutoGestureEvidence.canCountMapAsNew(true,false,true,true),
            "unchanged map cannot advance sprite visit");
        check(PgsAutoGestureEvidence.canCountMapAsNew(true,true,true,true),
            "changed populated stable map can continue normal readiness checks");
        check(!PgsAutoGestureEvidence.canCountMapAsNew(true,true,false,true),
            "changed but unstable map cannot advance");
        check(PgsAutoGestureEvidence.canCountMapAsNew(false,false,true,true),
            "fixed target existing map policy remains unchanged");
        check(PgsAutoGestureEvidence.shouldStopForNoResponse(true,true,false),
            "sprite without visual response must stop after timeout");
        check(!PgsAutoGestureEvidence.shouldStopForNoResponse(false,true,false),
            "fixed target timeout policy unaffected");
        check(!PgsAutoGestureEvidence.shouldStopForNoResponse(true,false,false),
            "do not prematurely stop before timeout");
        System.out.println("LT354: scene evidence and safe stop PASS");
    }
}

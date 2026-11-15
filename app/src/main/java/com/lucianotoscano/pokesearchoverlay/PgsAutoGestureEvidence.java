package com.lucianotoscano.pokesearchoverlay;

/**
 * LT354: strictly local, non-teleport evidence about game scene changes.
 * A visual change is a clue, NOT proof that a PGSharp click or teleport worked.
 * False positives are safer to reject than blindly tap another sprite.
 */
final class PgsAutoGestureEvidence {
    private static final float MIN_SCENE_DELTA=18f;
    private PgsAutoGestureEvidence(){}

    static float meanColorDelta(int[] before,int[] after){
        if(before==null||after==null||before.length==0||
           before.length!=after.length)return 0f;
        long total=0;
        for(int i=0;i<before.length;i++)
            total+=Math.abs(before[i]-after[i]);
        return total/(float)before.length;
    }

    static boolean visualChangeCandidate(int[] before,int[] after){
        return meanColorDelta(before,after)>MIN_SCENE_DELTA;
    }

    static boolean canCountMapAsNew(boolean spriteMode,boolean visualChange,
        boolean stable,boolean populated){
        return stable&&populated&&(!spriteMode||visualChange);
    }

    static boolean shouldStopForNoResponse(boolean spriteMode,
        boolean timedOut,boolean visualChange){
        return spriteMode&&timedOut&&!visualChange;
    }
}

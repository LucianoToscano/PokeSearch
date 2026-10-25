package com.lucianotoscano.pokesearchoverlay;

public final class SupportMissionPolicyTest {
    private static int tests=0;
    private static void check(boolean ok,String name){
        if(!ok)throw new AssertionError(name);
        tests++;
    }
    public static void main(String[] args){
        check(!SupportMissionPolicy.eligible(2,600_000L),"2 opens and 10 minutes hidden");
        check(!SupportMissionPolicy.eligible(3,540_000L),"3 opens 9 minutes hidden");
        check(SupportMissionPolicy.eligible(3,600_000L),"3 opens 10 minutes eligible");
        check(!SupportMissionPolicy.coolingDown(100L,0L),"no cooldown initially");
        check(SupportMissionPolicy.overlayTouchCredit(-1L,1000L,true)==0L,
            "first overlay touch never credits earlier time");
        check(SupportMissionPolicy.overlayTouchCredit(1000L,2000L,false)==0L,
            "screen-off gap credits nothing");
        check(SupportMissionPolicy.overlayTouchCredit(1000L,3000L,true)==2000L,
            "short overlay interaction credits exact interval");
        check(SupportMissionPolicy.overlayTouchCredit(1000L,41000L,true)==30000L,
            "overlay interval capped at thirty seconds");
        check(SupportMissionPolicy.overlayTouchCredit(1000L,61000L,true)==30000L,
            "sixty-second active window is inclusive");
        check(SupportMissionPolicy.overlayTouchCredit(1000L,61001L,true)==0L,
            "inactive overlay interval above sixty seconds excluded");
        check(SupportMissionPolicy.overlayTouchCredit(3000L,2000L,true)==0L,
            "monotonic time reversal never credits time");
        long now=1_000_000L;
        long next=SupportMissionPolicy.nextEligibleAt(now);
        check(next-now==15L*24L*3600L*1000L,"15 days exact");
        check(SupportMissionPolicy.coolingDown(next-1,next),"hidden before deadline");
        check(!SupportMissionPolicy.coolingDown(next,next),"eligible at deadline");
        check(SupportMissionPolicy.availableWeight(-1)==100,"original 40/30/20/10 weights");
        for(int previous=-1;previous<4;previous++){
            int[] counts=new int[4];
            int available=SupportMissionPolicy.availableWeight(previous);
            for(int ticket=0;ticket<available;ticket++){
                int selected=SupportMissionPolicy.chooseWeighted(previous,ticket);
                check(selected>=0&&selected<4,"style in range");
                check(previous<0||selected!=previous,"never repeat previous style");
                counts[selected]++;
            }
            int[] expected=SupportMissionPolicy.WEIGHTS;
            for(int style=0;style<4;style++)
                check(counts[style]==(style==previous?0:expected[style]),
                    "rescaled non-repeating weighted buckets");
        }
        boolean threw=false;
        try{SupportMissionPolicy.chooseWeighted(0,SupportMissionPolicy.availableWeight(0));}
        catch(IllegalArgumentException expected){threw=true;}
        check(threw,"out of range draw rejected");
        System.out.println("SupportMissionPolicy PASS ("+tests+" assertions)");
    }
}

package com.lucianotoscano.pokesearchoverlay;

public final class SupportMissionPolicyTest {
    private static int tests=0;
    private static void check(boolean ok,String name){
        if(!ok)throw new AssertionError(name);
        tests++;
    }
    public static void main(String[] args){
        check(!SupportMissionPolicy.eligible(9,6_000_000L),"9 opens and 100 minutes hidden");
        check(!SupportMissionPolicy.eligible(10,5_940_000L),"10 opens 99 minutes hidden");
        check(SupportMissionPolicy.eligible(10,6_000_000L),"10 opens 100 minutes eligible");
        check(!SupportMissionPolicy.coolingDown(100L,0L),"no cooldown initially");
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

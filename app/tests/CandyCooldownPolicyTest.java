package com.lucianotoscano.pokesearchoverlay;

/** Runs the actual on-device Rare Candy cooldown policy on JVM. */
public final class CandyCooldownPolicyTest {
    private static int checks=0;
    private static void eq(int expected,int actual,String label){
        checks++;if(expected!=actual)throw new AssertionError(label+": "+expected+" != "+actual);
    }
    private static void ok(boolean value,String label){
        checks++;if(!value)throw new AssertionError(label);
    }
    public static void main(String[] args){
        double[] distance={0,9.99,10,99.99,100,499.99,500,999.99,1000,4999.99,
            5000,9999.99,10000,24999.99,25000,29999.99,30000,64999.99,
            65000,80999.99,81000,99999.99,100000,249999.99,250000,499999.99,
            500000,749999.99,750000,999999.99,1000000};
        int[] seconds={0,0,3,3,15,15,30,30,120,120,360,360,660,660,
            840,840,1320,1320,1500,1500,2100,2100,2700,2700,
            3600,3600,4500,4500,5400,5400,7200};
        for(int i=0;i<distance.length;i++)
            eq(seconds[i],CandyCooldownPolicy.recommendedSeconds(distance[i]),
                "distance boundary "+distance[i]);
        eq(-1,CandyCooldownPolicy.recommendedSeconds(Double.NaN),"nan");
        eq(-1,CandyCooldownPolicy.recommendedSeconds(-5),"negative distance");
        eq(-1,CandyCooldownPolicy.recommendedSeconds(Double.POSITIVE_INFINITY),"infinite");
        ok(CandyCooldownPolicy.parseCoordinates("0,0")!=null,"zero valid");
        ok(CandyCooldownPolicy.parseCoordinates("-5.50, -35.24")!=null,"real valid");
        ok(CandyCooldownPolicy.parseCoordinates("91,0")==null,"invalid latitude");
        ok(CandyCooldownPolicy.parseCoordinates("0,181")==null,"invalid longitude");
        ok(CandyCooldownPolicy.parseCoordinates("Infinity,0")==null,"invalid injection");
        ok(CandyCooldownPolicy.parseCoordinates("0,0;1")==null,"invalid delimiters");
        double d=CandyCooldownPolicy.distanceMeters("0,0","0,0.001");
        ok(d>110&&d<112,"haversine about 111m");
        double d2=CandyCooldownPolicy.distanceMeters("0,0.001","0,0");
        ok(Math.abs(d-d2)<1e-8,"symmetry");
        eq(0,CandyCooldownPolicy.recommendedSeconds(
            CandyCooldownPolicy.distanceMeters("0,0","0,0")),"same origin");
        long now=1_800_000_000_000L;
        eq(15,CandyCooldownPolicy.remainingSeconds("0,0","0,0.001",now,now),
            "first tap starts at 15s to next 111m");
        eq(8,CandyCooldownPolicy.remainingSeconds("0,0","0,0.001",now,now+7000),
            "7 seconds later");
        eq(0,CandyCooldownPolicy.remainingSeconds("0,0","0,0.001",now,now+15000),
            "ready after 15 seconds");
        eq(0,CandyCooldownPolicy.remainingSeconds("0,0","0,0.001",now,now+60000),
            "green remains ready until new hop");
        eq(-1,CandyCooldownPolicy.remainingSeconds("0,0","0,0.001",now,now-1),
            "clock rollback invalid");
        eq(-1,CandyCooldownPolicy.remainingSeconds("0,0","0,0.001",now,
            now+CandyCooldownPolicy.MAX_AGE_MS+1),"stale anchor expires");
        eq(-1,CandyCooldownPolicy.remainingSeconds("0,0","bad",now,now),
            "unverified coordinates never calculate");
        ok(CandyCooldownPolicy.timerLabel(0).contains("Pronto"),"green label");
        ok("0:08".equals(CandyCooldownPolicy.timerLabel(8)),"short label");
        ok("1:15:00".equals(CandyCooldownPolicy.timerLabel(4500)),"long label");
        ok(!CandyCooldownPolicy.shouldWarnBeforeCopy("","0,0.001",0,now),
            "a copy without confirmed pickup never warns");
        ok(!CandyCooldownPolicy.shouldWarnBeforeCopy("0,0","0,0.001",0,now),
            "unconfirmed timestamp cannot start cooldown");
        ok(CandyCooldownPolicy.shouldWarnBeforeCopy("0,0","0,0.001",now,now),
            "confirmed pickup warns before early different candy");
        ok(CandyCooldownPolicy.shouldWarnBeforeCopy("0,0","0,0.001",now,now+14000),
            "one second remaining must warn");
        ok(!CandyCooldownPolicy.shouldWarnBeforeCopy("0,0","0,0.001",now,now+15000),
            "do not warn after wait reaches zero");
        ok(!CandyCooldownPolicy.shouldWarnBeforeCopy("0,0","0,0",now,now),
            "copying confirmed origin does not warn");
        ok(!CandyCooldownPolicy.shouldWarnBeforeCopy("0,0","bad",now,now),
            "invalid target never generates a cooldown");
        ok(!CandyCooldownPolicy.shouldWarnBeforeCopy("0,0","0,0.001",
            now,now+CandyCooldownPolicy.MAX_AGE_MS+1),
            "stale capture checkpoint is invalid");

        ok("✓".equals(CandyCooldownPolicy.compactTimerLabel(0)),"compact ready is check only");
        ok("0:08".equals(CandyCooldownPolicy.compactTimerLabel(8)),"compact 8 seconds");
        ok("1:15".equals(CandyCooldownPolicy.compactTimerLabel(75)),"compact 75 seconds");
        ok("59:59".equals(CandyCooldownPolicy.compactTimerLabel(3599)),"minute precision under hour");
        ok("1h00".equals(CandyCooldownPolicy.compactTimerLabel(3600)),"compact one hour");
        ok("1h15".equals(CandyCooldownPolicy.compactTimerLabel(4500)),"compact one hour fifteen");
        ok("1h16".equals(CandyCooldownPolicy.compactTimerLabel(4501)),"round long waits up");
        ok("2h00".equals(CandyCooldownPolicy.compactTimerLabel(7200)),"compact two hours");
        ok("".equals(CandyCooldownPolicy.compactTimerLabel(-1)),"unverified stays blank");
        eq(0xFF50E39B,CandyCooldownPolicy.remainingColor(0),"green");
        eq(0xFFFF83BB,CandyCooldownPolicy.remainingColor(30),"pink");
        eq(0xFFFF5F70,CandyCooldownPolicy.remainingColor(31),"red");
        System.out.println("PASS LT195 candy distance/cooldown: "+checks+" executable checks");
    }
}

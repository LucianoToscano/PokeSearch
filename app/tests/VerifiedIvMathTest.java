package com.lucianotoscano.pokesearchoverlay;
import java.util.Locale;

/** Executable test for the SAME pure Java IV gate used by OverlayService P1/P2. */
public final class VerifiedIvMathTest {
    private static int checks=0;
    private static void expect(boolean condition,String message){
        checks++;
        if(!condition)throw new AssertionError(message);
    }
    public static void main(String[] ignored){
        expect(VerifiedIvMath.matchesCriteria("raw","0/15/15","66.67",0,15,15,0,100),
            "0/15/15 66.67 must pass");
        expect(VerifiedIvMath.matchesCriteria("raw","0/15/15","66,67",0,15,15,0,100),
            "localized 66,67 must pass");
        expect(VerifiedIvMath.matchesCriteria("raw","0/15/15","66.6666667",0,15,15,0,100),
            "precision must pass");
        expect(VerifiedIvMath.matchesCriteria("raw","0/15/15","",0,15,15,0,100),
            "raw-only proof must pass");
        expect(!VerifiedIvMath.matchesCriteria("raw","0/15/15","99",0,15,15,0,100),
            "contradictory IV percent must fail");
        expect(!VerifiedIvMath.matchesCriteria("raw","7/15/5","60",0,15,15,0,100),
            "verified other IV must not leak into raw search");
        expect(VerifiedIvMath.matchesCriteria("raw","0/13/13","57.78",0,13,13,0,100),
            "0/13/13 exact must pass");
        expect(!VerifiedIvMath.matchesCriteria("raw","0/13/13","58",0,15,15,0,100),
            "raw modes independent");
        expect(VerifiedIvMath.matchesCriteria("iv","15/15/15","100",0,0,0,0,100),
            "hundo");
        expect(VerifiedIvMath.matchesCriteria("percent","7/15/5","60",0,0,0,0,92),
            "percent 0–92");
        expect(!VerifiedIvMath.matchesCriteria("percent","15/15/15","100",0,0,0,0,92),
            "exclude hundo from 0–92");
        expect(VerifiedIvMath.matchesCriteria("percent","","66,67",0,0,0,0,92),
            "percent-only may prove percent mode");
        expect(!VerifiedIvMath.matchesCriteria("raw","","66.67",0,15,15,0,100),
            "percent-only must never invent A/D/S");
        expect(!VerifiedIvMath.matchesCriteria("raw","0/15/15","66.5",0,15,15,0,100),
            "rounded but inaccurate decimal");
        expect(!VerifiedIvMath.matchesCriteria("raw","0/15/15","99.9999999",0,15,15,0,100),
            "incompatible high precision");
        expect(!VerifiedIvMath.matchesCriteria("raw","0/15/15","66.666666666",0,15,15,0,100),
            "more than eight places disallowed");
        for(int sum=0;sum<=45;sum++){
            String raw=(sum/15)+"/"+(Math.min(sum%15,15))+"/0";
            // Generate a legal spread for every sum without ever exceeding 15.
            int a=Math.min(15,sum),d=Math.min(15,sum-a),s=sum-a-d;
            raw=a+"/"+d+"/"+s;
            int canonical=VerifiedIvMath.canonicalPercent(sum);
            double exact=sum*100d/45d;
            expect(VerifiedIvMath.matchesCriteria("raw",raw,String.valueOf(canonical),
                a,d,s,0,100),"canonical IV sum "+sum);
            expect(VerifiedIvMath.matchesCriteria("raw",raw,
                String.format(Locale.US,"%.8f",exact),a,d,s,0,100),
                "precise IV sum "+sum);
        }
        System.out.println("PASS LT194 JVM production IV math: "+checks+" checks");
    }
}

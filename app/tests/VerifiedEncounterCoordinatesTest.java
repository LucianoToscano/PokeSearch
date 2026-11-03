package com.lucianotoscano.pokesearchoverlay;

/** Plain JDK regression test; no Android SDK or network required. */
public final class VerifiedEncounterCoordinatesTest {
    private static void check(boolean condition,String label){
        if(!condition)throw new AssertionError(label);
    }
    public static void main(String[] args){
        VerifiedEncounterCoordinates p1=new VerifiedEncounterCoordinates(2);
        VerifiedEncounterCoordinates p2=new VerifiedEncounterCoordinates(2);
        long now=1_000_000L;
        p1.put("spawn-A","35.804677, 140.327019",now+9000,now);
        check("35.804677, 140.327019".equals(p1.get("spawn-A",now+100)),"reopen same encounter");
        check(p2.get("spawn-A",now+100).isEmpty(),"Pokeballs independently scoped");
        check(p1.get("spawn-B",now+100).isEmpty(),"no other encounter reuse");
        check(p1.get("spawn-A",now+9000).isEmpty(),"expires at despawn");
        p1.put("A","1,2",now+9000,now);
        p1.put("B","3,4",now+9000,now);
        p1.get("A",now+1);
        p1.put("C","5,6",now+9000,now);
        check(p1.get("B",now+2).isEmpty(),"bounded LRU removes oldest");
        check(!p1.get("A",now+2).isEmpty(),"recent entry kept");
        p1.clear();
        check(p1.get("A",now+2).isEmpty(),"logout/trainer change clears");
        p1.put("expired","7,8",now-1,now);
        check(p1.get("expired",now).isEmpty(),"never store expired");
        p1.put("too-long","7,8",now+2L*24*60*60*1000,now);
        check(p1.get("too-long",now).isEmpty(),"never store unbounded TTL");
        System.out.println("PASS VerifiedEncounterCoordinates: identity, P1/P2, expiry, LRU, lifecycle");
    }
}

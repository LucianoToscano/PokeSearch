package com.lucianotoscano.pokesearchoverlay;

public final class PgsMissionPreflightPolicyTest {
    static void ok(boolean result,String name){
        if(!result)throw new AssertionError(name);
    }
    public static void main(String[] args){
        int mask=0;
        ok(PgsMissionPreflightPolicy.count(mask)==0,"blank default");
        ok(!PgsMissionPreflightPolicy.complete(mask),"not ready by default");
        for(int flag:PgsMissionPreflightPolicy.ITEMS)
            mask=PgsMissionPreflightPolicy.set(mask,flag,true);
        ok(mask==PgsMissionPreflightPolicy.ALL,"all distinct flags");
        ok(PgsMissionPreflightPolicy.count(mask)==7,"seven checks");
        ok(PgsMissionPreflightPolicy.complete(mask),"manual checklist complete");
        mask=PgsMissionPreflightPolicy.set(mask,
            PgsMissionPreflightPolicy.POKEMON_STORAGE,false);
        ok(!PgsMissionPreflightPolicy.complete(mask),"full Pokemon storage blocks");
        ok(PgsMissionPreflightPolicy.count(mask)==6,"one unchecked");
        mask=PgsMissionPreflightPolicy.set(mask,1<<16,true);
        ok(PgsMissionPreflightPolicy.count(mask)==6,"unexpected flag ignored");
        ok(PgsMissionPreflightPolicy.sanitize(-1)==
            PgsMissionPreflightPolicy.ALL,"unknown bits masked");
        long now=1_800_000_000_000L;
        ok(!PgsMissionPreflightPolicy.current(0,now),"no start");
        ok(!PgsMissionPreflightPolicy.current(now+1,now),"future cannot be current");
        ok(PgsMissionPreflightPolicy.current(now-1,now),"recent check retained");
        ok(PgsMissionPreflightPolicy.current(
            now-PgsMissionPreflightPolicy.MAX_ACK_AGE_MS+1,now),
            "not yet 24h");
        ok(!PgsMissionPreflightPolicy.current(
            now-PgsMissionPreflightPolicy.MAX_ACK_AGE_MS,now),
            "expired after 24h");
        System.out.println("LT408 GPX manual session preflight and 24h acknowledgement PASS");
    }
}

package com.lucianotoscano.pokesearchoverlay;

public final class PgsAutoWatchPolicyTest {
    private static void check(boolean condition,String reason){
        if(!condition)throw new AssertionError(reason);
    }
    private static boolean can(String host,boolean selected,boolean visible,
            boolean safe,boolean templates,boolean clicks,boolean teaches,
            boolean menu){
        return PgsAutoWatchPolicy.mayCapture(selected,host,visible,safe,
            templates,clicks,teaches,menu);
    }
    public static void main(String[] args){
        check(PgsAutoWatchPolicy.SCAN_INTERVAL_MS>=20000,
            "budgeted polling");
        check(PgsAutoWatchPolicy.WATCHDOG_MS>=10000&&
            PgsAutoWatchPolicy.WATCHDOG_MS<25000,"watchdog bounded");
        check(PgsAutoWatchPolicy.ALERT_COOLDOWN_MS>=600000,
            "at least 10 minute dedup");
        check(!can("pokemod",false,true,true,true,false,false,false),
            "disabled default");
        check(!can("other",true,true,true,true,false,false,false),
            "unknown client fails closed");
        check(!can("pokemod",true,false,true,true,false,false,false),
            "no game foreground");
        check(!can("pokemod",true,true,false,true,false,false,false),
            "manual security notice");
        check(!can("pokemod",true,true,true,false,false,false,false),
            "no verified template");
        check(!can("pokemod",true,true,true,true,true,false,false),
            "autoclick mutually exclusive");
        check(!can("pokemod",true,true,true,true,false,true,false),
            "no teaching overlap");
        check(!can("pokemod",true,true,true,true,false,false,true),
            "no open overlay");
        check(can("pokemod",true,true,true,true,false,false,false),
            "Pokemod safe scan allowed");
        check(can("pgsharp",true,true,true,true,false,false,false),
            "PGSharp separate");
        check(PgsAutoWatchPolicy.sameSprite("m1","species",32,220,740,1600,
            "m1","species",64,440,1480,3200),
            "same normalized position after resize");
        check(!PgsAutoWatchPolicy.sameSprite("m1","species",32,220,740,1600,
            "m2","species",32,220,740,1600),
            "different model not confirmation");
        check(!PgsAutoWatchPolicy.sameSprite("m1","species",32,220,740,1600,
            "m1","species",250,220,740,1600),
            "moving icon is not confirmed");
        check(!PgsAutoWatchPolicy.sameSprite("m1","species",32,220,740,1600,
            "m1","species",32,220,0,1600),
            "invalid size fails closed");
        check(!PgsAutoWatchPolicy.sameSprite("m1","species",60,60,740,1600,
            "m1","species",60,60,1600,740),
            "portrait to landscape never confirms a stale screenshot");
        check(PgsAutoWatchPolicy.mayNotify(true,-1L,100L),
            "initial selected favorite");
        check(!PgsAutoWatchPolicy.mayNotify(false,-1L,100L),
            "unselected species never alert");
        check(!PgsAutoWatchPolicy.mayNotify(true,1000L,1200L),
            "do not spam per species");
        check(!PgsAutoWatchPolicy.mayNotify(true,1200L,900L),
            "clock rollback fails closed");
        check(PgsAutoWatchPolicy.mayNotify(true,1000L,601000L),
            "dedup expiry");
        check(PgsAutoWatchPolicy.alertCount(12)==3,"max 3 per scan");
        check(PgsAutoWatchPolicy.alertCount(-1)==0,"invalid count");
        System.out.println("LT361 passive Pokemod/PGSharp watch safety PASS");
    }
}

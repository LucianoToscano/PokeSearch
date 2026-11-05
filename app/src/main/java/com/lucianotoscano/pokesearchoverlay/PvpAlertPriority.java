package com.lucianotoscano.pokesearchoverlay;

/**
 * LT253 verified Top PvP alert policy. Never interprets an unconfirmed site
 * filter, a species Rank Geral or a mathematical Mega projection as source IV.
 * Uses the existing opt-in general/favorites notification channels.
 */
final class PvpAlertPriority {
    private PvpAlertPriority() {}

    static int verifiedClassRank(String leagueMode,boolean sourceConfirmed,
                                 boolean targetVerified,String rawRank,
                                 int configuredTop) {
        if(!sourceConfirmed||!targetVerified||
            !("gl".equals(leagueMode)||"ul".equals(leagueMode)))return 0;
        String value=rawRank==null?"":rawRank.trim().replace("#","");
        if(!value.matches("(?:[1-9]|[1-4][0-9]|50)"))return 0;
        int rank=Integer.parseInt(value);
        int max=Math.max(1,Math.min(50,configuredTop));
        return rank<=max?rank:0;
    }

    static boolean higherPriority(int candidate,int current) {
        return candidate>0&&(current==0||candidate<current);
    }
}

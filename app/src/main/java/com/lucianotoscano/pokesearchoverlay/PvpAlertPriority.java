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

    // LT325: a source-verified 15/15/15 can take precedence over an ordinary
    // candidate in the EXISTING general-notice slot. No extra notification,
    // queue, sound, channel or suppression key is introduced.
    static boolean verifiedHundo(boolean confirmed,boolean targetVerified,
                                 String rawIv,String percent){
        if(!confirmed||!targetVerified||rawIv==null||
            !"15/15/15".equals(rawIv.trim()))return false;
        String pct=percent==null?"":percent.trim().replace(',','.');
        return pct.isEmpty()||pct.matches("100(?:\\.0{1,8})?");
    }

    static boolean higherValuePriority(int candidateTop,boolean candidateHundo,
                                       int currentTop,boolean currentHundo){
        if(candidateTop>0||currentTop>0)
            return higherPriority(candidateTop,currentTop);
        return candidateHundo&&!currentHundo;
    }
}

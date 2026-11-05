package com.lucianotoscano.pokesearchoverlay;

/** LT240 — per-overlay, opt-in rank notifications for confirmed GL/UL results.
 * Never interpret Mega IV projections or overall PvPoke species rank as a spawn rank. */
public final class TopPvpAlertPolicy {
    private TopPvpAlertPolicy(){}
    public static boolean validLimit(int limit){
        return limit==0||limit==1||limit==5||limit==10;
    }
    public static boolean eligible(String mode,int limit,int rank,
                                   boolean leagueConfirmed,boolean targetConfirmed){
        return ("gl".equals(mode)||"ul".equals(mode))&&
            validLimit(limit)&&limit>0&&rank>=1&&rank<=limit&&
            leagueConfirmed&&targetConfirmed;
    }
}

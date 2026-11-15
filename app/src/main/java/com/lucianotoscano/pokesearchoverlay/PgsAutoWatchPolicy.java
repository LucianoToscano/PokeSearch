package com.lucianotoscano.pokesearchoverlay;

/**
 * LT361: monitor de espécies no feed, somente leitura.
 * Nenhuma rota desta política aceita coordenada como autorização de gesto.
 * Comparações usam pixels da captura, não coordenadas GPS.
 */
final class PgsAutoWatchPolicy {
    static final long SCAN_INTERVAL_MS=25000L;
    static final long PAUSED_RETRY_MS=8000L;
    static final long RECONFIRM_DELAY_MS=650L;
    static final long WATCHDOG_MS=18000L;
    static final long ALERT_COOLDOWN_MS=600000L;
    static final int MAX_ALERT_SPECIES_PER_SCAN=3;
    private PgsAutoWatchPolicy(){}

    static boolean mayCapture(boolean optedIn,String profile,
            boolean gameVisible,boolean safetyClear,boolean hasModels,
            boolean autoClickRunning,boolean teaching,boolean menuVisible){
        return optedIn&&!PgsAutoHostPolicy.OTHER.equals(
            PgsAutoHostPolicy.profile(profile))&&gameVisible&&safetyClear&&
            hasModels&&!autoClickRunning&&!teaching&&!menuVisible;
    }

    static boolean sameSprite(String idA,String groupA,int xA,int yA,
            int widthA,int heightA,String idB,String groupB,int xB,int yB,
            int widthB,int heightB){
        if(idA==null||groupA==null||idB==null||groupB==null||
            widthA<=0||heightA<=0||widthB<=0||heightB<=0)return false;
        return idA.equals(idB)&&groupA.equals(groupB)&&
            Math.abs(xA/(float)widthA-xB/(float)widthB)<=.026f&&
            Math.abs(yA/(float)heightA-yB/(float)heightB)<=.018f;
    }
    static boolean mayNotify(boolean selected,long lastNotifiedElapsed,
            long nowElapsed){
        return selected&&nowElapsed>=0L&&
            (lastNotifiedElapsed<0L||
                (nowElapsed>=lastNotifiedElapsed&&
                 nowElapsed-lastNotifiedElapsed>=ALERT_COOLDOWN_MS));
    }
    static int alertCount(int confirmedDistinctSpecies){
        return Math.max(0,Math.min(MAX_ALERT_SPECIES_PER_SCAN,
            confirmedDistinctSpecies));
    }
}

package com.lucianotoscano.pokesearchoverlay;

import java.text.Normalizer;
import java.util.Locale;

/**
 * LT366: configurações e detecção textual conservadora, sem acesso ao Android.
 * Nenhum texto prova captura, teleporte ou efeito no jogo.
 */
final class PgsAutoHuntPolicy {
    static final String IV100="iv100", DITTO="ditto", NONE="none";
    static final int DEFAULT_WAIT_SECONDS=35, DEFAULT_MAX_CLICKS=10;
    static final int DEFAULT_MAP_CAPTURE_RETRIES=3;
    private PgsAutoHuntPolicy(){}

    static int waitSeconds(int value){return value>=15&&value<=180?value:DEFAULT_WAIT_SECONDS;}
    static int maxClicks(int value){return value>=1&&value<=10?value:DEFAULT_MAX_CLICKS;}
    static int mapCaptureRetries(int value){return value>=0&&value<=3?value:DEFAULT_MAP_CAPTURE_RETRIES;}
    static boolean mayKeepScanning(boolean enabled,int completed,int limit){
        return !enabled||completed<maxClicks(limit);
    }
    static long nextDelayMs(boolean enabled,int configured){
        return enabled?waitSeconds(configured)*1000L:500L;
    }

    private static String norm(String text){
        if(text==null)return "";
        return Normalizer.normalize(text.toLowerCase(Locale.ROOT),Normalizer.Form.NFD)
            .replaceAll("\\p{M}","").replaceAll("[^a-z0-9]+"," ").trim()
            .replaceAll("\\s+"," ");
    }
    static boolean mentionsExactTarget(String notification,String target){
        String n=norm(notification),t=norm(target);
        if(t.isEmpty()||n.isEmpty()||t.length()>80)return false;
        // Require a complete species name, not an arbitrary substring.
        return (" "+n+" ").contains(" "+t+" ");
    }
    static String explicitNotice(String message,String expectedTarget){
        if(!mentionsExactTarget(message,expectedTarget))return NONE;
        String words=" "+norm(message)+" ";
        if(words.matches("(?s).*\\b(?:iv 100|100 iv|perfect iv|iv perfect|iv100|15 15 15)\\b.*"))
            return IV100;
        if("ditto".equals(norm(expectedTarget))&&
            (words.contains(" ditto found ")||words.contains(" found ditto ")||
             words.contains(" ditto detected ")||words.contains(" ditto encountered ")||
             words.contains(" encontrou ditto ")))
            return DITTO;
        return NONE;
    }
}

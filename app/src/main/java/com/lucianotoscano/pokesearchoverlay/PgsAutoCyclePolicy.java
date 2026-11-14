package com.lucianotoscano.pokesearchoverlay;

import java.text.Normalizer;
import java.util.Locale;

/** Máquina de decisão pura, reutilizável pelo menu, pelo motor e pelos testes. */
final class PgsAutoCyclePolicy {
    static final int DEFAULT_MAP_TIMEOUT_SECONDS=60;
    static final int DEFAULT_SHINY_CHECK_SECONDS=2;
    static final int EMPTY_FEED_RETRY_SECONDS=3;
    private PgsAutoCyclePolicy(){}

    static int mapTimeoutSeconds(int configured){
        return configured>=20&&configured<=120?configured:DEFAULT_MAP_TIMEOUT_SECONDS;
    }
    static int shinyCheckSeconds(int configured){
        return configured>=1&&configured<=10?configured:DEFAULT_SHINY_CHECK_SECONDS;
    }
    static boolean mapTimedOut(long now,long clickedAt,int timeoutSeconds){
        return clickedAt>0&&now-clickedAt>=mapTimeoutSeconds(timeoutSeconds)*1000L;
    }
    static boolean readyToAdvance(long now,long readyAt,int checkSeconds){
        return readyAt>0&&now-readyAt>=shinyCheckSeconds(checkSeconds)*1000L;
    }
    static boolean shouldPauseForTarget(String notification,String target,
                                        boolean running,boolean awaitingMap){
        if(!running||!awaitingMap||target==null||target.trim().isEmpty()
            ||!PgsAutoShinySignal.isPositive(notification))return false;
        String norm=normalize(notification),species=normalize(
            target.replaceAll("(?i)\\s*\\(amostra\\s*\\d+\\)",""));
        if(species.isEmpty())return false;
        // Palavra completa: "Lucario" não valida um nome diferente por substring.
        return (" "+norm+" ").contains(" "+species+" ");
    }
    private static String normalize(String value){
        String v=Normalizer.normalize(value.toLowerCase(Locale.ROOT),Normalizer.Form.NFD)
            .replaceAll("\\p{M}","");
        return v.replaceAll("[^a-z0-9]+"," ").replaceAll("\\s+"," ").trim();
    }
}

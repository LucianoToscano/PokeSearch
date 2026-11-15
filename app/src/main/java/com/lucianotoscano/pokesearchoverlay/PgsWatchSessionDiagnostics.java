package com.lucianotoscano.pokesearchoverlay;

/**
 * Contadores só na memória do serviço. Não armazena imagem, GPS, nome de
 * conta, texto do jogo, identificador de usuário nem dados de outros apps.
 */
final class PgsWatchSessionDiagnostics {
    private long startElapsed=-1L,lastDurationMs=-1L;
    private int readings=0,candidates=0,confirmed=0,alertsRequested=0,interrupted=0;
    private String lastOutcome="sem leitura";
    void begin(long nowElapsed){
        if(nowElapsed>=0L&&startElapsed<0L)startElapsed=nowElapsed;
    }
    void observe(int candidateCount,int confirmedCount,int requestedCount){
        if(startElapsed<0L)return;
        candidates=add(candidates,Math.max(0,candidateCount));
        confirmed=add(confirmed,Math.max(0,Math.min(candidateCount,confirmedCount)));
        alertsRequested=add(alertsRequested,Math.max(0,requestedCount));
    }
    void finish(long nowElapsed,String outcome){
        if(startElapsed<0L)return;
        if(nowElapsed<startElapsed){
            startElapsed=-1L;lastOutcome="tempo reiniciado";return;
        }
        lastDurationMs=Math.min(60000L,nowElapsed-startElapsed);
        readings=add(readings,1);
        lastOutcome=safeOutcome(outcome);
        if(!"MONITOR · OBSERVANDO".equals(outcome)&&
           (outcome==null||!outcome.contains("FAVORITO(S)")))
            interrupted=add(interrupted,1);
        startElapsed=-1L;
    }
    void cancel(){startElapsed=-1L;}
    int readings(){return readings;}
    int candidates(){return candidates;}
    int confirmed(){return confirmed;}
    int interrupted(){return interrupted;}
    long lastDurationMs(){return lastDurationMs;}
    int alertsRequested(){return alertsRequested;}
    String summary(){
        String duration=lastDurationMs<0L?"sem leitura":lastDurationMs+" ms";
        return "Leituras "+readings+" · duração "+duration+"\n"+
            "Candidatos "+candidates+" · confirmados "+confirmed+
            " · não confirmados "+Math.max(0,candidates-confirmed)+"\n"+
            "Alertas solicitados "+alertsRequested+" · pausas/falhas "+interrupted+
            "\nÚltima: "+lastOutcome;
    }
    private static int add(int a,int b){
        return a>=Integer.MAX_VALUE-b?Integer.MAX_VALUE:a+b;
    }
    private static String safeOutcome(String text){
        if(text==null||text.isEmpty())return "desconhecido";
        // Somente estado interno fixo; nenhum texto extraído de screenshot.
        if(text.startsWith("MONITOR · ")){
            String normalized=text.replaceAll("[^A-Za-zÀ-ÿ0-9 ·()/-]","");
            return normalized.substring(0,Math.min(42,normalized.length()));
        }
        return "interrompido";
    }
}

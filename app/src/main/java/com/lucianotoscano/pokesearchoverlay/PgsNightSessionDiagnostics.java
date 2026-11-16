package com.lucianotoscano.pokesearchoverlay;

/**
 * LT372: evidence-limited, in-memory health summary for an external supervisor.
 * A heartbeat does NOT prove walking, a catch attempt or a caught Pokemon.
 * Never store screenshots, notification text, coordinates, account or user IDs.
 */
final class PgsNightSessionDiagnostics {
    private boolean active;
    private long startedAt=-1L, lastReadAt=-1L, stoppedAt=-1L;
    private int reads, gameVisibleReads, gameMissingReads, missingStreak;
    private boolean notificationsAllowed;
    private String stopReason="Ainda não iniciada";

    void start(long elapsed, boolean notificationsEnabled){
        active=true;
        startedAt=Math.max(0L,elapsed);
        lastReadAt=-1L;
        stoppedAt=-1L;
        reads=0;gameVisibleReads=0;gameMissingReads=0;missingStreak=0;
        notificationsAllowed=notificationsEnabled;
        stopReason="";
    }

    void observe(long elapsed, boolean gameVisible, boolean notificationsEnabled,
            int consecutiveMissing){
        if(!active||elapsed<startedAt||elapsed<lastReadAt)return;
        lastReadAt=elapsed;
        reads=saturatingIncrement(reads);
        if(gameVisible)gameVisibleReads=saturatingIncrement(gameVisibleReads);
        else gameMissingReads=saturatingIncrement(gameMissingReads);
        missingStreak=Math.max(0,Math.min(999,consecutiveMissing));
        notificationsAllowed=notificationsEnabled;
    }

    void stop(long elapsed, String reason){
        if(!active)return;
        active=false;
        stoppedAt=Math.max(startedAt,elapsed);
        stopReason=approvedReason(reason);
    }

    boolean active(){return active;}
    int reads(){return reads;}
    int missingStreak(){return missingStreak;}
    private static int saturatingIncrement(int n){
        return n==Integer.MAX_VALUE?n:n+1;
    }
    private static String approvedReason(String reason){
        if("Aviso de segurança detectado.".equals(reason))return "aviso de segurança";
        if("Pokémon GO saiu da tela ou foi bloqueado.".equals(reason))return "jogo ausente/bloqueado";
        if("Perfil PGSharp alterado.".equals(reason))return "perfil alterado";
        if("Outro mecanismo do PokeSearch foi iniciado.".equals(reason))return "outro mecanismo ativo";
        if("Notificações do Android foram desativadas.".equals(reason))return "notificações desativadas";
        if("Acessibilidade interrompida pelo Android.".equals(reason))return "Acessibilidade interrompida";
        if("Interrompida manualmente.".equals(reason))return "parada manualmente";
        if("Overlay do PokeSearch fechado.".equals(reason))return "overlay fechado";
        if("Serviço interrompido.".equals(reason))return "serviço encerrado";
        return "interrompida (motivo não classificado)";
    }

    String summary(long elapsed){
        String state=active?"ATIVA (supervisão local)":"INATIVA";
        String lastRead=lastReadAt<0?"sem leitura":
            Math.max(0L,Math.max(elapsed,lastReadAt)-lastReadAt)/1000L+" s atrás";
        String length=startedAt<0?"não iniciada":
            Math.max(0L,(Math.max(startedAt,active?elapsed:stoppedAt)-startedAt)/1000L)+" s";
        return "Supervisão: "+state+" · duração "+length+"\n"+
            "Jogo visível (amostras): "+gameVisibleReads+" · ausente: "+
            gameMissingReads+" · consecutivas: "+missingStreak+"\n"+
            "Última leitura: "+lastRead+" · total: "+reads+"\n"+
            "Notificações Android: "+(notificationsAllowed?"permitidas":"não confirmadas")+
            " (entrega não comprovada)\n"+
            "Caminhada externa: NÃO CONFIRMADA (Autowalk é do cliente)\n"+
            "Tentativa de captura: NÃO OBSERVADA (Virtual Go Plus externo)\n"+
            "Captura no jogo: NÃO CONFIRMADA"+
            (!active&&startedAt>=0?"\nÚltima parada: "+stopReason:"");
    }
}

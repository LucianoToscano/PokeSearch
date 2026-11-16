package com.lucianotoscano.pokesearchoverlay;

/**
 * LT372: diagnostico local e temporario do supervisor externo.
 * Leituras de janela/avisos nao constituem prova de Autowalk, tentativa ou captura.
 * Nao guarda coordenadas, capturas de tela, contas ou identificadores.
 */
final class PgsNightSessionDiagnostics {
    private boolean active, walkDeclared, plusDeclared, gameVisible;
    private long startedAt=-1L, lastReadAt=-1L;
    private int reads, missingGameReads, safetyReads;
    private String lastStopReason="Nenhuma sessao encerrada.";

    void start(long elapsedMs,boolean userWalk,boolean userPlus){
        active=true;
        walkDeclared=userWalk;
        plusDeclared=userPlus;
        startedAt=elapsedMs;
        lastReadAt=-1L;
        reads=0;
        missingGameReads=0;
        safetyReads=0;
        gameVisible=false;
        lastStopReason="";
    }

    void sampled(long elapsedMs,boolean foreground,boolean safetyNotice){
        if(!active)return;
        lastReadAt=elapsedMs;
        reads++;
        gameVisible=foreground;
        if(!foreground)missingGameReads++;
        if(safetyNotice)safetyReads++;
    }

    void stop(String reason){
        if(!active)return;
        active=false;
        lastStopReason=reason==null||reason.trim().isEmpty()?
            "Supervisao encerrada.":reason.trim();
    }

    boolean active(){return active;}

    boolean stale(long nowMs,long intervalMs){
        if(!active||intervalMs<=0)return false;
        long anchor=lastReadAt>=0?lastReadAt:startedAt;
        return nowMs>=anchor&&nowMs-anchor>intervalMs*2;
    }

    private static String age(long nowMs,long thenMs){
        if(thenMs<0||nowMs<thenMs)return "sem leitura";
        return "ha "+((nowMs-thenMs)/1000L)+"s";
    }

    String summary(long elapsedMs){
        StringBuilder info=new StringBuilder();
        info.append("Supervisao: ").append(active?"ativa":"parada")
            .append(" · leituras: ").append(reads).append('\n');
        info.append("Ultima leitura: ").append(age(elapsedMs,lastReadAt));
        if(stale(elapsedMs,PgsNightSupervisorPolicy.CHECK_INTERVAL_MS))
            info.append(" (atrasada; Android pode ter suspendido)");
        info.append('\n');
        info.append("Jogo: ").append(reads==0?"nao avaliado":
            (gameVisible?"visivel na ultima leitura":"ausente na ultima leitura"));
        if(missingGameReads>0)
            info.append(" · ausencias: ").append(missingGameReads);
        if(safetyReads>0)
            info.append(" · avisos: ").append(safetyReads);
        info.append('\n');
        info.append("Caminhada externa: ").append(walkDeclared?
            "declarada, movimento nao verificado":"nao verificada").append('\n');
        info.append("Tentativa de captura: nao observada");
        if(plusDeclared)info.append(" (VGP declarado, conexao nao verificada)");
        info.append('\n');
        info.append("Captura confirmada: nenhuma evidência no jogo");
        if(!active&&!lastStopReason.isEmpty())
            info.append('\n').append("Parada: ").append(lastStopReason);
        return info.toString();
    }
}

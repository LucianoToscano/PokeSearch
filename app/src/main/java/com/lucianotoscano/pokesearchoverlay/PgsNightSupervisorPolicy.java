package com.lucianotoscano.pokesearchoverlay;

/**
 * LT371: monitor externo somente-leitura do PGSharp, nunca AutoWalk/Go Plus.
 * O cliente do jogo controla caminhar/capturar, sem API privada do PokeSearch.
 */
final class PgsNightSupervisorPolicy {
    static final long CHECK_INTERVAL_MS=30000L;
    static final int MAX_MISSING_GAME_CHECKS=2;
    enum Decision { KEEP, STOP_SAFETY, STOP_GAME_MISSING, STOP_PROFILE, STOP_ENGINE }
    private PgsNightSupervisorPolicy(){}
    static boolean canStart(String profile,boolean gameVisible,
        boolean warning,boolean notificationsOn,boolean alreadyBusy){
        return PgsAutoHostPolicy.PGSHARP.equals(
            PgsAutoHostPolicy.profile(profile))&&gameVisible&&!warning&&
            notificationsOn&&!alreadyBusy;
    }
    static Decision check(String initialProfile,String currentProfile,
        boolean gameVisible,boolean warning,boolean engineBusy,int missingChecks){
        if(!PgsAutoHostPolicy.PGSHARP.equals(
                PgsAutoHostPolicy.profile(initialProfile))||
            !PgsAutoHostPolicy.PGSHARP.equals(
                PgsAutoHostPolicy.profile(currentProfile)))
            return Decision.STOP_PROFILE;
        if(warning)return Decision.STOP_SAFETY;
        if(engineBusy)return Decision.STOP_ENGINE;
        if(!gameVisible&&missingChecks>=MAX_MISSING_GAME_CHECKS)
            return Decision.STOP_GAME_MISSING;
        return Decision.KEEP;
    }
}

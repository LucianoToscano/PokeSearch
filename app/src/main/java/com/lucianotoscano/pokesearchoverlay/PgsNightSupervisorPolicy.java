package com.lucianotoscano.pokesearchoverlay;

/**
 * LT371/LT372: supervisor externo somente-leitura do PGSharp.
 * Nao ativa/desativa Autowalk/VGP e nunca confirma captura no jogo.
 */
final class PgsNightSupervisorPolicy {
    static final long CHECK_INTERVAL_MS=30000L;
    static final int MAX_MISSING_GAME_CHECKS=2;
    enum Decision {
        KEEP, STOP_SAFETY, STOP_GAME_MISSING, STOP_PROFILE,
        STOP_ENGINE, STOP_NOTIFICATIONS
    }
    private PgsNightSupervisorPolicy(){}
    static boolean canStart(String profile,boolean gameVisible,
        boolean warning,boolean notificationsOn,boolean alreadyBusy){
        return PgsAutoHostPolicy.PGSHARP.equals(
            PgsAutoHostPolicy.profile(profile))&&gameVisible&&!warning&&
            notificationsOn&&!alreadyBusy;
    }
    static Decision check(String initialProfile,String currentProfile,
        boolean gameVisible,boolean warning,boolean engineBusy,int missingChecks){
        return check(initialProfile,currentProfile,gameVisible,warning,
            engineBusy,missingChecks,true);
    }
    static Decision check(String initialProfile,String currentProfile,
        boolean gameVisible,boolean warning,boolean engineBusy,int missingChecks,
        boolean notificationsOn){
        if(!PgsAutoHostPolicy.PGSHARP.equals(
                PgsAutoHostPolicy.profile(initialProfile))||
            !PgsAutoHostPolicy.PGSHARP.equals(
                PgsAutoHostPolicy.profile(currentProfile)))
            return Decision.STOP_PROFILE;
        if(warning)return Decision.STOP_SAFETY;
        if(!notificationsOn)return Decision.STOP_NOTIFICATIONS;
        if(engineBusy)return Decision.STOP_ENGINE;
        if(!gameVisible&&missingChecks>=MAX_MISSING_GAME_CHECKS)
            return Decision.STOP_GAME_MISSING;
        return Decision.KEEP;
    }
}

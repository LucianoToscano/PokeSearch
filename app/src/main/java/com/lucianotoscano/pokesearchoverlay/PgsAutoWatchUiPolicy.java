package com.lucianotoscano.pokesearchoverlay;

/**
 * LT362: estado exclusivamente informativo do monitor sem gesto.
 * Nunca autoriza toque, Shiny, encontro ou teleporte.
 */
final class PgsAutoWatchUiPolicy {
    static final String OFF="off";
    static final String OBSERVING="observing";
    static final String FOUND="found";
    static final String PAUSED="paused";
    static final String NO_MODEL="no_model";
    static final String PERMISSION="permission";

    private PgsAutoWatchUiPolicy(){}

    static String resolve(boolean optedIn,boolean serviceConnected,
            boolean watching,boolean hasModel,boolean canObserve,
            boolean justRecognized){
        if(!optedIn)return OFF;
        if(!serviceConnected)return PERMISSION;
        if(!hasModel)return NO_MODEL;
        if(!watching||!canObserve)return PAUSED;
        return justRecognized?FOUND:OBSERVING;
    }

    static String label(String state){
        switch(state){
            case OBSERVING:return "observando";
            case FOUND:return "favorito reconhecido no feed";
            case PAUSED:return "pausado";
            case NO_MODEL:return "sem modelo visual";
            case PERMISSION:return "Acessibilidade necessária";
            default:return "desligado";
        }
    }
}

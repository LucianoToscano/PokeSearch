package com.lucianotoscano.pokesearchoverlay;

/**
 * Configuracao de notificacoes EXCLUSIVA do PGS Buscas Auto.
 * Nao usa preferencias nem canais de P1/P2; IDs distintos evitam mutacoes
 * em canais Android ja criados (som de NotificationChannel e imutavel).
 */
final class PgsAutoNotificationPolicy {
    static final String NEW="newSound", SEARCH="searchSound", SHINY="shinyMode";
    private PgsAutoNotificationPolicy(){}

    static boolean validKind(String kind){
        return NEW.equals(kind)||SEARCH.equals(kind)||SHINY.equals(kind);
    }
    static String defaultMode(String kind){
        return SHINY.equals(kind)?"strong":"mute";
    }
    static String mode(String kind,String value){
        if(!validKind(kind))return "mute";
        if("default".equals(value)||"strong".equals(value)||
            "mute".equals(value)||"off".equals(value)||"custom".equals(value))return value;
        return defaultMode(kind);
    }
    static String channelId(String kind,String mode,int soundIndex){
        if(!validKind(kind))throw new IllegalArgumentException("Notificacao PGS desconhecida");
        String actual=mode(kind,mode);
        if("custom".equals(actual)){
            // O catálogo oferece de 0 a 35. Índice inválido não vira um canal sem áudio.
            if(soundIndex<0||soundIndex>=36)actual="default";
            else return "pgs_buscas_"+kind+"_custom_"+soundIndex+"_v2";
        }
        return "pgs_buscas_"+kind+"_"+actual+"_v2";
    }
    static int notificationId(String kind){
        if(NEW.equals(kind))return 2101;
        if(SEARCH.equals(kind))return 2102;
        if(SHINY.equals(kind))return 2103;
        throw new IllegalArgumentException("Notificacao PGS desconhecida");
    }
}

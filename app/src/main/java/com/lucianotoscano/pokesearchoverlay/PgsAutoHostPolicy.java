package com.lucianotoscano.pokesearchoverlay;

import java.util.Locale;

/**
 * LT359: interface visual, não pacote de instalação do gerenciador.
 * O jogo em primeiro plano e o injetor são processos distintos.
 * Um perfil sem homologação permanece somente de prévia, sem gestos.
 */
final class PgsAutoHostPolicy {
    static final String PGSHARP="pgsharp",POKEMOD="pokemod",OTHER="other";
    static final String GAME_PACKAGE="com.nianticlabs.pokemongo";
    static final String POKEMOD_MANAGER="com.pokemod.app.public";
    private PgsAutoHostPolicy(){}

    static String profile(String raw){
        if(raw==null||raw.trim().isEmpty())return PGSHARP; // migração legada
        String s=raw.trim().toLowerCase(Locale.ROOT);
        if(PGSHARP.equals(s)||POKEMOD.equals(s)||OTHER.equals(s))return s;
        return OTHER; // configuração desconhecida nunca autoriza gesto
    }
    static boolean isGameWindow(String packageName){
        return GAME_PACKAGE.equals(packageName);
    }
    static boolean isManagerWindow(String packageName){
        return POKEMOD_MANAGER.equals(packageName);
    }
    static boolean mayAutoTap(String profile,boolean gameVisible,
            boolean safetyClear,boolean hasMatchedProfileTemplate){
        return !OTHER.equals(profile(profile))&&gameVisible&&
            safetyClear&&hasMatchedProfileTemplate;
    }
    static boolean templateBelongsTo(String templateProfile,String selectedProfile){
        return profile(templateProfile).equals(profile(selectedProfile));
    }
    static String shortLabel(String selectedProfile){
        switch(profile(selectedProfile)){
            case POKEMOD:return "PM";
            case OTHER:return "OUT";
            default:return "PGS";
        }
    }
    static String displayLabel(String selectedProfile){
        switch(profile(selectedProfile)){
            case POKEMOD:return "Pokemod";
            case OTHER:return "Outro (prévia)";
            default:return "PGSharp";
        }
    }
}

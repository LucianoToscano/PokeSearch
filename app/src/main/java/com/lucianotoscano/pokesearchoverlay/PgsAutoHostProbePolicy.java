package com.lucianotoscano.pokesearchoverlay;

/**
 * Conservative LT370 provider decision. The same visual model must match
 * twice in the corresponding feed; zero or conflicting hosts means UNKNOWN.
 * Manager installation, package name and historical preferences are not proof.
 */
final class PgsAutoHostProbePolicy {
    private PgsAutoHostProbePolicy(){}
    static String choose(boolean pgsharpStable,boolean pokemodStable){
        if(pgsharpStable==pokemodStable)return PgsAutoHostPolicy.OTHER;
        return pgsharpStable?PgsAutoHostPolicy.PGSHARP:
            PgsAutoHostPolicy.POKEMOD;
    }
    static boolean safeToProbe(boolean gameVisible,boolean warningVisible,
        boolean busy,int validPgsharpModels,int validPokemodModels){
        return gameVisible&&!warningVisible&&!busy&&
            (validPgsharpModels>0||validPokemodModels>0);
    }
}

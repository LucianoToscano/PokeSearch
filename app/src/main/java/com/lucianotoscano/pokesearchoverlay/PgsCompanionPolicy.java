package com.lucianotoscano.pokesearchoverlay;

/**
 * LT363: metadados de pacotes observados em APKs de referência.
 * NÃO é um contrato de API, autorização de root ou prova de módulo ativo.
 */
final class PgsCompanionPolicy {
    static final class Spec {
        final String packageName,label,kind;
        Spec(String packageName,String label,String kind){
            this.packageName=packageName;this.label=label;this.kind=kind;
        }
    }
    private static final Spec[] KNOWN={
        new Spec("com.nianticlabs.pokemongo","Pokémon GO Play","jogo"),
        new Spec("com.nianticlabs.pokemongo.ares","Pokémon GO Galaxy","jogo"),
        new Spec("com.pokemod.app.public","Pokemod Manager","gerenciador"),
        new Spec("com.pokemod.aegis","Pokemod Aegis","auxiliar"),
        new Spec("com.pokemod.atlas","Pokemod Atlas","auxiliar"),
        new Spec("com.antvn.pokelist","PokeList","lista externa"),
        new Spec("net.pgtools.data_hub","Data Hub","dados externos"),
        new Spec("net.pgtools.auto","PGTools","ferramenta externa")
    };
    private PgsCompanionPolicy(){}
    static Spec[] entries(){return KNOWN.clone();}
    static boolean isOfficialGame(String packageName){
        return PgsAutoHostPolicy.isGameWindow(packageName);
    }
    /** Instalação de qualquer cliente não comprova injeção nem libera gestos. */
    static boolean installationProvesActive(String packageName){return false;}
    /** Esta auditoria não concede uso de backends/IPC/root privados. */
    static boolean externalApiApproved(String packageName){return false;}
    static String safeVersion(String text){
        if(text==null||text.isEmpty())return "";
        StringBuilder out=new StringBuilder();
        for(int i=0;i<text.length()&&out.length()<22;i++){
            char c=text.charAt(i);
            if((c>='0'&&c<='9')||(c>='A'&&c<='Z')||
                    (c>='a'&&c<='z')||c=='.'||c=='-'||c=='_')out.append(c);
        }
        return out.toString();
    }
}

package com.lucianotoscano.pokesearchoverlay;

/** Tempo relativo à primeira busca sem resultados; nenhum vazio implica pausa. */
final class PgsAutoRetryPolicy {
    private PgsAutoRetryPolicy(){}
    static int delaySeconds(int emptyAttempts,int first,int second,int cycle) {
        int f=Math.max(10,Math.min(3600,first));
        int s=Math.max(f,Math.min(7200,second));
        int c=Math.max(10,Math.min(7200,cycle));
        if(emptyAttempts<=0)return f;
        if(emptyAttempts==1)return Math.max(1,s-f);
        return c;
    }
    static boolean shouldPauseOnEmpty(){return false;}
}

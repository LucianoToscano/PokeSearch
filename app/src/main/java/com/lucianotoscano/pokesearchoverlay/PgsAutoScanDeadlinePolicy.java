package com.lucianotoscano.pokesearchoverlay;

/** LT358: orçamento monotônico do scanner; ultrapassar qualquer limite falha fechado. */
final class PgsAutoScanDeadlinePolicy {
    private PgsAutoScanDeadlinePolicy(){}
    static boolean exceeded(long started,long observed,long limitMillis){
        return started<0||observed<started||limitMillis<0||
            observed-started>limitMillis;
    }
    static boolean candidateLimitExceeded(int count,int limit){
        return count<0||limit<0||count>limit;
    }
}

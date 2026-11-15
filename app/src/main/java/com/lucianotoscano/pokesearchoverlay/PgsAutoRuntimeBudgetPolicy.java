package com.lucianotoscano.pokesearchoverlay;

/** LT357: proteção de orçamento do scanner sem destruir o catálogo global. */
final class PgsAutoRuntimeBudgetPolicy {
    static final int MAX_NATIVE_PER_SPECIES=12;
    static final int MAX_ACTIVE_NATIVE=64;
    static final int MAX_VERIFY_ATTEMPTS_PER_SPECIES=20;
    static final int MAX_TOTAL_VERIFY_ATTEMPTS=100;
    private PgsAutoRuntimeBudgetPolicy(){}
    static boolean mayVerify(int speciesAttempts,int totalAttempts,int speciesModels,int totalModels){
        return speciesAttempts>=0&&totalAttempts>=0&&speciesModels>=0&&totalModels>=0&&
            speciesAttempts<MAX_VERIFY_ATTEMPTS_PER_SPECIES&&
            totalAttempts<MAX_TOTAL_VERIFY_ATTEMPTS&&
            speciesModels<MAX_NATIVE_PER_SPECIES&&totalModels<MAX_ACTIVE_NATIVE;
    }
}

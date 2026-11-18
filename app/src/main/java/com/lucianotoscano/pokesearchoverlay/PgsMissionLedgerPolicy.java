package com.lucianotoscano.pokesearchoverlay;

/** LT408: registro manual, conservador; nunca infere recompensas pelo GPX. */
final class PgsMissionLedgerPolicy {
    static final int UNKNOWN=0, TASK_CONFIRMED=1, REWARD_REDEEMED=2;
    static final int CANDY_PER_VERIFIED_REWARD=25;
    private PgsMissionLedgerPolicy(){}
    static int normalize(int state) {
        return state==TASK_CONFIRMED||state==REWARD_REDEEMED?state:UNKNOWN;
    }
    static int confirmTask(int state) {
        return normalize(state)==REWARD_REDEEMED?REWARD_REDEEMED:TASK_CONFIRMED;
    }
    static int redeem(int state) {
        return normalize(state)==TASK_CONFIRMED?REWARD_REDEEMED:normalize(state);
    }
    static int clear(int state) { return UNKNOWN; }
    static int candies(int[] states) {
        int count=0;
        if(states!=null)for(int state:states)
            if(normalize(state)==REWARD_REDEEMED)count+=CANDY_PER_VERIFIED_REWARD;
        return count;
    }
    static int count(int[] states,int target) {
        int result=0;
        if(states!=null)for(int state:states)if(normalize(state)==target)result++;
        return result;
    }
}

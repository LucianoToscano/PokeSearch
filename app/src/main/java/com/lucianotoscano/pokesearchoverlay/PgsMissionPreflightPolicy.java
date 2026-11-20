package com.lucianotoscano.pokesearchoverlay;

/**
 * LT408 video audit: local, user-acknowledged prerequisites for a GPX research
 * session. No direct read access to PGSharp/game state. Never authorizes
 * teleporting, spinning, throws, collection or background automation.
 */
final class PgsMissionPreflightPolicy {
    static final int ROUTE_SOURCE_CURRENT=1<<0;
    static final int FIELD_RESEARCH_SLOTS=1<<1;
    static final int POKEMON_STORAGE=1<<2;
    static final int ITEM_STORAGE=1<<3;
    static final int PGSHARP_SPIN_CONFIG=1<<4;
    static final int ETERNATUS_REWARD_CONFIRMED=1<<5;
    static final int WAIT_COOLDOWN_REVIEWED=1<<6;
    static final int[] ITEMS={
        ROUTE_SOURCE_CURRENT,
        FIELD_RESEARCH_SLOTS,
        POKEMON_STORAGE,
        ITEM_STORAGE,
        PGSHARP_SPIN_CONFIG,
        ETERNATUS_REWARD_CONFIRMED,
        WAIT_COOLDOWN_REVIEWED
    };
    static final int ALL=(1<<7)-1;
    // A refreshed acknowledgement is not evidence of current server tasks.
    static final long MAX_ACK_AGE_MS=24L*60*60*1000;
    private PgsMissionPreflightPolicy(){}

    static int sanitize(int mask) { return mask & ALL; }
    static int set(int mask,int flag,boolean enabled){
        if((flag & ALL)==0 || Integer.bitCount(flag)!=1) return sanitize(mask);
        return sanitize(enabled ? (mask|flag) : (mask&~flag));
    }
    static int count(int mask) { return Integer.bitCount(sanitize(mask)); }
    static boolean complete(int mask) { return sanitize(mask)==ALL; }
    static boolean current(long savedAtMs,long nowMs){
        return savedAtMs>0 && nowMs>=savedAtMs
            && nowMs-savedAtMs<MAX_ACK_AGE_MS;
    }
}

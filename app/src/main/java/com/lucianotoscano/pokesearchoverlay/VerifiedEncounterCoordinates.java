package com.lucianotoscano.pokesearchoverlay;

import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Short-lived, service-local cache of coordinates ALREADY verified by the provider.
 * This is never a cache of reveal codes or credentials; it does not use disk,
 * preferences, Firebase or cross-service state. Caller owns encounter identity.
 */
final class VerifiedEncounterCoordinates {
    private static final class Entry {
        final String coordinates;
        final long expiresAtMs;
        Entry(String value, long expiry) { coordinates=value; expiresAtMs=expiry; }
    }
    private final int limit;
    private final LinkedHashMap<String,Entry> entries =
        new LinkedHashMap<>(16,0.75f,true);

    VerifiedEncounterCoordinates(int limit) { this.limit=Math.max(1,Math.min(limit,100)); }

    synchronized void put(String encounterKey,String verifiedCoords,long expiry,long now){
        prune(now);
        if(encounterKey==null||encounterKey.isEmpty()||verifiedCoords==null||
           verifiedCoords.isEmpty()||expiry<=now||expiry-now>24L*60*60*1000)return;
        entries.put(encounterKey,new Entry(verifiedCoords,expiry));
        while(entries.size()>limit){
            Iterator<String> oldest=entries.keySet().iterator();
            if(!oldest.hasNext())break;
            oldest.next();oldest.remove();
        }
    }

    synchronized String get(String encounterKey,long now){
        prune(now);
        Entry entry=encounterKey==null?null:entries.get(encounterKey);
        return entry==null?"":entry.coordinates;
    }

    synchronized void clear(){entries.clear();}

    private void prune(long now){
        for(Iterator<Map.Entry<String,Entry>> it=entries.entrySet().iterator();it.hasNext();){
            if(it.next().getValue().expiresAtMs<=now)it.remove();
        }
    }
}

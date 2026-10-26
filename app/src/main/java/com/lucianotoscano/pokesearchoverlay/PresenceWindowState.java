package com.lucianotoscano.pokesearchoverlay;

/** No location, trainer or account data. All three local windows contribute to presence. */
final class PresenceWindowState {
    private PresenceWindowState(){}
    static boolean isActive(boolean home,boolean primary,boolean secondary){
        return home||primary||secondary;
    }
}

package com.lucianotoscano.pokesearchoverlay;

import java.util.Locale;

/**
 * PokeSearch public version labels use two digits PER GROUP, never 0.00.100+.
 *
 *     0.00.99 -> 0.01.00 -> 0.01.01 ... 0.01.06 -> 0.01.07
 *
 * Historical GitHub releases/APK signatures are immutable. Normalize their
 * DISPLAY only, retaining original asset URLs, SHA-256, signing and versionCode.
 */
public final class VersionNames {
    private VersionNames() {}
    /** Canonical display for a historical label, or the unchanged input if unknown. */
    public static String canonical(String original) {
        if(original==null)return "";
        String candidate=original.trim();
        if(!candidate.matches("0\\.\\d{2}\\.\\d{2,4}"))return candidate;
        String[] parts=candidate.split("\\.");
        try{
            long minor=Long.parseLong(parts[1]);
            long patch=Long.parseLong(parts[2]);
            if(minor>=100)return candidate;
            minor+=patch/100;
            patch%=100;
            if(minor>99)return candidate;
            return String.format(Locale.ROOT,"0.%02d.%02d",minor,patch);
        }catch(NumberFormatException e){return candidate;}
    }
    /** Previously signed public releases cannot be renamed in place.
     * Only their already-published 100..106 identities may be read from older
     * Drive update manifests; new builds MUST use canonical labels. */
    public static boolean isLegacyPublished(String version){
        if(version==null||!version.matches("0\\.00\\.10[0-6]"))return false;
        return true;
    }

    /** Required on all new builds and displayed remote versions. */
    public static boolean isCanonical(String version){
        if(version==null||!version.matches("0\\.\\d{2}\\.\\d{2}"))return false;
        return version.equals(canonical(version));
    }
}

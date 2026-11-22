package com.lucianotoscano.pokesearchoverlay;

import java.text.Normalizer;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;

/**
 * Independent local-display filters adapted to the PokeSearch radar.
 * Inspired by map UI patterns, but does not import ReactMap code or invoke
 * third-party API endpoints. Unknown IV/CP/level never satisfies a strict
 * condition. Empty local filters leave known provider results visible.
 */
final class PokeListLocalFilterPolicy {
    static final class Criteria {
        final String sourceType, query, providerIds;
        final int ivMin, cpMin, levelMin;
        final boolean iv100Only, requireCoordinates;
        final Set<Integer> requestedSpecies = new LinkedHashSet<>();

        Criteria(String sourceType, String providerIds, int ivMin, String query,
                 int cpMin, int levelMin, boolean iv100Only, boolean requireCoordinates) {
            this.sourceType = sourceType == null ? "" : sourceType;
            this.providerIds = providerIds == null ? "" : providerIds;
            this.ivMin = bound(ivMin, 0, 100, "IV");
            this.query = normalized(query);
            this.cpMin = bound(cpMin, 0, 20000, "PC");
            this.levelMin = bound(levelMin, 0, 55, "Nível");
            this.iv100Only = iv100Only;
            this.requireCoordinates = requireCoordinates;
            if ("pokemon".equals(this.sourceType) && !this.providerIds.isEmpty()) {
                for (String raw : this.providerIds.split(",")) {
                    try {
                        int id = Integer.parseInt(raw.trim());
                        if (id < 1 || id > 1025) throw new IllegalArgumentException();
                        requestedSpecies.add(id);
                    } catch (NumberFormatException bad) {
                        throw new IllegalArgumentException("IDs inválidos no filtro de espécies");
                    }
                }
            }
        }
        private static int bound(int v, int lo, int hi, String label) {
            if (v < lo || v > hi) throw new IllegalArgumentException(label + " fora do intervalo");
            return v;
        }
        boolean accepts(int dex, String name, int iv, int cp, int level,
                        boolean hasCoordinates, boolean expiryKnown, long expires, long now) {
            if (expiryKnown && expires <= now) return false;
            if (requireCoordinates && !hasCoordinates) return false;
            if (!query.isEmpty()) {
                if (query.startsWith("#") || query.matches("[0-9]{1,4}")) {
                    String number = query.startsWith("#") ? query.substring(1) : query;
                    if (!number.matches("[0-9]{1,4}")) return false;
                    int target;
                    try { target = Integer.parseInt(number); }
                    catch (NumberFormatException bad) { return false; }
                    if (target != dex) return false;
                } else {
                    String cleanedName = normalized(name);
                    for (String word : query.split("\\s+")) {
                        if (!cleanedName.contains(word)) return false;
                    }
                }
            }
            if ("pokemon".equals(sourceType) && !requestedSpecies.isEmpty()
                    && !requestedSpecies.contains(dex)) return false;
            // IV only has meaning on Pokémon; don't drop raids/quests/Rocket
            // just because an old Pokémon-specific IV preference remained.
            if ("pokemon".equals(sourceType)) {
                if (iv100Only && iv != 100) return false;
                if (ivMin > 0 && (iv < 0 || iv < ivMin)) return false;
            }
            if (cpMin > 0 && (cp < 0 || cp < cpMin)) return false;
            if (levelMin > 0 && (level < 0 || level < levelMin)) return false;
            return true;
        }
    }

    private PokeListLocalFilterPolicy() {}
    private static String normalized(String s) {
        if (s == null) return "";
        String text = Normalizer.normalize(s.toLowerCase(Locale.ROOT).trim(),
                Normalizer.Form.NFD);
        return text.replaceAll("\\p{M}+", "")
                .replaceAll("[^\\p{L}\\p{N}# ]+", " ").trim();
    }
}

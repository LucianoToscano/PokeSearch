package com.lucianotoscano.pokesearchoverlay;

/** Scope only Favorites window geometry by Pokéball; selection remains global. */
final class FavoritePanelPositionKeys {
    private FavoritePanelPositionKeys() {}
    static String key(boolean secondary, String base) {
        if (!("favoritePanelManualV1".equals(base) ||
              "favoritePanelXV1".equals(base) ||
              "favoritePanelYV1".equals(base) ||
              "favoritePanelScreenWV1".equals(base) ||
              "favoritePanelScreenHV1".equals(base))) {
            throw new IllegalArgumentException("Unexpected Favorites geometry key");
        }
        return secondary ? base + "P2" : base;
    }
}

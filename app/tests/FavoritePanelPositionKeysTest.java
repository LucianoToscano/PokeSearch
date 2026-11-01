package com.lucianotoscano.pokesearchoverlay;

public final class FavoritePanelPositionKeysTest {
    public static void main(String[] args) {
        String[] keys = {
            "favoritePanelManualV1", "favoritePanelXV1", "favoritePanelYV1",
            "favoritePanelScreenWV1", "favoritePanelScreenHV1"
        };
        java.util.Set<String> all = new java.util.HashSet<>();
        for (String key : keys) {
            String p1 = FavoritePanelPositionKeys.key(false, key);
            String p2 = FavoritePanelPositionKeys.key(true, key);
            if (!key.equals(p1) || !(key + "P2").equals(p2) ||
                p1.equals(p2) || !all.add(p1) || !all.add(p2)) {
                throw new AssertionError("P1/P2 window keys not isolated: " + key);
            }
        }
        boolean rejected = false;
        try { FavoritePanelPositionKeys.key(true, "favoritePresetActiveV1"); }
        catch (IllegalArgumentException expected) { rejected = true; }
        if (!rejected) throw new AssertionError("Favorite profile keys must NOT be rewritten");
        System.out.println("PASS LT213 Favorites positions independent; " + all.size() + " keys checked");
    }
}

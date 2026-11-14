package com.lucianotoscano.pokesearchoverlay;

import java.net.URI;
import java.util.Locale;

/**
 * Permite capturas somente da página oficial de Perfil solicitada pelo usuário.
 * Login, OAuth, outras origens, erros e URLs ambíguas mantêm FLAG_SECURE.
 */
final class ProfileScreenshotPolicy {
    private ProfileScreenshotPolicy() {}

    static boolean allowsScreenshot(String purpose, String pageUrl, boolean loadedSuccessfully) {
        if (!loadedSuccessfully || !"manage".equals(purpose) || pageUrl == null) return false;
        try {
            URI uri = new URI(pageUrl);
            String host = uri.getHost();
            return "https".equalsIgnoreCase(uri.getScheme())
                && host != null
                && "pogocoordinates.com".equals(host.toLowerCase(Locale.ROOT))
                && "/profile".equals(uri.getPath())
                && uri.getUserInfo() == null;
        } catch (Exception ignored) {
            return false;
        }
    }
}

package com.lucianotoscano.pokesearchoverlay;

/**
 * Compatibilidade para testes legados. A partir da LT343 nenhuma janela
 * controlada pelo PokeSearch bloqueia screenshots; filtros e flags antigas
 * de Perfil/Login foram desativados a pedido do responsável.
 * OAuth externo pode aplicar proteções próprias fora do aplicativo.
 */
final class ProfileScreenshotPolicy {
    private ProfileScreenshotPolicy() {}
    static boolean allowsScreenshot(String purpose,String pageUrl,boolean loadedSuccessfully) {
        return true;
    }
}

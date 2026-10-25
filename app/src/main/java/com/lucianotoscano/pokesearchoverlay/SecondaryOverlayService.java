package com.lucianotoscano.pokesearchoverlay;

/**
 * An independent second floating PokeSearch collector.
 *
 * It shares Android WebView cookies/authentication with the primary service,
 * while OverlayService scopes persistent filters, modes, locations, positions,
 * refresh generations and results to the service instance.  UI sprites and
 * Pokeball graphics remain dynamically derived from the selected filter.
 */
public final class SecondaryOverlayService extends OverlayService {
    @Override protected boolean isSecondaryOverlay(){return true;}
}

package com.lucianotoscano.pokesearchoverlay;

/**
 * Temporary capability switches for upstream PoGoCoordinates availability.
 *
 * As reported 2026-10-31: ordinary searches remain available both anonymously
 * and with an authenticated account. Trainer linking and Shiny prediction are
 * currently unavailable upstream. Do not infer that a missing trainer means
 * the ordinary Pokemon search requires a login.
 *
 * Keep account profiles, saved trainer selections and underlying verified
 * Shiny implementation intact, so this can be re-enabled after upstream
 * service verification; never silently erase user data.
 */
final class ProviderFeatureFlags {
    static final boolean SHINY_AVAILABLE = false;
    static final boolean TRAINER_SELECTION_AVAILABLE = SHINY_AVAILABLE;

    private ProviderFeatureFlags() {}
}

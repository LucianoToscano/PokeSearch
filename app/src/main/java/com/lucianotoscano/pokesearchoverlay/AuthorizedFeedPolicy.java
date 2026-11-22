package com.lucianotoscano.pokesearchoverlay;

import java.net.URI;
import java.util.Locale;

/**
 * Client-side policy for an operator-controlled Golbat/PokeSearch gateway.
 * This is NOT a connection to a game server or PGSharp and cannot grant
 * permission to commercial feeds. No credentials go into URLs or prefs.
 */
final class AuthorizedFeedPolicy {
    private AuthorizedFeedPolicy() {}

    static String baseUrl(String input) {
        if (input == null || input.trim().isEmpty() || input.length() > 300)
            throw new IllegalArgumentException("Informe o endereço HTTPS do feed autorizado.");
        try {
            URI u = URI.create(input.trim());
            if (!"https".equalsIgnoreCase(u.getScheme()) || u.getHost() == null
                    || u.getRawUserInfo() != null || u.getRawQuery() != null
                    || u.getRawFragment() != null || u.getHost().isEmpty())
                throw new IllegalArgumentException("Use HTTPS sem login, query ou fragmento.");
            if (u.getPort() == 0 || u.getPort() > 65535 || u.getPort() < -1)
                throw new IllegalArgumentException("Porta inválida.");
            String path = u.getRawPath();
            if (path != null && (path.contains("..") || path.contains("\\")
                    || path.contains("%2f") || path.contains("%2F")
                    || path.contains("%5c") || path.contains("%5C")))
                throw new IllegalArgumentException("Caminho inseguro no feed.");
            String base = input.trim();
            while (base.endsWith("/")) base = base.substring(0,base.length()-1);
            return base;
        } catch (IllegalArgumentException bad) {
            if (bad.getMessage() != null
                    && (bad.getMessage().startsWith("Use HTTPS")
                        || bad.getMessage().startsWith("Caminho inseguro")
                        || bad.getMessage().startsWith("Porta inválida")))
                throw bad;
            throw new IllegalArgumentException("Endereço HTTPS inválido.");
        }
    }

    static String validateToken(String raw) {
        if (raw == null || raw.length() < 24 || raw.length() > 256)
            throw new IllegalArgumentException("A chave de leitura deve ter 24 a 256 caracteres.");
        for (int i=0;i<raw.length();i++) {
            char c=raw.charAt(i);
            if (c<33 || c>126)
                throw new IllegalArgumentException("Chave de leitura com caracteres inválidos.");
        }
        return raw;
    }

    static String requestUrl(String base, PokeListApiPolicy.Query query) {
        String url=baseUrl(base);
        if (!"pokemon".equals(query.type))
            throw new IllegalArgumentException("O gateway Golbat configurado recebe apenas Pokémon; não inventa reides, missões ou Rocket.");
        // The operator's gateway serves one bounded viewport. A user-entered
        // radius >25 km is not silently presented as a 200 km live search.
        if (query.distance > 25)
            throw new IllegalArgumentException("Para o gateway, escolha um raio de 1 a 25 km.");
        double lat=query.latitude, lon=query.longitude, radiusKm=query.distance;
        double deltaLat=radiusKm/111.32;
        double deltaLon=radiusKm/Math.max(1.0,111.32*Math.abs(Math.cos(Math.toRadians(lat))));
        double swLat=Math.max(-90,lat-deltaLat), neLat=Math.min(90,lat+deltaLat);
        double swLon=Math.max(-180,lon-deltaLon), neLon=Math.min(180,lon+deltaLon);
        StringBuilder params=new StringBuilder(url).append("/raw_data?pokemon=true");
        params.append(String.format(Locale.ROOT,
            "&swLat=%.6f&swLng=%.6f&neLat=%.6f&neLng=%.6f",
            swLat,swLon,neLat,neLon));
        if (query.ivMin>0)params.append("&iv_min=").append(query.ivMin);
        // Server currently supports one species at a time; the Android local
        // allowlist still handles multiple IDs returned by a broad viewport.
        if (!query.monIds.isEmpty() && query.monIds.indexOf(',')<0)
            params.append("&pokemon_id=").append(query.monIds);
        return params.toString();
    }
}

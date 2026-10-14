package com.lucianotoscano.pokesearchoverlay;

/**
 * Sanitizes user-supplied diagnostics before storage and before export.
 * Uses a conservative denylist; users must still review reports before sharing.
 * This class has no Android dependencies and is tested with plain Java.
 */
final class DiagnosticSanitizer {
    private static final int MAX_FIELD_LENGTH=220;
    private DiagnosticSanitizer(){}

    static String clean(String value){
        if(value==null)return "";
        String safe=value.replaceAll("[\\r\\n\\u2028\\u2029]+"," ");
        // Full web links often include credentials and location in their query strings.
        safe=safe.replaceAll("(?i)https?://\\S+","[link omitido]");
        // Authorization header and other credentials, including quoted values with spaces.
        safe=safe.replaceAll("(?i)\\b(?:Bearer|Basic)\\s+[A-Za-z0-9._~+/-]{6,}={0,2}","[credencial omitida]");
        safe=safe.replaceAll("(?i)\\b(?:Cookie|Set-Cookie|Authorization)\\s*:\\s*[^\\r\\n]+","[credencial omitida]");
        safe=safe.replaceAll("(?i)(?<![\\p{L}\\p{N}_])" +
            "((?:password|passwd|pwd|senha|passphrase|access[_-]?token|" +
            "refresh[_-]?token|id[_-]?token|auth[_-]?token|token|" +
            "api[_-]?key|client[_-]?secret|session[_-]?id|secret))" +
            "\\s*[:=]\\s*(?:\\\"[^\\\"]*\\\"|'[^']*'|[^\\s,;]+)",
            "$1=[credencial omitida]");
        // JWTs can appear on their own, without a key/value label.
        safe=safe.replaceAll("(?i)\\beyJ[A-Za-z0-9_-]{8,}\\.eyJ[A-Za-z0-9_-]{8,}\\.[A-Za-z0-9_-]{8,}\\b",
            "[credencial omitida]");
        safe=safe.replaceAll("[\\w.+-]+@[\\w.-]+\\.[A-Za-z]{2,}","[email omitido]");
        safe=safe.replaceAll("(?<!\\d)(?:\\d[ -]?){12}(?!\\d)","[código omitido]");
        safe=safe.replaceAll("(?<!\\d)-?\\d{1,2}\\.\\d+\\s*[,;]\\s*-?\\d{1,3}\\.\\d+",
            "[coordenadas omitidas]");
        return safe.substring(0,Math.min(safe.length(),MAX_FIELD_LENGTH));
    }
}

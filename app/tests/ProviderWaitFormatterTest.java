package com.lucianotoscano.pokesearchoverlay;

public final class ProviderWaitFormatterTest {
    private static int checks = 0;
    private static void verify(long seconds, String expected) {
        String actual = ProviderWaitFormatter.format429(seconds);
        if (!expected.equals(actual)) {
            throw new AssertionError(seconds + " => " + actual + " != " + expected);
        }
        checks++;
    }
    public static void main(String[] args) {
        verify(-1L, "API 429 · 0m01s");
        verify(0L, "API 429 · 0m01s");
        verify(1L, "API 429 · 0m01s");
        verify(59L, "API 429 · 0m59s");
        verify(60L, "API 429 · 1m00s");
        verify(3599L, "API 429 · 59m59s");
        verify(3600L, "API 429 · 1h0m");
        verify(3601L, "API 429 · 1h1m");
        verify(7140L, "API 429 · 1h59m");
        verify(7141L, "API 429 · 2h0m");
        verify(7199L, "API 429 · 2h0m");
        verify(7200L, "API 429 · 2h0m");
        verify(10799L, "API 429 · 3h0m");
        verify(86400L, "API 429 · 24h0m");
        verify(Long.MAX_VALUE, "API 429 · 2562047788015215h31m");
        System.out.println("ProviderWaitFormatter: " + checks + "/" + checks + " PASS");
    }
}

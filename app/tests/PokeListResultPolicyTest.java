package com.lucianotoscano.pokesearchoverlay;

public final class PokeListResultPolicyTest {
    private static void ok(boolean v,String why){if(!v)throw new AssertionError(why);}
    public static void main(String[] args){
        double same=PokeListResultPolicy.distanceKm(-5.88,-35.24,-5.88,-35.24);
        ok(same==0d,"same center");
        double d=PokeListResultPolicy.distanceKm(0d,0d,0d,.001d);
        ok(d>0.11d&&d<0.112d,"haversine ~111 m");
        ok(Math.abs(d-PokeListResultPolicy.distanceKm(0d,.001d,0d,0d))<1e-9,
            "symmetric distance");
        ok(Double.isNaN(PokeListResultPolicy.distanceKm(91,0,0,0)),"invalid lat");
        ok(Double.isNaN(PokeListResultPolicy.distanceKm(0,0,0,181)),"invalid lon");
        ok(Double.isNaN(PokeListResultPolicy.distanceKm(Double.NaN,0,0,0)),
            "NaN cannot imply travel");
        ok("0 m".equals(PokeListResultPolicy.distanceLabel(0d)),"zero meters");
        ok("111 m".equals(PokeListResultPolicy.distanceLabel(d)),
            "below 1km is shown in meters");
        ok("2h00".equals(CandyCooldownPolicy.compactTimerLabel(
            PokeListResultPolicy.hypotheticalCooldownSeconds(2070d))),
            "long distance advisory from existing Rare Candy table");
        ok(PokeListResultPolicy.cooldownLabel(d).startsWith("CD de referência"),
            "never promise actual cooldown");
        ok("♂".equals(PokeListResultPolicy.genderLabel("male")),"male");
        ok("♀".equals(PokeListResultPolicy.genderLabel("female")),"female");
        ok(PokeListResultPolicy.genderLabel("1").isEmpty(),
            "unknown numeric gender not invented");
        ok("US".equals(PokeListResultPolicy.countryLabel("us")),"country code");
        ok(PokeListResultPolicy.countryLabel("BR<script>").isEmpty(),
            "unsafe country not shown");
        long now=1800000000000L;
        ok(PokeListResultPolicy.despawnLabel(0,now).contains("desconhecido"),
            "no fake despawn");
        ok("Expirado".equals(PokeListResultPolicy.despawnLabel(now-1,now)),
            "expired");
        ok(PokeListResultPolicy.despawnLabel(now+61_000L,now).contains("1m"),
            "future label");
        System.out.println("LT365 PokeList screenshot-inspired result, distance, IV and cooldown policy PASS");
    }
}

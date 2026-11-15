"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict");
const root="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const read=x=>fs.readFileSync(root+x+".java","utf8");
const radar=read("PokeListRadarActivity"),feed=read("PokeListFeedClient"),
      policy=read("PokeListResultPolicy"),candy=read("CandyCooldownPolicy"),
      qa=fs.readFileSync(".github/workflows/qa-core-contracts.yml","utf8"),
      manifest=fs.readFileSync("app/src/main/AndroidManifest.xml","utf8");

for(const feature of ["IV100","PC ","Nv ","Desaparece","Do centro:",
 "CD de referência","Copiar","Sinal da API"]){
 assert.ok((radar+policy).includes(feature),"visible screenshot-derived detail "+feature);
}
assert.match(radar,/new String\[\]\{"Ordem original","Mais próximos do centro",/);
assert.match(radar,/Desaparecem primeiro","IV maior","PC maior"/);
assert.match(radar,/onlyIv100\.setOnCheckedChangeListener/);
assert.match(radar,/sortMode\.setOnItemSelectedListener/);
assert.match(radar,/lastResponse=response/);
assert.match(radar,/lastQuery=q/);
assert.match(radar,/lastResponse\.items|data\.items/);
assert.match(radar,/PokeListResultPolicy\.distanceKm\(/);
assert.match(radar,/item\.expiryKnown&&item\.expiresAt<=now/);
assert.match(radar,/item\.expiryKnown&&item\.expiresAt<=System\.currentTimeMillis\(\)/);
assert.match(radar,/timeHandler\.postDelayed\(timeTick,15000L\)/);
assert.match(radar,/timeHandler\.removeCallbacks\(timeTick\)/);
assert.match(policy,/CandyCooldownPolicy\.recommendedSeconds\(km\*1000d\)/);
assert.match(policy,/CandyCooldownPolicy\.compactTimerLabel\(seconds\)/);
assert.match(policy,/CENTRO que a pessoa DIGITOU/);
assert.match(candy,/advisory only/);
assert.match(feed,/record\.optString\("gender",""\)/);
assert.match(feed,/record\.optString\("country",""\)/);
assert.match(feed,/record\.optBoolean\("shiny",false\)/);
assert.match(policy,/countryLabel\(String raw\)/);
assert.match(policy,/genderLabel\(String raw\)/);
assert.match(policy,/Expirado/);
assert.match(qa,/PokeListResultPolicy/);
const render=radar.split("private void renderResults(){")[1].split("private void updateVisibleTimes()")[0];
assert.doesNotMatch(render,/PokeListFeedClient\.fetch|dispatchGesture|getLastKnownLocation|startActivity\(/,
 "sorting and filters must not access remote service/game/GPS");
assert.match(radar,/Coordenadas copiadas manualmente/);
assert.doesNotMatch(radar,/getCurrentLocation|requestLocationUpdates|restartPokemonGo|forceStopPackage|ProcessBuilder/);
assert.doesNotMatch(manifest,/android\.permission\.(ACCESS_FINE_LOCATION|QUERY_ALL_PACKAGES|ACCESS_SUPERUSER)/);
console.log("LT365 screenshot-derived PokeList cards, sorting, timers and advisory cooldown contracts PASS");

"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict");
const base="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const get=name=>fs.readFileSync(base+name+".java","utf8");
const home=get("MainActivity"),api=get("PokeListApiPolicy"),
      feed=get("PokeListFeedClient"),radar=get("PokeListRadarActivity"),
      datahub=get("DataHubCatalogActivity");
const manifest=fs.readFileSync("app/src/main/AndroidManifest.xml","utf8");
const qa=fs.readFileSync(".github/workflows/qa-core-contracts.yml","utf8");
const native=JSON.parse(fs.readFileSync("app/src/main/assets/pgs-native/manifest.json","utf8"));
const catalog=JSON.parse(fs.readFileSync("app/src/main/assets/pokemon_catalog.json","utf8"));
assert.equal(catalog.length,1025,"1025 species already bundled in native catalogue");
assert.deepEqual(native.entries,[],"do not fake PGSharp/Pokemod feed templates");
for(const type of ["pokemon","raid","quest","rocket","rocket_leader"]){
 assert.ok(api.includes('"'+type+'"'),"known documented source "+type);
}
assert.match(api,/https:\/\/moonani\.com\/PokeList\/api\.v2\.php/,
 "HTTPS only exact source URL");
assert.match(api,/MAX_BODY_BYTES=512\*1024/,"bounded remote response");
assert.match(api,/MAX_VISIBLE=80/,"bounded UI");
assert.match(api,/&mons=&rockets=/,"rockets are not Pokémon species");
assert.match(api,/&iv_type=0&ivMin=/,"PokeList 0 means total IV percent");
assert.match(api,/epochMilliseconds\(long raw\)/,"ambiguous Unix s/ms handled");
assert.match(feed,/HttpsURLConnection/,"HTTPS cannot downgrade");
assert.match(feed,/setInstanceFollowRedirects\(false\)/);
assert.match(feed,/setConnectTimeout\(10000\)/);
assert.match(feed,/setReadTimeout\(10000\)/);
assert.match(feed,/MAX_BODY_BYTES/);
assert.match(feed,/expiresAt|expired\(/);
assert.match(feed,/new HashSet<>\(\)/);
assert.match(feed,/Retry-After/);
assert.doesNotMatch(feed,/dispatchGesture|AccessibilityService|FirebaseClient|ProcessBuilder|Runtime\\.getRuntime|\\bsu -c\\b/,
 "HTTPS-only source reader must not invoke root or accessibility actions");
assert.match(radar,/newSingleThreadExecutor\(\)/);
assert.match(radar,/SystemClock\.elapsedRealtime\(\)/);
assert.match(radar,/nextAllowedElapsed/);
assert.match(radar,/PokeListFeedClient\.fetch\(q\)/);
assert.match(radar,/ClipData\.newPlainText/);
assert.doesNotMatch(radar,/getLastKnownLocation|getCurrentLocation|requestLocationUpdates|postDelayed\(.*query/);
for(const label of ["Raids","Quests","Rocket","Power Spots"]){
 assert.ok(home.includes('"'+label+'".equals(description)'),"Home path "+label);
}
assert.match(home,/openPokeListRadar\("raid"\)/);
assert.match(home,/openPokeListRadar\("quest"\)/);
assert.match(home,/openPokeListRadar\("rocket"\)/);
assert.match(home,/openDataHubCatalog\(\)/);
assert.match(home,/addHomePreviewIcon\(dualOverlayRow,R\.drawable\.home_weather,"Weather"\)/,
 "keep future weather placeholder untouched");
assert.match(manifest,/\.PokeListRadarActivity" android:exported="false"/);
assert.match(manifest,/\.DataHubCatalogActivity" android:exported="false"/);
assert.doesNotMatch(manifest,/android\.permission\.(ACCESS_FINE_LOCATION|QUERY_ALL_PACKAGES|ACCESS_SUPERUSER)/);
assert.match(datahub,/net\.pgtools\.data_hub/);
for(const asset of ["pokemons.json","raidRatings.json","maxBattleRatings.json"])
 assert.ok(datahub.includes('"'+asset+'"'),"authorized Data Hub asset "+asset);
assert.match(datahub,/Intent\.ACTION_OPEN_DOCUMENT/);
assert.match(datahub,/ZipFile/);
assert.match(datahub,/getPackageManager\(\)\.getApplicationInfo\(DATA_HUB,0\)/);
assert.match(datahub,/readBounded\(/);
assert.match(datahub,/getFilesDir\(\)/);
assert.match(datahub,/sourceDir/);
assert.doesNotMatch(datahub,/DexClassLoader|Runtime\.getRuntime|ProcessBuilder|System\.load|startActivityForResult\(.*INSTALL/);
assert.match(qa,/PokeListApiPolicy/);
console.log("LT364 manual authorized PokeList radar + safe offline Data Hub APK catalog contracts PASS");

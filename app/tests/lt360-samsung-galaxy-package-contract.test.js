"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs");
const base="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const policy=fs.readFileSync(base+"PgsAutoHostPolicy.java","utf8");
const service=fs.readFileSync(base+"PgsAutoClickService.java","utf8");
const manifest=fs.readFileSync("app/src/main/AndroidManifest.xml","utf8");
assert.match(policy,/SAMSUNG_GAME_PACKAGE="com\.nianticlabs\.pokemongo\.ares"/,
  "Galaxy Store game has distinct package");
assert.match(policy,/return GAME_PACKAGE\.equals\(packageName\)\|\|\s*SAMSUNG_GAME_PACKAGE\.equals\(packageName\)/,
  "whitelist exact official Play and Galaxy game packages");
assert.match(service,/if\(PgsAutoHostPolicy\.POKEMOD\.equals\(PgsAutoHostSettings\.current\(this\)\)\)\s+return PgsAutoHostPolicy\.isGameWindow\(pkg\)/,
  "Pokemod never treats the manager as game");
assert.match(service,/return PgsAutoHostPolicy\.isGameWindow\(pkg\)\|\|/,
  "legacy PGSharp also recognizes official Galaxy Store game");
assert.match(manifest,/<package android:name="com\.nianticlabs\.pokemongo\.ares"\s*\/>/,
  "exact Android package visibility for Galaxy");
assert.match(manifest,/<package android:name="com\.pokemod\.app\.public"\s*\/>/,
  "exact Android package visibility for Pokemod manager");
assert.doesNotMatch(manifest,/android\.permission\.(QUERY_ALL_PACKAGES|MANAGE_EXTERNAL_STORAGE)/,
  "never broaden app permissions to support Galaxy");
assert.match(service,/holdForPassengerPrompt\(\)/);
assert.match(service,/gameAccountSafetyNoticePresent\(\)/);
console.log("LT360 Samsung Galaxy Store package exact match and safety PASS");

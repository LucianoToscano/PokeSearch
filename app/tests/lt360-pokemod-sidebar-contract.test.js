"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs");
const base="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const source=name=>fs.readFileSync(base+name+".java","utf8");
const policy=source("PgsAutoScanRegionPolicy");
const host=source("PgsAutoHostPolicy"),settings=source("PgsAutoHostSettings");
const detector=source("PgsAutoIconDetector"),menu=source("PgsAutoMenus");
const clicker=source("PgsAutoClickService");
const native=JSON.parse(fs.readFileSync("app/src/main/assets/pgs-native/manifest.json","utf8"));
assert.deepEqual(native.entries,[],"native feed sprite license gate remains empty");
assert.match(policy,/width>=height\?\.34f:\.28f/,"legacy scan fractions unchanged");
assert.match(policy,/centerY<height\*\.07f\|\|centerY>height\*\.91f/);
assert.match(policy,/RIGHT\.equals\(side\(preferredSide\)\)\?onRight:onLeft/);
assert.match(policy,/return onLeft\|\|onRight/,"PGSharp both edges");
assert.match(policy,/static int firstX/);
assert.match(policy,/static int lastX/);
assert.match(settings,/getString\("pokemod_sidebar_side"/);
assert.match(settings,/putString\("pokemod_sidebar_side"/);
assert.match(detector,/PgsAutoScanRegionPolicy\.inside\(hostProfile,sidebarSide/);
assert.match(detector,/PgsAutoScanRegionPolicy\.firstX/);
assert.match(detector,/PgsAutoScanRegionPolicy\.lastX/);
assert.match(detector,/for\(int x=scanFromX;x<=scanToX;x\+=scanStep\)/);
assert.match(menu,/PgsAutoHostSettings\.setSidebarSide\(context/);
assert.match(menu,/actions\.modelsChanged\(\)/);
assert.match(menu,/mount\(root,230,PgsAutoHostPolicy\.POKEMOD\.equals\(current\)\?293:254\)/,
  "same compact 230dp menu with one local diagnostic row");
assert.match(menu,/diagnostic\.setOnClickListener\(v->showCompanionDiagnostics\(\)\)/,
  "new diagnostics stays inside existing compact host menu");
assert.match(clicker,/Pokemod: recorte apenas o desenho do Pokémon na lista lateral/);
assert.match(clicker,/Não inclua o círculo, o fundo do mapa ou o botão de radar/);
assert.match(clicker,/PgsAutoHostPolicy\.mayAutoTap\(/);
assert.match(clicker,/holdForPassengerPrompt\(\)/);
assert.match(host,/return !OTHER\.equals\(profile\(profile\)\)/,"non-homologated other never touches");
assert.doesNotMatch(fs.readFileSync("app/src/main/AndroidManifest.xml","utf8"),
    /android\.permission\.(QUERY_ALL_PACKAGES|MANAGE_EXTERNAL_STORAGE)/);
console.log("LT360 Pokemod sidebar ROI, profile, preview and safety structural contracts PASS");

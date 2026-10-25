"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const dir=path.join(__dirname,"../src/main");
const dock=fs.readFileSync(path.join(dir,"assets/dock.html"),"utf8");
const picker=fs.readFileSync(path.join(dir,"java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java"),"utf8");
const native=fs.readFileSync(path.join(dir,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const contract=require("../src/main/assets/api_result_contract.js");
const checked=(label,fn)=>{fn();console.log("PASS LT86 Samsung "+label);};
checked("native sprite fanout updates all waiting favorites even for one dex",()=>{
 assert.match(picker,/Map<Integer,java\.util\.List<WeakReference<ImageView>>> WAITING/);
 assert.match(picker,/waiting\.add\(new WeakReference<>\(image\)\)/);
 assert.match(picker,/WAITING\.remove\(id\)/);
 assert.match(picker,/for\(WeakReference<ImageView> weak:waiting\)/);
 assert.match(picker,/android\.os\.Looper\.getMainLooper/);
 assert.match(picker,/cdn\.jsdelivr\.net\/gh\/PokeAPI\/sprites@master/);
 assert.match(picker,/if\(connection\.getResponseCode\(\)!=200\)continue/);
});
checked("only known base sprites retry on verified CDN, never forms",()=>{
 assert.match(dock,/const spriteRequestCache=new Map\(\)/);
 assert.match(dock,/pooledBaseSprite\(item\.image\)/);
 assert.match(dock,/https:\/\/cdn\.jsdelivr\.net\/gh\/PokeAPI\/sprites@master\/sprites\/pokemon\//);
 assert.match(dock,/button\.appendChild\(placeholder\)/);
 const api=fs.readFileSync(path.join(dir,"assets/api_android_session.js"),"utf8");
 assert.match(api,/form===species\+"NORMAL"/);
 assert.match(api,/baseForm/);
 assert.match(api,/options\.push\(\{label,dex:String\(id\),image\}\)/);
});
checked("Genderless ⚲ visible in information with neutral style",()=>{
 assert.match(dock,/if\(raw==="⚲"\|\|raw==="Genderless"\)/);
 assert.match(dock,/genderInfo genderless/);
 const now=Date.now();
 const sample=contract.normalizeResponse({results:[{
  pokemon_id:100,pokemon_name:"Voltorb",cp:700,level:20,
  raw_iv:"15/15/15",iv_percent:100,gender:"Genderless",
  despawn_at:new Date(now+120000).toISOString()
 }]},{nowMs:now});
 assert.equal(sample.ok,true);
 assert.equal(sample.cards[0].gender,"⚲");
});
checked("drag freely clamps results without trapping Pokébola",()=>{
 const region=native.split("final boolean[] dockHeld={false};")[1]?.split("root.addView(grip,",1)[0]||"";
 assert.ok(region.includes("A wide information/result pane must NOT forbid reaching"));
 assert.ok(!region.includes("minDx=Math.max(minDx,-dragResultStart[0]);"));
 assert.ok(region.includes("Math.max(0,d.widthPixels-resultParams.width)"));
 assert.ok(region.includes("positionResultsUnderPokeball(false);"));
});
checked("three general and favorite snapshots without overwriting old preferences",()=>{
 for(const bridge of ["requestGeneralFilterPresets","saveGeneralFilterPreset","loadGeneralFilterPreset"])
  assert.ok(native.includes("@JavascriptInterface public void "+bridge));
 assert.match(native,/new Bridge\(\)\.setSearchConfig\(value\)/);
 assert.match(native,/generalFilterPresetV1_/);
 assert.match(native,/blacklistPokemonIds/);
 assert.match(dock,/generalPresetFlyout/);
 assert.match(dock,/generalPresetSaved/);
 assert.match(picker,/favoritePresetV1_/);
 assert.match(picker,/setOnLongClickListener/);
 assert.match(picker,/WatchAlerts\.canonicalList\(p\.getString\(key,""\)\)/);
});

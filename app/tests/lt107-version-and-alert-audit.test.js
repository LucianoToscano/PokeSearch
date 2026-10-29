"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../src/main");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const contract=require("../src/main/assets/api_result_contract.js");
const java=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const apiBridge=read("assets/api_android_session.js");
const spriteCache=read("java/com/lucianotoscano/pokesearchoverlay/VerifiedSpriteCache.java");
const watch=read("java/com/lucianotoscano/pokesearchoverlay/WatchAlerts.java");
const picker=read("java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java");
const vers=read("java/com/lucianotoscano/pokesearchoverlay/VersionNames.java");
const gradle=fs.readFileSync(path.join(__dirname,"../build.gradle.kts"),"utf8");
const notes=JSON.parse(read("assets/release_notes.json"));
let ok=0;
function check(name,fn){fn();ok++;console.log("PASS LT107 "+name);}
const card=(overrides={})=>({
 encounter_id:"999",pokemon_id:25,pokemon_name:"Pikachu",form:"PIKACHU_NORMAL",
 cp:950,level:20,raw_iv:"15/15/15",iv_percent:100,gender:"Female",
 location:"Example City",despawn_at:"2099-10-25T05:00:00Z",shiny:false,
 ...overrides
});
const normalize=(spawn,shiny=false)=>contract.normalizeResponse({results:[spawn],cap:10},
 {nowMs:Date.UTC(2026,9,25),shiny});
const base="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
check("API exact default form gets the bundled PokeAPI sprite",()=>{
 const r=normalize(card());
 assert.equal(r.ok,true);
 assert.equal(r.cards.length,1);
 assert.equal(r.cards[0].image,base+"25.png");
 assert.equal(normalize(card({form:"Pikachu Default"})).cards[0].image,base+"25.png");
 assert.equal(normalize(card({form:"normal"})).cards[0].image,base+"25.png");
});
check("non-base, costume, and regional forms cannot receive a misleading base sprite",()=>{
 for(const form of ["PIKACHU_COSPLAY","ALOLAN","GALARIAN","SHADOW","GALARIAN_ZEN"]){
  assert.equal(normalize(card({form})).cards[0].image,"",form);
 }
 assert.equal(normalize(card({form:"PIKACHU_NORMAL",costume_id:23})).cards[0].image,"");
});
check("shiny has its own packaged sprite and never uses normal sprite",()=>{
 const r=normalize(card({shiny:true}),true);
 assert.equal(r.cards.length,1);
 assert.equal(r.cards[0].image,base+"shiny/25.png");
});
check("both native WebViews reuse exact 2050 packaged Dex resources",()=>{
 assert.match(java,/isSecondaryOverlay\(\)\?74:73/);
 assert.equal((java.match(/OtaAssets\.intercept\(OverlayService\.this,otaWebLoader,request\.getUrl\(\)\)/g)||[]).length,5);
 assert.match(spriteCache,/bundledSprite\(context,dex,shiny\)/);
 assert.match(spriteCache,/pokemon-sprites\//);
 assert.match(picker,/VerifiedSpriteCache\.bundledSprite\(context,id,false\)/);
});
check("API results are alert eligible only after real HTTP response evidence and IV gate",()=>{
 const body=java.split("private void applyCollectedResults(JSONObject r)")[1].split("private void resize(",1)[0];
 assert.match(body,/boolean apiConfirmed=authorizedApiQa&&/);
 assert.match(body,/r\.optBoolean\("criteriaConfirmed",false\)/);
 assert.match(body,/r\.optBoolean\("requestValidated",false\)/);
 assert.match(body,/r\.optBoolean\("resultChanged",false\)/);
 assert.match(body,/api-http-200/);
 assert.match(body,/recordNewResults\(sorted,r\.optBoolean\("leagueConfirmed",false\)\)/);
 assert.match(body,/verifiedTargetCriteria\(card\)/);
 assert.match(apiBridge,/requestValidated:r\.requestValidated===true/);
 assert.ok(!body.includes('if(!authorizedApiQa)recordNewResults'));
});
check("never notify expired or reused spawn; independently check each alert mode",()=>{
 const body=java.split("private void recordNewResults(")[1].split("private void acknowledgeConfirmedExtraResets(")[0];
 assert.match(body,/if\(expiry<=now\)continue/);
 assert.match(body,/knownSpawns\.contains\(key\)/);
 assert.match(body,/WatchAlerts\.enabled\(this\)/);
 assert.match(body,/WatchAlerts\.matches\(c\.optString\("name",""\),wanted\)/);
 assert.match(java,/WatchAlerts\.match\(this,pending\.name,pending\.title,pending\.details/);
 assert.match(body,/!"off"\.equals\(alertsMode\)&&alerts/);
 assert.match(watch,/PREF_LIST="watchList"/);
 assert.match(watch,/getSharedPreferences\("prefs",0\)/);
 assert.match(picker,/favoritePresetActiveV1/);
 assert.match(picker,/for\(int slot=1;slot<=3;slot\+\+\)/);
});
check("Android upgrade code and public version names are independent, QA-only",()=>{
 assert.match(gradle,/POKE_TEST_VERSION_CODE/);
 assert.match(gradle,/Regex\("0\\\\\.\\\\d\{2\}\\\\\.\\\\d\{2\}"\)/);
 assert.match(vers,/minor\+=patch\/100/);
 assert.match(vers,/patch%=100/);
 assert.match(vers,/boolean isLegacyPublished/);
 const rel=notes.releases.find(x=>x.minVersionCode===54310);
 assert.ok(rel);
 assert.match(rel.title,/PokeSearch v0\.01\.06/);
});
console.log("LT107 VERSION + ALERT + SPRITES AUDIT "+ok+"/"+ok+" PASS");

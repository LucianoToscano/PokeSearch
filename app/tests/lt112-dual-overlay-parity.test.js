"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../src/main");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const service=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const secondary=read("java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java");
const watched=read("java/com/lucianotoscano/pokesearchoverlay/WatchAlerts.java");
const main=read("java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const jsSprite=require("../src/main/assets/sprite_offline.js");
const contract=require("../src/main/assets/api_result_contract.js");
const guide=fs.readFileSync(path.join(__dirname,"../../docs/GUIA_MESTRE.md"),"utf8");
const agents=fs.readFileSync(path.join(__dirname,"../../AGENTS.md"),"utf8");
let successes=0;const check=(title,fn)=>{fn();successes++;console.log("PASS LT112 "+title);};
check("permanent parity policy applies to ALL features, not only one Pokeball",()=>{
 assert.match(agents,/REGRA OBRIGATÓRIA — PARIDADE DAS DUAS POKÉBOLAS/);
 assert.match(guide,/REGRA PERMANENTE — PARIDADE DE CORREÇÕES NAS DUAS POKÉBOLAS/);
 assert.match(agents,/API\/DOM/);
 assert.match(agents,/Favoritos/);
 assert.match(agents,/sprites/);
});
check("same Java results/search/assets implementation is inherited by BOTH services",()=>{
 assert.match(secondary,/extends OverlayService/);
 assert.match(secondary,/isSecondaryOverlay\(\)\{return true;\}/);
 assert.match(service,/getSharedPreferences\(isSecondaryOverlay\(\)\?"prefs_secondary":"prefs",0\)/);
 assert.match(service,/private void applyCollectedResults\(JSONObject r\)/);
 assert.match(service,/private void recordNewResults\(JSONArray cards,boolean leagueConfirmed\)/);
 assert.ok((service.match(/VerifiedSpriteCache\.fromDisk\(OverlayService\.this,request\.getUrl\(\)\)/g)||[]).length>=4);
});
check("favourite list/sounds shared but general-alert preferences isolated",()=>{
 assert.match(watched,/getSharedPreferences\("prefs",0\)/);
 assert.match(watched,/public static final String PREF_LIST="watchList"/);
 assert.match(watched,/WatchAlerts/); // The global class owns the shared list and mode.
 assert.match(service,/alertsMode=pref\.getString\("alertsMode",alerts\?"on":"off"\)/);
 assert.match(service,/WatchAlerts\.watched\(this\)/);
 assert.match(service,/WatchAlerts\.mode\(this\)/);
});
check("a previously seen spawn can alert when it becomes favourite, exactly once per instance",()=>{
 const start=service.indexOf("private void recordNewResults(JSONArray cards,boolean leagueConfirmed)");
 const end=service.indexOf("// A reset request is pending",start);
 assert.ok(start>0&&end>start);
 const body=service.slice(start,end);
 assert.match(service,/private final java\.util\.LinkedHashMap<String,Long> recentFavoriteAlertExpiries=/);
 assert.match(body,/boolean newSpawn=!knownSpawns\.contains\(key\)&&/);
 assert.match(body,/if\(newSpawn\)\{/);
 assert.match(body,/recentFavoriteAlertExpiries\.getOrDefault\(key,0L\)<=now/);
 assert.ok(body.includes('pendingFavoriteKeys.put(key,expireAt)'));
 assert.ok(body.includes('recentFavoriteAlertExpiries.putAll(pendingFavoriteKeys)'));
 assert.ok(body.includes('if(WatchAlerts.match(this,firstWatched,watchDetails))'));
 assert.ok(body.indexOf("recentFavoriteAlertExpiries.getOrDefault")>body.indexOf("if(newSpawn){"));
 assert.ok(body.indexOf("recentFavoriteAlertExpiries.getOrDefault")<body.indexOf("if(!newSpawn)continue"));
 assert.match(body,/if\(expiry<=now\)continue/);
 assert.match(body,/WatchAlerts\.matches\(c\.optString\("name",""\),wanted\)/);
 assert.match(body,/WatchAlerts\.match\(this,firstWatched,watchDetails\)/);
 assert.match(body,/if\(!newSpawn\)continue; \/\/ history is only for truly new encounters/);
});
check("API alerts use identical verified HTTP results for both instances",()=>{
 const body=service.split("private void applyCollectedResults(JSONObject r){")[1].split("private void resize(",1)[0];
 assert.match(body,/r\.optBoolean\("requestValidated",false\)/);
 assert.match(body,/r\.optBoolean\("criteriaConfirmed",false\)/);
 assert.match(body,/r\.optBoolean\("resultChanged",false\)/);
 assert.match(body,/api-http-200/);
 assert.match(body,/recordNewResults\(sorted,r\.optBoolean\("leagueConfirmed",false\)\)/);
 assert.match(body,/verifiedTargetCriteria\(card\)/);
});
check("0 percent and 100 percent filter requests preserve EXACT values",()=>{
 function expected(value){
  const r=contract.buildPayload({mode:"raw",attack:value,defense:value,stamina:value,
    shiny:false,sortBy:"Despawn (longest)",locationEnabled:false});
  assert.equal(r.ok,true,JSON.stringify(r));
  return r.payload;
 }
 const first=expected(15),second=expected(0);
 assert.deepEqual([first.raw_iv_atk,first.raw_iv_def,first.raw_iv_sta],[15,15,15]);
 assert.deepEqual([second.raw_iv_atk,second.raw_iv_def,second.raw_iv_sta],[0,0,0]);
});
check("both result and detail WebViews have identical verified base/shiny assets",()=>{
 for(const dex of [1,25,676,1000,1025]){
  for(const shiny of [false,true]){
   const remote="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+(shiny?"shiny/":"")+dex+".png";
   const asset=jsSprite.resolve({image:remote});
   assert.equal(asset.src,"file:///android_asset/pokemon-sprites/"+(shiny?"shiny/":"base/")+dex+".png");
  }
 }
 const normal=jsSprite.resolve({name:"Furfrou",number:"#676",form:"Natural",image:""});
 assert.match(normal.src,/pokemon-sprites\/base\/676\.png$/);
 assert.match(read("assets/detail.html"),/PokeSearchOfflineSprite\.resolve\(c\)/);
 assert.match(read("assets/dock.html"),/PokeSearchOfflineSprite\.resolve\(c\)/);
});
check("explicit normal/default form recovers missing image; special forms do NOT",()=>{
 const starter={name:"Pikachu",number:"#25",image:"",costume_id:0};
 for(const form of ["Normal","PIKACHU_DEFAULT","Pikachu", "DEFAULT"]){
  const resolved=jsSprite.resolve({...starter,form});
  assert.equal(resolved.src,"file:///android_asset/pokemon-sprites/base/25.png",form);
 }
 for(const form of ["Alolan","Galarian","Cosplay","PIKACHU_HAT"]){
  assert.equal(jsSprite.resolve({...starter,form}).src,"",form);
 }
 assert.equal(jsSprite.resolve({...starter,form:"Normal",costume_id:3}).src,"");
});
check("general notification IDs never overwrite the other active service",()=>{
 assert.ok(service.includes('isSecondaryOverlay()?12075:12074'));
 assert.ok(service.includes('isSecondaryOverlay()?12077:12076'));
 assert.match(watched,/NEXT_ALERT_ID/);
});
check("secondary activation stays hidden without wiping its settings or killing it",()=>{
 assert.match(main,/dualOverlayRow\.setVisibility\(View\.GONE\)/);
 assert.match(main,/getSharedPreferences\("prefs_secondary",0\)/);
 assert.match(main,/putInt\("rawAttack",0\)/);
 assert.match(service,/startForeground\(isSecondaryOverlay\(\)\?74:73,note\)/);
});
console.log("LT112 DUAL POKEBALL PARITY "+successes+"/"+successes+" PASS");

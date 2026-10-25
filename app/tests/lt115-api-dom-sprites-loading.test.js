"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../src/main"),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const contract=require("../src/main/assets/api_result_contract.js"),sprite=require("../src/main/assets/sprite_offline.js");
const java=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const secondary=read("java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java");
const dock=read("assets/dock.html"),detail=read("assets/detail.html");
const encounter=x=>({pokemon_id:"531",pokemon_name:"Audino",cp:"1538",level:34,raw_iv:"15/15/15",
 iv_percent:100,despawn_at:"2099-10-25T21:00:00Z",shiny:true,form:"AUDINO_NORMAL",...x});
function card(x){const r=contract.normalizeResponse({cap:10,results:[encounter(x)]},
 {nowMs:Date.UTC(2026,9,25,20),shiny:false});assert.equal(r.ok,true);assert.equal(r.cards.length,1);return r.cards[0];}
let checks=0;const check=(label,fn)=>{fn();checks++;console.log("PASS LT115 "+label)};
check("P1 100% numeric/textual dex yields exact shiny sprite",()=>{
 for(const id of [531,"531"]){const c=card({pokemon_id:id});
 assert.equal(sprite.resolve(c).src,"file:///android_asset/pokemon-sprites/shiny/531.png");}
});
check("P2 0% normal sprite is independent",()=>{const c=card({pokemon_id:"531",shiny:false,raw_iv:"0/0/0",iv_percent:0});
 assert.equal(c.iv,"0/0/0");assert.equal(sprite.resolve(c).src,"file:///android_asset/pokemon-sprites/base/531.png");});
check("special form and costume never masquerade as base sprite",()=>{
 for(const form of ["ALOLAN","TRIM_DANDY"]){assert.equal(card({form}).image,"");}
 assert.equal(card({costume_id:8}).image,"");});
check("API and DOM both animate actual active Pokeball searches",()=>{
 assert.equal((dock.match(/classList\.toggle\("search-active",searchActive\s*&&\(activeSearchPhase==="searching"\|\|activeSearchPhase==="filling"\)\)/g)||[]).length,2);
 assert.match(java,/searchPhase="searching";\s*status\(manual\?"API: busca manual/);
 assert.match(dock,/body\.dock-window\.search-active #gear \.capturePulse/);});
check("offline sprite grace period and same detail interceptor",()=>{
 assert.match(dock,/if\(img\.complete&&good\(\)\)loaded\(\)/);assert.match(dock,/\},4500\);/);
 assert.match(java,/detailPanel\.setWebViewClient\(new WebViewClient\(\)/);
 assert.equal((java.match(/detailPanel\.setWebViewClient\(new WebViewClient\(\)/g)||[]).length,1);
 assert.match(java,/detailPanel\.setWebViewClient\(new WebViewClient\(\)\{[\s\S]*?shouldInterceptRequest[\s\S]*?onPageFinished/);
 assert.match(detail,/PokeSearchOfflineSprite\.resolve\(c\)/);});
check("API first; DOM transient fallback; no 401 403 429 bypass",()=>{
 const a=java.indexOf("private static boolean allowDomAfterApiFailure("),b=java.indexOf("private void performAuthorizedApiSearch",a);
 assert.ok(a>=0&&b>a);const block=java.slice(a,b);
 for(const allowed of ["timeout","network-or-cors-error","service-unavailable","invalid-results"])
  assert.ok(block.includes('"'+allowed+'"'));
 for(const blocked of ["rate-limited","access-denied","login-required","vip-required"])
  assert.ok(!block.includes('"'+blocked+'"'));
 assert.match(java,/execute\("session",session->\s*continueVerifiedSearchSession\(generation,manual,session,0\)\)/);
 assert.match(secondary,/extends OverlayService/);
 assert.match(java,/getSharedPreferences\(isSecondaryOverlay\(\)\?"prefs_secondary":"prefs",0\)/);
});
console.log("LT115 API/DOM DUAL "+checks+"/"+checks+" PASS");

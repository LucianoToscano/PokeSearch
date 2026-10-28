"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const asset=name=>fs.readFileSync(path.join(__dirname,"../src/main/assets",name),"utf8");
const api=require("../src/main/assets/api_result_contract.js");
const art=require("../src/main/assets/sprite_offline.js");
const normal=card=>art.resolve({number:"#94",name:"Gengar",gender:"♀",size:"XS",iv:"15/15/15",...card});
assert.equal(normal({form:"Normal",shiny:false}).src,"file:///android_asset/pokemon-sprites/base/94.png");
assert.equal(normal({form:"",shiny:true}).src,"file:///android_asset/pokemon-sprites/shiny/94.png");
for(const [form,number] of [["Mega",10038],["Gmax",10202]]){
 const resolved=normal({form,shiny:false});
 assert.match(resolved.src,/^file:\/\/\/android_asset\/pokemon-sprites\/forms\//);
 assert.ok(resolved.original.endsWith("/"+number+".png"),form);
 assert.notEqual(resolved.src,"file:///android_asset/pokemon-sprites/base/94.png");
}
assert.match(normal({form:"COSTUME_2020"}).src,/^file:\/\/\/android_asset\/pokemon-sprites\/costumes\/pm94\./);
assert.equal(normal({form:"unverified-2026",costume_id:777}).src,"");
const provider="https://pogocoordinates.com/assets/pokemon/exact-gengar.png";
const fromSite=normal({form:"Normal",image:provider,imageFromSite:true});
assert.equal(fromSite.src,provider);
assert.equal(fromSite.original,"file:///android_asset/pokemon-sprites/base/94.png");
assert.equal(fromSite.offline,true);
const halloween=art.resolve({number:"#41",name:"Zubat",form:"HALLOWEEN_2026_01",shiny:false});
assert.match(halloween.src,/pm41\.fHALLOWEEN_2026_01\.icon\.png/);
const halloweenShiny=art.resolve({number:"#41",name:"Zubat",form:"HALLOWEEN_2026_01",shiny:true});
assert.equal(halloweenShiny.src,"");
assert.notEqual(halloween.src,"file:///android_asset/pokemon-sprites/base/41.png");
const now=Date.now(),all=Array.from({length:25},(_,i)=>({
 pokemon_id:94,pokemon_name:"Gengar",form:"GENGAR_NORMAL",
 encounter_id:"LT141-"+i,cp:1100+i,level:20,
 raw_iv:"15/15/15",iv_percent:100,
 despawn_at:new Date(now+3600000).toISOString()
}));
for(const n of [0,1,5,10,11,20,25]){
 const rows=api.normalizeResponse({cap:25,results:all.slice(0,n)},{nowMs:now});
 assert.equal(rows.ok,true);
 assert.equal(rows.cards.length,n);
}
assert.equal(api.normalizeResponse({cap:10,results:all},{nowMs:now}).cards.length,10);
assert.equal(api.normalizeResponse({results:all},{nowMs:now}).cards.length,10,"No unverified VIP promotion");
assert.equal(api.normalizeResponse({cap:30,results:all},{nowMs:now}).cards.length,25);
const profile=asset("profile_summary.js");
function fakeProfile(trainerLabels){
 const node=s=>({innerText:s,textContent:s,getClientRects:()=>[1],previousElementSibling:null,parentElement:null});
 const account=node("Pokemon GO accounts "+trainerLabels.length+" / 2");
 const cards=trainerLabels.map(node);
 const document={body:{innerText:"Linked accounts Pokemon GO accounts "+trainerLabels.length+" / 2"},querySelectorAll:s=>s==="img"?[]:[account,...cards]};
 const result=vm.runInNewContext(profile,{document,location:{pathname:"/profile",origin:"https://pogocoordinates.com",href:"https://pogocoordinates.com/profile"},URL,JSON});
 return JSON.parse(result);
}
const ash="AshLovesGO Mystic · Level 44 Trainer code 1111 2222 3333";
const misty="MistyPoke Valor · Level 48 Trainer code 4444 5555 6666";
const list=fakeProfile([ash,misty]);
assert.equal(list.trainerState,"linked");
assert.equal(list.trainers.length,2);
assert.equal(list.activeTrainerCode,"");
assert.equal(list.trainerCode,"","No visual selection when the provider has not confirmed active trainer");
const active=fakeProfile(["Active trainer "+ash,misty]);
assert.equal(active.activeTrainerCode,"111122223333");
assert.equal(active.trainerCode,"111122223333");
assert.equal(fakeProfile([ash]).trainerCode,"111122223333");
const dock=asset("dock.html"),native=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const probe=asset("probe.js"),overlay=asset("overlay.html");
assert.match(dock,/cards=Array\.isArray\(a\)\?a\.slice\(0,25\)/);
assert.match(dock,/results-overflow/);
assert.match(dock,/\-\-results-scroll-height/);
assert.match(dock,/spawnInfoLine\.wrap\{white-space:nowrap/);
assert.match(probe,/if\(cards\.length===25\)break/);
assert.match(overlay,/items\.slice\(0,25\)/);
assert.match(native,/cards\.length\(\)>25/);
assert.match(native,/apiPlanCap/);
assert.match(native,/TRAINER_CHANGED/);
console.log("PASS LT141: exact Gengar/Zubat sprites, provider DOM, aligned cards, VIP caps and multi-trainer proof");

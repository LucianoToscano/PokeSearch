"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const asset=name=>fs.readFileSync(path.join(__dirname,"../src/main/assets",name),"utf8");
const java=name=>fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay",name),"utf8");
const accounts=[
 "AlphaTrainer Mystic · Level 61 Trainer code 1234 5678 9012",
 "BetaTrainer Valor · Level 50 Trainer code 9876 5432 1098"];
const node=s=>({innerText:s,getClientRects:()=>[{}],previousElementSibling:null,parentElement:null});
const dom={
 body:{innerText:"Linked accounts\nPokemon GO accounts 2 / 3\n"+accounts.join("\n")},
 querySelectorAll(selector){
  if(selector==="img")return [];
  return [node("Pokemon GO accounts 2 / 3"),...accounts.map(node)];
 }};
const context={document:dom,location:{pathname:"/profile",href:"https://pogocoordinates.com/profile",origin:"https://pogocoordinates.com"},URL};
const profile=JSON.parse(vm.runInNewContext(asset("profile_summary.js"),context));
assert.equal(profile.ok,true);
assert.equal(profile.trainerState,"linked");
assert.equal(profile.trainers.length,2);
assert.deepEqual(Array.from(profile.trainers,x=>x.name),["AlphaTrainer","BetaTrainer"]);
assert.deepEqual(Array.from(profile.trainers,x=>x.code),["123456789012","987654321098"]);
assert.equal(new Set(profile.trainers.map(x=>x.code)).size,2);
const app=java("MainActivity.java"),service=java("OverlayService.java");
assert.ok(app.includes('trainerSelectButton.setOnClickListener(v->{'));
assert.ok(app.includes('if(count>1)showTrainerSelector();'));
assert.ok(app.includes('else openLoginDialog(false,"manage");'));
assert.ok(app.includes('setSingleChoiceItems(labels.toArray(new String[0]),selectedIndex'));
assert.ok(app.includes('profileSelectedTrainerCode'));
assert.ok(app.includes('profileTrainerList'));
assert.ok(service.includes('config.put("shinyAccount",selected)'));
assert.ok(service.includes('cards==null||cards.length()>100'));
const dock=asset("dock.html"),probe=asset("probe.js");
assert.ok(dock.includes('a.slice(0,100)'));
assert.ok(dock.includes('vip-results-scroll'));
assert.ok(dock.includes('overscroll-behavior:contain!important;touch-action:pan-y!important'));
assert.ok(probe.includes('if(cards.length===100)break'));
assert.ok(probe.includes('Math.min(siteCount,100)'));
console.log("PASS LT141: multiple linked trainer choices, per-account Shiny, 25+ VIP spawns scroll");

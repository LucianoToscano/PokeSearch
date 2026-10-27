"use strict";
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assert=require("node:assert/strict");
const base=path.join(__dirname,"..");
const read=f=>fs.readFileSync(path.join(base,f),"utf8");
const profile=read("src/main/assets/profile_summary.js");
const node=s=>({innerText:s,textContent:s,getClientRects(){return [1]},parentElement:null});
const cards=[
 node("Pokemon GO accounts 2 / 5"),
 node("AlphaTrainer Mystic · Level 61 Trainer code 1234 5678 9012"),
 node("BetaTrainer Valor · Level 57 Trainer code 9876 5432 1098"),
 node("BetaTrainer Valor · Level 57 Trainer code 9876 5432 1098")
];
const context={
 location:{pathname:"/profile",href:"https://pogocoordinates.com/profile",origin:"https://pogocoordinates.com"},
 document:{
  body:{innerText:"Linked accounts\nPokemon GO accounts 2 / 5\nLogged in via Google"},
  querySelectorAll(sel){return sel==="img"?[]:cards}
 },
 URL
};
const output=JSON.parse(vm.runInNewContext(profile,context));
assert.equal(output.ok,true);
assert.equal(output.trainers.length,2);
assert.deepEqual(Array.from(output.trainers,x=>x.name).sort(),["AlphaTrainer","BetaTrainer"]);
assert.deepEqual(Array.from(output.trainers,x=>x.code).sort(),["123456789012","987654321098"].sort());
assert.ok(["AlphaTrainer","BetaTrainer"].includes(output.trainerName));
const java=read("src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const service=read("src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const probe=read("src/main/assets/probe.js");
const dock=read("src/main/assets/dock.html");
const contract=require("../src/main/assets/api_result_contract.js");
assert.ok(java.includes('profileTrainerAccounts'));
assert.ok(java.includes('profileTrainerSelectedCode'));
assert.ok(java.includes('profileTrainerAll'));
assert.ok(java.includes('Todas as "+trainers.length()+" contas'));
assert.ok(java.includes('setSingleChoiceItems(options,currentChoice'));
assert.ok(service.includes('config.put("shinyAccount",selected)'));
assert.ok(service.includes('config.put("shinyAccountAll",true)'));
assert.ok(probe.includes('function trainerAccountChoice(action)'));
assert.ok(probe.includes('if(cards.length===100)break;'));
assert.ok(dock.includes('a.slice(0,100)'));
assert.equal(contract.MAX_RESULTS,100);
assert.equal(contract.buildPayload({
 mode:"raw",attack:15,defense:15,stamina:15,shiny:true,
 shinyAccount:"987654321098"
}).payload.shiny_account,"987654321098");
console.log("PASS LT141: two official trainers, selected/all accounts and provider-governed tier result cap");
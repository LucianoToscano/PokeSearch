"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const pageScript=read("src/main/assets/profile_summary.js");
const card=(text)=>({innerText:text,textContent:text,
  getClientRects(){return [1]},querySelectorAll(){return []},
  parentElement:null,previousElementSibling:null});
const trainer1=card("LucianoToscano Mystic · Level 61 Trainer code 4594 1062 1985");
const trainer2=card("SegundoTreinador Valor · Level 43 Trainer code 1234 5678 9012");
const body={innerText:"Linked accounts Pokemon GO accounts 2 / 5 Logged in via Google"};
const document={body,
 querySelectorAll(selector){
  if(selector==="img")return [];
  if(selector.includes("section,article"))return [trainer1,trainer2,
    card("Pokemon GO accounts 2 / 5"),trainer1];
  return [];
 }};
const sandbox={document,location:{pathname:"/profile",href:"https://pogocoordinates.com/profile"},URL};
const result=JSON.parse(vm.runInNewContext(pageScript,sandbox));
assert.equal(result.ok,true);
assert.equal(result.trainerState,"linked");
assert.equal(result.trainers.length,2);
assert.equal(result.trainers[0].name,"LucianoToscano");
assert.equal(result.trainers[0].code,"459410621985");
assert.equal(result.trainers[1].name,"SegundoTreinador");
assert.equal(result.trainers[1].team,"Valor");
assert.equal(result.trainers[1].code,"123456789012");
const main=read("src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const overlay=read("src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const probe=read("src/main/assets/probe.js");
const contract=require("../src/main/assets/api_result_contract.js");
assert.ok(main.includes('setSingleChoiceItems(names,checked'));
assert.ok(main.includes('saveSelectedTrainer(trainers.optJSONObject(which))'));
assert.ok(main.includes('putString("profileTrainerListJson",verified.toString())'));
assert.ok(main.includes('profileTrainerLastSelectedCode'));
assert.ok(main.includes('notifyOverlaySessionReady();'));
assert.ok(overlay.includes('config.put("shinyAccount",selected)'));
assert.ok(overlay.includes('cards.length()>response.optInt("apiDisplayCap",10)'));
assert.ok(!overlay.includes('cards.length()>10'));
assert.ok(probe.includes("if(cards.length===100)break;"));
assert.ok(probe.includes("Math.min(siteCount,100)"));
assert.equal(contract.MAX_RESULTS,100);
const specimen=i=>({
 pokemon_id:41,pokemon_name:"Zubat",raw_iv:"15/15/15",iv_percent:100,
 cp:500+i,level:20,despawn_at:"2099-10-24T21:26:04Z",
 encounter_id:"enc-"+i,location:"Taiwan",shiny:false
});
for(const [cap,expected] of [[10,10],[25,25],[50,50],[75,75],[100,100]]){
 const rows=Array.from({length:100},(_,i)=>specimen(i));
 const parsed=contract.normalizeResponse({cap,results:rows},{nowMs:0});
 assert.equal(parsed.ok,true);assert.equal(parsed.serverCap,cap);
 assert.equal(parsed.cards.length,expected,"Tier "+cap+" must retain "+expected+" results");
 assert.equal(parsed.displayCap,cap);
}
console.log("PASS LT141: two official trainers, user selection, 10/25/50/75/100 tier caps");

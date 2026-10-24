"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const contract=require("../src/main/assets/api_result_contract.js");
const source=fs.readFileSync(path.join(__dirname,"../src/main/assets/api_result_contract.js"),"utf8");
let count=0;
function check(name,fn){fn();count++;console.log("PASS LT77 "+name);}
function fixture(n,other={}) {
 return {encounter_id:String(n),pokemon_id:821,pokemon_name:"Rookidee",
    cp:438,level:23,location:"Ougrée, Liège, Belgium",
    raw_iv:"15/15/15",iv_percent:100,gender:"Male",size:"M",
    fast_move:"Air Slash",charge_move:"Payback",
    despawn_at:"2099-10-24T21:26:04Z",shiny:false,
    reveal_code:"NEVER_EXPORT_ME",jwt:"NEVER_EXPORT_ME",...other};
}
check("API contract cannot harvest credentials, make requests or change runtime",()=>{
 assert.ok(!/\blocalStorage\b|\bsessionStorage\b|\bfetch\s*\(|XMLHttpRequest|Authorization|Bearer|getCookie|evaluateJavascript/i.test(source));
 assert.equal(typeof contract.buildPayload,"function");
 assert.equal(typeof contract.normalizeResponse,"function");
});
check("raw IV, shiny and stable request fields",()=>{
 const r=contract.buildPayload({mode:"raw",attack:15,defense:15,stamina:15,shiny:true});
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.payload.shiny_only,true);
 assert.equal(r.payload.raw_iv_atk,15);
 assert.equal(r.payload.pvp_mode,false);
 assert.equal(r.payload.sort,"DSP");
 assert.deepEqual(r.payload.pokemon_ids,[]);
});
check("Great League search applies correct independent PvP fields",()=>{
 const r=contract.buildPayload({mode:"gl",glRank:25,includePreviousEvolutions:false});
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.payload.pvp_mode,true);
 assert.equal(r.payload.pvp_league,"great");
 assert.equal(r.payload.pvp_top_rank,25);
 assert.equal(r.payload.pvp_include_pre_evolutions,false);
 assert.equal(r.payload.iv_percent_min,null);
});
check("Ultra League and percent have separate values",()=>{
 const r=contract.buildPayload({mode:"ul",ulRank:3});
 assert.equal(r.ok,true);
 assert.equal(r.payload.pvp_league,"ultra");
 assert.equal(r.payload.pvp_top_rank,3);
 const pct=contract.buildPayload({mode:"percent",percentMin:91,percentMax:100});
 assert.equal(pct.ok,true);
 assert.equal(pct.payload.iv_mode,"percent");
 assert.equal(pct.payload.iv_percent_min,91);
});
check("coordinates only when user specified a validated pair",()=>{
 assert.equal(contract.buildPayload({mode:"iv",centerLat:-5,centerLng:-35,radiusKm:1000}).ok,true);
 assert.equal(contract.buildPayload({mode:"iv",radiusKm:1000}).ok,false);
 assert.equal(contract.buildPayload({mode:"iv",centerLat:-5,radiusKm:10}).ok,false);
 assert.equal(contract.buildPayload({mode:"iv",centerLat:-100,centerLng:10}).ok,false);
});
check("do not silently broaden unsupported user filters",()=>{
 for(const config of [
  {mode:"raw",attack:15,defense:15,stamina:15,formSelections:["Alola"]},
  {mode:"raw",attack:15,defense:15,stamina:15,pokemonSelections:["Rookidee"]},
  {mode:"raw",attack:15,defense:15,stamina:15,weather:"Rainy"},
  {mode:"raw",attack:15,defense:15,stamina:15,sortBy:"Distance"},
  {mode:"raw",attack:15,defense:15,stamina:15,genderSelections:["Male","Female"]}
 ]) assert.equal(contract.buildPayload(config).ok,false);
});
check("numeric validation rejects malformed or reversed selections",()=>{
 assert.equal(contract.buildPayload({mode:"raw",attack:16,defense:15,stamina:15}).ok,false);
 assert.equal(contract.buildPayload({mode:"raw",attack:15,defense:15,stamina:15,cpMin:500,cpMax:100}).ok,false);
 assert.equal(contract.buildPayload({mode:"percent",percentMin:90,percentMax:50}).ok,false);
 assert.equal(contract.buildPayload({mode:"gl",glRank:0}).ok,false);
});
check("response mapping is structured, capped and secrets stripped",()=>{
 const r=contract.normalizeResponse({results:[fixture(1)]},{nowMs:0});
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.cards.length,1);
 assert.equal(r.cards[0].number,"#821");
 assert.equal(r.cards[0].iv,"15/15/15");
 assert.equal(r.cards[0].ivPercent,"100");
 assert.equal(r.cards[0].gender,"♂");
 assert.equal(r.cards[0].moves,"Air Slash / Payback");
 assert.ok(r.cards[0].expiresAtMs>0);
 assert.equal(r.criteriaConfirmed,false);
 assert.equal(r.resultChanged,false);
 assert.equal(r.leagueConfirmed,false);
 assert.ok(!JSON.stringify(r).includes("NEVER_EXPORT_ME"));
 assert.ok(!JSON.stringify(r).includes("encounter_id"));
});
check("ten-result cap and dedup across arbitrary source rows",()=>{
 const data=Array.from({length:50},(_,i)=>fixture(i+1));
 const r=contract.normalizeResponse({results:data},{nowMs:0});
 assert.equal(r.cards.length,10);
 assert.equal(r.siteCount,50);
 assert.equal(new Set(r.cards.map(x=>x.sourceIndex)).size,10);
 const dup=contract.normalizeResponse({results:[fixture(1),fixture(1),fixture(2)]},{nowMs:0});
 assert.equal(dup.cards.length,2);
});
check("expired, inconsistent IV, unknown identity and shiny mismatches rejected",()=>{
 const r=contract.normalizeResponse({results:[
   fixture(1,{raw_iv:"16/15/15"}),
   fixture(2,{iv_percent:91}),
   fixture(3,{despawn_at:"2000-10-01T00:00:00Z"}),
   fixture(4,{pokemon_id:null}),
   fixture(5,{shiny:false}),
   fixture(6,{shiny:true})
 ]},{nowMs:Date.UTC(2026,9,24),shiny:true});
 assert.equal(r.cards.length,1);
 assert.equal(r.cards[0].shiny,true);
 assert.equal(r.cards[0].sourceIndex,5);
});
check("empty response is NOT site-confirmed zero results",()=>{
 const r=contract.normalizeResponse({results:[]},{nowMs:0});
 assert.equal(r.ok,true);
 assert.equal(r.cards.length,0);
 assert.equal(r.criteriaConfirmed,false);
 assert.equal(r.resultChanged,false);
});
check("malformed source and excessive arrays fail closed",()=>{
 assert.equal(contract.normalizeResponse(null).ok,false);
 assert.equal(contract.normalizeResponse({results:"bad"}).ok,false);
 assert.equal(contract.normalizeResponse({results:Array(2001).fill({})}).ok,false);
});
console.log("LT77 experimental API contract: "+count+"/"+count+" PASS");

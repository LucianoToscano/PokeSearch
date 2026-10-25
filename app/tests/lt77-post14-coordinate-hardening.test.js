"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const probe=fs.readFileSync(path.join(__dirname,"../src/main/assets/probe.js"),"utf8");
const transport=require("../src/main/assets/api_browser_transport.js");
const api=require("../src/main/assets/api_result_contract.js");
const reveal=require("../src/main/assets/api_reveal_contract.js");
const start=probe.indexOf("function matchingCoordsCard(query){");
const end=probe.indexOf("\nfunction cardCoordsControls(card){",start);
assert.ok(start>=0&&end>start,"Expected actual probe matcher source");
let cards=[];
const pick=vm.runInNewContext(
 "(function(){"+probe.slice(start,end)+";return matchingCoordsCard;})()",
 {cardRoots:()=>cards,parseCard:node=>node.entry,clean:s=>String(s||"").trim()});
const card=(sourceIndex,name="Caterpie",cp="274",location="Kathleen, Florida, United States")=>({
 sourceIndex,node:{entry:{name,cp,number:"#010",location}}
});
const fingerprint={index:0,name:"Caterpie",cp:"274",number:"#010",location:"Kathleen, Florida, United States"};
let passed=0;
function check(title,fn){fn();passed++;console.log("PASS LT77 POST14 "+title);}
async function checkAsync(title,fn){await fn();passed++;console.log("PASS LT77 POST14 "+title);}
check("Get coords selects unchanged uniquely identified card",()=>{
 cards=[card(0)];assert.equal(pick(fingerprint),cards[0]);
});
check("React row reorder resolves the same Pokémon only by complete identity",()=>{
 cards=[card(0,"Pikachu","124","Paris, France"),card(1)];
 assert.equal(pick(fingerprint),cards[1]);
});
check("never clicks ambiguous lookalike results even when index matches",()=>{
 cards=[card(0),card(1)];assert.equal(pick(fingerprint),null);
});
check("reordered partial identity is rejected without a verified fingerprint",()=>{
 cards=[card(1)];
 assert.equal(pick({...fingerprint,location:""}),null);
 assert.equal(pick({...fingerprint,number:""}),null);
});
check("mismatched location and species cannot be silently accepted",()=>{
 cards=[card(0,"Caterpie","274","Different city")];
 assert.equal(pick(fingerprint),null);
});
const originCheck=checkAsync("authorized API origin rejects custom ports without reading JWT",async()=>{
 let reads=0,requests=0;
 const t=transport.createClient({
  fetchImpl:async()=>{requests++;throw Error("unexpected");},
  storage:{getItem:()=>{reads++;return "header.payload.signature";}},
  siteOrigin:()=>"https://pogocoordinates.com:444",
  now:()=>Date.now(),apiContract:api,revealContract:reveal
 });
 const result=await t.search({mode:"raw",attack:15,defense:15,stamina:15});
 assert.equal(result.reason,"invalid-origin");
 assert.equal(reads,0);assert.equal(requests,0);
});
check("normalized API result must have valid future despawn",()=>{
 const base={encounter_id:"123",pokemon_id:10,pokemon_name:"Caterpie",
  cp:274,level:22,raw_iv:"15/15/15",iv_percent:100,
  despawn_at:"2099-01-01T00:00:00Z"};
 const result=api.normalizeResponse({results:[
  {...base,encounter_id:"1",despawn_at:null},
  {...base,encounter_id:"2",despawn_at:"nonsense"},
  {...base,encounter_id:"3",despawn_at:"2020-01-01T00:00:00Z"},
  {...base,encounter_id:"4"}]},
  {nowMs:Date.UTC(2026,9,24)});
 assert.equal(result.cards.length,1);
 assert.equal(result.cards[0].sourceIndex,3);
 assert.equal(result.rejected,2);
 assert.equal(result.expired,1);
});
originCheck.then(()=>check("sensitive fields never leak through normalized card",()=>{
 const out=api.normalizeResponse({results:[{encounter_id:"1",pokemon_id:10,
  pokemon_name:"Caterpie",cp:274,level:22,raw_iv:"15/15/15",iv_percent:100,
  reveal_code:"NO_LOG_THIS",despawn_at:"2099-01-01T00:00:00Z"}]},{nowMs:0});
 assert.equal(out.ok,true);
 assert.equal(out.cards.length,1);
 assert.equal(JSON.stringify(out).includes("NO_LOG_THIS"),false);
})).then(()=>console.log("LT77 POST14 "+passed+"/"+passed+" PASS")).catch(e=>{console.error(e);process.exitCode=1;});

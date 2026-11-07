"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main/assets");
const asset=name=>fs.readFileSync(path.join(root,name),"utf8");
const sprite=require("../src/main/assets/sprite_offline.js");
const presenter=require("../src/main/assets/pokemon_card_presentation.js");
const window={PokeSearchOfflineSprite:sprite};
new Function("window",asset("pvpoke-overall-ranks.js"))(window);
new Function("window",asset("pvpoke-iv-gamemaster.js"))(window);
const dock=asset("dock.html");
const begin=dock.indexOf("const PVPOKE_OVERALL="),end=dock.indexOf('let lastListKey=""',begin);
assert.ok(begin>0&&end>begin);
const verifiedIv=card=>{
 const parts=String(card.iv||"").split("/").map(Number);
 if(parts.length!==3||parts.some(x=>!Number.isInteger(x)||x<0||x>15))return null;
 const pct=Math.round(parts.reduce((a,b)=>a+b,0)*100/45);
 return pct===Number(card.ivPercent)?pct:null;
};
const evaluator=new Function("window","verifiedSpawnIvPercent","resultWindow","cards",
 dock.slice(begin,end)+
 "return {safePvpSpeciesKey,cosmeticPvpIdentity,pvpEvolutionDetails:window.pvpEvolutionDetails};");
const event={number:"#25",name:"Pikachu",form:"Anniversary 2026 Singapore 01",
 iv:"15/15/15",ivPercent:"100",cp:482,level:18,
 sourceIndex:0};
const make=card=>evaluator(window,verifiedIv,true,[card]);
const computed=make(event);
assert.equal(sprite.verifiedSpeciesIdentity(event),true,"Pikachu #25 identity");
assert.equal(computed.cosmeticPvpIdentity(event),true,"official blue-costume event");
assert.equal(computed.safePvpSpeciesKey(event),"pikachu");
const payload=computed.pvpEvolutionDetails(0);
assert.ok(payload);
assert.equal(payload.rankSpecies,"Pikachu");
assert.equal(payload.leagues.length,3);
for(const league of payload.leagues){
 assert.ok(league.own&&Number.isInteger(league.own.rank)&&league.own.rank>=1,
  "Costumed Pikachu must have verified IV rank: "+league.league);
 assert.equal(league.evolutions.length,0,
  "A costume does NOT prove evolution legality: "+league.league);
 assert.equal(league.own.overallRank,null,
  "If Pikachu is missing from the pinned overall snapshot, do not invent an RG rank");
}
const base=make({...event,form:""}).pvpEvolutionDetails(0);
for(let i=0;i<3;i++)assert.equal(payload.leagues[i].own.rank,base.leagues[i].own.rank,
 "The event costume uses the base Pokémon's IV stat product");
const data={base:{"25":[["electric"],[]],"37":[["fire"],[]]},forms:{}};
assert.deepEqual(presenter.typeKeys(event,data),["electric"]);
assert.ok(presenter.types(event,data).includes("Tipo Elétrico"));
assert.equal(presenter.typeEffectiveness(presenter.typeKeys(event,data)).weaknesses[0].type,"ground");
assert.deepEqual(presenter.typeKeys({...event,number:"#37"},data),[],
 "Dex mismatch cannot take Pikachu's event exception");
assert.deepEqual(presenter.typeKeys({...event,form:"Anniversary 2026 Singapore 99"},data),[],
 "Unverified costume token must not borrow the base type");
assert.deepEqual(presenter.typeKeys({...event,form:"Galarian"},data),[],
 "Stat-changing regional forms must still fail closed");
assert.equal(make({...event,form:"Galarian"}).safePvpSpeciesKey({...event,form:"Galarian"}),null);
assert.equal(make({...event,number:"#37"}).safePvpSpeciesKey({...event,number:"#37"}),null);
const html=asset("detail.html");
assert.ok(html.includes("PokeSearchCardPresentation"),"detail type rendering must be shared P1/P2");
assert.ok(html.includes("PokeSearchCardMetaData"),"APK generated source remains authoritative");
const code=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(code);new vm.Script(code[1],{filename:"detail.html"});
console.log("LT300 PASS: Singapore Pikachu Electric type, exact base-species GL/UL/ML IV math and no invented RG/evolution");

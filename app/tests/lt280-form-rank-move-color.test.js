"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const asset=name=>fs.readFileSync(path.join(__dirname,"../src/main/assets",name),"utf8");
const win={PokeSearchOfflineSprite:require("../src/main/assets/sprite_offline.js")};
new Function("window",asset("pvpoke-overall-ranks.js"))(win);
new Function("window",asset("pvpoke-iv-gamemaster.js"))(win);
const dock=asset("dock.html");
const from=dock.indexOf("const PVPOKE_OVERALL="),to=dock.indexOf('let lastListKey=""',from);
assert.ok(from>0&&to>from);
const verifiedIv=card=>{
 const parts=String(card.iv||"").split("/").map(Number);
 if(parts.length!==3||parts.some(n=>!Number.isInteger(n)||n<0||n>15))return null;
 const calc=Math.round(parts.reduce((s,n)=>s+n,0)*100/45);
 return calc===Number(card.ivPercent)?calc:null;
};
const production=new Function("window","verifiedSpawnIvPercent","resultWindow","cards",
 dock.slice(from,to)+"return {safePvpSpeciesKey,pvpEvolutionDetails:window.pvpEvolutionDetails};");
const payload=(name,number,form)=>({name,number,form,iv:"0/15/15",ivPercent:"67",
 cp:282,level:26,sourceIndex:0});
const assess=card=>{const {safePvpSpeciesKey,pvpEvolutionDetails}=production(
 win,verifiedIv,true,[card]);return {key:safePvpSpeciesKey(card),result:pvpEvolutionDetails(0)};};
for(const [dex,name] of [[412,"Burmy"],[413,"Wormadam"]]){
 for(const form of ["Plant","Sandy","Trash"]){
  const basic=payload(name,"#"+dex,form);
  const output=assess(basic);
  assert.equal(output.key,name.toLowerCase()+" ("+form.toLowerCase()+")");
  assert.equal(output.result.rankSpecies,name+" ("+form+")");
  assert.equal(output.result.leagues.length,3);
  for(const league of output.result.leagues){
   assert.ok(league.own&&league.own.rank>=1&&league.own.rank<=4096,
    name+" "+form+" "+league.league+" has its exact class rank");
   assert.ok(league.own.cp>0&&league.own.statProductPct);
  }
  assert.equal(assess({...basic,form:name.toUpperCase()+"_"+form.toUpperCase()}).key,
   output.key);
  assert.equal(assess({...basic,name:name+" ("+form+")",form}).key,output.key);
 }
 assert.equal(assess(payload(name,"#"+dex,"Unknown")).key,null,
  "unknown cloak must not steal base or another type's stats");
 assert.equal(assess(payload(name,"#"+dex,"")).key,null,
  "ambiguous cloak cannot be auto-assigned to Plant");
 assert.equal(assess({...payload(name,"#"+dex,"Sandy"),isShadow:true}).key,null);
 assert.equal(assess({...payload(name,"#"+dex,"Sandy"),region:"Galar"}).key,null);
}
assert.equal(assess(payload("Burmy","#413","Sandy")).key,null,"Dex mismatch blocked");
assert.equal(assess(payload("Vulpix","#37","Galar")).key,null,"regional stats cannot use base");
assert.equal(assess(payload("Zubat","#41","Shadow")).key,null,"Shadow cannot use regular stats");
const master=win.POKESEARCH_PVP_IV_DATA.pokemon;
const stats=name=>master.find(p=>p[1]===name)?.slice(2);
assert.deepEqual(stats("Burmy (Plant)"),stats("Burmy (Sandy)"));
assert.deepEqual(stats("Burmy (Sandy)"),stats("Burmy (Trash)"));
assert.notDeepEqual(stats("Wormadam (Sandy)"),stats("Wormadam (Trash)"));
const presenter=require("../src/main/assets/pokemon_card_presentation.js");
const moves=require("../src/main/assets/pve_moves_ptbr.js");
globalThis.PokeSearchMovePtBR=moves;
for(const [input,expected] of [
 ["Brasa / Lança-chamas",["fire","fire"]],
 ["Investida / Insistência",["normal","bug"]],
 ["Mordida / Pancada Corporal",["dark","normal"]],
 ["PECK_FAST / SWIFT",["flying","normal"]]
]){
 const card=payload("Burmy","#412","Sandy");
 const html=presenter.moves(input,card,null);
 assert.equal((html.match(/pkMoveTyped/g)||[]).length,2,input);
 for(const t of expected)assert.ok(html.includes('data-move-type="'+t+'"'),input+" "+t);
}
const unknown=presenter.moves("UNKNOWN_FAST / UNKNOWN_CHARGED",payload("Burmy","#412","Sandy"));
assert.equal((unknown.match(/pkMoveTyped/g)||[]).length,0,"unknown types must stay neutral");
const detail=asset("detail.html");
assert.ok(detail.includes("context?.rankSpecies||context?.name||metricCard.name"));
assert.ok(detail.includes("payload?.rankSpecies||payload?.name"));
assert.ok(detail.includes("pkMoveTyped"));
console.log("LT280 verified exact Burmy/Wormadam ranks in GL/UL/ML and colored move typing PASS");

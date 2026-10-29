"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const asset=name=>fs.readFileSync(path.join(__dirname,"../src/main/assets",name),"utf8");
const dock=asset("dock.html"),detail=asset("detail.html");
const win={PokeSearchOfflineSprite:{verifiedSpeciesIdentity(card){
  return ["#714","#37"].includes(String(card.number))&&
    ["Noibat","Vulpix"].includes(String(card.name));
}}};
new Function("window",asset("pvpoke-overall-ranks.js"))(win);
new Function("window",asset("pvpoke-iv-gamemaster.js"))(win);
const from=dock.indexOf("const PVPOKE_OVERALL=");
const to=dock.indexOf('let lastListKey=""',from);
assert.ok(from>=0&&to>from,"production PvP calculator block");
function verifiedIv(card){
 const raw=String(card?.iv||"");
 if(!/^(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])$/.test(raw))return null;
 const pct=Math.round(raw.split("/").map(Number).reduce((sum,value)=>sum+value,0)*100/45);
 return Number(card.ivPercent)===pct?pct:null;
}
const production=new Function("window","verifiedSpawnIvPercent","resultWindow","cards",
  dock.slice(from,to)+"return window.pvpEvolutionDetails;");
function projected(card){
 return production(win,verifiedIv,true,[card])(0);
}
function makeCard(name,number,iv,ivPercent,cp,level){
 return {name,number,iv,ivPercent,cp,level,form:"Halloween",
   costume:"Halloween",costume_id:2026,isCostume:true,sourceIndex:0};
}
const examples=[
 [makeCard("Noibat","#714","0/15/12",60,142,9),"Noivern"],
 [makeCard("Vulpix","#37","1/15/14",67,10,1),"Ninetales"]
];
for(const [card,evolved] of examples){
 const result=projected(card);
 assert.equal(result?.leagues?.length,3,card.name+" all leagues");
 assert.equal(result.includePreviousEvolutions,true);
 for(const league of result.leagues){
  assert.equal(league.evolutions.length,0,"event costume must not claim legal evolution");
  assert.ok(league.own?.rank>=1,"current "+card.name+" has its own species rank");
  const ref=league.comparisons.find(x=>x.name===evolved);
  assert.ok(ref,"reference available for "+evolved+" in "+league.league);
  assert.equal(ref.referenceOnly,true);
  assert.equal(ref.eligible,null);
  assert.ok(Number.isInteger(ref.rank)&&ref.rank>=1&&ref.rank<=4096);
  assert.match(ref.statProductPct,/^\d{1,3},\d{2}$/);
  assert.ok(Number.isInteger(ref.cp)&&ref.cp>0);
  assert.ok(Number.isFinite(ref.level)&&ref.level>=1);
 }
}
// Normal species still use actual evolution rows, never a comparison badge.
const regular={...examples[1][0],form:"",costume:"",costume_id:0,isCostume:false};
for(const league of projected(regular).leagues){
 assert.ok(league.evolutions.some(x=>x.name==="Ninetales"));
 assert.equal(league.comparisons.length,0);
}
// Regional/stat-changing forms cannot silently fall back to normal Ninetales.
const regional={...examples[1][0],form:"Alolan",region:"Alola"};
for(const league of projected(regional).leagues){
 assert.equal(league.comparisons.length,0);
 assert.equal(league.evolutions.length,0);
}
const script=detail.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,"detail script");
const start=script.indexOf("function evolutionRow(");
const end=script.indexOf("const item=(k,v)",start);
assert.ok(start>=0&&end>start,"detail evolution renderer");
const elements=new Map();
const node=id=>{
 if(!elements.has(id))elements.set(id,{
  hidden:true,innerHTML:"",textContent:"",scrollTop:0,scrollHeight:1000,clientHeight:1000,
  setAttribute(){},getAttribute(){return "";}
 });
 return elements.get(id);
};
const present=new Function("window","document","h","evoIdentity","detailIdentity",
 "activeRankLeague","resizeEvolutionPanel","requestAnimationFrame",
 script.slice(start,end)+"return window.showEvolutionDetails;");
const htmlEscape=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;");
const show=present(win,{getElementById:node},htmlEscape,()=>"same","same","",()=>{},fn=>fn());
for(const [card,evolved] of examples){
 const payload=projected(card);
 assert.equal(show(payload),true);
 const markup=node("evoBody").innerHTML;
 assert.equal((markup.match(/class="evoLeague /g)||[]).length,3);
 assert.equal((markup.match(/class="evoLine isReference"/g)||[]).length,3);
 assert.equal((markup.match(/Ref.<\/span> <b>/g)||[]).length,3);
 assert.ok(markup.includes("<b>"+evolved+"</b>"));
 assert.ok(markup.includes("Rank Classe: #"));
 assert.ok(markup.includes("PC "));
 assert.ok(!markup.includes("Elegibilidade não verificada"),
   "reference must never claim costume evolution eligibility");
 assert.equal(node("evolutions").hidden,false);
 assert.equal(node("evoLabel").textContent,"Análise PvP · 3 avaliações");
 // Disabling previous evolutions suppresses only comparison rows.
 assert.equal(show({...payload,includePreviousEvolutions:false}),true);
 assert.equal((node("evoBody").innerHTML.match(/isReference/g)||[]).length,0);
}
console.log("LT165 costume reference evolution analysis across GL/UL/ML PASS");

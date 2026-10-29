"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets");
const file=name=>fs.readFileSync(path.join(assets,name),"utf8");
const dock=file("dock.html");
const detail=file("detail.html");
const win={};
new Function("window",file("pvpoke-overall-ranks.js"))(win);
new Function("window",file("pvpoke-iv-gamemaster.js"))(win);
const from=dock.indexOf("const PVPOKE_OVERALL=");
const to=dock.indexOf('let lastListKey=""',from);
assert.ok(from>=0&&to>from,"existing read-only PvP gamemaster implementation found");
const verified=c=>{
 const raw=String(c?.iv??"");
 if(!/^(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])$/.test(raw))return null;
 const pct=Math.round(raw.split("/").map(Number).reduce((a,b)=>a+b,0)*100/45);
 return String(c.ivPercent??"").trim()&&Number(c.ivPercent)!==pct?null:pct;
};
const card={name:"Vulpix",number:"#37",iv:"",ivPercent:"",cp:163,level:7,sourceIndex:0};
const details=cards=>new Function("window","verifiedSpawnIvPercent","resultWindow","cards",
 dock.slice(from,to)+"return window.pvpEvolutionDetails;")(win,verified,true,cards)(0);
const result=details([card]);
assert.equal(result?.ivUnavailable,true,"missing source IV explicitly marked");
assert.equal(result.leagues.length,3);
const evolutions=result.leagues.flatMap(l=>l.evolutions.map(e=>({...e,league:l.league})));
const ninetales=evolutions.filter(e=>e.name==="Ninetales");
assert.ok(ninetales.length>0,"Vulpix exposes only verified Ninetales overall ranks");
for(const evolution of ninetales){
 assert.ok(Number.isInteger(evolution.overallRank)&&evolution.overallRank>0);
 assert.equal(evolution.rank,null,"never infer Rank Classe from absent A/D/S");
 assert.equal(evolution.statProductPct,undefined,"never infer IV efficiency");
 assert.equal(evolution.cp,undefined,"never infer evolution PC");
 assert.equal(evolution.level,undefined,"never infer evolution level");
}
assert.equal(details([{...card,iv:"15/15/15",ivPercent:"0"}]),null,"conflicting IV rejected");
assert.equal(details([{...card,iv:"16/15/15"}]),null,"invalid raw IV rejected");
assert.equal(details([{...card,name:"NotExisting",form:"Mystery"}]),null,"unknown forms are not promoted");
assert.equal(details([{...card,form:"Alolan"}]),null,"Alolan form cannot inherit regular Vulpix ranks");
// Missing analyses now have a compact, honest state in the same card.
assert.ok(detail.includes("IV não informado · Rank Classe indisponível."));
assert.ok(!detail.includes("evoHint"),"remove the initial explanatory paragraph entirely");
assert.ok(detail.includes("Análise PvP · Ranks gerais"));
assert.ok(detail.includes("Rank Geral: #"));
new vm.Script(detail.match(/<script>([\s\S]*?)<\/script>/)[1]);
console.log("LT156: missing IV can show only verified overall species/evolution ranks PASS");

"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const asset=name=>fs.readFileSync(path.join(__dirname,"../src/main/assets",name),"utf8");
const sprite=require("../src/main/assets/sprite_offline.js");
const dock=asset("dock.html"),html=asset("detail.html");
const win={PokeSearchOfflineSprite:sprite};
new Function("window",asset("pvpoke-overall-ranks.js"))(win);
new Function("window",asset("pvpoke-iv-gamemaster.js"))(win);
const start=dock.indexOf("const PVPOKE_OVERALL="),end=dock.indexOf('let lastListKey=""',start);
assert.ok(start>=0&&end>start);
const verifiedIV=c=>{
 const raw=String(c?.iv??"");
 if(!/^(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])$/.test(raw))return null;
 const pct=Math.round(raw.split("/").map(Number).reduce((a,b)=>a+b,0)*100/45);
 return String(c.ivPercent??"").trim()&&Number(c.ivPercent)!==pct?null:pct;
};
const noibat={name:"Noibat",number:"#714",iv:"0/14/12",ivPercent:"58",
 cp:222,level:14,sourceIndex:0,shiny:true};
const build=(card,mode="gl",limit=5,previous=true)=>
 new Function("window","verifiedSpawnIvPercent","resultWindow","cards","mode","searchSettings",
  dock.slice(start,end)+"return window.pvpEvolutionDetails;")(
   win,verifiedIV,true,[card],mode,
   {glRank:limit,ulRank:limit,includePreviousEvolutions:previous})(0);
const ordinary=build(noibat);
assert.equal(ordinary.searchLeague,"gl");
assert.equal(ordinary.searchRankLimit,5);
assert.equal(ordinary.includePreviousEvolutions,true);
const gl=ordinary.leagues.find(x=>x.league==="gl");
assert.equal(gl.own.rank,1600,"Noibat itself is GL #1600 for IV 0/14/12");
const noivern=gl.evolutions.find(x=>x.name==="Noivern");
assert.ok(noivern,"Noivern evolution must be considered for a GL filter with earlier evolutions");
assert.equal(noivern.rank,5,"Noivern 0/14/12 must be GL Rank Classe #5");
assert.equal(noivern.eligible,true,"at Noibat level 14, evolving does not exceed GL cap");
const costume=build({...noibat,isCostume:true,costume_id:999}, "gl",5,true);
assert.equal(costume.leagues[0].evolutions.length,0,"no invented costume evolution eligibility");
const reference=costume.leagues[0].comparisons.find(x=>x.name==="Noivern");
assert.equal(reference?.rank,5,"costume can reference the same species IV math");
assert.equal(reference.referenceOnly,true);
assert.equal(reference.eligible,null,"comparison does not guarantee evolving costume");
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);new vm.Script(script);
const a=script.indexOf("function updateVisiblePvPRank(payload){");
const b=script.indexOf("window.showEvolutionDetails=payload=>",a);
assert.ok(a>=0&&b>a);
const badge={hidden:true,textContent:"",title:""};
const display=()=>new Function("document","activeRankLeague",
 script.slice(a,b)+"return updateVisiblePvPRank;")({
 getElementById(id){assert.equal(id,"rankLine");return badge;}}, "gl");
assert.equal(display()(ordinary),true);
assert.equal(badge.textContent,"GL · Rank Classe: #5 · ↳ Noivern");
assert.ok(badge.title.includes("Noibat atual: #1600"));
badge.hidden=true;
assert.equal(display()(costume),true);
assert.equal(badge.textContent,"GL · Rank Classe: #5 · ↳ Noivern");
assert.ok(badge.title.includes("não confirma"));
badge.hidden=true;
const notInLimit=build(noibat,"gl",4);
assert.equal(display()(notInLimit),false);
assert.ok(badge.textContent.includes("Filtro Top #4")&&badge.textContent.includes("Noibat atual #1600"),
 "never label #1600 as a Top #4 match");
badge.hidden=true;
const noPrev=build(noibat,"gl",5,false);
assert.equal(display()(noPrev),false,"when includePreviousEvolutions OFF, do not use Noivern rank");
assert.ok(badge.textContent.includes("Filtro Top #5"));
badge.hidden=true;
assert.equal(display()({...ordinary,searchLeague:"ul",searchRankLimit:5}),true,
 "without a matching GL search context show a verified local best instead of inventing a GL threshold");
assert.ok(!badge.textContent.includes("Filtro Top #5"));
console.log("LT164 GL Top #5 Noibat 0/14/12 -> Noivern Rank Classe #5; Noibat #1600; cosmetic reference, limited search PASS");

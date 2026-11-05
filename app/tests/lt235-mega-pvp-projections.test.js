"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const asset=name=>fs.readFileSync(path.join(__dirname,"../src/main/assets",name),"utf8");
const sprite=require("../src/main/assets/sprite_offline.js");
const dock=asset("dock.html"),detail=asset("detail.html");
const win={PokeSearchOfflineSprite:sprite};
new Function("window",asset("pvpoke-overall-ranks.js"))(win);
new Function("window",asset("pvpoke-iv-gamemaster.js"))(win);
const from=dock.indexOf("const PVPOKE_OVERALL="),to=dock.indexOf('let lastListKey=""',from);
assert.ok(from>=0&&to>from,"need real pinned PvP calculator, not test doubles");
const extract=dock.slice(from,to);
const pct=card=>{
 const iv=String(card?.iv??"").trim();
 if(!/^(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])$/.test(iv))return null;
 const value=Math.round(iv.split("/").map(Number).reduce((a,b)=>a+b,0)*100/45);
 return String(card.ivPercent??"").trim()&&Number(card.ivPercent)!==value?null:value;
};
function projected(card,settings={}){
 const ctx=new Function("window","verifiedSpawnIvPercent","resultWindow","cards","mode","searchSettings",
  extract+"return {megaFormProjections,megaFormsByBase,pvpEvolutionDetails:window.pvpEvolutionDetails};")(
  win,pct,true,[card],"gl",{glRank:1,ulRank:1,includePreviousEvolutions:settings.includePreviousEvolutions!==false});
 return {ctx,result:ctx.pvpEvolutionDetails(0)};
}
const sableye={name:"Sableye",number:"#302",form:"",iv:"0/15/12",ivPercent:"60",cp:98,level:3,sourceIndex:0};
const {ctx,result}=projected(sableye);
assert.equal(result.leagues.length,3);
assert.equal(result.leagues[0].own.rank,14,"Sableye normal remains own GL #14");
assert.equal(result.leagues[0].own.statProductPct,"99,01");
assert.equal(result.leagues[0].own.cp,1493);
assert.deepEqual(result.leagues.map(l=>l.megas.length),[1,1,1]);
const mega=result.leagues[0].megas[0];
assert.equal(mega.name,"Mega Sableye");
assert.equal(mega.rank,1,"0/15/12 really is Mega Sableye GL rank #1");
assert.equal(mega.statProductPct,"100,00");
assert.equal(mega.cp,1499);
assert.equal(mega.level,30);
assert.equal(mega.referenceOnly,true);
assert.equal(mega.megaProjection,true);
assert.equal(mega.eligible,null,"Mega is a calculation, never a claim of GBL eligibility");
assert.equal(result.leagues[1].megas[0].rank,1468);
assert.equal(result.leagues[2].megas[0].rank,1468);
assert.equal(result.leagues[0].evolutions.length,0,"Sableye has no ordinary evolution");
assert.equal(result.searchRankLimit,1,"actual provider Top-N is not overwritten by Mega #1");
assert.equal(ctx.megaFormsByBase.get("sableye").length,1);
const disabled=projected(sableye,{includePreviousEvolutions:false}).result;
assert.equal(disabled.leagues[0].megas[0].rank,1,"Mega shown independently of previous-evolutions toggle");
assert.equal(disabled.leagues[0].comparisons.length,0);
const invalid=projected({...sableye,ivPercent:"100"}).result;
assert.equal(invalid,null,"conflicting IV evidence must not produce Mega rank");
const missing=projected({...sableye,iv:"",ivPercent:""}).result;
assert.ok(missing,"overall ranking may remain without raw IVs");
assert.deepEqual(missing.leagues.map(l=>l.megas.length),[0,0,0],"no 0/0/0 guessed");
for(const card of [
 {...sableye,form:"UNKNOWN_GO_FORM"},
 {...sableye,region:"Galar"},
 {...sableye,name:"Sableye (Shadow)",isShadow:true,form:""},
 {...sableye,name:"Sableye (Mega)",form:"Mega"},
 {...sableye,name:"Zubat",number:"#41",form:"ZUBAT_HALLOWEEN_2026_01",form_id:3362},
]){
 const answer=projected(card).result;
 assert.ok(!answer||answer.leagues.every(l=>l.megas.length===0),
  "unknown/regional/shadow/current Mega/costume must not acquire base Mega projection");
}
// Full catalogue coverage: no hand-picked list or single-Sableye special case.
// The current pinned PvPoke Game Master contains 60 individually named Mega
// forms (including X/Y); the projection contract is verified for EVERY one.
const gm=win.POKESEARCH_PVP_IV_DATA;
const megaEntries=gm.pokemon.filter(([id,name])=>
 /^(.+)_mega(?:_[xy])?$/.test(id)&&/^.+ \(Mega(?: [XY])?\)$/.test(name));
assert.ok(megaEntries.length>=60,"pinned PvPoke Mega catalogue unexpectedly incomplete");
const megaGroups=new Map();
for(const [,name] of megaEntries){
 const match=name.match(/^(.+) \(Mega(?: ([XY]))?\)$/);
 assert.ok(match,"Mega naming should have verified base");
 const base=match[1];
 if(!megaGroups.has(base))megaGroups.set(base,[]);
 megaGroups.get(base).push(name);
}
assert.equal([...ctx.megaFormsByBase.values()].reduce((n,arr)=>n+arr.length,0),
 megaEntries.length,"every pinned Mega entry must map to one base");
const allCards=[...megaGroups.keys()].map((name,index)=>({
 name,iv:"0/15/12",ivPercent:"60",form:"",sourceIndex:index
}));
const full=new Function("window","verifiedSpawnIvPercent","resultWindow","cards","mode","searchSettings",
 extract+"return window.pvpEvolutionDetails;")(
 win,pct,true,allCards,"gl",{glRank:1,ulRank:1,includePreviousEvolutions:true});
const seenMega=new Set();
for(let i=0;i<allCards.length;i++){
 const card=allCards[i],analysis=full(i);
 assert.ok(analysis?.leagues?.length===3,"all 3 leagues must be returned for "+card.name);
 const expected=megaGroups.get(card.name).map(name=>{
  const parts=name.match(/^(.+) \(Mega(?: ([XY]))?\)$/);
  return "Mega "+parts[1]+(parts[2]?" "+parts[2]:"");
 }).sort();
 for(const league of analysis.leagues){
  const forms=league.megas;
  assert.deepEqual(forms.map(x=>x.name).sort(),expected,
   "all Mega X/Y variants must be present in "+league.league+" for "+card.name);
  for(const m of forms){
   seenMega.add(m.name);
   assert.ok(Number.isInteger(m.rank)&&m.rank>=1&&m.rank<=4096,
    "no missing/fabricated Mega IV rank "+m.name+" "+league.league);
   assert.match(m.statProductPct,/^\d{1,3},\d{2}$/);
   assert.ok(Number.isFinite(m.cp)&&m.cp>=10&&
    m.cp<=(league.league==="gl"?1500:league.league==="ul"?2500:10000),
    "projected Mega CP must fit the league cap: "+m.name+" "+league.league);
   assert.ok(Number.isFinite(m.level)&&m.level>=1&&m.level<=50);
   assert.equal(m.megaProjection,true);
   assert.equal(m.referenceOnly,true);
   assert.equal(m.eligible,null,"Mega preview must not imply GBL entry");
  }
 }
}
assert.equal(seenMega.size,megaEntries.length,
 "100% of pinned Mega forms must be represented in GL/UL/ML");
console.log("LT235 Mega catalogue: "+megaGroups.size+" base species / "+
 megaEntries.length+" Mega forms / 3 leagues verified");
const charizard=projected({...sableye,name:"Charizard",number:"#6"}).result;
assert.deepEqual(charizard.leagues[0].megas.map(m=>m.name),["Mega Charizard X","Mega Charizard Y"]);
assert.ok(charizard.leagues[0].megas.every(m=>Number.isInteger(m.rank)&&m.rank>=1));
const rowBegin=detail.indexOf("function evolutionRow(x,first){");
const rowEnd=detail.indexOf("// Compact rank shown OUTSIDE",rowBegin);
assert.ok(rowBegin>0&&rowEnd>rowBegin);
const htmlEscape=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const row=new Function("window","h",detail.slice(rowBegin,rowEnd)+"return evolutionRow;")(
 {PokeSearchIVDisplay:{colorForEfficiency:()=>"#ffffff"}},htmlEscape);
const megaHtml=row(mega,false);
for(const marker of ["Mega Sableye","isMega","TOP 1 MEGA","100,00%","Rank Classe: #1","PC 1499","Nv. 30,0",'data-mega-projection="true"']){
 assert.ok(megaHtml.includes(marker),"missing Mega detail: "+marker);
}
assert.ok(!row({...result.leagues[0].own,name:"Sableye"},true).includes("TOP 1 MEGA"),
 "normal form must never inherit the Mega badge");
assert.ok(detail.includes("league.megas.filter(e=>e?.megaProjection===true)"));
assert.ok(detail.includes("const rows=[...megas,...entries,...references]"));
assert.ok(detail.includes("Mega: projeção matemática dos mesmos IVs"));
assert.ok(detail.includes("Não confirma que Mega seja permitida na Liga de Batalha GO"));
const compactBegin=detail.indexOf("function updateVisiblePvPRank(payload){");
const compactEnd=detail.indexOf("window.showEvolutionDetails=payload=>",compactBegin);
assert.ok(compactBegin>0&&compactEnd>compactBegin);
assert.ok(detail.slice(compactBegin,compactEnd).includes('if(e?.megaProjection===true)add(e,e.name,"mega")'),
 "Mega Top 1 is visible in its own compact mathematical projection");
assert.ok(detail.slice(compactBegin,compactEnd).includes('kind!=="mega"'),
 "Mega projection must not claim an ordinary GBL RG");
new vm.Script(detail.match(/<script>([\s\S]*?)<\/script>/)[1]);
console.log("LT235 Mega PvP: base vs projected GL/UL/ML, Charizard X/Y, unsupported forms, strict IV and card UI PASS");

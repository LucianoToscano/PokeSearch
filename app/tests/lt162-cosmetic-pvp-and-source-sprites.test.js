"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const asset=name=>fs.readFileSync(path.join(__dirname,"../src/main/assets",name),"utf8");
const sprite=require("../src/main/assets/sprite_offline.js");
const dock=asset("dock.html"),probe=asset("probe.js");
const win={PokeSearchOfflineSprite:sprite};
new Function("window",asset("pvpoke-overall-ranks.js"))(win);
new Function("window",asset("pvpoke-iv-gamemaster.js"))(win);
const from=dock.indexOf("const PVPOKE_OVERALL=");
const to=dock.indexOf('let lastListKey=""',from);
assert.ok(from>=0&&to>from);
const percent=c=>{
 const raw=String(c?.iv??"").trim();
 if(!/^(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])$/.test(raw))return null;
 const pct=Math.round(raw.split("/").map(Number).reduce((a,b)=>a+b,0)*100/45);
 return String(c.ivPercent??"").trim()&&Number(c.ivPercent)!==pct?null:pct;
};
function construct(card){
 const ctx=new Function("window","verifiedSpawnIvPercent","resultWindow","cards",
  dock.slice(from,to)+
  "return {safePvpSpeciesKey,cosmeticPvpIdentity,pvpEvolutionDetails:window.pvpEvolutionDetails};")(
    win,percent,true,[card]);
 return {ctx,result:ctx.pvpEvolutionDetails(0)};
}
const h={name:"Zubat",number:"#41",form:"ZUBAT_HALLOWEEN_2026_01",form_id:3362,
 iv:"15/15/15",ivPercent:"100",cp:89,level:5,sourceIndex:0};
assert.ok(sprite.verifiedSpeciesIdentity(h));
const seasonal=construct(h);
const base=construct({...h,form:"NORMAL",form_id:157});
assert.equal(seasonal.ctx.cosmeticPvpIdentity(h),true,"cosmetic Zubat verified");
assert.equal(seasonal.ctx.safePvpSpeciesKey(h),"zubat");
assert.equal(seasonal.result?.leagues?.length,3,"Halloween Zubat has base-species PvP analysis");
for(let i=0;i<3;i++){
 const a=seasonal.result.leagues[i],b=base.result.leagues[i];
 assert.ok(a.own?.rank>0,"Halloween Zubat gets class rank based on same base stats");
 assert.equal(a.own.rank,b.own.rank,"costume vs ordinary Zubat must have same IV class");
 assert.equal(a.own.statProductPct,b.own.statProductPct);
 assert.equal(a.evolutions.length,0,"do not promise event costume can evolve");
}
for(const [name,number,form] of [
 ["Vulpix","#37","Galar"],["Vulpix","#37","Alolan"],
 ["Zubat","#41","Shadow"],["Gengar","#94","Mega"],
 ["Pumpkaboo","#710","Small"],["Zubat","#41","Strange New Form"]
]){
 const card={name,number,form,iv:"15/15/15",ivPercent:"100"};
 const c=construct(card).ctx;
 assert.equal(c.safePvpSpeciesKey(card),null,
  form+" must not silently inherit ordinary Pokémon's stats");
}
const validated=construct({name:"Vulpix",number:"#37",form:"",region:"Galar",iv:"15/15/15",ivPercent:"100"});
assert.equal(validated.ctx.safePvpSpeciesKey({name:"Vulpix",number:"#37",region:"Galar"}),null);
const alola=construct({name:"Vulpix (Alolan)",number:"#37",form:"Alolan",iv:"15/15/15",ivPercent:"100"});
assert.equal(alola.ctx.safePvpSpeciesKey({name:"Vulpix (Alolan)",form:"Alolan"}),"vulpix (alolan)");
for(const [name,number,form] of [
 ["Deerling","#585","Autumn"],["Sawsbuck","#586","Spring"],
 ["Shellos","#422","West Sea"],["Gastrodon","#423","East Sea"]
]){
 const card={name,number,form};
 assert.equal(construct(card).ctx.safePvpSpeciesKey(card),name.toLowerCase(),
  form+" has only cosmetic appearance change for PvP base stats");
}
assert.equal(construct({name:"Zubat",number:"#94",form:"Halloween 2026 01"}).ctx.safePvpSpeciesKey({
 name:"Zubat",number:"#94",form:"Halloween 2026 01"}),null,"wrong Dex/name rejected");
assert.ok(probe.includes("[class*='sprite']"),"look for provider class-backed sprites");
assert.ok(probe.includes("getComputedStyle(e)?.backgroundImage"),"provider computed CSS background can supply exact image");
assert.ok(probe.includes("const siteImageExact=!!image&&!!siteImageUrl;"));
assert.ok(probe.includes("if(tokens&&!urlForm.includes(tokens)&&!compact(alt).includes(tokens))return false;"),
 "provider image must still match exact form");
new vm.Script(probe);
console.log("LT162 verified costume rank inheritance and exact provider sprite detection PASS");

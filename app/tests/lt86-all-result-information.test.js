"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.join(__dirname,"../src/main");
const dock=fs.readFileSync(path.join(root,"assets/dock.html"),"utf8");
const java=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const cut=(start,end)=>{
 const first=dock.indexOf(start),last=dock.indexOf(end,first+start.length);
 assert.ok(first>=0&&last>first,"Missing source section "+start);
 return dock.slice(first,last);
};
let passes=0;
const check=(title,fn)=>{fn();passes++;console.log("PASS LT86 INFO "+title);};
check("single explicit Show all action atomically persists existing 21 fields, IV and timer",()=>{
 assert.match(java,/@JavascriptInterface public void setAllResultDisplayOptions\(boolean enabled\)/);
 const section=java.split("setAllResultDisplayOptions(boolean enabled)")[1].split("@JavascriptInterface public void setResultDisplayOption",1)[0];
 for(const key of ["showTimers","showResultText","resultShowSpeciesIvRankGl",
  "resultShowSpeciesIvRankUl","resultShowSpeciesIvRankMl","resultShowOverallRankGl",
  "resultShowOverallRankUl","resultShowOverallRankMl","resultShowRawIv",
  "resultShowName","resultShowGender","resultShowLocation","resultShowDistance"])
  assert.ok(section.includes(key),key);
 assert.match(dock,/Mostrar todas as informações/);
 assert.match(dock,/Native\.setAllResultDisplayOptions\(!allVisible\)/);
 assert.match(dock,/panel\.appendChild\(allButton\)/);
});
check("result metadata scroll begins at top so rank and time can be reached",()=>{
 assert.match(dock,/\.spawnInfo\{justify-content:flex-start!important/);
 assert.match(dock,/touch-action:pan-y/);
 assert.match(dock,/overflow-y:auto/);
 const src=cut("function resultLines(card,opts,league){","function resultInfoHtml(value,card){");
 assert.match(src,/lines\.unshift\("TIMER"\)/);
});
check("all available card information, verified GL, UL, ML ranks and Genderless",()=>{
 const source=cut("function resultLines(card,opts,league){","function resultInfoHtml(value,card){");
 const sandbox={
  Date:{now:()=>1000},
  verifiedSpawnRawIv:()=> "15/15/15",
  verifiedSpawnIvPercent:()=>100,
  verifiedOverallRank:(_card,league)=>({gl:12,ul:19,ml:52}[league]??null),
  verifiedSpeciesIvRank:(_card,league)=>({gl:3,ul:5,ml:8}[league]??null),
  pvpIvClassPercent:(_rank,_card,league)=>({gl:"99.9",ul:"97.1",ml:"92.0"}[league]??null),
  bestEvolutionRank:()=>null,
  locationCountryFlag:()=>"",
 };
 vm.runInNewContext(source,sandbox);
 const opts={name:true,number:true,gender:true,size:true,form:true,moves:true,
  location:true,distance:true,shiny:true,cp:true,level:true,despawn:true,iv:true,
  rawIv:true,overallRank:true,speciesIvRank:true,
  overallRankGl:true,overallRankUl:true,overallRankMl:true,
  speciesIvRankGl:true,speciesIvRankUl:true,speciesIvRankMl:true};
 const card={name:"Voltorb",number:"#100",gender:"⚲",size:"XS",form:"Normal",
  moves:"Spark / Thunderbolt",location:"City, Brazil",distance:"18 km",
  shiny:true,cp:"635",level:"25",expiresAtMs:301000};
 const lines=sandbox.resultLines(card,opts,"gl");
 assert.equal(lines[0],"TIMER");
 for(const value of ["Voltorb","#100","⚲","XS","Normal","Spark / Thunderbolt",
  "City, Brazil","18 km","✨","PC635 · Nv25","15/15/15","100%",
  "GL RG#12","UL RG#19","ML RG#52",
  "GL IV#3","UL IV#5","ML IV#8"])
   assert.ok(lines.includes(value),"Expected card line "+value);
});
check("legacy rank display falls back when league keys exist but are all OFF",()=>{
 const source=cut("function resultLines(card,opts,league){","function resultInfoHtml(value,card){");
 const sandbox={Date:{now:()=>0},verifiedOverallRank:()=>25,
   verifiedSpeciesIvRank:()=>37,verifiedSpawnIvPercent:()=>null,
   verifiedSpawnRawIv:()=>null,locationCountryFlag:()=>"",
   pvpIvClassPercent:()=>null,bestEvolutionRank:()=>null};
 vm.runInNewContext(source,sandbox);
 const shown=sandbox.resultLines({name:"Voltorb"},
  {overallRank:true,speciesIvRank:true,overallRankGl:false,
   overallRankUl:false,overallRankMl:false,speciesIvRankGl:false,
   speciesIvRankUl:false,speciesIvRankMl:false},"gl");
 assert.ok(shown.includes("RG#25"),JSON.stringify(shown));
 assert.ok(shown.includes("IV#37"),JSON.stringify(shown));
});
check("unconfirmed PvP rank and despawn are never fabricated",()=>{
 const source=cut("function resultLines(card,opts,league){","function resultInfoHtml(value,card){");
 const sandbox={Date:{now:()=>1000},
  verifiedOverallRank:()=>null,verifiedSpeciesIvRank:()=>null,
  verifiedSpawnIvPercent:()=>null,verifiedSpawnRawIv:()=>null,
  pvpIvClassPercent:()=>null,bestEvolutionRank:()=>null,locationCountryFlag:()=>""};
 vm.runInNewContext(source,sandbox);
 const shown=sandbox.resultLines({name:"Voltorb",expiresAtMs:0,gender:"⚲"},
   {name:true,gender:true,despawn:true,overallRankGl:true,speciesIvRankUl:true},"gl");
 assert.ok(shown.includes("Voltorb"));assert.ok(shown.includes("⚲"));
 assert.ok(!shown.some(x=>x.includes("TIMER")||x.includes("RG#")||x.includes("IV#")));
});
console.log("LT86 INFO: "+passes+"/"+passes+" PASS");
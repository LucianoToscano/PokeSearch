"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets");
const html=fs.readFileSync(path.join(assets,"detail.html"),"utf8");
const dock=fs.readFileSync(path.join(assets,"dock.html"),"utf8");
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);new vm.Script(script);
for(const s of dock.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
 new vm.Script(s[1]);
// The user screenshot showed two blue circles: a stale ::before + the emoji.
assert.ok(html.includes("#rankLine::before,#rankLine[data-league]::before{"));
assert.ok(html.includes("display:none!important;content:none!important;width:0!important;"),
 "disable the old 7px circle which doubled the league emoji");
const lt250=html.slice(html.indexOf("/* LT250 — rank strip"));
assert.ok(lt250.includes("border:0!important;border-radius:0!important;background:transparent!important"),
 "remove the single background surrounding all three divisions");
for(const cls of [".psLeagueIv",".psCompactSpecies",".psCompactOverall"]){
 assert.ok(lt250.includes(cls),"each independent tap target has a CSS chip");
}
assert.ok(lt250.includes("min-height:28px!important;height:28px!important"),
 "touch areas are legible on a Samsung overlay");
assert.ok(lt250.includes("#rankLine .psMovesAction{"),"attacks have a fourth distinct tap target");
const a=script.indexOf("function closePvpRankAlternates(){");
const b=script.indexOf("window.showEvolutionDetails=payload=>",a);
assert.ok(a>=0&&b>a);
const make=tag=>({tag,children:[],className:"",dataset:{},attrs:{},style:{},title:"",textContent:"",hidden:true,
 setAttribute(k,v){this.attrs[k]=String(v)},
 appendChild(child){this.children.push(child);this.textContent+=child.textContent||"";},
 replaceChildren(){this.children=[];this.textContent=""},
 querySelector(){return null}});
const rank=make("div"),alternates=make("div");
const document={getElementById:id=>id==="rankLine"?rank:id==="psRankAlternates"?alternates:null,
 createElement:make};
const fn=new Function("document","window","activeRankLeague",
 "currentRankSpecies","openPvpRankExplorer","renderRankOneMoves","resizeEvolutionPanel",
 script.slice(a,b)+"return updateVisiblePvPRank;")(
 document,{},"gl","Oddish",()=>true,()=>{},()=>{});
const oddish={name:"Oddish",searchLeague:"gl",searchRankLimit:1,
 leagues:[{league:"gl",own:{rank:621,overallRank:2000},evolutions:[
   {name:"Gloom",rank:1,overallRank:816,eligible:true},
   {name:"Bellossom",rank:12,overallRank:240,eligible:true}]},
  {league:"ul",own:{rank:1300},evolutions:[]},
  {league:"ml",own:{rank:100},evolutions:[]}]};
assert.equal(fn(oddish),true);
assert.deepEqual(rank.children.map(x=>x.textContent),
 ["🔵 GL IV #1","↳ Gloom","RG #816"]);
assert.ok(!rank.children.some(x=>x.className==="psRankMore"),
 "only three fields: other candidates remain in the expanded PvP analysis");
assert.ok(!rank.children.some(x=>x.className==="psRankLeague"),
 "no extra blue league circle or separate league label");
assert.equal(rank.children[0].dataset.psKind,"class");
assert.equal(rank.children[1].dataset.psName,"Gloom");
assert.equal(rank.children[2].dataset.psKind,"overall");
assert.ok(script.includes('btn.className="psMovesAction"'));
assert.ok(script.includes('btn.onclick=async()=>'),"fourth, separate attacks action");
const simCss=html.slice(html.indexOf("/* LT250 — the evolution selector"));
assert.ok(simCss.includes("grid-template-columns:minmax(0,1fr)!important"),
 "form and level must occupy independent FULL-WIDTH rows");
assert.ok(simCss.includes(".psCpFormStepper select"));
assert.ok(simCss.includes("height:34px!important;font-size:12px!important"));
assert.ok(simCss.includes(".psCpLevelStepper input[type=range]"));
assert.ok(simCss.includes("max-height:min(66vh,430px)!important"),
 "taller, readable simulator but capped to screen with scroll");
assert.ok(script.includes('<select id="psCpForm"'));
assert.ok(script.includes('onclick="stepPvpCpForm(1)"'));
assert.ok(script.includes('onclick="psCpApplyTarget()"'));
// The user's missing 0 must be inside the anchored header, not a detached row.
assert.ok(dock.includes('id="resultHeader"'));
assert.ok(dock.includes('id="resultSpawnCount"'));
assert.ok(dock.includes('body.result-window #resultSpawnCount{'));
assert.equal(dock.split('const showCount=resultDisplayOptions.count||cards.length===0;').length-1,2);
assert.equal(dock.split('count.textContent=showCount?String(cards.length):"";').length-1,2);
assert.ok(dock.includes('body.result-window #empty{display:none!important'));
assert.ok(dock.includes('empty.style.display=cards.length||resultWindow?"none":"block"'));
console.log("LT250 PASS: 1 league icon, 3 visible rank areas+attacks, readable full-width simulator, 0 attached to both Pokébolas");

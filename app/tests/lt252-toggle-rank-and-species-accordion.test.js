"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../src/main/assets");
const detail=fs.readFileSync(path.join(root,"detail.html"),"utf8");
const script=detail.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
// Rank chip forwards to the stateful toggle without losing class/overall routing.
const rankStart=script.indexOf("function openPvpRankExplorer(event,button){");
const rankEnd=script.indexOf("/* LT249:",rankStart);
assert.ok(rankStart>0&&rankEnd>rankStart);
const calls=[];
const engine={toggle(o){calls.push(o);return true},open(){throw Error("toggle should be used")}};
const rank=new Function("window","pvpFormsForLeague",script.slice(rankStart,rankEnd)+
 "return openPvpRankExplorer;")({psRankContext:{name:"Greninja",iv:"0/15/15"},PokeSearchRankExplorer:engine},
 ()=>[{name:"Greninja"}]);
const event={preventDefault(){},stopPropagation(){}};
assert.equal(rank(event,{dataset:{psKind:"class",psName:"Greninja",psLeague:"gl",psRank:"1"}}),true);
assert.equal(rank(event,{dataset:{psKind:"overall",psName:"Greninja",psLeague:"gl",psRank:"500"}}),true);
assert.deepEqual(calls.map(o=>o.kind),["class","overall"]);
// The species analysis closes on a second tap of the SAME row. A changed row
// remains expanded and focuses that row instead of closing the accordion.
const analysisStart=script.indexOf("function openPvpAnalysisForSpecies(event,button){");
const analysisEnd=script.indexOf("function evolutionRow(x,first){",analysisStart);
assert.ok(analysisStart>0&&analysisEnd>analysisStart);
let change=0,scrolls=0;const rows=["Greninja","Frogadier"].map(name=>({
 dataset:{psLeague:"gl",psName:name},classList:{remove(){},add(){}},
 scrollIntoView(){scrolls++}
}));
const section={hidden:false},body={querySelectorAll:()=>rows};
const document={getElementById(id){return id==="evolutions"?section:id==="evoBody"?body:null}};
const analysis=new Function("document","event","resizeEvolutionPanel",
 'let evolutionExpanded=false,psActiveAnalysisKey="",activeRankLeague="gl";'+
 'function toggleEvolutionDetails(){evolutionExpanded=!evolutionExpanded;if(!evolutionExpanded)psActiveAnalysisKey="";}'+
 script.slice(analysisStart,analysisEnd)+
 'return {click:openPvpAnalysisForSpecies,expanded:()=>evolutionExpanded,key:()=>psActiveAnalysisKey};'
)(document,event,()=>{change++});
const chip=name=>({dataset:{psName:name,psLeague:"gl"}});
assert.equal(analysis.click(event,chip("Greninja")),true);
assert.equal(analysis.expanded(),true);
assert.equal(analysis.click(event,chip("Frogadier")),true);
assert.equal(analysis.expanded(),true,"another species switches instead of collapsing");
assert.equal(analysis.click(event,chip("Frogadier")),true);
assert.equal(analysis.expanded(),false,"second tap collapses the same species");
assert.equal(analysis.click(event,chip("Greninja")),true);
assert.equal(analysis.expanded(),true,"tap again reopens");
assert.ok(change>=3&&scrolls>=3);
// Explorer has a stateful toggle with an exact key and its close clears state.
const gm={};new Function("window",fs.readFileSync(path.join(root,"pvpoke-iv-gamemaster.js"),"utf8"))(gm);
const overall={};new Function("window",fs.readFileSync(path.join(root,"pvpoke-overall-ranks.js"),"utf8"))(overall);
let view=null,style=null;
const previousWindow=global.window,previousDocument=global.document;
global.window={POKESEARCH_PVP_IV_DATA:gm.POKESEARCH_PVP_IV_DATA,
 POKESEARCH_PVPOKE_OVERALL:overall.POKESEARCH_PVPOKE_OVERALL,
 resizeEvolutionPanel(){}};
global.document={
 head:{appendChild(n){style=n}},
 createElement(tag){return {tag,hidden:true,style:{},dataset:{},
  setAttribute(){},addEventListener(){},querySelector(){return null}}},
 getElementById(id){return id==="psRankExplorerCSS"?style:id==="psRankExplorer"?view:
  id==="evolutions"?{insertAdjacentElement(where,node){view=node}}:null}
};
try{
 const explorer=require("../src/main/assets/pvp_rank_explorer.js");
 const opts={kind:"class",name:"Sableye",league:"gl",iv:"0/15/12",rank:14};
 assert.equal(explorer.toggle(opts),true);assert.equal(view.hidden,false);
 assert.equal(explorer.toggle(opts),true);assert.equal(view.hidden,true,
  "tapping GL IV rank again closes the existing explorer");
 assert.equal(explorer.toggle(opts),true);assert.equal(view.hidden,false,
  "tapping a third time reopens the same explorer");
 const other={kind:"overall",name:"Sableye",league:"gl",rank:37};
 assert.equal(explorer.toggle(other),true);assert.equal(view.hidden,false,
  "switching from IV rank to overall keeps the explorer open");
 assert.equal(explorer.toggle(other),true);assert.equal(view.hidden,true);
}finally{global.window=previousWindow;global.document=previousDocument;}
console.log("LT252: rank explorer tap toggles open/closed, species analysis toggles and switches PASS");

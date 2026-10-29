"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const html=fs.readFileSync(path.join(__dirname,"../src/main/assets/detail.html"),"utf8");
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,"detail script present");
new vm.Script(script);
const begin=script.indexOf("function updateVisiblePvPRank(payload){");
const end=script.indexOf("window.showEvolutionDetails=payload=>",begin);
assert.ok(begin>=0&&end>begin,"only a verified projected rank is promoted");
const rankLine={hidden:true,title:"",textContent:""};
const document={getElementById(id){
 assert.equal(id,"rankLine");return rankLine;
}};
const hook=league=>new Function("document","activeRankLeague",
 script.slice(begin,end)+"return updateVisiblePvPRank;")(document,league);
const totodile={
 name:"Totodile",sourceIndex:0,iv:"0/11/13",cp:"476",
 leagues:[
  {league:"gl",own:{rank:421},evolutions:[
   {name:"Croconaw",rank:43,eligible:true},
   {name:"Feraligatr",rank:1,eligible:true}]},
  {league:"ul",own:{rank:120},evolutions:[]},
  {league:"ml",own:{rank:3},evolutions:[]}
 ]
};
assert.equal(hook("gl")(totodile),true);
assert.equal(rankLine.hidden,false,"show badge even while full analysis is collapsed");
assert.equal(rankLine.textContent,"GL · Rank Classe: #1 · ↳ Feraligatr");
assert.ok(rankLine.title.includes("Feraligatr")&&rankLine.title.includes("Grande Liga"));
rankLine.hidden=true;
assert.equal(hook("ul")(totodile),true);
assert.equal(rankLine.textContent,"UL · Rank Classe: #120","use currently searched league, not another league's #1");
rankLine.hidden=true;
assert.equal(hook("raw")(totodile),false);
assert.equal(rankLine.hidden,true,"non-PvP mode must not reuse rank badge");
rankLine.hidden=true;
assert.equal(hook("gl")({...totodile,leagues:[
 {league:"gl",own:null,evolutions:[{name:"Feraligatr",rank:1,eligible:false}]},
 {league:"ul",own:null,evolutions:[]},{league:"ml",own:null,evolutions:[]}
]}),false,"not-eligible evolution cannot become best candidate");
assert.equal(rankLine.hidden,true);
rankLine.hidden=true;
assert.equal(hook("gl")({...totodile,rankLimit:1,leagues:[
 {league:"gl",own:null,evolutions:[]},
 {league:"ul",own:null,evolutions:[]},{league:"ml",own:null,evolutions:[]}
]}),false,"Top 1 search threshold alone does not create a Pokémon rank");
assert.equal(rankLine.hidden,true);
assert.ok(script.includes('activeRankLeague=mode==="gl"||mode==="ul"?mode:"";'),
 "card mode records league from confirmed results");
assert.ok(script.includes("updateVisiblePvPRank(payload);"),
 "native PvP projection also populates compact summary");
assert.ok(html.includes('id="rankLine" class="rankLineSafe" hidden'),
 "compact summary has ellipsis protection");
console.log("LT163 visible PvP Rank Classe, source league, evolution identity and threshold isolation PASS");

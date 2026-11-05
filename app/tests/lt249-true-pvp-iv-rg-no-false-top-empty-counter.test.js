"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const base=path.join(__dirname,"../src/main/assets");
const html=fs.readFileSync(path.join(base,"detail.html"),"utf8");
const dock=fs.readFileSync(path.join(base,"dock.html"),"utf8");
for(const script of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
 new vm.Script(script[1]);
for(const script of dock.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
 new vm.Script(script[1]);
const js=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const a=js.indexOf("function closePvpRankAlternates(){");
const b=js.indexOf("window.showEvolutionDetails=payload=>",a);
assert.ok(a>0&&b>a);
const el=tag=>({
 tag,textContent:"",children:[],className:"",dataset:{},attrs:{},hidden:true,title:"",
 setAttribute(k,v){this.attrs[k]=String(v)},
 appendChild(x){this.children.push(x);this.textContent+=x.textContent||"";},
 replaceChildren(){this.children=[];this.textContent="";},
 querySelector(sel){return this.children.find(x=>sel===".psRankMore"&&x.className==="psRankMore")||null}
});
const rank=el("div"),alt=el("div");
const document={getElementById(id){
 if(id==="rankLine")return rank;if(id==="psRankAlternates")return alt;
 throw Error("Unexpected DOM "+id);
},createElement:el};
const events=[];
const fn=new Function("document","window","activeRankLeague",
 "currentRankSpecies","openPvpRankExplorer","renderRankOneMoves","resizeEvolutionPanel",
 js.slice(a,b)+"return updateVisiblePvPRank;")(
 document,{},"gl","Machop",(e,x)=>{events.push(x.dataset);return true},()=>{},()=>{});
const payload={
 name:"Machop",searchLeague:"gl",searchRankLimit:1,
 includePreviousEvolutions:true,
 leagues:[
  {league:"gl",own:{rank:611,overallRank:513,eligible:true},
   evolutions:[{name:"Machoke",rank:2,overallRank:500,eligible:true,
     cp:1498,level:28},{name:"Machamp",rank:196,overallRank:253,eligible:true,
     cp:1477,level:18}]},
  {league:"ul",own:{rank:611,overallRank:513},evolutions:[]},
  {league:"ml",own:{rank:611,overallRank:513},evolutions:[]}
 ]
};
assert.equal(fn(payload),true);
const view=rank.children.map(x=>x.textContent);
assert.deepEqual(view,["🔵 GL IV #2","↳ Machoke","RG #500"],
 "Top 1 filter is not evidence of a Top 1 IV: show verified nearest rank");
assert.equal(rank.dataset.topVerified,"false");
assert.ok(rank.title.includes("NENHUM IV Top #1 confirmado"));
assert.ok(!rank.textContent.includes("Top #1"),"never display a false #1");
assert.ok(!rank.textContent.includes("Machop #611"),"don't mix source filter with own class");
rank.children[0].onclick({});
rank.children[2].onclick({});
assert.deepEqual(events.map(e=>[e.psKind,e.psName,e.psRank]),[
 ["class","Machoke","2"],["overall","Machoke","500"]]);
const local={...payload,searchRankLimit:2};
assert.equal(fn(local),true);
assert.equal(rank.dataset.topVerified,"true");
assert.equal(rank.children[0].textContent,"🔵 GL IV #2");
const normal={...payload,searchRankLimit:1,leagues:[
 {...payload.leagues[0],evolutions:[
  {...payload.leagues[0].evolutions[0],rank:1},
  payload.leagues[0].evolutions[1]]},payload.leagues[1],payload.leagues[2]
]};
assert.equal(fn(normal),true);
assert.equal(rank.children[0].textContent,"🔵 GL IV #1");
assert.equal(rank.dataset.topVerified,"true");
const none={...payload,includePreviousEvolutions:false};
assert.equal(fn(none),true);
assert.equal(rank.children[0].textContent,"🔵 GL IV #611");
assert.equal(rank.children[1].textContent,"Atual");
assert.equal(rank.children[2].textContent,"RG #513");
assert.ok(rank.title.includes("NENHUM IV Top #1 confirmado"));
assert.ok(dock.includes('empty.style.display=cards.length||resultWindow?"none":"block"'),
 "independent results windows have no detached empty row");
assert.ok(dock.includes('body.result-window #empty{display:none!important'),
 "empty notice is not a second row under standalone Pokébola");
assert.ok(dock.includes('count.textContent=showCount?String(cards.length):""'),
 "explicitly enabled counter can still show 0 inside the Pokébola icon");
console.log("LT249 PASS: Machop GL Top #1 mismatch shows Machoke IV #2 RG #500, no phantom '0', P1/P2");

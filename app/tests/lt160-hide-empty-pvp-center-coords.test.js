"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const html=fs.readFileSync(path.join(__dirname,"../src/main/assets/detail.html"),"utf8");
const match=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match,"detail HTML must have inline script");
const js=match[1];
new vm.Script(js);
assert.ok(!html.includes("Análise PvP · Sem dados"),"Never render Sem dados tab");
assert.ok(!html.includes("Ranking indisponível para esta forma."),"Never show empty rank placeholder");
assert.ok(!html.includes("IV não informado · Rank Classe indisponível."),"Never show IV placeholder tab");
assert.ok(html.includes('#coordRow #coords:not(.hasCoords){padding-left:25px;padding-right:25px;text-align:center}'),
 "Get Coordinates stays centered");
assert.ok(html.includes('#coordRow #coords.hasCoords{padding-left:36px;padding-right:36px;box-sizing:border-box;text-align:center}'),
 "revealed coordinates have symmetric content insets");
assert.ok(html.includes("right:9px;"),"quota remains separately pinned to right edge");
assert.ok(js.includes('String(currentCoords).trim().replace(";",", ")'),"full copied coords retained");
assert.ok(js.includes("Native.copyCoords(currentCoords);return;"),"tap to recopy stays functional");
const start=js.indexOf("window.showEvolutionDetails=payload=>");
const end=js.indexOf("const item=(k,v)=>",start);
assert.ok(start>0&&end>start,"PvP UI bridge boundaries");
const elements={};
const node=id=>elements[id]||(elements[id]={
 hidden:true,innerHTML:"",textContent:"",scrollTop:0,scrollHeight:150,
 clientHeight:150,setAttribute(n,v){this[n]=v;}
});
let resizes=0;
const window={};
const handler=new Function("window","document","evoIdentity","detailIdentity",
 "evolutionRow","resizeEvolutionPanel","requestAnimationFrame","evolutionExpanded","updateVisiblePvPRank",
 js.slice(start,end)+"return window.showEvolutionDetails;"
)(window,{getElementById:node},p=>p.id,"zubat-41",x=>x?.rank?'<div>Verified rank</div>':"",
 ()=>{resizes++;},fn=>fn(),false,()=>false);
const empty={id:"zubat-41",leagues:["gl","ul","ml"].map(league=>
 ({league,own:null,evolutions:[]}))};
assert.equal(handler(empty),false,"empty analysis must not appear");
assert.equal(node("evolutions").hidden,true);
assert.equal(node("evoBody").hidden,true);
assert.equal(node("evoBody").innerHTML,"");
assert.equal(node("evoToggle")["aria-expanded"],"false");
assert.ok(resizes>0,"height must shrink after hiding tab");
const verified={id:"zubat-41",leagues:[
 {league:"gl",own:{rank:7},evolutions:[]},
 {league:"ul",own:null,evolutions:[]},
 {league:"ml",own:null,evolutions:[]}]};
assert.equal(handler(verified),true,"a real rank still renders normally");
assert.equal(node("evolutions").hidden,false,"verified rows are visible");
assert.ok(node("evoBody").innerHTML.includes("Verified rank"));
assert.equal(handler({...empty,id:"different-pokemon"}),false,"stale payload ignored");
assert.equal(node("evolutions").hidden,false,"stale callback cannot clear a valid result");
assert.equal(handler(empty),false,"empty updated payload hides prior rank");
assert.equal(node("evolutions").hidden,true);
assert.equal(node("evoBody").innerHTML,"");
console.log("LT160 empty PvP tab hidden, valid ranks preserved, stale payload ignored, revealed coordinates centered PASS");

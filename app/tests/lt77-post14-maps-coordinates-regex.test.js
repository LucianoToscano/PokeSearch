"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const probe=fs.readFileSync(path.join(__dirname,"../src/main/assets/probe.js"),"utf8");
const marker='if(action.startsWith("readCoords:")){';
const endMarker='// PL-04: resolve the actual Coords form';
const start=probe.indexOf(marker),end=probe.indexOf(endMarker,start);
assert.ok(start>=0&&end>start,"Real readCoords action exists");
const actionSource=probe.slice(start,end);
new vm.Script("(function(){"+actionSource+"})()",{filename:"probe.js/readCoords"});
const query={index:0,name:"Caterpie",cp:"274",number:"#010",location:"Kathleen, Florida, United States"};
let checks=0;
function check(title,run){run();checks++;console.log("PASS LT77 MAPS "+title);}
function runRead({href="",location="",target=true,button=true}={}){
 const entry={getAttribute:(key)=>key==="href"?href:null};
 const controls=button?[entry]:[];
 const ctx={
  action:"readCoords:"+JSON.stringify(query),
  matchingCoordsCard:()=>target?{node:{}}:null,
  coordsRevealLimit:()=>null, // simulated site has no provider restriction
  cardCoordsControls:()=>controls,
  text:()=> "Open in Maps",
  nextLabelValue:()=>location,
  JSON
 };
 const raw=vm.runInNewContext("(function(){"+actionSource+"})()",ctx);
 return JSON.parse(raw);
}
check("original probe regex uses real digit classes in literal syntax",()=>{
 assert.ok(actionSource.includes("const latlong=/(-?\\d{1,2}"));
 assert.ok(!actionSource.includes("const latlong=/(-?\\\\d{1,2}"));
});
check("extracts real Maps link coordinates from selected card",()=>{
 const r=runRead({href:"https://www.google.com/maps/search/?api=1&query=28.172156,-81.9459"});
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.coords,"28.172156,-81.9459");
});
check("negative latitude and longitude remain valid",()=>{
 const r=runRead({href:"https://www.google.com/maps?q=-23.550520,-46.633308"});
 assert.equal(r.coords,"-23.550520,-46.633308");
});
check("can use selected card labeled location with coordinates",()=>{
 const r=runRead({location:"28.172156, -81.9459"});
 assert.equal(r.coords,"28.172156,-81.9459");
});
check("rejects invalid coordinate range without falling back to wrong card",()=>{
 const r=runRead({href:"https://www.google.com/maps?q=99.9,-185"});
 assert.equal(r.ok,false);
 assert.equal(r.pending,true);
});
check("cannot retrieve coordinates when selected card is missing",()=>{
 const r=runRead({target:false,href:"https://www.google.com/maps?q=28.17,-81.95"});
 assert.equal(r.ok,false);
 assert.equal(r.pending,true);
 assert.match(r.status,/Aguardando reidentificação/);
});
check("must wait for scoped Open in Maps control, no page-wide search",()=>{
 const r=runRead({button:false});
 assert.equal(r.ok,false);
 assert.equal(r.pending,true);
 assert.ok(!actionSource.includes("document.querySelector("));
});
console.log("LT77 MAPS "+checks+"/"+checks+" PASS");

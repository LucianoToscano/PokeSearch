"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main");
const detail=fs.readFileSync(path.join(root,"assets/detail.html"),"utf8");
const service=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const probe=fs.readFileSync(path.join(root,"assets/probe.js"),"utf8");
let pass=0;function check(label,fn){fn();pass++;console.log("PASS LT77 Stage5 "+label)}
check("detail inline JS parses",()=>{for(const match of detail.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1])});
check("tap zone remains ≥36px and native Get coords once per tap",()=>{
 assert.ok(detail.includes('#coords{min-height:30px;touch-action:manipulation'));
 assert.ok(detail.includes('#coordRow{display:grid;grid-template-columns:minmax(0,1fr) auto'));
 assert.ok(detail.includes('if(coordsPending||!Number.isInteger(currentIndex)||currentIndex<0)return;'));
 assert.ok(detail.includes('Native.coords(currentIndex)'));
});
check("pending state exits on timeout, callback and detail switch",()=>{
 assert.ok(detail.includes('coordsPending=false;'));
 assert.ok(detail.includes('coordsRequestSeq++;'));
 assert.ok(detail.includes('window.coordsResult=function(coords,message)'));
 assert.ok(detail.includes('if(seq!==coordsRequestSeq||!coordsPending)return;'));
});
check("native callbacks invalidated for changed/hidden details",()=>{
 assert.ok(service.includes('if(selected!=index){coordinateRequestToken++;detailManuallyPositioned=false;}'));
 assert.ok(service.includes('coordinateRequestToken++; // Invalidates pending site callbacks after dismiss.'));
 assert.ok(service.includes('requestToken!=coordinateRequestToken'));
});
check("bounded React wait without repeated site clicks",()=>{
 assert.ok(service.includes('attempt<9'));
 assert.ok(service.includes('},750L);'));
 assert.ok(service.includes('execute("readCoords:"+query.toString(),result->'));
 assert.ok(probe.includes('btn.disabled||btn.getAttribute("aria-disabled")==="true"'));
 assert.ok(probe.includes('btn.click()'));
});
check("site cooldown remains actionable after it ends",()=>{
 assert.ok(probe.includes('cooldown:true'));
 assert.ok(service.includes('deliverCoords("",why);return;'));
 assert.ok(detail.includes('fetch.disabled=coordsPending;'));
 assert.ok(detail.includes('coordsPending=false;'));
});
check("coords remain scoped to one card and validated",()=>{
 assert.ok(probe.includes('if(matches.length!==1)return null;'));
 assert.ok(probe.includes('return name&&cp&&number&&location?card:null;'));
 assert.ok(service.includes('currentCoordinateTarget(target)'));
 assert.ok(service.includes('extractCoordinates(result.optString("coords",""))'));
 assert.ok(service.includes('String.format(java.util.Locale.US,"%s,%s"'));
});
console.log("LT77 Stage5 "+pass+"/"+pass+" PASS");

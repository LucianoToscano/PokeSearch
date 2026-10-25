"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../src/main");
const dock=fs.readFileSync(path.join(root,"assets/dock.html"),"utf8");
const service=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const probe=fs.readFileSync(path.join(root,"assets/probe.js"),"utf8");
let pass=0;function check(name,fn){fn();pass++;console.log("PASS LT77 Stage7 "+name);}
check("Distance sort requires verified radius in UI",()=>{
 assert.ok(dock.includes('modeDraft.sortBy==="Distance (nearest)"&&!(locationEnabled&&locationVerified)'));
 // LT109: stale Distance sort MUST NOT block Tamanho/Sexo/PC. The
 // explicit Distance option shows contextual location feedback instead.
 assert.ok(dock.includes('if(Native.filterDistanceNotice)Native.filterDistanceNotice();'));
 assert.ok(dock.includes('modeDraft.sortBy="Despawn (longest)"'));
 assert.ok(!dock.includes('indicator.textContent="📍 Ordenar por distância exige localização confirmada no site."'));
});
check("all official size choices retained as multiple",()=>{
 assert.ok(dock.includes('["XXS","XS","S","M","L","XL","XXL"]'));
 assert.ok(probe.includes('extraMulti("size",wanted,action)'));
});
check("CP/Level updates remain atomic and bounded",()=>{
 assert.ok(dock.includes('Number(low)>Number(high)'));
 assert.ok(service.includes('for(String[] pair:new String[][]{{"cpMin","cpMax"},{"levelMin","levelMax"}})'));
 assert.ok(dock.includes('levelMin:[1,50]'));
});
check("Weather and sorting require verified site controls",()=>{
 assert.ok(probe.includes('const EXTRA_LABELS={sortBy:"Sort by"'));
 assert.ok(probe.includes('extraMatches(key,want)'));
 assert.ok(probe.includes('extraSelect(key,want)'));
 assert.ok(dock.includes('option("weather","Clima")'));
});
check("location never clears filters from Native",()=>{
 assert.ok(service.includes('configureLocationAndVerify(generation,manual,0)'));
 assert.ok(service.includes('execute("verifyLocation:"+data'));
 assert.ok(service.includes('OverlayService.this.refresh(true);'));
});
check("geo badge only confirmed when evidence",()=>{
 assert.ok(dock.includes('const geoConfirmed=locationEnabled&&locationVerified;'));
 assert.ok(dock.includes('geoControl.classList.toggle("locPending",locationEnabled&&!locationVerified)'));
});
console.log("LT77 Stage7 "+pass+"/"+pass+" PASS");

"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const base=path.join(__dirname,"../src/main");
const read=p=>fs.readFileSync(path.join(base,p),"utf8");
const api=require("../src/main/assets/api_result_contract.js");
const dock=read("assets/dock.html"),service=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
let passed=0;function test(name,fn){fn();passed++;console.log("PASS LT108 FILTER "+name);}
const common={mode:"raw",attack:0,defense:0,stamina:0,sortBy:"Despawn (longest)",locationEnabled:false,
  locationCoords:"",locationRadius:0,shiny:false};
function payload(config){const r=api.buildPayload({...common,...config});assert.equal(r.ok,true,JSON.stringify(r));return r.payload;}
test("size multi-select produces exact API sizes with no geographic requirements",()=>{
 const x=payload({sizeSelections:["XXS","XS","M","XXL"]});
 assert.deepEqual(x.sizes,["XXS","XS","M","XXL"]);
 assert.equal(x.center_lat,null);assert.equal(x.center_lng,null);assert.equal(x.radius_km,null);
 assert.equal(x.sort,"DSP");
});
test("gender filter works for all three options without location",()=>{
 for(const g of ["Male","Female","Genderless"]){
  const x=payload({genderSelections:[g]});
  assert.equal(x.gender,g);
  assert.equal(x.center_lat,null);
 }
 assert.equal(payload({genderSelections:[]}).gender,null);
});
test("CP, Level, Weather, Shiny and Size can be composed without affecting coords",()=>{
 const x=payload({cpMin:"200",cpMax:"3200",levelMin:"5",levelMax:"35",
   weather:"Rainy",genderSelections:["Female"],sizeSelections:["S","L"],shiny:true});
 assert.equal(x.cp_min,200);assert.equal(x.cp_max,3200);
 assert.equal(x.level_min,5);assert.equal(x.level_max,35);
 assert.equal(x.weather_id,2);
 assert.deepEqual(x.sizes,["S","L"]);
 assert.equal(x.gender,"Female");assert.equal(x.shiny_only,true);
 assert.equal(x.center_lat,null);
});
test("distance sorting alone requires coordinates but no other filters do",()=>{
 const rejected=api.buildPayload({...common,sortBy:"Distance (nearest)",sizeSelections:["M"]});
 assert.equal(rejected.ok,false);
 assert.equal(payload({sortBy:"CP (highest)",sizeSelections:["M"]}).sort,"CP");
 const x=payload({sortBy:"Distance (nearest)",locationEnabled:true,
   locationCoords:"-5.8123, -35.2081",locationRadius:15});
 assert.equal(x.sort,"DISTANCE");assert.equal(x.center_lat,-5.8123);assert.equal(x.radius_km,15);
});
test("cascade only warns about location when Distance is chosen, never rejects other applies",()=>{
 assert.match(dock,/key==="sortBy"&&value==="Distance \(nearest\)"/);
 const filterMenu=dock.split("function renderFiltersChoices(){")[1].split("function renderInfoChoices(){")[0];
 const apply=filterMenu.split("apply.onclick=()=>{")[1].split("clear.onclick=",1)[0];
 assert.match(apply,/modeDraft.sortBy="Despawn \(longest\)"/);
 assert.ok(!apply.includes('indicator.textContent="📍 Ordenar por distância'));
 assert.match(apply,/Native.patchSearchFilters\(JSON.stringify\(delta\)\)/);
 assert.match(dock,/Native.filterDistanceNotice/);
});
test("native patch preserves the requested sizes/sex, silently stale-geo-safe and refreshes",()=>{
 const native=service.split("@JavascriptInterface public void patchSearchFilters(")[1].split("@JavascriptInterface public void setPokemonSelections(",1)[0];
 for(const key of ["sizeSelections","genderSelections","cpMin","cpMax","levelMin","levelMax","weather","sortBy"])
  assert.ok(native.includes('"'+key+'"'),key);
 assert.match(native,/if\("Distance \(nearest\)"\.equals\(updated\.optString\("sortBy"\)\)/);
 assert.match(native,/updated.put\("sortBy","Despawn \(longest\)"\)/);
 assert.match(native,/updated.put\(key,cleaned\)/);
 assert.match(native,/\.putString\("extraFiltersJson",serialized\)/);
 assert.match(native,/scheduleFilterChangeRefresh\(\)/);
});
console.log("LT108 FILTER APPLICATION "+passed+"/"+passed+" PASS");

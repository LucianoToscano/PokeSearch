"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const assets=path.join(__dirname,"../src/main/assets");
const dock=fs.readFileSync(path.join(assets,"dock.html"),"utf8");
const api=require("../src/main/assets/api_result_contract.js");
const start=dock.indexOf("const FILTER_DISPLAY_LABELS=Object.freeze({");
const end=dock.indexOf("/* LT62-FILTER-INLINE-CONFIRM-02:",start);
assert.ok(start>=0&&end>start);
const display=new Function(dock.slice(start,end)+"return filterDisplayLabel;")();
const labels=[
 ["Despawn (longest)","Tempo restante (maior)","DSP"],
 ["CP (highest)","PC (maior)","CP"],
 ["IV % (highest)","IV % (maior)","IV"],
 ["Level (highest)","Nível (maior)","LEVEL"],
 ["Distance (nearest)","Distância (mais perto)","DISTANCE"]
];
for(const [value,label,sort] of labels){
 assert.equal(display("sortBy",value),label);
 const input={mode:"raw",attack:0,defense:0,stamina:0,sortBy:value,
  locationEnabled:sort==="DISTANCE",locationCoords:sort==="DISTANCE"?"-5.79,-35.21":"",radiusKm:sort==="DISTANCE"?25:undefined};
 // Location parsing varies between installations; all non-geo sorts
 // must map to their original provider sort enum without translation.
 if(sort!=="DISTANCE"){
  const payload=api.buildPayload(input);
  assert.equal(payload.ok,true,JSON.stringify({value,payload}));
  assert.equal(payload.payload.sort,sort);
 }
}
assert.ok(dock.includes('const button=make("button","extraOptionItem",filterDisplayLabel(key,value));'),
 "Main sort panel must use translated UI labels");
assert.ok(dock.includes('btn.textContent=(modeDraft[key]===value?"✓ ":"")+filterDisplayLabel(key,value);'),
 "Secondary sort popup must use translated UI labels");
assert.ok(dock.includes('const SITE_SINGLE_CHOICES=Object.freeze({'),
 "Original provider sort enum remains independent of the display");
assert.equal(api.buildPayload({mode:"raw",attack:0,defense:0,stamina:0,
 sortBy:"CP (lowest)"}).ok,false,
 "Never fabricate global ascending sort support not available in provider");
const bounded=api.buildPayload({mode:"raw",attack:0,defense:0,stamina:0,
 sortBy:"CP (highest)",cpMax:"500",levelMax:"10"});
assert.equal(bounded.ok,true);
assert.equal(bounded.payload.cp_max,500);
assert.equal(bounded.payload.level_max,10);
const pct=api.buildPayload({mode:"percent",sortBy:"IV % (highest)",
 percentMin:0,percentMax:20});
assert.equal(pct.ok,true);
assert.equal(pct.payload.iv_percent_min,0);
assert.equal(pct.payload.iv_percent_max,20);
console.log("LT277 PT-BR sort display + provider-safe wire enums + low-value max filters PASS");

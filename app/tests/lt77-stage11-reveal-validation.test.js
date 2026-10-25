"use strict";
const assert=require("node:assert/strict");
const api=require("../src/main/assets/api_reveal_contract.js");
const source=require("node:fs").readFileSync(require("node:path").join(__dirname,"../src/main/assets/api_reveal_contract.js"),"utf8");
let pass=0;function check(name,fn){fn();pass++;console.log("PASS LT77 Stage11 "+name);}
const expected={expectedPokemonId:25};
check("lat/lng and coords agree",()=>{
 const x=api.normalizeRevealResponse({lat:-23.5505,lng:-46.6333,coords:"-23.5505,-46.6333"},expected);
 assert.equal(x.ok,true);assert.equal(x.coords,"-23.5505,-46.6333");
});
check("coords-only response is accepted when valid",()=>{
 const x=api.normalizeRevealResponse({coords:"0,0"},expected);
 assert.equal(x.ok,true);assert.equal(x.latitude,0);assert.equal(x.longitude,0);
});
check("contradictions between text and numeric fields rejected",()=>{
 for(const obj of [
  {coords:"0,0",lat:1,lng:1},{coords:"89,100",latitude:89,longitude:99},
  {coords:"-23,-45",coordinates:{latitude:-24,longitude:-45}}
 ])assert.equal(api.normalizeRevealResponse(obj,expected).ok,false);
});
check("malformed or out-of-range coords are rejected",()=>{
 for(const coords of ["100,0","0,181","nan,0","0,0 extra","0;0",{},["0,0"]]){
  assert.equal(api.normalizeRevealResponse({coords},expected).ok,false,JSON.stringify(coords));
 }
});
check("no secret fields or reveal codes ever exposed",()=>{
 const x=api.normalizeRevealResponse({coords:"0,0",lat:0,lng:0,jwt:"SENSITIVE",
  reveal_code:"VERY_SENSITIVE"},expected);
 assert.equal(x.ok,true);
 assert.ok(!JSON.stringify(x).includes("SENSITIVE"));
 assert.ok(!/localStorage|XMLHttpRequest|Authorization|fetch\(/.test(source));
});
check("reveal requires live spawn and opaque code",()=>{
 assert.equal(api.planForSpawn({pokemon_id:25,despawn_at:"2000-01-01T00:00:00Z",reveal_code:"SYNTHETIC_12345"},{nowMs:Date.now()}).ok,false);
 assert.equal(api.planForSpawn({pokemon_id:25,despawn_at:"2099-01-01T00:00:00Z",reveal_code:"bad"},{nowMs:Date.now()}).ok,false);
});
console.log("LT77 Stage11 "+pass+"/"+pass+" PASS");

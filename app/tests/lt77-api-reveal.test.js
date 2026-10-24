"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const reveal=require("../src/main/assets/api_reveal_contract.js");
const source=fs.readFileSync(path.join(__dirname,"../src/main/assets/api_reveal_contract.js"),"utf8");
let checked=0;
function check(label,fn){fn();checked++;console.log("PASS LT77 REVEAL "+label);}
function example(override={}){
 return {pokemon_id:821,despawn_at:"2099-10-24T21:26:04Z",
   reveal_code:"syntheticCode_ONLY_1234567890",...override};
}
check("no network/token, localStorage, cookies, Android bridge or storage accesses",()=>{
 assert.ok(!/\bfetch\s*\(|XMLHttpRequest|localStorage\.|sessionStorage\.|CookieManager|evaluateJavascript|addJavascriptInterface|Authorization\s*:|Bearer\s+/i.test(source));
});
check("reveal is provisional and never production-enabled",()=>{
 assert.ok(source.includes("disabled in production"));
 assert.ok(source.includes("HYPOTHESES"));
 assert.equal(typeof reveal.planForSpawn,"function");
});
check("path is exact service host and encodes one opaque code only",()=>{
 const p=reveal.planForSpawn(example(),{nowMs:0});
 assert.equal(p.ok,true);
 assert.equal(p.method,"GET");
 assert.equal(p.url,"https://coordinates-api.pokemongopro.com/reveal/syntheticCode_ONLY_1234567890");
 assert.equal(Object.hasOwn(p,"headers"),false);
});
check("only well-formed reveal codes accepted",()=>{
 for(const invalid of [null,undefined,"","short","../admin","x/y","abc%2Fzzzzzzzzzzzz","abc?secret=1","  padded  ","a".repeat(2049)]){
  assert.equal(reveal.validCode(invalid),false,String(invalid).slice(0,30));
  assert.equal(reveal.planForSpawn(example({reveal_code:invalid}),{nowMs:0}).ok,false);
 }
 assert.equal(reveal.validCode("abcdefghiJKL_123456"),true);
});
check("no reveal for expired or unknown despawn state",()=>{
 assert.equal(reveal.planForSpawn(example({despawn_at:"2000-01-01T00:00:00Z"}),{nowMs:Date.now()}).ok,false);
 assert.equal(reveal.planForSpawn(example({despawn_at:"unknown"}),{nowMs:0}).ok,false);
});
check("no reveal for malformed pokemon identity",()=>{
 for(const bad of [0,null,"821",10001,2.5]){
  assert.equal(reveal.planForSpawn(example({pokemon_id:bad}),{nowMs:0}).ok,false);
 }
});
check("simple lat/lng numeric pair validated",()=>{
 assert.deepEqual(reveal.normalizeRevealResponse({lat:-5.12,lng:-35.21}),
  {ok:true,latitude:-5.12,longitude:-35.21,coords:"-5.12,-35.21",source:"api-reveal-unverified"});
});
check("nested latitude/longitude and zero coordinates are supported as hypotheses",()=>{
 let r=reveal.normalizeRevealResponse({coordinates:{latitude:0,longitude:0}});
 assert.equal(r.ok,true);
 assert.equal(r.coords,"0,0");
 r=reveal.normalizeRevealResponse({data:{lat:43.234,lng:-80.5}});
 assert.equal(r.ok,true);
});
check("contradictory coordinate values are rejected",()=>{
 assert.equal(reveal.normalizeRevealResponse({lat:10,lng:20,data:{lat:30,lng:40}}).ok,false);
});
check("invalid ranges, strings, booleans, arrays and absent coordinates fail closed",()=>{
 for(const payload of [null,[],{}, {lat:"10",lng:"20"}, {lat:91,lng:1},
    {lat:5,lng:-181},{lat:NaN,lng:10},{lat:true,lng:1},{coordinates:[]}]){
  assert.equal(reveal.normalizeRevealResponse(payload).ok,false);
 }
});
check("response only contains required coordinates, strips sensitive fields",()=>{
 const r=reveal.normalizeRevealResponse({
   lat:12.34,lng:56.78,jwt:"TOKEN_SHOULD_NEVER_LEAK",
   reveal_code:"TOKEN_SHOULD_NEVER_LEAK",trainer_code:"TOKEN_SHOULD_NEVER_LEAK"
 });
 assert.equal(r.ok,true);
 assert.equal(JSON.stringify(r).includes("TOKEN_SHOULD_NEVER_LEAK"),false);
 assert.equal(Object.hasOwn(r,"reveal_code"),false);
});
check("fixture parser cannot claim authenticated, verified or fresh search",()=>{
 const r=reveal.normalizeRevealResponse({lat:1,lng:2});
 assert.equal(r.source,"api-reveal-unverified");
 assert.equal(Object.hasOwn(r,"criteriaConfirmed"),false);
 assert.equal(Object.hasOwn(r,"verified"),false);
});
console.log("LT77 experimental reveal contract: "+checked+"/"+checked+" PASS");

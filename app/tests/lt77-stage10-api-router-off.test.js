"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"../src/main/assets/api_integration_router.js"),"utf8");
const router=require("../src/main/assets/api_integration_router.js");
const service=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
let count=0;async function check(name,fn){await fn();count++;console.log("PASS LT77 Stage10 "+name);}
async function suite(){
 await check("default is hard OFF and module has no credential access",()=>{
  assert.equal(router.USE_AUTHORIZED_API,false);
  assert.ok(!/localStorage|Authorization|Bearer|jwt|fetch\(/i.test(source));
 });
 await check("DOM fallback when feature flag omitted",async()=>{
  const calls=[];const r=router.createRouter({
   domSearch:async x=>{calls.push("dom");return {ok:true,source:"dom",x};},
   domReveal:async()=>({ok:true,source:"dom"}),
   siteOrigin:()=>"https://pogocoordinates.com"
  });
  assert.equal(r.source,"dom");assert.equal(r.defaultEnabled,false);
  assert.equal((await r.search({mode:"gl"})).source,"dom");
  assert.equal((await r.reveal({sourceIndex:1})).source,"dom");
  assert.deepEqual(calls,["dom"]);
 });
 await check("cannot enable without homologated and exact origin",async()=>{
  for(const [origin,homologated] of [
   ["https://pogocoordinates.com",false],["http://pogocoordinates.com",true],
   ["https://pogocoordinates.com.evil.test",true],["file:///android_asset/dock.html",true]
  ]){
   let hits=0;const r=router.createRouter({
    useAuthorizedApi:true,homologated,siteOrigin:()=>origin,
    domSearch:async()=>({ok:true,source:"dom"}),
    domReveal:async()=>({ok:true,source:"dom"}),
    apiClient:{search:async()=>{hits++;return {ok:true,source:"api"};},reveal:async()=>({ok:true})}
   });
   assert.equal(r.source,"dom");
   assert.equal((await r.search({})).source,"dom");
   assert.equal(hits,0);
  }
 });
 await check("enabled experimental route never mixes sources",async()=>{
  let api=0,dom=0,reveals=0;
  const r=router.createRouter({
   useAuthorizedApi:true,homologated:true,siteOrigin:()=>"https://pogocoordinates.com",
   domSearch:async()=>{dom++;return {ok:true}},
   domReveal:async()=>{dom++;return {ok:true}},
   apiClient:{search:async()=>{api++;return {ok:true,source:"experimental-api",cards:[],criteriaConfirmed:false};},
              reveal:async()=>{reveals++;return {ok:false,reason:"rate-limited"};}}
  });
  assert.equal(r.source,"authorized-api-experimental");
  const s=await r.search({});assert.equal(s.criteriaConfirmed,false);
  assert.equal((await r.reveal({})).reason,"rate-limited");
  assert.equal(api,1);assert.equal(reveals,1);assert.equal(dom,0);
 });
 await check("dispose prevents further API and DOM calls",async()=>{
  let api=0;const r=router.createRouter({
   useAuthorizedApi:true,homologated:true,siteOrigin:()=>"https://pogocoordinates.com",
   domSearch:async()=>({ok:true}),domReveal:async()=>({ok:true}),
   apiClient:{search:async()=>{api++;return {ok:true}},reveal:async()=>({ok:true})}
  });
  r.dispose();
  assert.equal((await r.search({})).reason,"disposed");
  assert.equal(api,0);
 });
 await check("release collector has no link to experimental router",()=>{
  assert.ok(!service.includes("api_integration_router.js"));
  assert.ok(!service.includes("PokeSearchApiRouter"));
 });
 console.log("LT77 Stage10 "+count+"/"+count+" PASS");
}
suite().catch(e=>{console.error(e);process.exitCode=1;});

"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const bridge=require("../src/main/assets/api_android_session.js");
let passed=0;
const check=async(name,fn)=>{await fn();passed++;console.log("PASS LT77 ANDROID API "+name);};
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function setup(options={}){
 const calls={search:0,reveal:0,catalog:0};
 let origin=options.origin||"https://pogocoordinates.com";
 let disposed=0;
 const transport={
  async search(config){
   calls.search++;
   if(options.fail)return {ok:false,reason:options.fail};
   return {ok:true,searchId:10,cards:[{sourceIndex:0,name:"Rattata",cp:"850",number:"#19",iv:"15/15/15"}],
    found:1,siteCount:1,rejected:0,expired:0,pvpVerified:!!options.pvpVerified};
  },
  async reveal(selection){
   calls.reveal++;
   return selection.cp===850?{ok:true,coords:"-5.123,-35.45",latitude:-5.123,longitude:-35.45}:
    {ok:false,reason:"stale-or-ambiguous-selection"};
  },
  dispose(){disposed++;}
 };
 const catalog={
  async getCatalog(){
   calls.catalog++;
   return {ok:true,forms:["Alola"],catalogSpeciesForms:[
    {pokemon_id:19,form_id:46,form_name:"Alolan Rattata",species_name:"Rattata"}]};
  },
  dispose(){disposed++;}
 };
 const session=bridge.createSession({siteOrigin:()=>origin,transport,catalog});
 return {session,calls,disposeCount:()=>disposed,setOrigin:x=>{origin=x;}};
}
async function suite(){
 await check("imports are inert and Android has explicit OFF QA flag",async()=>{
  const java=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
  const ui=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
  const collector=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/AuthorizedApiCollector.java"),"utf8");
  assert.match(java,/getBoolean\("authorizedApiQaOptIn",true\)/);
  assert.match(ui,/authorizedApiQaOptIn/);
  assert.doesNotMatch(collector,/addJavascriptInterface/);
  assert.match(java,/if\(authorizedApiQaSelected\(\)\)/);
 });
 await check("single authenticated-origin API request returns only sanitized cards",async()=>{
  const t=setup();
  assert.deepEqual(t.session.startSearch(1,{mode:"raw"}),{ok:true,pending:true});
  await flush();await flush();
  const r=t.session.take(1);
  assert.equal(r.ok,true,JSON.stringify(r));
  assert.equal(r.source,"authorized-api-qa");
  assert.equal(r.criteriaConfirmed,true);
  assert.equal(r.searchId,10);
  assert.equal(r.cards.length,1);
  assert.equal(t.calls.search,1);
  assert.equal(t.calls.catalog,0);
  assert.equal(t.session.take(1).pending,true);
 });
 await check("catalog requested only for selected official species/forms",async()=>{
  const t=setup();
  assert.equal(t.session.startSearch(1,{mode:"raw",formSelections:["Alola"]}).ok,true);
  await flush();await flush();
  assert.equal(t.session.take(1).ok,true);
  assert.equal(t.calls.catalog,1);
 });
 await check("Get coords demands current search identity, never exposes reveal code",async()=>{
  const t=setup();t.session.startSearch(1,{mode:"raw"});
  await flush();await flush();
  assert.equal(t.session.take(1).ok,true);
  assert.equal(t.session.startReveal(2,{searchId:999,sourceIndex:0,pokemonId:19,cp:850}).reason,
   "stale-or-ambiguous-selection");
  assert.equal(t.calls.reveal,0);
  assert.equal(t.session.startReveal(3,{searchId:10,sourceIndex:0,pokemonId:19,cp:850}).ok,true);
  await flush();await flush();
  const r=t.session.take(3);
  assert.deepEqual(r,{ok:true,coords:"-5.123,-35.45",latitude:-5.123,longitude:-35.45,
   source:"authorized-api-qa"});
  assert.ok(!JSON.stringify(r).includes("reveal_code"));
 });
 await check("HTTP errors remain bounded, no implicit DOM/API fallbacks",async()=>{
  const t=setup({fail:"rate-limited"});
  t.session.startSearch(1,{mode:"raw"});
  await flush();await flush();
  assert.deepEqual(t.session.take(1),{ok:false,reason:"rate-limited"});
 });
 await check("PvP requires per-card verified ranks",async()=>{
  const t=setup({pvpVerified:false});
  t.session.startSearch(1,{mode:"gl",glRank:10});
  await flush();await flush();
  assert.deepEqual(t.session.take(1),{ok:false,reason:"pvp-unverified"});
  const ok=setup({pvpVerified:true});
  ok.session.startSearch(1,{mode:"gl",glRank:10});
  await flush();await flush();
  assert.equal(ok.session.take(1).leagueConfirmed,true);
 });
 await check("origin swap and dispose fail closed",async()=>{
  const t=setup({origin:"https://not-allowed.example"});
  assert.equal(t.session.startSearch(1,{mode:"raw"}).reason,"invalid-request");
  assert.equal(t.calls.search,0);
  t.setOrigin("https://pogocoordinates.com");
  assert.equal(t.session.startSearch(1,{mode:"raw"}).ok,true);
  t.session.dispose();
  assert.equal(t.session.take(1).reason,"invalid-origin");
  assert.equal(t.disposeCount(),2);
 });
 console.log("LT77 Android API QA: "+passed+"/"+passed+" PASS");
}
suite().catch(e=>{console.error(e);process.exitCode=1;});

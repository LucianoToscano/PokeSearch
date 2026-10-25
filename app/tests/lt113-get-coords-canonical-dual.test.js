"use strict";
const assert=require("node:assert/strict");
const transport=require("../src/main/assets/api_browser_transport.js");
const contract=require("../src/main/assets/api_result_contract.js");
const revealContract=require("../src/main/assets/api_reveal_contract.js");
const NOW=Date.UTC(2026,9,25,20,10,0);
const CODE="opaqueRevealCode_Valid_12345";
const FILTER_100={mode:"raw",attack:15,defense:15,stamina:15};
const FILTER_0={mode:"raw",attack:0,defense:0,stamina:0};
const http=(body)=>({status:200,headers:{get:()=>null},text:async()=>JSON.stringify(body)});
function encounter(cp="1538",iv="15/15/15"){
 return {pokemon_id:531,pokemon_name:"Audino",encounter_id:"audino-verified-531",
 cp,level:34,raw_iv:iv,iv_percent:iv==="15/15/15"?100:0,
 location:"Zürich, Switzerland",form:"AUDINO_NORMAL",gender:"Female",
 despawn_at:"2099-10-25T21:00:00Z",reveal_code:CODE,shiny:true};
}
function make(cp,iv){
 const calls=[];
 const clock={value:NOW};
 const client=transport.createClient({
  now:()=>clock.value,siteOrigin:()=>"https://pogocoordinates.com",
  storage:{getItem:()=>null},apiContract:contract,revealContract,
  fetchImpl:async (url,req)=>{
   calls.push({url,method:req.method});
   return req.method==="POST"?http({results:[encounter(cp,iv)],cap:10}):
     http({lat:47.36,lng:8.55});
  }
 });
 return {client,calls,clock};
}
let count=0;
async function check(title,fn){await fn();count++;console.log("PASS LT113 COORDS "+title);}
async function run(){
 await check("both independent 100%/0% overlay transports reveal string CP 1538",async()=>{
  for(const [cp,iv,mode] of [["1538","15/15/15",FILTER_100],["1538","0/0/0",FILTER_0]]){
   const s=make(cp,iv);
   const search=await s.client.search(mode);
   assert.equal(search.ok,true);
   assert.equal(search.cards.length,1);
   assert.equal(search.cards[0].cp,"1538");
   const coords=await s.client.reveal({
    sourceIndex:search.cards[0].sourceIndex,searchId:search.searchId,
    pokemonId:531,cp:1538
   });
   assert.equal(coords.ok,true,JSON.stringify(coords));
   assert.equal(coords.coords,"47.36,8.55");
   assert.deepEqual(s.calls.map(x=>x.method),["POST","GET"]);
   assert.equal(JSON.stringify(search).includes(CODE),false);
   s.client.dispose();
  }
 });
 await check("numeric CP and same encounter work without losing identity",async()=>{
  const s=make(1538,"15/15/15"),q=await s.client.search(FILTER_100);
  assert.equal((await s.client.reveal({sourceIndex:0,searchId:q.searchId,pokemonId:531,cp:1538})).ok,true);
  s.client.dispose();
 });
 await check("wrong species, wrong CP and wrong sourceIndex never request reveal",async()=>{
  const s=make("1538","15/15/15"),q=await s.client.search(FILTER_100);
  for(const bad of [{pokemonId:532,cp:1538,sourceIndex:0},
    {pokemonId:531,cp:1539,sourceIndex:0},
    {pokemonId:531,cp:1538,sourceIndex:1},
    {pokemonId:531,cp:"1538.0",sourceIndex:0},
    {pokemonId:531,cp:true,sourceIndex:0}]){
   const response=await s.client.reveal({searchId:q.searchId,...bad});
   assert.equal(response.reason,"stale-or-ambiguous-selection");
  }
  assert.equal(s.calls.length,1,"must not reveal any other spawn");
  s.client.dispose();
 });
 await check("new search invalidates old reveal, even when card index/CP coincide",async()=>{
  const s=make("1538","15/15/15"),q=await s.client.search(FILTER_100);
  const q2=await s.client.search(FILTER_100);
  assert.notEqual(q.searchId,q2.searchId);
  const outdated=await s.client.reveal({
   sourceIndex:0,searchId:q.searchId,pokemonId:531,cp:1538
  });
  assert.equal(outdated.reason,"stale-or-ambiguous-selection");
  assert.equal(s.calls.length,2);
  assert.equal((await s.client.reveal({
   sourceIndex:0,searchId:q2.searchId,pokemonId:531,cp:1538
  })).ok,true);
  s.client.dispose();
 });
 await check("ambiguous server CP representation never releases coordinates",async()=>{
  for(const value of ["01538","1538.0","1.538e3"]){
   const s=make(value,"15/15/15"),q=await s.client.search(FILTER_100);
   assert.equal(q.ok,true);
   assert.equal((await s.client.reveal({
    sourceIndex:0,searchId:q.searchId,pokemonId:531,cp:1538
   })).reason,"stale-or-ambiguous-selection");
   assert.equal(s.calls.length,1);
   s.client.dispose();
  }
 });
 const java=require("node:fs").readFileSync(require("node:path").join(
  __dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
 await check("same native Get coords error handling inherited by both services",()=>{
  assert.match(java,/Pesquisa atualizada\. Abra o Pokémon na lista atual e tente novamente\./);
  assert.match(java,/selection\.put\("sourceIndex",target\.optInt\("sourceIndex",-1\)\)/);
  assert.match(java,/currentCoordinateTarget\(target\)/);
  assert.match(java,/getSharedPreferences\(isSecondaryOverlay\(\)\?"prefs_secondary":"prefs",0\)/);
 });
 console.log("LT113 GET COORDS 100/0 DUAL "+count+"/"+count+" PASS");
}
run().catch(e=>{console.error(e);process.exitCode=1;});

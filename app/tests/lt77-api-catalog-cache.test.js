"use strict";
const assert=require("node:assert/strict");
const catalog=require("../src/main/assets/api_catalog_cache.js");
const contract=require("../src/main/assets/api_result_contract.js");
let checks=0;
function check(name,fn){return Promise.resolve().then(fn).then(()=>{checks++;console.log("PASS LT77 CATALOG "+name);});}
function reply(body,status=200){return {status,headers:{get:()=>null},text:async()=>JSON.stringify(body)};}
const officialForms=["Normal","Alola"];
const officialSpecies=[
 {pokemon_id:19,form_id:0,species_name:"Rattata",form_name:"Rattata"},
 {pokemon_id:19,form_id:46,species_name:"Rattata",form_name:"Alolan Rattata"}
];
function setup(opts={}){
 const urls=[];let now=1000;let origin=opts.origin||"https://pogocoordinates.com";
 const mock=async (url,request)=>{
  urls.push({url,request});
  if(url.endsWith("/forms"))return reply(officialForms);
  if(url.endsWith("/pokemon/catalog?costumes=true"))return reply(officialSpecies);
  throw Error("Unexpected endpoint");
 };
 return {urls,setNow:x=>{now=x;},client:catalog.createClient({
  fetchImpl:opts.fetchImpl||mock,siteOrigin:()=>origin,now:()=>now
 })};
}
async function suite(){
 await check("module import is inert and no automatic fetch",()=>{
  const a=setup();assert.equal(a.urls.length,0);
 });
 await check("official catalogs are read-only GET without Authorization",async()=>{
  const a=setup();const r=await a.client.getCatalog();
  assert.equal(r.ok,true,JSON.stringify(r));
  assert.deepEqual(r.forms,officialForms);
  assert.equal(r.catalogSpeciesForms.length,2);
  assert.equal(a.urls.length,2);
  for(const x of a.urls){
   assert.equal(x.request.method,"GET");
   assert.equal(x.request.credentials,"omit");
   assert.equal(Object.hasOwn(x.request.headers,"Authorization"),false);
  }
  const payload=contract.buildPayload({
   mode:"raw",attack:15,defense:15,stamina:15,
   catalogSpeciesForms:r.catalogSpeciesForms,catalogForms:r.forms,
   pokemonSelections:["Rattata"],formSelections:["Alola"]
  });
  assert.equal(payload.ok,true,JSON.stringify(payload));
  assert.deepEqual(payload.payload.pokemon_ids,[19]);
  assert.deepEqual(payload.payload.forms,["Alola"]);
 });
 await check("300-second memory cache, defensive copies and refresh",async()=>{
  const a=setup();const one=await a.client.getCatalog();
  one.forms.push("fabricated");one.catalogSpeciesForms[0].pokemon_id=999;
  const two=await a.client.getCatalog();
  assert.deepEqual(two.forms,officialForms);
  assert.equal(two.catalogSpeciesForms[0].pokemon_id,19);
  assert.equal(a.urls.length,2);
  a.setNow(301001);
  assert.equal((await a.client.getCatalog()).ok,true);
  assert.equal(a.urls.length,4);
 });
 await check("origin guard rejects invalid origin before calling API",async()=>{
  for(const origin of ["http://pogocoordinates.com","https://other.example",
   "https://pogocoordinates.com:8443","file:///android_asset/dock.html"]){
   const a=setup({origin});assert.equal((await a.client.getCatalog()).reason,"invalid-origin");
   assert.equal(a.urls.length,0);
  }
 });
 await check("malformed official catalogs fail closed",async()=>{
  assert.equal(catalog.validateForms(["Normal",123]),null);
  assert.equal(catalog.validateSpecies([{pokemon_id:19,form_id:"46",species_name:"Rattata"}]),null);
  const a=setup({fetchImpl:async url=>reply(url.endsWith("/forms")?["Normal"]: [{pokemon_id:"19"}])});
  assert.equal((await a.client.getCatalog()).reason,"invalid-catalog");
 });
 await check("disposed client does not fetch",async()=>{
  const a=setup();a.client.dispose();
  assert.equal((await a.client.getCatalog()).reason,"disposed");
  assert.equal(a.urls.length,0);
 });
 console.log("LT77 official catalogs: "+checks+"/"+checks+" PASS");
}
suite().catch(e=>{console.error(e);process.exitCode=1;});

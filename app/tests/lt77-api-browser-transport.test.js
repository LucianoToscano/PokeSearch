"use strict";
const assert=require("node:assert/strict");
const transport=require("../src/main/assets/api_browser_transport.js");
const api=require("../src/main/assets/api_result_contract.js");
const reveal=require("../src/main/assets/api_reveal_contract.js");
const JWT="header.payload.signature";
const NOW=Date.UTC(2026,9,24,21,0,0);
const CODE="syntheticOpaque_12345678";
let passed=0;
function check(name,fn){return Promise.resolve().then(fn).then(()=>{passed++;console.log("PASS LT77 TRANSPORT "+name);});}
function item(id=1,overrides={}) {
 return {encounter_id:String(id),pokemon_id:821,pokemon_name:"Rookidee",
   cp:438,level:23,location:"Ougrée, Liège, Belgium",
   raw_iv:"15/15/15",iv_percent:100,gender:"Male",size:"M",
   fast_move:"Air Slash",charge_move:"Payback",
   despawn_at:"2099-10-24T21:26:04Z",reveal_code:CODE,
   shiny:false,...overrides};
}
function reply(status,body){
 return {status,headers:{get:()=>null},
  text:async()=>JSON.stringify(body)};
}
function makeClient(opts={}){
 const calls=[],reads=[];
 let clock=NOW;
 const fetchImpl=opts.fetchImpl||(async (url,req)=>{
  calls.push({url,req});
  return req.method==="POST"?reply(200,{results:[item()]}):
   reply(200,{coordinates:{latitude:-5.12,longitude:-35.21}});
 });
 const client=transport.createClient({
  fetchImpl,
  storage:{getItem:(key)=>{reads.push(key);return opts.jwt===undefined?JWT:opts.jwt;}},
  now:()=>opts.now===undefined?clock:opts.now,
  siteOrigin:()=>opts.origin===undefined?"https://pogocoordinates.com":opts.origin,
  apiContract:api,revealContract:reveal
 });
 return {client,calls,reads};
}
const filter={mode:"raw",attack:15,defense:15,stamina:15};
async function suite(){
 await check("module inert: no automatic fetch or token",async()=>{
  const t=makeClient();
  assert.equal(t.calls.length,0);assert.equal(t.reads.length,0);
 });
 await check("authorized POST /search runs in site origin and never leaks JWT",async()=>{
  const t=makeClient();
  const r=await t.client.search(filter);
  assert.equal(r.ok,true);
  assert.equal(t.calls.length,1);
  assert.equal(t.calls[0].url,"https://coordinates-api.pokemongopro.com/search");
  assert.equal(t.calls[0].req.method,"POST");
  assert.equal(t.calls[0].req.headers.Authorization,"Bearer "+JWT);
  assert.equal(t.calls[0].req.credentials,"omit");
  assert.equal(t.calls[0].req.redirect,"error");
  assert.equal(t.calls[0].req.cache,"no-store");
  assert.deepEqual(t.reads,["jwt"]);
  assert.ok(!JSON.stringify(r).includes(JWT));
  assert.ok(!JSON.stringify(r).includes(CODE));
  assert.equal(r.criteriaConfirmed,false);
  assert.equal(r.resultChanged,false);
  assert.equal(r.requiresIntegrationValidation,true);
 });
 await check("explicit reveal uses ephemeral identifier and no bearer header",async()=>{
  const t=makeClient();
  const s=await t.client.search(filter);
  const r=await t.client.reveal({sourceIndex:0,searchId:s.searchId,pokemonId:821,cp:438});
  assert.equal(r.ok,true,JSON.stringify(r));
  assert.equal(r.coords,"-5.12,-35.21");
  assert.equal(t.calls.length,2);
  assert.equal(t.calls[1].url,"https://coordinates-api.pokemongopro.com/reveal/"+CODE);
  assert.equal(t.calls[1].req.method,"GET");
  assert.equal(Object.hasOwn(t.calls[1].req.headers,"Authorization"),false);
  assert.equal(t.reads.length,1);
  assert.ok(!JSON.stringify(r).includes(CODE));
 });
 await check("anonymous Search sends no JWT; reveal identity remains protected",async()=>{
  const t=makeClient({jwt:null});
  const s=await t.client.search(filter);
  assert.equal(s.ok,true);
  assert.equal(t.calls.length,1);
  assert.equal(Object.hasOwn(t.calls[0].req.headers,"Authorization"),false);
  const r=await t.client.reveal({sourceIndex:0,searchId:999,pokemonId:821,cp:438});
  assert.equal(r.reason,"stale-or-ambiguous-selection");
  assert.equal(t.calls.length,1);
 });
 await check("external or insecure origins fail before reading JWT",async()=>{
  for(const origin of ["http://pogocoordinates.com","https://evil.com",
   "https://pogocoordinates.com.evil.com","file:///android_asset/dock.html"]){
    const t=makeClient({origin});
    assert.equal((await t.client.search(filter)).reason,"invalid-origin");
    assert.equal(t.calls.length,0);
    assert.equal(t.reads.length,0);
  }
 });
 await check("invalid or unsupported filter never sends request",async()=>{
  const t=makeClient();
  assert.equal((await t.client.search({mode:"raw",attack:16,defense:15,stamina:15})).reason,"unsupported-filter");
  assert.equal((await t.client.search({...filter,formSelections:["Alola"]})).reason,"unsupported-filter");
  assert.equal(t.calls.length,0);
 });
 await check("PvP ranks require per-spawn league and rank attestation",async()=>{
  const t=makeClient({fetchImpl:async()=>reply(200,{results:[
   item(1,{pvp:{league:"great",rank:1}}),
   item(2,{pvp:{league:"ultra",rank:1}}),
   item(3,{pvp:{league:"great",rank:45}})
  ]})});
  const r=await t.client.search({mode:"gl",glRank:10});
  assert.equal(r.ok,true,JSON.stringify(r));
  assert.equal(r.cards.length,1);
  assert.equal(r.cards[0].rank,"1");
  assert.equal(r.pvpVerified,true);
 });
 await check("unverified PvP-only response fails closed",async()=>{
  const t=makeClient({fetchImpl:async()=>reply(200,{results:[item()]})});
  const r=await t.client.search({mode:"ul",ulRank:10});
  assert.deepEqual(r,{ok:false,reason:"pvp-unverified"});
 });
 await check("401 403 and 429 propagated without retries or data",async()=>{
  for(const [status,reason] of [[401,"login-required"],[403,"access-denied"],[429,"rate-limited"]]){
   let n=0;
   const t=makeClient({fetchImpl:async()=>{n++;return reply(status,{secret:"LEAK_ME"});}});
   const r=await t.client.search(filter);
   assert.deepEqual(r,{ok:false,reason});
   assert.equal(n,1);
   assert.ok(!JSON.stringify(r).includes("LEAK_ME"));
  }
 });
 await check("missing or expired reveal and validation errors are classified",async()=>{
  for(const [status,expected] of [[400,"invalid-request"],
   [404,"expired-or-missing-spawn"],[410,"expired-or-missing-spawn"],
   [422,"invalid-request"],[503,"service-unavailable"]]){
   const t=makeClient({fetchImpl:async(url,req)=>req.method==="POST"?
    reply(200,{results:[item()]}):reply(status,{detail:"unavailable"})});
   const s=await t.client.search(filter);
   const outcome=await t.client.reveal({sourceIndex:0,searchId:s.searchId,pokemonId:821,cp:438});
   assert.equal(outcome.reason,expected);
   assert.equal(t.client&&typeof t.client.search,"function");
  }
 });
 await check("documented forbidden reasons remain bounded to known codes",async()=>{
  for(const [kind,expected] of [
   ["trainer_not_linked","trainer-not-linked"],
   ["shiny_account_unavailable","shiny-account-unavailable"],
   ["vip_required","vip-required"],["unexpected","access-denied"]
  ]){
   const t=makeClient({fetchImpl:async()=>reply(403,{
    detail:{error:kind,message:"untrusted arbitrary response content"}
   })});
   const result=await t.client.search(filter);
   assert.deepEqual(result,{ok:false,reason:expected});
   assert.ok(!JSON.stringify(result).includes("untrusted"));
  }
 });
 await check("malformed JSON and oversized response rejected",async()=>{
  const a=makeClient({fetchImpl:async()=>({status:200,headers:{get:()=>null},text:async()=>"{broken"})});
  assert.equal((await a.client.search(filter)).reason,"invalid-json");
  const b=makeClient({fetchImpl:async()=>({status:200,headers:{get:()=>1048577},text:async()=>{throw Error("SHOULD_NOT_READ");}})});
  assert.equal((await b.client.search(filter)).reason,"response-too-large");
 });
 await check("network or CORS errors do not include sensitive exception text",async()=>{
  const t=makeClient({fetchImpl:async()=>{throw Error("bearer="+JWT+" "+CODE);}});
  const r=await t.client.search(filter);
  assert.deepEqual(r,{ok:false,reason:"network-or-cors-error"});
  assert.ok(!JSON.stringify(r).includes(JWT));
 });
 await check("selection identity and search generations prevent crossed coordinates",async()=>{
  const t=makeClient();const s=await t.client.search(filter);
  const req={sourceIndex:0,searchId:s.searchId,pokemonId:821,cp:438};
  assert.equal((await t.client.reveal({...req,cp:999})).reason,"stale-or-ambiguous-selection");
  assert.equal((await t.client.reveal({...req,pokemonId:25})).reason,"stale-or-ambiguous-selection");
  assert.equal((await t.client.reveal({...req,searchId:999})).reason,"stale-or-ambiguous-selection");
  await t.client.search(filter);
  assert.equal((await t.client.reveal(req)).reason,"stale-or-ambiguous-selection");
  assert.equal(t.calls.length,2);
 });
 await check("stale async Search never overwrites new generation",async()=>{
  let release;
  let first=true;
  const t=makeClient({fetchImpl:async()=> {
   if(first){first=false;return await new Promise(resolve=>{release=resolve;});}
   return reply(200,{results:[item(2)]});
  }});
  const pending=t.client.search(filter);
  const fresh=await t.client.search(filter);
  release(reply(200,{results:[item(1)]}));
  const old=await pending;
  assert.equal(old.reason,"superseded-search");
  assert.equal(fresh.ok,true);
  const coords=await t.client.reveal({sourceIndex:0,searchId:fresh.searchId,pokemonId:821,cp:438});
  // The mock returns a JSON search body for every request: no fabricated coords.
  assert.equal(coords.reason,"coordinates-unverified");
 });
 await check("dispose stops new search and reveal",async()=>{
  const t=makeClient();const s=await t.client.search(filter);
  t.client.dispose();
  assert.equal((await t.client.search(filter)).reason,"disposed");
  assert.equal((await t.client.reveal({sourceIndex:0,searchId:s.searchId,pokemonId:821,cp:438})).reason,"disposed");
 });
 await check("expired code never goes to API",async()=>{
  const t=makeClient({now:Date.UTC(2100,0,1)});
  const s=await t.client.search(filter);
  assert.equal(s.ok,true);
  assert.equal(s.cards.length,0);
  assert.equal((await t.client.reveal({sourceIndex:0,searchId:s.searchId,pokemonId:821,cp:438})).reason,"stale-or-ambiguous-selection");
  assert.equal(t.calls.length,1);
 });
 await check("reveal 403 and 429 respected without retry or bearer",async()=>{
  for(const status of [403,429]){
   const captured=[];
   const t=makeClient({fetchImpl:async(url,req)=>{
    captured.push({url,req});
    if(req.method==="POST")return reply(200,{results:[item()]});
    return reply(status,{token:"NO_SHOW"});
   }});
   const s=await t.client.search(filter);
   const r=await t.client.reveal({sourceIndex:0,searchId:s.searchId,pokemonId:821,cp:438});
   assert.equal(r.reason,status===403?"access-denied":"rate-limited");
   assert.equal(captured.length,2);
   assert.equal(Object.hasOwn(captured[1].req.headers,"Authorization"),false);
   assert.ok(!JSON.stringify(r).includes("NO_SHOW"));
  }
 });
 console.log("LT77 browser transport: "+passed+"/"+passed+" PASS");
}
suite().catch(e=>{console.error(e);process.exitCode=1;});

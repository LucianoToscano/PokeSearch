"use strict";
const assert=require("node:assert/strict");
const contract=require("../src/main/assets/api_result_contract.js");
const browser=require("../src/main/assets/api_browser_transport.js");
const sessionModule=require("../src/main/assets/api_android_session.js");
const revealContract=require("../src/main/assets/api_reveal_contract.js");
const NOW=Date.UTC(2026,9,25,4,0,0);
const CODE="opaqueRevealCode_123456789";
const BASE={mode:"raw",attack:15,defense:15,stamina:15};
const reply=(status,body,seconds)=>({
 status,headers:{get:(name)=>name==="Retry-After"?seconds??null:null},
 text:async()=>JSON.stringify(body)
});
function spawn(){
 return {encounter_id:"987654321",pokemon_id:19,pokemon_name:"Rattata",
  cp:100,level:10,raw_iv:"15/15/15",iv_percent:100,
  location:"Example City",gender:"Male",size:"M",
  despawn_at:"2099-10-25T05:00:00Z",reveal_code:CODE,shiny:false};
}
function client(fetchImpl,now){
 return browser.createClient({
  fetchImpl,now:()=>now.value,
  siteOrigin:()=>"https://pogocoordinates.com",
  storage:{getItem:()=>null},apiContract:contract,revealContract
 });
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
async function run(){
 // UI clears must never silently carry forward a stale radius or center.
 let disabled=contract.buildPayload({...BASE,locationEnabled:false,
  centerLat:24.9407581,centerLng:121.1889794,radiusKm:215,
  locationRadius:215,locationCoords:"24.9407581,121.1889794"});
 assert.equal(disabled.ok,true,JSON.stringify(disabled));
 assert.deepEqual([disabled.payload.center_lat,disabled.payload.center_lng,
  disabled.payload.radius_km],[null,null,null]);
 for(const radius of [0,215,1000]){
  const r=contract.buildPayload({...BASE,locationEnabled:true,
   locationCoords:"24.9407581,121.1889794",locationRadius:radius});
  assert.equal(r.ok,true,JSON.stringify(r));
  assert.deepEqual([r.payload.center_lat,r.payload.center_lng,r.payload.radius_km],
   [24.9407581,121.1889794,radius]);
 }
 assert.equal(contract.buildPayload({...BASE,locationEnabled:true,
  locationCoords:"91,0",locationRadius:50}).ok,false);
 assert.equal(contract.buildPayload({...BASE,locationEnabled:true,
  locationCoords:"0,181",locationRadius:50}).ok,false);
 assert.equal(contract.buildPayload({...BASE,locationEnabled:true,
  locationCoords:"0,0",locationRadius:1001}).ok,false);
 // Intersex/any symbol is not the same as the official Genderless enum.
 assert.equal(contract.buildPayload({...BASE,genderSelections:["⚥"]}).payload.gender,null);
 assert.equal(contract.buildPayload({...BASE,genderSelections:["Any"]}).payload.gender,null);
 assert.equal(contract.buildPayload({...BASE,genderSelections:["⚲"]}).payload.gender,"Genderless");
 assert.equal(contract.buildPayload({...BASE,genderSelections:["Female"]}).payload.gender,"Female");
 console.log("PASS LT84 cleared geofilter, boundaries, explicit gender enums");

 // Respect HTTP Retry-After, never silently retry and never expose the code.
 const clock={value:NOW};let count=0;
 const t=client(async()=>{
  count++;
  return count===1?reply(429,{detail:{error:"rate_limited"}},"7"):
   reply(200,{results:[],cap:5});
 },clock);
 assert.deepEqual(await t.search(BASE),{ok:false,reason:"rate-limited"});
 assert.deepEqual(await t.search(BASE),{ok:false,reason:"rate-limited"});
 assert.equal(count,1);
 clock.value+=7001;
 assert.equal((await t.search(BASE)).ok,true);
 assert.equal(count,2);
 console.log("PASS LT84 server rate-limit gate and anonymous 5-cap");

 // Reveal coordinates must remain in the same session and never be eagerly read.
 let releaseReveal,requests=[];
 const r=client(async(url,req)=>{
  requests.push({url,req});
  if(req.method==="POST")return reply(200,{results:[spawn()],cap:5});
  return new Promise(resolve=>{releaseReveal=resolve;});
 },{value:NOW});
 const search=await r.search(BASE);
 assert.equal(search.ok,true,JSON.stringify(search));
 const selection={sourceIndex:0,searchId:search.searchId,pokemonId:19,cp:100};
 const pending=r.reveal(selection);
 assert.equal((await r.reveal(selection)).reason,"reveal-in-progress");
 assert.equal(requests.length,2);
 assert.equal(requests[1].req.headers.Authorization,undefined);
 releaseReveal(reply(200,{coords:"24.9407581,121.1889794",lat:24.9407581,lng:121.1889794}));
 assert.equal((await pending).coords,"24.9407581,121.1889794");
 assert.ok(!JSON.stringify(search).includes(CODE));
 assert.ok(!JSON.stringify(await r.reveal({...selection,cp:200})).includes(CODE));
 console.log("PASS LT84 on-demand bounded reveal and ephemeral secrets");

 // Out-of-order catalog loads must not dispatch a superseded search.
 let completeCatalog,searchCalls=0;
 const s=sessionModule.createSession({
  siteOrigin:()=>"https://pogocoordinates.com",
  catalog:{getCatalog:()=>new Promise(resolve=>{completeCatalog=resolve;}),dispose(){}},
  transport:{search:async()=>{
   searchCalls++;
   return {ok:true,searchId:22,cards:[],found:0,siteCount:0,rejected:0,expired:0};
  },reveal:async()=>({ok:false,reason:"stale"}),dispose(){}}
 });
 assert.equal(s.startSearch(1,{...BASE,formSelections:["Alola"]}).ok,true);
 await flush();
 assert.equal(s.startSearch(2,BASE).ok,true);
 await flush();await flush();
 completeCatalog({ok:true,forms:["Alola"],catalogSpeciesForms:[]});
 await flush();await flush();
 assert.equal(searchCalls,1);
 assert.equal(s.take(1).reason,"superseded-search");
 assert.equal(s.take(2).ok,true);
 s.dispose();
 console.log("PASS LT84 out-of-order catalog promises");
 console.log("LT84 API direct regression suite PASS");
}
run().catch(error=>{console.error(error);process.exitCode=1;});

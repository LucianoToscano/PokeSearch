"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const {createLocalServer, makeGateway, boundsFromUrl} = require("./authorized-spawn-gateway");

const NOW = Date.parse("2026-11-22T17:00:00Z");
const INGEST = "test-INGEST-supersecret-1234567890";
const READ = "test-READ-supersecret-123456789012";
const BASE = {authorized:true,sourceId:"golbat_licensed",ingestSecret:INGEST,readSecret:READ,now:()=>NOW};
const pikachu = (overrides = {})=>({
  type:"pokemon", message:{
    pokemon_id:25, encounter_id:"8000000000000000001", latitude:-5.91,longitude:-35.27,
    disappear_time:(NOW + 600000)/1000, disappear_time_verified:true,
    individual_attack:15,individual_defense:15,individual_stamina:15,
    cp:900,level:25,...overrides
  }
});

async function setup() {
  const {server,statistics} = createLocalServer(BASE);
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  return {server,statistics,port:server.address().port};
}
async function call(port, method, path, headers={}, data=null) {
  return new Promise((resolve,reject)=>{
    const req=http.request({host:"127.0.0.1",port,method,path,headers},res=>{
      const chunks=[];
      res.on("data",d=>chunks.push(d));
      res.on("end",()=>resolve({status:res.statusCode,body:JSON.parse(Buffer.concat(chunks).toString())}));
    });
    req.on("error",reject);
    if(data!==null)req.write(data);
    req.end();
  });
}
const area="/raw_data?swLat=-6&swLng=-35.4&neLat=-5.8&neLng=-35.1&pokemon=true";

test("no gateway exists without explicit provider permission and two secrets",()=>{
  assert.throws(()=>makeGateway({...BASE,authorized:false}),/authorization/);
  assert.throws(()=>makeGateway({...BASE,readSecret:INGEST}),/distinct/);
  assert.throws(()=>makeGateway({...BASE,readSecret:"short"}),/secret/);
});
test("bounds reject inverted areas, bad values and injection",()=>{
  assert.equal(boundsFromUrl(new URL("http://localhost/raw_data?swLat=20&swLng=1&neLat=-20&neLng=3")),null);
  assert.equal(boundsFromUrl(new URL("http://localhost/raw_data?swLat=abc&swLng=1&neLat=2&neLng=3")),null);
});
test("reject unauthenticated ingest and read",async()=>{
  const {server,port}=await setup();
  try{
    const raw=JSON.stringify([pikachu()]);
    assert.equal((await call(port,"POST","/webhook/golbat",{"Content-Type":"application/json"},raw)).status,401);
    assert.equal((await call(port,"GET",area)).status,401);
  } finally{await new Promise(resolve=>server.close(resolve));}
});
test("ingests Golbat array, serves filtered RocketMap-compatible JSON",async()=>{
  const {server,port,statistics}=await setup();
  try{
    const payload=JSON.stringify([pikachu(),{type:"raid",message:{}},pikachu()]);
    const ingested=await call(port,"POST","/webhook/golbat",
      {"x-source-secret":INGEST,"Content-Type":"application/json"},payload);
    assert.equal(ingested.status,202);
    assert.equal(ingested.body.accepted,1);
    assert.equal(ingested.body.cached,1);
    assert.equal(statistics().cached,1);
    const received=await call(port,"GET",area,{"x-feed-secret":READ});
    assert.equal(received.status,200);
    assert.equal(received.body.pokemons.length,1);
    assert.equal(received.body.pokemons[0].pokemon_id,25);
    assert.equal(received.body.pokemons[0].disappear_time,NOW+600000);
    assert.equal(received.body.pokemons[0].individual_attack,15);
    assert.deepEqual(received.body.gyms,{});
    const filtered=await call(port,"GET",area+"&pokemon_id=1",{"x-feed-secret":READ});
    assert.equal(filtered.body.pokemons.length,0);
    const iv=await call(port,"GET",area+"&iv_min=100&cp_min=800&level_min=20",{"x-feed-secret":READ});
    assert.equal(iv.body.pokemons.length,1);
    const outside=await call(port,"GET","/raw_data?swLat=0&swLng=0&neLat=1&neLng=1",
      {"x-feed-secret":READ});
    assert.equal(outside.body.pokemons.length,0);
  } finally{await new Promise(resolve=>server.close(resolve));}
});
test("updates same encounter without downgrading IV to unknown",async()=>{
  const {server,port}=await setup();
  try{
    const headers={"x-source-secret":INGEST,"Content-Type":"application/json"};
    await call(port,"POST","/webhook/golbat",headers,JSON.stringify([pikachu()]));
    const changed=pikachu({cp:999,individual_attack:null,individual_defense:null,individual_stamina:null});
    const second=await call(port,"POST","/webhook/golbat",headers,JSON.stringify([changed]));
    assert.equal(second.status,202);
    assert.equal(second.body.cached,1);
    const got=await call(port,"GET",area,{"x-feed-secret":READ});
    assert.equal(got.body.pokemons[0].cp,999);
    assert.equal(got.body.pokemons[0].individual_attack,15);
  } finally{await new Promise(resolve=>server.close(resolve));}
});
test("invalid viewport/filter/transport are explicit, not fake empty successes",async()=>{
  const {server,port}=await setup();
  try {
    assert.equal((await call(port,"GET","/raw_data?swLat=no",{"x-feed-secret":READ})).status,400);
    assert.equal((await call(port,"GET",area+"&iv_min=-1",{"x-feed-secret":READ})).status,400);
    assert.equal((await call(port,"POST","/webhook/golbat",
      {"x-source-secret":INGEST,"Content-Type":"text/plain"},"hello")).status,415);
    assert.equal((await call(port,"GET","/nope",{"x-feed-secret":READ})).status,404);
  } finally{await new Promise(resolve=>server.close(resolve));}
});
test("reject expired and unknown-despawn events, no phantom spawns",async()=>{
  const {server,port}=await setup();
  try {
    const input=[pikachu({encounter_id:"expired",disappear_time:(NOW-1000)/1000}),
      pikachu({encounter_id:"unknown",disappear_time:0})];
    const res=await call(port,"POST","/webhook/golbat",
      {"x-source-secret":INGEST,"Content-Type":"application/json"},JSON.stringify(input));
    assert.equal(res.status,202);
    assert.equal(res.body.accepted,0);
    assert.equal(res.body.cached,0);
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test("operator status requires separate read secret and reports actual event reception",async()=>{
  const {server,port}=await setup();
  try{
    const denied=await call(port,"GET","/status");
    assert.equal(denied.status,401);
    const empty=await call(port,"GET","/status",{"x-feed-secret":READ});
    assert.equal(empty.status,200);
    assert.equal(empty.body.status,"waiting_for_source");
    assert.equal(empty.body.demo,false);
    assert.equal(empty.body.cached,0);
    await call(port,"POST","/webhook/golbat",
      {"x-source-secret":INGEST,"content-type":"application/json"},
      JSON.stringify([pikachu()]));
    const active=await call(port,"GET","/status",{"x-feed-secret":READ});
    assert.equal(active.body.status,"receiving_observations");
    assert.equal(active.body.cached,1);
    assert.equal(active.body.lastAcceptedAt,NOW);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
test("dashboard is local, makes no uncredentialed data calls and visibly separates demo from live",async()=>{
  const {server,port}=await setup();
  try{
    const {html}=require("./authorized-feed-dashboard");
    assert.match(html,/DEMONSTRAÇÃO — DADOS FICTÍCIOS/);
    assert.match(html,/X-Feed-Secret/);
    assert.match(html,/id="map"/);
    assert.match(html,/response\.ok/);
    assert.doesNotMatch(html,/<script[^>]*src=|<img[^>]*src=|http[s]?:\/\/[^"< ]+\.js/);
    const fetched=await new Promise((resolve,reject)=>{
      http.get({host:"127.0.0.1",port,path:"/painel"},res=>{
        const chunks=[];res.on("data",chunk=>chunks.push(chunk));
        res.on("end",()=>resolve({status:res.statusCode,body:Buffer.concat(chunks).toString(),
          headers:res.headers}));
      }).on("error",reject);
    });
    assert.equal(fetched.status,200);
    assert.match(fetched.headers["content-security-policy"],/connect-src 'self'/);
    assert.equal(fetched.headers["x-frame-options"],"DENY");
    assert.match(fetched.body,/Demonstração offline/i);
    assert.equal((await call(port,"GET",area)).status,401,
      "public dashboard must never make feed data public");
  }finally{await new Promise(resolve=>server.close(resolve));}
});

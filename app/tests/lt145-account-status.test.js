"use strict";
const assert=require("node:assert/strict");
const transport=require("../src/main/assets/api_browser_transport.js");
let token="aaa.bbb.ccc",requests=[];
const make=(fetchImpl)=>transport.createClient({
 fetchImpl,siteOrigin:()=>"https://pogocoordinates.com",now:()=>1793145600000,
 storage:{getItem:key=>key==="jwt"?token:null,removeItem:key=>{if(key==="jwt")token=null;}},
 apiContract:{buildPayload:()=>({ok:false})},
 revealContract:{planForSpawn:()=>({ok:false}),normalizeRevealResponse:()=>({ok:false})}
});
(async()=>{
 const client=make(async(url,options)=>{
  requests.push({url,options});
  return {status:200,headers:{get:()=>null},
   text:async()=>JSON.stringify({id:123,email:"PRIVATE@EXAMPLE.COM",vip:true})};
 });
 let res=await client.accountStatus();
 assert.deepEqual(res,{ok:true,auth:"authenticated",trainerState:"unknown",trainers:[]});
 assert.equal(JSON.stringify(res).includes("@"),false,"PII must never leave WebView");
 assert.equal(requests.length,2,"unknown users/me trainer shape triggers one read-only /trainer fallback");
 assert.equal(requests[0].url,"https://coordinates-api.pokemongopro.com/users/me");
 assert.equal(requests[0].options.headers.Authorization,"Bearer aaa.bbb.ccc");
 assert.equal(requests[0].options.credentials,"omit");
 assert.equal(requests[1].url,"https://coordinates-api.pokemongopro.com/trainer");
 assert.equal(requests[1].options.method,"GET");
 assert.equal(requests[1].options.headers.Authorization,"Bearer aaa.bbb.ccc");
 token=null;
 res=await client.accountStatus();
 assert.deepEqual(res,{ok:true,auth:"login-required",trainerState:"unknown",trainers:[]});
 assert.equal(requests.length,2,"must not send unauthenticated profile request");
 client.dispose();
 token="aaa.bbb.ccc";
 const unauthorized=make(async()=>({status:401,headers:{get:()=>null},text:async()=>"{}"}));
 res=await unauthorized.accountStatus();
 assert.deepEqual(res,{ok:true,auth:"login-required",trainerState:"unknown",trainers:[]});
 assert.equal(token,null,"401 must invalidate only the official site session");
 unauthorized.dispose();
 console.log("LT145 PoGo account-status privacy checks passed");
})().catch(error=>{console.error(error);process.exitCode=1;});

"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const transport=require("../src/main/assets/api_browser_transport.js");
const session=require("../src/main/assets/api_android_session.js");
const contract=require("../src/main/assets/api_result_contract.js");
const reveal=require("../src/main/assets/api_reveal_contract.js");
const service=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const candy=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/RareCandyOverlayService.java"),"utf8");
const probe=fs.readFileSync(path.join(__dirname,"../src/main/assets/probe.js"),"utf8");
const config={mode:"raw",attack:0,defense:0,stamina:0};
async function scenario(header,expected){
 let clock=Date.UTC(2026,9,30,14,0,0),calls=0;
 const c=transport.createClient({now:()=>clock,siteOrigin:()=>"https://pogocoordinates.com",
  storage:{getItem:()=>null},apiContract:contract,revealContract:reveal,
  fetchImpl:async()=>{calls++;return {status:429,headers:{get:n=>n==="Retry-After"?header:null},text:async()=>""}}});
 assert.deepEqual(await c.search(config),{ok:false,reason:"rate-limited"});
 assert.equal(c.backoffSeconds("search"),expected,`header ${header}`);
 assert.equal(calls,1);
 assert.deepEqual(await c.search(config),{ok:false,reason:"rate-limited"});
 assert.equal(calls,1,"No extra calls while throttled");
 clock+=60_000;
 assert.equal(c.backoffSeconds("search"),Math.max(0,expected-60));
 c.dispose();
}
async function main(){
 await scenario("7200",7200);
 await scenario("86400",86400);
 await scenario("99999",86400); // explicit 24h bounded policy, not 60 seconds
 await scenario("bad-value",60);
 const now=Date.UTC(2026,9,30,14,0,0);
 await scenario(new Date(now+7200*1000).toUTCString(),7200);
 let clock=now;
 const t=transport.createClient({now:()=>clock,siteOrigin:()=>"https://pogocoordinates.com",
  storage:{getItem:()=>null},apiContract:contract,revealContract:reveal,
  fetchImpl:async()=>({status:429,headers:{get:n=>n==="Retry-After"?"7200":null},text:async()=>""})});
 const s=session.createSession({transport:t,siteOrigin:()=>"https://pogocoordinates.com",
  catalog:{getCatalog:async()=>({ok:true,catalogSpeciesForms:[],forms:[]}),dispose:()=>{}}});
 assert.deepEqual(s.startSearch(5,config),{ok:true,pending:true});
 let response;
 for(let i=0;i<25;i++){await new Promise(r=>setImmediate(r));response=s.take(5);if(!response.pending)break;}
 assert.deepEqual(response,{ok:false,reason:"rate-limited",retryAfterSeconds:7200});
 assert.ok(service.includes("API_RATE_BACKOFF_MAX_MS=86_400_000L;"));
 assert.ok(service.includes("suggestedSeconds>=1&&suggestedSeconds<=86400"));
 assert.ok(service.includes("reportedSeconds>=1&&reportedSeconds<=86400"));
 assert.ok(service.includes('getSharedPreferences("prefs",MODE_PRIVATE)'));
 assert.ok(service.includes('remaining>=3600L'));
 assert.ok(service.includes('if("rate-limited".equals(reason))'));
 assert.ok(service.includes('"invalid-request".equals(reason)'));
 assert.ok(candy.includes('Math.min(86400,response.optInt("retry_after",60))'));
 assert.ok(probe.includes('secs>=1&&secs<=86400?secs:0'));
 s.dispose();
 console.log("LT191 PASS: 2h/24h/date/oversized/invalid headers, 429 P1-P2 native gate and safe UI hints");
}
main().catch(e=>{console.error(e);process.exitCode=1;});

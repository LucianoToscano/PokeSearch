"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const transport=require("../src/main/assets/api_browser_transport.js");
const session=require("../src/main/assets/api_android_session.js");
const contract=require("../src/main/assets/api_result_contract.js");
const reveal=require("../src/main/assets/api_reveal_contract.js");
const java=fs.readFileSync(path.join(__dirname,
 "../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const second=fs.readFileSync(path.join(__dirname,
 "../src/main/java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java"),"utf8");
const NOW=Date.UTC(2026,9,30,12,0,0);
const base={mode:"raw",attack:0,defense:0,stamina:0};
const clock={now:NOW};
let calls=0;
const fetchImpl=async()=>{calls++;return {
 status:429,headers:{get:n=>n==="Retry-After"?"120":null},
 text:async()=>JSON.stringify({secret:"SHOULD_NOT_LEAK"})};};
const client=transport.createClient({
 fetchImpl,siteOrigin:()=>"https://pogocoordinates.com",
 now:()=>clock.now,storage:{getItem:()=>null},apiContract:contract,revealContract:reveal
});
async function main(){
 assert.deepEqual(await client.search(base),{ok:false,reason:"rate-limited"});
 assert.equal(calls,1);
 assert.equal(client.backoffSeconds("search"),120);
 assert.equal(client.backoffSeconds("account"),0);
 assert.equal(client.backoffSeconds("unknown"),0);
 for(let i=0;i<3;i++)assert.deepEqual(await client.search(base),{ok:false,reason:"rate-limited"});
 assert.equal(calls,1,"during HTTP 429 no provider retries");
 clock.now+=30_000;
 assert.equal(client.backoffSeconds("search"),90);
 const c2=transport.createClient({
  fetchImpl,siteOrigin:()=>"https://pogocoordinates.com",
  now:()=>clock.now,storage:{getItem:()=>null},apiContract:contract,revealContract:reveal
 });
 const ses=session.createSession({
  transport:c2,siteOrigin:()=>"https://pogocoordinates.com",
  catalog:{getCatalog:async()=>({ok:true,catalogSpeciesForms:[],forms:[]}),
   dispose:()=>{}}
 });
 assert.deepEqual(ses.startSearch(1,base),{ok:true,pending:true});
 let r;for(let i=0;i<20;i++){
  await new Promise(resolve=>setImmediate(resolve));
  r=ses.take(1);
  if(!r.pending)break;
 }
 assert.deepEqual(r,{ok:false,reason:"rate-limited",retryAfterSeconds:120});
 assert.equal(calls,2);
 assert.ok(!JSON.stringify(r).includes("SHOULD_NOT_LEAK"));
 assert.ok(java.includes('API_RATE_BACKOFF_PREF="pogoApiSearchBackoffUntilMs"'));
 assert.ok(java.includes('getSharedPreferences("prefs",MODE_PRIVATE)'));
 assert.ok(java.includes('response.optInt("retryAfterSeconds",60)'));
 assert.ok(java.includes('if(authorizedApiQaSelected()&&apiProviderBackoffUntil()>0L)'));
 assert.ok(java.includes('handler.removeCallbacks(providerRateLimitResume)'));
 assert.ok(java.includes('isSecondaryOverlay()?3_000L:0L'));
 assert.ok(java.includes('if("rate-limited".equals(reason))'));
 assert.ok(java.includes('scheduleProviderRateLimitResume()'));
 assert.match(second,/extends OverlayService/);
 console.log("PASS LT190: 429 provider Retry-After, no extra calls, safe native backoff P1/P2");
 ses.dispose();client.dispose();
}
main().catch(e=>{console.error(e);process.exitCode=1;});

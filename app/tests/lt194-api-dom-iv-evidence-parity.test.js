"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const api=require("../src/main/assets/api_result_contract.js");
const transport=require("../src/main/assets/api_browser_transport.js");
const reveal=require("../src/main/assets/api_reveal_contract.js");
const display=require("../src/main/assets/iv_display.js");
const assets=path.join(__dirname,"../src/main/assets");
const probe=fs.readFileSync(path.join(assets,"probe.js"),"utf8");
const native=fs.readFileSync(path.join(__dirname,
 "../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const secondary=fs.readFileSync(path.join(__dirname,
 "../src/main/java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java"),"utf8");
const dock=fs.readFileSync(path.join(assets,"dock.html"),"utf8");
const from=probe.indexOf("const POSSIBLE_IV_PERCENT=");
const to=probe.indexOf("function collect(){",from);
assert.ok(from>=0&&to>from);
const verifiedCardIv=new Function(probe.slice(from,to)+"return verifiedCardIv;")();
const pcStart=probe.indexOf("function nextLabelValue(");
const pcEnd=probe.indexOf("// IV is evidence about THIS card,",pcStart);
const parseCard=new Function("clean","text","verifiedCardIv","mode",
 probe.slice(pcStart,pcEnd)+"return parseCard;")(
 s=>String(s||"").trim(),e=>String(e?.innerText||e?.textContent||""),
 verifiedCardIv,"raw");
function domCard(description){
 return {innerText:"Noibat\n#714\n"+description+"\nCP\n10\nLVL\n1\nDESPAWN\n25:13",
  querySelector:()=>({innerText:"Noibat"}),querySelectorAll:()=>[]};
}
const bad=parseCard(domCard("IV: 99%\n0/15/15"),0);
assert.equal(bad.iv,"0/15/15");
assert.equal(bad.ivPercent,"99","DOM must never replace explicit 99 with calculated 67");
assert.equal(verifiedCardIv(bad),null,"explicit contradiction must be rejected");
const good=parseCard(domCard("IV: 66,67%\n0/15/15"),0);
assert.equal(good.ivPercent,"66,67");
assert.equal(verifiedCardIv(good).percent,67);
for(const pct of ["66.67","66,67","66.6666667",66.67,66.6666667]){
 const parsed=api.parseIV("0/15/15",pct);
 assert.ok(parsed,"API IV "+pct);assert.equal(parsed.percent,67);
 const fromDom=verifiedCardIv({iv:"0/15/15",ivPercent:String(pct)});
 assert.equal(fromDom.percent,67,"DOM IV "+pct);
 assert.equal(display.fromCard({iv:"0/15/15",ivPercent:String(pct)}).percent,67);
}
for(const pct of ["99","65.5","68.3","99.9999999"]){
 assert.equal(api.parseIV("0/15/15",pct),null);
 assert.equal(verifiedCardIv({iv:"0/15/15",ivPercent:pct}),null);
 assert.equal(display.fromCard({iv:"0/15/15",ivPercent:pct}).valid,false);
}
assert.equal(api.parseIV("0/13/13",57.78).percent,58);
assert.equal(verifiedCardIv({iv:"0/13/13",ivPercent:"57,78"}).percent,58);
assert.equal(display.fromCard({iv:"15/15/15",ivPercent:"100"}).percent,100);
assert.equal(display.percentOnly({iv:"",ivPercent:"66.6666667"}).percent,67);
assert.match(native,/VerifiedIvMath\.matchesCriteria\(mode,/);
assert.match(secondary,/extends OverlayService/);
assert.match(native,/i<10;i\+\+/);
assert.match(dock,/cards=Array\.isArray\(a\)\?a\.slice\(0,10\)/);
const base={pokemon_id:714,pokemon_name:"Noibat",raw_iv:"0/15/15",
 iv_percent:66.67,cp:10,level:1,despawn_at:"2099-10-24T00:00:00Z"};
const goodRaw={...base,encounter_id:"good"};
const wrongRaw={...base,iv_percent:99,encounter_id:"wrong"};
const norm=api.normalizeResponse({results:[goodRaw,wrongRaw],cap:100},{nowMs:0});
assert.equal(norm.cards.length,1);assert.equal(norm.rejected,1);
assert.equal(norm.rejectionCounts.iv,1);
assert.equal(norm.displayCap,10);
const many=api.normalizeResponse({results:Array.from({length:20},(_,i)=>({...base,
 encounter_id:"spawn-"+i})),cap:100},{nowMs:0});
assert.equal(many.cards.length,10,"never exceed ten even if provider says 100");
function createClient(results,cap=10){
 return transport.createClient({
  fetchImpl:async()=>({status:200,headers:{get:()=>null},
   text:async()=>JSON.stringify({results,cap})}),
  siteOrigin:()=>"https://pogocoordinates.com",now:()=>0,
  apiContract:api,revealContract:reveal,
  storage:{getItem:()=>null}
 });
}
(async()=>{
 let client=createClient([wrongRaw]);
 let res=await client.search({mode:"raw",attack:0,defense:15,stamina:15});
 assert.equal(res.ok,false);assert.equal(res.reason,"unverified-results");
 assert.equal(res.siteCount,1);assert.equal(res.rejectionCounts.iv,1);
 client.dispose();
 client=createClient([]);
 res=await client.search({mode:"raw",attack:0,defense:15,stamina:15});
 assert.equal(res.ok,true);assert.equal(res.siteCount,0);assert.equal(res.cards.length,0);
 client.dispose();
 client=createClient([goodRaw,wrongRaw]);
 res=await client.search({mode:"raw",attack:0,defense:15,stamina:15});
 assert.equal(res.ok,true);assert.equal(res.cards.length,1);
 assert.equal(res.rejected,1);
 client.dispose();
 client=createClient(Array.from({length:20},(_,i)=>({...base,encounter_id:"id"+i})),100);
 res=await client.search({mode:"raw",attack:0,defense:15,stamina:15});
 assert.equal(res.ok,true);assert.equal(res.cards.length,10);
 client.dispose();
 console.log("PASS LT194: API/DOM/display/transport 10-cap and unverified empty protection");
})().catch(e=>{console.error(e);process.exitCode=1});

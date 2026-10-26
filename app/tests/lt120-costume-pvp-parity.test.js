"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const contract=require("../src/main/assets/api_result_contract.js");
const transport=require("../src/main/assets/api_browser_transport.js");
const sprite=require("../src/main/assets/sprite_offline.js");
const dir=path.join(__dirname,"../src/main");
const secondary=fs.readFileSync(path.join(dir,"java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java"),"utf8");
const java=fs.readFileSync(path.join(dir,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const future="2099-10-26T19:00:00Z";
const now=Date.UTC(2026,9,26,19);
const spawn=(n,other={})=>({encounter_id:String(n),pokemon_id:25,
 pokemon_name:"Pikachu",form:"PIKACHU_NORMAL",cp:777,level:20,
 raw_iv:"15/15/15",iv_percent:100,shiny:false,despawn_at:future,
 ...other});
let checks=0;function check(name,fn){fn();checks++;console.log("PASS LT120 "+name);}
check("both Pokébolas share the corrected API and sprite resolver",()=>{
 assert.match(secondary,/extends OverlayService/);
 assert.match(java,/getSharedPreferences\(isSecondaryOverlay\(\)\?"prefs_secondary":"prefs",0\)/);
 for(const f of ["assets/detail.html","assets/dock.html"])
  assert.match(fs.readFileSync(path.join(dir,f),"utf8"),/PokeSearchOfflineSprite\.resolve\(c\)/);
});
check("costume ID survives sanitized API card; no false base sprite for costume",()=>{
 const r=contract.normalizeResponse({results:[spawn(1,{costume_id:23})]},
   {nowMs:now});
 assert.equal(r.cards.length,1);
 assert.equal(r.cards[0].image,"");
 assert.equal(r.cards[0].costume_id,23);
 assert.equal(sprite.resolve(r.cards[0]).src,"");
});
check("text costume survives sanitized card and blocks generic image",()=>{
 const c=contract.normalizeResponse({results:[spawn(2,{costume:"Pikachu Party Hat"})]},
  {nowMs:now}).cards[0];
 assert.equal(c.costume,"Pikachu Party Hat");
 assert.equal(sprite.resolve(c).src,"");
});
check("normal form and costume 0 still receive correctly verified base art",()=>{
 const c=contract.normalizeResponse({results:[spawn(3,{costume_id:0})]},
  {nowMs:now}).cards[0];
 assert.equal(c.costume_id,0);
 assert.equal(sprite.resolve(c).src,"file:///android_asset/pokemon-sprites/base/25.png");
});
check("PvP rank vetting precedes ten-card limit and preserves source indices",()=>{
 const results=Array.from({length:16},(_,i)=>spawn(i+1,{
   pvp:{league:"great",rank:i<12?45:1}}));
 const r=contract.normalizeResponse({results,cap:10},
  {nowMs:now,pvpLeague:"great",pvpMaxRank:1});
 assert.equal(r.ok,true);
 assert.equal(r.cards.length,4);
 assert.deepEqual(r.cards.map(c=>c.sourceIndex),[12,13,14,15]);
 assert.deepEqual(r.cards.map(c=>c.rank),["1","1","1","1"]);
});
check("Great and Ultra leagues stay independent; no unverified rank accepted",()=>{
 const rows=[
  spawn(1,{pvp:{league:"great",rank:1}}),
  spawn(2,{pvp:{league:"ultra",rank:1}}),
  spawn(3,{pvp:{league:"great",rank:"1"}}),
  spawn(4,{pvp:null})
 ];
 for(const league of ["great","ultra"]){
  const r=contract.normalizeResponse({results:rows},
   {nowMs:now,pvpLeague:league,pvpMaxRank:1});
  assert.equal(r.cards.length,1);assert.equal(r.cards[0].ivRankLeague,league);
 }
});
check("bad PvP configuration or malformed costume fails closed",()=>{
 assert.equal(contract.normalizeResponse({results:[spawn(1)]},
  {nowMs:now,pvpLeague:"great",pvpMaxRank:0}).ok,false);
 assert.equal(contract.normalizeResponse({results:[spawn(1,{costume_id:"bogus"})]},
  {nowMs:now}).cards.length,0);
});
function makeClient(results,mode="gl",cap=10){
 const body={results,cap};
 return transport.createClient({
  fetchImpl:async()=>({status:200,headers:{get:()=>null},text:async()=>JSON.stringify(body)}),
  storage:{getItem:()=>null},siteOrigin:()=>"https://pogocoordinates.com",
  now:()=>now,apiContract:contract,revealContract:{planForSpawn:()=>({ok:false})}
 });
}
(async()=>{
 const client=makeClient(Array.from({length:15},(_,i)=>spawn(i+1,{
  pvp:{league:"great",rank:i<13?25:1}})));
 const good=await client.search({mode:"gl",glRank:1});
 assert.equal(good.ok,true,JSON.stringify(good));
 assert.equal(good.cards.length,2);
 assert.deepEqual(good.cards.map(c=>c.sourceIndex),[13,14]);
 assert.equal(good.pvpVerified,true);
 client.dispose();
 const bad=makeClient([spawn(1,{pvp:{league:"ultra",rank:1}})]);
 const denied=await bad.search({mode:"gl",glRank:1});
 assert.equal(denied.ok,false);assert.equal(denied.reason,"pvp-unverified");
 bad.dispose();
 const empty=makeClient([]);
 const verifiedEmpty=await empty.search({mode:"ul",ulRank:1});
 assert.equal(verifiedEmpty.ok,true);assert.equal(verifiedEmpty.cards.length,0);
 empty.dispose();
 console.log("PASS LT120 HTTP API vetted after full candidate set and wrong-league fails closed");
 console.log("LT120 "+(checks+1)+"/"+(checks+1)+" PASS");
})().catch(err=>{console.error(err);process.exitCode=1;});

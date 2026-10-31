"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const contract=require("../src/main/assets/api_result_contract.js");
const transport=require("../src/main/assets/api_browser_transport.js");
const dock=fs.readFileSync(path.join(__dirname,"../src/main/assets/dock.html"),"utf8");
const session=fs.readFileSync(path.join(__dirname,"../src/main/assets/api_android_session.js"),"utf8");
const candy=fs.readFileSync(path.join(__dirname,"../src/main/assets/rare_candy_probe.js"),"utf8");
const fixture=(change={})=>({
 encounter_id:"202601",pokemon_id:25,pokemon_name:"Pikachu",raw_iv:"15/15/15",
 iv_percent:100,cp:500,level:20,despawn_at:"2099-10-31T20:00:00Z",
 shiny:true,background:true,reveal_code:"fixture",shiny_for:["Trainer_A","Trainer_B"],
 ...change
});
const parse=(change,options)=>contract.normalizeResponse({
 tier:"logged_in",cap:10,results:[fixture(change)]
},{nowMs:Date.UTC(2026,9,31),...options}).cards[0];
const hidden=parse({}, {shiny:true});
assert.equal(hidden.shinyFor,null,"No trainer proof; never disclose account labels");
assert.equal(hidden.shiny,true);
assert.equal(hidden.background,true);
const visible=parse({}, {shiny:true,showTrainerNames:true});
assert.deepEqual(visible.shinyFor,["Trainer_A","Trainer_B"]);
assert.equal(visible.shiny,true);
assert.equal(visible.background,true);
assert.deepEqual(parse({shiny_for:null},{showTrainerNames:true}).shinyFor,null);
assert.deepEqual(parse({shiny:false,background:false},{showTrainerNames:true}).shinyFor,["Trainer_A","Trainer_B"],
 "The list is separate metadata and not proof of selected-account Shiny");
assert.deepEqual(parse({shiny_for:["Trainer_A","Trainer_A"]},{showTrainerNames:true}).shinyFor,["Trainer_A"]);
for(const invalid of [["Trainer_A","name@example.com"],["Trainer_A",88],
 ["a".repeat(40)],"Trainer_A",new Array(101).fill("T")]){
 assert.equal(parse({shiny_for:invalid},{showTrainerNames:true}).shinyFor,null,
  "No unexpected personal data or invalid wire structure can enter UI");
}
const anon=contract.normalizeResponse({tier:"non_logged_in",cap:5,results:[fixture({shiny_for:null})]},
 {nowMs:Date.UTC(2026,9,31)});
assert.equal(anon.serverCap,5);
assert.equal(anon.displayCap,5);
assert.equal(anon.cards[0].shinyFor,null);
const paid=contract.normalizeResponse({tier:"vip_super+",cap:100,results:[]},{nowMs:Date.UTC(2026,9,31)});
assert.equal(paid.serverCap,100);
assert.equal(paid.displayCap,10);
assert.match(dock,/card\?\.shinyFor/);
assert.match(dock,/card\?\.background===true/);
assert.match(dock,/\+" para "|\+" ":"\)\+"para "/);
assert.match(dock,/forNames\.slice\(0,3\)/);
assert.match(session,/requestedShiny:filters\.shiny===true/);
assert.match(candy,/payload\.radius_km=radiusMeters\/1000/);
assert.match(candy,/\/rare-candy\/search/);
assert.doesNotMatch(candy,/fetch\(.*\/reveal/);
async function verifyTransport(){
 let seen=0;
 const make=()=>transport.createClient({
  siteOrigin:()=>"https://pogocoordinates.com",now:()=>Date.UTC(2026,9,31),
  storage:{getItem:()=>null},
  apiContract:contract,revealContract:{planForSpawn:()=>({ok:false})},
  fetchImpl:async(url,request)=>{
   seen++;
   assert.equal(url,"https://coordinates-api.pokemongopro.com/search");
   assert.equal(JSON.parse(request.body).shiny_only,true);
   return {status:200,headers:{get:()=>null},text:async()=>JSON.stringify({
    tier:"logged_in",cap:10,results:[fixture()]})};
  }
 });
 const withTrainer=make();
 const one=await withTrainer.search({mode:"raw",attack:15,defense:15,stamina:15,
   shiny:true,shinyAccount:"123456789012"});
 assert.equal(one.ok,true,JSON.stringify(one));
 assert.deepEqual(one.cards[0].shinyFor,["Trainer_A","Trainer_B"]);
 withTrainer.dispose();
 const noTrainer=make();
 const two=await noTrainer.search({mode:"raw",attack:15,defense:15,stamina:15,shiny:true});
 assert.equal(two.ok,true,JSON.stringify(two));
 assert.equal(two.cards[0].shinyFor,null);
 noTrainer.dispose();
 assert.equal(seen,2,"One API request per Pokébola, no 403/429 bypass or fallback");
}
verifyTransport().then(()=>console.log("LT202 shiny_for, tier caps, Rare Candy and P1/P2: PASS")).catch(e=>{console.error(e);process.exitCode=1});

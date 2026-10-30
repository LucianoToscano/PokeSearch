"use strict";
// Regression: non-PvP searches cannot send nullable PvP enum/bool.
// This uses a historical provider-wire fixture, NOT live server validation.
const assert=require("node:assert/strict");
const contract=require("../src/main/assets/api_result_contract.js");
const transport=require("../src/main/assets/api_browser_transport.js");
const common={glRank:5,ulRank:5,attack:0,defense:13,stamina:13,
 locationEnabled:false,sortBy:"Despawn (longest)"};
const modes=[
 ["100%",{mode:"iv"},false,"great"],
 ["0%",{mode:"raw",attack:0,defense:0,stamina:0},false,"great"],
 ["IV 0/13/13",{mode:"raw",attack:0,defense:13,stamina:13},false,"great"],
 ["IV %",{mode:"percent",percentMin:65,percentMax:95},false,"great"],
 ["GL",{mode:"gl",glRank:5},true,"great"],
 ["UL",{mode:"ul",ulRank:5},true,"ultra"]
];
async function main(){
 for(const ball of [1,2]){
  for(const [label,mode,ranked,league] of modes){
   const cfg={...common,...mode,includePreviousEvolutions:true,minPvpCp:100};
   const built=contract.buildPayload(cfg);
   assert.equal(built.ok,true,`P${ball} ${label}: ${JSON.stringify(built)}`);
   assert.equal(built.payload.pvp_mode,ranked);
   assert.equal(built.payload.pvp_league,league,"Non-PvP mode still requires nonnull enum");
   assert.equal(typeof built.payload.pvp_include_pre_evolutions,"boolean");
   assert.equal(built.payload.pvp_top_rank,ranked?5:null);
   assert.equal(built.payload.pvp_min_cp,ranked?100:null);
   let requests=0;
   const client=transport.createClient({
    fetchImpl:async(_,request)=>{
     requests++;
     const p=JSON.parse(request.body);
     const valid=["great","ultra"].includes(p.pvp_league)&&
      typeof p.pvp_include_pre_evolutions==="boolean";
     return {status:valid?200:422,headers:{get:()=>null},
      text:async()=>JSON.stringify(valid?{results:[]}:{detail:"schema rejected"})};
    },
    now:()=>Date.UTC(2026,9,30),
    siteOrigin:()=>"https://pogocoordinates.com",
    storage:{getItem:()=>null},apiContract:contract,
    revealContract:{planForSpawn:()=>({ok:false})}
   });
   const result=await client.search(cfg);
   assert.equal(requests,1,"No duplicate requests or retries");
   assert.equal(result.ok,true,`P${ball} ${label}: ${JSON.stringify(result)}`);
   client.dispose();
   console.log(`PASS P${ball} ${label} historical schema`);
  }
 }
 const noLeak=contract.buildPayload({...common,mode:"iv",
  includePreviousEvolutions:false,minPvpCp:100});
 assert.equal(noLeak.payload.pvp_mode,false);
 assert.equal(noLeak.payload.pvp_include_pre_evolutions,false);
 assert.equal(noLeak.payload.pvp_min_cp,null);
 console.log("LT189 historical HTTP-422 and P1/P2 contract regression: 13/13 PASS");
}
main().catch(e=>{console.error(e);process.exitCode=1;});

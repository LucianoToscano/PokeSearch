"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets");
const html=fs.readFileSync(path.join(assets,"detail.html"),"utf8");
const inline=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(inline);new vm.Script(inline);
const api=require("../src/main/assets/pvp_rank_moves.js");
assert.equal(api.megaSpeciesId("Mega Sableye"),"sableye_mega");
assert.equal(api.megaSpeciesId("Sableye (Mega)"),"sableye_mega");
assert.equal(api.megaSpeciesId("Mega Charizard X"),"charizard_mega_x");
assert.equal(api.megaSpeciesId("Charizard (Mega Y)"),"charizard_mega_y");
assert.equal(api.megaSpeciesId("Sableye"),"","ordinary species cannot use Mega rank");

// Two pinned PvPoke formats have different preferred second Charged Attacks.
// Super Max special extra from the Mega ranking is deliberately not conflated
// with regular C1/C2. It needs independent unlock/availability verification.
const gm={pokemon:[
 {speciesId:"sableye",speciesName:"Sableye",fastMoves:["SHADOW_CLAW"],
  chargedMoves:["FOUL_PLAY","POWER_GEM","DAZZLING_GLEAM"]},
 {speciesId:"sableye_mega",speciesName:"Sableye (Mega)",fastMoves:["SHADOW_CLAW"],
  chargedMoves:["FOUL_PLAY","POWER_GEM","DAZZLING_GLEAM"]}
 ],moves:[{moveId:"SHADOW_CLAW",name:"Shadow Claw",power:6,energyGain:8},
 {moveId:"FOUL_PLAY",name:"Foul Play",power:65,energy:40},
 {moveId:"POWER_GEM",name:"Power Gem",power:85,energy:50},
 {moveId:"DAZZLING_GLEAM",name:"Dazzling Gleam",power:90,energy:55}]};
const baseRows=[{speciesId:"sableye",moveset:["SHADOW_CLAW","FOUL_PLAY","POWER_GEM"]}];
const megaRows=[{speciesId:"sableye_mega",moveset:["SHADOW_CLAW","FOUL_PLAY","DAZZLING_GLEAM","NIGHT_SHADE_PLUS"]}];
assert.equal(api.fromData(baseRows,gm,"gl","Sableye").charged[1].id,"POWER_GEM");
assert.equal(api.fromData(megaRows,gm,"gl","sableye_mega").charged[1].id,"DAZZLING_GLEAM");
const originalFetch=global.fetch,calls=[];
global.fetch=async uri=>{
 const url=String(uri);calls.push(url);
 let value;
 if(url.includes("/rankings/mega/overall/rankings-1500.json"))value=megaRows;
 else if(url.includes("/rankings/all/overall/rankings-1500.json"))value=baseRows;
 else if(url.endsWith("/gamemaster.json"))value=gm;
 else if(url.endsWith("/moves.json")&&!url.includes("translations"))value=[
  {proto:"SHADOW_CLAW_FAST",moveId:1,type:8},
  {proto:"FOUL_PLAY",moveId:2,type:17},
  {proto:"POWER_GEM",moveId:3,type:6},
  {proto:"DAZZLING_GLEAM",moveId:4,type:18}];
 else if(url.includes("/translations/pt-br/moves.json"))value={
  move_1:"Garra Sombria",move_2:"Jogo Sujo",
  move_3:"Gema Poderosa",move_4:"Clarão Deslumbrante"};
 else throw Error("Unexpected external source "+url);
 return {ok:true,headers:{get:()=>null},text:async()=>JSON.stringify(value)};
};
async function run(){
 try{
  const m=await api.lookupMega("gl","Mega Sableye");
  assert.equal(m?.megaRecommendation,true);
  assert.equal(m?.format,"mega");
  assert.ok(m.source.includes("Mega Edition"));
  assert.equal(m.fast.name,"Garra Sombria");
  assert.deepEqual(m.charged.map(x=>x.name),["Jogo Sujo","Clarão Deslumbrante"]);
  const n=await api.lookup("gl","Sableye");
  assert.deepEqual(n.charged.map(x=>x.name),["Jogo Sujo","Gema Poderosa"]);
  assert.equal(n.megaRecommendation,undefined);
  const count=calls.length;
  assert.equal(await api.lookupMega("gl","Sableye"),null);
  assert.equal(calls.length,count,"normal form must not load Mega ranking");
  assert.ok(calls.some(x=>x.includes("rankings/mega/overall")));
  assert.ok(calls.some(x=>x.includes("rankings/all/overall")));

  // Exercise real card rendering: Mega's action cannot use the base lookup,
  // and a missing verified Mega result never masquerades as normal recommendation.
  const from=inline.indexOf("const psVerifiedMoveIcons=new Map()");
  const to=inline.indexOf("/* LT245: small",from);
  assert.ok(from>0&&to>from);
  const row={dataset:{league:"gl"},textContent:"GL IV #1 ↳ Sableye",children:[],
   appendChild(x){this.children.push(x)}};
  const pop={hidden:true,textContent:"",innerHTML:""};
  const document={
   getElementById(k){return k==="rankLine"?row:k==="movesPopover"?pop:null},
   createElement(tag){return {tag,textContent:"",type:"",title:"",style:{},
    setAttribute(){},isConnected:true,attrs:{}}}
  };
  let featured="Mega Sableye",req={normal:0,mega:0},megaResult=m;
  const win={psRankContext:{leagues:[{league:"gl",megas:[
     {rank:1,megaProjection:true}]}]},
   PokeSearchPvpRankMoves:{
    lookup:async()=>{req.normal++;return n},
    lookupMega:async()=>{req.mega++;return megaResult}
   }
  };
  const render=new Function("document","window","watchName","h","resizeEvolutionPanel",
   "getIdentity","getSpecies","getCardMoves","getLeague",
   inline.slice(from,to).replace(/detailIdentity/g,"getIdentity()")
   .replace(/currentRankSpecies/g,"getSpecies()")
   .replace(/currentCardMoves/g,"getCardMoves()")
   .replace(/activeRankLeague/g,"getLeague()")
   +"return renderRankOneMoves;")(
   document,win,"Sableye",String,()=>{} ,()=> "card-1",
   ()=>featured,()=> "Shadow Claw / Drain Punch",()=> "gl");
  render();const first=row.children.at(-1);
  await first.onclick();
  assert.equal(req.normal,0,"Mega card must never call regular rankings");
  assert.equal(req.mega,1);
  assert.ok(pop.innerHTML.includes("Megaedição · Ataques recomendados"));
  assert.ok(pop.innerHTML.includes("Clarão Deslumbrante"));
  assert.ok(!pop.innerHTML.includes("Gema Poderosa"));
  await first.onclick();
  assert.equal(pop.hidden,true,"repeated tap closes Mega moves panel");
  featured="Sableye";render();const second=row.children.at(-1);
  await second.onclick();
  assert.equal(req.normal,1);
  assert.ok(pop.innerHTML.includes("Gema Poderosa"));
  assert.ok(!pop.innerHTML.includes("Clarão Deslumbrante"));
  megaResult=null;featured="Mega Sableye";render();
  await row.children.at(-1).onclick();
  assert.ok(pop.innerHTML.includes("Megaedição indisponível"));
  assert.ok(!pop.innerHTML.includes("Gema Poderosa"));
  console.log("LT254 Mega PASS: distinct pinned format, Sableye C2, Mega X/Y names, no normal fallback, independent icon and close.");
 }finally{global.fetch=originalFetch;}
}
run().catch(e=>{global.fetch=originalFetch;console.error(e);process.exitCode=1});

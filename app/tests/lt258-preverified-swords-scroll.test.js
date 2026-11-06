"use strict";
// LT258 Samsung regression: sword badges must be sourced BEFORE a tap,
// and all possible moves must scroll in the parent card rather than two nested areas.
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets");
const html=fs.readFileSync(path.join(assets,"detail.html"),"utf8");
const inline=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(inline);new vm.Script(inline);
assert.match(html,/#movesPopover:not\(\[hidden\]\)\{max-height:none!important;overflow:visible!important/);
assert.match(html,/#movesPopover \.psAvailableMoveList\{max-height:none!important;overflow:visible!important/);
assert.ok(html.includes('popover.addEventListener("toggle"'));
assert.ok(html.includes('if(actionOpened)return;'),"click must freeze badge changes");
assert.ok(!html.includes('btn.textContent=hasLegacy?"⚔️":"⚡"'));
const api=require("../src/main/assets/pvp_rank_moves.js");
assert.equal(typeof api.getStatus,"function");
const originalFetch=global.fetch,requests=[];
const gm={pokemon:[
 {speciesId:"sableye",speciesName:"Sableye",fastMoves:["SHADOW_CLAW"],chargedMoves:["FOUL_PLAY","POWER_GEM"]},
 {speciesId:"sableye_mega",speciesName:"Sableye Mega",fastMoves:["SHADOW_CLAW"],chargedMoves:["FOUL_PLAY","POWER_GEM"]},
 {speciesId:"greninja",speciesName:"Greninja",fastMoves:["WATER_SHURIKEN"],chargedMoves:["SURF"],eliteMoves:["HYDRO_CANNON"]},
 {speciesId:"scorbunny",speciesName:"Scorbunny",fastMoves:["TACKLE"],chargedMoves:["FLAME_CHARGE"]}
 ],moves:[
 {moveId:"SHADOW_CLAW",name:"Shadow Claw"},
 {moveId:"FOUL_PLAY",name:"Foul Play"},
 {moveId:"POWER_GEM",name:"Power Gem"},
 {moveId:"WATER_SHURIKEN",name:"Water Shuriken"},
 {moveId:"HYDRO_CANNON",name:"Hydro Cannon"},
 {moveId:"SURF",name:"Surf"}
 ]};
const standard=[
 {speciesId:"sableye",moveset:["SHADOW_CLAW","FOUL_PLAY","POWER_GEM"]},
 {speciesId:"greninja",moveset:["WATER_SHURIKEN","HYDRO_CANNON","SURF"]}
];
const mega=[{speciesId:"sableye_mega",moveset:["SHADOW_CLAW","FOUL_PLAY","POWER_GEM"]}];
global.fetch=async url=>{
 const u=String(url);requests.push(u);
 const value=u.endsWith("/gamemaster.json")?gm:
  u.includes("/rankings/mega/overall/")?mega:
  u.includes("/rankings/all/overall/")?standard:null;
 if(!value)throw Error("Unexpected URL "+u);
 return {ok:true,headers:{get:()=>null},text:async()=>JSON.stringify(value)};
};
async function run(){
 try{
  const normal=await api.getStatus("gl","Sableye");
  const legacy=await api.getStatus("gl","Greninja");
  const megaBadge=await api.getStatus("gl","Mega Sableye",true);
  const unknown=await api.getStatus("gl","Scorbunny");
  assert.deepEqual([normal.icon,normal.legacy,normal.verified],["🗡️",false,true]);
  assert.deepEqual([legacy.icon,legacy.legacy,legacy.verified],["⚔️",true,true]);
  assert.deepEqual([megaBadge.icon,megaBadge.legacy],["🗡️",false]);
  assert.equal(unknown,null,"unranked pool has no confirmed recommended set");
  assert.ok(requests.every(u=>!u.includes("watwow")&&!u.includes("translations")),
   "fast precheck only reads pinned move IDs and Game Master");
  const from=inline.indexOf("const psVerifiedMoveIcons=new Map()");
  const to=inline.indexOf("/* LT245: small",from);
  assert.ok(from>=0&&to>from);
  const row={dataset:{league:"gl"},textContent:"GL IV #1 ↳ Sableye",
   children:[],appendChild(v){this.children.push(v)}};
  let handleToggle=null,resizes=0,identity="card-1",species="Sableye",opened=0;
  const pop={hidden:true,textContent:"",innerHTML:"",scrollTop:7,
   addEventListener(kind,fn){if(kind==="toggle")handleToggle=fn;}};
  const document={
   getElementById(id){return id==="rankLine"?row:id==="movesPopover"?pop:null},
   createElement(tag){return {tag,isConnected:true,textContent:"",type:"",
    title:"",style:{},dataset:{},setAttribute(){}}}
  };
  const win={psRankContext:{leagues:[]},PokeSearchPvpRankMoves:{
   getStatus:async (...args)=>api.getStatus(...args),
   lookup:async()=>{opened++;return {fast:{name:"Garra Sombria",type:"ghost",status:"normal"},
    charged:[{name:"Jogo Sujo",type:"dark",status:"normal"}],source:"PvPoke"}}
  }};
  const render=new Function("document","window","watchName","h","resizeEvolutionPanel",
   "getIdentity","getSpecies","getCardMoves","getLeague",
   inline.slice(from,to).replace(/detailIdentity/g,"getIdentity()")
    .replace(/currentRankSpecies/g,"getSpecies()")
    .replace(/currentCardMoves/g,"getCardMoves()")
    .replace(/activeRankLeague/g,"getLeague()")+"return renderRankOneMoves;")(
   document,win,"Sableye",String,()=>{resizes++;},
   ()=>identity,()=>species,()=> "Shadow Claw / Foul Play",()=> "gl");
  render();const btn=row.children.at(-1);
  assert.equal(btn.textContent,"⚔︎","neutral while the pinned data is loading");
  await Promise.resolve();await Promise.resolve();
  // A network/cache response can settle over several microtasks.
  for(let pending=0;pending<30;pending++)await Promise.resolve();
  assert.equal(btn.textContent,"🗡️","must become verified BEFORE tap");
  assert.equal(opened,0,"opening card must not open localized move details");
  await btn.onclick();assert.equal(btn.textContent,"🗡️");
  assert.equal(opened,1);
  assert.ok(pop.innerHTML.includes("Garra Sombria"));
  assert.equal(typeof handleToggle,"function");
  handleToggle({target:{matches:s=>s===".psAvailableMoveDetails"}});
  assert.ok(resizes>=2,"the native height is updated after expansion");
  render();assert.equal(row.children.at(-1).textContent,"🗡️",
   "cached verdict survives UI redraw");
  // Resolve a deferred precheck AFTER tapping: it must cache the answer,
  // but cannot change the currently tapped button.
  let settle;
  win.PokeSearchPvpRankMoves.getStatus=()=>new Promise(resolve=>{settle=resolve});
  species="New";identity="card-2";row.textContent="GL IV #1 ↳ New";
  render();const pending=row.children.at(-1);
  assert.equal(pending.textContent,"⚔︎");
  await pending.onclick();assert.equal(pending.textContent,"⚔︎");
  settle({verified:true,icon:"⚔️",title:"Contém legado"});
  await Promise.resolve();await Promise.resolve();
  assert.equal(pending.textContent,"⚔︎","no change after click");
  console.log("LT258 PASS: accurate pre-click ⚔️/🗡️, neutral unknown, no click mutation, single native card scroll");
 }finally{global.fetch=originalFetch;}
}
run().catch(e=>{global.fetch=originalFetch;console.error(e);process.exitCode=1;});

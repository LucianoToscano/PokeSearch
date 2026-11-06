"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),
 path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main/assets");
const raidJs=fs.readFileSync(path.join(root,"pve_raid_rank.js"),"utf8");
const html=fs.readFileSync(path.join(root,"detail.html"),"utf8");
const java=fs.readFileSync(path.join(__dirname,
 "../src/main/java/com/lucianotoscano/pokesearchoverlay/OtaAssets.java"),"utf8");
const builder=fs.readFileSync(path.join(__dirname,"../../scripts/build_ota_pack.py"),"utf8");
new vm.Script(raidJs);
const inline=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(inline);new vm.Script(inline);
assert.ok(html.includes('<script src="pve_raid_rank.js"></script>'));
assert.ok(html.includes('id="raidRow"')&&html.includes('id="raidPanel"'));
assert.ok(html.includes("loadRaidBeforeCapture(c)"));
assert.ok(html.includes('class="psRaidAnalysisLink"'),
 "Raid link must live inside existing PvP analysis");
assert.ok(html.includes("token!==psRaidToken||identity!==detailIdentity"),
 "stale responses must never overwrite another card");
assert.ok(html.includes('if(changed)loadRaidBeforeCapture(c)'),
 "pre-capture assessment runs on card opening, not on coordinates");
assert.ok(!raidJs.includes("coords")||raidJs.includes("No capture-coordinate lookup"));
assert.ok(java.includes('"pve_raid_rank.js"'));
assert.ok(builder.includes('"pve_raid_rank.js"'));
const index=[
 {dexNr:535,name:"Tympole"},{dexNr:536,name:"Palpitoad"},
 {dexNr:537,name:"Seismitoad"},{dexNr:94,name:"Gengar"},
 {dexNr:813,name:"Scorbunny"}
];
const pokemon=id=>id===535?{dexNr:535,name:"Tympole",
 primaryType:{type:"POKEMON_TYPE_WATER"}}:
 id===536?{dexNr:536,name:"Palpitoad",
 primaryType:{type:"POKEMON_TYPE_WATER"},secondaryType:{type:"POKEMON_TYPE_GROUND"}}:
 id===537?{dexNr:537,name:"Seismitoad",
 primaryType:{type:"POKEMON_TYPE_WATER"},secondaryType:{type:"POKEMON_TYPE_GROUND"}}:
 {dexNr:94,name:"Gengar",primaryType:{type:"POKEMON_TYPE_GHOST"}};
const rank=(dexNr,name,rank,variant=null)=>({
 dexNr,name,id:name.toUpperCase().replace(/ /g,"_"),
 formId:name.toUpperCase().replace(/ /g,"_"),
 quickMove:"TACKLE_FAST",cinematicMove:"SURF",
 dps:100-rank,tdo:200,er:100-rank,isElite:false,variant,
 variantName:variant==="mega"?"Mega "+name:null});
const water={type:{type:"POKEMON_TYPE_WATER",name:"Water"},rankings:[
 rank(537,"Seismitoad",1),rank(536,"Palpitoad",2),rank(535,"Tympole",3)]};
const ground={type:{type:"POKEMON_TYPE_GROUND",name:"Ground"},rankings:[
 rank(536,"Palpitoad",1),rank(537,"Seismitoad",2)]};
const ghost={type:{type:"POKEMON_TYPE_GHOST",name:"Ghost"},rankings:[
 rank(94,"Gengar",1,"mega"),rank(94,"Gengar",2)]};
const docs={"pokemon/index.json":index,
 "pokemon/535.json":pokemon(535),"pokemon/536.json":pokemon(536),
 "pokemon/537.json":pokemon(537),"pokemon/94.json":pokemon(94),
 "rankings/water.json":water,"rankings/ground.json":ground,"rankings/ghost.json":ghost};
let requestCount=0;
const fetched=async(url,options)=>{
 assert.ok(url.startsWith("https://s-tier-devs.github.io/pogo-db-api/api/"));
 assert.equal(options.credentials,"omit");
 const name=url.split("/api/")[1];
 requestCount++;if(!Object.hasOwn(docs,name))return {ok:false,status:404};
 return {ok:true,headers:{get:()=>null},text:async()=>JSON.stringify(docs[name])};
};
const mod={exports:{}};
new Function("window","module","fetch","AbortController",raidJs)(
 {},mod,fetched,undefined);
const raid=mod.exports;
async function run(){
 assert.deepEqual(raid.buildCandidates({name:"Tympole",costume_id:0},["Tympole","Palpitoad","Seismitoad"]).map(x=>x.name),
  ["Tympole","Palpitoad","Seismitoad"]);
 assert.deepEqual(raid.buildCandidates({name:"Tympole",costume_id:19},["Seismitoad"]).map(x=>x.name),
  ["Tympole"],"costume cannot assert that evolution is permitted");
 const gm={pokemon:[
  ["tympole","Tympole",98,78,137],
  ["palpitoad","Palpitoad",128,109,181],
  ["seismitoad","Seismitoad",188,150,233]
 ]};
 assert.deepEqual(raid.offlineAttack({name:"Tympole"},["Tympole","Palpitoad","Seismitoad"],gm),
  {name:"Seismitoad",attack:188},"offline preview prioritizes valid evolution");
 assert.deepEqual(raid.offlineAttack({name:"Tympole",costume:"Halloween"},["Seismitoad"],gm),
  {name:"Tympole",attack:98},"costume forbids inferred evolutions");
 assert.equal(raid.buildCandidates({name:"Tympole",costume:"None"},["Seismitoad"]).length,2);
 assert.equal(raid.grade(2),"Destaque");
 assert.equal(raid.grade(80),"Situacional");
 const captured={name:"Tympole",number:"#535",iv:"15/15/15"};
 const value=await raid.assess(captured,["Tympole","Palpitoad","Seismitoad"]);
 assert.equal(value.verified,true,JSON.stringify(value));
 assert.equal(value.best.rank,1);
 assert.equal(value.best.name,"Palpitoad");
 assert.equal(value.best.type,"ground");
 assert.equal(value.best.projected,true);
 assert.ok(value.note.includes("IV 15/15/15 de referência"));
 const prev=requestCount;
 const repeated=await raid.assess({...captured,iv:"0/14/15"},["Seismitoad"]);
 assert.equal(repeated.verified,true);
 assert.equal(repeated.best.rank,1,"Seismitoad is #1 Water in this pinned mock");
 assert.equal(requestCount,prev,"cache does not refetch shared public JSON");
 const noForm=await raid.assess({name:"Unrecognized",number:"#535"},[]);
 assert.equal(noForm.verified,false,"cannot assign a rank to an unidentified form");
 const megaRow=raid.exactRow(ghost,{name:"Gengar (Mega)",base:"Gengar",variant:"mega"},94);
 assert.equal(megaRow?.rank,1);
 assert.equal(raid.exactRow(ghost,{name:"Gengar",base:"Gengar",variant:"normal"},94)?.rank,2);
 assert.equal(raid.exactRow(ghost,{name:"Gengar (Mega X)",base:"Gengar",variant:"mega"},94),null,
  "Mega X cannot inherit the Mega plain rank");
 const long=raid.buildCandidates({name:"Tympole",costume:"Halloween"},["Seismitoad"]);
 assert.equal(long.length,1,"costume cannot silently become base evolution");
 console.log("LT259 PASS: pre-capture type rankings, evolution projection, exact forms, safe unknown, source cache and OTA parity");
}
run().catch(e=>{console.error(e);process.exitCode=1;});

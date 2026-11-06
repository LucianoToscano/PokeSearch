"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main/assets");
const html=fs.readFileSync(path.join(root,"detail.html"),"utf8");
const explorer=fs.readFileSync(path.join(root,"pvp_rank_explorer.js"),"utf8");
const begin=html.indexOf("function psRailChoices(payload){");
const end=html.indexOf("window.showEvolutionDetails=payload=>{",begin);
assert.ok(begin>=0&&end>begin);
const snippet=html.slice(begin,end);
new vm.Script(snippet);new vm.Script(explorer);
const choose=new Function(snippet+"return psRailChoices;")();
const payload={name:"Teddiursa",leagues:[
 {league:"gl",own:{rank:200,overallRank:500},evolutions:[
  {name:"Ursaluna",rank:12,overallRank:142,eligible:true},
  {name:"Mega Ursaluna",rank:1,overallRank:1,megaProjection:true,referenceOnly:true}]},
 {league:"ul",own:{rank:5,overallRank:220},evolutions:[]},
 {league:"ml",own:{rank:1,overallRank:311},evolutions:[]}]};
const choices=choose(payload);
assert.deepEqual(["gl","ul","ml"].map(k=>choices[k].classChoice.rank),[12,5,1]);
assert.equal(choices.gl.classChoice.name,"Ursaluna");
assert.equal(choices.gl.classChoice.evolves,true);
assert.equal(choices.gl.overallChoice.overallRank,142);
assert.equal(choices.ul.classChoice.evolves,false);
assert.ok(!Object.values(choices).some(x=>x.classChoice?.name==="Mega Ursaluna"));
assert.equal(choose({...payload,includePreviousEvolutions:false}).gl.classChoice.rank,200);
const invalid=choose({name:"Costume",leagues:[{league:"gl",
 own:{rank:999,eligible:false},evolutions:[{name:"Mega Costume",rank:1,referenceOnly:true}]},
 {league:"ul"},{league:"ml"}]});
assert.equal(invalid.gl.classChoice,null,"No false costume/Mega badges");
function node(name=""){
 return {tagName:name,className:"",children:[],dataset:{},hidden:false,
  setAttribute(k,v){this[k]=v},
  appendChild(x){this.children.push(x);return x},
  replaceChildren(){this.children=[]},
  remove(){},
  querySelector(s){return this.children.find(x=>x.className.split(" ").includes(s.slice(1)))||null},
  querySelectorAll(s){return this.children.filter(x=>x.className.split(" ").includes(s.slice(1)))}
 };
}
const rail=node("div"),doc={getElementById:id=>id==="rankLine"?rail:null,createElement:node};
const win={POKESEARCH_PVPOKE_OVERALL:{gl:[[1,"Ursaluna",142]],ul:[[1,"Teddiursa",220]],ml:[[1,"Teddiursa",311]]}};
const calls=[];
const render=new Function("document","window","activeRankLeague","currentRankSpecies",
 "resizeEvolutionPanel","toggleRaidDetails","openPvpRankExplorer",
 "let psRaidReport=null,watchName='Teddiursa',psSelectedEvaluationLeague='',"+
 "evolutionExpanded=false,psActiveAnalysisKey='';\n"+
 snippet+"return psRenderFiveRankRail;")(
 doc,win,"gl","",()=>{},()=>{calls.push("raid");return true;},
 (event,button)=>{calls.push("overall:"+button.dataset.psLeague);return true});
assert.equal(render(payload),true);
assert.equal(rail.children.length,5,"Five shortcuts, no global attacks action");
assert.deepEqual(rail.children.map(x=>x.dataset.psRail),["raid","gl","ul","ml","overall"]);
assert.deepEqual(rail.children.map(x=>x.querySelector(".psRailNumber")?.textContent),
 ["—","#12","#5","#1","#142"]);
assert.equal(rail.children[1].querySelector(".psRailEvolve").textContent,"↳");
assert.equal(rail.children[1].dataset.psName,"Ursaluna");
assert.equal(rail.children[4].dataset.psRailOverall,"true");
assert.ok(rail.children.every(x=>x.querySelector(".psRailIcon")?.src.includes("-lt268.png")));
assert.equal(rail.querySelector(".psMovesAction"),null,"Attacks MUST NOT be on initial rail");
assert.equal(win.psRailOverallChoices[1].rank,220);
rail.children[0].onclick({});
rail.children[4].onclick({});
assert.deepEqual(calls,["raid","overall:gl"]);
assert.ok(explorer.includes("function switchOverallLeague(league){"));
assert.ok(explorer.includes("data-ps-league-choice"));
assert.ok(explorer.includes('"Rank Geral · "+safe(LIGAS[s.league])'));
assert.ok(explorer.includes("opts?.railKey||"));
const dock=fs.readFileSync(path.join(root,"dock.html"),"utf8");
assert.ok(!dock.includes("psRailChoices"),"Pokeballs and Modos are independent");
const req=JSON.parse(fs.readFileSync(path.join(__dirname,"../../release/official-request.json"),"utf8"));
assert.equal(req.code,54475);
console.log("LT271 PASS: raid + GL/UL/ML/RG shortcuts, attacks only nested in league, version gate");

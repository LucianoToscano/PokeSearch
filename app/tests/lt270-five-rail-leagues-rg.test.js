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
const events=[];
const render=new Function("document","window","activeRankLeague","currentRankSpecies",
 "renderRankOneMoves","resizeEvolutionPanel","openPvpRankExplorer",
 snippet+"return psRenderFiveRankRail;")(
 doc,win,"gl","",()=>{rail.children=rail.children.filter(x=>x.className!=="psMovesAction");
  const sword=node("button");sword.className="psMovesAction";sword.textContent="⚔︎";rail.appendChild(sword)},()=>{},
 (event,button)=>{events.push([button.dataset.psKind,button.dataset.psLeague,button.dataset.psName]);return true});
assert.equal(render(payload),true);
assert.equal(rail.children.length,5);
assert.equal(rail.children[0].children[1].textContent,"#12");
assert.equal(rail.children[0].children[2].textContent,"↳");
assert.equal(rail.children[1].children[1].textContent,"#5");
assert.equal(rail.children[2].children[1].textContent,"#1");
assert.equal(rail.children[3].children[1].textContent,"#142");
assert.equal(rail.children[3].dataset.psRailOverall,"true");
assert.equal(win.psRailOverallChoices.length,3);
assert.equal(win.psRailOverallChoices[1].rank,220);
rail.children[1].onclick({});
rail.children[3].onclick({});
assert.deepEqual(events,[["class","ul","Teddiursa"],["overall","gl","Ursaluna"]]);
assert.ok(explorer.includes("function switchOverallLeague(league){"));
assert.ok(explorer.includes("data-ps-league-choice"));
assert.ok(explorer.includes('"Rank Geral · "+safe(LIGAS[s.league])'));
assert.ok(explorer.includes("opts?.railKey||"));
const dock=fs.readFileSync(path.join(root,"dock.html"),"utf8");
assert.ok(!dock.includes("psRailChoices"),"Pokeballs and Modos are independent");
const req=JSON.parse(fs.readFileSync(path.join(__dirname,"../../release/official-request.json"),"utf8"));
assert.equal(req.code,54474);
console.log("LT270 PASS: GL/UL/ML/RG/attacks, verified 5-button geometry, evolution, General league selector");

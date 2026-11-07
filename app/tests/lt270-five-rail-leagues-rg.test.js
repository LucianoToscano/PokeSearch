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
const family=require("../src/main/assets/pvp_family_catalog.js");
assert.equal(family.evolutionSteps("Cyndaquil","Quilava"),1);
assert.equal(family.evolutionSteps("Cyndaquil","Typhlosion"),2);
assert.equal(family.evolutionSteps("Teddiursa","Ursaluna"),2);
assert.equal(family.evolutionSteps("Ursaluna","Teddiursa"),null);
assert.equal(family.evolutionSteps("Teddiursa","Teddiursa"),0);
assert.equal(family.evolutionSteps("Teddiursa","Ursaluna (Mega)"),null);
assert.equal(family.evolutionSteps("Pikachu (Singapore 2026)","Raichu"),null);
const win={PokeSearchPvpFamilyCatalog:family,
 POKESEARCH_PVPOKE_OVERALL:{gl:[[1,"Ursaluna",142]],ul:[[1,"Teddiursa",220]],ml:[[1,"Teddiursa",311]]}};
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
const evoMark=rail.children[1].querySelector(".psRailEvolve");
assert.equal(evoMark.tagName,"span");
assert.equal(evoMark.dataset.steps,"2");
assert.equal(evoMark.children.length,2);
assert.ok(evoMark.children.every(x=>x.className==="psRailChevron"));
assert.equal(evoMark["aria-hidden"],"true");
assert.equal(rail.children[1].children[0].textContent,"#12","rank number remains first");
assert.equal(rail.children[1].children[1].src,"ui-icons/ps-gl-lt268.png","flag remains centered original asset");
assert.equal(rail.children[2].querySelector(".psRailEvolve"),null,"current species does not get evolution icon");
assert.equal(rail.children[4].querySelector(".psRailEvolve").dataset.steps,"2");
assert.equal(rail.children[1].dataset.psEvolutionSteps,"2");
assert.equal(rail.children[2].dataset.psEvolutionSteps,"0");
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
assert.ok(explorer.includes('data-ps-act="league-menu"')&&explorer.includes('data-ps-act="league-pick"'),"tap-friendly choice replaces broken Android native picker");
assert.ok(explorer.includes('data-ps-act="filter-pick"'));
assert.ok(explorer.includes('psrTopControls')&&explorer.includes('repeat(3,minmax(0,1fr))'));
assert.ok(!explorer.includes('class="psrControls psrActions"'),"remove old export actions only");
assert.ok(html.indexOf('id="info"')>html.indexOf('id="evolutions"'),"Captured attacks and location below expanding panels");
assert.ok(explorer.includes('s.kind==="class"?"Rank Classe · "+safe(LIGAS[s.league]):"Rank Geral"'));
assert.ok(explorer.includes("opts?.railKey||"));
const dock=fs.readFileSync(path.join(root,"dock.html"),"utf8");
assert.ok(!dock.includes("psRailChoices"),"Pokeballs and Modos are independent");
const req=JSON.parse(fs.readFileSync(path.join(__dirname,"../../release/official-request.json"),"utf8"));
// This is a historical LT270/273 UI contract: do not pin future official releases
// to the LT273 versionCode. Release monotonicity is enforced by official preflight.
assert.ok(Number.isSafeInteger(req.code) && req.code >= 54477,
 "Official release request must not regress below LT273");
const crypto=require("node:crypto");
const art=fs.readFileSync(path.join(root,"ui-icons/ps-evolution-lt272.png"));
assert.ok(art.subarray(0,8).equals(Buffer.from("89504e470d0a1a0a","hex")));
assert.equal(crypto.createHash("sha256").update(art).digest("hex"),
 "67a26f134fbe41a38d75bd4a0e13de526379a029dc904a7cd0e26701c7c78aa5");
assert.match(html,/right:5px!important;bottom:5px!important/);
assert.match(html,/width:15px!important;height:15px!important/);
assert.ok(explorer.includes("context.PokeSearchEvolutionBadge?.(original,opts.name,canEvolve)"));
assert.match(html,/window.PokeSearchEvolutionBadge=/);
assert.match(html,/height:39px!important;min-height:39px!important/);
assert.match(html,/width:21px!important;height:21px!important/);
// LT301: show 0 / 1 / 2 only. A 3-step response cannot be truncated
// into a misleading two-step claim.
const originalSteps=win.PokeSearchPvpFamilyCatalog;
win.PokeSearchPvpFamilyCatalog={evolutionSteps:(from,to,max)=>{
 assert.equal(max,2);
 return to==="Ursaluna"?3:null;
}};
assert.equal(render(payload),true);
assert.equal(rail.children[1].querySelector(".psRailEvolve"),null);
assert.equal(rail.children[1].dataset.psEvolutionSteps,"0");
win.PokeSearchPvpFamilyCatalog=originalSteps;
assert.equal(render(payload),true);
assert.equal(rail.children[1].querySelector(".psRailEvolve").children.length,2);
assert.equal(family.evolutionSteps("Cyndaquil","Quilava",2),1);
assert.equal(family.evolutionSteps("Cyndaquil","Typhlosion",2),2);
assert.equal(family.evolutionSteps("Cyndaquil","Cyndaquil",2),0);
console.log("LT301 PASS: five ranks, only 0/1/2 exact evolution steps and no 3-step badge");

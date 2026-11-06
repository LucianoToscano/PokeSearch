"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets");
const detail=fs.readFileSync(path.join(assets,"detail.html"),"utf8");
const dock=fs.readFileSync(path.join(assets,"dock.html"),"utf8");
const gm=fs.readFileSync(path.join(assets,"pvpoke-iv-gamemaster.js"),"utf8");
const win={};new Function("window",gm)(win);
const master=win.POKESEARCH_PVP_IV_DATA;
assert.ok(master&&master.pokemon.length>900);
for(const m of detail.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
 new vm.Script(m[1]);
const expr=(text,a,b)=>{const i=text.indexOf(a),j=text.indexOf(b,i);
 assert.ok(i>=0&&j>i,a);return text.slice(i,j)};
const evolutionList=expr(dock,"const PVP_EVO_LINKS=Object.freeze(","const pvpEvolutionGraph=");
const links=new Function(evolutionList+"return PVP_EVO_LINKS;")();
assert.ok(links.some(x=>x[0]==="Teddiursa"&&x[1]==="Ursaring"));
assert.ok(links.some(x=>x[0]==="Ursaring"&&x[1]==="Ursaluna"));
const lower=s=>String(s||"").trim().toLowerCase();
const byName=new Map(master.pokemon.map(x=>[lower(x[1]),x]));
const graph=new Map();for(const [a,b] of links){
 const key=lower(a);if(!graph.has(key))graph.set(key,[]);
 graph.get(key).push(b);
}
const mega=new Map();
for(const row of master.pokemon){
 const m=String(row[1]).match(/^(.+) \(Mega(?: ([XY]))?\)$/);
 if(!m)continue;
 const key=lower(m[1]);if(!mega.has(key))mega.set(key,[]);
 mega.get(key).push({name:row[1]});
}
const familySource=expr(dock,"const pvpFamilyReverse=new Map();","// Country code comes ONLY");
const calcFamily=new Function("PVP_EVO_LINKS","speciesKey","PVP_IV_GAME_MASTER",
 "safePvpSpeciesKey","ivSpeciesByName","pvpEvolutionGraph","cosmeticPvpIdentity","megaFormsByBase",
 familySource+"return pvpVerifiedCalculatorFamily;")(
 links,lower,master,card=>lower(card.name),byName,graph,()=>false,mega);
const ted=calcFamily({name:"Teddiursa"});
assert.deepEqual(ted,["Teddiursa","Ursaring","Ursaluna"]);
assert.equal(ted.some(x=>/mega/i.test(x)),false,"Teddiursa family has no Mega in pinned Game Master");
assert.ok(calcFamily({name:"Gastly"}).includes("Gengar (Mega)"),
 "real Mega is exposed when present for a family stage");
// Verify four independent click targets and automatic color for GL/UL/ML.
const script=detail.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const source=expr(script,"function closePvpRankAlternates(){","window.showEvolutionDetails=payload=>");
const make=tag=>({tag,children:[],dataset:{},attrs:{},textContent:"",className:"",title:"",hidden:true,
 setAttribute(k,v){this.attrs[k]=String(v)},
 appendChild(x){this.children.push(x);this.textContent+=x.textContent||"";},
 replaceChildren(){this.children=[];this.textContent=""},
 querySelector(){return null}});
const line=make("div"),alt=make("div");
const doc={getElementById:id=>id==="rankLine"?line:id==="psRankAlternates"?alt:null,createElement:make};
const calls=[];
const f=new Function("document","window","activeRankLeague",
 "currentRankSpecies","openPvpRankExplorer","openPvpAnalysisForSpecies",
 "renderRankOneMoves","resizeEvolutionPanel",
 source+"return updateVisiblePvPRank;")(
 doc,{},"gl","Teddiursa",(e,x)=>{calls.push(["rank",x.dataset.psKind,x.dataset.psName]);return true},
 (e,x)=>{calls.push(["analysis",x.dataset.psName]);return true},
 ()=>{calls.push(["moves"]);},()=>{});
const sample={name:"Teddiursa",searchLeague:"gl",searchRankLimit:1,
 leagues:[
  {league:"gl",own:{rank:1000,overallRank:360},evolutions:[
   {name:"Ursaring",rank:18,overallRank:387},
   {name:"Ursaluna",rank:1,overallRank:163}]},
  {league:"ul",own:{rank:900},evolutions:[]},
  {league:"ml",own:{rank:900},evolutions:[]}]
};
assert.equal(f(sample),true);
assert.deepEqual(line.children.slice(0,3).map(x=>x.textContent),
 ["GL IV #1","↳ Ursaluna","RG #163"]);
line.children[0].onclick({});
line.children[1].onclick({});
line.children[2].onclick({});
assert.deepEqual(calls.filter(x=>x[0]!=="moves").slice(0,3),[
 ["rank","class","Ursaluna"],["analysis","Ursaluna"],
 ["rank","overall","Ursaluna"]]);
assert.ok(detail.includes('btn.className="psMovesAction"')||
 detail.includes('btn.classList.add("psMovesAction")'));
assert.ok(detail.includes('btn.onclick=async()=>'));
// AUTO highlight ML #1 only if no top IV in GL/UL (no manufactured league).
const fAuto=new Function("document","window","activeRankLeague",
 "currentRankSpecies","openPvpRankExplorer","openPvpAnalysisForSpecies",
 "renderRankOneMoves","resizeEvolutionPanel",
 source+"return updateVisiblePvPRank;")(
 doc,{},"","Teddiursa",()=>{},()=>{},()=>{},()=>{});
const ml={...sample,searchLeague:null,searchRankLimit:null,leagues:[
 {league:"gl",own:{rank:123},evolutions:[]},
 {league:"ul",own:{rank:79},evolutions:[]},
 {league:"ml",own:{rank:1,overallRank:240},evolutions:[]}]};
assert.equal(fAuto(ml),true);
assert.equal(line.children[0].textContent,"ML IV #1");
assert.equal(line.children[1].textContent,"Atual");
assert.equal(line.children[2].textContent,"RG #240");
for(const file of ["ps-gl-lt268.png","ps-ul-lt268.png","ps-ml-lt268.png"])
 assert.ok(detail.includes('src="ui-icons/'+file+'"'),"correct badge for PvP league");
assert.ok(detail.includes('src="ui-icons/mega-symbol.png"'));
// CP/level simulator operates independent of the PvP filter and uses
// full trusted family payload to navigate Teddiursa, Ursaring, Ursaluna.
const begin=script.indexOf("/* LT244: zero-cost contextual stats actions.");
const end=script.indexOf("const item=(k,v)=>",begin);
assert.ok(begin>=0&&end>begin);
const elems={
 psMetricPanel:{hidden:true,innerHTML:"",querySelector(){return true}},
 psCpForm:{value:"teddiursa"},psCpLevel:{value:"20"},
 psCpLevelValue:{textContent:""},psCpTargetCp:{value:"1500"},
 psCpSimResult:{innerHTML:"",textContent:""}
};
const simulator=new Function("document","window","h",
 "activeRankLeague","pvpFormsForLeague","resizeEvolutionPanel",
 script.slice(begin,end)+
 "return {setCard:x=>metricCard=x,variants:psCpVariants,controls:psCpControls,update:updatePvpCpSimulator,step:stepPvpCpForm,cp:psCpAt,target:psCpApplyTarget};")(
 {getElementById:id=>elems[id]||null},win,s=>String(s),"gl",()=>[],()=>{});
win.psRankContext={name:"Teddiursa",iv:"15/15/14",familyForms:ted,
 leagues:[{league:"gl",own:{rank:1}},{league:"ul"},{league:"ml"}]};
simulator.setCard({name:"Teddiursa",iv:"15/15/14",ivValid:true,level:20,cp:756});
assert.deepEqual(simulator.variants().map(x=>x[1]),["Teddiursa","Ursaring","Ursaluna"]);
assert.ok(simulator.controls().includes('onclick="stepPvpCpForm(1)"'));
assert.ok(simulator.controls().includes('onclick="psCpApplyTarget()"'));
assert.equal(simulator.update(),true);
const before=elems.psCpSimResult.innerHTML;
assert.equal(simulator.step(1),true);
assert.equal(elems.psCpForm.value,"ursaring");
assert.notEqual(elems.psCpSimResult.innerHTML,before);
assert.equal(simulator.step(1),true);
assert.equal(elems.psCpForm.value,"ursaluna");
assert.equal(simulator.target(),true);
assert.ok(/PC-alvo 1500/.test(elems.psCpSimResult.innerHTML));
assert.ok(detail.includes(".psCpFormStepper"));
console.log("LT249: four independently clickable PvP chips, auto GL/UL/ML, exact Mega emblem, full Teddiursa family CP simulator PASS");

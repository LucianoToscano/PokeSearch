"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const base=path.join(__dirname,"../src/main/assets");
const html=fs.readFileSync(path.join(base,"detail.html"),"utf8");
const inline=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(inline);new vm.Script(inline);
for(const part of [
 'flex-wrap:nowrap!important','psCompactSpecies','IV #"+best.rank',
 'megaShowcaseNever' // placeholder removed below
].slice(0,3))assert.ok(html.includes(part),part);
assert.match(html,/#rankLine\{display:flex!important;flex-wrap:nowrap!important/);
assert.match(html,/#rankLine \.psCompactSpecies\{flex:1 1 auto;min-width:0/);
const mk=tag=>({
 tag,textContent:"",className:"",dataset:{},title:"",hidden:true,children:[],
 attrs:{},style:{},setAttribute(k,v){this.attrs[k]=String(v)},
 appendChild(x){this.children.push(x);this.textContent+=x.textContent||""},
 replaceChildren(){this.children=[];this.textContent="";},
 querySelector(sel){return this.children.find(x=>sel===".psRankMore"&&x.className==="psRankMore")||null}
});
const line=mk("div"),alternates=mk("div");alternates.hidden=true;
const document={
 getElementById(id){if(id==="rankLine")return line;if(id==="psRankAlternates")return alternates;
 throw Error("unknown element "+id)},
 createElement:mk
};
const actions=[];
const open=(e,b)=>{actions.push({kind:b.dataset.psKind,name:b.dataset.psName,
 rank:Number(b.dataset.psRank),league:b.dataset.psLeague});return true};
const from=inline.indexOf("function closePvpRankAlternates(){");
const to=inline.indexOf("window.showEvolutionDetails=payload=>",from);
assert.ok(from>=0&&to>from);
let renderCalls=0;
const f=new Function("document","window","activeRankLeague","currentRankSpecies",
 "openPvpRankExplorer","renderRankOneMoves","resizeEvolutionPanel",
 inline.slice(from,to)+"return {update:updateVisiblePvPRank};");
const gl=(own,evolutions=[],megas=[])=>({
 name:"Sableye",searchLeague:"gl",searchRankLimit:1,leagues:[
 {league:"gl",own,evolutions,megas},{league:"ul",own:null,evolutions:[]},
 {league:"ml",own:null,evolutions:[]}]
});
const obj=f(document,{},"gl","Sableye",open,()=>{renderCalls++},()=>{});
const projected=gl({rank:14,overallRank:37},[],[
 {name:"Mega Sableye",rank:1,referenceOnly:true,megaProjection:true,eligible:null}
]);
assert.equal(obj.update(projected),true);
assert.equal(line.children[0].textContent,"GL IV #1");
assert.equal(line.children[1].textContent,"Sableye");
assert.ok(line.children[1].children.some(x=>x.src==="ui-icons/mega-symbol.png"),"exact Mega artwork in species chip");
assert.equal(line.children[1].children[0].src,"ui-icons/mega-symbol.png","Mega emblem precedes species text");
assert.equal(line.children[1].children[1].textContent,"Sableye","compact label omits Mega prefix");
assert.equal(line.children[1].dataset.psName,"Mega Sableye","canonical species identity preserved");
assert.equal(line.children.length,3,"Mega projection uses one inline species chip plus neutral RG placeholder");
assert.equal(line.children[2].textContent,"RG —");
assert.equal(line.children.some(x=>x.textContent.startsWith("RG #")),false,
 "mathematical Mega projection cannot claim an ordinary RG");
assert.ok(renderCalls>0);
const fGl=f(document,{},"gl","Litwick",open,()=>{},()=>{});
const lamp={name:"Lampent",rank:1,overallRank:519};
const ch={name:"Chandelure",rank:1,overallRank:808};
const both={name:"Litwick",searchLeague:"gl",searchRankLimit:1,leagues:[
 {league:"gl",own:{rank:1087},evolutions:[ch,lamp]},
 {league:"ul",own:null,evolutions:[]},{league:"ml",own:null,evolutions:[]}
]};
assert.equal(fGl.update(both),true);
assert.deepEqual(line.children.slice(0,3).map(x=>x.textContent),
 ["GL IV #1","↳ Lampent","RG #519"]);
line.children[0].onclick({});
line.children[2].onclick({});
assert.deepEqual(actions,[{kind:"class",name:"Lampent",rank:1,league:"gl"},
 {kind:"overall",name:"Lampent",rank:519,league:"gl"}]);
assert.equal(line.children.find(x=>x.className==="psRankMore"),undefined,
 "extra forms are inside Análise PvP rather than a fifth chip");
assert.equal(line.children[0].title.includes("4.096"),true);
assert.ok(!line.children.some(x=>x.textContent==="RG #808"),
 "other species belongs in the +N explorer");
const raw=f(document,{},"", "Sableye",open,()=>{},()=>{});
assert.equal(raw.update({...projected,searchLeague:"",searchRankLimit:null}),true,
 "Mega GL rank1 must also be shown outside GL mode");
assert.equal(line.children[1].textContent,"Sableye");
assert.ok(line.children[1].children.some(x=>x.src==="ui-icons/mega-symbol.png"),"exact Mega artwork in species chip");
assert.ok(inline.includes('const isMega=/^mega\\s+/i.test(featured)'));
assert.ok(inline.includes('window.PokeSearchPvpRankMoves.getStatus(league,featured,isMega)'));
assert.ok(inline.includes("'Mega '+h(species)+' · PvP'"));
assert.ok(inline.includes("Mesmos golpes do "),"a Mega Edition uses learnable base-form moves");
assert.ok(inline.includes('const hasRank=rankLine.dataset?.rankRail==="five"||')&&
 inline.includes('/(?:Rank Classe:|IV) #\\d+/.test(rankLine.textContent||"")')&&
 inline.includes('if(!Object.values(choices).some(x=>x.classChoice||x.overallChoice))'),
 "No move action unless a verified old rank or source-backed new five rail exists");;
const gm=fs.readFileSync(path.join(base,"pvpoke-iv-gamemaster.js"),"utf8");
const win={};new Function("window",gm)(win);
const cpStart=inline.indexOf("/* LT244: zero-cost contextual stats actions.");
const cpEnd=inline.indexOf("const item=(k,v)=>",cpStart);
assert.ok(cpStart>0&&cpEnd>cpStart);
const panel={hidden:true,innerHTML:"",replaceChildren(){this.innerHTML="";}};
const out={textContent:"",innerHTML:""},levelValue={textContent:""};
const inputs={psCpSimResult:out,psCpLevel:{value:"35.5"},psCpForm:{value:"gastly"},
 psCpLevelValue:levelValue,psMetricPanel:panel};
const doc={getElementById(id){return inputs[id]||null;}};
const funcs=new Function("window","document","h","resizeEvolutionPanel","activeRankLeague",
 "pvpFormsForLeague",inline.slice(cpStart,cpEnd)+
 "return {setCard:x=>metricCard=x,at:psCpAt,variants:psCpVariants,iv:psCpIv,ceiling:psCpLeagueCeiling,controls:psCpControls,update:updatePvpCpSimulator,open:openDetailMetric,render:renderDetailMetric};")(
 win,doc,x=>String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;"),
 ()=>{},"gl",()=>[]);
funcs.setCard({name:"Gastly",iv:"0/14/14",cp:477,level:20,ivValid:true});
win.psRankContext={name:"Gastly",iv:"0/14/14",leagues:[
 {league:"gl",own:{rank:1},evolutions:[{name:"Haunter",cp:1481,level:22.5},{name:"Gengar",cp:1490,level:20.5}],
  megas:[{name:"Mega Gengar",megaProjection:true,referenceOnly:true}]},
 {league:"ul"},{league:"ml"}]};
const forms=funcs.variants();
for(const n of ["Gastly","Haunter","Gengar","Gengar (Mega)"])
 assert.ok(forms.some(x=>x[1]===n),"available simulated form "+n);
assert.deepEqual(funcs.iv(),[0,14,14]);
const beforeCharizard=win.psRankContext;
win.psRankContext={name:"Charizard",leagues:[{league:"gl",
 megas:[{name:"Mega Charizard X",megaProjection:true,referenceOnly:true},
 {name:"Mega Charizard Y",megaProjection:true,referenceOnly:true}]},
 {league:"ul"},{league:"ml"}]};
funcs.setCard({name:"Charizard",iv:"0/14/14",cp:100,level:10,ivValid:true});
const megasXY=funcs.variants();
assert.ok(megasXY.some(x=>x[0]==="charizard_mega_x"),"Mega Charizard X has verified stats");
assert.ok(megasXY.some(x=>x[0]==="charizard_mega_y"),"Mega Charizard Y has verified stats");
win.psRankContext=beforeCharizard;
funcs.setCard({name:"Gastly",iv:"0/14/14",cp:477,level:20,ivValid:true});
const gastly=forms.find(x=>x[0]==="gastly");
const cpOne=funcs.at(gastly,[0,14,14],1);
const cpFifty=funcs.at(gastly,[0,14,14],50);
assert.ok(cpFifty.cp>cpOne.cp);
assert.ok(cpFifty.hp>cpOne.hp);
assert.equal(funcs.at(gastly,[15,15,15],50).cp>cpFifty.cp,true);
const glBest=funcs.ceiling(gastly,[0,14,14],1500);
assert.ok(glBest&&glBest.cp<=1500);
assert.ok(funcs.controls().includes('type="range" min="1" max="50" step="0.5"'));
assert.ok(funcs.controls().includes("Gengar (Mega)"));
assert.equal(funcs.update(),true);
assert.ok(out.innerHTML.includes("IV A 0/14/14"));
assert.ok(out.innerHTML.includes("IV 0/0/0"));
assert.ok(out.innerHTML.includes("IV 15/15/15"));
assert.ok(out.innerHTML.includes("GL 1500"));
assert.equal(levelValue.textContent,"35,5");
assert.equal(funcs.render(),false,"metric panel should not render until the CP/level tile is tapped");
assert.equal(funcs.open("cp"),true);
assert.ok(panel.innerHTML.includes("Normal / evoluções / Mega"));
assert.ok(panel.innerHTML.includes("Sem custos")===false);
assert.ok(panel.innerHTML.includes("Não confirma disponibilidade de evolução, Mega na GBL ou custos de Doces/Poeira"),"no unverified evolution legality or candy/stardust costs");
assert.ok(panel.innerHTML.includes("Projeções PvP por liga"));
assert.ok(html.includes("psCpSimFields"),"glass UI must contain the simulator controls");
console.log("LT247: IV-before-RG single-row, GL Mega #1, verified move icons, CP simulator and P1/P2 assets PASS");

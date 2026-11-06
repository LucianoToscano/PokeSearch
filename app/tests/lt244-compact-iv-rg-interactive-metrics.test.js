"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const html=fs.readFileSync(path.join(__dirname,"../src/main/assets/detail.html"),"utf8");
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);new vm.Script(script);
const a=script.indexOf("function updateVisiblePvPRank(payload){");
const b=script.indexOf("window.showEvolutionDetails=payload=>",a);
assert.ok(a>=0&&b>a);
const created=[];
const rankLine={
 hidden:true,title:"",dataset:{},textContent:"",children:[],
 replaceChildren(){this.children=[];this.textContent="";},
 appendChild(v){this.children.push(v);this.textContent+=v.textContent;},
};
const panel={hidden:true,innerHTML:"",replaceChildren(){this.innerHTML="";}};
const document={
 getElementById(id){if(id==="rankLine")return rankLine;if(id==="psMetricPanel")return panel;throw Error("unexpected "+id);},
 createElement(tag){const v={tag,dataset:{},textContent:"",setAttribute(key,value){this[key]=value;}};created.push(v);return v;}
};
const opened=[];
const window={PokeSearchRankExplorer:{open(options){opened.push(options);return true;}},
 psRankContext:{name:"Greavard",iv:"1/14/15",leagues:[
  {league:"gl",own:{name:"Greavard",rank:989,cp:1010,level:50},evolutions:[
   {name:"Houndstone",rank:1,overallRank:653,cp:1500,level:22.5}]},
  {league:"ul",own:{rank:989},evolutions:[{name:"Houndstone",rank:2,overallRank:502,cp:2498,level:45.5}]},
  {league:"ml",own:{rank:989},evolutions:[]}
 ]}
};
let rankOpened=0;
function explorer(event,button){
 event?.preventDefault?.();event?.stopPropagation?.();
 rankOpened++;return window.PokeSearchRankExplorer.open({
 kind:button.dataset.psKind,name:button.dataset.psName,
 league:button.dataset.psLeague,rank:Number(button.dataset.psRank)
 });
}
const hook=new Function("document","window","activeRankLeague","pvpFormsForLeague","openPvpRankExplorer",
 "renderRankOneMoves",script.slice(a,b)+"return updateVisiblePvPRank;")(
 document,window,"gl",()=>[],explorer,()=>{});
const ctx=window.psRankContext;
assert.equal(hook(ctx),true);
assert.equal(rankLine.children[0].textContent,"GL IV #1","League and IV form a single clickable button");
assert.equal(rankLine.children[1].textContent,"↳ Houndstone");
const badge=rankLine.children.find(x=>x.className==="psCompactOverall psRankOpen");
assert.ok(badge,"valid PvPoke species RG is a separate button");
assert.equal(badge.textContent,"RG #653");
const classButton=rankLine.children.find(x=>x.className==="psCompactIv psRankOpen psLeagueIv");
assert.ok(classButton&&classButton.textContent==="GL IV #1","IV ranking remains independently clickable");
assert.equal(badge.dataset.psKind,"overall");
assert.equal(badge.dataset.psName,"Houndstone");
assert.equal(badge.dataset.psLeague,"gl");
assert.equal(badge.dataset.psRank,"653");
assert.ok(badge.title.includes("Rank Geral"));
assert.equal(badge.onclick({preventDefault(){},stopPropagation(){}}),true);
assert.equal(rankOpened,1);
assert.deepEqual(opened[0],{kind:"overall",name:"Houndstone",league:"gl",rank:653});
rankLine.hidden=true;
assert.equal(hook({...ctx,leagues:[
 {league:"gl",own:{rank:1,overallRank:85},evolutions:[]},
 {league:"ul"},{league:"ml"}
]}),true);
assert.equal(rankLine.children[1].textContent,"Atual");
assert.equal(rankLine.children[2].textContent,"RG #85");
rankLine.hidden=true;
assert.equal(hook({...ctx,leagues:[
 {league:"gl",own:{rank:1,overallRank:null},evolutions:[]},
 {league:"ul"},{league:"ml"}
]}),true);
assert.equal(rankLine.children.length,3,"three slots with neutral unverified RG placeholder");
assert.equal(rankLine.children[2].textContent,"RG —");
assert.equal(rankLine.children[2].disabled,true);
assert.match(html,/#rankLine \.psCompactOverall\{[\s\S]*?cursor:pointer/);
assert.match(html,/#rankLine \.psRankLabel\{overflow:visible!important;text-overflow:clip!important/);
// The inline card retains a click target to the 4,096 local IV rankings.
assert.ok(script.includes('iv.onclick=event=>openPvpRankExplorer(event,iv)'));
// IV / CP / Level open contextual actions only when tapped.
const x=script.indexOf("/* LT244: zero-cost contextual stats actions.");
const y=script.indexOf("const item=(k,v)=>",x);
assert.ok(x>=0&&y>x);
let resized=0;
const esc=x=>String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;");
const metrics=new Function("document","window","h","activeRankLeague","pvpFormsForLeague","resizeEvolutionPanel",
 script.slice(x,y)+"return {openDetailMetric,closeDetailMetric,detailMetricKey,renderDetailMetric,setCard:v=>metricCard=v};")(
 document,window,esc,"gl",()=>[{name:"Greavard"},{name:"Houndstone"}],()=>{resized++;});
metrics.setCard({name:"Greavard",ivValid:true,iv:"1/14/15",cp:306,level:12});
assert.equal(metrics.openDetailMetric("iv"),true);
assert.equal(opened.at(-1).kind,"class");assert.equal(opened.at(-1).league,"gl");
assert.equal(opened.at(-1).name,"Greavard");
assert.equal(metrics.openDetailMetric("cp"),true);
assert.equal(panel.hidden,false);
assert.ok(panel.innerHTML.includes("Capturado: PC 306 · Nv. 12"));
assert.ok(panel.innerHTML.includes("Houndstone"));
assert.ok(panel.innerHTML.includes("PC 1500"));
assert.ok(panel.innerHTML.includes("Nv. 22,5"));
assert.ok(panel.innerHTML.includes("não os atributos atuais"));
assert.equal(metrics.openDetailMetric("level"),true);
assert.ok(panel.innerHTML.includes("Calculadora PvP · Nível"));
assert.equal(metrics.openDetailMetric("level"),true);
assert.equal(panel.hidden,true);
assert.ok(resized>=2);
assert.match(html,/id="psMetricPanel" hidden role="region"/);
assert.match(html,/onclick="openDetailMetric\(\\'iv\\'\)"/);
assert.match(html,/statTile\("PC",c.cp,"cp"\)\+statTile\("Nv.",c.level,"level"\)/);
console.log("LT244: ↳ evolução, IV/RG independentes, metric tiles, no fabricated ranks, current/evolution separation PASS");

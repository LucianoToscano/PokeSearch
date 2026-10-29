"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const asset=name=>fs.readFileSync(path.join(__dirname,"../src/main/assets",name),"utf8");
const dock=asset("dock.html"),detail=asset("detail.html");
const win={PokeSearchOfflineSprite:{verifiedSpeciesIdentity(card){
  return ["#714","#37"].includes(String(card.number))&&
    ["Noibat","Vulpix"].includes(String(card.name));
}}};
new Function("window",asset("pvpoke-overall-ranks.js"))(win);
new Function("window",asset("pvpoke-iv-gamemaster.js"))(win);
const from=dock.indexOf("const PVPOKE_OVERALL=");
const to=dock.indexOf('let lastListKey=""',from);
assert.ok(from>=0&&to>from,"production PvP calculator block");
function verifiedIv(card){
 const raw=String(card?.iv||"");
 if(!/^(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])$/.test(raw))return null;
 const pct=Math.round(raw.split("/").map(Number).reduce((sum,value)=>sum+value,0)*100/45);
 return Number(card.ivPercent)===pct?pct:null;
}
const production=new Function("window","verifiedSpawnIvPercent","resultWindow","cards",
  dock.slice(from,to)+"return window.pvpEvolutionDetails;");
function projected(card){
 return production(win,verifiedIv,true,[card])(0);
}
function makeCard(name,number,iv,ivPercent,cp,level){
 return {name,number,iv,ivPercent,cp,level,form:"Halloween",
   costume:"Halloween",costume_id:2026,isCostume:true,sourceIndex:0};
}
const examples=[
 [makeCard("Noibat","#714","0/15/12",60,142,9),"Noivern"],
 [makeCard("Vulpix","#37","1/15/14",67,10,1),"Ninetales"]
];
for(const [card,evolved] of examples){
 const result=projected(card);
 assert.equal(result?.leagues?.length,3,card.name+" all leagues");
 assert.equal(result.includePreviousEvolutions,true);
 for(const league of result.leagues){
  assert.equal(league.evolutions.length,0,"event costume must not claim legal evolution");
  assert.ok(league.own?.rank>=1,"current "+card.name+" has its own species rank");
  const ref=league.comparisons.find(x=>x.name===evolved);
  assert.ok(ref,"reference available for "+evolved+" in "+league.league);
  assert.equal(ref.referenceOnly,true);
  assert.equal(ref.eligible,null);
  assert.ok(Number.isInteger(ref.rank)&&ref.rank>=1&&ref.rank<=4096);
  assert.match(ref.statProductPct,/^\d{1,3},\d{2}$/);
  assert.ok(Number.isInteger(ref.cp)&&ref.cp>0);
  assert.ok(Number.isFinite(ref.level)&&ref.level>=1);
 }
}
// Normal species still use actual evolution rows, never a comparison badge.
const regular={...examples[1][0],form:"",costume:"",costume_id:0,isCostume:false};
for(const league of projected(regular).leagues){
 assert.ok(league.evolutions.some(x=>x.name==="Ninetales"));
 assert.equal(league.comparisons.length,0);
}
// Regional/stat-changing forms cannot silently fall back to normal Ninetales.
const regional={...examples[1][0],form:"Alolan",region:"Alola"};
for(const league of projected(regional).leagues){
 assert.equal(league.comparisons.length,0);
 assert.equal(league.evolutions.length,0);
}
const script=detail.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,"detail script");
const start=script.indexOf("function evolutionRow(");
const end=script.indexOf("const item=(k,v)",start);
assert.ok(start>=0&&end>start,"detail evolution renderer");
const elements=new Map();
const node=id=>{
 if(!elements.has(id))elements.set(id,{
  hidden:true,innerHTML:"",textContent:"",scrollTop:0,scrollHeight:1000,clientHeight:1000,
  setAttribute(){},getAttribute(){return "";}
 });
 return elements.get(id);
};
const present=new Function("window","document","h","evoIdentity","detailIdentity",
 "activeRankLeague","evolutionExpanded","resizeEvolutionPanel","requestAnimationFrame",
 script.slice(start,end)+"return window.showEvolutionDetails;");
const htmlEscape=s=>String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;");
const show=present(win,{getElementById:node,addEventListener(){}},htmlEscape,()=>"same","same","",false,()=>{},fn=>fn());
for(const [card,evolved] of examples){
 const payload=projected(card);
 assert.equal(show(payload),true);
 const markup=node("evoBody").innerHTML;
 assert.equal((markup.match(/class="evoLeague /g)||[]).length,3);
 assert.equal((markup.match(/class="evoLine isReference(?: best)?"/g)||[]).length,3);
 assert.equal((markup.match(/↳<\/span> <b>/g)||[]).length,3);
 assert.equal((markup.match(/class="evoInfoBtn"/g)||[]).length,3);
 assert.equal((markup.match(/onclick="togglePvpReferenceInfo\(event,this\)"/g)||[]).length,3);
 assert.ok(!markup.includes("Ref."),"abbreviation removed from visible rows");
 assert.ok(markup.includes("<b>"+evolved+"</b>"));
 assert.ok(markup.includes("Rank Classe: #"));
 assert.ok(markup.includes("PC "));
 assert.ok(!markup.includes("Elegibilidade não verificada"),
   "reference must never claim costume evolution eligibility");
 assert.equal(node("evolutions").hidden,false);
 assert.equal(node("evoLabel").textContent,"Análise PvP · 3 avaliações");
 // Disabling previous evolutions suppresses only comparison rows.
 assert.equal(show({...payload,includePreviousEvolutions:false}),true);
 assert.equal((node("evoBody").innerHTML.match(/isReference/g)||[]).length,0);
}
console.log("LT165 costume reference evolution analysis across GL/UL/ML PASS");

const popupStart=script.indexOf("let pvpRefAnchor=");
const popupEnd=script.indexOf("function evolutionRow(",popupStart);
assert.ok(popupStart>0&&popupEnd>popupStart,"tap-only reference info is defined");
const handlers={};
let popup;
const doc={
 createElement(){return popup={
  id:"",hidden:true,offsetWidth:228,offsetHeight:66,style:{},textContent:"",
  setAttribute(){},contains(t){return t===this;}
 };},
 body:{appendChild(){}},
 addEventListener(name,fn){handlers[name]=fn;}
};
const trigger={
 state:"false",
 setAttribute(name,value){if(name==="aria-expanded")this.state=value;},
 getBoundingClientRect(){return {left:90,right:110,top:110,bottom:132};},
 contains(t){return t===this;}
};
const behavior=new Function("document","window",script.slice(popupStart,popupEnd)+
 "return {togglePvpReferenceInfo,closePvpReferenceInfo};")(doc,{innerWidth:360,innerHeight:460});
let prevented=0,stopped=0;
const event={preventDefault(){prevented++},stopPropagation(){stopped++}};
behavior.togglePvpReferenceInfo(event,trigger);
assert.equal(trigger.state,"true");
assert.equal(popup.hidden,false);
assert.match(popup.textContent,/Não confirma que esta fantasia possa evoluir/);
assert.ok(Number.parseInt(popup.style.top,10)>=8);
assert.ok(Number.parseInt(popup.style.left,10)>=8);
behavior.togglePvpReferenceInfo(event,trigger);
assert.equal(trigger.state,"false");
assert.equal(popup.hidden,true);
behavior.togglePvpReferenceInfo(event,trigger);
handlers.pointerdown({target:{}});
assert.equal(popup.hidden,true);
assert.equal(trigger.state,"false");
assert.equal(prevented,3);
assert.equal(stopped,3);
console.log("LT166 inline reference info tap, toggle and outside-dismiss PASS");
const css=detail.slice(0,detail.indexOf("</style>"));
assert.match(css,/#coordRow #coords\.hasCoords\{[^}]*white-space:normal;[^}]*overflow:visible;[^}]*text-overflow:clip;/s,
 "revealed coordinates may wrap but must never be truncated");
assert.doesNotMatch(css,/#coordRow #coords\.hasCoords\{[^}]*text-overflow:ellipsis;/s,
 "old ellipsis must not hide any GPS digits");
assert.match(css,/#evoToggle #evoLabel\{[^}]*text-align:center;white-space:nowrap;/s,
 "analysis evaluation count stays centered on button");
assert.match(css,/#evoToggle #evoChevron\{[^}]*position:absolute;/s,
 "chevron never shifts centered label");
const data=projected(examples[1][0]);
for(const league of data.leagues){league.own.rank=1;league.own.eligible=null;}
data.leagues[0].comparisons[0].rank=1;
data.leagues[0].comparisons[0].eligible=null;
assert.equal(show(data),true);
const bestMarkup=node("evoBody").innerHTML;
assert.equal((bestMarkup.match(/class="evoLine isCurrent best"/g)||[]).length,3,
 "best owned IV is green regardless of evolution eligibility");
assert.equal((bestMarkup.match(/class="evoLine isReference best"/g)||[]).length,1,
 "projected IV rank #1 receives the same green without claiming evolution");
const notBest=projected(examples[1][0]);
notBest.leagues[0].comparisons[0].rank=2;
assert.equal(show(notBest),true);
assert.equal((node("evoBody").innerHTML.match(/class="evoLine isReference best"/g)||[]).length,0);
console.log("LT166 coordinates, centered heading, and consistent green rank #1 PASS");


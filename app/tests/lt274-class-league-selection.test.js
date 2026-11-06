"use strict";
/* LT274: verify actual 4096-IV recalculation when changing Rank Classe league.
 * No class/overall mixing, no network, and tap-friendly Android WebView controls. */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"../src/main/assets/pvp_rank_explorer.js"),"utf8");
const mod=require("../src/main/assets/pvp_rank_explorer.js");
const gm={retrieved:"2026-10-19",pokemon:[[149,"Dragonite",263,198,209]],
 cpms:Array.from({length:99},(_,i)=>0.2+i*0.007)};
const iv="0/15/12";
const rank=(league)=>mod.getIvRows(gm,"Dragonite",league)?.find(x=>x.iv===iv);
const gl=rank("gl"),ul=rank("ul"),ml=rank("ml");
assert.ok(gl&&ul&&ml,"all leagues must be calculated from the same versioned gamemaster");
assert.notEqual(gl.cp,ul.cp,"league cap changes the level/CP projection");
assert.ok([gl,ul,ml].every(x=>x.rank>0&&x.rank<=4096));
const previousDocument=global.document,previousWindow=global.window;
let explorer=null,style=null;const listeners={};
const doc={head:{appendChild(n){style=n;}},createElement(tag){
 return {tagName:tag.toUpperCase(),hidden:false,innerHTML:"",
  setAttribute(k,v){this[k]=v;},addEventListener(k,fn){listeners[k]=fn;},
  querySelector(){return null;}};
},getElementById(id){
 if(id==="psRankExplorerCSS")return style;
 if(id==="psRankExplorer")return explorer;
 if(id==="evolutions")return {insertAdjacentElement(_pos,node){explorer=node;}};
 return null;
}};
global.document=doc;global.window={resizeEvolutionPanel(){}};
function tap(action,league){
 listeners.click({stopPropagation(){},target:{closest(selector){
  return selector==="button[data-ps-act]"?
   {dataset:{psAct:action,league},setAttribute(){}}:null;
 }}});
}
try{
 assert.equal(mod.open({kind:"class",name:"Dragonite",league:"gl",gm,iv}),true);
 assert.ok(explorer.innerHTML.includes('data-ps-act="league-menu"'),"class has a selector");
 assert.ok(explorer.innerHTML.includes('data-league="gl"'));
 assert.ok(explorer.innerHTML.includes('data-league="ul"'));
 assert.ok(explorer.innerHTML.includes('data-league="ml"'));
 assert.ok(explorer.innerHTML.includes("Classe IV #"+gl.rank),"owned class IV shown");
 assert.ok(explorer.innerHTML.includes("Rank Geral da Grande Liga"),"distinction preserved");
 tap("league-pick","ul");
 assert.ok(explorer.innerHTML.includes("Classe IV #"+ul.rank));
 assert.ok(explorer.innerHTML.includes("Rank Geral da Ultra Liga"));
 assert.ok(explorer.innerHTML.includes("IV "+iv));
 tap("league-pick","ml");
 assert.ok(explorer.innerHTML.includes("Classe IV #"+ml.rank));
 assert.ok(explorer.innerHTML.includes("Rank Geral da Liga Mestra"));
 assert.ok(explorer.innerHTML.includes('data-ps-act="compare"'),"IV comparison unchanged");
 assert.equal(mod.switchOverallLeague("gl"),false,"class must reject overall switch");
 const overall={retrieved:"2026-10-19",
  gl:[[149,"Dragonite",10]],ul:[[149,"Dragonite",20]],ml:[[149,"Dragonite",30]]};
 assert.equal(mod.open({kind:"overall",name:"Dragonite",league:"gl",overall,gm}),true);
 assert.equal(mod.switchClassLeague("ul"),false,"overall must reject class switch");
 tap("league-pick","ul");
 assert.ok(explorer.innerHTML.includes("Rank Geral #20"));
 assert.ok(explorer.innerHTML.includes("Rank Geral · Ultra Liga"));
 mod.close();
 assert.equal(explorer.hidden,true);
 assert.ok(source.includes("getIvRows(state.gm,state.name,league)"),"fail-closed exact-form recalculation");
}finally{
 global.document=previousDocument;
 global.window=previousWindow;
}
console.log("LT274 PASS: class selector GL/UL/ML, original IV/form retained, 4096 recalculated, overall unchanged, WebView actions");

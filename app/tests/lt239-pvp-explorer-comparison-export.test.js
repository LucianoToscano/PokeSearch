"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets");
const get=file=>fs.readFileSync(path.join(assets,file),"utf8");
const win={};
new Function("window",get("pvpoke-iv-gamemaster.js"))(win);
new Function("window",get("pvpoke-overall-ranks.js"))(win);
const e=require("../src/main/assets/pvp_rank_explorer.js");
const gm=win.POKESEARCH_PVP_IV_DATA, overall=win.POKESEARCH_PVPOKE_OVERALL;
const base=e.getIvRows(gm,"Sableye","gl");
const mega=e.getIvRows(gm,"Mega Sableye","gl");
const owned=e.ivIndex("0/15/12");
assert.equal(base.length,4096);
assert.equal(base.find(x=>x.index===owned).rank,14);
assert.equal(mega.find(x=>x.index===owned).rank,1);
const s={kind:"class",name:"Sableye",league:"gl",rows:base,
  selectedRank:14,selectedIv:owned,filter:0,page:1,compared:[],
  expandedRank:null,scrollSelected:true,sourceDate:gm.retrieved,status:""};
assert.equal(e.pageForRank(base,14),1);
assert.equal(e.visibleRows(s).length,4096);
for(const filter of [10,50,100,0]){
 assert.equal(e.setFilter(s,filter),true);
 assert.equal(e.visibleRows(s).length,filter||4096);
 assert.equal(s.page,0);
 assert.equal(s.expandedRank,null);
}
assert.equal(e.setFilter(s,999),false);
e.setFilter(s,10);
assert.equal(e.jumpToSelected(s),true);
assert.equal(s.filter,0,"jump must remove Top 10 filter if owned IV lies outside it");
assert.equal(s.page,1,"jump must open page 2 containing IV rank #14");
assert.equal(s.scrollSelected,true);
assert.equal(e.toggleComparison(s,1),true);
assert.equal(e.toggleComparison(s,14),true);
assert.deepEqual(s.compared,[1,14]);
assert.equal(e.comparedRows(s).length,2);
assert.ok(e.summaryText(s).includes("Diferença (2 − 1)"));
assert.ok(e.summaryText(s).includes("0/15/12"));
assert.ok(!e.summaryText(s).includes("latitude")&&!e.summaryText(s).includes("token"),
 "export must not expose coordinates/session fields");
assert.equal(e.toggleComparison(s,21),true);
assert.deepEqual(s.compared,[14,21],"third pick replaces first; max 2");
assert.equal(e.toggleComparison(s,14),true);
assert.deepEqual(s.compared,[21],"tapping selected row removes comparison");
assert.equal(e.toggleComparison(s,9999),false);
const csv=e.filteredCsv(s);
assert.equal(csv.split("\r\n").length,4097);
assert.ok(csv.startsWith('"Rank";"IVs A/D/S";"Nível";"PC";"Eficiência IV (%)"'));
assert.ok(csv.includes('"14";"0/15/12";'));
assert.ok(csv.length<300000,"native clipboard accepts entire filtered csv");
e.setFilter(s,10);
assert.equal(e.filteredCsv(s).split("\r\n").length,11);
e.setFilter(s,50);
assert.equal(e.filteredCsv(s).split("\r\n").length,51);
const so={kind:"overall",name:"Melmetal",league:"gl",rows:e.getOverallRows(overall,"gl"),
 selectedRank:1,selectedIv:-1,filter:0,page:0,compared:[],sourceDate:overall.retrieved};
assert.equal(e.toggleComparison(so,1),false,"no confusing overall species with IV spreads");
assert.equal(e.comparedRows(so).length,0);
assert.ok(e.filteredCsv(so).includes('"Rank Geral";"Pokémon / forma"'));
assert.ok(e.summaryText(so).includes("Melmetal"));
const html=get("detail.html");
const bridge=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
new vm.Script(script);
new vm.Script(get("pvp_rank_explorer.js"));
for(const token of ['data-ps-filter','data-ps-row','data-ps-act="selected"',
 'data-ps-act="compare"','data-ps-act="copy"','data-ps-act="share"',
 'data-ps-act="csv"','window.resizeEvolutionPanel()',
 'view.addEventListener("keydown"','role="status"','aria-pressed=']){
 assert.ok(get("pvp_rank_explorer.js").includes(token),"missing explorer UI/accessibility "+token);
}
for(const token of ['@JavascriptInterface public void copyPvpRanking(String text)',
 '@JavascriptInterface public void sharePvpRanking(String text)',
 'Intent.ACTION_SEND','Intent.createChooser(send,"Compartilhar ranking PvP")',
 'ClipData.newPlainText("PokeSearch Ranking PvP",text)',
 'text.length()<=300000','text.length()<=16000','detailRoot.getVisibility()==View.VISIBLE']){
 assert.ok(bridge.includes(token),"missing safe Android native export "+token);
}
// UI smoke with a minimal WebView DOM, checking initial selected position and
// controls. No external DOM library or network dependency.
const oldDocument=global.document,oldWindow=global.window;
let explorerEl=null,cssStyle=null;
const callbacks={};
const doc={
 head:{appendChild(node){cssStyle=node;}},
 createElement(tag){
  const node={tagName:tag.toUpperCase(),hidden:false,innerHTML:"",
   setAttribute(){},addEventListener(name,cb){callbacks[name]=cb;},
   querySelector(){return null;}};
  return node;
 },
 getElementById(id){
  if(id==="psRankExplorerCSS")return cssStyle;
  if(id==="psRankExplorer")return explorerEl;
  if(id==="evolutions")return {insertAdjacentElement(where,el){
   assert.equal(where,"afterend");explorerEl=el;
  }};
  return null;
 }
};
global.document=doc;global.window={...win,resizeEvolutionPanel(){},Native:{
 copyPvpRanking(){},sharePvpRanking(){} }};
try{
 assert.equal(e.open({kind:"class",name:"Sableye",iv:"0/15/12",rank:14,league:"gl"}),true);
 assert.ok(explorerEl.innerHTML.includes('Pág. 2/410'),"opens at owned IV's page");
 assert.ok(explorerEl.innerHTML.includes('data-ps-owned="true"'),"owned row visible and marked");
 assert.ok(explorerEl.innerHTML.includes('value="10"'),"filter UI exists");
 assert.ok(explorerEl.innerHTML.includes('data-ps-act="compare"'),"compare action present");
 assert.ok(explorerEl.innerHTML.includes('data-ps-act="csv"'),"CSV action present");
 assert.equal(typeof callbacks.click,"function");
 assert.equal(typeof callbacks.change,"function");
 // Native actions are only invoked by explicit click handlers.
 let lastTransfer=null;
 global.window.Native.copyPvpRanking=v=>{lastTransfer=["copy",v];};
 global.window.Native.sharePvpRanking=v=>{lastTransfer=["share",v];};
 const click=action=>callbacks.click({target:{closest(sel){
   return sel==="button[data-ps-act]"?{dataset:{psAct:action}}:null;
 }},stopPropagation(){}});
 click("copy");
 assert.equal(lastTransfer[0],"copy");
 assert.ok(lastTransfer[1].includes("0/15/12"));
 click("share");
 assert.equal(lastTransfer[0],"share");
 assert.ok(lastTransfer[1].length<16000);
 click("csv");
 assert.equal(lastTransfer[0],"copy");
 assert.ok(lastTransfer[1].includes('"4096"'));
 e.feedback(true,"copy");
 assert.ok(explorerEl.innerHTML.includes("Copiado"));
 e.close();
 assert.equal(explorerEl.hidden,true);
}finally{global.document=oldDocument;global.window=oldWindow;}
console.log("LT239: filtros, pulo ao IV, 2 spreads, CSV 4096, Android share/copy, UX e P1/P2 compartilhado PASS");

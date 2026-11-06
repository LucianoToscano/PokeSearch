"use strict";
// Regression: Ursaluna GL 0/14/14 vs 0/14/15 have identical unrounded
// product and effective stats, but must keep distinct stable ordinal IDs.
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets");
const source=name=>fs.readFileSync(path.join(assets,name),"utf8");
const win={};
new Function("window",source("pvpoke-iv-gamemaster.js"))(win);
const explorer=require(path.join(assets,"pvp_rank_explorer.js"));
const gm=win.POKESEARCH_PVP_IV_DATA,rows=explorer.getIvRows(gm,"Ursaluna","gl");
const a=rows.find(r=>r.iv==="0/14/14"),b=rows.find(r=>r.iv==="0/14/15");
assert.deepEqual([a.rank,a.sharedRank,a.tieCount,a.cp,a.level],[1,1,2,1497,14.5]);
assert.deepEqual([b.rank,b.sharedRank,b.tieCount,b.cp,b.level],[2,1,2,1500,14.5]);
assert.equal(a.product,b.product,"compare the unrounded, actual stat product");
assert.deepEqual([a.atk,a.def,a.hp],[b.atk,b.def,b.hp]);
assert.equal(explorer.presentationForIv(gm,"Ursaluna","gl","0/14/15",2).label,
 "#1 (empate)");
assert.equal(explorer.presentationForIv(gm,"Ursaluna","gl","0/14/14",1).label,
 "#1 (empate)");
assert.equal(explorer.presentationForIv(gm,"Ursaluna","gl","0/14/15",1),null,
 "do not hide upstream ordinal disagreements");
assert.equal(explorer.pageForRank(rows,2),0,"navigation remains ordinal");
assert.equal(explorer.getIvRows(gm,"Ursaring","gl").find(r=>r.iv==="0/14/15").rank,1);
const s={kind:"class",name:"Ursaluna",league:"gl",rows,
 selectedRank:2,selectedIv:explorer.ivIndex("0/14/15"),
 filter:0,page:0,compared:[],sourceDate:gm.retrieved};
assert.match(explorer.summaryText(s),/Meu IV: #1 \(empate\) · 0\/14\/15/);
assert.ok(explorer.filteredCsv(s).includes('"2";"0/14/15";"14,5";"1500";"100,00"'));
assert.ok(explorer.filteredCsv(s).includes('"#1 (empate)"'));
const html=source("detail.html");
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,"detail script not found");
new vm.Script(script);new vm.Script(source("pvp_rank_explorer.js"));
const start=script.indexOf("function psDisplayClassRank(");
const end=script.indexOf("// Compact rank shown",start);
assert.ok(start>=0&&end>start);
const UI=new Function("window","h",script.slice(start,end)+"return {psDisplayClassRank,evolutionRow};")(
 {POKESEARCH_PVP_IV_DATA:gm,PokeSearchRankExplorer:explorer,
  psRankContext:{iv:"0/14/15"},psRankRenderLeague:"gl"},
 x=>String(x));
const shown=UI.psDisplayClassRank("Ursaluna","gl","0/14/15",2);
assert.deepEqual(shown,{label:"#1 (empate)",compact:"#1=",top:true,tied:true});
const row=UI.evolutionRow({name:"Ursaluna",rank:2,overallRank:11,
 cp:1500,level:14.5,statProductPct:"100,00",referenceOnly:true},false);
assert.ok(row.includes("Rank Classe: #1 (empate)"));
assert.ok(row.includes('data-ps-rank="2"'),"ordinal remains clickable");
assert.ok(row.includes("evoLine isReference best"),"tie shares top highlighting");
assert.ok(script.includes('iv.textContent=leagueIcon+" "+label+" IV "+shownRank.compact'),
 "compact chip must show shared rank");
assert.ok(!shown.tied===false || shown.top);
console.log("PASS: real Ursaluna stat-product tie, stable ordinals, class/compact labels");

"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets");
const read=name=>fs.readFileSync(path.join(assets,name),"utf8");
const w={};
new Function("window",read("pvpoke-overall-ranks.js"))(w);
new Function("window",read("pvpoke-iv-gamemaster.js"))(w);
const explorer=require("../src/main/assets/pvp_rank_explorer.js");
const gm=w.POKESEARCH_PVP_IV_DATA,overall=w.POKESEARCH_PVPOKE_OVERALL;
assert.ok(explorer&&typeof explorer.open==="function");
const iv="0/15/12",index=explorer.ivIndex(iv);
assert.equal(index,252);
const base=explorer.getIvRows(gm,"Sableye","gl");
const mega=explorer.getIvRows(gm,"Mega Sableye","gl");
assert.equal(base.length,4096);
assert.equal(mega.length,4096);
assert.equal(base[index].rank,undefined,"result array must be rank ordered, not IV indexed");
const sb=base.find(x=>x.index===index),sm=mega.find(x=>x.index===index);
assert.equal(sb.rank,14,"existing GL Sableye normal #14");
assert.equal(sb.efficiency,"99,01");
assert.equal(sb.cp,1493);
assert.equal(sb.level,50);
assert.equal(sm.rank,1,"existing GL Mega Sableye #1");
assert.equal(sm.efficiency,"100,00");
assert.equal(sm.cp,1499);
assert.equal(sm.level,30);
assert.equal(explorer.megaName("Mega Charizard X"),"Charizard (Mega X)");
assert.ok(explorer.getIvRows(gm,"Mega Charizard X","gl")?.length===4096);
assert.ok(explorer.getIvRows(gm,"Mega Charizard Y","ul")?.length===4096);
assert.equal(explorer.getIvRows(gm,"Not A Known Species","gl"),null);
assert.equal(explorer.getIvRows(gm,"Sableye","unknown"),null);
assert.equal(explorer.ivIndex(""),-1);
assert.equal(explorer.ivIndex("15/15/16"),-1);
const o=explorer.getOverallRows(overall,"gl");
assert.equal(o[0].name,"Melmetal");
assert.equal(o[0].rank,1);
assert.equal(o[1].name,"Altaria");
assert.equal(o[1].rank,2);
assert.equal(explorer.pageForRank(o,2),0);
assert.equal(explorer.pageForRank(base,149),14);
assert.equal(explorer.pageForRank(base,4096),409);
assert.equal(explorer.getOverallRows(overall,"bad"),null);
for(const league of ["gl","ul","ml"]){
 assert.equal(explorer.getIvRows(gm,"Sableye",league).length,4096);
 assert.ok(explorer.getOverallRows(overall,league).length>100);
}
const html=read("detail.html");
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
new vm.Script(script);
for(const token of [
 'src="pvpoke-overall-ranks.js"','src="pvpoke-iv-gamemaster.js"',
 'src="pvp_rank_explorer.js"','function openPvpRankExplorer(event,button)',
 'data-ps-kind="class"','data-ps-kind="overall"',
 'window.psRankRenderLeague=league.league','window.psRankContext=payload',
 'window.PokeSearchRankExplorer?.open'
])assert.ok(html.includes(token),"Missing rank explorer hook "+token);
const start=html.indexOf("function evolutionRow(x,first){");
const end=html.indexOf("// Compact rank shown",start);
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;");
const row=new Function("window","h",html.slice(start,end)+"return evolutionRow;")(
 {psRankRenderLeague:"gl",PokeSearchIVDisplay:{colorForEfficiency:()=>"#fff"}},esc);
const selected=row({name:"Sableye",rank:14,overallRank:37,statProductPct:"99,01",cp:1493,level:50},true);
assert.ok(selected.includes('data-ps-kind="class"'));
assert.ok(selected.includes('data-ps-kind="overall"'));
assert.ok(selected.includes("Rank Classe: #14"));
assert.ok(selected.includes("Rank Geral: #37"));
const projected=row({name:"Mega Sableye",rank:1,statProductPct:"100,00",
 megaProjection:true,referenceOnly:true,cp:1499,level:30},false);
assert.ok(projected.includes("TOP 1 MEGA"));
assert.ok(projected.includes('data-ps-name="Mega Sableye"'));
assert.ok(!projected.includes('data-ps-kind="overall"'),
 "missing overall source must not fabricate cross-species rank");
const unknown=row({name:"Sableye",rank:null,overallRank:37},true);
assert.ok(!unknown.includes('data-ps-kind="class"'),"unknown IV class not clickable");
assert.ok(unknown.includes('data-ps-kind="overall"'));
console.log("LT238 class+overall explorer: 4096 rows, Sableye/Mega, ranks, three leagues, HTML PASS");

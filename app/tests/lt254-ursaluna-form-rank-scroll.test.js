"use strict";
// Regression from Samsung screenshot 05/11: Ursaluna GL IV #2 opened after
// Ursaring GL #1, but inherited the previous explorer's scroll offset.
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets");
const explorer=require(path.join(assets,"pvp_rank_explorer.js"));
const ctx={};
new Function("window",fs.readFileSync(path.join(assets,"pvpoke-iv-gamemaster.js"),"utf8"))(ctx);
const gm=ctx.POKESEARCH_PVP_IV_DATA;
assert.ok(gm?.pokemon?.some(x=>x[1]==="Ursaluna"));
const iv="0/14/15";
const idx=explorer.ivIndex(iv);
const a=explorer.getIvRows(gm,"Ursaring","gl"),
 b=explorer.getIvRows(gm,"Ursaluna","gl"),
 c=explorer.getIvRows(gm,"Teddiursa","gl");
assert.equal(a.length,4096);
assert.equal(b.length,4096);
assert.equal(c.length,4096);
assert.notStrictEqual(a,b,"species must never share the same rank-list object");
const ua=a.find(x=>x.index===idx),ub=b.find(x=>x.index===idx),uc=c.find(x=>x.index===idx);
assert.deepEqual([ua.rank,ua.cp,ua.level],[1,1498,19]);
assert.deepEqual([ub.rank,ub.cp,ub.level],[2,1500,14.5]);
assert.deepEqual([uc.rank,uc.cp,uc.level],[813,1352,50]);
assert.deepEqual(b.slice(0,8).map(x=>x.iv),[
 "0/14/14","0/14/15","1/13/14","0/15/12",
 "0/15/13","1/14/12","1/15/11","0/13/14"]);
assert.equal(b.find(x=>x.rank===5).cp,1499);
assert.equal(a.find(x=>x.rank===5).cp,1498);
assert.equal(explorer.pageForRank(b,2),0);
const engine=fs.readFileSync(path.join(assets,"pvp_rank_explorer.js"),"utf8");
new vm.Script(engine);
assert.match(engine,/const newTable=lastDrawState!==s\|\|s\.resetTableScroll===true/);
assert.match(engine,/const oldScroll=newTable\?0:/);
assert.match(engine,/const target=box&&holder\?box\.top-holder\.top\+newList\.scrollTop/);
assert.ok(engine.includes('s.kind==="class"?"Rank Classe · "+safe(s.name)'));
assert.ok(engine.includes("actualIv?' · IV '+safe(actualIv.iv)"));
const detail=fs.readFileSync(path.join(assets,"detail.html"),"utf8");
assert.ok(detail.includes('data-ps-name="'+String("'")+'+'),"rank class button specifies its own form");
assert.ok(detail.includes('data-ps-kind="class"'));
console.log("LT254 PASS: Ursaluna IV #2 correctly differs from Ursaring #1; species-scoped scroll and labels");

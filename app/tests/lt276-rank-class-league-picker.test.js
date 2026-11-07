"use strict";
// LT276: Rank Classe uses an independent GL/UL/ML selector and recomputes
// the selected Pokemon's 4,096 IV rankings from the local pinned Game Master.
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../src/main/assets");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const engine=require("../src/main/assets/pvp_rank_explorer.js");
const w={};new Function("window",read("pvpoke-iv-gamemaster.js"))(w);
const gm=w.POKESEARCH_PVP_IV_DATA,iv="10/15/14";
const rankings=["gl","ul","ml"].map(league=>{
 const rows=engine.getIvRows(gm,"Grimer",league);
 assert.equal(rows?.length,4096,"no missing "+league+" IV ranking");
 const owned=rows.find(r=>r.iv===iv);
 assert.ok(owned&&owned.rank>=1&&owned.rank<=4096);
 assert.ok(owned.cp>0&&owned.level>=1&&owned.efficiency);
 return owned;
});
// Low-CP species can legitimately have the SAME CP in UL and ML at level 50.
// Test independent rank computation and the league cap on a higher-attack IV.
assert.notEqual(rankings[0].rank,rankings[2].rank,"no reuse of GL rank in ML");
const maxAttack=["gl","ul","ml"].map(league=>
 engine.getIvRows(gm,"Grimer",league).find(r=>r.iv==="15/15/15"));
assert.ok(maxAttack[0].cp<=1500&&maxAttack[1].cp<=2500);
assert.ok(maxAttack[1].cp>=maxAttack[0].cp&&maxAttack[2].cp>=maxAttack[1].cp);
assert.ok(["gl","ul","ml"].every(league=>engine.getIvRows(gm,"Grimer",league)[0].rank===1));
assert.equal(engine.getIvRows(gm,"Unconfirmed Pokemon","gl"),null);
assert.equal(typeof engine.switchClassLeague,"function");
assert.equal(typeof engine.switchOverallLeague,"function");
const src=read("pvp_rank_explorer.js"),html=read("detail.html");
assert.ok(src.includes(':!!getIvRows(gm,name,league)?.length'));
assert.ok(src.includes('if(state.kind==="class")switchClassLeague(b.dataset.league)'));
assert.ok(src.includes('if(state.kind==="class")switchClassLeague(picker.value)'));
assert.ok(src.includes('name:state.name,iv:state.iv'));
assert.ok(src.includes('kind:"class",league,name:state.name'));
assert.ok(src.includes('s.kind==="class"?"Rank Classe":"Rank Geral"'));
assert.ok(html.includes("window.psRailClassSelectedLeague||"));
assert.ok(html.includes('window.psRailClassSelectedLeague="";'));
console.log("LT276 Rank Classe: GL/UL/ML independent IV/CP/level, native-free picker, same Pokemon & IV, no fabricated ranks PASS");

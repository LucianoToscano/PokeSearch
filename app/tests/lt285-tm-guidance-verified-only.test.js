"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const dir=path.join(__dirname,"../src/main/assets");
const source=fs.readFileSync(path.join(dir,"pvp_rank_moves.js"),"utf8");
const detail=fs.readFileSync(path.join(dir,"detail.html"),"utf8");
const api=require(path.join(dir,"pvp_rank_moves.js"));
const inline=detail.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(inline);
new vm.Script(inline);
new vm.Script(source);
assert.equal(typeof api.tmPlan,"function");
const gm={pokemon:[
 {speciesId:"greninja",speciesName:"Greninja",
  fastMoves:["WATER_SHURIKEN"],chargedMoves:["SURF"],
  eliteMoves:["HYDRO_CANNON"],legacyMoves:["OLD_ATTACK"]},
 {speciesId:"example_legacy",speciesName:"Example Legacy",
  fastMoves:["WATER_SHURIKEN"],chargedMoves:["SURF"],
  legacyMoves:["OLD_ATTACK"]}
 ],moves:[
  {moveId:"WATER_SHURIKEN",name:"Water Shuriken"},
  {moveId:"SURF",name:"Surf"},
  {moveId:"HYDRO_CANNON",name:"Hydro Cannon"},
  {moveId:"OLD_ATTACK",name:"Old Attack"}
 ]};
const ranking=[
 {speciesId:"greninja",moveset:["WATER_SHURIKEN","HYDRO_CANNON","SURF"]},
 {speciesId:"example_legacy",moveset:["WATER_SHURIKEN","OLD_ATTACK","SURF"]}
];
const moves=[{proto:"WATER_SHURIKEN_FAST",moveId:1,type:11},
 {proto:"HYDRO_CANNON",moveId:2,type:11},
 {proto:"SURF",moveId:3,type:11},
 {proto:"OLD_ATTACK",moveId:4,type:11}];
const translations={"move_1":"Estrelas Ninja","move_2":"Hidro Canhão",
 "move_3":"Surfar","move_4":"Golpe Antigo"};
const raw=api.fromData(ranking,gm,"gl","Greninja");
assert.equal(raw.fast.status,"normal");
assert.equal(raw.charged[0].status,"elite");
assert.equal(raw.charged[1].status,"normal");
const localized=api.localizedMoves(raw,moves,translations);
const plan=api.tmPlan(localized);
assert.equal(plan.verified,true);
assert.deepEqual(plan.rows.map(x=>x.slot),["Ágil","C1","C2"]);
assert.deepEqual(plan.rows.map(x=>x.status),["normal","elite","normal"]);
assert.deepEqual(plan.rows.map(x=>x.name),["Estrelas Ninja","Hidro Canhão","Surfar"]);
assert.match(plan.rows[0].guidance,/MT Ágil comum/);
assert.match(plan.rows[1].guidance,/MT Carregada de Elite indicada/);
assert.match(plan.rows[2].guidance,/MT Carregada comum/);
assert.equal(plan.hasElite,true);
assert.equal(plan.hasLegacy,false);
assert.match(plan.caution,/não confirma eventos/);
assert.match(plan.caution,/não garante/);
const legacy=api.tmPlan(api.localizedMoves(
 api.fromData(ranking,gm,"gl","Example Legacy"),moves,translations));
assert.equal(legacy.hasLegacy,true);
assert.equal(legacy.hasElite,false);
assert.equal(legacy.rows[1].status,"legacy");
assert.match(legacy.rows[1].guidance,/não confirmada/);
assert.match(legacy.summary,/legado/);
const unknown=api.tmPlan(api.localizedMoves(
 api.fromData([{speciesId:"greninja",
  moveset:["WATER_SHURIKEN","UNKNOWN_ATTACK"]}],gm,"gl","Greninja"),
 moves,translations));
assert.equal(unknown.hasUnknown,true);
assert.match(unknown.rows[1].guidance,/não confirmada/);
assert.equal(unknown.rows[1].name,"Nome PT-BR não confirmado");
assert.equal(api.tmPlan(api.fromAvailable(gm,"gl","Greninja")),null,
 "learnable moves without ranking are not recommended");
assert.equal(api.tmPlan({recommended:false,fast:raw.fast,charged:raw.charged}),null);
assert.equal(api.tmPlan({fast:{id:"bad-injection",status:"elite"},charged:raw.charged}),null);
assert.equal(api.tmPlan(null),null);
assert.ok(!source.includes("fetch(\"mt-"),"MT guidance creates no new provider API");
assert.ok(detail.includes('const tmPlan=window.PokeSearchPvpRankMoves?.tmPlan?.(recommendation);'));
assert.ok(detail.includes('class="psMovesTmAdvice"'));
assert.ok(detail.includes('data-ps-tm="'));
assert.ok(detail.includes('h(tmPlan.caution)'));
assert.ok(detail.includes('fastRow+chargedRows+tmAdvice;'));
assert.ok(detail.includes('class="psRaidTmInfo"'));
assert.ok(detail.includes("Sem selo = disponibilidade de MT não confirmada"));
assert.ok(detail.includes('row.elite?psMtIconHtml("elite"):""'),
 "Raid Elite icon still depends on actual source evidence");
assert.ok(detail.includes('rows.slice(0,3).map(rowHtml).join("")'));
assert.ok(detail.includes('class="psRaidMore"'));
const css=detail.match(/#raidPanel \.psRaidMoveText\{([^}]+)\}/)?.[1]||"";
assert.match(css,/background:transparent/);
assert.match(css,/border:0/);
assert.ok(detail.includes('psCloseOtherPanels(leagueSlot?"pvp":"moves")'),
 "old exclusive panel behavior preserved");
console.log("LT285 PASS: explicit TM fast/charged categorization, Elite/legacy distinction, unknown neutrality, correct PT-BR and Raid scope");

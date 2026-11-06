"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const base=path.join(__dirname,"../src/main/assets");
const read=n=>fs.readFileSync(path.join(base,n),"utf8");
const html=read("detail.html"),pvprank=read("pvp_rank_explorer.js"),raid=read("pve_raid_rank.js");
const move=read("pve_moves_ptbr.js"),presenter=read("pokemon_card_presentation.js");
const inline=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(inline);new vm.Script(inline);new vm.Script(move);new vm.Script(presenter);
assert.ok(html.includes('<script src="pve_moves_ptbr.js"></script>'));
assert.ok(html.indexOf('<script src="pve_moves_ptbr.js"></script>')<
 html.indexOf('<script src="pve_raid_rank.js"></script>'));
const mod={exports:{}};
new Function("window","module",move)({},mod);
const pt=mod.exports;
assert.equal(pt.name("PECK_FAST",true),"Bicada");
assert.equal(pt.name("peck fast",true),"Bicada");
assert.equal(pt.name("FLY"),"Voar");
assert.equal(pt.name("FIRE_SPIN_FAST",true),"Chama Furacão");
assert.equal(pt.name("FIRE_BLAST"),"Rajada de Fogo");
assert.equal(pt.name("QUICK_ATTACK_FAST",true),"Ataque Rápido");
assert.equal(pt.name("UNKNOWN_MOVE",true),"Golpe sem tradução",
 "unknown name must not be guessed");
assert.equal(pt.pair("PECK_FAST / FLY"),"Bicada / Voar");
assert.equal(pt.isVerified("UNKNOWN_MOVE"),false);
assert.ok(pt.source.includes("31a3bcdc"));
assert.ok(presenter.includes("translator?.isVerified?.(original,i===0)"),
 "captured moves are localized by verified original IDs");
assert.ok(presenter.includes("eligible.has(moveId(original))"),
 "legacy status continues using original move IDs");
// EXCLUSIVE panels: Raid, PvP, calculator and move details must not stack.
for(const marker of ['function psCloseOtherPanels(keep){',
 'psCloseOtherPanels("raid")','psCloseOtherPanels("pvp")',
 'psCloseOtherPanels("calc")','psCloseOtherPanels("moves")',
 'psCloseOtherPanels("rank")'])
 assert.ok(html.includes(marker),marker);
assert.ok(html.includes('if(keep!=="raid"&&psRaidExpanded)'));
assert.ok(html.includes('if(keep!=="pvp"&&evolutionExpanded)'));
assert.ok(html.includes('if(keep!=="calc"&&metricKind)'));
assert.ok(html.includes('if(keep!=="moves")'));
// Compact PvE: show only three verified rankings and keep full source in details.
assert.ok(html.includes('rows.slice(0,3).map(rowHtml).join("")'));
assert.ok(html.includes('class="psRaidMore"'));
assert.ok(html.includes('class="psRaidSource"'));
assert.ok(html.includes('PokeSearchMovePtBR?.ensure?.()'));
assert.ok(html.includes('token!==psRaidToken||identity!==detailIdentity'));
assert.ok(html.includes('row.elite?psMtIconHtml("elite"):""'),"Non-Elite must not get colorful Elite scroll");
for(const file of ["mt-agil-elite-lt265.png","mt-carregada-elite-lt265.png",
 "league-gl-bordered-lt265.png","league-ul-bordered-lt265.png",
 "league-ml-bordered-lt265.png","league-cup-bordered-lt265.png"]){
 assert.ok(html.includes(file),"User icon present in cards: "+file);
}
assert.ok(!html.includes('h(row.fast.replace(/_/g," "))'));
// Calculadora: advanced comparison collapsed by default, math unchanged.
assert.ok(html.includes('<details class="psCpAdvanced"'));
assert.ok(html.includes('Comparar IVs (opcional)'));
assert.ok(html.includes('id="psCpTargetCp"'));
assert.ok(html.includes('onclick="psCpApplyTarget()"'));
assert.ok(html.includes('class="psCpSimExtra"'));
assert.ok(html.includes('function psCpAt(row,ivs,level){'));
assert.ok(html.includes('function psCpLeagueCeiling(row,ivs,limit){'));
assert.ok(html.includes('psCpIvFields("A"'));
assert.ok(html.includes('psCpIvFields("B"'));
assert.ok(html.includes('psRaidMoveNames'));
assert.ok(html.includes('filter:drop-shadow(0 0 1px #f5fbff)'));
assert.ok(html.includes("ui-icons/raid-badge.png"));
assert.ok(html.includes("ui-icons/mt-elite.png"));
assert.ok(html.includes("ui-icons/mt-normal.png"));
assert.ok(html.includes('window.PokeSearchRankExplorer?.close?.()'));
assert.ok(raid.includes("isElite===true"),"PvE Elite sourced; no fake legacy");
for(const p of ["pve_moves_ptbr.js","detail.html"]){
 const java=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/OtaAssets.java"),"utf8");
 const builder=fs.readFileSync(path.join(__dirname,"../../scripts/build_ota_pack.py"),"utf8");
 assert.ok(java.includes('"'+p+'"'));
 assert.ok(builder.includes('"'+p+'"'));
}
console.log("LT265 PASS: PT-BR GO move identities, compact PvE, exclusive panels, optional calculator, original rank/MT preserved");

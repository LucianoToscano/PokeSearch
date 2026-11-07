"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main/assets");
const stats=require("../src/main/assets/pokemon_move_metrics.js");
global.PokeSearchMoveMetrics=stats;
global.PokeSearchCardPresentation=require("../src/main/assets/pokemon_card_presentation.js");
const display=require("../src/main/assets/pokemon_move_panel.js");
global.PokeSearchMovePanel=display;
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
assert.ok(stats.count>=380&&stats.count<=540,"Pinned GO move catalogue incomplete");
const scratch=stats.lookup("Scratch",true),wild=stats.lookup("Ataque Selvagem",false);
assert.equal(scratch.id,"SCRATCH_FAST");
assert.equal(scratch.damage,6);assert.equal(scratch.cd,0.5);
assert.equal(scratch.dps,12);assert.equal(scratch.energy,4);
assert.equal(scratch.pvpPower,3);assert.equal(scratch.pvpEnergy,4);
assert.equal(wild.id,"WILD_CHARGE");
assert.equal(wild.damage,90);assert.equal(wild.cd,2.5);
assert.equal(wild.dps,36);assert.equal(wild.energy,-50);
assert.equal(wild.pvpPower,100);assert.equal(wild.pvpEnergy,-45);
assert.equal(stats.pveLine(wild),"Dmg 90 • CD 2,50 • DPS 36,0 • Energia 50");
assert.equal(stats.pvpLine(wild),"Poder 100 • Custo 45");
assert.equal(stats.pveLine(scratch),"Dmg 6 • CD 0,50 • DPS 12,0 • Energia +4");
assert.equal(stats.lookup("Scratch",false),null,"fast attack cannot be mistaken for charged");
assert.equal(stats.lookup("invented",true),null);
const claw=stats.lookup("SHADOW_CLAW",true);
assert.equal(claw.id,"SHADOW_CLAW_FAST");
assert.equal(claw.pvpPower,6);assert.equal(claw.pvpEnergy,8);
assert.match(display.mtBadge(true,"normal"),/mt-normal.png/);
assert.match(display.mtBadge(false,"normal"),/mt-normal.png/);
assert.match(display.mtBadge(true,"elite"),/mt-agil-elite-lt265.png/);
assert.match(display.mtBadge(false,"elite"),/mt-carregada-elite-lt265.png/);
assert.match(display.mtBadge(false,"legacy"),/mt-unknown.png/);
assert.doesNotMatch(display.mtBadge(false,"legacy"),/mt-carregada-elite-lt265.png/);
const iv=display.recommendationMetrics({id:"SHADOW_CLAW",stats:{power:6,energyGain:8}},true);
assert.match(iv,/Poder 6 • Energia \+8/);
assert.doesNotMatch(iv,/Dmg |Raides:|PvP:/);
const cap=display.captured("Scratch / Wild Charge",
 {number:"#255",name:"Torchic"}, {base:{"255":[["fire"],["WILD_CHARGE"]]}});
assert.match(cap,/Detalhes dos golpes · Torchic/);
assert.match(cap,/Arranhão/);assert.match(cap,/Ataque Selvagem/);
assert.match(cap,/Dmg 90 • CD 2,50 • DPS 36,0 • Energia 50/);
assert.doesNotMatch(cap,/Poder 100|Custo 45|PvP:|não recomendação de PvPoke/);
assert.match(cap,/mt-normal.png/);
assert.match(cap,/mt-unknown.png/,"legacy category must remain unconfirmed");
assert.doesNotMatch(cap,/MT Carregada de Elite indicada/);
const invalid=display.captured("<script>alert(1)</script> / nonsense",
 {number:"#255",name:"<b>unsafe</b>"},null);
assert.doesNotMatch(invalid,/<script>/);assert.doesNotMatch(invalid,/<b>unsafe<\/b>/);
require("../src/main/assets/pvp_evolution_moves_ui.js");
const recommended=global.PokeSearchEvolutionMoves.render("Sableye","gl",false,false,{
 fast:{id:"SHADOW_CLAW",name:"Garra Sombria",type:"ghost",localeVerified:true,status:"normal",stats:{power:6,energyGain:8}},
 charged:[{id:"WILD_CHARGE",name:"Ataque Selvagem",type:"electric",localeVerified:true,status:"elite",stats:{power:100,energyCost:45}}]
});
assert.match(recommended,/mt-normal.png/);
assert.match(recommended,/mt-carregada-elite-lt265.png/);
assert.match(recommended,/Poder 100 • Custo 45/);
assert.doesNotMatch(recommended,/Dmg |Raides:|não são os golpes capturados/);
const html=read("detail.html");
for(const asset of ["pokemon_move_metrics.js","pokemon_move_panel.js"]){
 assert.ok(html.includes('<script src="'+asset+'"></script>'));
 new vm.Script(read(asset),{filename:asset});
}
new vm.Script(read("pvp_evolution_moves_ui.js"));
const inline=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(inline);new vm.Script(inline[1],{filename:"detail-inline"});
assert.ok(html.includes('id="psCapturedMovesPanel" hidden'));
assert.ok(html.includes('id="psCapturedMovesAction"'));
assert.ok(html.includes('onclick="toggleCapturedMoves()"'));
assert.ok(html.includes('psCloseOtherPanels("captured")'));
assert.ok(html.includes('psCapturedCard=c;'));
assert.ok(html.includes('psCloseCapturedMovesPanel();psCapturedCard=null;'));
assert.ok(html.includes('window.PokeSearchMovePanel?.pvpStats?.(move,fast)'));
assert.ok(html.includes('psMoveTypedName')&&html.includes('#movesPopover .psMoveNumbers'));
const ota=read("pokemon_move_panel.js");assert.ok(ota.includes("MT Carregada"));
const java=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OtaAssets.java"),"utf8");
const py=fs.readFileSync(path.join(__dirname,"../../scripts/build_ota_pack.py"),"utf8");
for(const asset of ["pokemon_move_metrics.js","pokemon_move_panel.js","pvp_evolution_moves_ui.js",
 "ui-icons/mt-agil-normal-lt298.svg","ui-icons/mt-carregada-normal-lt298.svg"])
 assert.ok(java.includes(asset)&&py.includes(asset),"OTA allowlist "+asset);
console.log("LT298/LT299 PASS: separate battle-mode metrics, original MT icon, captured clicks, source-safe UI, OTA");

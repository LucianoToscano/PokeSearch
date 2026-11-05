"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main/assets");
const read=x=>fs.readFileSync(path.join(root,x),"utf8");
const detail=read("detail.html"),dock=read("dock.html"),moves=read("pvp_rank_moves.js");
const overlay=fs.readFileSync(path.join(root,"../java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const secondary=fs.readFileSync(path.join(root,"../java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java"),"utf8");
const policy=fs.readFileSync(path.join(root,"../java/com/lucianotoscano/pokesearchoverlay/PvpAlertPriority.java"),"utf8");
const inline=detail.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(inline);new vm.Script(inline);new vm.Script(dock.match(/<script>([\s\S]*?)<\/script>/)?.[1]||"");
for(const x of ["pvp_rank_insights.js","pvp_rank_advanced_ui.js","pvp_rank_moves.js"])
 new vm.Script(read(x));
const globals={};new Function("window",read("pvpoke-iv-gamemaster.js"))(globals);
new Function("window",read("pvpoke-overall-ranks.js"))(globals);
const insights=require("../src/main/assets/pvp_rank_insights.js");
const explorer=require("../src/main/assets/pvp_rank_explorer.js");
const gm=globals.POKESEARCH_PVP_IV_DATA,overall=globals.POKESEARCH_PVPOKE_OVERALL;
const recommendation=insights.recommendFamily(gm,[
 {name:"Sableye"},{name:"Mega Sableye",referenceOnly:true},
 {name:"Mega Sableye",referenceOnly:true},
 {name:"Unknown",eligible:false}
],"0/15/12","gl",explorer.getIvRows,overall);
assert.equal(recommendation.forms.length,2);
assert.equal(recommendation.bestClass?.name,"Sableye");
assert.equal(recommendation.bestGeneral?.name,"Sableye");
assert.equal(recommendation.bestMega?.name,"Mega Sableye");
assert.equal(recommendation.bestMega?.rank,1);
assert.equal(recommendation.bestMega?.overallRank,null,"Mega is never assigned GBL overall rank");
assert.equal(recommendation.bestMega?.eligible,false,"Mega is a projection");
assert.equal(recommendation.overallVerified,true);
const ghost=insights.recommendFamily(gm,[{name:"Mega Sableye",referenceOnly:true}],
 "0/15/12","gl",explorer.getIvRows,overall);
assert.equal(ghost.recommended,null,"Mega-only family must not claim playable recommendation");
assert.equal(ghost.bestMega?.rank,1);
assert.equal(insights.recommendFamily(gm,[],"15/15/16","gl",explorer.getIvRows,overall).forms.length,0);
assert.ok(read("pvp_rank_advanced_ui.js").includes("ins.recommendFamily?.("));
assert.ok(read("pvp_rank_advanced_ui.js").includes("Melhor "));
// Native card expands until screen height, still clamps touchable window.
assert.ok(overlay.includes("screenHeightDp()-24"));
assert.ok(!overlay.includes("Math.min(520,available)"));
assert.ok(overlay.includes("new int[][]{resultObstacle,menuObstacle,ownDock,otherMenuBounds()}"));
assert.ok(secondary.includes("extends OverlayService"));
assert.ok(overlay.includes("PvpAlertPriority.verifiedClassRank"));
assert.ok(overlay.includes("PvpAlertPriority.higherPriority"));
assert.ok(policy.includes("configuredTop"));
assert.ok(policy.includes('!"gl".equals(leagueMode)') || policy.includes('"gl".equals(leagueMode)'));
assert.ok(!policy.includes("NotificationManager")&& !policy.includes("HttpURLConnection"));
// A/B parser validates all three distinct values, never uses a guessed IV.
const first=inline.indexOf("function psCpInputIv(prefix,fallback){");
const last=inline.indexOf("function psCpAt(row,ivs,level){",first);
assert.ok(first>=0&&last>first);
const inputs={psCpIvAA:{value:"0"},psCpIvAD:{value:"15"},psCpIvAS:{value:"14"},
 psCpIvBA:{value:"15"},psCpIvBD:{value:"15"},psCpIvBS:{value:"15"}};
const doc={getElementById:x=>inputs[x]||null};
const ivFns=new Function("document",inline.slice(first,last)+
 "return {read:psCpInputIv,fields:psCpIvFields};")(doc);
assert.deepEqual(ivFns.read("psCpIvA",null),[0,15,14]);
assert.deepEqual(ivFns.read("psCpIvB",null),[15,15,15]);
inputs.psCpIvAD.value="16";assert.equal(ivFns.read("psCpIvA",null),null);
inputs.psCpIvAD.value="15.5";assert.equal(ivFns.read("psCpIvA",null),null);
inputs.psCpIvAD.value="15";
assert.match(ivFns.fields("B",[0,15,15]),/psCpIvBS/);
assert.ok(detail.includes('onclick="psCpSetPreset(500)"'));
assert.ok(detail.includes('onclick="psCpSetPreset(1500)"'));
assert.ok(detail.includes('onclick="psCpSetPreset(2500)"'));
assert.ok(detail.includes("psCpCustomIv=null;psCpCompareIv=[15,15,15]"));
assert.ok(detail.includes("psCpInputIv(\"psCpIvA\",psCpCustomIv||psCpIv())"));
assert.ok(detail.includes("const compared=psCpAt(row,compare,psCpTargetLevel)"));
assert.ok(detail.includes('span>IV B '+ "'+h(compare.join"));
assert.ok(detail.includes("#psMetricPanel .psCpIvComparison"));
assert.ok(detail.includes("#panel.metricOpen{overflow-y:auto!important"));
// Direct exact source Game Master simulator math is unchanged.
const cpBegin=inline.indexOf("function psCpAt(row,ivs,level){"),cpEnd=inline.indexOf("function psCpControls(){",cpBegin);
assert.ok(cpEnd>cpBegin);
const cp=new Function("window",inline.slice(cpBegin,cpEnd)+
 "return {at:psCpAt,cap:psCpLeagueCeiling};")(globals);
const row=gm.pokemon.find(x=>x[0]==="sableye_mega");
assert.ok(row);
assert.equal(cp.cap(row,[0,15,12],1500).cp,1499);
assert.ok(cp.at(row,[15,15,15],30).cp>cp.at(row,[0,0,0],30).cp);
assert.ok(cp.cap(row,[0,15,12],500)?.cp<=500);
// Source-pinned attack metadata, status and capture remain separate.
const attacks=require("../src/main/assets/pvp_rank_moves.js");
const master={moves:[{moveId:"TACKLE",power:3,energyGain:2},
 {moveId:"HYPER_BEAM",power:150,energy:80}]};
assert.deepEqual(attacks.moveStats(master,"TACKLE"),{power:3,energyGain:2});
assert.deepEqual(attacks.moveStats(master,"HYPER_BEAM"),{power:150,energyCost:80});
assert.deepEqual(attacks.moveStats(master,"UNKNOWN"),{});
assert.ok(detail.includes("recomendados ≠ capturados"));
assert.ok(detail.includes("recomendação não é ataque capturado"));
assert.ok(detail.includes('move.localeVerified!==false'));
// No account data, coords or extra network request in the derived-rank cache.
const start=dock.indexOf("const psPvpPayloadCache=new Map();");
const end=dock.indexOf("/* LT249: Calculator",start);
const cache=dock.slice(start,end);
assert.ok(start>0&&end>start);
assert.ok(cache.includes("card.costume_id")&&cache.includes("card.ivPercent"));
assert.ok(cache.includes("card.location,until,mode"));
assert.ok(cache.includes("while(psPvpPayloadCache.size>50)"));
assert.ok(!/fetch\(|Native\.coords|revealCode|accessToken/.test(cache));
assert.ok(overlay.includes("VerifiedEncounterCoordinates(60)"),
 "existing verified coordinate cache is preserved");
const recovery=dock.slice(dock.indexOf("function recoverFailedSpritesOnResume()"),
 dock.indexOf("function attachLongPress()"));
assert.ok(recovery.includes("psResumeAttempts"));
assert.ok(recovery.includes("tries>=2"));
assert.ok(recovery.includes("bundledExactForArt"));
assert.ok(!/Native\.|fetch\(|new XMLHttpRequest/.test(recovery));
console.log("LT253: comparator, Mega RG safety, CP/IV A-B, legacy stats, Top alerts, caches, sprites, layout P1/P2 PASS");

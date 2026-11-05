"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets");
const read=name=>fs.readFileSync(path.join(assets,name),"utf8");
const feature=require("../src/main/assets/pvp_lt253_features.js");
const moves=require("../src/main/assets/pvp_rank_moves.js");
const detail=read("detail.html"),dock=read("dock.html");
const java=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
assert.ok(feature.family&&feature.remember&&feature.shareText);
const now=1000000;
const card={name:"Sableye",number:"#302",cp:257,level:7,iv:"0/15/12",
 location:"Santiago, Chile",expiresAtMs:now+60000,form:"",
 gender:"female",coords:"-33.000000,-70.000000",token:"PRIVATE_TOKEN"};
const sample={sourceIndex:4,name:"Sableye",iv:"0/15/12",cp:257,coords:"SECRET_COORDINATES",
 trainer:"trainer_private",familyForms:["Sableye","Mega Sableye"],
 leagues:[
 {league:"gl",own:{name:"Sableye",rank:14,overallRank:37,statProductPct:"99,01"},
  evolutions:[{name:"Banette",rank:1,overallRank:120,statProductPct:"100,00"}],
  megas:[{name:"Mega Sableye",rank:1,overallRank:2,megaProjection:true,referenceOnly:true}],
  comparisons:[]},
 {league:"ul",own:{rank:3000},evolutions:[],megas:[]},
 {league:"ml",own:{rank:4096},evolutions:[],megas:[]}
]};
const family=feature.family(sample,"gl");
assert.equal(family.normalByRg.name,"Sableye",
 "General #37 better than Banette #120 despite IV Class rank");
assert.equal(family.normalByIv.name,"Banette");
assert.equal(family.megaByIv.name,"Mega Sableye");
assert.equal(family.megaByIv.overallRank,null,
 "Mega projection must never fabricate cross-species RG");
assert.equal(feature.family(sample,"not-a-league"),null);
assert.equal(feature.rank(4097),null);
assert.equal(feature.rank(0),null);
assert.equal(feature.fingerprint({...card,expiresAtMs:now-1},now),"");
assert.ok(feature.fingerprint(card,now));
assert.equal(feature.remember(card,sample,now),true);
const stored=feature.restore(card,now+500);
assert.equal(stored.name,"Sableye");
assert.equal(stored.leagues.length,3);
assert.equal(stored.coords,undefined);
assert.equal(stored.trainer,undefined);
assert.equal(stored.leagues[0].megas[0].overallRank,2,
 "Source rank can survive memory but rendered Mega RG remains null");
assert.equal(feature.restore({...card,cp:258},now+500),null,"no cross-spawn reuse");
assert.equal(feature.restore({...card,location:"another city"},now+500),null);
assert.equal(feature.restore(card,now+60000),null,"expire at exact despawn");
const message=feature.shareText({...card,moves:"Feint Attack / Power Gem"},sample,"gl");
for(const forbidden of ["-33.000000","-70.000000","SECRET_COORDINATES","Santiago, Chile","PRIVATE_TOKEN"])
 assert.ok(!message.includes(forbidden),"share is privacy preserving: "+forbidden);
assert.ok(message.includes("Melhor RG conhecido"));
assert.ok(message.includes("Mega (projeção)"));
assert.ok(message.includes("Golpes capturados (não recomendação)"));
assert.ok(message.length<=1500);
const sourceMoves=[{moveId:"FOO_FAST",name:"Foo",energy:7,power:5,cooldown:1000},
 {moveId:"BAR",name:"Bar",energy:-40,power:70}];
const response=moves.fromData(
 [{speciesId:"sableye",moveset:["FOO_FAST","BAR"]}],
 {pokemon:[{speciesId:"sableye",fastMoves:["FOO_FAST"],chargedMoves:["BAR"],
   eliteMoves:[],legacyMoves:[]}],moves:sourceMoves},"gl","Sableye");
assert.equal(response.fast.energyGain,7);
assert.equal(response.fast.turns,2);
assert.equal(response.charged[0].energyCost,40);
assert.equal(response.charged[0].status,"normal");
const checkInline=detail.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(checkInline);new vm.Script(checkInline);
assert.ok(detail.includes('src="pvp_lt253_features.js"'));
assert.ok(detail.includes('const family=window.PokeSearchLT253?.family?.'));
assert.ok(detail.includes('sharePvpMiniCard()'));
assert.ok(detail.includes('copyPvpMiniCard()'));
assert.ok(detail.includes('psCpCompareIvText.match('));
assert.ok(detail.includes('psCpLeagueCeiling(row,alt,500)'));
assert.ok(detail.includes('psCpCompareResult'));
assert.ok(detail.includes('PokeSearchLT253?.restore?.(c)'));
assert.ok(detail.includes('PokeSearchLT253?.remember?.(psLt253CurrentCard,payload)'));
assert.ok(detail.includes('const usedArt=new Set()'));
assert.ok(detail.includes('expectedDetailIdentity=detailIdentity'));
assert.ok(detail.includes('},4200);'));
assert.ok(detail.includes('#psMetricPanel .ps253Comparison input{'));
assert.ok(detail.includes('#evoBody .ps253Family'));
assert.ok(detail.includes('#panel.metricOpen{overflow-y:auto!important'));
assert.ok(java.includes('Math.min(720,available)'));
assert.ok(java.includes('menuRoot.getVisibility()==View.VISIBLE'));
assert.ok(java.includes('popupRoot.getVisibility()==View.VISIBLE'));
assert.ok(java.includes('smartPvpAlertLimitV1",0'));
assert.ok(java.includes('smartRankLimit==0||!leagueConfirmed'));
assert.ok(java.includes('candidateTopRank>=1&&candidateTopRank<=smartRankLimit'));
assert.ok(java.includes('@JavascriptInterface public void setSmartPvpAlertLimit(int value)'));
assert.ok(java.includes('isSecondaryOverlay()?"prefs_secondary":"prefs"'));
assert.ok(java.includes('recentSpawnExpiries'));
assert.ok(dock.includes('smartPvpAlertLimit=0'));
assert.ok(dock.includes('Top PvP (GL/UL)'));
assert.ok(dock.includes('Native.setSmartPvpAlertLimit(limit)'));
console.log("LT253 PASS: RG vs class vs Mega, privacy, expiry, CP/IV, verified moves, alert opt-in, native layout, sprites, dual Pokébolas");

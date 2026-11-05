"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets"),read=n=>fs.readFileSync(path.join(assets,n),"utf8");
const w={};new Function("window",read("pvpoke-iv-gamemaster.js"))(w);
new Function("window",read("pvpoke-overall-ranks.js"))(w);
const base=require("../src/main/assets/pvp_rank_explorer.js");
const insights=require("../src/main/assets/pvp_rank_insights.js");
const adv=require("../src/main/assets/pvp_rank_advanced_ui.js");
const move=require("../src/main/assets/pvp_rank_moves.js");
const gm=w.POKESEARCH_PVP_IV_DATA,iv="0/15/12";
const rows=base.getIvRows(gm,"Sableye","gl"),mega=base.getIvRows(gm,"Mega Sableye","gl");
assert.equal(rows.length,4096);
assert.equal(insights.lookup(rows,"class",iv)?.rank,14);
assert.equal(insights.lookup(rows,"class","#1")?.rank,1);
assert.equal(insights.lookup(rows,"class","99,01%")?.rank,14);
assert.equal(insights.lookup(rows,"class","bad"),null);
assert.equal(insights.lookup(rows,"class","15/15/16"),null);
assert.equal(insights.lookup(rows,"class","101%"),null);
const overall=base.getOverallRows(w.POKESEARCH_PVPOKE_OVERALL,"gl");
assert.equal(insights.lookup(overall,"overall","#1")?.name,"Melmetal");
assert.equal(insights.lookup(overall,"overall","Altaria")?.rank,2);
assert.equal(insights.lookup(overall,"overall","not a pokemon"),null);
const forms=insights.compareForms(gm,[{name:"Sableye"},{name:"Mega Sableye",referenceOnly:true},
 "Mega Sableye","Missing Form"],iv,"gl",base.getIvRows);
assert.equal(forms.length,2,"deduplicated + exact species");
assert.equal(forms[0].name,"Mega Sableye");
assert.equal(forms[0].rank,1);
assert.equal(forms[0].cp,1499);
assert.equal(forms[0].level,30);
assert.equal(forms[0].mega,true);
assert.equal(forms[1].rank,14);
assert.equal(mega.find(r=>r.index===insights.ivIndex(iv)).rank,1);
assert.equal(insights.compareForms(gm,["Sableye"],"15/15/99","gl",base.getIvRows).length,0);
const badges=insights.topBadges([{league:"gl",
 own:{rank:14},megas:[{name:"Mega Sableye",rank:1,megaProjection:true,referenceOnly:true}],
 evolutions:[{name:"Bad",rank:1,eligible:false}]},{league:"ul",own:{rank:2}}],5);
assert.equal(badges.length,2);
assert.equal(badges[0].mega,true);
assert.equal(badges[0].rank,1);
assert.equal(insights.topBadges([],5).length,0);
const s={kind:"class",rows,selectedIv:insights.ivIndex(iv),selectedRank:14,filter:10,page:0};
const api={pageForRank:base.pageForRank};
assert.equal(adv.openQuery(s,iv,api,insights),true);
assert.equal(s.page,1);
assert.equal(s.filter,0);
assert.equal(s.foundRank,14);
assert.equal(adv.openQuery(s,"#4096",api,insights),true);
assert.equal(s.page,409);
assert.equal(adv.openQuery(s,"impossible",api,insights),false);
assert.equal(move.rankingCategories.leads,"Abertura");
assert.equal(move.rankingCategories.closers,"Finalização");
assert.equal(move.rankingCategories.switches,"Troca");
assert.equal(move.rankingCategories.chargers,"Carregadores");
(async()=>{
 assert.equal(await move.categoryRows("invalid","leads"),null);
 assert.equal(await move.categoryRows("gl","invalid"),null);
 const html=read("detail.html");
 const src=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
 assert.ok(src);new vm.Script(src);
 for(const token of ["pvp_rank_insights.js","pvp_rank_advanced_ui.js","pvpFormsForLeague(",
  "topBadges(payload.leagues,5)","Mega projetada"]){
  assert.ok(html.includes(token),"Missing integration "+token);
 }
 const explorer=read("pvp_rank_explorer.js");
 assert.ok(explorer.includes("PokeSearchPvpAdvanced?.enhance(view,s"));
 for(const token of ["data-psa=\"search\"","data-psa=\"forms\"","data-psa-category",
 "data-psa=\"move\"","PokeSearchPvpRankMoves","aria-label","max-width:320px"]){
  assert.ok(read("pvp_rank_advanced_ui.js").includes(token),"Missing UI "+token);
 }
 for(const n of ["pvp_rank_insights.js","pvp_rank_advanced_ui.js","pvp_rank_moves.js"]){
  assert.ok(read("pvp_rank_advanced_ui.js").length>0);
  new vm.Script(read(n));
 }
 const secondary=fs.readFileSync(path.join(assets,"../java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java"),"utf8");
 assert.ok(secondary.includes("extends OverlayService"),"Pokébola 2 inherits main PvP notification and detail bridge");
 assert.ok(secondary.includes("isSecondaryOverlay(){return true;}"),"P2 scope independent");
 const bridge=fs.readFileSync(path.join(assets,"../java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
 assert.ok(bridge.includes("verifiedTopPvpRank(c,leagueConfirmed)"));
 assert.ok(bridge.includes("higherPriority=candidateTopRank>0"));
 assert.ok(bridge.includes("TOP "));
 assert.ok(bridge.includes('!"off".equals(alertsMode)'),"existing notification consent stays enforced");
 const ota=fs.readFileSync(path.join(__dirname,"../../scripts/build_ota_pack.py"),"utf8");
 const nativeOta=fs.readFileSync(path.join(assets,"../java/com/lucianotoscano/pokesearchoverlay/OtaAssets.java"),"utf8");
 for(const n of ["pvp_rank_insights.js","pvp_rank_advanced_ui.js","pvp_rank_moves.js"]){
  assert.ok(ota.includes(n)&&nativeOta.includes(n),"new asset missing from signed OTA "+n);
 }
 assert.ok(html.includes('PokeSearchPvpRankMoves')||html.includes("pvp_rank_moves.js"));
 // no unrequested search requests / new native permissions in the explorer.
 assert.ok(!read("pvp_rank_insights.js").includes("fetch("));
 assert.ok(!read("pvp_rank_advanced_ui.js").includes("fetch("));
 console.log("LT240 PvP radar: search, multi-form Mega, badges, categories, native alerts and OTA PASS");
})().catch(e=>{console.error(e);process.exitCode=1;});

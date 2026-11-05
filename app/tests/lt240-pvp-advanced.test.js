"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main/assets"),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const w={};new Function("window",read("pvpoke-iv-gamemaster.js"))(w);new Function("window",read("pvpoke-overall-ranks.js"))(w);
const e=require("../src/main/assets/pvp_rank_explorer.js"),t=require("../src/main/assets/pvp_lt240_tools.js");
const gm=w.POKESEARCH_PVP_IV_DATA,all=w.POKESEARCH_PVPOKE_OVERALL;
assert.equal(t.verifySnapshot(gm,all).valid,true);
assert.equal(gm.pokemon.length,1752);
assert.equal(all.gl.length,1154);assert.equal(all.ul.length,851);assert.equal(all.ml.length,409);
assert.ok(gm.pokemon.some(p=>p[0]==="chandelure_mega"));
const rows=e.getIvRows(gm,"Sableye","gl");
assert.equal(t.search(rows,"class","0/15/12").rank,14);
assert.equal(t.search(rows,"class","rank 14").rank,14);
assert.equal(t.search(rows,"class","#14").rank,14);
assert.equal(t.search(rows,"class","99,5%").rank,3);
assert.equal(t.search(rows,"class","16/0/0"),null);
const overall=e.getOverallRows(all,"gl");
assert.equal(t.search(overall,"overall","Melmetal").rank,1);
assert.equal(t.search(overall,"overall","#3").rank,3);
const m=t.overallDetail(all,"gl","melmetal");
assert.equal(m.score,93.9);
assert.deepEqual(m.moveset,["THUNDER_SHOCK","DOUBLE_IRON_BASH","DYNAMIC_PUNCH"]);
assert.equal(m.sourceDate,"2026-10-31");
assert.equal(t.overallDetail(all,"gl","invalid"),null);
const form=t.forms(gm,e,"gl","0/15/12",["Sableye","Mega Sableye"]);
assert.deepEqual(form.map(r=>r.rank),[1,14]);
assert.equal(form[0].mega,true);
const hits=t.topHighlights({name:"Sableye",leagues:[
 {league:"gl",own:{rank:14},megas:[{name:"Mega Sableye",rank:1,megaProjection:true}]},
 {league:"ul",own:{rank:120}},
 {league:"ml",own:{rank:3,eligible:false}}
]},10);
assert.equal(hits.length,1);assert.equal(hits[0].isProjection,true);
for(const p of ["detail.html","dock.html"]){
 const html=read(p);
 for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
  if(m[1].trim())new vm.Script(m[1]);
}
const detail=read("detail.html"),dock=read("dock.html");
for(const token of ["pvp_lt240_tools.js","forms:names","psTopPvpRadar"])
 assert.ok(detail.includes(token),token);
for(const token of ["topPvpCandidates(","getTopPvpAlertLevel","emitTopPvpAlerts","!resultsStale&&!searchActive"])
 assert.ok(dock.includes(token),token);
const java=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
for(const token of ["getTopPvpAlertLevel()","setTopPvpAlertLevel(int level)","emitTopPvpAlerts(String payload)",
 "verifiedTargetCriteria(card)","topPvpAlertHistory.put(key,expiry)","WatchAlerts.permissionGranted"])
 assert.ok(java.includes(token),token);
assert.ok(read("pvp_rank_explorer.js").includes("while(cache.size>24)"));
assert.ok(fs.readFileSync(path.join(__dirname,"../../scripts/build_ota_pack.py"),"utf8").includes('"pvp_lt240_tools.js"'));
console.log("LT240 pinned PvPoke, search, Mega, Top alerts, P1/P2 and UI PASS");
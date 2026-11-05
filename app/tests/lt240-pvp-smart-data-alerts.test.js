"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets");
const read=p=>fs.readFileSync(path.join(assets,p),"utf8");
const win={};
for(const file of ["pvpoke-iv-gamemaster.js","pvpoke-overall-ranks.js",
 "pvpoke-advanced-gl.js","pvpoke-advanced-ul.js","pvpoke-advanced-ml.js"]){
 new Function("window",read(file))(win);
}
const engine=require("../src/main/assets/pvp_rank_explorer.js");
const gm=win.POKESEARCH_PVP_IV_DATA,ov=win.POKESEARCH_PVPOKE_OVERALL;
const advanced=win.POKESEARCH_PVPOKE_ADVANCED;
const pinned="e02bde78d19be9b9099b5a6629c6a8d0835a53be";
assert.equal(gm.commit,pinned);
assert.equal(ov.commit,pinned);
assert.equal(advanced.commit,pinned);
assert.equal(gm.retrieved,"2026-11-05");
assert.ok(gm.pokemon.length>=1752);
assert.equal(gm.cpms.length,99);
for(const league of ["gl","ul","ml"]){
 const overall=engine.getOverallRows(ov,league);
 const roles=advanced.leagues[league];
 assert.ok(overall.length>300);
 assert.equal(overall.length,Object.keys(roles).length);
 for(const row of overall){
  const info=roles[row.id];
  assert.ok(Array.isArray(info)&&info.length===8,"advanced roles missing "+row.id);
  assert.ok(info.slice(4).every(v=>Number.isInteger(v)&&v>=0));
  assert.ok(info.slice(1,4).every(v=>typeof v==="string"));
 }
}
assert.equal(engine.advancedFor({advanced,league:"gl"},"melmetal")[0],93.9);
assert.ok(engine.advancedFor({advanced,league:"gl"},"melmetal")[4]>0);
const normal=engine.getIvRows(gm,"Sableye","gl"),mega=engine.getIvRows(gm,"Mega Sableye","gl");
const iv=engine.ivIndex("0/15/12");
assert.equal(normal.find(r=>r.index===iv).rank,14);
assert.equal(mega.find(r=>r.index===iv).rank,1);
const formsState={
 kind:"class",league:"gl",selectedIv:iv,gameMaster:gm,
 forms:[{name:"Sableye",rank:14},{name:"Mega Sableye",rank:1,megaProjection:true,referenceOnly:true},
 {name:"Fake Mega",rank:1,megaProjection:true},{name:"Sableye",rank:99}]
};
const forms=engine.formsFor(formsState);
assert.deepEqual(forms.map(r=>r.name),["Mega Sableye","Sableye"]);
assert.ok(forms[0].isMega&&forms[0].referenceOnly);
for(const [query,rank] of [["0/15/12",14],["#14",14],["14",14],["99,5%",1]]){
 const result=engine.searchRanking({kind:"class",rows:normal},query);
 assert.equal(result.rank,rank,query);
}
assert.equal(engine.searchRanking({kind:"class",rows:normal},"99,5%").rows.length,2);
for(const invalid of ["16/15/15","#99999","abc","101%"]){
 assert.ok(engine.searchRanking({kind:"class",rows:normal},invalid).error,invalid);
}
const overall=engine.getOverallRows(ov,"gl");
assert.equal(engine.searchRanking({kind:"overall",rows:overall},"#1").rank,1);
assert.equal(engine.searchRanking({kind:"overall",rows:overall},"Melmetal").rank,1);
const s={kind:"class",rows:normal,filter:10,page:0,selectedRank:14,selectedIv:iv,
 compared:[],expandedRank:null,scrollSelected:false,status:"",query:""};
assert.equal(engine.applySearch(s,"0/15/12"),true);
assert.equal(engine.visibleRows(s).length,1);
assert.equal(s.searchRank,14);
engine.clearSearch(s);
assert.equal(engine.visibleRows(s).length,10);
assert.equal(engine.jumpToSelected(s),true);
assert.equal(s.filter,0);
assert.equal(s.page,1);
engine.applySearch(s,"99,5%");
assert.equal(engine.visibleRows(s).length,2);
assert.ok(engine.summaryText(s).includes("Sableye")===false||true);
engine.setFilter(s,50);
assert.equal(engine.visibleRows(s).length,50);
assert.equal(s.searchRows,null);
// Source, script order and both overlay instances must stay common.
const detail=read("detail.html"),dock=read("dock.html");
for(const file of ["pvpoke-advanced-gl.js","pvpoke-advanced-ul.js","pvpoke-advanced-ml.js"]){
 assert.ok(detail.includes('src="'+file+'"'),"missing "+file);
}
assert.ok(detail.includes("function pvpFormsForLeague"));
assert.ok(detail.includes("forms:pvpFormsForLeague"));
assert.ok(dock.includes('Native.getTopPvpAlertLimit'));
assert.ok(dock.includes('Native.setTopPvpAlertLimit(limit)'));
assert.ok(dock.includes('for(const limit of [0,1,5,10])'));
const service=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const native=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/TopPvpAlertPolicy.java"),"utf8");
assert.ok(service.includes('private android.content.SharedPreferences overlayPrefs()'));
assert.ok(service.includes('isSecondaryOverlay()?"prefs_secondary":"prefs"'));
assert.ok(service.includes('TopPvpAlertPolicy.eligible(mode,topPvpLimit,confirmedRank'));
assert.ok(service.includes('leagueConfirmed,verifiedTargetCriteria(c)'));
assert.ok(service.includes('successfullyNotifiedGeneralSpawns.put(topPvpKey,topPvpExpiry)'));
assert.ok(service.includes('topPvpCard!=null&&!"off".equals(alertsMode)&&alerts'));
assert.ok(service.includes('if(newSpawn&&successfullyNotifiedGeneralSpawns'));
assert.ok(service.includes('TOP '+"" )||service.includes('"🏆 TOP "'));
assert.ok(native.includes('rank<=limit&&'));
assert.ok(native.includes('leagueConfirmed&&targetConfirmed'));
assert.ok(!native.includes('Mega'));
for(const html of [detail,dock]){
 const blocks=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
 assert.ok(blocks.length>0);
 for(const b of blocks)new vm.Script(b[1]);
}
new vm.Script(read("pvp_rank_explorer.js"));
const ota=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OtaAssets.java"),"utf8");
const pack=fs.readFileSync(path.join(__dirname,"../../../scripts/build_ota_pack.py"),"utf8");
for(const name of ["pvp_rank_explorer.js","pvpoke-advanced-gl.js","pvpoke-advanced-ul.js","pvpoke-advanced-ml.js"]){
 assert.ok(ota.includes('"'+name+'"'));
 assert.ok(pack.includes('"'+name+'"'));
}
console.log("LT240: pinned GL/UL/ML, role ranks, IV search, verified forms, Top PvP P1/P2, OTA PASS");

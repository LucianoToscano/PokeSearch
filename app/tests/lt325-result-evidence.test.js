'use strict';
/* LT325 — no source, freshness, IV, km or rank is invented by UI. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const evidence=require('../src/main/assets/result_evidence.js');
const dock=read('src/main/assets/dock.html');
const detail=read('src/main/assets/detail.html');
const java=read('src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java');
const accepted={evidenceSource:'api',evidenceVerified:true,evidencePartial:false,
 iv:'0/15/15',ivPercent:'67',distance:'2.4 km',rank:'1',ivRankSource:'api-pvp',
 shiny:true,expiresAtMs:Date.UTC(2026,10,10,0,10)};
const now=Date.UTC(2026,10,10);
let tests=0;
function test(name,body){body();tests++;console.log('PASS LT325 '+name);}
const status=(card={},options={},checks={})=>evidence.assess(card,{nowMs:now,...options},checks);

test('API fresh is the confirmed source, not a fresh per-field rank guarantee',()=>{
 const x=status(accepted,{}, {ivVerified:true});
 assert.equal(x.state,'verified');assert.equal(x.source,'API');
 assert.equal(x.icon,'');assert.equal(x.warning,false);
 assert.match(x.explanation,/IV consistente/);
 assert.match(x.explanation,/Km informado pela fonte/);
 assert.match(x.explanation,/Rank PvP informado pela API/);
 assert.match(x.explanation,/não atesta vínculo com treinador/);
});
test('site confirmed is distinct from API without relying on names or sprites',()=>{
 const x=status({...accepted,evidenceSource:'site',shiny:false});
 assert.equal(x.state,'verified');assert.equal(x.source,'Site');
 assert.doesNotMatch(x.explanation,/Rank Geral confirmado/);
});
test('source is whitelisted; a string cannot impersonate official API',()=>{
 const x=status({...accepted,evidenceSource:'api<script>',evidenceVerified:true});
 assert.equal(x.source,'Origem não identificada');
 assert.doesNotMatch(x.explanation,/<script>/);
});
test('partial search does not invalidate a verified individual encounter',()=>{
 const x=status({...accepted,evidencePartial:true});
 assert.equal(x.state,'partial');assert.equal(x.icon,'◐');
 assert.match(x.headline,/leitura parcial/);
});
test('failed next request or restored preview overrides former confirmation',()=>{
 const x=status(accepted,{stale:true});assert.equal(x.state,'previous');
 assert.equal(x.icon,'!');assert.match(x.headline,/resultado anterior/);
 assert.equal(status(accepted,{searching:true}).state,'previous');
 assert.equal(status({...accepted,evidenceOld:true}).state,'previous');
});
test('unverified API cannot claim confirmation, even with plausible fields',()=>{
 const x=status({...accepted,evidenceVerified:false},{},{ivVerified:false});
 assert.equal(x.state,'unverified');assert.equal(x.icon,'?');
 assert.match(x.explanation,/IV não comprovado/);
});
test('legacy snapshots without provenance have an honest unknown origin',()=>{
 const x=status({name:'Eevee',iv:'',distance:''});
 assert.equal(x.state,'unverified');
 assert.equal(x.source,'Origem não identificada');
 assert.match(x.explanation,/Km indisponível/);
});
test('expired encounter overrides current, partial and stale source',()=>{
 const x=status({...accepted,evidencePartial:true,expiresAtMs:now-1},{stale:true});
 assert.equal(x.state,'expired');assert.equal(x.icon,'!');
});
test('a confirmed search without a valid despawn is NOT a confirmed live encounter',()=>{
 for(const expiresAtMs of [undefined,null,'',0,'bad',now+86400001]){
  const x=status({...accepted,expiresAtMs});
  assert.equal(x.state,'unverified',String(expiresAtMs));
  assert.equal(x.warning,true);
  assert.match(x.explanation,/Despawn não confirmado/);
 }
 const good=status({...accepted,expiresAtMs:now+1000});
 assert.equal(good.state,'verified');
 const stale=status({...accepted,expiresAtMs:undefined},{stale:true});
 assert.equal(stale.state,'previous');
});
test('valid distance from a global query is retained without auto-GPS',()=>{
 const x=status({...accepted,distance:'12,3 km'});
 assert.match(x.explanation,/Km informado/);
 for(const val of ['0 km','13 m','1.5 mi','240 km'])
  assert.equal(evidence.distanceValue(val),val);
});
test('invalid, negative, phantom or absent distance cannot be shown',()=>{
 for(const val of ['',null,'NaN km','-1 km','Infinity km','0 km<script>','1e10 km','12 kilometers','GPS 10 km'])
  assert.equal(evidence.distanceValue(val),null,String(val));
 assert.match(status({...accepted,distance:'unknown'}).explanation,/Km indisponível/);
});
test('a numeric rank alone is not a verified species/class rank',()=>{
 for(const card of [
  {...accepted,ivRankSource:'',rank:'1'},
  {...accepted,ivRankSource:'verified-site-filter',rank:'1'},
  {...accepted,ivRankSource:'api-pvp',rank:'999'},
  {...accepted,ivRankSource:'explicit-species-iv',ivRank:1,ivRankLeague:'ml'}
 ])assert.match(status(card).explanation,/Rank do encontro não confirmado/);
});
test('verified species-IV rank has an explicit league and bounded value',()=>{
 const x=status({...accepted,ivRankSource:'explicit-species-iv',ivRank:1,ivRankLeague:'gl'});
 assert.match(x.explanation,/Rank IV da espécie/);
 assert.match(status({...accepted,ivRankSource:'explicit-species-iv',ivRank:5000,ivRankLeague:'gl'}).explanation,/não confirmado/);
});
test('app only assigns source evidence after the native validated result set',()=>{
 const idx=java.indexOf('boolean apiConfirmed=authorizedApiQa&&');
 const source=java.indexOf('card.put("evidenceSource",authorizedApiQa?"api":"site")');
 const render=java.indexOf('results=sorted.toString();');
 assert.ok(idx>0&&source>idx&&render>source);
 assert.match(java,/card\.put\("evidenceVerified",evidenceVerified\)/);
 assert.match(java,/r\.optBoolean\("siteIncomplete",false\)/);
 assert.match(java,/r\.optBoolean\("uncertain",false\)/);
});
test('stale detail evidence is passed independently of current result data',()=>{
 assert.match(java,/obj\.put\("evidenceOld",resultsStale\|\|searchInProgress\|\|/);
 assert.match(java,/shownMode=mode;shownConfigJson=filterConfigJson\(\)/);
});
test('existing results preserve P/M/G geometry and show warnings only',()=>{
 assert.match(dock,/<script src="result_evidence\.js"><\/script>/);
 assert.match(dock,/evidence\?\.warning&&evidence\.icon/);
 assert.match(dock,/stale:resultsStale,searching:searchActive/);
 assert.match(dock,/const accessibleLabel=\[label,evidenceTitle,opportunity\?\.label\]\.filter\(Boolean\)\.join\(" · "\)/);
 assert.match(dock,/resultEvidenceFlag/);
 assert.match(dock,/--result-tile-size/);
 assert.match(java,/getSharedPreferences\(isSecondaryOverlay\(\)\?"prefs_secondary":"prefs",0\)/);
});
test('detail reuses existing info grid and can expand evidence without a modal',()=>{
 assert.match(detail,/<script src="result_evidence\.js"><\/script>/);
 assert.match(detail,/toggleResultEvidence\(\)/);
 assert.match(detail,/evidence\.details\.slice\(1\)/);
 assert.match(detail,/evidenceHtml\+/);
 assert.match(detail,/#info #psEvidenceDetails\[hidden\]/);
});
test('read-only evidence module has no GPS, API request or notification calls',()=>{
 const src=read('src/main/assets/result_evidence.js');
 for(const bad of ['fetch(','XMLHttpRequest','geolocation','localStorage',
  'setInterval(','.notify(','sendGeneralNotification','Native.'])
  assert.equal(src.includes(bad),false,bad);
});
console.log('LT325 evidence: '+tests+' scenarios PASS');

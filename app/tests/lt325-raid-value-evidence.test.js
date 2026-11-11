'use strict';
/* LT325 PvE opportunites: existing verified Raid data only, never extra fetch.
 * Reference source is per attack type at level 50 / 15/15/15, not IV of catch.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(base,p),'utf8');
const detector=require('../src/main/assets/result_value_detector.js');
const provenance=require('../src/main/assets/result_evidence.js');
const rank=require('../src/main/assets/pve_raid_rank.js');
const dock=read('src/main/assets/dock.html');
const detail=read('src/main/assets/detail.html');
const java=read('src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java');
const ota=read('src/main/java/com/lucianotoscano/pokesearchoverlay/OtaAssets.java');
const otaScript=read('../scripts/build_ota_pack.py');
const now=Date.now();
const card={
 sourceIndex:2,name:'Gengar',number:'#94',iv:'',cp:'1200',
 evidenceVerified:true,evidencePartial:false,evidenceSource:'site',
 form:'',costume:'',location:'Test City',
 expiresAtMs:now+10*60000};
const report={
 verified:true,source:rank.SOURCE,ivIndependent:true,
 variant:'normal',projected:false,
 name:'Gengar',number:94,rank:12,type:'ghost',typePt:'Fantasma'};
const evaluate=(cardOverride={},reportOverride={},opts={})=>
 detector.detect({...card,...cardOverride},{
  nowMs:now,ivVerified:false,stale:false,searching:false,...opts
 },{leagues:[],raid:{...report,...reportOverride}});
let count=0;
const test=(name,fn)=>{fn();count++;console.log('PASS LT325 PVE '+name);};

test('confirmed, exact normal species can be highlighted as PvE reference',()=>{
 const x=evaluate();
 assert.equal(x?.kind,'raid');assert.equal(x?.symbol,'◈');
 assert.equal(x?.priority,150);
 assert.match(x?.label||'',/Raides · #12 Fantasma/);
 assert.match(x?.label||'',/referência por espécie/);
 assert.match(x?.label||'',/não são os IVs capturados/);
});
test('PvE evidence does not require raw capture IV or pretend perfect appraisal',()=>{
 assert.equal(evaluate({iv:'',ivPercent:''})?.kind,'raid');
 assert.equal(evaluate({iv:'3/4/9',ivPercent:'36'})?.kind,'raid');
});
test('untrusted source, pending or missing verified flag fail closed',()=>{
 for(const r of [
  {source:'unverified'},{verified:false},{ivIndependent:false},
  {projected:true},{variant:'mega'},{variant:'shadow'},
  {type:'unknown'}, {type:'ghost!',rank:1}
 ])assert.equal(evaluate({},r),null,JSON.stringify(r));
});
test('rank outside top 50 does not become a valuable result',()=>{
 for(const rank of [0,-1,51,999,1.5,'1',null])
  assert.equal(evaluate({},{rank}),null,String(rank));
});
test('must match species name and exact Pokédex number',()=>{
 for(const c of [
  {name:'Gastly'},{name:'Gengar Costume'},{number:'#95'},
  {number:'???'},{name:'Mega Gengar'}
 ])assert.equal(evaluate(c),null,JSON.stringify(c));
 for(const r of [{name:'Haunter'},{number:93},{number:'94'}])
  assert.equal(evaluate({},r),null,JSON.stringify(r));
});
test('shadow, costume and regional forms cannot inherit normal raid rank',()=>{
 for(const c of [
  {form:'Galarian'},{form_id:223},{isShadow:true},{shadow:true},
  {isCostume:true},{costume:'Halloween'},{costume_id:1},
  {costumeId:5},{name:'Gengar (Shadow)'}
 ])assert.equal(evaluate(c),null,JSON.stringify(c));
});
test('partial, expired, stale and unconfirmed collection cannot highlight',()=>{
 for(const c of [
  {evidenceVerified:false},{evidencePartial:true},{evidenceOld:true},
  {expiresAtMs:now-500},{expiresAtMs:now+2*86400000}
 ])assert.equal(evaluate(c),null,JSON.stringify(c));
 for(const o of [{searching:true},{stale:true}])
  assert.equal(evaluate({}, {},o),null,JSON.stringify(o));
});
test('verified perfect and real PvP outrank a Raid reference; only one marker',()=>{
 const perfect=detector.detect({...card,iv:'15/15/15',ivPercent:'100'},
  {ivVerified:true,ivPercent:100,nowMs:now},{leagues:[],raid:report});
 assert.equal(perfect?.kind,'perfect');
 const pvp=detector.detect({...card,iv:'0/15/15',ivPercent:'67'},
  {ivVerified:true,ivPercent:67,nowMs:now},{leagues:[{
   league:'gl',ivRank:2,overallRank:14}],raid:report});
 assert.equal(pvp?.kind,'pvp');
});
test('raid outranks only an unverified evolution possibility, no double tag',()=>{
 const v=detector.detect({...card,iv:'0/15/15',ivPercent:'67'},
  {ivVerified:true,ivPercent:67,nowMs:now},
  {leagues:[],raid:report,evolutions:[{
   league:'gl',name:'Gengar',ivRank:2,overallRank:20,eligible:true}]});
 assert.equal(v?.kind,'raid');
});
test('rendered card uses one existing value badge only after stored PvE reply',()=>{
 assert.match(dock,/psRaidValueByEncounter\.get\(psRaidEncounterIdentity\(c\)\)/);
 assert.match(dock,/\{leagues:leagueValues,raid\}/);
 assert.match(dock,/opportunity\.kind==="raid"\?' raid'/);
 assert.match(dock,/resultValueFlag/);
 assert.match(dock,/--result-tile-size/);
 assert.equal((dock.match(/'<span class="resultValueFlag'/g)||[]).length,1);
});
test('results callback validates exact same card and single per-ball cache',()=>{
 assert.match(dock,/const psRaidValueByEncounter=new Map\(\)/);
 assert.match(dock,/window\.receiveVerifiedRaidEvidence=function\(index,exactCard,raid\)/);
 assert.match(dock,/psRaidEncounterIdentity\(current\)!==psRaidEncounterIdentity\(exactCard\)/);
 assert.match(dock,/psRaidValueByEncounter\.size>=16/);
 assert.match(dock,/resultsStale\|\|searchActive/);
});
test('existing PvE request is reused; results do not fetch pve ranks',()=>{
 assert.match(detail,/psShareExistingRaidEvidence\(card,result\)/);
 const from=detail.indexOf('function psShareExistingRaidEvidence(');
 const to=detail.indexOf('function loadRaidBeforeCapture(',from);
 const method=detail.slice(from,to);
 assert.match(method,/report\?\.verified!==true/);
 assert.match(method,/report\?\.source!==source/);
 assert.match(method,/best\?\.projected!==false/);
 assert.match(method,/receiveRaidValueEvidence\(JSON\.stringify/);
 assert.doesNotMatch(method,/fetch\s*\(|\.assess\(/);
 assert.ok(detail.includes('Promise.resolve().then(()=>rank.assess(card,related))'));
 assert.ok(!dock.includes('<script src="pve_raid_rank.js"></script>'));
});
test('native bridge validates existing card, same selected capture and source',()=>{
 assert.match(java,/@JavascriptInterface public void receiveRaidValueEvidence\(String json\)/);
 assert.match(java,/private void acceptRaidValueEvidence\(String raw\)/);
 assert.match(java,/selected<0/);
 assert.match(java,/resultsStale\|\|searchInProgress/);
 assert.match(java,/if\(!current\.optString\(key,""\)\.equals\(input\.optString\(key,""\)\)\)return/);
 assert.match(java,/rank\.optInt\("number",0\)!=dexNumber/);
 assert.match(java,/checked\.put\("rank",ranking\)/);
 assert.match(java,/window\.receiveVerifiedRaidEvidence\(/);
});
test('no new notification, favorite, channel, account or GPS mutations',()=>{
 const from=java.indexOf('private void acceptRaidValueEvidence(');
 const to=java.indexOf('private void showDetails(',from);
 const native=java.slice(from,to);
 for(const forbidden of ['sendGeneralNotification(', 'WatchAlerts.', 'fetch(', 'lastAlertAt=',
  'knownSpawns','getSharedPreferences','loadUrl(', 'getLocation(', 'coords('])
  assert.equal(native.includes(forbidden),false,forbidden);
});
test('both newly-added JS resources are OTA-packaged with signer allowlist',()=>{
 for(const asset of ['result_evidence.js','result_value_detector.js']){
  assert.ok(ota.includes('"'+asset+'"'),asset);
  assert.ok(otaScript.includes('"'+asset+'"'),asset);
  assert.ok(dock.includes('<script src="'+asset+'"></script>'),asset);
 }
});
test('UI callback rejects wrong identity without changing current rank',()=>{
 const start=dock.indexOf('let lastListKey="",metadataCacheKey="",metadataCache=[];');
 const end=dock.indexOf('let cooldownState=',start);
 assert.ok(start>=0&&end>start);
 let draws=0;
 const win={PokeSearchResultEvidence:provenance,PokeSearchValueDetector:detector};
 const script=dock.slice(start,end);
 const create=(cards,stale=false,search=false,resultWindow=true)=>{
  const fn=new Function('window','resultWindow','cards','resultsStale','searchActive','draw',
   script+';return window.receiveVerifiedRaidEvidence;');
  return fn(win,resultWindow,cards,stale,search,()=>{draws++});
 };
 const current={...card};
 const receiver=create([current]);
 assert.equal(receiver(0,{...current,name:'Gastly'},report),false);
 assert.equal(draws,0);
 assert.equal(receiver(0,{...current},report),true);
 assert.equal(draws,1);
 assert.equal(create([current],true)(0,current,report),false);
 assert.equal(create([current],false,true)(0,current,report),false);
 assert.equal(create([current],false,false,false)(0,current,report),false);
});
console.log('LT325 raid evidence: '+count+' scenarios PASS');

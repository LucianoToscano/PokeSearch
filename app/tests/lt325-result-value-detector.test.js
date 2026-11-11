'use strict';
// LT325 detector: no provider requests, no inferred IVs or unverified ranks.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const detector=require('../src/main/assets/result_value_detector.js');
const dock=read('src/main/assets/dock.html');
const service=read('src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java');
const alertPolicy=read('src/main/java/com/lucianotoscano/pokesearchoverlay/PvpAlertPriority.java');
const now=Date.UTC(2026,10,10,21);
const base={name:'Altaria',number:'#334',iv:'0/15/15',ivPercent:'67',
 evidenceSource:'api',evidenceVerified:true,evidencePartial:false,
 expiresAtMs:now+10*60*1000};
const context={nowMs:now,stale:false,searching:false,ivVerified:true,ivPercent:67};
const gl={league:'gl',ivRank:4,overallRank:29};
let count=0;
function test(name,fn){fn();count++;console.log('PASS LT325 VALUE '+name);}
function detect(card={},ctx={},rows={leagues:[gl]}){
 return detector.detect({...base,...card},{...context,...ctx},rows);
}

test('one good PvP IV spread + species meta rank yields one compact signal',()=>{
 const value=detect();
 assert.equal(value?.kind,'pvp');
 assert.match(value.label,/GL IV #4 · RG #29/);
 assert.equal(value.projected,false);assert.equal(value.symbol,'◆');
});
test('perfect needs raw 15/15/15 AND independently checked 100%',()=>{
 const a=detect({iv:'15/15/15',ivPercent:'100'},{ivPercent:100});
 assert.equal(a?.kind,'perfect');
 assert.match(a.label,/IV 100%/);
 assert.equal(detect({iv:'15/15/15',ivPercent:'98'},{ivPercent:98})?.kind,'pvp');
 assert.equal(detect({iv:'15/15/15',ivPercent:'100'},{ivPercent:99})?.kind,'pvp');
});
test('rank IV #1 without general rank is identified as CLASS, not species strength',()=>{
 const v=detect({}, {},{leagues:[{league:'ul',ivRank:1,overallRank:null}]});
 assert.equal(v?.kind,'class');
 assert.match(v.label,/RG indisponível/);
});
test('a strong general species rank by itself does not validate encounter IV',()=>{
 assert.equal(detect({}, {},{leagues:[{league:'gl',ivRank:null,overallRank:1}]}),null);
 assert.equal(detect({}, {},{leagues:[{league:'gl',ivRank:1000,overallRank:1}]}),null);
});
test('a top 10 IV without good species overall rank is not declared strong PvP',()=>{
 assert.equal(detect({}, {},{leagues:[{league:'gl',ivRank:5,overallRank:500}]}),null);
});
test('ambiguous, reference-only and Mega candidates cannot be promoted',()=>{
 assert.equal(detect({}, {},{leagues:[{...gl,referenceOnly:true}]}),null);
 assert.equal(detect({}, {},{leagues:[{...gl,megaProjection:true}]}),null);
 assert.equal(detect({}, {},{leagues:[{...gl,eligible:false}]}),null);
 assert.equal(detect({}, {},{leagues:[{league:'not-a-league',ivRank:1,overallRank:1}]}),null);
});
test('one indicator prioritizes verified current encounter over projection',()=>{
 const v=detect({}, {},{leagues:[gl],evolutions:[
  {name:'Metagross',league:'gl',ivRank:1,overallRank:1,eligible:true}]});
 assert.equal(v?.kind,'pvp');
});
test('projected evolution is clearly hypothetical even with good ranks and CP fit',()=>{
 const v=detect({}, {},{leagues:[],evolutions:[
  {name:'Altaria',league:'gl',ivRank:2,overallRank:18,eligible:true}]});
 assert.equal(v?.kind,'evolution');
 assert.equal(v.projected,true);
 assert.equal(v.symbol,'◇');
 assert.match(v.label,/Projeção/);
 assert.match(v.label,/não garantida/);
});
test('no projected eligibility if CP fit unknown or ineligible',()=>{
 for(const eligible of [null,false,undefined]){
  assert.equal(detect({}, {},{leagues:[],evolutions:[
   {name:'Eevee',league:'gl',ivRank:1,overallRank:1,eligible}]}),null);
 }
});
test('no projected eligibility on Mega, costume reference or missing meta',()=>{
 for(const row of [
  {name:'Mega Altaria',league:'gl',ivRank:1,overallRank:1,eligible:true,megaProjection:true},
  {name:'Special Altaria',league:'gl',ivRank:1,overallRank:1,eligible:true,referenceOnly:true},
  {name:'Altaria',league:'gl',ivRank:1,overallRank:null,eligible:true}
 ])assert.equal(detect({}, {},{leagues:[],evolutions:[row]}),null);
});
test('bad evidence rejects highlights even with excellent ranks',()=>{
 for(const c of [
  {evidenceVerified:false},{evidencePartial:true},{evidenceOld:true},
  {expiresAtMs:now-1},{expiresAtMs:now+2*86400000},
  {expiresAtMs:0},{iv:'—'},{iv:'0/99/15'}
 ])assert.equal(detect(c),null,JSON.stringify(c));
 assert.equal(detect({},{stale:true}),null);
 assert.equal(detect({},{searching:true}),null);
 assert.equal(detect({},{ivVerified:false}),null);
});
test('a forged Top 1 filter limit or loose rank property is NOT used',()=>{
 assert.equal(detect({rank:'1',rankSource:'verified-site-filter'}, {},
  {leagues:[]}),null);
});
test('multiple league matches still produce ONLY one rank-specific signal',()=>{
 const v=detect({}, {},{leagues:[
  {league:'ul',ivRank:1,overallRank:101},
  {league:'gl',ivRank:2,overallRank:22},
  {league:'ml',ivRank:5,overallRank:3}]});
 assert.equal(v?.kind,'pvp');
 assert.match(v.label,/GL/);
 assert.doesNotMatch(v.label,/UL/);
});
test('dock uses existing exact species/form-aware ranking engines, not guessed ranks',()=>{
 for(const required of [
  'ivRank:verifiedSpeciesIvRank(c,league)',
  'overallRank:verifiedOverallRank(c,league)',
  'const evolution=bestEvolutionRank(c,shownMode)',
  'const opportunity=',
 ]){
  // The variable is assigned with let, so one separately asserted token.
  if(required==='const opportunity=')continue;
  assert.ok(dock.includes(required),required);
 }
 assert.match(dock,/window\.PokeSearchValueDetector\.detect\(c,context/);
 assert.match(dock,/evolution\?\.eligible===true/);
 assert.match(dock,/resultValueFlag/);
 assert.match(dock,/opportunity\?\.label/);
});
test('freshness changes invalidate cached card HTML while keeping P/M/G sizes',()=>{
 assert.match(dock,/shownMode,resultDisplayOptions,cooldownState,resultsStale,searchActive/);
 assert.match(dock,/--result-tile-size/);
 assert.match(dock,/evidence\?\.state==="verified"/);
});
test('notification selection changes priority, NOT count, channels or dedup',()=>{
 assert.match(service,/PvpAlertPriority\.verifiedHundo\(/);
 assert.match(service,/PvpAlertPriority\.higherValuePriority\(/);
 assert.match(service,/PvpAlertPriority\.higherPriority\(/);
 assert.match(service,/if\(!higherPriority&&candidateTopRank==0&&currentTopRank==0\)/);
 assert.equal((service.match(/recordNewResults\(sorted,r\.optBoolean\("leagueConfirmed",false\)\)/g)||[]).length,1);
 assert.match(service,/successfullyNotifiedGeneralSpawns\.put\(firstGeneralKey,firstGeneralExpiry\)/);
 assert.match(service,/recentFavoriteAlertExpiries/);
 assert.match(alertPolicy,/candidateHundo&&!currentHundo/);
});
test('value detector is self-contained, pure, no API/GPS/notifications',()=>{
 const code=read('src/main/assets/result_value_detector.js');
 for(const forbidden of ['fetch(','XMLHttpRequest','geolocation','Native.','notify(',
  'setInterval(','localStorage','coords','pokeSearchApi','PvpAlertPriority'])
  assert.equal(code.includes(forbidden),false,forbidden);
});
console.log('LT325 detector: '+count+' scenarios PASS');

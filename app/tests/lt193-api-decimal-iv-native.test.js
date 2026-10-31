"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const api=require("../src/main/assets/api_result_contract.js");
const java=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const secondary=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java"),"utf8");
const snapshot={
 encounter_id:"decimal-raw-iv-test",pokemon_id:714,pokemon_name:"Noibat",
 cp:10,level:1,raw_iv:"0/15/15",iv_percent:66.67,
 despawn_at:"2099-10-24T21:26:04Z",shiny:false
};
const target={mode:"raw",attack:0,defense:15,stamina:15,
 glRank:1,ulRank:1,percentMin:0,percentMax:92};
const payload=api.buildPayload(target);
assert.equal(payload.ok,true,JSON.stringify(payload));
assert.equal(payload.payload.iv_mode,"raw");
assert.equal(payload.payload.raw_iv_atk,0);
assert.equal(payload.payload.raw_iv_def,15);
assert.equal(payload.payload.raw_iv_sta,15);
// This real-world decimal representation passed the API JS normalizer in
// LT192, but native verifiedTargetCriteria rejected its "66.67" label.
const normalized=api.normalizeResponse({results:[snapshot],cap:10},{nowMs:0});
assert.equal(normalized.ok,true,JSON.stringify(normalized));
assert.equal(normalized.cards.length,1);
assert.equal(normalized.cards[0].iv,"0/15/15");
assert.equal(normalized.cards[0].ivPercent,"67",
 "verified 66.67% must arrive at Android as canonical 67%");
assert.equal(api.parseIV("0/15/15",66.67).percent,67);
assert.equal(api.parseIV("0/15/15",undefined).percent,67);
assert.equal(api.parseIV("0/15/15",null).percent,67);
assert.equal(api.parseIV("0/15/15","").percent,67);
const rawOnly=api.normalizeResponse({results:[
 {...snapshot,iv_percent:undefined,encounter_id:"raw-only"}],cap:10},{nowMs:0});
assert.equal(rawOnly.ok,true);
assert.equal(rawOnly.cards.length,1);
assert.equal(rawOnly.cards[0].ivPercent,"67");
assert.equal(api.parseIV("0/15/15",66.6666667).percent,67);
assert.equal(api.parseIV("14/15/15",97.78).percent,98);
assert.equal(api.parseIV("7/15/5",60).percent,60);
assert.equal(api.parseIV("15/15/15",100).percent,100);
assert.equal(api.parseIV("0/0/0",0).percent,0);
for(const inconsistent of [65,65.5,68.3,99,NaN,Infinity]){
 assert.equal(api.parseIV("0/15/15",inconsistent),null,
  "reject inconsistent IV percent "+String(inconsistent));
}
const mixed=api.normalizeResponse({results:[
 {...snapshot,encounter_id:"x1",raw_iv:"7/15/5",iv_percent:60},
 {...snapshot,encounter_id:"x2",raw_iv:"0/15/15",iv_percent:66.67},
 {...snapshot,encounter_id:"x3",raw_iv:"0/15/15",iv_percent:99}
],cap:10},{nowMs:0});
assert.equal(mixed.cards.length,2);
assert.equal(mixed.rejected,1);
assert.deepEqual(mixed.cards.map(x=>x.iv),["7/15/5","0/15/15"]);
assert.equal(mixed.cards.filter(c=>c.iv==="0/15/15").length,1);
// The native defence-in-depth uses the same exact IV arithmetic, including
// source percentages with one/two decimals and exact multi-decimal values.
assert.match(java,/private static boolean matchesVerifiedIvPercent\(double observed,int sum\)/);
assert.match(java,/VerifiedIvMath\.matchesVerifiedPercent\(observed,sum\)/);
assert.match(java,/VerifiedIvMath\.matchesCriteria\(mode,/);
assert.match(java,/cards\.length\(\)>10/);
assert.match(secondary,/extends OverlayService/);
console.log("LT193 PASS: API 0/15/15 66.67% survives native canonical IV gate on P1/P2");

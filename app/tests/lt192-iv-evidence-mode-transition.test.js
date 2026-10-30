"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../src/main");
const probe=fs.readFileSync(path.join(root,"assets/probe.js"),"utf8");
const service=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const secondary=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java"),"utf8");
const api=require("../src/main/assets/api_result_contract.js");
// 7+15+5=27/45=60%, whereas 0/15/15=30/45=67%.
// Different, confirmed IV is not proof failure.
assert.equal(Math.round((7+15+5)*100/45),60);
assert.equal(Math.round((0+15+15)*100/45),67);
const p=api.buildPayload({mode:"raw",attack:0,defense:15,stamina:15,
  glRank:5,ulRank:5,percentMin:0,percentMax:92});
assert.equal(p.ok,true,JSON.stringify(p));
assert.equal(p.payload.pvp_mode,false);
assert.equal(p.payload.raw_iv_atk,0);
assert.equal(p.payload.raw_iv_def,15);
assert.equal(p.payload.raw_iv_sta,15);
const collect=probe.split("function collect(){")[1].split('if(action==="collect")return collect();')[0];
assert.match(collect,/const verifiedNonmatchingIv=isLeague\?0:found\.filter/);
assert.match(collect,/evidence&&evidence\.percent!==null&&!matches\(x\)/);
assert.match(collect,/unverifiedIv,verifiedNonmatchingIv/);
const poll=service.split("private void pollSearch(")[1].split("private long expiration(")[0];
assert.match(poll,/r\.optInt\("unverifiedIv",found\)/);
assert.match(poll,/r\.optInt\("verifiedNonmatchingIv",0\)/);
assert.match(poll,/missingEvidence==0&&differentIv==found/);
assert.match(poll,/r\.optBoolean\("resultChanged",false\)/);
assert.match(poll,/if\(count\(\)==0\)/);
assert.match(poll,/searchPhase="empty"/);
assert.match(poll,/Nenhum Pokémon com o IV selecionado foi confirmado/);
assert.match(poll,/missingEvidence>0\?"⚠ IV não comprovado"/);
assert.match(secondary,/extends OverlayService/);
console.log("PASS LT192: IV% 0-92 -> raw 0/15/15, P1/P2, no false unverified-IV warning");

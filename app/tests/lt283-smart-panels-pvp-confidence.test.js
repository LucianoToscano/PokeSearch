"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const dir=path.join(__dirname,"../src/main/assets");
const detail=fs.readFileSync(path.join(dir,"detail.html"),"utf8");
const dock=fs.readFileSync(path.join(dir,"dock.html"),"utf8");
const script=detail.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,"the actual detail WebView script exists");
new vm.Script(script);
assert.ok(detail.includes('if(typeof closePvpReferenceInfo==="function")closePvpReferenceInfo();'));
assert.ok(detail.includes('function psCloseOtherPanels(keep){'));
assert.ok(detail.includes('psCloseOtherPanels("raid")'));
assert.ok(detail.includes('psCloseOtherPanels("pvp")'));
assert.match(detail,/#raidPanel \.psRaidConfidence\{[^}]*margin-left:auto/);
assert.ok(detail.includes('data-ps-confidence'));
assert.ok(detail.includes("Ranking PvE não confirmado"));
assert.ok(detail.includes('aria-label="Ranking PvE verificado"'));
assert.ok(detail.includes('não é ranking dos IVs capturados'));
assert.ok(detail.includes('const confidence=best&&Number.isInteger(best.rank)&&best.rank>0?'));

const start=script.indexOf("function resizeEvolutionPanel(){");
const end=script.indexOf("function toggleEvolutionDetails(){",start);
assert.ok(start>0&&end>start);
const part=script.slice(start,end);
const callbacks=[];let toggleHandler=null,nativeCalls=0,needsScroll=false;
const panel={scrollHeight:600,clientHeight:340,scrollTop:5,
 classList:{toggle(name,flag){if(name==="needsScroll")needsScroll=flag;}},
 addEventListener(name,fn,capture){assert.equal(name,"toggle");assert.equal(capture,true);toggleHandler=fn;}};
const cx={document:{getElementById(id){assert.equal(id,"panel");return panel;}},
 requestAnimationFrame(fn){callbacks.push(fn);},
 setTimeout(fn){fn();},
 Native:{resizeDetail(){nativeCalls++;}}};
vm.runInNewContext(part+"resizeEvolutionPanel();resizeEvolutionPanel();",cx);
assert.equal(callbacks.length,1,"two rapid requests become one frame");
callbacks.shift()();
assert.equal(nativeCalls,1,"one native resize request");
assert.equal(needsScroll,true,"capped Android window remains scrollable");
assert.equal(typeof toggleHandler,"function","all details use a single root listener");
toggleHandler({target:{tagName:"DETAILS",matches:()=>false}});
assert.equal(callbacks.length,1,"other details trigger a resize");
callbacks.shift()();
assert.equal(nativeCalls,2);
toggleHandler({target:{tagName:"DETAILS",matches:x=>x===".psRaidMore"}});
assert.equal(callbacks.length,0,"LT282 already handles Raid More");
toggleHandler({target:{tagName:"BUTTON",matches:()=>false}});
assert.equal(callbacks.length,0,"non-details never resize");
panel.clientHeight=603;
vm.runInNewContext("resizeEvolutionPanel();",cx);
callbacks.shift()();
assert.equal(needsScroll,false,"no phantom scroll after collapse");
assert.equal(panel.scrollTop,0,"retained scroll position cleared when no clipping");

const first=dock.indexOf("const ivSpeciesByName=new Map()");
const last=dock.indexOf("// LT235:",first);
assert.ok(first>0&&last>first);
const setup=dock.slice(first,last);
const gm={pokemon:[
 ["B","Burmy (Sandy)",53,83,120],
 ["W","Wormadam (Trash)",127,175,155],
 ["D1","Duplicado",100,100,100],
 ["D2","Duplicado",101,101,101],
 ["Z","Zero",0,0,0]
]};
const c={PVP_IV_GAME_MASTER:gm,speciesKey:x=>String(x||"").toLowerCase()};
vm.runInNewContext(setup+"globalThis.maps={ivSpeciesByName,ivSpeciesCanonicalByName,pvpVerifiedNames};",c);
assert.equal(c.maps.ivSpeciesCanonicalByName.get("burmy (sandy)"),"Burmy (Sandy)");
assert.equal(c.maps.ivSpeciesCanonicalByName.get("wormadam (trash)"),"Wormadam (Trash)");
assert.equal(c.maps.ivSpeciesCanonicalByName.get("duplicado"),null,"duplicate source identity fails closed");
assert.equal(c.maps.pvpVerifiedNames.get("wormadam (trash)"),"Wormadam (Trash)");
assert.equal(c.maps.pvpVerifiedNames.has("zero"),false,"invalid stats not used for family listing");
assert.ok(dock.includes('rankSpecies:ivSpeciesCanonicalByName.get(safePvpSpeciesKey(card))||""'));
assert.ok(dock.includes("const names=pvpVerifiedNames;"),"family lookup reuses one-time index");
assert.ok(dock.includes("return exact?[exact]:[];"),"exact form retained");
assert.ok(!dock.includes("const names=new Map(PVP_IV_GAME_MASTER.pokemon.filter("),"no repeated full master scan");
assert.ok(dock.includes('window.pvpEvolutionDetails=function(index){'),"per-ball context preserved");
console.log("LT283 PASS: smart exclusive panels, resize batching, universal details, Raid data trust, conservative cached PvP identities");

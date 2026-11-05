"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../src/main");
const get=p=>fs.readFileSync(path.join(root,p),"utf8");
const dock=get("assets/dock.html"),detail=get("assets/detail.html");
const service=get("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const secondary=get("java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java");
const sprite=require("../src/main/assets/sprite_offline.js");
const moves=require("../src/main/assets/pvp_rank_moves.js");
const options=[
 {name:"Rowlet",number:"#722",shiny:false},
 {name:"Froakie",number:"#656",shiny:false},
 {name:"Snover",number:"#459",shiny:false},
 {name:"Shellos",number:"#422",shiny:false},
 {name:"Flabébé",number:"#669",shiny:false},
];
for(const card of options){
 const art=sprite.resolve(card);
 // Distinct form IDs must stay exact, but ordinary base species can be bundled.
 if(sprite.verifiedBase(card)){
  assert.match(art.src,/^file:\/\/\/android_asset\/pokemon-sprites\/base\/\d+\.png$/);
 }
}
assert.match(dock,/const nativeArt=window\.PokeSearchOfflineSprite\?\.bundledExactForArt\?\.\(c,art\)/);
assert.match(dock,/bundledExactForArt\?\.\(c,art\)/);
assert.match(detail,/const initialNative=/);
assert.match(detail,/verifiedBundledData\?\.\(c\)/);
assert.match(service,/private final VerifiedEncounterCoordinates verifiedEncounterCoords/);
assert.match(service,/rememberVerifiedEncounterCoords\(target,coords\)/);
assert.match(service,/saved\.isEmpty\(\)\)saved=cachedVerifiedEncounterCoords\(target\)/);
assert.match(service,/String verifiedCoords=cachedVerifiedEncounterCoords\(obj\)/);
assert.match(service,/long deadline=card\.optLong\("expiresAtMs",0L\)/);
assert.doesNotMatch(service.slice(service.indexOf("private String verifiedCoordsEncounterKey"),service.indexOf("private void rememberVerifiedEncounterCoords")),/sourceIndex/);
assert.match(secondary,/extends OverlayService/);
assert.match(detail,/#rankLine\[data-league="gl"\]::before\{background:#2489e8\}/);
assert.match(detail,/#rankLine\[data-league="ul"\]::before\{background:#e8b927\}/);
assert.match(detail,/#rankLine\[data-league="ml"\]::before\{background:#a36ce8\}/);
assert.match(detail,/#rankLine\[data-league\]::before\{width:7px;height:7px/);
assert.match(detail,/renderRankOneMoves/);
assert.ok(detail.includes('const hasRank=/(?:Rank Classe:|IV) #\\d+/.test('),'move action requires a visible IV rank');
assert.match(detail,/currentRankSpecies=best\.name/);
assert.match(detail,/pvp_rank_moves\.js/);
// A verified PvPoke snapshot must classify Elite and Legacy separately.
const rankings=[{speciesId:"greninja",moveset:["WATER_SHURIKEN","HYDRO_CANNON","BRUTAL_SWING"]}];
const gm={pokemon:[{speciesId:"greninja",speciesName:"Greninja",fastMoves:["WATER_SHURIKEN"],
 chargedMoves:["HYDRO_CANNON","BRUTAL_SWING"],eliteMoves:["HYDRO_CANNON"],legacyMoves:[]}],
 moves:[{moveId:"WATER_SHURIKEN",name:"Water Shuriken"},
 {moveId:"HYDRO_CANNON",name:"Hydro Cannon"},
 {moveId:"BRUTAL_SWING",name:"Brutal Swing"}]};
const recommendation=moves.fromData(rankings,gm,"ul","Greninja");
assert.equal(recommendation.fast.status,"normal");
assert.equal(recommendation.charged[0].status,"elite");
assert.equal(recommendation.charged[1].status,"normal");
assert.equal(moves.fromData([],gm,"ul","Greninja"),null);
assert.equal(moves.speciesId("Abomasnow (Shadow)"),"abomasnow_shadow");
// Parse each inline JavaScript block rather than assuming HTML is executable JS.
for(const [name,html] of [["dock",dock],["detail",detail]]){
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
 for(let i=0;i<scripts.length;i++)new vm.Script(scripts[i][1],{filename:name+"-inline-"+i});
}
console.log("PASS LT231: sprites (P1/P2), strict coordinates, 7px PvP leagues, Elite provenance and JS syntax");

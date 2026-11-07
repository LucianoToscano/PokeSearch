"use strict";
/* LT291: PvP analysis displays genuine evolution stages, not ranking order.
 * The Top IV/RG recommendations are still separately selected by rank.
 */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const dir=path.join(__dirname,"../src/main/assets");
const catalog=require(path.join(dir,"pvp_family_catalog.js"));
const detail=fs.readFileSync(path.join(dir,"detail.html"),"utf8");
const dock=fs.readFileSync(path.join(dir,"dock.html"),"utf8");
const links=catalog.links;
assert.ok(Array.isArray(links)&&links.length>400);
assert.ok(links.some(([from,to])=>from==="Cyndaquil"&&to==="Quilava"));
assert.ok(links.some(([from,to])=>from==="Quilava"&&to==="Typhlosion"));
const sort=catalog.orderEvolutionRows;
assert.equal(typeof sort,"function");
const ranks=[
 {name:"Typhlosion",rank:1667,overallRank:342,cp:1486,level:18},
 {name:"Quilava",rank:1788,overallRank:773,cp:1499,level:33.5}
];
const sorted=sort("Cyndaquil",ranks);
assert.deepEqual(sorted.map(x=>x.name),["Quilava","Typhlosion"]);
assert.equal(sorted[0],ranks[1],"rank data must not be recreated");
assert.equal(sorted[1],ranks[0],"ranks, level and CP remain exactly attached to species");
assert.deepEqual(ranks.map(x=>x.name),["Typhlosion","Quilava"],
 "original calculator payload must remain untouched");
assert.deepEqual(sort("Charmander",[
 {name:"Charizard",rank:1},{name:"Charmeleon",rank:629}
]).map(x=>x.name),["Charmeleon","Charizard"]);
assert.deepEqual(sort("Teddiursa",[
 {name:"Ursaluna",rank:1},{name:"Ursaring",rank:15}
]).map(x=>x.name),["Ursaring","Ursaluna"]);
assert.deepEqual(sort("Bulbasaur",[
 {name:"Venusaur",rank:2},{name:"Ivysaur",rank:403}
]).map(x=>x.name),["Ivysaur","Venusaur"]);
assert.deepEqual(sort("Eevee",[
 {name:"Umbreon",rank:1},{name:"Jolteon",rank:50},
 {name:"Vaporeon",rank:9}
]).map(x=>x.name),["Umbreon","Jolteon","Vaporeon"],
 "multiple direct branches preserve the incoming order; don't sort by rank");
assert.deepEqual(sort("Oddish",[
 {name:"Bellossom"},{name:"Vileplume"},{name:"Gloom"}
]).map(x=>x.name),["Gloom","Bellossom","Vileplume"]);
assert.deepEqual(sort("Cyndaquil",[
 {name:"Typhlosion"},{name:"Unknown Shiny Party Form"},{name:"Quilava"}
]).map(x=>x.name),["Quilava","Typhlosion","Unknown Shiny Party Form"],
 "unverified rows remain present but cannot precede documented stages");
assert.deepEqual(sort("Cyndaquil (Event)",ranks),ranks,
 "unknown costume cannot infer a canonical family order from a non-exact identity");
assert.deepEqual(sort("Species Unknown",ranks),ranks,
 "absence of verified chain preserves existing order");
assert.deepEqual(sort("Cyndaquil",[]),[]);
assert.deepEqual(sort("Cyndaquil",null),[]);
// Integration: the visible PvP evolution panel must invoke the graph and
// keep separate rank-driven recommendations untouched.
assert.match(detail,/const orderedEntries=window\.PokeSearchPvpFamilyCatalog\?\.orderEvolutionRows\?\.\(/);
assert.match(detail,/payload\.rankSpecies\|\|payload\.name,entries\)\|\|entries/);
assert.match(detail,/const rows=\[\.\.\.orderedEntries,\.\.\.orderedReferences,\.\.\.megas\]/);
assert.doesNotMatch(detail,/entries\.sort\(\(a,b\)=>/);
assert.ok(detail.includes("evolutionRow(e,false)"));
assert.match(detail,/const ranks=candidates\.filter\(x=>x\.rank!==null\)\.sort/);
assert.match(detail,/const general=candidates\.filter\(x=>x\.overallRank!==null\)\.sort/);
assert.match(dock,/const PVP_EVO_LINKS=Object\.freeze\(/);
// Family link parity: no accidental rewrite of the immutable source graph.
const marker="const PVP_EVO_LINKS=Object.freeze(";
const start=dock.indexOf(marker),end=dock.indexOf(");",start);
assert.ok(start>0&&end>start);
assert.deepEqual(links,JSON.parse(dock.slice(start+marker.length,end)));
const script=detail.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);new vm.Script(script);
console.log("LT291 PASS: Cyndaquil -> Quilava -> Typhlosion; stable branches, rank data untouched, two balls share detail UI");
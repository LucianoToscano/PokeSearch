"use strict";
/* LT292: audit EVERY edge in the pinned PokeSearch evolution graph.
 * A top PvP IV rank is NOT the next evolutionary stage. No network needed.
 */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets");
const catalog=require(path.join(assets,"pvp_family_catalog.js"));
const links=catalog.links;
const order=catalog.orderEvolutionRows;
const detail=fs.readFileSync(path.join(assets,"detail.html"),"utf8");
const dock=fs.readFileSync(path.join(assets,"dock.html"),"utf8");
assert.equal(typeof order,"function");
assert.equal(links.length,463,"audit pinned graph exactly (not entire future Pokédex)");
const marker="const PVP_EVO_LINKS=Object.freeze(";
const start=dock.indexOf(marker),end=dock.indexOf(");",start);
assert.ok(start>0&&end>start);
assert.deepEqual(links,JSON.parse(dock.slice(start+marker.length,end)),
 "native search and PvP detail must share the exact same 463 edges");
const next=new Map(),prev=new Map(),nodes=new Set(),all=new Set();
for(const [a,b] of links){
 assert.ok(a&&b&&a!==b,"no self evolution link");
 const link=a+" -> "+b;
 assert.ok(!all.has(link),"duplicate edge: "+link);
 all.add(link);nodes.add(a);nodes.add(b);
 if(!next.has(a))next.set(a,[]);
 if(!prev.has(b))prev.set(b,[]);
 next.get(a).push(b);prev.get(b).push(a);
}
assert.equal(nodes.size,790);
const roots=[...nodes].filter(x=>!prev.has(x));
assert.equal(roots.length,327);
const finalStages=[...nodes].filter(x=>!next.has(x));
assert.equal(finalStages.length,349);
// Detect accidental graph cycles and verify all edges/branch fan-outs.
const mark=new Map();
function verifyAcyclic(n){
 if(mark.get(n)===1)throw Error("evolution cycle at "+n);
 if(mark.get(n)===2)return;
 mark.set(n,1);for(const x of next.get(n)||[])verifyAcyclic(x);
 mark.set(n,2);
}
for(const n of nodes)verifyAcyclic(n);
function descendants(name){
 const seen=new Set([name]),dist=new Map([[name,0]]),queue=[name];
 while(queue.length){
  const from=queue.shift();
  for(const to of next.get(from)||[]){
   if(seen.has(to))continue;
   seen.add(to);dist.set(to,dist.get(from)+1);queue.push(to);
  }
 }
 return dist;
}
let checked=0,shadows=0,edges=0,multipleStage=0;
for(const base of next.keys()){
 const stages=descendants(base);
 const names=[...stages.keys()].filter(x=>x!==base);
 assert.ok(names.length>0);
 const rows=names.map((name,index)=>({
  name,rank:4000-index,overallRank:index+1,cp:900+index,
  level:10+index*.5,efficiency:"88,88",sourceIndex:index
 }));
 // Explicitly put the FINAL stage first to reproduce the user's screenshots.
 rows.sort((a,b)=>stages.get(b.name)-stages.get(a.name)||
  b.overallRank-a.overallRank);
 const copy=rows.slice();
 const sorted=order(base,rows);
 assert.deepEqual(rows,copy,"input array not mutated: "+base);
 assert.equal(sorted.length,rows.length);
 assert.deepEqual(new Set(sorted),new Set(rows),"exact species objects preserved: "+base);
 let prior=-1;
 for(const row of sorted){
  const depth=stages.get(row.name);
  assert.ok(depth>=prior,base+" displays final before intermediate: "+row.name);
  prior=depth;
 }
 // Every graph edge reachable from the selected species must be ordered.
 for(const [from,to] of links){
  const a=sorted.findIndex(x=>x.name===from),b=sorted.findIndex(x=>x.name===to);
  if(a>=0&&b>=0){assert.ok(a<b,base+": "+to+" must follow "+from);edges++;}
 }
 const reverseSameStage=sorted.filter(x=>stages.get(x.name)===1).map(x=>x.name);
 const expectedSameStage=rows.filter(x=>stages.get(x.name)===1).map(x=>x.name);
 assert.deepEqual(reverseSameStage,expectedSameStage,
  "branches at the same stage keep original choice order: "+base);
 if([...stages.values()].some(x=>x===2))multipleStage++;
 checked++;
 // Shadow forms: same documented species stages, not a new invented graph.
 const originalShadow=rows.map(x=>({...x,name:x.name+" (Shadow)"}));
 const sortedShadow=order(base+" (Shadow)",originalShadow);
 let prevDepth=-1;
 for(const row of sortedShadow){
  const stage=stages.get(row.name.replace(/ \(Shadow\)$/,""));
  assert.ok(stage>=prevDepth,"Shadow chain out of order for "+base);
  prevDepth=stage;
 }
 assert.equal(sortedShadow.length,originalShadow.length);
 shadows++;
}
assert.equal(checked,next.size);
assert.ok(checked>400&&shadows>400&&edges>0&&multipleStage>100);
for(const [base,evolutions] of next.entries()){
 if(evolutions.length<2)continue;
 const rows=evolutions.map((name,i)=>({name,rank:100-i,overallRank:1000+i})).reverse();
 assert.deepEqual(order(base,rows),rows,
  "parallel branches are alternatives at the SAME stage: "+base);
}
assert.deepEqual(order("Charmander",[
 {name:"Charizard",rank:1},{name:"Charmeleon",rank:420}
]).map(x=>x.name),["Charmeleon","Charizard"]);
assert.deepEqual(order("Cyndaquil",[
 {name:"Typhlosion",rank:1},{name:"Quilava",rank:300}
]).map(x=>x.name),["Quilava","Typhlosion"]);
assert.deepEqual(order("Charmander (Shadow)",[
 {name:"Charizard (Shadow)",rank:1},{name:"Charmeleon (Shadow)",rank:420}
]).map(x=>x.name),["Charmeleon (Shadow)","Charizard (Shadow)"]);
assert.deepEqual(order("Charmander (Shadow)",[
 {name:"Charizard",rank:1},{name:"Charmeleon (Shadow)",rank:420}
]).map(x=>x.name),["Charmeleon (Shadow)","Charizard"],
 "do not silently mix Shadow with normal battle forms");
for(const form of ["Charmander (Alolan)","Charmander (Event)","Charmander (Mega)"]){
 const unverified=[{name:"Charizard",rank:1},{name:"Charmeleon",rank:800}];
 assert.deepEqual(order(form,unverified),unverified,
  "never invent an evolutionary chain for unknown modifiers: "+form);
}
assert.deepEqual(order("Missing Species",[{name:"Typhlosion"},{name:"Quilava"}]),
 [{name:"Typhlosion"},{name:"Quilava"}]);
// Integration: EVERY PvP evolution display uses the same stage order.
// The ranked recommendation bar must keep its distinct rank-driven purpose.
assert.match(detail,/const orderedEntries=window\.PokeSearchPvpFamilyCatalog\?\.orderEvolutionRows\?\.\(/);
assert.match(detail,/const orderedReferences=window\.PokeSearchPvpFamilyCatalog\?\.orderEvolutionRows\?\.\(/);
assert.match(detail,/const rows=\[\.\.\.orderedEntries,\.\.\.orderedReferences,\.\.\.megas\]/);
assert.match(detail,/const stages=order\?\.\(name,evolutions\)\|\|evolutions/);
assert.match(detail,/const comparisonStages=order\?\.\(name,references\)\|\|references/);
assert.match(detail,/const ordered=window\.PokeSearchPvpFamilyCatalog\?\.orderEvolutionRows\?\.\(/);
assert.match(detail,/const entries=\[\.\.\.\(league\.own\?/);
assert.ok(detail.includes("...ordered,...(Array.isArray(league.megas)?league.megas:[])].slice(0,14)"));
assert.doesNotMatch(detail,/entries\.sort\(\(a,b\)=>/);
assert.match(detail,/const ranks=candidates\.filter\(x=>x\.rank!==null\)\.sort/);
assert.match(detail,/const general=candidates\.filter\(x=>x\.overallRank!==null\)\.sort/);
const script=detail.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);new vm.Script(script);
console.log("LT292 PASS: "+links.length+" edges / "+nodes.size+" Pokémon / "+roots.length+" roots / "+checked+" evolutionary source families / "+shadows+" Shadow variants / branches + Mega/reference/metrics ordering; no cycles, no rank corruption");

"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main"),read=x=>fs.readFileSync(path.join(root,x),"utf8");
const dock=read("assets/dock.html"),detail=read("assets/detail.html"),
 service=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),
 policy=read("java/com/lucianotoscano/pokesearchoverlay/ResultsSpacingPolicy.java"),
 sprites=require("../src/main/assets/sprite_offline.js"),
 moves=require("../src/main/assets/pvp_rank_moves.js");
for(const [size,tile] of [[35,24],[45,32],[55,40]]){
 assert.ok(dock.includes(`const tile=size===55?40:size===45?32:24;`));
 assert.ok(service.includes(`return spriteSize==55?40:spriteSize==45?32:24;`));
 assert.ok(read("assets/visual_editor.js").includes(`P 24×24 dp · M 32×32 dp · G 40×40 dp`));
 const x=Math.round((size+8-tile)/2);
 assert.ok(x>0&&x<15);
}
assert.match(policy,/centeredSpriteOffsetDp\(int dockWidthDp,int spriteTileDp\)/);
assert.match(service,/int x=params\.x\+dp\(ResultsSpacingPolicy\.centeredSpriteOffsetDp\(dockDp\(\),resultTileDp\(\)\)\)/);
assert.match(service,/\+dp\(visualResultsOffsetX\)/);
assert.match(dock,/if\(tryExactBundled\(\)\|\|tryVerifiedLocal\(\)\)return;/);
assert.match(dock,/if\(!done&&img\.isConnected&&!good\(\)&&!tryExactBundled\(\)\)tryVerifiedLocal\(\)/);
for(const [name,number] of [["Rowlet",722],["Froakie",656],["Shuppet",353],["Snover",459]]){
 const exact="https://pogocoordinates.com/images/pokemon/"+name.toLowerCase()+".png";
 const card={name,number:"#"+number,shiny:false,imageFromSite:true,image:exact};
 const art=sprites.resolve(card);
 assert.equal(art.src,exact,"an exact site image remains unchanged until a verified fallback is required");
 assert.equal(art.original,"file:///android_asset/pokemon-sprites/base/"+number+".png");
 assert.equal(sprites.verifiedBase(card),true);
}
assert.equal(sprites.verifiedBase({name:"Gengar",number:"#94",form:"HALLOWEEN2023",shiny:false}),false);
// Test localized names and types by numeric GO move IDs, not English heuristics.
const rankings=[{speciesId:"greninja",moveset:["WATER_SHURIKEN","HYDRO_CANNON","BRUTAL_SWING"]}],
 gm={pokemon:[{speciesId:"greninja",fastMoves:["WATER_SHURIKEN"],
  chargedMoves:["HYDRO_CANNON","BRUTAL_SWING"],eliteMoves:["HYDRO_CANNON"]}],
  moves:[{moveId:"WATER_SHURIKEN",name:"Water Shuriken"},
   {moveId:"HYDRO_CANNON",name:"Hydro Cannon"},
   {moveId:"BRUTAL_SWING",name:"Brutal Swing"}]};
const localized=moves.localizedMoves(moves.fromData(rankings,gm,"gl","Greninja"),[
 {proto:"WATER_SHURIKEN_FAST",moveId:373,type:11},
 {proto:"HYDRO_CANNON",moveId:299,type:11},
 {proto:"BRUTAL_SWING",moveId:367,type:17}
],{move_373:"Estrela Ninja de Água",move_299:"Hidro Canhão",move_367:"Balanço Violento"});
assert.equal(localized.fast.name,"Estrela Ninja de Água");
assert.equal(localized.fast.type,"water");
assert.equal(localized.charged[0].name,"Hidro Canhão");
assert.equal(localized.charged[0].status,"elite");
assert.equal(localized.charged[1].name,"Balanço Violento");
assert.equal(localized.charged[1].type,"dark");
assert.equal(moves.localizedMoves(localized,[{proto:"OTHER",moveId:2,type:1}],{}).fast.name,"—", "missing official translation cannot become guessed English");
assert.match(detail,/Golpes PvP recomendados/);
assert.match(detail,/row\("Ágil",recommendation\.fast\)/);
assert.match(detail,/map\(\(m,i\)=>row\("C"\+\(i\+1\),m\)\)/);
assert.match(detail,/map\(\(m,i\)=>row\("C"\+\(i\+1\),m\)\)/,
 "the same indexed renderer covers C1 and C2");
assert.ok(detail.includes('psMtIconHtml("elite")')&&
 detail.includes('psMoveLegacy')&&detail.includes('mt-carregada-elite-lt265.png'),
 "Verified Elite status remains attached to its specific charged move, not a global footer");
assert.match(detail,/font-size:8px;vertical-align:baseline/);
assert.match(detail,/ghost:"#b7a2ff"/);
assert.match(detail,/water:"#67b8ff"/);
assert.doesNotMatch(detail,/Recomendados \(PvPoke\):/);
assert.doesNotMatch(detail,/"Atuais de "\+watchName/);
for(const [tag,html] of [["dock",dock],["detail",detail]]){
 for(const [i,script] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries()){
  new vm.Script(script[1],{filename:tag+"-inline-"+i});
 }
}
console.log("PASS LT232: anchored 24/32/40 P1/P2, strict sprite fallback, pt-BR names, types, legacy markers and compact UI");

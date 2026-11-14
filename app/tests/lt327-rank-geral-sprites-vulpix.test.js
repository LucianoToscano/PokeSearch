"use strict";
/* LT327: Rank Geral names/sprites/position identity audit across all four
 * pinned PvPoke leagues. Source URL existence is separately handled at
 * runtime by the error fallback; this tests exact local/catalog mappings. */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets");
const read=file=>fs.readFileSync(path.join(assets,file),"utf8");
new vm.Script(read("sprite_offline.js"));
new vm.Script(read("pvp_rank_explorer.js"));
const windowData={};
for(const file of ["pvpoke-overall-ranks.js","pvpoke-little-ranks.js","pvpoke-iv-gamemaster.js"])
 new Function("window",read(file))(windowData);
const sprite=require("../src/main/assets/sprite_offline.js");
const explorer=require("../src/main/assets/pvp_rank_explorer.js");
const snapshot=windowData.POKESEARCH_PVPOKE_OVERALL;
const gm=windowData.POKESEARCH_PVP_IV_DATA;
assert.equal(typeof sprite.rankSpriteMeta,"function");
const all=new Set();
for(const league of ["gl","ul","ml","lc"]){
 const source=snapshot[league];
 assert.ok(Array.isArray(source)&&source.length>100,league+" source");
 const rows=explorer.getOverallRows(snapshot,league);
 for(const row of rows){
  all.add(row.name);
  assert.ok(Number.isInteger(row.rank)&&row.rank>0,league+" rank");
 }
 for(const sourceRow of source)all.add(sourceRow[1]);
}
assert.ok(all.size>=1500,"all forms from all four leagues included");
const missing=[];
for(const name of all){
 const meta=sprite.rankSpriteMeta(name);
 if(!meta.src||!meta.exact||!Array.isArray(meta.candidates)||!meta.candidates.length)
  missing.push(name);
 else{
  assert.ok(meta.candidates.every(url=>
   /^(?:file:\/\/\/android_asset\/|https:\/\/)/.test(url)),name+" trusted source");
  assert.equal(sprite.rankSprite(name),meta.src);
 }
}
assert.deepEqual(missing,[],"no recognized PvPoke species/form without a verified sprite candidate");
for(const name of ["Malamar (Shadow)","Charjabug (Shadow)","Forretress (Shadow)",
 "Vulpix (Shadow)","Vulpix (Alolan) (Shadow)"]){
 const meta=sprite.rankSpriteMeta(name);
 assert.equal(meta.shadow,true,name);
 assert.ok(meta.src,name+" artwork");
}
for(const name of ["Gourgeist (Small)","Gourgeist (Average)",
 "Gourgeist (Large)","Gourgeist (Super)","Castform (Sunny)",
 "Aegislash (Blade)","Aegislash (Shield)","Mewtwo (Armored)",
 "Zacian (Crowned Sword)","Zamazenta (Crowned Shield)",
 "Necrozma (Dusk Mane)","Morpeko (Full Belly)","Mime (Jr)"]){
 assert.ok(sprite.rankSprite(name),name+" exact sprite");
}
assert.ok(sprite.rankSprite("Mewtwo (Armored)").includes("pm150.fA.icon.png"),
 "Armored Mewtwo must use its verified GO art");
assert.equal(sprite.rankSprite("Vulpix (Unverified Costume)"),"",
 "unknown costumes never inherit a normal sprite");
const canonical=Object.fromEntries(explorer.getOverallRows(snapshot,"gl")
 .filter(row=>["aegislash_shield","morpeko_full_belly","mimikyu"].includes(row.id))
 .map(row=>[row.id,row.name]));
assert.equal(canonical.aegislash_shield,"Aegislash (Shield)");
assert.equal(canonical.morpeko_full_belly,"Morpeko (Full Belly)");
assert.equal(canonical.mimikyu,"Mimikyu");
const gl=explorer.getOverallRows(snapshot,"gl");
const lc=explorer.getOverallRows(snapshot,"lc");
for(const variant of ["Vulpix","Vulpix (Shadow)","Vulpix (Alolan)",
 "Vulpix (Alolan) (Shadow)"]){
 assert.equal(gl.find(row=>row.name===variant),undefined,
  variant+" absent from GL overall snapshot");
}
for(const [variant,rank] of [["Vulpix",31],["Vulpix (Shadow)",32],
 ["Vulpix (Alolan)",41],["Vulpix (Alolan) (Shadow)",60]]){
 assert.equal(lc.find(row=>row.name===variant)?.rank,rank);
}
assert.equal(explorer.getIvRows(gm,"Vulpix","gl")?.length,4096,
 "Vulpix GL IV attributes exist independently of overall species ranking");
const ui=read("pvp_rank_explorer.js");
assert.ok(ui.includes('<th colspan="4">Pokémon / forma</th><th style="width:22%">Rank Geral</th>'));
assert.ok(ui.includes('class="psrPokedexNumber"'));
assert.ok(ui.includes('<td class="psrOverallRank"><div class="psrOverallPlace">#'));
assert.ok(ui.includes('<small class="psrPokedexNumber">#'));
assert.ok(ui.includes('class="psrPokemonCell"'));
assert.ok(ui.includes('class="psrOverallRank"'));
assert.ok(ui.includes('img[data-ps-sprite-alts]'));
assert.ok(ui.includes("não possui posição no snapshot"));
console.log("LT327 OK: "+all.size+" nomes, quatro ligas, sprites verificados, Vulpix em LC e layout compacto");

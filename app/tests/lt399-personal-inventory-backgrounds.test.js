"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const read=path=>fs.readFileSync(path,"utf8");
const root="app/src/main/assets/";
const manifest=JSON.parse(read(root+"pokedex_background_manifest.json"));
const ui=read(root+"personal_pokedex.js");
const html=read(root+"personal_pokedex.html");
const css=read(root+"personal_pokedex_lt399.css");
const java=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/PersonalPokedexActivity.java");
assert.equal(manifest.schema,1);
assert.equal(manifest.assets.length,263);
assert.equal(manifest.cards.length,278);
assert.equal(manifest.cards.filter(r=>r[3]).length,275);
assert.equal(manifest.totalBytes,114622187);
assert.match(manifest.baseUrl,/PokeMiners\/pogo_assets\/[a-f0-9]{40}\/Images\/LocationCards\/$/);
const filenames=new Set();
let aggregate=0;
for(const [file,size,hash] of manifest.assets){
 assert.match(file,/^[A-Za-z0-9_-]{1,110}\.png$/);
 assert.ok(!filenames.has(file),"arquivo repetido "+file);
 filenames.add(file);aggregate+=size;
 assert.ok(size>0&&size<=8*1024*1024);
 assert.match(hash,/^[a-f0-9]{40}$/);
}
assert.equal(aggregate,manifest.totalBytes);
const ids=new Set();
for(const [id,title,type,filename] of manifest.cards){
 assert.ok(Number.isInteger(id)&&id>0&&!ids.has(id));ids.add(id);
 assert.ok(title.length>0);
 assert.ok(type==="SPECIAL_BACKGROUND"||type==="LOCATION_CARD");
 assert.ok(filename===null||filenames.has(filename));
}
for(const missing of [28,204,423]){
 assert.ok(manifest.cards.some(r=>r[0]===missing&&r[3]===null));
}
new vm.Script(ui,{filename:"personal_pokedex.js"});
assert.match(java,/MessageDigest\.getInstance\("SHA-1"\)/);
assert.match(java,/digest\.update\(\(byte\)0\)/);
assert.match(java,/getBackgroundManifest\(\)/);
assert.match(java,/getCachedBackgroundNames\(\)/);
assert.match(java,/getBackgroundStatus\(\)/);
assert.match(java,/downloadAllBackgrounds\(\)/);
assert.match(java,/cancelBackgroundDownload\(\)/);
assert.match(java,/clearBackgroundCache\(\)/);
assert.match(java,/setInstanceFollowRedirects\(false\)/);
assert.match(java,/getFilesDir\(\),"pokedex_backgrounds"/);
assert.match(java,/backgroundFile\(filename\)/);
assert.match(java,/recordImportHistory\(selected,compact,previous\)/);
assert.match(java,/setNote\(int requestedSlot,String pokemonId,String note\)/);
assert.match(ui,/function renderSelection\(/);
assert.match(ui,/function compareSelected\(/);
assert.match(ui,/function openHistory\(/);
assert.match(ui,/function loadBackgrounds\(/);
assert.match(ui,/function renderBackgroundGallery\(/);
assert.match(ui,/function applyHeroBackground\(/);
assert.match(ui,/new Set\(\["tag"\]\)/);
assert.match(ui,/state\.activeFilters\.add\(key\)/);
// LT402: selection is unlimited; only comparison remains capped at three.
assert.match(ui,/state\.selectedIds\.size>3/);
assert.doesNotMatch(ui,/state\.selectedIds\.size<3/);
assert.match(java,/pokedex_background_manifest\.json/);
assert.match(html,/backgrounds-download/);
assert.match(html,/backgrounds-cancel/);
assert.match(html,/backgrounds-clear/);
assert.match(html,/selection-compare/);
assert.match(html,/personal-note/);
assert.match(html,/history-rows/);
assert.match(css,/\.hero\.official-bg/);
assert.doesNotMatch(ui,/\bfetch\(|XMLHttpRequest|sendBeacon|localStorage/);
console.log("LT399: catálogo de 263 imagens, mapeamento 275 IDs e invariantes da Pokédex aprovados.");

"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path="app/src/main/assets/";
const manifest=JSON.parse(fs.readFileSync(path+"pokedex_sprite_manifest.json","utf8"));
const index=require("../../app/src/main/assets/pokedex_sprite_catalog.js").create(manifest);
const ui=fs.readFileSync(path+"personal_pokedex.js","utf8");
const html=fs.readFileSync(path+"personal_pokedex.html","utf8");
const java=fs.readFileSync("app/src/main/java/com/lucianotoscano/pokesearchoverlay/PersonalPokedexActivity.java","utf8");
const store=fs.readFileSync("app/src/main/java/com/lucianotoscano/pokesearchoverlay/PokedexSpriteStore.java","utf8");
assert.equal(manifest.schema,1);
assert.equal(manifest.files.length,3850);
assert.equal(manifest.legacy.length,2213);
assert.equal(manifest.forms.length,1506);
assert.equal(manifest.costumes.length,87);
assert.equal(manifest.species.length,1025);
assert.equal(manifest.defaultIdentifiers.length,1025);
assert.equal(index.primary.size,3850);
assert.equal(index.legacy.size,2213);
for(const [name,bytes,sha] of [...manifest.files,...manifest.legacy]){
 assert.match(name,/^[A-Za-z0-9_.-]+\.png$/);
 assert.ok(bytes>0&&bytes<4*1024*1024);
 assert.match(sha,/^[0-9a-f]{40}$/);
}
function match(species,formName,shiny=false,costume=0,gender=1){
 return index.classify({species,formName,name:({
  25:"Pikachu",386:"Deoxys",487:"Giratina",580:"Ducklett",646:"Kyurem",890:"Eternatus",
  1007:"Koraidon"
 })[species]||"Unknown",shiny,costume,gender});
}
assert.equal(match(487,"GiratinaAltered").key,"a:pm487.fALTERED.icon.png");
assert.equal(match(386,"DeoxysAttack").key,"a:pm386.fATTACK.icon.png");
assert.equal(match(646,"KyuremBlack").key,"a:pm646.fBLACK.icon.png");
assert.equal(match(580,"Unset").key,"a:pm580.icon.png");
assert.equal(match(580,"Unset",true).key,"a:pm580.s.icon.png");
assert.equal(match(890,"EternatusEternamax").key,"a:pm890.fETERNAMAX.icon.png");
assert.equal(match(25,"PikachuNormal",false,1)?.key,"a:pm25.cHOLIDAY_2016.icon.png");
assert.equal(match(25,"PikachuNormal",true,1)?.key,"a:pm25.cHOLIDAY_2016.s.icon.png");
assert.equal(match(1007,"Unset").key,null);
assert.equal(match(25,"PikachuNormal",false,9999).key,null);
assert.equal(match(487,"GiratinaUnknownVariant").key,null);
assert.equal(index.idStatus(150).legendary,true);
assert.equal(index.idStatus(151).mythical,true);
assert.equal(index.idStatus(1).canEvolve,true);
assert.equal(index.idStatus(3).canEvolve,false);
assert.match(ui,/const isShadow=p=>Number\(p\.alignment\)===1/);
assert.match(ui,/const isPurified=p=>Number\(p\.alignment\)===2/);
assert.match(ui,/const isLocationBg=p=>hasBackground\(p\)&&backgroundMeta\(p\)\?\.type==="LOCATION_CARD"/);
assert.match(ui,/const isUnknownBg=p=>hasBackground\(p\)&&!backgroundMeta\(p\)/);
assert.match(ui,/isMegaRegistered=p=>!!p\.hasMegaEvolved\|\|Number\(p\.megaFormsCount\)>0/);
assert.match(ui,/function loadSpriteIndex\(/);
assert.match(ui,/function renderSpriteCoverage\(/);
assert.match(ui,/function safeSprite\(/);
assert.match(java,/new PokedexSpriteStore/);
assert.match(java,/individual\.put\("megaFormsCount"/);
assert.match(java,/https:\/\/pokesearch\.local\/sprite\//);
assert.match(store,/PINNED_COMMIT="db10df75d6f6f92018d9786af0aecc4ef"/);
assert.match(store,/gitSha\(pending,transferred\)/);
assert.match(store,/getFilesDir\(\),"pokedex_sprites"/);
assert.match(html,/pokedex_sprite_catalog\.js/);
assert.match(html,/sprites-download-collection/);
assert.match(html,/sprites-download-all/);
assert.match(html,/sprites-download-legacy/);
console.log("LT400 sprite catalog: 6.063 arquivos indexados; mapeamento exato de formas/trajes/shiny e filtros aprovado.");

"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const base="app/src/main/assets/";
const catalog=require("../src/main/assets/pokedex_sprite_catalog.js");
const delivery=require("../src/main/assets/pokedex_sprite_delivery.js");
const manifest=JSON.parse(fs.readFileSync(base+"pokedex_sprite_manifest.json","utf8"));
const index=catalog.create(manifest);
const ui=fs.readFileSync(base+"personal_pokedex.js","utf8");
const java=fs.readFileSync(
  "app/src/main/java/com/lucianotoscano/pokesearchoverlay/PersonalPokedexActivity.java","utf8");
assert.equal(fs.existsSync(base+"pokemon-sprites/base/150.png"),false,
 "Mewtwo base art is not packaged; do not select its nonexistent file URL");
assert.match(java,/@JavascriptInterface public boolean hasBundledSprite/);
assert.match(java,/getAssets\(\)\.open\(asset\)/);
assert.match(java,/pokemon-sprites\/\(\?:base\|shiny\|forms\|costumes\)/);
assert.match(ui,/bundledSpriteExists\(uri\)/);
assert.match(ui,/window\.pokeSpriteRetry\(this\)/);
new vm.Script(ui);
// Run the original UI's sprite functions against the exact production catalog,
// without needing a browser, network, Android SDK or a player's PGSStats.
const section=ui.slice(ui.indexOf("function spriteLocalUrl("),
  ui.indexOf("function filterPokemon("));
assert.ok(section.includes("function safeSprite("));
const state={spriteIndex:index,spriteCached:new Set(),
 bundledSpriteAvailability:new Map()};
const seen=[];
const bridge={hasBundledSprite(path){seen.push(path);return false;}};
const names={150:"Mewtwo",487:"Giratina",888:"Zacian",889:"Zamazenta",645:"Landorus"};
const context={
 state,bridge,window:{PokeSearchSpriteDelivery:delivery,
  PokeSearchOfflineSprite:{resolve(card){
   return {src:"file:///android_asset/pokemon-sprites/base/"+card.number+".png",offline:true};
  }}},
 document:{createElement(){return {className:"",textContent:"",setAttribute(){}};}},
 visualMatch(p){return index.classify({...p,name:names[p.species]||"Magikarp"});},
 speciesName:p=>names[p.species]||"Magikarp",
 formVariant:()=>"",
 costumeMeta:()=>null,
 escapeHtml:value=>String(value).replace(/&/g,"&amp;").replace(/"/g,"&quot;")
};
vm.runInNewContext(section,context);
const call=(name,...args)=>vm.runInNewContext(name+"("+args.map(x=>JSON.stringify(x)).join(",")+")",context);
function pokemon(species,form,shiny=false){
 return {id:String(species)+"-"+form+"-"+shiny,species,form,formName:"",
 costume:0,gender:3,shiny};
}
const normal=pokemon(150,135),armored=pokemon(150,133),altered=pokemon(487,90);
assert.equal(call("safeSprite",normal),"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png");
assert.ok(seen.includes("pokemon-sprites/base/150.png"),
 "The UI must check if a packaged candidate actually exists");
assert.equal(call("safeSprite",armored),delivery.remoteUrl("a:pm150.fA.icon.png",index));
assert.equal(call("safeSprite",altered),delivery.remoteUrl("a:pm487.fALTERED.icon.png",index));
assert.equal(call("safeSprite",pokemon(150,999999)),"",
 "Unknown numeric forms must never be downgraded to base art");
for(const [id,form,key] of [[888,2577,"pm888.fHERO.icon.png"],
 [889,2579,"pm889.fHERO.icon.png"],[645,144,"pm645.fINCARNATE.icon.png"]]){
 assert.equal(call("safeSprite",pokemon(id,form)),
  delivery.remoteUrl("a:"+key,index));
}
const normalHtml=call("artHtml",normal,"sprite");
const armoredHtml=call("artHtml",armored,"sprite");
assert.match(normalHtml,/PokeMiners/);
assert.match(normalHtml,/PokeAPI\/sprites/);
assert.match(armoredHtml,/pm150\.fA\.icon\.png/);
assert.doesNotMatch(armoredHtml,/PokeAPI\/sprites/);
state.spriteCached.add("a:pm150.fA.icon.png");
assert.match(call("safeSprite",armored),/^https:\/\/pokesearch\.local\/sprite\/a\//);
const placeholder={tagName:"PLACEHOLDER"};
let replaced;
const image={className:"sprite",dataset:{spriteBackups:JSON.stringify([
 "https://example.test/retry1.png","https://example.test/retry2.png"
 ])},src:"",replaceWith:x=>{replaced=x;}};
context.window.pokeSpriteRetry(image);
assert.equal(image.src,"https://example.test/retry1.png");
context.window.pokeSpriteRetry(image);
assert.equal(image.src,"https://example.test/retry2.png");
context.window.pokeSpriteRetry(image);
assert.equal(replaced.textContent,"◇");
console.log("LT403: missing asset guard, exact GO fallback, Shiny/form isolation and retry chain passed.");

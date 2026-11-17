"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const root="app/src/main/assets/";
const source=fs.readFileSync(root+"personal_pokedex.js","utf8");
const manifest=JSON.parse(fs.readFileSync(root+"pokedex_sprite_manifest.json","utf8"));
const catalog=require("../src/main/assets/pokedex_sprite_catalog.js").create(manifest);
const delivery=require("../src/main/assets/pokedex_sprite_delivery.js");
// LT406: the native catalog must accept the shipped 40-character commit pin.
const nativeStore=fs.readFileSync(
 "app/src/main/java/com/lucianotoscano/pokesearchoverlay/PokedexSpriteStore.java","utf8");
const nativePin=nativeStore.match(/private static final String PINNED_COMMIT="([0-9a-f]{40})";/);
assert.ok(nativePin,"Android sprite store needs a full SHA pin");
assert.equal(nativePin[1],manifest.commit,
 "Android store must accept the bundled manifest or numeric forms lose their artwork");
const deliveryCode=fs.readFileSync(root+"pokedex_sprite_delivery.js","utf8");
const deliveryPin=deliveryCode.match(/const PIN="([0-9a-f]{40})";/);
assert.ok(deliveryPin,"Web sprite provider needs a full SHA pin");
assert.equal(deliveryPin[1],manifest.commit,
 "Android, manifest and WebView must all reference the same PokeMiners commit");
assert.ok(manifest.files.length>=3850&&manifest.legacy.length>=2213,
 "The sprite catalog must not be silently emptied");
new vm.Script(source);
const start=source.indexOf("function spriteLocalUrl(");
const end=source.indexOf("function filterPokemon(");
assert.ok(start>0&&end>start);
const names={
 150:"Mewtwo",445:"Garchomp",376:"Metagross",635:"Hydreigon",
 464:"Rhyperior",706:"Goodra",612:"Haxorus",534:"Conkeldurr",
 149:"Dragonite",487:"Giratina",888:"Zacian"
};
const state={spriteIndex:catalog,spriteCached:new Set(),
  bundledSpriteAvailability:new Map()};
const attempts=[];
const context={
 state,bridge:{hasBundledSprite(name){attempts.push(name);return false;}},
 window:{PokeSearchSpriteDelivery:delivery,
  PokeSearchOfflineSprite:{resolve(card){
   return {src:"file:///android_asset/pokemon-sprites/base/"+card.number+".png",offline:true};
  }}},
 speciesName:p=>names[p.species]||("#"+p.species),
 formVariant:p=>{
   const row=catalog.forms.get(Number(p.form));
   return !row||/^(NORMAL|UNSET|DEFAULT)$/i.test(row[1])?"":String(row[1]).toUpperCase();
 },
 costumeMeta:()=>null,
 visualMatch:p=>catalog.classify({...p,name:names[p.species]}),
 escapeHtml:v=>String(v).replace(/&/g,"&amp;").replace(/"/g,"&quot;"),
 document:{createElement:()=>({className:"",textContent:"",setAttribute(){}})}
};
vm.runInNewContext(source.slice(start,end),context);
function call(name,p,...rest){
  const args=[p,...rest].map(x=>JSON.stringify(x)).join(",");
  return vm.runInNewContext(name+"("+args+")",context);
}
const pokemon=(species,form,shiny=false,gender=3,costume=0)=>({
 id:species+":"+form+":"+shiny+":"+gender,species,form,shiny,
 formName:"",costume,gender
});
const official=dex=>
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/"+dex+".png";
const restored=[
 [150,135],[445,867],[376,770],[635,2297],[464,852],
 [706,2811],[612,2228],[534,2006],[149,196]
];
for(const [dex,form] of restored){
 const p=pokemon(dex,form);
 assert.equal(call("safeSprite",p),official(dex),
   "Default art should not depend on GO remote host: "+names[dex]);
 assert.ok(catalog.classify({...p,name:names[dex]}).key,
   "Exact GO entry retained as fallback: "+names[dex]);
 const html=call("artHtml",p,"sprite");
 assert.ok(html.includes("other/official-artwork/"+dex+".png"));
 assert.ok(html.includes("PokeMiners"),"Exact GO fallback: "+names[dex]);
 assert.ok(html.includes("cdn.jsdelivr.net"),"Alternative CDN for common artwork");
}
assert.ok(attempts.includes("pokemon-sprites/base/150.png"),
 "Must still reject missing packaged files before selecting online art");
const shiny=pokemon(376,770,true);
assert.equal(call("safeSprite",shiny),
 "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/376.png");
const shinyHtml=call("artHtml",shiny,"sprite");
assert.ok(shinyHtml.includes("pm376.s.icon.png"));
assert.ok(!shinyHtml.includes("other/official-artwork/376.png"),
 "Do not substitute non-Shiny artwork");
const armored=pokemon(150,133);
assert.equal(call("safeSprite",armored),
 delivery.remoteUrl("a:pm150.fA.icon.png",catalog));
assert.ok(!call("artHtml",armored,"sprite").includes("PokeAPI"));
const altered=pokemon(487,90);
assert.equal(call("safeSprite",altered),
 delivery.remoteUrl("a:pm487.fALTERED.icon.png",catalog));
const hisuian=pokemon(706,2791);
assert.equal(call("safeSprite",hisuian),
 delivery.remoteUrl("a:pm706.fHISUIAN.icon.png",catalog));
const female=pokemon(445,867,false,2);
assert.equal(call("safeSprite",female),
 delivery.remoteUrl("a:pm445.g2.icon.png",catalog),
 "Garchomp female has distinct GO art; do not substitute generic official-artwork");
assert.ok(!call("artHtml",female,"sprite").includes("PokeAPI"));
const unknown=pokemon(150,999999);
assert.equal(call("safeSprite",unknown),"",
 "Unknown numeric variants must not receive default artwork");
const costume=pokemon(150,135,false,3,9999);
assert.equal(call("safeSprite",costume),"",
 "Unmapped costume must not be replaced by ordinary art");
const knownBase=pokemon(150,0);
assert.equal(call("safeSprite",knownBase),official(150));
const hero=pokemon(888,2577);
assert.equal(call("safeSprite",hero),
 delivery.remoteUrl("a:pm888.fHERO.icon.png",catalog));
assert.doesNotMatch(source,/window\.fetch\(|XMLHttpRequest|sendBeacon/);
console.log("LT405: high-resolution base sprites for 9 species, Shiny, costumes, gender, unknown forms and exact GO fallbacks passed.");

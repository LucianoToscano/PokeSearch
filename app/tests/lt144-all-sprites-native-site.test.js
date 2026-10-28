"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const asset=name=>fs.readFileSync(path.join(__dirname,"../src/main/assets",name),"utf8");
const src=asset("sprite_offline.js");
const probe=asset("probe.js"),dock=asset("dock.html"),detail=asset("detail.html");
const native=fs.readFileSync(path.join(__dirname,
 "../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const secondary=fs.readFileSync(path.join(__dirname,
 "../src/main/java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java"),"utf8");
// Form catalog is generated later in CI; audited Gengar/Zubat IDs are pinned.
const sprite=require("../src/main/assets/sprite_offline.js");
const local="file:///android_asset/pokemon-sprites/";
for(const [dex,name,id] of [[94,"Gengar",1044],[41,"Zubat",157],
 [25,"Pikachu",0],[6,"Charizard",0]]){
 const a=sprite.resolve({number:"#"+dex,name,form:"NORMAL",form_id:id,shiny:false});
 assert.equal(a.src,local+"base/"+dex+".png",name+" normal");
 const b=sprite.resolve({number:"#"+dex,name,form:"NORMAL",form_id:id,shiny:true});
 assert.equal(b.src,local+"shiny/"+dex+".png",name+" shiny");
}
const zubat={number:"#41",name:"Zubat",form:"ZUBAT_HALLOWEEN_2026_01",
 form_id:3362,shiny:true};
assert.equal(sprite.resolve(zubat).src,local+"costumes/pm41.fHALLOWEEN_2026_01.s.icon.png");
const exact="https://cdn.pokemon.example/pm41.fHALLOWEEN_2026_01.s.icon.png";
assert.equal(sprite.resolve({...zubat,image:exact,imageFromSite:true}).src,exact);
assert.match(sprite.resolve({number:"#10",name:"Caterpie",form:"CATERPIE_GOFEST_2026",form_id:3346}).src,/costumes\/pm10\.fGOFEST_2026\.icon\.png$/);
assert.match(sprite.resolve({number:"#25",name:"Pikachu",form:"PIKACHU_GOTOUR_2026_A",form_id:3318,shiny:true}).src,/costumes\/pm25\.fGOTOUR_2026_A\.s\.icon\.png$/);
assert.equal(sprite.resolve({...zubat,image:exact,imageFromSite:false}).src,local+"costumes/pm41.fHALLOWEEN_2026_01.s.icon.png");
const ordinary="https://cdn.pokemon.example/pm94.icon.png";
assert.equal(sprite.resolve({number:"#94",name:"Gengar",form:"NORMAL",form_id:1044,
 image:ordinary,imageFromSite:true}).src,ordinary);
assert.match(probe,/matchesIdentity|imageMatches/);
assert.match(probe,/const siteImageExact=!!image&&!!siteImageUrl/);
assert.match(probe,/const isSpriteShiny=\/✨\/\.test\(title\)/);
assert.match(probe,/encounterDex/);
assert.match(probe,/formLabel/);
assert.match(probe,/candidateNodes=Array\.from\(box\.querySelectorAll/);
assert.match(probe,/const byDex=encounterDex/);
assert.match(probe,/if\(isSpriteShiny&&!shinyEvidence\)return false/);
assert.match(probe,/if\(!isSpriteShiny&&shinyEvidence\)return false/);
assert.match(native,/@JavascriptInterface public String bundledBaseSprite\(int dex,boolean shiny\)/);
assert.match(native,/@JavascriptInterface public String bundledExactSprite\(String relative\)/);
assert.match(src,/function exactBundledData\(art\)/);
assert.match(native,/android\.util\.Base64\.encodeToString\(png,android\.util\.Base64\.NO_WRAP\)/);
assert.match(native,/buffer\.size\(\)\+count>128\*1024/);
assert.match(dock,/verifiedBundledData\?\.\(sourceCard\)/);
assert.match(dock,/exactBundledData\?\.\(engine\.resolve\(sourceCard\)\)/);
assert.match(detail,/verifiedBundledData\?\.\(c\)/);
assert.match(detail,/exactBundledData\?\.\(art\)/);
assert.match(dock,/verifiedBundledData\?\.\(exactCard\)/);
assert.match(secondary,/extends OverlayService/);
assert.doesNotMatch(native,/bundledBaseSprite\(int dex,boolean shiny\)[\s\S]{0,1800}https:\/\//);
console.log("PASS LT144: base+shiny Gengar/Zubat, exact costume, site identity, native fallback in BOTH overlays");

"use strict";
const assert=require("node:assert/strict");
const sprite=require("../src/main/assets/sprite_offline.js");
const fs=require("node:fs"),path=require("node:path");
const prefix="file:///android_asset/pokemon-sprites/";
for(const [dex,name] of [[422,"Shellos"],[423,"Gastrodon"]]){
 for(const shiny of [false,true]){
  for(const form of ["West Sea","WEST_SEA","West",name+" West Sea"]){
   const card={name,number:"#"+dex,form,shiny,image:""};
   const exact=sprite.resolve(card);
   assert.equal(exact.src,prefix+(shiny?"shiny/":"base/")+dex+".png",
    "West Sea must use its exact default PokeAPI image");
   assert.equal(exact.exactForm,true);
   assert.equal(exact.offline,true);
   const remote="https://example.com/known-good-west-"+dex+".png";
   const fromSite=sprite.resolve({...card,image:remote,imageFromSite:true});
   assert.equal(fromSite.src,remote,"Preserve validated provider's own image");
   assert.equal(fromSite.original,exact.src,"Fallback for same West Sea form and shiny");
  }
  for(const form of ["East Sea","EAST_SEA","Unknown form"]){
   const unknown=sprite.resolve({name,number:"#"+dex,form,shiny,image:""});
   assert.notEqual(unknown.src,prefix+(shiny?"shiny/":"base/")+dex+".png",
    "Unknown/East must never receive West Sea form");
   assert.equal(unknown.src,"","Unknown forms fail closed without verified art");
  }
  const wrong=sprite.resolve({name,number:"#"+dex,form:"West Sea",shiny,costume_id:71});
  assert.equal(wrong.src,"","No West Sea base fallback for a costume");
  const swapped=sprite.resolve({name:"Shellos",number:"#423",form:"West Sea",shiny});
  assert.equal(swapped.src,"","Name/dex mismatch must not pick another species");
 }
}
// Both the list and detail WebViews share the same audited resolver.
const base=path.join(__dirname,"../src/main/assets");
const dock=fs.readFileSync(path.join(base,"dock.html"),"utf8");
const detail=fs.readFileSync(path.join(base,"detail.html"),"utf8");
assert.ok(dock.includes("sprite_offline.js")||dock.includes("PokeSearchOfflineSprite"));
assert.ok(detail.includes("PokeSearchOfflineSprite.resolve(c)"));
console.log("LT161 Shellos/Gastrodon West Sea exact normal+shiny sprites, no East mismatch PASS");

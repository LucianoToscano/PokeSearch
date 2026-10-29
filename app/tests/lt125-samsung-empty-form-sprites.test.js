
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const sprite=require("../src/main/assets/sprite_offline.js");
const catalog=JSON.parse(fs.readFileSync(path.join(root,"src/main/assets/pokemon_catalog.json"),"utf8"));
const names=Object.fromEntries(catalog);
assert.equal(catalog.length,1025);
for(const [dex,name] of catalog){
 const forBase={number:"#"+dex,name,form:"",shiny:false,image:""};
 const forShiny={...forBase,shiny:true};
 assert.equal(sprite.resolve(forBase).src,"file:///android_asset/pokemon-sprites/base/"+dex+".png","base "+name);
 assert.equal(sprite.resolve(forShiny).src,"file:///android_asset/pokemon-sprites/shiny/"+dex+".png","shiny "+name);
}
for(const candidate of [
 {number:"#714",name:"Noibat",form:"GALARIAN"},
 {number:"#714",name:"Galarian Noibat",form:""},
 {number:"#714",name:"Pikachu",form:""},
 {number:"#714",name:"Noibat",form:"",costume_id:17},
 {number:"#714",name:"Noibat",form:"",form_id:10174},
 {number:"#714",name:"Noibat",form:"",region:"Galarian"},
 {number:"#714",name:"Noibat",form:"",isCostume:true},
 {number:"#714",name:"Noibat",form:"",variant:"ALTERNATE"}
 ])assert.equal(sprite.resolve(candidate).src,"","never substitute unknown special "+JSON.stringify(candidate));
const normal=sprite.resolve({number:"#714",name:"Noibat",form:"",image:"https://provider.test/unavailable/noibat.png"});
assert.equal(normal.src,"file:///android_asset/pokemon-sprites/base/714.png");
assert.equal(sprite.resolve({number:"#714",name:"Noibat",form:"",shiny:true}).src,"file:///android_asset/pokemon-sprites/shiny/714.png");
const form=sprite.resolve({number:"#144",name:"Articuno",form:"GALARIAN",shiny:true});
assert.equal(form.src,"file:///android_asset/pokemon-sprites/forms/144-galar-shiny.png");
const costume=sprite.resolve({number:"#4",name:"Charmander",form:"GOGGLES_2026"});
assert.match(costume.src,/costumes\/4-goggles-2026.png$/);
console.log("LT125 DOM empty form: 2050/2050 exact base & shiny paths, Noibat and no-special-substitution checks PASS.");

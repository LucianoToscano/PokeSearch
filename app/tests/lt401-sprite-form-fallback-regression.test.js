"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const root="app/src/main/assets/";
const catalog=require("../src/main/assets/pokedex_sprite_catalog.js");
const delivery=require("../src/main/assets/pokedex_sprite_delivery.js");
const offline=require("../src/main/assets/sprite_offline.js");
const manifest=JSON.parse(fs.readFileSync(root+"pokedex_sprite_manifest.json","utf8"));
const index=catalog.create(manifest);
const make=(species,name,form,shiny=false,costume=0)=>({
 species,name,form,formName:"",shiny,costume,gender:3
});
const fixtures=[
 [150,"Mewtwo",133,"a:pm150.fA.icon.png"],
 [150,"Mewtwo",135,"a:pm150.icon.png"],
 [487,"Giratina",90,"a:pm487.fALTERED.icon.png"],
 [888,"Zacian",2577,"a:pm888.fHERO.icon.png"],
 [889,"Zamazenta",2579,"a:pm889.fHERO.icon.png"],
 [645,"Landorus",144,"a:pm645.fINCARNATE.icon.png"],
 [380,"Latias",1631,"a:pm380.icon.png"],
 [129,"Magikarp",253,"a:pm129.icon.png"]
];
for(const [species,name,form,key] of fixtures){
 const p=make(species,name,form);
 const hit=index.classify(p);
 assert.equal(hit.key,key,"numeric form without formName: "+name+"/"+form);
 assert.equal(delivery.remoteUrl(hit.key,index).endsWith(key.slice(2)),true);
 assert.match(delivery.remoteUrl(hit.key,index),
  /^https:\/\/raw\.githubusercontent\.com\/PokeMiners\/pogo_assets\/db10df75d6f6f92018d9786af0aecc238fecc4ef\//);
}
assert.equal(index.classify(make(150,"Mewtwo",133,true)).key,
 "a:pm150.fA.s.icon.png","Armored Shiny must not use base");
assert.equal(index.classify(make(150,"Mewtwo",135,true)).key,
 "a:pm150.s.icon.png","Normal Shiny matches verified base");
assert.equal(delivery.auditedDefault(make(150,"Mewtwo",135),index,
 index.classify(make(150,"Mewtwo",135))),true);
assert.equal(delivery.auditedDefault(make(150,"Mewtwo",133),index,
 index.classify(make(150,"Mewtwo",133))),false);
assert.equal(delivery.auditedDefault(make(487,"Giratina",90),index,
 index.classify(make(487,"Giratina",90))),false);
assert.equal(index.classify(make(150,"Mewtwo",999999)).key,null,
 "Unknown numeric form is not silently replaced with normal sprite");
assert.equal(delivery.remoteUrl("a:pm150.fA.icon.png",null),"");
assert.equal(delivery.remoteUrl("a:../secret.png",index),"");
assert.equal(delivery.remoteUrl("a:pm999999.icon.png",index),"");
assert.match(offline.resolve({number:150,name:"Mewtwo",form:"",form_id:0,shiny:false}).src,
 /^file:\/\/\/android_asset\/pokemon-sprites\/base\/150\.png$/);
const ui=fs.readFileSync(root+"personal_pokedex.js","utf8");
const html=fs.readFileSync(root+"personal_pokedex.html","utf8");
const java=fs.readFileSync(
 "app/src/main/java/com/lucianotoscano/pokesearchoverlay/PersonalPokedexActivity.java","utf8");
assert.match(html,/<script src="pokedex_sprite_delivery\.js"><\/script>/);
assert.ok(html.indexOf("pokedex_sprite_delivery.js")<html.indexOf("personal_pokedex.js"));
assert.match(ui,/delivery\?\.auditedDefault/);
assert.match(ui,/delivery\?\.remoteUrl\(exact\.key,state\.spriteIndex\)/);
assert.match(java,/boolean exactRemote=/);
assert.match(java,/if\(local\|\|sprites\|\|exactRemote\)return null/);
assert.doesNotMatch(ui,/window\.fetch\(|XMLHttpRequest|sendBeacon/);
console.log("LT401: forms #150 (Normal/Armored), #487, #888/#889, #645 and strict remote sprite contracts passed.");

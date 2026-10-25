"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../src/main");
const source=fs.readFileSync(path.join(root,"assets/api_result_contract.js"),"utf8");
const cache=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/VerifiedSpriteCache.java"),"utf8");
const service=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const results=fs.readFileSync(path.join(root,"assets/dock.html"),"utf8");
const details=fs.readFileSync(path.join(root,"assets/detail.html"),"utf8");
const contract=require("../src/main/assets/api_result_contract.js");
const IMAGE_BASE="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
const timestamp=Date.UTC(2026,9,25,12);
const base={encounter_id:"furfrou-test",pokemon_id:676,pokemon_name:"Furfrou",form:"Natural",
 cp:1017,level:20,raw_iv:"0/0/0",iv_percent:0,gender:"Male",size:"M",
 location:"Wasquehal, Nord, France",despawn_at:"2099-12-31T00:00:00Z",shiny:false};
let count=0;function check(label,fn){fn();count++;console.log("PASS LT108 "+label);}
function image(item){
 const x=contract.normalizeResponse({results:[{...base,...item}],cap:10},{nowMs:timestamp});
 assert.equal(x.ok,true);
 assert.equal(x.cards.length,1);
 return x.cards[0].image;
}
check("Furfrou Natural/Natural Form/Natural Trim use exact bundled #676",()=>{
 for(const form of ["Natural","NATURAL","Natural Form","Natural Trim","Furfrou Natural",
   "Furfrou_Natural","Furfrou-Natural-Form","FURFROU_NATURAL_TRIM",
   "Furfrou","Furfrou Normal","normal","default",""]){
  assert.equal(image({form}),IMAGE_BASE+"676.png","Natural variant "+form);
 }
});
check("Furfrou Natural shiny uses shiny #676, not plain #676",()=>{
 assert.equal(image({form:"Natural",shiny:true}),IMAGE_BASE+"shiny/676.png");
});
check("special Furfrou trims and costumes never inherit the natural art",()=>{
 for(const form of ["Heart","Star","Diamond","Debutante","Matron","Dandy",
   "La Reine","Kabuki","Pharaoh","Furfrou Heart Trim","Furfrou-Dandy-Trim","Other"]){
  assert.equal(image({form}),"",form);
 }
 assert.equal(image({form:"Natural",costume_id:17}),"");
 assert.equal(image({form:"Natural",costume:"Halloween"}),"");
});
check("word natural on other species is not a global alias",()=>{
 const other={pokemon_id:25,pokemon_name:"Pikachu",form:"Natural",encounter_id:"pikachu-test"};
 assert.equal(image(other),"");
 assert.equal(image({...other,form:"Pikachu Natural Form"}),"");
});
check("base sprite is provided to both results and detail, on both overlay instances",()=>{
 assert.match(source,/item\.pokemon_id===676&&species==="FURFROU"/);
 assert.match(results,/const imageUrl=String\(c\.image\|\|""\)/);
 assert.match(details,/const src=String\(c\.image\|\|""\)/);
 assert.equal((service.match(/VerifiedSpriteCache\.fromDisk\(OverlayService\.this,request\.getUrl\(\)\)/g)||[]).length,3);
 assert.match(service,/isSecondaryOverlay\(\)/);
 assert.match(cache,/bundledSprite\(context,dex,shiny\)/);
 assert.match(cache,/pokemon-sprites\//);
});
check("do not weaken IV verification, despawn or alert path",()=>{
 assert.match(source,/parseIV\(x\.raw_iv,x\.iv_percent\)/);
 assert.match(source,/if\(end<=now\)/);
 assert.match(service,/verifiedTargetCriteria\(card\)/);
 assert.match(service,/recordNewResults\(sorted,r\.optBoolean\("leagueConfirmed",false\)\)/);
});
console.log("LT108 FURFROU BASE SPRITES "+count+"/"+count+" PASS");

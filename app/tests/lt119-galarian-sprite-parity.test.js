"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../src/main"),read=p=>fs.readFileSync(path.join(root,p),"utf8");
const sprites=require("../src/main/assets/sprite_offline.js");
const contract=require("../src/main/assets/api_result_contract.js");
const builder=fs.readFileSync(path.join(__dirname,"../scripts/build_sprite_bundle.py"),"utf8");
const dock=read("assets/dock.html"),detail=read("assets/detail.html");
const secondary=read("java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java");
let total=0;
function test(name,run){run();total++;console.log("PASS LT119 "+name);}
function fromApi(shiny){
 const raw=shiny?"15/15/15":"0/0/0",pct=shiny?100:0;
 const result=contract.normalizeResponse({cap:10,results:[{
  pokemon_id:263,pokemon_name:"Zigzagoon",form:"Galarian",
  shiny,raw_iv:raw,iv_percent:pct,cp:114,level:8,
  despawn_at:"2099-10-26T22:00:00Z"}]}, {nowMs:Date.UTC(2026,9,26,20),shiny});
 assert.equal(result.ok,true);assert.equal(result.cards.length,1);
 return result.cards[0];
}
test("P1/P2 shared sprites and independent services",()=>{
 assert.match(secondary,/extends OverlayService/);
 assert.match(dock,/PokeSearchOfflineSprite\.resolve\(c\)/);
 assert.match(detail,/PokeSearchOfflineSprite\.resolve\(c\)/);
});
test("100% shiny Galarian Zigzagoon resolves EXACT local regional sprite",()=>{
 const card=fromApi(true);
 assert.equal(card.image,"");
 assert.equal(sprites.verifiedBase(card),false);
 assert.equal(sprites.resolve(card).src,
  "file:///android_asset/pokemon-sprites/forms/zigzagoon-galar-shiny.png");
});
test("0% normal Galarian Zigzagoon resolves distinct local regional sprite",()=>{
 const card=fromApi(false);
 assert.equal(card.image,"");
 assert.equal(sprites.resolve(card).src,
  "file:///android_asset/pokemon-sprites/forms/zigzagoon-galar.png");
});
test("unknown regional Pokémon, unverified forms, and costumes do not borrow artwork",()=>{
 for(const form of ["Alolan","Hisuian","Galarian Hat"]){
  const x={name:"Zigzagoon",number:"#263",form,image:"",shiny:true};
  assert.equal(sprites.resolve(x).src,"",form);
 }
 assert.equal(sprites.resolve({name:"Linoone",number:"#264",form:"Galarian",image:""}).src,
  "file:///android_asset/pokemon-sprites/forms/264-galar.png");
 assert.equal(sprites.resolve({name:"Zigzagoon",number:"#263",form:"Normal",shiny:false,image:""}).src,
  "file:///android_asset/pokemon-sprites/base/263.png");
 assert.equal(sprites.resolve({name:"Zigzagoon",number:"#263",form:"Galarian",costume_id:2,image:""}).src,"");
});
test("source commit pinned and both exact PNGs mandatory in APK build",()=>{
 assert.match(builder,/FORM_SOURCE_COMMIT = "[a-f0-9]{40}"/);
 assert.match(builder,/"forms\/zigzagoon-galar-shiny\.png": "shiny\/10174\.png"/);
 assert.match(builder,/form_hashes\[output\] = hashlib\.sha256\(data\)\.hexdigest\(\)/);
});
console.log("LT119 regional dual sprite regression "+total+"/"+total+" PASS");

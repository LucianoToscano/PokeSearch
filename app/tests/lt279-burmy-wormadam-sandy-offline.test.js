"use strict";
// LT279: a real Samsung Burmy Sandy card showed BU/Sandy placeholder instead
// of art. Require immutable, bundled cloak PNGs for BOTH overlay WebViews.
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../src/main/assets");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const sprites=require("../src/main/assets/sprite_offline.js");
const manifest=read("go-exact-sprites.tsv");
const spriteCode=read("sprite_offline.js");
const detail=read("detail.html"),dock=read("dock.html");
const builder=fs.readFileSync(path.join(__dirname,"../scripts/build_sprite_bundle.py"),"utf8");
const workflow=fs.readFileSync(path.join(__dirname,"../../.github/workflows/pokesearch-official-release.yml"),"utf8");
const local="file:///android_asset/pokemon-sprites/costumes/";
const upstream="https://raw.githubusercontent.com/PokeMiners/pogo_assets/";
const expectedNames=[];
for(const [dex,name] of [[412,"Burmy"],[413,"Wormadam"]]){
 for(const [form,display] of [["PLANT","Plant"],["SANDY","Sandy"],["TRASH","Trash"]]){
  for(const shiny of [false,true]){
   const file="pm"+dex+".f"+name.toUpperCase()+"_"+form+
    (shiny?".s":"")+".icon.png";
   const card={name,number:"#"+dex,form:display,shiny,costume_id:0,image:""};
   const resolved=sprites.resolve(card);
   assert.equal(resolved.src,local+file,name+" "+form+" "+shiny+" local source");
   assert.equal(resolved.offline,true,"exact variant must be bundled for offline Samsung");
   assert.equal(resolved.exactForm,true);
   assert.ok(resolved.original.startsWith(upstream),file+" pinned immutable origin");
   assert.ok(resolved.original.endsWith("/"+file));
   assert.equal(sprites.resolve({...card,form:name+"_"+form}).src,local+file);
   assert.equal(sprites.resolve({...card,form:form+"_FORM"}).src,local+file);
   assert.equal(sprites.resolve({...card,image:"https://example.test/exact.png",
     imageFromSite:true}).src,local+file,"site lazy image cannot hide confirmed offline art");
   assert.ok(manifest.split("\n").some(line=>line.startsWith(file+"\t")&&
     /^[a-f0-9]{40}$/.test(line.slice(file.length+1))),
     file+" verified upstream Git blob");
   assert.ok(builder.includes('"costumes/'+file+'"'),"build packs "+file);
   assert.ok(workflow.includes('"'+file+'"'),"signed APK gate requires "+file);
   assert.ok(spriteCode.includes('"'+file+'"'),"browser knows the local file "+file);
   expectedNames.push(file);
  }
 }
 const unknown=sprites.resolve({name,number:"#"+dex,form:"Unknown",image:""});
 assert.equal(unknown.src,"","no unrelated cloak or base placeholder for unknown form");
 const costume=sprites.resolve({name,number:"#"+dex,form:"Sandy",
  costume_id:999,image:""});
 assert.notEqual(costume.src,local+"pm"+dex+".f"+name.toUpperCase()+
  "_SANDY.icon.png","unknown costume cannot reuse plain form image");
}
assert.equal(expectedNames.length,12);
assert.ok(detail.includes("PokeSearchOfflineSprite.resolve(c)"));
assert.ok(dock.includes("PokeSearchOfflineSprite"));
console.log("LT279 Burmy/Wormadam 3 cloaks x normal/Shiny pinned offline and both WebViews PASS");

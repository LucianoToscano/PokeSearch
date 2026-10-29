"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const helper=require("../src/main/assets/sprite_offline.js");
const index=JSON.parse(fs.readFileSync(path.join(root,"scripts/verified-variety-sprites.json"),"utf8"));
const bundle=fs.readFileSync(path.join(root,"scripts/build_sprite_bundle.py"),"utf8");
const script=fs.readFileSync(path.join(root,"scripts/fetch_all_verified_varieties.py"),"utf8");
const workflow=fs.readFileSync(path.join(root,"../.github/workflows/lt125-go-costumes-counts-signed-qa.yml"),"utf8");
const byId=new Map();
for(const [key,value] of Object.entries(helper.FORM_VARIANTS)){
 if(!byId.has(value[0]))byId.set(value[0],key);
}
assert.equal(byId.size,317);
assert.deepEqual(index.ids,[...byId.keys()].sort((a,b)=>a-b));
assert.equal(index.sourceCommit,"d8c2fb78563e28ad7b3abe938cf6e79998d04e90");
for(const [id,key] of byId){
 const [dex,form]=key.split(":");
 for(const shiny of [false,true]){
  const art=helper.resolve({number:"#"+dex,form,shiny,image:""});
  assert.equal(art.officialForm,true,key);
  assert.equal(art.offline,true,key);
  assert.ok(art.src.startsWith("file:///android_asset/pokemon-sprites/forms/"),key);
  assert.ok(art.src.endsWith(".png"),key);
  assert.ok(art.original.endsWith("/"+(shiny?"shiny/":"")+id+".png"),key);
 }
}
assert.match(script,/len\(result\) != 634/);
assert.match(bundle,/form_hashes\.update\(fetch_varieties\(dest\)\)/);
assert.match(workflow,/len\(report\['forms'\]\)==716/);
console.log("LT125 variety bundle: 317 exact kinds + 317 shiny, all offline paths PASS");

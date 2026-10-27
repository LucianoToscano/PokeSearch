"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const dir=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(dir,p),"utf8");
const sprites=require("../src/main/assets/sprite_offline.js");
const chat=read("src/main/java/com/lucianotoscano/pokesearchoverlay/CommunityScrapbookOnline.java");
const stats=read("src/main/java/com/lucianotoscano/pokesearchoverlay/FirebaseStats.java");
const builder=read("scripts/build_sprite_bundle.py");
const wwm=read("scripts/fetch_wwm_pumpkaboo.py");
const importer=read("scripts/import_wwm_catalog.py");
const rules=JSON.parse(read("../firebase-realtime.rules.json")).rules;
assert.match(stats,/static synchronized FirebaseApp ensureApp\(Context context\)/);
assert.match(chat,/FirebaseStats\.ensureApp\(activity\)/);
assert.match(chat,/chatReadable=true;refreshSend\(\)/);
assert.match(chat,/DatabaseError\.PERMISSION_DENIED/);
assert.match(chat,/messagesQuery\.removeEventListener\(messagesListener\)/);
assert.match(chat,/if\(destroyed\|\|!authenticated\|\|!chatReadable\|\|sending/);
assert.match(chat,/setOnClickListener\(v->retryConnect\(\)\)/);
assert.match(rules.chat.messages[".read"],/query\.limitToLast/);
assert.match(importer,/COMMIT = "42b315f317ca8cee8e178249328eab5173e5ca70"/);
assert.match(importer,/len\(species\)!=1025 or len\(form_by_id\)!=1478 or len\(costume_by_id\)!=87/);
assert.match(builder,/form_hashes\.update\(external_form_hashes\)/);
assert.match(wwm,/WWM_COMMIT = "998bf635194a11078b6375c79d1494d5eb999b39"/);
const keys=[["Small",2641],["Average",2642],["Large",2643],["Super",2644]];
for(const [name,id] of keys){
 for(const shiny of [false,true]){
  const suffix=name.toLowerCase()+(shiny?"-shiny":"");
  for(const form of [name,"PUMPKABOO_"+name.toUpperCase()]){
   const result=sprites.resolve({name:"Pumpkaboo",number:"#710",form,shiny,image:""});
   assert.equal(result.src,"file:///android_asset/pokemon-sprites/forms/wwm-710-"+suffix+".png");
   assert.equal(result.exactForm,true);assert.equal(result.offline,true);
  }
  const byId=sprites.resolve({name:"Pumpkaboo",number:"#710",form:"",form_id:id,shiny});
  assert.equal(byId.src,"file:///android_asset/pokemon-sprites/forms/wwm-710-"+suffix+".png");
  assert.equal(sprites.resolve({name:"Pumpkaboo",number:"#710",form:name,
    form_id:id+100,costume_id:null,shiny}).src,"");
  assert.equal(sprites.resolve({name:"Pumpkaboo",number:"#710",form:name,
    costume_id:57,shiny}).src,"");
  assert.equal(sprites.resolve({name:"Gourgeist",number:"#710",form:name,shiny}).src,"");
 }
}
assert.equal(sprites.resolve({name:"Drifblim",number:"#426",form:"",image:""}).src,
  "file:///android_asset/pokemon-sprites/base/426.png");
assert.equal(sprites.resolve({name:"Drifblim",number:"#426",form:"DRIFBLIM_NORMAL",shiny:true}).src,
  "file:///android_asset/pokemon-sprites/shiny/426.png");
assert.equal(sprites.resolve({name:"Pumpkaboo",number:"#710",form:"UNKNOWN_SPECIAL"}).src,"");
console.log("LT126 chat bootstrap/perms and eight WWM Pumpkaboo exact sprites: PASS");

"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const firebase=read("src/main/java/com/lucianotoscano/pokesearchoverlay/FirebaseStats.java");
const chat=read("src/main/java/com/lucianotoscano/pokesearchoverlay/CommunityScrapbookOnline.java");
const api=require("../src/main/assets/api_result_contract.js");
const art=require("../src/main/assets/sprite_offline.js");
const builder=read("scripts/update_wwm_catalog.py");
const dock=read("src/main/assets/dock.html"),detail=read("src/main/assets/detail.html");
assert.match(firebase,/static synchronized FirebaseApp ensureApp\(Context context\)/);
assert.match(chat,/FirebaseStats\.ensureApp\(activity\)/);
assert.match(chat,/DatabaseError\.PERMISSION_DENIED/);
assert.match(chat,/chatReadable=false/);
assert.match(chat,/!authenticated\|\|!chatReadable\|\|sending/);
assert.match(chat,/void retryChat\(\)/);
assert.match(dock,/<script src="wwm_catalog\.js"><\/script>/);
assert.match(detail,/<script src="wwm_catalog\.js"><\/script>/);
assert.match(builder,/42b315f317ca8cee8e178249328eab5173e5ca70/);
assert.match(builder,/defaultFormId/);
assert.match(builder,/translations\/pt-br\/forms\.json/);
const base="file:///android_asset/pokemon-sprites/base/";
const shiny="file:///android_asset/pokemon-sprites/shiny/";
for(const dex of [710,711]){
 for(const form of ["Average","PUMPKABOO_AVERAGE","GOURGEIST_AVERAGE"]){
  if(!form.startsWith(dex===710?"PUMPKABOO":"GOURGEIST")&&form!=="Average")continue;
  const name=dex===710?"Pumpkaboo":"Gourgeist";
  assert.equal(art.resolve({name,number:"#"+dex,form,image:""}).src,base+dex+".png");
  assert.equal(art.resolve({name,number:"#"+dex,form,shiny:true,image:""}).src,shiny+dex+".png");
 }
 for(const form of ["Small","Large","Super"]){
  const resolved=art.resolve({name:dex===710?"Pumpkaboo":"Gourgeist",number:"#"+dex,form,image:""});
  assert.notEqual(resolved.src,base+dex+".png");
 }
}
assert.equal(art.resolve({name:"Drifblim",number:"#426",form:"",image:""}).src,base+"426.png");
assert.equal(art.resolve({name:"Pumpkaboo",number:"#710",form:"Average",costume_id:57}).src,"");
const now=Date.now();
const response=api.normalizeResponse({cap:10,results:[{pokemon_id:710,pokemon_name:"Pumpkaboo",form:"AVERAGE",form_id:2641,cp:645,level:21,raw_iv:"0/14/13",iv_percent:60,despawn_at:new Date(now+600000).toISOString()}]}, {nowMs:now});
assert.equal(response.ok,true);assert.equal(response.cards[0].form_id,2641);
assert.equal(art.resolve(response.cards[0]).src,base+"710.png");
console.log("LT126: shared Firebase Chat, pinned metadata importer and Pumpkaboo/Drifblim sprite regressions PASS");

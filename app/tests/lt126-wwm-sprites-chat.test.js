"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
require("../src/main/assets/wwm_catalog_snapshot.js");
const resolve=require("../src/main/assets/sprite_offline.js").resolve;
const catalog=globalThis.PokeSearchWWMCatalog;
assert.equal(catalog.schema,"pokesearch-wwm-catalog-v1");
assert.equal(catalog.forms["2642"].proto,"PUMPKABOO_AVERAGE");
const pump={number:"#710",name:"Pumpkaboo",form:"Average",form_id:2642,image:""};
assert.equal(resolve(pump).src,"file:///android_asset/pokemon-sprites/external/710-f2642.png");
assert.equal(resolve({...pump,shiny:true}).src,"file:///android_asset/pokemon-sprites/external/710-f2642-shiny.png");
assert.equal(resolve({...pump,form_id:2641}).src,"","wrong form ID must remain missing");
assert.equal(resolve({...pump,name:"Drifblim"}).src,"","wrong species must remain missing");
assert.equal(resolve({...pump,costume_id:23}).src,"","costume cannot borrow image");
assert.equal(resolve({...pump,form:"Large"}).src.endsWith("/forms/variety-10028.png"),true);
assert.equal(resolve({number:"#426",name:"Drifblim",form:"",image:""}).src,
  "file:///android_asset/pokemon-sprites/base/426.png");
assert.equal(resolve({number:"#426",name:"Drifblim",shiny:true,form:""}).src,
  "file:///android_asset/pokemon-sprites/shiny/426.png");
assert.equal(resolve({number:"#714",name:"Noibat",form:""}).src,
  "file:///android_asset/pokemon-sprites/base/714.png");
const saved=globalThis.PokeSearchWWMCatalog;
try{
  globalThis.PokeSearchWWMCatalog={
    ...catalog,species:{...catalog.species,"426":{name:"Drifblim",formIds:[1748]}},
    forms:{...catalog.forms,"1748":{name:"Normal",proto:"DRIFBLIM_NORMAL"}}
  };
  assert.equal(resolve({number:"#426",name:"Drifblim",form:"Normal",form_id:1748}).src,
    "file:///android_asset/pokemon-sprites/base/426.png");
  assert.equal(resolve({number:"#426",name:"Drifblim",form:"Normal",form_id:2642}).src,"");
}finally{globalThis.PokeSearchWWMCatalog=saved;}
const build=read("scripts/build_sprite_bundle.py");
const imp=read("scripts/import_wwm_catalog.py");
const chat=read("src/main/java/com/lucianotoscano/pokesearchoverlay/CommunityScrapbookOnline.java");
const stats=read("src/main/java/com/lucianotoscano/pokesearchoverlay/FirebaseStats.java");
const api=read("src/main/assets/api_result_contract.js");
const dock=read("src/main/assets/dock.html"),detail=read("src/main/assets/detail.html");
assert.match(build,/from import_wwm_catalog import sync as import_wwm/);
assert.match(imp,/APPROVED = \(\(710, 2642, "PUMPKABOO_AVERAGE", "Average"\),\)/);
assert.match(imp,/form.get\("proto"\)!=proto/);
assert.match(imp,/len\(species\)!=1025/);
assert.match(imp,/if not png_check\(data\)/);
assert.match(dock,/<script src="wwm_catalog_snapshot\.js"><\/script>/);
assert.match(detail,/<script src="wwm_catalog_snapshot\.js"><\/script>/);
assert.match(api,/if\(formId!==null\) entry.form_id=formId/);
assert.match(chat,/FirebaseStats\.chatApp\(activity\)/);
assert.match(chat,/error.getCode\(\)==DatabaseError.PERMISSION_DENIED/);
assert.match(chat,/setStatus\("● Conversa ao vivo"\)/);
assert.match(stats,/static synchronized FirebaseApp chatApp\(Context context\)/);
console.log("LT126: exact WWM 710 Average normal/Shiny, ID rejection, Drifblim and Firebase chat contracts PASS");

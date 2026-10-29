"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../src/main");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const helper=require("../src/main/assets/sprite_offline.js");
const contract=require("../src/main/assets/api_result_contract.js");
const detail=read("assets/detail.html"),dock=read("assets/dock.html");
const service=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
let count=0;const check=(label,fn)=>{fn();count++;console.log("PASS LT108 "+label)};
const base="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/";
const dex=676;
const card=(overrides={})=>({name:"Furfrou",number:"#676",form:"Natural",shiny:false,image:"",...overrides});
function api(form,extra={}){
 const entry={encounter_id:"furfrou",pokemon_id:676,pokemon_name:"Furfrou",
 cp:1017,level:20,raw_iv:"0/0/0",iv_percent:0,gender:"Male",
 location:"Wasquehal, Nord, France",despawn_at:"2099-10-25T20:00:00Z",
 form,shiny:false,...extra};
 return contract.normalizeResponse({results:[entry],cap:10},{nowMs:Date.UTC(2026,9,25)});
}
check("Furfrou Natural is precisely the normal coat with usable sprite URL",()=>{
 for(const form of ["Natural","Furfrou Natural","FURFROU_NATURAL"]){
  const r=api(form);
  assert.equal(r.cards.length,1,form);
  assert.equal(r.cards[0].image,base+"676.png",form);
 }
});
check("Furfrou trims have their verified GO form art, never the ordinary base",()=>{
 for(const form of ["Dandy","Debutante","Heart","Diamond","Matron","Pharaoh","Kabuki","La Reine"]){
  assert.equal(api(form).cards[0].image,"",form); // Search API does not provide art URLs.
  const art=helper.resolve(card({form,image:""}));
  assert.ok(art.src.includes("pm676.f"+form.toUpperCase().replace(/ /g,"_")+".icon.png"),
    form+" must resolve its verified same-form GO sprite");
  assert.equal(art.goExact,true);
  assert.ok(!art.src.includes("/base/676.png"),"Never substitute Natural for a trim");
 }
 assert.equal(api("Natural",{costume_id:32}).cards[0].image,"");
});
check("Furfrou natural safely resolves even if provider has no URL",()=>{
 const art=helper.resolve(card());
 assert.deepEqual(art,{src:"file:///android_asset/pokemon-sprites/base/676.png",original:base+"676.png",offline:true});
 assert.equal(helper.resolve(card({shiny:true})).src,"file:///android_asset/pokemon-sprites/shiny/676.png");
 assert.equal(helper.resolve(card({name:"Other",number:"#676"})).src,"");
 assert.equal(helper.resolve(card({number:"#677"})).src,"");
});
check("results and details use same strictly verified local asset path",()=>{
 for(const id of [1,25,676,1000,1025]){
  const a=helper.resolve({image:base+id+".png"});
  assert.equal(a.src,"file:///android_asset/pokemon-sprites/base/"+id+".png");
  assert.equal(helper.resolve({image:base+"shiny/"+id+".png"}).src,
    "file:///android_asset/pokemon-sprites/shiny/"+id+".png");
 }
 assert.match(detail,/<script src="sprite_offline\.js"><\/script>/);
 assert.match(dock,/<script src="sprite_offline\.js"><\/script>/);
 assert.match(detail,/PokeSearchOfflineSprite\.resolve\(c\)/);
 assert.match(dock,/PokeSearchOfflineSprite\.resolve\(c\)/);
 assert.match(dock,/esc\(originalUrl\)/);
});
check("provider-only forms and data images retain their own exact URLs",()=>{
 const provider="https://trusted.example.org/unknown-special-form.png";
 const fromSite=helper.resolve({name:"Furfrou",number:"#676",form:"Dandy",
  image:provider,imageFromSite:true});
 assert.equal(fromSite.src,provider,"Original provider image takes priority when verified");
 assert.equal(helper.resolve({image:"data:image/png;base64,aGVsbG8="}).src,"data:image/png;base64,aGVsbG8=");
 assert.equal(helper.resolve({image:base+"1026.png"}).offline,false);
});
check("each detail WebView is created for each overlay service, both share assets",()=>{
 assert.match(service,/detailPanel=new WebView\(this\)/);
 assert.match(service,/resultPanel=new WebView\(this\)/);
 assert.match(service,/detailPanel\.loadUrl\("file:\/\/\/android_asset\/detail.html"\)/);
 assert.match(service,/resultPanel\.loadUrl\("file:\/\/\/android_asset\/dock.html\?results=1"\)/);
 assert.match(service,/isSecondaryOverlay\(\)/);
 assert.match(detail,/img\.onload=/);
 assert.match(detail,/img\.onerror=/);
 assert.match(detail,/img\.naturalWidth>=8/);
});
console.log("LT108 OFFLINE CARD SPRITES "+count+"/"+count+" PASS");

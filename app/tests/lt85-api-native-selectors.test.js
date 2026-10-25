"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const bridge=require("../src/main/assets/api_android_session.js");
const base=path.join(__dirname,"../src/main");
const dock=fs.readFileSync(path.join(base,"assets/dock.html"),"utf8");
const native=fs.readFileSync(path.join(base,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const settings=fs.readFileSync(path.join(base,"java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
const collector=fs.readFileSync(path.join(base,"java/com/lucianotoscano/pokesearchoverlay/AuthorizedApiCollector.java"),"utf8");
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const formRows=[
 {pokemon_id:19,form_id:0,species_name:"Rattata",form_name:"Rattata"},
 {pokemon_id:19,form_id:46,species_name:"Rattata",form_name:"Alolan Rattata"},
 {pokemon_id:19,form_id:47,species_name:"Rattata",form_name:"Rattata Costume",costume_id:1234},
 {pokemon_id:20,form_id:0,species_name:"Raticate",form_name:"Raticate"}
];
let getCatalogCalls=0;
const session=bridge.createSession({
 siteOrigin:()=>"https://pogocoordinates.com",
 catalog:{
  async getCatalog(){
   getCatalogCalls++;
   return {ok:true,forms:["Normal","Alola","Galar"],catalogSpeciesForms:formRows};
  },dispose(){}
 },
 transport:{search:async()=>({ok:false,reason:"unsupported-filter"}),
  reveal:async()=>({ok:false,reason:"invalid-request"}),dispose(){}}
});
async function take(ticket){
 for(let attempts=0;attempts<4;attempts++){await flush();const result=session.take(ticket);
  if(!result.pending)return result;}
 throw Error("Result pending");
}
async function run(){
 assert.match(native,/getBoolean\("authorizedApiQaOptIn",true\)/);
 assert.match(settings,/"Pesquisa direta pela API \(padrão ON; desmarque para usar DOM\)",true/);
 assert.match(native,/if\(authorizedApiQaSelected\(\)\)/);
 assert.match(native,/authorizedApiCollector\.forms\(wanted,response->/);
 assert.match(native,/new JSONArray\(values\[i\]\)/);
 assert.match(collector,/void forms\(String query,Callback cb\)/);
 assert.match(collector,/window\.PokeSearchAndroidApi\.startForms/);
 assert.doesNotMatch(dock,/Usar opções observadas no site/);
 console.log("PASS LT85 native direct API defaults and no repeated import banner");

 assert.equal(session.startSuggestions(1,"Rattata").pending,true);
 const r=await take(1);
 assert.equal(r.ok,true,JSON.stringify(r));
 assert.equal(r.source,"authorized-api-catalog");
 const standard=r.options.find(x=>x.label==="Rattata");
 const variant=r.options.find(x=>x.label==="Alolan Rattata");
 assert.ok(standard);
 assert.equal(standard.image,"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/19.png");
 assert.equal(variant.image,"");
 assert.ok(!JSON.stringify(r).includes("jwt"));
 assert.ok(!JSON.stringify(r).includes("reveal_code"));
 console.log("PASS LT85 accurate base-sprite selection; never use base for form/costume");

 assert.equal(session.startSuggestions(2,"").pending,true);
 const initial=await take(2);
 assert.equal(initial.ok,true);
 assert.ok(initial.options.length>0);
 console.log("PASS LT85 selectable official Pokémon before typing");

 assert.equal(session.startForms(3,"Alo").pending,true);
 const forms=await take(3);
 assert.deepEqual(forms.options,["Alola"]);
 assert.equal(forms.key,"form");
 assert.equal(forms.source,"authorized-api-catalog");
 assert.equal(forms.query,"Alo");
 assert.ok(getCatalogCalls>=3);
 session.dispose();
 console.log("PASS LT85 Form dropdown from verified API catalogue, no DOM fallback");
}
run().catch(e=>{console.error(e);process.exitCode=1});

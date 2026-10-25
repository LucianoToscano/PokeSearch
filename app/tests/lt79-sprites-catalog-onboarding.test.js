"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const contract=require("../src/main/assets/api_result_contract.js");
const api=require("../src/main/assets/api_android_session.js");
const card=(e={})=>({pokemon_id:25,pokemon_name:"Pikachu",cp:500,level:15,
 raw_iv:"15/15/15",iv_percent:100,despawn_at:"2099-10-24T00:00:00Z",shiny:false,...e});
const sprite=x=>contract.normalizeResponse({results:[x]},{nowMs:0}).cards[0].image;
assert.match(sprite(card()),/\/pokemon\/25\.png$/);
assert.match(sprite(card({shiny:true})),/\/shiny\/25\.png$/);
for(const variant of [{form:"Alola"},{costume:"Halloween"},{costume_id:456}])
 assert.equal(sprite(card(variant)),"","No mismatched base sprite");
const session=api.createSession({siteOrigin:()=> "https://pogocoordinates.com",
 transport:{dispose(){}},catalog:{dispose(){},async getCatalog(){return {ok:true,
 catalogSpeciesForms:[
 {pokemon_id:25,species_name:"Pikachu",form_name:"Pikachu",form_id:null},
 {pokemon_id:19,species_name:"Rattata",form_name:"Rattata",form_id:0},
 {pokemon_id:19,species_name:"Rattata",form_name:"Alolan Rattata",form_id:46},
 {pokemon_id:25,species_name:"Pikachu",form_name:"Costume Pikachu",form_id:10,costume_id:5}
 ]};}}});
async function run(){
 for(const [ticket,query,expected] of [[1,"Pikachu",["Pikachu"]],[2,"Alolan",["Alolan Rattata"]]]){
  assert.equal(session.startSuggestions(ticket,query).ok,true);
  let response;
  for(let i=0;i<12;i++){
   await new Promise(r=>setImmediate(r));response=session.take(ticket);
   if(response.ok)break;
  }
  assert.equal(response.ok,true,JSON.stringify(response));
  assert.deepEqual(response.options.map(x=>x.label),expected);
  assert.equal(response.selectionVerified,false);
 }
 const overlay=fs.readFileSync(require("node:path").join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
 assert.match(overlay,/gestureHelpV1Shown/);
 console.log("PASS LT79 sprite, catalog and first-use gestures");
}
run().catch(e=>{console.error(e);process.exitCode=1;});
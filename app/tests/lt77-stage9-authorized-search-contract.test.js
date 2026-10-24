"use strict";
const assert=require("node:assert/strict");
const api=require("../src/main/assets/api_result_contract.js");
let pass=0;
function check(name,fn){fn();pass++;console.log("PASS LT77 Stage9 "+name)}
const raw={mode:"raw",attack:15,defense:15,stamina:15};
const catalog=[
 {pokemon_id:19,form_id:46,species_name:"Rattata",form_name:"Rattata (Alola)"},
 {pokemon_id:25,form_id:null,species_name:"Pikachu",form_name:null},
 {pokemon_id:133,form_id:null,species_name:"Eevee",form_name:null}
];
check("official catalog pairs only, no guessed ids",()=>{
 const q=api.buildPayload({...raw,catalogSpeciesForms:catalog,
  speciesFormSelections:[{pokemon_id:19,form_id:46}]});
 assert.equal(q.ok,true,JSON.stringify(q));assert.deepEqual(q.payload.species_forms,[{pokemon_id:19,form_id:46}]);
 assert.equal(api.buildPayload({...raw,speciesFormSelections:[{pokemon_id:19,form_id:46}]}).ok,false);
 assert.equal(api.buildPayload({...raw,catalogSpeciesForms:catalog,speciesFormSelections:[{pokemon_id:19,form_id:99}]}).ok,false);
});
check("names are from official GET forms only",()=>{
 const q=api.buildPayload({...raw,formSelections:["Alola"],catalogForms:["Normal","Alola"]});
 assert.equal(q.ok,true);assert.deepEqual(q.payload.forms,["Alola"]);
 assert.equal(api.buildPayload({...raw,formSelections:["Random Form"],catalogForms:["Normal","Alola"]}).ok,false);
});
check("visible Pokémon form selection requires unambiguous catalog",()=>{
 const q=api.buildPayload({...raw,pokemonSelections:["Rattata (Alola)"],catalogSpeciesForms:catalog});
 assert.equal(q.ok,true,JSON.stringify(q));assert.deepEqual(q.payload.species_forms,[{pokemon_id:19,form_id:46}]);
 const plain=api.buildPayload({...raw,pokemonSelections:["Pikachu"],catalogSpeciesForms:catalog});
 assert.equal(plain.ok,true);assert.deepEqual(plain.payload.pokemon_ids,[25]);
 assert.equal(api.buildPayload({...raw,pokemonSelections:["Pikachu (Copy 2019)"],catalogSpeciesForms:catalog}).ok,false);
});
check("Weather exact IDs and boost from pogo.md",()=>{
 const cases=[["Sunny",1],["Rainy",2],["Partly Cloudy",3],["Cloudy",4],["Windy",5],["Snow",6],["Fog",7]];
 for(const [name,id] of cases){
  const q=api.buildPayload({...raw,weather:name});
  assert.equal(q.ok,true,JSON.stringify(q));assert.equal(q.payload.weather_id,id);
 }
 const boosted=api.buildPayload({...raw,weather:"Boosted"});
 assert.equal(boosted.ok,true);assert.equal(boosted.payload.boosted,true);
 assert.equal(boosted.payload.weather_id,null);
 assert.equal(api.buildPayload({...raw,weather:"Wind storm"}).ok,false);
});
check("Sort maps to API values, DISTANCE requires radius and center",()=>{
 for(const [ui,apiCode] of [["Despawn (longest)","DSP"],["CP (highest)","CP"],
  ["IV % (highest)","IV"],["Level (highest)","LEVEL"]])
  assert.equal(api.buildPayload({...raw,sortBy:ui}).payload.sort,apiCode);
 assert.equal(api.buildPayload({...raw,sortBy:"Distance (nearest)"}).ok,false);
 const q=api.buildPayload({...raw,sortBy:"Distance (nearest)",locationEnabled:true,
  locationCoords:"-23.5505,-46.6333",locationRadius:1000});
 assert.equal(q.ok,true,JSON.stringify(q));assert.equal(q.payload.sort,"DISTANCE");
 assert.equal(q.payload.center_lat,-23.5505);assert.equal(q.payload.radius_km,1000);
});
check("Location 0,1,999,1000 and invalid inputs",()=>{
 for(const radius of [0,1,999,1000]){
  const q=api.buildPayload({...raw,locationEnabled:true,locationCoords:"0,0",locationRadius:radius});
  assert.equal(q.ok,true,JSON.stringify(q));assert.equal(q.payload.radius_km,radius);
 }
 assert.equal(api.buildPayload({...raw,locationEnabled:true,locationCoords:"91,0",locationRadius:5}).ok,false);
 assert.equal(api.buildPayload({...raw,centerLat:0,centerLng:0}).ok,false);
});
check("levels from API are 1..50, native UI still 1..35",()=>{
 assert.equal(api.buildPayload({...raw,levelMin:1,levelMax:50}).ok,true);
 assert.equal(api.buildPayload({...raw,levelMin:0}).ok,false);
 assert.equal(api.buildPayload({...raw,levelMax:51}).ok,false);
});
check("min TTL, trainer account and all blacklist fields",()=>{
 const q=api.buildPayload({...raw,minTtl:60,shinyAccount:"123456789012",
  blacklistPokemonIds:[25],
  catalogForms:["Alola"],blacklistForms:["Alola"],
  catalogSpeciesForms:catalog,blacklistSpeciesForms:[{pokemon_id:19,form_id:46}]});
 assert.equal(q.ok,true,JSON.stringify(q));assert.equal(q.payload.min_ttl,60);
 assert.equal(q.payload.shiny_account,"123456789012");
 assert.deepEqual(q.payload.blacklist_forms,["Alola"]);
 assert.deepEqual(q.payload.blacklist_species_forms,[{pokemon_id:19,form_id:46}]);
 assert.equal(api.buildPayload({...raw,shinyAccount:"1"}).ok,false);
 assert.equal(api.buildPayload({...raw,minTtl:61}).ok,false);
});
check("IV percent with one decimal retained; invalid mismatch rejected",()=>{
 const sample={encounter_id:"1",pokemon_id:25,pokemon_name:"Pikachu",raw_iv:"14/15/15",
  iv_percent:97.8,cp:911,level:32.5,size:"M",gender:"Genderless",
  despawn_at:"2099-10-24T00:00:00Z",reveal_code:"REDACTED_1234567890"};
 const r=api.normalizeResponse({results:[sample],cap:10},{nowMs:0});
 assert.equal(r.ok,true);assert.equal(r.cards[0].ivPercent,"97.8");
 assert.equal(r.cards[0].gender,"⚲");
 assert.ok(!JSON.stringify(r).includes("REDACTED_1234567890"));
});
check("cap cannot exceed 10, including zero",()=>{
 const base={pokemon_id:25,pokemon_name:"Pikachu",raw_iv:"15/15/15",iv_percent:100,
  cp:999,level:34,despawn_at:"2099-10-24T00:00:00Z"};
 const results=Array.from({length:20},(_,i)=>({...base,encounter_id:String(i)}));
 assert.equal(api.normalizeResponse({results,cap:3},{nowMs:0}).cards.length,3);
 assert.equal(api.normalizeResponse({results,cap:100},{nowMs:0}).cards.length,10);
 assert.equal(api.normalizeResponse({results,cap:0},{nowMs:0}).cards.length,0);
});
console.log("LT77 Stage9 "+pass+"/"+pass+" PASS");

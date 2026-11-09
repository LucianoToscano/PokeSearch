"use strict";
// Regressão: a posição da lista (PC/Nível/etc.) não controla a exibição de km.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const api=require("../src/main/assets/api_result_contract.js");
const root=path.join(__dirname,"../src/main");
const center="-5.7945,-35.2110";
const sorts=[
 ["CP (highest)","CP"],["CP (lowest)","-CP"],
 ["Level (highest)","LEVEL"],["Level (lowest)","-LEVEL"],
 ["IV % (highest)","IV"],["Despawn (longest)","DSP"],
 ["Distance (nearest)","DISTANCE"]
];
const fixture={results:[{
 encounter_id:"98765",pokemon_id:133,pokemon_name:"Eevee",
 raw_iv:"15/15/15",iv_percent:100,cp:150,level:10,
 location:"Natal, Brazil",distance_km:12.3,
 despawn_at:"2026-11-09T20:00:00Z"
}]};
for(const [sortBy,wire] of sorts){
 const req=api.buildPayload({mode:"raw",attack:15,defense:15,stamina:15,
   sortBy,locationEnabled:true,locationCoords:center,locationRadius:100});
 assert.equal(req.ok,true,sortBy);
 assert.equal(req.payload.sort,wire,sortBy);
 assert.equal(req.payload.center_lat,-5.7945,sortBy);
 assert.equal(req.payload.center_lng,-35.211,sortBy);
 assert.equal(req.payload.radius_km,100,sortBy);
 const response=api.normalizeResponse(fixture,{nowMs:Date.UTC(2026,10,9,17)});
 assert.equal(response.ok,true,sortBy);
 assert.equal(response.cards.length,1,sortBy);
 assert.equal(response.cards[0].distance,"12.3 km",
   "Alterar a ordenação não deve ocultar distance_km do provedor");
}
// A source-provided distance is display metadata, not a distance-sort/geo-filter requirement.
for(const [sortBy,wire] of sorts.filter(([_,wire])=>wire!=="DISTANCE")){
 const req=api.buildPayload({mode:"raw",attack:15,defense:15,stamina:15,
  sortBy,locationEnabled:false,locationCoords:""});
 assert.equal(req.ok,true,sortBy+" without coords");
 assert.equal(req.payload.sort,wire,sortBy);
 assert.equal(req.payload.center_lat,null,sortBy);
 assert.equal(req.payload.center_lng,null,sortBy);
 const data=api.normalizeResponse(fixture,{nowMs:Date.UTC(2026,10,9,17)});
 assert.equal(data.cards[0].distance,"12.3 km",
  "Source-provided distance must not be hidden because geo-filter is OFF");
}
const missing=api.normalizeResponse({results:[{...fixture.results[0],distance_km:null}]},
 {nowMs:Date.UTC(2026,10,9,17)});
assert.equal(missing.cards[0].distance,"",
 "Nunca inventar distância quando a API não fornece km");
const java=fs.readFileSync(path.join(root,
 "java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
assert.ok(java.includes('resultShowDistance=prefs.getBoolean("resultShowDistance",true);'),
 "Distance must be visible by default while explicit user choices are preserved");
assert.ok(java.includes("locationCoords.equals(resultsDistanceCenter)"),
 "Só reaproveitar km quando o centro de busca for idêntico");
assert.ok(java.includes('existing.get(encounterIdentityForMetadata(card))'),
 "Não copiar distâncias entre encontros diferentes");
assert.ok(java.includes('card.put("distance",trustedDistance)'),
 "Preservar metadado de km do mesmo encontro");
assert.ok(java.includes('resultsDistanceCenter=locationEnabled?locationCoords:"";'),
 "Atualizar a origem somente após aceitar novos resultados");
const dock=fs.readFileSync(path.join(root,"assets/dock.html"),"utf8");
assert.ok(dock.includes("if(opts.distance&&"),"Campo independente na apresentação");
assert.ok(dock.includes("distance:displayPrefs.distance!==false"),
 "Do not hide km if legacy display preferences omit this key");
assert.ok(dock.includes("location:false,distance:true,shiny:false"),
 "Show distance by default even without a location filter");
console.log("PASS: km independente de sort com centro válido e preservação segura do encontro");

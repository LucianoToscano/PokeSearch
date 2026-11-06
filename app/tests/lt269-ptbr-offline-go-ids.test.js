"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const mod=require("../src/main/assets/pve_moves_ptbr.js");
const source=fs.readFileSync(path.join(__dirname,"../src/main/assets/pve_moves_ptbr.js"),"utf8");
const expected=[
  [
    "AIR_SLASH_FAST",
    255,
    "Golpe de Ar",
    true
  ],
  [
    "THUNDER_SHOCK_FAST",
    205,
    "Trovoada de Choques",
    true
  ],
  [
    "DRAGON_BREATH_FAST",
    204,
    "Sopro do Dragão",
    true
  ],
  [
    "WATER_GUN_FAST",
    230,
    "Revólver d'Água",
    true
  ],
  [
    "DRAGON_TAIL_FAST",
    253,
    "Cauda do Dragão",
    true
  ],
  [
    "GUST_FAST",
    345,
    "Lufada de Vento",
    true
  ],
  [
    "INCINERATE_FAST",
    346,
    "Incinerar",
    true
  ],
  [
    "FLAME_CHARGE",
    101,
    "Ataque de Chamas",
    false
  ],
  [
    "FEATHER_DANCE",
    348,
    "Dança das Penas",
    false
  ],
  [
    "HURRICANE",
    122,
    "Furacão",
    false
  ]
];
for(const [proto,moveId,pt,fast] of expected){
 assert.ok(Number.isInteger(moveId)&&moveId>0,"canonical GO proto/moveId "+proto);
 assert.equal(mod.name(proto,fast),pt,proto+" canonical offline PT-BR");
 assert.equal(mod.isVerified(proto,fast),true,"Verified status remains tied to the source proto "+proto);
 assert.equal(mod.name(proto.replace(/_/g," "),fast),pt,"normalized proto "+proto);
}
for(const proto of ["UNKNOWN_FAST","UNKNOWN_CHARGED","FAKE_FLETCHLING_SPECIAL"]){
 assert.equal(mod.name(proto), "Golpe sem tradução","Unknown stays neutral");
 assert.equal(mod.isVerified(proto),false,"Never label unknown as verified");
}
assert.ok(source.includes("31a3bcdc2e412f315c4be2bb593807f45cb9bd9b"),
 "Do not update move source without audit");
assert.equal(mod.pair("INCINERATE_FAST / FLAME_CHARGE"),
 "Incinerar / Ataque de Chamas","Fast and charged named by original GO IDs");
const card=fs.readFileSync(path.join(__dirname,"../src/main/assets/pokemon_card_presentation.js"),"utf8");
assert.ok(card.includes("translator?.isVerified?.(original,i===0)"),
 "Only original move ID may mark translation as verified");
assert.ok(card.includes("eligible.has(moveId(original))"),
 "Legacy status must not derive from translated label");
const note=JSON.parse(fs.readFileSync(path.join(__dirname,"../src/main/assets/release_notes.json"),"utf8"));
assert.ok(note.releases.some(x=>x.minVersionCode===54473));
console.log("LT269 PASS: 10 canonical GO move IDs and PT-BR labels, unknown neutral, Elite/legacy ID preservation");

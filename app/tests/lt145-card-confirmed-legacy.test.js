"use strict";
const assert=require("node:assert/strict");
const presentation=require("../src/main/assets/pokemon_card_presentation.js");

const metadata={base:{"94":[["ghost","poison"],["SHADOW_PUNCH"]]},forms:{}};
const card={number:"#94",name:"Gengar"};
const star=html=>(html.match(/class="pkLegacy"/g)||[]).length;

// A raw provider "*" is NOT proof that the move is legacy.
const output=presentation.moves("Shadow Ball* / Shadow Punch / Hex*",card,metadata);
assert.equal(star(output),1,"only a catalogue-confirmed move may carry *");
assert.ok(output.includes("Shadow Punch<sup"));
assert.ok(!output.includes("Shadow Ball<sup"));
assert.ok(!output.includes("Hex<sup"));

// Confirmed Elite/legacy moves should still be marked even without input '*'.
assert.equal(star(presentation.moves("Shadow Punch / Hex",card,metadata)),1);
// Unknown regional forms must not inherit base-species legacy proof.
assert.equal(star(presentation.moves("Shadow Punch* / Hex",{...card,form:"Mystery"},metadata)),0);
// Offline metadata absent: strip upstream hints rather than invent confirmation.
assert.equal(star(presentation.moves("Shadow Punch* / Hex",card,{base:{}})),0);
console.log("LT145 QA8: confirmed-only legacy move labels PASS");

"use strict";
const assert=require("node:assert/strict");
const presenter=require("../src/main/assets/pokemon_card_presentation.js");

// The actual app loads all 18 Pokémon GO type PNGs before this presenter.
globalThis.PokeSearchTypeIcons={
 normal:"data:image/png;base64,normal",
 grass:"data:image/png;base64,grass",
 dragon:"data:image/png;base64,dragon",
 flying:"data:image/png;base64,flying"
};
const data={
 base:{
  "585":[["normal","grass"],["TACKLE"]],
  "586":[["normal","grass"],["FEINT_ATTACK"]],
  "714":[["flying","dragon"],[]],
  "555":[["fire"],["FLAMETHROWER"]]
 },
 forms:{}
};
const count=(s)=>(s.match(/class="pkTypeImg"/g)||[]).length;

// All four cosmetic seasons have the same two verified types.
for(const dex of [585,586])for(const form of ["Spring","Summer","Autumn","Winter","AUTUMN FORM"]){
 const html=presenter.types({number:"#"+dex,form},data);
 assert.equal(count(html),2,dex+" "+form+" must show exactly two badges");
 assert.ok(html.includes('alt="Tipo Normal"'),"missing Normal: "+dex+" "+form);
 assert.ok(html.includes('alt="Tipo Planta"'),"missing Grass: "+dex+" "+form);
}
// A correctly recognized nonseasonal species remains unaffected.
const noibat=presenter.types({number:"#714"},data);
assert.equal(count(noibat),2,"Noibat still has both types");
assert.ok(noibat.includes("Tipo Voador")&&noibat.includes("Tipo Dragão"));
// Unknown forms (including a hypothetical type-changing regional) must
// NEVER borrow base type icons; neither should missing/invalid species.
for(const card of [
 {number:"#555",form:"Galar"},
 {number:"#585",form:"Mystery"},
 {number:"#586",form:"Autumn Mega"},
 {number:"#999",form:"Autumn"}
]){
 assert.equal(presenter.types(card,data),"","unverified form must not show guessed types");
}
// Type-only fallback must not grant base form's elite/legacy move proof.
for(const dex of [585,586]){
 assert.equal(presenter.moves("Tackle* / Feint Attack*",{number:"#"+dex,form:"Autumn"},data).includes("pkLegacy"),false);
}
console.log("Seasonal Deerling/Sawsbuck Normal+Grass type icons PASS");

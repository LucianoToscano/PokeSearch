"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const asset=name=>fs.readFileSync(path.join(__dirname,"../src/main/assets",name),"utf8");
const presenter=require("../src/main/assets/pokemon_card_presentation.js");
globalThis.PokeSearchMovePtBR=require("../src/main/assets/pve_moves_ptbr.js");
const card={name:"Wurmple",number:"#265",form:"",iv:"15/15/15"};
for(const input of ["Brasa / Lança-chamas","Investida / Insistência","Mordida / Pancada Corporal"]){
 const rendered=presenter.moves(input,card,null);
 assert.match(rendered,/<span class="moveSlash">\|<\/span>/,"vertical separator");
 assert.doesNotMatch(rendered,/<span class="moveSlash">\/<\/span>/,"old slash must not show");
 assert.equal((rendered.match(/pkMoveTyped/g)||[]).length,2,"keep verified type colors");
}
const unknown=presenter.moves("UNKNOWN_FAST / UNKNOWN_CHARGED",card,null);
assert.match(unknown,/<span class="moveSlash">\|<\/span>/);
assert.doesNotMatch(unknown,/pkMoveTyped/,"do not invent unknown type colors");
const detail=asset("detail.html");
const base=detail.match(/#psCapturedMoveNames \.pkMove\{([^}]+)\}/);
const typed=detail.match(/#psCapturedMoveNames \.pkMoveTyped\{([^}]+)\}/);
assert.ok(base&&typed,"actual detail card CSS");
assert.match(base[1],/padding:0/,"no chip padding");
assert.match(base[1],/background:transparent/,"no chip background");
assert.match(base[1],/border:0/,"no chip outline");
assert.match(typed[1],/color:var\(--ps-move-type/,"keep independent per-type text color");
assert.doesNotMatch(typed[1],/background:|border:|color-mix\(/,"remove colored chip");
assert.match(detail,/h\(c\.moves\|\|""\)\.replace\(\/\\s\+\\\/\\s\+\/g," \| "\)/,"fallback separator");
console.log("LT281 moves show type-colored text only, pipe delimiter, and neutral fallback PASS");

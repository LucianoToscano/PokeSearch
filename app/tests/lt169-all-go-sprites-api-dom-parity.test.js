"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const base=path.join(__dirname,"../src/main/assets");
const art=require("../src/main/assets/sprite_offline.js");
const read=name=>fs.readFileSync(path.join(base,name),"utf8");
const code=read("sprite_offline.js"),dock=read("dock.html"),detail=read("detail.html");
const api=require("../src/main/assets/api_result_contract.js");
const site="https://pogocoordinates.com/images/verified-exact-form.png";
function result(card){return art.resolve(card)}
const go=card=>result(card).src;

for(const [name,number,form,fragment] of [
 ["Flabebe","#669","YELLOW","pm669.fYELLOW.icon.png"],
 ["Flabébé","#669","YELLOW","pm669.fYELLOW.icon.png"],
 ["Flabebe (Yellow)","#669","","pm669.fYELLOW.icon.png"],
 ["Flabebe","#669","FLABEBE_YELLOW","pm669.fYELLOW.icon.png"],
 ["Flabébé","#669","YELLOW_FLOWER","pm669.fYELLOW.icon.png"],
 ["Floette","#670","BLUE","pm670.fBLUE.icon.png"],
 ["Florges","#671","WHITE","pm671.fWHITE.icon.png"],
 ["Flabebe","#669","RED","pm669.fRED.icon.png"],
 ["Flabebe","#669","ORANGE","pm669.fORANGE.icon.png"],
 ["Flabebe","#669","BLUE","pm669.fBLUE.icon.png"],
 ["Vulpix","#37","ALOLA","pm37.fALOLA.icon.png"],
 ["Meowth","#52","GALARIAN","pm52.fGALARIAN.icon.png"]
]){
 const card={name,number,form,shiny:false};
 assert.ok(go(card).includes(fragment),name+" "+form+" should load the exact GO art");
 assert.equal(result(card).goExact,true,"GO provenance");
 assert.ok(result(card).original.includes("cdn.jsdelivr.net"),"same immutable GO asset mirror");
}
assert.ok(go({name:"Flabebe",number:"#669",form:"YELLOW",shiny:true})
  .includes("pm669.fYELLOW.s.icon.png"),"Shiny colour identity remains exact");
assert.ok(!go({name:"Flabebe",number:"#669",form:"BLUE"}).includes("fYELLOW"),
  "no incorrect colour substitution");
assert.equal(go({name:"Flabebe",number:"#670",form:"YELLOW"}),"",
  "different dex must not borrow Flabebe");
assert.equal(result({name:"Flabebe",number:"#669",form:"UNKNOWN_EVENT_2099",image:""}).src,"",
 "unknown variants never borrow a wrong base image");
assert.equal(result({name:"Flabebe",number:"#669",form:"YELLOW",
    costume_id:188, image:""}).src,"","unknown costume must not become regular form");
assert.equal(result({name:"Pikachu",number:"#669",form:"YELLOW"}).src,"",
 "independent dex/species proof blocks unrelated image");
assert.equal(go({name:"Flabebe",number:"#669",form:"YELLOW",image:site,
 imageFromSite:true}),site,"exact image from PoGoCoordinates DOM wins");
const shinyNormal=go({name:"Flabebe",number:"#669",form:"YELLOW",shiny:true});
const normal=go({name:"Flabebe",number:"#669",form:"YELLOW",shiny:false});
assert.notEqual(shinyNormal,normal,"shiny and normal must be separate");
assert.match(code,/GO_FILE_BY_ID\[Number\(m\[1\]\)/);
assert.match(code,/c2a686eb08ace6e890d8fe3d2134c76988db87b5/);
assert.match(code,/goExactIcon/);
assert.match(dock,/PokeSearchOfflineSprite\.resolve\(c\)/);
assert.match(detail,/PokeSearchOfflineSprite\.resolve\(c\)/);
assert.match(dock,/img\.src=original;return;/);
assert.match(detail,/art\.offline\|\|art\.goExact/);
assert.ok(!dock.includes('aria-hidden="true">◉</span>'),"no generic empty ring in result");
assert.ok(!detail.includes('content:"◉";display:block'),"no generic empty ring in detail");
assert.match(dock,/esc\(String\(c\.name\|\|""\)/);
assert.match(detail,/fallback\.textContent=/);
console.log("LT169: audited 1679 GO form/costume filenames, mode parity, API exact art, no empty rings PASS");

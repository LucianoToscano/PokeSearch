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
 ["Flabebe","#669","BLUE","pm669.fBLUE.icon.png"]
]){
 const card={name,number,form,shiny:false};
 assert.ok(go(card).includes(fragment),name+" "+form+" should load the exact GO art");
 assert.equal(result(card).goExact,true,"GO provenance");
 assert.ok(result(card).original.includes("cdn.jsdelivr.net"),"same immutable GO asset mirror");
}
// Existing exact PokeAPI bundled artwork must not regress into a fragile
// network dependency merely because the same named GO form is indexed.
for(const card of [
 {name:"Vulpix",number:"#37",form:"ALOLA"},
 {name:"Meowth",number:"#52",form:"GALARIAN"},
 {name:"Furfrou",number:"#676",form:"Natural"}
]){
 assert.match(result(card).src,/^file:\/\/\/android_asset\/pokemon-sprites\//,
   "preserve available exact offline form: "+card.name);
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
// Explicit upstream Git-blob manifest and Android caching must agree with
// every browser-side icon path, or first loads would be unverified.
const manifest=read("go-exact-sprites.tsv");
const entries=manifest.split("\n").filter(x=>x&&!x.startsWith("#"));
assert.equal(entries.length,1679);
assert.equal(new Set(entries.map(x=>x.split("\t")[0])).size,1679);
const goList=code.slice(code.indexOf("const GO_FILE_LIST=["),code.indexOf("const GO_FILE_BY_ID="));
for(const entry of entries){
 const [file,hash]=entry.split("\t");
 assert.match(hash,/^[0-9a-f]{40}$/);
 assert.ok(goList.includes(JSON.stringify(file)),"indexed GO art missing from native allowlist: "+file);
}
const native=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/VerifiedSpriteCache.java"),"utf8");
assert.match(native,/go-exact-sprites\.tsv/);
assert.match(native,/GO_NAME\.matcher\(name\)\.matches\(\)/);
assert.match(native,/GO_HASHES\.get\(name\)/);
assert.match(native,/MessageDigest\.getInstance\("SHA-1"\)/);
assert.match(native,/md\.update\(\(byte\)0\)/);
assert.match(native,/matchesBlob\(data,expected\)/);
assert.match(native,/goCached\(context,name,expected\)/);
assert.match(native,/return goResponse\(context,url\)/);
assert.match(native,/GO_FAILURES\.put\(name,now\)/);
assert.ok(!native.includes('Authorization: Bearer'),"sprites never access JWT");

console.log("LT169: audited 1679 GO form/costume filenames, mode parity, API exact art, no empty rings PASS");

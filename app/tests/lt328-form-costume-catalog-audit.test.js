"use strict";
/* LT328: no invented sprites for forms, costumes, gender or Shiny. */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../src/main/assets");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
const code=read("sprite_offline.js"),baseAnchor="const BASE_SPECIES=Object.freeze(";
const begin=code.indexOf(baseAnchor),end=code.indexOf(");",begin);
assert.ok(begin>0&&end>begin);
const base=JSON.parse(code.slice(begin+baseAnchor.length,end));
const src=require("../src/main/assets/sprite_offline.js");
const listed=read("go-exact-sprites.tsv").trim().split("\n")
 .filter(x=>!x.startsWith("#")).map(x=>x.split("\t")[0]);
const extra=read("go-extra-sprites-lt328.tsv").trim().split("\n")
 .filter(x=>!x.startsWith("#")).map(x=>x.split("\t"));
assert.equal(listed.length,1679);
assert.equal(extra.length,36);
assert.equal(extra.filter(row=>row[2].startsWith("db10")).length,14);
assert.equal(new Set(extra.map(row=>row[0])).size,36);
for(const row of extra){
 assert.match(row[1],/^[a-f0-9]{40}$/);
 assert.match(row[2],/^[a-f0-9]{40}$/);
 assert.ok(!listed.includes(row[0]));
}
const unsupported=["pm479.f.s.icon.png"];
const all=[...listed,...extra.map(x=>x[0])].filter(x=>!unsupported.includes(x));
let checked=0,combined=0;
for(const file of all){
 const composite=/^pm(\d+)\.f([A-Za-z0-9_]+)\.c([A-Za-z0-9_]+)(\.g2)?(\.s)?\.icon\.png$/.exec(file);
 const simple=/^pm(\d+)\.([fc])([A-Za-z0-9_]+)(\.g2)?(\.s)?\.icon\.png$/.exec(file);
 assert.ok(composite||simple,"bad indexed filename "+file);
 const m=composite||simple,dex=Number(m[1]);
 let name=base[dex];
 assert.ok(name,"unknown Dex for "+file);
 name=name==="NIDORAN"?"Nidoran":name;
 const card={number:dex,name,gender:(composite?m[4]:m[4])?"female":"male",
  shiny:Boolean(composite?m[5]:m[5])};
 if(composite){card.form=m[2];card.costume=m[3];combined++;}
 else card[m[2]==="f"?"form":"costume"]=m[3];
 const resolved=src.goExactIcon(card);
 assert.ok(resolved,"no resolution for "+file);
 assert.ok(resolved.src.endsWith("/"+file),
  file+" incorrectly returned "+resolved.src.split("/").pop());
 checked++;
}
assert.ok(checked>=1714&&combined>=20);
assert.equal(src.goExactIcon({number:37,name:"Vulpix",form:"Different New Form"}),null);
assert.equal(src.goExactIcon({number:37,name:"Pikachu",form:"ALOLA"}),null);
assert.ok(src.goExactIcon({number:29,name:"Nidoran Female",form:"NORMAL"})===null,
 "normal Nidoran is handled by verified base, not a non-existent costume");
assert.equal(src.verifiedSpeciesIdentity({number:29,name:"Nidoran Female"}),true);
assert.equal(src.verifiedSpeciesIdentity({number:32,name:"Nidoran Male"}),true);
assert.equal(src.verifiedSpeciesIdentity({number:29,name:"Nidoran Male"}),false);
assert.equal(src.verifiedSpeciesIdentity({number:32,name:"Nidoran Female"}),false);
assert.match(src.goExactIcon({number:25,name:"Pikachu",form:"ANNIVERSARY_2026_THAILAND_01"})?.src||"",
 /db10df75.*pm25\.fANNIVERSARY_2026_THAILAND_01\.icon\.png/);
assert.match(src.goExactIcon({number:710,name:"Pumpkaboo",form:"Small",costume:"Fall 2022"})?.src||"",
 /c2a686eb.*pm710\.fSMALL\.cFALL_2022\.icon\.png/);
// Validate real WWM metadata behavior with a self-contained source fixture,
// rather than injecting or copying credentials from the GO provider.
const wwm={species:{
 37:["Vulpix",55,[55,56]],
 710:["Pumpkaboo",2642,[2641,2642,2643,2644]],
 25:["Pikachu",598,[598,3376]]
 },forms:{
 56:["VULPIX_ALOLA","Alola"],55:["VULPIX_NORMAL","Normal"],
 2641:["PUMPKABOO_SMALL","Small"],
 3376:["PIKACHU_ANNIVERSARY_2026_THAILAND_01","Anniversary 2026 Thailand 01"]
 },costumes:{57:["FALL_2022","Fall 2022"]},
 ptBr:{pt_forms:{"form_56":"Alola","form_2641":"Pequeno",
  "form_3376":"Aniversário 2026 Tailândia 01"},
 pt_costumes:{"costume_57":"Outono 2022"}}};
const mod={exports:{}};
new Function("module","exports","globalThis",code)(mod,mod.exports,
 {PokeSearchWWMCatalog:wwm});
const resolver=mod.exports;
assert.ok(resolver.goExactIcon({number:37,name:"Vulpix",form_id:56,shiny:true})
 ?.src.endsWith("pm37.fALOLA.s.icon.png"));
assert.ok(resolver.goExactIcon({number:710,name:"Pumpkaboo",
 form_id:2641,costume_id:57})?.src.endsWith("pm710.fSMALL.cFALL_2022.icon.png"));
assert.ok(resolver.goExactIcon({number:25,name:"Pikachu",form_id:3376})
 ?.src.endsWith("pm25.fANNIVERSARY_2026_THAILAND_01.icon.png"));
assert.ok(resolver.goExactIcon({number:710,name:"Pumpkaboo",
 form:"Pequeno",costume:"Outono 2022"})?.src
 .endsWith("pm710.fSMALL.cFALL_2022.icon.png"),
 "official PT-BR labels map to exact numeric catalog IDs");
for(const bad of [
 {number:37,name:"Vulpix",form_id:3362},
 {number:37,name:"Vulpix",form_id:56,form:"Fake Form"},
 {number:37,name:"Vulpix",form_id:56,costume_id:9999},
 {number:710,name:"Pumpkaboo",form_id:2641,costume_id:57,costume:"Wrong Costume"}
])assert.equal(resolver.goExactIcon(bad),null,"conflicting numeric catalog metadata");
const native=fs.readFileSync(path.join(__dirname,
 "../src/main/java/com/lucianotoscano/pokesearchoverlay/VerifiedSpriteCache.java"),"utf8");
const builder=fs.readFileSync(path.join(__dirname,"../scripts/build_sprite_bundle.py"),"utf8");
assert.ok(native.includes("go-extra-sprites-lt328.tsv"));
assert.ok(native.includes("GO_COMMIT_LT328"));
assert.ok(native.includes("GO_LT328_SOURCE"));
assert.ok(builder.includes("LT328_RECENT_FILES"));
assert.ok(builder.includes("LT328_MANIFEST"));
console.log("LT328 OK: "+checked+" GO sprites incl. "+combined+
 " combined form+costume; WWM IDs, Shiny, gender and strict identity");

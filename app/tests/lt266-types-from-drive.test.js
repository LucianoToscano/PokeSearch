"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),
 crypto=require("node:crypto"),vm=require("node:vm");
const base=path.join(__dirname,"../src/main/assets");
const EXPECTED={
  "fairy": "ebeb5bfb874550bc52e9b5db5a3d65e3d3083f2af71f55bf991ea35edf2f50e1",
  "psychic": "b847fc5829d10f03ad82e2ec8b00df56d564fe8cce2dc7c50868efa06570073e",
  "fighting": "fa9703782fe470a917c1b9907022d0345b5080e6c90b25ec893c277fb184757c",
  "rock": "8225478cbecf84f0c71a77ee0b903bb6822835d4249ef9329f8c1eb7afde7795",
  "fire": "eee2666cd4fbc95ab6060d62635d79b6cd4a675d58c5e07e01f3d101da19fbaa",
  "steel": "9317b660180461e71f730c5c5a196103a9e8f422ff0e5839ff933d96a8466fd8",
  "water": "2b2eda40305b646da9f71baeb35e62018a267664cd25179c3c234b21d512768c",
  "flying": "5d2cc557f3f816997bb5a6c5d1d8b18d9fc3e2de9eda88ebe64bb82d52b229a7",
  "ghost": "798a74aa82f41d274f64df8c0ae079a269532493d0fe86a68f23b5794552eba5",
  "grass": "c49414da04c03c276a5a5d60f670f16b5daf2c26b941f5f4cf02cc39a9655d81",
  "bug": "b537e6a51c8bff0ce14fdd1aa14439a5a039847699e64cea0b53cd12f19d0330",
  "ground": "06ece24a35fc3aa23fbeafbc068113993748efb280a1632a2e7d9e2b3286cfde",
  "ice": "5fb1abb611ab61292c468255872cadb7ec8065ed991fef1377669daecb24230f",
  "dark": "67307a902fb021eb59ff1b0f0785e8a34258e63971e0a60550844b579719959a",
  "dragon": "8b89a6b037842a9c3b6fb9417bbff7ce17cd18acb2e1c119570091e4a17195ed",
  "normal": "7c3e8db6a036882144635569731b4ff1bd1069244ebd511abf85acc7387c97c1",
  "electric": "323cea49075c7584379a7e0d5b8c6fb7a26fc9ce8b9f9f354e30f82e1bd3615b",
  "poison": "bcfd0174bd88c3e4390c6ef61d9ecf09116acceea662023f86c0ff23419d16b1"
};
const keys=Object.keys(EXPECTED).sort();
assert.equal(keys.length,18,"Exactly all 18 GO types");
const source=fs.readFileSync(path.join(base,"pokemon_type_icons.js"),"utf8");
const ctx={};vm.runInNewContext(source,ctx);
const icons=ctx.PokeSearchTypeIcons;
assert.deepEqual(Object.keys(icons).sort(),keys,"All 18 exact API type enums");
for(const type of keys){
 const p="ui-icons/type-"+type+"-lt266.png";
 assert.equal(icons[type],"ui-icons/type-"+type+"-lt267.png","Revised type icon displayed");
 // LT266 original still exists and its exact SHA remains protected for rollback.
 const raw=fs.readFileSync(path.join(base,p));
 assert.equal(raw.subarray(0,8).toString("hex"),"89504e470d0a1a0a",type+" valid PNG");
 assert.equal(raw.readUInt32BE(16),1024,type+" width remains original");
 assert.equal(raw.readUInt32BE(20),1024,type+" height remains original");
 assert.equal(raw[25],6,type+" RGBA alpha, no opaque matte");
 assert.equal(crypto.createHash("sha256").update(raw).digest("hex"),EXPECTED[type],
  type+" must match user-original bytes");
}
assert.ok(!source.includes("data:image/png;base64"),"Avoid inline base64 image heap");
const workflow=fs.readFileSync(path.join(__dirname,
 "../../.github/workflows/pokesearch-official-release.yml"),"utf8");
for(const type of keys)assert.ok(workflow.includes('"type-'+type+'-lt266.png": "'+
 EXPECTED[type]+'"'),"APK signing gate must protect "+type);
const presenter=require("../src/main/assets/pokemon_card_presentation.js");
globalThis.PokeSearchTypeIcons=Object.fromEntries(keys.map(x=>[x,icons[x]]));
const pidgey=presenter.types({number:"#16"},{base:{16:[["normal","flying"],[]]}});
assert.ok(pidgey.includes('src="ui-icons/type-normal-lt267.png"'));
assert.ok(pidgey.includes('src="ui-icons/type-flying-lt267.png"'));
assert.ok(pidgey.includes("Tipo Normal")&&pidgey.includes("Tipo Voador"),
 "Type localized labels and both slots retained");
const scripts=fs.readFileSync(path.join(base,"detail.html"),"utf8");
assert.ok(scripts.includes('<script src="pokemon_type_icons.js"></script>'));
assert.ok(scripts.includes("pkTypeImg"),"Responsive type layout remains");
const java=fs.readFileSync(path.join(__dirname,
 "../src/main/java/com/lucianotoscano/pokesearchoverlay/OtaAssets.java"),"utf8");
assert.ok(java.includes("ui-icons"),"Signed OTA supports type assets");
console.log("LT266 PASS: 18 exact original type PNGs, RGBA 1024px, WebView rendering, signed APK + OTA contracts");

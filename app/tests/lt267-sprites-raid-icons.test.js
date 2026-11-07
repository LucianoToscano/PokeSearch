"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main/assets");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
const art=require("../src/main/assets/sprite_offline.js");
const expected={
  "pm25.fDIWALI_2024.icon.png": "bab5c62cd39aba25fe92fe8f549bb87a9b44f6f4",
  "pm25.fDIWALI_2024.s.icon.png": "c17c973f00df92fc5ad03cbb8ced2e1b746dd296",
  "pm931.fBLUE.icon.png": "041f59c1aefd4a1e76bf988b65aa2536abbf1a2d",
  "pm931.fBLUE.s.icon.png": "a76dc0a90c6d917a24d618c89ae0c6909686bb66",
  "pm931.fGREEN.icon.png": "408e9e185dad4f4fc1f399d6b59dd5d9e92fbddb",
  "pm931.fGREEN.s.icon.png": "e31f95bfdb1b1cfe526ea633249ac4ac33236220",
  "pm931.fWHITE.icon.png": "a0cb82f86bbdc48145c7c0cbc43f23c8e592b1b6",
  "pm931.fWHITE.s.icon.png": "63e784457419d3c1f212a907d3ec2c5f96b4a555",
  "pm931.fYELLOW.icon.png": "345be949373cc1896dff05b4a4ccb6eca2349548",
  "pm931.fYELLOW.s.icon.png": "c6d3c0e60e234959a9eccb9e2ec47166cce12eae"
};
const manifest=read("go-exact-sprites.tsv");
const builder=fs.readFileSync(path.join(__dirname,"../scripts/build_sprite_bundle.py"),"utf8");
const workflow=fs.readFileSync(path.join(__dirname,"../../.github/workflows/pokesearch-official-release.yml"),"utf8");
for(const [file,blob] of Object.entries(expected)){
 assert.ok(manifest.includes(file+"\t"+blob),file+" SHA-1 source");
 assert.ok(builder.includes('"costumes/'+file+'"'),file+" exact offline bundle");
 assert.ok(builder.includes('"'+blob+'"'),file+" source hash pin");
 assert.ok(workflow.includes('"'+file+'"'),file+" must exist in signed APK");
}
for(const color of ["Blue","Green","White","Yellow"]){
 for(const shiny of [false,true]){
  const file="pm931.f"+color.toUpperCase()+(shiny?".s":"")+".icon.png";
  const result=art.resolve({name:"Squawkabilly",number:"#931",form:color+" Plumage",shiny});
  assert.equal(result.src,"file:///android_asset/pokemon-sprites/costumes/"+file,color+" "+shiny);
  assert.equal(result.offline,true);
  assert.ok(result.original.includes(file),"exact mirrored original");
 }
}
for(const shiny of [false,true]){
 const file="pm25.fDIWALI_2024"+(shiny?".s":"")+".icon.png";
 const a=art.resolve({name:"Pikachu",number:"#25",form:"Diwalli 2024",shiny});
 const b=art.resolve({name:"Pikachu",number:"#25",costume:"Diwali 2024",costume_id:2024,shiny});
 assert.ok(a.src.endsWith("/"+file),"Diwalli form "+shiny);
 assert.ok(b.src.endsWith("/"+file),"Diwali named costume "+shiny);
}
const site="https://pogocoordinates.com/images/exact-squawk.png";
const provided=art.resolve({name:"Squawkabilly",number:"#931",form:"Green",image:site,imageFromSite:true});
assert.equal(provided.src,site,"verified original site sprite wins");
assert.ok(provided.original.includes("pm931.fGREEN.icon.png"),"exact local fallback");
assert.equal(art.resolve({name:"Squawkabilly",number:"#931",form:"Indigo"}).src,"","unknown colour never becomes Green");
assert.equal(art.resolve({name:"Pikachu",number:"#25",form:"Invalid",costume_id:123}).src,"","unknown outfit must not become Diwali");
const html=read("detail.html");
const match=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match);new vm.Script(match[1]);
assert.ok(html.includes('src="ui-icons/ps-cup-lt268.png"'));
assert.ok(!html.includes("⚪ LC 500"));
assert.ok(html.includes("const raidDisplayName=row=>"));
assert.ok(html.includes('window.PokeSearchTypeIcons?.[row.type]'));
assert.ok(html.includes("Um segundo Carregado no jogo é opcional; a fonte não valida a melhor segunda escolha."));
assert.ok(html.includes('id="psShadowSymbol"'));
assert.ok(html.includes("c.isShadow===true||c.shadow===true"));
const sha=file=>crypto.createHash("sha256").update(fs.readFileSync(path.join(root,file))).digest("hex");
assert.equal(sha("ui-icons/mega-symbol.png"),"3c80d9278aaa7b131b391a4da879f6c1459290995fdf09c3f3690a36838fa739");
assert.equal(sha("ui-icons/shadow-symbol-lt267.png"),"62cdf7dd642c2077204c8275fe82ff99e645b3a5f36780c44ce2d234ebb14559");
for(const file of ["mega-symbol.png","shadow-symbol-lt267.png"])
 assert.ok(workflow.includes('"'+file+'": "'+sha("ui-icons/"+file)+'"'),file+" SHA pinned in signed APK");
assert.ok(read("sprite_visual_scale.js").includes("clamp(.78/occupancy,.76,2.2)"),"small silhouette zoom bounded");
const qaWorkflow=fs.readFileSync(path.join(__dirname,"../../.github/workflows/lt146-signed-update-qa.yml"),"utf8");
const pinnedCostumeKeys=[...builder.matchAll(/"costumes\/([^"]+)"\s*:\s*\(/g)].map(m=>m[1]);
assert.equal(new Set(pinnedCostumeKeys).size,140,
 "LT289: original 136 exact GO sprites plus four Singapore Anniversary gender/Shiny variants");
const lt144EventCount=[...builder.matchAll(/"pm(?:41|94)\.[^"]+\.png":\s*"[a-f0-9]{64}"/g)].length;
assert.equal(lt144EventCount,4,"Four extra LT144 SHA256-pinned event costumes");
assert.ok(qaWorkflow.includes("assert len(report['costumes'])==144"),
 "Signed QA must account for 140 PokeMiners and four exact LT144 event assets");
assert.ok(qaWorkflow.includes("for dex in (422,423)") &&
 qaWorkflow.includes('for sea in ("EAST","WEST")'),
 "Exact East/West Sea normal/shiny assets required for both species");
for(const name of ["pm41.fHALLOWEEN_2026_01.icon.png","pm41.fHALLOWEEN_2026_01.s.icon.png",
"pm94.cFALL_2023_NOEVOLVE.icon.png","pm94.cFALL_2023_NOEVOLVE.s.icon.png"]){
 assert.ok(qaWorkflow.includes('"'+name+'":'),"Immutable LT144 event required by signed QA: "+name);
}
assert.ok(qaWorkflow.includes('assert hashlib.sha256((root/key).read_bytes()).hexdigest()==report[\'costumes\'][key]'),
 "Signed QA must verify each exact Diwali/Squawk sprite against manifest SHA256");
assert.ok(qaWorkflow.includes("for color in (\"BLUE\",\"GREEN\",\"WHITE\",\"YELLOW\")"),
 "All four Squawk colours, including Shiny, must be covered by QA");
console.log("LT267 PASS: pinned 10 source sprites, four Squawk colours & shiny, Diwali, site first, 2 user icons, Cup and Raid labels");

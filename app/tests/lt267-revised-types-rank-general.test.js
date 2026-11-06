"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),vm=require("node:vm");
const base=path.join(__dirname,"../src/main/assets");
const expected={
  "bug": "46e288f551b868a690f785d066b1d3aad8025dd17a48eea53f9f3d7518d14b04",
  "dark": "0755ee588d0a0d69ee91ab477e4782b194d740ed82f75748a3518a5bb77df1bb",
  "dragon": "bf8c699376d111886d1c12ab804bec82009569f961a251f03f543b08f0ebf75a",
  "electric": "6b56d31df37de6aa7d67dcaf53fdf99923caa8cb0669880e7a2aca033dc5640f",
  "fairy": "94009db22e2fad571ab772bea0a8a6c1ab7e11d7d5642056136b043bd1b80feb",
  "fighting": "469d8dd96b1e0a846fca6361814031372c76c5ae621225b5477a5447df723f79",
  "fire": "9163817b80016d78d9ff0e3a5f4dd7b277e1aa2910a7ce6597d72e5c83aca45d",
  "flying": "06aa82f00f9a005a140cf73ddec2c232320a2fd5b85c80b4bceba973d5041fde",
  "ghost": "50c6f30e9fe3e2a92f9e3a67c22745a1626649ccbc609f8bd1da62df7c208bc1",
  "grass": "c0ad206920374f8586401f24d0380592aa1c9087679dbc79d8477ffe8ac16d66",
  "ground": "761894ed9a7751c0f6a431e6dfdcaf2225641e74eb59319dd2f04ff47dc276a2",
  "ice": "c3b9436c807dbb89ce4653e7912374d30169271c019a008261616341f6c63b52",
  "normal": "8f57b951853a9dbe87bb9eee9b713755a35452c7dd7a65d965c1f704606ab302",
  "poison": "2813a7d459e0a53b2f7e4d7eaca9ba4626fa4734bf5f5bb8173586bc3c44f008",
  "psychic": "6e111db243fd604fb67387cd47e235c283488723b6e6b937a2fc3aafe53fee7f",
  "rock": "66f77628e838faa7927127543d7f414c35e6f19b269c18c046128ddb8e7b5fb5",
  "steel": "82a39aea7eee9d4d327c9ffba8c0bb9addabb8bc5d65feb118bd538ff4c244b2",
  "water": "ec2f7c337757ddfa7da4eb4fe2a0751fe67a73771be00761bfb1ac638f310ebb"
};
const sha=b=>crypto.createHash("sha256").update(b).digest("hex");
const iconsSource=fs.readFileSync(path.join(base,"pokemon_type_icons.js"),"utf8");
const ctx={};vm.runInNewContext(iconsSource,ctx);
assert.equal(Object.keys(ctx.PokeSearchTypeIcons).length,18,"18 exact type enum keys");
const workflow=fs.readFileSync(path.join(__dirname,"../../.github/workflows/pokesearch-official-release.yml"),"utf8");
for(const [type,digest] of Object.entries(expected)){
 const name="type-"+type+"-lt267.png",full="ui-icons/"+name;
 const b=fs.readFileSync(path.join(base,full));
 assert.equal(ctx.PokeSearchTypeIcons[type],full,"LT267 type used in live detail");
 assert.equal(b.subarray(0,8).toString("hex"),"89504e470d0a1a0a",name);
 assert.equal(b.readUInt32BE(16),512,name+" width");
 assert.equal(b.readUInt32BE(20),512,name+" height");
 assert.equal(b[25],6,name+" alpha channel");
 assert.equal(sha(b),digest,name+" exact original revised PNG");
 assert.ok(workflow.includes('"'+name+'": "'+digest+'"'),"signed APK enforces "+name);
}
const rg=fs.readFileSync(path.join(base,"ui-icons/rank-geral-lt267.png"));
assert.equal(rg.readUInt32BE(16),160);assert.equal(rg.readUInt32BE(20),160);
assert.equal(rg[25],6,"RG icon transparent");
assert.equal(sha(rg),"2dcf9cc037adfadaee1edff2d13c9ec08d8454e0dae5020baeef56c1cf3b82bd");
assert.ok(workflow.includes(sha(rg)),"RG asset SHA pinned");
const html=fs.readFileSync(path.join(base,"detail.html"),"utf8");
assert.ok(html.includes('background:url("ui-icons/rank-geral-lt267.png")'),"RG icon in CSS without extra width");
assert.ok(html.includes('badge.dataset.rgVisible=hasVerifiedOverall?'),"Main RG chip shows ranked number");
assert.ok(html.includes('if(kind==="overall")b.dataset.rgVisible="#"+n;'),"Alternate RG chip shows number");
assert.ok(html.includes('badge.dataset.psKind="overall"'),"RG click still opens overall explorer");
assert.ok(html.includes('badge.textContent=hasVerifiedOverall?"RG #"+best.overallRank:"RG —"'),"Original RG accessible text preserved");
assert.ok(html.includes('iv.dataset.psKind="class"'),"IV class separate from general");
assert.ok(html.includes('src="ui-icons/league-cup-bordered-lt265.png"'),"LC uses cup");
const presenter=require("../src/main/assets/pokemon_card_presentation.js");
globalThis.PokeSearchTypeIcons=Object.fromEntries(Object.entries(ctx.PokeSearchTypeIcons));
const pidgey=presenter.types({number:"#16"},{base:{16:[["normal","flying"],[]]}});
assert.ok(pidgey.includes("type-normal-lt267.png")&&pidgey.includes("type-flying-lt267.png"));
assert.ok(pidgey.includes("Tipo Normal")&&pidgey.includes("Tipo Voador"));
const java=fs.readFileSync(path.join(__dirname,
 "../src/main/java/com/lucianotoscano/pokesearchoverlay/OtaAssets.java"),"utf8");
assert.ok(java.includes("ui-icons"),"Assets included by safe signed OTA paths");
console.log("LT267 revised assets PASS: 18 transparent user types, RG distinct, Cup, OTA, signed APK hashes");

"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),
 crypto=require("node:crypto"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main/assets");
const checks={
 "league-gl-bordered-lt265.png":"fc3c1bbf45be5d6c934d761bd1369641fafb8bf0b009500a1748833e93d0c05b",
 "league-ul-bordered-lt265.png":"89bb9c0db2e3a10602797f747046f379de267120b119181f3a2b4f4b3682bdda",
 "league-ml-bordered-lt265.png":"470aa8ab0e54d48481d8cbecdaba3590fa929d35e45d910d411765595f8f413d",
 "league-cup-bordered-lt265.png":"a7fa6b7a626adef27e808deff83985ebfddfd43050280b8c0d5bdfbb20bbc6e7",
 "mt-carregada-elite-lt265.png":"1862fa4d03ad560c62b54f315aac9b88fd33ab29c94e61d78c47df030da60d38",
 "mt-agil-elite-lt265.png":"7439896d33dd28ee62c389015c0094a7ac34c459d6af4a3e47ad5c88c98fd595"
};
const detail=fs.readFileSync(path.join(root,"detail.html"),"utf8");
const workflow=fs.readFileSync(path.join(__dirname,
 "../../.github/workflows/pokesearch-official-release.yml"),"utf8");
for(const [name,sha] of Object.entries(checks)){
 const png=fs.readFileSync(path.join(root,"ui-icons",name));
 assert.equal(png.subarray(0,8).toString("hex"),"89504e470d0a1a0a",name+" PNG");
 assert.equal(crypto.createHash("sha256").update(png).digest("hex"),sha,
  name+" original user art preserved");
 assert.ok(png.length>900&&png.length<2500,"Compact lossless PNG within budget");
 assert.ok(workflow.includes('"'+name+'": "'+sha+'"'),
  "Signed APK gate checks exact new asset");
 assert.ok(detail.includes(name),"Card renders new icon "+name);
}
assert.ok(detail.includes('label==="Ágil"?"mt-agil-elite-lt265.png":"mt-carregada-elite-lt265.png"'),
 "Fast Elite and Charged Elite are distinct and never guessed");
assert.ok(detail.includes('PS_LEAGUE_BORDERED'));
assert.ok(detail.includes('srcset="ui-icons/league-gl-bordered-lt265.png 1x"'));
assert.ok(detail.includes('srcset="ui-icons/league-ul-bordered-lt265.png 1x"'));
assert.ok(detail.includes('srcset="ui-icons/league-ml-bordered-lt265.png 1x"'));
assert.ok(detail.includes('ui-icons/league-cup-bordered-lt265.png'));
assert.ok(!detail.includes('>💠<'),"Diamonds no longer label special moves");
assert.ok(detail.includes('row.elite?psMtIconHtml("elite"):""'),
 "PvE rows with no verified Elite source never receive an Elite badge");
// Captured card keeps original move IDs for canonical form-specific special move annotation.
const translator=require("../src/main/assets/pve_moves_ptbr.js");
const draw=require("../src/main/assets/pokemon_card_presentation.js");
const result=draw.moves("PECK_FAST / FLY",{number:"#16"},{base:{"16":[["normal"],["PECK_FAST"]]}});
assert.ok(result.includes("PECK_FAST"),"Without a browser translation helper, original source remains visible");
assert.ok(result.includes('class="pkLegacy"'),"Special metadata is independent of translated text");
console.log("LT265 assets PASS: exact six user images, signed APK hashes, safe Elite status, legacy card integrity");

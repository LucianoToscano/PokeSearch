"use strict";
// LT262: the user's exact icons replace only GL/UL art, not layout/sizes,
// PvP ranking logic, the ML emblem, other modes, or original chat badges.
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const root=path.join(__dirname,"../src/main/assets");
const dock=fs.readFileSync(path.join(root,"dock.html"),"utf8");
const community=fs.readFileSync(path.join(__dirname,
 "../src/main/java/com/lucianotoscano/pokesearchoverlay/CommunityScrapbookOnline.java"),"utf8");
const optimizer=fs.readFileSync(path.join(__dirname,"../../scripts/optimize_apk_size_lt185.py"),"utf8");
const workflow=fs.readFileSync(path.join(__dirname,
 "../../.github/workflows/pokesearch-official-release.yml"),"utf8");
const expected={
 GLBadgeLT262.png:"be6de24bb4f01a6e13456dfb77ed81e878d5d6065393aaca08f87c5547234cbb",
 ULBadgeLT262.png:"3328b59cc0bc730d3df9e13f2b053c5df248438402d016e13dbab08f15fe4220"
};
for(const [name,hash] of Object.entries(expected)){
 const bytes=fs.readFileSync(path.join(root,"result-icons/modes",name));
 assert.equal(bytes.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
 assert.equal(bytes.readUInt32BE(16),96,"same scaled dimensions for both new badges");
 assert.equal(bytes.readUInt32BE(20),96,"square badge proportions");
 assert.equal(bytes.readUInt8(25),3,"indexed PNG");
 assert.ok(bytes.includes(Buffer.from("tRNS")),"transparent corners, no opaque tile");
 assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"),hash,
  "must package EXACT user-supplied GL/UL art after quality-preserving resize");
 assert.ok(optimizer.includes('"app/src/main/assets/result-icons/modes/'+name+'"'),
  "do not recode user PNG during APK optimization");
 assert.ok(workflow.includes('"'+name+'": "'+hash+'"'),
  "signed release gate must verify exact images INSIDE APK");
}
assert.ok(dock.includes('gl:"GLBadgeLT262.png",ul:"ULBadgeLT262.png"'),
 "new GL/UL artwork in the shared modePath");
assert.ok(dock.includes('gl:"gl-triangle.png",ul:"ul-triangle.png"'),
 "preserve fallback art for old installations");
assert.ok(dock.includes('hundo:"3Star.png",nundo:"0Star.png"'));
assert.ok(dock.includes('custom:"StarIVRaw.png"'));
assert.ok(dock.includes('function getResultIcon('),
 "existing result/bubble icon selection remains");
assert.ok(dock.includes('gl:"great-league.png"')||dock.includes('gl:{normal:"great-league.png"'),
 "do not replace PvP result bases");
assert.ok(community.includes('"result-icons/modes/StarGL.png"'),
 "chat badges keep original artwork");
assert.ok(community.includes('"result-icons/modes/StarUL.png"'),
 "chat badges keep original artwork");
// Preserved compact CSS: no new geometry/layout or second row for these PNGs.
assert.ok(dock.includes("width:17px!important;height:17px!important;object-fit:contain!important"));
assert.ok(dock.includes("width:27px!important;min-width:0!important;height:18px!important"));
console.log("LT262 PASS: exact user GL/UL PNGs, 96px alpha, no geometry change, original modes/chat preserved, signed APK asset gate");

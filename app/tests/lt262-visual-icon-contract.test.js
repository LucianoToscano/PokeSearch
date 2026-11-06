"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets");
const read=p=>fs.readFileSync(path.join(assets,p));
const sha=p=>crypto.createHash("sha256").update(read(p)).digest("hex");
const originals={
 "result-icons/modes/GLBadgeLT262.png":"e8c54075550edd0c54e5df66720b6db40faf344e03a69072ae34521fcc9138bf",
 "result-icons/modes/ULBadgeLT262.png":"25e7d4cc49585210df25d2acb0d14e78830ad10d04a5ec07e511994b92dad1fe",
 "ui-icons/league-gl-flag.png":"3f19907174fc273b242eb379773cfcf51f43f9d3a2418e0f28d64c93947c33ad",
 "ui-icons/league-ul-flag.png":"7e5869d09c616db93bc2cca29f3edeec9aba731364b30733d1e59407626719f4",
 "ui-icons/league-ml-flag.png":"7b3eebe07a8ea8640b0454afecb62b76bc708cee848c7e239de4475d0ed8f859",
 "ui-icons/league-cup-flag.png":"4ffdd290a519cdf2fa68622f0fbca2d42f42819601dc36fe08de09bcc6d010ea",
 "ui-icons/raid-badge.png":"a9761e07ed670b1ed702cfabd6d1d032f94eebeeca06ff96e5295cfdbebefdef",
 "ui-icons/mt-elite.png":"8569b664c557130798dc3038e94250de0e3600a3a87a0e5fd522bf27393d91c6",
 "ui-icons/mt-normal.png":"aaee8981343025e786481837984acbf081c17617a10a076ae5afb07516e719fa",
 "ui-icons/mt-unknown.png":"1c7e9a80311bc1cd4187adf83e7b583f096a0c825a429bea015795dcee4be69e",
 "ui-icons/mega-symbol.png":"ed8d845ab02a575b90f331a98068efc78d3aca87ed9d9235afec1711f2492f26"
};
for(const [file,digest] of Object.entries(originals)){
 const data=read(file);
 assert.equal(data.subarray(0,8).toString("hex"),"89504e470d0a1a0a",file+" PNG");
 assert.equal(sha(file),digest,file+" must preserve user-supplied content");
 assert.ok(data.length>700&&data.length<10000,file+" compact PNG");
}
const detail=read("detail.html").toString("utf8");
const dock=read("dock.html").toString("utf8");
const ota=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OtaAssets.java"),"utf8");
const builder=fs.readFileSync(path.join(__dirname,"../../scripts/build_ota_pack.py"),"utf8");
const workflow=fs.readFileSync(path.join(__dirname,"../../.github/workflows/pokesearch-official-release.yml"),"utf8");
for(const name of Object.keys(originals))
 assert.ok(workflow.includes(name.split("/").at(-1)),name+" missing from official gate");
assert.ok(ota.includes("ui-icons|weather-icons"),"OTA Android resource regex must accept ui-icons PNGs");
assert.ok(builder.includes("ui-icons|weather-icons"),"signed OTA builder must accept ui-icons PNGs");
const modeStart=dock.indexOf("function getModeMenuIcon("),resultStart=dock.indexOf("function getResultIcon(",modeStart);
assert.ok(modeStart>0&&resultStart>modeStart);
const menu=dock.slice(modeStart,resultStart);
const result=dock.slice(resultStart,resultStart+2400);
assert.ok(menu.includes('gl:"GLBadgeLT262.png",ul:"ULBadgeLT262.png"'),
 "only mode editor GL/UL uses circular uploaded badges");
assert.ok(result.includes("RESULT_BASE_ICONS"),"the actual Pokéball/result header must retain base icons");
assert.ok(!result.includes("GLBadgeLT262.png")&&!result.includes("ULBadgeLT262.png"),
 "Do not place mode badges on the floating Pokéballs");
for(const [league,file] of [["gl","league-gl-flag.png"],["ul","league-ul-flag.png"],["ml","league-ml-flag.png"]]){
 assert.ok(detail.includes(league+':"ui-icons/'+file+'"'));
 assert.ok(detail.includes('.psLeagueIv[data-ps-league="'+league+'"]::before'));
}
for(const img of ["raid-badge.png","mt-elite.png","mt-normal.png","mt-unknown.png","mega-symbol.png"])
 assert.ok(detail.includes("ui-icons/"+img),img+" must appear in detail view");
assert.ok(!detail.includes('src="mega_evolution_icon.svg"'),
 "replace Mega symbol only in card");
assert.ok(detail.includes('btn.setAttribute?.("data-ps-mt",psMtKind(prior?.icon))'),
 "move status must be identified before touch");
assert.ok(detail.includes('btn.setAttribute?.("data-ps-mt",psMtKind(checked.icon))'),
 "pre-click source verification updates only proper badge state");
assert.ok(detail.includes('if(actionOpened)return;'),
 "late status must never mutate badge after the first click");
assert.ok(detail.includes('psMtKind=icon=>icon==="⚔️"?"elite":icon==="🗡️"?"normal":"unknown"'),
 "unknown status is never presented as normal");
assert.ok(detail.includes('#rankLine .psMovesAction{font-size:0!important'),
 "keep original semantic text while only replacing visual emoji art");
assert.ok(detail.includes('onclick="toggleRaidDetails()">Raides'));
assert.ok(detail.includes('psLeagueIconHtml("gl")'));
assert.ok(detail.includes('psLeagueIconHtml("ul")'));
assert.ok(detail.includes('psLeagueIconHtml("ml")'));
assert.ok(!detail.includes('button.textContent="🏆 Raides'),"no legacy trophy in Raid badge");
assert.ok(!detail.includes("const leagueIcon={gl:"));
const inline=detail.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert.ok(inline);new vm.Script(inline);
console.log("LT262 PASS: 11 exact images, GL/UL mode-only, PvP league flags, Raid/MT/Mega, OTA safety and pre-click semantics");

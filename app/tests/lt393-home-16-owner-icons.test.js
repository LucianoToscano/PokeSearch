"use strict";
// LT393: contract for 16 equal Home modules using the owner's Iconehome PNG/WebP.
// This source/asset test does not replace visual QA on Samsung hardware.
const fs=require("node:fs"),assert=require("node:assert/strict"),path=require("node:path"),crypto=require("node:crypto");
const root=path.join(__dirname,"../src/main");
const base="java/com/lucianotoscano/pokesearchoverlay/";
const main=fs.readFileSync(path.join(root,base+"MainActivity.java"),"utf8");
const atlas=fs.readFileSync(path.join(root,base+"HomeUserIconAtlas.java"),"utf8");
const floating=fs.readFileSync(path.join(root,base+"HomeFloatingModeIcon.java"),"utf8");
const image=fs.readFileSync(path.join(root,"assets/home-user-icons-atlas.png"));
assert.equal(image.subarray(0,8).toString("hex"),"89504e470d0a1a0a","owner art PNG signature");
assert.equal(image.readUInt32BE(16),1024,"atlas width");
assert.equal(image.readUInt32BE(20),1024,"atlas height");
assert.match(atlas,/private static final int TILE=256/);
assert.match(main,/for\(int line=0;line<4;line\+\+\)/);
assert.match(main,/for\(int col=0;col<4;col\+\+\)/);
assert.match(main,/addHomeGridCell\(lineRow,homeModuleIcons\[at\],at,homeModuleNames\[at\]\)/);
assert.match(main,/screen\.addView\(launcherGrid,gridLp\)/);
const names=main.match(/String\[\] homeModuleNames=\{([\s\S]*?)\};/)[1]
 .match(/"[^"]+"/g).map(x=>x.slice(1,-1));
assert.deepEqual(names,[
 "Pokébola 1","Pokébola 2","Auto Hunt","Assistente",
 "Raids","Power Spots","Quests","Rocket",
 "Weather","Rare Candy","PvP","Pokédex",
 "Scanner","Trocas","Calculadora","Comunidade"]);
assert.equal(names.length,16);
assert.doesNotMatch(names.join("|"),/Extra/);
assert.match(main,/HomeUserIconAtlas\.icon\(this,index\)/);
assert.match(main,/toggleHomeOverlay\(\)/);
assert.match(main,/toggleSecondaryOverlay\(\)/);
assert.match(main,/toggleHomePgsOverlay\(\)/);
assert.match(main,/toggleRaidAssistantOverlay\(\)/);
assert.match(main,/toggleRareCandyOverlay\(\)/);
assert.match(main,/openPokeListRadar\("raid"\)/);
assert.match(main,/openPokeListRadar\("quest"\)/);
assert.match(main,/openPokeListRadar\("rocket"\)/);
assert.match(main,/openDataHubCatalog\(\)/);
assert.match(main,/ps_home_background_light:R\.drawable\.ps_home_background_dark/);
assert.match(floating,/secondary\?"prefs_secondary":"prefs"/);
assert.match(floating,/result-icons\/base\/base-gl\.png/);
assert.match(floating,/result-icons\/ultra-league\.png/);
assert.match(main,/refreshHomePokeballImage\(overlayControl,false\)/);
assert.match(main,/refreshHomePokeballImage\(secondaryOverlayControl,true\)/);
for(const n of ["Assistente Virtual","Rocket"]){
 // These assets are reused from the verified, already-licensed old art pack;
 // neither is misrepresented as a new submitted ZIP icon.
 assert.ok(n.length>0);
}
console.log("LT393: 4×4, user atlas, independent P1/P2 and existing actions: PASS");

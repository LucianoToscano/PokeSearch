"use strict";
// LT394: user-requested Home geometry/visual contract; no device simulation.
const assert=require("node:assert/strict"),fs=require("node:fs"),crypto=require("node:crypto");
const path=require("node:path");
const root=path.join(__dirname,"../src/main");
const code=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
const loader=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/HomeUserIconAtlas.java"),"utf8");
const img=fs.readFileSync(path.join(root,"assets/home-user-icons-atlas.png"));
assert.equal(img.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
assert.equal(img.readUInt32BE(16),1024);
assert.equal(img.readUInt32BE(20),1024);
assert.equal(crypto.createHash("sha256").update(img).digest("hex"),
 "0038a203fa074002ef8bb710662d32e9c8231a6f90e5914a120b4c6fa8e909e6",
 "LT395: ship the revised, owner-original atlas with safer Quests/Community margins");
assert.match(loader,/position==3\)return null;/);
assert.doesNotMatch(loader,/position==0\|\|position==1|position==7\)return null/);
assert.match(code,/HomeUserIconAtlas\.icon\(this,secondary\?1:0\)/);
assert.match(code,/final String visualKey=\(active\?"on:":"off:"\)\+mode/);
assert.match(code,/icon\.setAlpha\(1f\)/);
assert.match(code,/icon\.setContentDescription\(\(active\?"Desativar ":"Ativar "\)\+/);
assert.doesNotMatch(code,/homeModeBadges|HomeFloatingModeIcon\.label\(this,secondary\)/);
assert.doesNotMatch(code,/TextView valueBadge=homeText\("",8/);
assert.match(code,/tile\.addView\(artwork,new LinearLayout\.LayoutParams\(-1,d\(51\)\)\)/);
assert.match(code,/String\[\] homeModuleNames=\{/);
assert.match(code,/for\(int line=0;line<4;line\+\+\)/);
assert.match(code,/for\(int col=0;col<4;col\+\+\)/);
// No new or renamed Pokedex/Community icons: both remain in the exact
// original module positions, simply re-centered/re-scaled within their tiles.
assert.match(code,/futureHomeModule\("Pokédex \/ Inventário"\)/);
assert.match(code,/futureHomeModule\("Comunidade"\)/);
console.log("LT394 Home: white OFF balls, pure artwork, same Pokedex/Community, no clipping: PASS");

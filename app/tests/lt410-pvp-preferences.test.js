"use strict";
const fs=require("fs");
const assert=require("assert");
const path=require("path");
const root=path.resolve(__dirname,"../../");
const source=fs.readFileSync(path.join(root,
  "src/main/java/com/lucianotoscano/pokesearchoverlay/PvpBattleActivity.java"),"utf8");
const main=fs.readFileSync(path.join(root,
  "src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
const manifest=fs.readFileSync(path.join(root,
  "src/main/AndroidManifest.xml"),"utf8");
assert(main.includes("homeModuleIcons[10].setOnClickListener(v->openPvpBattles());"),
  "PvP Home tile must open the dedicated Activity");
assert(manifest.includes('android:name=".PvpBattleActivity"'),
  "PvP screen must be registered in manifest");
for(const key of ["fast_attack","charged_attack","auto_shield","auto_switch"]){
  assert(source.includes('addOption("'+key+'"'),"missing independent PvP preference: "+key);
}
assert(source.includes("pvp_battle_preferences_v1"),"PvP has a separate preference store");
assert(source.includes("Elas NÃO atacam"),"no misleading automation claim");
assert(!source.includes("dispatchGesture("),"no gameplay gestures in settings Activity");
assert(source.includes("PersonalPokedexActivity.class"),"Pokédex handoff remains functional");
console.log("LT410: PvP preferences / Home routing / no fake automation OK");

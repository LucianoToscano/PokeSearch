"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"..",p),"utf8");
const sprites=require("../src/main/assets/sprite_offline.js");
const alerts=read("src/main/java/com/lucianotoscano/pokesearchoverlay/EncounterAlertText.java");
const watch=read("src/main/java/com/lucianotoscano/pokesearchoverlay/WatchAlerts.java");
const overlay=read("src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const builder=read("scripts/build_sprite_bundle.py");
assert.match(alerts,/return species\+id\+" · "\+quality/,"Species must be first");
assert.match(watch,/setLargeIcon\(artwork\)/);
assert.match(overlay,/encounterAlertTitle\(firstNewCard\)/);
assert.match(overlay,/queuedFavoriteAlerts\.put\(key,new QueuedFavoriteAlert/);
assert.match(overlay,/NEXT_GENERAL_ALERT_ID\.updateAndGet/,"Do not overwrite all new Pokemon with fixed notification id");
assert.match(overlay,/WatchAlerts\.match\(this,pending\.name,pending\.title,pending\.details/);
assert.match(overlay,/getAssets\(\)\.open\(file\)/);
assert.match(overlay,/if\(watchedCount>0\)/);
assert.doesNotMatch(overlay,/if\(watchedCount>1\)watchDetails/);
const costume=(dex,name,form,shiny)=>sprites.resolve({
 number:"#"+dex,name,form,shiny,image:""});
for(const [dex,name,form] of [
 [25,"Pikachu","Halloween 2021 Costume"],
 [393,"Piplup","Halloween 2021 Costume"],
 [426,"Drifblim","Halloween 2021 Costume"],
 [714,"Noibat","Halloween 2025"],
 [4,"Charmander","Goggles 2026"]
]){
 const image=costume(dex,name,form,false);
 assert.match(image.src,/^file:\/\/\/android_asset\/pokemon-sprites\/costumes\//);
 assert.match(image.original,/^https:\/\/raw\.githubusercontent\.com\/PokeMiners\/pogo_assets\/c2a686eb/);
 assert.ok(image.officialCostume);
 const shiny=costume(dex,name,form,true);
 assert.match(shiny.src,/^file:\/\/\/android_asset\/pokemon-sprites\/costumes\//);
 assert.match(shiny.original,/^https:\/\/raw\.githubusercontent\.com\/PokeMiners\/pogo_assets\/c2a686eb/);
}
// The COPY-2019 shiny sprite is not verified and must never pretend to exist.
assert.equal(costume(3,"Venusaur","Copy 2019",true).src,"");
assert.equal(sprites.resolve({number:"#714",name:"Noibat",form:"Halloween 2022 Costume",shiny:true}).src,"");
assert.match(builder,/COSTUME_SOURCE_COMMIT = "c2a686eb/);
console.log("PASS LT136: clear name-first notifications, individual encounters and exact-costume fallback");

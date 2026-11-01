"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay");
const picker=fs.readFileSync(path.join(root,"PokemonPicker.java"),"utf8");
const bridge=fs.readFileSync(path.join(root,"OverlayService.java"),"utf8");
const keySrc=fs.readFileSync(path.join(root,"FavoritePanelPositionKeys.java"),"utf8");
const tests=fs.readFileSync(path.join(__dirname,"FavoritePanelPositionKeysTest.java"),"utf8");
assert.ok(picker.includes("boolean secondaryOverlay"),"picker accepts explicit Pokéball scope");
assert.ok(picker.includes("toolbarTop,toolbarBottom,false"),"legacy MainActivity/P1 callers stay compatible");
assert.ok(bridge.includes("menuParams.y+dp(Math.max(0,popupOffsetDp))+dp(visualMenuBaseDp()),\n                isSecondaryOverlay()"),"P2 passes identity without changing toolbar anchor");
const keys=["favoritePanelManualV1","favoritePanelXV1","favoritePanelYV1","favoritePanelScreenWV1","favoritePanelScreenHV1"];
for(const key of keys){
 assert.equal((picker.match(new RegExp('FavoritePanelPositionKeys\\.key\\(secondaryOverlay,"'+key+'"\\)','g'))||[]).length,2,
  "read and write must both scope: "+key);
 assert.ok(keySrc.includes('"'+key+'"'),"key is whitelisted");
 assert.ok(tests.includes('"'+key+'"'),"key included in Java regression");
}
assert.ok(picker.includes('activity.getSharedPreferences("prefs",0)'),"preserve existing P1 persistence");
assert.ok(picker.includes('WatchAlerts.isWatched('),"shared favorite choices unchanged");
assert.ok(!picker.includes('getSharedPreferences("prefs_secondary"'),"no accidental split of global favorites");
assert.ok(picker.includes("FavoritePanelGeometry.adjacentToToolbar("),"real toolbar first-frame placement retained");
assert.ok(picker.includes("FavoritePanelGeometry.overlapsToolbar("),"saved position cannot cover toolbar");
assert.ok(picker.includes("root.setOnTouchListener(freePanelDrag)"),"drag gesture retained");
assert.ok(bridge.includes("if(pickerOpen)"),"native dialog toggling retained");
console.log("PASS LT213: separate geometry state for two Pokéballs; shared selection unaffected");

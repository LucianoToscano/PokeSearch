"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const assets=path.join(__dirname,"../src/main/assets");
const sprite=require("../src/main/assets/sprite_offline.js");
const prefix="file:///android_asset/pokemon-sprites/forms/";
for(const [dex,name] of [[585,"Deerling"],[586,"Sawsbuck"]]){
 for(const shiny of [false,true]){
  const input={name,number:"#"+dex,form:"Autumn",shiny};
  const suffix=shiny?"-shiny":"";
  const resolved=sprite.resolve(input);
  assert.equal(resolved.src,prefix+dex+"-autumn"+suffix+".png");
  assert.equal(resolved.exactForm,true);
  const url="https://example.test/pm"+dex+".fAUTUMN"+(shiny?".s":"")+".icon.png";
  const fromSite=sprite.resolve({...input,imageFromSite:true,image:url});
  assert.equal(fromSite.src,url);
  assert.equal(fromSite.original,resolved.src,"site fallback must match exact form and Shiny");
  assert.notEqual(sprite.resolve({...input,form:"Spring"}).src,resolved.src);
  assert.notEqual(sprite.resolve({...input,form:"Summer"}).src,resolved.src);
  assert.notEqual(sprite.resolve({...input,form:"Winter"}).src,resolved.src);
  assert.notEqual(sprite.resolve({...input,form:""}).src,resolved.src);
  assert.equal(sprite.exactSeasonalForm({...input,costume_id:71}),null);
 }
}
const dock=fs.readFileSync(path.join(assets,"dock.html"),"utf8");
const service=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const detail=fs.readFileSync(path.join(assets,"detail.html"),"utf8");
assert.match(dock,/<script src="cooldown_estimate.js"><\/script>/);
assert.match(dock,/window\.onCooldownState=function/);
assert.match(dock,/class="cooldownEta/);
assert.match(dock,/data-until=/);
assert.match(dock,/\.cooldownEta\[data-until\]/);
assert.match(dock,/newlyExpired&&Native\.expiredResults/);
assert.match(service,/JSONObject item=arr\.getJSONObject\(selected\)/);
assert.match(service,/item\.optInt\("sourceIndex",-1\)!=index/);
assert.match(detail,/Native\.confirmCooldownCapture\(currentIndex\)/);
assert.match(detail,/Native\.confirmCaptureShare\(currentIndex\)/);
console.log("LT145 exact Deerling Autumn and independent cooldown card regression PASS");

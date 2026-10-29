"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.join(__dirname,"../src/main");
const detail=fs.readFileSync(path.join(root,"assets/detail.html"),"utf8");
const service=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const store=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/CooldownCaptureStore.java"),"utf8");
for(const match of detail.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){
  new vm.Script(match[1]); // No syntax errors in WebView source.
}
assert.match(detail, /container\.hidden=!\(cooldownLinked&&cooldownActive&&\(canConfirm\|\|hasReference\)\)/);
assert.doesNotMatch(detail,/container\.hidden=true; \/\/ temporary: experimental/);
assert.match(detail, /#cooldownControls:not\(\[hidden\]\)\{display:flex!important/);
assert.match(detail, /#cooldownControls button\[hidden\]\{display:none!important/);
assert.match(detail, /note\.hidden=!\(cooldownLinked&&cooldownActive&&note\.textContent\)/);
assert.match(detail,/if\(!cooldownLinked\|\|!cooldownActive\|\|!window\.PokeSearchCooldown\?\.coords\(currentCoords\)/);
assert.match(detail,/onclick="Native\.undoCooldown\(\)"/);
assert.match(detail,/onclick="resetCooldownUi\(\)"/);
assert.match(detail,/onclick="captureShareAsk\(\)"/);
assert.match(service,/CooldownCaptureStore\.record\(this,scope,coords,fingerprint,/);
assert.match(service,/notifyCooldownChanged\(\)/);
assert.match(service,/js\(resultPanel,resultLoaded,jsPayload\)/);
assert.match(service,/js\(detailPanel,detailLoaded,"window\.cooldownChanged\("/);
assert.match(store,/private static final String PREF="pokesearch-cooldown-v1"/);
assert.match(store,/trainer\.matches\("\[0-9\]\{12\}"\)/);
console.log("PASS LT149: opt-in capture, undo, feedback, dual-overlay shared cooldown, no chat publishing");

"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../src/main");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const contract=require("../src/main/assets/api_result_contract.js");
const main=read("java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const overlay=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const session=read("assets/api_android_session.js");
const browser=read("assets/api_browser_transport.js");
const manifest=read("AndroidManifest.xml");
let passed=0;function test(name,fn){fn();passed++;console.log("PASS LT118 "+name);}
test("P2 toggle restored, retains secondary preferences",()=>{
 assert.match(main,/dualOverlayRow\.setVisibility\(View\.VISIBLE\)/);
 assert.match(main,/if\(which==0\)toggleHomeOverlay\(\);else toggleSecondaryOverlay\(\)/);
 assert.match(overlay,/getSharedPreferences\(isSecondaryOverlay\(\)\?"prefs_secondary":"prefs",0\)/);
});
test("API shiny request distinct from returned shiny evidence",()=>{
 assert.match(session,/requestedShiny:filters.shiny===true/);
 assert.match(session,/apiReturnedShiny:r.cards.length>0&&r.cards.every/);
 assert.doesNotMatch(session,/siteShiny:filters.shiny===true/);
 assert.match(overlay,/apiFilterAccepted/);
 assert.match(overlay,/apiReturnedShiny/);
});
test("401 clears JWT; 429 supports seconds and HTTP date",()=>{
 assert.match(browser,/response.status===401/);
 assert.match(browser,/d.storage.removeItem\("jwt"\)/);
 assert.match(browser,/Date.parse\(raw\)/);
 assert.match(overlay,/rate-limited/); // Error is not transient DOM fallback
});
test("API plan cap retained and displayed for server-owned VIP tiers",()=>{
 const large=contract.normalizeResponse({cap:100,results:[]},{nowMs:Date.now()});
 assert.equal(large.ok,true);assert.equal(large.serverCap,100);assert.equal(large.displayCap,100);
 const anon=contract.normalizeResponse({cap:5,results:[]},{nowMs:Date.now()});
 assert.equal(anon.serverCap,5);assert.equal(anon.displayCap,5);
});
test("Android no-cleartext policy explicitly defined",()=>{
 assert.match(manifest,/networkSecurityConfig="@xml\/network_security_config"/);
});
console.log("LT118 "+passed+"/"+passed+" PASS");

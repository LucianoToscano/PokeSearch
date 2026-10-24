"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const app=path.join(__dirname,"../");
const service=fs.readFileSync(path.join(app,"src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const gradle=fs.readFileSync(path.join(app,"build.gradle.kts"),"utf8");
const rules=fs.readFileSync(path.join(app,"proguard-rules.pro"),"utf8");
const files=fs.readdirSync(path.join(app,"src/main/assets"));
let n=0;function check(name,fn){fn();n++;console.log("PASS LT77 Stage13 "+name);}
check("JavaScriptInterface annotation survives R8",()=>{
 assert.ok(rules.includes('@android.webkit.JavascriptInterface <methods>;'));
 assert.ok(rules.includes('InnerClasses'));
 assert.ok(service.includes('@JavascriptInterface public void coords('));
});
check("JSON models retained and release shrinks",()=>{
 assert.ok(rules.includes('-keep class org.json.** { *; }'));
 assert.ok(gradle.includes('isMinifyEnabled = true'));
 assert.ok(gradle.includes('isShrinkResources = true'));
});
check("application identity unchanged",()=>{
 assert.ok(gradle.includes('applicationId = "com.lucianotoscano.pokesearch"'));
 assert.ok(gradle.includes('namespace = "com.lucianotoscano.pokesearchoverlay"'));
});
check("DOM assets remain intact",()=>{
 for(const name of ["dock.html","detail.html","overlay.html","probe.js"])
  assert.ok(files.includes(name),name);
 assert.ok(service.includes('file:///android_asset/dock.html'));
 assert.ok(service.includes('file:///android_asset/detail.html'));
});
check("experimental API scripts are quarantined and not executed by release",()=>{
 for(const name of ["api_browser_transport.js","api_result_contract.js",
   "api_reveal_contract.js","api_integration_router.js"]){
  assert.ok(files.includes(name),name);
  assert.ok(!service.includes(name),"Unexpected Android import: "+name);
 }
 assert.ok(!service.includes('PokeSearchApiRouter'));
});
console.log("LT77 Stage13 "+n+"/"+n+" PASS");

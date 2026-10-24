"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");
const main=fs.readFileSync(path.join(root,"src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
const gradle=fs.readFileSync(path.join(root,"build.gradle.kts"),"utf8");
const center=fs.readFileSync(path.join(root,"src/main/java/com/lucianotoscano/pokesearchoverlay/UpdateCenter.java"),"utf8");
const manifest=fs.readFileSync(path.join(root,"src/main/AndroidManifest.xml"),"utf8");
let passed=0;
function check(label,fn){fn();passed++;console.log("PASS LT73 "+label);}
check("Home footer obtains installed versionName from BuildConfig",()=>{
  assert.ok(main.includes('"PokeSearch v"+BuildConfig.VERSION_NAME+" LT  •  PoGoCoordinates /search"'));
});
check("Home footer retains compact 30dp height and same sizing",()=>{
  assert.ok(main.includes('TextView footer=homeText("PokeSearch v"+BuildConfig.VERSION_NAME+" LT  •  PoGoCoordinates /search",10,'));
  assert.ok(main.includes("screen.addView(footer,new LinearLayout.LayoutParams(-1,d(30)));"));
});
check("Gradle uses current installed versionName from signed build",()=>{
  assert.ok(gradle.includes('versionName = if (testVersionCode != null)'));
  assert.ok(gradle.includes('publicVersionName ?:'));
});
check("Home controls light/dark presentation",()=>{
  assert.ok(main.includes("homeLightMode?Color.rgb(26,51,72):Color.rgb(185,208,233)"));
  assert.ok(main.includes("homeLightMode?Color.argb(200,248,251,255):Color.argb(135,9,23,42)"));
});
check("Update Center still reads Drive manifest, without new permissions",()=>{
  assert.ok(main.includes("UpdateCenter.check(this);"));
  assert.ok(center.includes('private static final String SCHEMA="pokesearch-update-v1";'));
  assert.ok(!manifest.includes("REQUEST_INSTALL_PACKAGES"));
});
console.log("LT73 Home footer regression: "+passed+"/"+passed+" PASS");

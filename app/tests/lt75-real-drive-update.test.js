"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");
const main=fs.readFileSync(path.join(root,"src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
const center=fs.readFileSync(path.join(root,"src/main/java/com/lucianotoscano/pokesearchoverlay/UpdateCenter.java"),"utf8");
const policy=fs.readFileSync(path.join(root,"src/main/java/com/lucianotoscano/pokesearchoverlay/UpdatePolicy.java"),"utf8");
let count=0;
function testCase(label,run){run();count++;console.log("PASS LT75 "+label);}
testCase("temporary LT74 preview no longer intercepts real updates",()=>{
 for(const token of ["UPDATE_PREVIEW_ENABLED","UPDATE_PREVIEW_DISMISSED",
    "homeUpdatePreviewEnabled","v0.00.75 · SIMULAÇÃO",
    "Teste: botão acionado.","footer.setOnLongClickListener"])
   assert.ok(!main.includes(token),"unexpected preview: "+token);
});
testCase("dynamic installed version remains visible in compact footer",()=>{
 assert.ok(main.includes('"PokeSearch v"+BuildConfig.VERSION_NAME+" LT  •  PoGoCoordinates /search"'));
 assert.ok(main.includes("screen.addView(footer,new LinearLayout.LayoutParams(-1,d(30)));"));
});
testCase("Home network check remains asynchronous",()=>{
 assert.ok(main.includes("UpdateCenter.check(this);"));
 assert.ok(center.includes("IO.execute(()->{"));
 assert.ok(center.includes("lastCheckAt"));
});
testCase("real announcement still requires validated eligible manifest",()=>{
 assert.ok(main.includes("if(!UpdateCenter.isEligible(this,info)){"));
 assert.ok(center.includes("UpdatePolicy.shouldDisplay(manifest.enabled,"));
 assert.ok(center.includes("remoteCode>installedCode")||policy.includes("remoteCode>installedCode"));
});
testCase("real download action launches Google Drive explicitly",()=>{
 assert.ok(main.includes("UpdateCenter.openDownload(this,info)"));
 assert.ok(center.includes("Intent.ACTION_VIEW"));
 assert.ok(center.includes("Intent.CATEGORY_BROWSABLE"));
});
testCase("real dismissal persists by remote version",()=>{
 assert.ok(main.includes("UpdateCenter.dismiss(this,info.versionCode)"));
 assert.ok(center.includes('private static final String DISMISSED_KEY="homeDriveUpdateDismissedCode"'));
});
testCase("Home themes retain compact card and Firebase counters",()=>{
 assert.ok(main.includes("boolean light=homeLightMode;"));
 assert.ok(main.includes("homeUpdateHolder.setVisibility(View.GONE)"));
 assert.ok(main.includes("FirebaseStats.bind(this,online,installations);"));
});
testCase("manifest source and strict schema are unchanged",()=>{
 assert.ok(center.includes('private static final String MANIFEST_ID="15IrWg9FpiNteZcsmUSBtyfd4v2Hmcbrf"'));
 assert.ok(center.includes('private static final String SCHEMA="pokesearch-update-v1"'));
 assert.ok(policy.includes('"https://drive.google.com/uc?export=download&id="+id'));
});
console.log("LT75 real update regression: "+count+"/"+count+" PASS");

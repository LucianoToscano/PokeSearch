"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const guard=read("src/main/java/com/lucianotoscano/pokesearchoverlay/IntegrityGuard.java");
const gradle=read("build.gradle.kts");
const manifest=read("src/main/AndroidManifest.xml");
const devManifest=read("src/preview/AndroidManifest.xml");

test("preview only may use separate package identity",()=>{
 assert.match(gradle,/applicationIdSuffix\s*=\s*"\.preview"/);
 assert.match(gradle,/buildConfigField\("boolean", "DEV_PREVIEW", "false"\)/);
 assert.match(gradle,/buildConfigField\("boolean", "DEV_PREVIEW", "true"\)/);
 assert.match(guard,/BuildConfig\.DEV_PREVIEW\?PACKAGE\+"\.preview":PACKAGE/);
 assert.match(devManifest,/PokeSearch DEV/);
});
test("preview retains source and integrity gates without sharing LT's signature",()=>{
 assert.match(guard,/if\(vc<1000058L\|\|/);
 assert.match(guard,/ApplicationInfo\.FLAG_DEBUGGABLE/);
 assert.match(guard,/previewSignatures\.length==1&&assetsMatch\(c\)/);
 assert.match(guard,/matchesPix\(PixSupport\.PAYLOAD\)/);
});
test("official LT path still pins the official signature and all seven assets",()=>{
 assert.match(guard,/signerMatches\(current\[0\],expected\)&&assetsMatch\(c\)/);
 assert.match(guard,/vc==51&&/);
 assert.match(guard,/PACKAGE\s*=\s*"com\.lucianotoscano\.pokesearch"/);
});
test("file sharing resolves per-app authority for side-by-side install",()=>{
 assert.match(manifest,/android:authorities="\$\{applicationId\}\.updates"/);
 const tribute=read("src/main/java/com/lucianotoscano/pokesearchoverlay/CommunityTribute.java");
 assert.match(tribute,/a\.getPackageName\(\)\+"\.updates"/);
});

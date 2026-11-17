"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
test("preview package stays distinct from release",()=>{
 const fs=require("node:fs");
 const gradle=fs.readFileSync("app/build.gradle.kts","utf8");
 const manifest=fs.readFileSync("app/src/main/AndroidManifest.xml","utf8");
 const workflow=fs.readFileSync(".github/workflows/pokesearch-fastdev.yml","utf8");
 assert.match(gradle,/applicationIdSuffix = "\.preview"/);
 assert.match(gradle,/POKE_FASTDEV_VERSION_CODE/);
 assert.match(gradle,/POKE_FASTDEV_SIGNING_REQUIRED/);
 assert.match(gradle,/fastdevPersistent/);
 assert.match(manifest,/applicationId.*updates/);
 assert.match(workflow,/environment: fastdev-signing/);
 assert.match(workflow,/gh release create/);
 assert.match(workflow,/--prerelease/);
 assert.match(workflow,/1000000 \+ GITHUB_RUN_NUMBER/);
 assert.match(workflow,/POKE_FASTDEV_CERT_SHA256/);
});
test("preview update code checks package and signing",()=>{
 const fs=require("node:fs");
 const src=fs.readFileSync("app/src/preview/java/com/lucianotoscano/pokesearchoverlay/FastDevConsoleActivity.java","utf8");
 assert.match(src,/getPackageArchiveInfo/);
 assert.match(src,/GET_SIGNING_CERTIFICATES/);
 assert.match(src,/MessageDigest\.getInstance\("SHA-256"\)/);
 assert.match(src,/fastdev-\[0-9\]/);
 assert.match(src,/canRequestPackageInstalls/);
 assert.doesNotMatch(src,/ghp_|github_pat_/);
});

test("development and public display the SAME 0.XX.XX number with distinct Dev/LT suffix",()=>{
 const fs=require("node:fs");
 const official=JSON.parse(fs.readFileSync("release/official-request.json","utf8"));
 const gradle=fs.readFileSync("app/build.gradle.kts","utf8");
 const activity=fs.readFileSync("app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java","utf8");
 const manifest=fs.readFileSync("app/src/preview/AndroidManifest.xml","utf8");
 assert.match(official.version,/^0\.\d{2}\.\d{2}$/);
 // Version is read from the canonical request, never pinned to a past release.
 assert.ok(official.code>=54580);
 assert.match(official.version,/^0\.\d{2}\.\d{2}$/);
 assert.match(gradle,/val officialVersionRequest = file\("\.\.\/release\/official-request\.json"\)/);
 assert.match(gradle,/val fastDevDisplayVersion = \(groovy\.json\.JsonSlurper\(\)\.parse\(officialVersionRequest\)/);
 assert.match(gradle,/else if \(fastDevCode != null\) fastDevDisplayVersion/);
 assert.match(gradle,/versionNameSuffix = " Dev"/);
 assert.doesNotMatch(gradle,/versionNameSuffix = "-preview"/);
 assert.match(activity,/footer=homeText\("PokeSearch v"\+BuildConfig\.VERSION_NAME\+\s*\(BuildConfig\.FASTDEV_PREVIEW\?"":" LT"\)/);
 assert.match(manifest,/android:label="PokeSearch Dev"/);
 // This is metadata only: the public APK and its signer are NOT renamed.
 assert.match(gradle,/applicationIdSuffix = "\.preview"/);
 assert.match(gradle,/POKE_FASTDEV_VERSION_CODE/);
});

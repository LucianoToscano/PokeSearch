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

"use strict";
// LT382 - opt-in branch smoke and protected preview routing.
// Static contract: GitHub Actions is the runtime authority for actual dispatch.
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const branch=fs.readFileSync(".github/workflows/pokesearch-fastdev-branch.yml","utf8");
const preview=fs.readFileSync(".github/workflows/pokesearch-fastdev.yml","utf8");
const official=fs.readFileSync(".github/workflows/pokesearch-official-release.yml","utf8");
const {plan}=require("./fastdev.cjs");

test("FastDev source branch pushes get their own smoke lane",()=>{
 assert.match(branch,/^on:\n  push:\n    branches:\n      - 'fastdev\/\*\*'/m);
 assert.match(branch,/      - 'app\/\*\*'/);
 assert.match(branch,/cancel-in-progress: true/);
 assert.match(branch,/node scripts\/fastdev\.cjs --base origin\/main/);
 assert.doesNotMatch(branch,/^  pull_request:/m);
});
test("source-only branch lane has no Android build, signing or publication",()=>{
 assert.doesNotMatch(branch,/\bsecrets\./);
 assert.doesNotMatch(branch,/\b(?:assemblePreview|assembleRelease|gradle --|keytool|gh release create|android-36)\b/);
 assert.doesNotMatch(branch,/^\s+environment:/m);
 assert.match(branch,/contents: read/);
});
test("permanent signed preview only runs from explicit main request",()=>{
 assert.match(preview,/push:\n    branches: \[main\]\n    paths:\n      - 'fastdev\/preview-request\.json'/);
 assert.match(preview,/if: needs\.quick\.outputs\.selected_mode == 'apk-preview' && github\.ref == 'refs\/heads\/main' && github\.event_name != 'pull_request'/);
 assert.match(preview,/environment: fastdev-signing/);
 assert.match(preview,/EXPECTED_FASTDEV_CERT/);
 assert.match(preview,/PokeSearch-FastDev-Preview\.apk/);
});
test("official signing workflow remains separately gated",()=>{
 assert.match(official,/environment: official-updates/);
 assert.match(official,/release\/official-request\.json/);
});
test("profile and native changes select useful targeted feedback while remaining advisory",()=>{
 const source=plan(["app/src/main/assets/profile_summary.js"]);
 assert.ok(source.tests.includes("app/tests/lt381-profile-sync.test.js"));
 assert.ok(source.fullQaRequired);
 const native=plan(["app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"]);
 assert.ok(native.tests.includes("app/tests/lt381-profile-sync.test.js"));
 assert.ok(native.tests.includes("app/tests/signing-contract.test.js"));
 assert.ok(native.fullQaRequired);
});

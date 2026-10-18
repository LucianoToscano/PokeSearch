"use strict";
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "../..");
const read = name => fs.readFileSync(path.join(root, name), "utf8");
const gradle = read("app/build.gradle.kts");
const workflow = read(".github/workflows/build-v051-filters-preview.yml");
const ignore = read(".gitignore");
let tests=0;
const check = (label, fn) => { fn(); tests++; };
check("same package ID for upgrade", () =>
  assert.match(gradle, /applicationId = "com\.lucianotoscano\.pokesearch"/));
check("debug uses persistent signing config when supplied", () => {
  assert.match(gradle, /create\("persistentTestDebug"\)/);
  assert.match(gradle, /signingConfig = signingConfigs\.getByName\("persistentTestDebug"\)/);
});
check("signing and version fail closed in CI", () => {
  assert.match(gradle, /POKE_TEST_SIGNING_REQUIRED/);
  assert.match(gradle, /testSigningRequired && testVersionCode == null/);
  assert.match(workflow, /POKE_TEST_SIGNING_REQUIRED: "true"/);
  assert.match(workflow, /Stable signing secrets are missing/);
});
check("secrets come only from Actions secrets", () => {
  for(const key of ["POKE_TEST_KEYSTORE_B64","POKE_TEST_STORE_PASSWORD",
                    "POKE_TEST_KEY_ALIAS","POKE_TEST_KEY_PASSWORD"])
    assert.ok(workflow.includes("secrets."+key), key);
  assert.match(workflow, /chmod 600/);
  assert.match(workflow, /Remove restored keystore/);
});
check("versionCode derives from the workflow run number", () => {
  assert.ok(workflow.includes("POKE_TEST_VERSION_CODE=$((51000 + GITHUB_RUN_NUMBER))"));
  assert.match(gradle, /versionCode = testVersionCode \?: 51/);
});
check("publish only a signed and verified APK", () => {
  assert.match(workflow, /apksigner" verify --verbose --print-certs/);
  assert.ok(workflow.includes("grep -Eq '^Verified using v2 scheme.*: true$'"));
  assert.ok(!workflow.includes("grep -q 'Verified using v2 scheme'"));
  assert.match(workflow, /Publish only stable-signed test APK/);
  assert.match(workflow, /SIGNING_CERT_SHA256\.txt/);
});
check("actual APK package, code and name are inspected before publication", () => {
  assert.ok(workflow.includes('aapt" dump badging "$APK"'));
  assert.ok(workflow.includes('"name=\'com.lucianotoscano.pokesearch\'"'));
  assert.ok(workflow.includes('"versionCode=\'${EXPECTED_CODE}\'"'));
  assert.ok(workflow.includes('"versionName=\'0.51-beta.test.${EXPECTED_CODE}\'"'));
  assert.ok(workflow.includes('grep -Fq -- "$expected"'));
});
check("v2 scheme check rejects false and avoids permissive substring grep", () => {
  assert.ok(workflow.includes("grep -Eq '^Verified using v2 scheme.*: true$'"));
  assert.ok(!workflow.includes("grep -q 'Verified using v2 scheme'"));
});
check("optional certificate pin rejects unintended rotation", () =>
  assert.match(workflow, /Unexpected signing certificate; refusing to distribute/));
check("no Android backup or change to release signing", () => {
  assert.ok(read("app/src/main/AndroidManifest.xml").includes('android:allowBackup="false"'));
  assert.ok(gradle.includes('create("privateTestRelease")'));
});
check("test keystores and exports are ignored", () => {
  for(const ext of ["*.jks","*.keystore","*.p12","*.pfx","*.keystore.b64"]) 
    assert.ok(ignore.includes(ext), ext);
});
console.log("PokeSearch stable signing contract: "+tests+" tests passed");

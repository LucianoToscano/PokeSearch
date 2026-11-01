"use strict";
// LT74 local mock retired in LT75. Guard real OTA instead of requiring removed UI.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const src=path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay");
const main=fs.readFileSync(path.join(src,"MainActivity.java"),"utf8");
const update=fs.readFileSync(path.join(src,"UpdateCenter.java"),"utf8");
const github=fs.readFileSync(path.join(src,"GitHubUpdateCenter.java"),"utf8");
for(const obsolete of [
  "UPDATE_PREVIEW_ENABLED", "UPDATE_PREVIEW_DISMISSED",
  "v0.00.75 · SIMULAÇÃO", "Teste: botão acionado.",
  "homeUpdatePreviewEnabled"
]) assert.ok(!main.includes(obsolete),"Obsolete LT74 mock found: "+obsolete);
for(const current of [
  "UpdateCenter.check(this);", "UpdateCenter.isEligible(this,info)",
  "UpdateCenter.openDownload(this,info)", "GitHubUpdateCenter.check(this);"
]) assert.ok(main.includes(current),"Real updater flow missing: "+current);
assert.ok(update.includes('private static final String SCHEMA="pokesearch-update-v1"'));
assert.ok(github.includes("EXPECTED_SIGNING_CERT_SHA256") || github.includes("CERT"),"release certificate check not found");
console.log("LT74 removed; real OTA and release guard remain — PASS");

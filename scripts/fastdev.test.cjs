"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {plan}=require("./fastdev.cjs");

test("overlay changes select visual contract tests",()=>{
 const p=plan(["app/src/main/assets/dock.html"]);
 assert.equal(p.mode,"targeted");
 assert.ok(p.tests.includes("app/tests/lt112-dual-overlay-parity.test.js"));
 assert.ok(p.fullQaRequired);
});
test("login and probe changes select separate suites",()=>{
 const p=plan(["app/src/main/assets/login_entry.js","app/src/main/assets/probe.js"]);
 assert.ok(p.tests.includes("app/tests/login-entry.test.js"));
 assert.ok(p.tests.includes("app/tests/location-probe.test.js"));
});
test("unrecognized and native changes fail conservatively to smoke",()=>{
 const p=plan(["app/src/main/java/MainActivity.java","app/src/main/assets/new-feature.js"]);
 assert.equal(p.mode,"broad-smoke");
 assert.ok(p.tests.includes("app/tests/signing-contract.test.js"));
 assert.ok(p.fullQaRequired);
});
test("changed regression tests are not skipped",()=>{
 const p=plan(["app/tests/lt377-guest.test.js"]);
 assert.deepEqual(p.tests,["app/tests/lt377-guest.test.js"]);
});
test("documentation does not trigger APK or expensive tests",()=>{
 const p=plan(["docs/FASTDEV_GUIA.md","AGENTS.md"]);
 assert.equal(p.mode,"documentation");
 assert.deepEqual(p.tests,[]);
});
test("empty diff uses core smoke and does not assert full QA",()=>{
 const p=plan([]);
 assert.equal(p.mode,"smoke");
 assert.equal(p.tests.length,3);
 assert.ok(p.fullQaRequired);
});

test("first-party profile DOM runs login/identity regressions without APK",()=>{
 const p=plan(["app/src/main/assets/profile_summary.js"]);
 assert.equal(p.mode,"targeted");
 assert.ok(p.tests.includes("app/tests/lt381-profile-sync.test.js"));
 assert.ok(p.tests.includes("app/tests/lt376e-profile-login-selector.test.js"));
 assert.ok(p.fullQaRequired);
});
test("Android account and avatar sources select both smoke and identity checks",()=>{
 for(const className of ["MainActivity","PogoAccountSlots","ProfileAvatarCache"]){
  const p=plan(["app/src/main/java/com/lucianotoscano/pokesearchoverlay/"+className+".java"]);
  assert.equal(p.mode,"broad-smoke");
  assert.ok(p.tests.includes("app/tests/signing-contract.test.js"));
  assert.ok(p.tests.includes("app/tests/lt381-profile-sync.test.js"));
  assert.ok(p.fullQaRequired);
 }
});
test("FastDev CI config is advisory rather than an APK build trigger",()=>{
 const p=plan([".github/workflows/pokesearch-fastdev-branch.yml"]);
 assert.equal(p.mode,"broad-smoke");
 assert.ok(p.fullQaRequired);
});

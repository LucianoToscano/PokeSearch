"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {requiresBeta}=require("./fastdev-qa-scope.cjs");

test("pure preview implementation and FastDev automation omit irrelevant beta/R8",()=>{
 const files=[
  "app/src/preview/AndroidManifest.xml",
  "app/src/preview/java/com/lucianotoscano/pokesearchoverlay/FastDevApplication.java",
  "app/src/preview/java/com/lucianotoscano/pokesearchoverlay/FastDevConsoleActivity.java",
  "scripts/fastdev-automatic-home.test.cjs",
  "scripts/fastdev-manifest.test.cjs",
  ".github/workflows/pokesearch-fastdev.yml",
  "docs/FASTDEV_GUIA.md",
  "fastdev/latest.json"
 ];
 assert.equal(requiresBeta(files),false);
});
test("any shipping, shared, signing or unknown change ALWAYS retains full beta QA",()=>{
 for(const file of ["app/src/main/assets/dock.html",
 "app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java",
 "app/build.gradle.kts","gradle.properties","app/src/debug/AndroidManifest.xml",
 "scripts/build-official.cjs","release/official-request.json",
 ".github/workflows/secure-release.yml",".github/workflows/pokesearch-official-release.yml",
 "README.md",""]){
   assert.equal(requiresBeta(["app/src/preview/AndroidManifest.xml",file]),true,file);
 }
});
test("empty/untrusted diffs fail closed and cannot skip release signing gates",()=>{
 assert.equal(requiresBeta([]),true);
 assert.equal(requiresBeta(null),true);
 assert.equal(requiresBeta(["not-preview"]),true);
 assert.equal(requiresBeta(["app/src/preview-a/Foo.java"]),true);
});

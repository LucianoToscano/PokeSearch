"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),os=require("node:os"),path=require("node:path");
const crypto=require("node:crypto");
const {build}=require("./fastdev-manifest.cjs");
const source=fs.readFileSync("app/src/preview/java/com/lucianotoscano/pokesearchoverlay/FastDevConsoleActivity.java","utf8");
const workflow=fs.readFileSync(".github/workflows/pokesearch-fastdev.yml","utf8");
const manifest=JSON.parse(fs.readFileSync("fastdev/latest.json","utf8"));
test("public seed metadata binds a legitimate signed release",()=>{
 assert.equal(manifest.schema,1);
 assert.equal(manifest.tag,"fastdev-"+manifest.version_code);
 assert.equal(manifest.apk,"https://github.com/LucianoToscano/PokeSearch/releases/download/"+manifest.tag+"/PokeSearch-FastDev-Preview.apk");
 assert.match(manifest.sha256,/^[0-9a-f]{64}$/);
 assert.match(manifest.source_commit,/^[0-9a-f]{40}$/);
 assert.ok(manifest.size>60_000_000&&manifest.size<180_000_000);
});
test("newly published manifest is built using actual APK bytes",()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),"lt383-"));
 try{
  const file=path.join(dir,"PokeSearch-FastDev-Preview.apk");
  const bytes=Buffer.alloc(16384,23);
  fs.writeFileSync(file,bytes);
  const result=build(file,1000045,"a".repeat(40));
  assert.equal(result.version_code,1000045);
  assert.equal(result.tag,"fastdev-1000045");
  assert.equal(result.sha256,crypto.createHash("sha256").update(bytes).digest("hex"));
  assert.equal(result.size,bytes.length);
  assert.match(result.apk,/^https:\/\/github\.com\/LucianoToscano\/PokeSearch\/releases\/download\/fastdev-1000045\//);
  assert.throws(()=>build(file,999999,"a".repeat(40)));
  assert.throws(()=>build(file,1000045,"not-a-commit"));
  fs.writeFileSync(file,Buffer.alloc(2));
  assert.throws(()=>build(file,1000045,"a".repeat(40)));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test("native updater attempts public raw metadata first and retains GitHub fallback",()=>{
 assert.match(source,/raw\.githubusercontent\.com\/LucianoToscano\/PokeSearch\/main\/fastdev\/latest\.json/);
 assert.match(source,/private static Preview latestFromManifest\(\)/);
 assert.match(source,/try\{return latestFromManifest\(\);\}/);
 assert.match(source,/try\{return latestFromGitHubApi\(\);\}/);
 assert.match(source,/code<=BuildConfig\.VERSION_CODE/);
 assert.match(source,/!tag\.equals\("fastdev-"\+code\)/);
 assert.match(source,/!url\.equals\(DOWNLOAD\+code\+"\/"\+ASSET\)/);
 assert.match(source,/!sha\.matches\("\[0-9a-fA-F\]\{64\}"\)/);
 assert.match(source,/!source\.matches\("\[0-9a-fA-F\]\{40\}"\)/);
 assert.match(source,/browser=new Intent\(Intent\.ACTION_VIEW/);
 assert.match(source,/getPackageArchiveInfo/);
 assert.match(source,/SHA-256/);
 assert.match(source,/Certificado do APK diferente/);
 assert.doesNotMatch(source,/github_pat_|ghp_|Authorization|Bearer /);
});
test("manifest is updated only after protected release and with main SHA lease",()=>{
 const release=workflow.indexOf("Publish signed FastDev prerelease");
 const update=workflow.indexOf("Refresh quota-free public FastDev manifest");
 assert.ok(release>0&&update>release,"manifest must follow publication");
 assert.match(workflow,/environment: fastdev-signing/);
 assert.match(workflow,/github\.ref == 'refs\/heads\/main'/);
 assert.match(workflow,/scripts\/fastdev-manifest\.cjs/);
 assert.match(workflow,/repos\/LucianoToscano\/PokeSearch\/contents\/fastdev\/latest\.json/);
 assert.match(workflow,/sha="\$current_sha"/);
 assert.doesNotMatch(workflow,/POKE_TEST_KEYSTORE_B64/);
});

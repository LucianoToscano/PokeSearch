"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {spawnSync}=require("node:child_process");
const names=["FASTDEV_KEYSTORE_B64","POKE_FASTDEV_STORE_PASSWORD","POKE_FASTDEV_KEY_ALIAS","POKE_FASTDEV_KEY_PASSWORD","EXPECTED_FASTDEV_CERT"];
function run(values={}) {
 const env={...process.env};
 for(const name of names)delete env[name];
 const result=spawnSync("bash",["scripts/fastdev-signing-preflight.sh"],{
  env:{...env,...values},encoding:"utf8"
 });
 assert.ifError(result.error);
 return {status:result.status,output:result.stdout+result.stderr};
}
const configured=Object.fromEntries(names.map(name=>[name,"private-sentinel-value-never-log"]));
configured.EXPECTED_FASTDEV_CERT="a".repeat(64);
test("incomplete setup reports every missing configuration name, never a value",()=>{
 const missing=run();
 assert.equal(missing.status,1);
 for(const name of names)assert.ok(missing.output.includes(name));
 for(const name of names){
  const partial={...configured};delete partial[name];
  const result=run(partial);
  assert.equal(result.status,1);
  assert.ok(result.output.includes(name));
  assert.ok(!result.output.includes("private-sentinel-value-never-log"));
 }
});
test("complete dedicated configuration may proceed without exposing its contents",()=>{
 const result=run(configured);
 assert.equal(result.status,0);
 assert.ok(!result.output.includes("private-sentinel-value-never-log"));
 assert.ok(!result.output.includes(configured.EXPECTED_FASTDEV_CERT));
});
test("malformed or official certificate fails before compilation",()=>{
 for(const cert of ["not-a-certificate","a".repeat(63),"A".repeat(64),
  "34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e"]){
  const result=run({...configured,EXPECTED_FASTDEV_CERT:cert});
  assert.equal(result.status,1);
  assert.ok(!result.output.includes("private-sentinel-value-never-log"));
 }
});

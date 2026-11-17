"use strict";
// Publish the exact signed APK metadata as a tiny public, quota-free manifest.
// GitHub Actions runs only on trusted main and only after publishing the APK.
const fs=require("node:fs");
const crypto=require("node:crypto");
const path=require("node:path");
const ASSET="PokeSearch-FastDev-Preview.apk";
const RELEASES="https://github.com/LucianoToscano/PokeSearch/releases/download/fastdev-";
function build(apk,version,source){
 if(!Number.isSafeInteger(version)||version<=1_000_000||version>2147483647)
  throw Error("Invalid FastDev version code");
 if(typeof source!=="string"||!/^[0-9a-f]{40}$/.test(source))
  throw Error("Invalid source commit");
 const stat=fs.statSync(apk);
 if(!stat.isFile()||stat.size<10000||stat.size>180_000_000)
  throw Error("Invalid signed APK size");
 const hash=crypto.createHash("sha256").update(fs.readFileSync(apk)).digest("hex");
 return {schema:1,tag:"fastdev-"+version,version_code:version,
  apk:RELEASES+version+"/"+ASSET,sha256:hash,size:stat.size,source_commit:source};
}
if(require.main===module){
 try{
  const apk=process.argv[2],version=Number(process.argv[3]),source=process.argv[4];
  if(!apk||path.basename(apk)!==ASSET)throw Error("Unexpected APK name");
  process.stdout.write(JSON.stringify(build(apk,version,source),null,2)+"\n");
 }catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={build,ASSET};

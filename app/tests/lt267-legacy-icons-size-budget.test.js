"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const base=path.join(__dirname,"../src/main/assets/ui-icons");
const archived=path.join(__dirname,"../../docs/legacy-assets/lt266-types");
const names=fs.readdirSync(archived).filter(x=>/^type-[a-z]+-lt266\.png$/.test(x)).sort();
assert.equal(names.length,18,"18 historical originals remain in versioned source archive");
const workflow=fs.readFileSync(path.join(__dirname,"../../.github/workflows/pokesearch-official-release.yml"),"utf8");
let oldSize=0;
for(const name of names){
 assert.ok(!fs.existsSync(path.join(base,name)),"No unused old icon in new signed APK assets");
 const old=fs.readFileSync(path.join(archived,name));
 oldSize+=old.length;
 assert.equal(old.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
 assert.equal(old.readUInt32BE(16),1024);assert.equal(old.readUInt32BE(20),1024);
 assert.equal(old[25],6,"Original RGBA alpha retained");
 const sha=crypto.createHash("sha256").update(old).digest("hex");
 assert.ok(workflow.includes('"'+name+'": "'+sha+'"'),"Exact original SHA still pinned");
 const current=name.replace("-lt266.png","-lt267.png");
 assert.ok(fs.existsSync(path.join(base,current)),"Current revised art shipped");
}
assert.ok(workflow.includes('assert "assets/ui-icons/"+filename not in names'),"APK must not carry legacy duplicate");
assert.ok(workflow.includes('test "$(stat -c %s "$APK")" -lt 35000000'),
 "The original 35 MB size safety guard remains strict");
assert.ok(oldSize>5000000,"Measured multi-megabyte waste removed from shipping assets");
console.log("LT267 APK size PASS: archived 18 originals with exact SHA, removed "+oldSize+" unused bytes, 35MB guard intact");

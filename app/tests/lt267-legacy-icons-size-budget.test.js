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
assert.ok(workflow.includes("import sys,zipfile,hashlib,os"),"APK verifier imports OS for archive verification");
// LT330 adds 68 authenticated Edu 512px PNG masters (~10 MB) on top of
// LT328's 35 authenticated GO PNGs. Keep a strict but realistic 49 MB bound.
assert.ok(workflow.includes('test "$APK_BYTES" -lt 49000000'),
 "Release must retain a bounded 49 MB APK size gate for LT330");
assert.ok(workflow.includes('assert len(packed)==10372393'),
 "Release must verify the complete 68-frame Edu archive in the signed APK");
assert.ok(workflow.includes('assert len(extra)==35'),
 "Every new GO costume/form sprite must be included in release integrity audit");
assert.ok(workflow.includes('assert blob==expected_sha'),
 "Every supplemental PNG must match its immutable source Git blob");
assert.ok(workflow.includes('test "$ACTUAL" = "$POKE_RELEASE_CERT_SHA256"'),
 "Permanent Android signing fingerprint must still match");
assert.ok(oldSize>5000000,"Measured multi-megabyte waste removed from shipping assets");
const signedQa=fs.readFileSync(path.join(__dirname,"../../.github/workflows/lt146-signed-update-qa.yml"),"utf8");
assert.ok(signedQa.includes("LT267 QA: 18 transparent local types and exact pinned digests PASS"),
  "signed QA must validate local LT267 PNGs and pinned SHA256");
assert.ok(signedQa.includes("image.readUInt32BE(16)!==512"),
  "signed QA must reject wrong-size or missing LT267 PNGs");
assert.ok(!signedQa.includes("data:image/png;base64,iVBORw0KGgo"),
  "signed QA must not expect old inline Base64 icons");
console.log("LT267/LT328 APK size PASS: archived 18 originals, removed "+
 oldSize+" unused bytes, 49 MB LT330 guard and 35 pinned GO PNG validations intact");

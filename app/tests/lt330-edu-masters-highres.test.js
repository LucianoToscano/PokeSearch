"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const crypto=require("node:crypto");
const path=require("node:path");
const dir="app/src/main/assets";
const PREFIX="edu_avatar_masters_512_lt330.part";
const pieces=[];
for(let i=0;i<13;i++){
 const name=PREFIX+String(i).padStart(2,"0");
 const buf=fs.readFileSync(path.join(dir,name));
 assert.equal(buf.length,i===12?172393:850000,`parte ${i}`);
 pieces.push(buf);
}
const zip=Buffer.concat(pieces);
assert.equal(zip.length,10372393);
assert.equal(crypto.createHash("sha256").update(zip).digest("hex"),"f1957b7f6446d82ed9fdb9ace8b0b5d950dfc10f0709aa1618054a366791ac25");
const seen=new Set();
let cursor=0;
while(zip.readUInt32LE(cursor)===0x04034b50){
 const method=zip.readUInt16LE(cursor+8);
 const length=zip.readUInt32LE(cursor+18);
 const nameLength=zip.readUInt16LE(cursor+26);
 const extraLength=zip.readUInt16LE(cursor+28);
 const name=zip.subarray(cursor+30,cursor+30+nameLength).toString("utf8");
 assert.match(name,/^\d\d\.png$/);
 assert.equal(method,0,"PNG original nao pode sofrer recompressao lossy");
 assert.ok(!seen.has(name),"PNG duplicado");seen.add(name);
 const start=cursor+30+nameLength+extraLength;
 const png=zip.subarray(start,start+length);
 assert.equal(png.subarray(0,8).toString("hex"),"89504e470d0a1a0a",name);
 assert.equal(png.readUInt32BE(16),512,name+" largura");
 assert.equal(png.readUInt32BE(20),512,name+" altura");
 assert.equal(png[25],6,name+" RGBA esperado");
 if(name==="42.png")
  assert.equal(crypto.createHash("sha256").update(png).digest("hex"),"700968753c52d196145c3b9758ec426db744f91625576dad84d18d7f2b476b24");
 cursor=start+length;
}
assert.equal(seen.size,68);
for(let i=0;i<68;i++)assert.ok(seen.has(String(i).padStart(2,"0")+".png"));
const java=fs.readFileSync("app/src/main/java/com/lucianotoscano/pokesearchoverlay/EduSpriteAtlas.java","utf8");
const loader=fs.readFileSync("app/src/main/java/com/lucianotoscano/pokesearchoverlay/EduSpriteMasters.java","utf8");
assert.match(java,/EduSpriteMasters\.load\(context\)/);
assert.match(java,/masters\.frame\(i\)/);
assert.match(java,/displayCache\.put\(i,drawable\)/);
assert.match(loader,/MessageDigest\.getInstance\("SHA-256"\)/);
assert.match(loader,/new ZipFile\(destination\)/);
assert.match(java,/EduPixelArtUpscale\.scale4x/);
console.log("LT330 EDU PASS: 68 PNG RGBA 512, zip SHA, #42 canônica, fallback e cache");

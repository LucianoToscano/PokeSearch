"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const os=require("node:os");
const path=require("node:path");
const {catalog,generate}=require("../scripts/catalog-uicons-index");

test("indexes image names and subcategories without copying any image bytes",()=>{
  const result=catalog({pokemon:["25.png","25_1.png"],reward:{item:["1.png","2.webp"]},
    type:["0.png"],weather:["0.png"]});
  assert.equal(result.total,6);
  assert.equal(result.counts.pokemon,2);
  assert.equal(result.counts.reward,2);
  assert.equal(result.containsImageBytes,false);
  assert(result.entries.every(e=>e.assetRights==="review_required"));
  assert(result.entries.some(e=>e.path==="reward/item/2.webp"));
});
test("refuses path traversal or malformed index",()=>{
  assert.throws(()=>catalog({pokemon:["../secret.png"]}),/Unsafe/);
  assert.throws(()=>catalog({"../bad":["1.png"]}),/Unsafe/);
  assert.throws(()=>catalog({pokemon:[true]}),/Unsafe/);
  assert.throws(()=>catalog([]),/Expected/);
  assert.throws(()=>catalog({pokemon:["1.png","1.png"]}),/Duplicate/);
});
test("creates a bounded safe manifest once without changing source",()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),"uicons-"));
  try{
    const original=path.join(temp,"index.json"),target=path.join(temp,"manifest.json");
    fs.writeFileSync(original,JSON.stringify({pokemon:["25.png"],background:["1.png"]}));
    assert.equal(generate(original,target).total,2);
    const read=JSON.parse(fs.readFileSync(target,"utf8"));
    assert.equal(read.source,"WatWowMap/wwm-uicons");
    assert.match(read.inputSha256,/^[a-f0-9]{64}$/);
    assert.throws(()=>generate(original,target),/EEXIST/);
    assert.throws(()=>generate(original,original),/overwrite/);
    assert.equal(JSON.parse(fs.readFileSync(original,"utf8")).pokemon[0],"25.png");
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
});

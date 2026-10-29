"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const p=path.join(__dirname,"../src/main/assets/release_notes.json");
const notes=JSON.parse(fs.readFileSync(p,"utf8"));
assert.equal(notes.schema,"pokesearch-release-notes-v1");
assert.ok(Array.isArray(notes.releases)&&notes.releases.length>=14);
let prev=-1;const ids=new Set();
for(const item of notes.releases){
 assert.ok(Number.isInteger(item.minVersionCode)&&item.minVersionCode>prev,"histórico crescente");
 assert.ok(typeof item.id==="string"&&!ids.has(item.id),"IDs únicos");
 assert.ok(typeof item.title==="string"&&item.title.length>12);
 for(const section of ["novidades","melhorias","correcoes","emDesenvolvimento"])
  assert.ok(Array.isArray(item.sections?.[section]),section+" em "+item.id);
 ids.add(item.id);prev=item.minVersionCode;
}
for(const code of [54282,54283,54285,54286]){
 const n=notes.releases.find(n=>n.minVersionCode===code);
 assert.ok(n,"nota ausente "+code);
 assert.ok(n.title.includes("PokeSearch LT"),"título LT deve ser explícito");
}
const lt83=notes.releases.find(x=>x.minVersionCode===54286);
assert.ok(lt83.title.includes("LT83"));
assert.match(lt83.sections.emDesenvolvimento.join(" "),/pendente/i);
assert.ok(!/Samsung homologa[dn]o/i.test(lt83.sections.emDesenvolvimento.join(" ")));
const source=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/ReleaseNotes.java"),"utf8");
assert.ok(source.includes('OtaAssets.open(a,ASSET)'));
assert.ok(source.includes('item.optInt("minVersionCode",Integer.MAX_VALUE)<=code'));
console.log("LT83 release notes: "+notes.releases.length+" entries / 4 milestones / PASS");

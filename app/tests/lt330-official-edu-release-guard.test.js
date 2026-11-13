"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const workflow = fs.readFileSync(".github/workflows/pokesearch-official-release.yml","utf8");
const java = fs.readFileSync("app/src/main/java/com/lucianotoscano/pokesearchoverlay/EduSpriteMasters.java","utf8");
const request = JSON.parse(fs.readFileSync("release/official-request.json","utf8"));
// Não travar a versão pública em LT330: versões seguintes precisam poder
// publicar a mesma coleção protegida de 68 PNGs após atualizar o pedido.
assert.match(request.version,/^0\.\d{2}\.\d{2}$/);
assert.ok(Number.isInteger(request.code) && request.code>=54535,
  "Nao pode rebaixar a versionCode da colecao LT330");
assert.match(request.previous_tag,/^v0\.\d{2}\.\d{2}-\d+$/);
const previousCode=Number(request.previous_tag.split("-").at(-1));
assert.ok(request.code>previousCode,"Release precisa superar versao anterior");
const notes=JSON.parse(fs.readFileSync("app/src/main/assets/release_notes.json","utf8"));
assert.ok(notes.releases.some(x=>x.minVersionCode===request.code),
  "Release deve trazer notas embutidas para a versao solicitada");
assert.match(workflow,/test "\$APK_BYTES" -lt 49000000/);
assert.doesNotMatch(workflow,/test "\$APK_BYTES" -lt 37000000/);
assert.match(workflow,/assert len\(parts\)==13|for i in range\(13\):/);
assert.match(workflow,/assert len\(packed\)==10372393/);
assert.match(workflow,/assert sorted\(edu.namelist\(\)\)==expected_names/);
assert.match(workflow,/assert png\[16:24\]==bytes.fromhex\("0000020000000200"\)/);
assert.match(workflow,/f1957b7f6446d82ed9fdb9ace8b0b5d950dfc10f0709aa1618054a366791ac25/);
assert.match(workflow,/700968753c52d196145c3b9758ec426db744f91625576dad84d18d7f2b476b24/);
assert.match(java,/f1957b7f6446d82ed9fdb9ace8b0b5d950dfc10f0709aa1618054a366791ac25/);
console.log("Edu release guard PASS: 13 parts, 68 PNG 512, #42, signed APK budget and monotonic request");

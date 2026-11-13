"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const releases=JSON.parse(fs.readFileSync("app/src/main/assets/release_notes.json","utf8")).releases;
const note=releases.find(x=>x.minVersionCode===54536);
assert.ok(note,"LT331 precisa ter notas embarcadas para 54536");
assert.match(note.title,/0\.03\.30/);
const sections=note.sections;
for(const key of ["novidades","melhorias","correcoes","emDesenvolvimento"])assert.ok(Array.isArray(sections[key]),"Secao "+key);
const text=JSON.stringify(sections);
assert.match(text,/68 sprites/);
assert.match(text,/ainda necessita redesenho/,"Sem afirmar que artes já estão padronizadas");
assert.match(text,/P\/M\/G/);
// Notas LT331 são histórico imutável; não travar a rotação ativa nas versões futuras.
assert.ok(releases.some(x=>x.minVersionCode>54536),"Nova versão deve manter suas próprias notas");
console.log("LT331 notas e escopo PASS: 0.03.30 corrige idle sem prometer remasterização");

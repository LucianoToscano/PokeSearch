"use strict";
// LT337 ARK: prova estática de autorização documentada, versão monotônica e
// canal de release que realmente alimenta o atualizador instalado.
const assert=require("node:assert/strict"),fs=require("node:fs");
const read=p=>fs.readFileSync(p,"utf8");
const req=JSON.parse(read("release/official-request.json"));
const notes=JSON.parse(read("app/src/main/assets/release_notes.json"));
const main=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const updates=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/GitHubUpdateCenter.java");
const master=read("docs/GUIA_MESTRE.md");
const engine=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/PgsAutoClickService.java");
assert.equal(req.enabled,true);
assert.equal(req.version,"0.03.36");
assert.equal(req.code,54543);
assert.equal(req.label,51340);
assert.equal(req.previous_tag,"v0.03.35-54541");
assert.ok(req.code>req.qa_max_code);
assert.ok(req.qa_max_code>=54542);
assert.ok(notes.releases.some(x=>x.minVersionCode===req.code));
assert.ok(main.includes("GitHubUpdateCenter.schedule(this)"));
assert.ok(main.includes("GitHubUpdateCenter.check(this)"));
assert.ok(updates.includes("https://api.github.com/repos/LucianoToscano/PokeSearch/releases/latest"));
assert.ok(updates.includes("r.versionCode<=BuildConfig.VERSION_CODE"));
assert.ok(updates.includes("34766c15d09013ad65873f9976539c8fa2f826e917dae3af57ea628cad689e8e"));
assert.match(master,/ARK — CONTRATO OPERACIONAL RECONFIRMADO/);
assert.match(master,/sem solicitar uma segunda autorização/);
assert.match(engine,/private boolean running=false/);
console.log("LT337 ARK: release oficial, versionCode, OTA GitHub e opt-in OK");

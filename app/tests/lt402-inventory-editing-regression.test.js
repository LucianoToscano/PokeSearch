"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const root="app/src/main/assets/";
const html=fs.readFileSync(root+"personal_pokedex.html","utf8");
const ui=fs.readFileSync(root+"personal_pokedex.js","utf8");
const native=fs.readFileSync("app/src/main/java/com/lucianotoscano/pokesearchoverlay/PersonalPokedexActivity.java","utf8");
const data=fs.readFileSync("app/src/main/java/com/lucianotoscano/pokesearchoverlay/PokedexLocalEdits.java","utf8");
const css=fs.readFileSync(root+"personal_pokedex_lt402.css","utf8");
new vm.Script(ui);
assert.ok(css.length>100);
for(const id of ["add-pokemon","edit-panel","edit-pokemon","edit-save","edit-delete",
  "edit-nickname","edit-cp","edit-favorite","edit-bestBuddy","edit-buddyHearts",
  "edit-move1","edit-move2","edit-move3","edit-tags","selection-tag",
  "selection-tag-choice","selection-delete","undo-delete","delete-all",
  "tag-create","tag-editor-panel","backup-export","sync-source","sync-now",
  "sync-status"]){
  assert.match(html,new RegExp('id="'+id+'"'),"missing control "+id);
}
const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));
for(const m of ui.matchAll(/\bel\("([a-z0-9-]+)"\)/g))
  assert.ok(ids.has(m[1]),"JS references unknown control "+m[1]);
assert.match(ui,/pointerdown/);
assert.match(ui,/480\)/);
assert.match(ui,/runEdit\("delete"/);
assert.match(ui,/runEdit\("undo"/);
assert.match(ui,/runEdit\("tagAssign"/);
assert.match(ui,/state\.selectedIds\.size>3/);
assert.doesNotMatch(ui,/state\.selectedIds\.size<3/);
assert.match(native,/Intent\.ACTION_OPEN_DOCUMENT/);
assert.match(native,/takePersistableUriPermission/);
assert.match(native,/Intent\.ACTION_CREATE_DOCUMENT/);
assert.match(native,/PokedexLocalEdits\.replay/);
assert.match(native,/PokedexLocalEdits\.validateBackup/);
assert.match(native,/MessageDigest\.getInstance\("SHA-256"\)/);
assert.match(data,/static synchronized JSONObject replay/);
assert.match(data,/static synchronized String execute/);
assert.match(data,/static JSONObject validateBackup/);
assert.match(data,/getFilesDir\(\)/);
assert.match(data,/local\.put\("lastDelete",last\)/);
assert.match(data,/if\("undo"\.equals\(action\)\)/);
assert.match(data,/deleted\.remove\(key\)/);
assert.match(data,/if\(deleted\.has\(key\)\)continue/);
assert.match(data,/if\(patch!=null\)overlay\(row,patch\)/);
assert.match(data,/current\.put\("schema",1\)/);
assert.doesNotMatch(data,/HttpURLConnection|sendBeacon|INTERNET|ACCESS_ALL_FILES/);
assert.doesNotMatch(ui,/window\.fetch\(|XMLHttpRequest|sendBeacon/);
assert.match(ui,/!p\.costume&&!Number\(p\.form\)&&!form/);
const catalog=require("../src/main/assets/pokedex_sprite_catalog.js");
const manifest=JSON.parse(fs.readFileSync(root+"pokedex_sprite_manifest.json","utf8"));
const index=catalog.create(manifest);
const armored=index.classify({species:150,name:"Mewtwo",form:133,gender:3});
const ordinary=index.classify({species:150,name:"Mewtwo",form:135,gender:3});
assert.equal(armored.key,"a:pm150.fA.icon.png");
assert.equal(ordinary.key,"a:pm150.icon.png");
assert.equal(index.classify({species:150,name:"Mewtwo",form:999999}).key,null);
console.log("LT402: native private editing, restore, backup, SAF sync, bulk/tags and exact-form sprite guards OK.");

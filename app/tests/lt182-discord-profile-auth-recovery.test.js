"use strict";
// LT182: Discord OAuth may complete before the official React /profile
// page has rendered the Pokemon GO trainer cards. Never silently turn
// "not yet verified" into "no trainer linked" or close the dialog on a timer.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const main=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
const asset=fs.readFileSync(path.join(__dirname,"../src/main/assets/profile_summary.js"),"utf8");

assert.match(main,/private int profileCaptureRetryCount=0/);
assert.match(main,/profileCaptureRetryCount=0;\s*if\("\/profile"/);
assert.match(main,/if\(\+\+profileCaptureRetryCount<=16\)/);
assert.match(main,/if\(view==website&&loginAutoReturnQueued&&profileCaptureInProgress/);
assert.doesNotMatch(main,/loginDialog\.dismiss\(\);\s*\},6500L\)/);
assert.match(main,/"unknown"\.equals\(PogoAccountSlots\.prefs\(this,activeLoginSlot\)/);
assert.match(main,/"unlinked"\.equals\(two\.getString\("profileTrainerState","unknown"\)\)\?"Vincular"/);
assert.match(main,/Conta autorizada · vincule seu treinador no site/);
// No direct OAuth URLs, auto-confirmation of trainer links, or cross-account cookie merging.
assert.match(main,/PogoAccountSlots\.cookieManager\(activeLoginSlot\)/);
assert.match(main,/view\.loadUrl\("https:\/\/pogocoordinates\.com\/profile"\)/);

function node(value){
 return {innerText:value,textContent:value,getClientRects:()=>[{}],
   previousElementSibling:null,querySelectorAll:()=>[],getAttribute:()=>null};
}
function profile(body,parts){
 const document={body:{innerText:body},querySelectorAll:()=>parts.map(node)};
 return JSON.parse(vm.runInNewContext(asset,{document,
   location:{pathname:"/profile",origin:"https://pogocoordinates.com",href:"https://pogocoordinates.com/profile"},URL}));
}
const pending=profile("Linked accounts\nPokemon GO accounts",
 ["Pokemon GO accounts"]);
assert.equal(pending.ok,true);
assert.equal(pending.trainerState,"unknown");
assert.equal(pending.trainerCode,"");
const unlinked=profile("Linked accounts\nLogged in via Discord\nPokemon GO accounts 0/1\nLink my account",
 ["Pokemon GO accounts 0/1 Link my account"]);
assert.equal(unlinked.provider,"Discord");
assert.equal(unlinked.trainerState,"unlinked");
assert.equal(unlinked.trainers.length,0);
const linked=profile("Linked accounts\nLogged in via Discord\nPokemon GO accounts 1/1\nTestTrainer Mystic · Level 35 Trainer code 0000 0000 0000",
 ["Pokemon GO accounts 1/1","TestTrainer Mystic · Level 35 Trainer code 0000 0000 0000"]);
assert.equal(linked.provider,"Discord");
assert.equal(linked.trainerState,"linked");
assert.equal(linked.trainers.length,1);
console.log("LT182: Discord OAuth/profile hydration contracts passed");

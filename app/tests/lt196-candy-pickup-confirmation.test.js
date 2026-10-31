"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const base=path.join(__dirname,"../src/main");
const java=fs.readFileSync(path.join(base,"java/com/lucianotoscano/pokesearchoverlay/RareCandyOverlayService.java"),"utf8");
const policy=fs.readFileSync(path.join(base,"java/com/lucianotoscano/pokesearchoverlay/CandyCooldownPolicy.java"),"utf8");
const html=fs.readFileSync(path.join(base,"assets/rare_candy_controls.html"),"utf8");
function body(start,end) {
 const x=java.indexOf(start),y=java.indexOf(end,x+start.length);
 assert.ok(x>=0&&y>x,"missing function boundary "+start);
 return java.slice(x,y);
}
const confirm=body("    private void confirmCandyPicked(String point){","    private void copy(String point){");
const copy=body("    private void copy(String point){","    private void completeCopy(String point){");
const complete=body("    private void completeCopy(String point){","    private void render(){");
const onCreate=body("    @Override public void onCreate(){","    private void createBubble");
assert.match(onCreate,/prefs\.getString\("confirmedCandyHopCoords",""\)/);
assert.match(onCreate,/prefs\.getLong\("confirmedCandyHopAtMs",0L\)/);
assert.match(onCreate,/prefs\.getString\("lastCandyHopCoords",""\)/,
 "previous auto-start is migrated as an unconfirmed selection");
assert.match(onCreate,/remove\("lastCandyHopAtMs"\)/,
 "do not trust LT195 copy timestamp");
assert.match(copy,/CandyCooldownPolicy\.shouldWarnBeforeCopy\(/);
assert.match(copy,/showCandyConfirmation\("Cooldown estimado ativo"/);
assert.match(copy,/Copiar mesmo assim/);
assert.match(java,/setNegativeButton\("Cancelar"/);
assert.match(java,/TYPE_APPLICATION_OVERLAY/);
assert.match(copy,/completeCopy\(point\)/);
assert.ok(!copy.includes("setPrimaryClip("),"warning must occur before copying");
assert.match(complete,/setPrimaryClip\(/);
assert.match(complete,/selectedCandyCoords=point/);
assert.match(complete,/pendingCandyPickup=true/);
assert.doesNotMatch(complete,/lastCopiedCandyAtMs\s*=/,
 "copy must never start a cooldown");
assert.doesNotMatch(complete,/confirmedCandyHopAtMs/,
 "copy must never claim a confirmed collection");
assert.match(confirm,/!pendingCandyPickup/);
assert.match(confirm,/point\.equals\(selectedCandyCoords\)/);
assert.match(confirm,/mensagem de coleta do Doce Raro/);
assert.match(confirm,/lastCopiedCandyAtMs=System\.currentTimeMillis\(\)/);
assert.match(confirm,/putLong\("confirmedCandyHopAtMs",lastCopiedCandyAtMs\)/);
assert.match(confirm,/putBoolean\("pendingCandyPickup",false\)/);
assert.match(java,/Native/); // JavaScript bridge remains
assert.match(java,/public void confirmCandyPicked\(\)/);
assert.match(java,/collected\.setOnClickListener\(v->confirmCandyPicked\(card.coords\)\)/);
assert.match(java,/row\.setOnLongClickListener/);
assert.match(java,/image\.setOnLongClickListener/);
assert.match(html,/settings\.pendingCandyPickup/);
assert.match(html,/Native\.confirmCandyPicked\(\)/);
assert.match(html,/function confirmPickedCandy\(\)/);
assert.match(policy,/static boolean shouldWarnBeforeCopy\(/);
assert.match(java,/candyConfirmationDialog\.dismiss\(\)/);
assert.match(java,/confirmedCandyHopCoords/);
assert.match(java,/confirmedCandyHopAtMs/);
console.log("PASS LT196: copy-only, explicit Peguei pickup, confirmation and early-copy warning");

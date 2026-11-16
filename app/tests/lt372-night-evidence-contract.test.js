"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const base="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const read=f=>fs.readFileSync(base+f+".java","utf8");
const s=read("PgsAutoClickService"),m=read("PgsAutoMenus"),
 p=read("PgsNightSupervisorPolicy"),d=read("PgsNightSessionDiagnostics");
assert.match(s,/nightSession\.start\(SystemClock\.elapsedRealtime\(\),notifications\)/);
assert.match(s,/nightSession\.observe\(/);
assert.match(s,/nightSession\.stop\(/);
assert.match(s,/nightSupervisorSummary\(\)/);
assert.match(s,/stopNightSupervisor\(true,"Acessibilidade interrompida pelo Android\."\)/);
assert.match(p,/STOP_NOTIFICATIONS/);
assert.match(s,/Notificações do Android foram desativadas\./);
assert.match(m,/Caminhada externa/);
assert.match(m,/actions\.nightSupervisorSummary\(\)/);
for(const phrase of ["Caminhada externa: NÃO CONFIRMADA",
 "Tentativa de captura: NÃO OBSERVADA","Captura no jogo: NÃO CONFIRMADA",
 "entrega não comprovada"]){
 assert.ok(d.includes(phrase),phrase);
}
const section=s.split("private void startNightSupervisor()")[1]
 .split("private void refreshHuntProximity()")[0];
assert.doesNotMatch(section,/dispatchGesture|setMockLocation|forceStopPackage|\.tap\(|\.swipe\(/);
console.log("LT372 night evidence, notifications, accessibility, no capture inference PASS");

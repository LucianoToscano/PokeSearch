"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const base="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const get=n=>fs.readFileSync(base+n+".java","utf8");
const svc=get("PgsAutoClickService"),menu=get("PgsAutoMenus"),
  policy=get("PgsNightSupervisorPolicy"),diag=get("PgsNightSessionDiagnostics");

assert.match(svc,/nightDiagnostics\.start\(SystemClock\.elapsedRealtime\(\),userWalk,userPlus\)/);
assert.match(svc,/nightDiagnostics\.sampled\(SystemClock\.elapsedRealtime\(\),game,warning\)/);
assert.match(svc,/nightDiagnostics\.stop\(reason\)/);
assert.match(svc,/nightNotificationsAllowed\(\)/);
assert.match(svc,/case STOP_NOTIFICATIONS:/);
assert.match(svc,/@Override public void onInterrupt\(\) \{\s*stopNightSupervisor\(true/);
assert.match(svc,/nightSupervisorDiagnostics\(\)/);
assert.match(menu,/nightLastReportedActive&&!active/);
assert.match(menu,/appendNightModeToggle\(root\)/);
assert.match(menu,/diagnostic=label\(actions\.nightSupervisorDiagnostics\(\),9,false\)/);
assert.match(menu,/walk\.setEnabled\(!active\)/);
assert.match(menu,/plus\.setEnabled\(!active\)/);
assert.match(menu,/nightWalkAcknowledged=false;\s*nightCatchAcknowledged=false/);
assert.match(menu,/nightWalkAcknowledged,nightCatchAcknowledged\)/);
assert.match(policy,/STOP_NOTIFICATIONS/);
assert.match(policy,/if\(!notificationsOn\)return Decision\.STOP_NOTIFICATIONS/);
assert.match(diag,/Caminhada externa:/);
assert.match(diag,/Tentativa de captura: não observada/);
assert.match(diag,/Captura confirmada: nenhuma evidência/);
assert.match(diag,/boolean stale\(long nowMs,long intervalMs\)/);
assert.doesNotMatch(diag,/dispatchGesture|setMockLocation|forceStopPackage|catchCounter|captureCount/);
const segment=svc.split("private void startNightSupervisor(boolean userWalk,boolean userPlus)")[1]
 .split("private void refreshHuntProximity()")[0];
assert.ok(segment,"segmento supervisor presente");
assert.doesNotMatch(segment,/dispatchGesture|\.tap\(|\.swipe\(|forceStopPackage|setMockLocation|Runtime\.getRuntime/);
console.log("LT372 night diagnostics provenance, no fake captures, safe stop PASS");

"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const dir="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const service=fs.readFileSync(dir+"PgsAutoClickService.java","utf8");
const policy=fs.readFileSync(dir+"PgsAutoGestureEvidence.java","utf8");
const menu=fs.readFileSync(dir+"PgsAutoMenus.java","utf8");
const detector=fs.readFileSync(dir+"PgsAutoIconDetector.java","utf8");

// Same selected model ID, species, and approximate normalized location twice.
assert.match(service,/m\.id\.equals\(candidate\.id\)/);
assert.match(service,/m\.group\.equals\(candidate\.group\)/);
assert.match(service,/candidate\.x\s*\/\s*\(float\)width/);
assert.match(detector,/insideFeed\(/);
assert.match(detector,/Color\.alpha\(pixel\)<112/);
assert.match(menu,/actions\.previewSprites\(\)/);
const preview=service.slice(service.indexOf("private void preview(){"),
    service.indexOf("private void scanAndTap(){"));
assert.match(preview,/tapIndicator\.show\(/);
assert.doesNotMatch(preview,/dispatchGesture/);

// The touch effect is only the request marker; telemetry separates callbacks.
assert.match(service,/LT354 estágio GESTO_ACEITO_ANDROID/);
assert.match(service,/LT354 estágio GESTO_RECUSADO_ANDROID/);
assert.match(service,/LT354 estágio GESTO_CANCELADO_ANDROID/);
assert.match(service,/LT354 estágio GESTO_CONCLUIDO_ANDROID/);
assert.match(service,/LT354 estágio MUDANCA_VISUAL/);
assert.match(service,/LT354 estágio SEM_RESPOSTA_VISUAL/);
assert.match(service,/LT354 estágio SEM_RESPOSTA_JOGO/);
assert.match(service,/if\(!running\|\|ticket!=gestureTicket\|\|index!=nextIndex\)return/);
assert.match(service,/sceneBeforeGesture=beforeGesture/);
assert.match(service,/PgsAutoGestureEvidence\.canCountMapAsNew\(/);
assert.match(service,/PgsAutoGestureEvidence\.shouldStopForNoResponse\(/);
assert.match(policy,/return stable&&populated&&\(!spriteMode\|\|visualChange\)/);
assert.match(policy,/return spriteMode&&timedOut&&!visualChange/);

// No speculative success: still need physical verification for PGSharp.
assert.match(service,/NÃO prova teleporte nem clique no jogo/);
assert.match(service,/sem alteração visual antes do timeout; nenhuma nova sprite tocada/);
// Safety: the dialog can belong to the game window under our accessibility overlay.
const passenger=service.slice(service.indexOf("private boolean passengerPromptPresent(){"),
    service.indexOf("private boolean holdForPassengerPrompt(){"));
assert.match(passenger,/getWindows\(\)/);
assert.match(passenger,/TYPE_APPLICATION/);
assert.match(passenger,/containsPassengerLabel\(game,0\)/);
assert.doesNotMatch(passenger,/dispatchGesture/);
console.log("LT354: stages, no-click preview, stale callbacks, overlay safety and evidence PASS");

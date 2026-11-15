"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs");
const base="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const service=fs.readFileSync(base+"PgsAutoClickService.java","utf8");
const home=fs.readFileSync(base+"MainActivity.java","utf8");
const states=fs.readFileSync(base+"PgsAutoWatchUiPolicy.java","utf8");
const host=fs.readFileSync(base+"PgsAutoHostPolicy.java","utf8");
assert.match(states,/PERMISSION="permission"/);
assert.match(states,/NO_MODEL="no_model"/);
assert.match(states,/FOUND="found"/);
assert.match(states,/OBSERVING="observing"/);
assert.match(states,/PAUSED="paused"/);
assert.match(states,/OFF="off"/);
assert.match(service,/public static String monitorHomeState\(Context context\)/);
assert.match(service,/PgsAutoWatchUiPolicy\.resolve\(/);
assert.match(service,/stopWatchOnly\(false\);\s*stopSequence\("PARADO"\);\s*halt\("PARADO"\)/,
    "destroy should invalidate captures but preserve explicit opt-in for reconnect");
assert.doesNotMatch(service,/\.contains\("pgsharp"\)/,
    "no unrelated foreground package may pretend to be the game");
assert.match(service,/return PgsAutoHostPolicy\.isGameWindow\(pkg\);/);
assert.match(home,/homeWatchStatus=homeText\(/);
assert.match(home,/PgsAutoClickService\.monitorHomeState\(this\)/);
assert.match(home,/PgsAutoWatchUiPolicy\.label\(watchState\)/);
assert.match(home,/setContentDescription\("Monitor de favoritos sem clique/);
assert.match(service,/private void scanWatchOnly\(\)/);
const block=service.slice(service.indexOf("private void setWatchOnly(boolean enabled)"),
    service.indexOf("/** Segure o botão para localizar os ícones"));
assert.doesNotMatch(block,/\b(dispatchGesture|scanAndTap|tap)\s*\(/,
    "passive watcher still has zero gesture calls");
assert.match(host,/SAMSUNG_GAME_PACKAGE="com\.nianticlabs\.pokemongo\.ares"/);
console.log("LT362 home status, exact foreground and no-gesture contract PASS");

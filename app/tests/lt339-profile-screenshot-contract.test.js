"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict"),path=require("node:path");
const main=fs.readFileSync(path.join(__dirname,
 "../src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
const policy=fs.readFileSync(path.join(__dirname,
 "../src/main/java/com/lucianotoscano/pokesearchoverlay/ProfileScreenshotPolicy.java"),"utf8");
assert.doesNotMatch(main,/\.addFlags\([^;]*FLAG_SECURE/);
assert.match(main,/loginWindow\.clearFlags\(android\.view\.WindowManager\.LayoutParams\.FLAG_SECURE\)/);
assert.match(main,/private void allowLoginScreenshots\(\)/);
assert.match(main,/if\(view==website\)allowLoginScreenshots\(\)/);
assert.match(policy,/return true;/);
assert.doesNotMatch(policy,/"manage"\.equals\(purpose\)/);
console.log("LT343 screenshots: diálogo login e Perfil liberados PASS");

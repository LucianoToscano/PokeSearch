"use strict";
// Teste estrutural LT339: print somente na página de Perfil PoGoCoordinates.
const fs=require("node:fs");
const path=require("node:path");
const assert=require("node:assert/strict");

const main=fs.readFileSync(path.join(__dirname,
    "../src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
const policy=fs.readFileSync(path.join(__dirname,
    "../src/main/java/com/lucianotoscano/pokesearchoverlay/ProfileScreenshotPolicy.java"),"utf8");
assert.match(main,/loginDialog\.getWindow\(\)\.addFlags\(android\.view\.WindowManager\.LayoutParams\.FLAG_SECURE\)/);
assert.match(main,/loginWindow\.addFlags\(android\.view\.WindowManager\.LayoutParams\.FLAG_SECURE\)/);
assert.match(main,/ProfileScreenshotPolicy\.allowsScreenshot\(/);
assert.match(main,/if\(allow\)window\.clearFlags\(android\.view\.WindowManager\.LayoutParams\.FLAG_SECURE\)/);
assert.match(main,/else window\.addFlags\(android\.view\.WindowManager\.LayoutParams\.FLAG_SECURE\)/);
assert.match(main,/onPageStarted[\s\S]*?updateLoginScreenshotProtection\(url,false\)/);
assert.match(main,/onPageFinished[\s\S]*?updateLoginScreenshotProtection\(url,url!=null&&url\.equals\(view\.getUrl\(\)\)\)/);
assert.match(main,/doUpdateVisitedHistory\(WebView view,String url,boolean isReload\)/);
assert.match(main,/loginProfilePageLoadFailed=true/);
assert.match(main,/loginPurpose="manage"\.equals\(purpose\)\?"manage":"login"/);
assert.match(main,/"https:\/\/pogocoordinates\.com\/profile":"https:\/\/pogocoordinates\.com\/search"/);
assert.match(policy,/"https"\.equalsIgnoreCase\(uri\.getScheme\(\)\)/);
assert.match(policy,/"pogocoordinates\.com"\.equals\(host\.toLowerCase\(Locale\.ROOT\)\)/);
assert.match(policy,/"\/profile"\.equals\(uri\.getPath\(\)\)/);
assert.match(policy,/"manage"\.equals\(purpose\)/);
assert.match(policy,/loadedSuccessfully/);
console.log("LT339 perfil: política de screenshot e OAuth protegido PASS");

"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const main=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
// LT404: OAuth may finish in a React SPA without a second onPageFinished.
assert.match(main,/onProgressChanged\(WebView view,int progress\)/);
assert.match(main,/doUpdateVisitedHistory\(WebView view,String url,boolean isReload\)/);
assert.match(main,/loginRecoveryProbeGeneration==loginPageGeneration/);
assert.match(main,/loginRecoveryProbeGeneration!=loginPageGeneration/);
assert.match(main,/checkLoginSession\(view,18,generation\)/);
// A first-party /profile read must also be allowed after observed OAuth.
const start=main.indexOf('if("não confirmado".equals(auth)&&!profileDiscoveryAttempted&&');
const end=main.indexOf('if("login".equals(loginPurpose)&&attemptsLeft<=23',start);
assert.ok(start>0&&end>start);
const discovery=main.slice(start,end);
assert.doesNotMatch(discovery,/observedLoginProvider\.isEmpty\(\)&&/);
assert.match(discovery,/view\.loadUrl\("https:\/\/pogocoordinates\.com\/profile"\)/);
assert.match(discovery,/"login"\.equals\(loginPurpose\)/);
// The actual authenticated state still comes from the first-party probe.
assert.match(main,/if\("autenticada"\.equals\(auth\)\)/);
assert.match(main,/loginPageGeneration!=pageGeneration/);
console.log("LT404 OAuth session hydration contracts: OK");

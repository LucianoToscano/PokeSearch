"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const home=fs.readFileSync(path.join(__dirname,
"../src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
const slots=fs.readFileSync(path.join(__dirname,
"../src/main/java/com/lucianotoscano/pokesearchoverlay/PogoAccountSlots.java"),"utf8");
const login=fs.readFileSync(path.join(__dirname,"../src/main/assets/login_entry.js"),"utf8");
const policy=fs.readFileSync(path.join(__dirname,
"../src/main/java/com/lucianotoscano/pokesearchoverlay/ProfileScreenshotPolicy.java"),"utf8");
const auto=fs.readFileSync(path.join(__dirname,
"../src/main/java/com/lucianotoscano/pokesearchoverlay/PgsAutoClickService.java"),"utf8");
// O app não cria janelas seguras que impeçam print de sua própria UI.
assert.doesNotMatch(home,/\.addFlags\([^\n;]*FLAG_SECURE/);
assert.match(home,/loginWindow\.clearFlags\(android\.view\.WindowManager\.LayoutParams\.FLAG_SECURE\)/);
assert.match(home,/private void allowLoginScreenshots\(\)/);
assert.match(policy,/return true;/);
// Badge de login: selecionar Conta 1/2 é ação real, não lista apenas informativa.
assert.match(home,/private void showCompactAccountNames\(View anchor,boolean secondary\)/);
assert.match(home,/for\(int slot=1;slot<=2;slot\+\+\)/);
assert.match(home,/popupHolder\[0\]\.dismiss\(\)/);
assert.match(home,/PogoAccountSlots\.bindAccountOnly\(this,secondary,account\)/);
assert.match(home,/preferredLoginProvider="";/);
assert.match(slots,/WebViewCompat\.setProfile\(web,NAME_2\)/);
assert.match(slots,/if\(!supportsSecond\(\)\)throw/);
// Sem cliques sintéticos em provedores externos. Erro oficial não fica mascarado.
assert.match(login,/if\(authDialog\|\|providerChoices\)\{/);
assert.doesNotMatch(login,/__psProviderClicked/);
assert.match(home,/startedWebsite\.postDelayed/);
assert.match(home,/loginCover\.setVisibility\(View\.GONE\)/);
assert.match(home,/Abrir PoGoCoordinates no navegador do aparelho/);
assert.match(home,/não será importada automaticamente/);
// Avisos de segurança do jogo exigem leitura local e declaração manual.
assert.match(auto,/normalized\.contains\("sou passageiro"\)/);
assert.match(auto,/normalized\.contains\("estou seguro"\)/);
assert.match(auto,/normalized\.contains\("i am safe"\)/);
assert.match(auto,/status\("CONFIRME MANUALMENTE"\)/);
assert.doesNotMatch(auto,/performAction\(AccessibilityNodeInfo\.ACTION_CLICK\)/);
console.log("LT343 screenshots, Conta 1/2, OAuth explícito e avisos manuais: PASS");

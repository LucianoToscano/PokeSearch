"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const source=path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay");
const main=fs.readFileSync(path.join(source,"MainActivity.java"),"utf8");
const api=fs.readFileSync(path.join(source,"PremiumAccess.java"),"utf8");
const modal=main.slice(main.indexOf("private void showPremiumAccountOptions()"),main.indexOf("void promptPremiumDeviceTransfer("));
assert.ok(main.includes("private static String premiumValidityDetails("));
for(const text of ["licenseSource","licenseKind","serverNow","expiresAt","Tempo restante: ","Válida até: ","Validade: sem vencimento","Teste grátis","Cupom 100%","Premium pago"]){
 assert.ok(main.includes(text),"Missing validity detail: "+text);
}
assert.ok(modal.includes("premiumValidityDetails(state)"));
assert.ok(modal.includes("String validity=error!=null?"));
assert.ok(api.includes('call(context,"premiumSessionInfo",payload,callback)'));
assert.ok(modal.includes('body.addView(signOut'));
assert.ok(modal.includes('body.addView(change'));
assert.ok(modal.includes('body.addView(transfer'));
console.log("PASS LT140: owner-only Premium validity, trial, lifetime, remaining days and logout intact");

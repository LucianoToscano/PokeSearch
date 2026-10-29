"use strict";
// Regression: after Discord consent, PokeSearch must not obscure the
// official callback, navigate away from it too early, or fake a login.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const main=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
const between=(start,end)=>main.split(start)[1]?.split(end)[0]||"";
const onPageStart=between("@Override public void onPageStarted(WebView view,String url,android.graphics.Bitmap icon){","@Override public void onPageFinished(WebView view,String url){");
const check=between("private void checkLoginSession(WebView view,int attemptsLeft,int pageGeneration){","private void captureOfficialProfile(WebView view,int generation){");
const onFinish=between("@Override public void onPageFinished(WebView view,String url){","@Override public void onReceivedError(WebView view,");

assert.match(onPageStart,/observedLoginProvider="Discord"/);
assert.match(onPageStart,/loginSessionNotified=false/);
assert.match(onPageStart,/boolean returningFromProvider=site&&!observedLoginProvider.isEmpty\(\)/);
assert.match(onPageStart,/loginCover.setVisibility\(site&&!returningFromProvider\?/);
assert.doesNotMatch(onPageStart,/loginCover.setVisibility\(site\?View.VISIBLE:View.GONE\)/);
// The profile may only be requested after confirmed authentication, or during
// initial discovery before any external provider was visited.
const premature=check.split('if("não confirmado".equals(auth)')[1]?.split("if(!\"manage\".equals(loginPurpose)",1)[0]||"";
assert.match(premature,/observedLoginProvider.isEmpty\(\)/);
assert.match(premature,/profileDiscoveryAttempted=true/);
assert.match(check,/observedLoginProvider.isEmpty\(\)&&\s*!loginDiscoveryStarted/);
assert.match(check,/if\("manage".equals\(loginPurpose\)\)\{/);
assert.match(check,/profileCaptureInProgress=true/);
assert.match(check,/captureOfficialProfile\(view,pageGeneration\)/);
assert.match(onFinish,/if\(!loginSessionNotified\)checkLoginSession\(view,14,generation\)/);
assert.match(main,/onReceivedHttpError\(WebView view,/);
assert.match(main,/request.isForMainFrame\(\)/);
assert.match(main,/BugReport.log\(MainActivity.this,"AUTH"/);
assert.doesNotMatch(onFinish,/getUrl\(\).*BugReport\.log/);
// Retain independent account cookie selection and official destination.
assert.match(main,/PogoAccountSlots.attach\(website,activeLoginSlot\)/);
assert.match(main,/CookieManager slotCookies=PogoAccountSlots.cookieManager\(activeLoginSlot\)/);
assert.match(main,/view.loadUrl\("https:\/\/pogocoordinates\.com\/profile"\)/);
assert.doesNotMatch(main,/https:\/\/discord\.com\/api\/oauth2/);
console.log("LT183: callback visibility, management OAuth, privacy and session isolation contracts passed");

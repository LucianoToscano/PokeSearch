"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"../..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const service=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const home=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const dock=read("app/src/main/assets/dock.html");
const transport=read("app/src/main/assets/api_browser_transport.js");
const official=read(".github/workflows/pokesearch-official-release.yml");
const gradle=read("app/build.gradle.kts");

test("P1/P2 share a guest-safe ordinary search and preserve the independent slot",()=>{
 assert.match(service,/PogoAccountSlots\.assigned\(this,isSecondaryOverlay\(\)\)/);
 assert.match(service,/guestPublicSearch=!shiny&&\s*!PogoAccountSlots\.loggedIn\(this,searchSlot\)/);
 assert.match(service,/if\(authorizedApiQaSelected\(\)&&!guestPublicSearch\)/);
 assert.match(service,/execute\("session",session->continueVerifiedSearchSession\(generation,manual,session,0\)\)/);
 assert.match(service,/Visitante · conferindo busca pública/);
});
test("Guest cannot bypass a provider rate limit or silently emulate API-only inverse sort",()=>{
 assert.match(service,/if\(authorizedApiQaSelected\(\)&&apiProviderBackoffUntil\(\)>0L\)/);
 assert.match(service,/if\(!authorizedApiQaSelected\(\)\|\|guestPublicSearch\)/);
 assert.match(service,/Ordenação inversa exige API/);
});
test("Guest-safe API transport never requires JWT for an ordinary public search",()=>{
 assert.match(transport,/request\("POST",SEARCH_URL,proposed\.payload,"optional",10000\)/);
 assert.match(service,/if\(shiny\|\|config\.optBoolean\("backgroundOnly",false\)\)/);
});
test("! and every empty state can receive a tap and report its current status",()=>{
 assert.match(dock,/<button id="empty"[^>]*onclick="Native\.showStatus\(\)"/);
 const css=dock.match(/body\.result-window #empty\{box-sizing:border-box!important;[^}]+\}/);
 assert.ok(css,"compact counter style exists");
 assert.match(css[0],/pointer-events:auto!important/);
 assert.doesNotMatch(css[0],/pointer-events:none!important/);
 assert.match(dock,/empty\.setAttribute\("aria-label",activeSearchPhase==="error"/);
 assert.match(service,/void showStatus\(\)/);
 assert.match(service,/lastError/);
 assert.match(service,/setTitle\("Aviso da Pokébola "/);
 assert.match(service,/setNeutralButton\("Reportar problema"/);
});
test("A main-frame network failure produces a meaningful diagnostic instead of a misleading 0",()=>{
 assert.match(service,/onReceivedError\(WebView view,WebResourceRequest request,WebResourceError error\)/);
 assert.match(service,/searchFailure\("⚠ Sem conexão com PoGoCoordinates"/);
});
test("Home has no PokeSearch logo and retains profile and provider icons beside donation",()=>{
 assert.doesNotMatch(home,/brand\.setImageResource\(R\.drawable\.ps_home_brand_transparent\)/);
 assert.doesNotMatch(home,/branding\.addView\(/);
 const heart=home.indexOf("heart.setOnClickListener(v->PixSupport.show(this))");
 const profile=home.indexOf("controls.addView(homeLoginProfileShortcut");
 const pogo=home.indexOf("controls.addView(homePogoCoordinatesShortcut");
 assert.ok(heart>=0&&heart<profile&&profile<pogo);
 for(const asset of ["login_modo_claro.webp","login_modo_escuro.webp","login_modo_semlogin.webp","home_pogocoordinates_off.webp","home_pogocoordinates_on.webp"])
  assert.ok(fs.existsSync(path.join(root,"app/src/main/res/drawable-nodpi",asset)),asset);
 assert.match(home,/if\(PremiumAccess\.controlled\(\)\)menu\.setOnLongClickListener/);
});
test("only the official PokeSearch release remains distributable",()=>{
 assert.match(official,/environment: official-updates/);
 assert.match(official,/POKE_RELEASE_CERT_SHA256/);
 assert.ok(gradle.includes('applicationId = "com.lucianotoscano.pokesearch"'));
 assert.doesNotMatch(gradle,/create\("preview"\)|FASTDEV_PREVIEW|POKE_FASTDEV/);
 assert.ok(!fs.existsSync(path.join(root,".github/workflows/pokesearch-fastdev.yml")));
 assert.ok(!fs.existsSync(path.join(root,"fastdev/latest.json")));
});

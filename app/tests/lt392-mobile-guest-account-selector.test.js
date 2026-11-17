"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..","src","main");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const home=read("java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const service=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const slots=read("java/com/lucianotoscano/pokesearchoverlay/PogoAccountSlots.java");
const probe=read("assets/probe.js");

test("LT392: remove visible badges and overlay hotspots, keep two independent Pokébola controls",()=>{
 assert.doesNotMatch(home,/loginHotspot|pokeballLoginBadges/);
 assert.match(home,/shell\.addView\(icon,new FrameLayout\.LayoutParams\(-1,d\(44\),Gravity\.BOTTOM\)\)/);
 assert.match(home,/if\(which==0\)toggleHomeOverlay\(\);else toggleSecondaryOverlay\(\)/);
});
test("LT392: P1/P2 bindings live inside the existing PoGoCoordinates login menu",()=>{
 const menu=home.split("private void showPogoAccountHub(){")[1].split("private String pogoAccountSummary(int slot){")[0];
 assert.match(menu,/for\(int ball=0;ball<2;ball\+\+\)/);
 assert.match(menu,/for\(int slot=1;slot<=2;slot\+\+\)/);
 assert.match(menu,/R\.drawable\.home_pokeball_off/);
 assert.match(menu,/bindPokeballToAccount\(secondary,target\)/);
 assert.match(menu,/PogoAccountSlots\.loggedIn\(this,slot\)\?" conectada":" sem login"/);
 assert.doesNotMatch(menu,/Conta: Visitante|Continuar como visitante/);
 assert.match(home,/PogoAccountSlots\.bindAccountOnly\(this,secondary,account\)/);
 assert.match(home,/if\(!PogoAccountSlots\.loggedIn\(this,slot\)\)return "Sem login"/);
 assert.match(slots,/slot==2\?"pogo_account_2":"prefs"/);
 assert.match(slots,/WebViewCompat\.setProfile\(web,NAME_2\)/);
});
test("LT392: mobile card extraction does not require the literal LOCATION label",()=>{
 const part=probe.split("function cardRoots(){")[1].split("function visibleResultSignature(){")[0];
 assert.match(part,/hasEncounterMeta/);
 assert.match(part,/hasCp/);
 assert.match(part,/dexLabels\.length<=1/);
 assert.doesNotMatch(part,/if\(!\/\\bLOCATION\\b\/i\.test\(t\)\)/);
 assert.match(probe,/verifiedCardIv\(x\)/);
 assert.match(service,/Filtro divergente no site/);
 assert.match(service,/IVs foram lidos/);
});

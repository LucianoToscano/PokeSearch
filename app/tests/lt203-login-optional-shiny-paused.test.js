"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../src/main");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const flags=read("java/com/lucianotoscano/pokesearchoverlay/ProviderFeatureFlags.java");
const main=read("java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const service=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const slots=read("java/com/lucianotoscano/pokesearchoverlay/PogoAccountSlots.java");
const dock=read("assets/dock.html");
const contract=require("../src/main/assets/api_result_contract.js");
const session=read("assets/api_android_session.js");
let count=0;
function check(name,fn){fn();count++;console.log("PASS LT203 "+name);}
check("Upstream Shiny disabled without deleting the future source implementation",()=>{
 assert.match(flags,/static final boolean SHINY_AVAILABLE = false;/);
 assert.match(flags,/TRAINER_SELECTION_AVAILABLE = SHINY_AVAILABLE/);
 assert.match(service,/if\(!ProviderFeatureFlags\.SHINY_AVAILABLE\)/);
 assert.match(service,/shiny=ProviderFeatureFlags\.SHINY_AVAILABLE&&/);
 assert.match(service,/config\.put\("shiny",ProviderFeatureFlags\.SHINY_AVAILABLE&&shiny\)/);
 assert.match(service,/shiny=!shiny;/);
});
check("An old Shiny=ON cannot stop the next normal search",()=>{
 assert.match(service,/overlayPrefs\(\)\.edit\(\)\.putBoolean\("shiny",false\)\.apply\(\)/);
 assert.match(service,/Shiny temporariamente indisponível · busca normal liberada/);
 assert.match(dock,/const PROVIDER_SHINY_AVAILABLE=false;/);
 assert.match(dock,/case "sh":return !PROVIDER_SHINY_AVAILABLE\?"Indisp\."/);
 assert.match(dock,/upstreamUnavailable/);
});
check("Guest and authenticated filters share the same non-Shiny search contract",()=>{
 const cfg={mode:"raw",attack:15,defense:15,stamina:15,shiny:false};
 const guest=contract.buildPayload(cfg);
 const logged=contract.buildPayload({...cfg,authToken:"untrusted_dummy_token"});
 assert.equal(guest.ok,true);
 assert.equal(logged.ok,true);
 assert.deepEqual(logged.payload,guest.payload);
 assert.equal(guest.payload.shiny_only,false);
 assert.equal(guest.payload.shiny_account,null);
 assert.equal(contract.normalizeResponse({tier:"non_logged_in",cap:5,results:[]},{nowMs:Date.now()}).displayCap,5);
 assert.equal(contract.normalizeResponse({tier:"logged_in",cap:10,results:[]},{nowMs:Date.now()}).displayCap,10);
 assert.match(session,/requestedShiny:filters\.shiny===true/);
});
check("Home hides unavailable trainer sections without erasing saved profiles",()=>{
 assert.match(main,/if\(trainerPanel!=null\)trainerPanel\.setVisibility\(/);
 assert.match(main,/ProviderFeatureFlags\.TRAINER_SELECTION_AVAILABLE&&logged/);
 assert.match(main,/secondTrainerPanel\.setVisibility\(View\.GONE\)/);
 assert.match(main,/Busca normal com ou sem login · Shiny temporariamente indisponível/);
 assert.ok(!main.includes("prefs.edit().remove(\"profileTrainerList\")"));
 assert.match(main,/PogoAccountSlots\.bindAccountOnly\(this,secondary,slot\)/);
});
check("P1 and P2 can independently select accounts, including separate guest profile",()=>{
 assert.match(slots,/static void bindAccountOnly\(Context context,boolean secondary,int account\)/);
 assert.match(slots,/if\(account==2&&!supportsSecond\(\)\)/);
 assert.match(slots,/\.putInt\(secondary\?"pogoOverlayAccount2":"pogoOverlayAccount1",account\)\.apply\(\)/);
 const only=slots.slice(slots.indexOf("static void bindAccountOnly"),slots.indexOf("static boolean loggedIn"));
 assert.ok(!only.includes("trainerSetting("));
 assert.ok(!only.includes("loggedIn("));
 assert.match(main,/PogoAccountSlots\.supportsSecond\(\)\?"Visitante":"Indisponível"/);
 assert.match(main,/ProviderFeatureFlags\.TRAINER_SELECTION_AVAILABLE&&/);
});
console.log("LT203 "+count+"/"+count+" PASS");

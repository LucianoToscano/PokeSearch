"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"../src/main");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const service=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const second=read("java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java");
const main=read("java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const manifest=read("AndroidManifest.xml");
let count=0;
function check(name,cb){cb();count++;console.log("PASS DUAL-OVERLAY "+name);}
check("second service uses the original collector without duplicating source",()=>{
 assert.match(second,/extends OverlayService/);
 assert.match(second,/isSecondaryOverlay\(\)\{return true;\}/);
 assert.match(manifest,/<service android:name="\.SecondaryOverlayService" android:exported="false"/);
});
check("two separate native services and notifications, one application",()=>{
 assert.match(service,/isSecondaryOverlay\(\)\?74:73/);
 assert.match(service,/private static volatile boolean secondaryRunning=false/);
 assert.match(service,/isSecondaryRunning\(\)/);
 assert.match(service,/getSharedPreferences\(isSecondaryOverlay\(\)\?"prefs_secondary":"prefs",0\)/);
 // Explicit primary prefs are allowed ONLY for intentionally global
 // Favorite profiles/diagnostics, never for per-Pokeball filters/state.
 const globalReferences=(service.match(/getSharedPreferences\("prefs",0\)/g)||[]).length;
 assert.ok(globalReferences<=2);
 assert.match(service,/overlayPrefs\(\)\.edit\(\)/);
});
check("default independent filters are explicitly 100 and 0 percent in raw IV",()=>{
 assert.match(service,/private String mode="raw"/);
 assert.match(service,/pref.getInt\("rawAttack",15\)/);
 for(const key of ["rawAttack","rawDefense","rawStamina"])
  assert.ok(main.includes('.putInt("'+key+'",0)') || main.includes('"'+key+'",0)'));
 assert.match(main,/editor.putString\("mode","raw"\)/);
 assert.match(main,/secondaryInitializedV1/);
 assert.match(main,/if\(secondary.getBoolean\("secondaryInitializedV1",false\)\)return/);
});
check("new Home control enables each instance separately",()=>{
 assert.match(main,/secondaryOverlayControl\.setOnClickListener\(v->toggleSecondaryOverlay\(\)\)/);
 assert.match(main,/new Intent\(this,SecondaryOverlayService.class\)/);
 assert.match(main,/OverlayService.isSecondaryRunning\(\)/);
 assert.match(main,/stopService\(new Intent\(this,SecondaryOverlayService.class\)\)/);
});
check("login remains shared and logout stops both before clearing cookies",()=>{
 assert.match(main,/sendActionToRunningOverlay\(OverlayService.class,action,authConfirmed\)/);
 assert.match(main,/sendActionToRunningOverlay\(SecondaryOverlayService.class,action,authConfirmed\)/);
 const logout=main.split("private void logoutLocalSession(){")[1].split("private void ",1)[0];
 assert.match(logout,/stopService\(new Intent\(this,OverlayService.class\)\)/);
 assert.match(logout,/stopService\(new Intent\(this,SecondaryOverlayService.class\)\)/);
 assert.match(logout,/removeAllCookies/);
 assert.match(service,/CookieManager.getInstance\(\)\.setAcceptCookie\(true\)/);
});
check("two positions, two result lists, no forced colored labels",()=>{
 assert.match(service,/isSecondaryOverlay\(\)\?12:oldDefaultX/);
 assert.match(service,/isSecondaryOverlay\(\)\?220:120/);
 assert.match(service,/isSecondaryOverlay\(\)\?260:165/);
 assert.match(service,/private String mode="raw",results="\[\]"/);
 assert.ok(!second.includes("setColorFilter"));
 assert.ok(!second.includes("pokeball"));
});
check("closing one service does not mark both offline",()=>{
 assert.match(service,/if\(isSecondaryOverlay\(\)\)secondaryRunning=false/);
 assert.match(service,/if\(!running&&!secondaryRunning\)\{/);
 assert.match(service,/FirebaseStats.setOverlayVisible\(this,false\)/);
});
console.log("DUAL-OVERLAY "+count+"/"+count+" PASS");

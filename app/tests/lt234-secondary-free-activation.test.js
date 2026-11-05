"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"../..",p),"utf8");
const main=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const overlay=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const access=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/PremiumAccess.java");
const section=(text,from,to)=>{
 const start=text.indexOf(from),end=text.indexOf(to,start+from.length);
 assert.ok(start>=0&&end>start,"Missing method boundaries: "+from);
 return text.slice(start,end);
};
const toggle=section(main,"private void toggleSecondaryOverlay(){","private void logoutPremiumAccount(");
const start=section(main,"private void startSecondaryOverlayAuthorized(){","private void refreshHomeOverlay(){");
const logout=section(main,"private void logoutPremiumAccount(","/** Account detail uses");
const resume=section(main,"@Override protected void onResume(){","@Override protected void onPause(){");
const result=section(main,"@Override protected void onActivityResult(","private void requestOverlayNotificationPermission(){");
const create=section(overlay,"@Override public void onCreate(){","wm=(WindowManager)getSystemService(WINDOW_SERVICE);");
let passed=0;
function test(name,run){run();passed++;console.log("PASS LT234 "+name);}
test("P1 and P2 retain separate service launch and toggle",()=>{
 assert.match(main,/if\(which==0\)toggleHomeOverlay\(\);else toggleSecondaryOverlay\(\)/);
 assert.match(toggle,/if\(OverlayService\.isSecondaryRunning\(\)\)/);
 assert.match(toggle,/stopService\(new Intent\(this,SecondaryOverlayService\.class\)\)/);
 assert.match(toggle,/startSecondaryOverlayAuthorized\(\);/);
 assert.match(start,/new Intent\(this,SecondaryOverlayService\.class\)/);
 assert.match(start,/initializeSecondaryFilterDefaults\(\)/);
 assert.match(start,/PogoAccountSlots\.cookieManager\(PogoAccountSlots\.assigned\(this,true\)\)\.flush\(\)/);
 assert.match(overlay,/getSharedPreferences\(isSecondaryOverlay\(\)\?"prefs_secondary":"prefs",0\)/);
});
test("P2 activation has no VIP, Google sign-in or payment gate",()=>{
 for(const banned of [/PremiumAccess\./,/PremiumGoogleLogin\./,/PremiumPurchaseDialog\./,/promptPremiumDeviceTransfer\(/]){
  assert.doesNotMatch(toggle,banned);
  assert.doesNotMatch(start,banned);
 }
 assert.match(main,/"Ativar Pokébola 2"/);
 assert.doesNotMatch(main,/"Pokébola 2 Premium - requer licença"/);
 assert.match(access,/static synchronized boolean permitted\(boolean secondary\)\{\s*\/\/ LT234:[^\n]*\n[^\n]*\n\s*return true;/);
 assert.doesNotMatch(create,/PremiumAccess\./);
});
test("P1 and P2 obey the same application maintenance policy",()=>{
 assert.match(toggle,/AppAvailability\.isAllowed\(this\)/);
 assert.match(start,/AppAvailability\.isAllowed\(this\)/);
 assert.match(create,/if\(!AppAvailability\.isAllowed\(this\)\)\{stopSelf\(\);return;\}/);
 assert.match(overlay,/AppAvailability\.refresh\(OverlayService\.this,state->/);
 assert.doesNotMatch(overlay,/PremiumAccess\.permitted\(/);
 assert.doesNotMatch(overlay,/PremiumAccess\.verify\(/);
});
test("Premium logout and Home resume never close P2 due to license status",()=>{
 assert.doesNotMatch(logout,/stopService\(new Intent\(this,SecondaryOverlayService\.class\)\)/);
 assert.doesNotMatch(resume,/PremiumAccess\.verify\(/);
 assert.match(resume,/applyAppAvailability\(AppAvailability\.cached\(this\)\)/);
 assert.match(resume,/refreshHomeOverlay\(\)/);
});
test("first-time Android overlay permission resumes requested Pokeball",()=>{
 assert.match(start,/getPackageName\(\)\)\,103\);/);
 assert.match(result,/if\(req==101&&Settings\.canDrawOverlays\(this\)\)startOverlay\(\);/);
 assert.match(result,/if\(req==103&&Settings\.canDrawOverlays\(this\)\)startSecondaryOverlayAuthorized\(\);/);
});
console.log("LT234 secondary activation: "+passed+" contract groups PASS");

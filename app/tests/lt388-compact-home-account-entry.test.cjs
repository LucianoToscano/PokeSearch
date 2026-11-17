"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const main=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
test("LT388 PoGo header opens account chooser, not implicit slot 1 login",()=>{
 assert.match(main,/homePogoCoordinatesShortcut\.setOnClickListener\(v->showPogoAccountHub\(\)\)/);
 assert.match(main,/private void showPogoAccountActions\(int slot\)/);
 assert.match(main,/addHomeDrawerItem\(drawer,"◉","Conta 1 · Login \/ Perfil"/);
 assert.match(main,/addHomeDrawerItem\(drawer,"◉","Conta 2 · Login \/ Perfil"/);
});
test("LT388 no large duplicate account panels consume Home space",()=>{
 assert.match(main,/screen\.addView\(auth,new LinearLayout\.LayoutParams\(-1,-2\)\);\s*\/\/ LT388:[\s\S]*?auth\.setVisibility\(View\.GONE\)/);
 assert.match(main,/screen\.addView\(secondAccount,secondLp\);[\s\S]*?secondAccount\.setVisibility\(View\.GONE\)/);
});
test("LT388 separate login sessions and manual profile sync still exist",()=>{
 assert.match(main,/private void openLoginDialogForSlot\(int slot,String purpose\)/);
 assert.match(main,/PogoAccountSlots\.supportsSecond\(\)/);
 assert.match(main,/PogoAccountSlots\.prefs\(this,activeLoginSlot\)/);
 assert.match(main,/captureOfficialProfile\(WebView view,int generation\)/);
 assert.match(main,/openLoginDialogForSlot\(2,"sync"\)/);
});

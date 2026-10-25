"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../src/main");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const main=read("java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const second=read("java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java");
const overlay=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const manifest=read("AndroidManifest.xml");
let pass=0;const test=(name,fn)=>{fn();pass++;console.log("PASS LT111 "+name);};
test("secondary enable row in Home is GONE, not INVISIBLE or occupying height",()=>{
 const start=main.indexOf("LinearLayout dualOverlayRow=new LinearLayout(this)");
 const end=main.indexOf("// HOME-02:",start);
 assert.ok(start>=0&&end>start);
 const row=main.slice(start,end);
 assert.ok(row.includes("dualOverlayRow.setVisibility(View.GONE);"));
 assert.ok(row.indexOf("dualOverlayRow.setVisibility(View.GONE);")<row.indexOf("screen.addView(dualOverlayRow,dualLp);"));
 assert.ok(!row.includes("setVisibility(View.INVISIBLE)"));
});
test("primary Pokeball switch remains in Home and is not hidden",()=>{
 assert.match(main,/overlayControl\.setOnClickListener\(v->toggleHomeOverlay\(\)\)/);
 assert.match(main,/private void toggleHomeOverlay\(\)/);
 assert.match(main,/startOverlay\(\)/);
});
test("secondary service and 0 percent configuration remain present, no preference deletion",()=>{
 assert.match(second,/extends OverlayService/);
 assert.match(main,/private void toggleSecondaryOverlay\(\)/);
 assert.match(main,/getSharedPreferences\("prefs_secondary",0\)/);
 assert.match(main,/\.putInt\("rawAttack",0\)\.putInt\("rawDefense",0\)\.putInt\("rawStamina",0\)/);
 assert.match(manifest,/<service android:name="\.SecondaryOverlayService" android:exported="false"/);
 assert.match(overlay,/getSharedPreferences\(isSecondaryOverlay\(\)\?"prefs_secondary":"prefs",0\)/);
});
test("Home hides rather than stopping second service, and refresh stays safe",()=>{
 const start=main.indexOf("private FrameLayout buildHome(");
 const end=main.indexOf("private void toggleSecondaryOverlay(");
 assert.ok(main.includes("if(secondaryOverlayControl!=null){"));
 assert.ok(main.includes("stopService(new Intent(this,SecondaryOverlayService.class))"));
 const hideContext=main.slice(main.indexOf("dualOverlayRow.setVisibility(View.GONE);")-120,main.indexOf("dualOverlayRow.setVisibility(View.GONE);")+100);
 assert.ok(!hideContext.includes("stopService("));
 assert.ok(!hideContext.includes('getSharedPreferences("prefs_secondary"'));
});
console.log("LT111 hidden second Pokeball "+pass+"/"+pass+" PASS");

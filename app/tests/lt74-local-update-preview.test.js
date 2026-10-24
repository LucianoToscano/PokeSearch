"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const src=path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay");
const main=fs.readFileSync(path.join(src,"MainActivity.java"),"utf8");
const update=fs.readFileSync(path.join(src,"UpdateCenter.java"),"utf8");
const contract=fs.readFileSync(path.join(__dirname,"lt72-drive-update-center.test.js"),"utf8");
let passed=0;
function check(label,run){run();passed++;console.log("PASS LT74 "+label);}
const has=(...terms)=>terms.forEach(t=>assert.ok(main.includes(t),"missing: "+t));

check("mock UI requires explicit opt-in in debug only",()=>{
  has("if(BuildConfig.DEBUG){","footer.setOnLongClickListener(v->{",
      "private static final String UPDATE_PREVIEW_ENABLED",
      "final boolean preview=BuildConfig.DEBUG && getSharedPreferences");
  assert.ok(!update.includes("homeUpdatePreviewEnabled"));
});
check("footer gesture toggles state and resets only preview dismissal",()=>{
  has('boolean enabled=!prefs.getBoolean(UPDATE_PREVIEW_ENABLED,false);',
      ".putBoolean(UPDATE_PREVIEW_DISMISSED,false).apply();",
      "renderDriveUpdateBanner();");
});
check("dismissal persists through prefs and independently hides demo",()=>{
  has('else if(getSharedPreferences("prefs",0).getBoolean(UPDATE_PREVIEW_DISMISSED,false))',
      ".putBoolean(UPDATE_PREVIEW_DISMISSED,true).apply();",
      "else UpdateCenter.dismiss(this,info.versionCode);");
});
check("remote eligibility is unchanged outside preview",()=>{
  has("if(!preview){","if(!UpdateCenter.isEligible(this,info)){",
      'UpdateCenter.check(this);',
      "else UpdateCenter.openDownload(this,info);");
  assert.ok(!update.includes("simulação"));
});
check("mock is unmistakably a demo, does not invent public release",()=>{
  has('"Atualização de teste"','"v0.00.75 · SIMULAÇÃO"',
      '"Teste local: sem downloads e sem anúncios públicos."');
});
check("download mock never starts browser or downloads APK",()=>{
  has('if(preview) android.widget.Toast.makeText(this,',
      '"Teste: botão acionado. Nenhum APK foi baixado."',
      'else UpdateCenter.openDownload(this,info);');
  assert.ok(!main.includes("PackageInstaller"));
});
check("Home card theme and 30dp footer remain intact",()=>{
  has("boolean light=homeLightMode;","light?Color.argb(240,248,252,255):Color.argb(233,24,35,49)",
      "screen.addView(footer,new LinearLayout.LayoutParams(-1,d(30)));",
      '"PokeSearch v"+BuildConfig.VERSION_NAME+" LT  •  PoGoCoordinates /search"');
});
check("real manifest and Drive endpoint remain unchanged",()=>{
  assert.ok(contract.includes("remote manifest points only to approved public Drive config"));
  assert.ok(update.includes('private static final String MANIFEST_ID="15IrWg9FpiNteZcsmUSBtyfd4v2Hmcbrf"'));
  assert.ok(update.includes('private static final String SCHEMA="pokesearch-update-v1"'));
});
console.log("LT74 local preview contract: "+passed+"/"+passed+" PASS");

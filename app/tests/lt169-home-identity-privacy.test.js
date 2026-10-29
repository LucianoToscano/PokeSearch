"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const src=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");

// UI remains in the existing Home drawer > Preferências; no new entry.
assert.match(src,/addHomeDrawerItem\(drawer,"⚙","Preferências",this::showPreferencesDialog\)/);
const prefs=src.slice(src.indexOf("private ScrollView buildPreferences()"),
  src.indexOf("private void settingAlertMode("));
assert.match(prefs,/Privacidade na Home/);
const keys=["homeShowPogoAccountName","homeShowTrainerName","homeShowTrainerCode"];
for(const key of keys){
  assert.match(prefs,new RegExp('settingHomePrivacyCheckbox\\(body,prefs,"'+key+'"'));
}
assert.match(prefs,/check\.setChecked\(prefs\.getBoolean\(key,true\)\)/);
assert.match(prefs,/prefs\.edit\(\)\.putBoolean\(key,enabled\)\.apply\(\)/);
assert.match(prefs,/refreshSessionSummary\(\);/);
assert.match(prefs,/homeLightMode\?Color\.rgb/);
assert.match(prefs,/Somente nesta Home/);

// Each toggle masks only its on-screen field without changing true values.
const render=src.slice(src.indexOf("private void refreshSessionSummary()"),
  src.indexOf("private void askLogout()"));
assert.match(render,/prefs\.getBoolean\("homeShowPogoAccountName",true\)\?/);
assert.match(render,/prefs\.getString\("profileDisplayName","Conta conectada"\):"Anônimo"/);
assert.match(render,/prefs\.getBoolean\("homeShowTrainerName",true\)\?trainer:"Anônimo"/);
assert.match(render,/prefs\.getBoolean\("homeShowTrainerCode",true\)\?/);
assert.match(render,/"XXXX XXXX XXXX"/);
assert.match(render,/code\.substring\(0,4\)\+" "\+code\.substring\(4,8\)\+" "\+code\.substring\(8\)/);
assert.match(render,/boolean linked=logged/);
assert.match(render,/trainerSelectButton\.setVisibility\(linked&&profiles>1\?View\.VISIBLE:View\.GONE\)/);

// Full original trainer code must remain in storage and be copyable as before.
const copy=src.slice(src.indexOf("private void copyTrainerCode()"),
  src.indexOf("private void showHomeTransparencyDialog()"));
assert.match(copy,/getString\("profileTrainerCode",""\)/);
assert.match(copy,/ClipData\.newPlainText\("Código de treinador",code\)/);
const privacy=prefs.slice(prefs.indexOf("private void settingHomePrivacyCheckbox("));
for(const sensitive of ["profileTrainerCode","profileTrainerName","profileDisplayName",
  "profileSelectedTrainerCode","profileTrainerList"]){
  assert.doesNotMatch(privacy,new RegExp('put(?:String|Boolean)\\("'+sensitive+'"'));
}
// Export/import remain whitelisted; no account fields and no accidental sync.
const backup=src.slice(src.indexOf("private void exportHomeData()"),
  src.indexOf("private void toggleHomeOverlay()"));
for(const key of keys)assert.doesNotMatch(backup,new RegExp('"'+key+'"'));
console.log("LT169: Home privacy flags independent, defaults shown, masking only UI, original trainer data intact PASS");

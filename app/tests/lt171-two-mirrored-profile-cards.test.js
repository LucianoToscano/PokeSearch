"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const main=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
const slots=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/PogoAccountSlots.java"),"utf8");
const card=main.slice(main.indexOf("// Second PoGoCoordinates session with a separate persistent Chromium profile."),
 main.indexOf("// LT72: a zero-height",main.indexOf("// Second PoGoCoordinates session")));
const refresh=main.slice(main.indexOf("private void refreshSecondAccountSummary()"),main.indexOf("private void showPokeballAccountChoice("));
const selector=main.slice(main.indexOf("private void showAccountTrainerSelector("),main.indexOf("private void openLoginDialogForSlot(",main.indexOf("private void showAccountTrainerSelector(")));
assert.ok(card.length>6000,"second card has full equivalent hierarchy");
for(const key of ["secondAccountSummary","secondAccountProvider","secondAvatar","secondAvatarFrame",
 "secondTrainerHeading","secondTrainerSelectButton","secondTeamBadge","secondTrainerDisplay",
 "secondTrainerDetails","secondTrainerCode","secondTrainerAction","secondAccountLogout",
 "secondAccountGuest","secondAccountConnected","secondAccountUnavailable"]){
 assert.ok(card.includes(key),"Conta 2 must render "+key);
 if(!["secondAccountLogout","secondAvatar","secondAccountUnavailable"].includes(key))
  assert.ok(refresh.includes(key),"Conta 2 must refresh "+key);
}
for(const tag of ["Código de Treinador","Copiar código do treinador","Treinador vinculado",
 "Sair site","Google","Discord","Gerenciar","Remover"])
 assert.ok(main.includes(tag),tag);
assert.match(refresh,/showCode\?code\.substring\(0,4\)/);
assert.match(refresh,/XXXX XXXX XXXX/);
assert.match(refresh,/showTrainer\?trainer:"Anônimo"/);
assert.match(refresh,/showName\?account:"Anônimo"/);
assert.match(refresh,/count>1\?View\.VISIBLE:View\.GONE/);
assert.match(refresh,/secondAccountGuest\.setVisibility\(connected\|\|!available/);
assert.match(refresh,/label\.setText\(\(secondary\?"P2":"P1"\)\+" · Conta "\+slot\)/);
assert.match(refresh,/secondTrainerPanel\.setVisibility\(View\.GONE\)/);
assert.match(selector,/SharedPreferences prefs=PogoAccountSlots\.prefs\(this,account\)/);
assert.match(selector,/String selected=prefs\.getString\("profileTrainerCode",""\)/);
assert.match(selector,/if\(valid\.size\(\)<2\)return/);
assert.match(selector,/prefs\.edit\(\)\.putString\("profileTrainerCode",code\)/);
assert.ok(!selector.includes("PogoAccountSlots.bind("),"Account 2 header switch must not overwrite P1/P2 choices");
assert.match(main,/PogoAccountSlots\.bind\(this,secondary,account,selection\[which\]\)/);
assert.match(slots,/secondary\?"pogoOverlayTrainer2":"pogoOverlayTrainer1"/);
assert.match(slots,/secondary\?"pogoOverlayAccount2":"pogoOverlayAccount1"/);
assert.match(main,/private void copyTrainerCodeForAccount\(int slot\)/);
assert.match(main,/PogoAccountSlots\.prefs\(this,slot\)\.getString\("profileTrainerCode",""\)/);
assert.match(main,/private void openTrainerManagementForAccount\(int slot\)/);
assert.match(main,/openLoginDialogForSlot\(slot,"manage"\)/);
assert.match(main,/private void refreshSecondGoogleAvatar\(String url\)/);
assert.match(main,/PogoAccountSlots\.prefs\(this,2\)/);
assert.match(main,/PogoAccountSlots\.supportsSecond\(\)/);
console.log("LT171 second full profile card, privacy, VIP two trainer selector and independent Pokeballs PASS");

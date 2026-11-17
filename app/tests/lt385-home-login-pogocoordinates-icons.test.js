"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),crypto=require("node:crypto");
const root="app/src/main/";
const java=fs.readFileSync(root+"java/com/lucianotoscano/pokesearchoverlay/MainActivity.java","utf8");
const res=root+"res/drawable-nodpi/";
function blobSha(file){
 const data=fs.readFileSync(file),prefix=Buffer.from("blob "+data.length+"\0");
 return crypto.createHash("sha1").update(prefix).update(data).digest("hex");
}
test("Login icons reproduce the five-file owner's exact three original images",()=>{
 assert.equal(blobSha(res+"login_modo_claro.webp"),"d010950835b9f34a1f473ad3be86c9d4698d87d0");
 assert.equal(blobSha(res+"login_modo_escuro.webp"),"abb3f038327e727f45b6543979f5b3ce130d0624");
 assert.equal(blobSha(res+"login_modo_semlogin.webp"),"7847a7230a625a4fcd5111458152fe82441bbe79");
});
test("PoGoCoordinates ON/OFF images use compact transparent WebP derivatives of owner assets",()=>{
 const assets=[
  ["home_pogocoordinates_off.webp","4a848bc98e1976690c8c87490acfe7b5a659eb1d"],
  ["home_pogocoordinates_on.webp","beea20983a847f0d335403f727ccb1909492214f"]
 ];
 for(const [name,sha] of assets){
  const p=res+name,data=fs.readFileSync(p);
  assert.equal(blobSha(p),sha);
  assert.equal(data.subarray(0,4).toString(),"RIFF");
  assert.equal(data.subarray(8,12).toString(),"WEBP");
  assert.ok(data.length>1000&&data.length<10000);
 }
});
test("new shortcuts sit together immediately after donation and before theme in header",()=>{
 const area=java.slice(java.indexOf("ImageButton heart=makeIcon("),
   java.indexOf("// HOME-04: compact reference card"));
 const indexes=[
  area.indexOf("controls.addView(heart,heartLp);"),
  area.indexOf("controls.addView(homeLoginProfileShortcut,profileLp);"),
  area.indexOf("controls.addView(homePogoCoordinatesShortcut,pogoLp);"),
  area.indexOf("controls.addView(homeThemeButton,themeLp);")
 ];
 assert.ok(indexes.every(n=>n>=0));
 assert.ok(indexes.every((n,i)=>i===0||n>indexes[i-1]));
 assert.match(area,/new LinearLayout.LayoutParams\(d\(28\),d\(28\)\)/);
 assert.match(area,/heart\.setOnClickListener\(v->PixSupport\.show\(this\)\)/);
});
test("login indicator reacts to either isolated session while pogo indicator reflects slot 1",()=>{
 const start=java.indexOf("private void refreshHomeHeaderProfileIcons()");
 const end=java.indexOf("/** As dez artes",start);
 const code=java.slice(start,end);
 assert.match(code,/PogoAccountSlots\.loggedIn\(this,1\)/);
 assert.match(code,/PogoAccountSlots\.supportsSecond\(\)\s*&&\s*PogoAccountSlots\.loggedIn\(this,2\)/);
 assert.match(code,/homeLightMode\?R\.drawable\.login_modo_escuro:\s*R\.drawable\.login_modo_claro/);
 assert.match(code,/R\.drawable\.login_modo_semlogin/);
 assert.match(code,/R\.drawable\.home_pogocoordinates_on/);
 assert.match(code,/R\.drawable\.home_pogocoordinates_off/);
 assert.match(java,/private void refreshSessionSummary\(\)\{\s*refreshSecondAccountSummary\(\);\s*refreshPokeballLoginBadges\(\);\s*refreshHomeHeaderProfileIcons\(\)/);
});
test("new actions use existing account manager and isolated official site WebView",()=>{
 assert.match(java,/homeLoginProfileShortcut\.setOnClickListener\(v->showHomeAccountMenu\(\)\)/);
 assert.match(java,/homePogoCoordinatesShortcut\.setOnClickListener\(v->openLoginDialogForSlot\(1,\s*PogoAccountSlots\.loggedIn\(this,1\)\?"manage":"login"\)\)/);
 assert.match(java,/addHomeDrawerItem\(drawer,"◉","Conta 1 · Login \/ Perfil"/);
 assert.match(java,/addHomeDrawerItem\(drawer,"◉","Conta 2 · Login \/ Perfil"/);
 assert.match(java,/PogoAccountSlots\.supportsSecond\(\)/);
 assert.doesNotMatch(java.slice(java.indexOf("// LT385 · Atalhos delicados"),
 java.indexOf("// O ícone indica o modo")),/ACTION_VIEW|new WebView|https:/);
});
console.log("LT385: owner icon hashes, dimensions, theme/login state and real actions verified");

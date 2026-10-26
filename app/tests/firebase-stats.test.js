"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const main=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const overlay=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const firebase=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/FirebaseStats.java");
const dock=read("app/src/main/assets/dock.html");
const rules=JSON.parse(read("firebase-realtime.rules.json")).rules;
let tested=0;function test(name,fn){fn();++tested;console.log("PASS LT54 "+name)}
test("Firebase uses isolated named app and anonymous auth",()=>{
 assert.match(firebase,/FirebaseApp\.initializeApp/);
 assert.match(firebase,/PokeSearchStats/);
 assert.match(firebase,/signInAnonymously\(\)/);
 assert.doesNotMatch(firebase,/CookieManager|trainerCode|locationRadius/);
});
test("Home and overlay both maintain activity",()=>{
 assert.match(main,/FirebaseStats\.setHomeVisible\(this,true\)/);
 assert.match(main,/FirebaseStats\.setHomeVisible\(this,false\)/);
 assert.match(overlay,/FirebaseStats\.setOverlayVisible\(this,true\)/);
 assert.match(overlay,/FirebaseStats\.setOverlayVisible\(this,false\)/);
 assert.match(firebase,/onDisconnect\(\)\.removeValue/);
});
test("Counters do not invent numbers when offline",()=>{
 assert.match(firebase,/onlineCount=-1,installCount=-1/);
 assert.doesNotMatch(firebase,/getChildrenCount\(\)/);
 assert.match(firebase,/child\("public"\)\.child\("installCount"\)/);
 assert.match(firebase,/child\("public"\)\.child\("onlineCount"\)/);
});
test("Home transparency affects panels, never artwork",()=>{
 assert.match(main,/homePanelsTransparency/);
 assert.match(main,/refreshHomeSurfaceOpacity/);
 assert.match(main,/pageBackground\.setAlpha\(1f\)/);
 assert.doesNotMatch(main,/homeBackgroundImage\.setAlpha/);
});
test("Avatar has circular contour and photo cropping",()=>{
 assert.match(main,/avatarShell\.setClipToOutline\(true\)/);
 assert.match(main,/homeAvatarOutline/);
 assert.doesNotMatch(main,/accountAvatarFrame\.setImageResource\(homeUserFrame/);
});
test("Floating menu retains color-coded glyphs",()=>{
 for(const hex of ["#111821","#ffd674","#fa94a7","#ff596c"])
   assert.ok(dock.includes(hex),hex);
});
test("Backend defaults deny all unlisted actions",()=>{
 assert.equal(rules[".read"],false);
 assert.equal(rules[".write"],false);
 assert.match(rules.stats.installations["$uid"][".write"],/auth\.uid === \$uid/);
 assert.match(rules.stats.online["$uid"][".write"],/auth\.uid === \$uid/);
 assert.match(rules.stats.installations["$uid"][".write"],/!data\.exists\(\)/);
});
console.log(tested+" LT54 stat regression checks passed");

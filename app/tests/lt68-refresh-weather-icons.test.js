"use strict";
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),assert=require("node:assert/strict"),vm=require("node:vm");
const base=path.join(__dirname,"../src/main");
const dock=fs.readFileSync(path.join(base,"assets/dock.html"),"utf8");
const native=fs.readFileSync(path.join(base,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const oldDir=path.join(base,"assets/weather-icons"),newDir=path.join(oldDir,"v2");
const originals=["any","boosted","sunny","rainy","partly-cloudy","cloudy","windy","snow","fog"];
const hashes={
 "any-white":"27fc2d64a48aa75de1b1962f54cff84f384f5bfb","any-black":"62e740e1c375fc9a3b8d5ffad49303236ab00deb",
 "boosted-white":"cb15e709f8f293baee439137fbcdeaf5516ac1c7","boosted-black":"4aeae40f2759d050b44b99902673201d24bb484e",
 "sunny-white":"454a449525062e3aed5478ab0df3a0e6886b9908","sunny-black":"5ec58552a40d5eb297b8c760dfee2b98b05c18b4",
 "rainy-white":"8d5396ebc32d63e9463393a4ca08f026988b006a","rainy-black":"9fef396bee7e95aaad72d31cb1752c22f5867d27",
 "partly-cloudy-white":"c2d4cb3696c8646405b9e31bdbbdf042b963c1fe","partly-cloudy-black":"2f27941277c3f6cd2bad0064583cf3ad128555bf",
 "cloudy-white":"69f36c965f1c48d2d1601320cd067fe881633558","cloudy-black":"51cd2171c077e7b744cc5f8278d27dc5abd45689",
 "windy-white":"05322566496186f3bbc91bb246efbc20693f934e","windy-black":"b9f454fac465c7bac8a158de91a16d27839764a3",
 "snow-white":"0a5d9b501aa8ddeaede3de2dc8449e43e621a4ae","snow-black":"f76e41e846eda28b3055ae7a95874124a5031736",
 "fog-white":"c6d7b5ff86c8175572f2042793b751b54945aecd","fog-black":"50702fdb299afd17e5e49c88854a0771e7b65428"
};
let pass=0,fail=0;
function check(title,run){try{run();console.log("PASS LT68 "+title);pass++}catch(e){console.error("FAIL LT68 "+title,e.message);fail++}}
check("1 native no longer rejects hidden Atualizar",()=>{assert.ok(native.includes('"period","appearance","report","donate","close"'));assert.ok(!native.includes('!"period".equals(id)'));assert.ok(native.includes('if(valid.contains(id)&&seen.add(id)'))});
check("2 JS normalization persists period hidden and protects key controls",()=>{const p=dock.split("function normalizedQuickPrefs(p){")[1].split("function saveQuickPrefs(){")[0];assert.ok(p.includes('!["close","appearance","sh"].includes(x)'));assert.ok(!p.includes('!["close","appearance","period","sh"]'));});
check("3 checkbox for Atualizar can toggle with accessibility",()=>{const s=dock.split("function renderAppearanceChoices(){")[1].split('document.addEventListener("pointerdown"',1)[0];assert.ok(s.includes('const locked=false;'));assert.ok(s.includes('eye.disabled=locked;'));assert.ok(s.includes('eye.setAttribute("aria-pressed",String(!hidden))'));assert.ok(s.includes('saveQuickPrefs();renderAppearanceChoices()'));});
check("4 checkbox toggles without touching auto-refresh interval",()=>{const s=dock.split("function renderAppearanceChoices(){")[1].split('document.addEventListener("pointerdown"',1)[0];assert.ok(s.includes('quickPrefs.hidden=hidden?quickPrefs.hidden.filter(x=>x!==id):[...quickPrefs.hidden,id]'));assert.ok(!s.includes("Native.setRefreshPeriod"));assert.ok(dock.includes('period===0?"":period+"m"'));});
check("5 exactly nine canonical weather filter keys",()=>{const values=dock.split("const WEATHER_THEME_FILES=Object.freeze({")[1].split("});",1)[0];for(const v of ["Any","Boosted","Sunny","Rainy","Partly Cloudy","Cloudy","Windy","Snow","Fog"])assert.ok(values.includes('"'+v+'"'));assert.equal((values.match(/:/g)||[]).length,9)});
check("6 all 18 complete original Drive PNGs checked by Git blob SHA",()=>{assert.equal(Object.keys(hashes).length,18);for(const [name,sha] of Object.entries(hashes)){const p=path.join(newDir,name+".png");assert.ok(fs.existsSync(p),p);const b=fs.readFileSync(p);assert.ok(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),name);const gitsha=crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");assert.equal(gitsha,sha,name)}});
check("7 legacy nine PNGs are still present",()=>{for(const n of originals)assert.ok(fs.existsSync(path.join(oldDir,n+".png")),n)});
check("8 weather white and black paired without CSS transforms",()=>{assert.ok(dock.includes('weatherChoicePair'));assert.ok(dock.includes('for(const variant of ["white","black"])'));assert.ok(dock.includes('weatherChoice-'+ 'black'));assert.ok(dock.includes('body.controls-window.visual-light-menu #choices .weatherChoicePair .weatherChoice-black'));assert.ok(!dock.includes('filter:invert(1)!important'))});
check("9 live theme does not require closing the weather filter",()=>{assert.ok(dock.includes('body.controls-window.visual-light-menu #choices .weatherChoicePair .weatherChoice-white'));assert.ok(dock.includes('body.controls-window.visual-light-menu #choices .weatherChoicePair .weatherChoice-black'));assert.ok(dock.includes('display:none!important;'));assert.ok(dock.includes('display:block!important;'))});
check("10 weather preserves official site values and existing selection",()=>{assert.ok(dock.includes('FILTER_DISPLAY_LABELS=Object.freeze({'));assert.ok(dock.includes('modeDraft[key]=key==="weather"&&value==="Any"?"":value'));assert.ok(dock.includes('WEATHER_ICON_FILES=Object.freeze({'));assert.ok(dock.includes('btn.prepend(makeWeatherIcon(value))'))});
check("11 fallback on failed new icons uses unchanged original asset",()=>{assert.ok(dock.includes('img.onerror=()=>{img.onerror=null;img.src="file:///android_asset/weather-icons/"+fallback;}'));assert.ok(dock.includes('img.src="file:///android_asset/weather-icons/v2/"+stem+"-"+variant+".png"'))});
check("12 Javascript inline remains parseable",()=>{let count=0;for(const m of dock.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){new vm.Script(m[1],{filename:"dock:inline-"+(++count)})}assert.ok(count>0)});
console.log("LT68: "+pass+" PASS / "+fail+" FAIL");if(fail)process.exitCode=1;

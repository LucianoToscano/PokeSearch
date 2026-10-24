"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const dock=fs.readFileSync(path.join(root,"src/main/assets/dock.html"),"utf8");
const service=fs.readFileSync(path.join(root,"src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const editor=fs.readFileSync(path.join(root,"src/main/assets/visual_editor.js"),"utf8");
let passed=0,failed=0;
function check(name,fn){try{fn();passed++;console.log("PASS LT67 Weather/Refresh "+name)}catch(e){failed++;console.error("FAIL LT67 Weather/Refresh "+name+" "+e.message)}}
check("Atualizar visibility checkbox no longer disabled",()=>{
 const s=dock.split("function renderAppearanceChoices(){")[1].split("document.addEventListener(",1)[0];
 assert.ok(s.includes("const locked=false;"));
 assert.ok(s.includes('eye.disabled=locked;'));
 assert.ok(s.includes('quickPrefs.hidden=hidden?quickPrefs.hidden.filter'));
});
check("Preferences normalization retains hidden period while protecting Shiny and app settings",()=>{
 const s=dock.split("function normalizedQuickPrefs(p){")[1].split("function saveQuickPrefs()",1)[0];
 assert.ok(!s.includes('!"period"'));
 for(const id of ['"close"','"appearance"','"sh"'])assert.ok(s.includes(id));
});
check("Android stores hidden period instead of silently rejecting it",()=>{
 const s=service.split("@JavascriptInterface public void saveMenuPrefs(String json)")[1]?.split("@JavascriptInterface public void toggleTimers()",1)[0]||"";
 assert.ok(s.includes('"period"'));
 assert.ok(!s.includes('!"period".equals(id)'));
 assert.ok(s.includes('putString("menuUiPrefs",clean.toString())'));
});
check("Canonical weather selection labels and values unchanged",()=>{
 const s=dock.split("const WEATHER_ICON_FILES=Object.freeze({")[1].split("function filterDisplayLabel(",1)[0];
 for(const name of ["Any","Boosted","Sunny","Rainy","Partly Cloudy","Cloudy","Windy","Snow","Fog"])assert.ok(s.includes('"'+name+'"'));
 assert.ok(dock.includes('Native.patchSearchFilters(JSON.stringify(delta))'));
});
check("Visual Editor light/dark controls icon visibility in one menu",()=>{
 assert.ok(editor.includes('body.classList.toggle("visual-light-menu",current.menuBgMode==="light")'));
 assert.ok(dock.includes('body.controls-window.visual-light-menu #choices .weatherIconPair .weatherIcon-white'));
 assert.ok(dock.includes('body.controls-window:not(.visual-light-menu) #choices .weatherIconPair .weatherIcon-black'));
});
check("Weather icon elements are paired and use old originals only as fallback",()=>{
 const s=dock.split("function makeWeatherIcon(value){")[1].split("const FILTER_DISPLAY_LABELS=",1)[0];
 for(const token of ['for(const variant of ["white","black"])','weatherIconPair','weatherIcon-'+ '"', 'img.dataset.fallback','file:///android_asset/weather-icons/v2/'])assert.ok(s.includes(token),token);
});
check("Every new white/black PNG for nine official weather states is intact",()=>{
 const names=["any","boosted","sunny-clear","rainy","partly-cloudy","cloudy","windy","snow","fog"];
 for(const name of names)for(const variant of ["white","black"]){
  const file=path.join(root,"src/main/assets/weather-icons/v2",name+"-"+variant+".png");
  const bytes=fs.readFileSync(file);
  assert.ok(bytes.length>=20000,file);
  assert.equal(bytes.subarray(0,8).toString("hex"),"89504e470d0a1a0a",file);
 }
});
check("Nine legacy assets remain present for backwards compatibility",()=>{
 const original=["any","boosted","sunny","rainy","partly-cloudy","cloudy","windy","snow","fog"];
 for(const item of original)assert.ok(fs.statSync(path.join(root,"src/main/assets/weather-icons",item+".png")).size>0);
});
check("Inline scripts remain parseable after changing weather icons",()=>{
 for(const match of dock.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
});
console.log("LT67 weather/refresh: "+passed+" PASS / "+failed+" FAIL");if(failed)process.exitCode=1;

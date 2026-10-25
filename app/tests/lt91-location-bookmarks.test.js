"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const base=path.join(__dirname,"../src/main");
const java=fs.readFileSync(path.join(base,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const dock=fs.readFileSync(path.join(base,"assets/dock.html"),"utf8");
const check=(name,callback)=>{callback();console.log("PASS LT91 "+name);};
check("saved locations are local only and bounded to three slots",()=>{
 assert.match(java,/savedSearchLocationV1_/);
 assert.match(java,/@JavascriptInterface public void copyLocationCoords\(String input\)/);
 assert.match(java,/@JavascriptInterface public void saveSearchLocation/);
 assert.match(java,/@JavascriptInterface public void loadSearchLocation/);
 assert.match(java,/slot<1\|\|slot>3\|\|radius<0\|\|radius>1000/);
});
check("loading locations preserves prior API search path",()=>{
 assert.match(java,/new Bridge\(\)\.setLocation\(true,coords,radius\)/);
 assert.match(java,/String clean=extractCoordinates/);
 assert.match(java,/if\(coords\.isEmpty\(\)\|\|radius<0\|\|radius>1000\)return/);
});
check("location row remains compact and does not replace existing controls",()=>{
 assert.match(dock,/panel\.append\(title,fieldRow,label,message\)/);
 assert.doesNotMatch(dock.split("function renderLocationChoices(){")[1].split("let requestedInterval=null")[0],/saveSearchLocation\(/);
 assert.doesNotMatch(dock.split("function renderLocationChoices(){")[1].split("let requestedInterval=null")[0],/loadSearchLocation\(slot\)/);
 assert.match(dock,/copyLocationCoords/);
 assert.doesNotMatch(dock.split("function renderLocationChoices(){")[1].split("let requestedInterval=null")[0],/locSavedRow/);
});

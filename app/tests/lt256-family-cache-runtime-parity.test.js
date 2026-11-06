"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main"),assets=path.join(root,"assets");
const read=(name)=>fs.readFileSync(path.join(assets,name),"utf8");
const family=require(path.join(assets,"pvp_family_catalog.js"));
const dock=read("dock.html"),detail=read("detail.html"),script=detail.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);new vm.Script(script);
const native=fs.readFileSync(path.join(root,
 "java/com/lucianotoscano/pokesearchoverlay/OtaAssets.java"),"utf8");
const overlay=fs.readFileSync(path.join(root,
 "java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const pack=fs.readFileSync(path.join(__dirname,"../../scripts/build_ota_pack.py"),"utf8");
assert.ok(pack.includes('"pvp_family_catalog.js"'));
assert.ok(native.includes('"pvp_family_catalog.js"'),
 "signed OTA runtime must permit every signed calculator asset");
assert.ok(native.includes('response.setResponseHeaders(headers);')&&
 native.includes('headers.put("Cache-Control","no-store, no-cache, must-revalidate, max-age=0")'),
 "new APK must not reuse old detail.html script cache");
assert.ok(overlay.includes('detailPanel.getSettings().setCacheMode(android.webkit.WebSettings.LOAD_NO_CACHE)'),
 "local detail WebView must bypass stale Chromium resource cache");
const prefix="const PVP_EVO_LINKS=Object.freeze(",start=dock.indexOf(prefix),end=dock.indexOf(");",start);
assert.deepEqual(family.links,JSON.parse(dock.slice(start+prefix.length,end)));
const win={PokeSearchPvpFamilyCatalog:family,psRankContext:null};
new Function("window",read("pvpoke-iv-gamemaster.js"))(win);
const fakeDocument={getElementById:()=>null,querySelectorAll:()=>[]};
const startJs=script.indexOf("/* LT244: zero-cost contextual stats actions.");
const endJs=script.indexOf("const item=(k,v)=>",startJs);
assert.ok(startJs>0&&endJs>startJs);
const fn=new Function("window","document","h","activeRankLeague","pvpFormsForLeague",
 "resizeEvolutionPanel",script.slice(startJs,endJs)+
 "return {set:c=>metricCard=c,forms:psCpVariants,controls:psCpControls};")(
 win,fakeDocument,String,"gl",()=>[],()=>{});
const base={name:"Teddiursa",iv:"0/14/15",level:26,cp:888,ivValid:true};
fn.set({...base,region:"United States",form:"Teddiursa",costumeId:"0"});
assert.deepEqual(fn.forms().map(x=>x[1]),["Teddiursa","Ursaring","Ursaluna"],
 "encounter geographic region and species-as-form must not hide normal evolutions");
assert.ok(fn.controls().includes("Forma · 3"));
assert.ok(fn.controls().includes('data-pscp-form="ursaluna"'));
fn.set({...base,form:"Galarian",region:"Galar"});
assert.deepEqual(fn.forms().map(x=>x[1]),["Teddiursa"],
 "regional forms not inferred as base evolutions");
fn.set({...base,form:"NORMAL",isCostume:true});
assert.deepEqual(fn.forms().map(x=>x[1]),["Teddiursa"],
 "costumed encounters must not invent evolutions");
console.log("LT256 PASS: installed local family asset, OTA whitelist parity, no-cache HTML/JS, visible form count and neutral region fallback");

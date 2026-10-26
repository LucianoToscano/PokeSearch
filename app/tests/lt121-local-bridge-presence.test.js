"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../src/main");
const java=p=>fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay",p),"utf8");
const svc=java("OverlayService.java"),stats=java("FirebaseStats.java"),policy=java("LocalBridgePagePolicy.java");
const presence=java("PresenceWindowState.java");
let n=0;function test(name,f){f();n++;console.log("PASS LT121 "+name);}
test("independent P1 and P2 lifecycle calls",()=>{
 assert.match(svc,/FirebaseStats\.setOverlayVisible\(this,true,isSecondaryOverlay\(\)\)/);
 assert.match(svc,/FirebaseStats\.setOverlayVisible\(this,false,isSecondaryOverlay\(\)\)/);
 assert.match(stats,/primaryOverlayVisible,secondaryOverlayVisible/);
 assert.match(stats,/PresenceWindowState\.isActive/);
 assert.doesNotMatch(stats,/homeVisible\|\|overlayVisible/);
});
test("Native bridge only local asset docs, never remote pages",()=>{
 for(const web of ["panel","menuPanel","detailPanel","popupPanel","resultPanel"]){
   const start=svc.indexOf(web+".setWebViewClient(new WebViewClient(){");
   assert.ok(start>0,web);
   const end=svc.indexOf("});",start);
   const client=svc.slice(start,end);
   assert.match(client,/shouldOverrideUrlLoading/);
   assert.match(client,/LocalBridgePagePolicy\.allows/);
 }
 assert.match(policy,/getRawAuthority\(\)/);
 assert.match(policy,/getRawPath\(\)/);
 assert.match(policy,/controls=1&popup=1/);
 assert.match(presence,/home\|\|primary\|\|secondary/);
});
test("local details initialization checks its own exact asset",()=>{
 assert.match(svc,/LocalBridgePagePolicy\.allows\(url,"detail.html"\)\)\{\s*detailLoaded=true/);
 assert.match(svc,/LocalBridgePagePolicy\.allows\(url,"dock.html"\)\)\{\s*menuLoaded=true/);
 assert.equal((svc.match(/shouldOverrideUrlLoading\(\s*WebView view,android\.webkit\.WebResourceRequest request\)/g)||[]).length,5);
});
console.log("LT121 bridge and 2-overlay presence "+n+"/"+n+" PASS");

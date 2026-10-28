"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const base=path.join(__dirname,"..");
const detail=fs.readFileSync(path.join(base,"src/main/assets/detail.html"),"utf8");
const service=fs.readFileSync(path.join(base,"src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const dock=fs.readFileSync(path.join(base,"src/main/assets/dock.html"),"utf8");
let passed=0,failed=0;const check=(title,run)=>{try{run();passed++;console.log("PASS LT65 "+title);}catch(e){failed++;console.error("FAIL LT65 "+title+" "+e.message)}};
check("1 Get coords has explicit pending button and calls native",()=>{
 assert.ok(detail.includes('id="coords" onclick="requestCoordsUi()"'));
 assert.ok(detail.includes("Native.coords(currentIndex)"));
 assert.ok(detail.includes('coordsNote="Consultando coordenadas do Pokémon no site..."'));
 assert.ok(detail.includes('fetch.disabled=coordsPending'));
});
check("2 Copy requests coordinates when missing instead of dead-end label",()=>{
 assert.ok(detail.includes('if(currentCoords)Native.copyCoords(currentCoords);'));
 assert.ok(detail.includes('else requestCoordsUi();'));
 assert.ok(detail.includes('fetch.title=valid?"Toque nas coordenadas para copiar novamente"'));
 assert.ok(detail.includes('fetch.setAttribute("aria-label",fetch.title)'));
});
check("3 Failed and pending messages survive status repaint for same card",()=>{
 assert.ok(detail.includes("const changed=detailIdentity!==nextIdentity;"));
 assert.ok(detail.includes("if(changed){"));
 assert.ok(detail.includes('coordsNote="";coordsPending=false;currentCoords=String(c.coords||"")'));
 assert.ok(detail.includes('coordsNote||""'));
 assert.ok(!detail.includes('currentIndex=Number(c.sourceIndex);currentCoords=String(c.coords||"");'));
});
check("4 Late callback and identity switches cannot pin loading forever",()=>{
 assert.ok(detail.includes("let coordsNote=\"\",coordsPending=false,coordsRequestSeq=0"));
 assert.ok(detail.includes("if(seq!==coordsRequestSeq||!coordsPending)return;"));
 assert.ok(detail.includes("coordsRequestSeq++;"));
 assert.ok(detail.includes("},9000);"));
});
check("5 Reuse actual reported coordinates with matching card data",()=>{
 assert.ok(service.includes('String saved=extractCoordinates(target.optString("coords",""));'));
 assert.ok(service.includes("if(autoCopy)copyCoordinatesInternal(saved);"));
 assert.ok(service.includes('fingerprint.put("name"'));
 assert.ok(service.includes('fingerprint.put("cp"'));
 assert.ok(service.includes('fingerprint.put("number"'));
});
check("6 Preserve actual native error reason when site is unavailable",()=>{
 assert.ok(service.includes('response.optString("reason","Get coords indisponível")'));
 assert.ok(service.includes('deliverCoords("",why)'));
});
check("7 Detail card avoids the native toolbar touch rectangle",()=>{
 const source=service.split("private void moveDetail(){")[1]?.split("private void newWebsite(){")[0]||"";
 for(const token of ["crossesToolbar","params.x+params.width","params.y+toolbarHeight","int below=params.y+toolbarHeight+margin","int above=params.y-cardHeight-margin","detailParams.x=x;detailParams.y=y"])assert.ok(source.includes(token),token);
});
check("8 Geometry does not use CSS transparent hitbox or move the main toolbar",()=>{
 const source=service.split("private void moveDetail(){")[1]?.split("private void newWebsite(){")[0]||"";
 assert.ok(!source.includes("params.x=")&&!source.includes("params.y="));
 assert.ok(source.includes("metrics()"));
 assert.ok(source.includes("resultParams!=null?resultParams.x:params.x"));
});
check("9 Detail timeout does not submit website Search, alter Shiny or PvP",()=>{
 const source=detail.split("function requestCoordsUi(){")[1]?.split("function copyCoords(){")[0]||"";
 assert.ok(source.includes("Native.coords(currentIndex)"));
 assert.ok(!source.includes("Native.refresh(")&&!source.includes("Native.shiny(")&&!source.includes("setSearchMode"));
});
check("10 Overlay original security and independent lifecycle preserved",()=>{
 assert.ok(service.includes("IntegrityGuard.verify(this)"));
 assert.ok(service.includes("PopupTouchGeometry.avoidResult("));
 assert.ok(service.includes("private final Runnable expiryRefresh="));
 assert.ok(dock.includes("Native.expiredResults"));
});
check("11 Inline detail script remains parsable and favorite action preserved",()=>{
 const script=detail.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(script);new vm.Script(script[1]);assert.ok(detail.includes("Native.toggleWatch(watchName)"));
});
console.log("LT65: "+passed+" PASS / "+failed+" FAIL");if(failed)process.exitCode=1;

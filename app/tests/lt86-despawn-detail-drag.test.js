"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const dir=path.join(__dirname,"../src/main");
const svc=fs.readFileSync(path.join(dir,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const detail=fs.readFileSync(path.join(dir,"assets/detail.html"),"utf8");
const dock=fs.readFileSync(path.join(dir,"assets/dock.html"),"utf8");
const api=require("../src/main/assets/api_result_contract.js");
const run=(title,fn)=>{fn();console.log("PASS LT86 "+title);};
run("detail card shows authoritative API absolute despawn even with empty legacy MM:SS",()=>{
 const html=detail.split("window.showDetails=(c,mode,watched)=>")[1]||"";
 assert.match(html,/const absolute=Number\(c\.expiresAtMs\)/);
 assert.match(html,/expiresAt=Number\.isFinite\(absolute\)&&absolute>0\?absolute:/);
 assert.match(detail,/e\.textContent="⏳ "\+\(remaining\?fmt\(remaining\):"Expirado"\)/);
 assert.match(detail,/e\.className=tone/);
 assert.match(detail,/if\(Native\.expiredResults\)Native\.expiredResults\(\)/);
});
run("API skips expired cards, including before first view or hidden timers",()=>{
 const timestamp=Date.now();
 const row=(end)=>({pokemon_id:100,pokemon_name:"Voltorb",cp:625,level:20,
    raw_iv:"15/15/15",iv_percent:100,gender:"Genderless",form:"Normal",
    despawn_at:new Date(end).toISOString()});
 const expired=api.normalizeResponse({results:[row(timestamp-3000)]},{nowMs:timestamp});
 assert.equal(expired.ok,true);
 assert.equal(expired.cards.length,0);
 assert.equal(expired.expired,1);
 const active=api.normalizeResponse({results:[row(timestamp+3000)]},{nowMs:timestamp});
 assert.equal(active.ok,true);
 assert.equal(active.cards.length,1);
 assert.ok(active.cards[0].expiresAtMs>timestamp);
});
run("native collector respects expiresAtMs before legacy time and sweeps on zero",()=>{
 const method=svc.split("private void applyCollectedResults(")[1]||"";
 assert.ok(method.includes('long absolute=card.optLong("expiresAtMs",Long.MAX_VALUE);'));
 assert.ok(method.includes('long end=absolute!=Long.MAX_VALUE?absolute:expiration(card);'));
 assert.ok(method.includes('if(end<=now)continue;'));
 const watchdog=svc.split('@JavascriptInterface public void expiredResults()')[1]?.split("@JavascriptInterface public void longPressCoords",1)[0]||"";
 assert.ok(watchdog.includes("if(!stopped)expiryRefresh.run();"));
 assert.ok(dock.includes("if(newlyExpired&&Native.expiredResults)Native.expiredResults();"));
});
run("result sprites retry only verified base art, preserving forms and costumes",()=>{
 assert.match(dock,/const match=\/\^https:/);
 assert.match(dock,/mirrorAttempted=true;/);
 assert.match(dock,/cdn\.jsdelivr\.net\/gh\/PokeAPI\/sprites@master/);
 assert.match(dock,/img\.src=original;/);
});
run("opened detail has independent transparent drag handle, excludes close and keeps geometry",()=>{
 const detailGrip=svc.split("View detailDragGrip=new View(this);")[1]?.split("detailPanel.setWebViewClient",1)[0]||"";
 assert.ok(detailGrip.includes("dp(DETAIL_DP-100),dp(49)"));
 assert.ok(detailGrip.includes("detailManuallyPositioned=true"));
 assert.ok(detailGrip.includes("detailParams.x=Math.max(0,Math.min("));
 assert.ok(detailGrip.includes("detailParams.y=Math.max(0,Math.min("));
 assert.ok(detailGrip.includes("wm.updateViewLayout(detailRoot,detailParams)"));
 const position=svc.split("private void moveDetail()")[1]?.split("private String locationPayload",1)[0]||"";
 assert.ok(position.includes("if(detailManuallyPositioned)"));
 assert.match(detail,/<button id="x" onclick="Native\.hideDetail\(\)" aria-label="Fechar card">×<\/button>/);
});

"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"..","src","main");
const read=x=>fs.readFileSync(path.join(root,x),"utf8");
const probe=read("assets/probe.js");
const dock=read("assets/dock.html");
const detail=read("assets/detail.html");
const svc=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const home=read("java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const chat=read("java/com/lucianotoscano/pokesearchoverlay/CommunityScrapbookStage1.java");
const cache=read("java/com/lucianotoscano/pokesearchoverlay/ProfileAvatarCache.java");

test("LT391: IV source must be a visible per-encounter badge, never the search form",()=>{
 assert.match(probe,/const ivLabels=Array\.from\(box\.querySelectorAll/);
 assert.match(probe,/\.filter\(vis\)\.slice\(0,72\)/);
 assert.match(probe,/const ivText=body\+/);
 assert.match(probe,/canonicalPct===100\?"15\/15\/15"/);
 assert.match(probe,/canonicalPct===0\?"0\/0\/0"/);
 assert.match(probe,/const evidence=verifiedCardIv\(x\)/);
 assert.match(svc,/IV individual verificável/);
});
test("LT391: account hub is compact, identity-bound, automatic visitor, no manual login-provider split",()=>{
 const hub=home.split("private void showPogoAccountHub(){")[1]?.split("private String pogoAccountSummary",1)[0];
 assert.ok(hub);
 assert.match(hub,/android\.app\.Dialog dialog=new android\.app\.Dialog\(this\)/);
 assert.match(hub,/ProfileAvatarCache\.load\(this,slot,name,avatarUrl\)/);
 assert.match(hub,/openLoginDialogForSlot\(selectedSlot,connected\?"manage":"login"\)/);
 assert.match(hub,/logoutSecondAccount\(\)/);
 assert.doesNotMatch(hub,/Continuar como visitante|Atualizar nome e foto/);
 assert.match(cache,/pogo-avatar-slot-/);
 assert.match(cache,/profileAvatarCacheSignature/);
});
test("LT391: Home hides Chat by default but keeps explicit opt-in",()=>{
 assert.match(chat,/lt391ChatHomeHiddenOnce/);
 assert.match(chat,/putBoolean\("communityLiveChatVisible",false\)/);
 assert.match(chat,/getBoolean\("communityLiveChatVisible",false\)/);
 assert.match(home,/Mostrar Chat/);
});
test("LT391: 3m refresh, concise result cards, trusted rate limits",()=>{
 assert.match(svc,/intervalMinutes=3,menuPadDp=0/);
 assert.doesNotMatch(dock,/for\(const value of \[-3,/);
 assert.match(dock,/function manualRefreshTap\(\)/);
 assert.match(detail,/const evidenceHtml="";/);
 assert.match(svc,/apiProviderBackoffUntil\(\)>0L/);
});

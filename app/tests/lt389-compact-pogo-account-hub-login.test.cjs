"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const java=fs.readFileSync(path.resolve(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
const slots=fs.readFileSync(path.resolve(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/PogoAccountSlots.java"),"utf8");
const profile=fs.readFileSync(path.resolve(__dirname,"../src/main/assets/profile_summary.js"),"utf8");

test("LT389 Home uses no two large account cards but has a compact 2-account hub",()=>{
 assert.match(java,/auth\.setVisibility\(View\.GONE\)/);
 assert.match(java,/secondAccount\.setVisibility\(View\.GONE\)/);
 assert.match(java,/homePogoCoordinatesShortcut\.setOnClickListener\(v->showPogoAccountHub\(\)\)/);
 assert.match(java,/private void showPogoAccountHub\(\)/);
 assert.match(java,/private void showPogoAccountActions\(int slot\)/);
 assert.match(java,/pogoAccountSummary\(slot\)/);
 assert.match(java,/for\(int slot=1;slot<=2;slot\+\+\)/);
 assert.match(java,/dialog\.setContentView\(card\)/);
 assert.doesNotMatch(java.split("private void showPogoAccountHub(){")[1].split("private String pogoAccountSummary",1)[0],/Continuar como visitante|Atualizar nome e foto/);
});
test("LT389 no account switches without explicit action",()=>{
 assert.match(java,/preferredLoginProvider="";/);
 assert.match(java,/openLoginDialogForSlot\(slot,"login"\)/);
 assert.match(java,/openLoginDialogForSlot\(slot,"manage"\)/);
 assert.match(java,/ProfileAvatarCache\.load\(this,slot,name,avatarUrl\)/);
 assert.match(java,/logoutSecondAccount\(\)/);
 assert.match(java,/askLogout\(\)/);
 assert.match(java,/PogoAccountSlots\.supportsSecond\(\)/);
});
test("LT389 official login is unobscured after actual page load",()=>{
 const block=java.split("@Override public void onPageFinished(WebView view,String url){")[1].split("@Override public void doUpdateVisitedHistory")[0];
 assert.match(block,/if\(loginCover!=null\)loginCover\.setVisibility\(View\.GONE\);\s*checkLoginSession\(view,24,generation\)/);
 assert.match(java,/website\.getSettings\(\)\.setAllowFileAccess\(false\)/);
 assert.match(java,/PogoAccountSlots\.attach\(website,activeLoginSlot\)/);
});
test("LT389 profile/last-good avatar survive resync until new authenticated identity is confirmed",()=>{
 const block=java.split('if("autenticada".equals(auth)){')[1].split('profileCaptureStartedAt=')[0];
 assert.match(block,/putString\("sessionStatus","autenticada"\)/);
 assert.match(block,/putString\("profileSyncState","pending"\)/);
 assert.doesNotMatch(block,/\.remove\("profileDisplayName"\)/);
 assert.doesNotMatch(block,/\.remove\("profileAvatarUrl"\)/);
 assert.doesNotMatch(block,/ProfileAvatarCache\.clear/);
 assert.match(java,/boolean newIdentity=!priorName\.isEmpty\(\)&&!priorName\.equals\(name\)/);
 assert.match(java,/if\(newIdentity\)ProfileAvatarCache\.clear\(this,activeLoginSlot\)/);
});
test("LT389 first party React profile retains strict origin, isolation and sanitization",()=>{
 assert.match(profile,/if\(!proof\)return JSON\.stringify\(\{ok:false,page:"unhydrated"/);
 assert.match(profile,/identityVerified:!!displayName/);
 assert.match(slots,/static final String NAME_2="pokesearch_pogocoordinates_account_2"/);
 assert.match(slots,/static final String NAME_GUEST="pokesearch_pogocoordinates_visitor"/);
 assert.doesNotMatch(profile,/document\.cookie|localStorage|sessionStorage|access_token/);
});

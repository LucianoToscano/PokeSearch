"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const root="app/src/main/";
const js=fs.readFileSync(root+"assets/profile_summary.js","utf8");
const main=fs.readFileSync(root+"java/com/lucianotoscano/pokesearchoverlay/MainActivity.java","utf8");
const slots=fs.readFileSync(root+"java/com/lucianotoscano/pokesearchoverlay/PogoAccountSlots.java","utf8");
const cache=fs.readFileSync(root+"java/com/lucianotoscano/pokesearchoverlay/ProfileAvatarCache.java","utf8");
let checks=0;
function test(name,fn){fn();checks++;console.log("LT381 PASS: "+name);}
function element(text){
 return {innerText:text,textContent:text,parentElement:null,previousElementSibling:null,
 getClientRects:()=>[{}],querySelectorAll:()=>[],getAttribute:()=>null};
}
function read({name="Exemplo da Conta",body="Linked accounts\nMember since 01/11/2026",
  source="",page="/profile"}={}){
 const member=element("Member since 01/11/2026");
 if(name!==null)member.previousElementSibling=element(name);
 // When no name exists, avoid relying on geometric mock rectangles.
 member.getBoundingClientRect=()=>({top:150,left:20});
 const nodes=[member];
 const pictures=[];
 if(source){
  const pic=element("");
  pic.currentSrc=source;
  pic.getAttribute=x=>x==="alt"?"Profile photo":null;
  pictures.push(pic);
 }
 const document={body:{innerText:body},querySelectorAll:selector=>
  selector==="img"?pictures:/^h1,h2,h3,strong,span$/.test(selector)?[]:nodes};
 const location={pathname:page,origin:"https://pogocoordinates.com",
  href:"https://pogocoordinates.com"+page};
 return JSON.parse(vm.runInNewContext(js,{document,location,URL}));
}
test("member name plus public Google avatar",()=>{
 const p=read({source:"https://lh3.googleusercontent.com/a/avatar"});
 assert.equal(p.ok,true);assert.equal(p.identityVerified,true);
 assert.equal(p.syncReason,"complete");assert.equal(p.displayName,"Exemplo da Conta");
 assert.equal(p.avatarUrl,"https://lh3.googleusercontent.com/a/avatar");
});
test("hydrated member with a lazy avatar remains a partial success",()=>{
 const p=read();assert.equal(p.ok,true);assert.equal(p.identityVerified,true);
 assert.equal(p.syncReason,"avatar_pending");assert.equal(p.avatarUrl,"");
});
test("hydrated shell without member name cannot be considered verified",()=>{
 const p=read({name:null});
 assert.equal(p.ok,true);assert.equal(p.identityVerified,false);
 assert.equal(p.syncReason,"profile_name_missing");
});
test("unhydrated DOM exposes safe reason",()=>{
 const p=read({body:"Loading..."});
 assert.equal(p.ok,false);assert.equal(p.reason,"profile_unhydrated");
});
test("profile extraction never accepts the search page",()=>{
 const p=read({page:"/search"});assert.equal(p.ok,false);
 assert.equal(p.page,"not-profile");
});
test("Next.js image wrapper is resolved to HTTPS allowlisted source",()=>{
 const target="https://lh3.googleusercontent.com/a/updated";
 const p=read({source:"https://pogocoordinates.com/_next/image?url="+
   encodeURIComponent(target)+"&w=192&q=75"});
 assert.equal(p.avatarUrl,target);
});
test("untrusted or lookalike image hosts are rejected",()=>{
 for(const value of ["https://lh3.googleusercontent.com.evil.test/avatar",
  "http://lh3.googleusercontent.com/a/avatar","https://evil.test/x"]){
  assert.equal(read({source:value}).avatarUrl,"");
 }
});
test("Discord public avatar is accepted without reading secrets",()=>{
 const p=read({source:"https://cdn.discordapp.com/avatars/123/a.png"});
 assert.equal(p.avatarUrl,"https://cdn.discordapp.com/avatars/123/a.png");
 assert.doesNotMatch(js,/document\.cookie|localStorage|sessionStorage|access_token/);
});
test("fresh OAuth clears stale trainer; name and avatar remain cached until a different identity is verified",()=>{
 assert.match(main,/boolean sameSessionResync=/);
 assert.match(main,/observedLoginProvider\.isEmpty\(\)/);
 assert.match(main,/if\(!sameSessionResync\)\{[\s\S]*?putString\("profileTrainerState","unknown"\)/);
 assert.match(main,/\.remove\("profileTrainerList"\)/);
 const auth=main.split('if("autenticada".equals(auth)){')[1].split("profileCaptureStartedAt=")[0];
 assert.doesNotMatch(auth,/remove\("profileAvatarUrl"\)|remove\("profileDisplayName"\)/);
 assert.match(main,/if\(newIdentity\)ProfileAvatarCache\.clear\(this,activeLoginSlot\)/);
 assert.match(main,/profileCaptureStartedAt=android\.os\.SystemClock\.uptimeMillis\(\)/);
});
test("partial DOM name causes bounded retries, never sync success",()=>{
 assert.match(main,/profile\.optString\("displayName",""\)\.trim\(\)\.length\(\)>=3/);
 assert.match(main,/profileCaptureRetryCount<=12|tryNumber<=12/);
 assert.match(main,/elapsed<20_000L/);
 assert.match(main,/profileCaptureFailureReason/);
 assert.match(main,/profileSyncState","error"/);
});
test("missing lazy image is retained only for the same verified identity",()=>{
 assert.match(main,/boolean newIdentity=!priorName\.isEmpty\(\)&&!priorName\.equals\(name\)/);
 assert.match(main,/boolean reuse=priorName\.equals\(name\)&&!newIdentity/);
 assert.match(main,/if\(newIdentity\)ProfileAvatarCache\.clear/);
});
test("explicit sync forces same-URL download for both account slots",()=>{
 assert.match(main,/refreshGoogleAvatar\(url,true\)/);
 assert.match(main,/refreshSecondGoogleAvatar\(url,true\)/);
 assert.match(main,/if\(!force&&shownAvatarUrl\.equals\(next\)\)return/);
 assert.match(main,/if\(!force&&shownSecondAvatarUrl\.equals\(next\)\)return/);
 assert.match(main,/refreshSyncedAvatar\(activeLoginSlot\)/);
});
test("private cache bounded, identity-bound, logout-cleared and late callbacks guarded",()=>{
 assert.match(cache,/getFilesDir\(\)/);
 assert.match(cache,/MAX_FILE_BYTES=350_000/);
 assert.match(cache,/slot\+"\\n"\+displayName\+"\\n"\+url/);
 assert.match(cache,/SHA-256/);
 assert.match(slots,/ProfileAvatarCache\.clear\(context,slot\)/);
 assert.match(main,/avatarRequestId!=avatarRequestGeneration/);
 assert.match(main,/avatarRequestId!=secondAvatarRequestGeneration/);
 assert.match(main,/avatarName\.equals\(slotPrefs\.getString\("profileDisplayName",""\)\)/);
 assert.match(main,/next\.equals\(slotPrefs\.getString\("profileAvatarUrl",""\)\)/);
});
test("account 1 and account 2 keep their own preference and WebView profile stores",()=>{
 assert.match(slots,/slot==2\?"pogo_account_2":"prefs"/);
 assert.match(slots,/WebViewCompat\.setProfile\(web,NAME_2\)/);
 assert.match(slots,/ProfileStore\.getInstance\(\)\.getOrCreateProfile\(NAME_2\)/);
});
console.log("LT381: "+checks+" profile sync/source contracts PASS (not an Android physical test)");

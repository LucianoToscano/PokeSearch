"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const root="app/src/main/";
const profileScript=fs.readFileSync(root+"assets/profile_summary.js","utf8");
const probe=fs.readFileSync(root+"assets/probe.js","utf8");
const home=fs.readFileSync(root+"java/com/lucianotoscano/pokesearchoverlay/MainActivity.java","utf8");
const art=fs.readFileSync(root+"java/com/lucianotoscano/pokesearchoverlay/HomeMenuIconPack.java","utf8");
function element(text){
 return {innerText:text,textContent:text,parentElement:null,previousElementSibling:null,
   getClientRects:()=>[{}],querySelectorAll:()=>[],getAttribute:()=>null};
}
function inspect(text,parts,images=[],pathname="/profile"){
 const document={body:{innerText:text},querySelectorAll:selector=>
   selector==="img"?images:parts};
 const location={pathname,origin:"https://pogocoordinates.com",
   href:"https://pogocoordinates.com"+pathname};
 return JSON.parse(vm.runInNewContext(profileScript,{document,location,URL}));
}
const member=element("Member since 31/10/2026");
member.previousElementSibling=element("Exemplo da Conta");
const avatar=element("");
avatar.currentSrc="https://lh3.googleusercontent.com/a/test-picture";
avatar.getAttribute=key=>key==="alt"?"Profile photo":null;
const verified=inspect("Profile\nExemplo da Conta\nMember since 31/10/2026\nLinked accounts\nGoogle Linked\nDiscord Not linked",
 [member], [avatar]);
assert.equal(verified.ok,true,"first party member identity works without optional Pokemon GO trainer block");
assert.equal(verified.displayName,"Exemplo da Conta","name is anchored to Member since");
assert.equal(verified.trainerState,"unknown","no inferred link without validated trainer card");
assert.equal(verified.avatarUrl,avatar.currentSrc,"public allowlisted profile photo only");
const unknownAvatar=Object.assign({},avatar,{
 currentSrc:"https://example.net/untrusted.jpg",
 getClientRects:()=>[{}],getAttribute:key=>key==="alt"?"Profile photo":null
});
assert.equal(inspect("Linked accounts\nMember since 31/10/2026",[member],[unknownAvatar]).avatarUrl,"",
 "no untrusted image");
assert.equal(inspect("Linked accounts\nLogin with Google",[],[]).ok,false,
 "guest cannot become authenticated from linked accounts heading alone");
assert.equal(inspect("Linked accounts\nMember since 31/10/2026",[member],[],"/search").ok,false,
 "profile proof cannot be reused on other paths");
// Login and account switch have different entrypoints and cookie compartments.
assert.match(probe,/profileProof=location\.pathname==="\/profile"/);
assert.match(probe,/\(\/\\bMember since\\b\/i\.test\(body\)\|\|\/\\bPokemon GO accounts\\b\/i\.test\(body\)\)/);
assert.match(home,/showPokeballAccountChoice\(secondary,true\)/);
assert.match(home,/PogoAccountSlots\.bindAccountOnly\(this,secondary,account\)/);
assert.match(home,/private String loginPurpose="login"; \/\/ login \| manage \| sync/);
assert.match(home,/openLoginDialogForSlot\(1,"sync"\)/);
assert.match(home,/openLoginDialogForSlot\(2,"sync"\)/);
assert.match(home,/profileCaptureInProgress="manage"\.equals\(loginPurpose\)\|\|/);
assert.match(home,/verifiedName\.isEmpty\(\)/);
assert.match(home,/loginCover\.setVisibility\(View\.GONE\)/);
assert.match(home,/accountActions\.addView\(syncProfile/);
assert.match(home,/secondAccountActions\.addView\(secondSyncProfile/);
assert.match(home,/HomeMenuIconPack\.opticalPokeballButtonXInParentPx\(icon\)/);
assert.match(home,/placement\.leftMargin=desiredLeft/);
assert.match(home,/placement\.gravity=Gravity\.TOP\|Gravity\.LEFT/);
assert.match(art,/static int opticalPokeballButtonXInParentPx\(/);
assert.match(art,/leftBrightness<135&&rightBrightness<135/);
assert.match(art,/static int opticalCenterXInParentPx\(/);
assert.match(art,/bounds\.exactCenterX\(\)/);
assert.doesNotMatch(profileScript,/document\.cookie|localStorage|sessionStorage|access_token/);
console.log("LT376e PASS: public profile independent of trainer section, avatar whitelist, two private slots, centered badges, manual sync");

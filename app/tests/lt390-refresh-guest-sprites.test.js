"use strict";
// LT390: regressions from Android guest/Dex/refresh screenshots.
// Run: node app/tests/lt390-refresh-guest-sprites.test.js
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const read=file=>fs.readFileSync(path.join(__dirname,"..","src","main",file),"utf8");
const sprite=require("../src/main/assets/sprite_offline.js");
const probe=read("assets/probe.js");
const dock=read("assets/dock.html");
const detail=read("assets/detail.html");
const service=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");

test("Dex #580 is Ducklett, not an inherited Toxtricity sprite",()=>{
 const generic={number:"#580",name:"Pokemon",image:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/849.png",imageFromSite:true,form:"",shiny:false};
 const clean=sprite.normalizeEncounterIdentity(generic);
 assert.equal(clean.name,"Ducklett");
 assert.equal(clean.image,"");
 assert.equal(clean.imageFromSite,false);
 assert.equal(sprite.verifiedBase(clean),true);
 assert.match(sprite.resolve(clean).src,/\/(?:base\/580|580)\.png$/);
});

test("Dex #129 is Magikarp and an unlabelled sprite is not reused",()=>{
 const clean=sprite.normalizeEncounterIdentity({number:"#129",name:"Pokémon",image:"https://bad.example/pokemon.png",imageFromSite:true,form:"",shiny:false});
 assert.equal(clean.name,"Magikarp");
 assert.equal(clean.imageFromSite,false);
 assert.equal(sprite.verifiedBase(clean),true);
 assert.match(sprite.resolve(clean).src,/\/(?:base\/129|129)\.png$/);
});

test("Do not change confirmed names, other forms, or unknown species",()=>{
 const named={number:"#580",name:"Ducklett",image:"https://cdn.example/d.png",imageFromSite:true};
 assert.strictEqual(sprite.normalizeEncounterIdentity(named),named);
 const unknown={number:"#1400",name:"Pokemon",image:"https://cdn.example/u.png"};
 assert.strictEqual(sprite.normalizeEncounterIdentity(unknown),unknown);
 const special=sprite.normalizeEncounterIdentity({number:"#580",name:"Pokemon",form:"Galar",shiny:false});
 assert.notEqual(sprite.verifiedBase(special),true);
});

test("DOM collector can distinguish five visitor cards from their common ancestor",()=>{
 assert.match(probe,/const controls=Array\.from\(node\.querySelectorAll/);
 assert.match(probe,/controls\.length<=2&&dexLabels\.length<=1/);
 assert.match(probe,/Showing\\s\+\(\\d\+\)\\s\+\(\?:spawns\?\|results\?\)/);
 assert.match(probe,/const siteIncomplete=expectedVisible>found\.length/);
 assert.match(probe,/if\(encounterDex===129\)title="Magikarp"/);
 assert.match(probe,/if\(encounterDex===580\)title="Ducklett"/);
});

test("AUTO uses 3 minutes by default; 3-second preset cannot be reselected",()=>{
 assert.match(service,/intervalMinutes=3,menuPadDp=0/);
 assert.match(service,/autoRefreshDelayMs\(\)\{return Math\.max\(0L,intervalMinutes\)\*60000L/);
 assert.match(service,/if\(intervalMinutes==-3\)\{/); // migration only
 assert.match(service,/int\[\] options=\{0,3,5,10,15,20\}/);
 assert.doesNotMatch(dock,/for\(const value of \[-3,/);
 assert.match(dock,/for\(const value of \[3,5,10,15,20\]\)/);
 assert.match(dock,/function manualRefreshTap\(\)\{/);
 assert.match(dock,/Native\.refresh\(\);/);
 assert.match(service,/OverlayService\.this\.refresh\(true\);/);
 assert.match(service,/apiProviderBackoffUntil\(\)>0L/); // preserve HTTP 429
});

test("Cards are concise and visitor unlock is transparent and true to source",()=>{
 assert.match(detail,/const evidenceHtml="";/);
 assert.doesNotMatch(detail,/evidence\.details\.slice\(1\)/);
 assert.match(dock,/background:transparent!important;color:#d9eaf9!important/);
 assert.match(dock,/class="guestUnlockCount">\+5<\/span>/);
 assert.match(dock,/guestLimited&&cards\.length>0&&!resultsStale/);
 assert.match(dock,/normalizeEncounterIdentity\?\.\(card\)/);
 assert.match(detail,/normalizeEncounterIdentity\?\.\(c\)/);
});

"use strict";
/* LT325 real results-list evidence: the shipping dock.html in Chromium.
 * Synthetic encounters are used for layout only, never actual PvE rankings.
 * This is not physical Android certification or a source API check.
 */
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const output=process.env.LT325_VISUAL_OUTPUT||
 path.join(process.cwd(),"visual-evidence-lt325");
fs.mkdirSync(output,{recursive:true});
const url="file://"+path.resolve(__dirname,"../src/main/assets/dock.html")+"?results=1";
const sizes=[{name:"P",w:200,h:590,sprite:35},
 {name:"M",w:240,h:740,sprite:45},
 {name:"G",w:320,h:860,sprite:55}];
const sourceLabel="S-Tier-Devs/pogo-db-api · dados de referência (ago/2026)";
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const sz of sizes){
   const page=await browser.newPage({viewport:{width:sz.w,height:sz.h},
    deviceScaleFactor:1,isMobile:true,hasTouch:true});
   const errors=[];let extraRaidRequests=0;
   page.on("pageerror",e=>errors.push(String(e)));
   page.on("request",r=>{if(r.url().includes("pogo-db-api"))extraRaidRequests++;});
   await page.addInitScript(()=>{
    window.Native=new Proxy({},{get:()=>()=>undefined});
   });
   await page.goto(url,{waitUntil:"load"});
   const initial=await page.evaluate(({sprite,height})=>{
    if(typeof draw!=="function"||
       typeof window.receiveVerifiedRaidEvidence!=="function"||
       !window.PokeSearchValueDetector||!window.PokeSearchResultEvidence)
     return {ok:false,reason:"JS production module unavailable"};
    const until=Date.now()+240000;
    cards=[
     {sourceIndex:1,name:"Eevee",number:"#133",iv:"15/15/15",ivPercent:"100",
      cp:"321",expiresAtMs:until,evidenceVerified:true,
      evidencePartial:false,evidenceSource:"api",form:"",costume:"",location:"Test City"},
     {sourceIndex:2,name:"Gengar",number:"#94",iv:"",ivPercent:"",
      cp:"1200",expiresAtMs:until,evidenceVerified:true,
      evidencePartial:false,evidenceSource:"site",form:"",costume:"",location:"Test City"},
     {sourceIndex:3,name:"Pidgey",number:"#16",iv:"1/2/3",ivPercent:"13",
      cp:"100",expiresAtMs:until,evidenceVerified:true,
      evidencePartial:true,evidenceSource:"site",form:"",costume:"",location:"Test City"}
    ];
    shownMode="raw";mode="raw";row=sprite+2;spriteSize=sprite;
    showTimers=false;showResultText=true;resultsStale=false;searchActive=false;
    resultDisplayHeightDp=height;
    resultDisplayOptions={count:false,name:false,number:false,gender:false,
     size:false,form:false,moves:false,location:false,distance:false,shiny:false,
     cp:false,level:false,despawn:false,iv:false,rawIv:false,
     overallRank:false,speciesIvRank:false,overallRankGl:false,
     overallRankUl:false,overallRankMl:false,
     speciesIvRankGl:false,speciesIvRankUl:false,speciesIvRankMl:false};
    lastListKey="";draw();
    return {ok:true,spawns:document.querySelectorAll("#spawns .spawn").length,
     values:document.querySelectorAll("#spawns .resultValueFlag").length,
     partial:document.querySelectorAll("#spawns .resultEvidenceFlag.partial").length};
   },{sprite:sz.sprite,height:sz.h});
   assert.ok(initial.ok,"actual results WebView loads "+sz.name+" "+JSON.stringify(initial));
   assert.equal(initial.spawns,3,"three real sprite containers "+sz.name);
   assert.equal(initial.values,1,"verified perfect visible once "+sz.name);
   assert.equal(initial.partial,1,"partial source is visibly marked "+sz.name);

   const combined=await page.evaluate(source=>{
    const current=cards[1];
    const verified={verified:true,projected:false,variant:"normal",
     name:"Gengar",number:94,rank:12,type:"ghost",typePt:"Fantasma",
     source,ivIndependent:true};
    const denied=window.receiveVerifiedRaidEvidence(1,{...current,name:"Haunter"},verified);
    const accepted=window.receiveVerifiedRaidEvidence(1,{...current},verified);
    const flags=[...document.querySelectorAll("#spawns .resultValueFlag")];
    const allInside=flags.every(el=>{
     const outer=el.closest(".spriteStage").getBoundingClientRect();
     const r=el.getBoundingClientRect();
     return r.width>0&&r.height>0&&
      r.left>=outer.left-1&&r.top>=outer.top-1&&
      r.right<=outer.right+1&&r.bottom<=outer.bottom+1;
    });
    const boxes=[...document.querySelectorAll("#spawns .spawn")];
    const usable=boxes.every(x=>{
     const b=x.getBoundingClientRect();
     return b.width>=30&&b.height>=30&&b.width<=window.innerWidth;
    });
    return {denied,accepted,flags:flags.length,
     raiders:document.querySelectorAll(".resultValueFlag.raid").length,
     warnings:document.querySelectorAll(".resultEvidenceFlag.partial").length,
     aria:boxes[1].getAttribute("aria-label"),allInside,usable,
     bodyScroll:document.documentElement.scrollWidth,windowWidth:window.innerWidth};
   },sourceLabel);
   assert.equal(combined.denied,false,"wrong identity rejected "+sz.name);
   assert.equal(combined.accepted,true,"same encounter accepted "+sz.name);
   assert.equal(combined.flags,2,"at most one value marker per encounter "+sz.name);
   assert.equal(combined.raiders,1,"rank PvE badge reused without new fetch "+sz.name);
   assert.equal(combined.warnings,1,"partial evidence remains visible "+sz.name);
   assert.match(combined.aria,/Raides · #12 Fantasma/);
   assert.match(combined.aria,/não são os IVs capturados/);
   assert.ok(combined.allInside,"markers stay inside the P/M/G sprite "+sz.name);
   assert.ok(combined.usable,"tiles keep legible, touchable geometry "+sz.name);
   assert.ok(combined.bodyScroll<=sz.w+4,
    "no horizontal page clipping "+sz.name+" "+JSON.stringify(combined));
   await page.screenshot({path:path.join(output,sz.name+"-lt325-confiabilidade-raide.png")});

   const stale=await page.evaluate(()=>{
    resultsStale=true;draw();
    return {value:document.querySelectorAll("#spawns .resultValueFlag").length,
     old:document.querySelectorAll("#spawns .resultEvidenceFlag.previous").length};
   });
   assert.deepEqual(stale,{value:0,old:3},
    "old search removes all value markers without extra row "+sz.name);

   const invalidated=await page.evaluate(()=>{
    resultsStale=false;
    cards[1]={...cards[1],name:"Gastly"};
    lastListKey="";draw();
    const raid=document.querySelectorAll("#spawns .resultValueFlag.raid").length;
    cards[0]={...cards[0],expiresAtMs:Date.now()-1000};
    lastListKey="";draw();
    return {raid,values:document.querySelectorAll("#spawns .resultValueFlag").length,
     expired:document.querySelectorAll("#spawns .resultEvidenceFlag.expired").length};
   });
   assert.deepEqual(invalidated,{raid:0,values:0,expired:1},
    "changed identity and expiry cannot retain value markers "+sz.name);
   assert.equal(extraRaidRequests,0,"results have no new remote Raid fetch "+sz.name);
   assert.deepEqual(errors,[],"no production JS error "+sz.name);
   console.log("LT325 results visual "+sz.name+" PASS",combined);
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

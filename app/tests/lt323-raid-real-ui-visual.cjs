"use strict";
/* LT323 real shipping detail.html in headless Chromium, not a mock HTML card.
 * Covers P/M/G geometry, user taps, collapsed metrics, row switching,
 * additional ranks and honest missing sprites. Not Samsung certification.
 */
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const out=process.env.LT323_VISUAL_OUTPUT||
 path.join(process.cwd(),"visual-evidence-lt323");
fs.mkdirSync(out,{recursive:true});
const url="file://"+path.resolve(__dirname,"../src/main/assets/detail.html");
const sizes=[
 {name:"P",w:200,h:590},{name:"M",w:240,h:740},
 {name:"G",w:320,h:860}
];
const rows=[
 {name:"Gengar",number:94,variant:"normal",type:"ghost",typePt:"Fantasma",
  rank:12,score:37.46,dps:24.36,tdo:604.18,
  fast:"SHADOW_CLAW_FAST",charged:"SHADOW_BALL",elite:false},
 {name:"Mega Gengar",number:94,variant:"mega",projected:true,
  type:"ghost",typePt:"Fantasma",rank:2,score:57.01,dps:31.10,tdo:724.60,
  fast:"SHADOW_CLAW_FAST",charged:"SHADOW_BALL",elite:true},
 {name:"Zamazenta Escudo Coroado",number:889,variant:"normal",type:"steel",
  typePt:"Aço",rank:21,score:45.92,dps:27.1,tdo:954.3,
  fast:"METAL_CLAW_FAST",charged:"IRON_HEAD",elite:false},
 {name:"Mega Mewtwo X",number:150,variant:"mega",projected:true,
  type:"fighting",typePt:"Lutador",rank:5,score:54.34,dps:40.15,tdo:900,
  fast:"PSYCHO_CUT_FAST",charged:"PSYCHIC",elite:false},
 {name:"Gengar",number:94,variant:"shadow",projected:true,type:"ghost",
  typePt:"Fantasma",rank:8,score:44,dps:31,tdo:500,
  fast:"SHADOW_CLAW_FAST",charged:"SHADOW_BALL",elite:false}
];
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const sz of sizes){
   const page=await browser.newPage({viewport:{width:sz.w,height:sz.h},
    deviceScaleFactor:1,isMobile:true,hasTouch:true});
   const errors=[];
   page.on("pageerror",e=>errors.push(e.message));
   await page.addInitScript(()=>{
    window.__lt323Resizes=[];
    window.Native=new Proxy({}, {get(_target,key){
     if(key==="resizeDetail")
      return height=>window.__lt323Resizes.push(Number(height));
     return ()=>undefined;
    }});
   });
   await page.goto(url,{waitUntil:"load"});
   const enabled=await page.evaluate(input=>{
    if(typeof renderRaidPreview!=="function")return false;
    psRaidReport={verified:true,best:input[0],rows:input,
     source:"S-Tier-Devs/pogo-db-api · snapshot de referência"};
    psRaidExpanded=true;
    renderRaidPreview();
    return !document.getElementById("raidPanel").hidden;
   },rows);
   assert.equal(enabled,true,"Raid panel opens in real HTML "+sz.name);
   const initial=await page.evaluate(()=>{
    const p=document.getElementById("raidPanel");
    const all=[...p.querySelectorAll(".psRaidRow")];
    const buttons=[...p.querySelectorAll(".psRaidIdentityButton")];
    return {rowCount:all.length,buttonCount:buttons.length,
     visibleButtons:buttons.filter(e=>e.getBoundingClientRect().width>0).length,
     openMetrics:p.querySelectorAll(".psRaidMetrics:not([hidden])").length,
     firstRank:buttons[0].textContent,firstType:all[0].querySelector(".psRaidTypeRank")?.textContent,
     repeatedIdentity:p.querySelectorAll(".psRaidSprite,.psRaidDex,.psRaidName").length,
     panelWidth:p.clientWidth,scrollWidth:p.scrollWidth,
     requestedResizes:window.__lt323Resizes.length};
   });
   assert.equal(initial.rowCount,5);
   assert.equal(initial.buttonCount,5);
   assert.equal(initial.visibleButtons,3,"extra rankings start collapsed "+sz.name);
   assert.equal(initial.openMetrics,0,"collapsed metrics by default "+sz.name);
   assert.match(initial.firstRank,/#12/);
   assert.match(initial.firstType,/#12/);
   assert.equal(initial.repeatedIdentity,0,"no main-card identity repeated in the raid rows");
   assert.ok(initial.scrollWidth<=initial.panelWidth+3,
    "no initial horizontal scrolling "+sz.name+" "+JSON.stringify(initial));
   await page.screenshot({path:path.join(out,sz.name+"-raid-collapsed.png")});
   const first=page.locator("#raidPanel .psRaidIdentityButton").first();
   await first.click();
   const opened=await page.evaluate(()=>{
    const p=document.getElementById("raidPanel");
    const metrics=p.querySelector("#psRaidMetrics-0");
    const b=p.querySelector(".psRaidIdentityButton");
    const values=[...metrics.querySelectorAll(".psRaidMetric b")].map(e=>e.textContent);
    const cells=[...metrics.querySelectorAll(".psRaidMetric")].map(e=>e.getBoundingClientRect());
    const outer=metrics.getBoundingClientRect();
    return {visible:!metrics.hidden,expanded:b.getAttribute("aria-expanded"),
     values,outer:{left:outer.left,right:outer.right,width:outer.width},
     cellWidths:cells.map(x=>x.width),viewWidth:window.innerWidth,
     scrollWidth:p.scrollWidth,clientWidth:p.clientWidth,
     resizeCalls:window.__lt323Resizes.length};
   });
   assert.equal(opened.visible,true);
   assert.equal(opened.expanded,"true");
   assert.deepEqual(opened.values,["37,5","24,4","604,2"]);
   assert.ok(opened.outer.left>=0&&opened.outer.right<=sz.w+2,
    "metrics remain inside card "+sz.name+" "+JSON.stringify(opened));
   assert.ok(opened.cellWidths.every(w=>w>=30),
    "metric values legible in P/M/G "+sz.name+" "+JSON.stringify(opened));
   assert.ok(opened.scrollWidth<=opened.clientWidth+3,
    "no horizontal metric overflow "+sz.name+" "+JSON.stringify(opened));
   await page.screenshot({path:path.join(out,sz.name+"-raid-metrics.png")});
   await page.locator("#raidPanel .psRaidIdentityButton").nth(1).click();
   const switched=await page.evaluate(()=>{
    const p=document.getElementById("raidPanel");
    return [0,1].map(i=>({
     hidden:p.querySelector("#psRaidMetrics-"+i).hidden,
     expanded:p.querySelectorAll(".psRaidIdentityButton")[i].getAttribute("aria-expanded")
    }));
   });
   assert.equal(switched[0].hidden,true);
   assert.equal(switched[1].hidden,false);
   await page.locator("#raidPanel .psRaidIdentityButton").nth(1).click();
   assert.equal(await page.locator("#psRaidMetrics-1").evaluate(el=>el.hidden),true);
   await page.locator("#raidPanel .psRaidMore > summary").click();
   await page.locator("#raidPanel .psRaidIdentityButton").nth(3).click();
   const extra=await page.evaluate(()=>{
    const p=document.getElementById("raidPanel");
    const opened=p.querySelector("#psRaidMetrics-3");
    const group=p.getBoundingClientRect();
    return {expanded:!opened.hidden,visible:p.querySelector(".psRaidMore").open,
     panelWidth:p.clientWidth,scrollWidth:p.scrollWidth,
     viewWidth:window.innerWidth,metricsRight:opened.getBoundingClientRect().right,
     panelRight:group.right,hasSource:!!p.getAttribute("data-ps-source"),
     hasShadowSprite:!!p.querySelectorAll(".psRaidRow")[4].querySelector(".psRaidSprite"),
     offenders:[...p.querySelectorAll("*")].map(el=>({
      tag:el.tagName,cls:String(el.className||"").slice(0,60),
      right:Math.round(el.getBoundingClientRect().right),
      width:Math.round(el.getBoundingClientRect().width),
      sw:el.scrollWidth,cw:el.clientWidth
     })).filter(x=>x.right>p.getBoundingClientRect().right+3||x.sw>x.cw+40)
      .sort((a,b)=>b.right-a.right).slice(0,8)};
   });
   assert.ok(extra.expanded&&extra.visible&&extra.hasSource);
   assert.equal(extra.hasShadowSprite,false,"no unverified Shadow sprite "+sz.name);
   assert.ok(extra.metricsRight<=extra.panelRight+2&&extra.scrollWidth<=extra.panelWidth+3,
    "extra ranking no horizontal clip "+sz.name+" "+JSON.stringify(extra));
   await page.screenshot({path:path.join(out,sz.name+"-raid-more-metrics.png")});
   // LT324: real screenshot reproduction — Togedemaru has two type rankings.
   // Both rows must keep the Dex below the name, while Charged is never
   // separated from its label by an accidental line break.
   const toge=[
    {name:"Togedemaru",number:777,variant:"normal",rank:58,
     type:"electric",typePt:"Elétrico",score:20.2,dps:16.9,tdo:388,
     fast:"THUNDER_SHOCK_FAST",charged:"WILD_CHARGE",elite:false},
    {name:"Togedemaru",number:777,variant:"normal",rank:94,
     type:"steel",typePt:"Aço",score:15.7,dps:12.4,tdo:400,
     fast:"THUNDER_SHOCK_FAST",charged:"GYRO_BALL",elite:false}
   ];
   await page.evaluate(input=>{
    psRaidReport={verified:true,best:input[0],rows:input,
     source:"S-Tier-Devs/pogo-db-api · referência"};
    psRaidExpanded=true;renderRaidPreview();
   },toge);
   const samsung=await page.evaluate(()=>{
    const p=document.getElementById("raidPanel");
    const measurements=[...p.querySelectorAll(".psRaidRow")].map(row=>{
     const fast=row.querySelector('.psRaidMoveNames>span[title="Ataque Ágil"]')?.getBoundingClientRect();
     const charged=row.querySelector('.psRaidMoveNames>span[title="Ataque Carregado"]')?.getBoundingClientRect();
     const rank=row.querySelector(".psRaidTypeRank")?.getBoundingClientRect();
     const button=row.querySelector(".psRaidIdentityButton")?.getBoundingClientRect();
     return {
      rankInsideButton:!!rank&&!!button&&rank.left>=button.left-1&&rank.right<=button.right+1,
      names:[...row.querySelectorAll(".psRaidMoveNames>span[title]")].map(el=>el.textContent),
      fastTop:fast?.top,chargedTop:charged?.top,
      rankText:row.querySelector(".psRaidTypeRank")?.textContent,
      accessible:row.querySelector(".psRaidIdentityButton")?.getAttribute("aria-label")
     };
    });
    return {measurements,clientWidth:p.clientWidth,scrollWidth:p.scrollWidth,
     repeated:p.querySelectorAll(".psRaidSprite,.psRaidDex,.psRaidSpecies,.psRaidName").length,
     projected:p.querySelectorAll(".psRaidFormLabel").length,
     openMetrics:p.querySelectorAll(".psRaidMetrics:not([hidden])").length};
   });
   assert.equal(samsung.measurements.length,2);
   assert.equal(samsung.repeated,0,
    "species, sprite and number are already in main card "+sz.name);
   assert.equal(samsung.projected,0,
    "same Togedemaru must not be re-labelled for electric and steel");
   assert.ok(samsung.measurements.every(r=>r.rankInsideButton),
    "touch must remain on type rank "+sz.name+" "+JSON.stringify(samsung));
   assert.ok(samsung.measurements.every(r=>r.names.length===2));
   assert.ok(samsung.measurements[0].rankText.includes("#58"));
   assert.ok(samsung.measurements[1].rankText.includes("#94"));
   assert.ok(samsung.measurements.every(r=>r.accessible.includes("Togedemaru")),
    "screen-reader keeps the Pokemon identity even though it is not repeated visually");
   assert.equal(samsung.openMetrics,0,"Togedemaru remains compact before tap");
   assert.ok(samsung.scrollWidth<=samsung.clientWidth+3,
    "Togedemaru no horizontal clipping "+sz.name+" "+JSON.stringify(samsung));
   if(sz.w<=240)assert.ok(samsung.measurements.every(r=>r.chargedTop>r.fastTop),
    "narrow device keeps Charged as a complete second item "+sz.name);
   await page.screenshot({path:path.join(out,sz.name+"-lt324-togedemaru.png")});
   assert.deepEqual(errors,[],"JS runtime errors "+sz.name);
   console.log("LT323 visual P/M/G PASS",sz.name,
    {width:sz.w,initial:initial.rowCount,metrics:opened.values,
     expandedAdditional:extra.expanded,resizes:opened.resizeCalls});
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

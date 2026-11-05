"use strict";
/* LT253 browser screenshot gate: actual shipping detail.html/CSS and offline
 * gamemaster, not a fake hand-drawn card. Browser != physical Samsung WebView. */
const {chromium}=require("playwright");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const output=process.env.LT253_VISUAL_OUTPUT||
 path.join(process.cwd(),"visual-evidence-lt253");
fs.mkdirSync(output,{recursive:true});
const source="file://"+path.resolve(__dirname,"../src/main/assets/detail.html");
const sizes=[{name:"P",w:200,h:590},{name:"M",w:240,h:740},
 {name:"G",w:320,h:860}];
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const sz of sizes){
   const page=await browser.newPage({viewport:{width:sz.w,height:sz.h},
    deviceScaleFactor:1,isMobile:true,hasTouch:true});
   const errors=[];page.on("pageerror",e=>errors.push(String(e)));
   await page.addInitScript(()=>{
    window.__nativeResizes=[];
    window.Native=new Proxy({}, {get(_target,key){
     if(key==="resizeDetail")return n=>window.__nativeResizes.push(n);
     return ()=>undefined;
    }});
   });
   await page.goto(source,{waitUntil:"load"});
   const ready=await page.evaluate(()=>{
    if(typeof openDetailMetric!=="function"||
      !window.POKESEARCH_PVP_IV_DATA?.pokemon?.length)return false;
    // The actual simulator consumes the bundled Game Master, not a mock.
    metricCard={name:"Sableye",iv:"0/15/12",ivValid:true,cp:257,level:7};
    window.psRankContext={name:"Sableye",iv:"0/15/12",
     familyForms:["Sableye","Mega Sableye"],
     leagues:[{league:"gl",own:{rank:14,cp:1493,level:50},
      evolutions:[],megas:[{name:"Mega Sableye",rank:1,
       megaProjection:true,referenceOnly:true,cp:1499,level:30}]},
      {league:"ul",own:{rank:230,cp:1874,level:50},evolutions:[],megas:[]},
      {league:"ml",own:{rank:230,cp:1874,level:50},evolutions:[],megas:[]}]};
    return openDetailMetric("cp");
   });
   assert.equal(ready,true,"calculator must open "+sz.name);
   await page.waitForTimeout(160);
   await page.screenshot({path:path.join(output,sz.name+"-calc-top.png")});
   const top=await page.evaluate(()=>{
    const panel=document.getElementById("panel"),
     inner=document.getElementById("psMetricPanel");
    const width=window.innerWidth;
    const selectors=["#psCpForm","#psCpLevel","#psCpTargetCp",
      ".psCpIvInputs input",".psCpPresets button","#psCpSimResult"];
    const bad=[];
    for(const selector of selectors)
     for(const el of document.querySelectorAll(selector)){
      const r=el.getBoundingClientRect();
      if(r.width<1||r.left< -2||r.right>width+2)
       bad.push({selector,left:r.left,right:r.right,width:r.width});
     }
    return {bad,scrollHeight:panel.scrollHeight,clientHeight:panel.clientHeight,
     sliderWidth:document.querySelector("#psCpLevel").getBoundingClientRect().width,
     minIvInputWidth:Math.min(...Array.from(document.querySelectorAll(".psCpIvInputs input"),e=>e.getBoundingClientRect().width)),
     formWidth:document.querySelector("#psCpForm").getBoundingClientRect().width,
     internalMax:getComputedStyle(inner).maxHeight,
     nativeResizes:window.__nativeResizes.length};
   });
   assert.deepEqual(top.bad,[],"no clipped calculator controls "+sz.name);
   assert.equal(top.internalMax,"none","no clipped nested panel "+sz.name);
   assert.ok(top.sliderWidth>=55&&top.formWidth>=60&&top.minIvInputWidth>=24,
    "usable level slider / form selector / A-B IV inputs "+sz.name+" "+JSON.stringify(top));
   assert.ok(top.nativeResizes>=1,"native resize requested "+sz.name);
   await page.evaluate(()=>{
    const panel=document.getElementById("panel");
    panel.scrollTop=panel.scrollHeight;
   });
   await page.waitForTimeout(70);
   await page.screenshot({path:path.join(output,sz.name+"-calc-bottom.png")});
   const bottom=await page.evaluate(()=>{
    const panel=document.getElementById("panel");
    const footer=document.querySelector("#psMetricPanel .psCpSimFoot");
    const foot=footer.getBoundingClientRect();
    return {lastVisible:foot.bottom<=window.innerHeight+3,
     footTop:foot.top,footBottom:foot.bottom,viewport:window.innerHeight,
     scrolled:panel.scrollTop};
   });
   assert.ok(bottom.lastVisible,"last calculator line reachable "+sz.name+
    " "+JSON.stringify(bottom));
   // Render the ACTUAL compact Mega chip and inspect icon ordering.
   const mega=await page.evaluate(()=>{
    const payload={name:"Sableye",iv:"0/15/12",cp:"257",sourceIndex:1,
     searchLeague:"gl",searchRankLimit:1,
     leagues:[{league:"gl",own:{rank:14,overallRank:37},
       evolutions:[],megas:[{name:"Mega Sableye",rank:1,
        megaProjection:true,referenceOnly:true}]},
      {league:"ul",own:null,evolutions:[],megas:[]},
      {league:"ml",own:null,evolutions:[],megas:[]}]};
    activeRankLeague="gl";window.psRankContext=payload;
    const ok=updateVisiblePvPRank(payload);
    const icon=document.querySelector("#rankLine .psCompactMegaEmblem");
    const name=document.querySelector("#rankLine .psCompactSpeciesName");
    const rank=document.querySelector("#rankLine");
    if(!ok||!icon||!name)return {ok:false};
    const a=icon.getBoundingClientRect(),b=name.getBoundingClientRect(),r=rank.getBoundingClientRect();
    return {ok:true,before:a.left<=b.left,
      text:name.textContent,within:r.right<=window.innerWidth+2,
      labelFits:name.scrollWidth<=name.clientWidth+2};
   });
   assert.ok(mega.ok&&mega.before&&mega.within&&mega.labelFits&&mega.text==="Sableye",
    "compact Mega emblem before unclipped name "+sz.name+" "+JSON.stringify(mega));
   await page.evaluate(()=>{document.getElementById("panel").scrollTop=0;});
   await page.screenshot({path:path.join(output,sz.name+"-mega-rank.png")});
   // LT254: run actual attack-card renderer on the same shipping detail HTML.
   const moves=await page.evaluate(async()=>{
    document.querySelector("#psMetricPanel").hidden=true;
    document.querySelector("#panel").classList.remove("metricOpen");
    document.getElementById("evolutions").hidden=true;
    const rank=document.getElementById("rankLine");
    rank.hidden=false;rank.dataset.league="gl";rank.textContent="GL IV #1";
    currentRankSpecies="Bulbasaur";currentCardMoves="Tackle / Power Whip";
    window.PokeSearchPvpRankMoves={lookup:async()=>({
     source:"PvPoke · verificável",availableOnly:false,
     fast:{name:"Chicote de Vinha",status:"normal",type:"grass",
      stats:{power:5,energyGain:8}},
     charged:[
      {name:"Chicote Poderoso",status:"normal",type:"grass",stats:{power:90,energyCost:50}},
      {name:"Bomba de Sementes",status:"normal",type:"grass",stats:{power:55,energyCost:40}}
     ]})};
    renderRankOneMoves();
    const action=rank.querySelector(".psMovesAction");
    if(!action)return {ok:false,why:"missing action"};
    await action.onclick();
    const pop=document.getElementById("movesPopover");
    const rows=Array.from(pop.querySelectorAll(".psMoveRow"));
    return {ok:!pop.hidden&&rows.length===3&&action.textContent==="⚡"&&
      pop.scrollWidth<=pop.clientWidth+3,
      icon:action.textContent,width:pop.scrollWidth,client:pop.clientWidth,
      rows:rows.map(row=>{
       const label=row.querySelector(".psMoveLabel").getBoundingClientRect(),
        name=row.querySelector(".psMoveName").getBoundingClientRect();
       return {labelRight:label.right,nameLeft:name.left,
        nameWidth:name.width,labelText:row.querySelector(".psMoveLabel").textContent}
      })};
   });
   assert.ok(moves.ok&&moves.rows.every(row=>row.nameLeft>=row.labelRight-2&&row.nameWidth>=70),
    "recommended attacks C1/C2 do not wrap into separate labels "+sz.name+" "+JSON.stringify(moves));
   await page.screenshot({path:path.join(output,sz.name+"-moves-compact.png")});
   // Mega has a separate source-pinned ranking. It must NEVER visually
   // inherit the base species' second Charged Attack (Power Gem vs Dazzling Gleam).
   const megaMoves=await page.evaluate(async()=>{
    let wrongBase=0,megaCalls=0;
    currentRankSpecies="Mega Sableye";
    const rank=document.getElementById("rankLine");
    rank.dataset.league="gl";rank.textContent="🔵 GL IV #1 ↳ Sableye";
    window.psRankContext={leagues:[{league:"gl",megas:[
      {name:"Mega Sableye",megaProjection:true,rank:1}]}]};
    window.PokeSearchPvpRankMoves={
      lookup:async()=>{wrongBase++;return {source:"BASE (não autorizado)"}},
      lookupMega:async()=>{megaCalls++;return {
       source:"PvPoke Mega Edition 03/11/2026",megaRecommendation:true,format:"mega",
       fast:{name:"Garra Sombria",type:"ghost",status:"normal",localeVerified:true},
       charged:[
        {name:"Jogo Sujo",type:"dark",status:"normal",localeVerified:true},
        {name:"Clarão Deslumbrante",type:"fairy",status:"normal",localeVerified:true}]
      }}
    };
    renderRankOneMoves();
    const action=rank.querySelector(".psMovesAction");
    if(!action)return {ok:false,why:"missing Mega action"};
    await action.onclick();
    const pop=document.getElementById("movesPopover"),html=pop.innerHTML;
    const result={ok:!pop.hidden&&action.textContent==="⚡"&&
      megaCalls===1&&wrongBase===0&&html.includes("Megaedição")&&
      html.includes("Clarão Deslumbrante")&&!html.includes("Gema Poderosa"),
      width:pop.scrollWidth,client:pop.clientWidth,
      megaCalls,wrongBase,content:pop.textContent.slice(0,90)};
    result.ok=result.ok&&pop.scrollWidth<=pop.clientWidth+3;
    return result;
   });
   assert.ok(megaMoves.ok,
    "Mega Sableye uses Mega Edition and never normal Power Gem "+sz.name+
    " "+JSON.stringify(megaMoves));
   await page.screenshot({path:path.join(output,sz.name+"-mega-moves.png")});
   assert.deepEqual(errors,[],"no browser runtime errors "+sz.name);
   console.log("LT253 visual "+sz.name+" PASS",
    {width:sz.w,height:sz.h,scroll:top.scrollHeight,
     bottomReachable:bottom.lastVisible,mega:mega.text});
   await page.close();
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

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
    const selectors=["#psCpFormMenu > summary","#psCpLevel","#psCpTargetCp",
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
     formWidth:document.querySelector("#psCpFormMenu > summary").getBoundingClientRect().width,
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
   // LT255 actual tap regression: no PvP response, yet the Teddiursa family
   // must be browsable entirely offline at all three compact sizes.
   const tedReady=await page.evaluate(()=>{
    metricCard={name:"Teddiursa",iv:"0/14/15",ivValid:true,cp:478,level:14,
     costumeId:"0",form:"NORMAL",isCostume:false};
    window.psRankContext=null;
    psCpTargetSpecies="";psCpTargetLevel=14;psCpCustomIv=null;
    psCpCompareIv=[15,15,15];metricKind="cp";
    return renderDetailMetric();
   });
   assert.equal(tedReady,true,"Teddiursa calculator opens without online PvP payload "+sz.name);
   const buttons=page.locator("#psMetricPanel .psCpFormList button");
   assert.deepEqual(await buttons.allTextContents(),["Teddiursa","Ursaring","Ursaluna"],
    "all normal family evolutions appear in one dropdown "+sz.name);
   await page.locator("#psCpFormMenu > summary").click();
   const initialCp=await page.locator("#psCpSimResult").innerText();
   assert.ok(initialCp.includes("PC 478"),"real screenshot Teddiursa level 14 "+sz.name);
   await page.locator('#psMetricPanel [data-pscp-form="ursaring"]').click();
   let state=await page.evaluate(()=>({
    value:document.getElementById("psCpForm").value,
    current:document.querySelector("#psCpSimResult").textContent,
    pressed:document.querySelector('.psCpFormList [data-pscp-form="ursaring"]')
     ?.getAttribute("aria-selected"),
    iv:document.getElementById("psCpIvAA").value+"/"+
       document.getElementById("psCpIvAD").value+"/"+
       document.getElementById("psCpIvAS").value,
    scrollWidth:document.getElementById("psMetricPanel").scrollWidth,
    width:document.getElementById("psMetricPanel").clientWidth
   }));
   assert.ok(state.value==="ursaring"&&state.pressed==="true"&&
    state.iv==="0/14/15"&&!state.current.includes("PC 478")&&
    state.scrollWidth<=state.width+3,
    "tap Ursaring keeps IV and recalculates without overflow "+sz.name+" "+JSON.stringify(state));
   await page.locator("#psMetricPanel .psCpFormStepper > button").last().click();
   state=await page.evaluate(()=>({
    value:document.getElementById("psCpForm").value,
    pressed:document.querySelector('.psCpFormList [data-pscp-form="ursaluna"]')
      ?.getAttribute("aria-selected"),
    iv:document.getElementById("psCpIvBA").value+"/"+
       document.getElementById("psCpIvBD").value+"/"+
       document.getElementById("psCpIvBS").value
   }));
   assert.deepEqual(state,{value:"ursaluna",pressed:"true",iv:"15/15/15"},
    "arrow Ursaring to Ursaluna preserves comparison IVs "+sz.name);
   await page.screenshot({path:path.join(output,sz.name+"-teddiursa-ursaluna-switch.png")});
   console.log("LT255 family-switch PASS",sz.name,state);
   // LT257: same user reference — Gastly, Haunter, Gengar Normal, Mega Gengar.
   const gastly=await page.evaluate(()=>{
    metricCard={name:"Gastly",iv:"0/10/10",ivValid:true,cp:471,level:14.5,
     form:"NORMAL",costumeId:"0",isCostume:false};
    window.psRankContext=null;psCpTargetSpecies="";psCpTargetLevel=14.5;
    psCpCustomIv=null;psCpCompareIv=[15,15,15];metricKind="cp";
    return renderDetailMetric();
   });
   assert.equal(gastly,true,"Gastly calculator opens "+sz.name);
   assert.deepEqual(await page.locator("#psCpFormMenu .psCpFormList button").allTextContents(),
    ["Gastly","Haunter","Gengar (Normal)","Gengar (Mega)"],
    "canonical family order and names "+sz.name);
   await page.locator("#psCpFormMenu > summary").click();
   assert.equal(await page.locator("#psCpFormMenu .psCpMegaIcon").count(),1,
    "exactly one verified Mega emblem in the expanded menu "+sz.name);
   const dimensions=await page.evaluate(()=>{
    const list=document.querySelector(".psCpFormList"),
     panel=document.getElementById("psMetricPanel");
    return {width:list.scrollWidth,client:list.clientWidth,
     scroll:panel.scrollWidth,panelWidth:panel.clientWidth,
     listHeight:list.getBoundingClientRect().height};
   });
   assert.ok(dimensions.width<=dimensions.client+2&&
    dimensions.scroll<=dimensions.panelWidth+3&&dimensions.listHeight<=173,
    "expanded dropdown not clipped P/M/G "+sz.name+" "+JSON.stringify(dimensions));
   await page.screenshot({path:path.join(output,sz.name+"-gastly-family-mega-dropdown.png")});
   const gastlyCp=await page.locator("#psCpSimResult").innerText();
   await page.locator('#psCpFormMenu [data-pscp-form="gengar"]').click();
   const gengarCp=await page.locator("#psCpSimResult").innerText();
   await page.locator("#psCpFormMenu > summary").click();
   await page.locator('#psCpFormMenu [data-pscp-form="gengar_mega"]').click();
   const result=await page.evaluate(()=>({
    selected:document.getElementById("psCpForm").value,
    label:document.getElementById("psCpFormLabel").textContent,
    hasIcon:!!document.querySelector("#psCpFormLabel .psCpMegaIcon"),
    closed:!document.getElementById("psCpFormMenu").open,
    cp:document.getElementById("psCpSimResult").textContent,
    ivA:document.getElementById("psCpIvAA").value+"/"+
      document.getElementById("psCpIvAD").value+"/"+
      document.getElementById("psCpIvAS").value,
    ivB:document.getElementById("psCpIvBA").value+"/"+
      document.getElementById("psCpIvBD").value+"/"+
      document.getElementById("psCpIvBS").value
   }));
   assert.ok(result.selected==="gengar_mega"&&result.label==="Gengar (Mega)"&&
     result.hasIcon&&result.closed&&result.ivA==="0/10/10"&&
     result.ivB==="15/15/15"&&gastlyCp!==gengarCp&&gengarCp!==result.cp,
    "form selection updates actual PC/PS, not just display "+sz.name+" "+JSON.stringify(result));
   await page.screenshot({path:path.join(output,sz.name+"-mega-gengar-selected.png")});
   console.log("LT257 Gastly→Gengar Mega dropdown PASS",sz.name);

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
   // LT270: actual shipping HTML with five badges and a real RG league change.
   const rail270=await page.evaluate(()=>{
    const payload={name:"Teddiursa",iv:"0/14/15",
     leagues:[
      {league:"gl",own:{rank:200,overallRank:500},
       evolutions:[{name:"Ursaluna",rank:12,overallRank:142,eligible:true}]},
      {league:"ul",own:{rank:5,overallRank:220},evolutions:[]},
      {league:"ml",own:{rank:1,overallRank:311},evolutions:[]}
     ]};
    activeRankLeague="gl";window.psRankContext=payload;
    const ok=psRenderFiveRankRail(payload),rail=document.getElementById("rankLine");
    const b=Array.from(rail.querySelectorAll("button"));
    const evol=b[1]?.querySelector(".psRailEvolve"),flag=b[1]?.querySelector(".psRailIcon");
    const number=b[1]?.querySelector(".psRailNumber"),cardBox=b[1]?.getBoundingClientRect();
    const eBox=evol?.getBoundingClientRect(),fBox=flag?.getBoundingClientRect();
    const nBox=number?.getBoundingClientRect();
    const badge=eBox&&cardBox&&nBox&&fBox?{
     src:evol.getAttribute("src"),tag:evol.tagName,span:eBox.width,
     right:cardBox.right-eBox.right,bottom:cardBox.bottom-eBox.bottom,
     clearOfFlag:!((eBox.left<fBox.right+1)&&(eBox.right>fBox.left-1)&&
      (eBox.top<fBox.bottom+1)&&(eBox.bottom>fBox.top-1)),
     belowRank:eBox.top>=nBox.bottom+2,
     flagCenterDiff:Math.abs((fBox.left+fBox.right-cardBox.left-cardBox.right)/2),
     flagSrc:flag.getAttribute("src")
    }:null;
    return {ok,badge,count:b.length,labels:b.slice(0,5).map(x=>x.querySelector(".psRailNumber")?.textContent),
     names:b.slice(0,5).map(x=>x.dataset.psName),
     evolves:!!b[1]?.querySelector(".psRailEvolve"),
     icons:b.slice(0,5).map(x=>x.querySelector(".psRailIcon")?.getAttribute("src")||""),
     width:rail.scrollWidth,client:rail.clientWidth,
     clipped:b.some(x=>x.getBoundingClientRect().right>rail.getBoundingClientRect().right+1)};
   });
   assert.ok(rail270.ok&&rail270.count===5&&rail270.evolves&&!rail270.clipped&&
    rail270.width<=rail270.client+2&&
    JSON.stringify(rail270.labels)==='["—","#12","#5","#1","#142"]'&&
    rail270.names[1]==="Ursaluna"&&
    rail270.icons.every(x=>x.includes("lt268.png"))&&
    rail270.badge?.src==="ui-icons/ps-evolution-lt272.png"&&
    // LT274: retain the original 13px/15px image with a 5px inset.
    // Bounding-box intersections with a triangular flag's transparent corner
    // are acceptable; the flag itself stays centered at its original size.
    rail270.badge?.tag==="IMG"&&
    rail270.badge?.span>=13&&rail270.badge?.span<=15&&
    rail270.badge?.right>=4&&rail270.badge?.bottom>=4&&
    rail270.badge?.belowRank===true&&rail270.badge?.flagCenterDiff<1.5&&
    rail270.badge?.flagSrc==="ui-icons/ps-gl-lt268.png",
    "LT270 five actual buttons must fit P/M/G "+sz.name+" "+JSON.stringify(rail270));
   await page.screenshot({path:path.join(output,sz.name+"-lt270-five-ranks.png")});
   const overall270=await page.evaluate(()=>{
    const general=document.querySelector("#rankLine .psRailGeneral");
    if(!general||general.disabled)return {ok:false,reason:"RG disabled"};
    general.click();
    const picker=document.querySelector('#psRankExplorer button[data-ps-act="league-menu"]');
    if(!picker)return {ok:false,reason:"missing native-free selector"};
    picker.click();
    const menu=document.querySelector("#psrLeagueOptions");
    if(!menu||menu.hidden)return {ok:false,reason:"league options not opened"};
    const choose=menu.querySelector('button[data-ps-act="league-pick"][data-league="ul"]');
    if(!choose||choose.disabled)return {ok:false,reason:"UL option missing"};
    choose.click();
    const title=document.querySelector("#psRankExplorer .psrTitle")?.textContent||"";
    const species=document.querySelector("#psRankExplorer .psrSub")?.textContent||"";
    const badge=document.querySelector("#rankLine .psRailGeneral .psRailNumber")?.textContent;
    const rows=window.PokeSearchRankExplorer?.getOverallRows?.(window.POKESEARCH_PVPOKE_OVERALL,"ul")||[];
    const actual=rows.find(x=>x.name==="Teddiursa");
    const expected=actual?"#"+actual.rank:"—";
    const aligned=(()=>{
     const controls=document.querySelector("#psRankExplorer .psrTopControls");
     if(!controls||controls.children.length!==3)return false;
     const tops=Array.from(controls.children).map(n=>n.getBoundingClientRect().top);
     return Math.max(...tops)-Math.min(...tops)<2;
    })();
    const hiddenExports=!document.querySelector("#psRankExplorer .psrActions");
    return {ok:title.includes("Ultra Liga")&&species.includes("Teddiursa")&&badge===expected&&aligned&&hiddenExports,
     title,species,badge,expected};
   });
   assert.ok(overall270.ok,"RG GL/UL/ML selector must switch actual ranking "+
    sz.name+" "+JSON.stringify(overall270));
   await page.screenshot({path:path.join(output,sz.name+"-lt270-rg-ul.png")});
   await page.evaluate(()=>window.PokeSearchRankExplorer?.close?.());
   // LT274: Rank Classe also switches leagues via a real WebView tap.
   // Rank Classe is the 4096 IVs of ONE species; Rank Geral is not modified.
   const class274=await page.evaluate(()=>{
    const engine=window.PokeSearchRankExplorer;
    const gm=window.POKESEARCH_PVP_IV_DATA;
    if(!engine?.open({kind:"class",name:"Sableye",league:"gl",iv:"0/15/12"}))
     return {ok:false,reason:"Rank Classe unavailable"};
    const picker=document.querySelector('#psRankExplorer button[data-ps-act="league-menu"]');
    if(!picker)return {ok:false,reason:"Class league picker missing"};
    picker.click();
    const menu=document.querySelector("#psrLeagueOptions");
    if(!menu||menu.hidden)return {ok:false,reason:"Class league menu did not open"};
    const button=menu.querySelector('button[data-ps-act="league-pick"][data-league="ul"]');
    if(!button||button.disabled)return {ok:false,reason:"UL missing or disabled"};
    button.click();
    const expected=engine.getIvRows(gm,"Sableye","ul")?.find(x=>x.iv==="0/15/12");
    const title=document.querySelector("#psRankExplorer .psrTitle")?.textContent||"";
    const sub=document.querySelector("#psRankExplorer .psrSub")?.textContent||"";
    const selected=document.querySelector("#psRankExplorer tr.psrSelected")?.textContent||"";
    const controls=document.querySelector("#psRankExplorer .psrTopControls");
    const y=Array.from(controls?.children||[],x=>x.getBoundingClientRect().top);
    return {ok:!!expected&&title.includes("Rank Classe")&&title.includes("Sableye")&&
      sub.includes("Ultra Liga")&&sub.includes("0/15/12")&&
      selected.includes("#"+expected.rank)&&
      y.length===3&&Math.max(...y)-Math.min(...y)<2,
     title,sub,selectedRank:expected?.rank,selected:selected.slice(0,95)};
   });
   assert.ok(class274.ok,"LT274 class league GL->UL preserves own IV "+sz.name+
      " "+JSON.stringify(class274));
   await page.screenshot({path:path.join(output,sz.name+"-lt274-class-ul.png")});
   await page.evaluate(()=>window.PokeSearchRankExplorer?.close?.());
   // LT254: run actual attack-card renderer on the same shipping detail HTML.
   const moves=await page.evaluate(async()=>{
    document.querySelector("#psMetricPanel").hidden=true;
    document.querySelector("#panel").classList.remove("metricOpen");
    document.getElementById("evolutions").hidden=false;
    evolutionExpanded=true;psSelectedEvaluationLeague="gl";activeRankLeague="gl";
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
    const action=document.querySelector("#psLeagueMoves .psMovesAction");
    if(!action)return {ok:false,why:"missing action"};
    await action.onclick();
    const pop=document.getElementById("movesPopover");
    const rows=Array.from(pop.querySelectorAll(".psMoveRow"));
    return {ok:!pop.hidden&&rows.length===3&&["⚔︎","🗡️","⚔️"].includes(action.textContent)&&
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
    evolutionExpanded=true;psSelectedEvaluationLeague="gl";activeRankLeague="gl";
    document.getElementById("evolutions").hidden=false;
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
    const action=document.querySelector("#psLeagueMoves .psMovesAction");
    if(!action)return {ok:false,why:"missing Mega action"};
    await action.onclick();
    const pop=document.getElementById("movesPopover"),html=pop.innerHTML;
    const result={ok:!pop.hidden&&["⚔︎","🗡️","⚔️"].includes(action.textContent)&&
      megaCalls===1&&wrongBase===0&&html.includes("Megaedição")&&
      html.includes("Clarão Deslumbrante")&&!html.includes("Gema Poderosa"),
      width:pop.scrollWidth,client:pop.clientWidth,
      megaCalls,wrongBase,icon:action.textContent,
      hasMegaLabel:html.includes("Megaedição"),hasCharged:html.includes("Clarão Deslumbrante"),
      leaksBase:html.includes("Gema Poderosa"),content:pop.textContent.slice(0,120)};
    result.ok=result.ok&&pop.scrollWidth<=pop.clientWidth+3;
    return result;
   });
   assert.ok(megaMoves.ok,
    "Mega Sableye uses Mega Edition and never normal Power Gem "+sz.name+
    " "+JSON.stringify(megaMoves));
   await page.screenshot({path:path.join(output,sz.name+"-mega-moves.png")});
   // LT254: actual species switch in the SAME rank explorer DOM. Previously
   // Ursaluna GL #2 opened halfway down the list (#5–#8) after Ursaring #1.
   const family=await page.evaluate(()=>{
    const ex=window.PokeSearchRankExplorer;
    const gm=window.POKESEARCH_PVP_IV_DATA;
    if(!ex?.open||!gm)return {ok:false,reason:"rank explorer not loaded"};
    const a=ex.getIvRows(gm,"Ursaring","gl"),
      b=ex.getIvRows(gm,"Ursaluna","gl");
    const iv="0/14/15";
    if(!ex.open({kind:"class",name:"Ursaring",league:"gl",iv,rank:1}))
     return {ok:false,reason:"cannot open Ursaring"};
    const old=document.querySelector("#psRankExplorer .psrRows");
    old.scrollTop=110;
    const priorScroll=old.scrollTop;
    if(!ex.open({kind:"class",name:"Ursaluna",league:"gl",iv,rank:2}))
     return {ok:false,reason:"cannot switch to Ursaluna"};
    const panel=document.querySelector("#psRankExplorer");
    const list=panel.querySelector(".psrRows");
    const title=panel.querySelector(".psrTitle")?.textContent||"";
    const context=panel.querySelector(".psrSub")?.textContent||"";
    const first=panel.querySelector("tr[data-ps-row='1']");
    const selected=panel.querySelector("tr[data-ps-owned='true']");
    const firstBox=first?.getBoundingClientRect(),box=selected?.getBoundingClientRect(),
      holder=list.getBoundingClientRect();
    return {ok:!!selected&&selected.dataset.psRow==="2"&&
      title.includes("Ursaluna")&&context.includes("0/14/15")&&
      !title.includes("Ursaring")&&
      list.scrollTop<15&&
      firstBox?.top>=holder.top-4&&box?.bottom<=holder.bottom+4&&
      a.find(x=>x.iv===iv)?.rank===1&&b.find(x=>x.iv===iv)?.rank===2,
      priorScroll,afterScroll:list.scrollTop,title,context,
      rowText:panel.querySelector("tr[data-ps-row='2']")?.textContent?.slice(0,75),
      selected:!!selected,firstTop:firstBox?.top,holderTop:holder.top};
   });
   assert.ok(family.ok,"Ursaring → Ursaluna must reset scroll and show GL #2: "+
    JSON.stringify(family));
   await page.evaluate(()=>{
    document.querySelector("#psRankExplorer")?.scrollIntoView({block:"nearest"});
   });
   await page.screenshot({path:path.join(output,sz.name+"-ursaluna-class-selected.png")});
   // LT259: actual shipping card under a deterministic public-data fixture.
   // Raid badge is visible BEFORE coordinates, and expansion stays inline.
   const raid=await page.evaluate(async()=>{
    window.PokeSearchRankExplorer?.close?.();
    if(typeof closeDetailMetric==="function")closeDetailMetric();
    window.PokeSearchRaidRank={
     offlineAttack:()=>({name:"Seismitoad",attack:188}),
     assess:async()=>({verified:true,best:{rank:6,name:"Seismitoad",
       typePt:"Água",type:"water",projected:true},
       rows:[{name:"Seismitoad",rank:6,typePt:"Água",variant:"normal",
         projected:true,fast:"MUD_SHOT_FAST",charged:"HYDRO_PUMP",elite:false}],
       source:"Fonte PvE simulada",note:"IV independente"})
    };
    window.showDetails({number:"#535",name:"Tympole",sourceIndex:991,
      iv:"15/15/15",cp:407,level:17,despawn:"03:00",
      moves:"Mud Shot / Water Pulse",location:"Test City"}, "gl",false);
    for(let i=0;i<8;i++)await Promise.resolve();
    const row=document.getElementById("raidRow"),panel=document.getElementById("raidPanel"),
      coords=document.getElementById("coordRow");
    const before=!row.hidden&&row.textContent.includes("#6 Água")&&panel.hidden;
    row.click();
    const root=document.getElementById("panel");
    root.scrollTop=root.scrollHeight;
    return {ok:before&&!panel.hidden&&
      row.getAttribute("aria-expanded")==="true"&&
      panel.textContent.includes("Seismitoad")&&
      panel.dataset.psSource==="Fonte PvE simulada"&&
      panel.getAttribute("data-ps-criteria")?.includes("a fonte não valida a melhor segunda escolha")&&
      !panel.textContent.includes("Fonte e critérios")&&
      row.getBoundingClientRect().top<coords.getBoundingClientRect().top&&
      panel.scrollWidth<=panel.clientWidth+3&&
      root.scrollWidth<=root.clientWidth+3,
      label:row.textContent,panelWidth:panel.scrollWidth,
      clientWidth:panel.clientWidth,content:panel.textContent.slice(0,110)};
   });
   assert.ok(raid.ok,"LT259 pre-capture Raid badge and inline expansion P/M/G "+
    sz.name+" "+JSON.stringify(raid));
   await page.screenshot({path:path.join(output,sz.name+"-raid-pre-capture.png")});
   assert.deepEqual(errors,[],"no browser runtime errors "+sz.name);
   console.log("LT253 visual "+sz.name+" PASS",
    {width:sz.w,height:sz.h,scroll:top.scrollHeight,
     bottomReachable:bottom.lastVisible,mega:mega.text});
   await page.close();
  }

  // LT254 — reproduce the SECOND Android dock.html WebView. Its .controls-window
  // class once let later horizontal/orientation rules redraw the entire ribbon
  // inside the translucent popup, even though popup-window tried to hide it.
  const popup=await browser.newPage({viewport:{width:360,height:700},
   deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const popupErrors=[];popup.on("pageerror",e=>popupErrors.push(String(e)));
  await popup.addInitScript(()=>{
   window.Native=new Proxy({}, {get(_t,key){
    if(key==="openPopup")return ()=>undefined;
    return ()=>undefined;
   }});
  });
  await popup.goto("file://"+path.resolve(__dirname,"../src/main/assets/dock.html")+
   "?controls=1&popup=1",{waitUntil:"load"});
  const scenarios=[
   {name:"mode",kind:"mode",above:false},
   {name:"mode-above",kind:"mode",above:true},
   {name:"filters",kind:"filters",above:false},
   {name:"location",kind:"location",above:false}
  ];
  for(const scenario of scenarios){
   const state=await popup.evaluate(({kind,above})=>{
    document.body.classList.add("visual-menu-horizontal");
    document.body.classList.toggle("popup-above",above);
    window.showNativePopup(kind);
    const get=id=>document.getElementById(id);
    const panel=get("choices"),menu=get("menu");
    return {kind,visible:panel.classList.contains("visible"),
     ribbon:getComputedStyle(get("quickMenuList")).display,
     head:getComputedStyle(get("quickHead")).display,
     controls:getComputedStyle(get("controls")).display,
     gear:getComputedStyle(get("gear")).display,
     actualMenuHeight:menu.getBoundingClientRect().height,
     popupWidth:panel.getBoundingClientRect().width};
   },scenario);
   assert.ok(state.visible&&state.ribbon==="none"&&state.head==="none"&&
    state.controls==="none"&&state.gear==="none"&&
    state.actualMenuHeight===0&&state.popupWidth>20,
    "popup must paint one independent surface without toolbar clones: "+
    JSON.stringify(state));
   await popup.screenshot({path:path.join(output,"popup-single-owner-"+scenario.name+".png")});
   console.log("LT254 popup one-toolbar-owner PASS",state);
  }
  assert.deepEqual(popupErrors,[],"popup WebView must have no JS runtime failures");
  await popup.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

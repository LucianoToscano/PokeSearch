"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..","src","main");
const read=(p)=>fs.readFileSync(path.join(root,p),"utf8");
const dock=read("assets/dock.html");
const probe=read("assets/probe.js");
const service=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const main=read("java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const picker=read("java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java");
let count=0;
const failures=[];
function test(name,ok){
 count++;
 try{
  // A callback is a test body, not an already-passing truthy value.
  const passed=typeof ok==="function"?ok():ok;
  if(!passed)failures.push(name);
 }catch(error){
  failures.push(name+": "+String(error?.message||error));
 }
}
test("Mode button opens options instead of cycling",dock.includes("toggleChoices('mode')")&&!dock.includes('onclick="Native.cycleMode()"'));
test("Auto button opens interval options",dock.includes("toggleChoices('period')"));
test("Six classic cascading Modos options in exact order, 100/0 are direct",(()=>{const b=dock.split('function renderModeChoices(){')[1]?.split('function renderExtraFilters(')[0]||"";
 return b.includes('["hundo","100%"],["nundo","0%"],["raw","IV"]')&&
 b.includes('["percent","IV%"],["gl","GL"],["ul","UL"]')&&
 b.includes('applyExact(15)')&&b.includes('applyExact(0)')&&
 !b.includes('modeShiny')&&dock.includes("toggleChoices('mode')");})());
test("Intervals minimum 5 minutes",["Auto · 5 min","Auto · 10 min","Auto · 15 min","Auto · 20 min"].every(v=>dock.includes(v)));
test("Cascade uses current toolbar height even after clipping or vertical rotation",
 dock.includes('choiceOpen==="mode"?baseHeight+190+6')&&
 dock.includes('const baseHeight=window.visualPrefs?.menuOrientation==="vertical"?232:34;')&&
 dock.includes("Native.resizeMenu(h)")&&service.includes("menuRequestedHeightDp=visualMenuBaseDp();"));
test("Bridge supports explicit filter selection",service.includes("public void setMode(String s)"));
test("Bridge supports explicit interval selection",service.includes("public void setIntervalMinutes(int minutes)"));
test("Favorites remain in overlay",service.includes("PokemonPicker.show(OverlayService.this")&&!service.includes('intent.setAction("com.lucianotoscano.pokesearchoverlay.EDIT_WATCH_LIST")'));
test("Favorites picker is service-safe and focusable",picker.includes("TYPE_APPLICATION_OVERLAY")&&picker.includes("Runnable dismissed"));
test("Login has one top toolbar and no native footer buttons",main.includes('done.setText("✓ PokeSearch")')&&main.includes('loginDialog.requestWindowFeature(android.view.Window.FEATURE_NO_TITLE)')&&main.includes('MATCH_PARENT,\n                android.view.WindowManager.LayoutParams.MATCH_PARENT'));
test("Shiny remains separate from the chosen filter",service.includes('shiny=!shiny;')&&dock.includes('onclick="Native.shiny()"')&&service.includes('mode.equals(selected)'));
test("Throttled refresh is queued",service.includes('handler.postDelayed(queuedRefresh,remaining*1000L+300L)'));
test("Quick guide remains accessible",main.includes("showQuickGuide()")&&main.includes("tutorialSeenV41")&&main.includes("tutorial.html"));
test("UX-RESULT-10 keeps P/M/G sprite stages centred with compact per-card touch rows",(()=>{
 const row=service.match(/private int rowDp\(\)\{([\s\S]*?)\}/)?.[1]||"";
 return row.includes("return spriteSize+3;")&&
  dock.includes("height:var(--spawn-row,var(--row))")&&
  dock.includes("min-height:var(--spawn-row,var(--row))")&&
  dock.includes('style="--spawn-row:')&&
  dock.includes("align-items:center;justify-content:center");
})());
test("Result list is always non-scrollable and has no eight-row height cap",
 dock.includes("body.result-window #spawns{")&&
 dock.includes("max-height:none!important;height:auto!important")&&
 dock.includes("overflow-y:visible!important;overflow-x:visible!important")&&
 dock.includes("#spawns:not(:empty){padding-bottom:0!important}")&&
 !service.includes("rowDp()*8"));
test("Native passes full display height and preserves up to ten card slots",
 service.includes("Math.min(rowDp()*10,screenHeightDp()-52)")&&
 service.includes('screenHeightDp()+","+resultDisplayOptionsJson()+","+WatchAlerts.permissionGranted(this)')&&
 service.includes("screenHeightDp()-16")&&
 service.includes("resultParams.y=fittedY;")&&
 dock.includes("cards=Array.isArray(a)?a.slice(0,10):[]")&&
 dock.includes("resultDisplayHeightDp=Math.max(0,Number(screenHeightDp)||0)"));

test("UX-RESULT-10 pitch is visual-only and metadata does not expand rows",()=>{
 const from=dock.indexOf("const PVPOKE_OVERALL=");
 const until=dock.indexOf('let lastListKey=""',from);
 if(from<0||until<from)return false;
 const source=dock.slice(from,until);
 const win={visualPrefs:{resultGapBetween:31,resultsOrientation:"vertical"}};
 const helpers=new Function("window","verifiedSpawnIvPercent",source+
   "return {resultHasVisibleInfo,computeResultLayout}")(win,c=>c.verified?98:null);
 const short=Array.from({length:10},(_,i)=>({name:"Pokémon "+i,verified:false,expiresAtMs:0}));
 const withInfo=short.map((x,i)=>({...x,verified:i%2===0,expiresAtMs:i%3===0?12345:0}));
 const base=helpers.computeResultLayout(short,45,900,false,false);
 const iv=helpers.computeResultLayout(withInfo,45,900,false,true);
 const timers=helpers.computeResultLayout(withInfo,45,900,true,false);
 const both=helpers.computeResultLayout(withInfo,55,380,true,true);
 win.visualPrefs.resultGapBetween=0;
 const compact=helpers.computeResultLayout(short,45,900,false,false);
 return base.visibleCount===10&&base.rows.every(x=>x===45)&&
   iv.rows.every(x=>x===45)&&timers.rows.every(x=>x===45)&&
   both.visibleCount===10&&both.total+30+6<=380-16&&
   compact.rows.every(x=>x===14)&&compact.sprite===45&&
   helpers.resultHasVisibleInfo(withInfo[0],false,true)===true&&
   helpers.resultHasVisibleInfo(withInfo[1],false,true)===false;
});
test("UX-INFO-01 quantity of spawns is visibility-only and never changes the ten-card limit",
 dock.includes('["count","Quantidade de spawns"]')&&
 dock.includes('id="resultSpawnCount"')&&
 dock.includes('count.textContent=resultDisplayOptions.count?String(cards.length):""')&&
 dock.includes('cards=Array.isArray(a)?a.slice(0,10):[]')&&
 service.includes('case "count":resultShowCount=value;pref="resultShowCount"')&&
 !service.includes('setSpawnLimit'));
test("UX-INFO-10 visibility toggles report confirmed Android state without scrolling to top",
 dock.includes('const previousDisplayPrefs=JSON.stringify(resultDisplayOptions);')&&
 dock.includes('JSON.stringify(resultDisplayOptions)!==previousDisplayPrefs)renderInfoChoices();')&&
 dock.includes('const scroll=previous.dataset.panelKind==="info"?previous.scrollTop:0;')&&
 dock.includes('if(choiceOpen==="info"&&panel.isConnected)panel.scrollTop=scroll;')&&
 dock.includes('resultDisplayOptions[key]?"✓":"–"')&&
 dock.includes('Native.setResultDisplayOption(key,!resultDisplayOptions[key])')&&
 !dock.includes('resultDisplayOptions[key]=!resultDisplayOptions[key];'));
test("UX-INFO-01b zero spawns shows numeric 0 when its indicator is enabled",
 dock.includes('count.textContent=resultDisplayOptions.count?String(cards.length):""')&&
 dock.includes('count.style.display=resultDisplayOptions.count?"inline":"none"')&&
 dock.includes("cards=Array.isArray(a)?a.slice(0,10):[]")&&
 !dock.includes("count.textContent=resultDisplayOptions.count&&cards.length")&&
 !service.includes("setSpawnLimit"));
test("UX-INFO-02 legacy and new IV/rank display choices persist independently",()=>{
 const labels=["Quantidade de spawns","Tempo de despawn","Nível (Lv)",
  "Poder de Combate (PC)","IV do Pokémon · A/D/H","IV% do Pokémon",
  "Rank Geral · Grande Liga","Rank Geral · Ultra Liga","Rank Geral · Liga Mestre",
  "Rank IV · Grande Liga","Rank IV · Ultra Liga","Rank IV · Liga Mestre"];
 return labels.every(label=>dock.includes('"'+label+'"'))&&
  dock.includes('Native.setResultDisplayOption(key,!resultDisplayOptions[key])')&&
  dock.includes('Native.toggleTimers()')&&
  dock.includes('Native.setResultTextVisible(!showResultText)')&&
  ['count','cp','level','overallRank','speciesIvRank','rawIv','overallRankGl','overallRankUl','overallRankMl','speciesIvRankGl','speciesIvRankUl','speciesIvRankMl'].every(key=>
   service.includes('case "'+key+'":'))&&
  service.includes('resultShowSpeciesIvRank=prefs.getBoolean("resultShowSpeciesIvRank",false)')&&
  service.includes('resultDisplayOptionsJson()')&&
  service.includes('void setResultDisplayOption(String key,boolean value)');
});
test("UX-INFO-03 PvPoke species overall rank and within-species IV rank never conflate",()=>{
 const file=read("assets/pvpoke-overall-ranks.js");
 const win={};new Function("window",file)(win);
 const list=win.POKESEARCH_PVPOKE_OVERALL||{};
 const start=dock.indexOf("const PVPOKE_OVERALL=");
 const end=dock.indexOf('let lastListKey=""',start);
 if(start<0||end<start)return false;
 const functions=new Function("window","verifiedSpawnIvPercent",
  dock.slice(start,end)+"return {verifiedOverallRank,verifiedSpeciesIvRank,resultLines}")(
  win,c=>c.iv==="0/15/15"?67:null);
 const alt={name:"Altaria",iv:"0/15/15",ivPercent:67,ivRank:1,
  ivRankSource:"explicit-species-iv",ivRankLeague:"gl",cp:1499,level:35};
 const wrong={...alt,ivRank:1,ivRankSource:"verified-site-filter"};
 const choice={cp:true,level:true,iv:true,overallRank:true,speciesIvRank:true,despawn:false};
 const lines=functions.resultLines(alt,choice,"gl");
 return list.gl.length>1000&&list.ul.length>700&&
  functions.verifiedOverallRank(alt,"gl")===2&&
  functions.verifiedOverallRank(alt,"ul")===275&&
  functions.verifiedSpeciesIvRank(alt,"gl")===1&&
  functions.verifiedSpeciesIvRank(alt,"ul")===null&&
  functions.verifiedSpeciesIvRank(wrong,"gl")===null&&
  functions.verifiedOverallRank({name:"Pokémon inexistente"},"gl")===null&&
  lines.includes("IV67% · RG#2")&&lines.includes("IV#1");
});
test("UX-INFO-04 sprite column stays under the movable full Pokébola hitbox",
 dock.includes('body.result-window #resultHeader{')&&
 dock.includes('margin-left:clamp(0px,')&&
 dock.includes('body.result-window .spriteStage{')&&
 dock.includes('width:var(--dock)!important')&&
 dock.includes('max-width:96px')&&
 dock.includes('metadataVisible?96:0')&&
 service.includes('private void updateResultHeaderGrip()')&&
 service.includes('hit.leftMargin=dp(left)')===false&&
 service.includes('box.leftMargin=dp(left)')&&
 service.includes('int right=dockPos+resultWidthDp()+gap;')&&
 service.includes('int safe=Math.max(0,Math.min(100,widthDp))'));
test("UX-INFO-05 verified metadata never creates results or a scrollable list",
 dock.includes('function resultLines(card,opts,league)')&&
 dock.includes('resultDisplayOptions,shownMode,preparedLines):null;')&&
 dock.includes('overflow-y:visible!important;overflow-x:visible!important')&&
 dock.includes("const metadataVisible=resultWindow&&preparedLines.some(lines=>")&&
 dock.includes('resultInfoHtml(text,c)')&&
 dock.includes('Native.resizeResultsMetadata(metaWidth)')&&
 dock.includes('showTimers=!!timers')&&
 !dock.includes('cards=Array.isArray(a)?a.slice(0,8):[]'));
test("UX-INFO-07 per-species PvP IV rank calculates real 4096 spreads at L50",()=>{
 const win={};
 new Function("window",read("assets/pvpoke-overall-ranks.js"))(win);
 new Function("window",read("assets/pvpoke-iv-gamemaster.js"))(win);
 const begin=dock.indexOf("const PVPOKE_OVERALL=");
 const end=dock.indexOf('let lastListKey=""',begin);
 if(begin<0||end<begin)return false;
 const verified=c=>{
  const raw=String(c?.iv||"");
  if(!/^(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])$/.test(raw))return null;
  const pct=Math.round(raw.split("/").map(Number).reduce((a,b)=>a+b,0)*100/45);
  return c.ivPercent!=null&&String(c.ivPercent)!==String(pct)?null:pct;
 };
 const funcs=new Function("window","verifiedSpawnIvPercent",dock.slice(begin,end)+
  "return {calculatedSpeciesIvRank,verifiedSpeciesIvRank,verifiedOverallRank,computeResultLayout,speciesIvRanksCache};"
 )(win,verified);
 const alt={name:"Altaria",iv:"0/14/15",ivPercent:64,cp:1499};
 const invalid={...alt,ivPercent:100};
 const missing={...alt,iv:"",ivPercent:64};
 const other={...alt,name:"Altaria (unknown form)"};
 const shadowForm={...alt,form:"Shadow"};
 const opts={count:true,cp:true,level:true,iv:true,despawn:true,overallRank:true,speciesIvRank:true};
 const ranks=Array.from({length:10},(_,i)=>({...alt,iv:i%2?"0/15/15":"0/14/15",ivPercent:i%2?67:64}));
 const layout=funcs.computeResultLayout(ranks,55,385,false,true,opts,"gl");
 return win.POKESEARCH_PVP_IV_DATA.cpms.length===99&&
  win.POKESEARCH_PVP_IV_DATA.pokemon.length>=1500&&
  funcs.calculatedSpeciesIvRank(alt,"gl")===1&&
  funcs.calculatedSpeciesIvRank({...alt,iv:"0/15/15",ivPercent:67},"gl")===285&&
  funcs.verifiedSpeciesIvRank(alt,"gl")===1&&
  funcs.verifiedSpeciesIvRank(alt,"ul")!==1&&
  funcs.verifiedOverallRank(alt,"gl")===2&&
  funcs.calculatedSpeciesIvRank(invalid,"gl")===null&&
  funcs.calculatedSpeciesIvRank(missing,"gl")===null&&
  funcs.calculatedSpeciesIvRank(other,"gl")===null&&
  funcs.calculatedSpeciesIvRank(shadowForm,"gl")===null&&
  funcs.verifiedOverallRank(shadowForm,"gl")===null&&
  funcs.speciesIvRanksCache.size===2&&
  layout.visibleCount===10&&layout.total<385&&layout.infoScale>=.86;
});
test("UX-INFO-09 despawn expiry still marks entire Pokémon when timer is inline",
 dock.includes('e.closest(".spawn")?.classList.toggle("expired",seconds===0)')&&
 dock.includes('text.split("TIMER").map(line=>resultInfoHtml(line,c)).join(inlineTimer)')&&
 dock.includes('class="timer" data-deadline=')&&
 dock.includes('.spawn.expired{opacity:.38}')&&
 dock.includes('infoScale:Math.max(0.86,Math.min(1,factor))'));
test("UX-RESULT-10 P/M/G pitch tracks slider and fits short displays",()=>{
 const from=dock.indexOf("const PVPOKE_OVERALL="),until=dock.indexOf('let lastListKey=""',from);
 if(from<0||until<from)return false;
 const win={visualPrefs:{resultGapBetween:31}};
 const helpers=new Function("window","verifiedSpawnIvPercent",dock.slice(from,until)+
   "return {computeResultLayout}")(win,()=>null);
 const ten=Array.from({length:10},(_,i)=>({name:"Pokémon "+i,expiresAtMs:0}));
 for(const size of [35,45,55]){
  const full=helpers.computeResultLayout(ten,size,900,false,false);
  const pitch=Math.max(8,Math.round(size*.32)+31);
  if(full.sprite!==size||full.rows.some(row=>row!==pitch)||full.visibleCount!==10)return false;
  const short=helpers.computeResultLayout(ten,size,330,false,false);
  if(short.visibleCount!==10||short.total+54>330)return false;
  for(const height of [190,160]){
   const tight=helpers.computeResultLayout(ten,size,height,false,false);
   if(tight.visibleCount!==10||tight.rows.some(row=>row<8)||tight.sprite<10)return false;
  }
 }
 win.visualPrefs.resultGapBetween=0;
 const compact=helpers.computeResultLayout(ten,45,900,false,false);
 return compact.sprite===45&&compact.rows.every(row=>row===14)&&
   dock.includes("return pitch; // Transparent sprite squares may overlap");
});
test("UX-INFO-08 bundled PvPoke data includes MIT attribution and stays display-only",
 read("assets/licenses/PvPoke-MIT.txt").includes("MIT License")&&
 read("assets/licenses/PvPoke-MIT.txt").includes("Copyright (c) 2019 pvpoke")&&
 dock.includes('src="file:///android_asset/pvpoke-iv-gamemaster.js"')&&
 dock.includes('src="file:///android_asset/pvpoke-overall-ranks.js"')&&
 dock.includes("const PVP_IV_GAME_MASTER=window.POKESEARCH_PVP_IV_DATA||null")&&
 dock.includes('const key=league+":"+species[0]')&&
 !service.includes("pvpoke-overall-ranks.js")&&
 !service.includes("pvpoke-iv-gamemaster.js")&&
 probe.includes('ivRankSource:ivRankValid?"explicit-species-iv":""'));
test("UX-INFO-06 generic site rank is never treated as IV rank without evidence",
 read("assets/probe.js").includes('ivRankSource:ivRankValid?"explicit-species-iv":""')&&
 read("assets/probe.js").includes('ivRankLeague:ivRankValid?mode:""')&&
 read("assets/probe.js").includes('verifiedCardIv({iv:raw,ivPercent:percent})')&&
 dock.includes('card.ivRankSource==="explicit-species-iv"&&card.ivRankLeague===league')&&
 dock.includes('return calculatedSpeciesIvRank(card,league);')&&
 dock.includes('if(verifiedSpawnIvPercent(card)===null)return null;')&&
 !dock.includes('card.rank===1?"IV#1"'));
test("UX-RESULT-10 updates all actual cards when metadata visibility or device height changes",
 dock.includes("JSON.stringify([cards,row,spriteSize,showTimers,showResultText,resultDisplayHeightDp,")&&
 dock.includes("computeResultLayout(cards,spriteSize,resultDisplayHeightDp,showTimers,showResultText,")&&
 dock.includes("const measuredRow=resultLayout?.rows[i]||row;")&&
 dock.includes('if(!resultWindow)document.documentElement.style.setProperty("--list-limit"')&&
 dock.includes('Native.resizeResults(h)')); 
test("League badge replaces the bottom chevron as result collapse control",dock.includes('id="resultHeader"')&&dock.includes('class="results-collapsed"')===false&&dock.includes('body.result-window.results-collapsed #spawns'));
test("Red close is alongside heart with standard background",dock.indexOf('id="close"')>dock.indexOf('id="donate"')&&dock.includes("#controls #close{"));
test("No duplicate close/collapse above gear",!dock.includes('id="topActions"'));
test("Menu occupies separate window rather than wide sprite dock",service.includes('menuRoot=new FrameLayout(this)')&&service.includes('menuPanel=new WebView(this)')&&dock.includes('controlsWindow=window.location.search'));
test("Original compact toolbar is only one 34dp row",service.includes('new WindowManager.LayoutParams(dp(menuDp()),dp(visualMenuBaseDp())')&&service.includes("MENU_BASE_DP=34"));
test("Minimize hides options and restores using gear",service.includes('if(yes&&menuExpanded)menu(false)')&&service.includes('if(minimized)minimize(false);'));
test("Login launched from overlay returns to gameplay with PokeSearch only on successful authentication",
 main.includes('if(authenticatedNow&&fromOverlay&&OverlayService.isRunning())')&&
 main.includes('postDelayed(()->moveTaskToBack(true),220L)')&&
 main.includes('if(authenticatedNow)notifyOverlaySessionReady();'));
test("Favorites dialog has integrated compact close action",picker.includes('finish.setText("✓ Fechar")')&&!picker.includes('.setPositiveButton("Concluído"'));
test("Favorites retain translucent dark styling with optional background blur",picker.includes('Color.argb(239,34,38,47)')&&picker.includes('setBlurBehindRadius'));
test("Tutorial matches actual icon artwork",main.includes('tutorial.html')&&require('node:fs').readFileSync(require('node:path').join(root,'assets/tutorial.html'),'utf8').includes('Guia rápido · PokeSearch'));
test("Toolbar hides during login and favorite editing",service.includes('if(menuRoot!=null)menuRoot.setVisibility(View.GONE)'));
test("Only one pin control appears in toolbar",(dock.match(/id="location"/g)||[]).length===1);
test("Single pin control expands the location editor",dock.includes('onclick="toggleChoices(\'location\')"'));
test("Coords control has inline ON/OFF switch",dock.includes('fieldRow.append(field,paste,toggle)')&&dock.includes('toggle.setAttribute("role","switch")'));
test("Location supports independent hide and disable",dock.includes('hide.onclick=closeChoices')&&dock.includes('Native.setLocation(false,"",0)'));
test("Slider covers inclusive range 0 to 1000",dock.includes('slide.min="0"')&&dock.includes('slide.max="1000"'));
test("Location enforces valid latitude and longitude",dock.includes('Math.abs(Number(match[1]))>90')&&dock.includes('Math.abs(Number(match[2]))>180'));
test("Location preference persisted without exposing secrets",service.includes('putBoolean("locationEnabled",locationEnabled)')&&service.includes('prefs.remove("locationCoords").remove("locationRadius")'));
test("Location is verified before search submission",service.includes('configureLocationAndVerify(generation,manual,0)')&&service.includes('execute("verifyLocation:"+data'));
test("Login, Shiny and league filters remain independent",service.includes('JSONObject.quote(mode)')&&service.includes('locationEnabled'));

const toolbarCols=dock.match(/#controls\{[^}]*grid-template-columns:([^;]+);/);
const toolbarButtons=dock.slice(dock.indexOf('<div id="controls">'),dock.indexOf('</div><div id="choices"')).match(/<button\b/g)||[];
test("Legacy twelve toolbar handlers remain available for rollback",
  !!toolbarCols&&toolbarCols[1].trim()==="34fr 22fr 41fr 20fr 20fr 22fr 22fr 22fr 38fr 22fr 22fr 22fr"&&
  toolbarButtons.length===12&&dock.includes("grid-auto-flow:column"));
test("Single pin shows active radius without a second settings button",
  (dock.match(/id="location"/g)||[]).length===1&&dock.includes('id="locationRadiusText"')&&
  dock.includes('textContent=geoConfirmed?locationRadius+"km":""'));
test("Active radius is readable even when toolbar is closed",
  dock.includes('id="locBadge"')&&dock.includes('geoBadge.textContent=geoConfirmed?"📍 "+locationRadius+" km":')&&
  dock.includes('pointer-events:none')&&dock.includes('body.controls-window #locBadge{display:none!important}'));
test("When OFF, icon and badge never display outdated radius",
  dock.includes('geoBadge.classList.toggle("active",geoConfirmed)')&&
  dock.includes('document.getElementById("locationRadiusText").textContent=geoConfirmed?locationRadius+"km":""'));
test("Switching from location editor to mode releases keyboard focus",
  dock.includes('if(choiceOpen==="location"&&kind!=="location")')&&dock.includes('Native.locationEditor(false)'));
test("Responsive toolbar avoids the gear",service.includes("boolean right=")&&service.includes("boolean left=")&&service.includes("int below=params.y+dp(TOOLBAR_DP)"));
test("Compact twelve-column bar resizes to narrow and wide Android screens",dock.includes("grid-template-columns:34fr 22fr 41fr")&&service.includes("Math.min(330,screenWidthDp()-8)"));
test("Menu reverses order on left edge",dock.includes("body.menu-left #controls{direction:rtl}"));
test("Result header icon has no opaque surface background",dock.includes("body.result-window #resultHeader")&&dock.includes("background:transparent;box-shadow:none"));
test("No extra gap when popup padding zero",dock.includes("Math.max(0,Number(pad)||0)"));
test("Coalesce resize events",dock.includes("if(fitPending)return"));
test("Location validation refuses blank radius",read("assets/probe.js").includes('radiusInput!==""'));
test("Location selection requires state confirmation",read("assets/probe.js").includes("active===true"));
test("AUTO provides feedback",service.includes("AUTO: "));
const expiry=service.split("private final Runnable expiryRefresh=new Runnable(){")[1]?.split("private void armNextDespawn")[0]||"";
test("Despawn removes expired sprites without triggering an extra site search",expiry.includes("armNextDespawn(active);")&&!expiry.includes("refresh(false);"));
test("AUTO retains 5/10/15/20 minute scheduling",service.includes("handler.postDelayed(periodic,intervalMinutes*60000L)"));
test("PL-02 manual refresh queues one follow-up only while busy",
  service.includes('queuedManualRefresh=true;')&&
  service.includes('status("↻ Nova busca agendada após a atual.")')&&
  service.includes('queuedManualRefresh=false;'));
test("Login pauses, drains already submitted search and invalidates pending callbacks",()=>{
 const begin=service.split('if("com.lucianotoscano.pokesearchoverlay.LOGIN_BEGIN".equals(action)){')[1]?.split("return START_STICKY;")[0]||"";
 return begin.includes("loginPaused=true;")&&begin.includes("guardSubmittedSearchBeforeReplacement();")&&
  begin.includes("++requestGeneration;")&&begin.includes("searchInProgress=false;")&&
  begin.includes("cancelSessionCallbacks();");
});
test("A completed login resumes searching, while canceling does not",
 service.includes('boolean authConfirmed=i!=null&&i.getBooleanExtra("authConfirmed",false)')&&
 service.includes('if(authConfirmed&&!stopped&&!loginPaused&&!pickerOpen)')&&
 service.includes('handler.postDelayed(loginEndRefresh,1600L)'));
test("Shiny verification distinguishes trainer linking",service.includes('verified.optBoolean("pending",false)'));
test("Shiny failure does not imply confirmed trainer authentication",service.includes("Verifique login e vínculo do treinador"));
test("Diagnostic logs only coarse authentication states",service.includes('BugReport.log(this,"SESSION","Shiny="'));
test("Menus are never clipped by the HTML viewport",dock.includes("html.controls-root,body.controls-window{overflow:visible!important"));
test("Mode AUTO and location work before delayed native menu sync",dock.includes("if(controlsWindow&&!menuOpen)setMenuOpen(true"));
test("Mode applies one atomic native configuration and AUTO retains direct selection",
  dock.includes("Native.setSearchConfig(JSON.stringify(next))")&&
  dock.includes("period=Number(value);draw();Native.setIntervalMinutes(period)"));
test("Manual refresh button has touch feedback",dock.includes('onclick="manualRefreshTap()"')&&dock.includes('button.classList.add("requested")'));
test("Gear has a visible touch target",dock.includes("#gear{width:35px;height:30px;background:transparent!important"));
test("Toolbar menu responds in narrow and wide sizes",service.includes("Math.min(330,screenWidthDp()-8)"));
test("Favorites use uniform dark gradient without background dim",picker.includes("Color.argb(238,29,32,39)")&&picker.includes("window.setDimAmount(0.0f)"));
test("HOME-01 has explicit official Google/Discord login and sign-out",(()=>{
 const home=main.split("private FrameLayout buildHome(){")[1]?.split("private Button homeAuthButton(")[0]||"";
 return home.includes('homeAuthButton("◉  Discord"')&&home.includes('homeAuthButton("G  Google"')&&
  home.includes('discord.setOnClickListener(v->openProviderLogin("discord"))')&&
  home.includes('google.setOnClickListener(v->openProviderLogin("google"))')&&
  home.includes('logout.setOnClickListener(v->askLogout())');
})());
test("Login does not start overlay if none is running",main.includes("if(!OverlayService.isRunning())return;"));
test("Logout clears local cookies and web storage only",main.includes("removeAllCookies")&&main.includes("WebStorage.getInstance().deleteAllData()"));
test("Home login does not force Shiny",main.includes("openLoginDialog(false)")&&
    !main.includes('view.evaluateJavascript(readAsset("shiny_login.js"),null)')&&
    main.includes('String probe=readAsset("probe.js")'));
test("Verified Home login returns to PokeSearch",main.includes("loginAutoReturnQueued=true")&&main.includes("loginDialog.dismiss()"));
test("Verified login returns regardless of Shiny switch state",main.includes('JSONObject.quote("session")')&&
    main.includes('loginAutoReturnQueued=true;')&&main.includes('loginDialog.dismiss();')&&
    !main.includes('checkShinyReturn('));
test("Menu orientation sent to BOTH native WebViews",service.includes('js(menuPanel,menuLoaded,"window.syncMenu(true,"+edge+",0)")'));
test("Near-right vertical dock still reverses order",service.includes("menuLeft=params.x+dp(dockDp())/2>screen/2"));
test("Service lifecycle prevents spurious background site",service.includes("public static boolean isRunning()")&&service.includes("running=false;"));
const gradleSettings=fs.readFileSync(path.join(__dirname,'../../settings.gradle.kts'),'utf8');
const gradleBuild=fs.readFileSync(path.join(__dirname,'../build.gradle.kts'),'utf8');
const iconGenerator=fs.readFileSync(path.join(__dirname,'../scripts/RoundIcon.java'),'utf8');
const ci=fs.readFileSync(path.join(__dirname,'../../.github/workflows/build-overlay.yml'),'utf8');
const manifest=fs.readFileSync(path.join(root,'AndroidManifest.xml'),'utf8');
test("Settings Gradle exists and includes application",gradleSettings.includes('include(":app")'));
test("PokeSearch 0.51 source configured",
  gradleBuild.includes('versionCode = testVersionCode ?: 51')&&
  gradleBuild.includes('versionName = if (testVersionCode != null) "0.51-beta.test.${testVersionLabel ?: testVersionCode}" else "0.51-beta"')&&
  gradleBuild.includes('applicationId = "com.lucianotoscano.pokesearch"'));
test("Round icon generator always uses headless mode",gradleBuild.includes('-Djava.awt.headless=true')&&iconGenerator.includes('System.setProperty("java.awt.headless","true")'));
test("Network main-frame error is handled",service.includes('request.isForMainFrame()')&&service.includes('Falha de navegação principal'));
test("Browser exception and parse failures recorded",service.includes('recordFailure("executar JS site",e)')&&service.includes('recordFailure("interpretar resposta JS",e)'));
test("Exception logging excludes raw message or full URL",service.includes('error.getClass().getSimpleName()')&&!service.includes('error.getMessage()'));
test("Source archive contains icon and functional wrapper",ci.includes('gradle/wrapper/gradle-wrapper.jar')&&ci.includes('pokesearch_round.png'));
test("CI verifies checksum and source settings",ci.includes('sha256sum -c SHA256SUMS.txt')&&ci.includes('settings.gradle.kts | grep'));
test("Foreground service migration is not silently activated",manifest.includes('FOREGROUND_SERVICE')&&!manifest.includes('android:foregroundServiceType="specialUse"'));
const watch=fs.readFileSync(path.join(root,'java/com/lucianotoscano/pokesearchoverlay/WatchAlerts.java'),'utf8');
const report=fs.readFileSync(path.join(root,'java/com/lucianotoscano/pokesearchoverlay/BugReport.java'),'utf8');
const sanitizer=fs.readFileSync(path.join(root,'java/com/lucianotoscano/pokesearchoverlay/DiagnosticSanitizer.java'),'utf8');
const notifXml=fs.readFileSync(path.join(root,'res/drawable/ic_notification.xml'),'utf8');
test("All notification small icons use our monochrome vector",service.includes('.setSmallIcon(R.drawable.ic_notification)')&&watch.includes('.setSmallIcon(R.drawable.ic_notification)')&&!service.includes('android.R.drawable.ic_menu_search')&&!watch.includes('android.R.drawable.ic_menu_search'));
test("Monochrome vector icon exists",notifXml.includes('android:strokeColor="#FFFFFFFF"')&&notifXml.includes('android:viewportWidth="24"'));
test("BugReport sanitizes before storing and again before export",report.includes('DiagnosticSanitizer.clean(value)')&&report.includes('clean(a.optString(i))'));
test("Report no longer rewrites literal backslash-n globally",!report.includes('.replace("\\\\n","\\n")')&&report.includes('return s.toString();'));
test("BugReport no longer promises perfect sensitive-data removal",report.includes("Revise o TXT antes de compartilhar"));
test("Plain Java privacy tests run in CI",ci.includes('DiagnosticSanitizerTest.java')&&ci.includes('javac -encoding UTF-8'));
test("Notification errors are logged without raw exception messages",watch.includes('BugReport.log(context,"NOTIFICATION"')&&service.includes('recordFailure("notificação geral",e)'));
test("Optional overlay teardown errors report their type",service.includes('recordFailure("remover menu",e)'));
// B06 regression checks: named timers, session generation and deterministic shutdown.
const cancelBlock=service.split('private void cancelSessionCallbacks(){')[1]?.split('\n    }')[0]||'';
const beginBlock=service.split('if("com.lucianotoscano.pokesearchoverlay.LOGIN_BEGIN".equals(action)){')[1]?.split('return START_STICKY;')[0]||'';
const endBlock=service.split('if("com.lucianotoscano.pokesearchoverlay.LOGIN_END".equals(action)){')[1]?.split('return START_STICKY;')[0]||'';
const reloadBlock=service.split('if("com.lucianotoscano.pokesearchoverlay.REFRESH_LOGIN".equals(action)||')[1]?.split('// v0.20')[0]||'';
const pageBlock=service.split('private void newWebsite(){')[1]?.split('    @Override public void onCreate()')[0]||'';
const destroyBlock=service.split('    @Override public void onDestroy(){')[1]?.split('    @Override public IBinder')[0]||'';
test("B06 named page/login/reload timer callbacks",['pageFinishedRefresh','loginEndRefresh','deferredSessionReload'].every(n=>service.includes('private final Runnable '+n+'=')));
test("B06 LOGIN_BEGIN pauses and invalidates active search",beginBlock.includes('loginPaused=true;')&&beginBlock.includes('++requestGeneration;')&&beginBlock.includes('searchInProgress=false;'));
test("B06 all six kinds of scheduled work are canceled",['queuedRefresh','periodic','expiryRefresh','pageFinishedRefresh','loginEndRefresh','deferredSessionReload'].every(n=>cancelBlock.includes('handler.removeCallbacks('+n+')')));
test("B06 LOGIN_BEGIN cancels callbacks and hides all windows",beginBlock.includes('cancelSessionCallbacks();')&&['root','menuRoot','detailRoot'].every(v=>beginBlock.includes(v+'.setVisibility(View.GONE)')));
test("B06 LOGIN_END cancels before 1600ms and periodic restarts after",endBlock.indexOf('cancelSessionCallbacks();')<endBlock.indexOf('handler.postDelayed(loginEndRefresh,1600L)')&&endBlock.indexOf('schedulePeriodic();')>endBlock.indexOf('handler.postDelayed(loginEndRefresh,1600L)'));
test("B06 periodic suppressed during login",service.includes('if(stopped||loginPaused||intervalMinutes<=0)return;')&&service.includes('if(!stopped&&!loginPaused&&intervalMinutes>0)handler.postDelayed(this,intervalMinutes*60000L)'));
test("PL-02 page navigation independent of mutable filter generation",
 pageBlock.includes('onPageStarted')&&pageBlock.includes('pageLoadGeneration++;')&&
 pageBlock.includes('pendingPageRefreshGeneration=searchInProgress?-1:requestGeneration;')&&
 !pageBlock.includes('pageLoadGeneration!=requestGeneration')&&
 service.includes('pendingPageRefreshGeneration==requestGeneration)refresh(false)'));
test("B06 page finish 2500ms handler is cancelable",pageBlock.includes('handler.removeCallbacks(pageFinishedRefresh);')&&pageBlock.includes('handler.postDelayed(pageFinishedRefresh,2500L)')&&!pageBlock.includes('handler.postDelayed(()->{if(!stopped&&!loginPaused)refresh();}'));
test("B06 REFRESH_LOGIN cancels callbacks before cookie flush",reloadBlock.includes('++requestGeneration;')&&reloadBlock.indexOf('cancelSessionCallbacks();')<reloadBlock.indexOf('CookieManager.getInstance().flush();'));
test("B06 reload occurs after 350ms with generation guard",reloadBlock.includes('handler.postDelayed(deferredSessionReload,350L)')&&service.includes('pendingReloadGeneration!=requestGeneration'));
test("B06 delayed search stages verify pause/generation",(service.match(/if\(stopped\|\|loginPaused\|\|generation!=requestGeneration\)return;/g)||[]).length>=8);
test("B06 destruction cancels callbacks and removes windows before WebViews",destroyBlock.indexOf('stopped=true;')<destroyBlock.indexOf('handler.removeCallbacksAndMessages(null)')&&destroyBlock.indexOf('wm.removeView(detailRoot)')<destroyBlock.indexOf('destroyWebView(panel,true'));
test("B06 privacy of errors unchanged",service.includes('error.getClass().getSimpleName()')&&!service.includes('error.getMessage()'));
test("B06 Android SDK and manifest unchanged",manifest.includes('<service android:name=".OverlayService" android:exported="false" />')&&gradleBuild.includes('targetSdk = 33')&&gradleBuild.includes('compileSdk = 36'));
// PS-075–PS-080 regression contracts
test("PS-075 Favorites provides accessible test notification action",picker.includes('testNotification.setText("🔔 Testar notificação")')&&picker.includes('WatchAlerts.test(activity)')&&picker.includes('WatchAlerts.permissionGranted(activity)'));
test("PS-075 Home Preferences provides both toggles and test action",main.includes("settingAlertMode(body,prefs);")&&main.includes('settingCheckbox(body,prefs,WatchAlerts.PREF_ENABLED,')&&main.includes('WatchAlerts.test(this)'));
test("PS-076 Android Back returns within OAuth dialog history",main.includes('loginDialog.setOnKeyListener(')&&main.includes('android.view.KeyEvent.KEYCODE_BACK')&&main.includes('website.canGoBack()')&&main.includes('website.goBack()'));
test("PS-077 loginEndRefresh is cancelable across all transitions",service.includes('private final Runnable loginEndRefresh=')&&cancelBlock.includes('handler.removeCallbacks(loginEndRefresh)')&&beginBlock.includes('cancelSessionCallbacks();')&&endBlock.includes('cancelSessionCallbacks();')&&reloadBlock.includes('cancelSessionCallbacks();'));
const javaSignedLat='[-+]?'+String.fromCharCode(92,92)+'d{1,2}';
const javaSignedLon='[-+]?'+String.fromCharCode(92,92)+'d{1,3}';
const jsSignedLat='[-+]?'+String.fromCharCode(92)+'d{1,2}';
const jsSignedLon='[-+]?'+String.fromCharCode(92)+'d{1,3}';
test("PS-078 explicit positive signs allowed in Java and JS coordinates",service.includes('('+javaSignedLat)&&sanitizer.includes(javaSignedLat)&&dock.includes(jsSignedLat));
test("PS-078 longitude explicitly accepts plus and minus signs",service.includes('('+javaSignedLon)&&sanitizer.includes(javaSignedLon)&&dock.includes(jsSignedLon));
test("PS-079 menu positions before a single sync",service.includes('deferMenuSync=true;')&&service.includes('finally{deferMenuSync=false;}')&&service.indexOf('try{updateWindow();}')<service.indexOf('js(panel,panelLoaded,"window.syncMenu("+show+')&&service.includes('&&!deferMenuSync'));
test("PS-080 IV verification has no unreachable success",!read("assets/probe.js").includes('não confirmados"};\\n  return {ok:true};'));
test("PS-080 bug report notice requires manual review",main.includes('O relatório filtra formatos comuns de dados sensíveis. Revise o conteúdo antes de compartilhar.'));
// v0.50 regression contracts: PS-081–PS-085 and stale bridge replies.
const prefSync=service.split('private void syncPreferencesWithoutSearch(){')[1]?.split('    @Override public int onStartCommand(')[0]||'';
const startCommand=service.split('    @Override public int onStartCommand(')[1]?.split('    private void destroyWebView(')[0]||'';
test("PS-081 home requests POST_NOTIFICATIONS from test action",main.includes('requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},203)'));
test("PS-081 callback runs notification test only after permission granted",main.includes('if(requestCode==203)')&&main.includes('results[0]==PackageManager.PERMISSION_GRANTED')&&main.includes('granted&&WatchAlerts.permissionGranted(this)')&&main.includes('WatchAlerts.test(this)'));
test("PS-081 picker provides permission directions without requesting service permission",picker.includes('Conceda notificações na tela inicial do PokeSearch ou nas Configurações do Android')&&!picker.includes('requestPermissions('));
test("PS-082 sync action from Home requires running overlay",main.includes('OverlayService.isRunning()')&&main.includes('serviceAction("com.lucianotoscano.pokesearchoverlay.SYNC_PREFS")'));
test("PS-082 Home syncs on spinner, checkbox and dismiss",main.includes('syncOverlayPreferences();')&&main.includes('dialog.setOnDismissListener(d->syncOverlayPreferences())')&&main.includes('check.setOnCheckedChangeListener'));
test("PS-082 Overlay handles SYNC_PREFS without network refresh",startCommand.includes('com.lucianotoscano.pokesearchoverlay.SYNC_PREFS')&&startCommand.includes('syncPreferencesWithoutSearch();')&&!prefSync.includes('refresh(')&&!prefSync.includes('execute(')&&!prefSync.includes('loadUrl('));
test("PS-082 re-sorts current results and updates dock",prefSync.includes('sortItems(items)')&&prefSync.includes('params.width=dp(minimized?BUBBLE_DP:dockDp())')&&prefSync.includes('update();'));
test("PS-082 preferences keys for sprite size, sort, timers, alerts",['spriteSize','showTimers','alerts','sort'].every(k=>prefSync.includes('get'+(k==='spriteSize'?'Int':k==='sort'?'String':'Boolean')+'("'+k+'"')));
test("Probe result is discarded across generation switches",service.includes('final int callbackGeneration=requestGeneration;')&&service.includes('callbackGeneration!=requestGeneration||callbackWebsite!=website||(!mayNavigate&&callbackPage!=pageLoadGeneration)'));
test("PS-084 catalogue asset failures log only class and stage",picker.includes('BugReport.log(activity,"ASSET","ler catálogo Pokémon · "+e.getClass().getSimpleName())'));
test("PS-084 MainActivity asset failures log only stage and class",main.includes('BugReport.log(this,"ASSET"')&&main.includes('e.getClass().getSimpleName()')&&!main.includes('e.getMessage()'));
test("PS-085 sanitizer masks OAuth code/state and discord_token",sanitizer.includes('discord[_-]?token')&&sanitizer.includes('code|state|secret'));
// Additional physical feedback for the v0.50 stabilization pass.
test("v0.50 no phantom gap when toolbar is beside dock",
    service.includes("menuPadDp=0; // Results remain in their own separate native overlay.")&&dock.includes("#spawns{margin-top:var(--top-space);gap:0}"));
test("v0.50 transparent floating collapse arrow",
    dock.includes("#collapse{width:34px;height:27px")&&dock.includes("background:transparent!important"));
test("v0.50 AUTO OFF in UI and service, with no periodic posts",
    dock.includes('[[0,"Auto · OFF')&&dock.includes('period===0?"OFF"')&&dock.includes("period=[0,5,10,15,20].includes(Number(interval))?Number(interval):5")&&
    service.includes('if(minutes!=0&&minutes!=5')&&
    service.includes('if(!stopped&&!loginPaused&&intervalMinutes>0)handler.postDelayed(periodic,'));
test("General notifications still cycle off/on/silent while bell indicates both sources",
    service.includes('alertsMode="off".equals(alertsMode)?"on":"on".equals(alertsMode)?"silent":"off"')&&
    dock.includes('bell-one-muted')&&dock.includes('bell-both-muted'));
test("v0.50 silent channels are actually without sound",
    service.includes('pokesearch_alerts_silent_v1')&&
    watch.includes('pokesearch_watch_silent_v1')&&watch.includes('channel.setSound(null,null)'));
test("v0.50 direct login uses the real site switch without guessed OAuth routes",
    main.includes('readAsset("login_entry.js")')&&
    read("assets/login_entry.js").includes('candidate.click();')&&
    main.includes('"https://pogocoordinates.com/profile"')&&
   main.includes('"https://pogocoordinates.com/search"'));
test("v0.50 service accepts missing action on initial start",
    service.includes('i==null||i.getAction()==null?"":i.getAction()'));
test("v0.50 neutral UI includes smaller location icon",
    dock.includes('#controls #location svg{width:14px;height:14px}')&&
    dock.includes('#choices{background:#252628ee'));
test("Android responsive controls have no phantom spacer below popup",
  service.includes('menuPadDp=0; // Results remain in their own separate native overlay.')&&
  service.includes('menuParams.y=Math.max(0,Math.min(bottom-menuParams.height,')&&
  dock.includes('#choices{display:none;position:absolute;top:34px;'));
test("UX-MENU-01 measures horizontal and vertical menus with dynamic base height",
 dock.includes('if(controlsWindow)h=window.visualPrefs?.menuOrientation==="vertical"?232:34;')&&
 service.includes("menuParams.height=dp(visualMenuBaseDp())")&&
 service.includes("Math.min(450,screenHeightDp()-24)"));
test("All legacy twelve bridge buttons remain unique in HTML",
  toolbarButtons.length===12&&
  ['cycle','sh','period','manualRefresh','size','clock','bell','star','location','report','donate','close']
  .every(id=>(dock.match(new RegExp('id="'+id+'"','g'))||[]).length===1));
test("Shiny tap skips Search cooldown to inspect site and auth",
  service.includes('private void prepareImmediateShiny(int generation)')&&
  service.includes('private void applyShinyOnSite(int generation,int attempt)')&&
  service.includes('execute("setShiny",applied->')&&
  service.includes('execute("session",session->')&&
  service.includes('handler.removeCallbacks(queuedRefresh);'));
test("Shiny tap waits for LIVE authenticated trainer proof instead of stale local prefs",
  service.includes('private boolean siteConfirmsShinyAccount(JSONObject session)')&&
  service.includes('execute("session",session->')&&
  service.includes('if(!siteConfirmsShinyAccount(session)){')&&
  service.includes('openShinyLogin();')&&
  service.includes('if(!loaded||website==null){'));
test("Shiny off works without forced login",
  service.includes('if(!shiny){')&&
  service.includes('prepareImmediateShiny(generation);')&&
  read("assets/probe.js").includes('if(action==="setShiny")return JSON.stringify(setShiny(shinyOnly))'));
test("Shiny is only verified after reading site state",
  service.includes('execute("verifyShiny",verified->')&&
  service.includes('shinyVerified=shiny;')&&
  service.includes('if(stopped||loginPaused||generation!=requestGeneration)return;'));
test("Login retries the official control for delayed site hydration",
  main.includes('private void openOfficialLoginControl(WebView view,int remaining)')&&
  main.includes('view.postDelayed(()->openOfficialLoginControl(view,remaining-1),260L)')&&
  main.includes('openOfficialLoginControl(view,8);'));
test("Login uses official site and Shiny activation remains in background collector",
  main.includes('host.equalsIgnoreCase("pogocoordinates.com")')&&
  !main.includes('view.evaluateJavascript(readAsset("shiny_login.js"),null)')&&
  main.includes('"https://pogocoordinates.com/profile":"https://pogocoordinates.com/search"')&&
  service.includes('private void prepareImmediateShiny(int generation)'));
test("Official account badge returns immediately to PokeSearch Home",
  main.includes('private void checkLoginSession(WebView view,int attemptsLeft,int pageGeneration)')&&
  main.includes('if("autenticada".equals(auth)){')&&
  main.includes('loginDialog.dismiss();')&&
  main.includes('checkLoginSession(view,14,generation);'));
test("Login retries boundedly and rechecks official page after OAuth navigation",
  main.includes('if(attemptsLeft>1)view.postDelayed(')&&
  main.includes('checkLoginSession(view,attemptsLeft-1,pageGeneration),450L')&&
  main.includes('++loginPageGeneration;')&&
  main.includes('profileCaptureInProgress=true;'));
test("Login session detection substitutes all probe placeholders and reads mobile account text",
 main.includes('JSONObject.quote("session")')&&
 main.includes('.replace("__FILTERS__","{}")')&&
 read("assets/probe.js").includes('const accountBadge=badgeText.test('));
test("Shiny state sync starts on site load independently of Search cooldown",
  service.includes('if(shiny&&!shinyVerified){')&&
  service.includes('prepareImmediateShiny(generation);')&&
  service.includes('},420L);'));
test("After login, authenticated site missing switch never restarts login loop",
  service.includes('"autenticada".equals(auth)')&&
  service.includes('Conta conectada; controle Shiny não encontrado no site.'));
test("Gap between gear and first sprite is never fabricated by changing mode popup size",
  service.includes('menuPadDp=0; // Results remain in their own separate native overlay.')&&
  service.includes('rowY-(abovePopup?actualPopup:0)')&&
  !service.includes('params.y=targetY;')&&
  dock.includes('#spawns{margin-top:var(--top-space);gap:0}'));
const directShiny=service.split('private void prepareImmediateShiny(int generation){')[1]?.split('private void verifyAndSubmit(')[0]||'';
test("Shiny on visible Pokémon page never requires Stats/PvP tab",
  directShiny.includes('applyShinyOnSite(generation,0);')&&!directShiny.includes('execute("prepareSearch"'));
test("Shiny retries unhydrated site control without repeated login loops",
  service.includes('handler.postDelayed(()->applyShinyOnSite(generation,attempt+1),300L)')&&
  service.includes('Conta conectada; controle Shiny não encontrado no site.'));
test("Mobile session probe has a text-node badge fallback",
  read("assets/probe.js").includes('document.body&&document.body.innerText'));
test("Login initially masks the unrelated PoGoCoordinates search page",
  main.includes("FrameLayout loginStage=new FrameLayout(this);")&&
  main.includes("loginStage.addView(website,new FrameLayout.LayoutParams(-1,-1));")&&
  main.includes("loginStage.addView(loginWaiting,new FrameLayout.LayoutParams(-1,-1));")&&
  main.includes("loginCover=loginWaiting;"));
test("Login only reveals official provider dialog and supports Shiny switch tap",
  main.includes("if(loginCover!=null)loginCover.setVisibility(View.GONE);")&&
  main.includes('result.contains("\\\"ready\\\"")')&&
  read("assets/login_entry.js").includes('return "ready";')&&
  read("assets/login_entry.js").includes('candidate.click();'));
test("Login tests session before opening a fresh login link",
  main.indexOf("checkLoginSession(view,14,generation);")>=0&&
  main.includes("!loginDiscoveryStarted&&!loginLinkAttempted")&&
  main.includes("openOfficialLoginControl(view,8);"));
test("Provider OAuth is visible and return to site is covered until session confirmed",
  main.includes("loginCover.setVisibility(site?View.VISIBLE:View.GONE);")&&
  main.includes('if("autenticada".equals(auth)){')&&
  main.includes("loginDialog.dismiss();"));
test("Unknown site login has an accessible explicit fallback, not infinite masking",
  main.includes('loginFallback.setText("Mostrar o site para entrar");')&&
  main.includes("loginFallback.setVisibility(View.VISIBLE);")&&
  main.includes("if(loginCover!=null)loginCover.setVisibility(View.GONE);"));
test("Minimal login surface is neutral and release clears native references",
  main.includes('loginWaitLabel.setText("Preparando acesso ao PoGoCoordinates')&&
  main.includes("loginWaiting.setBackgroundColor(Color.rgb(11,13,18));")&&
  main.includes("loginCover=null;")&&main.includes("loginFallback=null;"));
test("Regression: a single line instead of two oversized icon rows",
  dock.includes('#menu{display:none;position:absolute;top:0;left:var(--dock);width:396px;height:34px;')&&
  dock.includes('#controls{grid-auto-flow:column}')&&
  dock.includes('body.controls-window #menu{min-height:34px}')&&
  !dock.includes('repeat(6,minmax(0,1fr))'));
test("Official Shiny switch can initiate login without exposing search page",
  read("assets/login_entry.js").includes('const fromShiny=__SHINY__;')&&
  read("assets/login_entry.js").includes('window.__psShinyLoginTapped=true;')&&
  main.includes('.replace("__SHINY__",loginStartedForShiny?"true":"false")'));
test("The site is only exposed once sign-in content is actually ready",
  read("assets/login_entry.js").includes('if(authDialog||providerChoices){')&&
  read("assets/login_entry.js").includes('return "ready";')&&
  main.includes('result.contains("\\\"ready\\\"")'));


const guard=read("java/com/lucianotoscano/pokesearchoverlay/IntegrityGuard.java");
const proguard=fs.readFileSync(path.join(__dirname,"..","proguard-rules.pro"),"utf8");
const gradle=fs.readFileSync(path.join(__dirname,"..","build.gradle.kts"),"utf8");
test("IntegrityGuard invoked in activity and service",main.includes("IntegrityGuard.verify(this)")&&service.includes("IntegrityGuard.verify(this)"));
test("Pix digest checked with SHA-256 and constant-time compare",guard.includes("PixSupport.PAYLOAD")&&guard.includes("SHA-256")&&guard.includes("MessageDigest.isEqual"));
test("Login protected from screenshots",main.includes("loginDialog.getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE)"));
test("R8 keeps JavascriptInterface",proguard.includes("@android.webkit.JavascriptInterface")&&proguard.includes("-keepattributes"));
test("Release minifies and shrinks",gradle.includes("isMinifyEnabled = true")&&gradle.includes("isShrinkResources = true"));

test("v0.51 gear does not render Pokémon results",
    dock.includes('body.dock-window #spawns')&&dock.includes('body.dock-window #empty'));
test("v0.51 sprites and mode icon are loaded into an independent Android overlay",
    service.includes('resultRoot=new FrameLayout(this)')&&
    service.includes('wm.addView(resultRoot,resultParams)')&&
    service.includes('dock.html?results=1')&&
    dock.includes('const resultWindow='));
test("v0.51 dragging only the results window keeps X/Y separately",
    service.includes('resultParams.x=')&&
    service.includes('wm.updateViewLayout(resultRoot,resultParams)')&&
    service.includes('putInt("resultsX"')&&service.includes('putInt("resultsY"'));
test("v0.51 league icon toggles collapse, never changes search mode",
    service.includes('private void toggleResultsCollapsed()')&&
    dock.includes('window.setResultsCollapsed=collapsed=>')&&
    dock.includes('Native.toggleResultsCollapsed()'));
test("v0.51 header selects exact bundled original league art",
    ["hundo","shundo","great-league","ultra-league"].every(name=>
        dock.includes(name))&&dock.includes('result-icons/'));
test("v0.51 opening favorites or login hides independent results window",
    service.includes('if(resultRoot!=null)resultRoot.setVisibility(View.GONE)')&&
    service.includes('if(resultRoot!=null&&!pickerOpen&&!minimized)resultRoot.setVisibility(View.VISIBLE)'));
test("v0.51 original single search and toolbar remain unchanged",
    dock.includes('grid-template-columns:34fr 22fr 41fr')&&
    service.includes('private String mode="raw"')&&
    !service.includes('multiCycleActive'));

test("v0.51 all 18 original result icons are present for 9 search types and Shiny pairs",(()=>{
  const paths=[
    "none.png","none-shiny.png","custom.png","custom-shiny.png",
    "percent.png","percent-shiny.png","hundo.png","shundo.png",
    "nundo.png","shnundo.png","great-league.png","great-league-shiny.png",
    "ultra-league.png","ultra-league-shiny.png","master-league.png",
    "master-league-shiny.png","cup-league.png","cup-league-shiny.png"
  ];
  return paths.every(name=>fs.existsSync(path.join(root,"assets/result-icons",name)))&&
    paths.length===18;
})());
test("v0.51 header chooses a confirmed Shiny version of its exact search type",
    dock.includes('function getResultIcon(searchMode,shinyActive,settings=searchSettings)')&&
    dock.includes('const selectedIcon=getResultIcon(iconMode,iconShiny,iconSettings)')&&
    dock.includes('const pair=RESULT_ICONS[family]')&&
    dock.includes('shinyBadge:shining')&&
    dock.includes('const baseName=RESULT_BASE_ICONS[baseFamily]||RESULT_BASE_ICONS.none'));

test("Mode popup keeps one stable row while expanding upward or downward",
 service.includes('boolean abovePopup=requestedPopup>roomBelow&&roomAbove>roomBelow;')&&
 service.includes('rowY-(abovePopup?actualPopup:0)')&&
 service.includes('window.setMenuPopupPlacement(')&&
 dock.includes('body.controls-window.popup-above #choices{top:auto!important;bottom:34px!important}')&&
 dock.includes('body.controls-window.popup-above #menu{top:var(--popup-offset,0px)!important}'));
test("Cascade popup uses 27px rail rows and small lateral settings",
 dock.includes('width:88px!important;height:190px!important')&&
 dock.includes('height:27px!important;min-height:27px!important')&&
 dock.includes('modeCascadeEditor')&&
 dock.includes('max-width:calc(100% - 88px)')&&
 service.includes('int roomDp=requestedPopup==0?420:'));
test("Cascade numeric input supports touch swipe, keyboard typing and percentage stepping",
 dock.includes('input.type="number";input.inputMode="numeric"')&&
 dock.includes('input.addEventListener("touchend"')&&
 dock.includes('input.addEventListener("wheel"')&&
 dock.includes('input.addEventListener("change"')&&
 dock.includes('kind==="percent"?IV_PERCENT_VALUES'));
test("Four editable cascade modes keep raw, percent and rank numeric bounds",(()=>{const b=dock.split("function renderModeChoices(){")[1]?.split("function renderExtraFilters(")[0]||"";
 return b.includes('kind==="iv"?16:50')&&b.includes('kind==="rank"?1:0')&&
 ["attack","defense","stamina","percentMin","percentMax","glRank","ulRank"].every(k=>b.includes('"'+k+'"'))&&
 b.includes('input.min=String(allowed[0])')&&b.includes('input.max=String(allowed[allowed.length-1])');})());
test("Automatic Hundo recognition uses Raw IV 15/15/15 icon and persists legacy migration",
 dock.includes('if([attack,defense,stamina].every(v=>Number(v)===15))family="hundo"')&&
 dock.includes('if(min===100&&max===100)family="hundo"')&&
 service.includes('boolean migrateLegacyHundo="iv".equals(mode);')&&
 service.includes('pref.edit().putString("mode","raw")')&&
 read("assets/probe.js").includes('return rawIsHundo()&&!oneButton("Raw IV")&&set100Percent();'));
test("Cascade replaces wheels and popup Shiny without losing the independent ✨",
 !dock.includes('modeShiny')&&!dock.includes('modeWheels')&&
 dock.includes('modeCascadeRail')&&
 dock.includes('modeCascadeEditor')&&
 dock.includes('["sh","✨","Shiny Only","sh"]'));
test("Direct extremes and explicit ✓ are the only cascade save paths",
 dock.includes('const next={...searchSettings,mode:"raw",attack:value,defense:value,stamina:value}')&&
 dock.includes('const next={...modeDraft};closeChoices();Native.setSearchConfig(JSON.stringify(next));')&&
 dock.includes('cancel.onclick=()=>{if(controlsWindow)Native.locationEditor(false);')&&toolbarButtons.length===12);
test("Cascade percent MIN/MAX are kept in valid order on edit",
 dock.includes('key==="percentMin"&&modeDraft.percentMax<value')&&
 dock.includes('key==="percentMax"&&modeDraft.percentMin>value')&&
 dock.includes('modeDraft.percentMin>modeDraft.percentMax'));
test("Native bridge validates all requested IV, PvP ranking and percent bounds",
 service.includes("public void setSearchConfig(String payload)")&&
 service.includes("within(a,0,15)")&&service.includes("within(gl,1,50)")&&
 service.includes("isAllowedIvPercent(min)")&&
  service.includes("isAllowedIvPercent(max)")&&service.includes("min>max"));
test("Native mode and filter options persist through service restarts",
 ["rawAttack","rawDefense","rawStamina","glRank","ulRank","ivPercentMin","ivPercentMax"].every(k=>
  service.includes('putInt("'+k+'"')&&service.includes('pref.getInt("'+k+'"')));
test("Site filters are configured and confirmed before search submission",(()=>{
 const probe=read("assets/probe.js");
 return probe.includes("mode===\"raw\"")&&probe.includes("mode===\"percent\"")&&
  probe.includes("configuredRank()")&&probe.includes("verifyRaw()")&&
  probe.includes("verifyPercent()")&&probe.includes("applyLeague()")&&
  service.includes('.replace("__FILTERS__",queryFilters)')&&
  service.includes('confirmedSubmittedFiltersGeneration==callbackGeneration')&&
  service.includes('execute("verifyFilters",filters->');
})());
test("Raw zero/percent extremes retain the historical result badges and menu medals",(()=>{
 const result=dock.split('function getResultIcon(')[1].split('let locationEnabled=')[0];
 const menu=dock.split('function getModeMenuIcon(')[1].split('function getResultIcon(')[0];
 return result.includes('if(attack===0&&defense===0&&stamina===0)family="nundo"')&&
  result.includes('if(settings.percentMin===0&&settings.percentMax===0)family="nundo"')&&
  result.includes('if(settings.percentMin===100&&settings.percentMax===100)family="hundo"')&&
  menu.includes('if(min===0&&max===0)family="nundo"')&&
  dock.includes('nundo:{normal:"nundo.png",shiny:"shnundo.png"')&&
  dock.includes('hundo:{normal:"hundo.png",shiny:"shundo.png"');
})());
test("Cascade IV% accepts only 46 attainable percentages",
 dock.includes('const allowed=allowedFor(kind);')&&
 dock.includes('kind==="percent"?IV_PERCENT_VALUES')&&
 dock.includes('entry.allowed.includes(value)')&&
 dock.includes('input.reportValidity()'));
test("Cascade rows highlight the open submenu and preserve the 0/100 header badge",
 dock.includes('button.classList.toggle("chosen",cascadeMode===id)')&&
 dock.includes('button.setAttribute("aria-expanded",String(cascadeMode===id))')&&
 dock.includes('cy.textContent=label')&&dock.includes('specialIVLabel(mode,searchSettings)'));
test("Filter switching shows matching cached results, else keeps older results clearly identified",
 service.includes('boolean preview=restoreFilterPreview();')&&
 service.includes('if(!preview)resultsStale=count()>0;')&&
 service.includes('shownMode=mode;shownConfigJson=filterConfigJson();')&&
 service.includes('shownShiny=shiny&&shinyVerified;resultsStale=false;')&&
 dock.includes('const selectedIcon=getResultIcon(iconMode,iconShiny,iconSettings)')&&
 dock.includes('document.body.classList.toggle("results-stale",hasHistory&&resultsStale)'));
test("Filter failures retain previous cards with a compact status and full diagnostics",
 service.includes('private void searchFailure(String shortReason,String detail)')&&
 service.includes('lastError",detail')&&
 service.includes('status(shortReason+(count()>0?" · resultados anteriores":""))')&&
 service.includes('searchFailure("⚠ Filtros não confirmados"')&&
 service.includes('searchFailure("⚠ Ranking não confirmado"')&&
 service.includes('execute("verifyFilters",filters->'));
test("Each search mode remembers its independent saved fields across app restarts",
 ['rawAttack','rawDefense','rawStamina','glRank','ulRank','ivPercentMin','ivPercentMax'].every(k=>
   service.includes('putInt("'+k+'"')&&service.includes('pref.getInt("'+k+'"'))&&
 service.includes('putString("mode",mode)')&&service.includes('mode=pref.getString("mode",mode)'));
test("Site must reconfirm every search at collection time, even an empty response",
 read("assets/probe.js").includes('criteriaConfirmed:siteCriteria')&&
 service.includes('if(!r.optBoolean("criteriaConfirmed",false))')&&
 service.includes('searchFailure("⚠ Filtro não confirmado"')&&
 service.includes('execute("verifyFilters",filters->'));
test("v0.51 smart Nundo icon is not a separate unsupported search mode",
    dock.includes('custom:{normal:"custom.png"')&&
    dock.includes('percent:{normal:"percent.png"')&&
    dock.includes('nundo:{normal:"nundo.png"')&&
    dock.includes('ml:{normal:"master-league.png"')&&
    dock.includes('cup:{normal:"cup-league.png"')&&
    !service.includes('multiCycleActive'));
test("Exactly 46 attainable IV percentages are offered with 91 and 100 included",(()=>{
 const match=dock.match(/const IV_PERCENT_VALUES=Object\.freeze\((\[[^\]]+\])\)/);
 if(!match)return false;
 const actual=JSON.parse(match[1]);
 const expected=Array.from({length:46},(_,points)=>Math.round(points*100/45));
 return actual.length===46&&new Set(actual).size===46&&
  JSON.stringify(actual)===JSON.stringify(expected)&&
  actual.includes(91)&&actual.includes(100)&&
  !actual.includes(90)&&!actual.includes(92)&&!actual.includes(95);
})());
test("Cascade IV% and league rank limits stay independent and site validated",(()=>{const b=dock.split('function renderModeChoices()')[1]?.split('function renderExtraFilters(')[0]||"";
 return b.includes('kind==="percent"?IV_PERCENT_VALUES')&&
 b.includes('kind==="iv"?16:50')&&
 b.includes('modeDraft[key]=value')&&
 read("assets/probe.js").includes('ATTAINABLE_IV_PERCENTAGES.includes(filters.percentMin)')&&
 read("assets/probe.js").includes('configuredRank()');})());
test("Native validation prevents invalid IV percentages including on saved requests",
 service.includes('private static boolean isAllowedIvPercent(int value)')&&
 service.includes('if(ivPercentageForSum(total)==value)return true;')&&
 service.includes('!isAllowedIvPercent(min)||!isAllowedIvPercent(max)||min>max')&&
 service.includes('!within(gl,1,50)||!within(ul,1,50)'));
test("Legacy IV percent migration expands only as necessary without trimming Pokémon",
 service.includes('ivPercentMin=floorIvPercent(previousMin)')&&
 service.includes('ivPercentMax=Math.max(ivPercentMin,ceilIvPercent(previousMax))')&&
 service.includes('putInt("ivPercentMin",ivPercentMin)')&&
 service.includes('putInt("ivPercentMax",ivPercentMax)'));


test("UX-MENU-01 keeps original 12 commands but navigates with compact contextual menu",
 dock.includes('id="quickMenuList"')&&dock.includes('id="quickRows"')&&
 dock.includes('body.controls-window #controls{display:none!important}')&&
 dock.includes('case "location":return locationEnabled?(locationVerified?"✓ "+locationRadius+" km":"Pendente"):"OFF"')&&
 dock.includes('function renderQuickMenu()')&&service.includes('Math.min(330,screenWidthDp()-8)'));
test("UX-MENU-01 keeps independent cascade, filters, alerts, info and appearance panels",
 dock.includes('function renderModeChoices()')&&dock.includes('modeCascadeRail')&&
 dock.includes('function renderFiltersChoices()')&&dock.includes('function renderAlertsChoices()')&&
 dock.includes('function renderInfoChoices()')&&dock.includes('function renderAppearanceChoices()')&&
 dock.includes('renderExtraFilters(panel,make)'));
test("UX-MENU-01 persists ordered and hidden commands without hiding close",
 service.includes('void saveMenuPrefs(String json)')&&
 service.includes('!"close".equals(id)')&&
 dock.includes('quickPrefs.hidden.filter(x=>x!==id)')&&
 dock.includes('return {direction:"horizontal", // Fixed old-style thin ribbon; no tall menu.'));
test("UX-MENU-01 visibility toggles cannot invent unverified data",
 service.includes('void setResultTextVisible(boolean value)')&&
 dock.includes('showResultText=!!textVisible;')&&
 dock.includes('verifiedPercent!==null?')&&
 service.includes('void setAlertMode(String value)')&&
 service.includes('void testNotification()'));

// UX-MENU-02 · explicit visual checkpoint, no APK build or site claim.
test("UX-MENU-02 orders Modos, Filtros, Localização and Pokémon consecutively",
 dock.includes('["mode","☷","Modos","mode"],["sh","✨","Shiny Only","sh"],["filters","≡","Filtros","filters"]')&&
 dock.includes('["location","⌾","Localização","location"],["pokemon","♧","Pokémon","pokemon"]')&&
 dock.includes('["star","☆","Favoritos","star"],["bell","♧","Alertas","alerts"]'));
test("UX-MENU-02 uses earlier SVG icons for location, alerts, favorites, appearance and support",
 dock.includes('location:"location",bell:"bell",star:"star",donate:"donate"')&&
  dock.includes("appearance:'<path")&&
 dock.includes('source.cloneNode(true)')&&
 dock.includes('["report","⚠","Reportar","report"]')&&
 dock.includes('["donate","♡","Apoiar","donate"]'));
test("UX-MENU-02 Pokémon silhouette opens the official multi-species/form picker",
 dock.includes('pokemon:\'<path')&&
 dock.includes('case "pokemon":toggleChoices("pokemon")')&&
 dock.includes('function renderPokemonChoices()')&&
 dock.includes('function requestPokemonSuggestions(query)')&&
 dock.includes('Native.setSearchConfig(JSON.stringify(next))')&&
 !dock.includes('renderPokemonPlaceholder()'));
test("UX-SHINY-01 restores Shiny ✨ next to Modos using the existing native toggle",
 dock.includes('["mode","☷","Modos","mode"],["sh","✨","Shiny Only","sh"]')&&
 dock.includes('case "sh":Native.shiny();break;')&&
 dock.includes('id==="sh"?(shiny&&!shinyPending)')&&
 !dock.includes('shinyButton.onclick=()=>Native.shiny()'));
test("UX-MENU-04 restores twelve small icons in the old thin row while migrating saved menu",
 dock.includes('id="quickUtilities"')&&
 dock.includes('grid-template-columns:repeat(12,minmax(0,1fr))!important')&&
 dock.includes('body.controls-window #quickRows,')&&
 dock.includes('display:contents!important')&&
 dock.includes('const legacy=!Array.isArray(p.order)||!p.order.includes("pokemon")'));
test("UX-MENU-02 preserves independent Reportar and Apoiar actions",
 dock.includes('case "report":Native.openReport();break;')&&
 dock.includes('case "donate":Native.openPix();break;')&&
 dock.includes('["appearance","⚙","Personalização","appearance"]'));
test("PL-04 OFF does not force Area when default Coords are blank",
 read("assets/probe.js").includes('An empty Coords form is still')&&
 read("assets/probe.js").includes('return JSON.stringify({ok:blank,reason:blank?')&&
 service.includes('locationEnabled?"⚠ Localização não aplicada":"⚠ Pesquisa não confirmada"'));


test("UX-MENU-03 keeps one tiny toolbar, cascade and independent other menus",
 dock.includes('body.controls-window #quickHead{display:none!important}')&&
 dock.includes('grid-template-columns:repeat(12,minmax(0,1fr))!important')&&
 dock.includes('width:88px!important;height:190px!important')&&
 dock.includes('width:220px!important')&&dock.includes('width:306px!important'));
test("UX-MENU-04 keeps twelve icon-first entry points in one thin row",
  dock.includes('const QUICK_DEFAULT_ORDER=QUICK_ACTIONS.map(a=>a[0])')&&
  dock.includes('["mode","☷","Modos","mode"],["sh","✨","Shiny Only","sh"],["filters","≡","Filtros","filters"]')&&
  dock.includes('["location","⌾","Localização","location"],["pokemon","♧","Pokémon","pokemon"]')&&
  dock.includes('["report","⚠","Reportar","report"]')&&
  dock.includes('["donate","♡","Apoiar","donate"]')&&
  dock.includes('["close","×","Fechar","close"]')&&
  service.includes('Math.min(330,screenWidthDp()-8)'));
test("UX-MENU-03 highlights active states by icon without visible labels",
  dock.includes('button.classList.toggle("selected",id==="location"?(locationEnabled&&locationVerified):')&&
  dock.includes('#quickMenuList [data-key=location].selected')&&
  dock.includes('#quickMenuList [data-key=star].selected')&&
  dock.includes('button.title=button.getAttribute("aria-label")+(current?" · "+current:"")'));


test("UX-MENU-04 exposes exactly the approved twelve icons in order",(()=>{
 const chunk=dock.split('const QUICK_ACTIONS=[')[1]?.split('];')[0]||"";
 const keys=[...chunk.matchAll(/\["([a-z]+)","[^"]+","[^"]+","[^"]+"\]/g)].map(m=>m[1]);
 return JSON.stringify(keys)===JSON.stringify(["mode","sh","filters","location","pokemon","star",
   "bell","period","appearance","report","donate","close"])&&
   chunk.includes('"period"')&&!chunk.includes('"info"')&&
   chunk.includes('["sh","✨","Shiny Only","sh"]')&&
   service.includes('Math.min(330,screenWidthDp()-8)');
})());
test("UX-MENU-04 keeps Informações in Ajustes and restores Atualização beside Alertas",(()=>{
 const body=dock.split('function renderAppearanceChoices()')[1]?.split('if(controlsWindow){')[0]||"";
 return body.includes('uxPanel("PERSONALIZAÇÃO")')&&
  body.includes('uxOption(panel,"Informações dos Pokémon","Configurar ›",()=>toggleChoices("info"))')&&
  dock.includes('["period","↻","Atualização","period"]')&&
  dock.includes('back.onclick=()=>{choiceOpen="appearance";renderAppearanceChoices();}')&&
  dock.includes('function renderInfoChoices()')&&
  service.includes('void setIntervalMinutes(int minutes)');
})());
test("UX-SPRITE-PMG-01 offers three direct size options with persistent Android values",()=>{
 const appearance=dock.split('function renderAppearanceChoices(){')[1]?.split('const title=document.createElement("div");title.className="uxSubheading"')[0]||"";
 const selector=dock.split('function renderSpriteSizeButtons(panel,visual=false){')[1]?.split('function renderAppearanceChoices(){')[0]||"";
 return appearance.includes("renderSpriteSizeButtons(panel);")&&
  selector.includes('[["P",35],["M",45],["G",55]]')&&
  selector.includes('Native.setSpriteSize(size)')&&
  selector.includes('button.setAttribute("aria-label","Sprite "+label')&&
  service.includes('void setSpriteSize(int size)')&&
  service.includes('if(size!=35&&size!=45&&size!=55)return;')&&
  service.includes('putInt("spriteSize",size).apply()')&&
  service.includes('void cycleSpriteSize()');
});
test("UX-MENU-04 preserves all old Android feature bridges and migrates 12-icon preferences",(()=>{
 const bridge=["setIntervalMinutes","refresh","toggleTimers","setResultTextVisible","setAlertMode",
  "openWatchList","openReport","openPix"];
 return bridge.every(name=>service.includes('void '+name+'('))&&
 dock.includes('p.order.some(id=>!ids.includes(id))')&&
 dock.includes('const QUICK_UTILITY_IDS=[];')&&
 service.includes('String[] allowed={"mode","sh","filters","location","pokemon","star",')&&
 service.includes('"bell","period","appearance","report","donate","close"')&&
 dock.includes('["sh","✨","Shiny Only","sh"]')&&
 dock.includes('grid-template-columns:repeat(12,minmax(0,1fr))!important');
})());


test("UX-SHINY-02 keeps Shiny beside Modos through saved preferences and native gating",(()=>{
 const prefs=dock.split("function normalizedQuickPrefs(p){")[1]?.split("function saveQuickPrefs()")[0]||"";
 const state=dock.split("function refreshQuickMenuStates(){")[1]?.split("function uxPanel(")[0]||"";
 const click=dock.split("function quickClick(id){")[1]?.split("const QUICK_SVG=")[0]||"";
 return prefs.includes('order.splice(modeIndex+1,0,"sh")')&&
  prefs.includes('"period","sh"')&&
  click.includes('case "sh":Native.shiny();break;')&&
  dock.includes('if(id==="sh")button.setAttribute("aria-pressed",String(shiny&&!shinyPending))')&&
  state.includes('button.classList.toggle("pending",id==="sh"&&shinyPending)')&&
  state.includes('id==="sh"?(shiny&&!shinyPending)')&&
  dock.includes('[data-key=sh].selected')&&dock.includes('[data-key=sh].pending')&&
  service.includes('!"sh".equals(id)')&&
  service.includes('siteConfirmsShinyAccount(session)')&&
  !dock.split("function getResultIcon(")[1].split("let locationEnabled=")[0].includes('result-icons/modes/');
})());
test("PSC-Shiny requires official linked trainer card plus valid 12-digit code",
 service.includes('private boolean hasConfirmedTrainerLink()')&&
 service.includes('"linked".equals(p.getString("profileTrainerState","unknown"))')&&
 service.includes('p.getString("profileTrainerCode","").matches("[0-9]{12}")')&&
 service.includes('!p.getString("profileTrainerName","").trim().isEmpty()'));
test("Shiny switch checks live authentication AND confirmed official badge",
 service.includes('"autenticada".equals(session.optString("auth",""))')&&
 service.includes('session.optBoolean("trainerLinked",false)||hasConfirmedTrainerLink()')&&
 service.includes('revertUnverifiedShiny("✨ Conta logada e treinador confirmado são obrigatórios para Shiny.")'));
test("Guest public search continues even if stale Shiny preference was ON",
 service.includes('if(shiny&&!siteConfirmsShinyAccount(session))')&&
 service.includes('revertUnverifiedShiny("✨ Shiny exige login e treinador vinculado · busca comum liberada")')&&
 service.includes('execute("prepareSearch",prepared->{')&&
 service.includes('private void refresh(boolean manual)'));
test("Shiny OFF and normal search never depend on login or trainer linkage",
 service.includes('if(!shiny){applyShinyOnSite(generation,0);return;}')&&
 service.includes('if(!shiny){\n                // OFF never requires signing in')&&
 !service.includes('if(!hasConfirmedTrainerLink())return;\n        execute("session"'));
test("Authenticated profile cannot inherit previous trainer link",
 main.includes('.putString("profileTrainerState","unknown")')&&
 main.includes('a newly confirmed OAuth session may belong to another account'.replace(/^a/,"A"))&&
 main.includes('"unlinked".equals(state)?"unlinked":"unknown"')&&
 main.includes('Buscas comuns sem login · Shiny exige treinador vinculado'));


test("UL uses user's StarUL art only in Modos, never Cup or result sprites",
 dock.includes('gl:"StarGL.png",ul:"StarUL.png"')&&
 dock.includes('gl:"gl-triangle.png",ul:"ul-triangle.png"')&&
 dock.includes('ul:{normal:"ultra-league.png",shiny:"ultra-league-shiny.png"')&&
 dock.includes('cup:{normal:"cup-league.png"')&&
 dock.includes('baseFamily==="ul"?Number(settings.ulRank)')&&
 dock.includes('baseFamily==="cup"?"CUP"'));
test("REG-51049 opening Modos never starts background filter-option discovery",
 (()=>{
 const block=dock.split('if(kind==="mode"){')[1]?.split('const current=period;')[0]||"";
 return block.includes('renderModeChoices()')&&!block.includes("requestFilterOptions")&&
  !block.includes('Native.locationEditor(true)')&&
  dock.includes('if(choiceOpen==="filters"&&modeDraft)');
 })());
test("REG-51049 filters cannot replace a cascade editing session",
 dock.includes('if(choiceOpen==="filters")renderFiltersChoices();else renderModeChoices();')&&
 dock.includes('if(choiceOpen==="filters"&&modeDraft)')&&
 dock.includes('cascadeMode=cascadeMode===id?null:id')&&
 dock.includes('const next={...modeDraft}'));
test("REG-51049 OFF public search ignores inert radius while refusing residual coordinates",
 (()=>{
 const src=read("assets/probe.js");
 return src.includes('The radius')||(
  src.includes('A prefilled radius is an INERT site default')&&
  src.includes('const blank=!locationValue(fields.coords);')&&
  src.includes('const previousCoords=locationValue(fieldsBefore.coords);'));
 })());



test("UX-MENU-06 refresh directly after Alertas and personalization before Reportar",()=>{
 const raw=dock.split("const QUICK_ACTIONS=[")[1]?.split("];")[0]||"";
 const ids=[...raw.matchAll(/\["([a-z]+)","[^"]+","[^"]+","[^"]+"\]/g)].map(x=>x[1]);
 return ids.length===12&&ids.indexOf("sh")===ids.indexOf("mode")+1&&
  ids.indexOf("period")===ids.indexOf("bell")+1&&
  ids.indexOf("appearance")===ids.indexOf("report")-1&&
  dock.includes('case "bell":toggleChoices("alerts")')&&
  dock.includes('now.textContent="↻ Atualizar agora"')&&
  dock.includes('btn.className=value===current?"chosen":""')&&
  dock.includes('rows.appendChild(button)')&&
  service.includes('"bell","period","appearance","report","donate","close"');
});
// UX-MODE-ICONS: use approved uploaded assets, keep the 11-button ribbon.
test("Seven approved Mode PNGs optimized to 128px RGBA and backed up",()=>{
 const names=["0Star.png","1Star.png","2Star.png","3Star.png","StarIVRaw.png","StarGL.png","StarUL.png"];
 return names.every(name=>{
  const asset=path.join(root,"assets/result-icons/modes",name);
  if(!fs.existsSync(asset))return false;
  const b=fs.readFileSync(asset);
  return b.subarray(0,8).equals(Buffer.from("89504e470d0a1a0a","hex"))&&
   b.readUInt32BE(16)===128&&b.readUInt32BE(20)===128&&b.length<100000;
 });
});
test("Mode PNGs retain legacy vector fallback and 17px display only",()=>{
 const dir=path.join(root,"assets/result-icons/modes");
 return ["iv-custom.svg","iv-percent.svg","iv-unfiltered.svg"].every(name=>{
  const f=path.join(dir,name);return fs.existsSync(f)&&fs.readFileSync(f,"utf8").startsWith("<svg");
 })&&dock.includes("body.controls-window #quickMenuList .quickModeImage")&&
 dock.includes("width:17px!important;height:17px!important")&&
 dock.includes('position:absolute!important;top:50%!important;left:50%!important')&&
 dock.includes('background:transparent!important;border:0!important;box-shadow:none!important');
});
test("Modos chooses exact Drive PNGs across 0–3 stars and GL/UL",()=>{
 const vm=require("node:vm");
 const start=dock.indexOf("const RESULT_ICONS=Object.freeze("),end=dock.indexOf("let locationEnabled=",start);
 if(start<0||end<start)return false;
 const definitions=dock.slice(start,end),base={attack:0,defense:15,stamina:15,glRank:1,ulRank:12,percentMin:0,percentMax:100};
 const get=(m,cfg)=>vm.runInNewContext(definitions+"\ngetModeMenuIcon("+JSON.stringify(m)+",false,"+
  JSON.stringify({...base,...cfg})+")",{}, {timeout:2000});
 const raw0=get("raw",{attack:0,defense:0,stamina:0});
 const raw100=get("raw",{attack:15,defense:15,stamina:15});
 const rawOther=get("raw",{attack:2,defense:15,stamina:9});
 const gl=get("gl",{glRank:1}),ul=get("ul",{ulRank:12});
 const cases=[
  [0,0,"0Star.png"],[100,100,"3Star.png"],
  [0,98,"2Star.png"],[2,100,"2Star.png"],[2,98,"2Star.png"],[0,100,"2Star.png"],
  [0,50,"1Star.png"],[0,49,"1Star.png"],
  [49,49,"0Star.png"],[51,51,"1Star.png"],[64,64,"1Star.png"],
  [67,67,"2Star.png"],[80,80,"2Star.png"],[82,82,"3Star.png"],
  [51,64,"1Star.png"],[67,80,"2Star.png"],[82,98,"3Star.png"],[82,100,"3Star.png"]
 ];
 return raw0.path.endsWith("/0Star.png")&&raw100.path.endsWith("/3Star.png")&&
   rawOther.path.endsWith("/StarIVRaw.png")&&gl.path.endsWith("/StarGL.png")&&gl.ivBadge==="#1"&&
   ul.path.endsWith("/StarUL.png")&&ul.ivBadge==="#12"&&
   cases.every(([min,max,file])=>{
     const icon=get("percent",{percentMin:min,percentMax:max});
     return icon.path.endsWith("/"+file)&&icon.family!=="none"&&!icon.ivBadge;
   });
});
test("Only refresh actions appear in Atualização: no path to Ajustes",()=>{
 const code=dock.split('title.textContent="ATUALIZAÇÃO"')[1]?.split("function renderModeChoices()")[0]||"";
 return !code.includes("‹ Ajustes")&&!code.includes('choiceOpen="appearance"')&&
  code.includes('manualRefreshTap()')&&code.includes('Native.setIntervalMinutes(period)');
});
test("Modos changes UL result base only; menu rank overlays centered",(()=>{const menu=dock.split("function getModeMenuIcon(")[1]?.split("// Historical result icons")[0]||"";
 const result=dock.split("function getResultIcon(")[1]?.split("let locationEnabled=")[0]||"";
 return menu.includes('result-icons/modes/')&&
 !result.includes('result-icons/modes/')&&
 result.includes('baseFamily==="ul"?"file:///android_asset/result-icons/ultra-league.png"')&&
 dock.includes('rank.textContent=art.ivBadge')&&
 dock.includes('transform:translate(-50%,-50%)!important');})());
test("Thin bar Modos icon redraws on filter/rank change and does not add buttons",()=>{
 const block=dock.split('function refreshQuickMenuStates()')[1]?.split('function uxPanel(')[0]||"";
 return dock.includes('button.dataset.modeArtKey=art.path+"|"+art.ivBadge')&&
   block.includes('previous.replaceWith(iconForQuick("mode","☷"))')&&
   dock.includes('rank.textContent=art.ivBadge')&&
   dock.includes('grid-template-columns:repeat(12,minmax(0,1fr))!important');
});


test("VIS team artworks are mapped to existing verified Home assets",()=>{
 const items=["ps_team_mystic.png","ps_team_valor.png","ps_team_instinct.png","ps_team_neutral.png",
   "ps_home_background_dark.png"];
 return items.every(n=>fs.existsSync(path.join(root,"res/drawable-nodpi",n)))&&
  main.includes('teamBadge.setImageResource(homeTeamIcon(linked?team:""))')&&
  main.includes('return R.drawable.ps_team_neutral;')&&
  main.includes('pageBackground.setScaleType(ImageView.ScaleType.FIT_XY)')&&
  main.includes('dim.setBackgroundColor(Color.argb(16,6,12,24))');
});
test("VIS tiny white Pokemon and pencil-gear are independent SVG toolbar icons",()=>{
 const source=dock.split('const QUICK_SOURCE_ICONS=')[1]?.split('function iconForQuick')[0]||"";
 return dock.includes('appearance:\'<path')&&
  dock.includes('pokemon:\'<path')&&
  !source.includes('appearance:"gear"')&&
  dock.includes('[data-key=pokemon] .quickGlyph')&&
  dock.includes('[data-key=appearance] .quickGlyph{color:#f4f6fa!important}')&&
  dock.includes('grid-template-columns:repeat(12,minmax(0,1fr))!important');
});
test("PL-04 final site verification happens after IV filters and before Search",()=>{
 const verified=service.indexOf('execute("verifyFilters",filters->');
 const finalVerify=service.indexOf('execute("verifyLocation:"+locationPayload(),lastLocation->',verified);
 const submit=service.indexOf('execute("submitSearch",submitted->',verified);
 return verified>=0&&finalVerify>verified&&submit>finalVerify&&
  service.includes('locationVerified=locationEnabled;')&&
  service.includes('searchFailure(locationEnabled?"⚠ Localização não aplicada":"⚠ Localização residual"')&&
  dock.includes('locationVerified=!!verifiedLocation&&locationEnabled;')&&
  dock.includes('geoControl.classList.toggle("locOn",geoConfirmed)')&&
  dock.includes('id==="location"?(locationEnabled&&locationVerified)');
});
test("HOME real Google photo is retried and extracted only from trusted profile",()=>{
 const p=read("assets/profile_summary.js");
 return p.includes('parsed.origin===location.origin&&parsed.pathname==="/_next/image"')&&
  p.includes('parsed.hostname.endsWith(".googleusercontent.com")')&&
  main.includes('shownAvatarUrl=""')&&
  main.includes('if(bitmap==null)runOnUiThread')&&
  main.includes('allowedGoogleAvatar(redirected)')&&
  main.includes('avatarReadRetryCount<2')&&
  main.includes('view.postDelayed(()->captureOfficialProfile(view,generation),700L)')&&
  !p.includes('document.cookie')&&!p.includes('localStorage');
});

// v0.51 additional filters: do not add toolbar actions or replace artwork.
test("Duplicate popup Shiny removed: only independent toolbar ✨ remains",
 dock.includes('["mode","☷","Modos","mode"],["sh","✨","Shiny Only","sh"]')&&
 dock.includes('case "sh":Native.shiny();break;')&&
 !dock.includes('modeShiny')&&!dock.includes('heading.appendChild(shinyButton)'));
test("UX-MODOS-CASCADE-03 uses classic 6-row menu, no oversized wheels",(()=>{const b=dock.split("function renderModeChoices(){")[1]?.split("function renderExtraFilters(")[0]||"";
 return dock.includes('modeCascadeRail')&&
 dock.includes('modeCascadeEditor')&&
 dock.includes('width:88px!important;height:190px!important')&&
 dock.includes('height:27px!important;min-height:27px!important')&&
 b.includes('const offsets={raw:76,percent:103,gl:130,ul:154}')&&
 b.includes('editor.append(confirm,cancel)')&&
 !b.includes('modeWheel')&&
 !b.includes('Native.shiny()');})());
test("UX-MODOS-CASCADE-04 confirms or cancels only the chosen lateral editor",
 dock.includes('confirm.className="modeCascadeConfirm"')&&
 dock.includes('cancel.className="modeCascadeCancel"')&&
 dock.includes('confirm.onclick=()=>')&&
 dock.includes('cancel.onclick=()=>{if(controlsWindow)Native.locationEditor(false);')&&
 dock.includes('input.setCustomValidity("Escolha um valor permitido")')&&
 dock.includes('Native.setSearchConfig(JSON.stringify(next))'));
test("Existing toolbar Shiny remains next to mode, with exactly twelve actions",
  dock.indexOf('id="sh"')>dock.indexOf('id="cycle"')&&
  (dock.match(/<button id="(?:cycle|sh|period|manualRefresh|size|clock|bell|star|location|report|donate|close)"/g)||[]).length===12);
test("Sort by remains among existing verified advanced filters",
  dock.includes('renderExtraFilters(panel,make)')&&
  dock.includes('option("sortBy","Sort by")')&&
  dock.includes('const RESULT_ICONS=Object.freeze'));
test("UX-OTHER-01 isolates compact secondary popups from the cascading Modos layout",
 dock.includes('panel.classList.remove("locationPanel","modeCascade","modeCascadeOpen"')&&
 dock.includes('panel.classList.add("visible","modePanel","standardPanel")')&&
 dock.includes('panel.dataset.panelKind=choiceOpen')&&
 dock.includes('data-panel-kind="filters"')&&dock.includes('data-panel-kind="appearance"')&&
 dock.includes('data-panel-kind="alerts"')&&dock.includes('data-panel-kind="info"')&&
 dock.includes('data-panel-kind="period"')&&dock.includes('max-height:min(350px,var(--popup-room,400px))')&&
 dock.includes('overflow-y:auto!important;overflow-x:hidden!important'));
test("UX-OTHER-02 all submenus close explicitly without changing their saved settings",
 dock.includes('close.className="choiceClose";close.textContent="×"')&&
 dock.includes('close.setAttribute("aria-label","Fechar "+title)')&&
 dock.includes('close.onclick=closeChoices')&&
 dock.includes('const panel=uxPanel(label);panel.dataset.panelKind="filters";panel.classList.add("filterPicker")')&&
 dock.includes('panel.classList.add("standardPanel","visible");panel.dataset.panelKind="period"')&&
 dock.includes('close.onclick=closeChoices;title.appendChild(close);')&&
 dock.includes('delete document.getElementById("choices").dataset.panelKind'));
test("UX-OTHER-03 neither Filters nor Location force keyboard without field focus",
 dock.includes('if(controlsWindow&&Native.requestFilterOptions)Native.requestFilterOptions();')&&
 dock.includes('field.onfocus=()=>{if(controlsWindow)Native.locationEditor(true);}')&&
 dock.includes('input.onfocus=()=>{if(controlsWindow)Native.locationEditor(true);}')&&
 !dock.includes('if(controlsWindow){Native.locationEditor(true);if(Native.requestFilterOptions)'));
test("UX-OTHER-04 scroll position remains reachable on toggles and popup switching",
 dock.includes('appearanceScrollTop=panel.scrollTop')&&
 dock.includes('panel.scrollTop=scrollRestoration')&&
 dock.includes('modeScrollTop=panel.scrollTop')&&
 dock.includes('position:sticky;top:0;z-index:5')&&
 dock.includes('position:sticky;bottom:0;z-index:5'));
test("Filters remain independent of cascade and retain their popup dimensions",
 dock.includes('section("Filtros gerais"')&&dock.includes('section("Filtros avançados"')&&
 dock.includes('#choices.modePanel{width:232px')&&dock.includes('function renderExtraFilters('));
test("Site dropdown options are discovered instead of inventing weather/form values",
  dock.includes('filterOptions=response.partial?')&&
  dock.includes('Native.requestFilterOptions()')&&
  !dock.includes('option("weather","Sunny")'));
test("Mode popup allows keyboard focus for optional numeric and Pokémon inputs",
  dock.includes('if(controlsWindow&&Native.requestFilterOptions)Native.requestFilterOptions();')&&
   dock.includes('input.onfocus=()=>{if(controlsWindow)Native.locationEditor(true);}'));
test("Extra search filters are saved and transported to the site probe",
  service.includes('private String extraFiltersJson="{}"')&&
  service.includes('putString("extraFiltersJson",extraFiltersJson)')&&
  service.includes('while(keys.hasNext())'));
test("Site Sort by is applied before collecting ten cards; original site order is retained",
  service.includes('if("site".equals(sort))')&&
  service.includes('for(JSONObject card:a)inSiteOrder.put(card)')&&
  service.includes('public void requestFilterOptions()'));
test("New filter settings reject invalid CP/level intervals",
  service.includes('{"cpMin","cpMax"}')&&service.includes('{"levelMin","levelMax"}')&&
  service.includes('Double.parseDouble(low)>Double.parseDouble(high)'));

test("After Search results use same-generation pre-submit proof when the filter form is hidden",
 service.includes('confirmedSubmittedFiltersGeneration==callbackGeneration')&&
 service.includes('validated.put("_preSubmitVerified",true)')&&
 service.includes('confirmedSubmittedFiltersGeneration=-1')&&
 read("assets/probe.js").includes('confirmationSource:confirmation.source'));
test("Missing Shiny switch after navigation can use pre-submit proof, never explicit Shiny-off",
 service.includes('boolean trustedShinyHidden=shiny&&shinyVerified')&&
 service.includes('confirmedSubmittedFiltersGeneration==generation&&shinySwitchMissing')&&
 service.includes('!r.optBoolean("siteShiny",false)'));

test("Result previews use confirmed site data, not new alerts, and prune expired Pokémon",
 service.includes('rememberConfirmedPreview(sorted,now);')&&
 service.includes('recentFilterPreviews.put(filterPreviewKey()')&&
 service.includes('resultsStale=true;')&&
 service.includes('if(expiry>now)alive.put(card)'));
test("Filter cache is memory-only, two minutes, and separated by mode, shiny, location and criteria",
 service.includes('RESULT_PREVIEW_CACHE_TTL_MS=120_000L')&&
 service.includes('locationEnabled+"|"+locationCoords+"|"')&&
 service.includes('locationRadius+"|"+filterConfigJson()')&&
 service.includes('now-cached.confirmedAtMs>RESULT_PREVIEW_CACHE_TTL_MS'));
test("Next search stays on the existing 60-second safety interval",
 service.includes('MIN_SEARCH_GAP_MS=60_000L')&&
 service.includes('nextScheduledSearchAtMs=now+remaining*1000L+300L')&&
 service.includes('handler.postDelayed(queuedRefresh,remaining*1000L+300L)'));
test("Cooldown remains accessible but not drawn over the original compact icon",
 dock.includes('header.title=label+(waiting?')&&
 dock.includes('nextQueryAt=Number(nextDue)||0')&&
 dock.includes('setInterval(updateTimers,1000)')&&
 !dock.includes('content:attr(data-wait)')&&
 (dock.match(/<button id="(?:cycle|sh|period|manualRefresh|size|clock|bell|star|location|report|donate|close)"/g)||[]).length===12);

test("Session probe executable contains all four template substitutions",
 main.includes('.replace("__ACTION__",JSONObject.quote("session"))')&&
 main.includes('.replace("__MODE__",JSONObject.quote("iv"))')&&
 main.includes('.replace("__SHINY__","false")')&&
 main.includes('.replace("__FILTERS__","{}")')&&
 main.includes('view.evaluateJavascript(probe,raw->'));
test("Canceled dialog does not force session refresh or discard sprites",
 main.includes('serviceAction("com.lucianotoscano.pokesearchoverlay.LOGIN_END",authenticatedNow)')&&
 main.includes('if(authenticatedNow)notifyOverlaySessionReady();')&&
 service.includes('if(!"não confirmado".equals(auth))')&&
 service.includes('resultsStale=count()>0;'));


test("UX-ICON-01 uses five base PNGs and keeps 18 historical resources",()=>{
 const dir=path.join(root,"assets/result-icons/base"), names=["none","custom","gl","ul","ml"];
 return names.every(n=>{
  const p=path.join(dir,"base-"+n+".png");if(!fs.existsSync(p))return false;
  const buf=fs.readFileSync(p);
  return buf.subarray(0,8).equals(Buffer.from("89504e470d0a1a0a","hex"))&&buf.readUInt32BE(16)===64&&buf.readUInt32BE(20)===64;
 })&&!fs.existsSync(path.join(dir,"base-cup.png"))&&
 dock.includes('const RESULT_BASE_ICONS=Object.freeze(');
});
test("UX-ICON-01 keeps 35x30 touch area and badges strictly within 21px",
 dock.includes("#resultHeader{width:35px;height:30px")&&
 dock.includes("max-width:21px;max-height:21px;aspect-ratio:1/1;overflow:visible;pointer-events:none")&&
 dock.includes("const headerIconSize=Math.max(17,Math.min(21,Math.round(spriteSize*0.45)));")&&
 ["modeIndicatorValue","modeIndicatorShiny","modeIndicatorBackground"].every(x=>dock.includes('id="'+x+'"')));
test("Results preserve original IV badges, with Shiny and Background as separate effects",
 dock.includes('function getResultIcon(searchMode,shinyActive,settings=searchSettings)')&&
 dock.includes('const badge=family==="hundo"?"100%":family==="nundo"?"0":family==="percent"?"%":rankLabel||(baseFamily==="cup"?"CUP":"");')&&
 dock.includes('shinyBadge:shining')&&
 dock.includes('backgroundOnly===true&&settings.backgroundVerified===true'));
test("UX-ICON-01 does not silently introduce unimplemented searches",
 dock.includes('baseFamily==="cup"?"CUP"')&&
 !dock.includes('row("none"')&&!dock.includes('row("ml"')&&!dock.includes('row("cup"'));

test("PL-01 PSC-02 JS collector refuses unknown raw and percent IV",()=>{
 const probe=read("assets/probe.js");
 return probe.includes("function verifiedCardIv(card)")&&
  probe.includes('return evidence.raw!==""&&evidence.raw===target;')&&
  probe.includes('if(!evidence||evidence.percent===null)return false;')&&
  !probe.includes('return !x.iv||x.iv===target')&&
  !probe.includes('return x.ivPercent===""||');
});
test("PL-01 PSC-02 native IV gate runs before display, cache and alerts",()=>{
 const verify=service.indexOf("private boolean verifiedTargetCriteria(JSONObject card)");
 const apply=service.indexOf("private void applyCollectedResults(JSONObject r)");
 const nativeGate=service.indexOf("if(card!=null&&verifiedTargetCriteria(card))verified.put(card)",apply);
 const newResults=service.indexOf("recordNewResults(sorted,",apply);
 return verify>=0&&nativeGate>apply&&newResults>nativeGate&&
  service.includes("if(!isAllowedIvPercent(actual)||(computed>=0&&actual!=computed))return false;")&&
  !service.includes('return iv.isEmpty()||')&&!service.includes('if(pct.isEmpty())return true;')&&
  service.includes('searchFailure("⚠ IV não comprovado"');
});


// UI-PAL-01: IV evidence and palette are presentation-only; Shiny never recolors IV.
const ivScriptStart=dock.indexOf("const IV_PERCENT_VALUES=Object.freeze(");
const ivScriptEnd=dock.indexOf("let modeDraft=",ivScriptStart);
const ivScript=dock.slice(ivScriptStart,ivScriptEnd);
const [verifiedSpawnIvPercent,ivPaletteClass]=require("node:vm").runInNewContext(
 ivScript+"\n[verifiedSpawnIvPercent,ivPaletteClass]",{});
test("IV palette follows 46 attainable percentages including both extremes",(()=>{
 const pairs=[[0,"zero"],[2,"low"],[49,"low"],[51,"medium"],[78,"medium"],
              [80,"high"],[89,"high"],[91,"excellent"],[98,"excellent"],[100,"perfect"]];
 return pairs.every(([pct,name])=>ivPaletteClass(pct)===name)&&
        ivPaletteClass(null)==="unknown"&&ivPaletteClass(50)==="unknown";
})());
test("Shiny and ordinary IV badges use a single evidence-driven function",
 dock.includes('const verifiedPercent=verifiedSpawnIvPercent(c);')&&
 dock.includes("ivPaletteClass(verifiedPercent)")&&
 dock.includes("'+icon+ivBadge+badge+info+'</button>'")&&
 !dock.includes("shiny?ivPaletteClass")&&
 dock.includes('verifiedPercent===null?"IV não comprovado"'));
test("Verified IV includes 0%, 100% and raw-derived values but never assumes a missing value",(()=>{
 const percent=(iv,ivPercent)=>verifiedSpawnIvPercent({iv,ivPercent});
 return percent("0/0/0","0")===0&&percent("15/15/15","100")===100&&
        percent("11/15/15","")===91&&percent("","51")===51&&
        percent("","")===null&&percent("2/3/99","")===null;
})());
test("Contradictory, non-attainable or malformed IV never receives a palette color",(()=>{
 const wrong=[{iv:"4/4/11",ivPercent:"100"},{iv:"",ivPercent:"50"},
              {iv:"",ivPercent:"101"},{iv:"0/0/0",ivPercent:"2"},
              {iv:"16/15/15",ivPercent:""},{iv:"3/3/3",ivPercent:"5"}];
 return wrong.every(card=>verifiedSpawnIvPercent(card)===null);
})());
test("Compact IV label stays inside existing row, clear of the despawn timer",(()=>{
 const css=dock.match(/\.spawn \.ivPct\{[^}]+\}/)?.[0]||"";
 return css.includes("position:absolute")&&css.includes("left:0;bottom:0")&&
        css.includes("max-width:29px")&&css.includes("background:transparent")&&css.includes("pointer-events:none")&&
        dock.includes(".timer{position:absolute;right:0;bottom:0")&&
        dock.includes("#resultHeader{width:35px;height:30px");
})());
test("Shiny sparkle is independent neutral, header extremes match the IV palette",(()=>{
 const css=dock.match(/\.modeIndicator\.shiny\{[^}]+\}/)?.[0]||"";
 return css.includes("background:transparent")&&css.includes("color:inherit")&&dock.includes('id="modeIndicatorShiny" class="modeIndicator shiny">✨</span>')&&
        dock.includes('primaryBadge.classList.toggle("zero",selectedIcon.family==="nundo")')&&
        dock.includes('primaryBadge.classList.toggle("perfect",selectedIcon.family==="hundo")')&&
        dock.includes(".modeIndicator.value.zero{color:#00cfe8}")&&
        dock.includes(".modeIndicator.value.perfect{color:#f04b70}");
})());

test("UX-ICON-02 selected GL/UL threshold is displayed as a #N badge",()=>{
 const block=dock.split("function getResultIcon(")[1].split("let locationEnabled=")[0];
 return block.includes('baseFamily==="gl"?Number(settings.glRank)')&&
 block.includes('baseFamily==="ul"?Number(settings.ulRank)')&&
 block.includes('topN>=1&&topN<=50?"#"+topN')&&block.includes('ivBadge:badge');
});
test("RESULT-RESTORE all historical effects intact with only corrected UL base",(()=>{const result=dock.split('function getResultIcon(')[1].split('let locationEnabled=')[0];
 const toolbar=dock.split('function getModeMenuIcon(')[1].split('function getResultIcon(')[0];
 const draw=dock.split('function draw(){')[1].split('function updateTimers(){')[0];
 return result.includes('baseFamily==="ul"?"file:///android_asset/result-icons/ultra-league.png"')&&
 result.includes('fallbackPath:"file:///android_asset/result-icons/base/"+RESULT_BASE_ICONS.none')&&
 !result.includes('result-icons/modes/')&&toolbar.includes('result-icons/modes/')&&
 draw.includes('const selectedIcon=getResultIcon(iconMode,iconShiny,iconSettings)')&&
 draw.includes('selectedIcon.shinyBadge')&&draw.includes('selectedIcon.backgroundBadge')&&
 dock.includes('animation:psCapturePulse');})());
test("UX-CASCADE retains requested popup height while visual editor changes orientation",
 service.includes("private int menuRequestedHeightDp=MENU_BASE_DP;")&&
 service.includes("Math.max(0,dp(menuRequestedHeightDp)-rowHeight)")&&
 service.includes("menuRequestedHeightDp=Math.max(visualMenuBaseDp(),Math.min(maxMenuHeight,desiredDp))")&&
 !service.includes("int requestedPopup=Math.max(0,menuParams.height-rowHeight)")&&
 dock.includes('choiceOpen==="mode"?baseHeight+190+6')&&
 dock.includes("function positionCascadeEditor()")&&
 dock.includes("rail.scrollTop=Math.max(0,requested+36-visible)")&&
 dock.includes('if(choiceOpen==="mode")positionCascadeEditor()')&&
 service.includes("if(menuParams.width!=width)menuParams.width=width;")&&
 service.includes("menuParams.x=Math.max(0,Math.min(Math.max(0,screen-width),")&&
 dock.includes("if(controlsWindow)Native.locationEditor(false);"));
test("RESULT UL correct historic black-yellow icon, preserving other base artwork",
 dock.includes('baseFamily==="ul"?"file:///android_asset/result-icons/ultra-league.png"')&&
 dock.includes('gl:"base-gl.png",ul:"base-ul.png",ml:"base-ml.png"')&&
 dock.includes('cup:{normal:"cup-league.png",shiny:"cup-league-shiny.png"')&&
 dock.includes('fallbackPath:"file:///android_asset/result-icons/base/"+RESULT_BASE_ICONS.none'));
test("RESULT-RESTORE GL/UL still preserve result effects; UL now uses correct Ultra League PNG",()=>{
 const vm=require("node:vm");
 const start=dock.indexOf("const RESULT_ICONS=Object.freeze("),end=dock.indexOf("let locationEnabled=",start);
 const fn=dock.slice(start,end);
 const base={attack:15,defense:15,stamina:15,percentMin:2,percentMax:98,glRank:1,ulRank:12};
 const get=(m,shiny,extra={})=>vm.runInNewContext(fn+"\ngetResultIcon("+JSON.stringify(m)+","+shiny+","+JSON.stringify({...base,...extra})+")",{}, {timeout:2000});
 const gl=get("gl",false),ul=get("ul",false),perfect=get("raw",false),zero=get("raw",false,{attack:0,defense:0,stamina:0});
 const range=get("percent",false),all=get("percent",false,{percentMin:0,percentMax:100});
 return gl.path.endsWith("/base-gl.png")&&gl.ivBadge==="#1"&&
  ul.path.endsWith("/ultra-league.png")&&ul.ivBadge==="#12"&&
  perfect.path.endsWith("/base-custom.png")&&perfect.ivBadge==="100%"&&
  zero.path.endsWith("/base-custom.png")&&zero.ivBadge==="0"&&
  range.path.endsWith("/base-custom.png")&&range.ivBadge==="%"&&all.ivBadge==="%"&&
  get("ul",true).shinyBadge===true&&
  get("ul",false,{backgroundOnly:true,backgroundVerified:true}).backgroundBadge===true;
});
test("Mode emblems preserve historical fallback artwork without Cup alias",()=>{
 const fn=dock.split("function getModeMenuIcon(")[1]?.split("function getResultIcon(")[0]||"";
 return fn.includes('gl:"StarGL.png",ul:"StarUL.png"')&&
  fn.includes('fallbackPath:legacyFallback[family]')&&
  fn.includes('"file:///android_asset/result-icons/base/"+baseName')&&
  !fn.includes('base-cup.png');
});
test("UX-ICON-02 capture animation reacts to native search state",()=>{
 return service.includes('","+searchInProgress+","+showResultText+')&&
 dock.includes("isSearching=false,textVisible=false")&&dock.includes("searchActive=!!isSearching;")&&
 dock.includes('activeSearchPhase==="searching"&&!shinyPending&&nextQueryAt<=Date.now()')&&
 dock.includes('id="capturePulse"')&&dock.includes('@keyframes psCapturePulse')&&
 dock.includes('prefers-reduced-motion:reduce');
});
test("UX-ICON-02 sizes, static click control and timers remain intact",()=>{
 return dock.includes('#resultHeader{width:35px;height:30px')&&
 dock.includes('max-width:21px;max-height:21px')&&
 dock.includes('width:29%;height:29%')&&dock.includes('pointer-events:none')&&
 !dock.includes('setAttribute("data-wait"')&&dock.includes("Native.toggleResultsCollapsed()");
});

test("UX-FIX-01 keeps Pokéballs square without cropping or resizing badge area",()=>{
 const base=dock.match(/\.resultModeStack\{[^}]+\}/)?.[0]||"";
 const img=dock.match(/\.resultModeStack img\{[^}]+\}/)?.[0]||"";
 const label=dock.match(/\.modeIndicator\.value\{[^}]+\}/)?.[0]||"";
 return base.includes("aspect-ratio:1/1")&&base.includes("overflow:visible")&&
 img.includes("object-fit:contain")&&img.includes("aspect-ratio:1/1")&&
 label.includes("background:transparent")&&label.includes("bottom:-2px");
});
test("UX-FIX-01 Shiny emoji is plain and independent of IV color",()=>{
 const css=dock.match(/\.modeIndicator\.shiny\{[^}]+\}/)?.[0]||"";
 return dock.includes('id="modeIndicatorShiny" class="modeIndicator shiny">✨</span>')&&
 css.includes("background:transparent")&&css.includes("color:inherit");
});
test("UX-FIX-01 per-spawn IV is hidden by default, but accessibility remains",()=>{
 return dock.includes("let showResultText=false;")&&
 dock.includes('!metadataVisible&&showResultText&&verifiedPercent!==null?')&&
 dock.includes('verifiedPercent===null?"IV não comprovado"')&&
 dock.includes('aria-label=')&&dock.includes('esc(label)');
});
test("UX-FIX-01 no floating cooldown or Toast, despawn switch remains",()=>{
 return !dock.includes('setAttribute("data-wait"')&&
 !dock.includes('#resultHeader[data-wait]')&&
 dock.includes('showTimers&&deadline')&&
 !service.includes('Toast.makeText(this,"↻ Nova busca em');
});
test("UX-FIX-01 60s local cooldown bypass is debug-only",()=>{
 return service.includes('private boolean skipLocalGapInDebug()')&&
 service.includes('android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE')&&
 service.includes('long earliest=skipLocalGapInDebug()?0L:previous+MIN_SEARCH_GAP_MS;')&&
 service.includes('earliest=Math.max(earliest,remoteDrainUntilMs);')&&
 service.includes('private static final long MIN_SEARCH_GAP_MS=60_000L;')&&
 service.includes('if(searchInProgress){');
});
test("UX-FIX-01 brighter capture pulse uses confirmed searching status",()=>{
 const pulse=dock.match(/\.capturePulse\{[^}]+\}/)?.[0]||"";
 return pulse.includes("left:50%;top:50%")&&pulse.includes("width:29%;height:29%")&&
 pulse.includes("background:#f5ffff")&&dock.includes("searchActive=!!isSearching;")&&
 dock.includes("@keyframes psCapturePulse")&&dock.includes("prefers-reduced-motion:reduce");
});
test("Test-Android: orange stale-results dot is hidden but source provenance survives",()=>{
 return !dock.includes("body.result-window.results-stale #resultHeader::after")&&
  dock.includes('document.body.classList.toggle("results-stale",hasHistory&&resultsStale)')&&
  service.includes('if(!preview)resultsStale=count()>0;')&&
  dock.includes("⚠ Resultados anteriores");
});
test("Test-Android: small IV/rank badges use dark high-contrast letters and no background",()=>{
 const label=dock.match(/\.modeIndicator\.value\{[^}]+\}/)?.[0]||"";
 return label.includes("color:#16191c")&&label.includes("font-size:9px")&&
  label.includes("-webkit-text-stroke:.25px #fff")&&
  label.includes("background:transparent")&&
  dock.includes(".modeIndicator.value.perfect{color:#f04b70}")&&
  dock.includes(".modeIndicator.value.zero{color:#00cfe8}");
});
test("Test-Android: async site form awaits selected Raw and percent tabs",()=>{
 const probe=read("assets/probe.js");
 return probe.includes("function ensureModeTab(")&&
  probe.includes("function prepareCoreFilters()")&&
  probe.includes('if(!ready.ok)')&&probe.includes('stage:"wait-form"')&&
  probe.includes('pending:ready.pending');
});
test("Test-Android: six-field mixed IV mapping requires stat proof",()=>{
 const probe=read("assets/probe.js");
 return probe.includes('function ivInputStat(input)')&&
  probe.includes('if(local.length>2)break;')&&
  probe.includes('values:mapped.map(v=>values[v])')&&
  probe.includes('if(mapped.every(v=>v<0)&&values.every(v=>v===values[0]))');
});
test("Test-Android: reapplying the same filter can retry failed Search",()=>{
 return service.includes('status("Repetindo busca com o filtro atual...")')&&
  service.includes('refresh(true);')&&
  service.includes('private void reconfigureBeforeSubmit(')&&
  service.includes('reconfigureBeforeSubmit(generation,manual,attempt+1,0)')&&
  service.includes("attempt<32");
});
test("PS-009 Android Java inner Bridge invokes outer refresh(boolean) explicitly",()=>{
 const bridge=service.split("private class Bridge")[1]||service.split("class Bridge")[1]||"";
 return bridge.includes('status("Repetindo busca com o filtro atual...");\n                    OverlayService.this.refresh(true);')&&
  service.includes('status(preview?"Prévia anterior do filtro · aguardando nova consulta":"Filtro selecionado · aguardando consulta");\n                scheduleFilterChangeRefresh();')&&
  service.includes('private void scheduleFilterChangeRefresh()');
});
test("PL-02 navigation recovery survives a filter change while loading",()=>{
 const nav=service.split("website.setWebViewClient(new WebViewClient(){")[1]?.split("    @Override public void onCreate()")[0]||"";
 return nav.includes("pageLoadGeneration++")&&
  !nav.includes("pageLoadGeneration!=requestGeneration")&&
  nav.includes("url.equals(view.getUrl())")&&
  nav.includes("view.getProgress()==100")&&
  nav.includes("if(!searchInProgress)handler.postDelayed(pageFinishedRefresh,2500L);");
});
test("PL-02 only the newest selection starts after debounce",()=>{
 return service.includes("private final Runnable filterChangeRefresh=()->refresh(true);")&&
  service.includes("handler.removeCallbacks(filterChangeRefresh);")&&
  service.includes("handler.postDelayed(filterChangeRefresh,240L);")&&
  service.includes("replaceActiveFilterSearch();shinyVerified=false;");
});
test("PL-02 logical cancellation protects remote submission against overlap",()=>{
 return service.includes("private void guardSubmittedSearchBeforeReplacement()")&&
  service.includes("submittedSearchGeneration==requestGeneration")&&
  service.includes("remoteDrainUntilMs=Math.max(remoteDrainUntilMs,started+MIN_SEARCH_GAP_MS)")&&
  service.includes("earliest=Math.max(earliest,remoteDrainUntilMs);")&&
  service.includes("handler.postDelayed(queuedRefresh,remaining*1000L+300L)");
});
test("PL-02 pending manual retry is guarded against subsequent filter switches",()=>{
 return service.includes("queuedManualRefresh=true;")&&
  service.includes("final int queuedGeneration=requestGeneration;")&&
  service.includes("queuedGeneration==requestGeneration)refresh(true);")&&
  service.includes("queuedManualRefresh=false;")&&
  service.includes("handler.removeCallbacks(filterChangeRefresh);");
});
test("PL-02 watchdog can release stalled generation without false success",()=>{
 const watchdog=service.split("private final Runnable searchWatchdog=()->{")[1]?.split("    };")[0]||"";
 return service.includes("SEARCH_WATCHDOG_MS=45_000L")&&
  service.includes("handler.postDelayed(searchWatchdog,SEARCH_WATCHDOG_MS);")&&
  watchdog.includes("watchdogGeneration!=requestGeneration")&&
  watchdog.includes("guardSubmittedSearchBeforeReplacement();")&&
  watchdog.includes("++requestGeneration;")&&
  watchdog.includes('searchFailure("⚠ Tempo limite"')&&
  service.includes("handler.removeCallbacks(searchWatchdog);");
});
test("PL-02 stale previews keep their confirmed source and never fire new alerts",()=>{
 const cache=service.split("private boolean restoreFilterPreview(){")[1]?.split("    private int rawAttack")[0]||"";
 return cache.includes("shownMode=cached.sourceMode;")&&
  cache.includes("resultsStale=true;")&&
  !cache.includes("recordNewResults(")&&
  service.includes("if(count()>0)resultsStale=true;");
});
test("PL-02 marks submit boundary before Search can navigate",()=>{
 const start=service.indexOf("submittingSearchGeneration=generation;"),
       call=service.indexOf('execute("submitSearch",submitted->{',start);
 const onPage=service.split("onPageStarted(WebView view,")[1]?.split("onPageFinished(WebView")[0]||"";
 return start>0&&call>start&&
  onPage.includes("submittingSearchGeneration!=requestGeneration")&&
  service.includes("submittingSearchGeneration=-1;")&&
  service.includes("submitAttemptAtMs=System.currentTimeMillis();");
});
test("PL-02 waits for WebView after submit navigation without treating missing DOM as zero",()=>{
 const poll=service.split("private void pollSearch(")[1]?.split("private long expiration(")[0]||"";
 return poll.includes("if(!loaded||website==null){")&&
  poll.includes("if(attempt<8){pollSearch(generation,attempt+1,manual);return;}")&&
  poll.indexOf("if(!loaded||website==null){")<poll.indexOf('execute("collect",r->{')&&
  poll.includes('searchFailure("⚠ Site não carregado"');
});
test("Raw IV A/D/S are applied one field per React evaluation",()=>{
 const probe=read("assets/probe.js");
 return probe.includes("function applyNumbersOneAtATime(")&&
  probe.includes("transientPending=true;")&&
  probe.includes("function ivInputStat(input)")&&
  probe.includes('["aria-label","name","id","placeholder"]')&&
  probe.includes('elements("label[for]")')&&
  probe.includes('elements("[id]")')&&
  probe.includes('const inputs=rawIVInputs();');
});
test("Blank zero is never treated as a filled Raw IV or percentage",()=>{
 const probe=read("assets/probe.js");
 return probe.includes('const val=String(input.value??"").trim();')&&
  probe.includes('if(!/^(?:0|[1-9]\\d*)$/.test(val))return false;')&&
  probe.includes('confirmedNumber(input,group.values[i],0,15)')&&
  probe.includes('confirmedNumber(inputs[0],filters.percentMin,0,100)');
});
test("UX-SPRITE-01 uses equal square image slots with no cropping or opaque panels",(()=>{
 const stage=dock.match(/\.spriteStage\{[^}]+\}/)?.[0]||"";
 const image=dock.match(/\.spriteStage \.sprite\{[^}]+\}/)?.[0]||"";
 const row=dock.match(/\.spawn\{[^}]+\}/)?.[0]||"";
 return stage.includes("width:var(--sprite);height:var(--sprite)")&&
  stage.includes("align-items:center;justify-content:center")&&
  image.includes("aspect-ratio:1/1")&&image.includes("object-fit:contain")&&
  image.includes("object-position:center")&&
  !image.includes("object-fit:cover")&&!stage.includes("background:")&&
  row.includes("height:var(--spawn-row,var(--row))")&&
   row.includes("flex:0 0 var(--spawn-row,var(--row))");
})());
test("UX-SPRITE-01 missing images remain visible without inventing Pokémon or breaking taps",(()=>{
 return dock.includes('class="spriteStage"')&&
  dock.includes('class="spriteFallback fallback" aria-hidden="true"')&&
  dock.includes('.spriteStage.loaded .spriteFallback{display:none}')&&
  dock.includes('.spriteStage.failed .sprite{display:none}')&&
  dock.includes('alt="" loading="eager" decoding="async"')&&
  dock.includes('onclick="spriteClick(')&&dock.includes("Native.toggleDetail(i)")&&
  dock.includes("Native.longPressCoords(i)")&&dock.includes("showTimers&&deadline")&&
  dock.includes("attachLongPress();attachSpriteFeedback();syncTimerTicker()");
})());
test("UX-SPRITE-01 handles cached, delayed, broken, tiny and absent image sources",(()=>{
 const source=dock.split("function attachSpriteFeedback(){")[1]?.split("function attachLongPress(){")[0]||"";
 if(!source.includes("if(img.complete)confirmLoaded()"))return false;
 function makeStage(image){
  const classes=new Set(),listeners={};
  if(image)image.addEventListener=(name,fn)=>{listeners[name]=fn;};
  return {image,classes,listeners,classList:{add:name=>classes.add(name)},
   querySelector:()=>image};
 }
 const cached=makeStage({naturalWidth:128,naturalHeight:128,complete:true});
 const waiting=makeStage({naturalWidth:128,naturalHeight:128,complete:false});
 const broken=makeStage({naturalWidth:0,naturalHeight:0,complete:true});
 const tiny=makeStage({naturalWidth:1,naturalHeight:1,complete:true});
 const absent=makeStage(null);
 const stages=[cached,waiting,broken,tiny,absent];
 const mockDoc={querySelectorAll:(sel)=>sel===".spawn .spriteStage"?stages:[]};
 const attach=(new Function("document","return function attachSpriteFeedback(){"+source))(mockDoc);
 attach();
 if(waiting.classes.has("loaded")||waiting.classes.has("failed"))return false;
 waiting.listeners.load();
 return cached.classes.has("loaded")&&waiting.classes.has("loaded")&&
  broken.classes.has("failed")&&tiny.classes.has("failed")&&absent.classes.has("failed");
})());

test("HOME-03 authenticates using official profile only after session proof",(()=>{
 const login=main.split("private void checkLoginSession(")[1]?.split("private void openOfficialLoginControl(")[0]||"";
 const profile=read("assets/profile_summary.js");
 return login.includes('view.loadUrl("https://pogocoordinates.com/profile")')&&
  login.includes('loginAutoReturnQueued=true')&&
  login.includes('profileCaptureInProgress=true')&&
  login.includes('"unlinked".equals(state)')&&
  login.includes('profileDiscoveryAttempted=true')&&
  profile.includes("danger zone")&&
  profile.includes("Member since")&&
  profile.includes('trainerState=parsed?"linked":explicitZero?"unlinked":"unknown"')&&
  !profile.includes("document.cookie");
})());
test("HOME-03 opens the Home drawer on right and uses original transparent PNG",(()=>{
 const menu=main.split("private void showHomeMenu(){")[1]?.split("private void exportHomeData(){")[0]||"";
 return menu.includes("Gravity.RIGHT|Gravity.TOP")&&
  main.includes("R.drawable.ps_home_brand_transparent")&&
  main.includes('openLoginDialog(false,"manage")');
})());
test("HOME-04 keeps transparent brand left, controls right and plain outside background",(()=>{
 const home=main.split("private FrameLayout buildHome(){")[1]?.split("private Button homeAuthButton(")[0]||"";
 return home.includes("R.drawable.ps_home_brand_transparent")&&
  home.includes("Gravity.RIGHT|Gravity.CENTER_VERTICAL")&&
  home.includes("overlayControl=makeIcon(R.drawable.ic_overlay_off")&&
  home.includes('makeIcon(R.drawable.ic_heart_outline')&&
  home.includes('homeMiniButton("☰"')&&
  !home.includes("R.drawable.ps_home_wordmark")&&
  home.includes("frame.setBackgroundColor(Color.rgb(10,14,23))")&&
  !home.includes("sky.setImageResource(")&&
  home.includes("auth.setBackground(homeSurface(");
})());
test("HOME-04 shows genuine trainer data and the four transparent team assets",(()=>{
 const home=main.split("private FrameLayout buildHome(){")[1]?.split("private Button homeAuthButton(")[0]||"";
 const state=main.split("private void refreshSessionSummary(){")[1]?.split("private void askLogout(){")[0]||"";
 const icons=["mystic","valor","instinct","neutral"];
 const pngs=icons.every(name=>{
  const png=fs.readFileSync(path.join(root,"res/drawable-nodpi/ps_team_"+name+".png"));
  return png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&
   png.readUInt32BE(16)===1254&&png.readUInt32BE(20)===1254&&png[25]===6;
 });
 return pngs&&home.includes("teamBadge.setBackgroundColor(Color.TRANSPARENT)")&&
  home.includes('teamBadge.setImageResource(R.drawable.ps_team_neutral)')&&
  home.includes('trainerAction.setOnClickListener(v->openTrainerManagement())')&&
  state.includes('homeTeamIcon(linked?team:"")')&&
  state.includes('trainerCodeGroup.setVisibility(logged?View.VISIBLE:View.GONE)')&&
  state.includes('trainerCopyButton.setVisibility(linked?View.VISIBLE:View.GONE)')&&
  main.includes('avatar.setImageResource(android.R.drawable.ic_menu_myplaces)')&&
  !home.includes('Luciano Toscano');
})());
test("HOME-04 keeps the official link and a management option without a linked trainer",(()=>{
 const r=main.split("private void openTrainerManagement(){")[1]?.split("private int homeTeamIcon(")[0]||"";
 return r.includes('if(!code.matches("[0-9]{12}"))')&&
  r.includes('openLoginDialog(false,"manage")')&&
  main.includes('"unlinked".equals(state)?"unlinked":"unknown"')&&
  main.includes('.remove("profileTrainerTeam").remove("profileTrainerLevel")');
})());
test("HOME-02 has visible ON/OFF resources and drawer with safe export",(()=>{
 const status=main.split("private void refreshHomeOverlay(){")[1]?.split("private void openProviderLogin(")[0]||"";
 const menu=main.split("private void showHomeMenu(){")[1]?.split("private void toggleHomeOverlay(){")[0]||"";
 const exportCode=main.split("private void exportHomeData(){")[1]?.split("private void toggleHomeOverlay(){")[0]||"";
 return status.includes("R.drawable.ic_overlay_on")&&status.includes("R.drawable.ic_overlay_off")&&
  menu.includes("homeRoot.addView(layer")&&menu.includes("Exportar dados")&&
  exportCode.includes("Intent.ACTION_CREATE_DOCUMENT")&&
  exportCode.includes("WatchAlerts.watched(this)")&&
  !exportCode.includes('prefs.getAll().toString()')&&
  !exportCode.includes('"locationCoords"');
})());
test("HOME-01 keeps centered body empty and PoGoCoordinates panel compact",(()=>{
 const home=main.split("private FrameLayout buildHome(){")[1]?.split("private Button homeAuthButton(")[0]||"";
 return home.includes("screen.addView(new View(this),new LinearLayout.LayoutParams(1,0,1))")&&
  home.includes("R.drawable.ps_pogocoordinates")&&
  home.includes('homeText("PoGoCoordinates"')&&
  home.includes("guestPanel=new LinearLayout(this)")&&
  home.includes("connectedPanel=new LinearLayout(this)")&&
  home.includes("trainerPanel=new LinearLayout(this)")&&
  !home.includes("root.addView(hint");
})());
test("HOME-01 overlay button toggles service while retaining old startup permissions",(()=>{
 const block=main.split("private void toggleHomeOverlay(){")[1]?.split("private void refreshHomeOverlay(){")[0]||"";
 return block.includes("OverlayService.isRunning()")&&
  block.includes("stopService(new Intent(this,OverlayService.class))")&&
  block.includes("startOverlay()")&&
  main.includes("Settings.ACTION_MANAGE_OVERLAY_PERMISSION")&&
  main.includes("notificationPermissionAskedV38");
})());
test("HOME-02 keeps original favorites, settings, reports and official OAuth WebView",(()=>{
 const menu=main.split("private void showHomeMenu(){")[1]?.split("private void toggleHomeOverlay(){")[0]||"";
 return ["this::openPicker","this::showPreferencesDialog","this::showQuickGuide","this::showBugReportDialog"]
   .every(x=>menu.includes(x))&&
   main.includes('openLoginDialog(false)')&&
   main.includes('readAsset("login_entry.js")')&&
   main.includes('"https://pogocoordinates.com/profile"')&&
   main.includes('"https://pogocoordinates.com/search"');
})());
test("HOME-01 never invents trainer data or changes remote account on local removal",(()=>{
 const update=main.split("private void refreshSessionSummary(){")[1]?.split("private void askLogout(){")[0]||"";
 const home=main.split("private FrameLayout buildHome(){")[1]?.split("private Button homeAuthButton(")[0]||"";
 return update.includes('code.matches("[0-9]{12}")')&&
  update.includes('trainerPanel.setVisibility(logged?View.VISIBLE:View.GONE)')&&
  update.includes('prefs.getString("profileDisplayName","Conta conectada")')&&
  main.includes("A remoção precisa ser confirmada no perfil oficial")&&
  main.includes('readAsset("profile_summary.js")')&&
  main.includes('.remove("profileTrainerName").remove("profileTrainerCode")');
})());
test("HOME-01 provider detection needs real official Google/Discord domain",(()=>{
 const host=main.split("private void openLoginDialog(boolean shinyRequest,String purpose){")[1]||"";
 return host.includes('lower.equals("accounts.google.com")')&&
  host.includes('lower.equals("discord.com")')&&
  main.includes('provider=observedLoginProvider')&&
  !main.includes('provider=preferredLoginProvider')&&
  read("assets/login_entry.js").includes('window.__psProviderClicked=true')&&
  !read("assets/profile_summary.js").includes("document.cookie")&&
  !read("assets/profile_summary.js").includes("localStorage.getItem(");
})());


// UX-INFO-LEAGUES: inspect the real PvPoke assets and execute the code, not
// placeholder ranks based on a search Top-N or guessed IV percentages.
test("UX-INFO-LEAGUES exposes GL UL ML independently without changing search modes",()=>{
 const win={};
 new Function("window",read("assets/pvpoke-overall-ranks.js"))(win);
 new Function("window",read("assets/pvpoke-iv-gamemaster.js"))(win);
 const ivStart=dock.indexOf("const IV_PERCENT_VALUES=Object.freeze(");
 const ivEnd=dock.indexOf("let modeDraft=",ivStart);
 const start=dock.indexOf("const PVPOKE_OVERALL="),end=dock.indexOf('let lastListKey=""',start);
 if([ivStart,ivEnd,start,end].some(x=>x<0))return false;
 const api=new Function("window","esc",dock.slice(ivStart,ivEnd)+dock.slice(start,end)+
 "return {verifiedSpawnRawIv,verifiedSpawnIvPercent,verifiedOverallRank,"+
 "verifiedSpeciesIvRank,pvpIvClassPercent,resultLines,resultInfoHtml,computeResultLayout};"
 )(win,s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;"));
 const alt={name:"Altaria",iv:"0/14/15",ivPercent:"64"};
 const origin={name:"Palkia (Origin)",iv:"15/15/15",ivPercent:"100"};
 const opts={rawIv:true,iv:true,overallRankGl:true,overallRankUl:true,overallRankMl:true,
  speciesIvRankGl:true,speciesIvRankUl:true,speciesIvRankMl:true};
 const lines=api.resultLines(alt,opts,"raw");
 const master=api.resultLines(origin,opts,"raw");
 const unknown=api.resultLines({name:"Unknown",iv:"",ivPercent:""},opts,"raw");
 const falseForm={...alt,form:"Shadow"};
 const countFromNative=service.includes('putBoolean("resultCountUxV2",true)');
 return win.POKESEARCH_PVPOKE_OVERALL.ml.length>=350&&
  api.verifiedOverallRank(origin,"ml")===1&&
  api.verifiedSpeciesIvRank(origin,"ml")===1&&
  api.verifiedSpawnRawIv(alt)==="0/14/15"&&
  lines.includes("IV 0/14/15")&&lines.includes("IV% 64%")&&
  lines.includes("GL RG#2")&&lines.includes("IV#1 100,00%")&&
  lines.includes("UL RG#275")&&lines.includes("IV#1460 64,37%")&&
  master.includes("ML RG#1")&&master.includes("IV#1 100,00%")&&
  api.pvpIvClassPercent(14)==="99,68"&&
  unknown.includes("IV ?/?/?")&&
  !unknown.some(v=>v.includes("RG#")||v.includes("IV#"))&&
  api.verifiedSpawnRawIv({...alt,ivPercent:"100"})===null&&
  api.verifiedSpeciesIvRank(falseForm,"gl")===null&&
  api.resultInfoHtml("IV 0/14/15",alt).includes("ivInfo medium")&&
  dock.includes('["stamina","H","iv","H"]')&&
  countFromNative&&
  service.includes('case "speciesIvRankMl":resultShowSpeciesIvRankMl=value')&&
  service.includes('case "overallRankMl":resultShowOverallRankMl=value')&&
  api.computeResultLayout(Array.from({length:10},()=>alt),45,330,false,false,opts,"gl").visibleCount===10;
});


// UX-NOTIFY-01: the bell in the compact ribbon opens the real alert panel.
// Notification permission and sound preferences are never a fake visual toggle.
test("UX-NOTIFY-01 bell opens live notification panel with full controls",()=>{
 const block=dock.split("function quickClick(id){")[1]?.split("const QUICK_SVG=")[0]||"";
 const panel=dock.split("function renderAlertsChoices(){")[1]?.split("function renderFiltersChoices(){")[0]||"";
 return block.includes('case "bell":toggleChoices("alerts")')&&
  dock.includes('onclick="toggleChoices(\'alerts\')"')&&
  !block.includes('case "bell":Native.toggleGeneralAlerts()')&&
  panel.includes('Native.setAlertMode(id)')&&
  panel.includes('Native.setFavoriteAlertMode(id)')&&
   panel.includes('Native.pickAlertTone("general")')&&
   panel.includes('Native.pickAlertTone("favorites")')&&
   panel.includes('Native.pickAlertTone("species")')&&
  panel.includes('"testGeneralNotification"')&&
  panel.includes('"testNotification"')&&
  panel.includes('"requestNotificationPermission"')&&
  panel.includes('"openNotificationSettings"')&&
  panel.includes('"refreshNotificationStatus"')&&
  service.includes('void testGeneralNotification()')&&
  service.includes('void requestNotificationPermission()')&&
  service.includes('void openNotificationSettings()')&&
  main.includes('REQUEST_NOTIFICATION_PERMISSION');
});
test("UX-NOTIFY-02 favorite and general alerts reflect real permission and stay independent",
 dock.includes('notificationPermissionGranted=!!permissionGranted')&&
 dock.includes('watchAlertsEnabled=!!favoriteAlertsEnabled')&&
 dock.includes('bell.classList.toggle("permissionMissing",!notificationPermissionGranted)')&&
 service.includes('","+WatchAlerts.permissionGranted(this)+","+WatchAlerts.enabled(this)+","+JSONObject.quote(searchPhase)+","')&&
  dock.includes('favoriteAlertMode=["on","silent","off"].includes(favoriteMode)')&&
 service.includes('if(!WatchAlerts.permissionGranted(this))return false;')&&
 service.includes('if(sendGeneralNotification("Novo Pokémon: "+firstNew,')&&
 service.includes('lastAlertAt=now;')&&
 watch.includes('manager.areNotificationsEnabled()')&&
 !watch.includes('com IV100 ou ranking #1')&&
 main.includes('requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},204)'));
test("UX-NOTIFY-03 keep native Android channel sound and explicitly separate two tests",
 service.includes('pokesearch_alerts_silent_v1')&&
 watch.includes('pokesearch_watch_silent_v1')&&
 service.includes('sendGeneralNotification("🔔 Teste de aviso geral"')&&
 watch.includes('Teste do canal Favoritos')&&
 watch.includes('RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)')&&
 service.includes('nm.getNotificationChannel(channelId).getImportance()==NotificationManager.IMPORTANCE_NONE'));


test("UX-NOTIFY-04 favorites sound and silence never inherit general alert mode",()=>{
 return watch.includes('String soundMode=mode(context);')&&
  !watch.includes('getString("alertsMode","off")')&&
  watch.includes('boolean quiet="silent".equals(soundMode);')&&
  service.includes('WatchAlerts.setMode(OverlayService.this,mode);')&&
  service.includes('WatchAlerts.setMode(OverlayService.this,enabled?"on":"off");')&&
  dock.includes('button.classList.toggle("chosen",favoriteAlertMode===id)');
});
test("UX-NOTIFY-05 independent system tones and individual Pokémon overrides",()=>{
 return watch.includes('public static final String PREF_GENERAL_TONE=')&&
  watch.includes('public static final String PREF_FAVORITE_TONE=')&&
  watch.includes('public static final String PREF_SPECIES_TONES=')&&
  watch.includes('soundChannelId(context,true,species)')&&
  watch.includes('selectedTone(context,true,species)')&&
  service.includes('WatchAlerts.soundChannelId(this,false,null)')&&
  service.includes('WatchAlerts.selectedTone(this,false,null)')&&
  main.includes('RingtoneManager.ACTION_RINGTONE_PICKER')&&
  main.includes('WatchAlerts.PREF_SPECIES_TONES')&&
  main.includes('setItems(options,(dialog,which)->');
});
test("UX-NOTIFY-06 ringtone options never fetch or ship copyrighted cries",()=>{
 const panel=dock.split('function renderAlertsChoices(){')[1]?.split('function renderFiltersChoices(){')[0]||"";
 return panel.includes('Native.pickAlertTone("general")')&&
  panel.includes('Native.pickAlertTone("favorites")')&&
  panel.includes('Native.pickAlertTone("species")')&&
  !watch.includes('pokemonshowdown.com')&&
  !watch.includes('soundlibrary.pokemon.co.jp')&&
  main.includes('RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT,false')&&
  main.includes('"content".equals(scheme)&&!"android.resource".equals(scheme)');
});
test("UX-NOTIFY-07 Home favorites toggle migrates safely to tri-state preference",()=>{
 return watch.includes('PREF_MODE="favoriteAlertMode"')&&
  watch.includes('String fallback=prefs.getBoolean(PREF_ENABLED,true)?"on":"off"')&&
  main.includes('WatchAlerts.PREF_ENABLED.equals(key)?')&&
  main.includes('WatchAlerts.setMode(this,enabled?"on":"off")')&&
  service.includes('WatchAlerts.mode(this)')&&
  dock.includes('individualToneCount=Math.max(0,Number(individualTones)||0)');
});
test("UX-NOTIFY-08 personalized matching favorites use separate notifications and distinct IDs",()=>{
 return service.includes('java.util.LinkedHashMap<String,String[]> individualFavorites')&&
  service.includes('if(WatchAlerts.speciesToneCount(this)>0)')&&
  service.includes('WatchAlerts.match(this,info[0]')&&
  service.includes('if(count++>=5)break')&&
  watch.includes('java.util.concurrent.atomic.AtomicInteger NEXT_ALERT_ID')&&
  watch.includes('NEXT_ALERT_ID.updateAndGet');
});
test("UX-NOTIFY-09 bell indicates favorites-only mode even when general is off",()=>{
 return dock.includes('id==="bell"?((generalAlerts||(favoriteAlertMode!=="off"&&hasFavorites))&&notificationPermissionGranted)')&&
  dock.includes('bell.classList.toggle("generalOn",generalAlerts||(favoriteAlertMode!=="off"&&hasFavorites))')&&
  dock.includes('Novos: "+alertMode+" · Favoritos: "+favoriteAlertMode')&&
  dock.includes('!(favoriteAlertMode==="on"&&hasFavorites)&&((generalAlerts&&alertMode==="silent")||(favoriteAlertMode==="silent"&&hasFavorites))');
});
test("UX-NOTIFY-10 bell slash and X honor actual favorite list and Android permission",()=>{
 const fragment=dock.split("function audibleAlertState(")[1]?.split("function refreshQuickMenuStates(){")[0]||"";
 if(!fragment)return false;
 const state=new Function("return function audibleAlertState("+fragment)();
 const cases=[
  [true,"on","on",true,0],
  [true,"off","on",true,1],
  [true,"on","off",true,1],
  [true,"silent","on",true,1],
  [true,"on","silent",true,1],
  [true,"silent","silent",true,2],
  [true,"off","off",true,2],
  [true,"off","on",false,2],
  [true,"on","on",false,1],
  [true,"on","off",false,1],
  [true,"off","on",true,1],
  [false,"on","on",true,2]
 ];
 return cases.every(([permission,general,favorite,watched,expected])=>
  state(permission,general,favorite,watched).mutedCount===expected)&&
  dock.includes("const {mutedCount}=audibleAlertState(")&&
  dock.includes('button.classList.toggle("bell-one-muted",id==="bell"&&mutedCount===1)')&&
  dock.includes('button.classList.toggle("bell-both-muted",id==="bell"&&mutedCount===2)');
});
test("UX-LOCATION-FIX-01 invalid location never clears native confirmation or starts new search",()=>{
 const block=service.split('@JavascriptInterface public void setLocation(boolean enabled,String coords,int radius)')[1]
  ?.split('@JavascriptInterface public void pasteLocationCoords()')[0]||"";
 const validation=block.indexOf('if(enabled&&(valid.isEmpty()||radius<0||radius>1000))');
 const reset=block.indexOf('locationVerified=false;');
 return validation>=0&&reset>validation&&
  block.includes('locationEnabled==enabled&&')&&
  block.includes('locationCoords.equals(valid)&&locationRadius==radius')&&
  block.indexOf('update();return;')<reset&&
  block.includes('replaceActiveFilterSearch();')&&
  block.includes('OverlayService.this.refresh(true);');
});
test("SITE-POKEMON-02 stale autocomplete requests cannot replace newer site choices",()=>{
 const java=service.split('@JavascriptInterface public void requestPokemonSuggestions(String query)')[1]
  ?.split('@JavascriptInterface public void setSearchConfig(String payload)')[0]||'';
 return java.includes('pokemonSuggestionSequence')&&java.includes('sequence!=pokemonSuggestionSequence')&&
  java.includes('attempt<12')&&java.includes('response.put("query",query)')&&
  dock.includes('response.empty===true?"Nenhuma opção oficial encontrada"')&&
  probe.includes("reason:'Aguardando opções oficiais do PoGoCoordinates'");
});
test("UX-MENU-ANCHOR-01 popups track their own launcher within native window",()=>{
 const fn=dock.split('function positionPopupUnderTrigger(){')[1]?.split('window.setMenuPopupPlacement=',1)[0]||'';
 return fn.includes('quickMenuList button[data-key=')&&fn.includes('Math.min(width-popupWidth')&&
  fn.includes('bounds.left-area.getBoundingClientRect().left')&&
  fn.includes('panel.style.setProperty("left",Math.round(left)+"px","important")')&&
  dock.includes('positionPopupUnderTrigger();')&&
  dock.includes('style.removeProperty("left")');
});
test("PSC-FILTER-01 explicit reset needs site control and cannot assume neutral",()=>{
 return probe.includes('if(!e)return false; // Explicitly requested selection/reset')&&
  probe.includes('if(v===null)return false; // Cannot prove reset/selection')&&
  probe.includes('if(!input){failed.push(key);continue;} // Includes explicitly requested numeric resets.');
});
test("UX-PERF-02 closing picker cancels queued DOM polling",()=>{
 return service.includes('public void cancelPokemonSuggestions(){handler.post(()->++pokemonSuggestionSequence);}')&&
  dock.includes('Native.cancelPokemonSuggestions(); // Stop obsolete JS probe retries');
});
test("UX-LOCATION-RETRY-01 same unverified coordinates can retry safely",()=>{
 const block=service.split('@JavascriptInterface public void setLocation(boolean enabled,String coords,int radius)')[1]
  ?.split('@JavascriptInterface public void pasteLocationCoords()')[0]||"";
 return block.includes('boolean retry=!searchInProgress&&')&&
   block.includes('nextScheduledSearchAtMs<=System.currentTimeMillis()')&&
   block.includes('enabled&&!locationVerified')&&
   block.includes('"error".equals(searchPhase)')&&
   block.includes('OverlayService.this.refresh(true);')&&
   block.includes('}else update();')&&
   block.indexOf('locationVerified=false;')>block.indexOf('boolean retry=');
});
test("UX-LOCATION-FIX-02 panel stays open until native/site confirmation",()=>{
 const body=dock.split('function renderLocationChoices(){')[1]?.split('function manualRefreshTap(){')[0]||"";
 return body.includes('Native.setLocation(true,wantedCoords,wantedRadius)')&&
  !body.includes('locationEnabled=true;closeChoices()')&&
  !body.includes('locationCoords=match[1]')&&
  body.includes('message.textContent="⌛ Aplicando coordenadas')&&
  body.includes('hide.onclick=closeChoices')&&
  body.includes('Native.setLocation(false,"",0)')&&
  dock.includes('if(controlsWindow&&choiceOpen==="location")locationPanelFeedback();')&&
  dock.includes('locationEnabled?(locationVerified?"✓ Localização confirmada');
});
test("UX-LOCATION-FIX-03 explicit clipboard paste is validated and never enables filters",()=>{
 const handler=service.split('@JavascriptInterface public void pasteLocationCoords()')[1]?.split(
 '@JavascriptInterface public void locationEditor(boolean open)')[0]||"";
 const render=dock.split('window.onLocationPaste=coords=>{')[1]?.split('function renderLocationChoices(){')[0]||"";
 return handler.includes('cb.hasPrimaryClip()')&&
  handler.includes('value.length()<=128')&&
  handler.includes('parsed=extractCoordinates(value.toString())')&&
  handler.includes('window.onLocationPaste(')&&
  render.includes('field.value=String(coords);')&&
  !render.includes('Native.setLocation(')&&
  !handler.includes('locationEnabled=true')&&
  !handler.includes('putString("locationCoords"')&&
  dock.includes('paste.onclick=()=>Native.pasteLocationCoords()')&&
  dock.includes('aria-label",paste.title');
});
test("UX-LOCATION-FIX-04 retains 12 toolbar controls, stale protection and site verification",()=>{
 const serviceMethod=service.split('private void configureLocationAndVerify(')[1]
  ?.split('private void openShinyLogin(){')[0]||"";
 return serviceMethod.includes('execute("verifyLocation:"+data')&&
  service.includes('execute("verifyLocation:"+locationPayload(),lastLocation->')&&
  service.includes('locationVerified=locationEnabled;')&&
  service.includes('resultsStale=count()>0;')&&
  (dock.match(/id="location"/g)||[]).length===1&&
  dock.includes('toggleChoices(\'location\')')&&
  !service.includes('requestPermissions(new String[]{android.Manifest.permission.ACCESS_FINE_LOCATION}')&&
  service.includes('prefs.remove("locationCoords").remove("locationRadius")');
});

test("UX-PERF-01 PvPoke scripts load only in results WebView",()=>{
 const marker='<script>\n// UX-PERF-01: synchronous PvPoke scripts only';
 const begin=dock.indexOf(marker),end=dock.indexOf('</script>',begin);
 if(begin<0||end<begin)return false;
 const source=dock.slice(begin+'<script>'.length,end);
 const invoke=new Function('window','document',source);
 const load=query=>{const tags=[];invoke({location:{search:query}},{write:html=>tags.push(html)});return tags;};
 const r=load('?results=1');
 return r.length===2&&r[0].includes('pvpoke-overall-ranks.js"></script>')&&r[1].includes('pvpoke-iv-gamemaster.js"></script>')&&load('?controls=1').length===0&&load('').length===0;
});
test("UX-PERF-02 countdown interval only in results window",()=>
 dock.includes('function syncTimerTicker(){')&&dock.includes('if(timerTicker===null){updateTimers();timerTicker=setInterval(updateTimers,1000);}')&&dock.includes('clearInterval(timerTicker);timerTicker=null;'));
test("UX-DETAIL-TIMER-01 hidden detail pauses interval",()=>{
 const d=read("assets/detail.html");
 return d.includes('window.pauseDetailTimer=()=>{')&&d.includes('window.pauseDetailTimer();')&&d.includes('if(expiresAt)ticking=setInterval(updateCountdown,1000);')&&service.includes('js(detailPanel,detailLoaded,"window.pauseDetailTimer()")');
});
test("UX-DETAIL-TIMER-02 timer cleanup executes clearInterval",()=>{
 const d=read("assets/detail.html");
 const code=d.match(/<script>([\s\S]*?)<\/script>/)?.[1];
 if(!code)return false;
 const cleared=[];
 const v=new Function("window","clearInterval",code+"\nticking=37;window.pauseDetailTimer();return ticking;")({},id=>cleared.push(id));
 return v===null&&cleared.length===1&&cleared[0]===37;
});
test("UX-WATCHDOG-45S late requests discarded",()=>{
 const body=service.split('private final Runnable searchWatchdog=()->{')[1]?.split('private boolean pickerOpen=')[0]||'';
 return body.includes('++requestGeneration;')&&body.includes('confirmedSubmittedFiltersGeneration=-1;')&&
  service.includes('private static final long SEARCH_WATCHDOG_MS=45_000L;')&&
  service.includes('callbackGeneration!=requestGeneration||callbackWebsite!=website||(!mayNavigate&&callbackPage!=pageLoadGeneration)');
});

// UI-INFO-ALL and UX-LOC-SHINY regression tests: all visibility switches are
// presentation only; do not change the source query or the original sprite gap.
test("UX-INFO-ALL-01 every supported card field can be individually hidden/shown",()=>{
 const keys=["name","number","gender","size","form","moves","location","distance","shiny"];
 return keys.every(key=>
   dock.includes('"'+key+'":!!displayPrefs.'+key)||
   dock.includes(key+':!!displayPrefs.'+key))&&
  keys.every(key=>service.includes('case "'+key+'":')&&
    service.includes('prefs.getBoolean("resultShow'+key[0].toUpperCase()+key.slice(1)+'",false)'))&&
  keys.every(key=>dock.includes('opts.'+key+'&&'))&&
  dock.includes('const metaWidth=metadataVisible?96:0;')&&
  dock.includes("return pitch; // Transparent sprite squares may overlap")&&
  dock.includes('cards=Array.isArray(a)?a.slice(0,10):[]');
});
test("UX-INFO-ALL-02 distance is only read from official spawn card, not GPS",()=>{
 const source=read("assets/probe.js"),detail=read("assets/detail.html");
 return source.includes('const distanceMatch=body.match(')&&
  source.includes('location:place,distance,despawn:')&&
  detail.includes('item("Distância",c.distance)')&&
  !source.includes('navigator.geolocation')&&
  dock.includes('"Distância do local informado"');
});
test("UX-INFO-ALL-03 optional metadata respects the compact row dimensions",()=>{
 const win={};new Function("window",read("assets/pvpoke-overall-ranks.js"))(win);
 const start=dock.indexOf('const PVPOKE_OVERALL='),end=dock.indexOf('let lastListKey=""',start);
 if(start<0||end<start)return false;
 const f=new Function('window','verifiedSpawnIvPercent','esc',
   dock.slice(start,end)+'return {resultLines,computeResultLayout};')(
     win,()=>null,s=>String(s));
 const card={name:'Machop',number:'#066',gender:'♀',size:'M',form:'',
   moves:'Karate Chop / Brick Break',location:'Shibuya, Tokyo, Japan',
   distance:'0.3 km',shiny:true};
 const opts={name:true,number:true,gender:true,size:true,form:true,moves:true,
   location:true,distance:true,shiny:true,rawIv:false};
 const lines=f.resultLines(card,opts,'gl'),hidden=f.resultLines(card,{},'gl');
 const layout=f.computeResultLayout([card,card],45,700,false,false,opts,'gl');
 return lines.includes('Nome Machop')&&lines.includes('Local Shibuya, Tokyo, Japan')&&
   lines.includes('Dist 0.3 km')&&lines.includes('Sexo ♀')&&
   lines.includes('Tam M')&&lines.includes('✨ Shiny')&&
   hidden.length===0&&layout.rows.every(r=>r===45)&&layout.visibleCount===2;
});
test("UX-LOC-SHINY-01 reasserts shiny after site Coords switch and before Search",()=>{
 const begin=service.indexOf('private void verifyShinyAfterLocation(');
 const end=service.indexOf('private void openShinyLogin()',begin);
 const fragment=service.slice(begin,end);
 return begin>=0&&end>begin&&
  service.includes('verifyShinyAfterLocation(generation,manual,0);')&&
  fragment.includes('execute("setShiny",applied->')&&
  fragment.includes('execute("verifyShiny",verified->')&&
  fragment.includes('verifyAndSubmit(generation,manual,0)')&&
  fragment.includes('searchFailure("⚠ Shiny não aplicado"')&&
  fragment.includes('generation!=requestGeneration')&&
  service.includes('execute("verifyLocation:"+locationPayload(),lastLocation->');
});
test("UX-LOC-SHINY-02 live account badge can prove linked trainer without exposing code",()=>{
 const source=read("assets/probe.js");
 return source.includes('trainerLinked:!!accountBadge')&&
  source.includes('return JSON.stringify({ok:true,auth,trainerLinked:')&&
  service.includes('session.optBoolean("trainerLinked",false)||hasConfirmedTrainerLink()')&&
  !service.includes('if(shiny&&!hasConfirmedTrainerLink())');
});
test("SITE-POKEMON-01 picker exposes selected chips and exact official suggestions",()=>
 dock.includes('function renderPokemonChoices()')&&
 dock.includes('pokemonDraft.length+" selecionados"')&&
 dock.includes('input.placeholder="Nome, forma ou número #"')&&
 dock.includes('pokemonSelections:[...pokemonDraft]')&&
 dock.includes('pokemonDraft.length<50'));
test("SITE-POKEMON-02 bridge performs nonblocking live suggestions",()=>
 service.includes('@JavascriptInterface public void requestPokemonSuggestions(String query)')&&
 service.includes('execute("pokemonSuggest:"+JSONObject.quote(query),response->')&&
 service.includes('generation!=requestGeneration')&&
 service.includes('window.onPokemonSuggestions('));
test("SITE-POKEMON-03 native validates names, caps 50, and preserves forms",()=>
 service.includes('org.json.JSONArray species=input.optJSONArray("pokemonSelections")')&&
 service.includes('if(species.length()>50)return;')&&
 service.includes('extra.put("pokemonSelections",cleaned)')&&
 service.includes('clearKeys.put("pokemonSelections")'));
test("SITE-POKEMON-04 site filter uses selected chips and exact official options",()=>
 probe.includes('function pokemonSelectedChips()')&&
 probe.includes('function pokemonPickerOptions()')&&
 probe.includes('const pokemon=pokemonListSelection(action)')&&
 probe.includes('return {ok:false,pending:false,reason:')&&
 probe.includes('found.filter(x=>matches(x)&&requestedSpecies(x))'));
test("SITE-POKEMON-05 12-icon toolbar & no personal GPS remain intact",()=>
 dock.includes('grid-template-columns:34fr 22fr 41fr 20fr 20fr 22fr 22fr 22fr 38fr 22fr 22fr 22fr')&&
 !probe.includes('navigator.geolocation')&&
 dock.includes('items.slice(0,10)')&&
 service.includes('"locationCoords"'));
test("NOTIFY-02 two independent three-state controls and audible streams",()=>{
 const panel=dock.split("function renderAlertsChoices(){")[1]?.split("function renderFiltersChoices(){")[0]||"";
 return panel.includes('const generalModes=document.createElement("div")')&&
  panel.includes('const favoriteModes=document.createElement("div")')&&
  panel.includes('Native.setAlertMode(id)')&&panel.includes('Native.setFavoriteAlertMode(id)')&&
  panel.includes('["silent","🔇 Sem som"]')&&panel.includes('Novos em OFF e Favoritos em Som');
});
test("NOTIFY-03 one muted stream gets one slash and both muted get X",()=>{
 const states=dock.split("function refreshQuickMenuStates(){")[1]?.split("function uxPanel(",1)[0]||"";
 const helper=dock.split("function audibleAlertState(")[1]?.split("function refreshQuickMenuStates(){")[0]||"";
 return helper.includes('mutedCount:(newAudible?0:1)+(favoriteAudible?0:1)')&&
  states.includes('const {mutedCount}=audibleAlertState(')&&
  states.includes('bell-one-muted')&&states.includes('bell-both-muted')&&
  dock.includes('bell-both-muted .quickGlyph::before')&&
  dock.includes('rotate(44deg)')&&dock.includes('rotate(-44deg)');
});
test("NOTIFY-04 choose MP3 or OGG from Files or Drive with persistent access",()=>{
 return main.includes('Intent.ACTION_OPEN_DOCUMENT')&&
  main.includes('pick.setType("audio/*")')&&
  main.includes('Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION')&&
  main.includes('takePersistableUriPermission(uri,')&&
  main.includes('startActivityForResult(pick,306)')&&
  main.includes('saveChosenAlertTone(data,req==306)')&&
  main.includes('storeAlertTone(target,species,chosen)');
});
test("NOTIFY-05 favorites dialog uses authoritative mode and styled cards",()=>{
 const picker=read("java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java");
 return picker.includes('WatchAlerts.setMode(activity,enabled?"on":"off")')&&
  picker.includes('POKÉMON FAVORITOS')&&
  picker.includes('row.setBackground(rowBg)')&&
  picker.includes('background.setCornerRadius(dp(activity,12))');
});
test("COORDS-06 typed radius still requires actual site two-field confirmation",()=>{
 return dock.includes('radiusField.type="number"')&&
  dock.includes('wantedRadius=Number(radiusField.value)')&&
  dock.includes('radiusField.oninput=()=>')&&
  service.includes('if(configured.optBoolean("pending",false)&&attempt<16)')&&
  service.includes('if(attempt<12)')&&
  service.includes('execute("verifyLocation:"+data,verified->')&&
  probe.includes('function configureLocation(req)')&&
  probe.includes('function verifyLocation(req)');
});
test("MODE-08 compact six-choice popup stays under its launcher",()=>{
 return dock.includes('modeCascade{width:60px!important}')&&
  dock.includes('.modeCascadeRail{width:58px!important}')&&
  dock.includes('function positionPopupUnderTrigger(){')&&
  dock.includes('bounds.left-area.getBoundingClientRect().left');
});
test("COORDS-08 UI preserves user editing while site controls location and Shiny",()=>{
 const feedback=dock.split("function locationPanelFeedback(){")[1]?.split("window.onLocationPaste=",1)[0]||"";
 const modal=dock.split("function renderLocationChoices(){")[1]?.split("function manualRefreshTap(){",1)[0]||"";
 return feedback.includes('document.activeElement!==radius')&&
  feedback.includes('radius.value=String(locationRadius)')&&
  modal.includes('radiusField.id="locRadiusValue"')&&
  modal.includes('wantedRadius=Number(radiusField.value)')&&
  service.includes('verifyShinyAfterLocation(generation,manual,0)')&&
  probe.includes('function verifyLocation(req)')&&
  probe.includes('function setShiny(want)');
});
test("UX-NOTIFY-11 only verified favorites notify if general alerts are OFF",()=>{
 const begin=service.indexOf("private void recordNewResults(JSONArray cards,boolean leagueConfirmed)");
 const finish=service.indexOf("private void applyCollectedResults(JSONObject r)",begin);
 const src=service.slice(begin,finish);
 const fav=watch.slice(watch.indexOf("private static boolean send("),watch.indexOf("public static boolean test("));
 return begin>0&&finish>begin&&src.includes('if(WatchAlerts.enabled(this) &&')&&
  src.includes('WatchAlerts.matches(c.optString("name",""),wanted)')&&
  src.includes('WatchAlerts.match(this,firstWatched,watchDetails)')&&
  src.includes('if(!"off".equals(alertsMode)&&alerts&&!firstNew.isEmpty()')&&
  fav.includes('String soundMode=mode(context);')&&
  fav.includes('if("off".equals(soundMode))return false;')&&
  !fav.includes("alertsMode");
});
test("UX-NOTIFY-12 new and favorite audio channels remain separate",()=>{
 const src=service.slice(service.indexOf("private boolean sendGeneralNotification("),
  service.indexOf("private void recordNewResults("));
 return src.includes('WatchAlerts.soundChannelId(this,false,null)')&&
  src.includes('WatchAlerts.selectedTone(this,false,null)')&&
  src.includes('pokesearch_alerts_silent_v1')&&
  watch.includes('String id=soundChannelId(context,true,species);')&&
  watch.includes('selectedTone(context,true,species)')&&
  watch.includes('pokesearch_watch_silent_v1');
});
test("UX-NOTIFY-13 bundled user sounds include 25 Android resource references and category/species picker",()=>{
 const library=read("java/com/lucianotoscano/pokesearchoverlay/PokeSoundLibrary.java");
 return (library.match(/R\.raw\.ps_[a-z0-9_]+/g)||[]).length===25&&
  main.includes("openBundledAlertTonePicker(")&&
  main.includes("PokeSoundLibrary.soundUri(this,which)")&&
  main.includes("openAlertAudioFilePicker(target,pokemon)")&&
  watch.includes('"android.resource".equals(uri.getScheme())')&&
  dock.includes("Biblioteca PokeSearch (25 sons)");
});
if(failures.length){console.error("UX CONTRACT FAILURES ("+failures.length+"):\\n"+failures.join("\\n"));process.exitCode=1;}
else console.log("PokeSearch UX contract: "+count+" tests passed");


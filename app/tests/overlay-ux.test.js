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
test("Atualização offers OFF, 3, 5, 10, 15 and 20 minutes without AUTO decoration",dock.includes('off.textContent="OFF"')&&!dock.includes('label.textContent="AUTO"')&&dock.includes('for(const value of [3,5,10,15,20])')&&dock.includes('row.className="periodCompactRow"'));
test("Cascade uses current toolbar height even after clipping or vertical rotation",
 dock.includes('h=Math.max(h,baseHeight+164+6);')&&
 dock.includes('const baseHeight=window.visualPrefs?.menuOrientation==="vertical"?232:34;')&&
 dock.includes("Native.resizeMenu(h)")&&service.includes("menuRequestedHeightDp=visualMenuBaseDp();"));
test("Bridge supports explicit filter selection",service.includes("public void setMode(String s)"));
test("Bridge supports explicit interval selection",service.includes("public void setIntervalMinutes(int minutes)"));
test("Favorites remain in overlay",service.includes("PokemonPicker.show(OverlayService.this")&&!service.includes('intent.setAction("com.lucianotoscano.pokesearchoverlay.EDIT_WATCH_LIST")'));

test("LT62 split popup preserves toolbar, content-sized hitbox and page lifecycle",()=>{
 const measured=service.split("private void positionIndependentPopup(){")[1]?.split("private void locationEditor(boolean open)")[0]||"";
 return service.includes("PopupTouchGeometry.place(")&&
  measured.includes("popupParams.width=b.width;popupParams.height=b.height;")&&
  measured.includes("FLAG_NOT_TOUCH_MODAL")&&
  measured.includes("FLAG_NOT_FOCUSABLE")&&
  service.includes('dock.html?controls=1&popup=1')&&
  service.includes('popupPanel.addJavascriptInterface(new Bridge(),"Native")')&&
  service.includes("destroyWebView(popupPanel,true")&&
  dock.includes('const popupWindow=window.location.search.indexOf("popup=1")!==-1')&&
  // Other popups stay content-sized; Location uses its exact compact DOM card
  // to prevent the native touch window expanding after keyboard focus.
  dock.includes('const measuredWidth=Math.min(330,Math.ceil(Math.max(rect.width,pane.scrollWidth,right-rect.left))+2);')&&
  dock.includes('Math.min(148,Math.max(1,Math.floor(window.innerWidth||148)))')&&
  dock.includes("Native.resizePopup(exactWidth,")&&
  dock.includes("window.showNativePopup=kind=>")&&
  dock.includes("Native.openPopup(kind,Math.round(");
});
test("LT62 popup receives picker/filter events, focus and P/M/G state updates",()=>{
 for(const code of ["window.onFilterOptions(","window.onFormOptions(",
   "window.onPokemonSuggestions("])
  if(!service.includes("js(popupPanel,popupLoaded,\""+code))return false;
 if(!service.includes("js(popupPanel,popupLoaded,callback);"))return false;
 return service.includes("WebView web=inPopup?popupPanel:menuPanel;")&&
  service.includes("js(popupPanel,popupLoaded,data);")&&
  service.includes("js(popupPanel,popupLoaded,jsCode);")&&
  dock.includes("refreshSpriteSizeButtons();")&&
  dock.includes("if(popupWindow&&!popupNativeSwitch&&Native.closePopup)Native.closePopup();")&&
  dock.includes("body.popup-window #choices.filterCascade.filterCascadeOpen .filterCascadeEditor");
});

test("Favorites picker is service-safe and focusable",picker.includes("TYPE_APPLICATION_OVERLAY")&&picker.includes("Runnable dismissed"));

test("LT62/LT68 Favorites stay nonmodal and anchored to their star icon",()=>{
 const bridge=service.split("private void showFavoritePicker(int anchorX,int anchorY)")[1]
   ?.split("public class Bridge{")[0]||"";
 const publicApi=service.split("@JavascriptInterface public void openWatchList()")[1]
   ?.split("@JavascriptInterface public void setIntervalMinutes(")[0]||"";
 const longPress=service.split("final Runnable dockLongPress=()->{")[1]?.split("};")[0]||"";
 return bridge.includes("pickerOpen=true;")&&bridge.includes("PokemonPicker.show(OverlayService.this")&&
  bridge.includes("pickerOpen=false;")&&bridge.includes("if(!stopped)update();")&&
  bridge.includes("},anchorX,anchorY);")&&
  publicApi.includes("showFavoritePicker(menuParams==null?-1:")&&
  publicApi.includes("showFavoritePicker(anchorX,anchorY)")&&
  !bridge.includes("root.setVisibility(View.GONE)")&&
  !bridge.includes("resultRoot.setVisibility(View.GONE)")&&
  !bridge.includes("menuRoot.setVisibility(View.GONE)")&&
  !bridge.includes("setVisibility(View.VISIBLE)")&&
  !longPress.includes("pickerOpen")&&
  picker.includes("window.addFlags(android.view.WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL)")&&
  picker.includes("android.view.WindowManager.LayoutParams.WRAP_CONTENT");
});

test("Login has one top toolbar and no native footer buttons",main.includes('done.setText("✓ PokeSearch")')&&main.includes('loginDialog.requestWindowFeature(android.view.Window.FEATURE_NO_TITLE)')&&main.includes('MATCH_PARENT,\n                android.view.WindowManager.LayoutParams.MATCH_PARENT'));
test("Shiny remains separate from the chosen filter",service.includes('shiny=!shiny;')&&dock.includes('onclick="Native.shiny()"')&&service.includes('mode.equals(selected)'));
test("A changed mode immediately reaches refresh without a 60s queue",!service.includes('handler.postDelayed(queuedRefresh,remaining*1000L+300L)')&&service.includes('filterChangeRefresh=()->refresh(true)'));
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
 service.includes("positionResultsUnderPokeball(false);")&&
 service.includes("int maxY=Math.max(0,display.heightPixels-resultParams.height);")&&
 dock.includes("cards=Array.isArray(a)?a.slice(0,100):[]")&&
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
   compact.rows.every(x=>x===45)&&compact.sprite===45&&
   helpers.resultHasVisibleInfo(withInfo[0],false,true)===true&&
   helpers.resultHasVisibleInfo(withInfo[1],false,true)===false;
});
test("UX-INFO-01 quantity of spawns is visibility-only and never changes the ten-card limit",
 dock.includes('["count","Spawns","Quantidade de spawns"]')&&
 dock.includes('id="resultSpawnCount"')&&
 dock.includes('count.textContent=resultDisplayOptions.count?String(cards.length):""')&&
 dock.includes('cards=Array.isArray(a)?a.slice(0,100):[]')&&
 service.includes('case "count":resultShowCount=value;pref="resultShowCount"')&&
 !service.includes('setSpawnLimit'));
test("UX-INFO-10 visibility toggles report confirmed Android state without scrolling to top",
 dock.includes('const previousDisplayPrefs=JSON.stringify(resultDisplayOptions);')&&
 dock.includes('JSON.stringify(resultDisplayOptions)!==previousDisplayPrefs)renderInfoChoices();')&&
 dock.includes('const scroll=previous.dataset.panelKind==="info"?previous.scrollTop:0;')&&
 dock.includes('if(choiceOpen==="info"&&panel.isConnected)panel.scrollTop=scroll;')&&
 dock.includes('selected?"✓":"–"')&&
 dock.includes('Native.setResultDisplayOption(key,!resultDisplayOptions[key])')&&
 !dock.includes('resultDisplayOptions[key]=!resultDisplayOptions[key];'));
test("UX-INFO-DEFAULT-ALL-HIDDEN all 21 optional fields start OFF without overriding saved choices",()=>{
 const source=dock.match(/let resultDisplayOptions=\{([\s\S]*?)\};/);
 if(!source)return false;
 const names=[
  "count","name","number","gender","size","form","moves","location",
  "distance","shiny","despawn","level","cp","rawIv","iv",
  "overallRankGl","overallRankUl","overallRankMl",
  "speciesIvRankGl","speciesIvRankUl","speciesIvRankMl"
 ];
 const defaultOptions=Object.fromEntries([...source[1].matchAll(/(\w+):(?:true|false)/g)]
  .map(m=>[m[1],source[1].slice(m.index).startsWith(m[1]+":true")]));
 const nativeBlock=service.split("private void syncPreferencesWithoutSearch(){")[1]
  ?.split("String wantedSort=",1)[0]||"";
 return names.length===21&&names.every(name=>defaultOptions[name]===false)&&
  names.every(name=>dock.includes('["'+name+'",'))&&
  dock.includes('let showResultText=false;')&&
  dock.includes('showTimers=false')&&
  service.includes('private boolean showTimers=false,alerts=false,showResultText=false;')&&
  service.includes('private boolean resultShowCount=false,')&&
  service.includes('resultShowRawIv=false')&&
  !service.includes('putBoolean("resultShowCount",true)')&&
  !nativeBlock.includes('resultCountUxV2')&&
  nativeBlock.includes('resultShowCount=prefs.getBoolean("resultShowCount",false)')&&
  nativeBlock.includes('resultShowRawIv=prefs.getBoolean("resultShowRawIv",false)')&&
  dock.includes('selected?"✓":"–"')&&
  dock.includes('Native.setResultDisplayOption(key,!resultDisplayOptions[key])')&&
  !dock.includes('As 21 informações começam ocultas por padrão');
});
test("UX-INFO-01b zero spawns shows numeric 0 when its indicator is enabled",
 dock.includes('count.textContent=resultDisplayOptions.count?String(cards.length):""')&&
 dock.includes('count.style.display=resultDisplayOptions.count?"inline":"none"')&&
 dock.includes("cards=Array.isArray(a)?a.slice(0,100):[]")&&
 !dock.includes("count.textContent=resultDisplayOptions.count&&cards.length")&&
 !service.includes("setSpawnLimit"));
test("UX-INFO-02 legacy and new IV/rank display choices persist independently",()=>{
 const labels=["Quantidade de spawns","Tempo até desaparecer","Nível",
  "Poder de Combate","IV bruto","Porcentagem de IV",
  "Rank geral Grande Liga","Rank geral Ultra Liga","Rank geral Liga Mestre",
  "Rank IV Grande Liga","Rank IV Ultra Liga","Rank IV Liga Mestre"];
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
  lines.includes("67%")&&lines.includes("RG#2")&&lines.includes("IV#1");
});
test("UX-INFO-COMPACT-01 requested Pokémon metadata has no verbose labels",()=>{
 const begin=dock.indexOf("let locationCountryNames=null;");
 const end=dock.indexOf('function resultHasVisibleInfo(',begin);
 if(begin<0||end<begin)return false;
 const extract=dock.slice(begin,end);
 const makeLines=new Function("verifiedSpawnRawIv","verifiedSpawnIvPercent",
  "verifiedOverallRank","verifiedSpeciesIvRank","pvpIvClassPercent","bestEvolutionRank","esc","ivPaletteClass",extract+
  "return {resultLines,resultInfoHtml,locationCountryFlag};")(
   c=>c.iv||null,c=>c.ivPercent??null,(card,lg)=>({gl:12,ul:84,ml:35}[lg]),
   (card,lg)=>({gl:1,ul:50,ml:307}[lg]),
   n=>(100*(4096-n)/4095).toFixed(2).replace(".",","),
   ()=>null,
   x=>String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;"),
   value=>value===100?"perfect":value===0?"zero":"medium"
  );
 const c={name:"Yamask",number:"#562",gender:"♂",size:"XXL",form:"Galarian",
  moves:"Astonish / Rock Tomb",location:"Tainan City, Taiwan",distance:"0.3 km",
  shiny:true,cp:813,level:29,iv:"15/15/15",ivPercent:100,expiresAtMs:3210000};
 const opts={name:true,number:true,gender:true,size:true,form:true,moves:true,
  location:true,distance:true,shiny:true,cp:true,level:true,rawIv:true,iv:true,
  overallRankGl:true,overallRankUl:true,overallRankMl:true,
  speciesIvRankGl:true,speciesIvRankUl:true,speciesIvRankMl:true,despawn:true};
 const lines=makeLines.resultLines(c,opts,"gl");
 const nameWithForm=makeLines.resultLines({...c,name:"Yamask ✨ (Galarian)"},{name:true,form:true},"gl");
 const zero={...c,iv:"0/0/0",ivPercent:0};

 const rank=["GL RG#12","GL IV#1","GL P100,00%","UL RG#84","UL IV#50",
   "ML RG#35","ML IV#307"];
 return ["Yamask","#562","♂","XXL","Galarian","Astonish / Rock Tomb",
   "🇹🇼 Tainan City, Taiwan","0.3 km","✨","PC813 · Nv29","15/15/15","100%","TIMER"].every(x=>lines.includes(x))&&
  rank.every(x=>lines.includes(x))&&
  nameWithForm[0]==="Yamask"&&nameWithForm[1]==="Galarian"&&
  makeLines.resultInfoHtml("0%",zero).includes('ivInfo zero')&&
  makeLines.resultInfoHtml("0/0/0",zero).includes('ivInfo zero')&&
  !lines.some(x=>/^(?:Nome |Nº |Sexo |Tam |Forma |Golpes |Local |Dist |IV )/.test(x))&&
  makeLines.resultInfoHtml("♂",c).includes('genderInfo male')&&
  makeLines.resultInfoHtml("♀",c).includes('genderInfo female')&&
  makeLines.resultInfoHtml("PC813 · Nv29",c).includes('statPrefix')&&
  makeLines.resultInfoHtml("15/15/15",c).includes('ivInfo perfect')&&
  makeLines.resultInfoHtml("100%",c).includes('ivInfo perfect')&&
  makeLines.locationCountryFlag("Santa Maria, California, United States")==="🇺🇸"&&
  makeLines.locationCountryFlag("place unknown")===""&&
  dock.includes('.genderInfo.male{color:#59a9ff}')&&
  dock.includes('.genderInfo.female{color:#ff83bb}')&&
  dock.includes('.statPrefix{font-size:.78em')&&
  makeLines.resultInfoHtml('GL RG#12',c).includes('leaguePrefix gl')&&
  makeLines.resultInfoHtml('UL IV#50',c).includes('leaguePrefix ul')&&
  makeLines.resultInfoHtml('ML P100,00%',c).includes('leaguePrefix ml');
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
 service.includes('int right=anchorX+railWidth+margin;')&&
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
  const pitch=size; // LT77 E2: neutral Editor pitch must never create empty rows
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
 return compact.sprite===45&&compact.rows.every(row=>row===45)&&
   dock.includes("return Math.max(size,pitch); // No sprite-overlap");
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
test("Favorites dialog has integrated compact close action",picker.includes('finish.setText("×")')&&!picker.includes('.setPositiveButton("Concluído"'));
test("Favorites use persisted theme and transparency without intercepting outside touches",picker.includes('1-Math.pow(Math.max(0,Math.min(100,transparency))/100.0,2.8)')&&picker.includes('menuTransparency",50')&&picker.includes('FLAG_NOT_TOUCH_MODAL')&&!picker.includes('window.addFlags(android.view.WindowManager.LayoutParams.FLAG_BLUR_BEHIND)'));
test("Tutorial matches actual icon artwork",main.includes('tutorial.html')&&require('node:fs').readFileSync(require('node:path').join(root,'assets/tutorial.html'),'utf8').includes('Guia rápido · PokeSearch'));
test("Toolbar hides during login and favorite editing",service.includes('if(menuRoot!=null)menuRoot.setVisibility(View.GONE)'));
test("Only one pin control appears in toolbar",(dock.match(/id="location"/g)||[]).length===1);
test("Single pin control expands the location editor",dock.includes('onclick="toggleChoices(\'location\')"'));
test("Coords editor uses one Apply and explicit Clear without a second ON/OFF switch",dock.includes('fieldRow.append(field)')&&dock.includes('label.append(labelName,radiusWrap)')&&dock.includes('clear.onclick=disable')&&!dock.includes('fieldRow.append(field,paste,toggle)'));
test("Location has title paste, no header X, and separate geographic disable",dock.includes('label.append(labelName,radiusWrap)')&&!dock.includes('close.onclick=closeChoices;title.appendChild(close)')&&dock.includes('Native.setLocation(false,"",0)'));
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
test("Despawn removes expired sprites then reloads the site even when AUTO is OFF",()=>
 expiry.includes('results=active.toString();hideDetails();update();')&&
 expiry.includes('armNextDespawn(active);')&&
 expiry.includes('if(expired&&!stopped&&!loginPaused)')&&
 expiry.includes('schedulePeriodic();')&&
 expiry.includes('if(searchInProgress)queuedManualRefresh=true;')&&
 expiry.includes('else refresh(true);')&&
 !expiry.includes('handler.postDelayed(this,2000L)')&&
 expiry.indexOf('results=active.toString()')<expiry.indexOf('refresh(true);'));
test("Expired 0:00 cards are never restored or announced as live",()=>{
 return service.includes('if(secs<0||secs>86400)return Long.MAX_VALUE;')&&
  service.includes('if(end<=now)continue;')&&
  service.includes('JSONArray sorted=sortItems(retainVerifiedEncounterFields(unexpired));')&&
  service.indexOf('JSONArray sorted=sortItems(retainVerifiedEncounterFields(unexpired));')<
   service.indexOf('recordNewResults(sorted,');
});
test("Reopening menu immediately re-applies active visual states to recreated buttons",()=>{
 const block=dock.split('function renderQuickMenu(){')[1]?.split('function audibleAlertState(')[0]||"";
 return block.includes('rows.replaceChildren();util.replaceChildren();footer.replaceChildren();')&&
  block.includes('refreshQuickMenuStates();')&&
  block.indexOf('button.onclick=()=>quickClick(renderedId);')<block.indexOf('refreshQuickMenuStates();')&&
  dock.includes('if(menuOpen&&controlsWindow)renderQuickMenu();')&&
  dock.includes('button.classList.toggle("selected",');
});
test("AUTO retains 3/5/10/15/20 minute scheduling",service.includes("handler.postDelayed(periodic,intervalMinutes*60000L)")&&service.includes("int[] options={0,3,5,10,15,20};"));
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
  dock.includes('button.onclick=()=>selectInterval(value)'));
test("Manual refresh button has touch feedback",dock.includes('onclick="manualRefreshTap()"')&&
 dock.includes('button.classList.add("refreshSpinning")')&&dock.includes('Native.refresh();'));
test("Gear has a visible touch target",dock.includes("#gear{width:35px;height:30px;background:transparent!important"));
test("Toolbar menu responds in narrow and wide sizes",service.includes("Math.min(330,screenWidthDp()-8)"));
test("Favorites share one background color and optional local blur without background dim",picker.includes("background.setColors(new int[]{panelColor,panelColor})")&&picker.includes("window.setBackgroundBlurRadius")&&picker.includes("window.setDimAmount(0.0f)"));
test("HOME-01 has explicit official Google/Discord login and sign-out",(()=>{
 const home=main.split("private FrameLayout buildHome(){")[1]?.split("private Button homeAuthButton(")[0]||"";
 return home.includes('homeAuthButton("◉  Discord"')&&home.includes('homeAuthButton("G  Google"')&&
  home.includes('discord.setOnClickListener(v->openProviderLogin("discord"))')&&
  home.includes('google.setOnClickListener(v->openProviderLogin("google"))')&&
  home.includes('logout.setOnClickListener(v->askLogout())');
})());
test("Login does not start a stopped overlay",main.includes("if(!enabled)return;")&&main.includes("OverlayService.isSecondaryRunning()")&&main.includes("OverlayService.isRunning()"));
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
  gradleBuild.includes('publicVersionName ?: "0.51-beta.test.${testVersionLabel ?: testVersionCode}"')&&
  gradleBuild.includes('POKE_TEST_PUBLIC_VERSION')&&
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
test("B06 page finish schedules one cancellable refresh, 900ms Shiny or 2500ms standard",
 pageBlock.includes('handler.removeCallbacks(pageFinishedRefresh);')&&
 pageBlock.includes('handler.postDelayed(pageFinishedRefresh,')&&
 pageBlock.includes('shiny&&!shinyVerified?900L:2500L')&&
 !pageBlock.includes('handler.postDelayed(()->{if(!stopped&&!loginPaused)refresh();}'));
test("B06 REFRESH_LOGIN cancels callbacks before cookie flush",reloadBlock.includes('++requestGeneration;')&&reloadBlock.indexOf('cancelSessionCallbacks();')<reloadBlock.indexOf('CookieManager.getInstance().flush();'));
test("B06 reload occurs after 350ms with generation guard",reloadBlock.includes('handler.postDelayed(deferredSessionReload,350L)')&&service.includes('pendingReloadGeneration!=requestGeneration'));
test("B06 delayed search stages verify pause/generation",(service.match(/if\(stopped\|\|loginPaused\|\|generation!=requestGeneration\)return;/g)||[]).length>=8);
test("B06 destruction cancels callbacks and removes windows before WebViews",destroyBlock.indexOf('stopped=true;')<destroyBlock.indexOf('handler.removeCallbacksAndMessages(null)')&&destroyBlock.indexOf('wm.removeView(detailRoot)')<destroyBlock.indexOf('destroyWebView(panel,true'));
test("B06 privacy of errors unchanged",service.includes('error.getClass().getSimpleName()')&&!service.includes('error.getMessage()'));
test("B06 Android SDK and manifest unchanged",manifest.includes('<service android:name=".OverlayService" android:exported="false" />')&&gradleBuild.includes('targetSdk = 33')&&gradleBuild.includes('compileSdk = 36'));
// PS-075–PS-080 regression contracts
test("PS-075 favorite tests remain in native code, hidden from compact notifications", 
 service.includes('void testNotification()')&&
 !dock.split("function renderAlertsChoices(){")[1].split("// Site -> App")[0].includes('testNotification"]'));test("PS-075 Home Preferences provides both toggles and test action",main.includes("settingAlertMode(body,prefs);")&&main.includes('settingCheckbox(body,prefs,WatchAlerts.PREF_ENABLED,')&&main.includes('WatchAlerts.test(this)'));
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
test("PS-081 notification permission stays available outside compact picker",
 !picker.includes('requestPermissions(')&&service.includes('void requestNotificationPermission()')&&
 main.includes('requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},204)'));test("PS-082 sync action from Home requires running overlay",main.includes('OverlayService.isRunning()')&&main.includes('serviceAction("com.lucianotoscano.pokesearchoverlay.SYNC_PREFS")'));
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
    dock.includes('off.textContent="OFF"')&&dock.includes('period===0?"OFF"')&&dock.includes("period=[0,3,5,10,15,20].includes(Number(interval))?Number(interval):5")&&
    service.includes('if(minutes!=0&&minutes!=3&&minutes!=5')&&
    service.includes('if(!stopped&&!loginPaused&&intervalMinutes>0)handler.postDelayed(periodic,'));
test("General notifications still cycle off/on/silent while bell indicates both sources",
    service.includes('alertsMode="off".equals(alertsMode)?"on":"on".equals(alertsMode)?"silent":"off"')&&
    dock.includes('bell-sound-new')&&dock.includes('bell-sound-favorites')&&
    dock.includes('bell-sound-both')&&dock.includes('bell-silent-mode'));
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
test("Shiny OFF uses immediate verified Search without login",(()=>{
 const bridge=service.split('@JavascriptInterface public void shiny()')[1]?.split('@JavascriptInterface public void refresh()')[0]||"";
 return bridge.includes('if(!shiny){')&&bridge.includes('refresh(true);')&&
  bridge.includes('startVerifiedShinySearch(generation,0);')&&
  read("assets/probe.js").includes('if(action==="setShiny")return JSON.stringify(setShiny(shinyOnly))');
})());
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
test("Shiny state sync on page hydration has one Search, no duplicate setShiny",(()=>{
 const nav=service.split('pendingPageRefreshGeneration=searchInProgress?-1:requestGeneration;')[1]?.split('@Override public void onReceivedError',1)[0]||"";
 return nav.includes('handler.postDelayed(pageFinishedRefresh,')&&
  nav.includes('shiny&&!shinyVerified?900L:2500L')&&
  !nav.includes('prepareImmediateShiny(generation);');
})());
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
    service.includes('if(resultRoot!=null&&!pickerOpen&&!minimized&&!resultCollapsed)resultRoot.setVisibility(View.VISIBLE)'));
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
 dock.includes('width:54px!important;height:164px!important')&&
 dock.includes('height:23px!important;min-height:23px!important')&&
 dock.includes('modeCascadeEditor')&&
 dock.includes('max-width:calc(100% - 54px)')&&
 service.includes('int roomDp=requestedPopup==0?420:'));
test("Cascade input uses placeholders and keyboard entry",
 dock.includes('input.type="text";input.inputMode="numeric"')&&
 dock.includes('input.value=String(modeDraft[key]??searchSettings[key]??"")')&&
 dock.includes('input.addEventListener("keydown"')&&
 dock.includes('input.addEventListener("input"')&&
 dock.includes('kind==="percent"?[0,100]'));
test("Four editable cascade modes keep raw, percent and rank numeric bounds",(()=>{const b=dock.split("function renderModeChoices(){")[1]?.split("function renderExtraFilters(")[0]||"";
 return b.includes('kind==="iv"?[0,15]:[1,50]')&&b.includes('limitsFor=kind')&&
 ["attack","defense","stamina","percentMin","percentMax","glRank","ulRank"].every(k=>b.includes('"'+k+'"'))&&
 b.includes('input.value=String(modeDraft[key]??searchSettings[key]??"")')&&b.includes('input.maxLength=kind==="percent"?3:2');})());
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
 !dock.includes('cancel.className="modeCascadeCancel"')&&toolbarButtons.length===12);
test("Cascade percent MIN/MAX are kept in valid order on edit",
 dock.includes('if(cascadeMode==="percent"&&values.percentMin>values.percentMax)')&&
 dock.includes('Object.assign(modeDraft,values)')&&
 dock.includes('values.percentMin>values.percentMax'));
test("Native bridge validates all requested IV, PvP ranking and percent bounds",
 service.includes("public void setSearchConfig(String payload)")&&
 service.includes("within(a,0,15)")&&service.includes("within(gl,1,50)")&&
 service.includes("within(min,0,100)")&&
  service.includes("within(max,0,100)")&&service.includes("min>max"));
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
test("Cascade IV% accepts all 0-100 typed values with explicit bounds",
 dock.includes('const limitsFor=kind=>kind==="percent"?[0,100]:kind==="iv"?[0,15]:[1,50]')&&
 dock.includes('value<entry.min||value>entry.max')&&
 dock.includes('entry.input.reportValidity();return;'));
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
 return b.includes('kind==="percent"?[0,100]')&&
 b.includes('kind==="iv"?[0,15]:[1,50]')&&
 b.includes('Object.assign(modeDraft,values)')&&
 read("assets/probe.js").includes('filters.percentMin>=0&&filters.percentMax<=100')&&
 read("assets/probe.js").includes('configuredRank()');})());
test("Native validation prevents invalid IV percentages including on saved requests",
 service.includes('private static boolean isAllowedIvPercent(int value)')&&
 service.includes('if(ivPercentageForSum(total)==value)return true;')&&
 service.includes('!within(min,0,100)||!within(max,0,100)||min>max')&&
 service.includes('!within(gl,1,50)||!within(ul,1,50)'));
test("Legacy IV percent migration expands only as necessary without trimming Pokémon",
 service.includes('ivPercentMin=Math.max(0,Math.min(100,pref.getInt("ivPercentMin",0)))')&&
 service.includes('ivPercentMax=Math.max(ivPercentMin,')&&
 !service.includes('ivPercentMin=floorIvPercent(previousMin)')&&
 service.includes('Math.min(100,pref.getInt("ivPercentMax",100))'));


test("UX-MENU-01 keeps original 12 commands but navigates with compact contextual menu",
 dock.includes('id="quickMenuList"')&&dock.includes('id="quickRows"')&&
 dock.includes('body.controls-window #controls{display:none!important}')&&
 dock.includes('case "location":return currentLocationUiState()==="CONFIRMED"?"✓ "+locationRadius+" km"')&&
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
 dock.includes('id==="sh"?shiny:')&&dock.includes('shinyPending=!!pending;\n shiny=!!shi||shinyPending;')&&
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
 dock.includes('width:54px!important;height:164px!important')&&
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
  body.includes('link("Info Pokémon","info")')&&body.includes('link("Editor Visual","visual")')&&
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
  prefs.includes('"appearance","sh"')&&
  click.includes('case "sh":Native.shiny();break;')&&
  dock.includes('if(id==="sh")button.setAttribute("aria-pressed",String(shiny))')&&
  state.includes('button.classList.toggle("pending",id==="sh"&&shinyPending)')&&
  state.includes('id==="sh"?shiny:')&&
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
test("Shiny OFF and normal search use same site form, without trainer gate",(()=>{
 const bridge=service.split('@JavascriptInterface public void shiny()')[1]?.split('@JavascriptInterface public void refresh()')[0]||"";
 const off=bridge.split('if(!shiny){')[1]?.split('startVerifiedShinySearch(generation,0);')[0]||"";
 return off.includes('refresh(true);')&&!off.includes('execute("session"')&&
  service.includes('verifyShinyAfterLocation(generation,manual,0);')&&
  !service.includes('if(!hasConfirmedTrainerLink())return;\n        execute("session"');
})());
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
  dock.includes('if(choiceOpen==="filters"&&modeDraft&&document.getElementById("officialFormItems")===null)');
 })());
test("REG-51049 filters cannot replace a cascade editing session",
 dock.includes('if(choiceOpen==="filters")renderFiltersChoices();else renderModeChoices();')&&
 dock.includes('if(choiceOpen==="filters"&&modeDraft&&document.getElementById("officialFormItems")===null)')&&
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
  !dock.includes('now.textContent="↻ Atualizar agora"')&&
  dock.includes('button.className="periodCompactValue"+(value===current?" chosen":"")')&&
  dock.includes('rows.appendChild(button)')&&
  service.includes('"bell","period","appearance","report","donate","close"');
});
// UX-MODE-ICONS: use approved uploaded assets, keep the 11-button ribbon.
test("Four compact star PNGs and three new owner Mode originals are preserved",()=>{
 const stars=["0Star.png","1Star.png","2Star.png","3Star.png"];
 const updated=["StarIVRaw.png","StarGL.png","StarUL.png"];
 return stars.every(name=>{
  const b=fs.readFileSync(path.join(root,"assets/result-icons/modes",name));
  return b.subarray(0,8).equals(Buffer.from("89504e470d0a1a0a","hex"))&&
   b.readUInt32BE(16)===128&&b.readUInt32BE(20)===128;
 })&&updated.every(name=>{
  const b=fs.readFileSync(path.join(root,"assets/result-icons/modes",name));
  return b.subarray(0,8).equals(Buffer.from("89504e470d0a1a0a","hex"))&&
   b.readUInt32BE(16)>=128&&b.readUInt32BE(20)>=128;
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
  [0,98,"StarIVRaw.png"],[2,100,"StarIVRaw.png"],[2,98,"StarIVRaw.png"],[0,100,"StarIVRaw.png"],
  [0,50,"0Star.png"],[0,49,"0Star.png"],
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
 const code=dock.split('const current=period;')[1]?.split("function positionCascadeEditor()")[0]||"";
 return !code.includes("‹ Ajustes")&&!code.includes('choiceOpen="appearance"')&&
  !code.includes('now.textContent=')&&code.includes('Native.setIntervalMinutes(value)')&&code.includes('off.onclick=()=>selectInterval(0)');
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
  main.includes('pageBackground.setScaleType(ImageView.ScaleType.CENTER_CROP)')&&
  main.includes('R.drawable.ps_home_background_light')&&
  fs.existsSync(path.join(root,"res/drawable-nodpi/ps_home_background_light.png"))&&
  main.includes('dim.setBackgroundColor(homeLightMode?');
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
 dock.includes('width:54px!important;height:164px!important')&&
 dock.includes('height:23px!important;min-height:23px!important')&&
 b.includes('const offsets={raw:67,percent:90,gl:113,ul:136}')&&
 b.includes('editor.appendChild(confirm);panel.appendChild(editor)')&&
 !b.includes('modeWheel')&&
 !b.includes('Native.shiny()');})());
test("UX-MODOS-CASCADE-04 confirms or cancels only the chosen lateral editor",
 dock.includes('confirm.className="modeCascadeConfirm"')&&
 !dock.includes('cancel.className="modeCascadeCancel"')&&
 dock.includes('confirm.onclick=()=>')&&
 dock.includes('input.value=String(modeDraft[key]??searchSettings[key]??"")')&&
 dock.includes('entry.input.setCustomValidity("Digite um número de "')&&
 dock.includes('Native.setSearchConfig(JSON.stringify(next))'));
test("Existing toolbar Shiny remains next to mode, with exactly twelve actions",
  dock.indexOf('id="sh"')>dock.indexOf('id="cycle"')&&
  (dock.match(/<button id="(?:cycle|sh|period|manualRefresh|size|clock|bell|star|location|report|donate|close)"/g)||[]).length===12);
test("Sort by remains among existing verified advanced filters",
 dock.includes('renderExtraFilters(panel,make)')&&
 dock.includes('option("sortBy","Ordenar")')&&
 dock.includes('["Despawn (longest)","CP (highest)","IV % (highest)","Level (highest)","Distance (nearest)"]')&&
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
 dock.includes('panel.classList.add("periodCompact","visible")')&&
 dock.includes('if(choiceOpen==="period")closeChoices();')&&
 dock.includes('[...row.children].forEach(tile=>panel.appendChild(tile))')&&
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
test("Filters use compact Modos-like rail without collapsed general section",
 dock.includes('const rows=[...panel.querySelectorAll(":scope > .extraField")]')&&
 dock.includes('classList.toggle("chosen",label===selected)')&&
 dock.includes('panel.append(rail,editor)')&&
 dock.includes("panel.classList.add('filterCascade')")&&
 !dock.includes('section("Filtros gerais",generalExpanded')&&
 dock.includes('grid-template-columns:77px minmax(0,1fr)'));
test("Site dropdown options are discovered instead of inventing weather/form values",
  dock.includes('for(const [key,value] of Object.entries(response.options||{}))')&&
  dock.includes('filterOptions[key]={...(filterOptions[key]||{}),...value};')&&
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
test("Mode switches have no artificial 60-second search penalty",
 !service.includes('MIN_SEARCH_GAP_MS')&&
 !service.includes('remoteDrainUntilMs')&&
 !service.includes('skipLocalGapInDebug()')&&
 !service.includes('próxima consulta em')&&
 service.includes('nextScheduledSearchAtMs=0L;'));
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
 dock.includes('const rawLabel=')&&dock.includes('const percentLabel=')&&
 dock.includes('const badge=family==="hundo"?"100%":family==="nundo"?"0%":rawLabel')&&
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
 dock.includes("'+icon+ivBadge+badge+cooldownMarkup+info+'</button>'")&&
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
 dock.includes('h=Math.max(h,baseHeight+164+6);')&&
 dock.includes("function positionCascadeEditor()")&&
 dock.includes("rail.scrollTop=Math.max(0,wanted+selected.offsetHeight-visibleRail)")&&
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
  zero.path.endsWith("/base-custom.png")&&zero.ivBadge==="0%"&&
  range.path.endsWith("/base-custom.png")&&range.ivBadge==="2–98%"&&all.ivBadge==="0–100%"&&
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
 dock.includes('activeSearchPhase==="searching"||activeSearchPhase==="filling"')&&
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
test("UX-FIX-01 no 60s rate limit in either debug or release",()=>{
 return !service.includes('MIN_SEARCH_GAP_MS')&&
 !service.includes('remoteDrainUntilMs')&&
 !service.includes('skipLocalGapInDebug')&&
 service.includes('if(searchInProgress){')&&
 service.includes('handler.removeCallbacks(queuedRefresh);');
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
test("PL-02 navigation recovery survives filter change while loading",()=>{
 const nav=service.split("website.setWebViewClient(new WebViewClient(){")[1]?.split("    @Override public void onCreate()")[0]||"";
 return nav.includes("pageLoadGeneration++")&&
  !nav.includes("pageLoadGeneration!=requestGeneration")&&
  nav.includes("url.equals(view.getUrl())")&&
  nav.includes("view.getProgress()==100")&&
  nav.includes("if(!searchInProgress)handler.postDelayed(pageFinishedRefresh,")&&
  nav.includes("shiny&&!shinyVerified?900L:2500L");
});
test("PL-02 only the newest selection starts after debounce",()=>{
 return service.includes("private final Runnable filterChangeRefresh=()->refresh(true);")&&
  service.includes("handler.removeCallbacks(filterChangeRefresh);")&&
  service.includes("handler.postDelayed(filterChangeRefresh,240L);")&&
  service.includes("replaceActiveFilterSearch();shinyVerified=false;");
});
test("PL-02 logical cancellation drops stale callbacks without delaying the new filter",()=>{
 return service.includes("private void guardSubmittedSearchBeforeReplacement()")&&
  service.includes("submittedSearchGeneration==requestGeneration")&&
  service.includes("++requestGeneration;")&&
  service.includes("callbackGeneration!=requestGeneration")&&
  !service.includes("remoteDrainUntilMs")&&
  !service.includes("MIN_SEARCH_GAP_MS");
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
 return service.includes("SEARCH_WATCHDOG_MS=90_000L")&&
  service.includes("handler.postDelayed(searchWatchdog,SEARCH_WATCHDOG_MS);")&&
  watchdog.includes("watchdogGeneration!=requestGeneration")&&
  watchdog.includes("guardSubmittedSearchBeforeReplacement();")&&
  watchdog.includes("++requestGeneration;")&&
  watchdog.includes('searchFailure("⚠ Tempo limite"')&&
  service.includes("handler.removeCallbacks(searchWatchdog);");
});
test("RESULTS-ALL-MODES partial site counts wait for complete card extraction",()=>{
 const probe=read("assets/probe.js");
 return probe.includes('const expectedVisible=siteCount>0?Math.min(siteCount,100):0;')&&
  probe.includes('const siteIncomplete=expectedVisible>found.length;')&&
  probe.includes('siteCount,siteIncomplete,expectedVisible,parseFailure')&&
  service.includes('if(r.optBoolean("siteIncomplete",false)&&attempt<24)')&&
  service.includes('BugReport.log(this,"RESULTS_PARTIAL"')&&
  service.includes(' • leitura parcial');
});
test("Mode switches retry transitional old cards and map-link extraction",()=>{
 return service.includes('if(attempt<24){pollSearch(generation,attempt+1,manual);return;}')&&
  service.includes('if((loading||(!empty&&found==0))&&attempt<24)')&&
  service.includes('if(found>0&&r.optJSONArray("cards")!=null&&r.optJSONArray("cards").length()==0)')&&
  read("assets/probe.js").includes('elements("button,a,[role=button]")')&&
  read("assets/probe.js").includes('if(!chosen||seen.has(chosen))continue;');
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
  poll.includes("if(attempt<24){pollSearch(generation,attempt+1,manual);return;}")&&
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
 if(!source.includes("if(img.complete){if(good())loaded();else failed();}")||
    !source.includes("retries>=1")||!source.includes('data-original-src'))return false;
 function makeStage(image){
  const classes=new Set(),listeners={};
  if(image){
   image.isConnected=true;
   image.addEventListener=(name,fn)=>{listeners[name]=fn;};
   image.getAttribute=()=>image.src||"https://example.test/sprite.png";
  }
  return {image,classes,listeners,classList:{add:name=>classes.add(name),
   remove:name=>classes.delete(name)},querySelector:()=>image};
 }
 const cached=makeStage({naturalWidth:128,naturalHeight:128,complete:true});
 const waiting=makeStage({naturalWidth:128,naturalHeight:128,complete:false});
 const broken=makeStage({naturalWidth:0,naturalHeight:0,complete:true});
 const tiny=makeStage({naturalWidth:1,naturalHeight:1,complete:true});
 const absent=makeStage(null);
 const stages=[cached,waiting,broken,tiny,absent];
 const mockDoc={querySelectorAll:sel=>sel===".spawn .spriteStage"?stages:[]};
 const attach=(new Function("document","setTimeout","return function attachSpriteFeedback(){"+source))(
  mockDoc,()=>{} // no timers after tests; simulate exhausted onerror manually
 );
 attach();
 if(waiting.classes.has("loaded")||waiting.classes.has("failed"))return false;
 waiting.listeners.load();
 // Unverified images get one bounded retry; the second failure shows fallback.
 broken.listeners.error();broken.listeners.error();
 tiny.listeners.error();tiny.listeners.error();
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
  profile.includes('trainerState=trainers.length?"linked":explicitZero?"unlinked":"unknown"')&&
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
  home.includes("overlayControl=makeIcon(R.drawable.sem_filtro")&&
  home.includes('makeIcon(R.drawable.ic_heart_outline')&&
  home.includes('homeMiniButton("☰"')&&
  home.includes("R.drawable.ps_home_official_wordmark")&&
  home.includes('brandTitle.setContentDescription("PokeSearch")')&&
  home.includes("frame.setBackgroundColor(homeLightMode?")&&
  !home.includes("sky.setImageResource(")&&
  home.includes("auth.setBackground(homeSurface(");
})());
test("BELL-THEME-02 floating bell uses black in light mode and white in dark mode",()=>{
 const light='body.controls-window.visual-light-menu #quickMenuList button[data-key="bell"]:not(.bell-sound-new):not(.bell-sound-both) .quickGlyph{';
 const dark='body.controls-window:not(.visual-light-menu) #quickMenuList button[data-key="bell"]:not(.bell-sound-new):not(.bell-sound-both) .quickGlyph{';
 const css=dock.split("/* LT54 BELL-THEME-02:")[1]?.split("/* Colored glyphs")[0]||"";
 const l=css.split(light)[1]?.split("}")[0]||"";
 const d=css.split(dark)[1]?.split("}")[0]||"";
 return l.includes("color:#111821!important")&&d.includes("color:#f7f8fa!important")&&
  l.includes("filter:none!important")&&d.includes("filter:none!important")&&
  dock.includes('button[data-key="bell"].bell-sound-new')&&
  dock.includes('button[data-key="bell"].bell-star-on .quickGlyph::after')&&
  dock.includes('button[data-key="bell"].bell-star-silent .quickGlyph::after')&&
  dock.includes('[data-key=report] .quickGlyph{color:#ffd674!important}')&&
  dock.includes('[data-key=donate] .quickGlyph{color:#fa94a7!important}')&&
  dock.includes('[data-key=close] .quickGlyph{color:#ff596c!important}');
});

test("BELL-THEME-03 bell SVG stroke follows independent menu colors and audible state",()=>{
 const visual=read("assets/visual_editor.js");
 const css=dock.split("/* LT55 BELL-THEME-03:")[1]?.split("/* Colored glyphs")[0]||"";
 const neutral='body.controls-window #quickMenuList button[data-key="bell"] .quickGlyph svg{';
 const audible='body.controls-window #quickMenuList button[data-key="bell"].bell-sound-new .quickGlyph svg,';
 const both='body.controls-window #quickMenuList button[data-key="bell"].bell-sound-both .quickGlyph svg{';
 const idle=css.split(neutral)[1]?.split("}")[0]||"";
 const sound=css.split(both)[1]?.split("}")[0]||"";
 return visual.includes('set("menu-fg",current.menuBgMode==="light"?"#152231":"#f2f7fc")')&&
  visual.includes('body.classList.toggle("visual-light-menu",current.menuBgMode==="light")')&&
  idle.includes("stroke:var(--visual-menu-fg,#f2f7fc)!important")&&
  idle.includes("color:var(--visual-menu-fg,#f2f7fc)!important")&&
  css.includes(audible)&&sound.includes("stroke:#ffd64b!important")&&
  sound.includes("color:#ffd64b!important")&&
  dock.includes('if(source){glyph.appendChild(source.cloneNode(true));return glyph;}')&&
  dock.includes('button.classList.toggle("bell-star-on",')&&
  dock.includes('button.classList.toggle("bell-star-silent",');
});

test("LT54-ICON-01 launcher uses adaptive artwork and responsive 3:1 header",(()=>{
 const manifest=fs.readFileSync(path.join(root,"AndroidManifest.xml"),"utf8");
 const home=main.split("private FrameLayout buildHome(){")[1]?.split("private Button homeAuthButton(")[0]||"";
 return manifest.includes('android:icon="@mipmap/ic_launcher"')&&
  manifest.includes('android:roundIcon="@mipmap/ic_launcher_round"')&&
  iconGenerator.includes("int artworkSize = 288")&&
  iconGenerator.includes("int padding = 8")&&
  home.includes("wordmarkWidth/3f")&&
  home.includes("wordmarkWidth=Math.max(d(90),Math.min(d(156),availableBrandWidth))")&&
  home.includes("new LinearLayout.LayoutParams(-1,d(70))");
})());
test("BRAND-01 official PNG assets and full-frame launcher artwork are preserved",()=>{
 const pngs=[
  ["res/drawable-nodpi/ic_launcher.png",1254,1254],
  ["res/drawable-nodpi/ps_home_brand_transparent.png",1254,1254],
  ["res/drawable-nodpi/ps_home_official_wordmark.png",2172,724],
  ["assets/branding/PokeSearchLogoShinyBlueEffectAll.png",1254,1254],
  ["assets/branding/PokeSearchLogoShiny.png",1254,1254],
  ["assets/branding/PokeSearchName.png",2172,724]
 ];
 return pngs.every(([p,w,h])=>{
  const img=fs.readFileSync(path.join(root,p));
  return img.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&
   img.readUInt32BE(16)===w&&img.readUInt32BE(20)===h;
 })&&iconGenerator.includes("int artworkSize = 288")&&
 iconGenerator.includes("int padding = 8")&&
 iconGenerator.includes("return new int[] {0, 0, image.getWidth(), image.getHeight()}");
});
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
 return status.includes("R.drawable.personalizado")&&status.includes("R.drawable.sem_filtro")&&
  menu.includes("homeRoot.addView(layer")&&menu.includes("Exportar dados")&&
  exportCode.includes("Intent.ACTION_CREATE_DOCUMENT")&&
  exportCode.includes("WatchAlerts.watched(this)")&&
  !exportCode.includes('prefs.getAll().toString()')&&
  !exportCode.includes('"locationCoords"');
})());
test("HOME-LT152 rehouses PoGoCoordinates account while rebuilding owner reference Home",(()=>{
 const home=main.split("private FrameLayout buildHome(){")[1]?.split("private Button homeAuthButton(")[0]||"";
 return home.includes("HomeIllustrated152.assemble(")&&
  home.includes("homeAuthHost.addView(auth")&&
  !home.includes("screen.addView(new View(this),new LinearLayout.LayoutParams(1,0,1))")&&
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
 const countStartsHidden=!service.includes('putBoolean("resultShowCount",true)')&&
  service.includes('resultShowCount=prefs.getBoolean("resultShowCount",false)');
 return win.POKESEARCH_PVPOKE_OVERALL.ml.length>=350&&
  api.verifiedOverallRank(origin,"ml")===1&&
  api.verifiedSpeciesIvRank(origin,"ml")===1&&
  api.verifiedSpawnRawIv(alt)==="0/14/15"&&
  lines.includes("0/14/15")&&lines.includes("64%")&&
  lines.includes("GL RG#2")&&lines.includes("GL IV#1")&&lines.includes("GL P100,00%")&&
  lines.includes("UL RG#275")&&lines.includes("UL IV#1460")&&lines.includes("UL P89,97%")&&
  master.includes("ML RG#1")&&master.includes("ML IV#1")&&master.includes("ML P100,00%")&&
  api.pvpIvClassPercent(1460,alt,"ul")==="89,97"&&
  !unknown.includes("?/?/?")&&
  !unknown.some(v=>v.includes("RG#")||v.includes("IV#"))&&
  api.verifiedSpawnRawIv({...alt,ivPercent:"100"})===null&&
  api.verifiedSpeciesIvRank(falseForm,"gl")===null&&
  api.resultInfoHtml("0/14/15",alt).includes("ivInfo medium")&&
  dock.includes('["stamina","S","iv","Stamina"]')&&
  countStartsHidden&&
  service.includes('case "speciesIvRankMl":resultShowSpeciesIvRankMl=value')&&
  service.includes('case "overallRankMl":resultShowOverallRankMl=value')&&
  api.computeResultLayout(Array.from({length:10},()=>alt),45,330,false,false,opts,"gl").visibleCount===10;
});


// UX-NOTIFY-01: the bell in the compact ribbon opens the real alert panel.
// Notification permission and sound preferences are never a fake visual toggle.
test("UX-NOTIFY-01 bell shows only six SVG states and two audio selectors",()=>{
 const block=dock.split("function quickClick(id){")[1]?.split("const QUICK_SVG=")[0]||"";
 const panel=dock.split("function renderAlertsChoices(){")[1]?.split("// Site -> App")[0]||"";
 return block.includes('case "bell":toggleChoices("alerts")')&&
  dock.includes(`onclick="toggleChoices('alerts')"`)&&
  panel.includes('Native.setAlertMode(id)')&&panel.includes('Native.setFavoriteAlertMode(id)')&&
  panel.includes('const symbols={')&&panel.includes('for(const id of ["on","silent","off"])')&&
  panel.includes('section("Novos Pokémon","general"')&&
  panel.includes('section("Pokémon Favoritos","favorites"')&&
  panel.includes('select.onclick=()=>Native.pickAlertTone(target)')&&
  panel.includes('SHOW_INDIVIDUAL_FAVORITE_TONES')&&
  panel.includes('Native.requestNotificationPermission()')&&!panel.includes('testGeneralNotification');
});
test("UX-NOTIFY-02 favorite and general alerts reflect real permission and stay independent",
 dock.includes('notificationPermissionGranted=!!permissionGranted')&&
 dock.includes('watchAlertsEnabled=!!favoriteAlertsEnabled')&&
 dock.includes('bell.classList.toggle("permissionMissing",!notificationPermissionGranted)')&&
 service.includes('","+WatchAlerts.permissionGranted(this)+","+WatchAlerts.enabled(this)+","+JSONObject.quote(searchPhase)+","')&&
  dock.includes('favoriteAlertMode=["on","silent","off"].includes(favoriteMode)')&&
 service.includes('if(!WatchAlerts.permissionGranted(this))return false;')&&
 service.includes('encounterAlertTitle(firstNewCard),encounterAlertDetails(firstNewCard,false)')&&
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


test("UX-NOTIFY-04 favorites and general retain separate tri-state controls",()=>{
 const panel=dock.split("function renderAlertsChoices(){")[1]?.split("// Site -> App")[0]||"";
 return watch.includes('String soundMode=mode(context);')&&
  !watch.includes('getString("alertsMode","off")')&&
  watch.includes('boolean quiet="silent".equals(soundMode);')&&
  service.includes('WatchAlerts.setMode(OverlayService.this,mode);')&&
  service.includes('WatchAlerts.setMode(OverlayService.this,enabled?"on":"off");')&&
  panel.includes('Native.setFavoriteAlertMode(id)')&&panel.includes('Native.setAlertMode(id)');
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
test("UX-NOTIFY-06 audio selection is native, persisted and never fetched by JavaScript",()=>{
 const panel=dock.split('function renderAlertsChoices(){')[1]?.split('// Site -> App')[0]||"";
 return panel.includes('Native.pickAlertTone(target)')&&
  !panel.includes('fetch(')&&!watch.includes('pokemonshowdown.com')&&
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
 return service.includes('queuedFavoriteAlerts.put(key,new QueuedFavoriteAlert')&&
  service.includes('if(delivered>=FAVORITE_ALERT_BATCH_SIZE)break')&&
  service.includes('drainFavoriteAlertQueue()')&&
  service.includes('FAVORITE_ALERT_BATCH_SIZE=5')&&
  service.includes('WatchAlerts.match(this,pending.name,pending.title,pending.details,')&&
  watch.includes('java.util.concurrent.atomic.AtomicInteger NEXT_ALERT_ID')&&
  watch.includes('NEXT_ALERT_ID.updateAndGet');
});
test("UX-NOTIFY-09 favorites-only uses a white bell with an internal star",()=>{
 return dock.includes('bell.classList.toggle("bell-sound-favorites",bellVisual.favoritesOnly)')&&
  dock.includes('bell.classList.toggle("generalOn",bellVisual.newSound)')&&
  dock.includes('button.classList.toggle("bell-sound-favorites",id==="bell"&&bellState.favoritesOnly)')&&
  dock.includes('Novos: "+alertMode+" · Favoritos: "+favoriteAlertMode')&&
  dock.includes('content:"★"');
});
test("UX-NOTIFY-10 all bell configurations honor two modes and Android permission",()=>{
 const fragment=dock.split("function notificationBellVisual(")[1]
  ?.split("function refreshQuickMenuStates(){")[0]||"";
 if(!fragment)return false;
 const state=new Function("return function notificationBellVisual("+fragment)();
 const scenarios=[
  [true,"off","off",false,false,false,false,false],
  [true,"on","off",true,false,false,false,false],
  [true,"off","on",false,true,false,false,false],
  [true,"on","on",false,false,true,false,false],
  [true,"silent","off",false,false,false,true,false],
  [true,"off","silent",false,false,false,true,false],
  [true,"silent","silent",false,false,false,true,false],
  [true,"on","silent",true,false,false,true,false],
  [true,"silent","on",false,true,false,true,false],
  [false,"on","on",false,false,false,false,true],
  [false,"off","off",false,false,false,false,false]
 ];
 return scenarios.every(([permission,general,favorite,newOnly,favOnly,both,silent,blocked])=>{
  const result=state(permission,general,favorite);
  return result.newOnly===newOnly&&result.favoritesOnly===favOnly&&
   result.both===both&&result.silent===silent&&result.blocked===blocked;
 })&&dock.includes('button.classList.toggle("bell-sound-new",id==="bell"&&bellState.newOnly)')&&
   dock.includes('button.classList.toggle("bell-sound-favorites",id==="bell"&&bellState.favoritesOnly)')&&
   dock.includes('button.classList.toggle("bell-sound-both",id==="bell"&&bellState.both)');
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
  java.includes('attempt<20')&&java.includes('response.put("query",query)')&&
  dock.includes('state==="explicit-empty"&&response.empty===true?')&&
  dock.includes('pokemonSuggestionSource=response.source==="authorized-api-catalog"?"api":"dom"')&&
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
test("UX-LOCATION-RETRY-01 same coordinates apply repeats safely without resetting proof",()=>{
 const block=service.split('@JavascriptInterface public void setLocation(boolean enabled,String coords,int radius)')[1]
  ?.split('@JavascriptInterface public void pasteLocationCoords()')[0]||"";
 const same=block.split('if(locationEnabled==enabled&&')[1]?.split('locationVerified=false;')[0]||"";
 return same.includes('!searchInProgress&&nextScheduledSearchAtMs<=System.currentTimeMillis()')&&
   same.includes('OverlayService.this.refresh(true);')&&
   same.includes('Pesquisando com coordenadas e filtros ativos')&&
   same.includes('Aguarde a busca atual ou o intervalo do site')&&
   !same.includes('locationVerified=false;')&&
   block.indexOf('locationVerified=false;')>block.indexOf('if(locationEnabled==enabled&&')&&
   block.includes('String valid=enabled?extractCoordinates(')&&
   block.includes('valid.isEmpty()||radius<0||radius>1000');
});
test("UX-LOCATION-FIX-02 panel stays open until native/site confirmation",()=>{
 const body=dock.split('function renderLocationChoices(){')[1]?.split('function manualRefreshTap(){')[0]||"";
 return body.includes('Native.setLocation(true,wantedCoords,wantedRadius)')&&
  !body.includes('locationEnabled=true;closeChoices()')&&
  !body.includes('locationCoords=match[1]')&&
  body.includes('message.textContent="⌛ Verificando localização')&&
  body.includes('label.append(labelName,radiusWrap)')&&
  body.includes('Native.setLocation(false,"",0)')&&
  dock.includes('if(controlsWindow&&choiceOpen==="location")locationPanelFeedback();')&&
  dock.includes('state==="CONFIRMED"?"✓ Localização confirmada');
});
test("UX-LOCATION-FIX-03 explicit clipboard paste is validated and never enables filters",()=>{
 const handler=service.split('@JavascriptInterface public void pasteLocationCoords()')[1]?.split(
 '@JavascriptInterface public void locationEditor(boolean open)')[0]||"";
 const render=dock.split('window.onLocationPaste=(coords,reason)=>{')[1]?.split('function renderLocationChoices(){')[0]||"";
 return handler.includes('cb.getPrimaryClip()')&&
  handler.includes('extractClipboardCoordinates(value==null?"":value.toString())')&&
  handler.includes('window.onLocationPaste&&window.onLocationPaste(')&&
  render.includes('field.value=String(coords);')&&
  !render.includes('Native.setLocation(')&&
  !handler.includes('locationEnabled=true')&&
  !handler.includes('putString("locationCoords"')&&
  dock.includes('paste.onclick=()=>Native.pasteLocationCoords()')&&
  dock.includes('paste.setAttribute("aria-label","Colar coordenadas")');
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
test("UX-WATCHDOG-90S late requests discarded",()=>{
 const body=service.split('private final Runnable searchWatchdog=()->{')[1]?.split('private boolean pickerOpen=')[0]||'';
 return body.includes('++requestGeneration;')&&body.includes('confirmedSubmittedFiltersGeneration=-1;')&&
  service.includes('private static final long SEARCH_WATCHDOG_MS=90_000L;')&&
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
  dock.includes("return Math.max(size,pitch); // No sprite-overlap")&&
  dock.includes('cards=Array.isArray(a)?a.slice(0,100):[]');
});
test("UX-INFO-ALL-02 distance is only read from official spawn card, not GPS",()=>{
 const source=read("assets/probe.js"),detail=read("assets/detail.html");
 return source.includes('const distanceMatch=body.match(')&&
  source.includes('location:place,distance,despawn:')&&
  detail.includes('item("Distância",c.distance)')&&
  !source.includes('navigator.geolocation')&&
  dock.includes('["distance","Dist.","Distância"]');
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
 return lines.includes('Machop')&&lines.includes('#066')&&
   lines.some(line=>line.endsWith('Shibuya, Tokyo, Japan'))&&
   lines.includes('0.3 km')&&lines.includes('♀')&&lines.includes('M')&&
   lines.includes('✨')&&
   !lines.some(line=>/^(?:Nome |Nº |Sexo |Tam |Forma |Golpes |Local |Dist )/.test(line))&&
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
 dock.includes('const selection={selections:[...pokemonDraft],clear:pokemonForceClear}')&&
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
 probe.includes('function pokemonPickerOptions(query)')&&
 probe.includes('const pokemon=pokemonListSelection(action)')&&
 probe.includes('return {ok:false,pending:false,reason:')&&
 probe.includes('found.filter(x=>matches(x)&&requestedSpecies(x))'));
test("SITE-POKEMON-05 12-icon toolbar & no personal GPS remain intact",()=>
 dock.includes('grid-template-columns:34fr 22fr 41fr 20fr 20fr 22fr 22fr 22fr 38fr 22fr 22fr 22fr')&&
 !probe.includes('navigator.geolocation')&&
 dock.includes('items.map')&&
 service.includes('"locationCoords"'));
test("NOTIFY-02 compact grouped speaker icons still drive two distinct native modes",()=>{
 const panel=dock.split("function renderAlertsChoices(){")[1]?.split("// Site -> App")[0]||"";
 return panel.includes('const symbols={')&&
  panel.includes('const labels={on:"Som",silent:"Sem som",off:"OFF"}')&&
  panel.includes('section("Novos Pokémon","general",alertMode,generalCustomTone)')&&
  panel.includes('section("Pokémon Favoritos","favorites",favoriteAlertMode,favoriteCustomTone)')&&
  panel.includes('Native.setAlertMode(id)')&&panel.includes('Native.setFavoriteAlertMode(id)')&&
  service.includes('alertModeCaption("Novos Pokémon",value)')&&
  service.includes('alertModeCaption("Pokémon Favoritos",mode)');
});
test("NOTIFY-03 silent notifications and blocked Android are visually distinguished",()=>{
 const states=dock.split("function refreshQuickMenuStates(){")[1]?.split("function uxPanel(",1)[0]||"";
 return states.includes('bell-silent-mode')&&
  states.includes('bell-permission-blocked')&&
  dock.includes('.bell-silent-mode .quickGlyph::before')&&
  dock.includes('.bell-permission-blocked .quickGlyph::before')&&
  dock.includes('background:#abb1ba')&&dock.includes('color:#ffb45c')&&
  !dock.includes('bell-both-muted .quickGlyph::before');
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
test("NOTIFY-05 Favorites remains selection-only; audio settings reside in mini Alerts",()=>{
 const picker=read("java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java");
 const alerts=dock.split("function renderAlertsChoices(){")[1]?.split("// Site -> App")[0]||"";
 return !picker.includes('WatchAlerts.setMode(')&&
  picker.includes('FAVORITOS')&&picker.includes('row.setBackground(rowBg)')&&
  picker.includes('background.setCornerRadius(dp(activity,12))')&&
  alerts.includes('Native.setFavoriteAlertMode(id)');
});
test("COORDS-06 typed radius still requires actual site two-field confirmation",()=>{
 return dock.includes('radiusField.type="text"')&&
   dock.includes('radiusField.maxLength=4')&&
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
  service.includes('WatchAlerts.match(this,pending.name,pending.title,pending.details,')&&
  src.includes('if(!"off".equals(alertsMode)&&alerts&&!firstNew.isEmpty()')&&
  fav.includes('String soundMode=mode(context);')&&
  fav.includes('if("off".equals(soundMode)){')&&
  fav.includes('recordAlertProblem(context,"Alertas de Favoritos estão em OFF")')&&
  fav.includes('return false;')&&
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
test("UX-NOTIFY-13 audio selector includes 36 local tones, default and upload",()=>{
 const lib=read("java/com/lucianotoscano/pokesearchoverlay/PokeSoundLibrary.java");
 const audio=lib.split("private static final int[] AUDIO={")[1]?.split("};")[0]||"";
 return (audio.match(/R\.raw\.ps_[a-z0-9_]+/g)||[]).length===36&&
  main.includes('String[] choices=new String[count+2]')&&
  main.includes('choices[0]="Padrão"')&&
  main.includes('choices[count+1]="＋ Enviar áudio"')&&
  main.includes('System.arraycopy(PokeSoundLibrary.LABELS,0,choices,1,count)')&&
  watch.includes('"android.resource".equals(uri.getScheme())')&&
  watch.includes('context.getResources().getIdentifier(');
});
test("UX-NOTIFY-15 all 36 audio labels match bundled Android raw entries",()=>{
 const lib=read("java/com/lucianotoscano/pokesearchoverlay/PokeSoundLibrary.java");
 const labels=lib.split('static final String[] LABELS={')[1]?.split('};')[0]||"";
 const audio=lib.split('private static final int[] AUDIO={')[1]?.split('};')[0]||"";
 return (labels.match(/^\s*"[^"]+",?$/gm)||[]).length===36&&
  (audio.match(/R\.raw\.ps_[a-z0-9_]+/g)||[]).length===36&&
  labels.includes('"Quem é esse Pokémon? · BR"')&&
  labels.includes('"Jigglypuff · Evolução meme"')&&labels.includes('"Snorlax"')&&
  !labels.includes('freesound community')&&!labels.includes('ps_')&&
  lib.includes('static Uri favoriteDefaultUri(Context context)');
});
test("UX-NOTIFY-16 tapping previews before ✓; default and uploaded file require confirmation",()=>{
 const selector=main.slice(main.indexOf('private void openBundledAlertTonePicker('),
  main.indexOf('private void chooseAlertToneSource('));
 const preview=main.slice(main.indexOf('private void stopBundledTonePreview('),
  main.indexOf('private void openBundledAlertTonePicker('));
 const tap=selector.split('.setSingleChoiceItems(')[1]?.split('.setPositiveButton(')[0]||"";
 return selector.includes('setSingleChoiceItems(choices,-1,')&&
  tap.includes('playBundledTonePreview(which-1)')&&
  !tap.includes('storeAlertTone(')&&
  selector.includes('setPositiveButton("✓ Usar áudio"')&&
  selector.includes('if(selected[0]==-1)return;')&&
  selector.includes('storeAlertTone(target,pokemon,chosen.toString())')&&
  selector.includes('setNegativeButton("Cancelar",null)')&&
  selector.includes('setOnDismissListener(closed->stopBundledTonePreview())')&&
  preview.includes('android.media.MediaPlayer.create(this,source)')&&
  preview.includes('previous.release()')&&
  main.includes('private void confirmUploadedAlertTone(')&&
  main.includes('setNeutralButton("▶ Ouvir",null)')&&
  main.includes('confirmUploadedAlertTone(target,species,uri)')&&
  main.includes('stopBundledTonePreview();\n        activityClosing=true;');
});
test("HOME-THEME-01 dark/light toggle preserves profile and overlay actions",()=>{
 const home=main.split("private FrameLayout buildHome(){")[1]?.split("private void openTrainerManagement(){")[0]||"";
 return main.includes("private void toggleHomeTheme(){")&&
  main.includes('putBoolean("homeLightMode",homeLightMode)')&&
  main.includes('getBoolean("homeLightMode",false)')&&
  home.includes("R.drawable.ps_home_background_dark")&&
  home.includes("R.drawable.ps_home_background_light")&&
  home.includes("ImageView.ScaleType.CENTER_CROP")&&
  home.includes('homeMiniButton(homeLightMode?"☾":"☀"')&&
  home.includes("homeThemeButton.setOnClickListener(v->toggleHomeTheme())")&&
  home.includes("R.drawable.ps_home_brand_transparent")&&
  home.includes("R.drawable.ps_pogocoordinates")&&
  home.includes("auth.setBackground(homeSurface(")&&
  main.includes("refreshSessionSummary();")&&
  main.includes("refreshHomeOverlay();")&&
  main.includes("View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR");
});
test("UX-LOC-DRAFT-01 preserves unsent Radius across native updates and releases on site proof",()=>{
 const helper=dock.match(/function currentLocationUiState\(\)\{[\s\S]*?\n\}/)?.[0];
 const source=dock.match(/function locationPanelFeedback\(\)\{[\s\S]*?\n\}/)?.[0];
 if(!helper||!source||!dock.includes('radiusField.dataset.locationDraft="true"')||
    !dock.includes('slide.oninput=()=>{radiusField.value=slide.value;radiusField.dataset.locationDraft="true";}')||
    !dock.includes('Native.setLocation(true,wantedCoords,wantedRadius)'))return false;
 const vm=require("node:vm");
 const radius={value:"25",dataset:{locationDraft:"true"}};
 const slider={value:"25"};
 const hint={textContent:"",style:{color:""}};
 const toggle={textContent:"",className:"",setAttribute(){}};
 const panel={querySelector(sel){
  return {"#locHint":hint,"#locActiveSwitch":toggle,"#locRadiusValue":radius,
   'input[type="range"]':slider}[sel]||null;
 }};
 const doc={activeElement:{},getElementById(){return panel;}};
 const state={controlsWindow:true,choiceOpen:"location",document:doc,
  locationEnabled:true,locationVerified:false,locationRadius:10,status:"",activeSearchPhase:"idle"};
 const run=()=>vm.runInNewContext(helper+";"+source+";locationPanelFeedback()",state);
 run();
 assert.equal(radius.value,"25","Native event must not overwrite unsent draft");
 assert.equal(slider.value,"25","Slider must preserve the matching draft");
 state.locationRadius=25;state.locationVerified=true;run();
 assert.equal(radius.dataset.locationDraft,undefined,"Matching site proof unlocks controlled updates");
 state.locationRadius=30;run();
 assert.equal(radius.value,"30","Confirmed subsequent state updates still synchronize");
 assert.equal(slider.value,"30","Slider follows confirmed radius after unlock");
 return true;
});

// RANK-EVO-01: use the EXACT stored PvPoke snapshot and exported production
// calculator; source PoGoCoordinates IV values remain read-only.
test("RANK-EVO-01 evolution rank #1 and stat-product quality for GL",()=>{
 const win={};
 new Function("window",read("assets/pvpoke-overall-ranks.js"))(win);
 new Function("window",read("assets/pvpoke-iv-gamemaster.js"))(win);
 const a=dock.indexOf("const IV_PERCENT_VALUES=Object.freeze(");
 const b=dock.indexOf("let modeDraft=",a);
 const c=dock.indexOf("const PVPOKE_OVERALL=");
 const d=dock.indexOf('let lastListKey=""',c);
 if([a,b,c,d].some(x=>x<0))return false;
 const api=new Function("window","esc",dock.slice(a,b)+dock.slice(c,d)+
  "return {resultLines,calculatedSpeciesIvDetail,bestEvolutionRank,evolutionCandidates};"
 )(win,v=>String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;"));
 const rook={name:"Rookidee",iv:"0/13/14",ivPercent:60,level:23,cp:368};
 const swa={name:"Swablu",iv:"0/14/15",ivPercent:64,level:15,cp:293};
 const vul={name:"Vulpix",iv:"0/15/15",ivPercent:67,level:17,cp:371};
 const re=api.bestEvolutionRank(rook,"gl"),se=api.bestEvolutionRank(swa,"gl");
 const ve=api.bestEvolutionRank(vul,"gl");
 const noRank=api.resultLines(rook,{speciesIvRankGl:false},"gl");
 const rank=api.resultLines(rook,{speciesIvRankGl:true},"gl");
 const unknown={...rook,form:"Galarian"};
 const badIv={...rook,ivPercent:100};
 return re?.name==="Corviknight"&&re.rank===1&&re.statProductPct==="100,00"&&
  re.eligible===true&&re.currentCp===1468&&
  se?.name==="Altaria"&&se.rank===1&&se.statProductPct==="100,00"&&
  ve?.name==="Ninetales"&&ve.rank===1&&
  api.calculatedSpeciesIvDetail(rook,"gl")?.statProductPct==="82,60"&&
  api.calculatedSpeciesIvDetail(swa,"gl")?.statProductPct==="82,95"&&
  rank.includes("GL IV#1266")&&rank.includes("GL P82,60%")&&
  rank.includes("↳ Corviknight GL IV#1 P100,00%")&&
  !noRank.some(x=>x.includes("Corviknight"))&&
  api.bestEvolutionRank(unknown,"gl")===null&&
  api.bestEvolutionRank(badIv,"gl")===null&&
  !service.includes('case "evolutionRank":');
});
test("RANK-EVO-02 evolution eligibility is constrained by current level",()=>{
 const win={};new Function("window",read("assets/pvpoke-iv-gamemaster.js"))(win);
 const start=dock.indexOf("const PVPOKE_OVERALL=");
 const end=dock.indexOf('let lastListKey=""',start);
 const api=new Function("window","verifiedSpawnIvPercent",dock.slice(start,end)+
  "return {bestEvolutionRank,evolutionCandidates};")(win,card=>{
   if(!card||String(card.iv)!=="0/13/14"||Number(card.ivPercent)!==60)return null;
   return 60;
  });
 const card={name:"Rookidee",iv:"0/13/14",ivPercent:60,level:50};
 const evos=api.evolutionCandidates(card,"gl");
 const knight=evos.find(x=>x.name==="Corviknight");
 return knight?.eligible===false&&knight.rank===1&&
  api.bestEvolutionRank(card,"gl")?.name!=="Corviknight"&&
  evos.some(x=>x.eligible===true);
});


// RANK-EVO-DETAIL: verify production result bridge, separated detail UI and
// asynchronous Android gate without altering search filters or creating a 22nd field.
test("RANK-EVO-DETAIL-01 exports all evolution stages only in results WebView",()=>{
 const win={};
 new Function("window",read("assets/pvpoke-overall-ranks.js"))(win);
 new Function("window",read("assets/pvpoke-iv-gamemaster.js"))(win);
 const from=dock.indexOf("const PVPOKE_OVERALL="),to=dock.indexOf('let lastListKey=""',from);
 if(from<0||to<=from)return false;
 const checked=c=>{
  if(!/^(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])$/.test(String(c?.iv||"")))return null;
  const pct=Math.round(c.iv.split("/").map(Number).reduce((a,b)=>a+b,0)*100/45);
  return Number(c.ivPercent)===pct?pct:null;
 };
 const card={name:"Rookidee",iv:"0/13/14",ivPercent:60,cp:368,level:23,sourceIndex:2};
 const fn=(on,cards)=>new Function("window","verifiedSpawnIvPercent","resultWindow","cards",
  dock.slice(from,to)+"return window.pvpEvolutionDetails;")(win,checked,on,cards);
 const exportCard=fn(true,[card]);
 const projected=exportCard(0);
 const gl=projected?.leagues?.find(l=>l.league==="gl");
 const knight=gl?.evolutions?.find(x=>x.name==="Corviknight");
 const corvisquire=gl?.evolutions?.find(x=>x.name==="Corvisquire");
 return projected?.sourceIndex===2&&projected?.iv==="0/13/14"&&
  projected?.cp==="368"&&projected.leagues.length===3&&
  gl?.own?.rank===1266&&gl.own.statProductPct==="82,60"&&
  knight?.rank===1&&knight?.statProductPct==="100,00"&&
  knight?.cp===1500&&knight?.level===23.5&&knight?.currentCp===1468&&
  knight?.overallRank===6&&corvisquire?.rank===1397&&
  exportCard(1)===null&&fn(false,[card])(0)===null&&
  fn(true,[{...card,ivPercent:100}])(0)===null;
});
test("RANK-EVO-DETAIL-02 card expands and escapes all visible evolution values",()=>{
 const html=read("assets/detail.html");
 const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
 if(!script)return false;
 const elements={};
 const node=id=>elements[id]||(elements[id]={
  hidden:false,innerHTML:"",textContent:"",style:{},src:"",
  removeAttribute(){},setAttribute(n,v){this[n]=v;},getBoundingClientRect(){return {height:255}},
  scrollHeight:410
 });
 const document={getElementById:node};
 const window={},heights=[];
 const Native={resizeDetail:n=>heights.push(n)};
 const ctx=new Function("document","window","Native","requestAnimationFrame","setInterval","clearInterval",
  script+"return {toggleEvolutionDetails};"
 )(document,window,Native,fn=>fn(),()=>1,()=>{});
 const card={name:"Swablu",iv:"0/14/15",ivPercent:64,sourceIndex:5,cp:293,level:15};
 window.showDetails(card,"gl",false);
 const rankOne={name:"Altaria",rank:1,statProductPct:"100,00",
  level:29,cp:1497,currentCp:774,eligible:true,overallRank:2};
 const wrongLevel={...rankOne,name:"<img src=x onerror=alert(1)>",eligible:false};
 const detail={...card,cp:"293",leagues:[
  {league:"gl",own:{rank:1832,statProductPct:"82,95",level:50,cp:775,overallRank:null},
   evolutions:[rankOne,wrongLevel]},
  {league:"ul",own:{rank:1832,statProductPct:"82,95",level:50,cp:775},
   evolutions:[{...rankOne,rank:1460,statProductPct:"89,97",cp:2043,level:50}]},
  {league:"ml",own:{rank:1832,statProductPct:"82,95",level:50,cp:775},
   evolutions:[{...rankOne,rank:1460,statProductPct:"89,97",cp:2043,level:50}]}
 ]};
 if(!window.showEvolutionDetails(detail))return false;
 const body=node("evoBody"),section=node("evolutions");
 if(section.hidden||!body.hidden||!body.innerHTML.includes("Grande Liga")||
   !body.innerHTML.includes("Ultra Liga")||!body.innerHTML.includes("Liga Master")||
   !body.innerHTML.includes("Não elegível no nível atual")||
   !body.innerHTML.includes("&lt;img")||body.innerHTML.includes("<img src=x")||
   !body.innerHTML.includes("PC 1497")||!body.innerHTML.includes("Nv 29,0"))return false;
 ctx.toggleEvolutionDetails();
 if(body.hidden||node("evoToggle")["aria-expanded"]!=="true")return false;
 ctx.toggleEvolutionDetails();
 if(!body.hidden||node("evoToggle")["aria-expanded"]!=="false")return false;
 window.showDetails({...card,name:"Rookidee",sourceIndex:7},"gl",false);
 return section.hidden&&window.showEvolutionDetails(detail)===false&&
  html.includes('Native.toggleWatch(watchName)')&&html.includes("Native.coords(currentIndex)")&&
  html.includes("window.pauseDetailTimer=()=>")&&heights.length>=4;
});
test("RANK-EVO-DETAIL-03 native async bridge rejects old or mismatched results",()=>{
 const method=service.split("private void showDetails(int index){")[1]?.split("private void hideDetails(){")[0]||"";
 const detail=read("assets/detail.html");
 return method.includes("resultPanel.evaluateJavascript(query,raw->")&&
  method.includes("requestGeneration!=expectedGeneration")&&
  method.includes("selected!=index")&&method.includes("getVisibility()!=View.VISIBLE")&&
  method.includes('new JSONArray("["+raw+"]")')&&
  method.includes('payload.optJSONArray("leagues").length()!=3')&&
  method.includes('window.showEvolutionDetails(')&&
  detail.includes("evoIdentity(payload)!==detailIdentity")&&
  detail.includes("#evoBody{max-height:none;overflow:visible")&&
  !service.includes("setAllowUniversalAccessFromFileURLs(true)")&&
  !dock.includes('name:"Rookidee"')&&
  dock.includes('window.pvpEvolutionDetails=function(index)')&&
  dock.includes("const descendants=evolutionCandidates(card,league).slice(0,24)");
});


test("RANK-EVO-DETAIL-04 unknown CP never looks confirmed eligible",()=>{
 const win={};new Function("window",read("assets/pvpoke-iv-gamemaster.js"))(win);
 const p=dock.indexOf("const PVPOKE_OVERALL="),q=dock.indexOf('let lastListKey=""',p);
 if(p<0||q<=p)return false;
 const api=new Function("window","verifiedSpawnIvPercent","esc","ivPaletteClass",
  dock.slice(p,q)+"return {resultLines,resultInfoHtml};")(
   win,c=>c.ivPercent==null?null:Number(c.ivPercent),
   s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;"),()=> "medium");
 const card={name:"Swablu",iv:"0/14/15",ivPercent:64};
 const lines=api.resultLines(card,{speciesIvRankGl:true},"gl");
 const row=lines.find(x=>x.startsWith("↳ Altaria"));
 const known=api.resultLines({...card,level:15},{speciesIvRankGl:true},"gl")
   .find(x=>x.startsWith("↳ Altaria"));
 return row?.includes("GL IV#1")&&row.includes("· PC?")&&
  !api.resultInfoHtml(row,card).includes("evolutionInfo best")&&
  known?.includes("GL IV#1")&&!known.includes("PC?")&&
  api.resultInfoHtml(known,card).includes("evolutionInfo best");
});


const releaseNotesJava=read("java/com/lucianotoscano/pokesearchoverlay/ReleaseNotes.java");
const releaseNotesData=JSON.parse(read("assets/release_notes.json"));
const releaseNotesGradle=fs.readFileSync(path.join(root,"..","..","build.gradle.kts"),"utf8");
test("RELEASE-NOTES-01 asset has a versioned, local schema",()=>{
 const entries=releaseNotesData.releases;
 return releaseNotesData.schema==="pokesearch-release-notes-v1"&&Array.isArray(entries)&&entries.length>=1&&
  entries.every(e=>typeof e.id==="string"&&e.id.trim()&&
   Number.isInteger(e.minVersionCode)&&e.minVersionCode>0&&e.sections&&
   ["novidades","melhorias","correcoes","emDesenvolvimento"].every(k=>
    Array.isArray(e.sections[k])&&e.sections[k].every(line=>typeof line==="string"&&line.trim())))&&
  new Set(entries.map(e=>e.id)).size===entries.length&&
  entries.every((e,i)=>i===0||e.minVersionCode>entries[i-1].minVersionCode);
});
test("RELEASE-NOTES-02 automatic notice only on normal Home launch, no OAuth interruption",
 main.includes('Intent.ACTION_MAIN.equals(getIntent().getAction())')&&
 main.includes('root.post(()->ReleaseNotes.maybeShowAfterUpgrade(this))')&&
 main.includes('getBoolean("tutorialSeenV41",false)')&&
 main.includes('dialog.setOnDismissListener(ignored->{')&&
 main.includes('releaseTutorialWebView();')&&
 main.split('ReleaseNotes.maybeShowAfterUpgrade(this)').length===3);
test("RELEASE-NOTES-03 manual release history is available in the existing Home menu",
 main.includes('addHomeDrawerItem(drawer,"✦","Novidades",()->ReleaseNotes.showHistory(this))'));
test("RELEASE-NOTES-04 a clean install does not trigger the update notice",
 releaseNotesJava.includes('previous<0')&&releaseNotesJava.includes('info.lastUpdateTime>info.firstInstallTime+2000')&&
 releaseNotesJava.includes('previous>0&&code>previous'));
test("RELEASE-NOTES-05 display is once per verified notes revision, not every launch",
 releaseNotesJava.includes('LAST_SHOWN_ID')&&releaseNotesJava.includes('PENDING_VERSION')&&
 releaseNotesJava.includes('id.equals(prefs.getString(LAST_SHOWN_ID,""))')&&
 releaseNotesJava.includes('dialog.setOnDismissListener(ignored->onDismiss.run())')&&
 releaseNotesJava.includes('.remove(PENDING_VERSION).apply()'));
test("RELEASE-NOTES-06 history does not modify upgrade markers",
 !releaseNotesJava.split('public static void showHistory(Activity activity)')[1]
  .split('private static TextView text(')[0].includes('prefs.edit()')&&
 releaseNotesJava.includes('for (int i=list.length()-1;i>=0;i--)'));
test("RELEASE-NOTES-07 interface is scrollable and adapts to Home theme",
 releaseNotesJava.includes('new ScrollView(activity)')&&
 releaseNotesJava.includes('getBoolean("homeLightMode",false)')&&
 releaseNotesJava.includes('window.setLayout(width,height)'));
test("RELEASE-NOTES-08 metadata is integrity checked within the APK",
 releaseNotesGradle.includes('"shiny_login.js", "release_notes.json"')&&
 releaseNotesJava.includes('getAssets().open(ASSET)'));
test("RELEASE-NOTES-09 the reader fails closed on missing or corrupt notes",
 releaseNotesJava.includes('return new JSONArray(); // Release notes must never prevent the Home from opening.')&&
 releaseNotesJava.includes('out.size()+size>96000'));
test("RELEASE-NOTES-10 no unverified physical claims; audited fixes are versioned",()=>{
 const old=releaseNotesData.releases.filter(e=>e.minVersionCode<54258);
 const current=releaseNotesData.releases.find(e=>e.minVersionCode===54258);
 return old.every(e=>e.sections.correcoes.length===0)&&
  !!current&&current.id==="pokesearch-v060-lt-pokemon-form-coords-20261023"&&
  current.sections.novidades.length>=2&&current.sections.melhorias.length>=2&&
  current.sections.correcoes.length>=4&&
  current.sections.emDesenvolvimento.some(s=>s.includes("Samsung"))&&
  current.sections.emDesenvolvimento.some(s=>s.includes("testes automatizados"))&&
  probe.includes("function extraOptionPopup(key,control){")&&
  service.includes("void requestFormOptions(String query)");
});

test("FILTERS-POGO-01 keeps species, IV and PvP in their existing dedicated menus",()=>{
 const filters=dock.split("function renderExtraFilters(panel,make){")[1]
  ?.split("function renderFilterPicker(key,label,options){")[0]||"";
 return filters.includes('option("sortBy","Ordenar")')&&
  filters.includes('option("weather","Clima")')&&
  filters.includes('field("Forma",formEditor)')&&
  filters.includes('chips("size","Tamanho")')&&
  filters.includes('chips("gender","Sexo")')&&
  !filters.includes('field("Pokémon",pick)')&&
  dock.includes('if(kind==="pokemon"){')&&
  dock.includes('["percent","IV%"],["gl","GL"],["ul","UL"]');
});
test("FILTERS-POGO-02 shows PC and bounded level 1–50 with honest defaults",()=>{
 const filters=dock.split("function renderExtraFilters(panel,make){")[1]
  ?.split("function renderFilterPicker(key,label,options){")[0]||"";
 return filters.includes('numberPair("PC","cpMin","cpMax");')&&
  filters.includes('numberPair("Nível","levelMin","levelMax",true);')&&
  filters.includes('input.step="1";input.min=level?"1":"0";input.max=level?"50":"99999"')&&
  filters.includes('input.type=level?"text":"number";input.inputMode="numeric";')&&
  !filters.includes('make("button","extraStep"')&&
  filters.includes('input.value=String(modeDraft[key]??"")')&&
  filters.includes('[[minKey,"Min","mínimo"],[maxKey,"Max","máximo"]]')&&
  !filters.includes('cell.append(cap,input)')&&
  dock.includes('input.checkValidity()')&&
  dock.includes('field.setCustomValidity("Mínimo maior que máximo")')===false&&
  service.includes('{"cpMin","cpMax"}')&&service.includes('{"levelMin","levelMax"}');
});
test("FILTERS-POGO-03 size and gender buttons never invent site-supported options",()=>{
 const filters=dock.split("function renderExtraFilters(panel,make){")[1]
  ?.split("function renderFilterPicker(key,label,options){")[0]||"";
 const probe=read("assets/probe.js");
 return filters.includes('["XXS","XS","S","M","L","XL","XXL"]')&&
  filters.includes('["Male","Female","Genderless"]')&&
  !filters.includes('button.disabled=!actual&&!selected.has(resolved)')&&
  filters.includes('modeDraft[multiKey]=[...selected]')&&
  !filters.includes('extraChip","Qualquer"')&&
  probe.includes('function extraMulti(key,desired,operation){')&&
  probe.includes('function multiState(option){')&&
  service.includes('for(String key:new String[]{"size","gender","form"})')&&
  dock.includes('window.onFilterOptions=function(response){')&&
  service.includes('final String[] keys={"sortBy","size","form","gender","weather"}');
});
test("FILTERS-POGO-05 reusing confirmed coordinates still executes Search",()=>{
 const handler=service.split('@JavascriptInterface public void setLocation(boolean enabled,String coords,int radius)')[1]
  ?.split('@JavascriptInterface public void pasteLocationCoords()')[0]||"";
 const same=handler.split('if(locationEnabled==enabled&&')[1]
  ?.split('locationVerified=false;')[0]||"";
 return same.includes('!searchInProgress&&nextScheduledSearchAtMs<=System.currentTimeMillis()')&&
  same.includes('OverlayService.this.refresh(true)')&&
  same.includes('Pesquisando com coordenadas e filtros ativos')&&
  !same.includes('enabled&&!locationVerified')&&
  handler.includes('replaceActiveFilterSearch();')&&
  handler.includes('locationCoords=enabled?valid:""');
});
test("FILTERS-POGO-04 location Apply submits same saved criteria through live DOM",()=>{
 const probe=read("assets/probe.js");
 return dock.includes('Native.setLocation(true,wantedCoords,wantedRadius)')&&
  dock.includes('slide.min="0";slide.max="1000"')&&
  !dock.includes('make("p","locText","Coords e raio')&&
  dock.includes('clear.onclick=disable')&&
  !dock.includes('fieldRow.append(field,paste,toggle)')&&
  service.includes('OverlayService.this.refresh(true);')&&
  service.includes('configureLocationAndVerify(generation,manual,0)')&&
  service.includes('verifyAndSubmit(generation,manual,0)')&&
  probe.includes('if(action==="verifyExtras")');
});
test("FILTERS-POGO-06 badge counts only extra filter criteria with neutral level defaults",()=>{
 const helper=dock.split("const FILTERS_MENU_KEYS=Object.freeze(")[1]
  ?.split("function quickState(id){")[0]||"";
 const factory=new Function("searchSettings","mode","modeDraft","controlsWindow",
  "choiceOpen","document","siteFiltersConfirmed","searchActive","resultsStale",
  "const FILTERS_MENU_KEYS=Object.freeze("+helper+
  ";return {count:activeExtraFilterCount,keys:FILTERS_MENU_KEYS};");
 const base={mode:"raw",attack:15,defense:15,stamina:15,glRank:1,ulRank:1,
  percentMin:0,percentMax:100,pokemonSelections:["Pikachu"],pokemon:"Pikachu",
  sortBy:"Despawn (longest)",levelMin:"1",levelMax:"35",includePreviousEvolutions:true};
 const ctx=factory(base,"raw",null,false,"",{},false,false,false);
 const count=ctx.count;
 return count(base,"raw")===0&&
  count({...base,sortBy:"CP (highest)",weather:"Rainy",sizeSelections:["XXL","XS"],
   cpMin:"600",cpMax:"900",levelMin:"6",levelMax:"32",genderSelections:["Female"]},"raw")===6&&
  count({...base,minPvpCp:"100",includePreviousEvolutions:false},"gl")===2&&
  count({...base,cpMin:"50",levelMin:"12",minPvpCp:"100"},"gl")===1&&
  !ctx.keys.includes("pokemon")&&!ctx.keys.includes("pokemonSelections")&&
  !ctx.keys.includes("attack")&&!ctx.keys.includes("locationCoords");
});
test("FILTERS-POGO-07 Applied requires native verified submission and accepted collection",()=>{
 const update=service.split("private void update(){")[1]?.split("private void status(String s)")[0]||"";
 const confirmed=update.split("// FILTERS-POGO-06:")[1]||"";
 const phase=dock.split("function updateFiltersPanelStatus(){")[1]?.split("function quickState(id){")[0]||"";
 return confirmed.includes("confirmedSubmittedFiltersGeneration==requestGeneration")&&
  confirmed.includes("submittedSearchGeneration==requestGeneration")&&
  confirmed.includes('("updated".equals(searchPhase)||"empty".equals(searchPhase))')&&
  confirmed.includes("!searchInProgress&&!resultsStale")&&
  dock.includes("filtersConfirmed=false)=>{")&&
  dock.includes("siteFiltersConfirmed=filtersConfirmed===true&&!searchActive&&!resultsStale")&&
  phase.includes("verified?\"✓ Aplicado no PoGoCoordinates\"")&&
  phase.includes("dirty?\"● Falta aplicar\"")&&
  dock.includes('button.classList.toggle("site-filters-applied",count>0&&siteFiltersConfirmed');
});
test("FILTERS-POGO-08 scoped Clear preserves species, IV, Shiny and coordinates",()=>{
 const block=dock.split("function renderFiltersChoices(){")[1]?.split("function renderInfoChoices(){")[0]||"";
 const clear=block.split("clear.onclick=()=>{")[1]?.split("\n };")[0]||"";
 const keys=["sortBy","weather","size","form","gender","cpMin","cpMax",
  "levelMin","levelMax","minPvpCp","sizeSelections","genderSelections"];
 let output=null,closed=false;
 new Function("FILTERS_MENU_KEYS","closeChoices","Native",
  "const clear=()=>{"+clear+"};clear();")(keys,()=>{closed=true;},
  {patchSearchFilters:value=>{output=JSON.parse(value);}});
 return closed&&!!output&&keys.every(key=>key.endsWith("Selections")?
  Array.isArray(output[key])&&output[key].length===0:
  output[key]===(key==="sortBy"?"Despawn (longest)":""))&&
  output.includePreviousEvolutions===true&&
  !Object.hasOwn(output,"mode")&&!Object.hasOwn(output,"pokemonSelections")&&
  !Object.hasOwn(output,"attack")&&!Object.hasOwn(output,"glRank")&&
  !Object.hasOwn(output,"locationCoords")&&
  block.includes('actions.append(apply,clear,cancel)')&&
  !block.includes("Native.setLocation(")&&
  service.includes('@JavascriptInterface public void patchSearchFilters(String payload)');
});
test("FILTERS-POGO-09 badge never enlarges twelve-slot ribbon and is accessible",()=>{
 const styles=dock.split("/* FILTERS-POGO-06: two tiny overlay indicators")[1]
  ?.split("#choices .modeRow")[0]||"";
 return styles.includes('content:attr(data-filter-count)')&&
  styles.includes('button[data-key="filters"].has-extra-filters::after')&&
  styles.includes('button[data-key="filters"].site-filters-applied::before')&&
  styles.includes("width:33.333%")&&
  dock.includes('if(count>0)button.dataset.filterCount=String(count)')&&
  dock.includes('else delete button.dataset.filterCount')&&
  dock.includes('button.setAttribute("aria-label","Filtros · "+count')&&
  dock.includes('grid-template-columns:repeat(12,minmax(0,1fr))!important');
});

test("FILTERS-POGO-10 simulated UI never claims Applied for pending/stale/dirty filters",()=>{
 const helper=dock.split("const FILTERS_MENU_KEYS=Object.freeze(")[1]
  ?.split("function quickState(id){")[0]||"";
 const compiled=new Function("searchSettings","mode","modeDraft","controlsWindow",
  "choiceOpen","document","siteFiltersConfirmed","searchActive","resultsStale",
  "const FILTERS_MENU_KEYS=Object.freeze("+helper+
  ";return updateFiltersPanelStatus;");
 const saved={mode:"raw",sortBy:"Despawn (longest)",cpMin:"500",cpMax:"",
  levelMin:"1",levelMax:"35",includePreviousEvolutions:true};
 const result=(proof,active,stale,draft)=>{
  const badge={textContent:"",title:"",setAttribute(_key,_value){},classList:{toggle(_key,_value){}}};
  compiled(saved,"raw",draft,true,"filters",
   {getElementById:()=>badge},proof,active,stale)();
  return badge.textContent;
 };
 return result(false,false,false,saved).includes("Aguardando confirmação")&&
  result(true,false,false,saved)==="✓ Aplicado no PoGoCoordinates"&&
  result(true,true,false,saved).includes("Aguardando confirmação")&&
  result(true,false,true,saved).includes("Aguardando confirmação")&&
  result(true,false,false,{...saved,weather:"Rainy"}).includes("Falta aplicar");
});

test("LT57-ONEFORM-01 patch only Weather with no loss of species IV or location",()=>{
 const block=dock.split("function renderFiltersChoices(){")[1]?.split("function renderInfoChoices(){")[0]||"";
 const apply=block.split("apply.onclick=()=>{")[1]?.split("\n };")[0]||"";
 const saved={mode:"ul",sortBy:"Despawn (longest)",weather:"",form:"",
  sizeSelections:["XXL"],genderSelections:["Female"],cpMin:"",cpMax:"",
  levelMin:"1",levelMax:"35",minPvpCp:"",pokemonSelections:["Pikachu"],
  attack:3,defense:14,stamina:15,ulRank:7,includePreviousEvolutions:true};
 const draft={...saved,weather:"Rainy"};
 const keys=["sortBy","weather","size","form","gender","cpMin","cpMax",
  "levelMin","levelMax","minPvpCp","sizeSelections","genderSelections"];
 let out=null,closed=false;
 const panel={querySelectorAll:()=>[]};
 new Function("panel","modeDraft","searchSettings","FILTERS_MENU_KEYS","closeChoices","Native",
  "const apply=()=>{"+apply+"};apply();")(panel,draft,saved,keys,()=>{closed=true;},
  {patchSearchFilters:x=>{out=JSON.parse(x);}});
 return closed&&!!out&&JSON.stringify(out)==='{"weather":"Rainy"}'&&
  !Object.hasOwn(out,"pokemonSelections")&&!Object.hasOwn(out,"attack")&&
  !Object.hasOwn(out,"locationCoords");
});
test("LT57-ONEFORM-02 native patch keeps independent search modes and Shiny",()=>{
 const patch=service.split('@JavascriptInterface public void patchSearchFilters(String payload)')[1]
  ?.split('@JavascriptInterface public void setSearchConfig(String payload)')[0]||"";
 return patch.includes('JSONObject delta=new JSONObject(payload),updated=new JSONObject(extraFiltersJson)')&&
  patch.includes('if(!delta.has(key))continue;')&&
  patch.includes('overlayPrefs().edit().putString("extraFiltersJson",serialized).apply()')&&
   service.includes('getSharedPreferences(isSecondaryOverlay()?"prefs_secondary":"prefs",0)')&&
  !patch.includes('mode=')&&!patch.includes('shiny=')&&!patch.includes('locationEnabled=')&&
  !patch.includes('rawAttack=')&&!patch.includes('locationCoords=')&&
  patch.includes('replaceActiveFilterSearch();');
});
test("LT57-ONEFORM-03 Size multi and Gender single radio preserve Any",()=>{
 const probe=read("assets/probe.js");
 const filters=dock.split("function renderExtraFilters(panel,make){")[1]
  ?.split("function renderFilterPicker(key,label,options){")[0]||"";
 return filters.includes('const selected=new Set(existing.filter(')&&
  filters.includes('if(selected.has(resolved))selected.delete(resolved);else selected.add(resolved);')&&
  filters.includes('modeDraft[multiKey]=[...selected]')&&
  filters.includes('if(isGender){modeDraft[multiKey]=checked?[]:[resolved];}')&&
  filters.includes('v==="Male"?"♂"')&&
  filters.includes('group.setAttribute("role","radiogroup")')&&
  !filters.includes('button.disabled=!actual&&!selected.has(resolved)')&&
  probe.includes('function extraMulti(key,desired,operation)')&&
  probe.includes('extraSelect("gender",wanted[0]||"")')&&
  probe.includes('if(target.some(v=>!observed.some(o=>o.label===v)))return false')&&
  service.includes('key.equals("genderSelections")?1:')&&
  service.includes('for(String key:new String[]{"size","gender","form"})');
});
test("LT57-ONEFORM-04 Sort by offers exactly five requested orders with default",()=>{
 const picker=dock.split("function renderFilterPicker(key,label,options){")[1]
  ?.split("window.onFilterOptions=function")[0]||"";
 return dock.includes('sortBy:"Despawn (longest)"')&&
  dock.includes('["Despawn (longest)","CP (highest)","IV % (highest)","Level (highest)","Distance (nearest)"]')&&
  picker.includes('key==="sortBy"')&&
  picker.includes('if(key!=="sortBy"){')&&
  service.includes('extra.put("sortBy","Despawn (longest)")')&&
  !picker.includes('neutral.textContent="Qualquer"');
});
test("LT57-ONEFORM-05 Weather uses site Any and only screenshot-supported choices",()=>{
 const picker=dock.split("function renderFilterPicker(key,label,options){")[1]
  ?.split("window.onFilterOptions=function")[0]||"";
 const expected=["Boosted","Sunny","Rainy","Partly Cloudy","Cloudy","Windy","Snow","Fog"];
 return expected.every(v=>picker.includes('"'+v+'"'))&&
  picker.includes('neutral.textContent=filterDisplayLabel(key,"Any")')&&
  dock.includes('key==="sortBy"?official[0]:"Any"')&&
  read("assets/probe.js").includes('function comparableOption(value)');
});
test("LT57-ONEFORM-06 compact menu and launcher safe area preserved",()=>{
 return dock.includes('/* LT57 COMPACT-01: Samsung: small detached popup')&&
  dock.includes('max-width:260px!important')&&
  dock.includes('grid-template-columns:repeat(7,minmax(0,1fr))!important')&&
  dock.includes('grid-template-columns:repeat(3,minmax(0,1fr))!important')&&
  dock.includes('modeScrollTop=0; // Open at the first field')&&
  iconGenerator.includes("int artworkSize = 288")&&
  iconGenerator.includes("int padding = 8");
});
test("LT62 one-pass Shiny + location share verified Search with no reset",()=>{
 const bridge=service.split('@JavascriptInterface public void shiny()')[1]?.split('@JavascriptInterface public void refresh()')[0]||"";
 const helper=service.split('private void startVerifiedShinySearch(int generation,int attempt){')[1]?.split('private void prepareImmediateShiny(',1)[0]||"";
 return bridge.includes('startVerifiedShinySearch(generation,0);')&&
  bridge.includes('refresh(true);')&&
  helper.includes('Verificando Shiny e localização na mesma busca')&&
  service.includes('verifyShinyAfterLocation(generation,manual,0)')&&
  service.includes('execute("verifyLocation:"+data')&&
  service.includes('execute("verifyShiny",verified->')&&
  !bridge.includes('locationEnabled=false')&&!bridge.includes('locationCoords=""')&&
  dock.includes('clear.onclick=disable')&&
  !dock.includes('fieldRow.append(field,paste,toggle)');
});
test("LT57-DRIVE-ICON-01 exact replacement StarGL, StarUL and StarIVRaw PNGs",()=>{
 const crypto=require("node:crypto");
 const icons={
  "StarGL.png":"cdca6c1b159e7a3da45758d073bf88d4fe05798e9343e4ef4056e77ccb8df575",
  "StarUL.png":"7f59249d48556a43d0769667bb7a7c032d31ae69a96fe6db229da7f1413f5a9a",
  "StarIVRaw.png":"74a9141ab3eff6ce3adab305a22aa478ee4022191f62bf8915ac88d4c9184cee"
 };
 return Object.entries(icons).every(([name,expected])=>{
  const file=fs.readFileSync(path.join(root,"assets/result-icons/modes",name));
  return file.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&
   crypto.createHash("sha256").update(file).digest("hex")===expected;
 })&&dock.includes('gl:"StarGL.png",ul:"StarUL.png"')&&
 dock.includes('custom:"StarIVRaw.png"');
});
test("LT57-DRIVE-ICON-02 Raw IV text follows A D H and updates on changes",()=>{
 const art=dock.split("function getModeMenuIcon(")[1]?.split("// Historical result icons")[0]||"";
 const glyph=dock.split("function iconForQuick(id, fallback){")[1]?.split("// SITE-POKEMON")[0]||"";
 return art.includes('ivText:family==="custom"&&modeKey==="raw"')&&
  art.includes('[settings.attack,settings.defense,settings.stamina]')&&
  art.includes('.join("/")')&&
  glyph.includes('glyph.classList.add("rawArt")')&&
  glyph.includes('values.textContent=art.ivText')&&
  dock.includes('button.dataset.modeArtKey=art.path+"|"+art.ivBadge+"|"+art.ivText')&&
  dock.includes('const key=art.path+"|"+art.ivBadge+"|"+art.ivText')&&
  dock.includes('.quickIvValues{')&&
  glyph.includes('values.setAttribute("textLength","16.5")')&&
  glyph.includes('values.setAttribute("lengthAdjust","spacingAndGlyphs")')&&
  glyph.includes('document.createElementNS(ns,"svg")')&&
  dock.includes('svg.quickIvValues text{')&&
  !dock.includes('body.controls-window #quickMenuList .quickIvValues{');
});
test("LT62 raw IV and neutral mixed IV% keep bounded text inside the medal",()=>{
 const vm=require("node:vm");
 const start=dock.indexOf("const RESULT_ICONS=Object.freeze("),end=dock.indexOf("let locationEnabled=",start);
 if(start<0||end<start)return false;
 const definitions=dock.slice(start,end);
 const base={attack:0,defense:15,stamina:15,glRank:1,ulRank:1,percentMin:0,percentMax:100};
 const get=(mode,attrs)=>vm.runInNewContext(definitions+"\ngetModeMenuIcon("+JSON.stringify(mode)+",false,"+
  JSON.stringify({...base,...attrs})+")",{}, {timeout:2000});
 return get("raw",{}).ivText==="0/15/15"&&
  get("raw",{attack:10}).ivText==="10/15/15"&&
  get("raw",{attack:0,defense:0,stamina:0}).ivText===""&&
  get("raw",{attack:15,defense:15,stamina:15}).ivText===""&&
  get("hundo",{}).ivText===""&&get("nundo",{}).ivText===""&&
  get("percent",{percentMin:0,percentMax:100}).ivText==="%"&&
  get("gl",{}).ivText===""&&get("ul",{}).ivText==="";
});
test("LT57-WEATHER-ICONS-01 exact nine weather Drive PNGs embedded",()=>{
 const crypto=require("node:crypto");
 const icons={
  "any.png":"d4839cd75cbe0402d18bcbf0a5f30e2809b460dd07230108c0b25d94f02194da",
  "boosted.png":"a87266e89096e6ab59a9d97ee5aa514e12526618492387129787f674ce1d7a93",
  "sunny.png":"3cfdfe44d746d4087e9d907702d8d536fa890a65eee1e3d67414bf58c4c8c7ec",
  "rainy.png":"90969f1503a9fddddc2301d5aaa39bbb62a790e51dfe906cae5b97a2b8163509",
  "partly-cloudy.png":"45ac8431e8d9ee8b220744e83e08b4b5afb26f4063a1230549a2308ec246bdc6",
  "cloudy.png":"816ae46a0ba4104a2a14ed0baea845e158348d391aa1f240f14fe4a0af221642",
  "windy.png":"e35c8f0fd7712ac74ee7faf01e5cb9186295631fa2fa7255b5b264bea774c47a",
  "snow.png":"d3a2d189fcfc920daa6bb56bfecf47aab6f53e4e53a5a440a3c9f88defd1ebe2",
  "fog.png":"c31680fe281e52db5a9573cb3832107a614460d3cec24a634febd7af31f5bb15"
 };
 return Object.entries(icons).every(([name,expected])=>{
  const bytes=fs.readFileSync(path.join(root,"assets/weather-icons",name));
  return bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&
   crypto.createHash("sha256").update(bytes).digest("hex")===expected;
 })&&Object.keys(icons).length===9&&
 dock.includes('WEATHER_ICON_FILES=Object.freeze({')&&
 dock.includes('file:///android_asset/weather-icons/')&&
 dock.includes('btn.prepend(makeWeatherIcon(value))')&&
 dock.includes('neutral.prepend(makeWeatherIcon("Any"))');
});
test("LT57-DEFAULT-COUNT-01 neutral controls never add to active filter badge",()=>{
 const helper=dock.split("const FILTERS_MENU_KEYS=Object.freeze(")[1]
  ?.split("function quickState(id){")[0]||"";
 const factory=new Function("searchSettings","mode","modeDraft","controlsWindow",
  "choiceOpen","document","siteFiltersConfirmed","searchActive","resultsStale",
  "const FILTERS_MENU_KEYS=Object.freeze("+helper+
  ";return activeExtraFilterCount;");
 const base={sortBy:"Despawn (longest)",weather:"Any",form:"Any",
  size:"Any",gender:"Any",sizeSelections:[],genderSelections:[],
  cpMin:"0",cpMax:"",levelMin:"1",levelMax:"35",
  includePreviousEvolutions:true,minPvpCp:"0"};
 const count=factory(base,"raw",null,false,"",{},false,false,false);
 return count(base,"raw")===0&&count(base,"gl")===0&&
  count({...base,weather:"Rainy"},"raw")===1&&
  count({...base,sortBy:"CP (highest)"},"raw")===1&&
  count({...base,sizeSelections:["XS","XXL"]},"raw")===1&&
  count({...base,genderSelections:["Female"]},"raw")===1&&
  count({...base,weather:"Any",genderSelections:["Any"]},"raw")===0;
});
test("UX-QUICK-MORE-01 keeps all three original action IDs movable in settings",()=>{
 const group=dock.split("const MORE_ACTION_IDS=Object.freeze(")[1]
  ?.split("let quickPrefs=")[0]||"";
 const make=new Function("quickPrefs","const MORE_ACTION_IDS=Object.freeze("+group+
  ";return groupedMoreIds;");
 const originals=["mode","sh","filters","location","pokemon","star","bell","period","appearance","report","donate","close"];
 const find=make({order:originals,hidden:[]});
 const moveReport=make({order:["mode","report","sh","filters","location","pokemon","star","bell","period","appearance","donate","close"],hidden:[]});
 const hideDonor=make({order:originals,hidden:["donate"]});
 const onlyClose=make({order:originals,hidden:["report","donate"]});
 return JSON.stringify(find())==='["report","donate","close"]'&&
  JSON.stringify(moveReport())==='["donate","close"]'&&
  JSON.stringify(hideDonor())==='["report","close"]'&&
  JSON.stringify(onlyClose())==='[]'&&
  dock.includes('for(const id of quickPrefs.order)')&&
  dock.includes('const QUICK_DEFAULT_ORDER=QUICK_ACTIONS.map(a=>a[0])');
});
test("UX-QUICK-MORE-02 dynamically frees two ribbon slots and preserves order",()=>{
 const block=dock.split("function renderQuickMenu(){")[1]
  ?.split("// A sound channel")[0]||"";
 return block.includes('if(inMore&&moreDrawn)continue;')&&
  block.includes('const renderedId=inMore?"more":id')&&
  block.includes('rows.appendChild(button);slotCount++')&&
  block.includes('outer.style.setProperty("--quick-slot-count",String(Math.max(1,slotCount)))')&&
  dock.includes('grid-template-columns:repeat(var(--quick-slot-count,12),minmax(0,1fr))!important')&&
  dock.includes('if(choiceOpen==="more"){')&&
  !block.includes('footer.appendChild(button)');
});
test("UX-QUICK-MORE-03 cascade opens DOWN with separate original rounded tiles",()=>{
 const b=dock.split("function renderMoreChoices(){")[1]
  ?.split("function renderQuickMenu(){")[0]||"";
 return b.includes('panel.classList.add("visible","morePanel")')&&
  b.includes('panel.setAttribute("role","menu")')&&
  b.includes('button.className="quickMoreAction"')&&
  b.includes('button.appendChild(iconForQuick(id,action[1]))')&&
  b.includes('button.onclick=()=>{closeChoices();quickClick(id);}')&&
  dock.includes('top:34px!important;bottom:auto!important')&&
  dock.includes('top:232px!important;bottom:auto!important')&&
  dock.includes('height:30px!important;min-height:30px!important')&&
  dock.includes('gap:var(--visual-menu-gap,3px)!important')&&
  dock.includes('border:1px solid var(--visual-menu-border,#ffffff48)!important');
});
test("UX-QUICK-MORE-04 original colors and bridges stay unchanged",()=>{
 const b=dock.split("function renderMoreChoices(){")[1]
  ?.split("function renderQuickMenu(){")[0]||"";
 return ['report','donate','close'].every(id=>dock.includes('[data-key='+id+'] .quickGlyph'))&&
  dock.includes('#choices.morePanel [data-key=report] .quickGlyph{color:#ffd674!important}')&&
  dock.includes('#choices.morePanel [data-key=donate] .quickGlyph{color:#fa94a7!important}')&&
  dock.includes('#choices.morePanel [data-key=close] .quickGlyph{color:#ff596c!important}')&&
  dock.includes('case "report":Native.openReport();break;')&&
  dock.includes('case "donate":Native.openPix();break;')&&
  dock.includes('case "close":Native.close();break;')&&
  b.includes('button.setAttribute("aria-label",action[2])');
});
test("UX-QUICK-MORE-05 close on outside tap and ordinary preferences survive",()=>{
 return dock.includes('document.addEventListener("pointerdown",event=>{')&&
  dock.includes('if(!choiceOpen)return;')&&
  dock.includes('event.target.closest("#choices")')&&
  dock.includes('event.target.closest("#choices")')&&
  dock.includes('event.target.closest(\'#quickMenuList button[data-key]\')')&&
  dock.includes('document.getElementById("choices").classList.remove("visualPanel","locationPanel","modePanel","standardPanel","filterPicker","morePanel"')&&
  dock.includes('if(!menuOpen){closeChoices();')&&
  dock.includes('const hidden=legacy?[]:Array.isArray(p.hidden)')&&
  dock.includes('for(const id of quickPrefs.order)')&&
  dock.includes('quickPrefs.order.indexOf(id)');
});


test("UX-QUICK-MORE-STABLE-01 More does not switch ribbon to a subview or stretch CSS tracks",()=>{
 const choices=dock.split("function toggleChoices(kind){")[1]?.split("function renderModeChoices(){")[0]||"";
 const fit=dock.split("function fit(){")[1]?.split("function closeChoices(){")[0]||"";
 return choices.includes('document.getElementById("menu").classList.remove("subview");')&&
  choices.includes('if(kind==="more"){renderMoreChoices();return;}')&&
  dock.includes('body.controls-window:not(.visual-menu-vertical) #menu #quickMenuList{')&&
  dock.includes('grid-template-columns:repeat(var(--quick-slot-count,12),minmax(0,1fr))!important')&&
  fit.includes('if(choiceOpen==="more"){')&&
  fit.includes('const tiles=popup.querySelectorAll(".quickMoreAction").length;')&&
  fit.includes('const moreHeight=tiles*30+Math.max(0,tiles-1)*gap;')&&
  fit.includes('baseHeight+Math.ceil(moreHeight)+6');
});
test("UX-QUICK-MORE-STABLE-02 Android toolbar-only WebView prevents viewport rescaling",()=>{
 const create=service.split('menuPanel=new WebView(this);')[1]
  ?.split('menuPanel.addJavascriptInterface(',1)[0]||"";
 const native=service.split('private void updateMenuPosition(){')[1]
  ?.split('private void resizeMenu(',1)[0]||"";
 return create.includes('menuPanel.getSettings().setUseWideViewPort(true);')&&
  create.includes('menuPanel.getSettings().setLoadWithOverviewMode(false);')&&
  dock.includes('name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"')&&
  native.includes('if(menuParams.width!=width)menuParams.width=width;')&&
  native.includes('menuParams.height=rowHeight+actualPopup;')&&
  dock.includes('button.onclick=()=>{closeChoices();quickClick(id);}');
});


test("LT58-SITE-SELECT-01 Size selects locally while site probe must confirm before Search",()=>{
 const f=dock.split("const chips=(key,label)=>{")[1]?.split("const section=(label,open,onClick)=>{")[0]||"";
 const p=read("assets/probe.js");
 return f.includes('modeDraft[multiKey]=[...selected]')&&
  !f.includes('button.disabled=!actual')&&
  p.includes('const rows=key==="form"?formOptionRows(control):')&&
  p.includes('const ok=extraMulti("size",wanted,action);')&&
  p.includes('if(!target.length&&isNeutral(extraValue(key))&&key!=="form")return true;')&&
  p.includes('if(!ok)failed.push("sizeSelections");');
});
test("LT58-SITE-SELECT-02 Gender exclusive; Form directly below; redundant text gone",()=>{
 const f=dock.split("function renderExtraFilters(panel,make){")[1]
  ?.split("function renderFilterPicker(key,label,options){")[0]||"";
 const p=read("assets/probe.js");
 return f.includes('chips("gender","Sexo");\n  const formSelected=')&&f.includes('field("Forma",formEditor)')&&
  f.includes('group.setAttribute("role","radiogroup")')&&
  f.includes('if(isGender){modeDraft[multiKey]=checked?[]:[resolved];}')&&
  p.includes('if(key==="gender"&&Array.isArray(filters.genderSelections))')&&
  p.includes('extraMatches("gender",wanted[0]||"")')&&
  service.includes('key.equals("genderSelections")?1:')&&
  !f.includes('Nenhum botão marcado = Any do site.')&&
  !f.includes('Filtros avançados')&&
  !dock.includes('Nenhum filtro adicional ativo')&&
  !dock.includes('Cada campo altera apenas seu próprio filtro. Outros filtros permanecem.');
});


test("LT58-ALL-POPUPS-STABLE-01 never changes toolbar layout for ANY submenu",()=>{
 const toggle=dock.split("function toggleChoices(kind){")[1]?.split("const current=period;")[0]||"";
 const css=dock.split("/* LT58-ALL-POPUPS-STABLE-01")[1]?.split("/* UX-QUICK-MORE-02:")[0]||"";
 const native=service.split("private void updateMenuPosition(){")[1]?.split("private void resizeMenu(",1)[0]||"";
 return toggle.includes('document.getElementById("menu").classList.remove("subview");')&&
  !toggle.includes('classList.add("subview")')&&
  !toggle.includes('classList.toggle("subview"')&&
  css.includes('body.controls-window:not(.visual-menu-vertical) #menu #quickMenuList{')&&
  css.includes('grid-template-rows:30px!important')&&
  css.includes('grid-template-columns:repeat(var(--quick-slot-count,12),minmax(0,1fr))!important')&&
  css.includes('grid-auto-flow:column!important')&&
  !css.includes('#menu:has(')&&
  native.includes('if(menuParams.width!=width)menuParams.width=width;')&&
  native.includes('menuParams.height=rowHeight+actualPopup;');
});
test("LT58-ALL-POPUPS-STABLE-02 intrinsic popup height ignores Android clipping",()=>{
 const part=dock.split("let lastHeight=0;")[1]?.split("function closeChoices(){")[0]||"";
 if(!part.includes('popup.scrollHeight'))return false;
 const run=(choice,visibleHeight,scrollHeight)=>{
  let result=null;
  const popup={scrollHeight,
   getBoundingClientRect:()=>({height:visibleHeight}),
   classList:{contains:s=>(s==="locationPanel"&&choice==="location")||(s==="filterPicker"&&choice==="picker")},
   querySelectorAll:()=>[1,2,3]};
  const doc={getElementById:id=>id==="shell"?{getBoundingClientRect:()=>({height:34,top:0})}:popup};
  new Function("document","requestAnimationFrame","controlsWindow","resultWindow",
   "choiceOpen","menuOpen","window","Native","positionPopupUnderTrigger","getComputedStyle",
   "let lastHeight=0;"+part+"fit();")(
    doc,callback=>callback(),true,false,choice,true,
    {visualPrefs:{menuOrientation:"horizontal",popupHeight:390}},
    {resizeMenu:h=>{result=h;}},()=>{},()=>({rowGap:"3px"}));
  return result;
 };
 return run("location",90,340)===305&&
  run("location",150,340)===305&&
  run("filters",80,420)===355&&
  run("filters",200,420)===355&&
  run("mode",50,320)===204&&
  run("more",34,130)===136;
});


test("LT58-ALL-POPUPS-STABLE-03 anchor all popup types to their original toolbar tile",()=>{
 const segment=dock.split("function positionPopupUnderTrigger(){")[1]
  ?.split("window.setMenuPopupPlacement=",1)[0]||"";
 if(!segment.includes('panel.style.setProperty("left"'))return false;
 const cases=[
  ["mode","mode",210,60,210],
  ["location","location",120,306,24],
  ["filters","filters",70,238,70],
  ["more","more",300,30,300],
  ["alerts","bell",210,232,98],
  ["info","appearance",250,232,98]
 ];
 return cases.every(([choice,key,triggerX,popupWidth,wantedLeft])=>{
  const changed={};
  const panel={classList:{contains:cls=>cls==="visible"},
   getBoundingClientRect:()=>({width:popupWidth}),
   style:{setProperty:(name,value,priority)=>{changed[name]=[value,priority];}}};
  const area={getBoundingClientRect:()=>({width:330,left:0})};
  const trigger={getBoundingClientRect:()=>({left:triggerX,width:30})};
  const selectors=[];
  const doc={querySelector:s=>{selectors.push(s);return s.includes('data-key="'+key+'"')?trigger:null;},
   getElementById:id=>id==="choices"?panel:id==="menu"?area:null};
  const fn=new Function("controlsWindow","choiceOpen","document",
   "function positionPopupUnderTrigger(){"+segment+"return positionPopupUnderTrigger;");
  fn(true,choice,doc)();
  return selectors[0]?.includes(key)&&
   changed.left?.[0]===wantedLeft+"px"&&changed.left?.[1]==="important"&&
   changed.right?.[0]==="auto";
 });
});
test("LT58-ALL-POPUPS-STABLE-04 popup above/below updates only placement CSS",()=>{
 const segment=dock.split("window.setMenuPopupPlacement=(above,offset,room)=>{")[1]
  ?.split("window.setResultsCollapsed=",1)[0]||"";
 const values={},classes={},counts={position:0,fit:0};
 const doc={documentElement:{style:{setProperty:(k,v)=>{values[k]=v;}}},
  body:{classList:{toggle:(k,v)=>{classes[k]=v;}}}};
 const fn=new Function("controlsWindow","document","choiceOpen","positionCascadeEditor","fit","window",
  "window.setMenuPopupPlacement=(above,offset,room)=>{"+segment+
  "return window.setMenuPopupPlacement;");
 const f=fn(true,doc,"mode",()=>counts.position++,()=>counts.fit++,{});
 f(false,0,340);
 const first=values["--popup-offset"]==="0px"&&values["--popup-room"]==="340px"&&
  classes["popup-above"]===false;
 f(true,185,310);
 return first&&values["--popup-offset"]==="185px"&&values["--popup-room"]==="310px"&&
  classes["popup-above"]===true&&counts.position===2&&counts.fit===2&&
  segment.includes('document.body.classList.toggle("popup-above",!!above)')&&
  !segment.includes('menu.classList.toggle("subview"')&&
  service.includes('rowY-(abovePopup?actualPopup:0)')&&
  dock.includes('body.controls-window.popup-above #menu{top:var(--popup-offset,0px)!important}');
});
test("LT58-ALL-POPUPS-SCALE-01 WebView text inflation stays fixed on popup resize",()=>{
 const css=dock.split("/* LT58-ALL-POPUPS-SCALE-01")[1]
  ?.split("/* UX-QUICK-MORE-02:",1)[0]||"";
 return css.includes("html.controls-root,body.controls-window{")&&
  css.includes("-webkit-text-size-adjust:100%!important;")&&
  css.includes("text-size-adjust:100%!important;")&&
  service.includes("menuPanel.getSettings().setUseWideViewPort(true)")&&
  service.includes("menuPanel.getSettings().setLoadWithOverviewMode(false)");
});


test("LT60-LOC-STATE-01 distinguishes OFF, requested, confirmed and not applied",()=>{
 const start=dock.indexOf("function currentLocationUiState(){");
 const end=dock.indexOf("function locationPanelFeedback(){",start);
 if(start<0||end<=start)return false;
 const fn=new Function("locationEnabled","locationVerified","activeSearchPhase",
  dock.slice(start,end)+"return currentLocationUiState();");
 return fn(false,false,"idle")==="OFF"&&
  fn(true,false,"filling")==="REQUESTED"&&
  fn(true,false,"error")==="NOT_APPLIED"&&
  fn(true,true,"updated")==="CONFIRMED"&&
  fn(true,true,"searching")==="CONFIRMED";
});
test("LT60-LOC-STATE-02 new Search revokes stale site confirmation before submit",()=>{
 const refresh=service.split("private void refresh(boolean manual){")[1]
  ?.split("private void configureSearchWithRetry(",1)[0]||"";
 return refresh.includes("final int generation=++requestGeneration;\n        // LT60-LOC-STATE-01")&&
  refresh.includes("locationVerified=false;")&&
  service.includes("locationVerified=locationEnabled;")&&
  service.includes('String.format(java.util.Locale.US,"%s,%s",m.group(1),m.group(2))');
});
test("LT60-LOC-STATE-03 native feedback observes updated error status",()=>{
 const bridge=dock.split("window.onNativeData=")[1]?.split("function quickState(",1)[0]||"";
 return bridge.indexOf('activeSearchPhase=String(searchPhase||"idle");')<
  bridge.indexOf('if(controlsWindow&&choiceOpen==="location")locationPanelFeedback();')&&
  dock.includes('state==="NOT_APPLIED"?"⚠ Localização não aplicada')&&
  dock.includes('state==="REQUESTED"?"⌛ Verificando localização')&&
  service.includes('prefs.remove("locationCoords").remove("locationRadius")');
});


test("LT61-POKEMON-DEX sends official site its numeric dex query",()=>{
 const start=probe.indexOf("function pokemonQueryForSite(query){");
 const end=probe.indexOf("function pokemonPickerPopup(",start);
 if(start<0||end<=start)return false;
 const normalize=new Function("query",probe.slice(start,end)+"return pokemonQueryForSite(query);");
 return normalize("#0025")==="25"&&normalize("#25")==="25"&&
  normalize("Pikachu")==="Pikachu"&&normalize("Venusaur")==="Venusaur"&&
  normalize("Charmander Goggles 2026")==="Charmander Goggles 2026";
});
test("LT61-POKEMON-PORTAL uses only a linked or unique relevant portal",()=>{
 const start=probe.indexOf("function pokemonPickerPopup(");
 const end=probe.indexOf("function pokemonSuggestion(",start);
 const block=probe.slice(start,end);
 return block.includes("const ids=[...new Set(")&&
  block.includes("matches.length===1?matches[0]:null")&&
  block.includes("function pokemonPickerOptions(query)")&&
  block.includes("if(!popup)return [];")&&
  probe.includes("function pokemonPickerRoot(){");
});

test("LT62-MORE-ABOVE obeys native popup placement without moving toolbar",()=>{
 const start=dock.indexOf("/* LT62-MENU-ANCHOR:");
 const end=dock.indexOf("</style>",start);
 const css=dock.slice(start,end);
 return css.includes("body.controls-window.popup-above #choices.morePanel{")&&
  css.includes("top:auto!important;bottom:34px!important;")&&
  css.includes("body.controls-window.visual-menu-vertical.popup-above #choices.morePanel{")&&
  css.includes("top:auto!important;bottom:232px!important;")&&
  service.includes("rowY-(abovePopup?actualPopup:0)")&&
  dock.includes("panel.style.setProperty(\"max-width\",Math.floor(width)+\"px\",\"important\")");
});
test("LT63-SPRITE-PITCH never overlaps adjacent sprites with zero visual gap",()=>{
 const begin=dock.indexOf("function additionalResultGapPx(");
 const end=dock.indexOf('let lastListKey=""',begin);
 if(begin<0||end<begin)return false;
 const run=new Function("window",dock.slice(begin,end)+"return computeResultLayout;");
 const compact=run({visualPrefs:{resultGapBetween:0,resultsOrientation:"vertical"}})(
  Array.from({length:10},()=>({})),45,900,false,false);
 const defaultSize=run({visualPrefs:{resultGapBetween:31,resultsOrientation:"vertical"}})(
  Array.from({length:10},()=>({})),45,900,false,false);
 return compact.rows.length===10&&compact.rows.every(row=>row>=compact.sprite)&&
  compact.rows.every(row=>row===45)&&defaultSize.rows.every(row=>row===45)&&
  dock.includes("return Math.max(size,pitch); // No sprite-overlap");
});


test("LT64-FILTER-DELTA species selection preserves unrelated search configuration",()=>{
 const ui=dock.split("function renderPokemonChoices(){")[1]?.split("function renderMoreChoices(){",1)[0]||"";
 const native=service.split("@JavascriptInterface public void setPokemonSelections(String payload)")[1]
  ?.split("@JavascriptInterface public void setSearchConfig(",1)[0]||"";
 return ui.includes("Native.setPokemonSelections(JSON.stringify(selection))")&&
  !ui.includes("Native.setSearchConfig(")&&
  native.includes('new JSONObject(extraFiltersJson)')&&
  native.includes('extra.put("pokemonSelections",cleaned)')&&
  native.includes('extra.put("clearExtraKeys",reset)')&&
  native.includes('overlayPrefs().edit().putString("extraFiltersJson",next).apply()')&&
   service.includes('getSharedPreferences(isSecondaryOverlay()?"prefs_secondary":"prefs",0)')&&
  !native.includes('mode=nextMode')&&!native.includes('locationCoords=')&&!native.includes('shiny=');
});
test("LT64-FILTER-SIZE recognizes accessible button state and still verifies the site",()=>{
 const source=probe.split("function multiOptions(control,key){")[1]?.split("function extraMulti(",1)[0]||"";
 return source.includes("button[aria-pressed]")&&source.includes('option.getAttribute("aria-pressed")')&&
  probe.includes("if(target.some(v=>!observed.some(o=>o.label===v)))return false;")&&
  probe.includes("if(!observed.length)return false;");
});


test("LT65-PERF result drag is throttled and commits the final native position",()=>{
 const start=service.indexOf("resultGrip.setOnTouchListener((view,event)->{");
 const end=service.indexOf("resultRoot.addView(resultGrip",start);
 const drag=service.slice(start,end);
 return drag.includes("android.os.SystemClock.uptimeMillis()")&&
  drag.includes("now-lastLayoutMoveAt[0]>=16L")&&
  drag.includes('recordFailure("finalizar arraste",e)')&&
  drag.includes('putInt("resultsX"')&&drag.includes('putInt("resultsY"');
});
test("LT65-PERF despawn clock stops while results window is minimized",()=>{
 return service.includes('js(resultPanel,resultLoaded,"window.setResultsPaused("+yes+")")')&&
  dock.includes("window.setResultsPaused=paused=>{")&&
  dock.includes('document.body.classList.toggle("results-paused",!!paused)')&&
  dock.includes('!document.body.classList.contains("results-paused")')&&
  dock.includes('if(timerTicker!==null){clearInterval(timerTicker);timerTicker=null;}');
});


test("PS66-PORTAL ignores foreign menus and ambiguous result lists",()=>{
 const b=probe.split("function pokemonPickerPopup(")[1]?.split("function pokemonSuggestion(",1)[0]||"";
 return b.includes("document.getElementById?.(id)")&&
  b.includes("matches.length===1?matches[0]:null")&&
  b.includes("const innermost=")&&
  !b.includes("activeOptionPopup(input)||activeOptionPopup(trigger)");
});
test("PS67-STATES never treats timeout or unproved empty as no species",()=>{
 return probe.includes("state:'ready'")&&probe.includes("state:'pending'")&&
  probe.includes("state:'explicit-empty'")&&probe.includes("state:'failed'")&&
  dock.includes('state==="explicit-empty"&&response.empty===true?')&&
  service.includes('response.put("ok",false).put("pending",false).put("state","failed")');
});
test("PS68-APPLY retains exact event forms and isolates the native filter delta",()=>{
 return probe.includes("const siteTerm=missing[0].replace(")&&
  probe.includes("pokemonPickerOptions(siteTerm).find(x=>x.label.toLowerCase()===missing[0].toLowerCase())")&&
  dock.includes("Native.setPokemonSelections(JSON.stringify(selection))")&&
  service.includes('new JSONObject(extraFiltersJson)')&&
  service.includes('Espécies/formas solicitadas · aguardando confirmação no site');
});


test("LT69-FORM-SCOPE prevents Sex dropdown being returned for Form",()=>{
 const body=probe.split("function extraControl(label){")[1]?.split("function describeChoice(",1)[0]||"";
 return body.includes('if(label==="Form"||label==="Gender")')&&
  body.includes('return null; // Fail closed')&&
  body.includes("function extraOptionPopup(key,control){")&&
  body.includes("if(!control||control.getAttribute('aria-expanded')!=='true')return null;")&&
  body.includes("if(key==='form')")&&
  body.includes("distinct.every(")&&
  service.includes('final String[] keys={"sortBy","size","form","gender","weather"}');
});
test("LT70-FORM-MULTI uses official DOM checkboxes, not hardcoded form names",()=>{
 const source=probe.split("function multiOptions(control,key){")[1]?.split("function extraMatches(",1)[0]||"";
 return source.includes("key==='form'?extraOptionPopup('form',control)")&&
  source.includes('key==="form"?null:')&&
  source.includes('allowed===null?!isNeutral(x.label)')&&
  probe.includes('extraMulti("form",wanted,action)')&&
  probe.includes('!extraMulti("form",wanted,"verify")')&&
  probe.includes('slice(0,key==="form"?500:80)');
});
test("LT62-FORM-EDITOR searches official forms and only Form is patched on each choice",()=>{
 const block=dock.split("function renderFormPicker(){")[1]?.split("window.onFormOptions=response=>",1)[0]||"";
 const picker=dock.split("function refreshOfficialFormList(){")[1]?.split("function renderFormPicker()",1)[0]||"";
 return block.includes('input.placeholder="Buscar forma no PoGoCoordinates"')&&
  block.includes("Native.requestFormOptions(formQuery)")&&
  !block.includes('done.textContent="✓ Confirmar seleção"')&&
  picker.includes('updateFiltersPanelStatus()')&&
  dock.includes('field("Forma",formEditor)')&&
  dock.includes('filterOptions.form={present:true,options:[...new Set([...previous,...options])].slice(0,500)}')&&
  dock.includes('Native.patchSearchFilters(JSON.stringify(delta))');
});
test("LT72-FORM-REACT clears only temporary official Form search before multi-apply",()=>{
 const form=probe.split("function extraMulti(key,desired,operation){")[1]
  ?.split("function extraMatches(",1)[0]||"";
 return form.includes('if(key==="form"&&operation==="apply")')&&
  form.includes("const popup=extraOptionPopup('form',control)")&&
  form.includes('if(valueInput(search,""))transientPending=true;')&&
  form.includes('const target=[...new Set(desired.map(x=>clean(x).toLowerCase()))]')&&
  probe.includes('!extraMulti("form",wanted,"verify")');
});
test("LT71-FORM-NATIVE saves multiple forms without resetting species or location",()=>{
 const patch=service.split("public void patchSearchFilters(String payload)")[1]?.split("public void setPokemonSelections(",1)[0]||"";
 return patch.includes('"formSelections"')&&patch.includes('key.equals("formSelections")?500:7')&&
  patch.includes('new JSONObject(extraFiltersJson)')&&
  patch.includes('replaceActiveFilterSearch();')&&
  !patch.includes("locationCoords=")&&!patch.includes("shiny=")&&
  service.includes('void requestFormOptions(String query)')&&
  service.includes('execute("searchFormOptions:"+JSONObject.quote(query)')&&
  dock.includes('formSelections:[]');
});


test("LT72-FORM-DOM explicitly rejects the four Gender options under Form",()=>{
 const begin=probe.indexOf("function extraPopupMatchesKey(key,popup){");
 const end=probe.indexOf("function formOptionRows(control){",begin);
 if(begin<0||end<=begin)return false;
 const clean=x=>String(x||"").trim();
 const text=el=>clean(el&&(el.innerText||el.textContent)||"");
 const vis=el=>!!(el&&el.getClientRects().length);
 const option=name=>({innerText:name,textContent:name,getClientRects:()=>[1]});
 const popup=values=>({
  getClientRects:()=>[1],
  contains:()=>false,
  querySelectorAll:()=>values.map(option)
 });
 const control={
  getAttribute:key=>key==="aria-expanded"?"true":null
 };
 const create=(popups,linkedId)=>{
  const doc={getElementById:id=>linkedId===id?popups[0]:null};
  const elements=()=>popups;
  return new Function("elements","vis","text","clean","document",
   probe.slice(begin,end)+"return extraOptionPopup;")(
   elements,vis,text,clean,doc);
 };
 const gender=popup(["Any","Male","Female","Genderless"]);
 const forms=popup(["Normal","Alola","Copy 2019","Goggles 2026"]);
 const single=popup(["Male"]); // Male is ALSO a legitimate Form name in saved JSON.
 const a=create([gender])("form",control);
 const b=create([forms])("form",control);
 const c=create([single])("form",control);
 const d=create([forms,gender])("form",control);
 return a===null&&b===forms&&c===single&&d===null;
});


test("LT73-FORM-LINKED-PORTAL validates stale aria-controls as strictly as fallback",()=>{
 const begin=probe.indexOf("function extraPopupMatchesKey(key,popup){");
 const end=probe.indexOf("function formOptionRows(control){",begin);
 if(begin<0||end<=begin)return false;
 const clean=x=>String(x||"").trim();
 const text=el=>clean(el&&(el.innerText||el.textContent)||"");
 const vis=el=>!!(el&&el.getClientRects().length);
 const option=name=>({innerText:name,textContent:name,getClientRects:()=>[1]});
 const popup=values=>({
  getClientRects:()=>[1],contains:()=>false,
  querySelectorAll:()=>values.map(option)
 });
 const gender=popup(["Any","Male","Female","Genderless"]);
 const forms=popup(["Normal","Alola","Copy 2019"]);
 const linked={getAttribute:key=>key==="aria-controls"?"portal":key==="aria-expanded"?"true":null};
 const closed={getAttribute:key=>key==="aria-controls"?"portal":key==="aria-expanded"?"false":null};
 const create=chosen=>{
  const doc={getElementById:id=>id==="portal"?chosen:null};
  return new Function("elements","vis","text","clean","document",
   probe.slice(begin,end)+"return extraOptionPopup;")(
   ()=>[chosen],vis,text,clean,doc);
 };
 const code=probe.split("function siteOptions(key){")[1]?.split("function describeChoice(",1)[0]||"";
 return create(gender)("form",linked)===null&&
  create(forms)("form",linked)===forms&&
  create(forms)("form",closed)===null&&
  create(forms)("gender",linked)===null&&
  code.includes('if(key==="form"&&(!rows||!rows.length)){')&&
  code.includes('return explicit?{ok:true,pending:false,empty:true,options:[]}:')&&
  code.includes('{ok:false,pending:true,options:[]};');
});

// LT60: neutral-filter reset intents may only retire on a verified, accepted Search.
test("LT60-CLEAR-ACK-01 pending extra reset requests retire after confirmed results only",()=>{
 const start=service.indexOf("private void acknowledgeConfirmedExtraResets(){");
 const end=service.indexOf("private void applyCollectedResults(JSONObject r)",start);
 const helper=service.slice(start,end);
 const apply=service.slice(end,service.indexOf("private void resize(int h)",end));
 const poll=service.slice(service.indexOf("private void pollSearch("),
  service.indexOf("private long expiration("));
 return start>0&&end>start&&
  helper.includes('updated.remove("clearExtraKeys");')&&
  helper.includes('putString("extraFiltersJson",extraFiltersJson)')&&
  apply.includes("acknowledgeConfirmedExtraResets();")&&
  apply.indexOf("acknowledgeConfirmedExtraResets();")>
   apply.indexOf("results=sorted.toString();")&&
  apply.indexOf("acknowledgeConfirmedExtraResets();")<
   apply.indexOf("shownMode=mode;shownConfigJson=filterConfigJson();")&&
  poll.includes('!r.optBoolean("criteriaConfirmed",false)')&&
  poll.includes("applyCollectedResults(r);");
});
test("LT60-CLEAR-ACK-02 failed searches must keep pending resets",()=>{
 const helper=service.slice(service.indexOf("private void acknowledgeConfirmedExtraResets(){"),
  service.indexOf("private void applyCollectedResults(JSONObject r)"));
 const early=service.slice(service.indexOf("private void configureSearchWithRetry("),
  service.indexOf("private void pollSearch("));
 return helper.includes("if(pending==null||pending.length()==0)return;")&&
  !early.includes("acknowledgeConfirmedExtraResets();");
});
test("LT60-E7-01 poll first results early and back off without repeating Search",()=>{
 const start=service.indexOf("private static long resultPollDelayMs(int attempt){");
 const collectStart=service.indexOf("private void pollSearch(int generation,int attempt,boolean manual){",start);
 const pollEnd=service.indexOf("private long expiration(",collectStart);
 const policy=service.slice(start,collectStart),poll=service.slice(collectStart,pollEnd);
 return start>0&&collectStart>start&&pollEnd>collectStart&&
   policy.includes('if(attempt==0)return 700L;')&&
   policy.includes('return attempt<=6?650L:1150L;')&&
   poll.includes('}, resultPollDelayMs(attempt));')&&
   poll.includes('execute("collect",r->{')&&
   !poll.includes('execute("submitSearch"')&&
   poll.includes('if(r.optBoolean("siteIncomplete",false)&&attempt<24)');
});
test("LT60-E7-02 empty result needs a fresh site signal, not a generic zero",()=>{
 return probe.includes('function visibleResultSignature(){')&&
   probe.includes('window.__pokeSearchSubmission={before:visibleResultSignature(),observedUpdate:false};')&&
   probe.includes('const explicitEmpty=found.length===0&&!loading&&explicitEmptySignal&&resultChanged;')&&
   probe.includes('const zeroInResults=emptyInMain&&(countLabel==="0"||countLabel===undefined);')&&
   probe.includes('const empty=mainEmptyMessage()?"verified-empty-element":"";')&&
   probe.includes('emptySignalFound:explicitEmptySignal,resultChanged,')&&
   service.includes('"estado vazio anterior sem atualização"');
});
// LT62 reference: Refresh direct tap + AUTO long-press preserve two behaviors.
test("LT62: direct refresh, long press AUTO and official sprite-only chips",()=>{
 return dock.includes('if(id==="period"){manualRefreshTap();return;}')&&
   dock.includes('button.addEventListener("contextmenu",e=>{e.preventDefault();e.stopPropagation();open();})')&&
   dock.includes('if(choiceOpen==="period")closeChoices();else toggleChoices("period")')&&
   dock.includes('pokemonSuggestionSpriteCache.set(label.toLowerCase(),exact||src);')&&
   dock.includes('pokemonSuggestionSpriteCache.get(String(name).toLowerCase())');
});
test("LT62 AUTO refresh icon and long press must never double trigger a search",()=>{
 const body=dock.split('function bindRefreshGesture(button){')[1]?.split('function renderQuickMenu(){')[0]||"";
 const menu=dock.split('const current=period;')[1]?.split('function positionCascadeEditor()')[0]||"";
 return dock.includes('period:\'<path d="M27 12A11 11 0 0 0 8 5"')&&
  dock.includes('bindRefreshGesture(button);')&&
  body.includes('hold=setTimeout(open,600)')&&
  body.includes('if(longTriggered){e.preventDefault();e.stopPropagation();longTriggered=false;return;}')&&
  body.includes('manualRefreshTap();')&&body.includes('pointermove')&&
  body.includes('pointercancel')&&
  !menu.includes('now.textContent=')&&
  dock.includes('badge.textContent=period===0?"":period+"m"')&&
  dock.includes('button.classList.add("refreshSpinning")')&&
  dock.includes('animation:psRefreshSpin .7s linear 1!important');
});
test("LT62 AUTO compact six-choice menu is usable without scrolling",()=>{
 const menu=dock.split('const current=period;')[1]?.split('function positionCascadeEditor()')[0]||"";
 return menu.includes('off.setAttribute("aria-pressed",String(current===0))')&&
  menu.includes('button.setAttribute("aria-pressed",String(value===current))')&&
  menu.includes('off.onclick=()=>selectInterval(0)')&&menu.includes('Native.setIntervalMinutes(value)')&&
  menu.includes('[...row.children].forEach(tile=>panel.appendChild(tile))')&&
  menu.includes('panel.setAttribute("aria-label","Atualização automática")')&&
  !menu.includes('title.textContent="ATUALIZAÇÃO"')&&
  !menu.includes('close.className="choiceClose"')&&
  dock.includes('body.controls-window #choices.periodCompact[data-panel-kind="period"]')&&
  dock.includes('max-height:none!important')&&
  dock.includes('const periodHeight=tiles*30+Math.max(0,tiles-1)*gap;');
});
test("LT62: Shiny pending remains neutral, and site Pokemon import requires a user action",()=>{
 return dock.includes('button[data-key="sh"].pending .quickGlyph')&&
  dock.includes('if(response.selectionVerified===true&&Array.isArray(response.selected))')&&
  dock.includes('importButton.onclick=()=>{')&&
  dock.includes('pokemonDraft=[...pokemonSiteSelections];')&&
  dock.includes('importButton.hidden=!differs;')&&
  probe.includes('selectionVerified:chips!==null')&&
  service.includes('"SEARCH_LATENCY"')&&
  service.includes('System.currentTimeMillis()-lastSearchStartMs');
});
test("LT85: site filter values remain whitelisted without manual import banner",()=>{
 return dock.includes('function verifiedSiteSingleFilterValues(){')&&
   dock.includes('sortBy:["Despawn (longest)","CP (highest)')&&
   dock.includes('weather:["Any","Boosted","Sunny"')&&
   dock.includes('gender:["Any","Male","Female","Genderless"]')&&
   dock.includes('if(match)selected[key]=match==="Any"?"":match;')&&
   !dock.includes("Usar opções observadas no site")&&
   dock.includes('filterOptions={}; // Never reuse an old site snapshot')&&
   dock.includes('filterOptions[key]={...(filterOptions[key]||{}),...value};');
});
// LT60-E8: saved mode, editable submenu and actual site confirmation are separate.
test("LT60-E8-01 reopened menu identifies persisted GL/UL and raw extremes",()=>{
 const from=dock.indexOf("function selectedModeEntry(currentMode,settings){");
 const to=dock.indexOf("function renderModeChoices(){",from);
 if(from<0||to<=from)return false;
 const selected=require("node:vm").runInNewContext(dock.slice(from,to)+";selectedModeEntry",{});
 return selected("gl",{glRank:1})==="gl"&&
  selected("ul",{ulRank:50})==="ul"&&
  selected("percent",{percentMin:91,percentMax:100})==="percent"&&
  selected("raw",{attack:15,defense:15,stamina:15})==="hundo"&&
  selected("raw",{attack:0,defense:0,stamina:0})==="nundo"&&
  selected("raw",{attack:3,defense:15,stamina:12})==="raw";
});
test("LT60-E8-02 open cascade does not overwrite persisted mode",()=>{
 const from=dock.indexOf("function renderModeChoices(){");
 const choices=dock.slice(from,dock.indexOf("/* FILTERS-POGO-01",from));
 return choices.includes("const activeModeEntry=selectedModeEntry(mode,searchSettings);")&&
  choices.includes('button.classList.toggle("activeMode",selected);')&&
  choices.includes('button.classList.toggle("chosen",cascadeMode===id);')&&
  choices.includes('button.setAttribute("aria-current",String(selected));')&&
  choices.includes('button.setAttribute("aria-expanded",String(cascadeMode===id));')&&
  choices.includes('button.classList.toggle("siteConfirmed",selected&&confirmedMode);')&&
  dock.includes("button.modeCascadeEntry.activeMode:not(.chosen)")&&
  choices.includes('site pendente');
});
test("LT60-E8-03 confirmed state requires completed current site search",()=>{
 const from=dock.indexOf("function renderModeChoices(){");
 const choices=dock.slice(from,dock.indexOf("/* FILTERS-POGO-01",from));
 return choices.includes("siteFiltersConfirmed&&!searchActive&&!resultsStale")&&
  choices.includes('(activeSearchPhase==="updated"||activeSearchPhase==="empty")')&&
  service.includes("confirmedSubmittedFiltersGeneration==requestGeneration")&&
  service.includes("submittedSearchGeneration==requestGeneration")&&
  service.includes("!searchInProgress&&!resultsStale");
});

// LT60-E9: old visible cards remain in cache, never collected or alerted as new.
test("LT60-E9-01 prior cards require DOM change after Search before acceptance",()=>{
 const collect=probe.slice(probe.indexOf("function collect(){"),probe.indexOf('if(action==="collect")return collect();'));
 const poll=service.slice(service.indexOf("private void pollSearch("),service.indexOf("private long expiration("));
 return collect.includes("const resultFreshnessPending=found.length>0&&!resultChanged;")&&
  collect.includes("resultFreshnessPending,")&&
  poll.includes('if(r.optBoolean("resultFreshnessPending",false)){')&&
  poll.includes("if(attempt<24){")&&
  poll.includes("pollSearch(generation,attempt+1,manual);")&&
  poll.includes('searchFailure("⚠ Resultados anteriores",')&&
  poll.indexOf('if(r.optBoolean("resultFreshnessPending",false)){')<
    poll.indexOf('int found=r.optInt("found",0);')&&
  poll.indexOf('if(r.optBoolean("resultFreshnessPending",false)){')<
    poll.indexOf("applyCollectedResults(r);");
});
test("LT60-E9-02 stale-card handling must never emit a new Search or new result alert",()=>{
 const poll=service.slice(service.indexOf("private void pollSearch("),service.indexOf("private long expiration("));
 const stale=poll.slice(poll.indexOf('if(r.optBoolean("resultFreshnessPending",false)){' ),poll.indexOf('int found=r.optInt("found",0);'));
 return stale.includes("searchInProgress=false;")&&
  !stale.includes("applyCollectedResults(")&&
  !stale.includes("recordNewResults(")&&
  !stale.includes('execute("submitSearch"')&&
  !stale.includes("refresh(");
});
test("LT61-SHINY-MODE-01 native mode changes do not rewrite the saved Shiny toggle",()=>{
 const start=service.indexOf("@JavascriptInterface public void setSearchConfig(String payload)");
 const end=service.indexOf("@JavascriptInterface public void shiny()",start);
 const modes=service.slice(start,end);
 return start>=0&&end>start&&
  !modes.includes("shiny=false;")&&!modes.includes("shiny=true;")&&
  !modes.includes("shiny=!shiny;")&&
  modes.includes("mode=nextMode;rawAttack=a;rawDefense=d;rawStamina=st;")&&
  modes.includes("scheduleFilterChangeRefresh();")&&
  service.includes("private void refresh(boolean manual)")&&
  service.includes("if(shiny){shinyVerified=false;update();}");
});
test("LT61-SHINY-MODE-02 dock preserves requested Shiny during verification",()=>{
 const statement="shinyPending=!!pending;shiny=!!shi||shinyPending;";
 if(!dock.includes('shinyPending=!!pending;\n shiny=!!shi||shinyPending;'))return false;
 const fn=require("node:vm").runInNewContext("((shi,pending)=>{let shiny,shinyPending;"+statement+"return [shiny,shinyPending]})",{});
 return JSON.stringify(fn(false,true))==="[true,true]"&&
  JSON.stringify(fn(true,false))==="[true,false]"&&
  JSON.stringify(fn(false,false))==="[false,false]"&&
  dock.includes("Shiny solicitado · aguardando confirmação no site")&&
  dock.includes("button.classList.toggle(\"pending\",id===\"sh\"&&shinyPending);");
});
test("LT61-SHINY-MODE-03 pending Shiny is not presented as an applied site filter",()=>{
 return dock.includes("shinyPending?\"✨ Shiny solicitado · aguardando confirmação no site\":shiny?\"✨ Shiny confirmado\"")&&
  dock.includes("shiny=!!shi||shinyPending;")&&
  dock.includes("shownShiny=!!resultSourceShiny;resultsStale=!!stale;")&&
  service.includes("(shiny&&shinyVerified)+\"")&&
  service.includes("(shiny&&!shinyVerified)+\"")&&
  service.includes("shinyVerified=shiny;")&&
  service.includes('execute("verifyShiny",verified->{');
});

test("LT62 P/M/G selector shared by Personalização and Editor Visual",()=>{
 const visual=read("assets/visual_editor.js");
 return dock.includes("window.renderSpriteSizeButtons=renderSpriteSizeButtons;")&&
  visual.includes("window.renderSpriteSizeButtons(panel,true)")&&
  dock.includes("if(Native.setSpriteSize)Native.setSpriteSize(size)")&&
  dock.includes("refreshSpriteSizeButtons();")&&
  service.includes("@JavascriptInterface public void setSpriteSize(int size)")&&
  service.includes('putInt("spriteSize",size).apply()');
});
test("LT62 Android notifications are confirmed from permission callbacks",()=>{
 return service.includes("SYNC_NOTIFICATION_PERMISSION")&&
  main.includes("SYNC_NOTIFICATION_PERMISSION")&&
  main.includes("if(requestCode==204)")&&
  service.includes("preferência salva; libere as notificações no Android")&&
  dock.includes("heading.title=notificationPermissionGranted");
});

test("LT62 independent popup widths are stable after WebView shrink and have no empty tail",()=>{
 const css=dock.split("/* Split native overlay window:")[1]?.split("</style>")[0]||"";
 return css.includes("width:240px!important;max-width:none!important")&&
  css.includes("width:248px!important;max-width:none!important")&&
  css.includes("width:268px!important;max-width:none!important")&&
  css.includes("width:138px!important;max-width:none!important")&&
  css.includes("width:172px!important;max-width:none!important")&&
  css.includes("width:270px!important;max-width:none!important")&&
  css.includes("modeCascade.modeCascadeOpen .modeCascadeEditor")&&
  css.includes("height:0!important;min-height:0!important;overflow:visible!important")&&
  css.includes("max-height:var(--popup-room,440px)!important;overflow-y:auto!important")&&
  css.includes("max-width:none!important;");
});

test("LT62 popup first paint is 1dp touch strip, not a GONE rAF deadlock",()=>{
 const open=service.split("private void openIndependentPopup(String kind,int x,int y){")[1]
  ?.split("private static boolean validIndependentPopup(",1)[0]||"";
 return open.includes("popupParams.height=Math.max(1,dp(1))")&&
  open.includes("popupRoot.setVisibility(View.VISIBLE)")&&
  open.includes("wm.updateViewLayout(popupRoot,popupParams)")&&
  !open.includes("popupRoot.setVisibility(View.GONE)")&&
  open.includes("if(popupLoaded)js(popupPanel,true,");
});
test("LT62 internal submenu switches do not close native popup before its resize",()=>{
 const js=dock.split("let popupNativeSwitch=false;")[1]
   ?.split("function toggleChoices(kind){",1)[0]||"";
 return js.includes("if(popupWindow&&!popupNativeSwitch&&Native.closePopup)")&&
  js.includes("popupNativeSwitch=true;")&&
  js.includes("finally{popupNativeSwitch=false;}")&&
  js.includes("if(choiceOpen===kind){fit();return;}");
});
if(failures.length){console.error("UX CONTRACT FAILURES ("+failures.length+"):\\n"+failures.join("\\n"));process.exitCode=1;}
else console.log("PokeSearch UX contract: "+count+" tests passed");


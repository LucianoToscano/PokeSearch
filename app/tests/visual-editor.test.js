"use strict";
// Visual editor contracts. No Android SDK or external network required.
// QA gate for the explicitly authorized stable-signed 0.51 APK: always rerun
// these checks on the source commit that Actions will package (no merge).
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"../src/main");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const script=read("assets/visual_editor.js");
const dock=read("assets/dock.html");
const java=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const main=read("java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
let count=0;
function test(name,fn){fn();count++;}
function fixture(){
 const styles={};
 const classes=new Set();
 const window={};
 const document={
  documentElement:{style:{setProperty:(k,v)=>styles[k]=v}},
  body:{classList:{toggle:(k,value)=>value?classes.add(k):classes.delete(k)}}
 };
 vm.runInNewContext(script,{window,document,controlsWindow:false,resultWindow:false,
  draw:()=>{},fit:()=>{},setTimeout:()=>0,clearTimeout:()=>{}});
 return {window,styles,classes};
}
test("defaults preserve original orientation and unclipped renderer",()=>{
 const {window}=fixture(),v=window.visualEditorCurrent();
 assert.equal(v.resultGapBetween,31);
 assert.equal(v.resultsOrientation,"vertical");
 assert.equal(v.menuOrientation,"horizontal");
 assert.equal(v.resultsTransparency,100);
 assert.equal(v.menuTransparency,35);
 assert.equal(v.menuItemGap,3);
});
test("packed preset allows true overlap via lowered row pitch",()=>{
 assert.match(dock,/const pitch=Math\.max\(8,Math\.round\(size\*\.32\)/);
 assert.match(dock,/return pitch; \/\/ Transparent sprite squares may overlap/);
 assert.match(dock,/const sprite=Math\.max\(10,Math\.floor\(size\*factor\)\)/);
 assert.match(script,/compact:\{resultGapTop:-6,resultGapBetween:0/);
});
test("invalid imported JSON is ignored and values are clamped",()=>{
 const {window,styles,classes}=fixture();
 window.onVisualPrefs({resultGapBetween:-55,resultsTransparency:800,menuItemGap:-5,
  popupWidth:600,headerIconY:-99,resultsOrientation:"horizontal",menuOrientation:"vertical"});
 const p=window.visualEditorCurrent();
 assert.equal(p.resultGapBetween,0);assert.equal(p.resultsTransparency,100);
 assert.equal(p.popupWidth,330);assert.equal(p.headerIconY,0);
 assert.equal(p.resultsOrientation,"horizontal");assert.equal(p.menuOrientation,"vertical");
 assert.equal(styles["--visual-results-bg"],"rgba(15,19,26,0.00)");
 assert.equal(classes.has("visual-results-horizontal"),true);
 const before=JSON.stringify(p);
 window.onVisualPrefs("{broken");
 assert.equal(JSON.stringify(window.visualEditorCurrent()),before);
});
test("editor includes preset, live preview, JSON copy/import and reset",()=>{
 for(const term of ["compact:","balanced:","readable:","Copiar JSON","Restaurar padrão original",
  "Importar JSON digitado","JSON.stringify","renderVisualEditor","saveSoon","applyVisual","setTimeout"]){
  assert.ok(script.includes(term),term);
 }
});
test("editor can change themes, both transparencies and two orientations",()=>{
 for(const term of ["resultsTransparency","menuTransparency","resultsBgMode","menuBgMode",
   "resultsOrientation","menuOrientation","resultsOffsetX","resultsOffsetY",
   "menuOffsetX","menuOffsetY","gearMenuGap","menuItemGap",
   "resultGapBetween","resultGapTop","resultSpriteScale","popupWidth","popupHeight"]){
  assert.ok(script.includes(term),term);
 }
});
test("all Android bridge paths use JSON validation and persistence",()=>{
 for(const term of ["normalizeVisualPrefs(String raw)","void saveVisualPrefs(String json)",
 "visualPrefsJson","putString(\"visualPrefsJson\",visualPrefsJson)","void copyVisualPrefs(String json)",
 "visualMenuBaseDp()","visualResultsHorizontal&&!resultCollapsed","broadcastVisualPrefs();"]){
  assert.ok(java.includes(term),term);
 }
 assert.ok(java.includes("raw.length()>5000"));
});
test("rendered results remain an independent WebView and retain old filters",()=>{
 assert.ok(java.includes('resultPanel.loadUrl("file:///android_asset/dock.html?results=1")'));
 assert.ok(dock.includes("window.onNativeData="));
 assert.ok(dock.includes("Native.setSearchConfig"));
 assert.ok(dock.includes("Native.resizeResultsMetadata"));
 assert.ok(dock.includes('visual_editor.js'));
 assert.ok(dock.includes('🎛 Editor visual temporário'));
});
test("light theme changes foreground and actual button backgrounds",()=>{
 const {window,styles,classes}=fixture();
 window.onVisualPrefs({menuBgMode:"light",resultsBgMode:"light",
   menuTransparency:25,resultsTransparency:40});
 assert.equal(styles["--visual-menu-fg"],"#152231");
 assert.equal(styles["--visual-results-fg"],"#172533");
 assert.equal(styles["--visual-menu-button-bg"],"rgba(255,255,255,0.75)");
 assert.equal(styles["--visual-results-bg"],"rgba(255,255,255,0.60)");
 assert.equal(classes.has("visual-light-menu"),true);
 assert.equal(classes.has("visual-light-results"),true);
 assert.ok(dock.includes('background:var(--visual-menu-button-bg'));
});
test("service bounds horizontal overlay touch area to populated columns",()=>{
 assert.ok(java.includes("int columns=Math.max(1,Math.min(5,count()))"));
 assert.ok(java.includes("perCard*columns"));
 assert.ok(java.includes("resultParams.width!=dp(resultWidthDp())"));
 assert.ok(java.includes("updateResultsWidth();"));
});
test("slider edits are not reverted by stale service state",()=>{
 const saved=[],timers=[],styles={};
 const Native={saveVisualPrefs:json=>saved.push(JSON.parse(json))};
 const window={Native};
 const document={
  documentElement:{style:{setProperty:(k,v)=>styles[k]=v}},
  body:{classList:{toggle(){}}}
 };
 // Exercise the REAL private change callback rather than relying on its
 // former exact source spelling (the theme-sync branch now merges color).
 const instrumented=script.replace("window.visualEditorCurrent=function(){",
  "window.__testChange=change;window.visualEditorCurrent=function(){");
 assert.notEqual(instrumented,script);
 vm.runInNewContext(instrumented,{window,document,Native,controlsWindow:true,
  resultWindow:false,draw:()=>{},fit:()=>{},
  setTimeout:fn=>{timers.push(fn);return timers.length;},clearTimeout:()=>{}});
 window.__testChange("menuTransparency",72);
 window.onVisualPrefs({menuBgMode:"dark",menuTransparency:35});
 assert.equal(window.visualEditorCurrent().menuTransparency,72,
  "An old Android broadcast cannot override a pending slider change");
 assert.equal(styles["--visual-menu-button-bg"],"rgba(15,19,26,0.28)");
 for(const fn of timers)fn();
 assert.equal(saved.length,1);
 assert.equal(saved[0].menuTransparency,72);
 window.onVisualPrefs(saved[0]);
 window.onVisualPrefs({menuBgMode:"dark",menuTransparency:17});
 assert.equal(window.visualEditorCurrent().menuTransparency,17,
  "After the matching save acknowledgement, later external updates are accepted");
});
test("large header gap is included in native window height",()=>{
 assert.ok(dock.includes('Math.ceil(end-shellTop)+1'));
 assert.ok(dock.includes('margin-top:var(--visual-top-gap,0px)!important'));
});
test("styling changes don't need reload of all Pokemon images",()=>{
 assert.ok(script.includes('if(window.__visualGeometry!==signature)'));
 assert.ok(script.includes('else if(typeof fit==="function")fit()'));
});
test("horizontal native width includes the live CSS inter-card spacing",()=>{
 assert.match(java,/visualResultGapBetween=o\.optInt\("resultGapBetween",31\)/);
 assert.match(java,/perCard\*columns\+visualResultGapBetween\*\(columns-1\)\+2/);
 assert.ok(java.includes("resultParams.width=dp(resultWidthDp())"));
 assert.ok(dock.includes("column-gap:var(--visual-result-spacing,4px)!important"));
 const width=(count,card,gap)=>card*count+gap*(count-1)+2;
 assert.equal(width(2,149,31),331);
 assert.equal(width(5,53,0),267);
});
test("packed sprite pitch reserves symmetrical first and last art space",()=>{
 assert.ok(dock.includes('padding-top:max(0px,calc((var(--sprite) - var(--visual-row-pitch,46px))/2))!important'));
 assert.ok(dock.includes('padding-bottom:max(0px,calc((var(--sprite) - var(--visual-row-pitch,46px))/2))!important'));
 const sprite=45,pitch=Math.max(8,Math.round(sprite*.32));
 assert.equal((sprite-pitch)/2,15.5);
});
test("visual position sliders keep the currently open detail window in sync",()=>{
 assert.match(java,/recordFailure\("editor posição resultados",e\);\}\s*moveDetail\(\);/);
});
test("sparkle is vector white by default, yellow when site-verified",()=>{
 assert.ok(dock.includes('const QUICK_SOURCE_ICONS={sh:"sh"'));
 assert.ok(dock.includes('onclick="Native.shiny()"><svg viewBox="0 0 24 24" fill="currentColor" stroke="none"'));
 assert.ok(!dock.includes('onclick="Native.shiny()">✨</button>'));
 assert.ok(dock.includes('button[data-key="sh"].selected,'));
});
test("favorites location and notification share neutral button background",()=>{
 const css=dock.split("/* UX-ICONS-STATE:")[1]?.split("</style>")[0]||"";
 for(const id of ["sh","star","location","bell"]){
  assert.ok(css.includes('button[data-key="'+id+'"]'),id);
  assert.ok(css.includes('background:var(--visual-menu-button-bg,#28292cce)!important;'));
 }
 assert.ok(css.includes('button[data-key="location"].selected{color:#ff5264!important}'));
 assert.ok(css.includes('button[data-key="star"].selected,'));
});
test("favorite star is yellow on, white silent and absent off independently of bell sound",()=>{
 const fragment=dock.split("function notificationBellVisual(")[1]
  ?.split("function refreshQuickMenuStates(){")[0]||"";
 assert.ok(fragment);
 const fn=new Function("return function notificationBellVisual("+fragment)();
 for(const permission of [true,false])for(const general of ["off","silent","on"])
  for(const favorite of ["off","silent","on"]){
   const state=fn(permission,general,favorite);
   assert.equal(state.favoriteStarOn,favorite==="on");
   assert.equal(state.favoriteStarSilent,favorite==="silent");
   assert.ok(!(state.favoriteStarOn&&state.favoriteStarSilent));
   assert.equal(state.blocked,!permission&&(general!=="off"||favorite!=="off"));
  }
 for(const marker of [
  'button.classList.toggle("bell-star-on",id==="bell"&&bellState.favoriteStarOn)',
  'button.classList.toggle("bell-star-silent",id==="bell"&&bellState.favoriteStarSilent)',
  'bell.classList.toggle("bell-star-on",bellVisual.favoriteStarOn)',
  'bell.classList.toggle("bell-star-silent",bellVisual.favoriteStarSilent)',
  '.bell-star-on .quickGlyph::after',
  '.bell-star-silent .quickGlyph::after',
  'color:#ffdc63;',
  'color:#fff;'
 ]) assert.ok(dock.includes(marker),marker);
 const css=dock.split("/* Star is a separate indicator for FAVORITES")[1]
  ?.split("body.controls-window #quickMenuList button[data-key=\"bell\"].bell-silent-mode")[0]||"";
 assert.ok(css.includes("content:\"★\""));
 assert.ok(!css.includes("bell-sound-both .quickGlyph::after"));
});
test("bell transitions remove stale star classes across all 18 sound states",()=>{
 const logic=dock.split("function audibleAlertState(")[1]
  ?.split("function uxPanel(")[0]||"";
 assert.ok(logic.includes("function refreshQuickMenuStates(){"));
 const run=new Function("document","controlsWindow","notificationPermissionGranted",
  "alertMode","favoriteAlertMode","hasFavorites","quickState",
  "function audibleAlertState("+logic+"\nrefreshQuickMenuStates()");
 const classes=new Set();
 const bell={
  dataset:{key:"bell"},
  getAttribute:()=> "Alertas",
  querySelector:()=>null,
  classList:{toggle:(key,on)=>on?classes.add(key):classes.delete(key)},
  title:""
 };
 const doc={querySelectorAll:()=>[bell]};
 for(const permission of [true,false])
 for(const general of ["on","silent","off"])
 for(const favorite of ["on","silent","off"]){
  run(doc,true,permission,general,favorite,true,()=> "");
  assert.equal(classes.has("bell-star-on"),favorite==="on");
  assert.equal(classes.has("bell-star-silent"),favorite==="silent");
  assert.equal(classes.has("bell-permission-blocked"),!permission&&(general!=="off"||favorite!=="off"));
  assert.ok(!(classes.has("bell-star-on")&&classes.has("bell-star-silent")));
  assert.ok(bell.title.includes("Novos: "+general+" · Favoritos: "+favorite));
 }
 assert.equal(classes.has("bell-star-on"),false);
 assert.equal(classes.has("bell-star-silent"),false);
});
test("bell shows independent white/gold/star/silent/permission patterns",()=>{
 assert.ok(dock.includes('button.classList.toggle("bell-sound-new",id==="bell"&&bellState.newOnly)'));
 assert.ok(dock.includes('button.classList.toggle("bell-sound-favorites",id==="bell"&&bellState.favoritesOnly)'));
 assert.ok(dock.includes('button.classList.toggle("bell-sound-both",id==="bell"&&bellState.both)'));
 assert.ok(dock.includes('button.classList.toggle("bell-silent-mode",id==="bell"&&bellState.silent)'));
 assert.ok(dock.includes('button.classList.toggle("bell-permission-blocked",id==="bell"&&bellState.blocked)'));
 assert.ok(dock.includes('content:"★"'));
 assert.ok(dock.includes('color:#ffd64b!important;'));
 assert.ok(!dock.includes('bell-both-muted .quickGlyph::before'));
});
test("legacy toggle icon colors match compact menu without changing IV or results",()=>{
 const css=dock.split("/* UX-ICONS-STATE:")[1]?.split("</style>")[0]||"";
 for(const id of ["sh","star","location","bell"])assert.ok(css.includes("#controls #"+id),id);
 assert.ok(css.includes("#controls #location.locOn{color:#ff5264!important}"));
 assert.ok(css.includes("#controls #bell.generalOn{color:#ffd64b!important}"));
 assert.ok(!css.includes(".ivPct")&&!css.includes(".spawnInfo"));
});
test("horizontal layout has no leftover vertical packed padding",()=>{
 assert.ok(dock.includes('visual-results-horizontal #spawns:not(:empty){padding-top:0!important;padding-bottom:0!important}'));
});
test("geometry diagnostic reports only stage measurements, never spawn data",()=>{
 const f=dock.split('window.measureResultSpacing=()=>{')[1]?.split('function computeResultLayout(',1)[0]||'';
 assert.ok(f.includes('headerToFirstPx'));
 assert.ok(f.includes('stageGapPx'));
 assert.ok(!f.includes('card.')&&!f.includes('locationCoords'));
});
test("Visual Editor Pokémon tab has direct P M G size buttons without restarting overlay",()=>{
 assert.ok(script.includes('if(window.renderSpriteSizeButtons)window.renderSpriteSizeButtons(panel,true);'));
 assert.ok(dock.includes('className="spriteSizeChoices"'));
 assert.ok(dock.includes('function refreshSpriteSizeButtons(){'));
 assert.ok(dock.includes('spriteSize=Number(sprite)||45;refreshSpriteSizeButtons();'));
 assert.ok(dock.includes('button.onclick=()=>{if(Native.setSpriteSize)Native.setSpriteSize(size);}'));
});
test("editor dark light and vertical horizontal work without native select dialogs",()=>{
 assert.ok(editorHasButtons());
 function editorHasButtons(){
  return script.includes('className="visualSegment"')&&
   script.includes('button.onclick=()=>{change(key,value);renderVisualEditor();}')&&
   !script.includes('const select=document.createElement("select")')&&
   dock.includes('.visualSegmentGroup');
 }
});
test("Menu tiles return to individual rounded borders like the legacy reference",()=>{
 const tail=dock.split("/* UX-MENU-TILES-RESTORE-01:")[1]?.split("</style>")[0]||"";
 assert.ok(tail.includes("body.controls-window #menu,"));
 assert.ok(tail.includes("body.controls-window.popup-above #quickMenuList{"));
 assert.ok(tail.includes("background:transparent!important;border:0!important;box-shadow:none!important;"));
 assert.ok(tail.includes("body.controls-window #quickMenuList button[data-key].selected"));
 assert.ok(tail.includes("background:var(--visual-menu-button-bg,#28292cce)!important;"));
 assert.ok(tail.includes("border:1px solid var(--visual-menu-border,#ffffff48)!important;"));
 assert.ok(tail.includes("box-shadow:var(--visual-menu-tile-shadow,0 1px 3px #0006)!important;"));
 assert.ok(tail.includes("border-radius:7px!important;"));
 assert.ok(tail.includes("gap:var(--visual-menu-gap,3px)!important;"));
 assert.ok(dock.indexOf("/* UX-MENU-TILES-RESTORE-01:")>dock.indexOf("/* AUD-BELL-02:"));
 assert.ok(dock.includes('button[data-key="sh"].selected'));
 assert.ok(script.includes('addSegment(panel,"menuBgMode"'));
 assert.ok(script.includes('addSlider(panel,"menuTransparency","Transparência única dos menus","%")'));
});
test("Final cascade reintroduces 1px borders on regular, selected and light menu tiles",()=>{
 const css=(dock.split("<style>")[1]?.split("</style>")[0]||"").replace(/\/\*[\s\S]*?\*\//g,"");
 const rules=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(x=>({
  selectors:x[1].split(",").map(y=>y.trim()),
  border:(x[2].match(/(?:^|;)\s*border\s*:\s*([^;]+)/)||[])[1]||""
 })).filter(x=>x.border.includes("!important"));
 const wanted="1px solid var(--visual-menu-border,#ffffff48)!important";
 for(const variant of [".quick-horizontal",":not(.quick-horizontal)"]){
  for(const type of [".quickRow",".quickFooterAction"]){
   const selector="body.controls-window #quickMenuList"+variant+" "+type;
   const hits=rules.filter(x=>x.selectors.includes(selector));
   assert.ok(hits.length>=1,"Expected final CSS border for "+selector);
   assert.equal(hits[hits.length-1].border.trim(),wanted,selector);
  }
 }
 for(const selector of ["body.controls-window #quickMenuList button[data-key]",
   "body.controls-window #quickMenuList button[data-key].selected",
   "body.controls-window.visual-light-menu #quickMenuList button[data-key]"]){
  const hits=rules.filter(x=>x.selectors.includes(selector));
  assert.ok(hits.length>=1);
  assert.equal(hits[hits.length-1].border.trim(),wanted,selector);
 }
});
test("Minior art receives additional consistent scaling in the 10-sprite list",()=>{
 assert.ok(dock.includes('const artFit=/^'));
 assert.ok(dock.includes('minior(?:'));
 assert.ok(dock.includes('?0.67:0.86;'));
 assert.ok(dock.includes('const artFit='));
 assert.ok(dock.includes('--visual-art-fit:'));
 assert.ok(dock.includes('width:calc(var(--sprite) * var(--visual-art-fit,0.86))!important;'));
});
test("sprite guide tracks normalized art, not whole row",()=>{
 assert.ok(dock.includes('body.visual-guides.result-window .spriteStage::after{display:none!important}'));
 assert.ok(dock.includes('body.visual-guides.result-window .spriteStage .sprite{'));
 assert.ok(dock.includes('filter:drop-shadow(0 0 1px #4ce5ff)'));
 assert.ok(dock.includes('document.getElementById("resultIconStack")'));
});
test("negative header gap changes native height instead of leaving invisible bottom padding",()=>{
 assert.ok(script.includes('resultGapTop:[-80,80]'));
 assert.ok(dock.includes('Math.ceil(end-shellTop)+1'));
 assert.ok(dock.includes('margin-top:var(--visual-top-gap,0px)!important'));
});
test("Pokebola Y starts at 0 and button artwork tracks Android's native drag grip",()=>{
 const {window,styles}=fixture();
 window.onVisualPrefs({headerIconY:0,headerTouchWidth:35,headerTouchHeight:30});
 assert.equal(window.visualEditorCurrent().headerIconY,0);
 assert.equal(styles["--visual-header-y"],"0px");
 window.onVisualPrefs({headerIconY:16,headerTouchHeight:40});
 assert.equal(styles["--visual-header-y"],"16px");
 assert.equal(styles["--visual-header-touch-height"],"40px");
 assert.ok(java.includes("box.topMargin=dp(visualHeaderY)"));
 assert.ok(java.includes("dp(width),dp(visualHeaderTouchHeight)"));
 assert.ok(dock.includes("body.result-window #shell{padding-top:var(--visual-header-y,0px)!important}"));
 assert.ok(dock.includes("body.result-window #resultHeader .resultModeStack{transform:none!important}"));
});
test("Pokebola rectangle X width height and after-gap are controlled together",()=>{
 const {window,styles}=fixture();
 window.onVisualPrefs({headerOffsetX:12,headerTouchWidth:42,headerTouchHeight:50,headerAfterGap:9});
 for(const [key,value] of [
  ["--visual-header-x","12px"],["--visual-header-touch-width","42px"],
  ["--visual-header-touch-height","50px"],["--visual-header-after","9px"]])
  assert.equal(styles[key],value);
 assert.ok(dock.includes("margin-left:clamp(0px,"));
 assert.ok(dock.includes("margin-bottom:var(--visual-header-after,0px)!important"));
 assert.ok(java.includes("Math.round((dockDp()-width)/2f)+visualHeaderX"));
 assert.ok(java.includes("box.leftMargin=dp(left)"));
});
test("Editor supports precise one-unit adjustments and touch-area guides",()=>{
 for(const label of ["Botão + toque: posição Y (0 = topo)","Botão + toque: posição X",
  "Área clicável: largura","Área clicável: altura","Espaço abaixo do botão"])
  assert.ok(script.includes(label),label);
 assert.ok(script.includes('className="visualFineTune"'));
 assert.ok(script.includes('minus.onclick=()=>step(-1);plus.onclick=()=>step(1)'));
 assert.ok(dock.includes("body.visual-guides.result-window #resultHeader{"));
 assert.ok(dock.includes("body.visual-guides.result-window #shell{"));
});
test("Native constraints and collapsed height agree with actual touch target",()=>{
 assert.ok(java.includes("int[][] limits={{-80,80,0}"));
 assert.ok(java.includes("{-16,16,0},{26,42,35},{24,50,30},{0,36,0}"));
 assert.ok(java.includes('visualHeaderY=o.optInt("headerIconY",0)'));
 assert.ok(java.includes("int min=minResultsHeaderHeightDp();"));
 assert.ok(java.includes("int desired=resultCollapsed?min:"));
 assert.ok(java.includes("resizeResults(minResultsHeaderHeightDp());"));
});
test("silhouette guides follow alpha pixels instead of fixed-sized dashed squares",()=>{
 assert.ok(dock.includes("body.visual-guides.result-window .spriteStage::after{display:none!important}"));
 assert.ok(dock.includes('filter:drop-shadow(0 0 1px #4ce5ff)'));
 assert.ok(dock.includes('body.visual-guides.result-window .spriteStage .spriteFallback{'));
});
test("geometry diagnostic distinguishes the rendered image rectangle from touch rows",()=>{
 const f=dock.split('window.measureResultSpacing=()=>{')[1]?.split('function computeResultLayout(',1)[0]||"";
 assert.ok(f.includes('querySelectorAll("#spawns .spriteStage .sprite")'));
 assert.ok(f.includes("img.complete&&img.naturalWidth>0"));
 assert.ok(f.includes('querySelectorAll("#spawns .spawn")'));
 assert.ok(f.includes("touchGapPx:"));
 assert.ok(f.includes('measurement:'));
 assert.ok(!f.includes("card.")&&!f.includes("locationCoords"));
});
test("compact preset increases artwork size with zero space but keeps saved prefs unchanged",()=>{
 const {window}=fixture();
 const original=window.visualEditorCurrent();
 assert.equal(original.resultGapBetween,31);
 assert.equal(original.resultSpriteScale,100);
 assert.ok(script.includes('compact:{resultGapTop:-6,resultGapBetween:0,resultSpriteScale:130'));
 assert.ok(script.includes('balanced:{resultGapTop:0,resultGapBetween:13,resultSpriteScale:115'));
 assert.ok(script.includes('resultSpriteScale:[70,160]'));
 assert.ok(java.includes('{70,160,100}'));
 window.onVisualPrefs({resultGapBetween:31,resultSpriteScale:100});
 assert.equal(window.visualEditorCurrent().resultGapBetween,31);
});
test("Compact preset keeps artwork inside native sprite column at P M G sizes",()=>{
 const fitted=0.86*1.30;
 for(const size of [35,45,55])assert.ok(size*fitted<=size+8);
 assert.ok(script.includes("resultSpriteScale:[70,160]"));
 assert.ok(script.includes("resultGapBetween:[0,65]"));
});
test("One transparency slider controls independent menu tile fill, border and shadow",()=>{
 const {window,styles}=fixture();
 for(const [percent,alpha,border] of [[0,"1.00","0.45"],[35,"0.65","0.29"],[100,"0.00","0.00"]]){
  window.onVisualPrefs({menuBgMode:"dark",menuTransparency:percent});
  assert.equal(styles["--visual-menu-button-bg"],"rgba(15,19,26,"+alpha+")");
  assert.equal(styles["--visual-menu-bg"],"rgba(15,19,26,"+alpha+")");
  assert.equal(styles["--visual-menu-border"],"rgba(227,233,241,"+border+")");
 }
 assert.equal(styles["--visual-menu-tile-shadow"],"none");
 const css=dock.split("/* UX-MENU-TILES-RESTORE-01:")[1]?.split("</style>")[0]||"";
 assert.ok(css.includes("background:transparent!important;border:0!important;box-shadow:none!important;"));
 assert.ok(css.includes("border:1px solid var(--visual-menu-border,#ffffff48)!important;"));
 assert.ok(css.includes("box-shadow:var(--visual-menu-tile-shadow,0 1px 3px #0006)!important;"));
 assert.ok(script.includes('set("menu-gap",current.menuItemGap+"px")'));
 assert.ok(script.includes('set("menu-button-bg",rgba(current.menuBgMode,current.menuTransparency))'));
 assert.ok(script.includes('set("menu-bg",rgba(current.menuBgMode,current.menuTransparency))'));
 window.onVisualPrefs({menuBgMode:"light",menuTransparency:20});
 assert.equal(styles["--visual-menu-button-bg"],"rgba(255,255,255,0.80)");
 assert.equal(styles["--visual-menu-border"],"rgba(49,69,91,0.36)");
 assert.equal(window.visualEditorCurrent().menuBgMode,"light");
});
test("Modos rail and inline editor inherit the only menu transparency slider",()=>{
 const tail=dock.split("/* VISUAL-MENU-ALPHA-01:")[1]?.split("</style>")[0]||"";
 assert.ok(tail);
 for(const key of [".modeCascadeRail",".modeCascadeEditor"]){
  assert.ok(tail.includes(key),"Missing "+key);
 }
 assert.ok(tail.includes("background:var(--visual-menu-bg,rgba(15,19,26,.65))!important;"));
 assert.ok(tail.includes("border:0!important;box-shadow:none!important;"));
 assert.ok(script.includes('set("menu-bg",rgba(current.menuBgMode,current.menuTransparency))'));
 assert.ok(script.includes('set("menu-button-bg",rgba(current.menuBgMode,current.menuTransparency))'));
 assert.ok(!script.includes('addSegment(panel,"menuBgMode"'));
 const {window,styles}=fixture();
 for(const [mode,transparency,expected] of [
  ["dark",0,"rgba(15,19,26,1.00)"],
  ["dark",35,"rgba(15,19,26,0.65)"],
  ["dark",100,"rgba(15,19,26,0.00)"],
  ["light",0,"rgba(255,255,255,1.00)"],
  ["light",100,"rgba(255,255,255,0.00)"]
 ]){
  window.onVisualPrefs({menuBgMode:mode,menuTransparency:transparency});
  assert.equal(styles["--visual-menu-bg"],expected);
  assert.equal(styles["--visual-menu-button-bg"],expected);
 }
});
test("single transparency controls ordinary submenus without residual band or border",()=>{
 const tail=dock.split("/* VISUAL-MENU-ALPHA-02:")[1]?.split("</style>")[0]||"";
 assert.ok(tail.includes("body.controls-window #choices:not(.visualPanel):not(.modeCascade){"));
 assert.ok(tail.includes("background:var(--visual-menu-bg,rgba(15,19,26,.65))!important;"));
 assert.ok(tail.includes("border:0!important;box-shadow:none!important;"));
 assert.ok(dock.includes("/* VISUAL-MENU-ALPHA-01:"));
 assert.ok(!tail.includes("body.controls-window #choices.visualPanel{"));
 const {window,styles}=fixture();
 for(const transparency of [0,50,100]){
  window.onVisualPrefs({menuTransparency:transparency});
  const alpha=(1-transparency/100).toFixed(2);
  assert.equal(styles["--visual-menu-bg"],"rgba(15,19,26,"+alpha+")");
  assert.equal(styles["--visual-menu-button-bg"],styles["--visual-menu-bg"]);
 }
});
test("light-theme selected actions retain legible ink on colored backgrounds",()=>{
 const tail=dock.split("/* VISUAL-MENU-ALPHA-02:")[1]?.split("</style>")[0]||"";
 for(const part of ["button.modeCascadeConfirm","button.modeCascadeCancel",
   "button.modeCascadeEntry.chosen",".modeAction button.modeApply",
   ".alertModeGroup button.chosen",".uxSegment button.chosen",
   ".locLine button.locActive"]){
  assert.ok(tail.includes(part),part);
 }
 assert.ok(tail.includes("color:#f4fff8!important;"));
 assert.ok(dock.includes('body.controls-window.visual-light-menu #choices:not(.visualPanel) button{'));
 const {window,classes}=fixture();
 window.onVisualPrefs({menuBgMode:"light"});
 assert.equal(classes.has("visual-light-menu"),true);
});
test("Home theme never overwrites independent Menu or Resultados theme",()=>{
 const home=main.split("private void toggleHomeTheme(){")[1]?.split("private FrameLayout buildHome()")[0]||"";
 assert.ok(home.includes('putBoolean("homeLightMode",homeLightMode)'));
 assert.ok(!home.includes('serviceAction("com.lucianotoscano.pokesearchoverlay.SYNC_HOME_THEME")'));
 assert.ok(!java.includes('cleaned.put("menuBgMode",getSharedPreferences'));
 assert.ok(java.includes('private void syncHomeThemeVisual(boolean broadcast){ }'));
 assert.ok(main.includes("homeBackgroundTransparency"));
});
test("Editor visual displays independent scopes and preview touch boundaries",()=>{
 for(const s of ["menuGuides","resultsGuides","Linhas-guia menu: ","Linhas-guia resultados: ","Native.previewVisualArea(tab)"])
  assert.ok(script.includes(s),s);
 assert.ok(java.includes("void previewVisualArea(String area)"));
 assert.ok(dock.includes("visual-preview-menu #menu"));
 assert.ok(dock.includes("visual-preview-results #resultHeader"));
});
test("top-gap can extend to -80px with synchronized Android and editor validation",()=>{
 const {window,styles}=fixture();
 window.onVisualPrefs({resultGapTop:-80});
 assert.equal(window.visualEditorCurrent().resultGapTop,-80);
 assert.equal(styles["--visual-top-gap"],"-80px");
 window.onVisualPrefs({resultGapTop:-100});
 assert.equal(window.visualEditorCurrent().resultGapTop,-80);
 window.onVisualPrefs({resultGapTop:80});
 assert.equal(window.visualEditorCurrent().resultGapTop,80);
 window.onVisualPrefs({resultGapTop:0});
 assert.equal(window.visualEditorCurrent().resultGapTop,0);
 assert.ok(script.includes('resultGapTop:[-80,80]'));
 assert.ok(java.includes('int[][] limits={{-80,80,0}'));
 assert.ok(dock.includes('margin-top:var(--visual-top-gap,0px)!important'));
 assert.ok(script.includes('minus.onclick=()=>step(-1);plus.onclick=()=>step(1)'));
});
test("JSON tab hidden while copy JSON and internal import support remain",()=>{
 const tabs=script.split('const nav=document.createElement("div");nav.className="visualTabs";')[1]?.split("panel.appendChild(nav);")[0]||"";
 assert.ok(tabs.includes('["results","Pokémon"]'));
 assert.ok(tabs.includes('["menu","Menu"]'));
 assert.ok(!tabs.includes('["bg","Fundo"]'));
 assert.ok(!tabs.includes('["export","JSON"]'));
 assert.ok(script.includes('btn(actions,"Copiar JSON"'));
 assert.ok(script.includes('btn(panel,"Importar JSON digitado"'));
});
console.log("PokeSearch temporary visual editor: "+count+" tests passed");

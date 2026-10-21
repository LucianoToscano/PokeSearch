"use strict";
// Visual editor contracts. No Android SDK or external network required.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"../src/main");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const script=read("assets/visual_editor.js");
const dock=read("assets/dock.html");
const java=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
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
});
test("packed preset allows true overlap via lowered row pitch",()=>{
 assert.match(dock,/const pitch=Math\.max\(8,Math\.round\(size\*\.32\)/);
 assert.match(dock,/return pitch; \/\/ Transparent sprite squares may overlap/);
 assert.match(dock,/const sprite=Math\.max\(10,Math\.floor\(size\*factor\)\)/);
 assert.match(script,/compact:\{resultGapTop:0,resultGapBetween:0/);
});
test("invalid imported JSON is ignored and values are clamped",()=>{
 const {window,styles,classes}=fixture();
 window.onVisualPrefs({resultGapBetween:-55,resultsTransparency:800,menuItemGap:-5,
  popupWidth:600,headerIconY:-99,resultsOrientation:"horizontal",menuOrientation:"vertical"});
 const p=window.visualEditorCurrent();
 assert.equal(p.resultGapBetween,0);assert.equal(p.resultsTransparency,100);
 assert.equal(p.popupWidth,330);assert.equal(p.headerIconY,-10);
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
 assert.ok(script.includes("pendingVisualJson=JSON.stringify(current)"));
 assert.ok(script.includes("if(pendingVisualJson&&pendingVisualJson!==incoming)return;"));
 assert.ok(script.includes('if(pendingVisualJson===incoming)pendingVisualJson=""'));
});
test("large header gap is included in native window height",()=>{
 assert.ok(dock.includes('Math.max(0,Number(window.visualPrefs?.resultGapTop)||0)'));
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
 assert.ok(dock.includes('onclick="Native.shiny()"><svg viewBox="0 0 24 24"'));
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
test("bell silent mode has a red diagonal slash, not a colored button",()=>{
 assert.ok(dock.includes('button.classList.toggle("silent",id==="bell"&&generalAlerts&&alertMode==="silent"&&notificationPermissionGranted)'));
 assert.ok(dock.includes('button[data-key="bell"].silent .quickGlyph::after'));
 assert.ok(dock.includes("background:#ff4458;"));
 assert.ok(dock.includes("rotate(-43deg)"));
});
test("legacy toggle icon colors match compact menu without changing IV or results",()=>{
 const css=dock.split("/* UX-ICONS-STATE:")[1]?.split("</style>")[0]||"";
 for(const id of ["sh","star","location","bell"])assert.ok(css.includes("#controls #"+id),id);
 assert.ok(css.includes("#controls #location.locOn{color:#ff5264!important}"));
 assert.ok(css.includes("#controls #bell.generalOn{color:#ffd64b!important}"));
 assert.ok(!css.includes(".ivPct")&&!css.includes(".spawnInfo"));
});
console.log("PokeSearch temporary visual editor: "+count+" tests passed");

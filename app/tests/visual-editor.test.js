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
console.log("PokeSearch temporary visual editor: "+count+" tests passed");

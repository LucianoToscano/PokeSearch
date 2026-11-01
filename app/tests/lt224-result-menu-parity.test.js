"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const dock=fs.readFileSync(path.join(__dirname,"../src/main/assets/dock.html"),"utf8");
const native=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const editor=fs.readFileSync(path.join(__dirname,"../src/main/assets/visual_editor.js"),"utf8");
const finalCss=dock.slice(dock.lastIndexOf("/* LT224: the Pokémon RESULTS"));
assert.ok(finalCss.length>1700,"LT224 high-priority CSS should exist after all older rules");
assert.match(dock,/body\.controls-window\.visual-menu-vertical #quickMenuList \.quickRow,[\s\S]*?width:30px!important/);
assert.match(finalCss,/body\.result-window \.spriteStage\{[\s\S]*?width:30px!important;height:30px!important/);
assert.match(finalCss,/body\.result-window \.spawn,[\s\S]*?height:30px!important/);
assert.match(finalCss,/body\.result-window #spawns\{[\s\S]*?gap:2px!important/);
assert.match(finalCss,/body\.result-window \.spriteStage \.sprite\{[\s\S]*?width:25\.2px!important;height:25\.2px!important/);
assert.match(finalCss,/object-fit:contain!important;object-position:center center!important/);
assert.match(finalCss,/transform:none!important/);
assert.match(finalCss,/body\.result-window\.visual-results-horizontal \.spawn\{[\s\S]*?flex:0 0 calc\(30px \+ var\(--visual-meta-width,0px\)\)!important/);
assert.match(finalCss,/body\.result-window\.visual-results-tiles \.spriteStage::before\{[\s\S]*?width:30px!important;height:30px!important/);
assert.match(finalCss,/body\.result-window:not\(\.visual-results-tiles\) \.spriteStage::before\{[\s\S]*?content:none!important/);
assert.match(finalCss,/pointer-events:none!important/);
assert.match(dock,/document\.documentElement\.style\.setProperty\("--dock",\(resultWindow\?30:spriteSize\+8\)\+"px"\)/);
assert.match(dock,/\(resultWindow\?2:additionalResultGapPx\(vp\.resultGapBetween\)\)\+"px"/);
assert.match(native,/private int resultTileDp\(\)\{return 30;\}/);
assert.match(native,/int perCard=resultTileDp\(\)\+resultMetadataWidthDp/);
assert.match(native,/int gap=2; \/\/ same 2dp gap as quick-menu tiles/);
assert.match(native,/return Math\.max\(38,resultTileDp\(\)\+resultMetadataWidthDp\)/);
assert.match(native,/int headerRail=Math\.max\(38,resultTileDp\(\)\)/);
assert.match(editor,/body\.classList\.toggle\("visual-results-tiles",current\.resultsTileStyle==="card"\)/);
assert.match(editor,/body\.classList\.toggle\("visual-results-horizontal",current\.resultsOrientation==="horizontal"\)/);
assert.match(editor,/resultsTileStyle:"none"/); // Legacy users get bare results by default.
assert.match(native,/getSharedPreferences\(isSecondaryOverlay\(\)\?"prefs_secondary":"prefs",0\)/);
// Run the actual compact layout calculator, not just static string tests.
const begin=dock.indexOf("function computeResultLayout("),end=dock.indexOf("let lastListKey",begin);
assert.ok(begin>0&&end>begin);
const factory=new Function("resultWindow","window","additionalResultGapPx",
 dock.slice(begin,end)+";return computeResultLayout;");
for(const direction of ["vertical","horizontal"]){
 for(const mode of ["none","card"]){
  const layout=factory(true,{visualPrefs:{resultsOrientation:direction,resultsTileStyle:mode}},()=>0);
  const f=layout(Array.from({length:10},(_,i)=>({id:i})),45,700,false,false);
  assert.deepEqual(f.rows,Array(10).fill(30));
  assert.equal(f.sprite,30);
  assert.equal(f.total,318); // 10x30 + 9x2
  assert.equal(f.visibleCount,10);
 }
}
const small=factory(true,{visualPrefs:{resultsOrientation:"vertical",resultsTileStyle:"card"}},()=>0);
assert.equal(small([{id:1}],60,200,false,false).total,30);
console.log("LT224 PASS: identical menu-size 30dp result tiles, 2dp gaps, 84% centered sprites, all 4 visual combinations");

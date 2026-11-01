"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const dock=fs.readFileSync(path.join(__dirname,"../src/main/assets/dock.html"),"utf8");
const native=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const editor=fs.readFileSync(path.join(__dirname,"../src/main/assets/visual_editor.js"),"utf8");
const finalCss=dock.slice(dock.lastIndexOf("/* LT225: menu button equivalence only at P."));
assert.ok(finalCss.length>1700,"LT225 scoped final CSS after legacy styles");
assert.match(dock,/body\.controls-window\.visual-menu-vertical #quickMenuList \.quickRow,[\s\S]*?width:30px!important/);
assert.match(finalCss,/body\.result-window \.spriteStage\{[\s\S]*?width:var\(--result-tile-size,30px\)!important/);
assert.match(finalCss,/body\.result-window \.spawn,[\s\S]*?height:var\(--result-tile-size,30px\)!important/);
assert.match(finalCss,/body\.result-window #spawns\{[\s\S]*?gap:2px!important/);
assert.match(finalCss,/body\.result-window \.spriteStage \.sprite\{[\s\S]*?width:var\(--result-art-size,26\.4px\)!important/);
assert.match(finalCss,/object-fit:contain!important;object-position:center center!important/);
assert.match(finalCss,/transform:none!important/);
assert.match(finalCss,/body\.result-window\.visual-results-horizontal \.spawn\{[\s\S]*?flex:0 0 calc\(var\(--result-tile-size,30px\) \+ var\(--visual-meta-width,0px\)\)!important/);
assert.match(finalCss,/body\.result-window\.visual-results-tiles \.spriteStage::before\{[\s\S]*?width:var\(--result-tile-size,30px\)!important/);
assert.match(finalCss,/body\.result-window:not\(\.visual-results-tiles\) \.spriteStage::before\{[\s\S]*?content:none!important/);
assert.match(finalCss,/pointer-events:none!important/);
assert.match(dock,/setProperty\("--dock",\(resultWindow\?resultLayout\.sprite:spriteSize\+8\)\+"px"\)/);
assert.match(dock,/setProperty\("--result-art-size",\(resultLayout\.sprite\*0\.88\)\.toFixed\(1\)\+"px"\)/);
assert.match(dock,/\(resultWindow\?2:additionalResultGapPx\(vp\.resultGapBetween\)\)\+"px"/);
assert.match(native,/private int resultTileDp\(\)\{[\s\S]*?return spriteSize==55\?50:spriteSize==45\?40:30;/);
assert.match(native,/int perCard=resultTileDp\(\)\+resultMetadataWidthDp/);
assert.match(native,/int gap=2; \/\/ same 2dp gap as quick-menu tiles/);
assert.match(native,/return Math\.max\(38,resultTileDp\(\)\+resultMetadataWidthDp\)/);
assert.match(native,/int headerRail=Math\.max\(38,resultTileDp\(\)\)/);
assert.match(editor,/P 30×30 dp · M 40×40 dp · G 50×50 dp/);
assert.match(editor,/Sprites centralizadas a 88%/);
assert.match(editor,/body\.classList\.toggle\("visual-results-tiles",current\.resultsTileStyle==="card"\)/);
assert.match(editor,/body\.classList\.toggle\("visual-results-horizontal",current\.resultsOrientation==="horizontal"\)/);
assert.match(editor,/resultsTileStyle:"none"/);
assert.match(native,/getSharedPreferences\(isSecondaryOverlay\(\)\?"prefs_secondary":"prefs",0\)/);
// Execute actual layout function for 3 native presets × 2 orientations × 2 backgrounds.
const begin=dock.indexOf("function computeResultLayout("),end=dock.indexOf("let lastListKey",begin);
assert.ok(begin>0&&end>begin);
const factory=new Function("resultWindow","window","additionalResultGapPx",
 dock.slice(begin,end)+";return computeResultLayout;");
for(const direction of ["vertical","horizontal"]){
 for(const mode of ["none","card"]){
  const layout=factory(true,{visualPrefs:{resultsOrientation:direction,resultsTileStyle:mode}},()=>0);
  for(const [nativeSize,tile] of [[35,30],[45,40],[55,50]]){
   const out=layout(Array.from({length:10},(_,i)=>({id:i})),nativeSize,700,false,false);
   assert.deepEqual(out.rows,Array(10).fill(tile));
   assert.equal(out.sprite,tile);
   assert.equal(out.total,tile*10+2*9);
   assert.equal(out.visibleCount,10);
   const art=Number((tile*.88).toFixed(1));
   assert.ok(art>=tile*.85&&art<=tile*.90);
  }
 }
}
console.log("LT224/225 PASS: P30/M40/G50 result tiles, 2dp spacing, centered 88% sprites in four layouts");

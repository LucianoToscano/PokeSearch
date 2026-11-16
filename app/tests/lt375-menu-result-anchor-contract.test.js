"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const service=fs.readFileSync("app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java","utf8");
const html=fs.readFileSync("app/src/main/assets/dock.html","utf8");
const method=(start,end)=>service.slice(service.indexOf(start),service.indexOf(end,service.indexOf(start)));
const place=method("private void updateMenuPosition(){","private void resizeMenu(");
const width=method("private int resultWidthDp(){","private String resultDisplayOptionsJson()");
const list=method("private void positionResultsUnderPokeball(boolean applyLayout)","private void updateResultsWidth()");
const draw=html.slice(html.indexOf("function draw(){"),html.indexOf("function draw(){")+3200);
assert.match(place,/rowY=params\.y\+\(!visualMenuVertical\?\(dp\(30\)-dp\(menuBase\)\)\/2:0\)/,
  "Toolbar centre derives from Pokeball and its own height, not visible results");
assert.match(place,/new int\[\]\[\]\{otherMenu\}/,
  "Only the other visible toolbar can displace the menu");
assert.doesNotMatch(place,/visibleResults|resultParams|resultRoot|resultCollapsed/,
  "Results must never move the menu, whether visible or hidden");
assert.match(place,/if\(!visualMenuVertical&&visualMenuOffsetX==0\)/,
  "The default tuck must not override a saved visual-editor X offset");
assert.match(place,/menuParams\.x\+=menuLeft\?dp\(10\):-dp\(10\)/,
  "Horizontal gap is 10dp closer to the real Pokeball on either side");
assert.match(width,/return resultTileDp\(\)\+resultMetadataWidthDp;/,
  "No unused 38dp results-header minimum when info is hidden");
assert.doesNotMatch(width,/Math\.max\(38,resultTileDp\(\)\+resultMetadataWidthDp\)/);
assert.match(draw,/const metaWidth=metadataVisible\?96:highlightWidth/,
  "Optional text retains the exact old 96px width when requested");
assert.match(draw,/const resultContentWidth=\(resultLayout\?\.sprite\|\|spriteSize\)\+metaWidth/,
  "Purple guide and native window width follow content only");
assert.match(draw,/Native\.resizeResultsMetadata\(metaWidth\)/,
  "Actual visibility and width are still bridged to the Android overlay");
assert.match(list,/ResultsSpacingPolicy\.DEFAULT_TOP_GAP_PX/,
  "Top 2px results gap is completely untouched");
assert.match(list,/ResultsSpacingPolicy\.centeredSpriteOffsetDp/,
  "Sprites remain centered relative to native Pokeball");
assert.match(html,/body\.result-window \.spriteStage\s*\{/,
  "Sprite-specific layout rules must remain");
console.log("LT375 menu anchored independently + results guide shrinks without touching sprites: PASS");

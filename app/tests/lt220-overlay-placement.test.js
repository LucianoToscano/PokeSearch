"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const source=path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay");
const native=fs.readFileSync(path.join(source,"OverlayService.java"),"utf8");
const pure=fs.readFileSync(path.join(source,"OverlayPlacementPolicy.java"),"utf8");
const html=fs.readFileSync(path.join(__dirname,"../src/main/assets/dock.html"),"utf8");

// The independent P1/P2 menu windows only exchange rectangle geometry.
assert.match(native,/private static final int\[\]\[\] OPEN_MENU_BOUNDS=new int\[2\]\[\]/);
assert.match(native,/OPEN_MENU_BOUNDS\[isSecondaryOverlay\(\)\?0:1\]/);
assert.match(native,/OPEN_MENU_BOUNDS\[isSecondaryOverlay\(\)\?1:0\]=null/);
assert.match(native,/if\(!show\)clearMenuBounds\(\)/);
assert.match(native,/@Override public void onDestroy\(\)\{\s*clearMenuBounds\(\)/);

// Menus avoid THEIR OWN sprite window and the OTHER PokeBall's toolbar,
// without resizing either. Recalculate as result geometry changes.
assert.match(native,/int\[\] visibleResults=null/);
assert.match(native,/int\[\] otherMenu=otherMenuBounds\(\)/);
assert.match(native,/OverlayPlacementPolicy\.avoid\([\s\S]*?new int\[\]\[\]\{visibleResults,otherMenu\}/);
assert.match(native,/publishMenuBounds\(menuParams\.x,rowY,width,rowHeight\)/);
assert.match(native,/if\(menuExpanded\)updateMenuPosition\(\)/);
assert.match(pure,/static int\[\] avoid\(/);
assert.match(pure,/long distance=Math\.abs\(dx\)\+Math\.abs\(dy\)/);
assert.match(pure,/return winner!=null\?winner:new int\[\]\{startX,startY\}/);
assert.doesNotMatch(pure,/(?:setScale|setSpriteSize|setWidth|setHeight)\(/);

// Horizontal sprites use every physically fitting column at existing
// dimensions. 10 sprites still wrap when all cannot fit without shrinkage.
assert.match(native,/int fit=Math\.max\(1,\(usable\+gap-2\)\/Math\.max\(1,perCard\+gap\)\)/);
assert.match(native,/int columns=Math\.max\(1,Math\.min\(Math\.min\(10,count\(\)\),fit\)\)/);
assert.match(html,/body\.result-window\.visual-results-horizontal #spawns\{[\s\S]*?flex-wrap:wrap!important/);
assert.match(html,/body\.result-window\.visual-results-horizontal \.spawn\{[\s\S]*?flex:0 0 calc\(var\(--dock\) \+ var\(--visual-meta-width,0px\)\)!important/);
assert.match(native,/getSharedPreferences\(isSecondaryOverlay\(\)\?"prefs_secondary":"prefs",0\)/);
console.log("LT220 PASS: independent collision-aware P1/P2 menus, original tile/sprite sizes, responsive result columns");

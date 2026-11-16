"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const base="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const java=n=>fs.readFileSync(base+n+".java","utf8");
const dock=fs.readFileSync("app/src/main/assets/dock.html","utf8");
const editor=fs.readFileSync("app/src/main/assets/visual_editor.js","utf8");
const service=java("OverlayService");
const guide=java("OverlayGestureTour");
const candy=java("RareCandyOverlayService");
const search=java("PgsAutoClickService");
const home=java("MainActivity");
const match=(source,regex,why)=>assert.match(source,regex,why);
// Minior must not shrink below the native standardized P/M/G sprite slot.
match(dock,/const artFit=dexNumber===94\?0\.67:0\.86/,"Minior uses standard 86% CSS fit; existing Gengar policy remains");
assert.doesNotMatch(dock,/artFit=\/\^\\s\*minior/,"removed special Minior 67% art shrink");
match(dock,/const minior=Number\(String\(sourceCard/,"fallback is tied to source species");
match(dock,/psSourceMeasured!=="1"/,"only unmeasured contours qualify for Minior fallback");
match(dock,/setProperty\("--tile-alpha-zoom","1\.65"\)/,"bounded fallback for unreadable Minior silhouette");
match(dock,/window\.PokeSearchSpriteScale\?\.applyResultTile/,"exact scale measurement still precedes fallback");
match(dock,/window\.PokeSearchSpriteScale\?\.enhanceProviderTile/,"exact native geometry may override fallback");
match(dock,/width:var\(--result-art-size,21\.12px\)!important/,"same P/M/G artwork slot for everybody");
// Measurements on narrow toolbar tiles must be compact and legible.
match(editor,/const label=\(node,compact=false\)/,"compact measurements supported");
match(editor,/Math\.round\(rect\.height\)\+\(compact\?"":" px"\)/,"no overflowing px suffix on 30px tiles");
match(editor,/forEach\(node=>label\(node,true\)\)/,"per-tile compact badges");
match(dock,/body\.visual-measurements\.result-window #shell::after\{/,"result-column black measurement plate removed");
match(dock,/font:700 7\.4px\/9px monospace!important/,"toolbar labels sized for tile geometry");
// Transparency remains 50% default; blur is system-aware, not a fake screenshot.
match(editor,/menuTransparency:50,menuBlur:4/,"50% default stays intact");
match(editor,/crossWindowBlurAvailable/,"editor indicates native blur support");
match(service,/nativeMenuBlurAvailable\(\)/,"Android blur availability guarded");
match(service,/android\.os\.Build\.VERSION\.SDK_INT>=31/,"Android 12+ only");
match(service,/wm\.isCrossWindowBlurEnabled\(\)/,"system-disabled blur detected");
match(service,/WindowManager\.LayoutParams\.FLAG_BLUR_BEHIND/,"native behind-window blur flag");
match(service,/menuParams\.setBlurBehindRadius\(radius\)/,"native blur slider applied");
match(service,/visualMenuBlurPx=Math\.max\(0,Math\.min\(16,o\.optInt\("menuBlur",4\)\)\)/,
 "blur value validated from saved visual preferences");
match(service,/updateNativeMenuBlur\(\);/,"native flag recomputed after changed preferences");
// Only Pokébola first-use tutorial; Search/Candy code preserved for future.
match(guide,/POKEBALL_DONE_KEY="gestureCoachV3PokeballCompleted"/,"same shared install completion key");
match(home,/Rever tutorial da Pokébola/,"manual replay targets just the ball");
assert.doesNotMatch(search,/handler\.postDelayed\(\(\)->beginGestureTour\(false\)/);
assert.doesNotMatch(candy,/main\.postDelayed\(\(\)->beginGestureTour\(false\)/);
// Ring and fingertip use screen-consistent coordinates, not the old hitbox.
match(service,/grip\.getWidth\(\)-art/,"visible original Pokébola icon rect");
match(service,/menuPanel\.getLocationOnScreen\(windowOrigin\)/,"native refresh anchor coordinates");
match(guide,/desired\.offset\(-origin\[0\],-origin\[1\]\)/,"unified canvas coordinate system");
match(guide,/c\.scale\(\.72f,\.72f\)/,"compact hand with clear index finger");
match(guide,/Fingernail and knuckle folds/,"finger and hand anatomy explicit");
console.log("LT375d PASS: Minior, measurements, native blur guard, one ball tutorial, real icon spotlight");

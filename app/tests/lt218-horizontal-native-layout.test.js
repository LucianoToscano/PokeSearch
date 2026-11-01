"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const base=path.join(__dirname,"../src/main");
const editor=fs.readFileSync(path.join(base,"assets/visual_editor.js"),"utf8");
const dock=fs.readFileSync(path.join(base,"assets/dock.html"),"utf8");
const java=fs.readFileSync(path.join(base,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const editorPreset=editor.slice(editor.indexOf("function usePreset(name){"),editor.indexOf("function heading(",editor.indexOf("function usePreset(name){")));
const nativeBridge=java.slice(java.indexOf("@JavascriptInterface public void applyTopHorizontalPreset(String json)"),
 java.indexOf("@JavascriptInterface public void applyTopHorizontalLayout()",java.indexOf("@JavascriptInterface public void applyTopHorizontalPreset(String json)")));
assert.ok(editorPreset.includes("current=normalize({...current,...PRESETS[name]})"),"new directions set together");
assert.ok(editorPreset.includes("Native.applyTopHorizontalPreset(pendingVisualJson)"),"native receives new visual preferences synchronously");
assert.ok(editorPreset.includes("clearTimeout(saveTimer)"),"cancel 100ms delayed save that previously raced native reposition");
assert.ok(editorPreset.includes("if(name===\"topHorizontal\""),"ordinary presets must not move the Pokéball");
const topBranch=editorPreset.slice(editorPreset.indexOf("if(name===\"topHorizontal\"&&window.Native&&Native.applyTopHorizontalPreset"));
assert.ok(!topBranch.slice(0,topBranch.indexOf("}else{")).includes("saveSoon()"),"atomic branch cannot enqueue deferred save");
const before=nativeBridge.indexOf("OverlayService.this.saveVisualPrefs(normalized.toString())");
const after=nativeBridge.indexOf("OverlayService.this.applyTopHorizontalLayout()");
assert.ok(before>=0&&after>before,"the native menu orientation must be SAVED before native menu geometry");
assert.ok(nativeBridge.includes('"horizontal".equals(normalized.optString("menuOrientation"))'),
 "only real horizontal presets may move the native window");
assert.ok(nativeBridge.includes('"vertical".equals(normalized.optString("resultsOrientation"))'),
 "vertical results required by preset");
assert.ok(nativeBridge.includes("handler.post(()->{"),"same handler ordering");
assert.ok(java.includes('getSharedPreferences(isSecondaryOverlay()?"prefs_secondary":"prefs",0)'),
 "P1/P2 remain separately persisted");
assert.ok(java.includes('width=Math.min(width,roomRight)'),"native width bounded beside left Pokéball");
assert.ok(java.includes("positionResultsUnderPokeball(false)"),"results anchored under dock");
assert.ok(editor.includes('body.classList.toggle("visual-menu-horizontal",current.menuOrientation==="horizontal")'),
 "horizontal mode has explicit body CSS identity");
assert.ok(editor.includes('body.classList.toggle("visual-menu-vertical",current.menuOrientation==="vertical")'),
 "old vertical mode preserved");
assert.ok(editor.includes('body.classList.toggle("visual-results-horizontal",current.resultsOrientation==="horizontal")'),
 "result direction remains independently selectable");
const css=dock.slice(dock.lastIndexOf("/* LT218: native Topo Horizontal"),dock.indexOf("</style>"));
assert.ok(css.length>1000,"horizontal override exists after legacy CSS");
assert.match(css,/visual-menu-horizontal #quickMenuList[^\{]*\{[^}]*height:34px!important/s);
assert.match(css,/grid-template-columns:repeat\(12,minmax\(0,1fr\)\)!important/);
assert.match(css,/visual-menu-horizontal #quickRows,[^\{]*\{[^}]*display:contents!important/s);
assert.match(css,/visual-menu-horizontal #quickMenuList \.quickRow,[^\{]*\{[^}]*width:100%!important;[^}]*height:30px!important/s);
assert.match(css,/result-window:not\(\.visual-results-horizontal\) #spawns\{[^}]*flex-direction:column!important/s);
const menuCss=css.slice(0,css.indexOf("/* LT218 — ORIENTATION IS POSITION"));
assert.ok(!menuCss.includes("overflow-y:auto"),"horizontal menu is never scrollable");
assert.match(css,/visual-menu-vertical #quickMenuList[^\{]*\{[^}]*grid-template-columns:30px!important/s);
assert.match(css,/visual-menu-vertical #quickMenuList \.quickRow,[^\{]*\{[^}]*width:30px!important/s);
assert.ok(dock.includes("body.controls-window.visual-menu-vertical #quickRows"),"legacy list remains supported");
// Screenshot regression: never allow the tall 232px list after applying horizontal preset.
assert.match(java,/private int visualMenuBaseDp\(\)\{[\s\S]*?return visualMenuVertical\?384:MENU_BASE_DP;/);
assert.match(java,/int menuBase=visualMenuBaseDp\(\)/);
assert.ok(editorPreset.includes("pendingVisualJson=JSON.stringify(current)"));
console.log("PASS LT218: atomic native orientation save; one-row 12-slot horizontal ribbon; independent vertical results; old modes retained");

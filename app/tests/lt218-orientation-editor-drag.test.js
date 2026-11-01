"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const asset=path.join(__dirname,"../src/main/assets");
const v=fs.readFileSync(path.join(asset,"visual_editor.js"),"utf8");
const dock=fs.readFileSync(path.join(asset,"dock.html"),"utf8");
const native=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");

// The LT217 bug: preset moved the dock before its async 100ms visualPrefs save.
// New bridge handles both operations on the Android UI handler in this order.
assert.match(v,/if\(name==="topHorizontal"&&window\.Native&&Native\.applyTopHorizontalPreset\)/);
assert.match(v,/Native\.applyTopHorizontalPreset\(pendingVisualJson\)/);
assert.match(native,/@JavascriptInterface public void applyTopHorizontalPreset\(String json\)/);
const preset=native.match(/@JavascriptInterface public void applyTopHorizontalPreset\(String json\)\{([\s\S]*?)\n        \}/)?.[1]||"";
assert.ok(preset.indexOf("saveVisualPrefs(normalized.toString())")>=0);
assert.ok(preset.indexOf("applyTopHorizontalLayout()")>preset.indexOf("saveVisualPrefs(normalized.toString())"));
assert.match(preset,/!"horizontal"\.equals\(normalized\.optString\("menuOrientation"\)\)/);
assert.match(preset,/!"vertical"\.equals\(normalized\.optString\("resultsOrientation"\)\)/);

// Each button keeps same 30x30 dimension; changing orientation only moves
// its grid position, never stretches a button to a 330px-wide horizontal bar.
assert.match(native,/return visualMenuVertical\?384:MENU_BASE_DP/);
assert.match(native,/visualMenuVertical\?\s*Math\.max\(1,Math\.min\(34,screenWidthDp\(\)-8\)\)/);
const finalCss=dock.slice(dock.indexOf("/* LT218 — ORIENTATION IS POSITION"));
assert.ok(finalCss.includes("grid-template-rows:repeat(12,30px)!important"));
assert.ok(finalCss.includes("grid-template-columns:30px!important"));
assert.match(finalCss,/visual-menu-vertical #quickMenuList \.quickRow,[\s\S]*?width:30px!important/);
assert.match(finalCss,/visual-menu-vertical #quickMenuList \.quickRow,[\s\S]*?height:30px!important/);
assert.match(finalCss,/not\(\.visual-menu-vertical\) #quickMenuList[\s\S]*?grid-auto-flow:column!important/);
assert.match(finalCss,/not\(\.visual-menu-vertical\) #quickMenuList \.quickRow,[\s\S]*?height:30px!important/);
assert.match(dock,/body\.result-window\.visual-results-horizontal #spawns/);
assert.match(v,/\[\["vertical","Vertical"\],\["horizontal","Horizontal"\]\]/);
assert.match(v,/\[\["horizontal","Horizontal"\],\["vertical","Vertical"\]\]/);
assert.match(native,/getSharedPreferences\(isSecondaryOverlay\(\)\?"prefs_secondary":"prefs",0\)/);

// Draggable visual editor lives in its own WindowManager popup; its header
// handles touch, sliders/buttons stay interactive. The whole native hitbox
// is clamped, not just the HTML contents (fixes right-edge clipping).
assert.match(v,/\.classList\.add\("visualEditorDragHandle"\)/);
assert.match(v,/handle\.addEventListener\("pointerdown"/);
assert.match(v,/ev\.target\.closest\("button,input,textarea,select"\)/);
assert.match(v,/handle\.addEventListener\("pointermove"/);
assert.match(v,/Native\.moveVisualEditorBy\(dx,dy\)/);
assert.match(finalCss,/\.choiceHeader\.visualEditorDragHandle\{[\s\S]*?touch-action:none!important/);
assert.match(native,/@JavascriptInterface public void moveVisualEditorBy\(int dxDp,int dyDp\)/);
assert.match(native,/private void moveVisualEditorBy\(int dxDp,int dyDp\)/);
assert.match(native,/!"visual"\.equals\(popupKind\)/);
assert.match(native,/\.putInt\("visualEditorX"/);
assert.match(native,/\.putInt\("visualEditorY"/);
assert.match(native,/int savedX=prefs\.getInt\("visualEditorX",-1\)/);
assert.match(native,/int savedY=prefs\.getInt\("visualEditorY",-1\)/);
assert.match(native,/Math\.min\(b\.height,Math\.max\(dp\(40\),m\.heightPixels-2\*margin\)\)/);
assert.match(finalCss,/body\.popup-window\.controls-window #choices\.visualPanel\{/);

// Preserve 10-result cap, login/shiny/prefs, favorites and ordinary popup.
assert.doesNotMatch(v.match(/topHorizontal:\{[^}]+\}/)?.[0]||"",/filters|login|trainer|accounts|hidden|favorite/);
console.log("LT218 PASS: atomic preset, fixed-size 30dp tiles both axes, draggable clamped editor, P1/P2 isolation");

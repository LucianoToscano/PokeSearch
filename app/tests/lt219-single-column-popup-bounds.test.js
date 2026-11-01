"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const d=fs.readFileSync(path.join(__dirname,"../src/main/assets/dock.html"),"utf8");
const j=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const end=d.indexOf("</style>");
const start=d.indexOf("/* LT218 — ORIENTATION IS POSITION");
const css=d.slice(start,end);
assert.ok(start>0,"final override exists after legacy CSS");
assert.match(css,/visual-menu-vertical #quickMenuList[^\{]*\{[^}]*display:flex!important;flex-flow:column nowrap!important/s,
 "no CSS grid implicit second column");
assert.doesNotMatch(css,/grid-template-rows:repeat\(12,30px\)/,
 "do not recreate 12 explicit grid rows which split footer into another column");
assert.match(css,/visual-menu-vertical #quickMenuList[^\{]*\{[^}]*width:34px!important/s);
assert.match(css,/visual-menu-vertical #quickMenuList \.quickRow,[^\{]*\{[^}]*width:30px!important/s);
assert.match(css,/visual-menu-vertical #quickMenuList \.quickRow,[^\{]*\{[^}]*height:30px!important/s);
assert.match(css,/visual-menu-vertical #quickRows,[\s\S]*?display:contents!important/s);
assert.match(css,/visual-menu-vertical #quickMenuList[^\{]*\{[^}]*gap:2px!important/s);
assert.ok(12*30+11*2<=384,"all 12 original 30px icons fit in one 384px panel");
assert.match(d,/if\(controlsWindow\)h=window\.visualPrefs\?\.menuOrientation==="vertical"\?384:34/,
 "WebView/native height must agree");
assert.match(d,/const baseHeight=window\.visualPrefs\?\.menuOrientation==="vertical"\?384:34/,
 "popup trigger offset must agree");
assert.match(j,/private int visualMenuBaseDp\(\)\{[\s\S]*?return visualMenuVertical\?384:MENU_BASE_DP;/);
assert.match(j,/private int menuDp\(\)\{return visualMenuVertical\?[\s\S]*?Math\.min\(34,screenWidthDp\(\)-8\)/);
assert.match(j,/if\("visual"\.equals\(popupKind\)\|\|"appearance"\.equals\(popupKind\)\)/,
 "both Personalização and the editor must fit screen");
assert.match(j,/safeH=Math\.min\(b\.height,Math\.max\(dp\(40\),m\.heightPixels-2\*margin\)\)/);
assert.match(j,/if\(savedY<0&&b\.y\+safeH>m\.heightPixels-margin\)/);
assert.match(j,/y=Math\.max\(margin,Math\.min\(m\.heightPixels-safeH-margin,y\)\)/);
assert.match(j,/int savedX=visual\?prefs\.getInt\("visualEditorX",-1\):-1/);
assert.match(j,/private void moveVisualEditorBy\(int dxDp,int dyDp\)/);
assert.match(d,/body\.result-window\.visual-results-horizontal #spawns/);
assert.match(j,/getSharedPreferences\(isSecondaryOverlay\(\)\?"prefs_secondary":"prefs",0\)/);
console.log("LT219 PASS: one column 12 fixed tiles, correct height, Personalização and Editor fully clamped");

"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs");
const base="app/src/main/";
const java=name=>fs.readFileSync(base+"java/com/lucianotoscano/pokesearchoverlay/"+name+".java","utf8");
const menu=java("PgsAutoMenus"),style=java("PgsAutoMenuStyle");
const svc=java("PgsAutoClickService"),pulse=java("PgsAutoTapIndicator");
const dock=fs.readFileSync(base+"assets/dock.html","utf8");
const editor=fs.readFileSync(base+"assets/visual_editor.js","utf8");
const prefs=JSON.parse(fs.readFileSync("docs/LT347_MENU_VISUAL_REFERENCE.json","utf8"));
assert.equal(prefs.schema,"pokesearch-visual-v1");
assert.equal(prefs.menuTransparency,50);
assert.equal(prefs.menuBlur,4);
assert.equal(prefs.menuOrientation,"horizontal");
assert.equal(prefs.menuBgMode,"dark");
assert.equal(prefs.menuItemGap,0);
assert.equal(prefs.headerTouchWidth,35);
assert.equal(prefs.headerTouchHeight,30);
assert.match(editor,/set\("menu-button-bg",rgba\(current.menuBgMode,current.menuTransparency\)\)/);
assert.match(dock,/background:#28292cce!important/);
assert.match(dock,/height:30px!important/);
assert.match(style,/CELL_DP=30, ART_DP=16, BASE_GAP_DP=2, CORNER_DP=5/);
assert.match(style,/getSharedPreferences\("prefs",Context.MODE_PRIVATE\)/);
assert.match(style,/getString\("visualPrefsJson","{}"\)/);
for(const key of ["menuTransparency","menuBlur","menuItemGap","menuOffsetX",
 "menuOffsetY","gearMenuGap","menuOrientation","menuBgMode","popupWidth","popupHeight"])
 assert.ok(style.includes('"'+key+'"'),"missing canonical setting "+key);
assert.match(menu,/bar.setBackgroundColor\(Color.TRANSPARENT\)/);
assert.match(menu,/PgsAutoMenuStyle\.read\(context\)/);
assert.match(menu,/PgsAutoMenuStyle.CELL_DP/);
assert.match(menu,/visual.vertical\?LinearLayout.VERTICAL:LinearLayout.HORIZONTAL/);
assert.match(menu,/applyNativeBlur\(lp,visual.menuBlur\)/);
assert.doesNotMatch(menu,/menuAlphaPercent|TOOL_HEIGHT_DP=46|bar.setBackground\(bg\(panelFill\(/);
for(const x of ["R.drawable.pgs_menu_customize","R.drawable.pgs_shiny_spark",
 "R.drawable.pgs_menu_close","toolbar.getLayoutParams() instanceof WindowManager.LayoutParams"])
 assert.ok(menu.includes(x),x);
assert.match(pulse,/FLAG_NOT_TOUCHABLE/);
assert.match(pulse,/FLAG_NOT_FOCUSABLE/);
assert.match(pulse,/TYPE_ACCESSIBILITY_OVERLAY/);
assert.match(pulse,/setDuration\(380L\)/);
assert.match(pulse,/showTapIndicator",true/);
assert.match(svc,/tapIndicator.show\(x,y\)/);
assert.match(svc,/tapIndicator\.clear\(\)/);
assert.doesNotMatch(pulse,/dispatchGesture|ACTION_CLICK/);
assert.match(svc,/passengerPromptPresent\(\)/);
assert.match(svc,/PgsAutoMapReadiness\.analyze\(bitmap\)/);
console.log("LT347: canonical menu JSON, P1 tile parity and touch-through feedback PASS");

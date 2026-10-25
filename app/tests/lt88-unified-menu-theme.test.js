"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../src/main");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const editor=read("assets/visual_editor.js");
const html=read("assets/dock.html");
const native=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const favorites=read("java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java");
const test=(name,run)=>{run();console.log("PASS LT88 unified menus "+name);};
test("new installations start at 50% and preserve prior chosen preferences",()=>{
 assert.match(editor,/menuTransparency:50,menuBlur:4/);
 assert.match(native,/\{0,100,50\},\{0,16,4\}/);
 assert.match(native,/normalizeVisualPrefs\(raw\)/);
 assert.match(native,/putString\("visualPrefsJson",visualPrefsJson\)/);
});
test("one blur slider ranges 0–16 and publishes to every WebView",()=>{
 assert.match(editor,/menuBlur:\[0,16\]/);
 assert.match(editor,/set\("menu-blur",current\.menuBlur\+"px"\)/);
 assert.match(editor,/addSlider\(panel,"menuBlur","Desfoque dos painéis"," px"\)/);
 assert.match(native,/broadcastVisualPrefs\(\)/);
});
test("one surface theme rules every menu; cascade holders remain unpainted",()=>{
 const block=html.slice(html.indexOf("LT88-STANDARD-MENU-01"));
 for(const selector of ["#choices:not(.modeCascade):not(.filterCascade)",
  "#choices.modeCascade .modeCascadeRail","#choices.modeCascade .modeCascadeEditor",
  "#choices.filterCascade .filterCascadeRail","#choices.filterCascade .filterCascadeEditor",
  "#choices.filterCascade .generalPresetFlyout"])
  assert.ok(block.includes(selector),selector);
 assert.ok(block.includes("background:var(--visual-menu-bg,rgba(15,19,26,.50))!important"));
 assert.ok(block.includes("backdrop-filter:blur(var(--visual-menu-blur,4px))!important"));
 assert.ok(block.includes("body.controls-window #choices.modeCascade,"));
 assert.ok(block.includes("background:transparent!important;border:0!important;box-shadow:none!important"));
});
test("location paste and copy are NOT in header, but are beside radius",()=>{
 const l=html.split("function renderLocationChoices(){")[1]?.split("let requestedInterval=null",1)[0]||"";
 assert.ok(l.includes('title.appendChild(make("span","","Localização"))'));
 assert.ok(l.includes("label.append(labelName,paste,copy,radiusWrap)"));
 assert.ok(!l.includes("title.append(paste,copy)"));
 assert.ok(l.includes('const copy=make("button","locCopy"'));
 const css=html.slice(html.indexOf("LT88-STANDARD-LOCATION-01"));
 assert.ok(css.includes("grid-template-columns:29px 29px 75px 65px"));
 assert.ok(css.includes(".locRadiusRow>.locPaste"));
 assert.ok(css.includes(".locRadiusRow>.locCopy"));
});
test("native favorites use the same 50% alpha, optional blur and nonmodal dialog",()=>{
 assert.ok(favorites.includes('prefs.optInt("menuTransparency",50)'));
 assert.ok(favorites.includes('prefs.optInt("menuBlur",4)'));
 assert.ok(favorites.includes('prefs.optString("menuBgMode","dark")'));
 assert.ok(favorites.includes("new int[]{panelColor,panelColor}"));
 assert.ok(favorites.includes("window.setBackgroundBlurRadius(dp(activity,blurRadius))"));
 assert.ok(favorites.includes("FLAG_NOT_TOUCH_MODAL"));
});

"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const base=path.join(__dirname,"../src/main");
const dock=fs.readFileSync(path.join(base,"assets/dock.html"),"utf8");
const tone=fs.readFileSync(path.join(base,
 "java/com/lucianotoscano/pokesearchoverlay/OverlayQuickMenus.java"),"utf8");
const native=fs.readFileSync(path.join(base,
 "java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const css=dock.split("</style>")[0];
const preset=dock.slice(dock.indexOf("function renderGeneralPresetControls("),
 dock.indexOf("function renderExtraFilters("));
const location=dock.slice(dock.indexOf("function renderLocationChoices(){"),
 dock.indexOf("let requestedInterval=null"));
const assertIt=(label,fn)=>{fn();console.log("PASS LT88 R8 "+label);};
assertIt("Filtro title toggles just Padrão, Filtro 1 and Filtro 2",()=>{
 assert.match(dock,/heading\.appendChild\(make\("button","filterHeaderTitle","Filtro"\)\)/);
 assert.match(preset,/heading\.onclick=\(\)=>/);
 assert.match(preset,/generalPresetDefault","Padrão"/);
 assert.match(preset,/for\(let slot=1;slot<=2;slot\+\+\)/);
 assert.doesNotMatch(preset,/generalPresetTitle","Filtros salvos"/);
 assert.doesNotMatch(preset,/generalPresetHint","Toque/);
 assert.match(preset,/presetGlyph\("save"\)/);
 assert.match(preset,/presetGlyph\("delete"\)/);
 assert.match(css,/stroke:#fff!important/);
 assert.match(preset,/Native\.saveGeneralFilterPreset\(slot\)/);
 assert.match(preset,/Native\.deleteGeneralFilterPreset\(slot\)/);
 assert.match(native,/for\(int slot=1;slot<=3;slot\+\+\)/); // third slot data remains intact
});
assertIt("Location uses four rows and preserves copy paste slider and 0–1000",()=>{
 assert.match(location,/label\.append\(actions\)/);
 assert.match(location,/sliderRow\.append\(slide\)/);
 assert.match(location,/clipboard\.append\(paste,copy\)/);
 assert.doesNotMatch(location,/label\.append\(slide,actions\)/);
 assert.match(location,/panel\.append\(title,fieldRow,sliderRow,label,message\)/);
 assert.doesNotMatch(location,/panel\.append\(title,fieldRow,slide,label,message\)/);
 assert.match(location,/Native\.pasteLocationCoords\(\)/);
 assert.match(location,/Native\.copyLocationCoords\(field\.value\)/);
 assert.match(location,/slide\.max="1000"/);
 assert.match(location,/radiusField\.max="1000"/);
 assert.match(location,/Native\.setLocation\(true,wantedCoords,wantedRadius\)/);
 assert.match(css,/LT99 compact Samsung Location/);
});
assertIt("Tone submenus reflect saved choice and last preview selection",()=>{
 assert.match(tone,/getString\(/);
 assert.match(tone,/final int\[\] selection=\{savedIndex\}/);
 assert.match(tone,/markSelected\.run\(\)/);
 assert.match(tone,/b\.setSelected\(checked\)/);
 assert.match(tone,/checked\?"✓  ":"    "/);
 assert.match(tone,/b\.setContentDescription\(name\+\(checked/);
 assert.match(tone,/toneButtons\.get\(selectedRow\)\.getTop\(\)/);
 assert.match(tone,/PREF_FAVORITE_TONE/);
 assert.match(tone,/!tonePrefs\.contains\(toneKey\)/);
 assert.match(tone,/PokeSoundLibrary\.favoriteDefaultUri\(context\)\.toString\(\)/);
 assert.match(tone,/PREF_GENERAL_TONE/);
 assert.match(tone,/stop\.run\(\);selection\[0\]=index/);
});

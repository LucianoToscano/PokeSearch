"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const assets=path.join(__dirname,"../src/main/assets");
const editor=fs.readFileSync(path.join(assets,"visual_editor.js"),"utf8");
const dock=fs.readFileSync(path.join(assets,"dock.html"),"utf8");
const native=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
// Independent orientation keys already exist: avoid adding a competing switch.
assert.match(editor,/resultsOrientation:"vertical",menuOrientation:"horizontal"/);
assert.match(editor,/topHorizontal:\{menuOrientation:"horizontal",resultsOrientation:"vertical"/);
assert.match(editor,/addSegment\(panel,"resultsOrientation","Resultados"/);
assert.match(editor,/addSegment\(panel,"menuOrientation","Orientação"/);
assert.match(editor,/btn\(presets,"Topo Horizontal"/);
assert.match(editor,/btn\(quickPreset,"↗ Topo Horizontal"/);
assert.match(editor,/if\(name==="topHorizontal"&&window\.Native&&Native\.applyTopHorizontalLayout\)/);
assert.match(editor,/if\(!Object\.prototype\.hasOwnProperty\.call\(PRESETS,name\)\)return/);
assert.match(editor,/current=normalize\(\{\.\.\.current,\.\.\.PRESETS\[name\]\}\)/);
assert.match(editor,/applyVisual\(\);saveSoon\(\);renderVisualEditor\(\)/);
assert.match(editor,/body\.classList\.toggle\("visual-menu-vertical",current\.menuOrientation==="vertical"\)/);
assert.match(editor,/body\.classList\.toggle\("visual-results-horizontal",current\.resultsOrientation==="horizontal"\)/);
assert.match(dock,/body\.result-window\.visual-results-horizontal #spawns/);
assert.match(dock,/body\.controls-window\.visual-menu-vertical #quickMenuList/);
assert.match(native,/getSharedPreferences\(isSecondaryOverlay\(\)\?"prefs_secondary":"prefs",0\)/,
 "P1/P2 visual layout persists in separate preferences");
assert.match(native,/\.putString\("visualPrefsJson",visualPrefsJson\)/,
 "existing JSON save keeps orientation fields");
assert.match(native,/@JavascriptInterface public void applyTopHorizontalLayout\(\)/,
 "only explicit button invokes Android reposition");
assert.match(native,/private void applyTopHorizontalLayout\(\)/);
assert.match(native,/\.putInt\("pokeballX",Math\.round\(params\.x\/screen\.density\)\)/);
assert.match(native,/\.putInt\("pokeballY",Math\.round\(params\.y\/screen\.density\)\)/);
assert.match(native,/positionResultsUnderPokeball\(false\)/);
assert.match(native,/int roomRight=screen-params\.x-dp\(dockDp\(\)\)-gap-dp\(4\)/);
assert.match(native,/if\(!visualMenuVertical&&params\.x<=dp\(24\)&&roomRight>=dp\(160\)\)/);
assert.match(native,/width=Math\.min\(width,roomRight\)/);
const preset=editor.match(/topHorizontal:\{([^}]+)\}/)?.[1]||"";
assert.ok(!/mode|filters|trainer|account|quickPrefs|hidden|order|shiny|watch/.test(preset),
 "preset must never alter account, filters, menu visibility or favorite choices");
const menu=editor.match(/function usePreset\(name\)\{([\s\S]*?)\n\}/)?.[1]||"";
assert.ok(menu.includes('if(name==="topHorizontal"'),"dock moves only for named preset");
assert.ok(!/resultsCollapsed|shiny|menuHidden/.test(menu));
console.log("LT217 PASS: independent 4-way orientations, top-left preset, native menu fit, P1/P2 state");

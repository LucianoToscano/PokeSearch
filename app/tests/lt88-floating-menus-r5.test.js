"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const base=path.join(__dirname,"../src/main");
const read=p=>fs.readFileSync(path.join(base,p),"utf8");
const dock=read("assets/dock.html");
const service=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const quick=read("java/com/lucianotoscano/pokesearchoverlay/OverlayQuickMenus.java");
const favorite=read("java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java");
const test=(name,fn)=>{fn();console.log("PASS LT88 R5 "+name)};
test("filters saved: Filtro title is the toggle, two slots and thin SVG icon actions",()=>{
 const ui=dock.slice(dock.indexOf("function renderGeneralPresetControls("),
  dock.indexOf("if(typeof window!==\"undefined\")window.onGeneralPresetStatus="));
 assert.ok(dock.includes('heading.appendChild(make("button","filterHeaderTitle","Filtro"))'));
 assert.ok(ui.includes('heading.setAttribute("aria-expanded",String(generalPresetExpanded))'));
 assert.ok(ui.includes('heading.onclick=()=>'));
 assert.ok(ui.includes('generalPresetDefault","Padrão"'));
 assert.ok(ui.includes('for(let slot=1;slot<=2;slot++)'));
 assert.ok(ui.includes('generalPresetSave'));
 assert.ok(ui.includes('save.appendChild(presetGlyph("save"))'));
 assert.ok(ui.includes('remove.appendChild(presetGlyph("delete"))'));
 assert.ok(ui.includes('Native.clearGeneralFilterPreset()'));
 assert.ok(ui.includes("Native.saveGeneralFilterPreset(slot)"));
 assert.ok(ui.includes("Native.deleteGeneralFilterPreset(slot)"));
 assert.ok(!ui.includes("setTimeout(save,650)"));
 assert.ok(!ui.includes("generalPresetHint"));
});
test("using a profile hides the saved pane but keeps the general Filters menu",()=>{
 assert.ok(dock.includes("generalPresetExpanded=false;filterFocus=\"\";"));
 assert.ok(service.includes("new Bridge().setSearchConfig(value);"));
 const method=service.split("@JavascriptInterface public void loadGeneralFilterPreset")[1]
 ?.split("@JavascriptInterface public void patchSearchFilters")[0]||"";
 assert.ok(method.includes("requestGeneralFilterPresets()"));
 assert.ok(!method.includes("closeIndependentPopup()"));
});
test("Padrão neutral clears IV limits and extras but preserves Shiny and location",()=>{
 const block=service.split("@JavascriptInterface public void clearGeneralFilterPreset()")[1]
 ?.split("@JavascriptInterface public void loadGeneralFilterPreset")[0]||"";
 assert.ok(block.includes('reset.put("mode","percent")'));
 assert.ok(block.includes('reset.put("percentMin",0).put("percentMax",100)'));
 assert.ok(block.includes('reset.put("clearPokemonSelection",true)'));
 assert.ok(block.includes("new Bridge().setSearchConfig(reset.toString())"));
 assert.ok(!block.includes("shiny=false")&&!block.includes("locationEnabled=false"));
});
test("location saved slots and name/help removed without deleting stored data",()=>{
 const block=dock.slice(dock.indexOf("function renderLocationChoices(){"),dock.indexOf("let requestedInterval=null"));
 for(const absent of ["locSavedName","locSavedSlots","locSlotTools","locHelp",
  "requestSavedSearchLocations","saveSearchLocation("])
   assert.ok(!block.includes(absent),absent);
 assert.ok(block.includes("label.append(actions)"));
 assert.ok(block.includes("clipboard.append(paste,copy)"));
 assert.ok(block.includes("panel.append(title,fieldRow,sliderRow,label,message)"));
 assert.ok(block.includes("paste.onclick=()=>Native.pasteLocationCoords()"));
 assert.ok(block.includes("Native.copyLocationCoords(field.value)"));
 assert.ok(service.includes("savedSearchLocationV1_"));
});
test("favorite native popup stays nonmodal and anchored beside floating bar",()=>{
 assert.ok(service.includes("showFavoritePicker(menuParams==null?-1:"));
 assert.ok(favorite.includes("placeBelow=spaceBelow>=actualHeight"));
 assert.ok(favorite.includes("FLAG_NOT_TOUCH_MODAL"));
});
test("tones and Pix are native overlay menus, no forced home",()=>{
 const tone=service.split("private void requestAlertTonePicker(String target)")[1]
 ?.split("@JavascriptInterface public void pickAlertTone")[0]||"";
 const pix=service.split("@JavascriptInterface public void openPix()")[1]
 ?.split("@JavascriptInterface public void openSettings()")[0]||"";
 assert.ok(tone.includes("OverlayQuickMenus.showTone("));
 assert.ok(pix.includes("OverlayQuickMenus.showPix("));
 assert.ok(!tone.includes("startActivity(intent)"));
 assert.ok(!pix.includes("startActivity(intent)"));
 assert.ok(quick.includes("TYPE_APPLICATION_OVERLAY"));
 assert.ok(quick.includes("FLAG_NOT_TOUCH_MODAL"));
 assert.ok(quick.includes("PokeSoundLibrary.size()"));
 assert.ok(quick.includes("MediaPlayer.create"));
 assert.ok(quick.includes("PokeSoundLibrary.soundUri"));
 assert.ok(quick.includes("PREF_FAVORITE_TONE"));
 assert.ok(quick.includes("support_pix_qr_original"));
 assert.ok(quick.includes("PixSupport.PAYLOAD"));
});

"use strict";
/* LT63 Samsung screenshot contracts. Run with Node 18+, no browser mocks. */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const dir=path.join(__dirname,"..");
const dock=fs.readFileSync(path.join(dir,"src/main/assets/dock.html"),"utf8");
const service=fs.readFileSync(path.join(dir,"src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const picker=fs.readFileSync(path.join(dir,"src/main/java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java"),"utf8");
const geometry=fs.readFileSync(path.join(dir,"src/main/java/com/lucianotoscano/pokesearchoverlay/PopupTouchGeometry.java"),"utf8");
const notes=JSON.parse(fs.readFileSync(path.join(dir,"src/main/assets/release_notes.json"),"utf8"));
const filters=dock.split("function renderExtraFilters(panel,make){")[1]?.split("function renderFilterPicker(")[0]||"";
const location=dock.split("function renderLocationChoices(){")[1]?.split("let requestedInterval",1)[0]||"";
const actions=dock.split("function renderFiltersChoices(){")[1]?.split("function renderInfoChoices()",1)[0]||"";
let passed=0,failed=0;
function check(name,fn){try{fn();passed++;console.log("PASS LT63 "+name)}
 catch(e){failed++;console.error("FAIL LT63 "+name+" "+e.message)}}
check("A sort five official options in one lateral editor",()=>{
 const a=filters.split("const option=(key,label)=>{")[1].split("const numericInput=")[0];
 for(const s of ["Despawn (longest)","CP (highest)","IV % (highest)","Level (highest)","Distance (nearest)"])
  assert.ok(a.includes(s),s);
 assert.ok(a.includes('field(label,list)'));assert.ok(a.includes('classList.toggle("chosen",saved===value)'));
 assert.ok(!a.includes("renderFilterPicker("));assert.ok(!a.includes("uxPanel("));
});
check("B sex radio four symbols, Any single-selection",()=>{
 for(const s of ['["Any","Male","Female","Genderless"]','v==="Any"?"⚥"','v==="Male"?"♂"','v==="Female"?"♀"','"⚲"','role","radiogroup"','role","radio"','value==="Any"?[]:[resolved]'])
  assert.ok(filters.includes(s),s);
 assert.ok(dock.includes('grid-template-columns:repeat(4,29px)!important'));
});
check("C Size seven multi and per-editor width",()=>{
 assert.ok(filters.includes('["XXS","XS","S","M","L","XL","XXL"]'));
 assert.ok(filters.includes('modeDraft[multiKey]=[...selected]'));
 assert.ok(dock.includes('grid-template-columns:repeat(7,29px)!important'));
 assert.ok(dock.includes('Sexo:116,Forma:216'));assert.ok(dock.includes('Tamanho:230'));
 assert.ok(!dock.includes("width:320px!important;max-width:none!important}"));
 assert.ok(!dock.includes("width:230px!important;max-width:none!important;min-width:0!important}"));
});
check("D narrow Min Max retain draft, bounded PC/Level",()=>{
 assert.ok(filters.includes('input.value=String(modeDraft[key]??"")'));
 assert.ok(filters.includes('input.placeholder=key.endsWith("Min")?"Min":"Max"'));
 assert.ok(filters.includes('input.max=level?"35":"99999"'));
 assert.ok(filters.includes('numericConfirmButton(make,[minKey,maxKey],label)'));
 assert.ok(actions.includes('Number(low)>Number(high)'));
 assert.ok(dock.includes('flex:0 0 45px!important'));
});
check("E icon-only reusable actions and subtle selected rail",()=>{
 assert.ok(dock.includes('function makeDockAction(kind,label)'));
 assert.ok(dock.includes('stroke-width","1.8"'));
 assert.ok(actions.includes('makeDockAction("apply","Aplicar filtros")'));
 assert.ok(actions.includes('makeDockAction("clear","Limpar filtros")'));
 assert.ok(actions.includes('makeDockAction("cancel","Cancelar alterações")'));
 assert.ok(dock.includes('box-shadow:inset 2px 0 #7ccea3!important'));
});
check("F Location paste, slider, radius and SVG actions",()=>{
 for(const s of ['title.appendChild(paste)','fieldRow.append(field)','slide.min="0"','slide.max="1000"',
  'radiusField.min="0"','radiusField.max="1000"','radiusField.dataset.locationDraft="true"',
  'makeDockAction("apply","Aplicar localização")','makeDockAction("clear","Limpar localização")',
  'panel.append(title,fieldRow,slide,label,message)'])
  assert.ok(location.includes(s),s);
 assert.ok(location.includes('Native.setLocation(true,wantedCoords,wantedRadius)'));
});
check("G Favorite counter between title and X, grid 10x5",()=>{
 assert.ok(picker.includes('header.addView(title,titleLp)'));
 assert.ok(picker.includes('header.addView(count,countLp)'));
 assert.ok(picker.includes('count.setGravity(Gravity.CENTER)'));
 assert.ok(picker.includes('count.setText("Selecionados "+size+"/50")'));
 assert.ok(picker.includes("sprites.setColumnCount(10)"));
 assert.ok(picker.includes("sprites.setRowCount(5)"));
});
check("H modes and refresh overlay anchored without second top offset",()=>{
 assert.ok(dock.includes('function renderModeChoices()'));
 assert.ok(dock.includes('const offsets={raw:67,percent:90,gl:113,ul:136}'));
 assert.ok(dock.includes('body.popup-window.controls-window #choices.periodCompact[data-panel-kind="period"]'));
 assert.ok(service.includes('PopupTouchGeometry.alignRail('));
 assert.ok(service.includes('openIndependentPopup(kind,triggerDp,triggerYDp)'));
});
check("I native results overlap protection and reflow after dragging",()=>{
 assert.ok(geometry.includes('static Bounds avoidResult('));
 assert.ok(geometry.includes('static boolean overlaps('));
 assert.ok(service.includes('PopupTouchGeometry.avoidResult(b,new PopupTouchGeometry.Bounds('));
 assert.ok(service.includes('positionIndependentPopup(); // Re-evaluate against new results bounds.'));
 assert.ok(service.includes('WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL'));
});
check("J existing shiny, PvP, toolbar and WebView bridge preserved",()=>{
 assert.ok(dock.includes('["gl","GL"],["ul","UL"]'));
 assert.ok(dock.includes('shinyPending'));
 assert.ok(dock.includes('Native.patchSearchFilters(JSON.stringify(delta))'));
 assert.ok(service.includes('replaceActiveFilterSearch()'));
 assert.ok(service.includes('com.lucianotoscano.pokesearchoverlay'));
});
check("K release metadata declares LT63, source identity unchanged",()=>{
 const v=notes.releases.find(r=>r.minVersionCode===54261);
 assert.ok(v&&v.title.includes("0.00.63"));
 const gradle=fs.readFileSync(path.join(dir,"build.gradle.kts"),"utf8");
 assert.ok(gradle.includes('namespace = "com.lucianotoscano.pokesearchoverlay"'));
 assert.ok(gradle.includes('applicationId = "com.lucianotoscano.pokesearch"'));
});
console.log("LT63 "+passed+" PASS / "+failed+" FAIL");
if(failed)process.exitCode=1;

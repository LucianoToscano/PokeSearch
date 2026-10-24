"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const dock=fs.readFileSync("app/src/main/assets/dock.html","utf8");
const picker=fs.readFileSync("app/src/main/java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java","utf8");
const native=fs.readFileSync("app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java","utf8");
const geometry=fs.readFileSync("app/src/main/java/com/lucianotoscano/pokesearchoverlay/PopupTouchGeometry.java","utf8");
let passed=0;
function check(name,fn){fn();passed++;console.log("PASS LT63 "+name);}
check("filters keep Ordenar options inside their editor",()=>{
 const code=dock.split("function renderExtraFilters(panel,make){")[1].split("function renderFilterPicker(")[0];
 assert.ok(code.includes('const list=make("div","filterOptionList")'));
 assert.ok(code.includes('item.classList.toggle("chosen",chosen)'));
 assert.ok(code.includes('patchSelectedFilterKeys([key])'));
 assert.ok(!code.includes("renderFilterPicker(key,label,choices)"));
});
check("Forma remains in same cascading filter popup",()=>{
 const code=dock.split("function renderExtraFilters(panel,make){")[1].split("function renderFilterPicker(")[0];
 assert.ok(code.includes('box.append(chosen,search,results);field("Forma",box)'));
 assert.ok(code.includes('results.id="officialFormItems"'));
});
check("filter editors dynamically follow the chosen filter",()=>{
 assert.ok(dock.includes('width:calc(80px + var(--filter-editor-width,134px))!important'));
 assert.ok(dock.includes('width:var(--filter-editor-width,134px)!important'));
 assert.ok(dock.includes("Ordenar:122,PC:114"));
});
check("filter cascades do not draw a duplicate dark backing",()=>{
 assert.ok(dock.includes("/* LT63 SAMSUNG CASCADE:"));
 assert.ok(dock.includes("background:transparent!important;box-shadow:none!important;overflow:visible!important;"));
 assert.ok(dock.includes('filterOptionEntry.chosen'));
});
check("numeric Min and Max are tight and do not use spin-button padding",()=>{
 assert.ok(dock.includes("flex:0 0 37px!important;width:37px!important"));
 assert.ok(dock.includes("appearance:textfield!important"));
});
check("filter footer actions use delicate SVG icon only",()=>{
 const code=dock.split('const actionIcon=(cls,label,icon)=>')[1].split("const apply=actionIcon(")[0];
 assert.ok(code.includes('svg.setAttribute("stroke-width","1.8")'));
 assert.ok(dock.includes('const cancel=actionIcon("filterIconAction filterCancel"'));
});
check("location has one shared title, paste and coordinates row",()=>{
 const location=dock.split("function renderLocationChoices(){")[1].split("let requestedInterval",1)[0];
 assert.ok(location.includes('fieldRow.append(field);title.appendChild(fieldRow)'));
 assert.ok(location.includes('panel.append(title,slide,label,message)'));
 assert.ok(location.includes('label.appendChild(actions)'));
});
check("location uses tiny Apply/Clear SVGs and correct radius range",()=>{
 const loc=dock.split("function renderLocationChoices(){")[1].split("let requestedInterval",1)[0];
 assert.ok(loc.includes('const apply=make("button","locSave locationIconAction")'));
 assert.ok(loc.includes('const clear=make("button","locHide locationIconAction")'));
 assert.ok(loc.includes('slide.min="0";slide.max="1000"'));
 assert.ok(dock.includes("flex:0 0 58px!important;width:58px!important"));
});
check("refresh interval stays aligned with the independent native window",()=>{
 assert.ok(dock.includes('body.popup-window #choices.periodCompact[data-panel-kind="period"]'));
 assert.ok(dock.includes("top:0!important;bottom:auto!important;left:0!important;right:auto!important"));
});
check("favorites header centers count and raises sprite grid",()=>{
 assert.ok(picker.includes('count.setGravity(Gravity.CENTER)'));
 assert.ok(picker.includes('header.addView(count,new LinearLayout.LayoutParams(0,dp(activity,28),1))'));
 assert.ok(picker.includes('count.setText("Selecionados "+size+"/50")'));
 assert.ok(picker.includes('searchParams.setMargins(0,dp(activity,3),0,dp(activity,4))'));
});
check("native popup protects live results without blocking whole screen",()=>{
 assert.ok(native.includes('PopupTouchGeometry.avoidResults('));
 assert.ok(geometry.includes('static Bounds avoidResults('));
 assert.ok(geometry.includes('return best==null?popup:best;'));
});
console.log("LT63 Samsung cascade UI: "+passed+"/"+passed+" checks passed");

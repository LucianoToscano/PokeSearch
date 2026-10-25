"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const source=fs.readFileSync(path.join(__dirname,"../src/main/assets/dock.html"),"utf8");
const css=source.split("</style>")[0];
const block=css.slice(css.indexOf("/* LT87 FILTER SURFACES:"));
const js=source.slice(source.indexOf("function renderGeneralPresetControls("),source.indexOf("function renderExtraFilters("));
const makeCase=(label,fn)=>{fn();console.log("PASS LT87 "+label);};
makeCase("a themed background overrides the old transparent popup selector",()=>{
 const historical=css.lastIndexOf("body.popup-window.controls-window #choices.filterCascade.filterCascadeOpen[data-panel-kind=\"filters\"] .filterCascadeEditor{");
 const final=css.indexOf("/* LT87 FILTER SURFACES:");
 assert.ok(final>historical);
 assert.ok(block.includes("body.popup-window.controls-window #choices.filterCascade.filterCascadeOpen .filterCascadeEditor"));
 assert.ok(block.includes("background:var(--visual-menu-bg,rgba(15,19,26,.65))!important"));
 assert.ok(block.includes("border:1px solid var(--visual-menu-border,#ffffff48)!important"));
 assert.ok(block.includes("box-shadow:var(--visual-menu-tile-shadow,0 1px 3px #0006)!important"));
});
makeCase("rail and editor use the same user's visual opacity and color, not a fixed dark patch",()=>{
 for(const x of ["#choices.filterCascade .filterCascadeRail","#choices.filterCascade .filterCascadeEditor",
   "#choices.filterCascade .generalPresetFlyout"])
  assert.ok(block.includes(x),x);
 assert.ok(!block.includes("background:#26313f"));
 assert.ok(block.includes("color:var(--visual-menu-fg,#f2f7fc)!important"));
 assert.ok(block.includes("body.controls-window.visual-light-menu"));
});
makeCase("outer popup stays transparent and does not eat external screen touches",()=>{
 assert.ok(block.includes('background:transparent!important;'));
 assert.ok(block.includes("pointer-events:none!important;"));
 assert.ok(block.includes(".filterCascadeRail,"));
 assert.ok(block.includes("pointer-events:auto!important;"));
 assert.ok(block.includes("body.controls-window #choices.filterCascade .filterCascadeRail{position:absolute!important}"));
});
makeCase("three-slot saved filters flyout does not overlap the live filter editor",()=>{
 assert.match(js,/if\(generalPresetExpanded\)filterFocus=""/);
 assert.match(source,/panel\.classList\.toggle\("filterPresetOpen",generalPresetExpanded\)/);
 assert.match(source,/generalPresetExpanded=false;modeScrollTop=0;renderFiltersChoices\(\)/);
 assert.ok(block.includes("filterCascade.filterPresetOpen"));
 assert.ok(source.includes("renderGeneralPresetControls(rail,make)"));
});
makeCase("background fix retains mobile selector widths, seven sizes and preferences",()=>{
 assert.match(source,/function filterCascadeEditorWidth\(label\)/);
 assert.match(source,/\bTamanho:182\b/);
 assert.match(source,/let generalPresetExpanded=false,generalPresetSaved=\[false,false,false\]/);
 assert.match(source,/if\(selected==="Forma"\)refreshOfficialFormList\(\)/);
 assert.match(source,/renderFiltersChoices\(\);/);
});
console.log("LT87 FILTER SURFACES 5/5 PASS");

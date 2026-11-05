"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"../src/main/assets");
const detail=fs.readFileSync(path.join(root,"detail.html"),"utf8");
const dock=fs.readFileSync(path.join(root,"dock.html"),"utf8");
const inline=detail.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(inline,"detail JavaScript present");
new (require("node:vm").Script)(inline);
// 1) A zero-result label is tied to the sprite axis, not the result column.
assert.match(dock,/body\.result-window #empty\{box-sizing:border-box!important;[\s\S]*?width:var\(--sprite\)!important/);
assert.ok(dock.includes('empty.style.display=emptyResult&&(!resultWindow||!resultDisplayOptions.count)?'),
  "never show two zero badges when the optional count is enabled");
assert.ok(dock.includes('empty.textContent=emptyResult&&'),
  "show 0 only for a settled, empty search");
// 2) Mega has a fixed-size official icon before the text, no Mega prefix in the visible name.
assert.match(inline,/nameChip\.appendChild\(emblem\);\s*const speciesLabel=document\.createElement\("span"\)/);
assert.match(inline,/speciesLabel\.textContent=String\(best\.name\|\|""\)/);
assert.ok(inline.includes('nameChip.appendChild(speciesLabel);'));
assert.ok(detail.includes('#rankLine .psCompactSpeciesName{display:block'));
assert.ok(inline.includes('nameChip.dataset.psName=best.name'),
  "canonical Mega identity stays intact for detail and rank actions");
// 3) A crossed-swords legacy recommendation icon is not shown before data verification.
assert.ok(inline.includes('btn.textContent=prior?.icon||"🗡"'));
assert.ok(inline.includes('btn.textContent=hasLegacy?"⚔️":"🗡"'));
assert.ok(inline.includes('if(complete){'),"verified move status gates the legacy switch");
assert.ok(inline.includes('const legacy=move.status==="elite"||move.status==="legacy"'));
// 4) Simulator uses the existing card's one visible scrollbar; no nested height cutoff.
assert.ok(detail.includes('#psMetricPanel{max-height:none!important'));
assert.ok(detail.includes('#panel.metricOpen{overflow-y:auto!important'));
assert.ok(detail.includes('classList?.add?.("metricOpen")'));
assert.ok(detail.includes('classList?.remove?.("metricOpen")'));
assert.ok(detail.includes('#psMetricPanel .psCpFormStepper select{flex:1 1 0!important'));
assert.ok(detail.includes('#psMetricPanel .psCpSimResultRow strong{white-space:normal!important'));
console.log("LT252: zero alignment, Mega-first label, verified legacy action, full CP simulator PASS");

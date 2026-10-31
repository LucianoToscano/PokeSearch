"use strict";
// LT207: Location cooldown reference is compact, and the search-radius
// slider shows a temporary *hypothetical* distance reference, not a timer.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const dock=fs.readFileSync(path.join(__dirname,"../src/main/assets/dock.html"),"utf8");
const refStart=dock.indexOf("const LOCATION_COOLDOWN_REFERENCE=Object.freeze([");
const refEnd=dock.indexOf("let locationDraftBeforeCooldown=null;",refStart);
assert.ok(refStart>0&&refEnd>refStart,"reference and tier helper found");
const context={};
vm.runInNewContext(dock.slice(refStart,refEnd)+";this.lookup=locationCooldownReferenceForKm;",context);
const lookup=value=>JSON.parse(JSON.stringify(context.lookup(value)));
for(const [km,range,wait] of [
 [0,"< 10 m","0s"],[1,"1 - 4 km","2m"],[4,"1 - 4 km","2m"],
 [5,"5 - 9 km","6m"],[9,"5 - 9 km","6m"],
 [10,"10 - 24 km","11m"],[24,"10 - 24 km","11m"],
 [25,"25 - 29 km","14m"],[29,"25 - 29 km","14m"],
 [30,"30 - 64 km","22m"],[64,"30 - 64 km","22m"],
 [65,"65 - 80 km","25m"],[80,"65 - 80 km","25m"],
 [81,"81 - 99 km","35m"],[99,"81 - 99 km","35m"],
 [100,"100 - 249 km","45m"],[249,"100 - 249 km","45m"],
 [250,"250 - 499 km","1h"],[415,"250 - 499 km","1h"],
 [499,"250 - 499 km","1h"],[500,"500 - 749 km","1h 15m"],
 [749,"500 - 749 km","1h 15m"],[750,"750 - 999 km","1h 30m"],
 [999,"750 - 999 km","1h 30m"],[1000,">= 1000 km","2h"]
])assert.deepEqual(lookup(km),[range,wait],"tier at "+km+" km");
assert.deepEqual(lookup(-50),["< 10 m","0s"]);
assert.deepEqual(lookup(2500),[">= 1000 km","2h"]);
const css=dock.split("/* LT207 LOCATION REFERENCE:")[1]?.split("/* LT203: upstream Shiny")[0]||"";
assert.ok(css,"compact CSS exists");
assert.match(css,/locationPanel\.locationCooldownTable/);
assert.match(css,/max-height:min\(370px,var\(--popup-room,400px\)\)!important/);
assert.match(css,/locCooldownEntry\{[\s\S]*?padding:1px 5px!important/);
assert.match(css,/overflow-x:hidden!important;overflow-y:auto!important/);
assert.match(css,/\.locCooldownPreview\.is-visible/);
const editor=dock.split("function renderLocationChoices(){")[1]?.split("let requestedInterval=null;")[0]||"";
assert.ok(editor.includes('sliderRow.append(slide)'));
assert.ok(editor.includes('sliderRow.append(preview)'));
assert.ok(editor.includes('slide.oninput=()=>{radiusField.value=slide.value;radiusField.dataset.locationDraft="true";}'));
assert.ok(editor.includes('slide.addEventListener("input",showLocationCooldownPreview)'));
assert.ok(editor.includes("slide.addEventListener(\"pointerdown\",showLocationCooldownPreview)"));
assert.ok(editor.includes("showLocationCooldownPreview();"));
assert.ok(editor.includes('slide.setAttribute("aria-valuetext",km+" km de raio de busca")'));
const previewBody=editor.split("const showLocationCooldownPreview=()=>{")[1]?.split("slide.addEventListener(")[0]||"";
assert.ok(previewBody.includes("locationCooldownReferenceForKm(km)"));
for(const forbidden of ["Native.setLocation(","Native.refresh(","Native.startCooldown(","Native.openPopup("])
 assert.ok(!previewBody.includes(forbidden),"preview must not call "+forbidden);
assert.ok(editor.includes("apply.onclick=submit"));
assert.ok(editor.includes("clear.onclick=disable"));
console.log("PASS LT207: complete tiers, compact popup, accessible non-invasive slider preview");

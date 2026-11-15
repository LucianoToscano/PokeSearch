"use strict";
/* LT350 static guard. Runtime/screenshot approval is a separate physical gate. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const app=path.resolve(__dirname,"../src/main");
const read=p=>fs.readFileSync(path.join(app,p),"utf8");
const css=read("assets/overlay_design_tokens.css");
const dock=read("assets/dock.html");
const candy=read("assets/rare_candy_controls.html");
const native=read("java/com/lucianotoscano/pokesearchoverlay/OverlayVisualTheme.java");
const pgs=read("java/com/lucianotoscano/pokesearchoverlay/PgsAutoMenuStyle.java");
const quick=read("java/com/lucianotoscano/pokesearchoverlay/OverlayQuickMenus.java");
const service=read("java/com/lucianotoscano/pokesearchoverlay/RareCandyOverlayService.java");
const ref=JSON.parse(fs.readFileSync(path.resolve(__dirname,"../../docs/LT350_OVERLAY_REFERENCE_1080.json"),"utf8"));

for(const [key,px,dp] of [
 ["tile-size",30,"TILE_DP"],["art-size",16,"ART_DP"],
 ["gap",2,"GAP_DP"],["tile-radius",5,"RADIUS_DP"]
]){
 assert.ok(css.includes("--ps-overlay-"+key+":"+px+"px;"));
 assert.ok(native.includes("static final int "+dp+"="+px+";"));
}
for(const page of [dock,candy]){
 assert.ok(page.includes("overlay_design_tokens.css"));
 assert.ok(page.includes("var(--ps-overlay-tile-size)"));
 assert.ok(page.includes("var(--ps-overlay-gap)"));
}
assert.ok(dock.includes("var(--ps-overlay-tile-radius)"));
assert.ok(candy.includes("var(--ps-overlay-art-size)"));
assert.ok(pgs.includes("OverlayVisualTheme.TILE_DP"));
assert.ok(pgs.includes("OverlayVisualTheme.read(c)"));
assert.ok(quick.includes("OverlayVisualTheme.panelFill"));
assert.ok(quick.includes("OverlayVisualTheme.panelBorder"));
assert.ok(service.includes("OverlayVisualTheme.read(this)"));
assert.ok(native.includes('getString("visualPrefsJson","{}")'));
assert.ok(native.includes("255f*(100-transparency(prefs))/100f"));
assert.equal(ref.referenceWidthPx,1080);
assert.deepEqual(ref.barButtonPx,[87,77]);
assert.equal(ref.barGapPx,9);
assert.equal(ref.popover.radiusPx,13);
assert.equal(ref.controls.maxPx,78);
assert.equal(ref.controls.closePx,48);
assert.equal(ref.controls.checkboxMaxPx,24);
assert.equal(ref.status,"NEEDS_PHYSICAL_CALIBRATION");
console.log("LT350 PASS: shared CSS/native metrics and owner 1080 screenshot contract");

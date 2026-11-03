"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"../src/main");
const dock=fs.readFileSync(path.join(root,"assets/dock.html"),"utf8");
const native=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const secondary=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java"),"utf8");
const editor=fs.readFileSync(path.join(root,"assets/visual_editor.js"),"utf8");
const framed="body.result-window.visual-results-tiles .spriteStage::before";
const bare="body.result-window:not(.visual-results-tiles)";
const start=dock.lastIndexOf("/* LT227: truly frameless results.");
assert.ok(start>0, "latest frameless rules must be last CSS override");
const end=dock.indexOf("</style>",start);
assert.ok(end>start, "frameless rules must be in CSS");
const css=dock.slice(start,end);
for(const target of ["#spawns",".spawn",".spriteStage"]){
 assert.ok(css.includes(bare+" "+target),"frameless selector missing for "+target);
}
for(const directive of ["background:transparent!important","background-image:none!important","border:0!important","outline:0!important","box-shadow:none!important","backdrop-filter:none!important"]){
 assert.ok(css.includes(directive),"frameless reset missing "+directive);
}
for(const pseudo of [".spawn::before",".spawn::after",".spriteStage::before",".spriteStage::after"]){
 assert.ok(css.includes(pseudo),"pseudo-frame not suppressed "+pseudo);
}
assert.ok(css.includes("content:none!important")&&css.includes("display:none!important"));
assert.ok(dock.includes(framed),"framed mode must remain active");
assert.ok(dock.includes("scale(var(--tile-alpha-zoom,1))!important"),"visible silhouette zoom must be preserved");
assert.match(editor,/body\.classList\.toggle\("visual-results-tiles",current\.resultsTileStyle==="card"\)/);
assert.match(editor,/resultsTileStyle:"none"/);
assert.match(native,/private int resultTileDp\(\)\{[\s\S]*?return spriteSize==55\?40:spriteSize==45\?32:24;/);
assert.match(secondary,/extends OverlayService/);
console.log("PASS LT227: frameless means no backgrounds, pseudo-borders or shadows; P/M/G + P1/P2 remain unchanged");

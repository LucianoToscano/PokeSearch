"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const dock=fs.readFileSync(path.join(__dirname,"../src/main/assets/dock.html"),"utf8");
const editor=fs.readFileSync(path.join(__dirname,"../src/main/assets/visual_editor.js"),"utf8");
const native=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");

// Captured Samsung video 01/11: last "Voltar" button truncated by fixed
// 450dp independent-popup height despite plenty of free screen below.
const fit=dock.slice(dock.indexOf("function fit(){"),dock.indexOf("let activeNativePopupKind"));
assert.match(fit,/const maxPopupHeight=choiceOpen==="visual"\?740:450/);
assert.match(fit,/Math\.min\(maxPopupHeight,Math\.ceil\(Math\.max\(rect\.height,pane\.scrollHeight,bottom-rect\.top\)\)\+2\)/);
assert.match(fit,/const maxRoom=choiceOpen==="visual"\?740:450/);
assert.match(fit,/Math\.min\(maxRoom,Number\(height\)\|\|440\)/);
assert.match(native,/int visualMax="visual"\.equals\(popupKind\)\?[\s\S]*?Math\.max\(100,Math\.min\(740,screenHeightDp\(\)-16\)\):450/);
assert.match(native,/h=Math\.max\(1,Math\.min\(visualMax,height\)\)/);
assert.match(native,/if\("visual"\.equals\(popupKind\)\|\|"appearance"\.equals\(popupKind\)\)/);
assert.match(native,/int safeH=Math\.min\(b\.height,Math\.max\(dp\(40\),m\.heightPixels-2\*margin\)\)/);
assert.match(editor,/handle\.addEventListener\("pointermove"/);
assert.match(editor,/Native\.moveVisualEditorBy\(dx,dy\)/);
assert.match(dock,/body\.popup-window\.controls-window #choices\.visualPanel\{[\s\S]*?max-height:calc\(100vh - 4px\)!important;overflow-y:auto!important/);
function cap(kind,requested,screenDp) {
 const nativeCap=kind==="visual"?Math.max(100,Math.min(740,screenDp-16)):450;
 return Math.max(1,Math.min(nativeCap,requested));
}
assert.equal(cap("visual",540,840),540,"editor natural content fits when screen allows");
assert.equal(cap("visual",860,840),740,"very tall editor respects 740dp safety");
assert.equal(cap("visual",800,420),404,"small screen never pushes native window out");
assert.equal(cap("mode",800,840),450,"ordinary popup keeps original cap");
assert.equal(cap("appearance",800,840),450,"Personalização launcher remains compact");
console.log("LT221 PASS: dynamic full-height Visual Editor, unchanged other menu sizes, draggable clamped popup");

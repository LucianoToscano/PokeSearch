"use strict";
// Regression: legacy raw-IV badge is a circular medal stored over an opaque black square.
// Keep the original artwork and IV text overlay, but clip the black matte in the toolbar.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const dock=fs.readFileSync(path.join(__dirname,"../src/main/assets/dock.html"),"utf8");

const css=dock.match(/body\.controls-window #quickMenuList \.quickGlyph\.modeArt\.rawArt \.quickModeImage\{([^}]+)\}/);
assert.ok(css,"custom IV medal selector must exist");
assert.match(css[1],/clip-path:\s*circle\(45% at 50% 50%\)!important;/,
 "legacy black matte must be clipped inside the circular seal");
assert.match(css[1],/width:21px!important;height:21px!important;/,
 "legacy medal size must stay unchanged");
assert.ok(dock.includes('custom:"StarIVRaw.png"'),
 "custom IV artwork must remain the original badge");
assert.ok(dock.includes('percent:starCount<0?"StarIVRaw.png"'),
 "custom IV-percent artwork must remain supported");
assert.ok(dock.includes('glyph.classList.add("rawArt")'),
 "mask must only apply to the medal when IV values need overlay");
assert.ok(dock.includes('glyph.appendChild(overlay)'),
 "raw IV numerical overlay must not be removed");
console.log("PASS: raw IV toolbar medal masks its black square without changing modes.");

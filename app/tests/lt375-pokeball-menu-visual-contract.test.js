"use strict";
// LT375: visual-only P1/P2 fixes must apply AFTER older cascade overrides.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const dock=fs.readFileSync("app/src/main/assets/dock.html","utf8");
const css=dock.slice(0,dock.indexOf("</style>"));
const section=css.slice(css.indexOf("/* LT375-P1P2-PIXEL-PARITY:"));
assert.ok(css.indexOf("/* LT375-P1P2-PIXEL-PARITY:")>css.indexOf("/* LT349: identical slider alpha"),
 "LT375 CSS must override the late LT349 shared More panel background");
assert.ok(section.includes("/* LT375-SORT-TABS:")&&
 section.includes("/* LT375-MORE-SEPARATE-TILES:"),"all three changes installed");
const block=(a,b)=>section.slice(section.indexOf(a),b?section.indexOf(b):undefined);
const bg=block("/* LT375-P1P2-PIXEL-PARITY:","/* LT375-SORT-TABS:");
const tabs=block("/* LT375-SORT-TABS:","/* LT375-MORE-SEPARATE-TILES:");
const more=block("/* LT375-MORE-SEPARATE-TILES:");
assert.match(bg,/button\[data-key="bg"\]\.selected/,"ON and OFF Background use same tile");
assert.match(bg,/height:30px!important;min-height:30px!important;max-height:30px!important/);
assert.match(bg,/background:var\(--visual-menu-button-bg/,"same tile background as others");
assert.match(bg,/\.quickGlyph\.backgroundOnArt img\{/);
assert.match(bg,/width:16px!important;min-width:16px!important;max-width:16px!important/);
assert.match(bg,/height:16px!important;min-height:16px!important;max-height:16px!important/);
assert.match(bg,/object-fit:contain!important/,"preserve original icon art aspect ratio");
assert.ok(dock.includes('img.src="file:///android_asset/ui-icons/Icone_Background_On.png";'),
 "original colorful background artwork preserved");
assert.ok(dock.includes('button.dataset.backgroundArtActive=String(searchSettings.backgroundOnly===true)'),
 "real toggle still switches visual, never creates a new button");
assert.match(tabs,/body\.popup-window\.controls-window #choices\.filterCascade/,"detached filter popup fixed");
assert.match(tabs,/button\.sortDirectionButton\.chosen/,"active direction remains distinguishable");
assert.match(tabs,/background:var\(--visual-menu-button-bg/,"same theme as original menu tiles");
assert.match(tabs,/column-gap:clamp\(2px,var\(--visual-menu-gap,3px\),16px\)/,
 "tabs stay separate and respect live menu editor spacing");
assert.match(tabs,/background:transparent!important;border:0!important;box-shadow:none!important/,
 "no separate background behind both sort tabs");
assert.ok(dock.includes('[[false,"Padrão"],[true,"Inverso"]]'),
 "preserve actual sort direction logic and Portuguese labels");
assert.match(more,/body\.popup-window\.controls-window #choices\.morePanel/,
 "native detached popup included");
assert.match(more,/body\.controls-window\.visual-menu-vertical #choices\.morePanel/,
 "vertical orientation included");
assert.match(more,/row-gap:clamp\(2px,var\(--visual-menu-gap,3px\),16px\)/,
 "vertical space matches horizontal slot separation");
assert.match(more,/background:transparent!important;background-color:transparent!important/,
 "no shared dark strip");
assert.match(more,/backdrop-filter:none!important/,"shared backdrop removed");
assert.match(more,/#choices\.morePanel>\.quickMoreAction/,"only individual 3 tiles filled");
assert.match(more,/background:var\(--visual-menu-button-bg/,"same tile fill/transparency");
assert.match(more,/border:1px solid var\(--visual-menu-border/,"same border as toolbar");
assert.match(more,/box-shadow:var\(--visual-menu-tile-shadow/,"same tile shadow");
assert.ok(dock.includes('button.onclick=()=>{closeChoices();quickClick(id);};'),
 "real action callbacks for More unchanged");
assert.ok(dock.includes('const moreHeight=tiles*30+Math.max(0,tiles-1)*gap;'),
 "native popup measurement still accounts for the spaces");
console.log("LT375 P1/P2 background, sort tabs and separated More tiles contract PASS");

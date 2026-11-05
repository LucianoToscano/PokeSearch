"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main/assets");
const html=fs.readFileSync(path.join(root,"detail.html"),"utf8");
const js=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(js);new vm.Script(js);
const before=html.indexOf("/* LT251 — readability of the independent CP/Nível calculator.");
assert.ok(before>0,"final simulator visual override exists");
const css=html.slice(before,html.indexOf("</style>",before));
assert.ok(css.includes("grid-template-columns:minmax(0,1fr) auto!important"),
 "no old three-column form+level row");
assert.ok(css.includes(".psCpSimFields>label:first-child{grid-column:1/-1!important"),
 "full-width form row displays complete Bellossom/Ursaluna names");
assert.ok(css.includes(".psCpSimFields>label:nth-child(2){grid-column:1!important"),
 "level moves to the next row");
assert.ok(css.includes("#psCpLevelValue{grid-column:2!important"),
 "level value appears alongside the level slider, never next to the form");
assert.ok(css.includes("max-width:none!important;height:34px!important"),
 "the Android select uses all available space and readable height");
assert.ok(css.includes("font-size:12px!important;text-overflow:ellipsis!important"),
 "form text is larger and ellipsis only if impossibly long");
assert.ok(css.includes("flex:0 0 30px!important;width:30px!important"),
 "arrow and level-adjustment controls have minimum usable size");
assert.ok(css.includes("max-height:min(68vh,430px)!important"),
 "panel scrolls without consuming entire display");
assert.ok(js.includes('id="psCpForm"'));
assert.ok(js.includes('id="psCpLevel"'));
assert.ok(js.includes('onclick="stepPvpCpForm(1)"'));
assert.ok(js.includes('onclick="psCpApplyTarget()"'));
assert.ok(js.includes("function psCpAt(row,ivs,level)"));
assert.ok(js.includes("function psCpLeagueCeiling(row,ivs,limit)"));
const dock=fs.readFileSync(path.join(root,"dock.html"),"utf8");
assert.ok(dock.includes("const emptyResult=!cards.length"),"LT250 empty zero preserved");
assert.ok(html.includes("content:none!important;width:0!important"),
 "LT250 never restores duplicate blue league marker");
assert.ok(html.includes('psCompactSpecies'),"three independent chips preserved");
console.log("LT251 PASS: Oddish Bellossom selector full-width, separate level slider, CP target and LT250 ranks/count preserved");

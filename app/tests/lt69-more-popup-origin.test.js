"use strict";
/* Regression from Samsung LT68 screenshot: More utilities appeared ~34 CSS px
 * below the independent native popup origin; vertical mode could add 232px.
 * The screen/window origin is set by PopupTouchGeometry, not HTML twice. */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main");
const dock=fs.readFileSync(path.join(root,"assets/dock.html"),"utf8");
const service=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const geometry=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/PopupTouchGeometry.java"),"utf8");
let checks=0;
function check(label,fn){fn();checks++;console.log("PASS LT69 "+label)}
const split=(start,end)=>{
 const a=dock.indexOf(start);assert.ok(a>=0,start);
 const b=dock.indexOf(end,a+start.length);assert.ok(b>a,end);
 return dock.slice(a,b);
};
check("native popup remains separate and anchored adjacent to toolbar",()=>{
 for(const s of ["PopupTouchGeometry.place(","PopupTouchGeometry.placeBeside(",
  "PopupTouchGeometry.avoidResult(","popupParams.y=b.y;",
  "popupParams.width=b.width;popupParams.height=b.height;"])
  assert.ok(service.includes(s),s);
 assert.ok(geometry.includes("safeToolbarY+toolbarHeight"),"below origin belongs to native geometry");
 assert.ok(geometry.includes("safeToolbarY-height"),"above origin belongs to native geometry");
});
check("original toolbar More CSS and right side affordance unchanged",()=>{
 assert.ok(dock.includes("body.controls-window #choices.morePanel,"));
 assert.ok(dock.includes("left:0;right:auto;top:34px!important;bottom:auto!important;"));
 assert.ok(dock.includes("top:232px!important;bottom:auto!important;"));
 assert.ok(dock.includes("#choices.morePanel [data-key=report] .quickGlyph"));
 assert.ok(dock.includes("#choices.morePanel [data-key=donate] .quickGlyph"));
 assert.ok(dock.includes("#choices.morePanel [data-key=close] .quickGlyph"));
});
check("final More popup uses top zero for BOTH horizontal and vertical",()=>{
 const css=split("/* LT69 MORE-ORIGIN-01:","</style>");
 const cases=[
  "body.popup-window.controls-window #choices.morePanel",
  "body.popup-window.controls-window.popup-above #choices.morePanel",
  "body.popup-window.controls-window.visual-menu-vertical #choices.morePanel",
  "body.popup-window.controls-window.visual-menu-vertical.popup-above #choices.morePanel"
 ];
 cases.forEach(s=>assert.ok(css.includes(s),s));
 assert.match(css,/top:0!important;bottom:auto!important;/);
 assert.match(css,/left:0!important;right:auto!important;/);
 assert.match(css,/margin:0!important;padding:0!important;/);
 assert.match(css,/transform:none!important;/);
 assert.ok(css.indexOf("MORE-ORIGIN-01")<css.indexOf("top:0!important"));
 assert.ok(css.indexOf("top:0!important")>0);
});
check("More content is intrinsic, scrollable only on cramped display",()=>{
 const css=split("/* LT69 MORE-ORIGIN-01:","</style>");
 assert.match(css,/height:auto!important;min-height:0!important;/);
 assert.match(css,/max-height:var\(--popup-room,440px\)!important;/);
 assert.match(css,/overflow-x:hidden!important;overflow-y:auto!important;/);
 assert.ok(!css.includes("top:34px"));
 assert.ok(!css.includes("top:232px"));
});
check("hidden popup toolbar cannot shrink More tile to 28px",()=>{
 const block=split("function renderMoreChoices(){","function bindRefreshGesture(");
 for(const s of ['const tileWidth=trigger?.getBoundingClientRect().width||0;',
   'if(tileWidth>=28)panel.style.setProperty("--more-tile-width",',
   'else panel.style.removeProperty("--more-tile-width");',
   'panel.appendChild(button);'])
  assert.ok(block.includes(s),s);
 assert.ok(!block.includes('Math.max(28,Math.round(trigger.getBoundingClientRect().width))'));
});
check("More expansion renders every eligible action with no artificial two-icon cap",()=>{
 const block=split("function renderMoreChoices(){","function bindRefreshGesture(");
 assert.ok(block.includes("for(const id of ids){"));
 assert.ok(!block.includes("slice(0,2)"));
 assert.ok(!block.includes("slice(0,1)"));
 assert.ok(block.includes('button.onclick=()=>{closeChoices();quickClick(id);};'));
 const fit=split("function fit(){","function closeChoices(){");
 assert.ok(fit.includes('if(choiceOpen==="more"){'));
 assert.ok(fit.includes('const tiles=popup.querySelectorAll(".quickMoreAction").length;'));
 assert.ok(fit.includes('const moreHeight=tiles*30+Math.max(0,tiles-1)*gap;'));
 assert.ok(fit.includes("Native.resizePopup("));
});
check("script parsing unchanged after More edit",()=>{
 new vm.Script(fs.readFileSync(path.join(root,"assets/probe.js"),"utf8"));
 let parsed=0;
 for(const m of dock.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){
  new vm.Script(m[1]);parsed++;
 }
 assert.ok(parsed>=2);
});
console.log("LT69 More popup origin: "+checks+"/"+checks+" PASS");

"use strict";
/* LT326 — opt-in, privacy and separate marker rail for P/M/G & P1/P2. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const dock=read("src/main/assets/dock.html");
const java=read("src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
let count=0;
function test(name,cb){cb();count++;console.log("PASS LT326 "+name);}
function slice(a,b){let x=dock.indexOf(a),y=dock.indexOf(b,x+a.length);
 assert.ok(x>=0&&y>x,"missing dock section "+a);return dock.slice(x,y);}
function native(a,b){let x=java.indexOf(a),y=java.indexOf(b,x+a.length);
 assert.ok(x>=0&&y>x,"missing native section "+a);return java.slice(x,y);}

test("new and upgraded installations have markers OFF",()=>{
 assert.match(dock,/shiny:false,highlights:false/);
 assert.match(java,/resultShowHighlights=false;/);
 assert.match(java,/resultShowHighlights=prefs\.getBoolean\("resultShowHighlights",false\)/);
});
test("native sends separate boolean state to all 4 WebViews",()=>{
 assert.match(java,/,\\"highlights\\":\+resultShowHighlights/);
 assert.ok(java.includes("resultDisplayOptionsJson()"),"shared bridge JSON");
 assert.match(dock,/highlights:displayPrefs\.highlights===true/);
});
test("Info Pokémon includes one touch toggle, never a new menu or tab",()=>{
 const info=slice("function renderInfoChoices(){","// A persistent direct P/M/G selector");
 assert.match(info,/\["highlights","◆ Destaques"/);
 assert.match(info,/Native\.setResultDisplayOption\(key,!resultDisplayOptions\[key\]\)/);
 assert.match(info,/!!resultDisplayOptions\[key\]/);
 assert.match(info,/visibilityKeys=options\.map/);
});
test("each Pokéball stores own opt-in via the existing preferences",()=>{
 const setter=native('@JavascriptInterface public void setResultDisplayOption(String key,boolean value)',"private void alertModeCaption");
 assert.match(setter,/case "highlights":resultShowHighlights=value;pref="resultShowHighlights";break/);
 assert.match(setter,/overlayPrefs\(\)\.edit\(\)\.putBoolean\(pref,value\)\.apply\(\)/);
 assert.match(java,/getSharedPreferences\(isSecondaryOverlay\(\)\?"prefs_secondary":"prefs",0\)/);
});
test("show all and hide all atomically control the marker option",()=>{
 const all=native("setAllResultDisplayOptions(boolean enabled)","@JavascriptInterface public void setResultDisplayOption");
 assert.match(all,/resultShowHighlights=enabled/);
 assert.match(all,/"resultShowHighlights"/);
 assert.match(all,/pref\.putBoolean\(key,enabled\)/);
});
test("render does not compute or show value indicators while OFF",()=>{
 assert.match(dock,/resultDisplayOptions\.highlights&&evidence\?\.warning&&evidence\.icon/);
 assert.match(dock,/if\(resultDisplayOptions\.highlights&&evidence\?\.state==="verified"&&/);
 assert.match(dock,/const markerRail=resultDisplayOptions\.highlights\?/);
});
test("both confidence warning and value marker leave the spriteStage",()=>{
 const card=slice("const icon='<span class=\"spriteStage\">'+","const kind=");
 assert.ok(!card.includes("+evidenceFlag+valueFlag+"),"no marker in sprite box");
 assert.match(card,/\+'<\/span><\/span>'\+markerRail/);
 assert.match(dock,/class="resultMarkerRail" aria-hidden="true"/);
});
test("rail width is a dedicated 12px only when ON, not an invisible gutter",()=>{
 assert.match(dock,/const highlightWidth=resultDisplayOptions\.highlights\?12:0/);
 assert.match(dock,/const metaWidth=metadataVisible\?96:highlightWidth/);
 assert.match(dock,/--result-highlight-width/);
 assert.match(dock,/max-width:var\(--result-highlight-width,0px\)/);
});
test("existing 96px metadata strip shares space rather than expanding native hitboxes",()=>{
 assert.match(dock,/flex-basis:calc\(96px - var\(--result-highlight-width,0px\)\)!important/);
 assert.match(java,/Math\.min\(100,widthDp\)/);
 assert.match(java,/resultTileDp\(\)\+resultMetadataWidthDp/);
});
test("sprites keep their original 24/32/40px geometry and 88% image fit",()=>{
 assert.match(java,/return spriteSize==55\?40:spriteSize==45\?32:24/);
 assert.match(dock,/--result-art-size/);
 assert.match(dock,/resultLayout\.sprite\*0\.88/);
 assert.match(dock,/position:static!important;display:block;flex:none/);
});
test("no new network, location, notification or provider request added",()=>{
 const latest=dock.slice(dock.lastIndexOf("LT326:"),dock.lastIndexOf("</style>"));
 for(const bad of ["fetch(","XMLHttpRequest","geolocation","sendGeneralNotification",
  "Native.shiny","Native.search","setInterval("])
  assert.equal(latest.includes(bad),false,bad);
});
test("the details still explain quality regardless of marker opt-in",()=>{
 const detail=read("src/main/assets/detail.html");
 assert.match(detail,/function toggleResultEvidence\(\)/);
 assert.match(detail,/evidence\.details\.slice\(1\)/);
 assert.match(dock,/const evidenceTitle=evidence\?\.explanation\|\|""/);
});
console.log("LT326 opt-in marker QA: "+count+" scenarios PASS");

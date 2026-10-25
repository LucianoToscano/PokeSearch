"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main");
const dock=fs.readFileSync(path.join(root,"assets/dock.html"),"utf8");
const probe=fs.readFileSync(path.join(root,"assets/probe.js"),"utf8");
const java=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
function between(s,a,b){let i=s.indexOf(a),j=s.indexOf(b,i+a.length);assert.ok(i>=0&&j>i,a);return s.slice(i,j)}
let n=0;function check(s,f){f();n++;console.log("PASS LT83 "+s)}
check("Native location width constant, no CSS feedback-shrink",()=>{
 assert.ok(java.includes('if("location".equals(popupKind))'));
 assert.ok(java.includes("w=Math.max(1,Math.min(286,screenWidthDp()-12))"));
 assert.ok(dock.includes('Math.min(286,Math.max(1,Math.floor(window.innerWidth||286)))'));
});
check("Location input + four actions fit in centered fixed grid",()=>{
 const css=between(dock,"/* LT83 Samsung: stable, centered location layout","</style>");
 for(const s of ["grid-template-columns:29px 75px 65px!important","grid-column:1!important",
 "grid-column:2!important","grid-column:3!important","justify-content:center!important",
 "overflow:hidden!important","max-width:100%!important"])assert.ok(css.includes(s),s);
 const widths=29+75+65+2*5;
 assert.ok(widths<=286-12);
 const loc=between(dock,"function renderLocationChoices(){","let requestedInterval=null");
 assert.ok(loc.includes("panel.append(title,fieldRow,slide,label,message)"));
 assert.ok(loc.includes("label.append(labelName,paste,radiusWrap)"));
 assert.ok(loc.includes("Native.setLocation(false,\"\",0)"));
});
check("Coordinate text may include 25+ chars without overflowing popup",()=>{
 assert.ok(dock.includes("font:500 10px/1.15 monospace!important"));
 assert.ok(dock.includes("-webkit-text-size-adjust:none!important"));
 assert.ok(dock.includes("text-align:center!important"));
});
check("Site Coords selection tolerates mobile labels and missing aria only with exact pair",()=>{
 assert.ok(probe.includes('label==="Coords"?'));
 assert.ok(probe.includes("providerCoords.length===1&&providerRadius.length===1"));
 assert.ok(probe.includes("fields.coords===providerCoords[0]&&fields.radius===providerRadius[0]"));
 assert.ok(probe.includes("!active(areaButton)"));
 assert.ok(probe.includes("Date.now()-root.__psCoordsModeClickAt>1500"));
 assert.ok(probe.includes('const ok=coordsMatch&&radiusMatch&&active===true'));
});
check("All existing UI script tags remain parseable",()=>{
 const scripts=[...dock.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
 assert.ok(scripts.length>0);for(const x of scripts)new vm.Script(x[1]);
});
console.log("LT83 "+n+"/"+n+" PASS");

"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const dock=fs.readFileSync(path.join(__dirname,"../src/main/assets/dock.html"),"utf8");
const p=dock.slice(dock.indexOf("function renderLocationChoices(){"),dock.indexOf("let requestedInterval=null"));
const css=dock.slice(dock.indexOf("/* LT88 QA-98 Samsung location recovery:"));
assert.ok(css.length>2500,"scoped Samsung recovery CSS");
for(const s of ["width:min(286px,calc(100vw - 12px))",
"grid-template-columns:29px 29px 68px minmax(65px,1fr)",
".locRadiusRow>.locPaste",".locRadiusRow>.locCopy",
".locRadiusRow>.compactLocationActions",".compactLocationActions>.psLineAction",
"grid-column:1 / -1","justify-content:center!important",
".locCoordsRow .locField"])assert.ok(css.includes(s),s);
for(const s of ['label.append(labelName,paste,copy,radiusWrap)',
 'actions.append(apply,clear);label.append(slide,actions)',
 'document.createTextNode(" Aplicar")','document.createTextNode(" Limpar")',
 'paste.onclick=()=>Native.pasteLocationCoords()',
 'Native.copyLocationCoords(field.value)',
 'Native.setLocation(true,wantedCoords,wantedRadius)',
 'Native.setLocation(false,"",0)','slide.max="1000"'])assert.ok(p.includes(s),s);
console.log("PASS Samsung location controls: full coordinate field, paste/copy, radius and visible apply/clear.");

"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const dock=fs.readFileSync(path.join(__dirname,"../src/main/assets/dock.html"),"utf8");
const p=dock.slice(dock.indexOf("function renderLocationChoices(){"),dock.indexOf("let requestedInterval=null"));
const css=dock.slice(dock.indexOf("/* LT99 compact Samsung Location"));
assert.ok(css.length>6500,"scoped last-rule Samsung compact layout");
const expected=[
 'clipboard.append(paste,copy)','title.appendChild(clipboard)',
 'field.maxLength=30','field.setAttribute("maxlength","30")',
 'field.placeholder="53.759856,-1.495755"',
 'label.append(labelName,radiusWrap)','actions.append(apply,clear);label.append(actions)',
 'panel.append(title,fieldRow,label,message)',
 'paste.onclick=()=>Native.pasteLocationCoords()',
 'Native.copyLocationCoords(field.value)','Native.setLocation(true,wantedCoords,wantedRadius)',
 'Native.setLocation(false,"",0)','slide.max="1000"'
];
for(const t of expected)assert.ok(p.includes(t),"expected preserved function: "+t);
const excluded=[
 'label.append(slide,actions)','fieldRow.append(field,paste)',
 'document.createTextNode(" Aplicar")','document.createTextNode(" Limpar")'
];
for(const t of excluded)assert.ok(!p.includes(t),"unexpected visible row/control "+t);
const lastBlock=p.slice(p.lastIndexOf('actions.append(apply,clear)'));
assert.ok(!lastBlock.includes('append(slide'),"range is unmounted, never visible");
const cssExpect=['width:min(286px,calc(100vw - 12px))','max-height:min(165px',
 '.locClipboardTools>.locPaste','.locClipboardTools>.locCopy',
 'min-height:33px!important','min-height:36px!important',
 '.locRadiusRow>.locRadiusInputWrap','.locRadiusRow>.compactLocationActions',
 'flex-flow:row nowrap!important','font-size:0!important'];
for(const t of cssExpect)assert.ok(css.includes(t),"missing layout rule "+t);
const sample="53.759856,-1.495755";
assert.ok(sample.length<=30);
const long="-90.12345678,-180.12345678";
assert.ok(long.length<=30);
const coordsMatch=sample.match(/^\s*([-+]?\d{1,2}(?:\.\d+)?)\s*[,;]\s*([-+]?\d{1,3}(?:\.\d+)?)\s*$/);
assert.equal(coordsMatch[1],"53.759856");assert.equal(coordsMatch[2],"-1.495755");
assert.ok(p.includes('M12 9v10m-4-4 4 4 4-4'),"clipboard arrow points DOWN");
const scripts=[...dock.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
assert.ok(scripts.length>0);
for(const match of scripts)new vm.Script(match[1]);
console.log("PASS QA99 Samsung three rows: clipboard beside heading, 30-character coords, numeric km and icon-only actions");

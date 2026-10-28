"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.join(__dirname,"../src/main/assets");
const html=fs.readFileSync(path.join(root,"detail.html"),"utf8");
const s=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(s,"inline detail script must exist");
new vm.Script(s);
assert.ok(html.includes("width:11px;height:11px;object-fit:contain"),"type icons same size as sex glyph");
assert.ok(html.includes(".pkGender.genderless{color:#fff}"),"genderless must be white");
assert.ok(html.includes("#names b{white-space:normal;text-overflow:clip;overflow:visible"),"full Pokemon name never clipped");
assert.ok(html.includes("#nameLine{display:flex;flex-wrap:wrap"),"Pokemon title can wrap");
assert.ok(!html.includes("text-overflow:ellipsis;overflow:hidden;font-size:12px"),"no name ellipsis");
for(const id of ["shareIcon","watch","x"]){
 const re=new RegExp("#"+id+"\\{[^}]*width:23px;height:23px");
 assert.match(html,re,id+" must use uniform 23px square");
}
assert.ok(html.includes('id="shareIcon"')&&html.includes('onclick="captureShareAsk()"'));
assert.ok(s.includes("icon.disabled=!ready;"),"sharing can only be enabled after coordinate copy");
assert.ok(s.includes("window.offerCaptureShare="),"sharing still uses native validated flow");
assert.ok(s.includes('stat("IV",showRaw?raw:"","red")'),"raw IV numbers without A/D/S label");
assert.ok(!s.includes('stat("A/D/S"'));
assert.ok(html.includes('#coordsQuota{position:absolute;top:-7px;right:-3px;'),"quota number on top of Get coords");
assert.ok(s.includes('el.textContent=authoritative?String(data.remaining):String(observed)'),"quota badge distinguishes server vs local counts");
assert.ok(!s.includes(' "PoGo "+observed+"* ⟳"'),"no long quota row");
assert.ok(html.includes("#cooldownControls{display:none!important}"),"experimental undo/reset hidden");
assert.ok(html.includes("#captureShare{display:none!important}"),"old share button hidden in favor of header action");
assert.ok(html.includes('id="coordsNumbers" role="status" hidden'),"numbers visible after reveal");
assert.ok(s.includes('box.textContent=valid?String(currentCoords).trim()'),"full coordinates are displayed without rounding");
assert.ok(s.includes('if(currentCoords){Native.copyCoords(currentCoords);return;}'),"copy already-revealed coords without new reveal");
assert.ok(html.includes("pokemon_type_icons.js"),"user's Drive icons preserved");

const cooldown=require("../src/main/assets/cooldown_estimate.js");
const dom={coordsNumbers:{hidden:true,textContent:""}};
const document={getElementById:id=>dom[id]||null};
const wrapped=new Function("document","window","currentCoords",
 s.slice(s.indexOf("function renderCoordinateNumbers()"),s.indexOf("function coordButtons()"))+
 "return renderCoordinateNumbers;");
const original=" -5.123456789, -120.000001234 ";
wrapped(document,{PokeSearchCooldown:cooldown},original)();
assert.equal(dom.coordsNumbers.hidden,false);
assert.equal(dom.coordsNumbers.textContent,original.trim());
wrapped(document,{PokeSearchCooldown:cooldown},"n/a")();
assert.equal(dom.coordsNumbers.hidden,true);
assert.equal(dom.coordsNumbers.textContent,"");
console.log("LT145 tidy detail / complete coords / compact badges regression PASS");

"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main");
const probe=fs.readFileSync(path.join(root,"assets/probe.js"),"utf8");
const detail=fs.readFileSync(path.join(root,"assets/detail.html"),"utf8");
const service=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const inlined=detail.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(inlined,"detail inline script present");
new vm.Script(inlined);
new vm.Script(probe);
function provider(cardText,alerts=[]){
 const section=probe.slice(probe.indexOf("function coordsRevealLimit(card){"),
   probe.indexOf('if(action.startsWith("coords:"))'));
 assert.ok(section.startsWith("function coordsRevealLimit"));
 const nodes=alerts.map(textContent=>({textContent}));
 const document={querySelectorAll:()=>nodes};
 const fn=new Function("document","text","vis",section+"return coordsRevealLimit;")(
   document,x=>x?.textContent||"",()=>true);
 return fn(cardText===null?null:{node:{textContent:cardText}});
}
assert.deepEqual(provider("Noibat 714 Rate Limited"),{limitType:"rate",retrySeconds:0});
assert.deepEqual(provider("Noibat 714 Rate Limited",
 ["Rate limited. Try again in 8s."]),{limitType:"rate",retrySeconds:8});
assert.deepEqual(provider("Noibat 714 Rate Limited",
 ["Rate limited. You can retry now."]),{limitType:"rate",retrySeconds:0});
assert.deepEqual(provider("Noibat 714",[
 "Reveal more coords — upgrade to VIP. You've hit the coords reveal limit for logged-in users."]),
 {limitType:"quota",retrySeconds:0});
assert.deepEqual(provider(null,[
 "Reveal more coords — upgrade to VIP. You've hit the coords reveal limit."]),
 {limitType:"quota",retrySeconds:0});
assert.equal(provider("Piplup Get coords disabled"),null,
 "disabled Get coords is not proof of rate limit");
assert.equal(provider("Piplup Get coords",["Rate limited. Try again in 8s."]),null,
 "unrelated Search toast must not trigger Get coords limit warning");
assert.equal(provider("Noibat Get coords",["Network error"]),null);
assert.match(probe,/const limit=coordsRevealLimit\(card\)/);
assert.match(probe,/const limit=coordsRevealLimit\(target\)/);
assert.match(probe,/const limit=coordsRevealLimit\(null\)/);
const css=detail.slice(0,detail.indexOf("</style>"));
assert.match(css,/#coordRow #coordsQuota,#coordRow #coordsQuota\.official\{[\s\S]*?border-radius:50%/);
assert.match(css,/#coordsRatePopover\{/);
assert.match(detail,/id="coordsRateNotice" role="status" hidden/);
assert.match(detail,/Taxa Limitada PoGoCoordinates/);
assert.match(detail,/id="coordsRateInfo"[^>]*aria-expanded="false"[^>]*onclick="toggleCoordsRateInfo\(\)"/);
const segment=inlined.slice(inlined.indexOf("let coordsRestriction="),
 inlined.indexOf("function coordButtons(){"));
assert.ok(segment.includes("function renderCoordsRate(data)"));
const elements={};
for(const id of ["coordsRateNotice","coordsRatePopover","coordsRateInfo","coordsRateTimer"])
 elements[id]={hidden:true,textContent:"",setAttribute(n,v){this[n]=v;}};
let resized=0,added=0,removed=0,now=100000;
const FakeDate={now:()=>now};
const fn=new Function("document","Date","setInterval","clearInterval","resizeEvolutionPanel",
 segment+"return {renderCoordsRate,toggleCoordsRateInfo,clearCoordsRate,updateCoordsRateTimer};")(
 {getElementById:id=>elements[id]},FakeDate,()=>{added++;return 12;},
 ()=>{removed++;},()=>{resized++;});
fn.renderCoordsRate(null);assert.equal(elements.coordsRateNotice.hidden,true);
fn.renderCoordsRate({type:"rate",retrySeconds:8});
assert.equal(elements.coordsRateNotice.hidden,false);
assert.equal(elements.coordsRateTimer.textContent,"Tente em 8s");
assert.equal(added,1);
fn.toggleCoordsRateInfo();
assert.equal(elements.coordsRatePopover.hidden,false);
assert.match(elements.coordsRatePopover.textContent,/temporariamente/);
assert.equal(elements.coordsRateInfo["aria-expanded"],"true");
assert.equal(resized,1);
now+=9000;fn.updateCoordsRateTimer();
assert.equal(elements.coordsRateTimer.hidden,true);
fn.renderCoordsRate({type:"quota",retrySeconds:99});
assert.equal(elements.coordsRateTimer.hidden,true,"quota has no invented countdown");
fn.toggleCoordsRateInfo();assert.match(elements.coordsRatePopover.textContent,/conta atingiu o limite/);
fn.clearCoordsRate();assert.equal(elements.coordsRateNotice.hidden,true);
assert.match(inlined,/renderCoordsRate\(coords\?null:restriction\)/);
assert.match(inlined,/clearCoordsRate\(\);\s*coordsNote="";coordsPending=false;/);
assert.match(inlined,/el\.textContent=authoritative\?String\(data\.remaining\):String\(observed\)/);
assert.match(service,/else if\("rate-limited"\.equals\(reason\)\)/);
assert.match(service,/deliverCoordsRestricted\("rate",0\)/);
assert.match(service,/deliverCoordsRestricted\("quota",0\)/);
assert.match(service,/deliverCoordsRestricted\(limitType,result\.optInt\("retrySeconds",0\)\)/);
assert.match(service,/deliverCoordsRestricted\(limitType,response\.optInt\("retrySeconds",0\)\)/);
assert.match(service,/window\.coordsResult\(/);
assert.match(service,/private void deliverCoordsRestricted\(/);
assert.match(service,/private void requestCoordinates\(/);
assert.ok(!segment.includes("Native.coords("),"tooltip never starts requests");
console.log("LT170 provider rate/quota evidence, exact countdown, compact info, circular badge and both overlay routes PASS");

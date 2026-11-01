"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.join(__dirname,"../src/main");
const html=fs.readFileSync(path.join(root,"assets/rare_candy_controls.html"),"utf8");
const native=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/RareCandyOverlayService.java"),"utf8");
const parser=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/CandyClipboardCoordinates.java"),"utf8");
const policy=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/CandyCooldownPolicy.java"),"utf8");
const main=fs.readFileSync(path.join(root,"assets/dock.html"),"utf8");
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,"Candy menu script present");
assert.ok(html.includes('class="locTitleHelp" onclick="showCandyCooldownReference()"'),"title alone opens reference");
assert.ok(html.includes('onpointerdown="showCandyCooldownPreview()"'),"touch starts preview");
assert.ok(html.includes('oninput="setRadiusFromSlider(this.value)"'),"slider input still updates actual radius");
assert.ok(html.includes("locationCooldownTable")&&html.includes("candyCooldownRows"),"compact always-visible reference");
assert.ok(html.includes("Estimativa não oficial"),"do not represent estimates as game guarantees");
assert.ok(native.includes("autoPasteCandyLocation(int session)"),"native auto fill requested on open");
assert.ok(native.includes('boolean reference="location-cooldown".equals(panel)'),"reference uses special native height, same compact width");
assert.ok(native.includes("CandyClipboardCoordinates.extract("),"same robust parser as Pokemon");
assert.ok(native.includes("candyMenuPanel.requestFocus()"),"temporary Android focus for clipboard");
assert.ok(native.includes("main.postDelayed(()->readCandyClipboard(automatic,session),180L)"),"Android clipboard focus transition");
assert.ok(native.includes("SecurityException ignored"),"clipboard permission restricted on Android");
assert.ok(!parser.includes("http"),"clipboard parser is local only");
assert.ok(policy.includes("A tap/copy is only a user-selected reference point"),"no fake pickup");
assert.ok(main.includes("function renderLocationCooldownTable()"),"Pokemon feature preserved");
const el=new Map();
function classList(){return{add(){},remove(){},toggle(){},contains(){return false}}}
function element(id){if(!el.has(id))el.set(id,{
 id,value:"",innerHTML:"",className:"",textContent:"",title:"",style:{setProperty(){}},
 classList:classList(),setAttribute(){},addEventListener(){},getAttribute(){return null}
});return el.get(id)}
const events={auto:[],paste:0,copy:[],setLocation:[],height:[],period:[]};
const Native={
 candyMenuHeight(...v){events.height.push(v)},candyMenuFocus(){},
 setCandyLocation(...v){events.setLocation.push(v)},
 autoPasteCandyLocation(v){events.auto.push(v)},
 pasteCandyLocation(){events.paste++},
 copyCandyLocation(v){events.copy.push(v)},
 setCandyPeriod(v){events.period.push(v)},
 closeCandyMenu(){}
};
const ctx={document:{getElementById:element,documentElement:{style:{setProperty(){}}},
 body:{classList:classList()}},window:{},Native,console,
 setTimeout(){return 1},clearTimeout(){},Date:{now(){return 1}},
 Math,Number,String,JSON};
vm.runInNewContext(script,ctx,{filename:"rare_candy_controls.html"});
ctx.window.syncCandy(JSON.stringify({coords:"-23.1,-46.2",radius:10000,period:3}));
vm.runInContext('openPanel("location")',ctx);
assert.equal(events.auto.length,1,"opening Candy location attempts clipboard automatically");
assert.equal(events.setLocation.length,0,"auto-fill never changes applied filters");
assert.equal(element("candyCoords").value,"-23.1,-46.2","initial saved coords");
ctx.window.setPastedCoords("-5.123456,-37.123456",true,1,"invalid");
assert.equal(element("candyCoords").value,"-5.123456,-37.123456","valid clipboard pasted without tapping");
ctx.window.setPastedCoords("",true,1,"unavailable");
assert.equal(element("candyCoords").value,"-5.123456,-37.123456","empty clipboard preserves coords");
element("candyRadiusSlider").value="250"; // simulate native slider moving before input event
vm.runInContext('setRadiusFromSlider(250)',ctx);
assert.equal(element("candyRadius").value,"250","radius still follows slider");
assert.ok(element("candyCooldownPreview").textContent.includes("1h"),"slider previews tier");
assert.equal(events.setLocation.length,0,"preview never triggers API request");
vm.runInContext("showCandyCooldownReference()",ctx);
assert.ok(element("choices").innerHTML.includes("Distância")&&element("choices").innerHTML.includes("Cooldown"),"reference headings shown");
assert.ok(element("choices").innerHTML.includes("100 – 249 km"),"policy tiers rendered");
assert.equal(events.height.at(-1)[0],396,"all 16 bands visible in expanded native frame");
vm.runInContext("backToCandyLocation()",ctx);
assert.equal(element("candyCoords").value,"-5.123456,-37.123456","draft coords retained after returning");
assert.equal(element("candyRadius").value,"250","draft radius retained");
ctx.window.setPastedCoords("2,3",true,1,"");
assert.equal(element("candyCoords").value,"-5.123456,-37.123456","late auto-read cannot overwrite edited draft");
vm.runInContext("pasteCoords()",ctx);
assert.equal(events.paste,1,"explicit paste fallback retained");
ctx.window.setPastedCoords("2,3");
assert.equal(element("candyCoords").value,"2,3","explicit paste replaces draft");
vm.runInContext("copyCoords()",ctx);
assert.equal(events.copy.at(-1),"2,3","copy follows Pokemon menu");
vm.runInContext("applyLocation()",ctx);
assert.equal(events.setLocation.at(-1)[0],"2,3");
assert.equal(events.setLocation.at(-1)[1],250000,"only Apply updates provider radius in meters");
vm.runInContext('openPanel("location")',ctx);
assert.equal(events.auto.at(-1),2,"new editor has distinct callback session");
ctx.window.setPastedCoords("9,9",true,1);
assert.equal(element("candyCoords").value,"2,3","stale callback ignored after reopen");
ctx.window.setPastedCoords("3,4",true,2);
assert.equal(element("candyCoords").value,"3,4","current callback accepted");
const table=vm.runInContext("CANDY_COOLDOWN_REFERENCE",ctx);
assert.equal(table.length,16,"Candy uses same 16 informational tiers as Pokemon");
for(const [km,text] of [[1,"2m"],[9,"6m"],[10,"11m"],[24,"11m"],[25,"14m"],[250,"1h"],[750,"1h 30m"],[1000,"2h"]]){
 const value=vm.runInContext("candyCooldownReferenceForKm("+km+")[1]",ctx);
 assert.equal(value,text,"tier "+km);
}
console.log("PASS LT214 Candy: automatic clipboard with manual fallback, location reference, slider preview, draft, no auto-search");

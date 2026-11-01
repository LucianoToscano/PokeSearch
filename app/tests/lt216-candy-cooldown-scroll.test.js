"use strict";
/** Regression for LT215 screen capture: cooldown card closed after row 3,
 * while following rows painted outside the background (overflow:visible).
 */
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const base=path.join(__dirname,"../src/main");
const html=fs.readFileSync(path.join(base,"assets/rare_candy_controls.html"),"utf8");
const java=fs.readFileSync(path.join(base,"java/com/lucianotoscano/pokesearchoverlay/RareCandyOverlayService.java"),"utf8");
const css=html.split("<style>")[1].split("</style>")[0];
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,"actual Candy WebView JS present");

// LT215 broke because locationPanel has !important max-height:145px and
// overflow:visible, overriding non-important locationCooldownTable styles.
assert.ok(css.includes("max-height:145px!important")&&css.includes("overflow:visible!important"),
 "historic compact location CSS preserved for the original menu");
assert.ok(script.includes('el.className="visible locationCooldownTable"'),
 "cooldown reference must not inherit compact 145px locationPanel");
assert.ok(!script.includes('el.className="visible locationPanel locationCooldownTable"'),
 "the original paint-outside bug must stay fixed");
const style=css.match(/#choices\.locationCooldownTable\{([^}]+)\}/)?.[1]||"";
assert.match(style,/display:flex/,"independent table is a flex column");
assert.match(style,/height:250px/,"card stays below native 290dp with 34px toolbar");
assert.match(style,/max-height:calc\(100vh - 40px\)/,"card stays inside its WebView");
assert.match(style,/overflow:hidden/,"rows are clipped inside the card");
assert.match(css,/#choices\.locationCooldownTable \.candyCooldownRows\{[^}]*overflow-y:auto/s,
 "only rows scroll inside fixed header and note");
assert.match(css,/#choices\.locationCooldownTable \.candyCooldownRows\{[^}]*touch-action:pan-y/s,
 "Android touch scroll works inside the reference");
assert.match(java,/"location-cooldown"\.equals\(panel\)\?232:/,
 "native overlay expands only for the cooldown reference");
assert.match(script,/requestHeight\(290,false\)/,"native WebView height covers the complete scrollable card");

const map=new Map();
function cls(){return{add(){},remove(){},toggle(){},contains(){return false}}}
function el(id){if(!map.has(id))map.set(id,{id,innerHTML:"",className:"",
  textContent:"",value:"",style:{setProperty(){}},classList:cls(),
  setAttribute(){},addEventListener(){},getAttribute(){return null}});return map.get(id)}
const actions={height:[],auto:[],setLocation:[]};
const Native={candyMenuHeight(...args){actions.height.push(args)},
  autoPasteCandyLocation(v){actions.auto.push(v)},setCandyLocation(...x){actions.setLocation.push(x)},
  candyMenuFocus(){},closeCandyMenu(){},refreshCandy(){},setCandyPeriod(){}};
const context={document:{getElementById:el,documentElement:{style:{setProperty(){}}},
 body:{classList:cls()}},window:{},Native,console,Math,Number,String,JSON,
 setTimeout(){return 1},clearTimeout(){},Date};
vm.createContext(context);
vm.runInContext(script,context,{filename:"rare_candy_controls.html"});
context.window.syncCandy(JSON.stringify({coords:"-5.2,-37.3",radius:125000,period:3}));
vm.runInContext('openPanel("location")',context);
el("candyCoords").value="-5.123,-37.456";el("candyRadius").value="250";
el("candyRadiusSlider").value="250";
vm.runInContext("showCandyCooldownReference()",context);
assert.equal(el("choices").className,"visible locationCooldownTable");
assert.equal(actions.height.at(-1)[0],290);
const panel=el("choices").innerHTML;
assert.equal((panel.match(/role="listitem"/g)||[]).length,16,
 "all 16 reference bands must exist in the scroll area");
assert.ok(panel.includes("&lt; 10 m")||panel.includes("< 10 m"),"first distance exists");
assert.ok(panel.includes("≥ 1000 km"),"last distance exists even when below the fold");
assert.ok(panel.includes('role="list" tabindex="0"'),"scrollable distance list accessible");
assert.ok(panel.includes("Deslize a lista"),"user told that there are more rows");
assert.ok(panel.includes("backToCandyLocation()"),"back button always available");
assert.equal(actions.setLocation.length,0,"reference cannot apply coordinates");
vm.runInContext("backToCandyLocation()",context);
assert.equal(el("candyCoords").value,"-5.123,-37.456","back preserves draft coords");
assert.equal(el("candyRadius").value,"250","back preserves draft radius");
assert.ok(el("choices").className.includes("locationPanel"),
 "compact location panel restored after returning");
console.log("PASS LT216: 16/16 rows, independent panel, internal scroll, no paint overflow, safe return");

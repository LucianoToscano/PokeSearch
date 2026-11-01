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
assert.match(style,/display:block/,"same compact list layout as Pokemon");
assert.match(style,/height:auto/,"card expands to include all 16 bands");
assert.match(style,/max-height:none/,"do not truncate rows");
assert.match(style,/overflow:hidden/,"rows are clipped inside the card");
assert.match(css,/#choices\.locationCooldownTable \.candyCooldownRows\{[^}]*overflow:visible/s,
 "all 16 bands must stay visible, without any inner scroll");
assert.doesNotMatch(css,/#choices\.locationCooldownTable \.candyCooldownRows\{[^}]*overflow-y:auto/s,
 "the reference must not require scrolling");
assert.match(java,/boolean reference="location-cooldown"\.equals\(panel\)/,
 "native overlay expands vertically only for the cooldown reference");
assert.match(script,/requestHeight\(396,false\)/,"native WebView height includes all 16 rows");

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
assert.equal(actions.height.at(-1)[0],396);
const panel=el("choices").innerHTML;
assert.equal((panel.match(/role="listitem"/g)||[]).length,16,
 "all 16 reference bands must exist in the scroll area");
assert.ok(panel.includes("&lt; 10 m")||panel.includes("< 10 m"),"first distance exists");
assert.ok(panel.includes("≥ 1000 km"),"last distance exists on the same screen");
assert.ok(panel.includes('role="list"'),"visible distance reference accessible");
assert.ok(!panel.includes("Deslize a lista"),"no scrolling prompt");
assert.ok(panel.includes("backToCandyLocation()"),"back button always available");
assert.equal(actions.setLocation.length,0,"reference cannot apply coordinates");
vm.runInContext("backToCandyLocation()",context);
assert.equal(el("candyCoords").value,"-5.123,-37.456","back preserves draft coords");
assert.equal(el("candyRadius").value,"250","back preserves draft radius");
assert.ok(el("choices").className.includes("locationPanel"),
 "compact location panel restored after returning");
console.log("PASS LT216: 16/16 rows visible at once like Pokemon, independent panel, no scroll or paint overflow");

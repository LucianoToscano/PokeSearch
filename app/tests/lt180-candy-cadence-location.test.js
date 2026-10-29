"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const root="app/src/main/";
const native=fs.readFileSync(root+"java/com/lucianotoscano/pokesearchoverlay/RareCandyOverlayService.java","utf8");
const probe=fs.readFileSync(root+"assets/rare_candy_probe.js","utf8");
const html=fs.readFileSync(root+"assets/rare_candy_controls.html","utf8");
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(script,"Local Candy menu script");

assert(native.includes('prefs.getInt("period",3)'),"Default saved period must be three minutes");
assert(native.includes("period=(saved==0||saved==3||saved==5||saved==10||saved==15||saved==20)?saved:3"),
  "Match OFF and Pokeball preset minutes, migrate old 1 minute default");
assert(native.includes("cards.size()==10"),"All-copied search requires 10 results");
assert(native.includes("visibleCount==10&&!hasUncopied"),"Only 10 active gray candies trigger immediate refresh");
assert(native.includes("lastAllCopiedRefreshGeneration=generation"),
  "Deduplicate auto search when same ten items return");
assert(!native.includes("now-lastRefresh<15000"),"No added 15s cooldown for manual or all copied");
assert(!native.includes("expirePending"),"TTL expiry cannot cause additional repeated refresh");
assert(native.includes("period>0&&!busy&&ready&&now>=blockedUntil"),"OFF disables cadence, provider 429 respected");
assert(native.includes("copyCandyLocation(String point)"),"Copy location action uses trusted local bridge");
assert(probe.includes("if(response.status===429&&retry===0)retry=60"),
  "Only use a fallback when provider gives no Retry-After");
assert(!probe.includes("Math.max(retry,60)"),"Never override a shorter provider Retry-After");
assert(html.includes("periodPanel"),"Period menu must use Pokeball-style transparent tiles");
assert(html.includes("locSliderRow"),"Location slider matches Pokeball design");
assert(html.includes("locClipboardTools"),"Copy and paste tools match Pokeball design");

function list(){const values=new Set();return {
  add(value){values.add(value)},remove(value){values.delete(value)},
  toggle(value,enabled){if(enabled)values.add(value);else values.delete(value)}
}}
const elements=new Map();
for(const name of ["location","refresh","period","infos","choices","candyCoords",
 "candyRadius","candyRadiusSlider","locError"]){
 elements.set(name,{
  classList:list(),innerHTML:"",className:"",value:"",textContent:"",
  setAttribute(){},addEventListener(){},getAttribute(){return null}
 });
}
const calls={period:[],location:[],height:[],copy:[],paste:0};
const Native={
 candyMenuHeight(h,focus,panel){calls.height.push([h,focus,panel])},
 setCandyPeriod(n){calls.period.push(n)},
 setCandyLocation(...args){calls.location.push(args)},
 copyCandyLocation(v){calls.copy.push(v)},
 pasteCandyLocation(){calls.paste++},candyMenuFocus(){},closeCandyMenu(){}
};
const ctx={document:{getElementById:id=>elements.get(id),body:{classList:list()}},
 window:{},Native,console,Date:{now:()=>1000},setTimeout(){return 1},clearTimeout(){}};
vm.runInNewContext(script,ctx,{filename:"rare_candy_controls.html"});
ctx.window.syncCandy(JSON.stringify({coords:"-23.573804,-46.648773",radius:1000,period:3}));
assert.equal(elements.get("period").textContent,"3m","Default period label");
vm.runInContext('openPanel("location")',ctx);
assert.equal(elements.get("candyCoords").value,"-23.573804,-46.648773");
assert.equal(elements.get("candyRadius").value,"1","Meters converted to km UI");
assert.equal(calls.height.at(-1)[0],172,"Pokébola-sized location popup including toolbar");
assert.equal(calls.height.at(-1)[2],"location","Native sees active location panel");
vm.runInContext('copyCoords()',ctx);
assert.equal(calls.copy.at(-1),"-23.573804,-46.648773");
vm.runInContext('pasteCoords()',ctx);
assert.equal(calls.paste,1);
ctx.window.setPastedCoords("-22.5,-46.2");
assert.equal(elements.get("candyCoords").value,"-22.5,-46.2");
vm.runInContext('setRadiusFromSlider(10)',ctx);
assert.equal(elements.get("candyRadius").value,"10");
vm.runInContext('applyLocation()',ctx);
assert.equal(calls.location.at(-1)[0],"-22.5,-46.2");
assert.equal(calls.location.at(-1)[1],10000,"Native still gets official Candy radius in meters");
vm.runInContext('openPanel("location")',ctx);
elements.get("candyRadius").value="0";
const before=calls.location.length;
vm.runInContext('applyLocation()',ctx);
assert.equal(calls.location.length,before,"Zero radius rejected by official endpoint contract");
elements.get("candyRadius").value=".001";
vm.runInContext('applyLocation()',ctx);
assert.equal(calls.location.at(-1)[1],1,"1 metre minimum remains supported");
vm.runInContext('openPanel("location")',ctx);
vm.runInContext('clearLocation()',ctx);
assert.equal(calls.location.at(-1)[0],"");
assert.equal(calls.location.at(-1)[1],1000);
vm.runInContext('openPanel("period")',ctx);
assert(elements.get("choices").innerHTML.includes("OFF"),"OFF period offered");
for(const val of ["3","5","10","15","20"])assert(elements.get("choices").innerHTML.includes(">"+val+"</button>"));
assert.equal(calls.height.at(-1)[0],235,"Six 30px Pokébola tiles fit popup");
vm.runInContext('choosePeriod(0)',ctx);
assert.equal(calls.period.at(-1),0);
vm.runInContext('choosePeriod(20)',ctx);
assert.equal(calls.period.at(-1),20);
vm.runInContext('choosePeriod(1)',ctx);
assert.equal(calls.period.at(-1),20,"Unsupported interval ignored");
ctx.window.syncCandy(JSON.stringify({period:0}));
assert.equal(elements.get("period").textContent,"OFF");
console.log("LT180 Candy compact P1 popup, 3m/OFF/20m, 10 copied, no local cooldown PASS");

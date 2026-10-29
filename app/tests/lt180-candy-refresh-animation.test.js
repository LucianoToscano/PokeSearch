"use strict";
// LT180: CSS animation reflects native search state, not a fake fixed timer.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const html=fs.readFileSync("app/src/main/assets/rare_candy_controls.html","utf8");
const native=fs.readFileSync(
  "app/src/main/java/com/lucianotoscano/pokesearchoverlay/RareCandyOverlayService.java","utf8");
const js=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(js,"Local Candy controls JS is present");
assert.match(html,/@keyframes candyRefreshSpin/,"Must animate the icon");
assert.match(html,/#refresh\.refreshing svg\{animation:candyRefreshSpin/,"Only spin during a request");
assert(!html.includes(".autoTime{animation:"),"Do not rotate the interval text");
assert.match(native,/window\.setCandyRefreshState\(\{busy:/,"Native passes real request state");
assert.match(native,/private void setCandyBusy\(boolean value\)/);
assert.match(native,/setCandyBusy\(true\);expirePending/);
assert.match(native,/setCandyBusy\(false\);/);
assert.match(native,/syncCandyMenu\(\);\s*\}\s*private void closeCandyMenu/,"Reopening menu syncs state");
assert.match(native,/if\(now<blockedUntil\)/,"Provider rate-limit preserved");
assert(!native.includes("addJavascriptInterface(new Bridge()"),
 "Never expose a bridge to the remote provider WebView");
function classList(){
 const values=new Set();
 return {values,add(v){values.add(v)},remove(v){values.delete(v)},
  toggle(v,enabled){if(enabled)values.add(v);else values.delete(v)},
  contains(v){return values.has(v)}};
}
const el=new Map();
for(const id of ["refresh","location","period","infos","choices"]){
 el.set(id,{classList:classList(),attributes:{},textContent:"",innerHTML:"",className:"",
  listeners:{},setAttribute(k,v){this.attributes[k]=v},
  addEventListener(k,fn){this.listeners[k]=fn}});
}
const api={refreshCandyCalls:0,refreshCandy(){this.refreshCandyCalls++},
 candyMenuHeight(){},closeCandyMenu(){}};
const context={window:{},Native:api,Date:{now:()=>1000},console,
 setTimeout:()=>1,clearTimeout(){},
 document:{body:{classList:classList()},getElementById:id=>el.get(id)}};
vm.runInNewContext(js,context);
const icon=el.get("refresh");
function check(status,rotating,waiting,aria){
 context.window.setCandyRefreshState(status);
 assert.equal(icon.classList.contains("refreshing"),rotating);
 assert.equal(icon.classList.contains("waiting"),waiting);
 assert.equal(icon.attributes["aria-busy"],aria);
}
check({busy:false,pending:false,blocked:false},false,false,"false");
check({busy:true,pending:false,blocked:false},true,false,"true");
check({busy:true,pending:true,blocked:false},true,false,"true");
check({busy:false,pending:true,blocked:false},false,true,"false");
check({busy:false,pending:true,blocked:true},false,true,"false");
check({busy:false,pending:false,blocked:true},false,true,"false");
check({busy:false,pending:false,blocked:false},false,false,"false");
// Immediate spin after a short tap, then a native error must stop it.
icon.listeners.pointerdown({isPrimary:true});
icon.listeners.pointerup({});
assert.equal(api.refreshCandyCalls,1,"Short tap must invoke native");
assert(icon.classList.contains("refreshing"),"Short tap animates immediately");
check({busy:false,pending:false,blocked:false},false,false,"false");
// Auto-refresh must spin too, via the very same native callback.
check({busy:true,pending:false,blocked:false},true,false,"true");
check({busy:false,pending:false,blocked:false},false,false,"false");
console.log("LT180 Candy real lifecycle ↻ CSS rotation / waiting / stop / auto-refresh PASS");

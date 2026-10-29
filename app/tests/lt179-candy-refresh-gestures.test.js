"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");

const menu=fs.readFileSync("app/src/main/assets/rare_candy_controls.html","utf8");
const script=menu.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(script,"Candy menu script exists");
const listeners=new Map();
const elements=new Map();
const classList={add(){},remove(){},toggle(){}};
for(const name of ["refresh","period","location","infos","choices"]){
  elements.set(name,{
    listeners:{},classList,textContent:"",value:"",innerHTML:"",className:"",
    attributes:{},
    setAttribute(name,value){this.attributes[name]=value;},
    addEventListener(type,cb){this.listeners[type]=cb;}
  });
}
const Native={count:0,heights:[],refreshCandy(){this.count++;},
  candyMenuHeight(height,focus){this.heights.push([height,focus]);}};
const timers=new Map();
let nextTimer=0,clock=1000;
const ctx={
  window:{},
  document:{getElementById:id=>elements.get(id),
    body:{classList}},
  Native,
  Date:{now:()=>clock},
  setTimeout(cb,ms){const id=++nextTimer;timers.set(id,{cb,ms});return id;},
  clearTimeout(id){timers.delete(id);},
  console
};
vm.runInNewContext(script,ctx,{filename:"rare_candy_controls.html"});
function fire(type,props={}){
  const handler=elements.get("refresh").listeners[type];
  assert.equal(typeof handler,"function",type+" handler present");
  handler({isPrimary:true,preventDefault(){},...props});
}
function advance(ms){clock+=ms;}
function fireHold(){
  const timer=[...timers.values()].find(t=>t.ms===550);
  assert(timer,"Long hold timer must exist");
  timer.cb();
}
// Pointerup should search immediately, without a duplicate synthesized click.
fire("pointerdown");advance(40);fire("pointerup");fire("click");
assert.equal(Native.count,1,"One request for one short tap");
assert.equal(elements.get("refresh").attributes["aria-busy"],"true","Refresh begins rotating before bridge callback");
// In WebViews that lose pointerup, a normal click must still work.
advance(500);fire("click");assert.equal(Native.count,2,"Click fallback searches");
// Long press opens interval settings and never submits a search.
advance(500);fire("pointerdown");fireHold();fire("pointerup");fire("click");
assert.equal(Native.count,2,"Long press cannot search");
assert(Native.heights.some(([height])=>height===235),"Long press opens six compact Pokébola interval tiles");
// A pointerleave can lose pointerup; synth click is enough.
advance(500);fire("pointerdown");fire("pointerleave");fire("click");
assert.equal(Native.count,3,"Pointerleave followed by click searches");
// A rapid synthetic click after pointerup must not double fire.
advance(500);fire("pointerdown");fire("pointerup");fire("click");
assert.equal(Native.count,4,"Tap and click must deduplicate");
console.log("LT179 Candy tap / click fallback / hold / duplicate prevention PASS");

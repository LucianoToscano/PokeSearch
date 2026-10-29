"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const base=path.join(__dirname,"../src/main");
const main=fs.readFileSync(path.join(base,"java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
const link=fs.readFileSync(path.join(base,"assets/trainer_link_entry.js"),"utf8");
new vm.Script(link);
function node(text="",parent=null){
 return {innerText:text,textContent:text,parentElement:parent,disabled:false,
  getAttribute:()=>null,getClientRects:()=>[1],click(){this.clicks=(this.clicks||0)+1}};
}
function scenario({origin="https://pogocoordinates.com",pathname="/profile",
  root="Linked accounts Pokemon GO accounts 0/1 Link my account",
  linkLabel="Link my account",dialogs=[],duplicates=false}={}){
 const container=node(root);
 const wrap=node("Pokemon GO accounts 0/1 Link my account",container);
 const btn=node(linkLabel,wrap);
 const second=node(linkLabel,wrap);
 const list=duplicates?[btn,second]:[btn];
 const d={body:node(root),querySelectorAll(selector){
  if(selector.includes("dialog"))return dialogs.map(x=>node(x));
  return list;
 }};
 const result=JSON.parse(vm.runInNewContext(link,{document:d,location:{origin,pathname},JSON,Array}));
 return {result,clicks:list.map(x=>x.clicks||0)};
}
let r=scenario();
assert.equal(r.result.status,"clicked");assert.deepEqual(r.clicks,[1]);
r=scenario({pathname:"/search"});
assert.equal(r.result.status,"wrong-page");assert.deepEqual(r.clicks,[0]);
r=scenario({origin:"https://accounts.google.com"});
assert.equal(r.result.status,"wrong-page");assert.deepEqual(r.clicks,[0]);
r=scenario({duplicates:true});
assert.equal(r.result.status,"ambiguous");assert.deepEqual(r.clicks,[0,0]);
r=scenario({linkLabel:"Link"});
assert.equal(r.result.status,"pending");assert.deepEqual(r.clicks,[0]);
r=scenario({root:"Linked accounts Pokemon GO accounts 1/1 Linked trainer"});
assert.equal(r.result.status,"pending");
r=scenario({dialogs:["Link a Pokémon GO account Your trainer code Look up"]});
assert.equal(r.result.status,"form-open");assert.deepEqual(r.clicks,[0]);
assert.ok(!link.includes("Yes, link it"),"never invoke permanent link confirmation");
assert.ok(!link.includes("Look up"),"never submit trainer lookup");
const start=main.indexOf("private void startOverlay(){");
const end=main.indexOf("private void ",start+25);
const p1=main.slice(start,end);
const p2=main.slice(main.indexOf("private void startSecondaryOverlayAuthorized(){"),
 main.indexOf("private void refreshHomeOverlay(){"));
assert.match(p1,/startForegroundService\(i\)/);
assert.doesNotMatch(p1,/moveTaskToBack\(true\)/);
assert.doesNotMatch(p2,/moveTaskToBack\(true\)/);
assert.match(main,/trainerLinkRequested=true;\s*openLoginDialog\(false,"manage"\)/);
assert.match(main,/openOfficialTrainerLink\(view,generation,8\)/);
assert.match(main,/readAsset\("trainer_link_entry\.js"\)/);
assert.match(main,/trainerLinkStarted=true;/);
assert.match(main,/trainerLinkObserveDeadline=android\.os\.SystemClock\.uptimeMillis\(\)\+600_000L/);
assert.match(main,/boolean linkedNow="linked"\.equals/);
assert.match(main,/notifyOverlaySessionReady\(\);[\s\S]*?view\.loadUrl\("https:\/\/pogocoordinates\.com\/search"\)/);
assert.match(main,/view\.postDelayed\(\(\)->captureOfficialProfile\(view,generation\),1300L\)/);
assert.ok(!main.includes('view.evaluateJavascript("document.querySelector('),"no brittle blind confirm click");
console.log("LT170: P1 non-minimizing, scoped provider form, manual confirmation and post-link provider home PASS");

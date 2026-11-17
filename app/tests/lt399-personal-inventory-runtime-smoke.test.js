"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const sourceCode=fs.readFileSync("app/src/main/assets/personal_pokedex.js","utf8");
const nodes=new Map(),notes=new Map();
function node(id){
 if(nodes.has(id))return nodes.get(id);
 const listeners=new Map();
 const x={
  id,listeners,hidden:true,innerHTML:"",value:"",textContent:"",
  className:"",dataset:{},style:{},disabled:false,
  options:[{value:"cp",textContent:"Maior PC"}],selectedOptions:[{textContent:"Maior PC"}],
  classList:{add(){},remove(){},toggle(){}},
  addEventListener(n,callback){listeners.set(n,callback);},
  setAttribute(){},getAttribute(){return null},scrollTop:0
 };
 nodes.set(id,x);return x;
}
const p=(id,species,cp)=>({id,species,cp,attack:15,defense:12,hpIv:13,
 stamina:90,maxStamina:100,shiny:false,form:0,formName:"",tags:[],gender:1,
 heightM:1,weightKg:2,move1:1,move2:2,move3:0,caughtMs:1730000000000,
 backgroundId:0,costume:0,alignment:0});
const sample={pokemons:[p("12345",25,900),p("67890",1,700)],eggs:[],tags:[],capacity:1200};
const events=[];
const bridge={
 getSnapshot:()=>JSON.stringify(sample),getCatalog:()=>JSON.stringify([[25,"Pikachu"],[1,"Bulbasaur"]]),
 getMetaCatalog:()=>JSON.stringify({moves:[],backgrounds:[],costumes:[]}),
 getBackgroundManifest:()=>JSON.stringify({assets:[["lc_demo.png",100,"0".repeat(40)]],
  cards:[[1,"Fundo de exemplo","LOCATION_CARD","lc_demo.png"]]}),
 getBackgroundStatus:()=>JSON.stringify({downloaded:0,total:1,bytes:0,running:false,processed:0,error:""}),
 getCachedBackgroundNames:()=>JSON.stringify([]),
 getDecoration:()=>"default",setDecoration:()=>{},
 getNote:(slot,id)=>notes.get(slot+":"+id)||"",
 setNote:(slot,id,txt)=>notes.set(slot+":"+id,txt),
 getImportHistory:()=>JSON.stringify([]),
 downloadAllBackgrounds:()=>events.push("download"),
 cancelBackgroundDownload:()=>events.push("cancel"),
 clearBackgroundCache:()=>events.push("clear"),chooseJson:()=>events.push("import"),
 closeScreen:()=>events.push("close")
};
const window={PersonalInventory:bridge,PokeSearchOfflineSprite:{resolve:()=>""}};
const document={
 getElementById:node,querySelectorAll:()=>[],
 createTextNode:()=>({}),
};
const ctx={window,document,console,setTimeout:()=>1,clearTimeout:()=>{},
 Intl,Date,Map,Set,Number,String,Array,JSON,Math};
vm.runInNewContext(sourceCode,ctx,{timeout:2000,filename:"personal_pokedex.js"});
const click=(id,event={})=>{const callback=node(id).listeners.get("click");assert.equal(typeof callback,"function",id+" click handler");callback(event);};
const target=dataset=>({target:{closest:()=>({dataset})}});
assert.match(node("grid").innerHTML,/Pikachu/);
click("backgrounds-open");
assert.equal(node("background-panel").hidden,false);
click("backgrounds-close");
click("history-open");assert.equal(node("history-panel").hidden,false);
click("history-close");
click("grid",target({id:"12345"}));
assert.equal(node("detail").classList!==null,true);
node("personal-note").value="Guardar para PvP";
click("save-note");
assert.equal(notes.get("1:12345"),"Guardar para PvP");
click("detail-back");
click("select-toggle");
click("grid",target({id:"12345"}));click("grid",target({id:"67890"}));
assert.equal(node("selection-compare").disabled,false);
click("selection-compare");assert.equal(node("compare-panel").hidden,false);
click("compare-close");
click("backgrounds-open");click("backgrounds-download");
assert.deepEqual(events,["download"]);
assert.equal(window.pokeBack(),true);
console.log("LT399: runtime mínimo dos controles HTML e bridge Android aprovado.");

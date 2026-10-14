"use strict";
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const assert=require("node:assert/strict");
const source=fs.readFileSync(path.join(__dirname,"../src/main/assets/probe.js"),"utf8");

function element(text="",attrs={},extra={}){
  return {
    innerText:text,textContent:text,children:[],parentElement:null,tagName:"SPAN",
    value:"",disabled:false,
    getClientRects:()=>[{}],querySelectorAll:()=>[],querySelector:()=>null,
    getAttribute:(name)=>Object.prototype.hasOwnProperty.call(attrs,name)?attrs[name]:null,
    hasAttribute:(name)=>Object.prototype.hasOwnProperty.call(attrs,name),
    matches:(sel)=>sel==="input[type=checkbox]" && extra.checkbox===true,
    ...extra
  };
}
function run(action,mode,shinyOnly,opts={}){
  const labels=[];
  const all=[];
  const controls={};
  let pending=[];
  if(opts.switch!==undefined){
    const lab=element("Shiny only");
    const sw=element("",{"aria-checked":String(opts.switch)},{tagName:"BUTTON"});
    const parent=element();
    parent.querySelectorAll=(selector)=>{
      if(selector.includes("button[aria-checked]"))return [sw];
      return [];
    };
    lab.parentElement=parent;
    labels.push(lab);all.push(lab);
  }
  if(opts.iv!==undefined){
    const lab=element("IV");
    const fields=opts.iv.map(v=>element("",{}, {tagName:"INPUT",value:v}));
    const parent=element();
    parent.querySelectorAll=selector=>selector.includes("input:not")?fields:[];
    lab.parentElement=parent;all.push(lab);
  }
  if(opts.pending){
    pending=[element("Link a Pokémon GO account. Your trainer code: 12 digits")];
  }
  function querySelectorAll(selector){
    if(selector==="label,span,strong,div")return labels;
    if(selector==="span,label,strong,small,dt,div,p")return all;
    if(selector==='[role="dialog"],[aria-modal="true"],form')return pending;
    if(selector==="label,span,div,p,strong")return all;
    return [];
  }
  const document={querySelectorAll};
  const code=source.replace("__ACTION__",JSON.stringify(action))
      .replace("__MODE__",JSON.stringify(mode))
      .replace("__SHINY__",String(shinyOnly));
  return JSON.parse(vm.runInNewContext(code,{document,location:{pathname:"/search",hostname:"pogocoordinates.com"},window:{}}));
}
let checked=0;
function test(name,action,mode,shiny,options,predicate){
 const r=run(action,mode,shiny,options);
 assert.equal(!!r.ok,predicate,name+" -> "+JSON.stringify(r));
 checked++;
}
test("Shiny authenticated and on","verifyShiny","iv",true,{switch:true},true);
test("Shiny stays pending until enabled","verifyShiny","iv",true,{switch:false},false);
test("Shiny linking dialog blocks confirmation","verifyShiny","iv",true,{switch:true,pending:true},false);
test("Shiny off confirmed","verifyShiny","iv",false,{switch:false},true);
test("Shiny unexpectedly on blocks standard search","verifyShiny","iv",false,{switch:true},false);
test("Public search accepts missing Shiny control","verifyShiny","iv",false,{},true);
test("Raw IV valid","verifyFilters","iv",false,{iv:["15","15","15"]},true);
test("Raw IV invalid","verifyFilters","iv",false,{iv:["15","15","14"]},false);
console.log("PokeSearch probe contract: "+checked+" tests passed");

"use strict";
// PL-04: isolated DOM fixtures for the official site's asynchronous location form.
// No HTTP, credentials, site scraping, or guessed success.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const path=require("node:path");
const raw=fs.readFileSync(path.join(__dirname,"../src/main/assets/probe.js"),"utf8");
let passed=0;
function check(title,result,expected){
 assert.equal(result,expected,title);passed++;
}
function fixture(options={}){
 class MockInput{
  constructor(label,value=""){
   this.tagName="INPUT";this._value=value;this.parentElement=null;
   this.previousElementSibling=null;this.labels=[{innerText:label,textContent:label}];
   this.children=[];this.disabled=false;
  }
  get value(){return this._value;}
  set value(v){this._value=String(v);}
  getClientRects(){return [{}];}
  getAttribute(k){return options.unnamedFields?null:
   k==="aria-label"?(this.labels[0]?.innerText||""):null;}
  dispatchEvent(){return true;}
 }
 const coord=options.noCoords?null:new MockInput("Coordinates",options.currentCoords||"");
 const radius=options.noRadius?null:new MockInput(options.radiusLabel||"Radius",options.currentRadius||"");
 const visibleInputs=[coord,radius].filter(Boolean);
 const root={
  innerText:"Coords Area Coordinates Radius",children:[],
  getClientRects:()=>[{}],
  querySelectorAll:()=>visibleInputs
 };
 for(const i of visibleInputs)i.parentElement=root;
 let selected=options.active||"area";
 const buttons=["Coords","Area"].map(title=>({
  tagName:"BUTTON",innerText:title,textContent:title,disabled:false,children:[],
  className:"",checked:false,
  getClientRects:()=>[{}],
  getAttribute:(k)=>k==="aria-pressed"?
   (options.unknownState?null:String(selected===title.toLowerCase())):null,
  click:()=>{selected=title.toLowerCase();}
 }));
 const document={
  body:{innerText:"Search",getClientRects:()=>[{}]},
  querySelectorAll:sel=>{
   if(sel.startsWith("input:not"))return visibleInputs;
   if(sel.includes("[role=tab]")||sel.includes("input[type=radio]"))return buttons;
   if(sel==="button,[role=button]")return buttons;
   return [];
  }
 };
 function run(action,req={}){
  const source=raw.replace("__ACTION__",JSON.stringify(action+":"+JSON.stringify(req)))
   .replace("__MODE__",JSON.stringify("raw"))
   .replace("__SHINY__","false")
   .replace("__FILTERS__","{}");
  return JSON.parse(vm.runInNewContext(source,{
   document,window:{},location:{hostname:"pogocoordinates.com",pathname:"/search"},
   HTMLInputElement:MockInput,HTMLTextAreaElement:MockInput,
   Event:class{constructor(type){this.type=type;}}
  }));
 }
 return {coord,radius,run,selected:()=>selected};
}
const req={enabled:true,coords:"-23.5505,-46.6333",radius:10};
let f=fixture();
let result=f.run("configureLocation",req);
check("Mode changes must be reported as pending",result.pending,true);
check("React mode was switched",f.selected(),"coords");
result=f.run("configureLocation",req);
check("Location configuration succeeds after mode hydration",result.ok,true);
check("Coordinates input contains requested value",f.coord.value,req.coords);
check("Radius input contains requested value",f.radius.value,"10");
check("Verification proves exact state",f.run("verifyLocation",req).ok,true);
f.radius.value="9";
check("Changed radius is not silently accepted",f.run("verifyLocation",req).ok,false);
f.radius.value="10";
f.coord.value="-23.5506,-46.6333";
check("Changed coordinates fail verification",f.run("verifyLocation",req).ok,false);
let missing=fixture({noRadius:true});
missing.run("configureLocation",req);
check("Missing fields wait for DOM instead of returning success",
 missing.run("configureLocation",req).pending,true);
let unknown=fixture({unknownState:true});
check("Unconfirmed Coords mode cannot apply",
 unknown.run("configureLocation",req).pending,true);
let labeled=fixture({unnamedFields:true,radiusLabel:"Distance"});
labeled.run("configureLocation",req);
check("Associated visible labels work without placeholders or aria-labels",
 labeled.run("configureLocation",req).ok,true);
check("Distance label recognized as radius",labeled.run("verifyLocation",req).ok,true);
let invalid=fixture();
check("Out-of-range latitude never submits",
 invalid.run("configureLocation",{...req,coords:"91,20"}).ok,false);
check("Negative radius never submits",
 invalid.run("configureLocation",{...req,radius:-1}).ok,false);
let off=fixture({active:"coords",currentCoords:"1,2",currentRadius:"10"});
let disabled={enabled:false,coords:"",radius:0};
check("OFF clears stale values without forcing Area mode",
 off.run("configureLocation",disabled).ok,true);
check("OFF keeps the site's existing Coords tab without enabling location",off.selected(),"coords");
check("OFF confirmation clears previous radius",off.radius.value,"");
check("OFF confirmation clears previous coordinates",off.coord.value,"");
check("OFF verifies empty Coords as unrestricted search",off.run("verifyLocation",disabled).ok,true);
let emptyCoords=fixture({active:"coords"});
check("Unselected app location and empty default Coords never block Search",
 emptyCoords.run("configureLocation",disabled).ok,true);
check("Unrestricted Coords mode is verified as off",
 emptyCoords.run("verifyLocation",disabled).ok,true);
let repopulated=fixture({active:"coords",currentCoords:"1,2",currentRadius:"10"});
repopulated.run("configureLocation",disabled);
repopulated.coord.value="1,2";
check("Site rehydration restoring prior coords does not pass OFF verification",
 repopulated.run("verifyLocation",disabled).ok,false);
console.log("PokeSearch location contract: "+passed+" tests passed");

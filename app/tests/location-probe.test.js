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
 let lastInput=null;
 class MockInput{
  constructor(label,value="",placeholder=""){
   this.tagName="INPUT";this._value=value;this.parentElement=null;
   this.previousElementSibling=null;this._placeholder=placeholder;
   this.labels=label?[{innerText:label,textContent:label}]:[];
   this.children=[];this.disabled=false;
  }
  get value(){return this._value;}
  set value(v){this._value=String(v);}
  getClientRects(){return [{}];}
  getAttribute(k){return options.unnamedFields?null:
   k==="placeholder"?this._placeholder:
    k==="aria-label"?(this.labels[0]?.innerText||""):null;}
  dispatchEvent(event){
   if(event.type==="input"){
    // React may discard the first field if both change in the same JS turn.
    if(options.reactResetsSameTurn&&this===radius&&lastInput===coord)coord.value="";
    lastInput=this;
   }
   return true;
  }
 }
 const coord=options.noCoords?null:new MockInput(
  options.numericPlaceholder?"":"Coordinates",options.currentCoords||"",
  options.numericPlaceholder?"40.63727564,-73.93869163":"");
 const radius=options.noRadius?null:new MockInput(
  options.numericPlaceholder?"":options.radiusLabel||"Radius",options.currentRadius||"",
  options.numericPlaceholder?"Radius (km, max 1000)":"");
 const extraDistance=options.unrelatedDistance?new MockInput("Distance","500"):null;
 const visibleInputs=[extraDistance,coord,radius].filter(Boolean);
 const groupedInputs=[coord,radius].filter(Boolean);
 const root={
  innerText:"Coords Area Coordinates Radius",children:[],
  getClientRects:()=>[{}],querySelectorAll:()=>visibleInputs
 };
 const group={parentElement:root,innerText:"Coords Radius",children:[],
  getClientRects:()=>[{}],querySelectorAll:()=>groupedInputs};
 for(const i of groupedInputs)i.parentElement=group;
 if(extraDistance)extraDistance.parentElement=root;
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
  body:{innerText:options.siteHint?"Paste coordinates (lat,lng) and a radius.":"Search",getClientRects:()=>[{}]},
  querySelectorAll:sel=>{
   if(sel.startsWith("input:not"))return visibleInputs;
   if(sel.includes("[role=tab]")||sel.includes("input[type=radio]"))return buttons;
   if(sel==="button,[role=button]")return buttons;
   return [];
  }
 };
 function run(action,req={}){
  lastInput=null;
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
 return {coord,radius,extraDistance,run,selected:()=>selected};
}
function settle(f,request,maxCycles=7){
 let result;
 for(let i=0;i<maxCycles;i++){
  result=f.run("configureLocation",request);
  if(result.ok||!result.pending)return result;
 }
 return result;
}
const req={enabled:true,coords:"-23.5505,-46.6333",radius:10};
let f=fixture();
let result=f.run("configureLocation",req);
check("Mode changes must be reported as pending",result.pending,true);
check("React mode was switched",f.selected(),"coords");
result=f.run("configureLocation",req);
check("First React-controlled edit returns pending coordinates",result.stage,"setting-coords");
result=f.run("configureLocation",req);
check("Second React-controlled edit returns pending radius",result.stage,"setting-radius");
result=f.run("configureLocation",req);
check("Location configuration succeeds after mode hydration",result.ok,true);
check("Coordinates input contains requested value",f.coord.value,req.coords);
check("Radius input contains requested value",f.radius.value,"10");
check("Verification proves exact state",f.run("verifyLocation",req).ok,true);
f.radius.value="9";
check("Changed radius is not silently accepted",f.run("verifyLocation",req).ok,false);
check("Divergent radius reports the correct field",f.run("verifyLocation",req).reason,"Raio não persistiu no campo Radius do site");
f.radius.value="10";
f.coord.value="-23.5506,-46.6333";
check("Changed coordinates fail verification",f.run("verifyLocation",req).ok,false);
check("Divergent coords report no personal numeric data",f.run("verifyLocation",req).reason,"Coordenadas não persistiram no campo Coords do site");
let missing=fixture({noRadius:true});
missing.run("configureLocation",req);
check("Missing fields wait for DOM instead of returning success",
 missing.run("configureLocation",req).pending,true);
let unknown=fixture({unknownState:true});
check("Unconfirmed Coords mode cannot apply",
 unknown.run("configureLocation",req).pending,true);
check("Unconfirmed mode identifies missing proof",unknown.run("verifyLocation",req).reason,"Modo Coords não confirmado no site");
let labeled=fixture({unnamedFields:true,radiusLabel:"Distance"});
labeled.run("configureLocation",req);
check("Associated visible labels work without placeholders or aria-labels",
 settle(labeled,req).ok,true);
check("Distance label recognized as radius",labeled.run("verifyLocation",req).ok,true);
let invalid=fixture();
check("Out-of-range latitude never submits",
 invalid.run("configureLocation",{...req,coords:"91,20"}).ok,false);
check("Negative radius never submits",
 invalid.run("configureLocation",{...req,radius:-1}).ok,false);
let off=fixture({active:"coords",currentCoords:"1,2",currentRadius:"10"});
let disabled={enabled:false,coords:"",radius:0};
check("OFF clears coordinates before clearing radius",off.run("configureLocation",disabled).stage,"clearing-coords");
check("OFF clears radius in a separate React cycle",off.run("configureLocation",disabled).stage,"clearing-radius");
check("OFF clears stale values without forcing Area mode",off.run("configureLocation",disabled).ok,true);
check("OFF keeps the site's existing Coords tab without enabling location",off.selected(),"coords");
check("OFF confirmation clears previous radius",off.radius.value,"");
check("OFF confirmation clears previous coordinates",off.coord.value,"");
check("OFF verifies empty Coords as unrestricted search",off.run("verifyLocation",disabled).ok,true);
let emptyCoords=fixture({active:"coords"});
check("Unselected app location and empty default Coords never block Search",
 emptyCoords.run("configureLocation",disabled).ok,true);
check("Unrestricted Coords mode is verified as off",
 emptyCoords.run("verifyLocation",disabled).ok,true);
// The website may prefill Radius (e.g. 10 km) before any coordinates.
// Radius alone cannot activate a location filter or block a public search.
let siteDefaultRadius=fixture({active:"coords",currentRadius:"10"});
check("Location OFF with empty coords and site default radius still allows general searches",
 siteDefaultRadius.run("configureLocation",disabled).ok,true);
check("OFF preserves the inert site default radius instead of mutating filters",
 siteDefaultRadius.radius.value,"10");
check("OFF verification does not mistake the default radius for active coordinates",
 siteDefaultRadius.run("verifyLocation",disabled).ok,true);
let repopulated=fixture({active:"coords",currentCoords:"1,2",currentRadius:"10"});
repopulated.run("configureLocation",disabled);
repopulated.coord.value="1,2";
check("Site rehydration restoring prior coords does not pass OFF verification",
 repopulated.run("verifyLocation",disabled).ok,false);
// Zero and 1000km are both allowed by the existing documented filter.
let zeroRadius=fixture();
const reqZero={...req,radius:0};
zeroRadius.run("configureLocation",reqZero);
check("Zero-radius Coords form applies after React tab changes",
 settle(zeroRadius,reqZero).ok,true);
check("Zero radius remains 0 instead of being treated as an empty string",
 zeroRadius.radius.value,"0");
check("Zero radius is verified as exactly the requested filter",
 zeroRadius.run("verifyLocation",reqZero).ok,true);
let worldRadius=fixture();
const reqMax={...req,radius:1000};
worldRadius.run("configureLocation",reqMax);
check("Maximum documented radius 1000 is applied",
 settle(worldRadius,reqMax).ok,true);
check("Maximum radius passes exact site verification",
 worldRadius.run("verifyLocation",reqMax).ok,true);
worldRadius.radius.value="1001";
check("Site never silently expands maximum radius after hydration",
 worldRadius.run("verifyLocation",reqMax).ok,false);

let raced=fixture({reactResetsSameTurn:true});
check("React form initially requests Coords",raced.run("configureLocation",req).pending,true);
check("React forms edit coords first",raced.run("configureLocation",req).stage,"setting-coords");
check("React forms edit radius in the next turn",raced.run("configureLocation",req).stage,"setting-radius");
check("The first field survives a simulated React same-turn reset",raced.coord.value,req.coords);
check("React form is confirmed only after a subsequent read",raced.run("configureLocation",req).ok,true);
let normalized=fixture({active:"coords",currentCoords:"-23.550500,-46.633300",currentRadius:"10"});
check("Semantically identical coordinates do not cause endless rewrites",normalized.run("configureLocation",req).ok,true);
let stalled=fixture({active:"coords",currentCoords:"11,22",currentRadius:"10"});
check("Stale coords require an OFF transition",stalled.run("configureLocation",disabled).stage,"clearing-coords");
stalled.coord.value="11,22";
check("Rehydrated stale coords cannot be considered disabled",stalled.run("verifyLocation",disabled).ok,false);
check("Repeated OFF returns pending until restored stale coords are cleared",stalled.run("configureLocation",disabled).pending,true);
let disabledFields=fixture({active:"coords"});
disabledFields.radius.disabled=true;
check("Disabled React radius blocks active location configuration",disabledFields.run("configureLocation",req).pending,true);
check("Disabled radius never causes premature confirmed Coords",disabledFields.run("verifyLocation",req).ok,false);
let disabledOff=fixture({active:"coords",currentCoords:"1,2",currentRadius:"10"});
disabledOff.coord.disabled=true;
check("Disabled Coords cannot be cleared optimistically",disabledOff.run("configureLocation",disabled).stage,"waiting-coords");
check("Disabled Coords retains its original value",disabledOff.coord.value,"1,2");
let withDistance=fixture({active:"coords",unrelatedDistance:true});
check("Location chooses the actual Coords and Radius pair despite a Distance filter",
 settle(withDistance,req).ok,true);
check("Location Radius field receives the requested value",withDistance.radius.value,"10");
check("Unrelated Distance setting remains unchanged",withDistance.extraDistance.value,"500");
check("Location verification checks the correct radius",withDistance.run("verifyLocation",req).ok,true);
// Simulate the exact visible site inputs rather than invented Coordinates labels.
let liveLike=fixture({active:"coords",unknownState:true,siteHint:true,
 numericPlaceholder:true,unrelatedDistance:true});
check("Numeric placeholder resolves Coords field",liveLike.run("configureLocation",req).stage,"setting-coords");
check("Numeric Coords and Radius configure independently",settle(liveLike,req).ok,true);
check("Radius field is updated",liveLike.radius.value,"10");
check("Unrelated Distance is preserved",liveLike.extraDistance.value,"500");
check("Site-like form verifies exact values",liveLike.run("verifyLocation",req).ok,true);
liveLike.coord.value="-1,-2";
check("Changing Coords invalidates proof",liveLike.run("verifyLocation",req).ok,false);
let ambiguous=fixture({active:"area",unknownState:true,numericPlaceholder:true});
check("Unconfirmed tab never passes as active",ambiguous.run("configureLocation",req).pending,true);
console.log("PokeSearch location contract: "+passed+" tests passed");

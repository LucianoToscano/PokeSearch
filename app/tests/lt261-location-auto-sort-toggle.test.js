"use strict";
// LT261: Location acts as a one-time defaulting event, NOT a persistent
// distance-sort lock. P1/P2 inherit the same native Bridge contract.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const main=path.join(__dirname,"../src/main");
const java=fs.readFileSync(path.join(main,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const dock=fs.readFileSync(path.join(main,"assets/dock.html"),"utf8");
const secondary=fs.readFileSync(path.join(main,"java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java"),"utf8");
const sliceBetween=(str,first,last)=>{
 const start=str.indexOf(first);const end=str.indexOf(last,start+first.length);
 assert.ok(start>=0&&end>start,"missing section: "+first);
 return str.slice(start,end);
};
const helper=sliceBetween(java,
 "private boolean persistLocationToggleSort(boolean enabled,boolean repairInvalidDistance){",
 "@JavascriptInterface public void setLocation(boolean enabled,String coords,int radius)");
const setter=sliceBetween(java,
 "@JavascriptInterface public void setLocation(boolean enabled,String coords,int radius)",
 "// LT91-A");
assert.ok(helper.includes('final String wanted=enabled?"Distance (nearest)":"Despawn (longest)"'));
assert.ok(helper.includes('if(repairInvalidDistance&&!"Distance (nearest)".equals(current))'));
assert.ok(helper.includes('boolean changed=!wanted.equals(current)'));
assert.ok(helper.includes('filters.put("sortBy",wanted)'));
assert.ok(helper.includes('filters.optJSONArray("clearExtraKeys")'));
assert.ok(helper.includes('if("sortBy".equals(key))pendingClear=true;'));
assert.ok(helper.includes('overlayPrefs().edit().putString("extraFiltersJson",extraFiltersJson).apply()'));
assert.ok(!helper.includes("new JSONObject()"),"never replace all filters");
assert.ok(setter.indexOf('if(enabled&&(valid.isEmpty()||radius<0||radius>1000))')<
 setter.indexOf('final boolean toggled=locationEnabled!=enabled;'),
 "invalid new location must never change sort");
assert.ok(setter.includes('final boolean sortChanged=toggled?'));
assert.ok(setter.includes('persistLocationToggleSort(enabled,false)'));
assert.ok(setter.includes('(!enabled&&persistLocationToggleSort(false,true))'));
assert.ok(setter.indexOf("persistLocationToggleSort(enabled,false)")<
 setter.indexOf("if(locationEnabled==enabled&&"),"transition must apply before early return");
assert.ok(setter.includes('locationCoords.equals(valid)&&locationRadius==radius'),
 "same-state location and radius edits must retain manual sorting");
const guard=sliceBetween(java,'// Defensive guard for migrations/older menus:',"org.json.JSONArray clear=new org.json.JSONArray();");
assert.ok(guard.includes('(!locationEnabled||extractCoordinates(locationCoords).isEmpty())'),
 "Distance must be available for a valid newly added location, even before results return");
assert.ok(!guard.includes("locationVerified"),"verification delay cannot reset Distance automatically");
assert.ok(dock.includes('const previouslyEnabled=locationEnabled;'));
assert.ok(dock.includes('if(previouslyEnabled!==locationEnabled&&modeDraft)'));
assert.ok(dock.includes('modeDraft.sortBy=searchSettings.sortBy;'));
assert.ok(dock.includes('!(locationEnabled&&locationCoords.trim())'),
 "Allow manually selecting Distance with valid location while verification is pending");
assert.ok(dock.includes('modeDraft.sortBy==="Distance (nearest)"||')&&
 dock.includes('modeDraft.sortBy==="Distance (farthest)")&&!(locationEnabled&&locationCoords.trim()))'),
 "Filters Apply must guard both distance directions only when location is absent");
assert.equal((dock.match(/\!\(locationEnabled&&locationCoords\.trim\(\)\)/g)||[]).length,2,
 "Both choice and Apply guards must agree when location is valid");
assert.ok(secondary.includes("extends OverlayService"),"P1 and P2 use the same location sort policy");
for(const m of dock.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
 new vm.Script(m[1]);
// Explicit state-machine acceptance cases, mirroring the native two inputs.
const DIST="Distance (nearest)",DES="Despawn (longest)",CP="CP (highest)",IV="IV % (highest)";
const change=(state,enabled,newCoords,valid=true)=>{
 const changed=state.locationEnabled!==enabled;
 if(enabled&&!valid)return state; // validation rejects without mutating preferences
 const sort=changed?(enabled?DIST:DES):
  !enabled&&state.sort===DIST?DES:state.sort;
 return {...state,locationEnabled:enabled,coords:enabled?newCoords:"",
  sort,filters:{...state.filters}};
};
let state={locationEnabled:false,coords:"",sort:IV,
 filters:{pokemonSelections:["Shellos"],weather:"Rainy",cpMin:"400",levelMax:"30",gender:"Male"}};
state=change(state,true,"35.1,139.2");
assert.equal(state.sort,DIST,"OFF→ON must choose nearest distance regardless of former manual IV");
state.sort=CP; // the user can override the automatic choice.
state=change(state,true,"35.2,139.3");assert.equal(state.sort,CP,"edit coordinates while ON");
state=change(state,true,"35.2,139.3");assert.equal(state.sort,CP,"reapply same location");
state=change(state,false,"");assert.equal(state.sort,DES,"ON→OFF must choose Despawn, even after CP");
state.sort=IV;
state=change(state,false,"");assert.equal(state.sort,IV,"repeated clear respects manual choice");
state=change(state,true,"invalid",false);
assert.equal(state.locationEnabled,false);assert.equal(state.sort,IV,"invalid location must not reset a manual sort");
state=change(state,true,"40.6,-73.9");assert.equal(state.sort,DIST,"next OFF→ON resets once");
state.sort=DES;state=change(state,true,"40.7,-73.9");assert.equal(state.sort,DES);
state=change(state,false,"");assert.equal(state.sort,DES);
assert.deepEqual(state.filters,{pokemonSelections:["Shellos"],weather:"Rainy",cpMin:"400",levelMax:"30",gender:"Male"});
console.log("LT261 PASS: OFF→ON Distance, ON→OFF Despawn, manual override until next transition, invalid/same-state/idempotent safety, P1/P2 parity");

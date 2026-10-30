"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const base=path.join(__dirname,"../src/main");
const read=p=>fs.readFileSync(path.join(base,p),"utf8");
const dock=read("assets/dock.html");
const probe=read("assets/probe.js");
const service=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const secondary=read("java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java");
const api=require("../src/main/assets/api_result_contract.js");
let tests=0;
function check(label,fn){fn();tests++;console.log("PASS LT188 "+label);}
const baseMode={mode:"raw",attack:0,defense:13,stamina:13,glRank:5,ulRank:5,
 percentMin:65,percentMax:95,locationEnabled:false,sortBy:"Despawn (longest)"};
function payload(config){const r=api.buildPayload({...baseMode,...config});assert.equal(r.ok,true,JSON.stringify(r));return r.payload;}
check("GL/UL menu keeps common PC and Level in the same order",()=>{
 const section=dock.split("function renderExtraFilters(panel,make){")[1].split("function renderFilterPicker(",1)[0];
 assert.ok(section,"filter menu missing");
 const names=['option("sortBy","Ordenar")','numberPair("PC","cpMin","cpMax")',
  'numberPair("Nível","levelMin","levelMax",true)','option("weather","Clima")',
  'chips("size","Tamanho")','chips("gender","Sexo")','field("Forma",formEditor)'];
 let previous=-1;
 for(const name of names){const i=section.indexOf(name);assert.ok(i>previous,name);previous=i;}
 assert.ok(section.includes('number("minPvpCp","PC mínimo PvP")'));
 assert.ok(section.includes('field("Evoluções anteriores",input)'));
 assert.doesNotMatch(section,/if\(!pvp\)\{\s*numberPair\("PC"/);
});
check("all modes validate min/max, without suppressing range checks in PvP",()=>{
 const section=dock.split("function renderFiltersChoices(){")[1].split("function renderInfoChoices()",1)[0];
 assert.match(section,/\[\["cpMin","cpMax"\],\["levelMin","levelMax"\]\]/);
 assert.doesNotMatch(section,/if\(!\["gl","ul"\]\.includes\(modeDraft\.mode\)\)\{\s*for\(const \[lowKey,highKey\]/);
});
check("DOM search never silently drops ordinary CP/Level in GL/UL",()=>{
 const section=probe.split("function extraNumberKeys(){")[1].split("\n}",1)[0];
 for(const value of ["cpMin","cpMax","levelMin","levelMax","minPvpCp"])assert.ok(section.includes('"'+value+'"'),value);
 assert.ok(probe.includes("for(const key of extraNumberKeys())"));
});
check("authorized API composes GL or UL with CP/Level AND independent PC PvP",()=>{
 for(const mode of ["gl","ul"]){
  const x=payload({mode,cpMin:"400",cpMax:"1400",levelMin:"4",levelMax:"33",minPvpCp:"100",includePreviousEvolutions:false});
  assert.equal(x.pvp_mode,true);assert.equal(x.pvp_league,mode==="gl"?"great":"ultra");
  assert.equal(x.cp_min,400);assert.equal(x.cp_max,1400);
  assert.equal(x.level_min,4);assert.equal(x.level_max,33);
  assert.equal(x.pvp_min_cp,100);assert.equal(x.pvp_top_rank,5);
  assert.equal(x.pvp_include_pre_evolutions,false);
 }
});
check("personalized IV 0/13/13 no longer carries UL ranking in API payload",()=>{
 const x=payload({mode:"raw",attack:0,defense:13,stamina:13});
 assert.equal(x.pvp_mode,false);
 assert.equal(x.pvp_top_rank,null);
 assert.equal(x.raw_iv_atk,0);assert.equal(x.raw_iv_def,13);assert.equal(x.raw_iv_sta,13);
});
check("IV percent no longer carries UL ranking in API payload",()=>{
 const x=payload({mode:"percent",percentMin:75,percentMax:95});
 assert.equal(x.pvp_mode,false);assert.equal(x.pvp_top_rank,null);
 assert.equal(x.iv_mode,"percent");assert.equal(x.iv_percent_min,75);assert.equal(x.iv_percent_max,95);
});
check("new core mode clears unverified previous mode results and icon",()=>{
 const helper=service.split("private boolean restoreMatchingFilterPreview(){")[1].split("\n    }",1)[0];
 assert.ok(helper.includes("if(restoreFilterPreview())return true;"));
 for(const s of ['results="[]"','selected=-1','shownMode=mode','shownConfigJson=filterConfigJson()','resultsStale=false'])
  assert.ok(helper.includes(s),s);
 const set=service.split("@JavascriptInterface public void setSearchConfig(")[1].split("@JavascriptInterface public void setMode(",1)[0];
 const cycle=service.split("@JavascriptInterface public void cycleMode()")[1].split("private void applySpriteSize(",1)[0];
 const select=service.split("@JavascriptInterface public void select(String s)")[1].split("@JavascriptInterface public void menu(",1)[0];
 for(const method of [set,select,cycle])assert.ok(method.includes("restoreMatchingFilterPreview()"));
});
check("both Pokeballs share implementation but not saved modes/filters",()=>{
 assert.match(secondary,/extends OverlayService/);
 assert.match(secondary,/isSecondaryOverlay\(\)\{return true;\}/);
 assert.match(service,/getSharedPreferences\(isSecondaryOverlay\(\)\?"prefs_secondary":"prefs",0\)/);
 assert.match(service,/putString\("mode",mode\)/);
 assert.match(service,/putString\("extraFiltersJson",extraFiltersJson\)/);
});
check("API and UI keep the different PvP minimum and normal CP range independent",()=>{
 assert.ok(dock.includes('"cpMin","cpMax","levelMin","levelMax","minPvpCp"'));
 assert.match(api.buildPayload.toString(),/pvp_min_cp/);
});
console.log("LT188 DUAL MODE FILTER AUDIT "+tests+"/"+tests+" PASS");

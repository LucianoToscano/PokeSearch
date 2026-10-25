"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const html=fs.readFileSync(path.join(__dirname,"../src/main/assets/dock.html"),"utf8");
const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const source=scripts.join("\n");
function section(start,end){
 const a=source.indexOf(start),b=source.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,"missing function: "+start);
 return source.slice(a,b);
}
let count=0;
function check(label,fn){fn();count++;console.log("PASS LT77 Stage3 "+label);}
check("inline Javascript syntax",()=>scripts.forEach((s,i)=>new vm.Script(s,{filename:"dock-"+i})));
const level=section("function confirmNumericFilter(keys,label){","function numericConfirmButton(");
function applyLevel(min,max,previous={}){
 const state={levelMin:min,levelMax:max};
 const ctx={
  modeDraft:state,searchSettings:{levelMin:"",levelMax:"",...previous},
  errors:[],patches:[],closed:0,
  document:{querySelector:()=>({
    setCustomValidity(msg){ctx.errors.push(msg);},reportValidity(){return false;}
  })},
  closeChoices(){ctx.closed++;},
  Native:{patchSearchFilters(value){ctx.patches.push(JSON.parse(value));}}
 };
 vm.runInNewContext(level,ctx);
 const ok=ctx.confirmNumericFilter(["levelMin","levelMax"],"Nível");
 return {ok,state,ctx};
}
check("empty minimum and maximum",()=>{
 const {ok,ctx}=applyLevel("","");
 assert.equal(ok,true);assert.equal(ctx.patches.length,0);
});
check("min=1 max=50 accepted",()=>{
 const {ok,ctx}=applyLevel("1","50");
 assert.equal(ok,true);assert.equal(ctx.patches.length,1);
 assert.equal(ctx.patches[0].levelMin,"1");assert.equal(ctx.patches[0].levelMax,"50");
});
check("only minimum or maximum can be provided",()=>{
 assert.equal(applyLevel("","35").ok,true);
 assert.equal(applyLevel("1","").ok,true);
});
check("Min greater than Max rejected",()=>{
 const {ok,ctx}=applyLevel("25","20");
 assert.equal(ok,false);assert.equal(ctx.patches.length,0);assert.equal(ctx.closed,0);
 assert.match(ctx.errors.join(" "),/Min não pode ultrapassar Max/);
});
check("out of range and nonnumeric levels rejected",()=>{
 for(const [a,b] of [["0","50"],["1","51"],["-2","50"],["1","2x"]]){
  const {ok,ctx}=applyLevel(a,b);
  assert.equal(ok,false,a+","+b);assert.equal(ctx.patches.length,0);
 }
});
check("legacy level 50 accepted, never silently cleared",()=>{
 const {ok,state,ctx}=applyLevel("50","50");
 assert.equal(ok,true);assert.equal(state.levelMin,"50");
 assert.equal(ctx.patches.length,1);
 assert.ok(source.includes('input.value=String(modeDraft[key]??'));
 assert.ok(!source.includes('input.value="";modeDraft[key]=""'));
});
check("two-digit level fields and numeric keyboard",()=>{
 for(const text of [
  'input.type=level?"text":"number"', 'input.inputMode="numeric"',
  'input.maxLength=2;input.pattern="[0-9]{1,2}"',
  'input.placeholder=key.endsWith("Min")?"Min":"Max"',
  'numberPair("Nível","levelMin","levelMax",true)',
  'numericConfirmButton(make,[minKey,maxKey],label)'
 ])assert.ok(source.includes(text),text);
 assert.ok(html.includes('width:31px!important'));
});
check("three gender chips; tap again resets to Any",()=>{
 const filter=section("function renderExtraFilters(panel,make){","function renderFilterPicker(");
 assert.ok(filter.includes('["Male","Female","Genderless"]'));
 assert.ok(!filter.includes('["Any","Male","Female","Genderless"]'));
 assert.ok(filter.includes('modeDraft[multiKey]=checked?[]:[resolved]'));
 assert.ok(filter.includes('filterOptions[key]?.options'));
 assert.ok(source.includes('filterOptions.form?.options'));
 assert.ok(html.includes('grid-template-columns:repeat(3,23px)!important'));
});
check("seven Size chips remain multiselect and single-line",()=>{
 assert.ok(source.includes('["XXS","XS","S","M","L","XL","XXL"]'));
 assert.ok(source.includes('modeDraft[multiKey]=[...selected]'));
 assert.ok(html.includes('grid-template-columns:repeat(7,23px)!important'));
 assert.ok(html.includes('grid-template-rows:23px!important'));
});
const sanitizer=section("function sanitizeLocationRadiusDraft(raw){","function renderLocationChoices(){");
const ctx={};vm.runInNewContext(sanitizer,ctx);
check("radius 0, 1, 999, 1000, boundary and empty",()=>{
 for(const [input,expected] of [["0","0"],["1","1"],["999","999"],["1000","1000"],
  ["1001","1000"],["12345","1000"],["abc",""],["",""]]){
  assert.equal(ctx.sanitizeLocationRadiusDraft(input),expected,input);
 }
});
check("location title and full coordinate field on separate centered rows",()=>{
 const loc=section("function renderLocationChoices(){","let requestedInterval");
 assert.ok(loc.includes("label.append(labelName,paste,copy,radiusWrap)"));
 assert.ok(loc.includes("fieldRow.append(field);"));
 assert.ok(loc.includes("panel.append(title,fieldRow,slide,label,message)"));
 assert.ok(loc.includes("panel.append(title,fieldRow,slide,label,message)"));
 assert.ok(loc.includes('radiusField.maxLength=4'));
 assert.ok(loc.includes('radiusField.inputMode="numeric"'));
 assert.ok(loc.includes('radiusField.value.trim()===""'));
 assert.ok(loc.includes('Native.setLocation(true,wantedCoords,wantedRadius)'));
 assert.ok(loc.includes('Native.setLocation(false,"",0)'));
});
check("compact CSS scoped to filters and popup",()=>{
 const css=html.split("/* LT77 Stage 3")[1].split("</style>")[0];
 for(const text of [
  "width:min(256px,calc(100vw - 12px))!important",
  ".choiceHeader .locCoordsRow{",
  ".locRadiusInputWrap input.locRadiusNumber{",
  "width:42px!important",
  "padding:0 0 0 1px!important",
  ".extraChipRow[data-kind=\"gender\"]",
  "grid-template-columns:repeat(3,23px)!important"
 ])assert.ok(css.includes(text),text);
});
console.log("LT77 Stage 3: "+count+"/"+count+" PASS");

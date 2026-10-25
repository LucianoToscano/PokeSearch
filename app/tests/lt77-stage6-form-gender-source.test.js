"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const app=path.join(__dirname,"../src/main/assets");
const probe=fs.readFileSync(path.join(app,"probe.js"),"utf8");
const dock=fs.readFileSync(path.join(app,"dock.html"),"utf8");
const start=probe.indexOf("function extraPopupMatchesKey("),end=probe.indexOf("function extraOptionPopup(",start);
assert.ok(start>=0&&end>start);
const ctx={vis:()=>true,text:x=>x.textContent,clean:x=>String(x).trim()};
vm.runInNewContext(probe.slice(start,end),ctx);
function popup(...options){return {querySelectorAll:()=>options.map(textContent=>({textContent}))};}
let pass=0;function check(label,fn){fn();pass++;console.log("PASS LT77 Stage6 "+label);}
check("Gender portal of four options is not Form",()=>assert.equal(ctx.extraPopupMatchesKey("form",popup("Any","Male","Female","Genderless")),false));
check("partially loaded Gender portal of two options is not Form",()=>assert.equal(ctx.extraPopupMatchesKey("form",popup("Male","Female")),false));
check("normal Form options remain readable",()=>assert.equal(ctx.extraPopupMatchesKey("form",popup("Alola","Galarian","Copy 2019")),true));
check("numeric Form IDs remain acceptable when site returns them",()=>assert.equal(ctx.extraPopupMatchesKey("form",popup("00","23")),true));
check("Gender portal with Form options fails closed",()=>assert.equal(ctx.extraPopupMatchesKey("gender",popup("Alola","Copy 2019")),false));
check("Form cannot obtain adjacent Gender control as fallback",()=>{
 assert.ok(probe.includes('return null; // Fail closed, NEVER return the adjacent Gender control for Form.'));
 assert.ok(probe.includes('extraPopupMatchesKey(key,leaf[0])?leaf[0]:null'));
 assert.ok(probe.includes("const control=extraControl('Form');"));
});
check("separate sources and selection state in UI",()=>{
 assert.ok(dock.includes('filterOptions.form?.options'));
 assert.ok(dock.includes('filterOptions[key]?.options'));
 assert.ok(dock.includes('modeDraft.formSelections='));
 assert.ok(dock.includes('chips("gender","Sexo")'));
 assert.ok(dock.includes('field("Forma",formEditor)'));
});
check("site selects cannot misroute a Gender-only Form option",()=>{
 assert.ok(probe.includes('if(key==="form"){'));
 assert.ok(probe.includes('distinct.length>=2&&distinct.every(v=>'));
 assert.ok(probe.includes('return {ok:false,pending:true,options:[]};'));
});
check("unchanged DOM search validates selected forms",()=>{
 assert.ok(probe.includes('extraMulti("form",wanted,action)'));
 assert.ok(probe.includes('failed.push("formSelections")'));
 assert.ok(probe.includes('extraSelect("gender",wanted[0]||"")'));
});
console.log("LT77 Stage6 "+pass+"/"+pass+" PASS");

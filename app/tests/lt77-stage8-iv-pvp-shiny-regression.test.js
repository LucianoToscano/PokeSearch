"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const dir=path.join(__dirname,"../src/main");
const service=fs.readFileSync(path.join(dir,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const dock=fs.readFileSync(path.join(dir,"assets/dock.html"),"utf8");
const probe=fs.readFileSync(path.join(dir,"assets/probe.js"),"utf8");
let n=0;function check(name,fn){fn();n++;console.log("PASS LT77 Stage8 "+name);}
check("Raw IV values bounded 0–15 and persisted",()=>{
 assert.ok(service.includes('within(a,0,15)'));
 assert.ok(service.includes('within(d,0,15)'));
 assert.ok(service.includes('within(st,0,15)'));
 assert.ok(service.includes('putInt("rawStamina",st)'));
});
check("IV percent range 0–100 and proper lower/upper ordering",()=>{
 assert.ok(service.includes('!within(min,0,100)||!within(max,0,100)||min>max'));
 assert.ok(dock.includes('["percentMin","Min %","percent"'));
});
check("GL and UL ranking bounded 1–50",()=>{
 assert.ok(service.includes('within(gl,1,50)'));
 assert.ok(service.includes('within(ul,1,50)'));
 assert.ok(dock.includes('["glRank","#","rank"'));
 assert.ok(dock.includes('["ulRank","#","rank"'));
});
check("Shiny request has observed pending versus confirmed state",()=>{
 assert.ok(dock.includes('shinyPending=!!pending;'));
 assert.ok(dock.includes('geoControl.classList.toggle("locPending"'));
 assert.ok(dock.includes('document.getElementById("sh").classList.toggle("shinyPending",shinyPending)'));
});
check("Shiny site switch must be verified before Search",()=>{
 assert.ok(service.includes('execute("verifyShiny",verified->'));
 assert.ok(service.includes('if(verified.optBoolean("ok",false))verifyAndSubmit('));
 assert.ok(service.includes('searchFailure("⚠ Shiny não confirmado"'));
 assert.ok(probe.includes('if(action==="setShiny"'));
});
check("no extra Search on toggling separate menu",()=>{
 assert.ok(service.includes('generation!=requestGeneration'));
 assert.ok(service.includes('submittedSearchGeneration==requestGeneration'));
});
check("shiny is conditional on linked trainer state",()=>{
 assert.ok(service.includes('revertUnverifiedShiny('));
 assert.ok(service.includes('openShinyLogin()'));
});
console.log("LT77 Stage8 "+n+"/"+n+" PASS");

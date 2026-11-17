"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"..","src","main");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const probe=read("assets/probe.js");
const home=read("java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const svc=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const extract=(start,end)=>probe.slice(probe.indexOf(start),probe.indexOf(end,probe.indexOf(start)));

test("LT392: sem badge na Home; P1/P2 associadas no hub oficial",()=>{
 const homeBalls=home.slice(home.indexOf("LinearLayout dualOverlayRow="),
   home.indexOf("// Novos módulos",home.indexOf("LinearLayout dualOverlayRow=")));
 assert.doesNotMatch(homeBalls,/loginHotspot|pokeballLoginBadges\[i\]=badge/);
 const hub=home.slice(home.indexOf("private void showPogoAccountHub(){"),
   home.indexOf("private String pogoAccountSummary"));
 assert.match(hub,/Vincular Pokébolas/);
 assert.match(hub,/for\(int index=0;index<2;index\+\+\)/);
 assert.match(hub,/R\.drawable\.home_pokeball_on/);
 assert.match(hub,/showCompactAccountNames\(choice,secondary\)/);
 assert.match(home,/PogoAccountSlots\.bindAccountOnly\(this,secondary,account\)/);
 assert.match(home,/pogoBindingTitle\(secondary\)/);
});
test("LT392: can recover five separate cards without LOCATION label",()=>{
 const roots=[],actions=[],grid={innerText:"",parentElement:null};
 grid.querySelectorAll=()=>actions;
 for(let i=0;i<5;i++){
  const action={innerText:"Get coords",getClientRects:()=>[{}]};
  const shell={innerText:"Get coords",parentElement:null,
    querySelectorAll:()=>[action]};
  const card={innerText:"Ducklett #"+(580+i)+" CP 432 67% DESPAWN 03:42 Get coords",
    parentElement:grid,querySelectorAll:()=>[action]};
  action.parentElement=shell;shell.parentElement=card;
  roots.push(card);actions.push(action);
 }
 grid.innerText=roots.map(x=>x.innerText).join(" ");
 const method=extract("function cardRoots(){","// Submission-scoped result evidence.");
 const result=vm.runInNewContext(method+"\ncardRoots();",{
  elements:()=>actions,
  vis:()=>true,
  text:el=>el.innerText
 });
 assert.equal(result.length,5);
 for(let i=0;i<5;i++){
  assert.strictEqual(result[i].node,roots[i]);
  assert.equal(result[i].sourceIndex,i);
 }
});
test("LT392: only unique possible IV percentage is accepted from each card",()=>{
 const percentSource=extract(" const explicitPct="," // Only 100% and 0%");
 const readPct=body=>vm.runInNewContext("(function(){"+percentSource+
  ";return {pct:labeledPct,single:singleCardPercent};})()",{
  ivText:body,body,ivMatch:null
 });
 for(const pct of ["67","76","44","100","0"]){
  assert.equal(readPct("Ducklett #580 CP 400 "+pct+"% Get coords").pct,pct);
 }
 assert.equal(readPct("Ducklett #580 CP 400 67% 76% Get coords").pct,"",
  "ambiguous percentages are NOT merged into an IV");
 assert.equal(readPct("Ducklett #580 CP 400 1% Get coords").pct,"",
  "impossible IV grid percentage is rejected");
 assert.equal(readPct("Ducklett #580 CP 400 IV 100% Get coords").pct,"100",
  "a unique in-card percentage may be accepted even on compact mobile rows");
 assert.match(probe,/const evidence=verifiedCardIv\(x\)/);
 assert.match(probe,/return evidence\.raw!==""&&evidence\.raw===target/);
});
test("LT392: guest route stays public, while refresh needs provider evidence",()=>{
 assert.match(svc,/const guestPublicSearch=!shiny&&/);
 assert.match(svc,/if\(!authorizedApiQaSelected\(\)\|\|guestPublicSearch\)/);
 assert.match(probe,/submission\.observedBusy===true&&!loading/);
 assert.match(probe,/if\(submission&&loading\)submission\.observedBusy=true/);
 assert.match(probe,/resultFreshnessPending=found\.length>0&&!resultChanged/);
 assert.match(svc,/apiProviderBackoffUntil\(\)>0L/);
});

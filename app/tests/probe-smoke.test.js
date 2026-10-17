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
    matches:(sel)=>(sel==="input"&&extra.tagName==="INPUT") || (sel==="input[type=checkbox]"&&extra.checkbox===true),
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
    let switchState=!!opts.switch;
    sw.getAttribute=name=>name==="aria-checked"?String(switchState):null;
    sw.click=()=>{switchState=!switchState;};
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
  if(opts.pvp){
    const rank=element("",{}, {tagName:"INPUT",value:String(opts.pvp.rank||"1")});
    const league=element("Great League",{}, {tagName:"SELECT",selectedOptions:[element(opts.pvp.league||"Great League")]});
    const prior=element("Yes",{}, {tagName:"SELECT",selectedOptions:[element(opts.pvp.prior||"Yes")]});
    for(const [label,control] of [["Top ranking",rank],["League",league],["Include previous evolutions",prior]]){
      const lab=element(label);
      const wrap=element();
      wrap.querySelectorAll=(selector)=>selector.includes("input:not")?[control]:[];
      lab.parentElement=wrap;
      all.push(lab);
    }
  }
  let cardButtons=[];
  if(opts.spawn){
    const box=element(opts.spawn,{}, {
      querySelector:()=>element("Tangela"),
      querySelectorAll:()=>[],
    });
    const button=element("Get coords");
    button.parentElement=box;
    cardButtons=[button];
  }
  if(opts.pending||opts.pendingText){
    pending=[element(opts.pendingText||"Link a Pokémon GO account. Your trainer code: 12 digits")];
  }
  const accountLabels=opts.accountBadge?[element("Shiny for your account TestAccount (123456789012).")]:[];
  const sessionButtons=opts.loggedOut?[element("Log in")]:opts.logoutVisible?[element("Log out")]:[];
  function querySelectorAll(selector){
    if(selector==="label,span,strong,div")return labels;
    if(selector==="span,label,strong,small,dt,div,p")return all;
    if(selector==='[role="dialog"],[aria-modal="true"],form')return pending;
    if(selector==="label,span,div,p,strong")return all;
    if(selector==="button,[role=button]")return cardButtons;
    if(selector==="a,button,[role=button]")return sessionButtons;
    if(selector==="p,small,span,div,label")return accountLabels;
    return [];
  }
  const document={querySelectorAll,querySelector:()=>null,
    body:element(opts.bodyBadge?"Pokémon\nShiny for your account DemoTrainer (000000000000).":opts.spawn?"Showing 10 spawns":"")};
  const code=source.replace("__ACTION__",JSON.stringify(action))
      .replace("__MODE__",JSON.stringify(mode))
      .replace("__SHINY__",String(shinyOnly))
       .replace("__FILTERS__",JSON.stringify({
         attack:15,defense:15,stamina:15,glRank:1,ulRank:1,percentMin:0,percentMax:100,
         ...(opts.config||{})
       }));
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
test("English trainer link cannot confirm shiny","verifyShiny","iv",true,{switch:true,pendingText:"Link your Pokémon GO account"},false);
test("Shiny off confirmed","verifyShiny","iv",false,{switch:false},true);
test("Shiny unexpectedly on blocks standard search","verifyShiny","iv",false,{switch:true},false);
test("Public search accepts missing Shiny control","verifyShiny","iv",false,{},true);
test("Raw IV valid","verifyFilters","iv",false,{iv:["15","15","15"]},true);
test("Configurable Raw IV exact 0–15 passes","verifyFilters","raw",false,
  {iv:["0","7","15"],config:{attack:0,defense:7,stamina:15}},true);
test("Configurable Raw IV mismatch fails","verifyFilters","raw",false,
  {iv:["0","7","14"],config:{attack:0,defense:7,stamina:15}},false);
test("Hundo automatically recognized via Raw IV 15/15/15","verifyFilters","raw",false,
  {iv:["15","15","15"],config:{attack:15,defense:15,stamina:15}},true);
test("Hundo Raw IV recognizes site's percent 100–100 fallback","verifyFilters","raw",false,
  {iv:["100","100"],config:{attack:15,defense:15,stamina:15}},true);
test("Non-Hundo Raw IV must not accept 100–100 percent fallback","verifyFilters","raw",false,
  {iv:["100","100"],config:{attack:14,defense:15,stamina:15}},false);

test("Raw zero confirms all three exact IV fields","verifyFilters","raw",false,
  {iv:["0","0","0"],config:{attack:0,defense:0,stamina:0}},true);
test("Percent zero-zero confirms exact boundaries","verifyFilters","percent",false,
  {iv:["0","0"],config:{percentMin:0,percentMax:0}},true);
test("Percent hundo 100-100 confirms exact boundaries","verifyFilters","percent",false,
  {iv:["100","100"],config:{percentMin:100,percentMax:100}},true);
test("Configurable percentage range passes","verifyFilters","percent",false,
  {iv:["20","80"],config:{percentMin:20,percentMax:80}},true);
test("Configurable percentage range mismatch fails","verifyFilters","percent",false,
  {iv:["20","80"],config:{percentMin:30,percentMax:80}},false);
test("Great League top 50 confirmed","verifyFilters","gl",false,
  {pvp:{rank:"50",league:"Great League",prior:"Yes"},config:{glRank:50}},true);
test("Great League ranking must match selection","verifyFilters","gl",false,
  {pvp:{rank:"49",league:"Great League",prior:"Yes"},config:{glRank:50}},false);
test("Raw IV invalid","verifyFilters","iv",false,{iv:["15","15","14"]},false);
test("Shiny-off ignores trainer linking prompt","verifyShiny","iv",false,{switch:false,pending:true},true);
test("Percent IV 100-100 valid without Shiny","verifyFilters","iv",false,{iv:["100","100"],switch:false},true);
test("Percent IV different fails IV100","verifyFilters","iv",false,{iv:["100","98"],switch:false},false);
const turnOn=run("setShiny","iv",true,{switch:false});
assert.equal(turnOn.ok,true,"Direct Shiny activation works without submitting a search");
assert.equal(turnOn.changed,true,"Direct activation clicks the control");
assert.equal(turnOn.siteShiny,true,"Direct activation reads the verified switch");
checked++;
const turnOff=run("setShiny","gl",false,{switch:true});
assert.equal(turnOff.ok,true,"Direct Shiny deactivation works in GL");
assert.equal(turnOff.siteShiny,false,"Deactivation clears the site switch");
checked++;
const loginNeeded=run("setShiny","ul",true,{});
assert.equal(loginNeeded.ok,false,"Shiny activation without site control is not fake success");
assert.equal(loginNeeded.controlFound,false,"Missing site control leads to login prompt");
checked++;
const publicOff=run("setShiny","iv",false,{});
assert.equal(publicOff.ok,true,"Shiny OFF does not require login when switch is absent");
checked++;
const accountSession=run("session","iv",false,{accountBadge:true,switch:false});
assert.equal(accountSession.auth,"autenticada","Hidden Logout must not block the known account session");
assert.equal(JSON.stringify(accountSession).includes("TestAccount"),false,"No account identifier in session result");
checked++;
const textOnlyAccount=run("session","iv",false,{bodyBadge:true});
assert.equal(textOnlyAccount.auth,"autenticada","Mobile markup without matching tag still authenticates");
checked++;
const noSession=run("session","iv",false,{loggedOut:true});
assert.equal(noSession.auth,"login necessário","Login-required view remains unauthenticated");
checked++;
const uncertainSession=run("session","iv",false,{});
assert.equal(uncertainSession.auth,"não confirmado","Missing login/logout is not automatically authenticated");
checked++;
const menuLogout=run("session","iv",false,{logoutVisible:true});
assert.equal(menuLogout.auth,"autenticada","Visible Logout still marks a session");
checked++;
const spawn="Tangela\\n#114 Female M\\nInfestation / Solar Beam\\nCP\\n404\\nLVL\\n7\\nIV\\n67% (1/15/14)\\nLOCATION\\nBron, Rhone, France\\nDESPAWN\\n57:57\\nGet coords";
const league=run("collect","gl",false,{switch:false,pvp:{rank:"1",league:"Great League",prior:"Yes"},spawn});
assert.equal(league.cards.length,1,"GL#1: card without a rank label must be accepted only when form confirms rank 1");
assert.equal(league.cards[0].rank,"1");
assert.equal(league.cards[0].rankSource,"verified-site-filter");
checked++;
const top50=run("collect","gl",false,
  {switch:false,pvp:{rank:"50",league:"Great League",prior:"Yes"},config:{glRank:50},spawn});
assert.equal(top50.cards.length,1,"Top 50 search retains a result from a verified search");
assert.equal(top50.cards[0].rank,"","Rank 50 threshold is not an invented exact rank");
assert.equal(top50.cards[0].rankLimit,50,"Site-verified ranking ceiling is tracked separately");
const confirmedZero=run("collect","percent",false,{iv:["0","0"],config:{percentMin:0,percentMax:0}});
assert.equal(confirmedZero.criteriaConfirmed,true,"Valid empty site response still reports verified filters");
const invalidZero=run("collect","percent",false,{iv:["0","100"],config:{percentMin:0,percentMax:0}});
assert.equal(invalidZero.criteriaConfirmed,false,"Invalid empty response must never be presented as a confirmed zero");
checked++;
const wrongLeague=run("collect","gl",false,{switch:false,pvp:{rank:"1",league:"Ultra League",prior:"Yes"},spawn});
assert.equal(wrongLeague.cards.length,0,"GL results must not be labeled rank1 if wrong league selected");
checked++;
console.log("PokeSearch probe contract: "+checked+" tests passed");

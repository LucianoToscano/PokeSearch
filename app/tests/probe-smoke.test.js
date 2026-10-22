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
    getClientRects:()=>[{}],querySelectorAll:()=>[],querySelector:()=>null,dispatchEvent:()=>true,
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
    const fields=opts.ivFields&&opts.ivFields.length===opts.iv.length?opts.ivFields:
      opts.iv.map((v,i)=>element("",{
        name:(opts.ivNames||[])[i]||"",placeholder:(opts.ivPlaceholders||[])[i]||"",
        id:(opts.ivIds||[])[i]||"","aria-label":(opts.ivAria||[])[i]||""
      }, {tagName:"INPUT",value:v}));
    opts.ivFields=fields;
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
  // A React select menu opens now; its options become visible on the next render.
  const dynamicOptions=[];
  const popupById={};
  if(opts.extra){
    for(const [key,state] of Object.entries(opts.extra)){
      const lab=element(state.label||key);
      const ctrl=element(state.value||"Any",{}, {tagName:"BUTTON",disabled:!!state.disabled});
      const popupId="extra-menu-"+key,controlledOptions=[];
      ctrl.getAttribute=name=>name==="aria-expanded"?String(!!state.open):
        name==="aria-controls"?popupId:null;
      ctrl.click=()=>{state.open=!state.open;};
      const wrap=element();
      wrap.querySelectorAll=selector=>selector.includes("[role=combobox]")?[ctrl]:[];
      lab.parentElement=wrap;all.push(lab);
      if(state.options)for(const label of state.options){
        const opt=element(label);
        opt.click=()=>{state.value=label;state.open=false;};
        opt.getClientRects=()=>state.open&&state.ready?[{}]:[];
        dynamicOptions.push(opt);
        controlledOptions.push(opt);
      }
    const popup=element("",{},{
        querySelectorAll:()=>controlledOptions,
        getClientRects:()=>state.open&&state.ready?[{}]:[],
      });
      popupById[popupId]=popup;
    }
  }
  let cardButtons=[];
  if(opts.tabs){
    for(const label of ["Stats","PvP","Raw IV","% IV"]){
      const button=element(label,{}, {tagName:"BUTTON"});
      button.getAttribute=name=>name==="aria-selected"?String(
        ["Stats","PvP"].includes(label)?opts.tabs.top===label:opts.tabs.sub===label):null;
      button.click=()=>{
        if(["Stats","PvP"].includes(label)){opts.tabs.top=label;opts.tabs.sub="";}
        else opts.tabs.sub=label;
      };
      cardButtons.push(button);
    }
  }
  if(opts.spawn){
    const box=element(opts.spawn,{}, {
      querySelector:()=>element("Tangela"),
      querySelectorAll:()=>[],
    });
    const button=element("Get coords");
    button.parentElement=box;
    cardButtons=[button];
  }
  if(Array.isArray(opts.spawns)){
    cardButtons=[];
    for(const card of opts.spawns){
      const box=element(card.text,{},{
        querySelector:()=>element(card.name),
        querySelectorAll:()=>[],
      });
      const button=element(card.action||"Get coords",{},{
        tagName:card.link?"A":"BUTTON"
      });
      button.parentElement=box;
      cardButtons.push(button);
      if(card.duplicateAction){
        const sibling=element("Open in Maps",{}, {tagName:"A"});
        sibling.parentElement=box;
        cardButtons.push(sibling);
      }
    }
  }
  if(opts.pending||opts.pendingText){
    pending=[element(opts.pendingText||"Link a Pokémon GO account. Your trainer code: 12 digits")];
  }
  const accountLabels=opts.accountBadge?[element("Shiny for your account TestAccount (123456789012).")]:[];
  const sessionButtons=opts.loggedOut?[element(opts.loginLabel||"Log in")]:opts.logoutVisible?[element("Log out")]:[];
  function querySelectorAll(selector){
    if(selector==="label,span,strong,div")return labels;
    if(selector==="span,label,strong,small,dt,div,p")return all;
    if(selector==='[role="dialog"],[aria-modal="true"],form')return pending;
    if(selector==="label,span,div,p,strong")return all;
    if(selector.includes("[role=option]"))return dynamicOptions;
    if(selector==="button,[role=button]"||selector==="button,a,[role=button]")return cardButtons;
    if(selector==="a,button,[role=button]")return sessionButtons;
    if(selector==="p,small,span,div,label")return accountLabels;
    return [];
  }
  const document={querySelectorAll,querySelector:()=>null,getElementById:id=>popupById[id]||null,
    body:element(opts.profileBody|| (opts.bodyBadge?"Pokémon\nShiny for your account DemoTrainer (000000000000).":opts.spawn?"Showing 10 spawns":""))};
  const code=source.replace("__ACTION__",JSON.stringify(action))
      .replace("__MODE__",JSON.stringify(mode))
      .replace("__SHINY__",String(shinyOnly))
       .replace("__FILTERS__",JSON.stringify({
         attack:15,defense:15,stamina:15,glRank:1,ulRank:1,percentMin:0,percentMax:100,
         ...(opts.config||{})
       }));
  const HTMLInputElement={prototype:{}};
  Object.defineProperty(HTMLInputElement.prototype,"value",{set(v){this.value=String(v);}});
  const HTMLTextAreaElement={prototype:{}};
  Object.defineProperty(HTMLTextAreaElement.prototype,"value",{set(v){this.value=String(v);}});
  class Event{constructor(type){this.type=type;}}
  return JSON.parse(vm.runInNewContext(code,{document,location:{pathname:opts.pathname||"/search",hostname:"pogocoordinates.com"},window:{},HTMLInputElement,HTMLTextAreaElement,Event}));
}
function configureSettled(mode,opts,max=14){
 let last=null,waits=0;
 for(let i=0;i<max;i++){
  last=run("configureSearch",mode,false,opts);
  if(last.configured)return {result:last,waits};
  assert.equal(last.pending,true,"React form not ready should request retry");
  waits++;
 }
 return {result:last,waits};
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
test("Actual IV interval 91–100 passes","verifyFilters","percent",false,
  {iv:["91","100"],config:{percentMin:91,percentMax:100}},true);
test("Unattainable 90 percent minimum must fail even if form displays 90","verifyFilters","percent",false,
  {iv:["90","100"],config:{percentMin:90,percentMax:100}},false);
test("Unattainable 95 percent maximum must fail even if form displays 95","verifyFilters","percent",false,
  {iv:["91","95"],config:{percentMin:91,percentMax:95}},false);
test("Configurable percentage range mismatch fails","verifyFilters","percent",false,
  {iv:["20","80"],config:{percentMin:31,percentMax:80}},false);
test("Great League top 50 confirmed","verifyFilters","gl",false,
  {pvp:{rank:"50",league:"Great League",prior:"Yes"},config:{glRank:50}},true);
test("Great League Top 50 is independent of general IV% 91–100","verifyFilters","gl",false,
  {pvp:{rank:"50",league:"Great League",prior:"Yes"},config:{glRank:50,percentMin:91,percentMax:100}},true);
test("Ultra League Top 17 is independent of general IV% 91–100","verifyFilters","ul",false,
  {pvp:{rank:"17",league:"Ultra League",prior:"Yes"},config:{ulRank:17,percentMin:91,percentMax:100}},true);
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
const officialGoogleGuest=run("session","iv",false,{loggedOut:true,loginLabel:"Login with Google"});
assert.equal(officialGoogleGuest.auth,"login necessário","Exact provider-button Login with Google is recognized");
checked++;
const officialDiscordGuest=run("session","iv",false,{loggedOut:true,loginLabel:"Login with Discord"});
assert.equal(officialDiscordGuest.auth,"login necessário","Exact provider-button Login with Discord is recognized");
checked++;
const noTrainerProfile=run("session","iv",false,{
 pathname:"/profile",profileBody:"Linked accounts\nGoogle\nPokemon GO accounts 0/1\nLink my account"
});
assert.equal(noTrainerProfile.auth,"autenticada","Logged-in without trainer must be recognized on official profile");
checked++;
const stillLoadingProfile=run("session","iv",false,{pathname:"/profile",profileBody:"Danger zone"});
assert.equal(stillLoadingProfile.auth,"não confirmado","Incomplete profile is not trusted as proof of login");
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
assert.equal(league.cards[0].rank,"","Verified Top 1 is a search ceiling, not a proven individual rank");
assert.equal(league.cards[0].rankLimit,1,"Verified Top 1 threshold is separately retained");
assert.equal(league.cards[0].rankSource,"verified-site-filter");
checked++;
const linkedSpawn=(name)=>name+" ✨\n#562 · Male · M\nAstonish / Rock Tomb\nCP\n813\nLVL\n29\nIV\n100% (15/15/15)\nLOCATION\nTainan City, Taiwan\nDESPAWN\n5:16\nOpen in Maps";
const mixedCards=run("collect","raw",false,{iv:["15","15","15"],
  spawns:[
   {name:"Flabebe",text:linkedSpawn("Flabebe"),action:"Get coords"},
   {name:"Yamask",text:linkedSpawn("Yamask"),action:"Open in Maps",link:true,duplicateAction:true}
  ]});
assert.equal(mixedCards.cards.length,2,"Both Get coords and linked Open in Maps must be collected");
assert.equal(mixedCards.found,2,"Two action elements on one card never duplicate a spawn");
assert.deepEqual(Array.from(mixedCards.cards,x=>x.sourceIndex),[0,1]);
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

test("Explicit Sort by never reports success when site's dropdown is missing",
  "verifyFilters","iv",false,{iv:["15","15","15"],config:{sortBy:"Despawn (longest)"}},false);
test("CP minimum filter never reports success when site's field is missing",
  "verifyFilters","iv",false,{iv:["15","15","15"],config:{cpMin:"100"}},false);
test("Size selection never reports success without a matching site control",
  "verifyFilters","iv",false,{iv:["15","15","15"],config:{size:"XXL"}},false);
const discoveredFilters=run("describeFilters","iv",false);
assert.equal(discoveredFilters.ok,true,"Capability inspection must be read-only and work without optional filters");
assert.equal(discoveredFilters.options.sortBy.present,false,"Missing Sort by cannot be invented");
assert.equal(discoveredFilters.options.form.present,false,"Missing Form cannot be invented");
checked+=3;


test("Site neutral values must not block an ordinary IV100 search",
  "verifyFilters","iv",false,{iv:["15","15","15"],extra:{
    Form:{value:"Any Form"},Size:{value:"Any Size"},
    Gender:{value:"Any Gender"},Weather:{value:"Any Weather"},
    Pokemon:{value:"Any Pokemon"}
  }},true);
const delayedSize={value:"Any",options:["Any","XXL"],open:false,ready:false};
const firstSize=run("configureExtras","iv",false,{config:{size:"XXL"},extra:{Size:delayedSize}});
assert.equal(firstSize.ok,false,"A menu not yet rendered must not claim applied");
assert.equal(firstSize.pending,true,"An unrendered popup should request a retry");
assert.equal(delayedSize.open,true,"Select menu opens first without changing value");
delayedSize.ready=true;
const secondSize=run("configureExtras","iv",false,{config:{size:"XXL"},extra:{Size:delayedSize}});
assert.equal(secondSize.ok,false,"React needs one more render to commit the selection");
assert.equal(secondSize.pending,true,"Selection commit must be verified on retry");
assert.equal(delayedSize.value,"XXL","The site control changes to XXL");
const settledSize=run("configureExtras","iv",false,{config:{size:"XXL"},extra:{Size:delayedSize}});
assert.equal(settledSize.ok,true,"Committed menu selection is accepted after rerender");
const confirmedSize=run("verifyExtras","iv",false,{config:{size:"XXL"},extra:{Size:delayedSize}});
assert.equal(confirmedSize.ok,true,"XXL is confirmed by reading control");
checked+=4;


const beforeSubmitOnly=run("collect","gl",false,{switch:false,spawn,
  config:{glRank:1,_preSubmitVerified:true,size:"XXL"}});
assert.equal(beforeSubmitOnly.criteriaConfirmed,true,"Form hidden after Search uses same-generation pre-submit proof");
assert.equal(beforeSubmitOnly.cards.length,1,"The result cards should not disappear when the form collapses");
assert.equal(beforeSubmitOnly.confirmationSource,"pre-submit-confirmed");
checked++;
const missingProof=run("collect","gl",false,{switch:false,spawn,
  config:{glRank:1,size:"XXL"}});
assert.equal(missingProof.criteriaConfirmed,false,"Missing form without pre-submit proof must fail");
assert.equal(missingProof.cards.length,0,"Unknown results are not shown as verified");
checked++;
const visibleWrong=run("collect","gl",false,{switch:false,spawn,
  config:{glRank:1,size:"XXL",_preSubmitVerified:true},
  extra:{Size:{value:"Any",options:["Any","XXL"]}}});
assert.equal(visibleWrong.criteriaConfirmed,false,"Visible contradictory Size control defeats older proof");
assert.equal(visibleWrong.cards.length,0);
checked++;
const wrongLeagueWithProof=run("collect","gl",false,{switch:false,spawn,
 pvp:{rank:"1",league:"Ultra League",prior:"Yes"},
 config:{_preSubmitVerified:true,glRank:1}});
assert.equal(wrongLeagueWithProof.criteriaConfirmed,false,"Pre-submit proof cannot override live mismatch in PvP league");
checked++;


 // Regression from the user's 04:35/04:36 screenshots: "⚠ Filtro: pokemon"
 // The optional site picker may render arbitrary labels or decorations.
const decoratedPokemon={Pokemon:{value:"Pokémon · Any Pokémon ▾"}};
test("Raw 15/15/15 search does not block on optional site Pokémon picker",
  "configureExtras","raw",false,{extra:decoratedPokemon},true);
test("Great League Top 1 does not block on optional site Pokémon picker",
  "configureExtras","gl",false,{extra:decoratedPokemon},true);
test("Optional Pokémon picker cannot fail verification when no species was selected",
  "verifyExtras","gl",false,{extra:decoratedPokemon},true);
test("Explicit selected Pokémon still fails when matching control is unavailable",
  "verifyExtras","gl",false,{config:{pokemon:"Pikachu"}},false);
const decoratedSearch=run("collect","gl",false,{switch:false,
  config:{glRank:1,_preSubmitVerified:true},
  extra:decoratedPokemon,spawn});
assert.equal(decoratedSearch.criteriaConfirmed,true,"Decorative Pokemon picker cannot discard verified GL results");
assert.equal(decoratedSearch.cards.length,1,"Pokémon sprites remain available after Search");
checked++;
const previousSpecies={Pokemon:{value:"Pikachu",options:["Any","Pikachu"],ready:false}};
const explicitClear=run("configureExtras","gl",false,{extra:previousSpecies,
  config:{clearExtraKeys:["pokemon"],pokemon:""}});
assert.equal(explicitClear.ok,false,"An explicitly cleared species must actually be reset on the site");
assert.equal(explicitClear.pending,true,"Reset opens the remote chooser and waits");
checked++;



 // PL-01 / PSC-02 — the remote form being configured is not proof of every card's IV.
const ivEvidenceSpawn=value=>"Tangela\n#114 Female M\nInfestation / Solar Beam\nCP\n404\nLVL\n7\nIV\n"+value+"\nLOCATION\nBron, Rhone, France\nDESPAWN\n57:57\nGet coords";
const rawProof=run("collect","raw",false,
 {iv:["15","15","15"],spawn:ivEvidenceSpawn("100% (15/15/15)")});
assert.equal(rawProof.cards.length,1,"Raw hundo with exact observed triple remains visible");
checked++;
const rawMissing=run("collect","raw",false,
 {iv:["15","15","15"],spawn:ivEvidenceSpawn("Unknown")});
assert.equal(rawMissing.criteriaConfirmed,true,"Raw mode has a confirmed site filter");
assert.equal(rawMissing.cards.length,0,"A confirmed form must not turn an unknown card into Hundo");
assert.equal(rawMissing.unverifiedIv,1,"Unverified IV cards are counted distinctly");
checked++;
const rawWrong=run("collect","raw",false,
 {iv:["15","15","15"],spawn:ivEvidenceSpawn("98% (15/15/14)")});
assert.equal(rawWrong.cards.length,0,"Raw 15/15/15 rejects observed non-Hundo");
checked++;
const rawZero=run("collect","raw",false,
 {iv:["0","0","0"],config:{attack:0,defense:0,stamina:0},spawn:ivEvidenceSpawn("0% (0/0/0)")});
assert.equal(rawZero.cards.length,1,"Raw nundo 0/0/0 is preserved");
checked++;
const percentProof=run("collect","percent",false,
 {iv:["91","100"],config:{percentMin:91,percentMax:100},spawn:ivEvidenceSpawn("93% (15/14/13)")});
assert.equal(percentProof.cards.length,1,"Observed 93% is accepted within 91–100%");
checked++;
const percentMissing=run("collect","percent",false,
 {iv:["91","100"],config:{percentMin:91,percentMax:100},spawn:ivEvidenceSpawn("Unknown")});
assert.equal(percentMissing.cards.length,0,"An unknown percentage no longer passes 91–100");
checked++;
const percentOnly=run("collect","percent",false,
 {iv:["91","100"],config:{percentMin:91,percentMax:100},spawn:ivEvidenceSpawn("91%")});
assert.equal(percentOnly.cards.length,1,"A percent explicitly labeled IV may independently prove the requested range");
checked++;
const impossiblePercentage=run("collect","percent",false,
 {iv:["91","100"],config:{percentMin:91,percentMax:100},spawn:ivEvidenceSpawn("95%")});
assert.equal(impossiblePercentage.cards.length,0,"Impossible IV percentages cannot be accepted as evidence");
checked++;
const disagreeingData=run("collect","raw",false,
 {iv:["15","15","15"],spawn:ivEvidenceSpawn("100% (15/15/14)")});
assert.equal(disagreeingData.cards.length,0,"Contradictory IV percentage/triple does not produce a false Hundo");
checked++;
const invalidStat=run("collect","raw",false,
 {iv:["15","15","15"],spawn:ivEvidenceSpawn("100% (16/15/15)")});
assert.equal(invalidStat.cards.length,0,"Out-of-range IV stats must never prove a match");
checked++;

// Form switching is asynchronous: clicking a new React tab is not proof
// that its fields have mounted. This reproduces the reported stuck filters.
const rawTabs={top:"Stats",sub:"% IV"};
const lateRaw={tabs:rawTabs,iv:["100","100"],config:{attack:0,defense:0,stamina:0}};
const beforeRaw=run("configureSearch","raw",false,lateRaw);
assert.equal(beforeRaw.configured,false,"Raw 0/0/0 must wait for the Raw IV tab");
assert.equal(beforeRaw.pending,true,"New tab must schedule a retry rather than fail forever");
assert.equal(rawTabs.sub,"Raw IV","The desired Raw IV tab is requested");
lateRaw.iv=["15","15","15"]; // The site now mounts Raw fields on the next rendering pass.
const appliedZero=configureSettled("raw",lateRaw);
assert.equal(appliedZero.result.configured,true,"Raw 0/0/0 is actually applied after React settles");
assert.deepEqual(lateRaw.ivFields.map(x=>x.value),["0","0","0"]);
checked+=2;
const hundoOpts={tabs:{top:"Stats",sub:"Raw IV"},iv:["0","0","0"],config:{attack:15,defense:15,stamina:15}};
const appliedHundo=configureSettled("raw",hundoOpts);
assert.equal(appliedHundo.result.configured,true,"Raw 15/15/15 must update actual site fields");
assert.deepEqual(hundoOpts.ivFields.map(x=>x.value),["15","15","15"]);
checked++;
const customOpts={tabs:{top:"Stats",sub:"Raw IV"},iv:["0","0","0"],config:{attack:3,defense:15,stamina:12}};
const appliedCustom=configureSettled("raw",customOpts);
assert.equal(appliedCustom.result.configured,true,"Mixed Raw 3/15/12 must be applied");
assert.deepEqual(customOpts.ivFields.map(x=>x.value),["3","15","12"]);
checked++;
const sixOpts={tabs:{top:"Stats",sub:"Raw IV"},iv:["0","0","0","0","0","0"],
 ivNames:["defense-min","attack-max","stamina-min","attack-min","stamina-max","defense-max"],
 config:{attack:3,defense:15,stamina:12}};
const sixResponse=configureSettled("raw",sixOpts);
assert.equal(sixResponse.result.configured,true,"Six Raw min/max fields use identified stat names");
assert.deepEqual(sixOpts.ivFields.map(x=>x.value),["15","3","12","3","12","15"]);
checked++;
const unknownSix={tabs:{top:"Stats",sub:"Raw IV"},iv:["0","0","0","0","0","0"],
 config:{attack:3,defense:15,stamina:12}};
const unknownResponse=run("configureSearch","raw",false,unknownSix);
assert.equal(unknownResponse.configured,false,"Ambiguous six-field Raw IV must never fake a custom result");
assert.equal(unknownResponse.pending,true,"Ambiguous six-field Raw IV requires controlled retries");
checked++;
const percentTabs={top:"Stats",sub:"Raw IV"};
const pctOpts={tabs:percentTabs,iv:["0","0","0"],config:{percentMin:91,percentMax:100}};
const pctWaiting=run("configureSearch","percent",false,pctOpts);
assert.equal(pctWaiting.configured,false,"Percent mode must wait for the % IV tab");
assert.equal(pctWaiting.pending,true,"Percent tab hydration requests another attempt");
pctOpts.iv=["0","100"];
const pctReady=configureSettled("percent",pctOpts);
assert.equal(pctReady.result.configured,true,"91–100% values applied only once the form exists");
assert.deepEqual(pctOpts.ivFields.map(x=>x.value),["91","100"]);
checked+=2;
const invalidPct={tabs:{top:"Stats",sub:"% IV"},iv:["0","100"],config:{percentMin:90,percentMax:100}};
const invalidApply=run("configureSearch","percent",false,invalidPct);
assert.equal(invalidApply.configured,false,"Unattainable IV% cannot be silently applied");
checked++;

for(const [value,fields] of [[0,["100","100"]],[100,["0","0"]]]){
 const pctCase={tabs:{top:"Stats",sub:"% IV"},iv:fields,
   config:{percentMin:value,percentMax:value}};
 const pctApplied=configureSettled("percent",pctCase);
 assert.equal(pctApplied.result.configured,true,"Exact IV% "+value+"–"+value+" must apply");
 assert.deepEqual(pctCase.ivFields.map(x=>x.value),[String(value),String(value)]);
 checked++;
}
const equalSix={tabs:{top:"Stats",sub:"Raw IV"},iv:["15","15","15","15","15","15"],
 config:{attack:0,defense:0,stamina:0}};
const zeroSix=configureSettled("raw",equalSix);
assert.equal(zeroSix.result.configured,true,"Six indistinguishable fields can safely apply the equal 0/0/0 triple");
assert.deepEqual(equalSix.ivFields.map(x=>x.value),["0","0","0","0","0","0"]);
checked++;
// The real PoGoCoordinates form in the screenshots shows three A/D/S inputs.
for(const [triple,site] of [
  [[0,15,15],["","",""]],
  [[3,15,12],["0","0","0"]],
  [[0,0,0],["15","15","15"]],
  [[15,15,15],["0","0","0"]]
]){
 const opts={tabs:{top:"Stats",sub:"Raw IV"},iv:site,
  ivPlaceholders:["A","D","S"],
  config:{attack:triple[0],defense:triple[1],stamina:triple[2]}};
 const result=configureSettled("raw",opts);
 assert.equal(result.result.configured,true,"Screenshot A/D/S triple must be configured");
 assert.deepEqual(opts.ivFields.map(x=>x.value),triple.map(String));
 assert.equal(run("verifyFilters","raw",false,opts).ok,true,"Site must retain exact IVs");
 assert.ok(result.waits>=2,"React fields must commit through distinct JS rounds");
 checked++;
}
const blankZero={tabs:{top:"Stats",sub:"Raw IV"},iv:["","",""],config:{attack:0,defense:0,stamina:0}};
assert.equal(run("verifyFilters","raw",false,blankZero).ok,false,
 "Blank Raw input must never be mistaken for IV 0");
assert.equal(configureSettled("raw",blankZero).result.configured,true);
assert.deepEqual(blankZero.ivFields.map(x=>x.value),["0","0","0"]);
assert.equal(run("verifyFilters","raw",false,blankZero).ok,true);
checked++;
const reordered={tabs:{top:"Stats",sub:"Raw IV"},iv:["","",""],
 ivPlaceholders:["D","A","S"],config:{attack:0,defense:15,stamina:12}};
assert.equal(configureSettled("raw",reordered).result.configured,true);
assert.deepEqual(reordered.ivFields.map(x=>x.value),["15","0","12"]);
checked++;
const ambiguous={tabs:{top:"Stats",sub:"Raw IV"},iv:["","",""],
 ivPlaceholders:["A","","S"],config:{attack:0,defense:15,stamina:12}};
assert.equal(run("configureSearch","raw",false,ambiguous).configured,false,
 "Partially identified fields must not be guessed");
assert.deepEqual(ambiguous.ivFields.map(x=>x.value),["","",""]);
checked++;
const percentEmpty={tabs:{top:"Stats",sub:"% IV"},iv:["",""],
 config:{percentMin:0,percentMax:100}};
assert.equal(run("verifyFilters","percent",false,percentEmpty).ok,false,
 "Blank percent minimum must not count as 0");
assert.equal(configureSettled("percent",percentEmpty).result.configured,true);
assert.equal(run("verifyFilters","percent",false,percentEmpty).ok,true);
checked++;
// Live account-specific site badge is an authoritative boolean, not a stored code.
{
 const yes=run("session","raw",false,{accountBadge:true});
 assert.equal(yes.auth,"autenticada");
 assert.equal(yes.trainerLinked,true);
 assert.ok(!JSON.stringify(yes).includes("123456789012"));
 const no=run("session","raw",false,{loggedOut:true});
 assert.equal(no.trainerLinked,false);
 checked+=2;
}
// Parse the card DOM in isolation: never guess a distance from coordinates.
{
 const from=source.indexOf('function nextLabelValue(');
 const to=source.indexOf('// IV is evidence about THIS card,',from);
 assert.ok(from>0&&to>from);
 const parse=new Function('clean','text','verifiedCardIv','mode',
   source.slice(from,to)+'return parseCard;')(
   s=>String(s||'').trim(),e=>String(e?.innerText||e?.textContent||''),
   ()=>({percent:36}),'raw');
 const card={innerText:'Machop ✨\n#066 · Female · M\nKarate Chop / Brick Break\nCP\n274\nLVL\n9\nIV\n36% (2/0/14)\nLOCATION\nShibuya, Tokyo, Japan\n0.3 km away\nDESPAWN\n19:16',
  querySelector:()=>({innerText:'Machop ✨'}),querySelectorAll:()=>[]};
 const parsed=parse(card,0);
 assert.equal(parsed.distance,'0.3 km');
 assert.equal(parsed.location,'Shibuya, Tokyo, Japan');
 assert.equal(parsed.gender,'♀');
 assert.equal(parsed.size,'M');
 assert.equal(parsed.name,'Machop');
 card.innerText=card.innerText.replace('0.3 km away','');
 assert.equal(parse(card,0).distance,'');
 checked+=6;
}
console.log("PokeSearch probe contract: "+checked+" tests passed");

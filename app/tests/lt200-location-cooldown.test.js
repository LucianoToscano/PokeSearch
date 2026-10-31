"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const base=path.join(__dirname,"../src/main");
const dock=fs.readFileSync(path.join(base,"assets/dock.html"),"utf8");
const service=fs.readFileSync(path.join(base,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const probe=fs.readFileSync(path.join(base,"assets/probe.js"),"utf8");
let checks=0;
function check(label,fn){fn();checks++;console.log("PASS LT200 "+label);}
const inside=(text,start,end)=>{
 const a=text.indexOf(start),b=text.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,"missing section "+start);
 return text.slice(a,b);
};
check("Cooldown reference has exactly 16 distance tiers matching the supplied chart",()=>{
 const data=inside(dock,"const LOCATION_COOLDOWN_REFERENCE=Object.freeze([","]);");
 const rows=[...data.matchAll(/\["([^"]+)","([^"]+)"\]/g)].map(x=>[x[1],x[2]]);
 assert.deepEqual(rows,[
  ["< 10 m","0s"],["10 - 99 m","3s"],["100 - 499 m","15s"],
  ["500 - 999 m","30s"],["1 - 4 km","2m"],["5 - 9 km","6m"],
  ["10 - 24 km","11m"],["25 - 29 km","14m"],["30 - 64 km","22m"],
  ["65 - 80 km","25m"],["81 - 99 km","35m"],["100 - 249 km","45m"],
  ["250 - 499 km","1h"],["500 - 749 km","1h 15m"],
  ["750 - 999 km","1h 30m"],[">= 1000 km","2h"]
 ]);
});
check("Header text alone opens compact list and returns to existing editor",()=>{
 const editor=inside(dock,"function renderLocationChoices(){","let requestedInterval=null;");
 const table=inside(dock,"function renderLocationCooldownTable(){","function renderLocationChoices(){");
 assert.match(editor,/titleAction=make\("button","locTitleHelp","Localização"\)/);
 assert.match(editor,/titleAction\.onclick=renderLocationCooldownTable/);
 assert.match(table,/back\.onclick=renderLocationChoices/);
 assert.match(table,/panel\.dataset\.panelKind="location-cooldown"/);
 assert.match(table,/panel\.classList\.add\("locationPanel","visible","locationCooldownTable"\)/);
 assert.ok(!table.includes("Native.openPopup("));
 assert.ok(!table.includes("Native.setLocation("));
});
check("Original controls and layout remain unchanged",()=>{
 const editor=inside(dock,"function renderLocationChoices(){","let requestedInterval=null;");
 assert.match(editor,/clipboard\.append\(paste,copy\)/);
 assert.match(editor,/panel\.append\(title,fieldRow,sliderRow,label,message\)/);
 assert.match(editor,/apply\.onclick=submit/);
 assert.match(editor,/clear\.onclick=disable/);
 assert.match(dock,/choiceOpen==="location"\?\s*Math\.min\(148,/);
 assert.match(dock,/popup\.classList\.contains\("locationCooldownTable"\)\?408/);
 assert.match(dock,/\.locTitleHelp\{[\s\S]*?background:transparent!important/);
});
check("Unsaved edits survive opening and closing reference",()=>{
 assert.match(dock,/let locationDraftBeforeCooldown=null;/);
 assert.match(dock,/coordDirty:coord\?\.dataset\.locationDraft==="true"/);
 assert.match(dock,/if\(draft\.coordDirty\)\{field\.value=draft\.coords/);
 assert.match(dock,/if\(draft\.radiusDirty\)/);
});
check("Unchanged location Apply bypasses local timer but retains provider backoff",()=>{
 const set=inside(service,"@JavascriptInterface public void setLocation(boolean enabled,String coords,int radius)","// LT91-A");
 assert.match(set,/if\(!searchInProgress\)\{/);
 assert.match(set,/OverlayService\.this\.refresh\(true\)/);
 assert.ok(!set.includes("nextScheduledSearchAtMs<=System.currentTimeMillis()"));
 assert.match(set,/queuedManualRefresh=true/);
 assert.match(service,/if\(authorizedApiQaSelected\(\)&&apiProviderBackoffUntil\(\)>0L\)/);
});
check("Non-location network errors never pretend coordinates were rejected",()=>{
 const state=inside(dock,"function currentLocationUiState(){","function locationPanelFeedback(){");
 assert.match(state,/SEARCH_ERROR/);
 assert.match(state,/localiza\|coordenad\|coords\|radius\|raio/);
 assert.match(dock,/state==="SEARCH_ERROR"\?"⚠ Busca falhou/);
});
check("Official-site Coords DOM verification stays strict",()=>{
 assert.match(probe,/const uniqueOfficialPair=fields\.coords&&fields\.radius&&/);
 assert.match(probe,/providerCoords\.length===1&&providerRadius\.length===1/);
 assert.match(probe,/!active\(areaButton\)/);
 assert.match(probe,/const ok=coordsMatch&&radiusMatch&&active===true/);
});
console.log("LT200 "+checks+"/"+checks+" checks passed");

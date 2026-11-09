"use strict";
// LT323: exercise the production Rank Raides renderer and delegated touch
// behavior without opening extra windows or inventing PvE metrics.
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const assets=path.join(__dirname,"../src/main/assets");
const html=fs.readFileSync(path.join(assets,"detail.html"),"utf8");
const art=require(path.join(assets,"sprite_offline.js"));
const rank=require(path.join(assets,"pve_raid_rank.js"));
const java=fs.readFileSync(path.join(__dirname,
 "../src/main/java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java"),"utf8");
assert.equal(rank.SOURCE.includes("pogo-db-api"),true);
assert.match(java,/extends OverlayService/,"P2 uses shared detail.html");
assert.match(html,/#raidPanel \.psRaidIdentityButton\{/);
assert.match(html,/#raidPanel \.psRaidMetrics\[hidden\]\{display:none!important\}/);
assert.match(html,/class="psRaidIdentityButton"/);
assert.match(html,/aria-controls="psRaidMetrics-/);
assert.match(html,/raidPanel\.psRaidMetricOpenIndex=-1/,"a new capture closes old metrics");
assert.match(html,/panel\.onclick=event=>/,"one delegated click handler");
assert.match(html,/window\.PokeSearchOfflineSprite\?\.rankSprite/);
assert.equal(art.rankSprite("Gengar"),
 "file:///android_asset/pokemon-sprites/base/94.png");
assert.equal(art.rankSprite("Mega Gengar"),
 "file:///android_asset/pokemon-sprites/forms/variety-10038.png");
assert.equal(art.rankSprite("Gengar (Shadow)"),"",
 "a shadow form cannot silently inherit a base sprite");
const inline=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(inline);new vm.Script(inline);
const from=inline.indexOf("function renderRaidPreview(){");
const until=inline.indexOf("function toggleRaidDetails(){",from);
assert.ok(from>0&&until>from,"extract real raid renderer");
const source=inline.slice(from,until);
const rows=[
 {name:"Gengar",number:94,variant:"normal",rank:12,
  type:"ghost",typePt:"Fantasma",score:37.46,dps:24.36,tdo:604.18,
  fast:"SHADOW_CLAW_FAST",charged:"SHADOW_BALL",elite:false},
 {name:"Mega Gengar",number:94,variant:"mega",projected:true,rank:2,
  type:"ghost",typePt:"Fantasma",score:57.01,dps:31.1,tdo:724.6,
  fast:"SHADOW_CLAW_FAST",charged:"SHADOW_BALL",elite:true},
 {name:"Gengar",number:94,variant:"shadow",projected:true,rank:6,
  type:"ghost",typePt:"Fantasma",score:45,dps:26,tdo:650,
  fast:"SHADOW_CLAW_FAST",charged:"SHADOW_BALL",elite:false},
 {name:"Unknown",number:undefined,variant:"normal",rank:449,
  type:"ghost",typePt:"Fantasma",score:"bad",dps:-2,tdo:null,
  fast:"UNKNOWN_FAST",charged:"UNKNOWN_MOVE",elite:false}
];
const calls=[];
const sprite={rankSprite(name){calls.push(name);return art.rankSprite(name);}};
const btns=Array.from({length:rows.length},(_,index)=>({
 attrs:{"data-raid-index":String(index),"aria-expanded":"false"},
 getAttribute(k){return this.attrs[k];},
 setAttribute(k,v){this.attrs[k]=v;}
}));
const boxes=Array.from({length:rows.length},()=>({hidden:true}));
const events=[];
const panel={
 hidden:true,innerHTML:"",attrs:{},
 setAttribute(k,v){this.attrs[k]=v;},
 addEventListener(name,fn,capture){
  assert.equal(name,"toggle");assert.equal(capture,true);
  events.push({name,fn});
 },
 contains(el){return btns.includes(el);},
 querySelector(sel){
  const match=/^#psRaidMetrics-(\d+)$/.exec(sel);
  return match?boxes[Number(match[1])]:null;
 },
 querySelectorAll(sel){
  if(sel===".psRaidIdentityButton")return btns;
  if(sel===".psRaidMetrics")return boxes;
  throw Error("Unexpected selector "+sel);
 }
};
const button={dataset:{},setAttribute(){},hidden:true};
let resizeCount=0;
const fakeWindow={
 PokeSearchMovePtBR:{name:id=>id,type:()=>null},
 PokeSearchCardPresentation:{moveTypeColor:()=>null},
 PokeSearchTypeIcons:{},
 PokeSearchOfflineSprite:sprite
};
const ctx={
 window:fakeWindow,
 document:{getElementById(id){return id==="raidRow"?button:
  id==="raidPanel"?panel:null;}},
 psRaidReport:{verified:true,best:rows[0],rows,source:"source verified"},
 psRaidExpanded:true,psRaidAttackPreview:null,
 h:word=>String(word??"").replace(/[&<>"']/g,c=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
 }[c])),
 psMtIconHtml:()=>"",psUpdateRaidShortcut:()=>{},
 resizeEvolutionPanel:()=>{resizeCount++;}
};
vm.createContext(ctx);
vm.runInContext(source+";renderRaidPreview();",ctx);
const text=panel.innerHTML;
assert.equal((text.match(/class="psRaidSprite"/g)||[]).length,2,
 "only exact Normal + Mega sprites appear; Shadow and unknown do not");
assert.ok(text.includes('src="file:///android_asset/pokemon-sprites/base/94.png"'));
assert.ok(text.includes("variety-10038.png"));
assert.deepEqual(calls,["Gengar","Mega Gengar"],
 "don't request misleading Shadow sprite or guess missing Dex");
assert.match(text,/>#0094<\/small>/,"Pokédex number visible beside name");
assert.match(text,/#12 Fantasma/,"type-specific rank stays distinct from Dex number");
assert.match(text,/37,5/);
assert.match(text,/24,4/);
assert.match(text,/604,2/);
assert.match(text,/57,0/);
assert.match(text,/>—<\/b>/,"unknown, negative, absent scores remain unverified");
assert.match(text,/class="psRaidMore"/,"existing expansion preserved");
assert.equal((text.match(/id="psRaidMetrics-\d+" hidden/g)||[]).length,4,
 "metrics never expand by default");
assert.equal(resizeCount,1);
assert.equal(events.length,1,"single existing delegated toggle listener");
events[0].fn({target:{matches:q=>q===".psRaidMore"}});
events[0].fn({target:{matches:q=>q===".psRaidTmInfo"}});
assert.equal(resizeCount,3,"More and MT info both resize overlay");
const tap=index=>panel.onclick({target:{closest:selector=>{
 assert.equal(selector,".psRaidIdentityButton");return btns[index];
}}});
tap(0);
assert.equal(panel.psRaidMetricOpenIndex,0);
assert.equal(btns[0].getAttribute("aria-expanded"),"true");
assert.equal(boxes[0].hidden,false);
assert.equal(resizeCount,4);
tap(1);
assert.equal(panel.psRaidMetricOpenIndex,1);
assert.equal(boxes[0].hidden,true);
assert.equal(boxes[1].hidden,false);
assert.equal(btns[0].getAttribute("aria-expanded"),"false");
tap(1);
assert.equal(panel.psRaidMetricOpenIndex,-1);
assert.equal(boxes[1].hidden,true);
assert.equal(btns[1].getAttribute("aria-expanded"),"false");
vm.runInContext("renderRaidPreview();",ctx);
assert.equal(events.length,1,"rerender does not duplicate toggle listeners");
assert.equal((panel.innerHTML.match(/id="psRaidMetrics-\d+" hidden/g)||[]).length,4);
assert.match(button.textContent,/Raides · Destaque/);
console.log("PASS LT323: compact raid sprite, Dex/name tap, ER/DPS/TDO, projection, Shadow guard, P1/P2 and resize");

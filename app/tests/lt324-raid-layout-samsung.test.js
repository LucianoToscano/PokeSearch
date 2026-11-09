"use strict";
// Screenshot-driven regression for Togedemaru's two-type Raid window.
// Assert the production renderer structure, not a separate HTML mock.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const html=fs.readFileSync(path.join(__dirname,"../src/main/assets/detail.html"),"utf8");
assert.match(html,/#raidPanel \.psRaidRow\{padding:3px 0;gap:1px 5px;/);
assert.match(html,/#raidPanel \.psRaidFormLabel\{/);
assert.match(html,/#raidPanel \.psRaidFormLabel \.psShadowMark\{/);
assert.match(html,/max-width:12px!important;/);
assert.match(html,/#raidPanel \.psRaidMoveNames\{display:flex;flex-wrap:wrap/);
assert.match(html,/#raidPanel \.psRaidMoveNames \.psRaidMoveSep\{display:none/);
assert.match(html,/min-height:30px;max-width:100%/);
assert.match(html,/const raidProjectionLabel=row=>/);
assert.match(html,/class="psRaidTypeRank"/);
assert.ok(html.includes('rows.slice(0,3).map(rowHtml).join("")'),
 "preserve exact historical 3-line renderer and same stable indices");
assert.match(html,/data-raid-index/);
assert.match(html,/psRaidMetricOpenIndex=-1/);
assert.match(html,/\.psRaidMore:not\(\[open\]\) > \.psRaidRow\{display:none!important\}/);
const inline=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(inline);new vm.Script(inline);
const start=inline.indexOf("function renderRaidPreview(){");
const end=inline.indexOf("function toggleRaidDetails(){",start);
assert.ok(start>0&&end>start);
const module=inline.slice(start,end);
const rows=[
 {name:"Togedemaru",number:777,variant:"normal",rank:58,
  type:"electric",typePt:"Elétrico",score:20.2,dps:16.9,tdo:388,
  fast:"THUNDER_SHOCK_FAST",charged:"WILD_CHARGE",elite:false},
 {name:"Togedemaru",number:777,variant:"normal",rank:94,
  type:"steel",typePt:"Aço",score:15.7,dps:12.4,tdo:400,
  fast:"THUNDER_SHOCK_FAST",charged:"GYRO_BALL",elite:false}
];
const p={innerHTML:"",hidden:true,attrs:{},addEventListener(){},
 setAttribute(k,v){this.attrs[k]=v;}};
const btn={hidden:true,dataset:{},setAttribute(){}};
const w={PokeSearchOfflineSprite:{rankSprite:()=>""},
 PokeSearchMovePtBR:{name:(id)=>({
 THUNDER_SHOCK_FAST:"Trovoada de Choques",
 WILD_CHARGE:"Ataque Selvagem",GYRO_BALL:"Girobola"
 })[id]||id,type:()=>null},
 PokeSearchCardPresentation:{moveTypeColor:()=>null},
 PokeSearchTypeIcons:{}};
const h=x=>String(x??"").replace(/&/g,"&amp;").replace(/</g,"&lt;");
const ctx={window:w,document:{getElementById(id){
 return id==="raidRow"?btn:id==="raidPanel"?p:null;}},
 psRaidReport:{verified:true,best:rows[0],rows,source:"PvE snapshot"},
 psRaidExpanded:true,psRaidAttackPreview:null,
 h,psMtIconHtml:()=>"",psUpdateRaidShortcut:()=>{},resizeEvolutionPanel:()=>{}};
vm.createContext(ctx);
vm.runInContext(module+";renderRaidPreview();",ctx);
assert.equal((p.innerHTML.match(/class="psRaidIdentityButton"/g)||[]).length,2);
assert.equal((p.innerHTML.match(/class="psRaidSpecies"/g)||[]).length,0);
assert.equal((p.innerHTML.match(/class="psRaidDex"/g)||[]).length,0);
assert.equal((p.innerHTML.match(/class="psRaidSprite"/g)||[]).length,0);
assert.equal((p.innerHTML.match(/class="psRaidFormLabel"/g)||[]).length,0);
assert.doesNotMatch(p.innerHTML,/>#0777<|>Togedemaru</,
 "main card owns visible species and number — accessible labels stay intact");
assert.match(p.innerHTML,/#58 Elétrico/);
assert.match(p.innerHTML,/#94 Aço/);
assert.match(p.innerHTML,/Ágil:.*Trovoada de Choques/);
assert.match(p.innerHTML,/Carregado:.*Ataque Selvagem/);
assert.match(p.innerHTML,/Carregado:.*Girobola/);
assert.equal((p.innerHTML.match(/class="psRaidMetrics"/g)||[]).length,2);
assert.equal((p.innerHTML.match(/class="psRaidMetrics" id="psRaidMetrics-\d+" hidden/g)||[]).length,2);
assert.doesNotMatch(p.innerHTML,/Max Tanque|Max Ataque|Nova janela/);
console.log("PASS LT324: Togedemaru — two type ranks, zero repeated identities, moves, metrics collapsed");

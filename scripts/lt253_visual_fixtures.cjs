#!/usr/bin/env node
"use strict";
// CI smoke screenshots of the REAL detail.html CSS at compact Android widths.
// Not a substitute for physical Samsung P/M/G and two-window touch testing.
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict");
const assets=path.join(__dirname,"../app/src/main/assets");
if(process.argv[2]==="verify"){
 const text=fs.readFileSync(process.argv[3],"utf8");
 const found=text.match(/<output id="lt253-metrics">([\s\S]*?)<\/output>/);
 assert.ok(found,"Headless Chrome did not execute the visual fixture");
 const x=JSON.parse(found[1].replace(/&quot;/g,'"').replace(/&amp;/g,"&"));
 assert.equal(x.ok,true,"Visual layout overflow/controls: "+JSON.stringify(x));
 console.log("LT253 screenshot fixture PASS:",JSON.stringify(x));
 process.exit(0);
}
const folder=path.resolve(process.argv[2]||"lt253-visual-artifacts");
fs.mkdirSync(folder,{recursive:true});
const detail=fs.readFileSync(path.join(assets,"detail.html"),"utf8");
const css=detail.match(/<style>([\s\S]*?)<\/style>/)?.[1];
assert.ok(css&&css.includes(".ps253Family"),"latest card stylesheet required");
for(const width of [200,240,300]){
 const evo=Array.from({length:14},(_,i)=>
  '<div class="evoLine"><b>↳ Pokémon evolução '+(i+1)+'</b> · Nv. 50 · PC 1499 '+
  '<div>Rank Classe #'+(i+1)+' · Rank Geral #'+(100+i)+'</div></div>').join("");
 const html=`<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><style>${css}
 html,body{overflow:auto!important;background:#24282f!important}
 #panel{width:${width}px!important;max-height:650px!important;margin:8px!important;
 overflow-y:auto!important}
 .lt253Fixture{display:block;margin-bottom:3px}
 #psMetricPanel{display:block!important}
 #evoBody{display:block!important}
 </style></head><body><div id="panel" class="metricOpen lt253Expanded">
 <div id="header"><div id="artColumn"><img id="img" width="30" height="30" alt=""></div>
 <div id="names"><div id="nameLine"><b id="name">Mega Sableye</b></div></div></div>
 <div id="rankLine" style="display:flex;gap:3px;width:100%">
 <button class="psCompactIv">🔵 GL IV #1</button>
 <button class="psCompactSpecies"><img class="psCompactMegaEmblem" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E" alt=""><span class="psCompactSpeciesName">Sableye</span></button>
 <button class="psCompactOverall">RG —</button></div>
 <section id="psMetricPanel"><div class="psMetricHead"><b>PC / Nível · comparativo por liga</b><button>×</button></div>
 <div class="psCpSimTitle">Simulador PC / Nível · família completa</div>
 <div class="psCpSimFields">
 <label>Forma<div class="psCpFormStepper"><button>‹</button><select id="psCpForm"><option>Bellossom</option><option>Ursaluna</option></select><button>›</button></div></label>
 <label>Nível<div class="psCpLevelStepper"><button>−</button><input type="range" min="1" max="50"><button>+</button></div></label>
 <strong id="psCpLevelValue">50,0</strong></div>
 <div class="psCpSimResultRow"><span>IV atual 4/15/14</span><strong>PC 2345 · PS 221</strong></div>
 <div class="psCpSimResultRow"><span>🔵 GL até 1500</span><strong>PC 1499 · Nv. 40,5</strong></div>
 <div class="psCpSimResultRow"><span>🟡 UL até 2500</span><strong>PC 2409 · Nv. 50,0</strong></div>
 <div class="ps253Comparison"><label>Comparar outros IVs (A/D/S)<input id="psCpCompareIv" value="0/15/15"></label>
 <div class="ps253ComparisonInfo"><div class="ps253Result">⚪ LC 500 · PC 499 · Nv. 20</div>
 <div class="ps253Result">🔵 GL 1500 · PC 1499 · Nv. 40</div>
 <div class="ps253Result">🟡 UL 2500 · PC 2499 · Nv. 50</div></div></div></section>
 <section id="evolutions"><div id="evoBody"><div class="ps253Family"><strong>Comparar família · GL</strong>
 <div class="ps253Line">Melhor RG conhecido: Greninja · RG #197</div>
 <div class="ps253Line">Mega (projeção): Sableye · IV #1</div>
 <div class="ps253Actions"><button>Compartilhar PvP</button><button>Copiar</button></div></div>
 ${evo}</div></section>
 </div><output id="lt253-metrics"></output><script>
 (()=>{
 const panel=document.getElementById("panel"),form=document.getElementById("psCpForm");
 const slider=document.querySelector(".psCpLevelStepper input");
 const mega=document.querySelector(".psCompactMegaEmblem");
 const a=panel.getBoundingClientRect(),b=form.getBoundingClientRect(),c=slider.getBoundingClientRect();
 const overflow=panel.scrollWidth>panel.clientWidth+3;
 const ok=!overflow&&panel.scrollHeight>panel.clientHeight&&
  b.width>=55&&b.left>=a.left-2&&b.right<=a.right+2&&
  c.width>10&&mega.getBoundingClientRect().width>0;
 document.getElementById("lt253-metrics").textContent=JSON.stringify({
  ok,width:${width},scrollHeight:panel.scrollHeight,clientHeight:panel.clientHeight,
  scrollWidth:panel.scrollWidth,clientWidth:panel.clientWidth,formWidth:Math.round(b.width),
  sliderWidth:Math.round(c.width),horizontalOverflow:overflow});
 })();
 </script></body></html>`;
 fs.writeFileSync(path.join(folder,"lt253-"+width+".html"),html);
}
console.log("LT253 visual fixtures built:",folder);

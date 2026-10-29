"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const html=fs.readFileSync(path.join(__dirname,"../src/main/assets/detail.html"),"utf8");
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,"detail inline script");
new vm.Script(script);
const begin=script.indexOf("function evolutionRow(x,first){");
const end=script.indexOf("window.showEvolutionDetails=payload=>",begin);
assert.ok(begin>=0&&end>begin);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({
 "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
})[c]);
const render=new Function("h",script.slice(begin,end)+"return evolutionRow;")(esc);
const piplup=render({name:"Piplup",rank:2,statProductPct:"100,00",cp:1215,
 level:50,overallRank:1085,eligible:true},true);
for(const token of ["Atual","Piplup","IV #2","Eficiência IV:","100,00%","PC 1215","Nv 50,0","Rank Geral: #1085"])
 assert.ok(piplup.includes(token),"missing PvP info "+token);
assert.ok(piplup.includes("isCurrent"),"current Pokémon visually distinguished");
const empoleon=render({name:"Empoleon",rank:1927,statProductPct:"96,10",cp:2486,
 level:30,overallRank:7,eligible:false},false);
for(const token of ["Empoleon","IV #1927","Eficiência IV:","96,10%","PC 2486","Nv 30,0","Rank Geral: #7","Não elegível no nível atual"])
 assert.ok(empoleon.includes(token),"missing evolution info "+token);
assert.ok(!empoleon.includes("RG#"),"opaque RG abbreviation removed");
assert.ok(!empoleon.includes("best"),"ineligible candidate not highlighted");
const noRank=render({name:"Unknown",rank:null},false);
assert.equal(noRank,"","no invented rank");
const malicious=render({name:'<script>alert(1)</script>',rank:7},false);
assert.ok(malicious.includes("&lt;script&gt;")&&!malicious.includes("<script>"),"HTML escaped");
assert.ok(html.includes("IV # = classificação dos IVs"),"IV rank explained");
assert.ok(html.includes("Eficiência IV = comparação com o melhor IV"),"efficiency meaning clear");
assert.ok(html.includes("Rank Geral = posição da espécie na liga"),"overall rank explained");
assert.ok(html.includes("Análise PvP · "), "expansion has informative title");
assert.ok(html.includes("#major .ivTile .ivPercent{top:2px}"),"IV percent exactly 1px lower");
assert.ok(html.includes("#coordRow #coords:not(.hasCoords){padding-left:25px;padding-right:25px;text-align:center}"),
 "coordinate button symmetric without shrinking content");
assert.ok(html.includes("fetch.textContent=coordsPending?"),"native coordinate text updates preserved");
console.log("LT153 PvP legibility, rank attribution, complete fields, escape and alignments PASS");

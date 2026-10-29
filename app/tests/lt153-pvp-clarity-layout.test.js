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
for(const token of ["Atual","Piplup","Rank Classe: #2","100,00%","PC 1215","Nv. 50,0","Rank Geral: #1085"])
 assert.ok(piplup.includes(token),"missing PvP info "+token);
assert.ok(piplup.includes("isCurrent"),"current Pokémon visually distinguished");
const empoleon=render({name:"Empoleon",rank:1927,statProductPct:"96,10",cp:2486,
 level:30,overallRank:7,eligible:false},false);
for(const token of ["Empoleon","Rank Classe: #1927","96,10%","PC 2486","Nv. 30,0","Rank Geral: #7","Não elegível no nível atual"])
 assert.ok(empoleon.includes(token),"missing evolution info "+token);
assert.ok(!empoleon.includes("RG#"),"opaque RG abbreviation removed");
assert.ok(!empoleon.includes("best"),"ineligible candidate not highlighted");
const noivern=render({name:"Noivern",rank:2,overallRank:385,
 statProductPct:"92,17",cp:2890,level:50,eligible:true},false);
const firstRow=noivern.match(/<div class="evoSummary">([\s\S]*?)<\/div>/)?.[1]||"";
const secondRow=noivern.match(/<div class="evoMeta evoRankRow">([\s\S]*?)<\/div>/)?.[1]||"";
for(const token of ["Noivern","PC 2890","Nv. 50,0","92,17%"])
 assert.ok(firstRow.includes(token),"first row has "+token);
for(const token of ["Rank Classe: #2","Rank Geral: #385"])
 assert.ok(secondRow.includes(token),"second row has "+token);
assert.ok(!firstRow.includes("Rank Classe:"),"class rank must be below");
assert.ok(!secondRow.includes("PC 2890"),"PC must stay on first row");
assert.ok(html.includes('.evoLine .evoRankRow{justify-content:center;column-gap:18px;row-gap:2px;padding-inline:8px;text-align:center}'),
 "both ranks centered with balanced spacing and side insets");

assert.ok(!noivern.includes("Eficiência IV:"),"no redundant efficiency label");

const overallOnly=render({name:"Ninetales",rank:null,overallRank:24},false);
assert.ok(overallOnly.includes("Rank Classe: —"),"class rank unavailable without raw IV");
assert.ok(overallOnly.includes("Rank Geral: #24"),"verified overall rank still visible");
assert.ok(!overallOnly.includes("evoPct"),"never guess an IV efficiency value");
assert.ok(!overallOnly.includes("Nv. "),"never invent a projected level");

const noRank=render({name:"Unknown",rank:null},false);
assert.equal(noRank,"","no invented rank");
const malicious=render({name:'<script>alert(1)</script>',rank:7},false);
assert.ok(malicious.includes("&lt;script&gt;")&&!malicious.includes("<script>"),"HTML escaped");
assert.ok(!html.includes('class="evoHint"'),"no introductory explanation paragraph");


assert.ok(html.includes("Análise PvP · "), "expansion has informative title");
assert.ok(html.includes("#major .ivTile .ivPercent{top:2px}"),"IV percent exactly 1px lower");
assert.ok(html.includes("#coordRow #coords:not(.hasCoords){padding-left:25px;padding-right:25px;text-align:center}"),
 "coordinate button symmetric without shrinking content");
assert.ok(html.includes("fetch.textContent=coordsPending?"),"native coordinate text updates preserved");
console.log("LT153 PvP legibility, rank attribution, complete fields, escape and alignments PASS");

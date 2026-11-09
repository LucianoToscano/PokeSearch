"use strict";
// LT322 candidate: evolution conditions are advisory, offline, and shared
// by the DETAIL WebView used in both primary and secondary Pokémon overlays.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const req=require("../src/main/assets/evolution_requirements.js");
const family=require("../src/main/assets/pvp_family_catalog.js");
const detail=fs.readFileSync(path.join(__dirname,"../src/main/assets/detail.html"),"utf8");
const java=fs.readFileSync(path.join(__dirname,
 "../src/main/java/com/lucianotoscano/pokesearchoverlay/SecondaryOverlayService.java"),"utf8");
assert.equal(req.ruleCount,76,"all 76 curated special transitions are present");
const direct=[
 ["Gloom","Bellossom","Pedra Solar"],
 ["Poliwhirl","Politoed","Pedra do Rei"],
 ["Scyther","Scizor","Revestimento Metálico"],
 ["Seadra","Kingdra","Escama de Dragão"],
 ["Porygon","Porygon2","Melhora (Up-Grade)"],
 ["Togetic","Togekiss","Pedra de Sinnoh"],
 ["Lampent","Chandelure","Pedra de Unova"],
 ["Applin","Flapple","20 Maçãs Azedas"],
 ["Applin","Appletun","20 Maçãs Doces"],
 ["Applin","Dipplin","20 Maçãs Xaropentas"],
 ["Gimmighoul","Gholdengo","999 Moedas de Gimmighoul"],
 ["Magneton","Magnezone","Módulo Atrair Magnético"],
 ["Eevee","Leafeon","Módulo Atrair Musgoso"],
 ["Eevee","Glaceon","Módulo Atrair Glacial"],
 ["Sliggoo","Goodra","Chuva no jogo ou Módulo Atrair Chuvoso"],
 ["Ursaring","Ursaluna","Lua cheia no jogo"]
];
for(const [a,b,label] of direct){
 assert.equal(req.byTransition(a,b)?.label,label,a+" -> "+b);
 assert.ok(family.links.some(e=>e[0]===a&&e[1]===b),
  "requirement must exist in canonical pinned family graph: "+a+" -> "+b);
}
const porygon=req.forRoute("Porygon","Porygon-Z",family.links);
assert.deepEqual(porygon?.map(r=>r.label),
 ["Melhora (Up-Grade)","Pedra de Sinnoh"]);
const applin=req.forRoute("Applin","Hydrapple",family.links);
assert.deepEqual(applin?.map(r=>r.label),
 ["20 Maçãs Xaropentas",
  "Capturar 7 Pokémon Dragão com Dipplin companheiro"]);
assert.deepEqual(req.forRoute("Poliwag","Politoed",family.links)?.map(r=>r.label),
 ["Pedra do Rei"]);
assert.equal(req.byTransition("Kirlia","Gallade")?.additional,"Somente Kirlia macho");
assert.equal(req.byTransition("Snorunt","Froslass")?.additional,"Somente Snorunt fêmea");
assert.equal(req.byTransition("Gloom","Vileplume"),null,
 "branch without item must not inherit Bellossom requirement");
assert.equal(req.byTransition("Scyther (Shadow)","Scizor (Shadow)"),null,
 "Shadow eligibility is not inferred");
assert.equal(req.byTransition("Slowpoke (Galarian)","Slowking"),null,
 "regional form cannot inherit Kanto item condition");
assert.equal(req.forRoute("Eevee (Costume)","Glaceon",family.links),null,
 "costumes must not silently inherit GO requirements");
assert.equal(req.forRoute("Arbitrary","Charizard",family.links),null,
 "unknown species/branch is not an item-free evolution");
assert.deepEqual(req.forRoute("Eevee","Eevee",family.links),[]);
assert.match(detail,/<script src="pvp_family_catalog\.js"><\/script>\s*<script src="evolution_requirements\.js"><\/script>/,
 "load evolution data only after existing family graph");
assert.match(detail,/Etapa especial: /);
assert.match(detail,/!first&&!isReference&&!isMega/,
 "never add evolution eligibility claims to theoretical Mega/costume rows");
assert.match(java,/extends OverlayService/,
 "P2 inherits the same shared detail rendering as P1");
assert.match(detail,/\.evoCondition\{/,
 "legible, non-obtrusive conditions use their own style");
// Execute the real HTML renderer rather than only checking source strings.
const start=detail.indexOf("function evolutionRow(");
const end=detail.indexOf("// Compact rank shown",start);
assert.ok(start>0&&end>start,"extract evolution renderer");
const fakeWindow={psRankRenderLeague:"gl",
 PokeSearchEvolutionRequirements:req,PokeSearchPvpFamilyCatalog:family};
const renderer=(capturedName,card)=>new Function(
 "window","h","watchName","psCapturedCard",
 detail.slice(start,end)+";return evolutionRow;")(
 fakeWindow,value=>String(value),capturedName,card);
const evolved={name:"Politoed",rank:2,overallRank:15,statProductPct:"99,22",
 cp:1498,level:30,eligible:null};
assert.match(renderer("Poliwag",{form:"",costume:""})(evolved,false),
 /Etapa especial: [\s\S]*Pedra do Rei/);
assert.doesNotMatch(renderer("Poliwag",{form:"Galarian"})(evolved,false),
 /Etapa especial:/,"regional capture must not inherit base requirement");
assert.doesNotMatch(renderer("Poliwag",{form:""} )(
 {...evolved,referenceOnly:true},false),
 /Etapa especial:/,"theoretical costume evolution must not show item eligibility");

const pngNames=[
 "sun-stone.png","kings-rock.png","metal-coat.png","dragon-scale.png",
 "upgrade.png","sinnoh-stone.png","unova-stone.png","sweet-apple.png",
 "tart-apple.png","syrupy-apple.png","gimmighoul-coins.png",
 "magnetic-lure-module.png","mossy-lure-module.png",
 "glacial-lure-module.png","rainy-lure-module.png"
];
for(const name of pngNames){
 const file=path.join(__dirname,"../src/evolution-image-masters",name);
 const bytes=fs.readFileSync(file);
 assert.ok(bytes.length>1000,name+" must have full image bytes");
 assert.equal(bytes.toString("ascii",1,4),"PNG",name+" must be PNG");
 const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20);
 assert.ok(width>=128&&height>=128&&width<=2048&&height<=2048,
  name+" must have sensible dimensions");
}
const build=fs.readFileSync(path.join(__dirname,"../build.gradle.kts"),"utf8");
const javaPreview=fs.readFileSync(path.join(__dirname,
 "../scripts/EvolutionPreviewIcons.java"),"utf8");
assert.match(build,/sourceSets\.getByName\("main"\)\.assets\.srcDir/);
assert.match(build,/generateEvolutionPreviews/);
assert.match(javaPreview,/private static final int SIDE = 64/);
assert.match(javaPreview,/MAX_TOTAL_BYTES = 180_000/);
assert.match(javaPreview,/ImageIO\.write\(preview, "PNG", bytes\)/);
assert.equal((javaPreview.match(/\.png"/g)||[]).length,15,
 "generator owns exactly the 15 pinned PNG masters");
assert.equal(req.byTransition("Poliwhirl","Politoed")?.icon,
 "evolution-items/kings-rock.png");
assert.match(renderer("Poliwag",{form:""})(evolved,false),
 /evolution-items\/kings-rock\.png/);
assert.match(detail,/\.evoConditionIcon\{/);
const applinDirect=req.byTransition("Applin","Dipplin");
assert.equal(applinDirect?.detail,"200 Doces de Applin");
assert.equal(applinDirect?.icon,"evolution-items/syrupy-apple.png");
assert.equal(req.byTransition("Dipplin","Hydrapple")?.detail,"400 Doces de Applin");
const taskEdges=[
 "Dipplin>Hydrapple","Primeape>Annihilape",
 "Charcadet>Armarouge","Charcadet>Ceruledge","Bisharp>Kingambit",
 "Pancham>Pangoro","Spritzee>Aromatisse","Swirlix>Slurpuff",
 "Poipole>Naganadel","Feebas>Milotic","Pawmo>Pawmot",
 "Bramblin>Brambleghast","Woobat>Swoobat","Bonsly>Sudowoodo",
 "Happiny>Chansey","Eevee>Espeon","Eevee>Umbreon","Eevee>Sylveon",
 "Snom>Frosmoth","Inkay>Malamar","Tyrunt>Tyrantrum",
 "Yungoos>Gumshoos","Fomantis>Lurantis","Cosmoem>Solgaleo",
 "Amaura>Aurorus","Cosmoem>Lunala","Combee>Vespiquen",
 "Salandit>Salazzle"
];
for(const edge of taskEdges){
 const [a,b]=edge.split(">");
 assert.ok(family.links.some(x=>x[0]===a&&x[1]===b),
  "special condition must exist in graph: "+edge);
 assert.ok(req.byTransition(a,b)?.label,
  "specific route must have condition: "+edge);
}
const capture=renderer("Applin",{form:""} )(
 {name:"Hydrapple",rank:1,cp:1500,level:23},false);
assert.match(capture,/20 Maçãs Xaropentas/);
assert.match(capture,/200 Doces de Applin/);
assert.match(capture,/400 Doces de Applin/);
assert.match(capture,/Capturar 7 Pokémon Dragão/);
assert.ok(capture.includes('class="evoConditionSep"'),
 "multi-stage path uses a visual separator");
assert.doesNotMatch(renderer("Applin",{form:"Costume"})(
 {name:"Hydrapple",rank:1},false),/Etapa especial/,
 "unverified costume cannot inherit apples or challenges");
console.log("PASS LT322: 76 rules, 15 PNGs, amounts and tasks, guarded renderer, P1/P2");

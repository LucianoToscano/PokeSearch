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
assert.equal(req.ruleCount,77,"all 77 curated special transitions are present");
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
 ["Ursaring","Ursaluna","Lua cheia no jogo"],
 ["Floette","Florges","Ganhar 20 corações com Floette companheiro"]
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
// Pokémon GO announcement on 21/11/2026, 14:00–21:00 device-local time.
// Frozen local dates avoid relying on CI's timezone or current real-world time.
const kingNormal="Derrotar 15 chefes de Reide Sombrio/Aço com Bisharp companheiro";
const kingEvent="Derrotar 1 chefe de Reide Sombrio/Aço com Bisharp companheiro";
const eventCases=[
 [new Date(2026,10,20,23,59),kingNormal,"futuro"],
 [new Date(2026,10,21,13,59),kingNormal,"futuro"],
 [new Date(2026,10,21,14,0),kingEvent,"ativo"],
 [new Date(2026,10,21,20,59),kingEvent,"ativo"],
 [new Date(2026,10,21,21,0),kingNormal,undefined],
 [new Date(2026,10,22,0,0),kingNormal,undefined],
 [new Date(2027,0,1,0,0),kingNormal,undefined]
];
for(const [date,label,eventState] of eventCases){
 const direct=req.byTransition("Bisharp","Kingambit",date);
 assert.equal(direct?.label,label,date+" direct temporary rule");
 assert.equal(direct?.eventState,eventState,date+" no stale event note");
 const multi=req.forRoute("Pawniard","Kingambit",family.links,6,date);
 assert.equal(multi?.[0]?.label,label,date+" multiphase event rule");
 assert.equal(multi?.[0]?.eventState,eventState,date+" multiphase note expiry");
}
assert.equal(req.byTransition("Floette","Florges")?.detail,"100 Doces de Flabébé");
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
assert.match(detail,/\.evoEventNote\{/);
const kingCard={name:"Kingambit",rank:3,overallRank:9,cp:1498,level:27};
const eventRenderer=now=>new Function("window","h","watchName","psCapturedCard",
 detail.slice(start,end)+";return evolutionRow;")({
  psRankRenderLeague:"gl",
  PokeSearchEvolutionRequirements:{
   forRoute:(from,to,links)=>req.forRoute(from,to,links,6,now)
  },
  PokeSearchPvpFamilyCatalog:family
 },value=>String(value),"Pawniard",{form:""});
const upcomingHtml=eventRenderer(new Date(2026,10,21,13,59))(kingCard,false);
const liveHtml=eventRenderer(new Date(2026,10,21,14,0))(kingCard,false);
const expiredHtml=eventRenderer(new Date(2026,10,21,21,0))(kingCard,false);
assert.match(upcomingHtml,/21\/11\/2026, 14h–21h/);
assert.match(liveHtml,/Derrotar 1 chefe de Reide/);
assert.match(liveHtml,/Humilhação Dividida/);
assert.doesNotMatch(expiredHtml,/Humilhação Dividida|21\/11\/2026/,
 "expired temporary evolution must disappear from UI");
assert.match(expiredHtml,/Derrotar 15 chefes de Reide/);
assert.doesNotMatch(eventRenderer(new Date(2026,10,21,14,0))(
 {...kingCard,referenceOnly:true},false),/evoEventNote/,
 "theoretical rows cannot show limited-time eligibility");

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
console.log("PASS LT322: 77 rules, official event expiry, 15 PNGs, guarded renderer, P1/P2");

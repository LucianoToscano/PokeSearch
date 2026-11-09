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
assert.ok(req.ruleCount>=40,"multiple items and special conditions catalogued");
const direct=[
 ["Gloom","Bellossom","Pedra Solar"],
 ["Poliwhirl","Politoed","Pedra do Rei"],
 ["Scyther","Scizor","Revestimento Metálico"],
 ["Seadra","Kingdra","Escama de Dragão"],
 ["Porygon","Porygon2","Melhora (Up-Grade)"],
 ["Togetic","Togekiss","Pedra de Sinnoh"],
 ["Lampent","Chandelure","Pedra de Unova"],
 ["Applin","Flapple","Maçã Azeda"],
 ["Applin","Appletun","Maçã Doce"],
 ["Applin","Dipplin","Maçã Melada"],
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
assert.deepEqual(applin?.map(r=>r.label),["Maçã Melada"]);
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
console.log("PASS LT322: evolution items, multi-step routes, guarded forms, shared P1/P2 detail");

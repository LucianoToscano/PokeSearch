/* LT322 candidate (data-only): special GO evolution requirements, 09/11/2026.
 * Referenced from existing PvP family rows. Never implies that a costume,
 * regional form, Shadow, Mega, or individual catch is eligible to evolve.
 * Do NOT use PokéAPI main-series evolution methods as Pokémon GO rules.
 * Sources (manually reviewed, not runtime API dependencies):
 * https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/100-evolving-your-pokemon/
 * https://pokemon.gameinfo.io/en/guides/evolution-requirements
 * https://pokemongohub.net/post/wiki/evolution-items/
 */
(function(root,factory){"use strict";
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.PokeSearchEvolutionRequirements=api;
})(typeof window!=="undefined"?window:null,function(){
 "use strict";
 const norm=value=>String(value??"").normalize("NFD")
  .replace(/[\u0300-\u036f]/g,"").trim().toLowerCase().replace(/\s+/g," ");
 const safe=value=>{
  const name=norm(value);
  return !name||name.includes("(")||/^(mega|primal)\b/.test(name)?"":name;
 };
 const registry=new Map();
 const add=(kind,label,edges)=>{
  for(const edge of edges){
   const parts=edge.split(">");
   if(parts.length!==2)throw Error("Invalid evolution edge");
   const key=norm(parts[0])+">"+norm(parts[1]);
   if(registry.has(key))throw Error("Duplicate evolution rule: "+key);
   registry.set(key,Object.freeze({kind,label}));
  }
 };
 add("item","Pedra Solar",[
  "Gloom>Bellossom","Sunkern>Sunflora","Cottonee>Whimsicott",
  "Petilil>Lilligant","Helioptile>Heliolisk"]);
 add("item","Pedra do Rei",["Poliwhirl>Politoed","Slowpoke>Slowking"]);
 add("item","Revestimento Metálico",["Onix>Steelix","Scyther>Scizor"]);
 add("item","Escama de Dragão",["Seadra>Kingdra"]);
 add("item","Melhora (Up-Grade)",["Porygon>Porygon2"]);
 add("item","Pedra de Sinnoh",[
  "Lickitung>Lickilicky","Rhydon>Rhyperior","Tangela>Tangrowth",
  "Electabuzz>Electivire","Magmar>Magmortar","Togetic>Togekiss",
  "Aipom>Ambipom","Yanma>Yanmega","Murkrow>Honchkrow",
  "Misdreavus>Mismagius","Gligar>Gliscor","Sneasel>Weavile",
  "Piloswine>Mamoswine","Porygon2>Porygon-Z","Kirlia>Gallade",
  "Roselia>Roserade","Dusclops>Dusknoir","Snorunt>Froslass"]);
 add("item","Pedra de Unova",[
  "Pansage>Simisage","Pansear>Simisear","Panpour>Simipour",
  "Munna>Musharna","Minccino>Cinccino","Eelektrik>Eelektross",
  "Lampent>Chandelure"]);
 add("item","Maçã Doce",["Applin>Appletun"]);
 add("item","Maçã Azeda",["Applin>Flapple"]);
 add("item","Maçã Melada",["Applin>Dipplin"]);
 add("resource","999 Moedas de Gimmighoul",["Gimmighoul>Gholdengo"]);
 add("lure","Módulo Atrair Magnético",[
  "Magneton>Magnezone","Nosepass>Probopass","Charjabug>Vikavolt"]);
 add("lure","Módulo Atrair Musgoso",["Eevee>Leafeon"]);
 add("lure","Módulo Atrair Glacial",[
  "Eevee>Glaceon","Crabrawler>Crabominable"]);
 add("environment","Chuva no jogo ou Módulo Atrair Chuvoso",["Sliggoo>Goodra"]);
 add("environment","Lua cheia no jogo",["Ursaring>Ursaluna"]);
 const gender=new Map([
  ["kirlia>gallade","Somente Kirlia macho"],
  ["snorunt>froslass","Somente Snorunt fêmea"]
 ]);
 function byTransition(from,to){
  const a=safe(from),b=safe(to);
  if(!a||!b)return null;
  const rule=registry.get(a+">"+b);
  if(!rule)return null;
  const requirement=gender.get(a+">"+b);
  return Object.freeze({kind:rule.kind,label:rule.label,
   ...(requirement?{additional:requirement}:{})});
 }
 // Only follow explicit, directed edges from the existing GO family graph.
 // Unknown forms/edges must not silently inherit conditions from a base form.
 function forRoute(from,to,links,maxEdges=6){
  const start=safe(from),end=safe(to);
  if(!start||!end)return null;
  if(start===end)return [];
  if(!Array.isArray(links))return null;
  const limit=Number.isInteger(maxEdges)?Math.max(1,Math.min(6,maxEdges)):6;
  const graph=new Map();
  for(const edge of links){
   if(!Array.isArray(edge)||edge.length!==2)continue;
   const a=safe(edge[0]),b=safe(edge[1]);
   if(!a||!b)continue;
   if(!graph.has(a))graph.set(a,[]);
   graph.get(a).push(b);
  }
  const seen=new Set([start]),queue=[[start,[]]];
  while(queue.length){
   const [now,path]=queue.shift();
   if(path.length>=limit)continue;
   for(const next of graph.get(now)||[]){
    if(seen.has(next))continue;
    const route=[...path,[now,next]];
    if(next===end){
     return route.map(([a,b])=>byTransition(a,b)).filter(Boolean);
    }
    seen.add(next);
    queue.push([next,route]);
   }
  }
  return null;
 }
 return Object.freeze({byTransition,forRoute,
  ruleCount:registry.size,sourceDate:"2026-11-09"});
});

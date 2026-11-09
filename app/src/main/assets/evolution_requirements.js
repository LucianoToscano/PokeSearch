/* LT322 candidate (data-only): special GO evolution requirements, 09/11/2026.
 * Referenced from existing PvP family rows. Never implies that a costume,
 * regional form, Shadow, Mega, or individual catch is eligible to evolve.
 * Do NOT use PokéAPI main-series evolution methods as Pokémon GO rules.
 * Source contract: extra conditions only, not a promise of individual eligibility.
 * Official Portuguese translations and Applin costs confirmed 09/11/2026.
 * Sources (manually reviewed, not runtime API dependencies):
 * https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/100-evolving-your-pokemon/
 * https://pokemon.gameinfo.io/en/guides/evolution-requirements
 * https://pokemongohub.net/post/wiki/evolution-items/
 * https://pokemongo.com/pt-BR/news/harvest-festival-2025
 * https://pokemongo.com/pt-BR/news/harvest-festival-2026
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
 const iconByLabel=Object.freeze({
  "Pedra Solar":"sun-stone.png",
  "Pedra do Rei":"kings-rock.png",
  "Revestimento Metálico":"metal-coat.png",
  "Escama de Dragão":"dragon-scale.png",
  "Melhora (Up-Grade)":"upgrade.png",
  "Pedra de Sinnoh":"sinnoh-stone.png",
  "Pedra de Unova":"unova-stone.png",
  "20 Maçãs Doces":"sweet-apple.png",
  "20 Maçãs Azedas":"tart-apple.png",
  "20 Maçãs Xaropentas":"syrupy-apple.png",
  "999 Moedas de Gimmighoul":"gimmighoul-coins.png",
  "Módulo Atrair Magnético":"magnetic-lure-module.png",
  "Módulo Atrair Musgoso":"mossy-lure-module.png",
  "Módulo Atrair Glacial":"glacial-lure-module.png",
  "Chuva no jogo ou Módulo Atrair Chuvoso":"rainy-lure-module.png"
 });
 const add=(kind,label,edges,detail)=>{
  for(const edge of edges){
   const parts=edge.split(">");
   if(parts.length!==2)throw Error("Invalid evolution edge");
   const key=norm(parts[0])+">"+norm(parts[1]);
   if(registry.has(key))throw Error("Duplicate evolution rule: "+key);
   registry.set(key,Object.freeze({kind,label,...(detail?{detail}:{})}));
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
 add("resource","20 Maçãs Doces",["Applin>Appletun"],"200 Doces de Applin");
 add("resource","20 Maçãs Azedas",["Applin>Flapple"],"200 Doces de Applin");
 add("resource","20 Maçãs Xaropentas",["Applin>Dipplin"],"200 Doces de Applin");
 add("resource","999 Moedas de Gimmighoul",["Gimmighoul>Gholdengo"]);
 add("lure","Módulo Atrair Magnético",[
  "Magneton>Magnezone","Nosepass>Probopass","Charjabug>Vikavolt"]);
 add("lure","Módulo Atrair Musgoso",["Eevee>Leafeon"]);
 add("lure","Módulo Atrair Glacial",[
  "Eevee>Glaceon","Crabrawler>Crabominable"]);
 add("environment","Chuva no jogo ou Módulo Atrair Chuvoso",["Sliggoo>Goodra"]);
 add("environment","Lua cheia no jogo",["Ursaring>Ursaluna"]);
 // Extra task requirements are advisory and can be temporarily relaxed in events.
 // No stored account state or automatic detection of fulfilled tasks.
 add("task","Capturar 7 Pokémon Dragão com Dipplin companheiro",
  ["Dipplin>Hydrapple"],"400 Doces de Applin");
 add("task","Derrotar 30 Psíquicos ou Fantasmas com Primeape companheiro",
  ["Primeape>Annihilape"],"100 Doces");
 add("task","Derrotar 30 Psíquicos com Charcadet companheiro",
  ["Charcadet>Armarouge"],"50 Doces");
 add("task","Derrotar 30 Fantasmas com Charcadet companheiro",
  ["Charcadet>Ceruledge"],"50 Doces");
 add("task","Derrotar 15 chefes de Reide Sombrio/Aço com Bisharp companheiro",
  ["Bisharp>Kingambit"],"100 Doces · eventos podem alterar essa tarefa");
 add("task","Capturar 32 Pokémon Sombrio com Pancham companheiro",
  ["Pancham>Pangoro"],"50 Doces");
 add("task","Usar 1 Incenso com Spritzee companheiro",
  ["Spritzee>Aromatisse"],"50 Doces");
 add("task","Dar 25 guloseimas a Swirlix companheiro",
  ["Swirlix>Slurpuff"],"50 Doces");
 add("task","Capturar 20 Pokémon Dragão com Poipole companheiro",
  ["Poipole>Naganadel"],"200 Doces");
 add("buddy","Caminhar 20 km com Feebas companheiro",
  ["Feebas>Milotic"],"100 Doces");
 add("buddy","Caminhar 25 km com Pawmo companheiro",
  ["Pawmo>Pawmot"],"100 Doces");
 add("buddy","Caminhar 20 km com Bramblin companheiro",
  ["Bramblin>Brambleghast"],"50 Doces");
 add("buddy","Caminhar 1 km com Woobat companheiro",
  ["Woobat>Swoobat"],"50 Doces");
 add("buddy","Caminhar 15 km com Bonsly companheiro",
  ["Bonsly>Sudowoodo"],"50 Doces");
 add("buddy","Caminhar 15 km com Happiny companheiro",
  ["Happiny>Chansey"],"25 Doces");
 add("buddy","Caminhar 10 km e evoluir Eevee como companheiro, de dia",
  ["Eevee>Espeon"],"25 Doces · apelido especial pode oferecer alternativa");
 add("buddy","Caminhar 10 km e evoluir Eevee como companheiro, à noite",
  ["Eevee>Umbreon"],"25 Doces · apelido especial pode oferecer alternativa");
 add("buddy","Ganhar 70 corações com Eevee companheiro",
  ["Eevee>Sylveon"],"25 Doces · apelido especial pode oferecer alternativa");
 add("buddy","Ganhar 10 corações com Snom companheiro, à noite",
  ["Snom>Frosmoth"],"400 Doces");
 add("device","Virar o celular de cabeça para baixo",
  ["Inkay>Malamar"],"50 Doces");
 add("environment","Durante o dia",[
  "Tyrunt>Tyrantrum","Yungoos>Gumshoos","Fomantis>Lurantis",
  "Cosmoem>Solgaleo"]);
 add("environment","Durante a noite",[
  "Amaura>Aurorus","Cosmoem>Lunala"]);
 add("gender","Somente Combee fêmea",["Combee>Vespiquen"]);
 add("gender","Somente Salandit fêmea",["Salandit>Salazzle"]);
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
  const file=iconByLabel[rule.label];
  return Object.freeze({kind:rule.kind,label:rule.label,
   ...(rule.detail?{detail:rule.detail}:{}),
   ...(file?{icon:"evolution-items/"+file}:{}),
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

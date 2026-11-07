/* LT258 PvP moves: read-only, source-pinned PvPoke public snapshots.
   Rankings supply the recommended move IDs; gamemaster supplies Elite/Legacy
   flags. No unverified guess, PoGoCoordinates call, cookie, token, or backend.
   Badge metadata is checked automatically when a detail card opens; full\n   localized moves load when the user taps. No credentials or background service. */
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 else root.PokeSearchPvpRankMoves=api;
})(typeof window!=="undefined"?window:globalThis,function(){
 "use strict";
 const commit="e02bde78d19be9b9099b5a6629c6a8d0835a53be";
 const source="PvPoke/pvpoke · 03/11/2026";
 const base="https://raw.githubusercontent.com/pvpoke/pvpoke/"+commit+"/src/data/";
 // Public GO move IDs + official-game pt-BR text, pinned to one snapshot.
 // The PvPoke move recommendation stays authoritative for the suggested set.
 const localeBase="https://raw.githubusercontent.com/WatWowMap/pogo-data-api/"+
  "31a3bcdc2e412f315c4be2bb593807f45cb9bd9b/data/v1/";
 const typeIds=Object.freeze({1:"normal",2:"fighting",3:"flying",4:"poison",5:"ground",
   6:"rock",7:"bug",8:"ghost",9:"steel",10:"fire",11:"water",12:"grass",
   13:"electric",14:"psychic",15:"ice",16:"dragon",17:"dark",18:"fairy"});
 const caps={gl:"1500",ul:"2500",ml:"10000"};
 const cache=new Map();
 const speciesId=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .toLowerCase().replace(/[’']/g,"").replace(/[().]/g," ")
  .trim().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
 const displayId=value=>String(value||"").replace(/_/g," ").replace(/\b[a-z]/g,x=>x.toUpperCase());
 /* LT254: Mega Edition is NOT the standard-league moveset. Strict Mega name
  * normalization prevents silently reusing base Sableye/Charizard rankings. */
 function megaSpeciesId(name){
  const label=String(name||"").trim();
  if(!/^mega\s+/i.test(label)&&!/\(mega(?:\s+[xy])?\)\s*$/i.test(label))return "";
  const id=speciesId(label);
  if(/_mega(?:_[xy])?$/.test(id))return id;
  if(!id.startsWith("mega_"))return "";
  const tail=id.slice(5);
  const match=tail.match(/^(.*)_([xy])$/);
  return match?match[1]+"_mega_"+match[2]:tail+"_mega";
 }
 async function getJson(path){
  if(cache.has(path))return cache.get(path);
  const work=(async()=>{
   const ctl=typeof AbortController!=="undefined"?new AbortController():null;
   const handle=ctl&&setTimeout(()=>ctl.abort(),12000);
   try{
    const response=await fetch(/^https:\/\//.test(path)?path:base+path,{method:"GET",credentials:"omit",cache:"force-cache",
      ...(ctl?{signal:ctl.signal}:{})});
    if(!response.ok)throw Error("PvPoke HTTP "+response.status);
    const size=Number(response.headers?.get?.("content-length")||0);
    if(size>12*1024*1024)throw Error("PvPoke arquivo excede limite");
    const data=await response.text();
    if(data.length>12*1024*1024)throw Error("PvPoke arquivo excede limite");
    return JSON.parse(data);
   }finally{if(handle)clearTimeout(handle);}
  })();
  cache.set(path,work);
  // LT246: a failed network request must not poison every future tap.
  work.catch(()=>{if(cache.get(path)===work)cache.delete(path);});
  return work;
 }
/* LT253: take numerical move data ONLY from the pinned PvPoke gamemaster.
   Missing fields remain absent; never derive energy/power from an English name. */
 function moveStats(master,id){
  const found=(Array.isArray(master?.moves)?master.moves:[])
   .find(x=>x?.moveId===id);
  if(!found)return {};
  const safe=(key,max)=>{
   const value=Number(found[key]);
   return Number.isFinite(value)&&value>0&&value<=max?value:null;
  };
  const stats={};
  const power=safe("power",500),energy=safe("energy",200),
    gain=safe("energyGain",100);
  if(power!==null)stats.power=power;
  if(energy!==null)stats.energyCost=energy;
  if(gain!==null)stats.energyGain=gain;
  return stats;
 }
 function fromData(rankings,master,league,name){
  if(!Array.isArray(rankings)||!master||!Array.isArray(master.pokemon))return null;
  const id=speciesId(name);
  const ranking=rankings.find(x=>x?.speciesId===id);
  const pokemon=master.pokemon.find(x=>x?.speciesId===id);
  if(!ranking||!pokemon||!Array.isArray(ranking.moveset)||ranking.moveset.length<2)return null;
  const names=new Map((Array.isArray(master.moves)?master.moves:[])
    .filter(m=>m&&typeof m.moveId==="string"&&typeof m.name==="string")
    .map(m=>[m.moveId,m.name]));
  const elite=new Set(Array.isArray(pokemon.eliteMoves)?pokemon.eliteMoves:[]);
  const legacy=new Set(Array.isArray(pokemon.legacyMoves)?pokemon.legacyMoves:[]);
  const ordinary=new Set([...(pokemon.fastMoves||[]),...(pokemon.chargedMoves||[])]);
  const moves=ranking.moveset.slice(0,3).filter(x=>typeof x==="string").map(moveId=>({
   id:moveId,name:names.get(moveId)||displayId(moveId),
   status:elite.has(moveId)?"elite":legacy.has(moveId)?"legacy":
    ordinary.has(moveId)?"normal":"unknown",
   stats:moveStats(master,moveId)
  }));
  if(moves.length<2)return null;
  return {source,commit,league,species:pokemon.speciesName||ranking.speciesName||name,
   fast:moves[0],charged:moves.slice(1)};
 }

 // LT246: when a Pokémon isn't simulated in PvPoke's overall ranking,
 // show documented learnable moves, NOT fabricated "recommended" attacks.
 function fromAvailable(master,league,name){
  if(!master||!Array.isArray(master.pokemon))return null;
  const id=speciesId(name);
  const pokemon=master.pokemon.find(x=>x?.speciesId===id);
  if(!pokemon)return null;
  const fastIds=Array.isArray(pokemon.fastMoves)?pokemon.fastMoves.slice(0,12):[];
  const chargedIds=Array.isArray(pokemon.chargedMoves)?pokemon.chargedMoves.slice(0,20):[];
  if(!fastIds.length&&!chargedIds.length)return null;
  const names=new Map((Array.isArray(master.moves)?master.moves:[])
   .filter(m=>m&&typeof m.moveId==="string"&&typeof m.name==="string")
   .map(m=>[m.moveId,m.name]));
  const elite=new Set(Array.isArray(pokemon.eliteMoves)?pokemon.eliteMoves:[]);
  const legacy=new Set(Array.isArray(pokemon.legacyMoves)?pokemon.legacyMoves:[]);
  const make=moveId=>({
   id:moveId,name:names.get(moveId)||displayId(moveId),
   status:elite.has(moveId)?"elite":legacy.has(moveId)?"legacy":"normal",
   stats:moveStats(master,moveId)
  });
  return {source,commit,league,species:pokemon.speciesName||name,
   availableOnly:true,recommended:false,
   fastMoves:fastIds.filter(x=>typeof x==="string").map(make),
   chargedMoves:chargedIds.filter(x=>typeof x==="string").map(make)};
 }

 // Match the SAME canonical move + category. PokeGO uses a `_FAST` suffix
 // for quick moves whereas PvPoke recommendation IDs omit that suffix.
 // Never derive types or PT-BR names from English guesses.
 function localizedMoves(data,moves,translations){
  if(!data||!Array.isArray(moves)||!translations||typeof translations!=="object")return null;
  const byProto=new Map();
  for(const item of moves){
   if(typeof item?.proto!=="string"||!Number.isInteger(item.moveId))continue;
   byProto.set(item.proto,item);
  }
  function localized(move,fast){
   if(!move||typeof move.id!=="string")return null;
   const key=move.id+(fast?"_FAST":"");
   const match=byProto.get(key)||(!fast?byProto.get(move.id):null);
   const translated=match&&translations["move_"+match.moveId];
   // Do not put a wrong English label into the Portuguese card when source
   // identity or type is missing. Leave a neutral unknown placeholder.
   const verified=typeof translated==="string"&&translated.trim().length>1&&
       Number.isInteger(match.type)&&!!typeIds[match.type];
   return {...move,name:verified?translated.trim():"—",
     type:verified?typeIds[match.type]:"unknown",localeVerified:verified};
  }
  if(data.availableOnly===true){
   return {...data,
    fastMoves:(data.fastMoves||[]).map(m=>localized(m,true))
     .filter(m=>m?.localeVerified===true),
    chargedMoves:(data.chargedMoves||[]).map(m=>localized(m,false))
     .filter(m=>m?.localeVerified===true)};
  }
  return {...data,fast:localized(data.fast,true),
    charged:data.charged.map(m=>localized(m,false))};
 }

 /* Distinct, pinned PvPoke Mega Edition source: source-specific moveset can
  * differ from normal even though Mega Evolution retains the move inventory.
  * Never fall back to standard rankings or invent Mega-specific attacks. */
 async function lookupMega(league,name){
  const cap=caps[league],id=megaSpeciesId(name);
  if(!cap||!id)return null;
  try{
   const [ranking,master,moveData,translations]=await Promise.all([
    getJson("rankings/mega/overall/rankings-"+cap+".json").catch(()=>null),
    getJson("gamemaster.json"),
    getJson(localeBase+"moves.json"),
    getJson(localeBase+"translations/pt-br/moves.json")
   ]);
   const item=fromData(ranking,master,league,id);
   if(!item)return null;
   const localized=localizedMoves({...item,source:source+" · Mega Edition",
    format:"mega",megaRecommendation:true,
    megaSpeciesId:id,baseSpeciesId:id.replace(/_mega(?:_[xy])?$/,"")},moveData,translations);
   return localized;
  }catch(_){return null;}
 }
 // LT258: verify the badge in advance using ONLY ranked move IDs and
 // the pinned gamemaster. No PT-BR translation download or click is needed.
 // Neutral when the species is unranked, the source fails or any status is unknown.
 async function getStatus(league,name,mega=false){
  const cap=caps[league],id=mega?megaSpeciesId(name):speciesId(name);
  if(!cap||!id)return null;
  try{
   const path=(mega?"rankings/mega/overall/":"rankings/all/overall/")+
    "rankings-"+cap+".json";
   const [rankings,master]=await Promise.all([
    getJson(path),getJson("gamemaster.json")]);
   const recommended=fromData(rankings,master,league,id);
   if(!recommended)return null;
   const moves=[recommended.fast,...(recommended.charged||[])].filter(Boolean);
   if(moves.length<2||moves.some(m=>
      !["normal","elite","legacy"].includes(m.status)))return null;
   const legacy=moves.some(m=>m.status==="elite"||m.status==="legacy");
   // MT status is independent from the legacy flag: a legacy move is NOT
   // proof that an Elite MT is currently available for that move.
   const mt=moves.some(m=>m.status==="elite")?"elite":
    moves.every(m=>m.status==="normal")?"normal":"unknown";
   return {verified:true,legacy,mt,icon:legacy?"⚔️":"🗡️",
    title:legacy?"⚔️ Recomendação PvP contém golpe legado/Elite":
     "🗡️ Recomendação PvP sem golpes legados",
    source:mega?source+" · Mega Edition":source};
  }catch(_){return null;}
 }

 async function lookup(league,name){
  const cap=caps[league];if(!cap||!name)return null;
  try{
   const [ranking,master,moveData,translations]=await Promise.all([
    getJson("rankings/all/overall/rankings-"+cap+".json").catch(()=>null),
    getJson("gamemaster.json"),
    getJson(localeBase+"moves.json"),
    getJson(localeBase+"translations/pt-br/moves.json")]);
   const recommended=fromData(ranking,master,league,name);
   // Fallback is a catalogue of learnable attacks; never label it as
   // competitive PvP advice when the species is missing from ranking.
   const data=recommended||fromAvailable(master,league,name);
   return localizedMoves(data,moveData,translations);
  }catch(_){return null;}
 }


 /* LT285: move-specific TM advice is read-only and source-scoped.
  * PvPoke gamemaster membership verifies only a historical move category;
  * it does NOT establish today's in-game TM pool or guaranteed acquisition.
  * "legacy" must NEVER be treated as confirmed Elite availability.
  * A fallback list of learnable attacks is not a recommendation.
  */
 function tmPlan(data){
  if(!data||data.availableOnly===true||data.recommended===false||
     !data.fast||!Array.isArray(data.charged)||!data.charged.length)return null;
  const inputs=[{slot:"Ágil",fast:true,move:data.fast},
   ...data.charged.slice(0,2).map((move,i)=>({
    slot:"C"+(i+1),fast:false,move
   }))];
  if(inputs.length<2||inputs.some(x=>typeof x.move?.id!=="string"||
      !/^[A-Z][A-Z0-9_]{1,90}$/.test(x.move.id)))return null;
  const allowed=new Set(["normal","elite","legacy","unknown"]);
  const rows=inputs.map(({slot,fast,move})=>{
   const status=allowed.has(move.status)?move.status:"unknown";
   const category=fast?"Ágil":"Carregada";
   const guidance=status==="normal"?"MT "+category+" comum · sem garantia":
    status==="elite"?"MT "+category+" de Elite indicada na fonte":
    status==="legacy"?"Legado · obtenção por MT Elite não confirmada":
    "Obtenção não confirmada";
   const named=move.localeVerified===true&&typeof move.name==="string"&&
    move.name.trim().length>1&&move.name.trim().length<=120;
   return {slot,moveId:move.id,
    name:named?move.name.trim():"Nome PT-BR não confirmado",
    status,guidance};
  });
  const hasElite=rows.some(x=>x.status==="elite");
  const hasLegacy=rows.some(x=>x.status==="legacy");
  const hasUnknown=rows.some(x=>x.status==="unknown");
  const summary=hasUnknown?"MT: dados incompletos":
   hasLegacy?"MT: legado · confira disponibilidade":
   hasElite?"MT: Elite indicada":
   "MT: golpes comuns na fonte";
  return {verified:true,source:String(data.source||source),rows,
   hasElite,hasLegacy,hasUnknown,summary,
   caution:"A fonte de referência não confirma eventos nem a disponibilidade atual no jogo. MTs comuns sorteiam golpes; a MT Elite indicada não garante que o golpe ainda esteja disponível. Legado não é sinônimo de MT Elite."};
 }

 const rankingCategories=Object.freeze({overall:"Geral",leads:"Abertura",
  closers:"Finalização",switches:"Troca",chargers:"Carregadores"});
 // LT240: explicit, read-only ranking categories pinned to the same source.
 // No automatic remote fetch on search/results; only a user tap in the explorer.
 async function categoryRows(league,category){
  const cap=caps[league];
  if(!cap||!Object.prototype.hasOwnProperty.call(rankingCategories,category))return null;
  try{
   const items=await getJson("rankings/all/"+category+"/rankings-"+cap+".json");
   if(!Array.isArray(items)||items.length<10)return null;
   return {category,categoryName:rankingCategories[category],source,commit,league,
    rows:items.slice(0,500).map((x,index)=>({
      id:String(x?.speciesId||"").slice(0,100),
      name:String(x?.speciesName||"").slice(0,100),
      rank:index+1,
      score:Number.isFinite(x?.score)?Math.max(0,Math.min(100,x.score)):null,
      moveset:Array.isArray(x?.moveset)?x.moveset.filter(m=>typeof m==="string").slice(0,3):[],
      matchups:Array.isArray(x?.matchups)?x.matchups.slice(0,5).filter(m=>m?.opponent).map(m=>({
       name:String(m.opponent).replace(/_/g," ").slice(0,90),rating:Number.isFinite(m.rating)?m.rating:null
      })):[],
      counters:Array.isArray(x?.counters)?x.counters.slice(0,5).filter(m=>m?.opponent).map(m=>({
       name:String(m.opponent).replace(/_/g," ").slice(0,90),rating:Number.isFinite(m.rating)?m.rating:null
      })):[]
    })).filter(x=>x.id&&x.name)};
  }catch(_){return null;}
 }

 return Object.freeze({lookup,lookupMega,getStatus,tmPlan,megaSpeciesId,fromData,fromAvailable,localizedMoves,moveStats,speciesId,source,commit,categoryRows,rankingCategories});
});

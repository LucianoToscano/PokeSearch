/* LT231 PvP moves: read-only, on-demand, source-pinned PvPoke public snapshots.
   Rankings supply the recommended move IDs; gamemaster supplies Elite/Legacy
   flags. No unverified guess, PoGoCoordinates call, cookie, token, or backend.
   Network is used ONLY when user taps ⚔️ and never retries an HTTP failure. */
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
 const caps={gl:"1500",ul:"2500",ml:"10000"};
 const cache=new Map();
 const speciesId=value=>String(value||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .toLowerCase().replace(/[’']/g,"").replace(/[().]/g," ")
  .trim().replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
 const displayId=value=>String(value||"").replace(/_/g," ").replace(/\b[a-z]/g,x=>x.toUpperCase());
 async function getJson(path){
  if(cache.has(path))return cache.get(path);
  const work=(async()=>{
   const ctl=typeof AbortController!=="undefined"?new AbortController():null;
   const handle=ctl&&setTimeout(()=>ctl.abort(),12000);
   try{
    const response=await fetch(base+path,{method:"GET",credentials:"omit",cache:"force-cache",
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
  return work;
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
    ordinary.has(moveId)?"normal":"unknown"
  }));
  if(moves.length<2)return null;
  return {source,commit,league,species:pokemon.speciesName||ranking.speciesName||name,
   fast:moves[0],charged:moves.slice(1)};
 }
 async function lookup(league,name){
  const cap=caps[league];if(!cap||!name)return null;
  try{
   const [ranking,master]=await Promise.all([
    getJson("rankings/all/overall/rankings-"+cap+".json"),getJson("gamemaster.json")]);
   return fromData(ranking,master,league,name);
  }catch(_){return null;}
 }
 return Object.freeze({lookup,fromData,speciesId,source,commit});
});

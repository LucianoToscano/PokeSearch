/* LT253 — shared, bounded, read-only PvP family, card cache and privacy-first sharing.
 * Loaded in both independent detail WebViews; no backend, tokens, storage, GPS
 * read, or unverified Pokémon/IV/overall claims. */
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.PokeSearchLT253=api;
})(typeof window!=="undefined"?window:null,function(){
 "use strict";
 const LEAGUES=["gl","ul","ml"],MAX_ENTRIES=32;
 const memory=new Map();
 const str=(v,max=90)=>String(v??"").trim().slice(0,max);
 const rank=v=>Number.isInteger(Number(v))&&Number(v)>=1&&Number(v)<=4096?
  Number(v):null;
 const overall=v=>Number.isInteger(Number(v))&&Number(v)>=1&&Number(v)<=10000?
  Number(v):null;
 const isMega=v=>v?.megaProjection===true||/^mega(?:\s|\b)/i.test(str(v?.name))||
  /\(mega(?: [XY])?\)/i.test(str(v?.name));
 const normalized=s=>str(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 const safe=s=>str(s,200).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 function family(payload,league){
  const source=(payload?.leagues||[]).find(x=>x?.league===league);
  if(!source||!LEAGUES.includes(league))return null;
  const own=source.own?[{...source.own,name:str(payload.name),origin:"atual"}]:[];
  const evol=Array.isArray(source.evolutions)?source.evolutions.slice(0,24):[];
  const megas=Array.isArray(source.megas)?source.megas.slice(0,20):[];
  const seen=new Set(),items=[];
  for(const record of [...own,...evol,...megas]){
   const name=str(record?.name),cls=rank(record?.rank),mega=isMega(record);
   const key=normalized(name)+(mega?"|mega":"|normal");
   if(!name||!cls||record?.eligible===false||seen.has(key))continue;
   seen.add(key);
   const reference=record?.referenceOnly===true,rawOverall=overall(record?.overallRank);
   const efficiency=Number(String(record?.statProductPct??"").replace(",","."));
   items.push({name,league,rank:cls,overallRank:mega||reference?null:rawOverall,
    efficiency:Number.isFinite(efficiency)&&efficiency>=0&&efficiency<=100?efficiency:null,
    cp:Number.isFinite(Number(record?.cp))?Number(record.cp):null,
    level:Number.isFinite(Number(record?.level))?Number(record.level):null,
    mega,reference,origin:record?.origin||"evolução"});
  }
  const normals=items.filter(x=>!x.mega&&!x.reference);
  const projections=items.filter(x=>x.mega);
  const order=(a,b)=>(a.overallRank??Infinity)-(b.overallRank??Infinity)||
   a.rank-b.rank||a.name.localeCompare(b.name);
  const normalByRg=normals.filter(x=>x.overallRank!==null).sort(order)[0]||null;
  const normalByIv=[...normals].sort((a,b)=>a.rank-b.rank||a.name.localeCompare(b.name))[0]||null;
  const megaByIv=[...projections].sort((a,b)=>a.rank-b.rank||a.name.localeCompare(b.name))[0]||null;
  return {league,items,normalByRg,normalByIv,megaByIv,
   /* A Rank Classe #1 Mega projection is NOT a Go Battle League eligibility claim. */
   hasReferenceOnly:items.some(x=>x.reference)};
 }
 function fingerprint(card,now=Date.now()){
  if(!card||!Number.isFinite(now))return "";
  const expiry=Number(card.expiresAtMs);
  if(!Number.isSafeInteger(expiry)||expiry<=now||expiry-now>24*3600*1000)return "";
  const fields=["name","number","cp","level","iv","location","form","gender","size","costume","costume_id"];
  if(!fields.slice(0,5).every(k=>str(card[k]).length>0))return "";
  return fields.map(k=>str(card[k],128)).concat([
   String(card.shiny===true),String(expiry)
  ]).join("|");
 }
 function clean(now=Date.now()){
  for(const [key,entry] of memory)if(entry.expiry<=now)memory.delete(key);
  while(memory.size>MAX_ENTRIES)memory.delete(memory.keys().next().value);
 }
 function remember(card,details,now=Date.now()){
  const key=fingerprint(card,now);
  if(!key||!details||!Array.isArray(details.leagues)||details.leagues.length!==3)return false;
  if(!LEAGUES.every(league=>details.leagues.some(x=>x?.league===league)))return false;
  clean(now);memory.delete(key);
  // Snapshot is bounded and contains only public PvP rankings; no coords or auth.
  const data=JSON.stringify(details);
  if(data.length>160000)return false;
  memory.set(key,{expiry:Number(card.expiresAtMs),data});
  clean(now);return true;
 }
 function restore(card,now=Date.now()){
  clean(now);const key=fingerprint(card,now),entry=key&&memory.get(key);
  if(!entry)return null;
  try{return JSON.parse(entry.data);}catch(_){memory.delete(key);return null;}
 }
 function shareText(card,payload,league){
  const name=str(card?.name)||str(payload?.name)||"Pokémon";
  const iv=str(card?.iv,15);
  const validIv=/^(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])\/(?:[0-9]|1[0-5])$/.test(iv);
  const info=family(payload,league),ls={gl:"Grande Liga",ul:"Ultra Liga",ml:"Liga Mestra"};
  const lines=["🎮 PokeSearch · Comparação PvP",name+" · "+(ls[league]||"Liga não verificada")];
  if(validIv)lines.push("IV A/D/S: "+iv);
  if(Number.isFinite(Number(card?.cp)))lines.push("PC "+Number(card.cp));
  if(info?.normalByRg)lines.push("Melhor RG conhecido: "+info.normalByRg.name+
   " · RG #"+info.normalByRg.overallRank+" · IV #"+info.normalByRg.rank);
  if(info?.normalByIv)lines.push("Melhor IV Classe da família: "+info.normalByIv.name+
   " · #"+info.normalByIv.rank);
  if(info?.megaByIv)lines.push("Mega (projeção): "+info.megaByIv.name+
   " · IV #"+info.megaByIv.rank);
  const moves=str(card?.moves,100);
  if(moves)lines.push("Golpes capturados (não recomendação): "+moves.replace(/[\r\n]/g," "));
  lines.push("RG e IV Classe são métricas diferentes. Mega é projeção, não permissão de GBL.");
  lines.push("Sem coordenadas, localização ou dados da conta.");
  return lines.join("\n").slice(0,1500);
 }
 return Object.freeze({family,fingerprint,remember,restore,shareText,safe,rank,overall,MAX_ENTRIES});
});

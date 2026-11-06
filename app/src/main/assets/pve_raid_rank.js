/* LT259: read-only PvE raid utility by ATTACK TYPE, never PvP IV rank.
 * Reference source: S-Tier-Devs/pogo-db-api (MIT), generated static JSON.
 * Source was last pushed Aug 2026: display as reference, not live boss meta.
 * Fail closed for missing/ambiguous form, no unverified rankings or guesses.
 * No capture-coordinate lookup, no trainer identity, no account credentials.
 */
(function(root,factory){"use strict";
 const api=factory();if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.PokeSearchRaidRank=api;
})(typeof window!=="undefined"?window:null,function(){
 "use strict";
 const BASE="https://s-tier-devs.github.io/pogo-db-api/api/";
 const SOURCE="S-Tier-Devs/pogo-db-api · dados de referência (ago/2026)";
 const TYPES=Object.freeze({bug:"Inseto",dark:"Sombrio",dragon:"Dragão",
  electric:"Elétrico",fairy:"Fada",fighting:"Lutador",fire:"Fogo",
  flying:"Voador",ghost:"Fantasma",grass:"Planta",ground:"Terrestre",
  ice:"Gelo",normal:"Normal",poison:"Venenoso",psychic:"Psíquico",
  rock:"Pedra",steel:"Aço",water:"Água"});
 const types=Object.freeze(Object.keys(TYPES));
 const shared=new Map();
 const normalize=v=>String(v||"").normalize("NFD")
  .replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[’']/g,"")
  .replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
 const dex=v=>{
  const n=Number(String(v??"").replace(/^#/,"").trim());
  return Number.isInteger(n)&&n>=1&&n<=2000?n:null;
 };
 const typeName=v=>{
  const id=String(v?.type||v||"").toLowerCase().replace(/^pokemon_type_/,"");
  return Object.prototype.hasOwnProperty.call(TYPES,id)?id:null;
 };
 const text=v=>String(v||"").slice(0,100);
 function candidate(name,variant="normal"){
  const value=text(name).trim();
  if(!value)return null;
  const isMega=/(?:\(mega(?: [xy])?\)|^mega\s)/i.test(value);
  const base=value.replace(/^Mega\s+/i,"").replace(/\s*\(Mega(?: [XY])?\)\s*$/i,"").trim();
  return {name:value,base,variant:isMega?"mega":variant};
 }
 function buildCandidates(card,related){
  const raw=text(card?.name),form=text(card?.form||""),
   shadow=card?.isShadow===true||card?.shadow===true;
  const current=candidate(raw,shadow?"shadow":"normal");
  if(!current)return [];
  // Cosmetic identities are not sufficient evidence that future evolutions
  // can be performed. Show the currently captured species only.
  const special=card?.isCostume===true||!!card?.costume_id||!!card?.costume||
   !!card?.costumeId||!!form&&!/^(normal|standard)$/i.test(form);
  const choices=[current],seen=new Set([normalize(current.name)+"|"+current.variant]);
  if(!special&&Array.isArray(related)){
   for(const label of related){
    const item=candidate(label,shadow?"shadow":"normal");
    if(!item)continue;
    const key=normalize(item.name)+"|"+item.variant;
    if(!seen.has(key)){seen.add(key);choices.push(item);}
    if(choices.length>=16)break;
   }
  }
  return choices;
 }
 async function getJson(path){
  if(shared.has(path))return shared.get(path);
  const promise=(async()=>{
   const signal=typeof AbortController==="function"?new AbortController():null;
   const timeout=signal?setTimeout(()=>signal.abort(),10000):null;
   try{
    const r=await fetch(BASE+path,{method:"GET",credentials:"omit",
     cache:"force-cache",...(signal?{signal:signal.signal}:{})});
    if(!r.ok)throw Error("HTTP "+r.status);
    const length=Number(r.headers?.get?.("content-length")||0);
    if(length>3e6)throw Error("arquivo excedeu limite de dados");
    const raw=await r.text();
    if(raw.length>3e6)throw Error("resposta excedeu limite de dados");
    return JSON.parse(raw);
   }finally{if(timeout)clearTimeout(timeout);}
  })();
  shared.set(path,promise);
  // Only retain valid replies; temporary outages should not poison cache.
  promise.catch(()=>{if(shared.get(path)===promise)shared.delete(path);});
  if(shared.size>64)shared.delete(shared.keys().next().value);
  return promise;
 }
 function nameMap(index){
  const list=Array.isArray(index)?index:Array.isArray(index?.pokemon)?index.pokemon:[];
  const byName=new Map();
  for(const p of list){
   const id=dex(p?.dexNr??p?.number??p?.dex??p?.id);
   if(!id)continue;
   const name=normalize(p?.name||p?.pokemonName);
   if(name&&!byName.has(name))byName.set(name,id);
  }
  return byName;
 }
 function exactRow(list,entry,dexNumber){
  const entries=Array.isArray(list?.rankings)?list.rankings:[];
  const target=normalize(entry.name),base=normalize(entry.base);
  const matching=[];
  for(let i=0;i<entries.length;i++){
   const r=entries[i];
   if(dex(r?.dexNr)!==dexNumber)continue;
   const variant=r?.variant||"normal";
   if(variant!==entry.variant)continue;
   const full=normalize(r.variantName||r.name);
   const pokemon=normalize(r.name),baseForm=normalize(r.formId||"");
   if(variant==="mega"){
    if(!full||!full.includes(base))continue;
    // Mega X/Y are distinct, never substitute X for Y.
    if(/mega x/.test(target)&&!/mega x/.test(full))continue;
    if(/mega y/.test(target)&&!/mega y/.test(full))continue;
    if(!/mega [xy]/.test(target)&&/mega [xy]/.test(full))continue;
   }else if(pokemon!==base&&baseForm!==normalize(entry.base.replace(/ /g,"_")))
    continue;
   if(!Number.isFinite(Number(r?.er))||Number(r.er)<=0||
      !Number.isFinite(Number(r.dps))||Number(r.dps)<=0)continue;
   matching.push({rank:i+1,score:Number(r.er),dps:Number(r.dps),
    tdo:Number(r.tdo)||0,fast:text(r.quickMove),charged:text(r.cinematicMove),
    elite:r.isElite===true,variant,form:text(r.variantName||r.name)});
  }
  return matching.length===1?matching[0]:null;
 }
 function grade(rank){
  return rank<=20?"Destaque":rank<=50?"Bom atacante":
   rank<=100?"Situacional":"Fora do Top 100";
 }
 async function assess(card,related=[]){
  const number=dex(card?.number||card?.dex||card?.pokemon_id);
  const requested=buildCandidates(card,related);
  if(!number||!requested.length)return {verified:false,reason:"Pokémon sem identidade confirmada"};
  try{
   const index=await getJson("pokemon/index.json");
   const names=nameMap(index);
   const current=normalize(requested[0].base);
   if(names.get(current)!==number)
    return {verified:false,reason:"Espécie ou forma não corresponde ao catálogo"};
   const targets=requested.map(item=>({
    ...item,number:item===requested[0]?number:names.get(normalize(item.base))
   })).filter(x=>dex(x.number)).slice(0,12);
   const unique=[...new Set(targets.map(x=>x.number))];
   const documents=new Map(await Promise.all(unique.map(async id=>{
    try{return [id,await getJson("pokemon/"+id+".json")];}
    catch(_){return [id,null];}
   })));
   const identified=targets.map(x=>{
    const doc=documents.get(x.number);
    const available=Array.isArray(doc?.forms)?[doc,...doc.forms]:[doc];
    const exact=available.filter(p=>p&&(
      normalize(p.name)===normalize(x.base)||normalize(p.formId)===normalize(x.base)
    ));
    if(exact.length!==1)return null;
    const p=exact[0],typeIds=[typeName(p.primaryType),typeName(p.secondaryType)].filter(Boolean);
    return {entry:x,typeIds:[...new Set(typeIds)]};
   }).filter(Boolean);
   const allTypes=[...new Set(identified.flatMap(x=>x.typeIds))];
   const ranked=new Map(await Promise.all(allTypes.map(async t=>{
    try{return [t,await getJson("rankings/"+t+".json")];}
    catch(_){return [t,null];}
   })));
   const results=[];
   for(const unit of identified){
    for(const type of unit.typeIds){
     const source=ranked.get(type);
     if(!source||typeName(source.type)!==type)continue;
     const row=exactRow(source,unit.entry,unit.entry.number);
     if(row)results.push({...row,name:unit.entry.name,type,
      typePt:TYPES[type],number:unit.entry.number,
      projected:normalize(unit.entry.name)!==normalize(requested[0].name)});
    }
   }
   results.sort((a,b)=>a.rank-b.rank||b.score-a.score||a.name.localeCompare(b.name));
   if(!results.length)return {verified:false,reason:"Ranking de raides indisponível para esta forma"};
   const best=results[0];
   return {verified:true,best,rows:results.slice(0,24),
    grade:grade(best.rank),source:SOURCE,ivIndependent:true,
    note:"Rank por tipo baseado em ER, nível 50 e IV 15/15/15 de referência; não é rank dos IVs capturados nem ranking de counter para um chefe."};
  }catch(_){return {verified:false,reason:"Fonte de Raides indisponível (sem rank estimado)"};}
 }
 return Object.freeze({assess,buildCandidates,exactRow,nameMap,grade,types,
  SOURCE,normalize,typeName});
});

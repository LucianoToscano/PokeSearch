/* LT86 QA: same-origin WebView API session. API defaults ON only when no preference was saved.
 * Never returns JWT, reveal_code, raw server JSON or account identifiers to Android.
 * No JavaScriptInterface on the remote website. Native polls sanitized output.
 */
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.PokeSearchAndroidApiFactory=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const ORIGIN="https://pogocoordinates.com";
 const ERROR=/^[a-z-]{1,50}$/;
 function fail(reason){return {ok:false,reason:ERROR.test(reason)?reason:"api-unavailable"};}
 function createSession(deps){
  const d=deps||{};
  if(typeof d.siteOrigin!=="function"||!d.transport||!d.catalog)
   throw Error("Missing session dependencies");
  let destroyed=false,queue=new Map(),maxTicket=0,activeSearchId=-1,activeSearchTicket=0;
  const originOk=()=>{try{
   const u=new URL(d.siteOrigin());
   return u.origin===ORIGIN&&!u.username&&!u.password;
  }catch(_){return false;}};
  function push(ticket,output){
   if(!Number.isSafeInteger(ticket)||ticket<=0||destroyed)return;
   queue.set(ticket,output);
   while(queue.size>5)queue.delete(queue.keys().next().value);
  }
  function take(ticket){
   if(!Number.isSafeInteger(ticket)||ticket<=0||!originOk()||destroyed)
    return fail("invalid-origin");
   if(!queue.has(ticket))return {pending:true};
   const item=queue.get(ticket);queue.delete(ticket);return item;
  }
  function startSuggestions(ticket,query){
   if(!Number.isSafeInteger(ticket)||ticket<=maxTicket||!originOk()||destroyed)
    return fail("invalid-request");
   if(typeof query!=="string"||query.length>65||/[\u0000-\u001f\u007f]/.test(query))
    return fail("invalid-request");
   maxTicket=ticket;
   push(ticket,{pending:true});
   Promise.resolve().then(async()=>{
    const data=await d.catalog.getCatalog();
    if(!data.ok)return fail(data.reason);
    const wanted=query.trim().toLocaleLowerCase();
    const dex=/^#?0*(\d{1,4})$/.exec(wanted);
    const options=[],seen=new Set();
    // Base sprites are only used for verified default, uncostumed species.
    // Forms and costumes remain without a misleading substitute image.
    // Official catalog often names the default as SPECIES_NORMAL with a
    // nonzero form_id. Its base sprite is still the exact verified species.
    // Special forms and costumes remain pictureless without a verified URL.
    const defaults=new Set(data.catalogSpeciesForms.filter(x=>{
      const species=String(x.species_name||"").replace(/[^a-z0-9]/ig,"").toUpperCase();
      const form=String(x.form_name||"").replace(/[^a-z0-9]/ig,"").toUpperCase();
      const baseForm=!form||form===species||form==="NORMAL"||form===species+"NORMAL";
      return Number.isInteger(x.pokemon_id)&&x.pokemon_id>0&&
        (x.costume_id===undefined||x.costume_id===null||x.costume_id===0)&&baseForm;
    }).map(x=>x.pokemon_id));
    function add(label,id,base){
     if(!label||label.length>90||seen.has(label.toLocaleLowerCase()))return;
     if(wanted&&!(label.toLocaleLowerCase().includes(wanted)||
       (dex&&String(id)===String(Number(dex[1])))))return;
     seen.add(label.toLocaleLowerCase());
     const image=base&&defaults.has(id)?
       "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+id+".png":"";
     options.push({label,dex:String(id),image});
    }
    for(const x of data.catalogSpeciesForms){
     if(options.length>=40)break;
     add(x.species_name,x.pokemon_id,true);
     if(x.costume_id===undefined&&x.form_id!==null&&x.form_name&&
        x.form_name!==x.species_name){
       // The catalog's SPECIES_NORMAL entry is the verified base species,
       // not a costume. All other special forms remain placeholder-only.
       const species=String(x.species_name).replace(/[^a-z0-9]/ig,"").toUpperCase();
       const form=String(x.form_name).replace(/[^a-z0-9]/ig,"").toUpperCase();
       add(x.form_name,x.pokemon_id,form===species+"NORMAL");
     }
    }
    return {ok:true,state:options.length?"ready":"explicit-empty",
     query,options,empty:options.length===0,selectionVerified:false,
     source:"authorized-api-catalog"};
   }).then(result=>push(ticket,result)).catch(()=>push(ticket,fail("catalog-unavailable")));
   return {ok:true,pending:true};
  }
  function startForms(ticket,query){
   if(!Number.isSafeInteger(ticket)||ticket<=maxTicket||!originOk()||destroyed)
    return fail("invalid-request");
   if(typeof query!=="string"||query.length>70||/[\u0000-\u001f\u007f]/.test(query))
    return fail("invalid-request");
   maxTicket=ticket;push(ticket,{pending:true});
   Promise.resolve().then(async()=>{
    const data=await d.catalog.getCatalog();
    if(!data.ok)return fail(data.reason);
    const wanted=query.trim().toLocaleLowerCase();
    return {ok:true,key:"form",query,source:"authorized-api-catalog",
     options:data.forms.filter(v=>!wanted||v.toLocaleLowerCase().includes(wanted)).slice(0,500)};
   }).then(result=>push(ticket,result)).catch(()=>push(ticket,fail("catalog-unavailable")));
   return {ok:true,pending:true};
  }
  function startSearch(ticket,config){
   if(!Number.isSafeInteger(ticket)||ticket<=maxTicket||!originOk()||destroyed)
    return fail("invalid-request");
   maxTicket=ticket;activeSearchId=-1;activeSearchTicket=ticket;
   const c=config&&typeof config==="object"&&!Array.isArray(config)?config:null;
   if(!c)return fail("invalid-request");
   push(ticket,{pending:true});
   Promise.resolve().then(async()=>{
    let filters={...c};
    const needsCatalog=["pokemonSelections","formSelections","speciesFormSelections",
     "blacklistForms","blacklistSpeciesForms"].some(k=>Array.isArray(filters[k])&&filters[k].length>0);
    if(needsCatalog){
     const data=await d.catalog.getCatalog();
     if(!data.ok)return fail(data.reason);
     filters.catalogForms=data.forms;
     filters.catalogSpeciesForms=data.catalogSpeciesForms;
    }
    // Catalog promises can resolve out of order. Do not even send an older
    // request after a newer Search was requested.
    if(destroyed||activeSearchTicket!==ticket)return fail("superseded-search");
    const r=await d.transport.search(filters);
    if(destroyed||activeSearchTicket!==ticket)return fail("superseded-search");
    if(!r.ok){
     if(r.reason==="rate-limited"&&typeof d.transport.backoffSeconds==="function"){
      // Report only the bounded provider wait, never JWT, headers or server body.
      const wait=d.transport.backoffSeconds("search");
      if(Number.isSafeInteger(wait)&&wait>=1&&wait<=86400)
       return {ok:false,reason:"rate-limited",retryAfterSeconds:wait};
     }
     return fail(r.reason);
    }
    const pvp=filters.mode==="gl"||filters.mode==="ul";
    if(pvp&&!r.pvpVerified)return fail("pvp-unverified");
    activeSearchId=r.searchId;
    return {
     ok:true,cards:r.cards,found:r.found,siteCount:r.siteCount,
     rejected:r.rejected,expired:r.expired,searchId:r.searchId,
     criteriaConfirmed:true,resultChanged:true,leagueConfirmed:pvp,
     // The transport accepted the exact signed-in HTTP search payload,
     // not a fixture or DOM-derived visual-only result.
     requestValidated:r.requestValidated===true,
     explicitEmpty:r.cards.length===0,
     requestedShiny:filters.shiny===true,
     apiReturnedShiny:r.cards.length>0&&r.cards.every(card=>card.shiny===true),
     apiFilterAccepted:r.requestValidated===true&&
       (!filters.shiny||r.cards.every(card=>card.shiny===true)),
     apiPlanCap:r.serverCap,apiDisplayCap:r.displayCap,
     confirmationSource:"api-http-200",source:"authorized-api-qa"
    };
   }).then(r=>push(ticket,r)).catch(()=>push(ticket,fail("api-unavailable")));
   return {ok:true,pending:true};
  }
  function startAccountStatus(ticket){
   if(!Number.isSafeInteger(ticket)||ticket<=maxTicket||!originOk()||destroyed)
    return fail("invalid-request");
   maxTicket=ticket;push(ticket,{pending:true});
   Promise.resolve().then(()=>d.transport.accountStatus()).then(r=>push(ticket,r))
    .catch(()=>push(ticket,fail("account-unavailable")));
   return {ok:true,pending:true};
  }
  function startReveal(ticket,selection){
   if(!Number.isSafeInteger(ticket)||ticket<=maxTicket||!originOk()||destroyed)
    return fail("invalid-request");
   maxTicket=ticket;
   if(!selection||selection.searchId!==activeSearchId)
    return fail("stale-or-ambiguous-selection");
   push(ticket,{pending:true});
   Promise.resolve().then(()=>d.transport.reveal(selection))
    .then(r=>push(ticket,r.ok?{
     ok:true,coords:r.coords,latitude:r.latitude,longitude:r.longitude,
     ...(r.quota?{quota:r.quota}:{}),source:"authorized-api-qa"
    }:fail(r.reason))).catch(()=>push(ticket,fail("api-unavailable")));
   return {ok:true,pending:true};
  }
  function dispose(){
   if(destroyed)return;destroyed=true;queue.clear();
   activeSearchTicket=0;activeSearchId=-1;
   d.transport.dispose();d.catalog.dispose();
  }
  return Object.freeze({startSearch,startSuggestions,startForms,startAccountStatus,startReveal,take,dispose});
 }
 function createBrowserSession(){
  if(typeof window==="undefined"||window.location.origin!==ORIGIN||
   !window.PokeSearchBrowserTransport||!window.PokeSearchCatalogCache)
   return null;
  const transport=window.PokeSearchBrowserTransport.createBrowserClient();
  if(!transport)return null;
  const catalog=window.PokeSearchCatalogCache.createClient({
   fetchImpl:window.fetch.bind(window),siteOrigin:()=>window.location.origin,
   now:()=>Date.now()
  });
  return createSession({siteOrigin:()=>window.location.origin,transport,catalog});
 }
 return Object.freeze({createSession,createBrowserSession});
});

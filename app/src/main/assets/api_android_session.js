/* LT77 QA R4: same-origin WebView API session. Opt-in only, OFF by default.
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
  let destroyed=false,queue=new Map(),maxTicket=0,activeSearchId=-1;
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
  function startSearch(ticket,config){
   if(!Number.isSafeInteger(ticket)||ticket<=maxTicket||!originOk()||destroyed)
    return fail("invalid-request");
   maxTicket=ticket;activeSearchId=-1;
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
    const r=await d.transport.search(filters);
    if(!r.ok)return fail(r.reason);
    const pvp=filters.mode==="gl"||filters.mode==="ul";
    if(pvp&&!r.pvpVerified)return fail("pvp-unverified");
    activeSearchId=r.searchId;
    return {
     ok:true,cards:r.cards,found:r.found,siteCount:r.siteCount,
     rejected:r.rejected,expired:r.expired,searchId:r.searchId,
     criteriaConfirmed:true,resultChanged:true,leagueConfirmed:pvp,
     explicitEmpty:r.cards.length===0,siteShiny:filters.shiny===true,
     confirmationSource:"api-http-200",source:"authorized-api-qa"
    };
   }).then(r=>push(ticket,r)).catch(()=>push(ticket,fail("api-unavailable")));
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
     source:"authorized-api-qa"
    }:fail(r.reason))).catch(()=>push(ticket,fail("api-unavailable")));
   return {ok:true,pending:true};
  }
  function dispose(){
   if(destroyed)return;destroyed=true;queue.clear();
   d.transport.dispose();d.catalog.dispose();
  }
  return Object.freeze({startSearch,startReveal,take,dispose});
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

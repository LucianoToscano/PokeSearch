/* PokeSearch LT77 — experimental, opt-in browser-side API transport.
 * Not imported by released Android collector; no automatic requests.
 * Authorized user session only; never expose/persist/log tokens or reveal codes.
 */
(function(root,factory){
 "use strict";
 const moduleApi=factory();
 if(typeof module==="object"&&module.exports)module.exports=moduleApi;
 if(root)root.PokeSearchBrowserTransport=moduleApi;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const SITE="pogocoordinates.com";
 const API="https://coordinates-api.pokemongopro.com";
 const SEARCH_URL=API+"/search";
 const MAX_RESPONSE_BYTES=1024*1024;
 const TOKEN_RE=/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
 const CODE_RE=/^[A-Za-z0-9_-]{12,2048}$/;
 function status(code){
  if(code===400||code===422)return "invalid-request";
  if(code===401)return "login-required";
  if(code===403)return "access-denied";
  if(code===404||code===410)return "expired-or-missing-spawn";
  if(code===429)return "rate-limited";
  if(code===503)return "service-unavailable";
  return "http-error";
 }
 function safeMethod(verb,url){
  if(verb==="POST")return url===SEARCH_URL;
  if(verb==="GET"){
   if(!url.startsWith(API+"/reveal/"))return false;
   return CODE_RE.test(url.slice((API+"/reveal/").length));
  }
  return false;
 }
 function createClient(deps){
  const d=deps||{};
  if(typeof d.fetchImpl!=="function"||!d.apiContract||!d.revealContract||
   typeof d.now!=="function"||typeof d.siteOrigin!=="function")
   throw new Error("Incomplete transport dependencies");
  let searchVersion=0;
  let reveals=new Map(); // current result set only; in-memory
  let disposed=false;
  const dateNow=()=>d.now();
  function originValid(){
   try{
    const u=new URL(d.siteOrigin());
    return u.origin==="https://"+SITE&&u.username===""&&u.password==="";
   }catch(_){return false;}
  }
  function fail(code){return {ok:false,reason:code};}
  async function httpFailure(response){
   if(response.status!==403||typeof response.text!=="function")
    return fail(status(response.status));
   // A controlled, short machine-readable error code is the ONLY field read.
   // Never relay server messages or entire response objects to the overlay.
   try{
    const length=response.headers&&response.headers.get?
     Number(response.headers.get("content-length")):0;
    if(!Number.isFinite(length)||length>4096)return fail("access-denied");
    const raw=await response.text();
    if(typeof raw!=="string"||raw.length>4096)return fail("access-denied");
    const body=JSON.parse(raw);
    const kind=body&&body.detail&&body.detail.error;
    if(kind==="trainer_not_linked")return fail("trainer-not-linked");
    if(kind==="shiny_account_unavailable")return fail("shiny-account-unavailable");
    if(kind==="vip_required")return fail("vip-required");
   }catch(_){}
   return fail("access-denied");
  }
  function jwt(){
   // Read only after origin verification, never stringify a JWT into a
   // result, error, log, Android bridge, persistent file or URL.
   try{
    const value=d.storage&&d.storage.getItem("jwt");
    if(typeof value!=="string"||value.length>8192||!TOKEN_RE.test(value))return null;
    return value;
   }catch(_){return null;}
  }
  async function request(method,url,data,withAuth,timeoutMs){
   if(!originValid()||disposed||!safeMethod(method,url))return fail("invalid-origin");
   let token=null;
   if(withAuth){
    token=jwt();
    if(!token)return fail("login-required");
   }
   const headers={Accept:"application/json"};
   if(method==="POST")headers["Content-Type"]="application/json";
   if(token!==null)headers.Authorization="Bearer "+token;
   let controller=null,timer=null;
   try{
    if(typeof AbortController==="function"){
     controller=new AbortController();
     timer=setTimeout(()=>controller.abort(),timeoutMs);
    }
    const response=await d.fetchImpl(url,{
     method,mode:"cors",credentials:"omit",redirect:"error",
     cache:"no-store",referrerPolicy:"no-referrer",headers,
     ...(method==="POST"?{body:JSON.stringify(data)}:{}),
     ...(controller?{signal:controller.signal}:{})
    });
    if(!response||!Number.isInteger(response.status))return fail("invalid-response");
    if(response.status!==200)return await httpFailure(response);
    const len=response.headers&&response.headers.get&&Number(response.headers.get("content-length"));
    if(Number.isFinite(len)&&len>MAX_RESPONSE_BYTES)return fail("response-too-large");
    if(typeof response.text!=="function")return fail("invalid-response");
    const bodyText=await response.text();
    if(typeof bodyText!=="string"||bodyText.length>MAX_RESPONSE_BYTES)return fail("response-too-large");
    let obj;
    try{obj=JSON.parse(bodyText);}catch(_){return fail("invalid-json");}
    return {ok:true,body:obj};
   }catch(e){
    // Do not leak exception messages (which may contain URLs or credentials).
    return fail(controller&&controller.signal.aborted?"timeout":"network-or-cors-error");
   }finally{
    if(timer!==null)clearTimeout(timer);
    token=null;
   }
  }
  async function search(config){
   if(disposed)return fail("disposed");
   if(!originValid())return fail("invalid-origin");
   searchVersion++;
   const generation=searchVersion;
   reveals.clear(); // old results must never reveal coordinates
   const proposed=d.apiContract.buildPayload(config);
   if(!proposed.ok)return fail("unsupported-filter");
   const result=await request("POST",SEARCH_URL,proposed.payload,true,10000);
   if(generation!==searchVersion||disposed)return fail("superseded-search");
   if(!result.ok)return result;
   const parsed=d.apiContract.normalizeResponse(result.body,{
    nowMs:dateNow(),shiny:config&&config.shiny===true
   });
   if(!parsed.ok)return fail("invalid-results");
   // Store only codes belonging to sanitized, live results.
   const all=result.body.results;
   for(const card of parsed.cards){
    const raw=all[card.sourceIndex];
    if(!raw||typeof raw!=="object")continue;
    const planned=d.revealContract.planForSpawn(raw,{nowMs:dateNow()});
    if(!planned.ok||!safeMethod(planned.method,planned.url))continue;
    const expiry=Date.parse(raw.despawn_at);
    reveals.set(card.sourceIndex,{
     code:raw.reveal_code,pokemonId:raw.pokemon_id,cp:raw.cp,expiry,
     searchVersion:generation
    });
   }
   // Sanitize output: not an attestation of actual applied search criteria.
   return {ok:true,searchId:generation,cards:parsed.cards,
    found:parsed.found,siteCount:parsed.siteCount,
    rejected:parsed.rejected,expired:parsed.expired,
    criteriaConfirmed:false,resultChanged:false,leagueConfirmed:false,
    source:"experimental-api",requiresIntegrationValidation:true};
  }
  async function reveal(requested){
   if(disposed)return fail("disposed");
   if(!originValid())return fail("invalid-origin");
   if(!requested||typeof requested!=="object")return fail("invalid-selection");
   const idx=requested.sourceIndex;
   const q=Number.isInteger(idx)?reveals.get(idx):null;
   if(!q||!Number.isInteger(requested.searchId)||
      q.searchVersion!==requested.searchId||
      q.searchVersion!==searchVersion||
      requested.pokemonId!==q.pokemonId||
      requested.cp!==q.cp)return fail("stale-or-ambiguous-selection");
   if(!(q.expiry>dateNow())){
    reveals.delete(idx);return fail("expired-spawn");
   }
   const code=q.code;
   if(!CODE_RE.test(code))return fail("invalid-reveal-code");
   const url=API+"/reveal/"+encodeURIComponent(code);
   // No Bearer for reveal. Its auth requirements remain unverified;
   // 401 or 403 must be respected, never bypassed.
   const result=await request("GET",url,null,false,6000);
   if(q.searchVersion!==searchVersion||disposed)return fail("superseded-search");
   if(!result.ok)return result;
   const parsed=d.revealContract.normalizeRevealResponse(result.body,
    {expectedPokemonId:q.pokemonId});
   if(!parsed.ok)return fail("coordinates-unverified");
   return {ok:true,latitude:parsed.latitude,longitude:parsed.longitude,
    coords:parsed.coords,source:"experimental-api-unverified"};
  }
  function dispose(){
   disposed=true;searchVersion++;reveals.clear();
  }
  return Object.freeze({search,reveal,dispose});
 }
 function createBrowserClient(){
  // For future injection into official site WebView only.
  if(typeof window==="undefined"||!window.PokeSearchApiContract||
   !window.PokeSearchRevealContract)return null;
  return createClient({
   fetchImpl:window.fetch.bind(window),storage:window.localStorage,
   siteOrigin:()=>window.location.origin,
   now:()=>Date.now(),
   apiContract:window.PokeSearchApiContract,
   revealContract:window.PokeSearchRevealContract
  });
 }
 return Object.freeze({createClient,createBrowserClient});
});

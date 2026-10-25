/* LT77 — official reference catalogs, opt-in only.
 * No automatic network, credential access, persistent storage, or Android bridge.
 */
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.PokeSearchCatalogCache=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const ORIGIN="https://pogocoordinates.com";
 const API="https://coordinates-api.pokemongopro.com";
 const MAX_BYTES=512*1024;
 const TTL_MS=300000;
 function fail(reason){return {ok:false,reason};}
 function clean(v,n){return typeof v==="string"&&v.length<=n&&
  !/[\u0000-\u001f\u007f]/.test(v)?v.trim():null;}
 function copy(result){return {ok:true,forms:result.forms.slice(),
  catalogSpeciesForms:result.catalogSpeciesForms.map(x=>({...x})),
  expiresAtMs:result.expiresAtMs,source:"official-catalog-cache"};}
 function validateForms(value){
  if(!Array.isArray(value)||value.length>1000)return null;
  const forms=[],seen=new Set();
  for(const v of value){
   const name=clean(v,100);
   if(name===null||!name)return null;
   if(!seen.has(name)){seen.add(name);forms.push(name);}
  }
  return forms;
 }
 function validateSpecies(value){
  if(!Array.isArray(value)||value.length>5000)return null;
  const result=[];
  for(const x of value){
   if(!x||typeof x!=="object"||Array.isArray(x)||
    !Number.isInteger(x.pokemon_id)||x.pokemon_id<1||x.pokemon_id>10000||
    !(x.form_id===null||x.form_id===undefined||
     (Number.isInteger(x.form_id)&&x.form_id>=0&&x.form_id<=100000)))return null;
   const species=clean(x.species_name,100);
   const name=x.form_name===null||x.form_name===undefined?"":clean(x.form_name,100);
   if(!species||name===null)return null;
   const item={pokemon_id:x.pokemon_id,form_id:x.form_id??null,
    species_name:species,form_name:name};
   if(x.costume_id!==null&&x.costume_id!==undefined){
    if(!Number.isInteger(x.costume_id)||x.costume_id<0)return null;
    item.costume_id=x.costume_id;
   }
   result.push(item);
  }
  return result;
 }
 function createClient(deps){
  const d=deps||{};
  if(typeof d.fetchImpl!=="function"||typeof d.siteOrigin!=="function"||
   typeof d.now!=="function")throw Error("Incomplete catalog dependencies");
  let cached=null,inFlight=null,generation=0,disposed=false;
  function officialOrigin(){
   try{const u=new URL(d.siteOrigin());
    return u.origin===ORIGIN&&u.username===""&&u.password==="";
   }catch(_){return false;}
  }
  async function getJson(path){
   let timer=null,controller=null;
   try{
    if(typeof AbortController==="function"){
     controller=new AbortController();
     timer=setTimeout(()=>controller.abort(),10000);
    }
    const response=await d.fetchImpl(API+path,{
     method:"GET",mode:"cors",credentials:"omit",
     redirect:"error",cache:"no-store",referrerPolicy:"no-referrer",
     headers:{Accept:"application/json"},
     ...(controller?{signal:controller.signal}:{})
    });
    if(!response||response.status!==200||typeof response.text!=="function")
     return fail(response&&response.status===429?"rate-limited":"catalog-unavailable");
    const length=response.headers&&response.headers.get?
     Number(response.headers.get("content-length")):0;
    if(Number.isFinite(length)&&length>MAX_BYTES)return fail("catalog-too-large");
    const raw=await response.text();
    if(typeof raw!=="string"||raw.length>MAX_BYTES)return fail("catalog-too-large");
    try{return {ok:true,body:JSON.parse(raw)};}
    catch(_){return fail("catalog-invalid-json");}
   }catch(_){return fail(controller&&controller.signal.aborted?"timeout":"catalog-network-error");}
   finally{if(timer!==null)clearTimeout(timer);}
  }
  async function getCatalog(){
   if(disposed)return fail("disposed");
   if(!officialOrigin())return fail("invalid-origin");
   if(cached&&d.now()<cached.expiresAtMs)return copy(cached);
   if(inFlight)return inFlight;
   const ticket=++generation;
   inFlight=(async()=>{
    const [formsResponse,speciesResponse]=await Promise.all([
     getJson("/forms"),getJson("/pokemon/catalog?costumes=true")
    ]);
    if(disposed||ticket!==generation)return fail("superseded");
    if(!formsResponse.ok)return fail(formsResponse.reason);
    if(!speciesResponse.ok)return fail(speciesResponse.reason);
    const forms=validateForms(formsResponse.body);
    const catalogSpeciesForms=validateSpecies(speciesResponse.body);
    if(!forms||!catalogSpeciesForms)return fail("invalid-catalog");
    cached={forms,catalogSpeciesForms,expiresAtMs:d.now()+TTL_MS};
    return copy(cached);
   })();
   try{return await inFlight;}finally{inFlight=null;}
  }
  function dispose(){disposed=true;generation++;cached=null;inFlight=null;}
  return Object.freeze({getCatalog,dispose});
 }
 return Object.freeze({createClient,TTL_MS,validateForms,validateSpecies});
});

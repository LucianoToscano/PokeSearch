/* LT77 Stage 10 — experimental DOM/API choice, NOT loaded by Android release.
 * A real release must keep this opt-in OFF until device/site homologation.
 * No network, JWT, storage, cookies or Android bridges appear here.
 */
(function(root,factory){
 "use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.PokeSearchApiRouter=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const USE_AUTHORIZED_API=false;
 function officialOrigin(value){
  try{
   const url=new URL(value);
   return url.protocol==="https:"&&url.origin==="https://pogocoordinates.com"&&
    url.username===""&&url.password==="";
  }catch(_){return false;}
 }
 function createRouter(config){
  const c=config||{};
  if(typeof c.domSearch!=="function"||typeof c.domReveal!=="function"||
     typeof c.siteOrigin!=="function")throw new Error("Missing DOM fallback");
  const enabled=c.useAuthorizedApi===true&&c.homologated===true&&
   officialOrigin(c.siteOrigin())&&c.apiClient&&
   typeof c.apiClient.search==="function"&&typeof c.apiClient.reveal==="function";
  let disposed=false;
  const failure=reason=>({ok:false,reason});
  async function search(filters){
   if(disposed)return failure("disposed");
   // One source per search: never mix or merge unverified API/DOM rows.
   if(!enabled)return c.domSearch(filters);
   const result=await c.apiClient.search(filters);
   if(disposed)return failure("disposed");
   return result;
  }
  async function reveal(selection){
   if(disposed)return failure("disposed");
   if(!enabled)return c.domReveal(selection);
   const result=await c.apiClient.reveal(selection);
   if(disposed)return failure("disposed");
   return result;
  }
  function dispose(){
   if(disposed)return;
   disposed=true;
   if(enabled&&typeof c.apiClient.dispose==="function")c.apiClient.dispose();
  }
  return Object.freeze({
   search,reveal,dispose,
   source:enabled?"authorized-api-experimental":"dom",
   // The constant documents the safe release default, not a user preference.
   defaultEnabled:USE_AUTHORIZED_API
  });
 }
 return Object.freeze({USE_AUTHORIZED_API,createRouter});
});

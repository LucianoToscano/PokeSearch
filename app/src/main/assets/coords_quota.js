/* LT145: optional quota evidence from PoGoCoordinates reveal-specific headers.
 * Never infer reveal allowance from search caps, generic RateLimit headers or
 * locally observed copies. No account secrets are read or exported.
 */
(function(root,factory){
 "use strict";
 const moduleApi=factory();
 if(typeof module==="object"&&module.exports)module.exports=moduleApi;
 if(root)root.PokeSearchCoordsQuota=moduleApi;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 function int(value,max){
  if(typeof value!=="string"||!/^(?:0|[1-9][0-9]{0,8})$/.test(value))return null;
  const n=Number(value);
  return Number.isSafeInteger(n)&&n>=0&&n<=max?n:null;
 }
 function fromHeaders(headers){
  if(!headers||typeof headers.get!=="function")return null;
  // Header names MUST explicitly refer to COORDINATE REVEALS; generic
  // X-RateLimit values can be for searches or transport-level throttling.
  const groups=[
   ["x-coords-reveal-limit","x-coords-reveal-remaining","x-coords-reveal-reset"],
   ["x-reveal-quota-limit","x-reveal-quota-remaining","x-reveal-quota-reset"]
  ];
  for(const group of groups){
   const limit=int(headers.get(group[0]),1000000);
   const remaining=int(headers.get(group[1]),1000000);
   if(limit===null||limit===0||remaining===null||remaining>limit)continue;
   // Reset is optional and cannot be guessed to mean midnight/local day.
   const reset=int(headers.get(group[2]),999999999);
   return Object.freeze({kind:"official",limit,remaining,
    resetAtUnixSeconds:reset===null?null:reset});
  }
  return null;
 }
 return Object.freeze({fromHeaders});
});

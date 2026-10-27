"use strict";
/** Minimal dependency adapter: reuse the audited Firebase business logic on Netlify.
 * This does NOT imitate Firebase authentication: the HTTP entrypoint verifies tokens.
 */
class HttpsError extends Error {
 constructor(code,message){super(message);this.code=code;}
}
const onCall=(_options,handler)=>handler;
const onRequest=(_options,handler)=>handler;
const defineSecret=name=>({value:()=>{
 const v=process.env[name];
 if(!v)throw new Error("Private runtime configuration missing");
 return v;
}});
module.exports={onCall,onRequest,HttpsError,defineSecret};

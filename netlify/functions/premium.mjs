import {createRequire} from "node:module";
const require=createRequire(import.meta.url);

const allowedActions=new Set([
 "checkDistributionAccess","createPremiumPix","getPremiumOrder","getPremiumOffer",
 "redeemPremiumKey","adminDistributionControl","adminPremiumSettings",
 "adminRevokePremiumKey",
 "adminPremiumOverview","adminIssuePremiumKey","adminAdjustPremiumExpiry"
]);
const httpStatus={
 unauthenticated:401,"permission-denied":403,"invalid-argument":400,
 "failed-precondition":412,"not-found":404,"resource-exhausted":429,
 unavailable:503,aborted:409
};
const noCache={"content-type":"application/json; charset=utf-8",
 "cache-control":"no-store, no-cache, must-revalidate"};
const response=(obj,status=200)=>new Response(JSON.stringify(obj),{status,headers:noCache});
function initialize(){
 process.env.POKE_RUNTIME_TARGET="netlify";
 if(process.env.POKE_FIREBASE_PROJECT_ID!=="pokesearch-lt")
   throw new Error("Firebase target not explicitly pinned to pokesearch-lt");
 const {getApps,initializeApp,cert}=require("firebase-admin/app");
 if(!getApps().length){
   const email=process.env.POKE_FIREBASE_CLIENT_EMAIL;
   const key=process.env.POKE_FIREBASE_PRIVATE_KEY?.replace(/\\n/g,"\n");
   if(!email||!key)throw new Error("Firebase server credentials missing");
   initializeApp({
     credential:cert({projectId:"pokesearch-lt",clientEmail:email,privateKey:key}),
     databaseURL:"https://pokesearch-lt-default-rtdb.firebaseio.com/"
   });
 }
 return {
   backend:require("../../functions/premium.js"),
   auth:require("firebase-admin/auth").getAuth()
 };
}
function cleanError(error){
 const status=httpStatus[error?.code]||503;
 if(!httpStatus[error?.code])
   console.error("PokeSearch Premium backend failure:",error?.message||"unknown");
 return response({error:status===503?
   "Serviço Premium temporariamente indisponível.":error.message},status);
}
export default async function handler(req,context){
 const method=req.method,segment=context?.params?.action||"";
 const route=new URL(req.url).pathname;
 const action=segment||route.split("/").filter(Boolean).at(-1);
 if(action==="health"&&method==="GET"){
   // Auth + RTDB check. No private data, users, or licensing state is disclosed.
   try{
     const {auth}=initialize();
     const {getDatabase}=require("firebase-admin/database");
     await Promise.all([
       auth.listUsers(1),
       getDatabase().ref("distribution/globalEnabled").get()
     ]);
     // Expose only a readiness flag; never return or log the secret itself.
     const licenseSigningReady=/^[0-9a-f]{64}$/i.test(process.env.POKE_PREMIUM_KEY_SECRET||"");
     return response({service:"PokeSearch Premium",status:"setup",
       firebase:"connected",
       licenseSigning:licenseSigningReady?"ready":"unconfigured",
       livePayments:false});
   }catch(error){
     console.error("PokeSearch Firebase health check failed:",error?.message||"unknown");
     return response({service:"PokeSearch Premium",status:"setup",
       firebase:"unavailable",livePayments:false},503);
   }
 }
 if(method!=="POST")return response({error:"Method not allowed"},405);
 if(!allowedActions.has(action)&&action!=="webhook")
   return response({error:"Not found"},404);
 if(Number(req.headers.get("content-length")||0)>12000)
   return response({error:"Payload too large"},413);
 try{
   const {backend,auth}=initialize();
   if(action==="webhook"){
     const url=new URL(req.url);
     if(url.searchParams.get("type")!=="order")
       return response({error:"Unsupported webhook topic"},400);
     const query=Object.fromEntries(url.searchParams.entries());
     let outStatus=200,outBody="ok";
     // Verified business logic calls Mercado Pago GET; webhook body cannot issue a license.
     const request={method,query,get:header=>req.headers.get(header)};
     const answer={
       status(code){outStatus=code;return this;},
       send(body){outBody=body;return this;}
     };
     await backend.premiumPixWebhook(request,answer);
     return new Response(outBody,{status:outStatus,headers:{
       "content-type":"text/plain; charset=utf-8","cache-control":"no-store"
     }});
   }
   const authorization=req.headers.get("authorization")||"";
   if(!/^Bearer [A-Za-z0-9_\-\.]+$/.test(authorization))
     return response({error:"Firebase login required"},401);
   let verified;
   try{verified=await auth.verifyIdToken(authorization.slice(7),true);}
   catch{return response({error:"Firebase login expired or invalid"},401);}
   let body={};
   try{body=await req.json();}
   catch{return response({error:"Malformed JSON"},400);}
   if(!body||typeof body!=="object"||Array.isArray(body))
     return response({error:"Invalid request"},400);
   const result=await backend[action]({auth:{uid:verified.uid,token:verified},data:body});
   return response(result);
 }catch(error){return cleanError(error);}
}
export const config={
 path:"/api/premium/:action",
 method:["GET","POST"],
 rateLimit:{action:"rate_limit",aggregateBy:"ip",windowSize:60,windowLimit:150}
};

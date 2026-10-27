"use strict";
const assert=require("node:assert/strict"),Module=require("node:module"),crypto=require("node:crypto");
const SECRET={POKE_MP_ACCESS_TOKEN:"mock-token",POKE_MP_WEBHOOK_SECRET:"test-webhook-key",
 POKE_MP_WEBHOOK_URL:"https://example.invalid/webhook",POKE_PREMIUM_KEY_SECRET:"test-key-secret"};
const orderId="123e4567-e89b-12d3-a456-426614174000",now=Date.now();
const store={distribution:{globalEnabled:true,versions:{"54328":true}},
 premium:{config:{salesEnabled:true,priceCents:500},orders:{
  [orderId]:{uid:"buyer",paymentId:"123",priceCents:500,versionCode:54328,status:"pending",createdAt:now-1000}
 }}};
function clone(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v))}
function read(path){return path.split("/").filter(Boolean).reduce((v,key)=>v?.[key],store);}
function write(path,value){const keys=path.split("/").filter(Boolean);
 let p=store;for(const k of keys.slice(0,-1))p=p[k]??(p[k]={});
 p[keys[keys.length-1]]=clone(value);
}
function ref(path){
 const full=path||"";
 return {
  child(key){return ref(full+"/"+key)},
  async get(){return {val:()=>clone(read(full))}},
  async set(v){write(full,v)},
  async update(next){const old=read(full)||{};write(full,{...old,...next})},
  async transaction(fn){
    const old=clone(read(full));const v=fn(old);
    if(v===undefined)return {committed:false,snapshot:{val:()=>clone(old)}};
    write(full,v);return {committed:true,snapshot:{val:()=>clone(v)}};
  }
 };
}
class HttpsError extends Error {constructor(code,message){super(message);this.code=code;}}
const mocks={
 "firebase-functions/v2/https":{onCall:(_cfg,fn)=>fn,onRequest:(_cfg,fn)=>fn,HttpsError},
 "firebase-functions/params":{defineSecret:name=>({value:()=>SECRET[name]})},
 "firebase-admin/database":{getDatabase:()=>({ref})},
 "firebase-admin/auth":{getAuth:()=>({getUser:async uid=>({
   customClaims:uid==="owner"?{pokesearchAdmin:true}:{}
 })})},
 "firebase-admin/app":{getApps:()=>[{}],initializeApp:()=>{}}
};
const orig=Module._load;
Module._load=function(id,parent,isMain){
 return Object.hasOwn(mocks,id)?mocks[id]:orig.call(this,id,parent,isMain);
};
const premium=require("../premium.js");Module._load=orig;
let payment={id:123,external_reference:orderId,live_mode:true,
 payment_method_id:"pix",transaction_amount:5,
 date_approved:new Date(now).toISOString(),status:"approved"};
let fetchCalls=0;
global.fetch=async(url,options)=>{
 fetchCalls++;
 if(url.endsWith("/v1/payments/123"))return {
  ok:true,text:async()=>JSON.stringify(payment)
 };
 if(url.endsWith("/v1/payments")&&options?.method==="POST")return {
  ok:true,text:async()=>JSON.stringify({id:999,
   point_of_interaction:{transaction_data:{qr_code:"000201010212-FAKE-PIX"}}})
 };
 throw Error("Unexpected payment API call "+url);
};
const req=(sig)=>({
 method:"POST",query:{"data.id":"123"},
 get:key=>({"x-signature":sig,"x-request-id":"request-A"}[key])
});
const ts=String(Date.now()),manifest="id:123;request-id:request-A;ts:"+ts+";";
const mac=crypto.createHmac("sha256",SECRET.POKE_MP_WEBHOOK_SECRET).update(manifest).digest("hex");
const valid="ts="+ts+",v1="+mac;
function response(){return {code:200,body:"",
 status(n){this.code=n;return this},send(v){this.body=v;return this}}}
async function run(){
 let res=response();await premium.premiumPixWebhook(req("bad"),res);
 assert.equal(res.code,401,"reject unsigned webhooks");
 assert.equal(read("premium/entitlements/buyer"),undefined,"no grant on invalid signature");
 console.log("PASS invalid signature");
 res=response();await premium.premiumPixWebhook(req(valid),res);
 assert.equal(res.code,200);
 let e=read("premium/entitlements/buyer");
 assert.equal(e.revoked,undefined);
 assert.ok(e.expiresAt>now+29*86400000&&e.expiresAt<=now+31*86400000);
 assert.equal(e.paidOrders[orderId],true);
 assert.ok(/^[0-9a-f]{64}$/.test(e.currentKeyHash));
 console.log("PASS verified real-provider reply grants 30 days");
 const first=e.expiresAt;
 res=response();await premium.premiumPixWebhook(req(valid),res);
 assert.equal(res.code,200);
 assert.equal(read("premium/entitlements/buyer").expiresAt,first);
 console.log("PASS webhook replay does not extend deadline");
 const owner={auth:{uid:"buyer"},data:{versionCode:54328}};
 let grant=await premium.checkDistributionAccess(owner);
 assert.equal(grant.allowed,true);assert.equal(grant.premium,true);
 const order=await premium.getPremiumOrder({auth:{uid:"buyer"},data:{orderId}});
 assert.equal(order.status,"approved");assert.match(order.licenseKey,/^PS-([0-9A-F]{6}-){3}[0-9A-F]{6}$/);
 console.log("PASS authenticated purchaser gets redeemable key");
 let untrusted=false;
 try{await premium.adminDistributionControl({auth:{uid:"buyer"},data:{scope:"global",enabled:false}})}
 catch(error){untrusted=error.code==="permission-denied";}
 assert.equal(untrusted,true);
 await premium.adminDistributionControl({auth:{uid:"owner"},data:{scope:"global",enabled:false}});
 grant=await premium.checkDistributionAccess(owner);assert.equal(grant.allowed,false);assert.equal(grant.premium,false);
 console.log("PASS owner-only global remote kill switch");
 await premium.adminDistributionControl({auth:{uid:"owner"},data:{scope:"global",enabled:true}});
 await premium.adminDistributionControl({auth:{uid:"owner"},data:{scope:"version",enabled:false,versionCode:54328}});
 grant=await premium.checkDistributionAccess(owner);assert.equal(grant.allowed,false);
 console.log("PASS version kill switch");
 await premium.adminDistributionControl({auth:{uid:"owner"},data:{scope:"version",enabled:true,versionCode:54328}});
 // A valid key transfers once, and immediately removes the old owner's entitlement.
 const transferred=await premium.redeemPremiumKey({auth:{uid:"newBuyer"},data:{licenseKey:order.licenseKey}});
 assert.equal(transferred.activated,true);
 grant=await premium.checkDistributionAccess(owner);assert.equal(grant.premium,false);
 const newGrant=await premium.checkDistributionAccess({auth:{uid:"newBuyer"},data:{versionCode:54328}});
 assert.equal(newGrant.premium,true);
 console.log("PASS one-time recovery key transfer");
 payment.status="refunded";
 res=response();await premium.premiumPixWebhook(req(valid),res);
 assert.equal(read("premium/entitlements/buyer").revoked,true);
 assert.equal(read("premium/entitlements/newBuyer").revoked,true);
 const denied=await premium.checkDistributionAccess({auth:{uid:"newBuyer"},data:{versionCode:54328}});
 assert.equal(denied.premium,false);
 console.log("PASS refund revokes original buyer and transferred key holder");
 assert.equal(fetchCalls,3,"one API fetch per valid webhook; unsigned webhook never calls provider");
 console.log("PASS premium server integration mock scenarios");
}
run().catch(e=>{console.error(e);process.exitCode=1;});

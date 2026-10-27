"use strict";
const assert=require("node:assert/strict"),Module=require("node:module"),crypto=require("node:crypto");
const SECRET={POKE_MP_ACCESS_TOKEN:"mock-live-token",POKE_MP_TEST_ACCESS_TOKEN:"mock-test-token",
 POKE_MP_WEBHOOK_SECRET:"test-webhook-key",POKE_PREMIUM_KEY_SECRET:"test-key-secret"};
const orderId="123e4567-e89b-12d3-a456-426614174000",now=Date.now();
const store={distribution:{globalEnabled:true,versions:{"54328":true}},
 premium:{config:{salesEnabled:true,priceCents:500},orders:{
  [orderId]:{uid:"buyer",paymentId:"123",priceCents:500,versionCode:54328,status:"pending",createdAt:now-1000}
 }}};
const coldCacheTransactions=new Set();
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
    if(coldCacheTransactions.delete(full)){
      const first=fn(null);
      if(first===undefined)return {committed:false,snapshot:{val:()=>null}};
    }
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
const mpOrderId="ORD01JP84C939T20S0P1DN6FCMWQC";
store.premium.orders[orderId].mpOrderId=mpOrderId;
store.premium.orders[orderId].liveMode=false;
store.premium.orderIndex={[mpOrderId]:{orderId}};
let payment={id:mpOrderId,type:"online",external_reference:orderId,live_mode:false,
 total_amount:"5.00",status:"processed",status_detail:"accredited",
 transactions:{payments:[{id:"PAY01JP84C939T20S0P1DN6FCMWQC",amount:"5.00",
   status:"processed",status_detail:"accredited",
   payment_method:{id:"pix",type:"bank_transfer"}}]}};
let fetchCalls=0;
global.fetch=async(url,options)=>{
 fetchCalls++;
 assert.ok(options.headers.Authorization.startsWith("Bearer mock-test-token"));
 if(url.endsWith("/v1/orders/"+mpOrderId))return {
  ok:true,text:async()=>JSON.stringify(payment)
 };
 if(url.endsWith("/v1/orders")&&options?.method==="POST")return {
  ok:true,text:async()=>JSON.stringify({id:"ORD01JP84C939T20S0P1DN6FCMWQC",
   transactions:{payments:[{payment_method:{qr_code:"000201010212-FAKE-PIX"}}]}})
 };
 throw Error("Unexpected Orders API call "+url);
};
const req=sig=>({
 method:"POST",query:{"data.id":mpOrderId,type:"order"},
 get:key=>({"x-signature":sig,"x-request-id":"request-A"}[key])
});
const ts=String(Date.now()),manifest="id:"+mpOrderId.toLowerCase()+";request-id:request-A;ts:"+ts+";";
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
 // Owner can choose each gift's duration; no lifetime/gift quantity quotas.
 const admin={auth:{uid:"owner"}};
 const offer=await premium.getPremiumOffer({auth:{uid:"friendA"},data:{}});
 assert.equal(offer.priceCents,500);
 assert.equal(offer.regularPriceCents,1000);
 assert.equal(offer.promotionalPriceCents,500);
 await premium.adminPremiumSettings({...admin,data:{action:"promotion",enabled:false}});
 assert.equal((await premium.getPremiumOffer({auth:{uid:"friendA"}})).priceCents,1000);
 await premium.adminPremiumSettings({...admin,data:{action:"promotion",enabled:true}});
 assert.equal((await premium.getPremiumOffer({auth:{uid:"friendA"}})).priceCents,500);
 console.log("PASS R$10 regular and R$5 open-ended promotion with owner toggle");
 for(const duration of ["15d","1m","3m","6m","12m","lifetime"]){
   const gift=await premium.adminIssuePremiumKey({...admin,data:{duration}});
   assert.equal(gift.assigned,false);
   assert.match(gift.licenseKey,/^PS-([0-9A-F]{6}-){3}[0-9A-F]{6}$/);
   const friend="friend_"+duration;
   const redeemed=await premium.redeemPremiumKey({
     auth:{uid:friend},data:{licenseKey:gift.licenseKey}
   });
   assert.equal(redeemed.activated,true);
   const state=await premium.checkDistributionAccess({
     auth:{uid:friend},data:{versionCode:54328}
   });
   assert.equal(state.premium,true);
   if(duration==="lifetime"){
     assert.equal(redeemed.lifetime,true);
     assert.equal(redeemed.expiresAt,null);
   }else{
     assert.equal(redeemed.lifetime,false);
     assert.ok(redeemed.expiresAt>Date.now());
   }
   let doubleUse=false;
   try{
     await premium.redeemPremiumKey({auth:{uid:"other_"+duration},
        data:{licenseKey:gift.licenseKey}});
   }catch(error){doubleUse=error.code==="permission-denied";}
   assert.equal(doubleUse,true,"gift cannot be claimed by another UID");
 }
 // Revoking an exposed, unclaimed manual code is admin-only and permanent.
 const exposed=await premium.adminIssuePremiumKey({...admin,data:{duration:"15d"}});
 let unauthorizedRevoke=false;
 try{
   await premium.adminRevokePremiumKey({
     auth:{uid:"stranger"},data:{licenseKey:exposed.licenseKey}
   });
 }catch(error){unauthorizedRevoke=error.code==="permission-denied";}
 assert.equal(unauthorizedRevoke,true,"non-admin must not revoke keys");
 const activeState=await premium.adminPremiumKeyStatus({
   ...admin,data:{licenseKey:exposed.licenseKey}
 });
 assert.equal(activeState.status,"active");
 assert.equal(activeState.assigned,false);
 const exposedHash=crypto.createHash("sha256").update(exposed.licenseKey).digest("hex");
 coldCacheTransactions.add("premium/keys/"+exposedHash);
 const invalidated=await premium.adminRevokePremiumKey({
   ...admin,data:{licenseKey:exposed.licenseKey}
 });
 assert.equal(invalidated.revoked,true);
 assert.equal(invalidated.wasAssigned,false);

 assert.equal(read("premium/keys/"+exposedHash).revoked,true);
 const cancelledState=await premium.adminPremiumKeyStatus({
   ...admin,data:{licenseKey:exposed.licenseKey}
 });
 assert.equal(cancelledState.status,"revoked");
 const repeated=await premium.adminRevokePremiumKey({
   ...admin,data:{licenseKey:exposed.licenseKey}
 });
 assert.equal(repeated.alreadyRevoked,true,"second cancellation reports safe already-revoked");
 const missing=await premium.adminPremiumKeyStatus({
   ...admin,data:{licenseKey:"PS-FFFFFF-FFFFFF-FFFFFF-FFFFFF"}
 });
 assert.equal(missing.status,"notFound");
 let unknownCancel=false;
 try{await premium.adminRevokePremiumKey({
   ...admin,data:{licenseKey:"PS-FFFFFF-FFFFFF-FFFFFF-FFFFFF"}
 });}catch(error){unknownCancel=error.code==="not-found"}
 assert.equal(unknownCancel,true,"never claim unknown key was cancelled");

 let blocked=false;
 try{
   await premium.redeemPremiumKey({
     auth:{uid:"testOther"},data:{licenseKey:exposed.licenseKey}
   });
 }catch(error){blocked=error.code==="not-found";}
 assert.equal(blocked,true,"revoked unclaimed key cannot be redeemed");
 const claimedGift=await premium.adminIssuePremiumKey({...admin,data:{duration:"15d"}});
 await premium.redeemPremiumKey({
   auth:{uid:"claimant"},data:{licenseKey:claimedGift.licenseKey}
 });
 const claimedHash=crypto.createHash("sha256").update(claimedGift.licenseKey).digest("hex");
 coldCacheTransactions.add("premium/keys/"+claimedHash);
 coldCacheTransactions.add("premium/entitlements/claimant");
 const revClaimed=await premium.adminRevokePremiumKey({
   ...admin,data:{licenseKey:claimedGift.licenseKey}
 });
 assert.equal(revClaimed.revoked,true);
 assert.equal(revClaimed.wasAssigned,true);
 assert.equal(read("premium/entitlements/claimant").revoked,true);
 assert.equal((await premium.checkDistributionAccess({
   auth:{uid:"claimant"},data:{versionCode:54328}
 })).premium,false,"revoking a claimed gift removes premium");
 console.log("PASS admin-only revocation of exposed and claimed manual keys");
 console.log("PASS individually chosen 15d/1m/3m/6m/12m/lifetime gifts");
 for(let i=0;i<12;i++){
   const more=await premium.adminIssuePremiumKey({...admin,data:{duration:"lifetime"}});
   assert.equal(more.lifetime,true,"no quota for owner-created lifetime licenses");
 }
 console.log("PASS 12 additional lifetime grants without a fixed quota");
 const existing=await premium.adminIssuePremiumKey({
   ...admin,data:{duration:"1m",uid:"namedFriend"}
 });
 assert.equal(existing.assigned,true);
 let state=await premium.checkDistributionAccess({
   auth:{uid:"namedFriend"},data:{versionCode:54328}
 });
 assert.equal(state.premium,true);
 const extended=await premium.adminIssuePremiumKey({
   ...admin,data:{duration:"6m",uid:"namedFriend",extend:true}
 });
 assert.ok(extended.expiresAt>existing.expiresAt);
 await premium.adminIssuePremiumKey({
   ...admin,data:{duration:"lifetime",uid:"namedFriend",extend:false}
 });
 state=await premium.checkDistributionAccess({
   auth:{uid:"namedFriend"},data:{versionCode:54328}
 });
 assert.equal(state.premium,true);
 assert.equal(read("premium/entitlements/namedFriend").lifetime,true);
 console.log("PASS owner can assign/extend/convert individual licenses to lifetime");
 console.log("PASS premium server integration mock scenarios");
}
run().catch(e=>{console.error(e);process.exitCode=1;});

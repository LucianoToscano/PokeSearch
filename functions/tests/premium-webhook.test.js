"use strict";
const assert=require("node:assert/strict"),Module=require("node:module"),crypto=require("node:crypto");
const SECRET={POKE_MP_ACCESS_TOKEN:"mock-live-token",POKE_MP_TEST_ACCESS_TOKEN:"mock-test-token",
 POKE_MP_WEBHOOK_SECRET:"test-webhook-key",POKE_MP_LIVE_WEBHOOK_SECRET:"live-webhook-key",
 POKE_PREMIUM_KEY_SECRET:"test-key-secret"};
const DEVICE_A="7e1ae258-9d37-45df-8b17-34fb167ee001";
const DEVICE_B="7e1ae258-9d37-45df-8b17-34fb167ee002";
const DEVICE_C="7e1ae258-9d37-45df-8b17-34fb167ee003";
const orderId="123e4567-e89b-12d3-a456-426614174000",now=Date.now();
const store={distribution:{globalEnabled:true,versions:{"54328":true}},
 premium:{config:{salesEnabled:true,regularPriceCents:1000,promotionalPriceCents:500,priceCents:500},orders:{
  [orderId]:{uid:"buyer",paymentId:"123",priceCents:500,versionCode:54328,deviceId:DEVICE_A,status:"pending",createdAt:now-1000}
 }}};
const coldCacheTransactions=new Set();
function clone(v){return v===undefined?undefined:JSON.parse(JSON.stringify(v))}
function read(path){return path.split("/").filter(Boolean).reduce((v,key)=>v?.[key],store);}
function write(path,value){const keys=path.split("/").filter(Boolean);
 let p=store;for(const k of keys.slice(0,-1))p=p[k]??(p[k]={});
 p[keys[keys.length-1]]=clone(value);
}
function ref(path,query={}){
 const full=path||"";
 return {
  child(key){return ref(full+"/"+key)},
  orderByKey(){return ref(full,{...query,ordered:true})},
  startAt(cursor){return ref(full,{...query,start:cursor})},
  limitToFirst(limit){return ref(full,{...query,limit})},
  async get(){
    let data=clone(read(full));
    if(query.ordered){
      let items=Object.entries(data||{}).sort(([a],[b])=>a.localeCompare(b));
      if(query.start)items=items.filter(([key])=>key>=query.start);
      if(query.limit)items=items.slice(0,query.limit);
      data=Object.fromEntries(items);
    }
    return {val:()=>data};
  },
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
   customClaims:uid==="owner"?{pokesearchAdmin:true}:{},
   email:({
     "recipientUser":"recipient@example.org",
     "wrongRecipient":"wrong@example.org",
     "campaignOne":"one@example.org",
     "campaignTwo":"two@example.org",
     "campaignThree":"three@example.org",
     "campaignLifetime":"lifetime@example.org"
   })[uid]||uid+"@example.org",
   emailVerified:uid!=="unverifiedCampaign",
   providerData:uid==="anonymousUser"?[]:[{providerId:"google.com"}]
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
const pixPaymentId="987654321098";
let pixPayment={
 id:Number(pixPaymentId),external_reference:"",status:"pending",status_detail:"pending_waiting_transfer",
 payment_method_id:"pix",currency_id:"BRL",live_mode:false,transaction_amount:5.00
};
const affiliatePaymentId="987654321099";
let affiliatePayment={id:Number(affiliatePaymentId),external_reference:"",
  status:"pending",status_detail:"pending_waiting_transfer",payment_method_id:"pix",
  currency_id:"BRL",live_mode:false,transaction_amount:4.50};
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
 if(url.endsWith("/v1/payments")&&options?.method==="POST"){
   const request=JSON.parse(options.body);
   assert.ok([5,4.5].includes(request.transaction_amount));
   assert.equal(request.payment_method_id,"pix");
   assert.equal(request.description,"PokeSearch Premium - Pokebola 2 - 30 dias");
   assert.ok(options.headers["X-Idempotency-Key"]);
   const affiliate=request.transaction_amount===4.5;
   if(affiliate)affiliatePayment.external_reference=request.external_reference;
   else pixPayment.external_reference=request.external_reference;
   return {ok:true,text:async()=>JSON.stringify({
     id:affiliate?Number(affiliatePaymentId):Number(pixPaymentId),
     point_of_interaction:{transaction_data:{qr_code:"000201010212-PIX-TEST"}}})};
 }
 if(url.endsWith("/v1/payments/"+pixPaymentId))return {
   ok:true,text:async()=>JSON.stringify(pixPayment)
 };
 if(url.endsWith("/v1/payments/"+affiliatePaymentId))return {
   ok:true,text:async()=>JSON.stringify(affiliatePayment)
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
 const owner={auth:{uid:"buyer"},data:{versionCode:54328,deviceId:DEVICE_A}};
 let grant=await premium.checkDistributionAccess(owner);
 assert.equal(grant.allowed,true);assert.equal(grant.premium,true);

 // A paid Google UID owns exactly one active installation.
 assert.equal(read("premium/deviceBindings/buyer").deviceHash.length,64);
 assert.equal(JSON.stringify(read("premium/deviceBindings/buyer")).includes(DEVICE_A),false);
 const differentPhone=await premium.checkDistributionAccess({
   auth:{uid:"buyer"},data:{versionCode:54328,deviceId:DEVICE_B,
     deviceName:"Samsung secondary"}});
 assert.equal(differentPhone.allowed,true);
 assert.equal(differentPhone.hasPremiumLicense,true);
 assert.equal(differentPhone.premium,false);
 assert.equal(differentPhone.deviceConflict,true);
 let invalidTransfer=false;
 try{await premium.transferPremiumDevice({auth:{uid:"buyer"},
   data:{versionCode:54328,deviceId:DEVICE_B,confirm:false}})}
 catch(error){invalidTransfer=error.code==="invalid-argument";}
 assert.equal(invalidTransfer,true);
 let nonSubscriberTransfer=false;
 try{await premium.transferPremiumDevice({auth:{uid:"unknown"},
   data:{versionCode:54328,deviceId:DEVICE_B,confirm:true}})}
 catch(error){nonSubscriberTransfer=error.code==="failed-precondition";}
 assert.equal(nonSubscriberTransfer,true);
 const deviceTransfer=await premium.transferPremiumDevice({auth:{uid:"buyer"},
   data:{versionCode:54328,deviceId:DEVICE_B,
     deviceName:"Samsung secondary",confirm:true}});
 assert.equal(deviceTransfer.transferred,true);
 const afterSwap=await premium.checkDistributionAccess({
   auth:{uid:"buyer"},data:{versionCode:54328,deviceId:DEVICE_B}});
 assert.equal(afterSwap.premium,true);
 const oldPhone=await premium.checkDistributionAccess(owner);
 assert.equal(oldPhone.premium,false);
 assert.equal(oldPhone.deviceConflict,true);
 let cooldown=false;
 try{await premium.transferPremiumDevice({auth:{uid:"buyer"},
   data:{versionCode:54328,deviceId:DEVICE_C,confirm:true}})}
 catch(error){cooldown=error.code==="resource-exhausted";}
 assert.equal(cooldown,true);
 const missingId=await premium.checkDistributionAccess({
   auth:{uid:"buyer"},data:{versionCode:54328}});
 assert.equal(missingId.deviceUpdateRequired,true);
 assert.equal(missingId.premium,false);
 // Return the paid buyer to the initial mocked device without violating the
 // one-minute transfer throttle by moving the simulated server clock only.
 write("premium/deviceBindings/buyer/switchedAt",Date.now()-61000);
 await premium.transferPremiumDevice({auth:{uid:"buyer"},
   data:{versionCode:54328,deviceId:DEVICE_A,confirm:true}});
 assert.equal((await premium.checkDistributionAccess(owner)).premium,true);
 console.log("PASS one active Google installation, confirmed transfer, old-device denial and cooldown");
  const info=await premium.premiumSessionInfo({auth:{uid:"buyer"},data:{deviceId:DEVICE_A}});
  assert.equal(info.licenseActive,true);
  assert.equal(info.authorizedHere,true);
  const adminDisconnect=await premium.adminDisconnectPremiumDevice({
    auth:{uid:"owner"},data:{uid:"buyer"}});
  assert.equal(adminDisconnect.disconnected,true);
  const adminBlocked=await premium.checkDistributionAccess(owner);
  assert.equal(adminBlocked.premium,false,"admin disconnected phone must not auto-reclaim");
  const again=await premium.transferPremiumDevice({auth:{uid:"buyer"},
    data:{versionCode:54328,deviceId:DEVICE_A,confirm:true}});
  assert.equal(again.transferred,true);
  const released=await premium.releasePremiumDevice({
    auth:{uid:"buyer"},data:{deviceId:DEVICE_A}});
  assert.equal(released.released,true);
  assert.equal((await premium.checkDistributionAccess(owner)).premium,true,
    "same account can sign in again after explicit logout");
  const anonymous=await premium.checkDistributionAccess({
    auth:{uid:"anonymousUser"},data:{versionCode:54328,deviceId:DEVICE_A}});
  assert.equal(anonymous.premium,false);
  console.log("PASS owner remote disconnect, explicit reauth, logout and session info");

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
 await premium.adminDistributionControl({auth:{uid:"owner"},data:{scope:"version",enabled:false,versionCode:54328,deviceId:DEVICE_A}});
 grant=await premium.checkDistributionAccess(owner);assert.equal(grant.allowed,false);
 console.log("PASS version kill switch");
 await premium.adminDistributionControl({auth:{uid:"owner"},data:{scope:"version",enabled:true,versionCode:54328,deviceId:DEVICE_A}});
 // A valid key transfers once, and immediately removes the old owner's entitlement.
 const transferred=await premium.redeemPremiumKey({auth:{uid:"newBuyer"},data:{licenseKey:order.licenseKey}});
 assert.equal(transferred.activated,true);
 grant=await premium.checkDistributionAccess(owner);assert.equal(grant.premium,false);
 const newGrant=await premium.checkDistributionAccess({auth:{uid:"newBuyer"},data:{versionCode:54328,deviceId:DEVICE_A}});
 assert.equal(newGrant.premium,true);
 console.log("PASS one-time recovery key transfer");
 payment.status="refunded";
 res=response();await premium.premiumPixWebhook(req(valid),res);
 assert.equal(read("premium/entitlements/buyer").revoked,true);
 assert.equal(read("premium/entitlements/newBuyer").revoked,true);
 const denied=await premium.checkDistributionAccess({auth:{uid:"newBuyer"},data:{versionCode:54328,deviceId:DEVICE_A}});
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
 for(const duration of ["15d","30d","1m","3m","6m","12m","lifetime"]){
   const gift=await premium.adminIssuePremiumKey({...admin,data:{duration}});
   assert.equal(gift.assigned,false);
   assert.match(gift.licenseKey,/^PS-([0-9A-F]{6}-){3}[0-9A-F]{6}$/);
   const giftHash=crypto.createHash("sha256").update(gift.licenseKey).digest("hex");
   coldCacheTransactions.add("premium/keys/"+giftHash);
   const friend="friend_"+duration;
   const redeemed=await premium.redeemPremiumKey({
     auth:{uid:friend},data:{licenseKey:gift.licenseKey}
   });
   assert.equal(redeemed.activated,true);
   const state=await premium.checkDistributionAccess({
     auth:{uid:friend},data:{versionCode:54328,deviceId:DEVICE_A}
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
   auth:{uid:"claimant"},data:{versionCode:54328,deviceId:DEVICE_A}
 })).premium,false,"revoking a claimed gift removes premium");
 console.log("PASS admin-only revocation of exposed and claimed manual keys");
 console.log("PASS individually chosen 15d/30d/1m/3m/6m/12m/lifetime gifts");
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
   auth:{uid:"namedFriend"},data:{versionCode:54328,deviceId:DEVICE_A}
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
   auth:{uid:"namedFriend"},data:{versionCode:54328,deviceId:DEVICE_A}
 });
 assert.equal(state.premium,true);
 assert.equal(read("premium/entitlements/namedFriend").lifetime,true);
 console.log("PASS owner can assign/extend/convert individual licenses to lifetime");
 // Payments API uses numeric payment IDs, not Orders IDs.
 // A valid signed but pending Pix must not activate P2.
 const pixOrder=await premium.createPremiumPix({auth:{uid:"payerPix"},
   data:{versionCode:54328,deviceId:DEVICE_A,email:"buyer@example.org"}});
 assert.equal(pixOrder.status,"pending");
 assert.equal(pixOrder.pixCode,"000201010212-PIX-TEST");
 const pixTs=String(Date.now()),pixManifest="id:"+pixPaymentId.toLowerCase()+";request-id:request-P;ts:"+pixTs+";";
 const pixMac=crypto.createHmac("sha256",SECRET.POKE_MP_WEBHOOK_SECRET).update(pixManifest).digest("hex");
 const pixReq=signature=>({method:"POST",query:{"data.id":pixPaymentId,type:"payment"},
   get:key=>({"x-signature":signature,"x-request-id":"request-P"}[key])});
 res=response();await premium.premiumPixWebhook(pixReq("bad"),res);
 assert.equal(res.code,401);
 assert.equal(read("premium/entitlements/payerPix"),undefined);
 res=response();await premium.premiumPixWebhook(pixReq("ts="+pixTs+",v1="+pixMac),res);
 assert.equal(res.code,200);
 assert.equal(read("premium/entitlements/payerPix"),undefined,"pending Pix must not grant license");
 pixPayment.status="approved";pixPayment.status_detail="accredited";
 res=response();await premium.premiumPixWebhook(pixReq("ts="+pixTs+",v1="+pixMac),res);
 assert.equal(res.code,200);
 let pixEnt=read("premium/entitlements/payerPix");
 assert.equal(pixEnt.paidOrders[pixOrder.orderId],true);
 const originalPixExpiry=pixEnt.expiresAt;
 const pixOrderStatus=await premium.getPremiumOrder({auth:{uid:"payerPix"},
   data:{orderId:pixOrder.orderId}});
 assert.equal(pixOrderStatus.status,"approved");
 res=response();await premium.premiumPixWebhook(pixReq("ts="+pixTs+",v1="+pixMac),res);
 assert.equal(res.code,200);
 assert.equal(read("premium/entitlements/payerPix").expiresAt,originalPixExpiry);
 pixPayment.status="refunded";pixPayment.status_detail="refunded";
 res=response();await premium.premiumPixWebhook(pixReq("ts="+pixTs+",v1="+pixMac),res);
 assert.equal(res.code,200);
 assert.equal(read("premium/entitlements/payerPix").revoked,true);
 console.log("PASS Payments API signed Pix webhook, pending, approved, replay, refund");
 // Live endpoint does not accept the test signature or reconcile a test payment.
 const adminLive={auth:{uid:"owner"}};
 await premium.adminPremiumSettings({...adminLive,data:{action:"paymentsLive",enabled:true}});
 assert.equal((await premium.adminPremiumOverview(adminLive)).paymentsLiveEnabled,true);
 await premium.adminPremiumSettings({...adminLive,data:{action:"paymentsLive",enabled:false}});
 assert.equal((await premium.adminPremiumOverview(adminLive)).paymentsLiveEnabled,false);
 const signedForLive=crypto.createHmac("sha256",SECRET.POKE_MP_LIVE_WEBHOOK_SECRET)
   .update(pixManifest).digest("hex");
 const savedEnt=clone(read("premium/entitlements/payerPix"));
 const wrongEnvironment={...pixReq("ts="+pixTs+",v1="+signedForLive),liveModeWebhook:true};
 res=response();await premium.premiumPixWebhook(wrongEnvironment,res);
 assert.equal(res.code,200);
 assert.deepEqual(read("premium/entitlements/payerPix"),savedEnt);


 // Influencer coupons are owner-controlled; commission is on the paid amount
 // and appears only after a provider-approved Pix, never on quote or QR create.
 let couponDenied=false;
 try{await premium.adminSavePartnerCoupon({
   auth:{uid:"stranger"},data:{code:"YOUTUBE10",partnerName:"Canal",discountPercent:10}});}
 catch(e){couponDenied=e.code==="permission-denied";}
 assert.equal(couponDenied,true);
 await premium.adminSavePartnerCoupon({
   ...adminLive,data:{code:"YOUTUBE10",partnerName:"Canal de Vídeos",
     discountPercent:10,partnerUid:"influencer123",enabled:true}});
 await premium.adminSavePartnerCoupon({
   ...adminLive,data:{code:"CRIADOR50",partnerName:"Criador A",
     discountPercent:50,enabled:true}});
 await premium.adminSavePartnerCoupon({
   ...adminLive,data:{code:"CRIADOR25",partnerName:"Canal 25",
     discountPercent:25,enabled:true}});
 const promoBase=await premium.getPremiumOffer({
   auth:{uid:"couponBuyer"},data:{}});
 assert.equal(promoBase.priceCents,500);
 let quoted=await premium.getPremiumOffer({
   auth:{uid:"couponBuyer"},data:{couponCode:"youtube10"}});
 assert.equal(quoted.priceCents,450);
 assert.equal(quoted.coupon.discountPercent,10);
 const half=await premium.getPremiumOffer({
   auth:{uid:"couponBuyer"},data:{couponCode:"CRIADOR50"}});
 assert.equal(half.priceCents,250);
 const partnerCodes=await premium.adminListPartnerCoupons(adminLive);
 assert.equal(partnerCodes.items.length,3);
 const quarter=await premium.getPremiumOffer({
   auth:{uid:"couponBuyer"},data:{couponCode:"CRIADOR25"}});
 assert.equal(quarter.priceCents,375);
 assert.equal(quarter.coupon.discountPercent,25);
 let selfUseDenied=false;
 try{await premium.getPremiumOffer({
   auth:{uid:"influencer123"},data:{couponCode:"YOUTUBE10"}});}
 catch(e){selfUseDenied=e.code==="failed-precondition";}
 assert.equal(selfUseDenied,true);
 let invalidDiscountRejected=false;
 try{await premium.adminSavePartnerCoupon({
   ...adminLive,data:{code:"BAD30",partnerName:"Criador",discountPercent:30}});}
 catch(e){invalidDiscountRejected=e.code==="invalid-argument";}
 assert.equal(invalidDiscountRejected,true);

 const commissionPix=await premium.createPremiumPix({
   auth:{uid:"couponBuyer"},
   data:{versionCode:54328,deviceId:DEVICE_A,email:"coupon@example.org",couponCode:"youtube10"}});
 assert.equal(commissionPix.priceCents,450);
 assert.equal(commissionPix.couponCode,"YOUTUBE10");
 let affiliateRecord=read("premium/orders/"+commissionPix.orderId);
 assert.equal(affiliateRecord.referral.commissionCents,225);
 assert.equal(affiliateRecord.referral.status,"unearned");
 assert.equal(read("premium/entitlements/couponBuyer"),undefined);
 const affiliateTs=String(Date.now());
 const affiliateManifest="id:"+affiliatePaymentId+
   ";request-id:aff-req;ts:"+affiliateTs+";";
 const affiliateMac=crypto.createHmac("sha256",SECRET.POKE_MP_WEBHOOK_SECRET)
   .update(affiliateManifest).digest("hex");
 const affiliateReq={method:"POST",query:{"data.id":affiliatePaymentId,type:"payment"},
   get:key=>({"x-signature":"ts="+affiliateTs+",v1="+affiliateMac,
     "x-request-id":"aff-req"}[key])};
 res=response();await premium.premiumPixWebhook(affiliateReq,res);
 assert.equal(res.code,200);
 assert.equal(read("premium/orders/"+commissionPix.orderId).referral.status,"unearned");
 affiliatePayment.status="approved";affiliatePayment.status_detail="accredited";
 res=response();await premium.premiumPixWebhook(affiliateReq,res);
 assert.equal(res.code,200);
 affiliateRecord=read("premium/orders/"+commissionPix.orderId);
 assert.equal(affiliateRecord.status,"approved");
 assert.equal(affiliateRecord.referral.status,"pending");
 assert.equal(affiliateRecord.referral.commissionCents,225);
 res=response();await premium.premiumPixWebhook(affiliateReq,res);
 assert.equal(res.code,200);
 assert.equal(read("premium/orders/"+commissionPix.orderId).referral.commissionCents,225);
 let payoutRejected=false;
 try{await premium.adminMarkPartnerCommissionPaid({
   ...adminLive,data:{orderId:commissionPix.orderId,reference:"external123",
     confirm:"REGISTRAR REPASSE"}});}
 catch(e){payoutRejected=e.code==="failed-precondition";}
 assert.equal(payoutRejected,true,"Never mark test-mode payments paid");
 const commissions=await premium.adminListPartnerCommissions(adminLive);
 assert.ok(commissions.items.some(x=>x.orderId===commissionPix.orderId&&
   x.commissionCents===225&&x.commissionStatus==="pending"));
 affiliatePayment.status="refunded";affiliatePayment.status_detail="refunded";
 res=response();await premium.premiumPixWebhook(affiliateReq,res);
 assert.equal(res.code,200);
 assert.equal(read("premium/orders/"+commissionPix.orderId).referral.status,"reversed");

 // The manual repasse control is audit-only and cannot transfer money.
 const accountingOrderId="123e4567-e89b-42d3-a456-426614170001";
 write("premium/orders/"+accountingOrderId,{
   uid:"legitimateBuyer",status:"approved",licensed:true,liveMode:true,
   priceCents:500,createdAt:Date.now(),
   referral:{code:"CRIADOR50",partnerName:"Criador A",commissionCents:250,
     commissionPercent:50,status:"pending"}});
 const recorded=await premium.adminMarkPartnerCommissionPaid({
   ...adminLive,data:{orderId:accountingOrderId,reference:"Pix-REPASSE-ABC",
     confirm:"REGISTRAR REPASSE"}});
 assert.equal(recorded.recorded,true);
 assert.equal(read("premium/orders/"+accountingOrderId).referral.status,"paid");
 assert.equal(read("premium/orders/"+accountingOrderId).referral.commissionCents,250);
 let duplicatePayoutDenied=false;
 try{await premium.adminMarkPartnerCommissionPaid({
   ...adminLive,data:{orderId:accountingOrderId,reference:"Pix-REPASSE-ABC",
     confirm:"REGISTRAR REPASSE"}});}
 catch(e){duplicatePayoutDenied=e.code==="failed-precondition";}
 assert.equal(duplicatePayoutDenied,true);
 await premium.adminSavePartnerCoupon({
   ...adminLive,data:{code:"YOUTUBE10",partnerName:"Canal de Vídeos",
     discountPercent:10,partnerUid:"influencer123",enabled:false}});
 let disabledRejected=false;
 try{await premium.getPremiumOffer({
   auth:{uid:"couponBuyer"},data:{couponCode:"YOUTUBE10"}});}
 catch(e){disabledRejected=e.code==="failed-precondition";}
 assert.equal(disabledRejected,true);
 assert.equal(read("premium/orders/"+commissionPix.orderId).referral.code,"YOUTUBE10",
   "Disabling a coupon never rewrites historical commissions");
 // Owner-applied preset affects only new orders and supports stacked discounts.
 await premium.adminPremiumSettings({...adminLive,data:{action:"pricingPreset"}});
 const table=(await premium.getPremiumOffer({
   auth:{uid:"couponBuyer"},data:{}}));
 assert.equal(table.regularPriceCents,2000);
 assert.equal(table.promotionalPriceCents,1000);
 assert.equal(table.priceCents,1000);
 await premium.adminSavePartnerCoupon({
   ...adminLive,data:{code:"YOUTUBE10",partnerName:"Canal de Vídeos",
     discountPercent:10,partnerUid:"influencer123",enabled:true}});
 for(const [code,amount] of [["YOUTUBE10",900],["CRIADOR25",750],["CRIADOR50",500]]){
   const quote=await premium.getPremiumOffer({
     auth:{uid:"couponBuyer"},data:{couponCode:code}});
   assert.equal(quote.priceCents,amount);
 }
 await premium.adminSavePartnerCoupon({
   ...adminLive,data:{code:"CRIADOR25",partnerName:"Canal 25",
     discountPercent:25,commissionPercent:40,enabled:true}});
 const customQuote=await premium.getPremiumOffer({
   auth:{uid:"couponBuyer"},data:{couponCode:"CRIADOR25"}});
 assert.equal(customQuote.priceCents,750);
 const customCoupon=(await premium.adminListPartnerCoupons(adminLive))
   .items.find(item=>item.code==="CRIADOR25");
 assert.equal(customCoupon.commissionPercent,40);
 assert.equal(Math.round(customQuote.priceCents*customCoupon.commissionPercent/100),300);
 await premium.adminSavePartnerCoupon({
   ...adminLive,data:{code:"YOUTUBE10",partnerName:"Canal de Vídeos",
     discountPercent:10,partnerUid:"influencer123",enabled:false}});
 assert.equal(read("premium/orders/"+commissionPix.orderId).priceCents,450,
   "Changing prices must not mutate earlier approved charges.");
 await premium.adminPremiumSettings({...adminLive,data:{
   action:"prices",regularPriceCents:1000,promotionalPriceCents:500}});
 console.log("PASS preset normal R$20, promotion R$10, stacked 25/50 coupons, previously issued Pix unchanged");
 console.log("PASS influencer coupon: exact discount, partner binding, verified Pix, replay, refund and manual repasse");
 // Admin inventory uses hashes as IDs, never plaintext; newly issued codes are sealed.
 const inventory=await premium.adminListPremiumKeys({...adminLive,data:{limit:20}});
 assert.ok(inventory.keys.length>0);
 assert.ok(inventory.keys.every(k=>!Object.hasOwn(k,"licenseKey")));
 const separateIssue=await premium.adminIssuePremiumKey({...adminLive,data:{duration:"30d"}});
 const separateHash=crypto.createHash("sha256").update(separateIssue.licenseKey).digest("hex");
 const inventory2=await premium.adminListPremiumKeys({...adminLive,data:{limit:50}});
 assert.ok(inventory2.keys.some(k=>k.id===separateHash&&k.copyAvailable));
 const revealed=await premium.adminRevealPremiumKey({...adminLive,data:{id:separateHash}});
 assert.equal(revealed.licenseKey,separateIssue.licenseKey);
 await premium.adminSetPremiumKeyEnabled({...adminLive,data:{id:separateHash,enabled:false}});
 assert.equal(read("premium/keys/"+separateHash).suspended,true);
 let suspendedBlocked=false;
 try{await premium.redeemPremiumKey({auth:{uid:"suspendedTester"},
    data:{licenseKey:separateIssue.licenseKey}});}
 catch(error){suspendedBlocked=error.code==="not-found";}
 assert.equal(suspendedBlocked,true);
 await premium.adminSetPremiumKeyEnabled({...adminLive,data:{id:separateHash,enabled:true}});
 await premium.adminChangePremiumKeyDuration({...adminLive,
    data:{id:separateHash,action:"duration",duration:"15d"}});
 assert.equal(read("premium/keys/"+separateHash).duration,"15d");
 assert.equal(read("premium/keys/"+separateHash).suspended,false);
 const oldCode="PS-AAAAAA-BBBBBB-CCCCCC-DDDDDD";
 const oldHash=crypto.createHash("sha256").update(oldCode).digest("hex");
 write("premium/keys/"+oldHash,{kind:"manual",duration:"15d",createdAt:Date.now()});
 let oldNotRecovered=false;
 try{await premium.adminRevealPremiumKey({...adminLive,data:{id:oldHash}});}
 catch(error){oldNotRecovered=error.code==="failed-precondition";}
 assert.equal(oldNotRecovered,true);
 const page1=await premium.adminListPremiumKeys({...adminLive,data:{limit:3}});
 assert.equal(page1.keys.length,3);
 assert.equal(page1.hasMore,true);
 const page2=await premium.adminListPremiumKeys({...adminLive,
   data:{limit:3,cursor:page1.nextCursor}});
 assert.equal(page2.keys.length,3);
 assert.notEqual(page2.keys[0].id,page1.keys[2].id);

 // Habilitar/desabilitar remains reversible; Excluir immediately revokes and
 // hides the key while retaining audit/history and preventing reactivation.
 const originalPaymentAudit=clone(read("premium/orders/"+orderId));
 const deleteIssue=await premium.adminIssuePremiumKey({
   ...adminLive,data:{duration:"15d"}
 });
 const deleteHash=crypto.createHash("sha256").update(deleteIssue.licenseKey).digest("hex");
 await premium.redeemPremiumKey({auth:{uid:"deleteTester"},
   data:{licenseKey:deleteIssue.licenseKey}});
 assert.equal((await premium.checkDistributionAccess({
   auth:{uid:"deleteTester"},data:{versionCode:54328,deviceId:DEVICE_A}})).premium,true);
 await premium.adminSetPremiumKeyEnabled({
   ...adminLive,data:{id:deleteHash,enabled:false}});
 assert.equal((await premium.checkDistributionAccess({
   auth:{uid:"deleteTester"},data:{versionCode:54328,deviceId:DEVICE_A}})).premium,false);
 await premium.adminSetPremiumKeyEnabled({
   ...adminLive,data:{id:deleteHash,enabled:true}});
 assert.equal((await premium.checkDistributionAccess({
   auth:{uid:"deleteTester"},data:{versionCode:54328,deviceId:DEVICE_A}})).premium,true);
 let confirmationDenied=false;
 try{await premium.adminDeletePremiumKey({
   ...adminLive,data:{id:deleteHash,confirm:"SIM"}});}
 catch(e){confirmationDenied=e.code==="invalid-argument";}
 assert.equal(confirmationDenied,true);
 let nonAdminDenied=false;
 try{await premium.adminDeletePremiumKey({
   auth:{uid:"deleteTester"},data:{id:deleteHash,confirm:"EXCLUIR"}});}
 catch(e){nonAdminDenied=e.code==="permission-denied";}
 assert.equal(nonAdminDenied,true);
 const deleted=await premium.adminDeletePremiumKey({
   ...adminLive,data:{id:deleteHash,confirm:"EXCLUIR"}});
 assert.equal(deleted.deleted,true);
 assert.equal(deleted.wasAssigned,true);
 assert.equal(read("premium/keys/"+deleteHash).archived,true);
 assert.equal(read("premium/keys/"+deleteHash).revoked,true);
 assert.equal(read("premium/entitlements/deleteTester").revoked,true);
 const deletedList=await premium.adminListPremiumKeys({
   ...adminLive,data:{limit:50,archived:true}});
 const listed=deletedList.keys.find(row=>row.id===deleteHash);
 assert.equal(listed.googleEmail,"deleteTester@example.org");
 assert.equal(listed.googleName,"");
 assert.equal(listed.uid,"deleteTester");
 const relabeled=await premium.adminLabelPremiumKey({
   ...adminLive,data:{id:deleteHash,label:"Assinante YouTube · João"}});
 assert.equal(relabeled.updated,true);
 const labeledKeys=await premium.adminListPremiumKeys({
   ...adminLive,data:{limit:50,archived:true}});
 const labeledItem=labeledKeys.keys.find(item=>item.id===deleteHash);
 assert.equal(labeledItem.adminLabel,"Assinante YouTube · João");
 assert.equal(labeledItem.googleEmail,"deleteTester@example.org");
 let strangerLabel=false;
 try{await premium.adminLabelPremiumKey({
   auth:{uid:"deleteTester"},data:{id:deleteHash,label:"Roubo"}});}
 catch(error){strangerLabel=error.code==="permission-denied";}
 assert.equal(strangerLabel,true);
 assert.equal((await premium.checkDistributionAccess({
   auth:{uid:"deleteTester"},data:{versionCode:54328,deviceId:DEVICE_A}})).premium,false);
 const activeKeys=await premium.adminListPremiumKeys({
   ...adminLive,data:{limit:50,archived:false}});
 const archivedKeys=await premium.adminListPremiumKeys({
   ...adminLive,data:{limit:50,archived:true}});
 assert.ok(!activeKeys.keys.some(item=>item.id===deleteHash));
 assert.ok(archivedKeys.keys.some(item=>item.id===deleteHash&&
   item.status==="excluída"&&item.editable===false));
 let enabledDeleted=false;
 try{await premium.adminSetPremiumKeyEnabled({
   ...adminLive,data:{id:deleteHash,enabled:true}});}
 catch(e){enabledDeleted=e.code==="failed-precondition";}
 assert.equal(enabledDeleted,true);
 let duplicateDeleted=false;
 try{await premium.adminDeletePremiumKey({
   ...adminLive,data:{id:deleteHash,confirm:"EXCLUIR"}});}
 catch(e){duplicateDeleted=e.code==="failed-precondition";}
 assert.equal(duplicateDeleted,true);
 // Paid order/pix history is never mutated by license deletion.
 assert.deepEqual(read("premium/orders/"+orderId),originalPaymentAudit);
 console.log("PASS per-license reversible suspension, owner-only exclusion and Pix history preservation");
 console.log("PASS admin key inventory pagination, reveal vault, old hash restriction, reversible suspension and duration");

 // Maintenance is a separate global switch, and never changes an entitlement.
 const beforeMaintenance=clone(read("premium/entitlements/namedFriend"));
 await premium.adminSetAppMaintenance({...adminLive,
    data:{enabled:true,message:"Atualização temporária"}});
 assert.equal((await premium.adminPremiumOverview(adminLive)).appMaintenanceEnabled,true);
 assert.equal((await premium.checkDistributionAccess({auth:{uid:"namedFriend"},
    data:{versionCode:54328,deviceId:DEVICE_A}})).allowed,false);
 let paymentPrevented=false;
 try{await premium.createPremiumPix({auth:{uid:"anotherBuyer"},
   data:{versionCode:54328,deviceId:DEVICE_A,email:"someone@example.org"}});}
 catch(error){paymentPrevented=error.code==="failed-precondition";}
 assert.equal(paymentPrevented,true);
 assert.deepEqual(read("premium/entitlements/namedFriend"),beforeMaintenance);
 await premium.adminSetAppMaintenance({...adminLive,data:{enabled:false}});
 assert.equal((await premium.adminPremiumOverview(adminLive)).appMaintenanceEnabled,false);
 await premium.adminSetAppVersionAccess({...adminLive,
  data:{scope:"version",versionCode:54339,versionName:"PokeSearch LT134",enabled:false}});
 let versionState=await premium.adminPremiumOverview(adminLive);
 assert.equal(versionState.appVersions["54339"].enabled,false);
 await premium.adminSetAppVersionAccess({...adminLive,data:{scope:"global",enabled:false}});
 versionState=await premium.adminPremiumOverview(adminLive);
 assert.equal(versionState.appVersionGlobalEnabled,false);
 await premium.adminSetAppVersionAccess({...adminLive,data:{scope:"global",enabled:true}});
 assert.equal((await premium.adminPremiumOverview(adminLive)).appVersionGlobalEnabled,true);
 console.log("PASS separate maintenance, no new payments, unchanged licenses, version and global APK controls");

 // Manual license optional Google email restriction, without storing plaintext.
 const reserved=await premium.adminIssuePremiumKey({
   ...adminLive,data:{duration:"1m",recipientEmail:"Recipient@Example.org",
     recipientName:"João divulgador"}
 });
 assert.equal(reserved.assigned,false);
 assert.equal(reserved.restrictedToEmail,true);
 assert.equal(read("premium/keys/"+crypto.createHash("sha256")
   .update(reserved.licenseKey).digest("hex")).recipientName,"João divulgador");
 const reservedHash=crypto.createHash("sha256").update(reserved.licenseKey).digest("hex");
 const storedReserved=read("premium/keys/"+reservedHash);
 assert.ok(/^[a-f0-9]{64}$/.test(storedReserved.recipientEmailHash));
 assert.equal(storedReserved.recipientEmailHint,"re***@example.org");
 assert.equal(JSON.stringify(storedReserved).includes("recipient@example.org"),false);
 let wrongDenied=false;
 try{await premium.redeemPremiumKey({auth:{uid:"wrongRecipient"},data:{licenseKey:reserved.licenseKey}})}
 catch(error){wrongDenied=error.code==="permission-denied";}
 assert.equal(wrongDenied,true);
 assert.equal(read("premium/keys/"+reservedHash).uid,null);
 const redeemedReserved=await premium.redeemPremiumKey({
   auth:{uid:"recipientUser"},data:{licenseKey:reserved.licenseKey}
 });
 assert.equal(redeemedReserved.activated,true);
 assert.equal(read("premium/keys/"+reservedHash).uid,"recipientUser");
 console.log("PASS manual license reserved for verified Google email, first redemption UID binding");

 // Editable normal/promo prices are server owned and do not mutate prior payment.
 await premium.adminPremiumSettings({...adminLive,data:{
   action:"prices",regularPriceCents:1200,promotionalPriceCents:500
 }});
 let promoOffer=await premium.getPremiumOffer({auth:{uid:"campaignOne"}});
 assert.equal(promoOffer.priceCents,500);
 await premium.adminPremiumSettings({...adminLive,data:{action:"promotion",enabled:false}});
 promoOffer=await premium.getPremiumOffer({auth:{uid:"campaignOne"}});
 assert.equal(promoOffer.priceCents,1200);
 await premium.adminPremiumSettings({...adminLive,data:{action:"promotion",enabled:true}});
 promoOffer=await premium.getPremiumOffer({auth:{uid:"campaignOne"}});
 assert.equal(promoOffer.priceCents,500);
 // A real countdown requires an owner-configured absolute end timestamp.
 const realEnd=Date.now()+3*86400000;
 await premium.adminPremiumSettings({...adminLive,data:{
   action:"promotionDeadline",endsAt:realEnd
 }});
 const timed=await premium.getPremiumOffer({auth:{uid:"campaignOne"}});
 assert.equal(timed.promotionEndsAt,realEnd);
 assert.equal(timed.discountPercent,Math.round(100*(1200-500)/1200));
 await premium.adminPremiumSettings({...adminLive,data:{
   action:"promotionDeadline",endsAt:0
 }});
 assert.equal((await premium.getPremiumOffer({
   auth:{uid:"campaignOne"}})).promotionEndsAt,0);
 console.log("PASS editable prices and independent R$5 promotion enable/disable");

 // FREE campaign is off by default and its duration is chosen by the owner.
 let freeNotEnabled=false;
 try{await premium.claimFreeYear({auth:{uid:"campaignOne"},data:{versionCode:54328,deviceId:DEVICE_A}})}
 catch(error){freeNotEnabled=error.code==="failed-precondition";}
 assert.equal(freeNotEnabled,true);
 const startsAt=Date.now(),endsAt=startsAt+3*86400000;
 await premium.adminPremiumSettings({...adminLive,data:{
   action:"freeYearCampaign",enabled:true,duration:"1m",startsAt,endsAt,maxClaims:2
 }});
 promoOffer=await premium.getPremiumOffer({auth:{uid:"campaignOne"}});
 assert.equal(promoOffer.freeYearCampaign.duration,"1m");
 assert.equal(promoOffer.freeYearCampaign.active,true);
 const firstFree=await premium.claimFreeYear({auth:{uid:"campaignOne"},data:{versionCode:54328,deviceId:DEVICE_A}});
 assert.equal(firstFree.activated,true);
 assert.equal(firstFree.duration,"1m");
 const freeOneExpiry=read("premium/entitlements/campaignOne").expiresAt;
 assert.ok(freeOneExpiry>Date.now()+27*86400000);
 const secondFree=await premium.claimFreeYear({auth:{uid:"campaignTwo"},data:{versionCode:54328,deviceId:DEVICE_A}});
 assert.equal(secondFree.activated,true);
 assert.equal((await premium.getPremiumOffer({auth:{uid:"campaignTwo"}})).freeYearCampaign.active,false);
 let quotaEnforced=false;
 try{await premium.claimFreeYear({auth:{uid:"campaignThree"},data:{versionCode:54328,deviceId:DEVICE_A}})}
 catch(error){quotaEnforced=error.code==="failed-precondition";}
 assert.equal(quotaEnforced,true);
 let repeatClaimBlocked=false;
 try{await premium.claimFreeYear({auth:{uid:"campaignOne"},data:{versionCode:54328,deviceId:DEVICE_A}})}
 catch(error){repeatClaimBlocked=error.code==="failed-precondition";}
 assert.equal(repeatClaimBlocked,true);
 assert.equal(read("premium/entitlements/campaignOne").expiresAt,freeOneExpiry);
 await premium.adminPremiumSettings({...adminLive,data:{action:"freeYearCampaign",enabled:false}});
 assert.equal((await premium.getPremiumOffer({auth:{uid:"campaignTwo"}})).freeYearCampaign.active,false);
 // Existing gifts survive the campaign ending.
 assert.equal((await premium.checkDistributionAccess({
   auth:{uid:"campaignOne"},data:{versionCode:54328,deviceId:DEVICE_A}
 })).premium,true);
 // Separate campaign with lifetime benefit, but no effect until manually enabled.
 await premium.adminPremiumSettings({...adminLive,data:{
   action:"freeYearCampaign",enabled:true,duration:"lifetime",
   startsAt:Date.now(),endsAt:Date.now()+86400000,maxClaims:1
 }});
 const lifetimeFree=await premium.claimFreeYear({auth:{uid:"campaignLifetime"},
   data:{versionCode:54328,deviceId:DEVICE_A}});
 assert.equal(lifetimeFree.activated,true);
 assert.equal(lifetimeFree.lifetime,true);
 assert.equal(read("premium/entitlements/campaignLifetime").lifetime,true);
 assert.equal(read("premium/entitlements/campaignLifetime").expiresAt,null);
 await premium.adminPremiumSettings({...adminLive,data:{action:"freeYearCampaign",enabled:false}});
 console.log("PASS time-bounded quota FREE campaigns with 1m/lifetime, default off and safe shutdown");


 const backupFileHash=crypto.createHash("sha256")
  .update("known-encrypted-test-backup-content").digest("hex");
 // Export ALL Premium sections as paginated, owner-only records. License
 // codes stay sealed; payment history and entitlements keep their identity.
 const sections=["keys","entitlements","orders","orderIndex",
   "paymentIndex","paymentThrottle","coupons","config","distribution","appControl"];
 const snapshot={};
 for(const section of sections){
   let cursor="",pages=0;const combined={};
   do{
     const page=await premium.adminExportPremiumBackupPage({
       auth:{uid:"owner"},data:{section,cursor}});
     assert.equal(page.format,"PokeSearch-Premium-Backup-v1");
     assert.equal(page.projectId,"pokesearch-lt");
     assert.ok(/^[0-9a-f]{64}$/.test(page.vaultFingerprint));
     for(const [key,value] of Object.entries(page.records))
       combined[key]=value;
     cursor=page.nextCursor;
     if(++pages>100)throw Error("Unexpected pagination");
   }while(cursor);
   snapshot[section]=combined;
 }
 assert.ok(Object.keys(snapshot.keys).length>0);
 assert.equal(snapshot.keys[reservedHash].uid,"recipientUser");
 assert.equal(snapshot.keys[reservedHash].vault.ct,storedReserved.vault.ct);
 assert.ok(!JSON.stringify(snapshot).includes(reserved.licenseKey));
 let unauthorizedBackup=false;
 try{await premium.adminExportPremiumBackupPage({
   auth:{uid:"buyer"},data:{section:"keys"}})}
 catch(e){unauthorizedBackup=e.code==="permission-denied";}
 assert.equal(unauthorizedBackup,true);
 const check=await premium.adminExportPremiumBackupPage({
   auth:{uid:"owner"},data:{section:"keys"}});
 let refusedExisting=false;
 try{await premium.adminRestorePremiumBackup({
   auth:{uid:"owner"},data:{phase:"prepare",format:check.format,
     projectId:check.projectId,vaultFingerprint:check.vaultFingerprint,
     backupSha256:backupFileHash,confirm:"IMPORTAR EM BASE VAZIA"}})}
 catch(e){refusedExisting=e.code==="failed-precondition";}
 assert.equal(refusedExisting,true,"Restore must never overwrite existing users");
 console.log("PASS protected full Premium backup, sealed keys, restore refuses live database");

 // Isolated empty database restore at end of test. Preserve key and UID mappings.
 delete store.premium;delete store.distribution;delete store.appControl;
 const preparation=await premium.adminRestorePremiumBackup({
   auth:{uid:"owner"},data:{phase:"prepare",format:check.format,
     projectId:check.projectId,vaultFingerprint:check.vaultFingerprint,
     backupSha256:backupFileHash,confirm:"IMPORTAR EM BASE VAZIA"}});
 assert.ok(/^[0-9a-f-]{36}$/.test(preparation.sessionId));
 const resumed=await premium.adminRestorePremiumBackup({
   auth:{uid:"owner"},data:{phase:"resume",backupSha256:backupFileHash}});
 assert.equal(resumed.sessionId,preparation.sessionId);
 let wrongResume=false;
 try{await premium.adminRestorePremiumBackup({
   auth:{uid:"owner"},data:{phase:"resume",backupSha256:"0".repeat(64)}});}
 catch(e){wrongResume=e.code==="failed-precondition";}
 assert.equal(wrongResume,true);
 for(const section of sections){
   const records=snapshot[section];
   if(["config","distribution","appControl"].includes(section)){
     await premium.adminRestorePremiumBackup({auth:{uid:"owner"},data:{
       phase:"write",sessionId:preparation.sessionId,section,records
     }});
   }else{
     for(const [key,value] of Object.entries(records))
       await premium.adminRestorePremiumBackup({auth:{uid:"owner"},data:{
         phase:"write",sessionId:preparation.sessionId,section,
         records:{[key]:value}
       }});
   }
 }
 const finish=await premium.adminRestorePremiumBackup({
   auth:{uid:"owner"},data:{phase:"finish",sessionId:preparation.sessionId}});
 assert.equal(finish.completed,true);
 assert.equal(read("premium/keys/"+reservedHash).uid,"recipientUser");
 assert.equal(read("premium/config/paymentsLiveEnabled"),false);
 assert.equal(read("premium/config/salesEnabled"),false);
 let rejectedMutation=false;
 try{await premium.adminRestorePremiumBackup({
   auth:{uid:"owner"},data:{phase:"write",sessionId:preparation.sessionId,
     section:"keys",records:{[reservedHash]:{revoked:false}}}})}
 catch(e){rejectedMutation=e.code==="failed-precondition";}
 assert.equal(rejectedMutation,true);
 console.log("PASS safe owner-only restore into empty Firebase, no reactivation of payments");
 console.log("PASS production toggle and signed webhook mode separation"); 
 console.log("PASS premium server integration mock scenarios");
}
run().catch(e=>{console.error(e);process.exitCode=1;});

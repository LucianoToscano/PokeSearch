"use strict";
/**
 * PokeSearch controlled-distribution licensing. All grants are decided server-side.
 * MP credentials, webhook HMAC, and key pepper are Firebase Secret Manager secrets.
 * No CPF, buyer email, or MP access token is stored in RTDB.
 */
const crypto=require("node:crypto");
const useNetlify=process.env.POKE_RUNTIME_TARGET==="netlify";
const {onCall,onRequest,HttpsError}=useNetlify?
  require("../netlify/lib/cloud-compat.cjs"):require("firebase-functions/v2/https");
const {defineSecret}=useNetlify?
  require("../netlify/lib/cloud-compat.cjs"):require("firebase-functions/params");
const {getDatabase}=require("firebase-admin/database");
const {getAuth}=require("firebase-admin/auth");
const {initializeApp,getApps}=require("firebase-admin/app");
if(!getApps().length&&!useNetlify)initializeApp();

// The live token cannot be used unless explicitly enabled by server policy.
const MP_TOKEN=defineSecret("POKE_MP_ACCESS_TOKEN");
const MP_TEST_TOKEN=defineSecret("POKE_MP_TEST_ACCESS_TOKEN");
const MP_WEBHOOK_SECRET=defineSecret("POKE_MP_WEBHOOK_SECRET");
const MP_LIVE_WEBHOOK_SECRET=defineSecret("POKE_MP_LIVE_WEBHOOK_SECRET");
const MP_WEBHOOK_URL=defineSecret("POKE_MP_WEBHOOK_URL");
const KEY_SECRET=defineSecret("POKE_PREMIUM_KEY_SECRET");
const REGION="us-central1", MONTH=30*24*60*60*1000;
const NORMAL_CENTS=1000, PROMO_CENTS=500;
const ADMIN_DURATIONS=Object.freeze(["15d","30d","1m","3m","6m","12m","lifetime"]);
const root=()=>getDatabase().ref("premium");
const policy=()=>getDatabase().ref("distribution");
const sha=value=>crypto.createHash("sha256").update(value).digest("hex");
const digits=value=>String(value||"").replace(/\D/g,"");
const requireUser=request=>{
 if(!request.auth?.uid)throw new HttpsError("unauthenticated","É necessário autenticar no PokeSearch.");
 return request.auth.uid;
};
const requireAdmin=async request=>{
 const uid=requireUser(request);
 const record=await getAuth().getUser(uid);
 if(record.customClaims?.pokesearchAdmin!==true)
   throw new HttpsError("permission-denied","Somente o administrador pode alterar licenças.");
 return uid;
};
const isValidCode=code=>Number.isInteger(code)&&code>0&&code<=2100000000;
const currentPolicy=async(code)=>{
 const snap=await policy().get(),p=snap.val()||{};
 return p.globalEnabled===true&&p.versions&&p.versions[String(code)]===true;
};
const userEntitlement=async uid=>{
 const value=(await root().child("entitlements").child(uid).get()).val()||{};
 if(value.revoked===true||!/^[0-9a-f]{64}$/.test(String(value.currentKeyHash||"")))return false;
 const key=(await root().child("keys").child(value.currentKeyHash).get()).val();
 if(key?.uid!==uid||key.revoked===true||key.suspended===true)return false;
 if(value.lifetime===true)return key.kind==="manual"||key.kind==="lifetime";
 return Number(value.expiresAt||0)>Date.now()&&Number(key.expiresAt||0)>Date.now();
};
const offer=config=>{
 const regular=Number(config.regularPriceCents??NORMAL_CENTS);
 const promotional=Number(config.promotionalPriceCents??PROMO_CENTS);
 const promotionEnabled=config.promotionEnabled!==false;
 return {regularPriceCents:regular,promotionalPriceCents:promotional,promotionEnabled,
   priceCents:promotionEnabled?promotional:regular};
};
const grantYearFrom=ms=>{
 const date=new Date(ms);
 date.setUTCFullYear(date.getUTCFullYear()+1);
 return date.getTime();
};
const formatKey=(orderId)=>{
 const hex=crypto.createHmac("sha256",KEY_SECRET.value()).update(orderId).digest("hex").slice(0,24).toUpperCase();
 return "PS-"+hex.match(/.{1,6}/g).join("-");
};
/** Admin-only key vault for NEW manually issued codes.
 * Previous manual plaintext was deliberately never stored and cannot be recovered.
 * Purpose-separated AES key derived from the existing protected signing secret.
 */
const codePattern=/^PS-([0-9A-F]{6}-){3}[0-9A-F]{6}$/;
const vaultKey=()=>crypto.createHash("sha256").update("pokesearch-manual-key-vault-v1:")
 .update(KEY_SECRET.value()).digest();
function sealCode(code){
 if(!codePattern.test(code))throw new Error("Invalid license format");
 const iv=crypto.randomBytes(12);
 const cipher=crypto.createCipheriv("aes-256-gcm",vaultKey(),iv);
 const encrypted=Buffer.concat([cipher.update(code,"utf8"),cipher.final()]);
 return {v:1,iv:iv.toString("base64"),ct:encrypted.toString("base64"),
   tag:cipher.getAuthTag().toString("base64")};
}
function unsealCode(sealed){
 if(!sealed||sealed.v!==1)throw new Error("Key was not backed up");
 const decipher=crypto.createDecipheriv("aes-256-gcm",vaultKey(),
   Buffer.from(sealed.iv,"base64"));
 decipher.setAuthTag(Buffer.from(sealed.tag,"base64"));
 const plain=Buffer.concat([decipher.update(Buffer.from(sealed.ct,"base64")),decipher.final()])
   .toString("utf8");
 if(!codePattern.test(plain))throw new Error("Invalid stored code");
 return plain;
}

const requestPayment=async(endpoint,liveMode,options={})=>{
 const token=liveMode?MP_TOKEN.value():MP_TEST_TOKEN.value();
 if(!token)throw new Error("Mercado Pago credentials missing");
 const response=await fetch("https://api.mercadopago.com"+endpoint,{
   ...options,
   headers:{"Authorization":"Bearer "+token,
      ...(options.body?{"Content-Type":"application/json"}:{}),
      ...(options.headers||{})},
   signal:AbortSignal.timeout(12000)
 });
 const raw=await response.text();
 let value;try{value=JSON.parse(raw)}catch{value={}};
 if(!response.ok)throw new Error("Mercado Pago HTTP "+response.status);
 return value;
};
/** Every activation requires a fresh GET /v1/orders/{id}, never webhook body fields. */
async function settleOrderPayment(mpOrderId){
 if(!/^ORD[A-Za-z0-9_-]{10,90}$/.test(String(mpOrderId)))return false;
 const linked=(await root().child("orderIndex").child(mpOrderId).get()).val();
 if(!linked||!/^[0-9a-f-]{36}$/.test(String(linked.orderId||"")))return false;
 const orderId=linked.orderId;
 const ref=root().child("orders").child(orderId),stored=(await ref.get()).val();
 if(!stored||stored.mpOrderId!==mpOrderId||!stored.uid)return false;
 const marketOrder=await requestPayment("/v1/orders/"+encodeURIComponent(mpOrderId),stored.liveMode===true);
 const [transaction]=marketOrder.transactions?.payments||[];
 const amount=Number(marketOrder.total_amount),paid=Number(transaction?.amount);
 if(marketOrder.id!==mpOrderId||
    marketOrder.external_reference!==orderId||
    marketOrder.type!=="online"||marketOrder.live_mode!==(stored.liveMode===true)||
    Math.round(amount*100)!==stored.priceCents||
    Math.round(paid*100)!==stored.priceCents||
    (marketOrder.transactions?.payments||[]).length!==1||
    transaction.payment_method?.id!=="pix"||
    transaction.payment_method?.type!=="bank_transfer")return false;
 const reversed=["refunded","charged_back"].includes(marketOrder.status)||
   ["refunded","charged_back"].includes(transaction.status)||
   marketOrder.status_detail==="partially_refunded"||
   transaction.status_detail==="partially_refunded";
 if(reversed){
   await ref.update({status:marketOrder.status});
   const hash=sha(formatKey(orderId)),keyRef=root().child("keys").child(hash);
   const key=(await keyRef.get()).val();
   if(key)await keyRef.update({revoked:true,revokedAt:Date.now()});
   for(const affected of new Set([stored.uid,key?.uid].filter(Boolean))){
     const entRef=root().child("entitlements").child(affected);
     await entRef.transaction(value=>{
       if(!value||value.currentKeyHash!==hash||value.lifetime===true)return;
       return {...value,revoked:true,revocationReason:"payment_reversed",revokedAt:Date.now()};
     },undefined,false);
   }
   return false;
 }
 if(marketOrder.status!=="processed"||marketOrder.status_detail!=="accredited"||
    transaction.status!=="processed"||transaction.status_detail!=="accredited")return false;
 const entRef=root().child("entitlements").child(stored.uid);
 const now=Date.now(),billingStart=now;
 const key=formatKey(orderId),hash=sha(key);
 const transactionResult=await entRef.transaction(old=>{
   const v=old&&typeof old==="object"?old:{};
   const paidOrders=v.paidOrders&&typeof v.paidOrders==="object"?v.paidOrders:{};
   if(paidOrders[orderId]||v.revoked===true)return;
   paidOrders[orderId]=true;
   if(v.lifetime===true)return {...v,paidOrders};
   return {...v,paidOrders,kind:"paid",
     expiresAt:Math.max(billingStart,Number(v.expiresAt)||0)+MONTH,currentKeyHash:hash};
 },undefined,false);
 const ent=transactionResult.snapshot?.val()||{};
 if(!ent.paidOrders?.[orderId])return false;
 await root().child("keys").child(hash).transaction(value=>
   value||{kind:"paid",orderId,uid:stored.uid,expiresAt:ent.expiresAt,
     createdAt:now,transferred:false},undefined,false);
 await ref.update({status:"approved",licensed:true,approvedAt:now});
 return true;
}

/** Payments API /v1/payments. Old Orders records remain supported separately.
 * No license is granted from webhook JSON: always fetch the payment from MP.
 */
async function settlePixPayment(mpPaymentId,expectedLiveMode=null){
 const id=String(mpPaymentId||"");
 if(!/^[0-9]{1,24}$/.test(id))return false;
 const indexed=(await root().child("paymentIndex").child(id).get()).val();
 if(!indexed||!/^[0-9a-f-]{36}$/.test(String(indexed.orderId||"")))return false;
 const orderId=indexed.orderId;
 const ref=root().child("orders").child(orderId),stored=(await ref.get()).val();
 if(!stored||stored.mpPaymentId!==id||stored.processor!=="payments"||!stored.uid||
    (typeof expectedLiveMode==="boolean"&&stored.liveMode!==expectedLiveMode))return false;
 const payment=await requestPayment("/v1/payments/"+id,stored.liveMode===true);
 if(String(payment.id)!==id||payment.external_reference!==orderId||
    payment.payment_method_id!=="pix"||payment.currency_id!=="BRL"||
    payment.live_mode!==(stored.liveMode===true)||
    !Number.isFinite(Number(payment.transaction_amount))||
    Math.round(Number(payment.transaction_amount)*100)!==stored.priceCents)return false;
 if(["refunded","charged_back"].includes(payment.status)){
   await ref.update({status:payment.status});
   const hash=sha(formatKey(orderId)),keyRef=root().child("keys").child(hash);
   const key=(await keyRef.get()).val();
   if(key)await keyRef.update({revoked:true,revokedAt:Date.now()});
   for(const uid of new Set([stored.uid,key?.uid].filter(Boolean))){
     const entRef=root().child("entitlements").child(uid);
     await entRef.transaction(v=>{
       if(!v||v.currentKeyHash!==hash||v.lifetime===true)return;
       return {...v,revoked:true,revocationReason:"payment_reversed",revokedAt:Date.now()};
     },undefined,false);
   }
   return false;
 }
 if(payment.status!=="approved"||payment.status_detail!=="accredited")return false;
 const now=Date.now(),hash=sha(formatKey(orderId));
 const entRef=root().child("entitlements").child(stored.uid);
 const result=await entRef.transaction(old=>{
   const v=old&&typeof old==="object"?old:{};
   const paidOrders=v.paidOrders&&typeof v.paidOrders==="object"?v.paidOrders:{};
   if(paidOrders[orderId]||v.revoked===true)return;
   paidOrders[orderId]=true;
   if(v.lifetime===true)return {...v,paidOrders};
   return {...v,paidOrders,kind:"paid",expiresAt:Math.max(now,Number(v.expiresAt)||0)+MONTH,
     currentKeyHash:hash};
 },undefined,false);
 const ent=result.snapshot?.val()||{};
 if(!ent.paidOrders?.[orderId])return false;
 await root().child("keys").child(hash).transaction(v=>
   v||{kind:"paid",orderId,uid:stored.uid,expiresAt:ent.expiresAt,createdAt:now,transferred:false},
   undefined,false);
 await ref.update({status:"approved",licensed:true,approvedAt:now});
 return true;
}
async function settlePayment(id,expectedLiveMode=null){
 if(/^ORD[A-Za-z0-9_-]{10,90}$/.test(String(id)))
   return expectedLiveMode===true?false:settleOrderPayment(id);
 return settlePixPayment(id,expectedLiveMode);
}
function signatureValid(req){
 const signature=String(req.get("x-signature")||"");
 const requestId=String(req.get("x-request-id")||"");
 const id=String(req.query["data.id"]||req.query.id||"");
 const ts=(signature.match(/(?:^|,)ts=(\d+)(?:,|$)/)||[])[1];
 const hash=(signature.match(/(?:^|,)v1=([0-9a-f]{64})(?:,|$)/i)||[])[1];
 if(!ts||!hash||!requestId||!(/^[0-9]{1,24}$/.test(id)||/^ORD[A-Za-z0-9_-]{10,90}$/.test(id)))return false;
 const millis=Number(ts)>1e12?Number(ts):Number(ts)*1000;
 if(!Number.isFinite(millis)||Math.abs(Date.now()-millis)>10*60*1000)return false;
 const manifest="id:"+id.toLowerCase()+";request-id:"+requestId+";ts:"+ts+";";
 const secret=req.liveModeWebhook===true?MP_LIVE_WEBHOOK_SECRET.value():MP_WEBHOOK_SECRET.value();
 if(!secret)return false;
 const calculated=crypto.createHmac("sha256",secret).update(manifest).digest();
 return crypto.timingSafeEqual(calculated,Buffer.from(hash,"hex"));
}
exports.checkDistributionAccess=onCall({region:REGION},async request=>{
 const uid=requireUser(request),code=Number(request.data?.versionCode);
 if(!isValidCode(code))throw new HttpsError("invalid-argument","Versão inválida.");
 const enabled=await currentPolicy(code);
 const premium=enabled&&await userEntitlement(uid);
 return {allowed:enabled,premium,serverNow:Date.now()};
});
exports.createPremiumPix=onCall({region:REGION,
 secrets:[MP_TOKEN,MP_TEST_TOKEN]},async request=>{
 const uid=requireUser(request),email=String(request.data?.email||"").trim().toLowerCase();
 const code=Number(request.data?.versionCode);
 if(!isValidCode(code)||!await currentPolicy(code))
   throw new HttpsError("failed-precondition","Esta versão não está liberada.");
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>120)
   throw new HttpsError("invalid-argument","Informe um e-mail válido.");
 const config=(await root().child("config").get()).val()||{};
 const price=offer(config).priceCents;
 // Separate test/production tokens: production cannot be selected by the app.
 const liveMode=config.paymentsLiveEnabled===true;
 if(liveMode&&(!MP_TOKEN.value()||!MP_LIVE_WEBHOOK_SECRET.value()))
   throw new HttpsError("failed-precondition","Credenciais de produção incompletas.");
 if(config.salesEnabled!==true||!Number.isSafeInteger(price)||price<100||price>100000)
   throw new HttpsError("failed-precondition","Vendas desativadas ou preço não configurado.");
 const createdAt=Date.now();
 const throttle=await root().child("paymentThrottle").child(uid).transaction(value=>{
   if(value&&Number(value.lastAt||0)>createdAt-60000)return;
   return {lastAt:createdAt};
 },undefined,false);
 if(!throttle.committed)
   throw new HttpsError("resource-exhausted","Aguarde um minuto antes de gerar outro Pix.");
 const orderId=crypto.randomUUID();
 const ref=root().child("orders").child(orderId);
 await ref.set({uid,priceCents:price,versionCode:code,status:"creating",createdAt,liveMode});
 try{
   const amount=(price/100).toFixed(2);
   const mpPayment=await requestPayment("/v1/payments",liveMode,{
     method:"POST",headers:{"X-Idempotency-Key":orderId},
     body:JSON.stringify({
       transaction_amount:Number(amount),description:"PokeSearch Premium - Pokebola 2 - 30 dias",
       payment_method_id:"pix",external_reference:orderId,payer:{email}
     })
   });
   const qr=mpPayment.point_of_interaction?.transaction_data?.qr_code;
   const mpPaymentId=String(mpPayment.id||"");
   if(!/^[0-9]{1,24}$/.test(mpPaymentId)||typeof qr!=="string"||!qr)
     throw new Error("Mercado Pago payment has no Pix");
   await ref.update({mpPaymentId,processor:"payments",status:"pending"});
   await root().child("paymentIndex").child(mpPaymentId).set({orderId});
   return {orderId,pixCode:qr,priceCents:price,status:"pending"};
 }catch(error){
   await ref.update({status:"error"});
   throw new HttpsError("unavailable","Não foi possível gerar o Pix. Tente novamente.");
 }
});
exports.premiumPixWebhook=onRequest({region:REGION,
 secrets:[MP_TOKEN,MP_TEST_TOKEN,MP_WEBHOOK_SECRET,MP_LIVE_WEBHOOK_SECRET,KEY_SECRET]},async(req,res)=>{
 if(req.method!=="POST"){res.status(405).send("method");return;}
 if(!signatureValid(req)){res.status(401).send("signature");return;}
 const paymentId=String(req.query["data.id"]||req.query.id||"");
 const topic=String(req.query.type||"");
 if(!((topic==="payment"&&/^[0-9]{1,24}$/.test(paymentId))||
       (topic==="order"&&/^ORD[A-Za-z0-9_-]{10,90}$/.test(paymentId)))){
   res.status(400).send("topic");return;
 }
 try{await settlePayment(paymentId,req.liveModeWebhook===true);res.status(200).send("ok");}
 catch(error){console.error("Premium webhook reconciliation failed",error.message);res.status(503).send("retry");}
});
exports.getPremiumOrder=onCall({region:REGION,secrets:[MP_TOKEN,MP_TEST_TOKEN,KEY_SECRET]},async request=>{
 const uid=requireUser(request),orderId=String(request.data?.orderId||"");
 if(!/^[0-9a-f-]{36}$/.test(orderId))
  throw new HttpsError("invalid-argument","Pedido inválido.");
 const ref=root().child("orders").child(orderId),o=(await ref.get()).val();
 if(!o||o.uid!==uid)throw new HttpsError("permission-denied","Pedido não pertence a esta conta.");
 if(o.status==="pending"&&(o.mpPaymentId||o.mpOrderId)){
   // Recover missed webhooks by fetching the authoritative payment/order.
   await settlePayment(o.mpPaymentId||o.mpOrderId);
 }
 const current=(await ref.get()).val()||{};
 const status=current.status==="approved"&&current.licensed?"approved":current.status;
 const entitlement=(await root().child("entitlements").child(uid).get()).val()||{};
 return {status,licenseKey:status==="approved"?formatKey(orderId):null,
   expiresAt:status==="approved"?Number(entitlement.expiresAt||0):0};
});
exports.adminDistributionControl=onCall({region:REGION},async request=>{
 await requireAdmin(request);
 const data=request.data||{},code=Number(data.versionCode);
 if(typeof data.enabled!=="boolean"||
   !(data.scope==="global"||(data.scope==="version"&&isValidCode(code))))
   throw new HttpsError("invalid-argument","Parâmetros inválidos.");
 if(data.scope==="global")await policy().child("globalEnabled").set(data.enabled);
 else await policy().child("versions").child(String(code)).set(data.enabled);
 return {updated:true,serverNow:Date.now()};
});

exports.adminPremiumSettings=onCall({region:REGION},async request=>{
 await requireAdmin(request);
 const input=request.data||{};
 if(input.action==="price"||input.action==="regularPrice"||input.action==="promotionalPrice"){
   const cents=Number(input.priceCents);
   if(!Number.isSafeInteger(cents)||cents<100||cents>100000)
     throw new HttpsError("invalid-argument","Preço inválido.");
   const field=input.action==="promotionalPrice"?"promotionalPriceCents":"regularPriceCents";
   await root().child("config").child(field).set(cents);
 }else if(input.action==="promotion"){
   if(typeof input.enabled!=="boolean")throw new HttpsError("invalid-argument","Promoção inválida.");
   await root().child("config").child("promotionEnabled").set(input.enabled);
 }else if(input.action==="sales"){
   if(typeof input.enabled!=="boolean")throw new HttpsError("invalid-argument","Valor inválido.");
   await root().child("config").child("salesEnabled").set(input.enabled);
 }else if(input.action==="paymentsLive"){
   if(typeof input.enabled!=="boolean")throw new HttpsError("invalid-argument","Valor inválido.");
   if(input.enabled&&(!MP_TOKEN.value()||!MP_LIVE_WEBHOOK_SECRET.value()))
     throw new HttpsError("failed-precondition","Configure Access Token e Webhook de produção no servidor.");
   await root().child("config").child("paymentsLiveEnabled").set(input.enabled);
 }else if(input.action==="revoke"){
   const uid=String(input.uid||"");
   if(!/^[A-Za-z0-9_-]{8,128}$/.test(uid))throw new HttpsError("invalid-argument","UID inválido.");
   await root().child("entitlements").child(uid).update({
     revoked:input.revoked!==false,revokedAt:Date.now(),revocationReason:"admin"
   });
 }else throw new HttpsError("invalid-argument","Ação inválida.");
 return {updated:true};
});
exports.adminPremiumOverview=onCall({region:REGION},async request=>{
 await requireAdmin(request);
 const [dist,cfg,maintenance]=await Promise.all([
   policy().get(),root().child("config").get(),getDatabase().ref("appControl/maintenance").get()
 ]);
 const p=dist.val()||{},c=cfg.val()||{},m=maintenance.val()||{};
 return {globalEnabled:p.globalEnabled===true,versions:p.versions||{},
   salesEnabled:c.salesEnabled===true,paymentsLiveEnabled:c.paymentsLiveEnabled===true,
   appMaintenanceEnabled:m.enabled===true,appMaintenanceMessage:String(m.message||""),
   ...offer(c),durationOptions:ADMIN_DURATIONS};
});


/** Price displayed before generating any charge. Client-provided price is NEVER trusted. */
exports.getPremiumOffer=onCall({region:REGION},async request=>{
 requireUser(request);
 const cfg=(await root().child("config").get()).val()||{};
 return {...offer(cfg),salesEnabled:cfg.salesEnabled===true,serverNow:Date.now()};
});

/** Each individually chosen license is controlled only by its administrator.
 * 15 days, 1/3/6/12 calendar months and lifetime; NO quantity or sponsor quota.
 */
function periodExpiry(start,duration){
 if(duration==="lifetime")return null;
 if(duration==="15d")return start+15*86400000;
 if(duration==="30d")return start+30*86400000;
 const months={"1m":1,"3m":3,"6m":6,"12m":12}[duration];
 if(!months)throw new HttpsError("invalid-argument","Duração desconhecida.");
 const date=new Date(start),day=date.getUTCDate();
 const firstOfTarget=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+months,1,
   date.getUTCHours(),date.getUTCMinutes(),date.getUTCSeconds(),date.getUTCMilliseconds()));
 const endOfMonth=new Date(Date.UTC(firstOfTarget.getUTCFullYear(),
   firstOfTarget.getUTCMonth()+1,0)).getUTCDate();
 firstOfTarget.setUTCDate(Math.min(day,endOfMonth));
 return firstOfTarget.getTime();
}
const validUid=uid=>/^[A-Za-z0-9_-]{5,128}$/.test(uid);
/** Only admin can create a license. Unassigned codes start when recipient redeems.
 * Providing uid assigns immediately; extend=true adds time to current expiry.
 * Plaintext is returned ONCE and never stored on Firebase. Treat it like a password.
 */
exports.adminIssuePremiumKey=onCall({region:REGION,secrets:[KEY_SECRET]},async request=>{
 const actor=await requireAdmin(request),args=request.data||{};
 const duration=String(args.duration||"").trim(),targetUid=String(args.uid||"").trim();
 if(!ADMIN_DURATIONS.includes(duration))
   throw new HttpsError("invalid-argument","Selecione 15 ou 30 dias, 1, 3, 6, 12 meses ou vitalícia.");
 if(targetUid&&!validUid(targetUid))
   throw new HttpsError("invalid-argument","UID do beneficiário inválido.");
 const now=Date.now(),plain=formatKey("admin:"+crypto.randomUUID());
 const hash=sha(plain),ref=root().child("keys").child(hash);
 const entRef=targetUid?root().child("entitlements").child(targetUid):null;
 let oldEnt={};
 if(entRef){
   oldEnt=(await entRef.get()).val()||{};
   if(oldEnt.revoked===true)
     throw new HttpsError("failed-precondition","Esta licença está bloqueada. Reative o usuário primeiro.");
 }
 const base=args.extend===true&&targetUid?
   Math.max(now,Number(oldEnt.expiresAt||0)):now;
 const expiry=periodExpiry(base,duration);
 await ref.set({kind:"manual",duration,uid:targetUid||null,createdBy:actor,vault:sealCode(plain),
   createdAt:now,revoked:false,...(targetUid?
   {claimedAt:now,...(expiry===null?{}:{expiresAt:expiry})}:{})});
 if(targetUid){
   const result=await entRef.transaction(old=>{
     const value=old&&typeof old==="object"?old:{};
     if(value.revoked===true)return;
     // Extending an existing lifetime remains lifetime until explicitly replaced.
     if(args.extend===true&&value.lifetime===true)return;
     return {...value,kind:"manual",lifetime:duration==="lifetime",
       currentKeyHash:hash,expiresAt:expiry};
   },undefined,false);
   if(!result.committed||result.snapshot.val()?.currentKeyHash!==hash){
     await ref.update({revoked:true});
     throw new HttpsError("failed-precondition","Licença não alterada.");
   }
   if(oldEnt.currentKeyHash&&oldEnt.currentKeyHash!==hash){
     await root().child("keys").child(oldEnt.currentKeyHash).update({revoked:true,replacedBy:hash});
   }
 }
 return {licenseKey:plain,duration,lifetime:expiry===null,expiresAt:expiry,
   assigned:!!targetUid,uid:targetUid||null,serverNow:Date.now()};
});

/** Read-only, admin-only state for a user-pasted license code.
 * Never disclose the database hash, claimant UID or any stored key details.
 */
exports.adminPremiumKeyStatus=onCall({region:REGION},async request=>{
 await requireAdmin(request);
 const code=String(request.data?.licenseKey||"").trim().toUpperCase();
 if(!/^PS-([0-9A-F]{6}-){3}[0-9A-F]{6}$/.test(code))
   throw new HttpsError("invalid-argument","Formato de chave inválido.");
 const entry=(await root().child("keys").child(sha(code)).get()).val();
 return {status:!entry?"notFound":entry.kind!=="manual"?"notManual":
     entry.revoked===true?"revoked":"active",
   assigned:entry?.kind==="manual"&&!!entry?.uid};
});

/** Administrator can invalidate a manually issued key when it was exposed or
 * issued by mistake. The hashed key is stored server-side and can never be reused.
 * If previously claimed, its current entitlement is also revoked conditionally.
 * Never accept client-supplied UID when revoking a code.
 */
exports.adminRevokePremiumKey=onCall({region:REGION},async request=>{
 const actor=await requireAdmin(request);
 const code=String(request.data?.licenseKey||"").trim().toUpperCase();
 if(!/^PS-([0-9A-F]{6}-){3}[0-9A-F]{6}$/.test(code))
   throw new HttpsError("invalid-argument","Formato de chave inválido.");
 const hash=sha(code),keyRef=root().child("keys").child(hash);
 const existing=(await keyRef.get()).val();
 if(!existing||existing.kind!=="manual")
   throw new HttpsError("not-found","Código não corresponde a uma licença manual registrada.");
 if(existing.revoked===true)
   return {revoked:true,alreadyRevoked:true,wasAssigned:!!existing.uid};
 const timestamp=Date.now();
 const revoked=await keyRef.transaction(value=>{
   const current=value===null?existing:value;
   if(!current||current.kind!=="manual"||current.revoked===true)return;
   return {...current,revoked:true,revokedAt:timestamp,
     revokedBy:actor,revocationReason:"admin"};
 },undefined,false);
 if(!revoked.committed){
   const now=(await keyRef.get()).val();
   if(now?.revoked===true)
     return {revoked:true,alreadyRevoked:true,wasAssigned:!!now.uid};
   throw new HttpsError("aborted","Código alterado durante o cancelamento. Tente novamente.");
 }
 const assignedUid=String(revoked.snapshot.val()?.uid||"");
 if(assignedUid){
   const entRef=root().child("entitlements").child(assignedUid);
   const cached=(await entRef.get()).val();
   await entRef.transaction(value=>{
     const current=value===null?cached:value;
     if(!current||current.currentKeyHash!==hash)return;
     return {...current,revoked:true,revokedAt:timestamp,
       revocationReason:"admin"};
   },undefined,false);
 }
 return {revoked:true,alreadyRevoked:false,wasAssigned:!!assignedUid,serverNow:Date.now()};
});

/** Redeem user-held code once, except paid-code recovery which supports one transfer.
 * Manual keys do not expire before first use. Expiry begins at redemption.
 */
exports.redeemPremiumKey=onCall({region:REGION},async request=>{
 const uid=requireUser(request),code=String(request.data?.licenseKey||"").trim().toUpperCase();
 if(!/^PS-([0-9A-F]{6}-){3}[0-9A-F]{6}$/.test(code))
   throw new HttpsError("invalid-argument","Formato de chave inválido.");
 const hash=sha(code),keyRef=root().child("keys").child(hash);
 let entry=(await keyRef.get()).val();
 if(!entry||entry.revoked===true)
   throw new HttpsError("not-found","Chave inexistente ou bloqueada.");
 if(entry.kind==="manual"){
   if(entry.uid&&entry.uid!==uid)
     throw new HttpsError("permission-denied","Esta chave já foi ativada em outra conta.");
   const before=(await root().child("entitlements").child(uid).get()).val()||{};
   if(before.revoked===true)
     throw new HttpsError("failed-precondition","Sua conta está bloqueada pelo administrador.");
   if(before.lifetime===true&&entry.duration!=="lifetime")
     throw new HttpsError("failed-precondition","Esta conta já tem uma licença vitalícia.");
   if(entry.uid===uid&&before.currentKeyHash!==hash)
     throw new HttpsError("failed-precondition","Esta chave foi substituída por outra licença.");
   const now=Date.now(),start=Math.max(now,Number(before.expiresAt||0));
   const claimed=await keyRef.transaction(value=>{
     const current=value===null?entry:value;
     if(!current||current.revoked===true||current.kind!=="manual"||
        current.uid&&current.uid!==uid)return;
     if(current.uid===uid)return current;
     const expiry=periodExpiry(start,current.duration);
     return {...current,uid,claimedAt:now,...(expiry===null?{}:{expiresAt:expiry})};
   },undefined,false);
   entry=claimed.snapshot.val();
   if(!claimed.committed||entry?.uid!==uid)
     throw new HttpsError("permission-denied","Chave já utilizada.");
   const lifetime=entry.duration==="lifetime";
   const entRef=root().child("entitlements").child(uid);
   const applied=await entRef.transaction(old=>{
     const v=old&&typeof old==="object"?old:{};
     if(v.revoked===true)return;
     if(v.lifetime===true&& !lifetime)return v;
     return {...v,kind:"manual",lifetime,
       expiresAt:lifetime?null:Math.max(Number(v.expiresAt||0),Number(entry.expiresAt||0)),
       currentKeyHash:hash};
   },undefined,false);
   if(!applied.committed||!await userEntitlement(uid))
     throw new HttpsError("failed-precondition","Não foi possível ativar a licença.");
   if(before.currentKeyHash&&before.currentKeyHash!==hash)
     await root().child("keys").child(before.currentKeyHash).update({revoked:true,replacedBy:hash});
   return {activated:true,duration:entry.duration,lifetime,expiresAt:lifetime?null:entry.expiresAt};
 }
 // Paid keys stay redeemable for renewal/recovery of the same purchase.
 if(Number(entry.expiresAt||0)<=Date.now())
   throw new HttpsError("not-found","Chave vencida.");
 const oldUid=String(entry.uid||"");
 if(!oldUid)throw new HttpsError("failed-precondition","Chave indisponível.");
 if(oldUid!==uid){
   const oldEnt=(await root().child("entitlements").child(oldUid).get()).val()||{};
   if(oldEnt.currentKeyHash!==hash||oldEnt.revoked===true||entry.transferred===true)
     throw new HttpsError("permission-denied","Esta chave já foi transferida ou substituída.");
   const moved=await keyRef.transaction(value=>{
     if(!value||value.uid!==oldUid||value.transferred===true||
        value.revoked===true||value.expiresAt<=Date.now())return;
     return {...value,uid,transferred:true,transferredAt:Date.now()};
   },undefined,false);
   if(!moved.committed||moved.snapshot.val()?.uid!==uid)
     throw new HttpsError("aborted","Chave em processamento.");
 }
 entry=(await keyRef.get()).val();
 if(entry?.uid!==uid)throw new HttpsError("permission-denied","Chave inválida.");
 const target=root().child("entitlements").child(uid);
 await target.transaction(v=>{
   const current=v&&typeof v==="object"?v:{};
   if(current.revoked===true)return;
   if(current.lifetime===true)return current;
   return {...current,kind:"paid",lifetime:false,
     expiresAt:Math.max(Number(current.expiresAt)||0,Number(entry.expiresAt)||0),
     currentKeyHash:hash};
 },undefined,false);
 if(!await userEntitlement(uid))
   throw new HttpsError("failed-precondition","Licença bloqueada.");
 return {activated:true,lifetime:false,expiresAt:Number(entry.expiresAt)};
});

/** Admin can extend by days or set an exact UTC expiry, without issuing a new key.
 * Lifetime grants remain permanent until revoked by the administrator.
 */
exports.adminAdjustPremiumExpiry=onCall({region:REGION},async request=>{
 await requireAdmin(request);
 const uid=String(request.data?.uid||""),action=String(request.data?.action||"");
 if(!/^[A-Za-z0-9_-]{5,128}$/.test(uid))
   throw new HttpsError("invalid-argument","UID inválido.");
 const entitlement=root().child("entitlements").child(uid);
 const current=(await entitlement.get()).val()||{};
 if(current.revoked===true||current.lifetime===true||!current.currentKeyHash)
   throw new HttpsError("failed-precondition","Licença finita inexistente, bloqueada ou vitalícia.");
 const key=root().child("keys").child(current.currentKeyHash);
 const record=(await key.get()).val()||{};
 if(record.uid!==uid||record.revoked===true)
   throw new HttpsError("failed-precondition","Chave inválida.");
 const now=Date.now();let target=0;
 if(action==="extendDays"){
   const days=Number(request.data?.days);
   if(!Number.isInteger(days)||days<1||days>36500)
     throw new HttpsError("invalid-argument","Informe de 1 a 36500 dias.");
   target=Math.max(now,Number(current.expiresAt||0))+days*86400000;
 }else if(action==="setExpiresAt"){
   target=Number(request.data?.expiresAt);
   if(!Number.isSafeInteger(target)||target<=now||target>now+36500*86400000)
     throw new HttpsError("invalid-argument","Data de vencimento inválida.");
 }else throw new HttpsError("invalid-argument","Ação inválida.");
 // Do not decrease an existing grant. Update the backing key first, fail closed.
 if(target<Number(current.expiresAt||0))
   throw new HttpsError("failed-precondition","A data nova não pode reduzir a licença.");
 const updated=await key.transaction(v=>{
   if(!v||v.uid!==uid||v.revoked===true)return;
   return {...v,expiresAt:Math.max(Number(v.expiresAt||0),target)};
 },undefined,false);
 if(!updated.committed)throw new HttpsError("aborted","Chave alterada durante a operação.");
 await entitlement.transaction(v=>{
   if(!v||v.currentKeyHash!==current.currentKeyHash||v.revoked===true||v.lifetime===true)return;
   return {...v,expiresAt:Math.max(Number(v.expiresAt||0),target)};
 },undefined,false);
 if(!await userEntitlement(uid))throw new HttpsError("failed-precondition","Licença não confirmada.");
 return {updated:true,expiresAt:target,serverNow:Date.now()};
});


/** Owner-only paginated inventory; returns no plaintext code or encryption material. */
exports.adminListPremiumKeys=onCall({region:REGION},async request=>{
 await requireAdmin(request);
 const pageSize=Number(request.data?.limit||40);
 if(!Number.isInteger(pageSize)||pageSize<1||pageSize>50)
   throw new HttpsError("invalid-argument","Limite inválido.");
 const cursor=String(request.data?.cursor||"").trim();
 if(cursor&&!/^[0-9a-f]{64}$/.test(cursor))
   throw new HttpsError("invalid-argument","Marcador inválido.");
 let query=root().child("keys").orderByKey();
 if(cursor)query=query.startAt(cursor);
 const snap=await query.limitToFirst(pageSize+2).get();
 const entries=Object.entries(snap.val()||{}).sort(([a],[b])=>a.localeCompare(b))
   .filter(([hash])=>hash!==cursor);
 const page=entries.slice(0,pageSize);
 const keys=page.map(([hash,k])=>{
   const record=k&&typeof k==="object"?k:{};
   const revoked=record.revoked===true, suspended=record.suspended===true;
   const expires=Number(record.expiresAt||0);
   const status=revoked?"revogada":suspended?"suspensa":
     record.kind==="manual"&&!record.uid?"não ativada":
     record.duration==="lifetime"?"vitalícia":
     (expires&&expires<=Date.now()?"vencida":"ativa");
   return {id:hash,kind:String(record.kind||"desconhecido"),
     duration:String(record.duration|| (record.kind==="paid"?"30d":"")),
     uid:typeof record.uid==="string"?record.uid:"",
     createdAt:Number(record.createdAt||0),claimedAt:Number(record.claimedAt||0),
     expiresAt:expires,revoked,suspended,status,
     copyAvailable:!revoked&&(!!record.vault||(record.kind==="paid"&&!!record.orderId)),
     editable:!revoked};
 });
 return {keys,hasMore:entries.length>pageSize,
   nextCursor:page.length?page[page.length-1][0]:"",serverNow:Date.now()};
});
/** Copy requires an explicit owner request; old manual keys are NOT recoverable. */
exports.adminRevealPremiumKey=onCall({region:REGION,secrets:[KEY_SECRET]},async request=>{
 await requireAdmin(request);
 const id=String(request.data?.id||"");
 if(!/^[0-9a-f]{64}$/.test(id))
   throw new HttpsError("invalid-argument","Licença inválida.");
 const record=(await root().child("keys").child(id).get()).val();
 if(!record||record.revoked===true)
   throw new HttpsError("not-found","Licença inexistente ou revogada.");
 let plain;
 try{
   if(record.vault)plain=unsealCode(record.vault);
   else if(record.kind==="paid"&&/^[0-9a-f-]{36}$/.test(record.orderId||""))
     plain=formatKey(record.orderId);
   else throw new HttpsError("failed-precondition",
     "O código manual antigo foi armazenado somente como hash. Reemita um novo código se necessário.");
 }catch(e){
   if(e instanceof HttpsError)throw e;
   throw new HttpsError("failed-precondition","Código armazenado indisponível.");
 }
 if(sha(plain)!==id)throw new HttpsError("failed-precondition","Integridade da licença inválida.");
 return {licenseKey:plain,serverNow:Date.now()};
});
/** Reversible administrative suspension, distinct from irreversible revocation. */
exports.adminSetPremiumKeyEnabled=onCall({region:REGION},async request=>{
 const actor=await requireAdmin(request);
 const id=String(request.data?.id||""),enabled=request.data?.enabled;
 if(!/^[0-9a-f]{64}$/.test(id)||typeof enabled!=="boolean")
   throw new HttpsError("invalid-argument","Parâmetros inválidos.");
 const ref=root().child("keys").child(id);
 const tx=await ref.transaction(v=>{
   if(!v||v.revoked===true)return;
   return {...v,suspended:!enabled,suspensionUpdatedAt:Date.now(),suspensionBy:actor};
 },undefined,false);
 if(!tx.committed)
   throw new HttpsError("failed-precondition","Licença revogada ou inexistente; não pode ser reativada.");
 return {updated:true,enabled,serverNow:Date.now()};
});
/** Edit a key's finite expiry (+/- days or exact timestamp), including reductions.
 * For an unassigned manual code change its duration before the first redemption.
 */
exports.adminChangePremiumKeyDuration=onCall({region:REGION},async request=>{
 await requireAdmin(request);
 const input=request.data||{},id=String(input.id||""),action=String(input.action||"");
 if(!/^[0-9a-f]{64}$/.test(id))throw new HttpsError("invalid-argument","Licença inválida.");
 const ref=root().child("keys").child(id),entry=(await ref.get()).val();
 if(!entry||entry.revoked===true)throw new HttpsError("failed-precondition","Licença revogada ou inexistente.");
 if(!entry.uid){
   const duration=String(input.duration||"");
   if(entry.kind!=="manual"||!ADMIN_DURATIONS.includes(duration)||action!=="duration")
     throw new HttpsError("invalid-argument","Escolha uma duração válida para a licença não ativada.");
   const changed=await ref.transaction(v=>{
     if(!v||v.uid||v.revoked===true)return;
     return {...v,duration};
   },undefined,false);
   if(!changed.committed)throw new HttpsError("aborted","Licença ativada durante a alteração.");
   return {updated:true,duration,serverNow:Date.now()};
 }
 if(entry.duration==="lifetime"||entry.kind==="lifetime")
   throw new HttpsError("failed-precondition","Licença vitalícia: suspenda se desejar bloquear.");
 const now=Date.now(),uid=String(entry.uid||"");
 const entRef=root().child("entitlements").child(uid);
 const existing=(await entRef.get()).val();
 if(existing?.currentKeyHash!==id||existing.revoked===true||existing.lifetime===true)
   throw new HttpsError("failed-precondition","Licença não corresponde ao benefício atual.");
 let deadline;
 if(action==="adjustDays"){
   const days=Number(input.days);
   if(!Number.isInteger(days)||days===0||Math.abs(days)>3650)
     throw new HttpsError("invalid-argument","Use dias inteiros entre -3650 e +3650.");
   deadline=Math.max(now,Number(existing.expiresAt||0)+days*86400000);
 }else if(action==="setExpiresAt"){
   deadline=Number(input.expiresAt);
   if(!Number.isSafeInteger(deadline)||deadline<now||
      deadline>now+36500*86400000)
     throw new HttpsError("invalid-argument","Data inválida. Use uma data futura.");
 }else throw new HttpsError("invalid-argument","Operação inválida.");
 // First edit key, then entitlement. A partial failure denies (rather than extends) access.
 const keyUpdated=await ref.transaction(v=>{
   if(!v||v.revoked===true||v.uid!==uid)return;
   return {...v,expiresAt:deadline};
 },undefined,false);
 if(!keyUpdated.committed)throw new HttpsError("aborted","Chave alterada por outra operação.");
 const entUpdated=await entRef.transaction(v=>{
   if(!v||v.revoked===true||v.currentKeyHash!==id||v.lifetime===true)return;
   return {...v,expiresAt:deadline};
 },undefined,false);
 if(!entUpdated.committed)
   throw new HttpsError("aborted","Benefício alterado por outra operação. Verifique novamente.");
 return {updated:true,expiresAt:deadline,serverNow:Date.now()};
});
/** App-wide maintenance policy. New Android clients check this on launch/periodically.
 * No mass Firebase Auth revocation, no changes to user data or license state.
 */
exports.adminSetAppMaintenance=onCall({region:REGION},async request=>{
 const actor=await requireAdmin(request);
 const enabled=request.data?.enabled;
 if(typeof enabled!=="boolean")throw new HttpsError("invalid-argument","Estado inválido.");
 const reason=String(request.data?.message||"PokeSearch temporariamente em manutenção.")
   .replace(/[\r\n]+/g," ").trim().slice(0,180);
 await getDatabase().ref("appControl/maintenance").set({
   enabled,message:reason,updatedAt:Date.now(),updatedBy:actor
 });
 return {updated:true,enabled,serverNow:Date.now()};
});

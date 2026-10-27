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
const NORMAL_CENTS=2000, PROMO_CENTS=1000;
const ADMIN_DURATIONS=Object.freeze(["15d","30d","1m","3m","6m","12m","lifetime"]);
const root=()=>getDatabase().ref("premium");
const policy=()=>getDatabase().ref("distribution");
const appMaintenance=async()=>
   (await getDatabase().ref("appControl/maintenance/enabled").get()).val()===true;
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
 const promotionEndsAt=Number(config.promotionEndsAt||0);
 const promotionEnabled=config.promotionEnabled!==false&&
   (!promotionEndsAt||Date.now()<promotionEndsAt);
 return {regularPriceCents:regular,promotionalPriceCents:promotional,promotionEnabled,
   promotionEndsAt,discountPercent:regular>promotional?
     Math.round(100*(regular-promotional)/regular):0,
   priceCents:promotionEnabled?promotional:regular};
};

/** Affiliate voucher: 10%, 25%, or 50% off the currently active sale price.
 * A code is optional; client totals and commissions are NEVER trusted.
 * Owner pays partners manually after actual settlement.
 */
const AFFILIATE_COMMISSION_PCT=50;
const couponPattern=/^[A-Z0-9][A-Z0-9_-]{2,22}[A-Z0-9]$/;
const normaliseCoupon=value=>String(value||"").trim().toUpperCase();
const validCoupon=value=>couponPattern.test(value);
async function couponQuote(rawCode,basePrice,uid){
 const code=normaliseCoupon(rawCode);
 if(!code)return {priceCents:basePrice,coupon:null};
 if(!validCoupon(code))throw new HttpsError("invalid-argument","Cupom inválido.");
 const coupon=(await root().child("coupons").child(code).get()).val();
 if(!coupon||coupon.enabled!==true||
    (coupon.expiresAt&&Date.now()>=Number(coupon.expiresAt)))
   throw new HttpsError("failed-precondition","Cupom inexistente, desativado ou vencido.");
 if(coupon.partnerUid&&coupon.partnerUid===uid)
   throw new HttpsError("failed-precondition","Não é permitido usar seu próprio cupom.");
 const discount=Number(coupon.discountPercent);
 const commissionPercent=Number(coupon.commissionPercent??AFFILIATE_COMMISSION_PCT);
 if(![10,25,50].includes(discount)||
    !Number.isSafeInteger(commissionPercent)||commissionPercent<0||commissionPercent>100)
   throw new HttpsError("failed-precondition","Cupom inválido.");
 const discounted=basePrice-Math.round(basePrice*discount/100);
 if(discounted<100)throw new HttpsError("failed-precondition",
   "O valor com desconto é menor que o mínimo aceito para Pix.");
 return {priceCents:discounted,coupon:{
   code,partnerName:String(coupon.partnerName||"").slice(0,80),
   partnerUid:String(coupon.partnerUid||""),discountPercent:discount,
   commissionPercent,
   commissionCents:Math.round(discounted*commissionPercent/100),
   basePriceCents:basePrice
 }};
}
async function affiliateEarned(ref){
 await ref.child("referral").transaction(value=>{
   if(!value||!value.code||!Number.isSafeInteger(value.commissionCents))return;
   if(["pending","paid","reversed","reversed_paid"].includes(value.status))return value;
   return {...value,status:"pending",approvedAt:Date.now()};
 },undefined,false);
}
async function affiliateReversed(ref){
 await ref.child("referral").transaction(value=>{
   if(!value)return;
   if(value.status==="paid")return {...value,status:"reversed_paid",reversedAt:Date.now()};
   if(value.status==="reversed"||value.status==="reversed_paid")return value;
   return {...value,status:"reversed",reversedAt:Date.now()};
 },undefined,false);
}

const cleanEmail=value=>String(value||"").trim().toLowerCase();
const validEmail=email=>/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,30}$/.test(email)&&email.length<=254;
const recipientHash=email=>crypto.createHmac("sha256",KEY_SECRET.value())
 .update("pokesearch-email-recipient-v1:"+cleanEmail(email)).digest("hex");
const maskedEmail=email=>{
 const at=email.indexOf("@");
 return email.slice(0,Math.min(2,at))+"***@"+email.slice(at+1);
};
const campaignOffer=(config,now=Date.now())=>{
 const c=config?.freeYearCampaign||{};
 const startsAt=Number(c.startsAt||0),endsAt=Number(c.endsAt||0),
       maxClaims=Number(c.maxClaims||0),claimCount=Number(c.claimCount||0);
 const duration=["15d","30d","1m","3m","6m","12m","lifetime"].includes(c.duration)?
   c.duration:"12m";
 return {enabled:c.enabled===true,active:c.enabled===true&&now>=startsAt&&
         now<endsAt&&claimCount<maxClaims,
    duration,startsAt,endsAt,maxClaims,claimCount,
    remaining:Math.max(0,maxClaims-claimCount),
    label:"FREE! Premium por tempo limitado"};
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
   await affiliateReversed(ref);
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
 await affiliateEarned(ref);
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
   await affiliateReversed(ref);
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
 await affiliateEarned(ref);
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
 const enabled=!await appMaintenance()&&await currentPolicy(code);
 const premium=enabled&&await userEntitlement(uid);
 return {allowed:enabled,premium,serverNow:Date.now()};
});
exports.createPremiumPix=onCall({region:REGION,
 secrets:[MP_TOKEN,MP_TEST_TOKEN]},async request=>{
 const uid=requireUser(request),email=String(request.data?.email||"").trim().toLowerCase();
 const code=Number(request.data?.versionCode);
 if(await appMaintenance())
   throw new HttpsError("failed-precondition","PokeSearch temporariamente em manutenção.");
 if(!isValidCode(code)||!await currentPolicy(code))
   throw new HttpsError("failed-precondition","Esta versão não está liberada.");
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>120)
   throw new HttpsError("invalid-argument","Informe um e-mail válido.");
 const config=(await root().child("config").get()).val()||{};
 const basePriceCents=offer(config).priceCents;
 const quoted=await couponQuote(request.data?.couponCode,basePriceCents,uid);
 const price=quoted.priceCents;
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
 await ref.set({uid,priceCents:price,basePriceCents,
   ...(quoted.coupon?{referral:{...quoted.coupon,status:"unearned"}}:{}),
   versionCode:code,status:"creating",createdAt,liveMode});
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
   return {orderId,pixCode:qr,priceCents:price,
     basePriceCents,discountPercent:quoted.coupon?.discountPercent||0,
     couponCode:quoted.coupon?.code||"",status:"pending"};
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


/** The admin can create and update coupons. A voucher only alters future quotes.
 * Existing paid-order snapshots and commission figures are immutable.
 */
exports.adminSavePartnerCoupon=onCall({region:REGION},async request=>{
 await requireAdmin(request);
 const input=request.data||{},code=normaliseCoupon(input.code);
 const partnerName=String(input.partnerName||"").trim();
 const partnerUid=String(input.partnerUid||"").trim();
 const discountPercent=Number(input.discountPercent);
 const commissionPercent=Number(input.commissionPercent??AFFILIATE_COMMISSION_PCT);
 const expiresAt=Number(input.expiresAt||0);
 if(!validCoupon(code)||partnerName.length<2||partnerName.length>80||
    ![10,25,50].includes(discountPercent)||
    !Number.isSafeInteger(commissionPercent)||commissionPercent<0||commissionPercent>100||
    (partnerUid&&!validUid(partnerUid))||
    !Number.isSafeInteger(expiresAt)||expiresAt<0||
    (expiresAt!==0&&expiresAt<Date.now()))
   throw new HttpsError("invalid-argument","Revise nome, código, desconto e prazo do cupom.");
 const ref=root().child("coupons").child(code);
 const tx=await ref.transaction(old=>{
   if(old&&old.partnerUid&&old.partnerUid!==partnerUid)return;
   return {code,partnerName,partnerUid,discountPercent,commissionPercent,expiresAt,
     enabled:input.enabled!==false,
     createdAt:Number(old?.createdAt||Date.now()),updatedAt:Date.now()};
 },undefined,false);
 if(!tx.committed)throw new HttpsError("failed-precondition",
   "Este cupom já pertence a outro parceiro. Use um código novo.");
 return {saved:true,code};
});
exports.adminListPartnerCoupons=onCall({region:REGION},async request=>{
 await requireAdmin(request);
 const cursor=normaliseCoupon(request.data?.cursor||"");
 if(cursor&&!validCoupon(cursor))throw new HttpsError("invalid-argument","Marcador inválido.");
 const limit=30;
 let q=root().child("coupons").orderByKey();
 if(cursor)q=q.startAt(cursor);
 const entries=Object.entries((await q.limitToFirst(limit+2).get()).val()||{})
   .sort(([a],[b])=>a.localeCompare(b)).filter(([id])=>id!==cursor);
 return {items:entries.slice(0,limit).map(([code,v])=>({
   code,partnerName:v.partnerName,partnerUid:v.partnerUid||"",
   enabled:v.enabled===true,discountPercent:v.discountPercent,
   commissionPercent:Number(v.commissionPercent??AFFILIATE_COMMISSION_PCT),
   expiresAt:Number(v.expiresAt||0)})),
   nextCursor:entries.length>limit?entries[limit-1][0]:""};
});
/** All commissions are derived from verified Pix orders, never clicks or QR generation. */
exports.adminListPartnerCommissions=onCall({region:REGION},async request=>{
 await requireAdmin(request);
 const cursor=String(request.data?.cursor||"");
 if(cursor&&!/^[0-9a-f-]{36}$/.test(cursor))
   throw new HttpsError("invalid-argument","Marcador inválido.");
 const limit=50;
 let q=root().child("orders").orderByKey();
 if(cursor)q=q.startAt(cursor);
 const entries=Object.entries((await q.limitToFirst(limit+2).get()).val()||{})
   .sort(([a],[b])=>a.localeCompare(b)).filter(([id])=>id!==cursor);
 const rows=entries.slice(0,limit);
 return {items:rows.filter(([,v])=>v?.referral?.code).map(([orderId,v])=>({
   orderId,code:v.referral.code,
   partnerName:v.referral.partnerName,
   paidPriceCents:Number(v.priceCents||0),
   commissionCents:Number(v.referral.commissionCents||0),
   commissionStatus:String(v.referral.status||"unearned"),
   orderStatus:String(v.status||""),
   liveMode:v.liveMode===true,
   createdAt:Number(v.createdAt||0),approvedAt:Number(v.approvedAt||0),
   partnerPaymentReference:String(v.referral.paymentReference||""),
   partnerPaidAt:Number(v.referral.partnerPaidAt||0)
 })),
 nextCursor:entries.length>limit?rows[rows.length-1][0]:""};
});
/** Manual accounting only. No automatic transfer, split, or third-party wallet.
 * Explicit confirmation + external payment reference required for settlement.
 */
exports.adminMarkPartnerCommissionPaid=onCall({region:REGION},async request=>{
 const actor=await requireAdmin(request),data=request.data||{};
 const orderId=String(data.orderId||""),reference=String(data.reference||"").trim();
 if(!/^[0-9a-f-]{36}$/.test(orderId)||reference.length<6||reference.length>140||
    !/^[\p{L}\p{N} .:_\/#-]+$/u.test(reference)||
    data.confirm!=="REGISTRAR REPASSE")
   throw new HttpsError("invalid-argument","Informe a referência real do repasse e confirme.");
 const orderRef=root().child("orders").child(orderId);
 const order=(await orderRef.get()).val();
 if(!order||order.status!=="approved"||order.licensed!==true||
    order.liveMode!==true||order.referral?.status!=="pending")
   throw new HttpsError("failed-precondition",
     "Comissão não elegível. Verifique aprovação, modo real e estornos.");
 const tx=await orderRef.transaction(v=>{
   if(!v||v.status!=="approved"||v.licensed!==true||v.liveMode!==true||
      v.referral?.status!=="pending")return;
   return {...v,referral:{...v.referral,status:"paid",
     partnerPaidAt:Date.now(),partnerPaidBy:actor,paymentReference:reference}};
 },undefined,false);
 if(!tx.committed)throw new HttpsError("aborted","Comissão já liquidada ou alterada.");
 return {recorded:true,orderId,commissionCents:tx.snapshot.val().referral.commissionCents};
});

exports.adminPremiumSettings=onCall({region:REGION},async request=>{
 await requireAdmin(request);
 const input=request.data||{};
 if(input.action==="pricingPreset"){
   // Explicit owner action only. No automatic mutation to the live Firebase.
   await root().child("config").transaction(old=>{
     const config=old&&typeof old==="object"?old:{};
     const deadline=Number(config.promotionEndsAt||0);
     return {...config,regularPriceCents:2000,promotionalPriceCents:1000,
       promotionEnabled:true,
       // Keep a genuinely future deadline; clear a previously expired one.
       promotionEndsAt:deadline>Date.now()?deadline:0};
   },undefined,false);
 }else if(input.action==="prices"){
   const regular=Number(input.regularPriceCents),promotional=Number(input.promotionalPriceCents);
   if(!Number.isSafeInteger(regular)||regular<100||regular>100000||
      !Number.isSafeInteger(promotional)||promotional<100||promotional>regular)
     throw new HttpsError("invalid-argument","Preços inválidos. A promoção não pode superar o preço normal.");
   await root().child("config").update({regularPriceCents:regular,promotionalPriceCents:promotional});
 }else if(input.action==="price"||input.action==="regularPrice"||input.action==="promotionalPrice"){
   const cents=Number(input.priceCents);
   if(!Number.isSafeInteger(cents)||cents<100||cents>100000)
     throw new HttpsError("invalid-argument","Preço inválido.");
   const field=input.action==="promotionalPrice"?"promotionalPriceCents":"regularPriceCents";
   await root().child("config").child(field).set(cents);
 }else if(input.action==="promotion"){
   if(typeof input.enabled!=="boolean")throw new HttpsError("invalid-argument","Promoção inválida.");
   await root().child("config").child("promotionEnabled").set(input.enabled);
 }else if(input.action==="promotionDeadline"){
   const endsAt=Number(input.endsAt);
   if(!Number.isSafeInteger(endsAt)||endsAt<0||
      (endsAt!==0&&(endsAt<=Date.now()||endsAt>Date.now()+366*86400000)))
     throw new HttpsError("invalid-argument","Escolha uma data futura até 366 dias, ou 0 para remover o prazo.");
   await root().child("config").child("promotionEndsAt").set(endsAt);
 }else if(input.action==="freeYearCampaign"){
   const enabled=input.enabled===true;
   if(typeof input.enabled!=="boolean")throw new HttpsError("invalid-argument","Estado inválido.");
   const campaignRef=root().child("config").child("freeYearCampaign");
   if(!enabled){
     await campaignRef.child("enabled").set(false);
   }else{
     const startsAt=Number(input.startsAt),endsAt=Number(input.endsAt);
     const maxClaims=Number(input.maxClaims),duration=String(input.duration||"");
     const now=Date.now();
     if(!ADMIN_DURATIONS.includes(duration))
       throw new HttpsError("invalid-argument","Escolha a duração da licença grátis.");
     if(!Number.isSafeInteger(startsAt)||!Number.isSafeInteger(endsAt)||
        startsAt<now-60000||endsAt<=Math.max(startsAt,now)||
        endsAt>now+366*86400000||
        !Number.isSafeInteger(maxClaims)||maxClaims<1||maxClaims>10000)
       throw new HttpsError("invalid-argument",
         "Informe início, encerramento futuro e limite de 1 a 10.000 resgates.");
     // A new campaign gets a new ID. It never reopens claims from an old campaign.
     const existing=(await campaignRef.get()).val()||{};
     if(existing.enabled===true&&existing.claimCount>0)
       throw new HttpsError("failed-precondition","Encerre a campanha atual antes de criar outra.");
     await campaignRef.set({id:crypto.randomUUID(),enabled:true,startsAt,endsAt,
       duration,maxClaims,claimCount:0,claimRefs:{},createdAt:now});
   }
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
 const [dist,cfg,maintenance,appVersions]=await Promise.all([
   policy().get(),root().child("config").get(),getDatabase().ref("appControl/maintenance").get(),
   getDatabase().ref("appControl/versionAccess").get()
 ]);
 const p=dist.val()||{},c=cfg.val()||{},m=maintenance.val()||{},av=appVersions.val()||{};
 return {globalEnabled:p.globalEnabled===true,versions:p.versions||{},
   salesEnabled:c.salesEnabled===true,paymentsLiveEnabled:c.paymentsLiveEnabled===true,
   appMaintenanceEnabled:m.enabled===true,appMaintenanceMessage:String(m.message||""),
   appVersionGlobalEnabled:av.globalEnabled!==false,appVersions:av.versions||{},
   ...offer(c),freeYearCampaign:campaignOffer(c),
   durationOptions:ADMIN_DURATIONS};
});


/** Price displayed before generating any charge. Client-provided price is NEVER trusted. */
exports.getPremiumOffer=onCall({region:REGION},async request=>{
 requireUser(request);
 const cfg=(await root().child("config").get()).val()||{};
 const base=offer(cfg);
 const quoted=await couponQuote(request.data?.couponCode,base.priceCents,request.auth?.uid||"");
 return {...base,priceCents:quoted.priceCents,
   coupon:quoted.coupon?{code:quoted.coupon.code,partnerName:quoted.coupon.partnerName,
     discountPercent:quoted.coupon.discountPercent}:null,
   freeYearCampaign:campaignOffer(cfg),
   salesEnabled:cfg.salesEnabled===true&&!await appMaintenance(),
   serverNow:Date.now()};
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
 const email=cleanEmail(args.recipientEmail||"");
 if(email&&!validEmail(email))
   throw new HttpsError("invalid-argument","E-mail Google inválido.");
 if(email&&targetUid)
   throw new HttpsError("invalid-argument","Escolha UID ou e-mail, não ambos.");
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
   ...(email?{recipientEmailHash:recipientHash(email),
       recipientEmailHint:maskedEmail(email)}:{}),
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
   assigned:!!targetUid,restrictedToEmail:!!email,uid:targetUid||null,serverNow:Date.now()};
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
exports.redeemPremiumKey=onCall({region:REGION,secrets:[KEY_SECRET]},async request=>{
 const uid=requireUser(request),code=String(request.data?.licenseKey||"").trim().toUpperCase();
 if(!/^PS-([0-9A-F]{6}-){3}[0-9A-F]{6}$/.test(code))
   throw new HttpsError("invalid-argument","Formato de chave inválido.");
 const hash=sha(code),keyRef=root().child("keys").child(hash);
 let entry=(await keyRef.get()).val();
 if(!entry||entry.revoked===true||entry.suspended===true)
   throw new HttpsError("not-found","Chave inexistente, suspensa ou revogada.");
 if(entry.kind==="manual"){
   if(entry.recipientEmailHash){
     const profile=await getAuth().getUser(uid),account=cleanEmail(profile.email);
     if(profile.emailVerified!==true||!validEmail(account)||
        recipientHash(account)!==entry.recipientEmailHash)
       throw new HttpsError("permission-denied",
         "Esta chave foi reservada para outro e-mail Google verificado.");
   }
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
     if(!current||current.revoked===true||current.suspended===true||
        current.kind!=="manual"||
        current.recipientEmailHash!==entry.recipientEmailHash||
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
 const includeArchived=request.data?.archived===true;
 if(cursor&&!/^[0-9a-f]{64}$/.test(cursor))
   throw new HttpsError("invalid-argument","Marcador inválido.");
 let query=root().child("keys").orderByKey();
 if(cursor)query=query.startAt(cursor);
 const snap=await query.limitToFirst(pageSize+2).get();
 const entries=Object.entries(snap.val()||{}).sort(([a],[b])=>a.localeCompare(b))
   .filter(([hash])=>hash!==cursor);
 const page=entries.slice(0,pageSize);
 const keys=page.filter(([,entry])=>(entry?.archived===true)===includeArchived)
   .map(([hash,k])=>{
   const record=k&&typeof k==="object"?k:{};
   const revoked=record.revoked===true, suspended=record.suspended===true;
   const expires=Number(record.expiresAt||0);
   const archived=record.archived===true;
   const status=archived?"excluída":revoked?"revogada":suspended?"suspensa":
     record.kind==="manual"&&!record.uid?"não ativada":
     record.duration==="lifetime"?"vitalícia":
     (expires&&expires<=Date.now()?"vencida":"ativa");
   return {id:hash,kind:String(record.kind||"desconhecido"),
     source:String(record.source||""),
     recipientEmailHint:String(record.recipientEmailHint||""),
     duration:String(record.duration|| (record.kind==="paid"?"30d":"")),
     uid:typeof record.uid==="string"?record.uid:"",
     createdAt:Number(record.createdAt||0),claimedAt:Number(record.claimedAt||0),
     expiresAt:expires,revoked,suspended,archived,status,
     archivedAt:Number(record.archivedAt||0),
     copyAvailable:!revoked&&!archived&&(!!record.vault||(record.kind==="paid"&&!!record.orderId)),
     editable:!revoked&&!archived};
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
   if(!v||v.revoked===true||v.archived===true)return;
   return {...v,suspended:!enabled,suspensionUpdatedAt:Date.now(),suspensionBy:actor};
 },undefined,false);
 if(!tx.committed)
   throw new HttpsError("failed-precondition","Licença excluída, revogada ou inexistente; não pode ser reativada.");
 return {updated:true,enabled,serverNow:Date.now()};
});
/**
 * Delete archives an individual license AND permanently revokes its access.
 * Never erase payment receipts, license audit history or the original hash.
 */
exports.adminDeletePremiumKey=onCall({region:REGION},async request=>{
 const actor=await requireAdmin(request);
 const id=String(request.data?.id||"");
 const confirmation=String(request.data?.confirm||"");
 if(!/^[0-9a-f]{64}$/.test(id)||confirmation!=="EXCLUIR LICENÇA")
   throw new HttpsError("invalid-argument","Confirmação de exclusão inválida.");
 const ref=root().child("keys").child(id);
 const now=Date.now();
 const tx=await ref.transaction(value=>{
   if(!value||value.archived===true)return;
   return {...value,revoked:true,archived:true,archivedAt:now,
     archivedBy:actor,revokedAt:Number(value.revokedAt||now),
     revokedBy:value.revokedBy||actor,
     revocationReason:value.revocationReason||"admin-deleted",
     suspended:true};
 },undefined,false);
 if(!tx.committed)
   throw new HttpsError("failed-precondition","Licença já excluída ou não encontrada.");
 const record=tx.snapshot.val()||{};
 const uid=typeof record.uid==="string"?record.uid:"";
 if(uid){
   const entitlement=root().child("entitlements").child(uid);
   await entitlement.transaction(value=>{
     if(!value||value.currentKeyHash!==id)return;
     return {...value,revoked:true,revokedAt:now,
       revocationReason:"admin-deleted"};
   },undefined,false);
 }
 return {deleted:true,archived:true,revoked:true,wasAssigned:!!uid,
   serverNow:Date.now()};
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


/** Independent APK availability controls; not the Premium distribution entitlement.
 * Empty policy allows installed versions, and maintenance overrides everything.
 */
exports.adminSetAppVersionAccess=onCall({region:REGION},async request=>{
 const actor=await requireAdmin(request),data=request.data||{};
 if(typeof data.enabled!=="boolean"||!["global","version"].includes(data.scope))
   throw new HttpsError("invalid-argument","Controle de versão inválido.");
 const access=getDatabase().ref("appControl/versionAccess");
 if(data.scope==="global"){
   await access.child("globalEnabled").set(data.enabled);
 }else{
   const versionCode=Number(data.versionCode);
   if(!isValidCode(versionCode))
     throw new HttpsError("invalid-argument","Código da versão inválido.");
   const versionName=String(data.versionName||"").trim().slice(0,50);
   await access.child("versions").child(String(versionCode)).update({
     enabled:data.enabled,versionName:versionName||"Versão "+versionCode,
     updatedAt:Date.now(),updatedBy:actor
   });
 }
 return {updated:true,enabled:data.enabled,serverNow:Date.now()};
});


/** One verified Google account, one free campaign claim. Server-owned period,
 * counter, campaign ID and entitlement; never trust the Android clock/UID.
 * Claim reservation is idempotent and retriable after partial network failures.
 */
exports.claimFreeYear=onCall({region:REGION,secrets:[KEY_SECRET]},async request=>{
 const uid=requireUser(request),code=Number(request.data?.versionCode);
 if(!isValidCode(code)||!await currentPolicy(code)||await appMaintenance())
   throw new HttpsError("failed-precondition","Versão não liberada ou manutenção ativa.");
 const profile=await getAuth().getUser(uid);
 if(profile.emailVerified!==true||!validEmail(cleanEmail(profile.email)))
   throw new HttpsError("failed-precondition","Entre com uma conta Google de e-mail verificado.");
 const entRef=root().child("entitlements").child(uid);
 const before=(await entRef.get()).val()||{};
 if(before.revoked===true||before.lifetime===true||await userEntitlement(uid))
   throw new HttpsError("failed-precondition","A conta já possui Premium ativo ou está bloqueada.");
 const campRef=root().child("config").child("freeYearCampaign");
 const uidKey=sha("campaign-claim-uid:"+uid);
 const now=Date.now();
 const reservation=await campRef.transaction(old=>{
   const c=old&&typeof old==="object"?old:null;
   if(!c||c.enabled!==true||now<Number(c.startsAt||0)||
      now>=Number(c.endsAt||0))return;
   const refs=c.claimRefs&&typeof c.claimRefs==="object"?c.claimRefs:{};
   if(refs[uidKey]===c.id)return c;
   if(Number(c.claimCount||0)>=Number(c.maxClaims||0))return;
   return {...c,claimRefs:{...refs,[uidKey]:c.id},claimCount:Number(c.claimCount||0)+1};
 },undefined,false);
 if(!reservation.committed)
   throw new HttpsError("failed-precondition","Campanha encerrada, indisponível ou esgotada.");
 const campaign=reservation.snapshot.val();
 const duration=ADMIN_DURATIONS.includes(campaign.duration)?campaign.duration:"12m";
 const plain=formatKey("free12:"+campaign.id+":"+uid),hash=sha(plain),keyRef=root().child("keys").child(hash);
 const expiry=periodExpiry(now,duration);
 // The same claimant always receives the same key within this campaign.
 const k=await keyRef.transaction(old=>old||{
   kind:"manual",source:"freeYearCampaign",campaignId:campaign.id,duration,
   uid,createdAt:now,claimedAt:now,
   ...(expiry===null?{}:{expiresAt:expiry}),
   revoked:false,vault:sealCode(plain)
 },undefined,false);
 const key=k.snapshot.val();
 if(!key||key.uid!==uid||key.revoked===true)
   throw new HttpsError("failed-precondition","Não foi possível criar a licença promocional.");
 const granted=await entRef.transaction(old=>{
   const v=old&&typeof old==="object"?old:{};
   if(v.revoked===true||v.lifetime===true)return;
   if(v.currentKeyHash===hash)return v;
   if(v.currentKeyHash&&Number(v.expiresAt||0)>now)return;
   return {...v,kind:"manual",lifetime:duration==="lifetime",currentKeyHash:hash,
     expiresAt:duration==="lifetime"?null:Number(key.expiresAt)};
 },undefined,false);
 if(!granted.committed||granted.snapshot.val()?.currentKeyHash!==hash)
   throw new HttpsError("failed-precondition","Conta já possui licença ou não foi possível concluir.");
 return {activated:true,duration,lifetime:duration==="lifetime",
   expiresAt:duration==="lifetime"?null:Number(key.expiresAt),serverNow:Date.now()};
});


/**
 * Owner-only portable RTDB backup, independent of Netlify deployments.
 * License codes remain stored as AES-GCM vault records (not plaintext).
 * The new host MUST retain the same 64-hex POKE_PREMIUM_KEY_SECRET to decrypt
 * manual license vaults and validate reserved recipient e-mail HMACs.
 * Payments credentials and Firebase service accounts are never exported.
 */
const BACKUP_COLLECTIONS=Object.freeze([
 "keys","entitlements","orders","orderIndex","paymentIndex","paymentThrottle","coupons"
]);
const BACKUP_SINGLETONS=Object.freeze(["config","distribution","appControl"]);
const BACKUP_ALL=Object.freeze([...BACKUP_COLLECTIONS,...BACKUP_SINGLETONS]);
const BACKUP_FORMAT="PokeSearch-Premium-Backup-v1";
const BACKUP_LIMIT=20;
const backupFingerprint=()=>crypto.createHash("sha256")
 .update("POKESEARCH-VAULT-COMPATIBILITY-V1:"+KEY_SECRET.value()).digest("hex");
const backupRef=section=>section==="distribution"?policy():
 section==="appControl"?getDatabase().ref("appControl"):root().child(section);
const validBackupKey=key=>typeof key==="string"&&key.length>=1&&key.length<=150&&
 !/[.#$\[\]\/\u0000-\u001F\u007F]/.test(key)&&key!=="__proto__"&&
 key!=="prototype"&&key!=="constructor";
const checkBackupObject=(value,maximumBytes=48000)=>{
 if(!value||typeof value!=="object"||Array.isArray(value))
   throw new HttpsError("invalid-argument","Dados de backup inválidos.");
 const raw=JSON.stringify(value);
 if(!raw||Buffer.byteLength(raw,"utf8")>maximumBytes)
   throw new HttpsError("invalid-argument","Lote de backup grande demais.");
 const traverse=(node,depth)=>{
   if(depth>24)throw new HttpsError("invalid-argument","Profundidade inválida.");
   if(node&&typeof node==="object"){
     if(Array.isArray(node)){
       if(node.length>500)throw new HttpsError("invalid-argument","Lista inválida.");
       node.forEach(x=>traverse(x,depth+1));
     }else{
       for(const [key,x] of Object.entries(node)){
         if(!validBackupKey(key))throw new HttpsError("invalid-argument","Campo de backup inválido.");
         traverse(x,depth+1);
       }
     }
   }else if(typeof node==="string"&&node.length>15000)
     throw new HttpsError("invalid-argument","Valor de backup inválido.");
 };
 traverse(value,0);return value;
};
exports.adminExportPremiumBackupPage=onCall({region:REGION,secrets:[KEY_SECRET]},async request=>{
 await requireAdmin(request);
 const section=String(request.data?.section||"");
 if(!BACKUP_ALL.includes(section))throw new HttpsError("invalid-argument","Seção inválida.");
 const cursor=String(request.data?.cursor||"");
 if(cursor&&!validBackupKey(cursor))throw new HttpsError("invalid-argument","Marcador inválido.");
 const metadata={format:BACKUP_FORMAT,projectId:"pokesearch-lt",
   vaultFingerprint:backupFingerprint(),serverNow:Date.now()};
 if(BACKUP_SINGLETONS.includes(section)){
   if(cursor)throw new HttpsError("invalid-argument","Marcador inesperado.");
   const data=(await backupRef(section).get()).val()||{};
   checkBackupObject(data,150000);
   return {...metadata,section,records:data,nextCursor:"",complete:true};
 }
 let query=backupRef(section).orderByKey();
 if(cursor)query=query.startAt(cursor);
 const snap=await query.limitToFirst(BACKUP_LIMIT+2).get();
 const rows=Object.entries(snap.val()||{}).sort(([a],[b])=>a.localeCompare(b))
   .filter(([key])=>key!==cursor);
 const page=rows.slice(0,BACKUP_LIMIT),records=Object.fromEntries(page);
 checkBackupObject(records,150000);
 return {...metadata,section,records,complete:rows.length<=BACKUP_LIMIT,
   nextCursor:rows.length>BACKUP_LIMIT?page[page.length-1][0]:""};
});
/**
 * Import is deliberately allowed ONLY into a genuinely empty Premium target.
 * A Netlify hostname change pointing at the SAME Firebase requires no restore.
 * Session lives outside user records; writes are idempotent and never overwrite
 * a different license, order, user entitlement or administrative policy.
 */
exports.adminRestorePremiumBackup=onCall({region:REGION,secrets:[KEY_SECRET]},async request=>{
 const uid=await requireAdmin(request),input=request.data||{};
 const phase=String(input.phase||"");
 const sessionRef=getDatabase().ref("premiumBackupImports/active");
 const importedSections=BACKUP_ALL;
 if(phase==="prepare"){
   const importHash=String(input.backupSha256||"");
   if(!/^[0-9a-f]{64}$/.test(importHash))
     throw new HttpsError("invalid-argument","Identificador do arquivo de backup inválido.");
   if(input.format!==BACKUP_FORMAT||input.projectId!=="pokesearch-lt"||
      input.vaultFingerprint!==backupFingerprint())
     throw new HttpsError("failed-precondition",
       "Backup incompatível: mantenha o mesmo Firebase e POKE_PREMIUM_KEY_SECRET.");
   if(input.confirm!=="IMPORTAR EM BASE VAZIA")
     throw new HttpsError("failed-precondition","Confirmação de restauração inválida.");
   const checks=await Promise.all(importedSections.map(async section=>
     (await backupRef(section).get()).val()));
   if(checks.some(v=>v!==null&&v!==undefined&&
       (typeof v!=="object"||Object.keys(v).length>0)))
     throw new HttpsError("failed-precondition",
       "O Firebase já possui dados Premium/controle. Não importe sobre dados existentes. Ao trocar somente o Netlify, basta apontar ao Firebase atual.");
   const session={id:crypto.randomUUID(),uid,format:BACKUP_FORMAT,
     createdAt:Date.now(),expiresAt:Date.now()+45*60000,
     backupSha256:importHash,
     vaultFingerprint:backupFingerprint(),state:"restoring"};
   const created=await sessionRef.transaction(old=>{
     if(old&&old.state==="restoring"&&old.expiresAt>Date.now())return;
     return session;
   },undefined,false);
   if(!created.committed)
     throw new HttpsError("aborted","Já existe restauração em andamento.");
   return {sessionId:session.id,ready:true,expiresAt:session.expiresAt};
 }
 if(phase==="resume"){
   const existing=(await sessionRef.get()).val()||{};
   if(existing.uid!==uid||existing.state!=="restoring"||
      existing.expiresAt<Date.now()||
      existing.vaultFingerprint!==backupFingerprint()||
      existing.backupSha256!==String(input.backupSha256||""))
     throw new HttpsError("failed-precondition",
       "Não há restauração retomável para este arquivo e administrador.");
   return {sessionId:existing.id,ready:true,resumed:true,
     expiresAt:existing.expiresAt};
 }
 const sessionId=String(input.sessionId||"");
 if(!/^[0-9a-f-]{36}$/i.test(sessionId))
   throw new HttpsError("invalid-argument","Sessão de importação inválida.");
 const session=(await sessionRef.get()).val();
 if(!session||session.id!==sessionId||session.uid!==uid||
    session.state!=="restoring"||session.expiresAt<Date.now())
   throw new HttpsError("failed-precondition","Sessão inexistente, encerrada ou expirada.");
 if(phase==="write"){
   const section=String(input.section||""),data=checkBackupObject(input.records);
   if(!importedSections.includes(section))
     throw new HttpsError("invalid-argument","Seção inválida.");
   if(BACKUP_COLLECTIONS.includes(section)&&
      Object.keys(data).length>BACKUP_LIMIT)
     throw new HttpsError("invalid-argument","Muitos registros no lote.");
   if(BACKUP_SINGLETONS.includes(section)&&
      Buffer.byteLength(JSON.stringify(data),"utf8")>48000)
     throw new HttpsError("invalid-argument","Configuração grande demais.");
   // Require valid Firebase keys; no path injection and no overwrite of
   // records that may have been created by a user in the meantime.
   const ref=backupRef(section);
   const update=BACKUP_SINGLETONS.includes(section)?
      (section==="config"?{...data,salesEnabled:false,paymentsLiveEnabled:false,
        ...(data.freeYearCampaign?{freeYearCampaign:{
          ...data.freeYearCampaign,enabled:false}}:{})}:data):data;
   const result=await ref.transaction(existing=>{
     if(BACKUP_SINGLETONS.includes(section)){
       if(existing&&Object.keys(existing).length>0)return;
       return update;
     }
     const current=existing&&typeof existing==="object"?existing:{};
     for(const [key,record] of Object.entries(data)){
       if(!validBackupKey(key))return;
       if(Object.prototype.hasOwnProperty.call(current,key)&&
           JSON.stringify(current[key])!==JSON.stringify(record))return;
     }
     return {...current,...data};
   },undefined,false);
   if(!result.committed)
     throw new HttpsError("aborted","Conflito de dados. Nenhum registro existente foi substituído.");
   return {imported:Object.keys(data).length,section};
 }
 if(phase==="finish"){
   const result=await sessionRef.transaction(old=>
     old&&old.id===sessionId&&old.uid===uid&&old.state==="restoring"?
       {...old,state:"completed",completedAt:Date.now()}:undefined,undefined,false);
   if(!result.committed)throw new HttpsError("aborted","Falha ao finalizar restauração.");
   return {completed:true,paymentsLiveEnabled:false,salesEnabled:false};
 }
 throw new HttpsError("invalid-argument","Operação de backup inválida.");
});

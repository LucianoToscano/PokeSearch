"use strict";
/**
 * PokeSearch controlled-distribution licensing. All grants are decided server-side.
 * MP credentials, webhook HMAC, and key pepper are Firebase Secret Manager secrets.
 * No CPF, buyer email, or MP access token is stored in RTDB.
 */
const crypto=require("node:crypto");
const {onCall,onRequest,HttpsError}=require("firebase-functions/v2/https");
const {defineSecret}=require("firebase-functions/params");
const {getDatabase}=require("firebase-admin/database");
const {getAuth}=require("firebase-admin/auth");
const {initializeApp,getApps}=require("firebase-admin/app");
if(!getApps().length)initializeApp();

const MP_TOKEN=defineSecret("POKE_MP_ACCESS_TOKEN");
const MP_WEBHOOK_SECRET=defineSecret("POKE_MP_WEBHOOK_SECRET");
const MP_WEBHOOK_URL=defineSecret("POKE_MP_WEBHOOK_URL");
const KEY_SECRET=defineSecret("POKE_PREMIUM_KEY_SECRET");
const REGION="us-central1", MONTH=30*24*60*60*1000;
const NORMAL_CENTS=1000, PROMO_CENTS=500;
const ADMIN_DURATIONS=Object.freeze(["15d","1m","3m","6m","12m","lifetime"]);
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
 if(key?.uid!==uid||key.revoked===true)return false;
 if(value.lifetime===true)return key.kind==="manual"||key.kind==="lifetime";
 return Number(value.expiresAt||0)>Date.now()&&Number(key.expiresAt||0)>Date.now();
};
const offer=config=>{
 const regular=Number(config.regularPriceCents??config.priceCents??NORMAL_CENTS);
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
const requestPayment=async(endpoint,options={})=>{
 const response=await fetch("https://api.mercadopago.com"+endpoint,{
   ...options,
   headers:{"Authorization":"Bearer "+MP_TOKEN.value(),
      ...(options.body?{"Content-Type":"application/json"}:{}),
      ...(options.headers||{})},
   signal:AbortSignal.timeout(12000)
 });
 const raw=await response.text();
 let value;try{value=JSON.parse(raw)}catch{value={}};
 if(!response.ok)throw new Error("Mercado Pago HTTP "+response.status);
 return value;
};
/** Re-read the payment from Mercado Pago; notification body alone never grants access. */
async function settlePayment(paymentId){
 if(!/^\d{1,24}$/.test(String(paymentId)))return false;
 const payment=await requestPayment("/v1/payments/"+paymentId);
 const orderId=String(payment.external_reference||"");
 if(!/^[0-9a-f-]{36}$/.test(orderId))return false;
 const ref=root().child("orders").child(orderId),s=await ref.get(),order=s.val();
 if(!order||order.paymentId!==String(payment.id)||!order.uid)return false;
 if(payment.live_mode!==true||payment.payment_method_id!=="pix"||
    Math.round(Number(payment.transaction_amount)*100)!==order.priceCents)return false;
 if(payment.status==="refunded"||payment.status==="charged_back"){
   await ref.update({status:payment.status});
   // A recovered key may belong to another Firebase UID by now. Revoke BOTH
   // the original buyer and the present key holder on refund/chargeback.
   const hash=sha(formatKey(orderId)),keyRef=root().child("keys").child(hash);
   const key=(await keyRef.get()).val();
   if(key)await keyRef.update({revoked:true,revokedAt:Date.now()});
   for(const affected of new Set([order.uid,key?.uid].filter(Boolean))){
     const entRef=root().child("entitlements").child(affected);
     await entRef.transaction(value=>{
       if(!value||value.currentKeyHash!==hash||value.lifetime===true)return;
       return {...value,revoked:true,revocationReason:"payment_reversed",revokedAt:Date.now()};
     },undefined,false);
   }
   return false;
 }
 if(payment.status!=="approved")return false;
 const entRef=root().child("entitlements").child(order.uid);
 const now=Date.now(),approvedAt=Date.parse(String(payment.date_approved||""));
 const billingStart=Number.isFinite(approvedAt)&&approvedAt>=order.createdAt?
   Math.min(now,approvedAt):now;
 const key=formatKey(orderId),hash=sha(key);
 // Idempotent across webhook retries and polling: one order adds exactly 30 days.
 const transaction=await entRef.transaction(old=>{
   const v=old&&typeof old==="object"?old:{};
   const paid=v.paidOrders&&typeof v.paidOrders==="object"?v.paidOrders:{};
   if(paid[orderId])return; // already applied, no duplicate extension
   if(v.revoked===true)return; // admin revocation takes precedence
   paid[orderId]=true;
   if(v.lifetime===true)return {...v,paidOrders:paid};
   return {...v,paidOrders:paid,kind:"paid",
     expiresAt:Math.max(billingStart,Number(v.expiresAt)||0)+MONTH,currentKeyHash:hash};
 },undefined,false);
 const ent=(transaction.snapshot&&transaction.snapshot.val())||{};
 if(!ent.paidOrders?.[orderId])return false;
 await root().child("keys").child(hash).transaction(value=>
   value||{kind:"paid",orderId,uid:order.uid,expiresAt:ent.expiresAt,createdAt:now,transferred:false},undefined,false);
 await ref.update({status:"approved",licensed:true,approvedAt:now});
 return true;
}
function signatureValid(req){
 const signature=String(req.get("x-signature")||"");
 const requestId=String(req.get("x-request-id")||"");
 const id=String(req.query["data.id"]||req.query.id||"");
 const ts=(signature.match(/(?:^|,)ts=(\d+)(?:,|$)/)||[])[1];
 const hash=(signature.match(/(?:^|,)v1=([0-9a-f]{64})(?:,|$)/i)||[])[1];
 if(!ts||!hash||!requestId||!/^\d{1,24}$/.test(id))return false;
 const millis=Number(ts)>1e12?Number(ts):Number(ts)*1000;
 if(!Number.isFinite(millis)||Math.abs(Date.now()-millis)>10*60*1000)return false;
 const manifest="id:"+id.toLowerCase()+";request-id:"+requestId+";ts:"+ts+";";
 const calculated=crypto.createHmac("sha256",MP_WEBHOOK_SECRET.value()).update(manifest).digest();
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
 secrets:[MP_TOKEN,MP_WEBHOOK_URL]},async request=>{
 const uid=requireUser(request),email=String(request.data?.email||"").trim().toLowerCase();
 const cpf=digits(request.data?.cpf),code=Number(request.data?.versionCode);
 if(!isValidCode(code)||!await currentPolicy(code))
   throw new HttpsError("failed-precondition","Esta versão não está liberada.");
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>120||cpf.length!==11)
   throw new HttpsError("invalid-argument","Informe e-mail e CPF válidos.");
 const config=(await root().child("config").get()).val()||{};
 const price=offer(config).priceCents;
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
 await ref.set({uid,priceCents:price,versionCode:code,status:"creating",createdAt});
 try{
   const payment=await requestPayment("/v1/payments",{
     method:"POST",headers:{"X-Idempotency-Key":orderId},
     body:JSON.stringify({
       transaction_amount:price/100,description:"PokeSearch Premium - Pokébola 2 (30 dias)",
       payment_method_id:"pix",external_reference:orderId,
       notification_url:MP_WEBHOOK_URL.value(),
       payer:{email,identification:{type:"CPF",number:cpf}}
     })
   });
   const qr=payment.point_of_interaction?.transaction_data?.qr_code;
   if(!payment.id||!qr)throw new Error("Pagamento sem dados Pix");
   await ref.update({paymentId:String(payment.id),status:"pending"});
   return {orderId,pixCode:qr,priceCents:price,status:"pending"};
 }catch(error){
   await ref.update({status:"error"});
   throw new HttpsError("unavailable","Não foi possível gerar o Pix. Tente novamente.");
 }
});
exports.premiumPixWebhook=onRequest({region:REGION,secrets:[MP_TOKEN,MP_WEBHOOK_SECRET,KEY_SECRET]},async(req,res)=>{
 if(req.method!=="POST"){res.status(405).send("method");return;}
 if(!signatureValid(req)){res.status(401).send("signature");return;}
 const paymentId=String(req.query["data.id"]||req.query.id||"");
 try{await settlePayment(paymentId);res.status(200).send("ok");}
 catch(error){console.error("Premium webhook reconciliation failed",error.message);res.status(503).send("retry");}
});
exports.getPremiumOrder=onCall({region:REGION,secrets:[MP_TOKEN,KEY_SECRET]},async request=>{
 const uid=requireUser(request),orderId=String(request.data?.orderId||"");
 if(!/^[0-9a-f-]{36}$/.test(orderId))
  throw new HttpsError("invalid-argument","Pedido inválido.");
 const ref=root().child("orders").child(orderId),o=(await ref.get()).val();
 if(!o||o.uid!==uid)throw new HttpsError("permission-denied","Pedido não pertence a esta conta.");
 if(o.status==="pending"&&o.paymentId){
   // This check also recovers missed webhooks and always verifies at Mercado Pago.
   await settlePayment(o.paymentId);
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
 const [dist,cfg]=await Promise.all([policy().get(),root().child("config").get()]);
 const p=dist.val()||{},c=cfg.val()||{};
 return {globalEnabled:p.globalEnabled===true,versions:p.versions||{},
   salesEnabled:c.salesEnabled===true,...offer(c),durationOptions:ADMIN_DURATIONS};
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
   throw new HttpsError("invalid-argument","Selecione 15 dias, 1, 3, 6, 12 meses ou vitalícia.");
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
 await ref.set({kind:"manual",duration,uid:targetUid||null,createdBy:actor,
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
   const now=Date.now(),start=now;
   const claimed=await keyRef.transaction(value=>{
     if(!value||value.revoked===true||value.kind!=="manual"||
        value.uid&&value.uid!==uid)return;
     if(value.uid===uid)return value;
     const expiry=periodExpiry(start,value.duration);
     return {...value,uid,claimedAt:now,...(expiry===null?{}:{expiresAt:expiry})};
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

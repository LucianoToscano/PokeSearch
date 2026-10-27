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
 if(value.revoked===true||Number(value.expiresAt||0)<=Date.now()||
    !/^[0-9a-f]{64}$/.test(String(value.currentKeyHash||"")))return false;
 const key=(await root().child("keys").child(value.currentKeyHash).get()).val();
 return key?.uid===uid&&Number(key.expiresAt||0)>Date.now();
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
   // Fail closed on chargeback; owner can review and restore via admin action.
   await root().child("entitlements").child(order.uid).update({
     revoked:true,revocationReason:"payment_reversed",revokedAt:Date.now()
   });
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
   return {...v,paidOrders:paid,expiresAt:Math.max(billingStart,Number(v.expiresAt)||0)+MONTH,
     currentKeyHash:hash};
 },undefined,false);
 const ent=(transaction.snapshot&&transaction.snapshot.val())||{};
 if(!ent.paidOrders?.[orderId])return false;
 await root().child("keys").child(hash).transaction(value=>
   value||{orderId,uid:order.uid,expiresAt:ent.expiresAt,createdAt:now,transferred:false},undefined,false);
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
 const price=Number(config.priceCents);
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
 if(input.action==="price"){
   const cents=Number(input.priceCents);
   if(!Number.isSafeInteger(cents)||cents<100||cents>100000)
     throw new HttpsError("invalid-argument","Preço inválido.");
   await root().child("config").child("priceCents").set(cents);
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
   salesEnabled:c.salesEnabled===true,priceCents:Number(c.priceCents||0)};
});

/** A key is a bearer recovery code, bound to one account at a time.
 * One server-mediated transfer is allowed; possession of a key must be protected.
 */
exports.redeemPremiumKey=onCall({region:REGION},async request=>{
 const uid=requireUser(request);
 const key=String(request.data?.licenseKey||"").trim().toUpperCase();
 if(!/^PS-([0-9A-F]{6}-){3}[0-9A-F]{6}$/.test(key))
   throw new HttpsError("invalid-argument","Formato de chave inválido.");
 const hash=sha(key),keyRef=root().child("keys").child(hash);
 const snapshot=await keyRef.get(),entry=snapshot.val();
 if(!entry||Number(entry.expiresAt||0)<=Date.now())
   throw new HttpsError("not-found","Chave inexistente ou vencida.");
 const oldUid=String(entry.uid||"");
 if(!oldUid)throw new HttpsError("failed-precondition","Chave indisponível.");
 if(oldUid!==uid){
   const oldEnt=(await root().child("entitlements").child(oldUid).get()).val()||{};
   if(oldEnt.currentKeyHash!==hash||oldEnt.revoked===true||entry.transferred===true)
     throw new HttpsError("permission-denied","Esta chave já foi transferida ou substituída.");
   const moved=await keyRef.transaction(v=>{
     if(!v||v.uid!==oldUid||v.transferred===true||v.expiresAt<=Date.now())return;
     return {...v,uid,transferred:true,transferredAt:Date.now()};
   },undefined,false);
   if(!moved.snapshot.val()||moved.snapshot.val().uid!==uid)
     throw new HttpsError("aborted","Chave em processamento. Tente novamente.");
 }
 const latest=(await keyRef.get()).val();
 if(latest?.uid!==uid)throw new HttpsError("permission-denied","Chave inválida.");
 const entitlement=root().child("entitlements").child(uid);
 await entitlement.transaction(v=>{
   const current=v&&typeof v==="object"?v:{};
   if(current.revoked===true)return;
   return {...current,expiresAt:Math.max(Number(current.expiresAt)||0,Number(latest.expiresAt)||0),
     currentKeyHash:hash};
 },undefined,false);
 if(!await userEntitlement(uid))throw new HttpsError("failed-precondition","Licença bloqueada.");
 return {activated:true,expiresAt:Number(latest.expiresAt)};
});

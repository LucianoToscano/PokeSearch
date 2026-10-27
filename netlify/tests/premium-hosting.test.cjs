"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../..");
const source=p=>fs.readFileSync(path.join(root,p),"utf8");
const http=source("netlify/functions/premium.mjs");
const compat=source("netlify/lib/cloud-compat.cjs");
const logic=source("functions/premium.js");
const android=source("app/src/main/java/com/lucianotoscano/pokesearchoverlay/PremiumAccess.java");
const gradle=source("app/build.gradle.kts");
const adminHtml=source("netlify/public/admin.html");
const script=adminHtml.match(/<script type="module">([\s\S]*?)<\/script>/);
assert.ok(script,"Admin JS module exists");
const {spawnSync}=require("node:child_process");
const syntax=spawnSync(process.execPath,["--check","--input-type=module"],
  {input:script[1],encoding:"utf8"});
assert.equal(syntax.status,0,"Admin panel JS syntax: "+(syntax.stderr||""));

const checks=[
 ["App-wide and per-version endpoint is read-only and fail-closed on lookup errors",
   http.includes('action==="appStatus"&&method==="GET"')&&
   http.includes('return response({error:"Estado de manutenção indisponível."},503)')&&
   http.includes('versions.globalEnabled!==false')&&http.includes('version.enabled!==false')],
 ["Key management and maintenance stay owner-only",
   logic.includes("exports.adminListPremiumKeys=onCall")&&
   logic.includes("exports.adminSetPremiumKeyEnabled=onCall")&&
   logic.includes("exports.adminChangePremiumKeyDuration=onCall")&&
   logic.includes("exports.adminSetAppMaintenance=onCall")&&
   logic.includes("exports.adminSetAppVersionAccess=onCall")&&
   logic.includes("await requireAdmin(request)")],
 ["Old manual key plaintext remains unrecoverable while new codes use authenticated encryption",
   logic.includes('crypto.createCipheriv("aes-256-gcm"')&&
   logic.includes("Key was not backed up")&&
   logic.includes("crypto.timingSafeEqual")],
 ["Owner controls manual license recipient email and displays only a masked hint",
   adminHtml.includes('id="recipient-email"')&&
   adminHtml.includes('recipientEmail}')&&
   logic.includes('recipientEmailHash:recipientHash(email)')&&
   logic.includes('profile.emailVerified!==true')],
 ["Owner controls normal price, promotional price and promotion switch",
   adminHtml.includes('id="save-prices"')&&
   adminHtml.includes('id="promotion-toggle"')&&
   logic.includes('input.action==="prices"')&&
   logic.includes('input.action==="promotion"')],
 ["Free campaign supports duration, schedule and optional lifetime without auto-activation",
   adminHtml.includes('id="free-duration"')&&
   adminHtml.includes('id="free-activate"')&&
   adminHtml.includes('id="free-disable"')&&
   logic.includes('exports.claimFreeYear=onCall')&&
   logic.includes('duration==="lifetime"')&&
   http.includes('"claimFreeYear"')],
 ["Key deletion is owner-only, revokes current entitlement and preserves transaction history",
   logic.includes("exports.adminDeletePremiumKey=onCall")&&
   logic.includes('confirmation!=="EXCLUIR LICENÇA"')&&
   logic.includes("revoked:true,archived:true")&&
   logic.includes("currentKeyHash!==id")&&
   http.includes('"adminDeletePremiumKey"')&&
   adminHtml.includes('id="license-list-view"')&&
   adminHtml.includes('call("adminDeletePremiumKey"')&&
   adminHtml.includes('item.suspended?"Habilitar":"Desabilitar"')],
 ["Partner coupons and manual commissions require server validation and provider-approved Pix",
   logic.includes("exports.adminSavePartnerCoupon=onCall")&&
   logic.includes("exports.adminListPartnerCoupons=onCall")&&
   logic.includes("exports.adminListPartnerCommissions=onCall")&&
   logic.includes("exports.adminMarkPartnerCommissionPaid=onCall")&&
   logic.includes("AFFILIATE_COMMISSION_PCT=50")&&
   logic.includes("couponQuote(request.data?.couponCode")&&
   logic.includes("await affiliateEarned(ref)")&&
   logic.includes("await affiliateReversed(ref)")&&
   logic.includes('order.status!=="approved"')&&
   logic.includes('order.liveMode!==true')&&
   http.includes('"adminMarkPartnerCommissionPaid"')&&
   adminHtml.includes('id="partners-panel"')&&
   adminHtml.includes('id="partner-coupon-code"')&&
   adminHtml.includes('id="partner-commissions-list"')],
 ["Premium backup endpoints are owner-authenticated, bounded and never overwrite existing",
   logic.includes("exports.adminExportPremiumBackupPage=onCall")&&
   logic.includes("exports.adminRestorePremiumBackup=onCall")&&
   logic.includes("await requireAdmin(request)")&&
   logic.includes("POKESEARCH-VAULT-COMPATIBILITY-V1")&&
   logic.includes("BACKUP_LIMIT=20")&&
   logic.includes("Firebase já possui dados Premium/controle")&&
   http.includes('"adminExportPremiumBackupPage"')&&
   http.includes('"adminRestorePremiumBackup"')],
 ["Admin backup is encrypted with PBKDF2 SHA-256 and browser AES-GCM",
   adminHtml.includes('id="backup-export"')&&
   adminHtml.includes('id="backup-import"')&&
   adminHtml.includes('id="backup-preview"')&&
   adminHtml.includes('fileFormat:"PokeSearch-Encrypted-Backup-v1"')&&
   adminHtml.includes('iterations:310000')&&
   adminHtml.includes('name:"AES-GCM"')&&
   adminHtml.includes('"IMPORTAR EM BASE VAZIA"')],
 ["Firebase ID token authenticated server-side",http.includes("verifyIdToken(authorization.slice(7),true)")],
 ["only whitelisted actions are publicly routed",http.includes("allowedActions.has(action)")],
 ["webhook routes Payments and legacy Orders with HMAC validation",
   http.includes('topic!=="payment"&&topic!=="order"')&&
   http.includes('liveModeWebhook:action==="webhook-live"')&&
   http.includes('query["data.id"]=String(event.data.id)')&&
   http.includes('backend.premiumPixWebhook(request,answer)')],
  ["webhook delegated to existing HMAC-verified code",http.includes("backend.premiumPixWebhook")&&logic.includes("crypto.timingSafeEqual")],
 ["backend uses Firebase LT only",http.includes('POKE_FIREBASE_PROJECT_ID!=="pokesearch-lt"')&&http.includes('databaseURL:"https://pokesearch-lt-default-rtdb.firebaseio.com/"')],
 ["firebase credentials from protected runtime",http.includes("POKE_FIREBASE_PRIVATE_KEY")&&http.includes("POKE_FIREBASE_CLIENT_EMAIL")],
 ["credentials never logged",!http.includes("console.log(")&&!android.includes("Log.d(")],
 ["Firebase SDK functions are no longer called by Android",!android.includes("FirebaseFunctions")&&!android.includes("getHttpsCallable")],
 ["Android obtains Firebase ID token",android.includes("getIdToken(false)")],
 ["Android only permits HTTPS",android.includes('!"https".equalsIgnoreCase(url.getProtocol())')],
 ["JWT header passed to Netlify",android.includes('"Bearer "+jwt')],
 ["JSON results are returned on main/UI thread",android.includes("main.post(")],
 ["Android switches URLs via BuildConfig",gradle.includes("PREMIUM_BACKEND_URL")],
 ["controlled build feature stays opt-in",gradle.includes('POKE_CONTROLLED_DISTRIBUTION')],
 ["Netlify backend is fail-closed without production secrets",compat.includes("Private runtime configuration missing")],
 ["Netlify pricing and license grants remain server-authoritative",logic.includes("salesEnabled!==true")&&logic.includes("await userEntitlement(uid)")],
];
for(const [name,ok] of checks){
 assert.ok(ok,name);
 console.log("PASS "+name);
}
console.log("PASS "+checks.length+" Netlify/Firebase premium hosting contracts");

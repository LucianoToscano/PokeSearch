"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../..");
const source=p=>fs.readFileSync(path.join(root,p),"utf8");
const http=source("netlify/functions/premium.mjs");
const compat=source("netlify/lib/cloud-compat.cjs");
const logic=source("functions/premium.js");
const android=source("app/src/main/java/com/lucianotoscano/pokesearchoverlay/PremiumAccess.java");
const gradle=source("app/build.gradle.kts");
const checks=[
 ["Firebase ID token authenticated server-side",http.includes("verifyIdToken(authorization.slice(7),true)")],
 ["only whitelisted actions are publicly routed",http.includes("allowedActions.has(action)")],
 ["webhook always checks the Orders topic",http.includes('url.searchParams.get("type")!=="order"')],
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

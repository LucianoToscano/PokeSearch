"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"../..",p),"utf8");
const server=read("functions/premium.js");
const ui=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const dialog=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/PremiumPurchaseDialog.java");
const access=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/PremiumAccess.java");
const service=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const gradle=read("app/build.gradle.kts");
const checks=[
 ["never accept a payment from webhook payload alone",server.includes('await requestPayment("/v1/orders/"+encodeURIComponent(mpOrderId)')],
 ["webhook validates HMAC signature",server.includes("crypto.timingSafeEqual")&&server.includes("POKE_MP_WEBHOOK_SECRET")],
 ["Pix create uses idempotency key",server.includes("\"X-Idempotency-Key\":orderId")],
 ["server confirms amount and Pix",server.includes('transaction.payment_method?.id!=="pix"')&&server.includes("Math.round(amount*100)")],
 ["one grant per order",server.includes("paidOrders[orderId]")&&server.includes("entRef.transaction(")],
 ["licensing lasts exactly 30 days",server.includes("30*24*60*60*1000")],
 ["control can disable entire distribution and each code",server.includes("p.globalEnabled===true")&&server.includes("p.versions?.[String(code)]!==false")],
 ["no live sales without salesEnabled",server.includes("salesEnabled!==true")&&server.includes("!Number.isSafeInteger(price)")],
 ["no CPF persisted in payment order",!server.includes("cpf,")&&!server.includes("cpf:")],
 ["server requires admin claim",server.includes("customClaims?.pokesearchAdmin!==true")],
 ["P1 remote validation only on controlled APKs",ui.includes("if(PremiumAccess.controlled()&&!PremiumAccess.permitted(false))")],
 ["P2 remote validation before start",ui.includes("if(PremiumAccess.controlled()&&!PremiumAccess.permitted(true))")],
 ["overlay gate runs before WebView",service.indexOf("PremiumAccess.permitted(isSecondaryOverlay())")<service.indexOf("newWebsite();")],
 ["both overlays revalidate periodically",service.includes("handler.postDelayed(this,45000L)")],
 ["temporary monotonic lease not saved",access.includes("SystemClock.elapsedRealtime()")&&!access.includes("SharedPreferences")],
 ["payment confirmation automatically polled",dialog.includes("postDelayed(scheduled[0],12000L)")],
 ["main public APK remains uncontrolled",gradle.includes("val controlledDistribution = System.getenv(\"POKE_CONTROLLED_DISTRIBUTION\") == \"true\"")],
 ["no payment token in Android source",!access.includes("MERCADOPAGO_ACCESS_TOKEN")],
];
for(const [name,ok] of checks){assert.ok(ok,name);console.log("PASS "+name);}
console.log("PASS "+checks.length+" premium static contracts (not live-payment tests)");

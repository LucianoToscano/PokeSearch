"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"../..",p),"utf8");
const gradle=read("app/build.gradle.kts");
const ui=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const overlay=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const access=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/PremiumAccess.java");
const availability=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/AppAvailability.java");
const oauth=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/PremiumGoogleLogin.java");
const dialog=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/PremiumPurchaseDialog.java");
const stats=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/FirebaseStats.java");
const chat=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/CommunityScrapbookOnline.java");
const capture=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/CaptureChatCard.java");
const sprite=read("app/src/main/assets/sprite_offline.js");
const toggle=ui.slice(ui.indexOf("private void toggleSecondaryOverlay(){"),ui.indexOf("private void logoutPremiumAccount("));
const premiumLogout=ui.slice(ui.indexOf("private void logoutPremiumAccount("),ui.indexOf("/** Account detail uses"));
const checks=[
 ["LT133 chat remains in MainActivity",ui.includes("CommunityScrapbookOnline")&&ui.includes("communityHomePanel")],
 ["LT133 compact capture-card implementation preserved",capture.includes("class CaptureChatCard")],
 ["LT133 original online chat remains present",chat.includes("class CommunityScrapbookOnline")],
 ["LT133 Halloween assets and form paths preserved",sprite.includes("halloween")],
 ["Controlled build is opt-in and normal APK unaffected",
  gradle.includes('val controlledDistribution = System.getenv("POKE_CONTROLLED_DISTRIBUTION") == "true"')&&
  gradle.includes('buildConfigField("boolean", "CONTROLLED_DISTRIBUTION", "false")')],
 ["Correct new PokeSearch Premium Netlify endpoint",
  gradle.includes('https://pokesearch-premium-luc.netlify.app/api/premium')],
 ["Correct LT133 public Google OAuth client reused or overridden",
  gradle.includes('POKE_GOOGLE_WEB_CLIENT_ID')&&
  gradle.includes('CHAT_GOOGLE_WEB_CLIENT_ID')],
 ["Premium uses separated Firebase named app",oauth.includes("PokeSearchPremiumIdentity")&&
  oauth.includes("FirebaseStats.ensureApp(context.getApplicationContext())")],
 ["Anonymous stats still use original Firebase instance",stats.includes("PokeSearchStats")],
 ["Google login uses native Credential Manager",oauth.includes("getCredentialAsync(")&&
  oauth.includes("GoogleAuthProvider.getCredential")],
 ["Premium access lease uses elapsed time, install ID is never treated as license",
   access.includes("SystemClock.elapsedRealtime()")&&
   access.includes('getNoBackupFilesDir()')&&
   access.includes('p2-install-id-v1')&&
   access.includes('java.util.UUID.randomUUID().toString()')&&
   !access.includes("android.provider.Settings.Secure.ANDROID_ID")],
 ["Maintenance and per-version availability use HTTPS with bounded timeouts",
   availability.includes('BuildConfig.PREMIUM_BACKEND_URL+"/appStatus?versionCode="')&&
   availability.includes("getBoolean(\"allowed\",true)")&&
   availability.includes('connection.setConnectTimeout(5000)')&&
   availability.includes('connection.setReadTimeout(5000)')],
 ["Both overlays are stopped by Home when administrator blocks this APK",
   ui.includes('stopService(new Intent(this,OverlayService.class));')&&
   ui.includes('stopService(new Intent(this,SecondaryOverlayService.class));')&&
   ui.includes('applyAppAvailability(AppAvailability.cached(this))')],
 ["Both overlays use the same app-availability guard without VIP lease",
   overlay.includes('if(!AppAvailability.isAllowed(this)){stopSelf();return;}')&&
   overlay.includes('AppAvailability.refresh(OverlayService.this,state->')&&
   !overlay.includes('PremiumAccess.permitted(')&&
   !overlay.includes('PremiumAccess.verify(')&&
   access.includes('static synchronized boolean permitted(boolean secondary)')&&
   access.includes('// LT234: ativação de P1/P2 não depende de conta Google ou licença Premium.')],
 ["P1 remains free without server verification",!ui.includes("if(PremiumAccess.controlled()&&!PremiumAccess.permitted(false))")&&
   ui.includes("private void startOverlay()")],
 ["P2 toggles freely without Premium login, purchase or verification",
   toggle.includes('startSecondaryOverlayAuthorized();')&&
   !toggle.includes('PremiumAccess.')&&
   !toggle.includes('PremiumGoogleLogin.')&&
   !toggle.includes('PremiumPurchaseDialog.')],
 ["P2 starts without a Premium lease and preserves its secondary service",
   ui.includes('new Intent(this,SecondaryOverlayService.class)')&&
   !ui.includes('if(PremiumAccess.controlled()&&!PremiumAccess.permitted(true))return;')&&
   !overlay.includes('if(isSecondaryOverlay()&&PremiumAccess.controlled())')],
 ["Shared OverlayService continues both Pokeballs",overlay.includes("isSecondaryOverlay()")],
 ["Premium user can sign out or switch account from Home, even with active P2",
   ui.includes('"Conta Premium · Gerenciar / Sair"')&&
   ui.includes('this::showPremiumAccountOptions')&&
   ui.includes('this::showHomeAccountMenu')&&
   !ui.includes('screen.addView(accountPremium,accountLp)')&&
   ui.includes('homeAuthButton("Sair da conta Google"')&&
   ui.includes('homeAuthButton("Trocar conta Google"')&&
   ui.includes('.setView(scroll)')&&
   ui.includes('logoutPremiumAccount(boolean switchAccount)')&&
   ui.includes('PremiumAccess.releaseDevice(this,')&&
   ui.includes('PremiumAccess.sessionInfo(this,')&&
   ui.includes('"Transferir Premium para outro aparelho"')&&
   !premiumLogout.includes('stopService(new Intent(this,SecondaryOverlayService.class));')&&
   ui.includes('PremiumAccess.invalidateLease();')&&
   ui.includes('PremiumGoogleLogin.signOut(this,')],
 ["Optional Premium account transfer remains available independently of P2",
   access.includes('payload.put("deviceId",deviceId(context))')&&
   access.includes('call(context,"transferPremiumDevice",data,callback)')&&
   access.includes('static synchronized boolean deviceConflict()')&&
   ui.includes('setPositiveButton("Usar neste aparelho"')&&
   dialog.includes('promptPremiumDeviceTransfer(()->')&&
   !toggle.includes('promptPremiumDeviceTransfer(')],
 ["Compact Premium dialog is a bounded dark popup, not a full-screen page",
   dialog.includes('new AlertDialog.Builder(activity).setView(scroller).create()')&&
   dialog.includes('getDisplayMetrics().heightPixels*0.80f')&&
   dialog.includes('setBackgroundDrawableResource(android.R.color.transparent)')&&
   dialog.includes('Tenho cupom, teste grátis ou chave Premium  ›')&&
   dialog.includes('advancedArea.setVisibility(View.GONE)')&&
   dialog.includes('advancedToggle.setOnClickListener')&&
   dialog.includes('pixPanel.setVisibility(View.GONE)')],
 ["Pix QR encodes only the backend returned payload (no mock static Pix codes)",
   gradle.includes('com.google.zxing:core:3.5.3')&&
   dialog.includes('pix[0]=String.valueOf(result.get("pixCode"))')&&
   dialog.includes('Bitmap qr=makePixQr(pix[0])')&&
   dialog.includes('new MultiFormatWriter().encode(payload')&&
   !dialog.includes('000201010212-FAKE-PIX')],
 ["Server-owned FREE campaign is shown only when active",
   dialog.includes('result.get("freeYearCampaign")')&&
   dialog.includes('freeOffer.setVisibility(active?View.VISIBLE:View.GONE)')&&
   dialog.includes('PremiumAccess.claimFreePremium(activity')&&
   access.includes('call(context,"claimFreeYear",data,cb)')],
 ["Promotion badge only shows while server-enabled",
   dialog.includes('promoBadge.setVisibility(percent>0?View.VISIBLE:View.GONE)')&&
   dialog.includes('Boolean.TRUE.equals(result.get("promotionEnabled"))')],
 ["Discount countdown is server-owned and never invented without an end date",
   dialog.includes('result.get("promotionEndsAt")')&&
   dialog.includes('result.get("serverNow")')&&
   dialog.includes('if(expiresAt[0]>0L)promoClock[0].run()')&&
   dialog.includes('handler.removeCallbacks(promoClock[0])')],
 ["Paid and redeemed Premium dismisses the modal on verified entitlement",
   dialog.includes('dialog.dismiss();')&&
   dialog.includes('PremiumAccess.redeem(activity,input')&&
   dialog.includes('PremiumAccess.order(activity,requestedOrder')&&
   dialog.includes('!requestedUid.equals(PremiumGoogleLogin.uid(activity))')],
 ["Premium purchase disabled without server config",dialog.includes("salesEnabled")&&
  dialog.includes("create.setEnabled(signed&&canSell[0]&&activeOrder[0].isEmpty())")],
 ["Creator vouchers require remote quote before Pix and preserve payment amount",
   access.includes('static void offerWithCoupon(')&&
   access.includes('data.put("couponCode"')&&
   dialog.includes('PremiumAccess.offerWithCoupon(activity,requested')&&
   dialog.includes('PremiumAccess.createPix(activity,mail,"",appliedCoupon[0]')&&
   dialog.includes('if(!typedCoupon.equals(appliedCoupon[0]))')],
 ["No payment keys embedded in app",!access.includes("POKE_MP_ACCESS_TOKEN")&&
  !dialog.includes("POKE_PREMIUM_KEY_SECRET")],
 ["Permanent signing required by controlled build",gradle.includes("Controlled QA requires the verified permanent PokeSearch signer")]
];
for(const [name,ok] of checks){assert.ok(ok,name);console.log("PASS "+name);}
console.log("PASS "+checks.length+" LT134 static regression contracts");

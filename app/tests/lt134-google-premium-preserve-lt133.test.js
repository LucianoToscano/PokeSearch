"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
const gradle=read("app/build.gradle.kts");
const main=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const online=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/CommunityScrapbookOnline.java");
const login=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/PremiumGoogleLogin.java");
const access=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/PremiumAccess.java");
const ui=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/PremiumPurchaseDialog.java");
const all=[
 ["LT133 paired top controls intact",main.includes("dualOverlayRow.addView(item")&&main.includes("if(which==0)toggleHomeOverlay();else toggleSecondaryOverlay();")],
 ["LT134 Google Premium entry alongside both P1/P2",main.includes("Google Premium · entrar / minha conta")&&main.includes("PremiumPurchaseDialog.show(this,")],
 ["Existing independent P2 filters",main.includes('getSharedPreferences("prefs_secondary",0)')&&main.includes("initializeSecondaryFilterDefaults()")],
 ["Chat Google Admin login preserved",online.includes("GoogleSignInOptions")&&online.includes("CHAT_GOOGLE_WEB_CLIENT_ID")],
 ["Only LT134 QA Premium login; no default remote lockouts",gradle.includes("val controlledDistribution = false")&&access.includes("if(!controlled())return true")],
 ["Same original package and signer checks",gradle.includes('applicationId = "com.lucianotoscano.pokesearch"')&&gradle.includes("officialTestCertificateSha256")],
 ["Same Firebase LT config shared without losing anonymous stats",login.includes('FIREBASE_APP_NAME="PokeSearchPremiumIdentity"')&&login.includes("FirebaseStats.getNamedApp(")],
 ["Google auth native (not in PoGoCoordinates)",login.includes("GetSignInWithGoogleOption")&&login.includes("signInWithCredential(")&&!login.includes("new WebView(")],
 ["Google session logout invalidates cached authorization",login.includes("PremiumAccess.invalidateLease()")&&login.includes("auth(activity).signOut()")],
 ["Backend points to verified Deus Ivern, without Netlify source deployment",gradle.includes("https://pokesearch-premium-ivern.netlify.app/api/premium")],
 ["Only signed-in Google UID can redeem Premium keys",access.includes("PremiumGoogleLogin.isGoogleSignedIn(appContext)")&&access.includes('"redeemPremiumKey"')],
 ["QA copy does not claim that licensing is enforced",ui.includes("LT134 mantém as duas Pokébolas sem bloqueio.")],
 ["Retain Halloween 2021 costume mapping",read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/CaptureChatCard.java").includes("class CaptureChatCard")&&
  fs.existsSync(path.join(root,"app/tests/lt133-halloween-costume-compact-chat.test.js"))],
];
for(const [name,pass] of all){assert.ok(pass,name);console.log("PASS",name);}
console.log("PASS LT134 contract checks:",all.length);

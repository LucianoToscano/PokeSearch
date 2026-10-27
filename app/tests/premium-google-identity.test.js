"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const read=p=>fs.readFileSync(path.join(__dirname,"../..",p),"utf8");
const login=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/PremiumGoogleLogin.java");
const access=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/PremiumAccess.java");
const stats=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/FirebaseStats.java");
const main=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const purchase=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/PremiumPurchaseDialog.java");
const gradle=read("app/build.gradle.kts");
const checks=[
 ["dedicated Premium Firebase auth, not Stats anonymous identity",
  login.includes('FIREBASE_APP_NAME="PokeSearchPremiumIdentity"')&&
  login.includes("FirebaseStats.getNamedApp(context.getApplicationContext())")&&
  !access.includes("FirebaseAuth.getInstance(firebase)")],
 ["Firebase ID token sent only to Google/Firebase SDK",
  login.includes("GoogleAuthProvider.getCredential(idToken,null)")&&
  login.includes("signInWithCredential(")&&
  !login.includes("SharedPreferences")],
 ["Google Credential Manager, not embedded WebView OAuth",
  login.includes("GetSignInWithGoogleOption")&&login.includes("getCredentialAsync(")&&
  !login.includes("new WebView(")&&!login.includes("android.webkit.WebView")],
 ["Firebase Google provider verified on Premium identity",
  login.includes('"google.com".equals(provider.getProviderId())')&&
  access.includes("PremiumGoogleLogin.isGoogleSignedIn(appContext)")],
 ["P1 anonymous policy retains free access",
  access.includes('"checkDistributionAccess".equals(name)')&&
  access.includes("auth.signInAnonymously()")],
 ["Premium redeem and Pix refuse anonymous user",
  access.includes("if(!anonymousAllowed&&!PremiumGoogleLogin.isGoogleSignedIn(appContext))")],
 ["Web & Android Premium grants resolve same Firebase project/UID",
  login.includes("stats.getOptions()")&&
  login.includes("auth(activity).signInWithCredential(")],
 ["Stats database counters remain anonymous",
  stats.includes('FirebaseApp.getInstance("PokeSearchStats")')&&
  stats.includes("auth.signInAnonymously()")],
 ["P2 opens Google login before purchasing or redeeming",
  main.includes("if(!PremiumGoogleLogin.isGoogleSignedIn(this))")&&
  purchase.includes("googleLogin.setOnClickListener")&&
  purchase.includes("activate.setEnabled(signed)")],
 ["Purchase pending order bound to current UID",
  purchase.includes('pending.getString("latestOrderUid","")')&&
  purchase.includes('.putString("latestOrderUid",PremiumGoogleLogin.uid(activity))')],
 ["Sign-out discards temporary lease and account access",
  login.includes("PremiumAccess.invalidateLease()")&&
  login.includes("auth(activity).signOut()")&&
  access.includes("++lastRequest;")],
 ["Google OAuth Web Client ID must be supplied for signed controlled APKs",
  gradle.includes('System.getenv("POKE_GOOGLE_WEB_CLIENT_ID")')&&
  gradle.includes("if (controlledDistribution && premiumGoogleWebClientId.isEmpty())")],
 ["Normal APK stays uncontrolled",
  gradle.includes('buildConfigField("boolean", "CONTROLLED_DISTRIBUTION", "false")')],
 ["No live Pix, billing, distribution flags changed",
  !login.includes("POKE_MP_")&&
  !purchase.includes('salesEnabled",true')&&
  !main.includes('distribution/globalEnabled=true')],
];
for(const [label,ok] of checks){assert.ok(ok,label);console.log("PASS "+label);}
console.log("PASS "+checks.length+" Google Premium QA static contracts");

"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay");
const main=fs.readFileSync(path.join(root,"MainActivity.java"),"utf8");
const hero=fs.readFileSync(path.join(root,"HomePremiumGlass.java"),"utf8");
const keep=["overlayControl=makeIcon(", "secondaryOverlayControl=makeIcon(",
"toggleHomeOverlay();else toggleSecondaryOverlay()", "brandTitle.setImageResource(R.drawable.ps_home_official_wordmark)",
"homeThemeButton.setOnClickListener(v->toggleHomeTheme())",
"heart.setOnClickListener(v->PixSupport.show(this))",
"menu.setOnClickListener(v->showHomeMenu())",
"FirebaseStats.bind(this,online,installations)",
"CommunityScrapbookStage1.homePanel(this,homeLightMode)",
"refreshSessionSummary()", "refreshHomeOverlay()",
"HomePremiumGlass.create(this,homeLightMode,",
"this::showPremiumAccountOptions",
"pageBackground.setImageResource(homeLightMode?",
"R.drawable.ps_home_background_dark",
"homeSurfacesTransparency()", "homeSurfaces.clear()", "homeSurfaceBaseAlpha.clear()",
"getSharedPreferences(\"prefs\",0).getBoolean(\"homeLightMode\",false)"
];
for(const item of keep)assert.ok(main.includes(item),"Missing retained Home feature: "+item);
assert.ok(main.includes("homeSurfaceBaseAlpha.add(Color.alpha(color))"),
 "Glass must not become opaque at 0% slider transparency");
assert.ok(main.includes("Color.argb(181,41,43,44)"),
 "Dark smoke glass required; not a hard black/blue tile");
assert.ok(main.indexOf("screen.addView(dualOverlayRow,dualLp)") <
 main.indexOf("screen.addView(HomePremiumGlass.create(this,homeLightMode,"));
assert.ok(main.indexOf("screen.addView(HomePremiumGlass.create(this,homeLightMode,") <
 main.indexOf("screen.addView(auth,new LinearLayout.LayoutParams(-1,-2))"));
assert.doesNotMatch(main,/TextView accountPremium=homeText/);
assert.ok(hero.includes("PremiumAccess.permitted(true)"),
 "Never invent active Premium state from UI");
assert.ok(hero.includes("PremiumGoogleLogin.isGoogleSignedIn(a)"),
 "Account label requires real Google sign-in state");
assert.ok(hero.includes("account.setOnClickListener(v->onAccount.run())"));
assert.ok(hero.includes("Seu universo de caça."));
assert.ok(hero.includes("Color.argb(215,68,66,63)"),
 "Warm smoked glass, not blue-black UI");
assert.doesNotMatch(hero,/startService\(|stopService\(|HttpURLConnection|WebView|SharedPreferences/);
console.log("LT150 PASS: new glass Premium Home, preserved original control/overlay/login/chat, real account state");

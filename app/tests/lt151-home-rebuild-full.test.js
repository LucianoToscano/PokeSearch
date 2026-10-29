"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay");
const main=fs.readFileSync(path.join(root,"MainActivity.java"),"utf8");
const dash=fs.readFileSync(path.join(root,"HomeDashboardV2.java"),"utf8");
const mustPreserve=[
"overlayControl=makeIcon(R.drawable.sem_filtro",
"secondaryOverlayControl=makeIcon(R.drawable.sem_filtro",
"if(which==0)toggleHomeOverlay();else toggleSecondaryOverlay();",
"menu.setOnClickListener(v->showHomeMenu())",
"heart.setOnClickListener(v->PixSupport.show(this))",
"homeThemeButton.setOnClickListener(v->toggleHomeTheme())",
"FirebaseStats.bind(this,online,installations)",
"CommunityScrapbookStage1.homePanel(this,homeLightMode)",
"this::openPicker,this::showPreferencesDialog",
"this::showPremiumAccountOptions",
"this::openTribute",
"refreshSessionSummary();",
"refreshHomeOverlay();",
"homePrimaryState.setText(",
"homeSecondaryState.setText(",
"pageBackground.setImageResource(homeLightMode?",
"R.drawable.ps_home_background_dark"
];
for(const contract of mustPreserve)assert.ok(main.includes(contract),"LT151 preserved feature missing "+contract);
assert.match(main,/HomeDashboardV2\.restylePokeballs\(/);
assert.match(main,/HomeDashboardV2\.assemble\(/);
assert.match(dash,/screen\.removeAllViews\(\)/);
for(const part of ["ENCONTRE O","EXTRAORDINÁRIO","01   SUAS POKÉBOLAS",
"02   PERFIL DO TREINADOR","03   POKESEARCH AO VIVO","04   COMUNIDADE",
"Favoritos","Configurar","Comunidade","EXPERIÊNCIA PREMIUM"])
 assert.ok(dash.includes(part),"Missing new dashboard section "+part);
assert.match(dash,/ring1|ring2/);
assert.match(dash,/item\.setOrientation\(LinearLayout\.VERTICAL\)/);
assert.match(dash,/item\.addView\(icon,new LinearLayout\.LayoutParams\(dp\(a,49\),dp\(a,49\)\)\)/);
assert.match(dash,/row\.setOnClickListener\(v->action\.run\(\)\)/);
assert.match(dash,/col\.setOnClickListener\(v->action\.run\(\)\)/);
assert.match(dash,/PremiumAccess\.permitted\(true\)/);
assert.doesNotMatch(dash,/startService\(|stopService\(|HttpURLConnection|\.getSharedPreferences\(/);
assert.match(dash,/screen\.addView\(hero\(a,light,opacity\)/);
assert.match(dash,/screen\.addView\(balls,new LinearLayout\.LayoutParams\(-1,dp\(a,122\)\)\)/);
assert.match(dash,/screen\.addView\(account,block\(a,0,8\)\)/);
assert.match(dash,/screen\.addView\(stats,new LinearLayout\.LayoutParams\(-1,dp\(a,50\)\)\)/);
assert.match(dash,/screen\.addView\(community,block\(a,0,6\)\)/);
console.log("LT151 PASS: major Home reconstruction and all PokeSearch contracts preserved");

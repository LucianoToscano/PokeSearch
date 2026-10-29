"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const source=path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay");
const main=fs.readFileSync(path.join(source,"MainActivity.java"),"utf8");
const home=fs.readFileSync(path.join(source,"HomeIllustrated152.java"),"utf8");
for(const v of [
"HomeIllustrated152.assemble(","homeIllustratedState.refresh(this)",
"this::showHomeAccountDialog","this::toggleHomeOverlay",
"this::toggleSecondaryOverlay","this::openPicker",
"CommunityScrapbookStage1.openFull(this)",
"ReleaseNotes.showHistory(this)","FirebaseStats.bind(this,online,installations)",
"R.drawable.ps_home_background_light",
"R.drawable.ps_home_brand_transparent",
"R.drawable.ps_home_official_wordmark",
"homeAuthHost.addView(auth",
"if(PremiumAccess.controlled())showPremiumAccountOptions()",
"homeMissionBadge.setOnClickListener(v->openSupportMission())",
"sessionHint=homeText",
"trainerPanel=new LinearLayout(this)",
"overlayControl=makeIcon(",
"secondaryOverlayControl=makeIcon(",
"R.drawable.sem_filtro","R.drawable.personalizado",
])assert.ok(main.includes(v),"Missing original feature: "+v);
for(const v of [
"Perfil","Pokébola 1","Pokébola 2","100%","0%",
"Última atualização","Destaques da comunidade","Chat da Comunidade",
"Ver todas","Shiny","Eventos","Raids","Dicas","PvP",
"PremiumAccess.controlled()&&PremiumAccess.permitted(true)",
"OverlayService.isRunning()","OverlayService.isSecondaryRunning()",
"screen.removeAllViews()","dock(a,frame,opacity",
"first,second,favorites,notes,openChat,settings",
"getSharedPreferences(\"prefs_secondary\"",
])assert.ok(home.includes(v)||v==="Perfil"&&main.includes("Minha conta"),
    "Missing owner-reference Home feature "+v);
assert.ok(!home.includes("1.248")&&!home.includes("12.693"),"No fake stats");
assert.ok(!home.includes("Luciano"),"Never hardcode profile identity");
assert.ok(!home.includes("09/11/2026"),"Premium validity must be server-verified");
assert.ok(!home.includes("startService(")&&!home.includes("stopService("),
    "This class is presentation only");
assert.ok(!main.includes("screen.addView(new View(this),new LinearLayout.LayoutParams(1,0,1))"),
    "Original stacked Home blank filler must be gone");
console.log("PASS LT152 screenshot-led Home: original controls intact, dynamic stats, no invented user or license data");

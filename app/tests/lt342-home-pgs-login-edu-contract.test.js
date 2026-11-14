"use strict";
// LT342: contratos de paridade visual, sem substituir homologação física.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const root=path.join(__dirname,"../src/main");
const source=(file)=>fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay",file),"utf8");
const main=source("MainActivity.java");
const pgs=source("PgsAutoClickService.java");
const menu=source("PgsAutoMenus.java");
const edu=source("EduSpriteInspector.java");
const assistant=source("RaidDayAssistantOverlayService.java");
const profile=fs.readFileSync(path.join(root,"assets/profile_summary.js"),"utf8");

// Badge acima da Pokébola, gap ~10dp sem mover fileira nem crescer logo.
assert.match(main,/homeLightMode\?R\.drawable\.login_modo_escuro:\s*R\.drawable\.login_modo_claro/);
assert.match(main,/d\(23\),d\(21\),Gravity\.TOP\|Gravity\.RIGHT/);
assert.match(main,/shell\.addView\(icon,new FrameLayout\.LayoutParams\(-1,d\(44\),Gravity\.BOTTOM\)\)/);
assert.match(main,/LinearLayout\.LayoutParams\(0,d\(70\),1\)/);
assert.match(main,/screen\.addView\(header,new LinearLayout\.LayoutParams\(-1,d\(96\)\)/);
assert.match(main,/header\.addView\(branding,new LinearLayout\.LayoutParams\(-1,d\(54\)\)/);
assert.match(main,/wordmarkWidth=Math\.max\(d\(104\),Math\.min\(d\(118\),availableBrandWidth\)\)/);
assert.match(main,/shareIcon=makeIcon\(R\.drawable\.home_share_icon/);
assert.match(main,/homeLightMode\?Color\.BLACK:Color\.WHITE,android\.graphics\.PorterDuff\.Mode\.SRC_IN/);
assert.match(main,/shareIcon\.setImageAlpha\(255\)/);
assert.match(main,/heart\.setBackground\(null\)/);
assert.match(main,/menu\.setBackground\(null\)/);

// HOME: overlay artworks. BOLHA PGS: disco frontal ON/OFF.
assert.match(main,/addHomePreviewIcon\(dualOverlayRow,R\.drawable\.busca_pokemon_overlay_off/);
assert.match(main,/R\.drawable\.busca_pokemon_overlay_on:R\.drawable\.busca_pokemon_overlay_off/);
assert.match(pgs,/handView\.setImageResource\(R\.drawable\.busca_pokemon_off\)/);
assert.match(pgs,/R\.drawable\.busca_pokemon_on:R\.drawable\.busca_pokemon_off/);
assert.match(pgs,/coreIndicator\.setVisibility\(View\.GONE\)/);
assert.match(pgs,/PgsAutoVisualState\.Core\.GREEN/);
assert.match(pgs,/PgsAutoVisualState\.Core\.RED/);
assert.match(pgs,/setCoreState\(PgsAutoVisualState\.core\(running,awaitingMap,pausedByError,value\)\)/);
assert.match(menu,/mount\(root,138,292\)/);
assert.match(menu,/mount\(root,286,390\)/);
assert.match(menu,/toolbar\.setVisibility\(View\.GONE\)/);
assert.match(menu,/toolbar\.setVisibility\(View\.VISIBLE\)/);

// Originais preservados em formatos verdadeiros e sem recompactação.
for(const [name,sha] of Object.entries({
 "busca_pokemon_off.webp":"db04e55514310df4c7ad46ada7571a0b0bf3fa8f212d8797e434ae22c1f37eef",
 "busca_pokemon_on.webp":"3384542e8e70826aeae1c17b219cacd5c7618e9914949d8de836f350c80e9be9",
 "busca_pokemon_overlay_off.webp":"51ef63deb8589e4cd5c68e2557095e96a0c05da094199e26757d4b1e0b95389b",
 "busca_pokemon_overlay_on.webp":"66166c7ef5a5524452358ac55d62f8a530dd547f5bc51f2bdeac7e6296832a96"
})){
 const data=fs.readFileSync(path.join(root,"res/drawable-nodpi",name));
 assert.equal(data.toString("ascii",0,4),"RIFF");
 assert.equal(data.toString("ascii",8,12),"WEBP");
 assert.equal(crypto.createHash("sha256").update(data).digest("hex"),sha,name);
}
assert.equal(fs.existsSync(path.join(root,"res/drawable-nodpi/busca_pokemon_off.png")),false);
assert.ok(fs.existsSync(path.join(root,"assets/ui-originals/busca_pokemon_off_previous_alpha.png")));

// Login: apenas perfil público visível da conta correta e hidratação limitada.
assert.match(profile,/querySelectorAll\("h1,h2,h3,h4,strong,b,span,p"\)/);
assert.match(profile,/if\(!displayName&&members\.length\)/);
assert.doesNotMatch(profile,/document\.cookie|localStorage|access_token|sessionStorage/);
assert.match(main,/profileCaptureRetryCount<4/);
assert.match(main,/PogoAccountSlots\.prefs\(this,activeLoginSlot\)/);

// X fecha TODO o serviço do Edu, disparando onDestroy e removendo as janelas.
assert.match(edu,/void closeAssistant\(\)/);
assert.match(edu,/case 6:listener\.closeAssistant\(\);break;/);
assert.match(assistant,/@Override public void closeAssistant\(\)\{\s*\/\/ X fecha assistente inteiro;/);
assert.match(assistant,/stopSelf\(\);/);
assert.match(assistant,/eduInspector\.destroy\(\)/);
console.log("LT342 design, artes, login e fechamento Edu: PASS (Samsung ainda pendente)");

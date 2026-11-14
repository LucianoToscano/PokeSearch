"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const base="app/src/main";
const read=(p)=>fs.readFileSync(path.join(base,p),"utf8");
const activity=read("java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const account=read("java/com/lucianotoscano/pokesearchoverlay/PogoAccountSlots.java");
const profile=read("assets/profile_summary.js");
const pgs=read("java/com/lucianotoscano/pokesearchoverlay/PgsAutoClickService.java");
const pgsMenu=read("java/com/lucianotoscano/pokesearchoverlay/PgsAutoMenus.java");
const edu=read("java/com/lucianotoscano/pokesearchoverlay/EduSpriteInspector.java");
const atlas=read("java/com/lucianotoscano/pokesearchoverlay/EduSpriteAtlas.java");
const candy=read("java/com/lucianotoscano/pokesearchoverlay/RareCandyOverlayService.java");
const candyHtml=read("assets/rare_candy_controls.html");
const rank=read("assets/pvp_rank_explorer.js");
const dock=read("assets/dock.html");
function image(name,type){
 const b=fs.readFileSync(path.join(base,"res/drawable-nodpi",name));
 if(type==="webp"){
  assert.equal(b.toString("ascii",0,4),"RIFF",name);
  assert.equal(b.toString("ascii",8,12),"WEBP",name);
 }else assert.equal(b.subarray(0,8).toString("hex"),"89504e470d0a1a0a",name);
 return b;
}
for(const name of ["home_pokeball_off.webp","home_pokeball_on.webp",
 "login_modo_claro.webp","login_modo_escuro.webp","login_modo_semlogin.webp"])
 image(name,"webp");
image("lixeira_branca.png","png");
image("lixeira_preta.png","png");
for(const state of ["off","on"]){
 assert.equal(fs.existsSync(path.join(base,"res/drawable-nodpi","home_pokeball_"+state+".png")),false,
  "No duplicated drawable basename");
 assert.ok(fs.existsSync(path.join(base,"assets/ui-originals","home_pokeball_"+state+"_previous.png")),
  "Archive old source without deleting original");
}
// Account badges 12dp over ball, no large card; only verified account display.
assert.match(activity,/pokeballLoginBadges=new ImageView\[2\]/);
assert.match(activity,/d\(12\),d\(12\),Gravity\.CENTER/);
assert.match(activity,/showCompactAccountNames\(loginHotspot\)/);
assert.match(activity,/login_modo_claro/);
assert.match(activity,/login_modo_escuro/);
assert.match(activity,/login_modo_semlogin/);
assert.doesNotMatch(activity,/overlayAccountLabel1=homeText\("P1 · Conta 1"/);
assert.match(activity,/branding\.addView\(brand/);
assert.match(activity,/branding\.addView\(brandLabels/);
assert.match(activity,/header\.setOrientation\(LinearLayout\.VERTICAL\)/);
assert.match(activity,/wordmarkWidth=Math\.max\(d\(130\),Math\.min\(d\(205\),availableBrandWidth\)\)/);
assert.match(activity,/heart\.setBackground\(null\)/);
assert.match(activity,/menu\.setBackground\(null\)/);
assert.match(activity,/shareIcon\.setColorFilter\(homeLightMode\?Color\.BLACK:Color\.WHITE\)/);
assert.match(activity,/R\.drawable\.busca_pokemon_on:R\.drawable\.busca_pokemon_off/);
assert.doesNotMatch(activity,/new PgsBuscasPanel\(/);
// Login must close with verified session even if trainer linkage lags.
// Profile DOM and avatar URLs are public and only allowlisted HTTPS CDNs.
assert.match(activity,/static boolean allowedProfileAvatar\(/);
assert.match(activity,/cdn\.discordapp\.com/);
assert.match(activity,/profileCaptureRetryCount<=3/);
assert.match(activity,/Conta conectada\. O site não carregou nome\/foto/);
assert.match(activity,/loginAutoReturnQueued&&loginDialog!=null/);
assert.match(activity,/loginDialog\.dismiss\(\)/);
assert.match(activity,/PogoAccountSlots\.attach\(website,activeLoginSlot\)/);
assert.match(account,/WebViewCompat\.setProfile\(web,NAME_2\)/);
assert.match(profile,/displayName&&context\.includes\(displayName\)/);
assert.match(profile,/parsed\.hostname==="cdn\.discordapp\.com"/);
assert.match(profile,/document\.querySelectorAll\("h1,h2,h3,strong,span"\)/);
assert.doesNotMatch(profile,/document\.cookie|localStorage|getItem\(|access_token/i);
// PGS arm must not guess that launcher screenshot is PGSharp feed.
assert.match(pgs,/Abra o feed do PGSharp para iniciar/);
assert.match(pgs,/Nenhum ícone reconhecido no feed/);
assert.match(pgs,/PgsAutoVisualState\.Core\.WHITE/);
assert.match(pgs,/coreIndicator\.setVisibility\(View\.GONE\)/);
// Rank only shows rank on the right; tiny Dex number directly beside name.
assert.match(rank,/<small class="psrPokedexNumber">#/);
assert.match(rank,/<td class="psrOverallRank"><div class="psrOverallPlace">#/);
assert.doesNotMatch(rank,/<div class="psrPokedexNumber">#/);
assert.match(rank,/Rank Geral<\/th>/);
// Candy X must end service (not just hide menu) via protected JS bridge.
assert.match(candyHtml,/onclick="Native\.stopCandyOverlay\(\)"/);
assert.match(candy,/public void stopCandyOverlay\(\)/);
assert.match(candy,/RareCandyOverlayService\.this\.closeCandyMenu\(\);\s*stopSelf\(\)/);
// Edu 68 frames unmodified, group playback and manual per-frame mode.
assert.match(atlas,/COLLECTION_COUNT=TOTAL_COUNT\+1/);
assert.match(edu,/String\[\] icons=\{"◀️","⏯️","🎦","▶️","👬","📐","❌"\}/);
assert.match(edu,/setMultiChoiceItems\(GROUP_NAMES,snapshot/);
assert.match(edu,/EduSpriteAtlas\.sequence\(GROUP_KEYS\[selectedGroup\]\)/);
assert.match(edu,/playbackHandler\.postDelayed\(playbackTick/);
assert.match(edu,/indexLabel\.setOnClickListener\(v->\{stopReview\(\);updateLabel\(\);\}\)/);
assert.match(edu,/toggleGuides\(\)/);
assert.match(edu,/pausePlayback\(\);/);
assert.match(edu,/atlas\.frame\(42\)/);
// Exact lixeira source for PGS and the WebView drawer.
assert.match(pgsMenu,/R\.drawable\.lixeira_preta:R\.drawable\.lixeira_branca/);
assert.match(dock,/ui-icons\/lixeira_branca\.png/);
assert.match(dock,/ui-icons\/lixeira_preta\.png/);
for(const name of ["lixeira_branca.png","lixeira_preta.png"]){
 const a=fs.readFileSync(path.join(base,"assets/ui-icons",name));
 const b=fs.readFileSync(path.join(base,"res/drawable-nodpi",name));
 assert.ok(a.equals(b),"Trash art copied byte-for-byte");
}
console.log("LT341 contratos: Home/conta/OAuth/PGS/rank/Doce Raro/Edu/ícones PASS");

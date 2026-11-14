"use strict";
// LT339 é estágio de interface: valida código e PNGs; NÃO cria APK nem release.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const root=path.join(__dirname,"../src/main");
const java=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
const files={
 home_pokeball_off:[256,256,"922f1314c60f0c102dcac34669117af24628390d9402e3e6197205fab18fe203"],
 home_pokeball_on:[256,256,"bdd744da75d7f3a118179f88e789f83496ec262b2e1f16590fab8cd4a80fac6e"],
 home_search:[1000,1000,"5e203b9a61b26204d62ba68147bf60a1e823abf1995f8074bbba46401ba4d183"],
 home_weather:[256,256,"3b6b6031a4de92ee06ede025a2c78c6b49e4d19e9331c3367b374702457da768"],
 home_mode_light:[512,512,"40353e440a644d2f44b040aabace3d516c339db2265dc763fc6fa482d4b04c3f"],
 home_mode_dark:[512,512,"360f66c9c04e535dca757d588b0286c2fbbca67f0b676a977b250410fbe74089"]
};
for(const [name,[w,h,expected]] of Object.entries(files)){
 const bytes=fs.readFileSync(path.join(root,"res/drawable-nodpi",name+".png"));
 assert.equal(bytes.subarray(0,8).toString("hex"),"89504e470d0a1a0a",name+" PNG");
 assert.equal(bytes.readUInt32BE(16),w,name+" largura original");
 assert.equal(bytes.readUInt32BE(20),h,name+" altura original");
 assert.ok([3,6].includes(bytes[25]),name+" transparência");
 if(bytes[25]===3)assert.ok(bytes.includes(Buffer.from("tRNS")),name+" transparência paleta");
 assert.equal(crypto.createHash("sha256").update(bytes).digest("hex"),expected,name+" bytes originais");
}
assert.match(java,/overlayControl=makeIcon\(R.drawable.home_pokeball_off/);
assert.match(java,/secondaryOverlayControl=makeIcon\(R.drawable.home_pokeball_off/);
assert.match(java,/overlayControl.setImageResource\(on\?R.drawable.home_pokeball_on:R.drawable.home_pokeball_off\)/);
assert.match(java,/secondaryOverlayControl.setImageResource\(secondaryOn\?R.drawable.home_pokeball_on:R.drawable.home_pokeball_off\)/);
assert.match(java,/pgsSearchControl=addHomePreviewIcon\(dualOverlayRow,R.drawable.busca_pokemon_off/);
assert.match(java,/R.drawable.busca_pokemon_on:R.drawable.busca_pokemon_off/);
assert.match(java,/PgsAutoClickService.isSearchActive\(\)/);
assert.match(java,/pgsHomeStateHandler.removeCallbacks\(pgsHomeStateTick\)/);
assert.match(java,/addHomePreviewIcon\(dualOverlayRow,R.drawable.home_weather,"Weather"\)/);
assert.match(java,/homeThemeButton=makeIcon\(homeLightMode\?\s*R.drawable.home_mode_dark:R.drawable.home_mode_light/);
assert.match(java,/homeThemeButton.setOnClickListener\(v->toggleHomeTheme\(\)\)/);
assert.match(java,/shareIcon.setOnClickListener\(v->sharePokeSearch\(\)\)/);
assert.match(java,/heart.setOnClickListener\(v->PixSupport.show\(this\)\)/);
assert.match(java,/rareCandyControl.setPadding\(d\(7\),d\(7\),d\(7\),d\(7\)\)/);
assert.match(java,/dualOverlayRow.addView\(rareCandyControl,new LinearLayout.LayoutParams\(0,d\(44\),1\)\)/);
assert.match(java,/addHomePreviewIcon\(dualOverlayRow,R.drawable.home_quests,"Quests"\)/);
const home=java.slice(java.indexOf("private FrameLayout buildHome(){"),java.indexOf("/** Callback from UpdateCenter"));
assert.doesNotMatch(home,/screen\.addView\(accountPremium,accountLp\)/);
assert.doesNotMatch(home,/screen\.addView\(stats,statsLp\)/);
assert.doesNotMatch(home,/screen\.addView\(shareActions,shareRowLp\)/);
assert.doesNotMatch(home,/CommunityTribute\.homeCard\(/);
assert.match(java,/addHomeDrawerItem\(drawer,"◉","Conta",this::showHomeAccountMenu\)/);
assert.match(java,/addHomeDrawerItem\(drawer,"★","Conta Premium · Gerenciar \/ Sair",\s*this::showPremiumAccountOptions\)/);
assert.match(java,/if\(PremiumAccess.controlled\(\)\)\s*addHomeDrawerItem\(drawer,"★","Conta Premium/);
assert.match(java,/addHomeDrawerItem\(drawer,"💙","Agradecimentos",this::openTribute\)/);
assert.match(java,/FirebaseStats.bind\(this,online,installations\)/);
assert.match(java,/drawerScroll.setFillViewport\(true\)/);
assert.match(java,/addHomeDrawerItem\(drawer,"‹","Voltar ao menu",this::showHomeMenu\)/);
assert.match(java,/showPokeballAccountChoice\(false\)/);
assert.match(java,/showPokeballAccountChoice\(true\)/);
console.log("LT339 Home: 6 PNGs originais, callbacks, gaveta Conta e visibilidade PASS (sem APK)");

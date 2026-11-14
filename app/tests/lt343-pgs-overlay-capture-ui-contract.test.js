"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const java=name=>fs.readFileSync(path.join("app/src/main/java/com/lucianotoscano/pokesearchoverlay",name+".java"),"utf8");
const home=java("MainActivity"),auto=java("PgsAutoClickService"),
 menu=java("PgsAutoMenus"),crop=java("PgsAutoCropSelection"),alpha=java("PgsHomeArtwork");
const gear=fs.readFileSync("app/src/main/res/drawable/pgs_menu_customize.xml","utf8");

// Home alignment: logo and compact controls on same visual line, badges 2dp above balls.
assert.match(home,/header\.setOrientation\(LinearLayout\.HORIZONTAL\)/);
assert.match(home,/header\.addView\(branding,new LinearLayout\.LayoutParams\(0,d\(54\),1f\)\)/);
assert.match(home,/header\.addView\(controls,new LinearLayout\.LayoutParams\(-2,d\(48\)\)\)/);
assert.match(home,/d\(23\),d\(16\),Gravity\.TOP\|Gravity\.RIGHT/);
assert.match(home,/shell\.addView\(icon,new FrameLayout\.LayoutParams\(-1,d\(44\),Gravity\.BOTTOM\)\)/);
assert.match(home,/PgsHomeArtwork\.transparentOn\(this\)/);

// Original WebP kept unchanged, RGB outside cleaned without painting black ring.
assert.match(alpha,/busca_pokemon_overlay_on/);
assert.match(alpha,/Bitmap\.Config\.ARGB_8888/);
assert.match(alpha,/getPixels\(pixels/);
assert.match(alpha,/boolean\[\] outside/);
assert.match(alpha,/if\(outside\[i\]\)pixels\[i\]=Color\.TRANSPARENT/);
assert.match(alpha,/isDarkBackdrop/);

// Menu open: tapping bubble retracts WITHOUT toggling live search.
assert.match(auto,/if\(quickMenus!=null&&quickMenus\.isOpen\(\)\)\{\s*quickMenus\.dismissAll\(\);return true;\s*\}\s*toggle\(\)/);
assert.match(auto,/PgsAutoTemplateStore\.active\(this\)/);
assert.match(auto,/if\(existing\)PgsAutoTemplateStore\.clearTeaching\(this\)/);
assert.match(auto,/scheduleArmedStart\(\)/);
assert.match(auto,/onInterrupt\(\) \{\s*\/\/ Uma perda temporária/);

// Passenger prompt is safety-sensitive: observe, pause, wait MANUAL, never click it.
assert.match(auto,/normalized\.contains\("sou passageiro"\)/);
assert.match(auto,/normalized\.contains\("i'm a passenger"\)/);
assert.match(auto,/status\("CONFIRME MANUALMENTE"\)/);
assert.match(auto,/if\(passengerPromptPresent\(\)\)/);
assert.doesNotMatch(auto,/performAction\(AccessibilityNodeInfo\.ACTION_CLICK\)/);

// Crop editor: no touch-to-save; explicit confirm, preview, cancel and adjustable crop.
assert.match(crop,/extends View/);
assert.match(crop,/selectedBitmapRect\(\)/);
assert.match(crop,/ACTION_MOVE/);
assert.match(auto,/new PgsAutoCropSelection/);
assert.match(auto,/confirm\.setText\("✓ Confirmar"\)/);
assert.match(auto,/cancel\.setText\("Cancelar"\)/);
assert.match(auto,/PgsAutoTemplateStore\.saveSample\(this,name,model,ref,ref\)/);

// PGS 5-tile toolbar with settings beside bell, isolated P/M/G, timer and alpha.
assert.match(gear,/android:pathData=/);
assert.match(menu,/R\.drawable\.ic_bell_outline,R\.drawable\.pgs_menu_customize/);
assert.match(menu,/this::showNotifications,this::showAppearance/);
assert.match(menu,/width=dp\(5\+5\*44\+4\*4\+5\)/);
assert.match(menu,/String\[\] names=\{"Novos Pokémon","Shiny monitorado"\}/);
assert.match(menu,/showCountdown/);
assert.match(menu,/for\(String value:new String\[\]\{"P","M","G"\}\)/);
assert.match(menu,/menuAlphaPercent/);
assert.match(menu,/SeekBar opacity=new SeekBar/);
assert.match(auto,/private void refreshAppearance\(\)/);
assert.match(auto,/private TextView handBadge,countdownBadge/);
assert.doesNotMatch(auto,/notifyConfigured\(PgsAutoNotificationPolicy\.SEARCH,/);

// Pacote original completo, dividido em 5 ZIPs ZIP_STORED sem recompressão PNG.
const crypto=require("node:crypto");
const newPack=java("HomeMenuIconPack");
assert.match(newPack,/options\.inScaled=false/);
assert.match(newPack,/ZipInputStream/);
assert.match(newPack,/menu_icons_512_/);
assert.match(home,/setHomePackIcon\(overlayControl,1,on\?"ativo":"normal"\)/);
assert.match(home,/setHomePackIcon\(secondaryOverlayControl,2,secondaryOn\?"ativo":"normal"\)/);
assert.match(home,/setHomePackIcon\(raidAssistantControl,4,"normal"\)/);
assert.match(home,/setHomePackIcon\(rareCandyControl,10,"normal"\)/);
const expected={
 1:"652d4d98336b99cd466d30267aadfda0f7844e34fe3c757ef69cf963b39a41ff",
 2:"7c29fe87a22d01bf17c9e1c9803045e22fdfd30a0da33eb0e8132416295a4080",
 3:"37bccbada1ab7eb1d726cd792c0d1e7efdaca150bfb0b073e6ba9beb37bfbfd0",
 4:"7af7494f1202123409c03cee636cfad9424079e61b8514fea533a7971392554b",
 5:"d84cc77d33e5913697aea39525076e5e281a519b67407358392872de45acfd4b"
};
const found=new Set();
for(const [part,sha] of Object.entries(expected)){
 const data=fs.readFileSync(path.join("app/src/main/assets","menu_icons_512_"+part+".zip"));
 assert.equal(crypto.createHash("sha256").update(data).digest("hex"),sha);
 let index=0;
 while(index+30<data.length && data.readUInt32LE(index)===0x04034b50){
   const method=data.readUInt16LE(index+8),size=data.readUInt32LE(index+18);
   const nameLen=data.readUInt16LE(index+26),extra=data.readUInt16LE(index+28);
   const name=data.subarray(index+30,index+30+nameLen).toString("utf8");
   const start=index+30+nameLen+extra;
   assert.equal(method,0,"PNG original nunca deve ser recomprimido no ZIP");
   assert.ok(name.startsWith("menu_icons/"),name);
   const png=data.subarray(start,start+size);
   assert.equal(png.toString("hex",0,8),"89504e470d0a1a0a",name);
   assert.equal(png.readUInt32BE(16),512,name);
   assert.equal(png.readUInt32BE(20),512,name);
   found.add(name);
   index=start+size;
 }
}
const expectedNames=[];
for(let i=1;i<=10;i++){
 const n=String(i).padStart(2,"0");
 expectedNames.push("menu_icons/"+n+"_normal.png","menu_icons/"+n+"_hover.png");
 if(i<=2)expectedNames.push("menu_icons/"+n+"_ativo.png",
   "menu_icons/"+n+"_ativo_hover.png");
}
assert.deepEqual([...found].sort(),expectedNames.sort(),"24 artes originais 512x512");
assert.ok(fs.existsSync("app/src/main/assets/ui-originals/busca_pokemon_overlay_on_rgb_original.webp"));
const alphaWebp=fs.readFileSync("app/src/main/res/drawable-nodpi/busca_pokemon_overlay_on.webp");
assert.equal(crypto.createHash("sha256").update(alphaWebp).digest("hex"),
 "2ef52d0edd1dcf1b5ab78ff80fd24a1eb8e96084494d23ad5fbb63f63b5decc6");

console.log("LT343: captura confirmada, estados seguros, menus PGS, artes e Home PASS (teste físico pendente)");

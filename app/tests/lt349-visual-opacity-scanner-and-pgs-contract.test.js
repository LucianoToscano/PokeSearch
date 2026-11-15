"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"../src/main");
const read=x=>fs.readFileSync(path.join(root,x),"utf8");
const js=read("assets/visual_editor.js");
const dock=read("assets/dock.html");
const native=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const home=read("java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const pack=read("java/com/lucianotoscano/pokesearchoverlay/HomeMenuIconPack.java");
const favorites=read("java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java");
const pgs=read("java/com/lucianotoscano/pokesearchoverlay/PgsAutoMenus.java");
const style=read("java/com/lucianotoscano/pokesearchoverlay/PgsAutoMenuStyle.java");
const grip=read("res/drawable/pgs_drag_handle.xml");
const picker=read("java/com/lucianotoscano/pokesearchoverlay/PgsAutoClickService.java");
const crop=read("java/com/lucianotoscano/pokesearchoverlay/PgsAutoCropSelection.java");
for(const name of ["Icone_Background_On.png","lixeira_branca.png","lixeira_preta.png"]){
 const buf=fs.readFileSync(path.join(root,"assets/ui-icons",name));
 assert.equal(buf.subarray(0,8).toString("hex"),"89504e470d0a1a0a",name+" PNG header");
 assert.ok(buf.length>200,name+" must not be empty");
}
assert.match(dock,/Icone_Background_On\.png/);
assert.match(dock,/button\.dataset\.backgroundArtActive/);
assert.match(dock,/old\.replaceWith\(iconForQuick\("bg","▧"\)\)/);
assert.match(dock,/lixeira_branca\.png/);
assert.match(dock,/lixeira_preta\.png/);
assert.match(pgs,/R\.drawable\.lixeira_preta:R\.drawable\.lixeira_branca/);
for(const name of ["lixeira_branca.png","lixeira_preta.png"]){
 const buf=fs.readFileSync(path.join(root,"res/drawable-nodpi",name));
 assert.equal(buf.subarray(0,8).toString("hex"),"89504e470d0a1a0a",name+" native drawable");
}
assert.match(js,/showMeasurements:false/);
assert.match(js,/result\.showMeasurements=src\.showMeasurements===true/);
assert.match(js,/function saveGuideNow\(\)/);
assert.match(js,/if\(key==="menuGuides"\|\|key==="resultsGuides"\|\|key==="showMeasurements"\)/);
assert.match(js,/btn\(panel,"Medidas: "\+\(current\.showMeasurements\?"ON":"OFF"\)/);
assert.match(js,/body\.classList\.toggle\("visual-measurements",current\.showMeasurements\)/);
assert.match(js,/data-visual-measure/);
assert.match(js,/set\("menu-readable-bg",rgba\(current\.menuBgMode,current\.menuTransparency\)\)/);
assert.match(js,/set\("menu-readable-button-bg",rgba\(current\.menuBgMode,current\.menuTransparency\)\)/);
assert.match(native,/clean\.put\("showMeasurements",input\.optBoolean\("showMeasurements",false\)\)/);
assert.match(native,/if\(changedGuides\)edit\.commit\(\)/);
assert.match(dock,/LT349: identical slider alpha for Modos, Filtros, Favoritos/);
assert.match(dock,/generalPresetFlyout/);
assert.match(dock,/background:transparent!important;[\s\S]{0,150}box-shadow:none!important;border:0!important/);
assert.match(favorites,/final int panelAlpha=\(int\)Math\.round\(255\.0\*\(1-transparency\/100\.0\)\)/);
assert.match(favorites,/rowBg\.setColor\(Color\.TRANSPARENT\)/);
assert.match(pack,/addOnLayoutChangeListener\(listener\)/);
assert.match(pack,/view\.post\(\(\)->applyVisibleMatrix\(view,image\)\)/);
assert.match(home,/dualOverlayRow\.post\(\(\)->\{/);
assert.doesNotMatch(home,/rareCandyControl\.setScaleType\(ImageView\.ScaleType\.FIT_CENTER\)/);
assert.doesNotMatch(home,/raidAssistantControl\.setScaleType\(ImageView\.ScaleType\.FIT_CENTER\)/);
assert.match(grip,/M5,7 L19,7 M5,12 L19,12 M5,17 L19,17/);
assert.doesNotMatch(grip,/M12,2 L12,22/);
assert.match(pgs,/FLAG_WATCH_OUTSIDE_TOUCH/);
assert.match(pgs,/FLAG_NOT_TOUCH_MODAL/);
assert.match(pgs,/if\(!hasTextInput\(root\)\)/);
assert.match(pgs,/void refreshBellShiny\(\)/);
assert.match(pgs,/inner\.topMargin=dp\(-2\)/);
assert.match(pgs,/dp\(8\),dp\(8\),Gravity\.CENTER/);
assert.match(pgs,/bellShiny\.setVisibility\("off"\.equals\(state\)\?View\.GONE:View\.VISIBLE\)/);
assert.doesNotMatch(pgs,/if\(toolbar!=null\)toolbar\.setVisibility\(View\.GONE\)/);
assert.doesNotMatch(style,/#FF70B8F2/);
assert.match(style,/if\(guides\)a=Math\.min\(a,51\)/);
assert.match(picker,/bg\.setColor\(0x4D35373D\)/);
assert.match(picker,/confirm\.setPadding\(dp\(12\),dp\(12\),dp\(12\),dp\(12\)\)/);
assert.match(picker,/cancel\.setPadding\(dp\(12\),dp\(12\),dp\(12\),dp\(12\)\)/);
assert.match(picker,/backgroundIcon\.setPadding\(dp\(12\),dp\(12\),dp\(12\),dp\(12\)\)/);
assert.match(picker,/pgs_crop_square_thin/);
assert.match(picker,/pgs_crop_free_thin/);
assert.match(picker,/pgs_crop_vertical_thin/);
assert.match(crop,/VERTICAL_WIDTH_HEIGHT_RATIO=0\.75f/);
assert.doesNotMatch(crop,/mode==Mode\.VERTICAL\?side\/1\.8f/);
for(const glyph of ["pgs_crop_square_thin","pgs_crop_free_thin","pgs_crop_vertical_thin"]){
 const xml=read("res/drawable/"+glyph+".xml");
 assert.match(xml,/android:strokeWidth="1\.45"/);
 assert.match(xml,/android:viewportWidth="24"/);
}
new Function(js);
for(const script of dock.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)){
 if(script[1].trim())new Function(script[1]);
}
console.log("LT349 PASS: Drive PNGs, guide persistence/ruler, shared opacity, Home scale, PGS pass-through, scanner 3:4 + thin controls");

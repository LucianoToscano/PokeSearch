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
console.log("LT343: captura confirmada, estados seguros, menus PGS, artes e Home PASS (teste físico pendente)");

const fs=require('node:fs');const assert=require('node:assert/strict');
const dock=fs.readFileSync('app/src/main/assets/dock.html','utf8');
const menus=fs.readFileSync('app/src/main/java/com/lucianotoscano/pokesearchoverlay/PgsAutoMenus.java','utf8');
assert.match(dock,/form:false,moves:false,location:false,distance:false,shiny:false/,'distance hidden on fresh settings');
assert.match(menus,/toolbar\.getLayoutParams\(\) instanceof WindowManager\.LayoutParams/,'submenu must use actual toolbar position');
// LT349b: popup follows actual toolbar at either side of the Auto Click
// bubble. Fallback below/above is only used when neither side has room.
assert.match(menus,/barX=bar.x;barY=bar.y;barW=bar.width;barH=bar.height/,'use live toolbar bounds');
assert.match(menus,/right=barX\+barW\+gap,left=barX-width-gap/,'submenu lateral to live toolbar');
assert.match(menus,/int below=barY\+barH\+gap,above=barY-height-gap/,'top/bottom fallback');
assert.match(menus,/int\[\] place=positionPanel\(width,height\)/,'popup moves with toolbar');
console.log('LT345 incremental UI contracts OK');

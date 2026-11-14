const fs=require('node:fs');const assert=require('node:assert/strict');
const dock=fs.readFileSync('app/src/main/assets/dock.html','utf8');
const menus=fs.readFileSync('app/src/main/java/com/lucianotoscano/pokesearchoverlay/PgsAutoMenus.java','utf8');
assert.match(dock,/form:false,moves:false,location:false,distance:false,shiny:false/,'distance hidden on fresh settings');
assert.match(menus,/toolbar\.getLayoutParams\(\) instanceof WindowManager\.LayoutParams/,'submenu must use actual toolbar position');
assert.match(menus,/toolbarTop\+toolbarHeight\+dp\(4\)/,'submenu below actual toolbar');
assert.match(menus,/toolbarLeft-width\/2/,'submenu centered on actual toolbar');
console.log('LT345 incremental UI contracts OK');

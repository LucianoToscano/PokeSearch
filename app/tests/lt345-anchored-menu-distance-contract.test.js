"use strict";
const fs=require('node:fs'),assert=require('node:assert/strict');
const dock=fs.readFileSync('app/src/main/assets/dock.html','utf8');
const menus=fs.readFileSync('app/src/main/java/com/lucianotoscano/pokesearchoverlay/PgsAutoMenus.java','utf8');
assert.match(dock,/form:false,moves:false,location:false,distance:false,shiny:false/,
  'distance hidden on fresh settings');
// LT369: a mão abre direto o ÚNICO painel; ele deve ancorar na bolha,
// jamais em uma toolbar intermediária de cinco ícones.
const toggle=menus.split('void toggle(int x,int y)')[1]?.split('void dismissAll()')[0]||'';
// LT409 opens in the compact Action chooser, still anchored to the same bubble.
assert.match(toggle,/showCentral\(1\)/);
assert.doesNotMatch(toggle,/showToolbar\(/);
const begin=menus.indexOf('private int[] positionPanel(');
const end=menus.indexOf('private void applyNativeBlur(',begin);
assert.ok(begin>0&&end>begin);
const placement=menus.slice(begin,end);
assert.match(placement,/leftEdge=anchorX-diameter\/2/);
assert.match(placement,/rightEdge=anchorX\+diameter\/2/);
assert.match(placement,/right=rightEdge\+gap,left=leftEdge-gap-width/);
assert.match(placement,/if\(\(preferRight&&rightFits\)\|\|\(!leftFits&&rightFits\)\)/);
assert.match(placement,/else if\(leftFits\)/);
assert.match(placement,/screen\.x-width-margin/);
assert.match(placement,/screen\.y-height-margin/);
assert.match(menus,/int\[\] place=positionPanel\(width,height\)/);
assert.match(menus,/if\(panel==opened\)reanchor\(anchorX,anchorY\)/);
console.log('LT345: menu único ao lado da bolha, sem toolbar intermediária PASS');

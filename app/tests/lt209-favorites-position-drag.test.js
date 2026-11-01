"use strict";
// LT209: favorites must align outside toolbar after real layout measurement,
// allow deliberate drag from header and restore the automatic position on tap.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const picker=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java"),"utf8");
const geometry=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/FavoritePanelGeometry.java"),"utf8");
const service=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const dock=fs.readFileSync(path.join(__dirname,"../src/main/assets/dock.html"),"utf8");
for(const part of [
 'root.addOnLayoutChangeListener((v,l,t,r,b,ol,ot,or,ob)->place[0].run());',
 'root.post(place[0]);','window.getDecorView().post(place[0]);',
 'int actualHeight=root.getHeight();','if(placed[0]||actualHeight<=0||!root.isAttachedToWindow())return;',
 'FavoritePanelGeometry.adjacent(anchorX,anchorY,screen,displayH,',
 'lp.gravity=Gravity.TOP|Gravity.LEFT;',
 'window.addFlags(android.view.WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL)',
 'android.view.WindowManager.LayoutParams.WRAP_CONTENT',
 'title.setOnTouchListener(new View.OnTouchListener(){',
 'v.postDelayed(arm,220);','android.view.MotionEvent.ACTION_MOVE',
 'v.performHapticFeedback(android.view.HapticFeedbackConstants.LONG_PRESS)',
 'positionPrefs.edit().putBoolean("favoritePanelManualV1",true)',
 'positionPrefs.edit().remove("favoritePanelManualV1").apply();',
 'v.performClick();',
 'setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)',
 'title.setContentDescription("Favoritos. Segure o título e arraste',
 'title.setText("⠿ FAVORITOS")'
])assert.ok(picker.includes(part),"missing: "+part);
assert.ok(geometry.includes('boolean placeBelow=spaceBelow>=panelH ||'));
assert.ok(geometry.includes('spaceAbove<panelH && spaceBelow>=spaceAbove'));
assert.ok(picker.includes('finish.setOnClickListener(v->dialog.dismiss());'));
assert.ok(picker.includes('selectedRow.setVisibility(size>0?View.VISIBLE:View.GONE);'));
assert.ok(picker.includes('search.addTextChangedListener(new TextWatcher(){'));
assert.ok(picker.includes('refreshProfileStars.run();'));
assert.ok(service.includes('PokemonPicker.show(OverlayService.this'));
assert.ok(dock.includes('Native.openWatchListAt(Math.round(target.left-host.left+target.width/2)'));
assert.ok(!picker.includes("int below=anchorY+iconHalf+gap;"),"obsolete one-shot anchor left in place");
console.log("PASS LT209: measured Favorites positioning, reversible drag, compact non-modal picker");

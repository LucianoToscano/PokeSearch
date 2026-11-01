"use strict";
// LT210 upgrades the earlier LT209 implementation: no special button,
// direct draggable free panel surface and first-frame position outside toolbar.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const picker=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java"),"utf8");
const geometry=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/FavoritePanelGeometry.java"),"utf8");
const service=fs.readFileSync(path.join(__dirname,"../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const dock=fs.readFileSync(path.join(__dirname,"../src/main/assets/dock.html"),"utf8");
for(const part of [
 'root.measure(','View.MeasureSpec.makeMeasureSpec(preferredWidth,View.MeasureSpec.EXACTLY)',
 'dialog.show();','root.addOnLayoutChangeListener(',
 'root.post(position);','window.getDecorView().post(position);',
 'root.getHeight()>0?root.getHeight():root.getMeasuredHeight()',
 'FavoritePanelGeometry.adjacentToToolbar(',
 'FavoritePanelGeometry.overlapsToolbar(','lp.gravity=Gravity.TOP|Gravity.LEFT;',
 'window.addFlags(android.view.WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL)',
 'android.view.WindowManager.LayoutParams.WRAP_CONTENT',
 'View.OnTouchListener freePanelDrag=(v,e)->{',
 'root.setOnTouchListener(freePanelDrag);','header.setOnTouchListener(freePanelDrag);',
 'title.setOnTouchListener(freePanelDrag);','count.setOnTouchListener(freePanelDrag);',
 'android.view.MotionEvent.ACTION_MOVE','Math.abs(dx)+Math.abs(dy)>dp(activity,4)',
 'positionPrefs.edit().putBoolean("favoritePanelManualV1",true)',
 'setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)',
 'title.setText("☆ FAVORITOS")'
])assert.ok(picker.includes(part),"missing: "+part);
assert.ok(!picker.includes('v.postDelayed(arm,220)'),"long press must not be required");
assert.ok(!picker.includes('title.setText("⠿ FAVORITOS")'),"special drag button removed");
assert.ok(geometry.includes('boolean placeBelow=below>=panelH ||'));
assert.ok(geometry.includes('above<panelH && below>=above'));
assert.ok(picker.includes('finish.setOnClickListener(v->dialog.dismiss());'));
assert.ok(picker.includes('selectedRow.setVisibility(size>0?View.VISIBLE:View.GONE);'));
assert.ok(picker.includes('search.addTextChangedListener(new TextWatcher(){'));
assert.ok(picker.includes('refreshProfileStars.run();'));
assert.ok(service.includes('PokemonPicker.show(OverlayService.this'));
assert.ok(service.includes('menuParams.y+dp(Math.max(0,popupOffsetDp))'));
assert.ok(dock.includes('Native.openWatchListAt(Math.round(target.left-host.left+target.width/2)'));
console.log("PASS LT210: correct toolbar anchor and immediate free-surface drag");

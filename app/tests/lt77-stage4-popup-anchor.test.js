"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const base=path.join(__dirname,"../src/main");
const dock=fs.readFileSync(path.join(base,"assets/dock.html"),"utf8");
const service=fs.readFileSync(path.join(base,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const picker=fs.readFileSync(path.join(base,"java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java"),"utf8");
const geom=fs.readFileSync(path.join(base,"java/com/lucianotoscano/pokesearchoverlay/PopupTouchGeometry.java"),"utf8");
let pass=0;function test(label,fn){fn();console.log("PASS LT77 Stage4 "+label);pass++;}
test("all inline dock scripts parse",()=>{
 for(const m of dock.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
});
test("all independent popup kinds keep their native window",()=>{
 for(const key of ["mode","filters","location","pokemon","alerts","appearance","visual","info","period","more"])
  assert.ok(service.includes('case "'+key+'":'),key);
 assert.ok(service.includes("WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL"));
 assert.ok(service.includes('menuParams.width=width'));
});
test("horizontal/native popup anchors from visible toolbar not enlarged window",()=>{
 assert.ok(service.includes('int toolbarTop=menuParams.y+dp(popupOffsetDp);'));
 assert.ok(service.includes('PopupTouchGeometry.place(m.widthPixels,m.heightPixels,menuParams.x,toolbarTop,'));
 assert.ok(service.includes('menuParams.y+dp(popupOffsetDp)+'));
});
test("vertical popup uses measured icon height from JS",()=>{
 assert.ok(dock.includes('Native.openPopupMeasured(kind,centerX,centerY,Math.round(rect.height))'));
 assert.ok(service.includes('@JavascriptInterface public void openPopupMeasured('));
 assert.ok(service.includes('PopupTouchGeometry.placeBesideMeasured('));
 assert.ok(geom.includes('int triggerTop=toolbarY+clamp(triggerCenterY,0,toolbarHeight)-triggerHeight/2;'));
});
test("historical three-argument bridge stays compatible",()=>{
 assert.ok(service.includes('openIndependentPopup(kind,x,y,0);'));
 assert.ok(service.includes('@JavascriptInterface public void openPopup(String kind,int triggerDp,int triggerYDp)'));
 assert.ok(dock.includes('else Native.openPopup(kind,Math.round('));
});
test("native window never expands toolbar to position submenu",()=>{
 assert.ok(service.includes('popupParams.width=b.width;popupParams.height=b.height;'));
 assert.ok(service.includes('PopupTouchGeometry.avoidResult('));
 assert.ok(service.includes('if(!b.visible()){')); 
 assert.ok(service.includes('popupRoot.setVisibility(View.GONE);return;'));
 assert.ok(service.includes('visualEditorDragGrip.setVisibility(View.GONE)'));
});
test("More only scrolls when content is clipped",()=>{
 const css=dock.split('/* LT77 Stage 4: More needs a scrollbar')[1]?.split('</style>',1)[0]||"";
 assert.ok(css.includes('#choices.morePanel:not(.native-popup-clipped)'));
 assert.ok(css.includes('overflow-x:visible!important;overflow-y:visible!important;'));
 assert.ok(css.includes('#choices.morePanel.native-popup-clipped'));
 assert.ok(css.includes('overflow-x:hidden!important;overflow-y:auto!important;'));
 assert.ok(dock.includes('pane.scrollHeight>next+1'));
});
test("Favorites anchored near tapped star with outside touches preserved",()=>{
 assert.ok(picker.includes('final int margin=dp(activity,8),gap=dp(activity,8);'));
 assert.ok(picker.includes('FavoritePanelGeometry.adjacentToToolbar('));
 assert.ok(picker.includes('root.addOnLayoutChangeListener('));
 assert.ok(picker.includes('FLAG_NOT_TOUCH_MODAL'));
 assert.ok(service.includes('menuParams.x+dp(Math.max(0,Math.min(menuDp(),triggerDp)))'));
});
test("Stage2/3 and production constraints unchanged",()=>{
 assert.ok(service.includes('ResultsSpacingPolicy.DEFAULT_TOP_GAP_PX'));
 assert.ok(dock.includes('numberPair("Nível","levelMin","levelMax",true)'));
 assert.ok(dock.includes('["Male","Female","Genderless"]'));
 assert.ok(service.includes('com.lucianotoscano.pokesearchoverlay'));
});
console.log("LT77 Stage4 popup anchor: "+pass+"/"+pass+" PASS");

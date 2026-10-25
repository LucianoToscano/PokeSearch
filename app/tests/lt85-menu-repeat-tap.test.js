"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.join(__dirname,"../src/main");
const dock=fs.readFileSync(path.join(root,"assets/dock.html"),"utf8");
const service=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const picker=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java"),"utf8");
function segment(begin,end){
 const i=dock.indexOf(begin),j=dock.indexOf(end,i+begin.length);
 assert.ok(i>=0&&j>i,"missing "+begin);return dock.slice(i,j);
}
function check(label,fn){fn();console.log("PASS LT85 "+label);}
check("second tap is delegated to Android's actual popup state",()=>{
 const src=segment("window.setActiveNativePopupKind=kind=>{","/* Reposition the cascading editor");
 const native={kind:"",taps:[],openPopup(kind){this.openPopupMeasured(kind);},openPopupMeasured(kind){
  this.taps.push(kind);this.kind=this.kind===kind?"":kind;
  sandbox.window.setActiveNativePopupKind(this.kind);
 },closePopup(){throw Error("Old optimistic local close must not be called");}};
 const button={getBoundingClientRect:()=>({left:4,top:0,width:30,height:30})};
 const sandbox={
  controlsWindow:true,popupWindow:false,Native:native,activeNativePopupKind:"",
  refreshQuickMenuStates(){},
  document:{querySelector:()=>button,getElementById:()=>({getBoundingClientRect:()=>({left:0,top:0,width:300,height:34})})},
  window:{},Math
 };
 vm.createContext(sandbox);vm.runInContext(src,sandbox);
 for(const kind of ["mode","filters","location","pokemon","alerts","appearance","more"]){
  sandbox.toggleChoices(kind);assert.equal(native.kind,kind,kind+" opens");
  // Force stale mirror to reproduce the original cross-WebView race.
  sandbox.window.setActiveNativePopupKind("");
  sandbox.toggleChoices(kind);assert.equal(native.kind,"",kind+" collapses");
  sandbox.toggleChoices(kind);assert.equal(native.kind,kind,kind+" reopens");
  sandbox.toggleChoices(kind);assert.equal(native.kind,"",kind+" collapses again");
 }
 assert.equal(native.taps.length,28);
});
check("Android native popup guard closes same kind and pushes state back",()=>{
 assert.match(service,/if\(kind\.equals\(popupKind\)\)\{closeIndependentPopup\(\);return;\}/);
 assert.match(service,/window\.setActiveNativePopupKind&&window\.setActiveNativePopupKind/);
 assert.match(service,/popupKind="";popupWidthDp=popupHeightDp=0/);
});
check("outside-pointer then same launcher click cannot immediately reopen",()=>{
 assert.match(service,/private void closeIndependentPopupFromOutside\(\)/);
 assert.match(service,/outsideClosedPopupKind=popupKind/);
 assert.match(service,/outsideClosedPopupUptimeMs=android\.os\.SystemClock\.uptimeMillis\(\)/);
 assert.match(service,/boolean wasSameOutsideTap=kind\.equals\(outsideClosedPopupKind\)/);
 assert.match(service,/elapsed>=0L&&elapsed<=450L/);
 assert.match(service,/if\(wasSameOutsideTap\)return;/);
 assert.ok((service.match(/closeIndependentPopupFromOutside\(\);return false;/g)||[]).length>=1);
});
check("Favorites native Dialog closes on second icon tap without affecting selections",()=>{
 assert.match(service,/if\(pickerOpen\)\{\s*if\(favoritePickerDialog!=null\)favoritePickerDialog\.dismiss\(\);\s*return;/);
 assert.match(service,/favoritePickerDialog=PokemonPicker\.show\(/);
 assert.match(service,/if\(favoritePickerDialog==null\)pickerOpen=false/);
 assert.match(picker,/public static Dialog show\(Context activity,Runnable changed,Runnable dismissed,/);
 assert.match(picker,/return dialog;/);
 assert.match(picker,/dialog\.setOnDismissListener\(d->\{/);
});
check("all HTML inline scripts still parse",()=>{
 const scripts=[...dock.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
 assert.ok(scripts.length>0);
 scripts.forEach(s=>new vm.Script(s[1]));
});
console.log("LT85 popup toggling regression PASS");

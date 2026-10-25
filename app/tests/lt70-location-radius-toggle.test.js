"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main");
const dock=fs.readFileSync(path.join(root,"assets/dock.html"),"utf8");
const service=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const between=(s,start,end)=>{
 const a=s.indexOf(start);assert.ok(a>=0,"missing "+start);
 const b=s.indexOf(end,a+start.length);assert.ok(b>a,"missing "+end);return s.slice(a,b);
};
let passes=0;
function check(label,fn){fn();passes++;console.log("PASS LT70 "+label)}
const location=between(dock,"function renderLocationChoices(){","function manualRefreshTap(){");
const css=between(dock,"/* LT77 Stage 3","</style>");
const sanitizer=between(dock,"function sanitizeLocationRadiusDraft(raw){","function renderLocationChoices(){");
check("LT82 Location coordinates use separate line with compact popup",()=>{
 for(const s of ['body.controls-window #choices.locationPanel,',
 'body.popup-window.controls-window #choices.locationPanel,',
 'body.popup-window.controls-window.popup-above #choices.locationPanel{',
 'width:min(256px,calc(100vw - 12px))!important;',
 '.choiceHeader .locCoordsRow{'])assert.ok(css.includes(s),s);
 assert.ok(location.includes("panel.append(title,fieldRow,slide,label,savedRow,tools,message)"));
 assert.ok(css.includes("width:min(258px,calc(100vw - 14px))!important"));
});
check("header Location centered with paste in the bottom action row",()=>{
 for(const s of ['.choiceHeader{','justify-content:center!important;',
 'const title=make("div","choiceHeader")',
 'title.appendChild(make("span","","Localização"))',
 'label.append(labelName,paste,copy,radiusWrap)'])assert.ok((s.includes("const")||s.includes("title.")||s.includes("label.append(")?location:css).includes(s),s);
});
check("input has exactly four numeric characters and bound 0–1000",()=>{
 for(const s of ['radiusField.type="text"','radiusField.min="0"','radiusField.max="1000"',
 'radiusField.maxLength=4','radiusField.setAttribute("maxlength","4")',
 'radiusField.setAttribute("pattern","[0-9]{1,4}")'])
 assert.ok(location.includes(s),s);
 assert.ok(sanitizer.includes('.replace(/\\D/g,"").slice(0,4)'));
 assert.ok(sanitizer.includes('Math.min(1000,Number(digits))'));
});
check("numeric input sanitizer enforces four-digit values at runtime",()=>{
 const m=location.match(/radiusField\.oninput=\(\)=>\{([\s\S]*?)\n \};/);
 assert.ok(m,"radius change handler");
 const radiusField={value:"",dataset:{}},slide={value:"0"};
 const onInput=new Function("radiusField","slide","sanitizeLocationRadiusDraft",m[1]);
 const normalize=vm.runInNewContext(sanitizer+";sanitizeLocationRadiusDraft");
 const examples=[["0","0"],["1000","1000"],["10000","1000"],
 ["9999","1000"],["123abc","123"],["99.9","999"],["",""]];
 for(const [input,expected] of examples){
  radiusField.value=input;onInput(radiusField,slide,normalize);
  assert.equal(radiusField.value,expected,input);
  assert.ok(radiusField.value.length<=4,"never longer than four");
 }
 assert.equal(slide.value,"999","slider updates valid range");
});
check("[1000]km contiguous with unit outside numeric input border",()=>{
 for(const s of ['radiusWrap.append(radiusField,unit)',
 '.locRadiusInputWrap input.locRadiusNumber{',
 'width:42px!important','font:500 12px/1.2 monospace!important',
 '.locRadiusInputWrap .locRadiusUnit{',
 'position:static!important','gap:0!important','padding:0 0 0 1px!important']){
 assert.ok((s.includes("radiusWrap")?location:css).includes(s),s);
 }
 assert.ok(css.includes('justify-content:center!important;'));
});
check("center radius and Apply/Clear with icon-only actions",()=>{
 for(const s of ["label.append(labelName,paste,copy,radiusWrap)","actions.append(apply,clear);label.appendChild(actions)",
 'makeDockAction("apply","Aplicar localização")','makeDockAction("clear","Limpar localização")'])
 assert.ok(location.includes(s),s);
 assert.ok(css.includes("body.controls-window #choices.locationPanel .locRadiusRow{"));
 assert.ok(css.includes("body.controls-window #choices.locationPanel .compactLocationActions{"));
 assert.ok(css.includes("justify-content:center!important;"));
});
check("Location re-tap closes native popup, not duplicate a new one",()=>{
 const toggle=between(dock,"let activeNativePopupKind=\"\";","const pokemonFromFilters=");
 for(const s of ['window.setActiveNativePopupKind=kind=>{',
 'activeNativePopupKind=String(kind||"");',
 'Native.openPopup(kind,Math.round(',
 'Native.openPopupMeasured(kind,centerX,centerY,Math.round(rect.height))'])
  assert.ok(toggle.includes(s),s);
 // Regression LT85: the JavaScript toolbar must NOT independently choose
 // to close a popup using a stale activeNativePopupKind mirror.
 assert.ok(!toggle.includes('if(activeNativePopupKind===kind){'));
 assert.ok(!toggle.includes('activeNativePopupKind=kind;'));
 const open=between(service,"private void openIndependentPopup(","private static boolean validIndependentPopup(");
 const close=between(service,"private void closeIndependentPopup(){","private void openIndependentPopup(");
 assert.ok(open.includes('if(kind.equals(popupKind)){closeIndependentPopup();return;}'));
 assert.ok(open.includes("window.setActiveNativePopupKind&&window.setActiveNativePopupKind("));
 assert.ok(close.includes('window.setActiveNativePopupKind&&window.setActiveNativePopupKind'));
});
check("no changes to actual Location apply/clear or other search filters",()=>{
 for(const s of ["Native.pasteLocationCoords()",'Native.setLocation(true,wantedCoords,wantedRadius)',
 'Native.setLocation(false,"",0)','slide.max="1000"','wantedRadius>1000'])
  assert.ok(location.includes(s),s);
 assert.ok(dock.includes('case "sh":Native.shiny();break;'));
 assert.ok(dock.includes('case "pokemon":toggleChoices("pokemon");break;'));
});
check("all HTML inline scripts parse after edits",()=>{
 const scripts=[...dock.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
 assert.ok(scripts.length>0);
 for(const s of scripts)new vm.Script(s[1]);
});
check("LT71: popup-specific CSS overrides legacy max-content left-alignment",()=>{
 const css71=between(dock,"/* LT71 LOC-NATIVE-TRIM-01","</style>");
 for(const term of [
  'body.popup-window.controls-window #choices.locationPanel .locRadiusRow,',
  'body.popup-window.controls-window.popup-above #choices.locationPanel .locRadiusRow,',
  'width:100%!important;min-width:0!important;max-width:100%!important;',
  'justify-content:center!important;',
  'body.popup-window.controls-window #choices.locationPanel .locRadiusInputWrap,',
  'width:max-content!important;',
  'body.controls-window #choices.locationPanel #locHint{',
  'text-align:center!important;max-width:100%!important;'
 ])assert.ok(css71.includes(term),term);
});
check("LT83: native Location popup width is fixed against CSS viewport shrink",()=>{
 const fit=between(dock,"function fit(){","let popupNativeSwitch=false;");
 for(const token of [
  'const measuredWidth=Math.min(330,Math.ceil(Math.max(rect.width,pane.scrollWidth,right-rect.left))+2);',
  'Math.min(286,Math.max(1,Math.floor(window.innerWidth||286)))',
  'Native.resizePopup(exactWidth,'
 ])assert.ok(fit.includes(token),token);
});
console.log("LT70/LT71 compact Location + toggle: "+passes+"/"+passes+" PASS");

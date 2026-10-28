"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const base=path.join(__dirname,"../src/main");
const read=p=>fs.readFileSync(path.join(base,p),"utf8");
const dock=read("assets/dock.html"),detail=read("assets/detail.html");
const picker=read("java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java");
const native=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const api=read("assets/api_android_session.js");
const check=(name,fn)=>{fn();console.log("PASS LT88 Samsung R2 "+name);};
check("paint compact filter and mode surfaces without outer hit rectangle",()=>{
 assert.ok(dock.includes("body.popup-window.controls-window #choices.modeCascade .modeCascadeEditor"));
 assert.ok(dock.includes("background:#1b2533!important;color:#edf4ff!important"));
 assert.ok(dock.includes("body.controls-window #choices.filterCascade .filterCascadeEditor .extraOptionList"));
 assert.ok(dock.includes("pointer-events:none!important"));
});
check("three general filter profiles are separate from rail and support save/use/delete",()=>{
 assert.ok(dock.includes("rail.parentElement.appendChild(menu)"));
 for(const method of ["loadGeneralFilterPreset","saveGeneralFilterPreset","deleteGeneralFilterPreset"]){
  assert.ok(dock.includes("Native."+method+"(slot)"));
  assert.ok(native.includes(method+"(int slot)"));
 }
});
check("only one active favorite star; edits autosave, hold clears",()=>{
 assert.ok(picker.includes("boolean selected=stored&&active==slot"));
 assert.ok(picker.includes("android.widget.PopupMenu"));
 assert.ok(picker.includes("Limpar todos os favoritos do Perfil "));
 assert.ok(picker.includes('autoPrefs.edit().putString(key,current).apply()'));
});
check("location clipboard and local slots support explicit copy and deletion",()=>{
 for(const k of ["extractClipboardCoordinates","copyLocationCoords","deleteSavedSearchLocation"])
  assert.ok(native.includes(k+"("));
 assert.ok(dock.includes("label.append(labelName,radiusWrap)"));
 assert.ok(dock.includes("clipboard.append(paste,copy)"));
 assert.ok(dock.includes("locHint"));
 assert.ok(!dock.split("function renderLocationChoices(){")[1].split("let requestedInterval=null")[0].includes("locSavedName"));
});
check("IV and countdown visible without unverified placeholder",()=>{
 assert.ok(detail.includes('stat("IV",showRaw?raw:"","red")'));
 assert.ok(!detail.includes("<em>Despawn:</em>"));
 assert.ok(dock.includes('lines.unshift("TIMER")'));
 assert.ok(dock.includes('if(raw!==null)lines.push(raw)'));
});
check("sort metadata matches absolute expiry and full encounter fingerprint",()=>{
 assert.ok(native.includes("retainVerifiedEncounterFields(unexpired)"));
 assert.ok(native.includes("encounterIdentityForMetadata(card)"));
 assert.ok(native.includes('new String[]{"number","name","cp","level","location"}'));
});
check("only default catalog aliases have a base sprite",()=>{
 assert.ok(api.includes('form===species+"NORMAL"'));
 assert.ok(dock.includes("pooledBaseSprite(item.image)"));
});

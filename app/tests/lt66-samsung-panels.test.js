"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const app=path.join(__dirname,".."),asset=path.join(app,"src/main/assets");
const dock=fs.readFileSync(path.join(asset,"dock.html"),"utf8");
const detail=fs.readFileSync(path.join(asset,"detail.html"),"utf8");
const java=fs.readFileSync(path.join(app,"src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const picker=fs.readFileSync(path.join(app,"src/main/java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java"),"utf8");
let passed=0,failed=0;
const check=(name,fn)=>{try{fn();passed++;console.log("PASS LT66 "+name)}
 catch(e){failed++;console.error("FAIL LT66 "+name+" "+e.message)}};
check("A modes use native popup origin without second top offset",()=>{
 assert.ok(dock.includes("body.popup-window.controls-window #choices.modePanel.modeCascade,"));
 assert.ok(dock.includes("top:0!important;bottom:auto!important;left:0!important;right:auto!important;"));
});
check("B Mode editor anchored to measured row instead of magic offsets",()=>{
 const body=dock.split("function positionCascadeEditor(){")[1]?.split("// Highlight the SAVED mode",1)[0]||"";
 assert.ok(body.includes("selected.offsetTop"));
 assert.ok(body.includes('rail.scrollTop=Math.max(0,wanted+selected.offsetHeight-visibleRail)'));
 assert.ok(body.includes("editor.style.top=top+"));
 assert.ok(!body.includes("const tops={raw:67"));
});
check("C mode inputs retain saved draft and explicit confirmation",()=>{
 assert.ok(dock.includes('button.dataset.modeId=id;'));
 assert.ok(dock.includes('input.value=String(modeDraft[key]??searchSettings[key]??"")'));
 assert.ok(dock.includes('const confirm=document.createElement("button")'));
 assert.ok(dock.includes('Native.setSearchConfig(JSON.stringify(next))'));
});
check("D right-edge menu opens mode editor inwards",()=>{
 assert.ok(dock.includes("body.popup-window.controls-window.menu-left #choices.modePanel.modeCascade .modeCascadeRail"));
 assert.ok(dock.includes("left:auto!important;right:54px!important"));
});
check("E gender icons same rhythm as 23px rail and no duplicate title",()=>{
 assert.ok(dock.includes("Sexo:80,Forma:216"));
 assert.ok(dock.includes('(isGender?" extraGenderField":"")'));
 assert.ok(dock.includes(".extraGenderField>label{"));
 assert.ok(dock.includes("grid-template-columns:repeat(3,23px)!important"));
 assert.ok(dock.includes("height:22px!important;min-height:22px!important"));
 for(const code of ["♂","♀","⚲"])assert.ok(dock.includes(code));
});
check("F Favorites counter centered in full row, not weighted remainder",()=>{
 assert.ok(picker.includes("FrameLayout header=new FrameLayout(activity)"));
 assert.ok(picker.includes('header.addView(title,titleLp)'));
 assert.ok(picker.includes('Gravity.CENTER);\n        header.addView(count,countLp)'));
 assert.ok(picker.includes('Gravity.END|Gravity.CENTER_VERTICAL'));
 assert.ok(picker.includes('count.setText("Selecionados "+size+"/50")'));
 assert.ok(picker.includes("sprites.setColumnCount(10)"));
});
check("G Notifications no X and centered title",()=>{
 const body=dock.split("function renderAlertsChoices(){")[1]?.split("// Site -> App",1)[0]||"";
 assert.ok(body.includes('panel.querySelector(".choiceClose")?.remove()'));
 assert.ok(body.includes('classList.add("alertsCenteredTitle")'));
 assert.ok(body.includes('section("Novos Pokémon"'));
 assert.ok(body.includes('section("Pokémon Favoritos"'));
});
check("H compact alert three cells avoid useless side margins",()=>{
 assert.ok(dock.includes("width:112px!important;max-width:112px!important"));
 assert.ok(dock.includes("grid-template-columns:repeat(3,30px)!important"));
 assert.ok(dock.includes("text-align:center!important;width:100%!important"));
});
check("I location retains inputs and controls while compact",()=>{
 const loc=dock.split("function renderLocationChoices(){")[1]?.split("let requestedInterval=null",1)[0]||"";
 assert.ok(loc.includes('label.append(labelName,radiusWrap)'));
 assert.ok(loc.includes('clipboard.append(paste,copy)'));
 assert.ok(loc.includes('slide.max="1000"'));
 assert.ok(loc.includes('radiusField.max="1000"'));
 assert.ok(loc.includes('makeDockAction("apply","Aplicar localização")'));
 assert.ok(dock.includes("width:192px!important;max-width:calc(100vw - 12px)!important"));
 assert.ok(dock.includes("width:65px!important;min-width:65px!important"));
});
check("J PvP expansions scroll one container not two",()=>{
 assert.ok(detail.includes("#evoBody{max-height:none;overflow:visible"));
 assert.ok(detail.includes("#panel{height:auto;max-height:calc(100vh - 2px);overflow-y:auto"));
 assert.ok(!detail.includes("#evoBody{max-height:165px;overflow-y:auto"));
});
check("K native card can grow above former 310dp limit",()=>{
 assert.ok(java.includes("Math.min(Math.min(440,available),heightDp)"));
 assert.ok(java.includes("screenHeightDp()-68"));
 assert.ok(java.includes("private void moveDetail(){"));
});
check("L scroll position preserved on re-render and PvP recalculation",()=>{
 assert.ok(detail.includes("const keepScroll=panel.scrollTop"));
 assert.ok(detail.includes("if(body.innerHTML!==html)body.innerHTML=html"));
 assert.ok(detail.includes("if(changed)panel.scrollTop=0"));
 assert.ok(detail.includes("Math.max(0,panel.scrollHeight-panel.clientHeight)"));
});
check("M original bridge and security remain",()=>{
 assert.ok(java.includes("IntegrityGuard.verify(this)"));
 assert.ok(dock.includes("Native.expiredResults"));
 assert.ok(dock.includes("Native.setLocation(true,wantedCoords,wantedRadius)"));
 assert.ok(dock.includes('Native.setFavoriteAlertMode(id)'));
});
check("N inline scripts compile",()=>{
 for(const [name,source] of [["dock",dock],["detail",detail]]){
  const m=[...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  assert.ok(m.length,name);
  m.forEach((v,i)=>new vm.Script(v[1],{filename:name+i}));
 }
});
console.log("LT66: "+passed+" PASS / "+failed+" FAIL");if(failed)process.exitCode=1;

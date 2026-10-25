"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main");
const dock=fs.readFileSync(path.join(root,"assets/dock.html"),"utf8");
const native=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const favorite=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java"),"utf8");
const section=(a,b)=>{const i=dock.indexOf(a),j=dock.indexOf(b,i+a.length);assert(i>=0&&j>i,a);return dock.slice(i,j)};
let count=0;function check(n,fn){fn();count++;console.log("PASS LT82 "+n);}
check("compact centered location column, exact child order",()=>{
 const s=section("function renderLocationChoices(){","let requestedInterval=null;");
 assert.ok(s.includes("panel.append(title,fieldRow,label,message)"));
 assert.ok(s.includes("label.append(labelName,paste,copy,radiusWrap)"));
 assert.ok(s.includes("actions.append(apply,clear);label.appendChild(actions)"));
 assert.ok(!s.includes("title.appendChild(paste)"));
 assert.ok(s.includes('slide.max="1000"'));
});
check("full coordinates 24.9407581,121.1889794 fit dedicated input",()=>{
 const css=section("/* LT82: exact compact centered location reference","</style>");
 for(const wanted of ["width:min(258px,calc(100vw - 14px))!important","justify-content:center!important",
 "font:500 11.5px/1.25 monospace!important","text-align:center!important",
 "flex-flow:row nowrap!important","margin:0 0 5px!important"])
 assert.ok(css.includes(wanted),wanted);
 const latitudeLongitude="24.9407581,121.1889794";
 assert.equal(latitudeLongitude.length,22);
 const parser=section(" function submit(){"," apply.onclick=submit;");
 assert.ok(parser.includes("Native.setLocation(true,wantedCoords,wantedRadius)"));
});
check("paste arrow points UP, and has accessible description",()=>{
 assert.ok(dock.includes('<path d="M12 19V9m-4 4 4-4 4 4"/>'));
 assert.ok(dock.includes('paste.setAttribute("aria-label","Colar coordenadas")'));
});
check("climate patches user choice to website without popup mismatch",()=>{
 const extra=section("function renderExtraFilters(panel,make){","function renderFilterPicker(");
 assert.ok(extra.includes('if(key==="weather")patchSelectedFilterKeys(["weather"])'));
 const filters=section("function renderFiltersChoices(){","function renderInfoChoices(){");
 // LT85: removed recurrent import prompt. Filter choices stay directly tappable.
 assert.ok(!filters.includes("Usar opções observadas no site"));
 assert.ok(dock.includes('if(typeof filterFocus!=="undefined"&&filterFocus==="Clima"){el.textContent="";el.hidden=true;return;}'));
 assert.ok(dock.includes('modeDraft[key]=key==="weather"&&value==="Any"?"":value'));
 assert.ok(native.includes('execute("verifyExtras"')||native.includes('execute("verifyFilters"'));
});
check("no repeating native WebView tooltip on Pokeball or refresh",()=>{
 assert.ok(dock.includes('gear.removeAttribute("title")'));
 assert.ok(dock.includes('p.removeAttribute("title")'));
 assert.ok(dock.includes('if(renderedId==="period")button.removeAttribute("title")'));
 assert.ok(dock.includes('button.removeAttribute("title");\n   button.setAttribute("aria-label","Atualizar agora; segure para intervalos")'));
});
check("first-ever onboarding persisted and only two short coaching messages",()=>{
 assert.ok(native.includes('initialStart&&!pref.getBoolean("gestureHelpV1Shown",false)'));
 assert.ok(native.includes('pref.edit().putBoolean("gestureHelpV1Shown",true).apply()'));
 assert.ok(native.includes("👆 Pokébola: toque = resultados"));
 assert.ok(native.includes("👆 ↻: toque = atualizar"));
});
check("Favorites native dialog chooses above/below available room",()=>{
 for(const t of ["int spaceBelow=Math.max(0,displayH-margin-below);",
 "int spaceAbove=Math.max(0,anchorY-iconHalf-gap-margin);",
 "boolean placeBelow=spaceBelow>=actualHeight||",
 "int top=placeBelow?below:Math.max(margin,above);",
 "window.addFlags(android.view.WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL)",
 'sprites.setColumnCount(10)'])assert.ok(favorite.includes(t),t);
});
check("all inline UI scripts remain parseable",()=>{
 const scripts=[...dock.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
 assert.ok(scripts.length>0);
 for(const s of scripts)new vm.Script(s[1]);
});
console.log("LT82 "+count+"/"+count+" PASS");

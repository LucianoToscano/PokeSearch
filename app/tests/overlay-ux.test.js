"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..","src","main");
const read=(p)=>fs.readFileSync(path.join(root,p),"utf8");
const dock=read("assets/dock.html");
const service=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const main=read("java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const picker=read("java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java");
let count=0;
function test(name,ok){assert.ok(ok,name);count++;}
test("Mode button opens options instead of cycling",dock.includes("toggleChoices('mode')")&&!dock.includes('onclick="Native.cycleMode()"'));
test("Auto button opens interval options",dock.includes("toggleChoices('period')"));
test("Three explicit filters",["100% · IV perfeito","GL#1 · Grande Liga","UL#1 · Ultra Liga"].every(v=>dock.includes(v)));
test("Intervals minimum 5 minutes",["AUTO · 5 min","AUTO · 10 min","AUTO · 15 min","AUTO · 20 min"].every(v=>dock.includes(v)));
test("Choice panel resizes native window",dock.includes('popup.getBoundingClientRect().bottom')&&dock.includes('Native.resize(h)'));
test("Bridge supports explicit filter selection",service.includes("public void setMode(String s)"));
test("Bridge supports explicit interval selection",service.includes("public void setIntervalMinutes(int minutes)"));
test("Favorites remain in overlay",service.includes("PokemonPicker.show(OverlayService.this")&&!service.includes('intent.setAction("com.lucianotoscano.pokesearchoverlay.EDIT_WATCH_LIST")'));
test("Favorites picker is service-safe and focusable",picker.includes("TYPE_APPLICATION_OVERLAY")&&picker.includes("Runnable dismissed"));
test("Login has one top toolbar and no native footer buttons",main.includes('done.setText("✓ Voltar")')&&!main.includes('.setNegativeButton("Cancelar",null)')&&main.includes('MATCH_PARENT,\n                android.view.WindowManager.LayoutParams.MATCH_PARENT'));
test("Shiny never changes selected filter",service.includes('shiny=!shiny;')&&service.includes('mode.equals(s)'));
test("Throttled refresh is queued",service.includes('handler.postDelayed(queuedRefresh,remaining*1000L+300L)'));
test("Quick guide remains accessible",main.includes("showQuickGuide()")&&main.includes("tutorialSeenV41")&&main.includes("tutorial.html"));
test("Sprite rows must not overlap artwork",service.includes("return Math.max(26,spriteSize-8);"));
test("Sprites remain vertically centered",dock.includes("align-items:center;justify-content:center")&&dock.includes("height:var(--row)"));
test("Sprite list uses scroll instead of clipping overflow",dock.includes("overflow-y:auto;overflow-x:hidden")&&dock.includes("--list-limit"));
test("Long lists have list height supplied by native screen size",service.includes("Math.min(rowDp()*8,screenHeightDp()-160)"));

test("Chevron is at bottom of the sprites",dock.indexOf('id="collapse"')>dock.indexOf('id="spawns"')&&dock.includes('m5 15 7-7 7 7'));
test("Red close is alongside heart with standard background",dock.indexOf('id="close"')>dock.indexOf('id="donate"')&&dock.includes("#controls #close{"));
test("No duplicate close/collapse above gear",!dock.includes('id="topActions"'));
test("Menu occupies separate window rather than wide sprite dock",service.includes('menuRoot=new FrameLayout(this)')&&service.includes('menuPanel=new WebView(this)')&&dock.includes('controlsWindow=window.location.search'));
test("Dedicated toolbar is just 29dp tall when popover closed",service.includes('new WindowManager.LayoutParams(dp(menuDp()),dp(29)'));
test("Minimize hides options and restores using gear",service.includes('if(yes&&menuExpanded)menu(false)')&&service.includes('if(minimized)minimize(false);'));
test("Login returns to Home and does not send it to background",!main.includes('postDelayed(()->moveTaskToBack(true)'));
test("Favorites dialog is one panel with integrated Concluir",picker.includes('finish.setText("Concluir")')&&!picker.includes('.setPositiveButton("Concluído"'));
test("Translucent favorites with optional background blur",picker.includes('Color.argb(188,34,43,56)')&&picker.includes('setBlurBehindRadius'));
test("Tutorial matches actual icon artwork",main.includes('tutorial.html')&&require('node:fs').readFileSync(require('node:path').join(root,'assets/tutorial.html'),'utf8').includes('Guia rápido · PokeSearch'));
test("Toolbar hides during login and favorite editing",service.includes('if(menuRoot!=null)menuRoot.setVisibility(View.GONE)'));
test("Only one pin control appears in toolbar",(dock.match(/id="location"/g)||[]).length===1);
test("Single pin control expands the location editor",dock.includes('onclick="toggleChoices(\'location\')"'));
test("Coords control has inline ON/OFF switch",dock.includes('fieldRow.append(field,toggle)')&&dock.includes('toggle.setAttribute("role","switch")'));
test("Location supports independent hide and disable",dock.includes('hide.onclick=closeChoices')&&dock.includes('Native.setLocation(false,"",0)'));
test("Slider covers inclusive range 0 to 1000",dock.includes('slide.min="0"')&&dock.includes('slide.max="1000"'));
test("Location enforces valid latitude and longitude",dock.includes('Math.abs(Number(match[1]))>90')&&dock.includes('Math.abs(Number(match[2]))>180'));
test("Location preference persisted without exposing secrets",service.includes('putBoolean("locationEnabled",locationEnabled)')&&service.includes('prefs.remove("locationCoords").remove("locationRadius")'));
test("Location is verified before search submission",service.includes('configureLocationAndVerify(generation,manual,0)')&&service.includes('execute("verifyLocation:"+data'));
test("Login, Shiny and league filters remain independent",service.includes('JSONObject.quote(mode)')&&service.includes('locationEnabled'));

const toolbarCols=dock.match(/#controls\{[^}]*grid-template-columns:([^;]+);/);
const toolbarButtons=dock.slice(dock.indexOf('<div id="menu"><div id="controls">'),dock.indexOf('</div><div id="choices"')).match(/<button\b/g)||[];
test("Controls have exactly one grid column per button, no second-row X",
  !!toolbarCols&&toolbarCols[1].trim().split(/\s+/).length===toolbarButtons.length&&toolbarButtons.length===12);
test("Single pin shows active radius without a second settings button",
  (dock.match(/id="location"/g)||[]).length===1&&dock.includes('id="locationRadiusText"')&&
  dock.includes('textContent=locationEnabled?locationRadius+"km":""'));
test("Active radius is readable even when toolbar is closed",
  dock.includes('id="locBadge"')&&dock.includes('geoBadge.textContent=locationEnabled?"📍 "+locationRadius+" km":""')&&
  dock.includes('pointer-events:none')&&dock.includes('body.controls-window #locBadge{display:none!important}'));
test("When OFF, icon and badge never display outdated radius",
  dock.includes('geoBadge.classList.toggle("active",locationEnabled)')&&
  dock.includes('document.getElementById("locationRadiusText").textContent=locationEnabled?locationRadius+"km":""'));
test("Switching from location editor to mode releases keyboard focus",
  dock.includes('if(choiceOpen==="location"&&kind!=="location")')&&dock.includes('Native.locationEditor(false)'));
test("Responsive toolbar avoids the gear",service.includes("boolean right=")&&service.includes("boolean left=")&&service.includes("int below=params.y+dp(26)"));
test("Twelve proportional control columns",dock.includes("grid-template-columns:34fr 22fr 41fr"));
test("No reversed order near edges",dock.includes("body.menu-left #controls{direction:ltr}"));
test("Chevron has visible surface",dock.includes("width:35px;height:29px")&&dock.includes("background:#162438f5"));
test("No extra gap when popup padding zero",dock.includes("Math.max(0,Number(pad)||0)"));
test("Coalesce resize events",dock.includes("if(fitPending)return"));
test("Location validation refuses blank radius",read("assets/probe.js").includes('radiusInput!==""'));
test("Location selection requires state confirmation",read("assets/probe.js").includes("active===true"));
test("AUTO provides feedback",service.includes("AUTO: "));
console.log("PokeSearch UX contract: "+count+" tests passed");

"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const app=path.join(__dirname,"../src/main");
const dock=fs.readFileSync(path.join(app,"assets/dock.html"),"utf8");
const visual=fs.readFileSync(path.join(app,"assets/visual_editor.js"),"utf8");
const service=fs.readFileSync(path.join(app,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
const assets=path.join(app,"assets/weather-icons/lt68");
const official={Any:"any",Boosted:"boosted",Sunny:"sunny",Rainy:"rainy",
 "Partly Cloudy":"partly-cloudy",Cloudy:"cloudy",Windy:"windy",Snow:"snow",Fog:"fog"};
let good=0,bad=0;
const check=(name,fn)=>{try{fn();good++;console.log("PASS LT68 "+name)}
 catch(e){bad++;console.error("FAIL LT68 "+name+" "+e.message)}};
check("1 all 18 official white/black Drive PNGs stored in assets",()=>{
 for(const key of Object.values(official))for(const theme of ["white","black"]){
  const p=path.join(assets,key+"-"+theme+".png");
  assert.ok(fs.existsSync(p),p);
  assert.ok(fs.statSync(p).size>20000,p);
  assert.equal(fs.readFileSync(p).subarray(0,8).toString("hex"),"89504e470d0a1a0a");
 }
 assert.equal(fs.readdirSync(assets).filter(x=>x.endsWith(".png")).length,18);
});
check("2 exact official PoGoCoordinates nine weather values untouched",()=>{
 for(const [value,file] of Object.entries(official))
  assert.ok(dock.includes('"'+value+'":"'+file+'"'),value);
 assert.ok(dock.includes('"Sunny":"Ensolarado/Limpo"'));
 assert.ok(dock.includes('modeDraft[key]=value;patchSelectedFilterKeys([key])'));
});
check("3 dark menu uses white icon, light menu uses black icon",()=>{
 assert.ok(dock.includes('return "file:///android_asset/weather-icons/lt68/"+filename+"-"+(light?"black":"white")+".png"'));
 assert.ok(dock.includes('document.body.classList.contains("visual-light-menu")'));
});
check("4 icon theme changes immediately, without resetting filters",()=>{
 assert.ok(dock.includes("window.syncWeatherIcons=()=>"));
 assert.ok(visual.includes('if(typeof window.syncWeatherIcons==="function")window.syncWeatherIcons();'));
 const block=dock.split("window.syncWeatherIcons=()=>{")[1]?.split("\n };",1)[0]||"";
 assert.ok(block.includes("img.dataset.weatherKey"));
 assert.ok(!block.includes("Native.patchSearchFilters("));
});
check("5 fallback keeps original approved PNGs and does not retry indefinitely",()=>{
 assert.ok(dock.includes('if(img.dataset.weatherFallback==="1"){img.style.display="none";return;}'));
 assert.ok(dock.includes('img.src="file:///android_asset/weather-icons/"+fallback+".png"'));
});
check("6 weather icons remain decorative, menu item accessible",()=>{
 assert.ok(dock.includes('img.alt=""'));
 assert.ok(dock.includes('img.setAttribute("aria-hidden","true")'));
 assert.ok(dock.includes('img.className="weatherChoiceIcon"'));
});
check("7 old original nine icons remain present on disk",()=>{
 for(const file of Object.values(official))assert.ok(fs.existsSync(path.join(app,"assets/weather-icons",file+".png")),file);
});
check("8 refresh appearance checkbox is no longer forcibly disabled",()=>{
 assert.ok(dock.includes("const locked=false; // Refresh visibility is user-controlled;"));
 assert.ok(dock.includes("eye.disabled=locked"));
 assert.ok(dock.includes('hidden?"Mostrar ":"Ocultar "'));
});
check("9 refresh hidden selection survives JS preference normalization",()=>{
 const norm=dock.split("function normalizedQuickPrefs(p){")[1]?.split("function saveQuickPrefs(){")[0]||"";
 assert.ok(norm.includes('!["close","appearance","sh"].includes(x)'));
 assert.ok(!norm.includes('!["close","appearance","period","sh"].includes(x)'));
});
check("10 refresh hidden selection survives native JSON validation and persistence",()=>{
 const save=service.split('public void saveMenuPrefs(String json){')[1]?.split('public void toggleTimers()',1)[0]||"";
 assert.ok(save.includes('!"appearance".equals(id)&&!"sh".equals(id)'));
 assert.ok(!save.includes('!"period".equals(id)'));
 assert.ok(save.includes('.putString("menuUiPrefs",clean.toString())'));
});
check("11 only the toolbar Refresh tile is hidden, not the scheduler",()=>{
 assert.ok(dock.includes('if(!action||quickPrefs.hidden.includes(id))continue'));
 assert.ok(dock.includes('if(id==="period"){manualRefreshTap();return;}'));
 assert.ok(service.includes("schedulePeriodic()"));
 assert.ok(!service.split('public void saveMenuPrefs(String json){')[1].split('public void toggleTimers()')[0].includes("intervalMinutes="));
});
check("12 Personalização cannot hide itself or Shiny",()=>{
 assert.ok(dock.includes('!["close","appearance","sh"].includes(x)'));
});
check("13 existing webview JS compiles",()=>{
 for(const entry of dock.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(entry[1]);
 new vm.Script(visual);
});
console.log("LT68: "+good+" PASS / "+bad+" FAIL");if(bad)process.exitCode=1;

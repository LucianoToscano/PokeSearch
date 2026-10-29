"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const read=p=>fs.readFileSync(p,"utf8");
const candy=read("app/src/main/assets/rare_candy_controls.html");
const dock=read("app/src/main/assets/dock.html");
const editor=read("app/src/main/assets/visual_editor.js");
const android=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/RareCandyOverlayService.java");
const main=read("app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const script=candy.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(script,"Candy local script exists");
assert(dock.includes("width:min(148px,calc(100vw - 8px))"),"P1 has 148px reference");
assert(candy.includes("width:148px!important"),"Candy location/information uses P1 148px");
assert(candy.includes("height:32px!important"),"Candy location input is P1 32px");
assert(candy.includes("height:24px!important"),"Candy location slider row is P1 24px");
assert(candy.includes("height:29px!important"),"Candy radius/action row is P1 29px");
assert(candy.includes("height:30px!important"),"Candy interval buttons use P1 tiles");
assert(candy.includes("grid-template-columns:repeat(2,minmax(0,1fr))"),"Information menu is 2-column compact grid");
assert(candy.includes("requestHeight(141,false)"),"Candy location native popup is compact");
assert(candy.includes("requestHeight(116,false)"),"Candy information popup is compact");
assert(candy.includes("requestHeight(34+6*30+5*3+6,false)"),"Candy interval menu is six compact tiles");
assert(android.includes('menuParams.width=dp(h>34?("period".equals(panel)?142:158):142)'),
 "Android window fits compact 148px card, not old 240dp card");
assert(android.includes('getSharedPreferences("prefs",MODE_PRIVATE)')&&
 android.includes('getString("visualPrefsJson","{}")'),
 "Candy reads the exact same visual preferences as Pokeballs");
assert(android.includes("syncCandyMenuTheme()")&&android.includes("if(candyMenuVisible)syncCandyMenuTheme()"),
 "Candy theme updates without closing or recreating the overlay");
assert(android.includes('lastCandyMenuTheme="";syncCandyMenu()'),
 "Reopening WebView resends theme even when preferences are unchanged");
const more=dock.slice(dock.indexOf("/* LT170 MORE-FINAL:"));
assert(more.includes("background:var(--visual-menu-button-bg,rgba(15,19,26,.50))"),
 "Report/Donate/Close use the original toolbar background opacity");
assert(!more.includes("background:var(--visual-menu-readable-bg"),
 "More actions cannot have independent high-contrast alpha");
assert(editor.includes('set("menu-button-bg",rgba(current.menuBgMode,current.menuTransparency))'),
 "P1/P2 menu tiles follow same transparency slider");
assert(main.includes("screen.addView(homeUpdateHolder,1,updateLp)"),
 "Home update notice appears above the Pokeballs");
assert(android.includes("now<blockedUntil")||android.includes("now>=blockedUntil"),
 "Real PoGoCoordinates rate limit must remain respected");
const elements=new Map();
function classes(){const set=new Set();return {add:x=>set.add(x),remove:x=>set.delete(x),
 toggle:(x,on)=>on?set.add(x):set.delete(x),contains:x=>set.has(x)}}
for(const id of ["refresh","location","period","infos","choices","candyCoords",
 "candyRadius","candyRadiusSlider","locError"]){
 elements.set(id,{classList:classes(),attributes:{},value:"",innerHTML:"",textContent:"",className:"",
 setAttribute(k,v){this.attributes[k]=v},addEventListener(){}});
}
const styles={};
const prefs={};const calls={info:[],height:[]};
const Native={candyMenuHeight(...args){calls.height.push(args)},
 setCandyInfo(...args){calls.info.push(args)},refreshCandy(){},candyMenuFocus(){}};
const document={getElementById:id=>elements.get(id),
 documentElement:{style:{setProperty(name,value){styles[name]=value}}},
 body:{classList:classes()}};
const ctx={window:{},document,Native,Date:{now:()=>1000},setTimeout(){return 1},clearTimeout(){},console};
vm.runInNewContext(script,ctx,{filename:"rare_candy_controls.html"});
const apply=ctx.window.applyCandyMenuTheme;
assert.equal(typeof apply,"function","Candy theme bridge exists");
apply("dark",50,4);
assert.equal(styles["--visual-menu-button-bg"],"rgba(15,19,26,0.50)");
assert.equal(styles["--visual-menu-readable-bg"],"rgba(15,19,26,0.856)");
apply("dark",100,0);
assert.equal(styles["--visual-menu-button-bg"],"rgba(15,19,26,0.00)");
assert.equal(styles["--visual-menu-readable-bg"],"rgba(15,19,26,0.000)");
assert.equal(styles["--visual-menu-tile-shadow"],"none");
apply("light",0,8);
assert.equal(styles["--visual-menu-button-bg"],"rgba(255,255,255,1.00)");
assert.equal(styles["--visual-menu-fg"],"#152231");
assert.equal(styles["--visual-menu-blur"],"8px");
assert.equal(document.body.classList.contains("visual-light-menu"),true);
ctx.window.syncCandy(JSON.stringify({name:false,location:false,despawn:true,distance:false,period:3}));
vm.runInContext('openPanel("infos")',ctx);
assert.equal(calls.height.at(-1)[0],116);
const infoHtml=elements.get("choices").innerHTML;
for(const label of ["Nome","Local","Despawn","Dist."]){
 assert(infoHtml.includes(label),label+" exists");
}
assert.equal((infoHtml.match(/class="infoTile/g)||[]).length,4);
assert(infoHtml.includes('aria-pressed="true"'),"Despawn is selected by default");
vm.runInContext('toggleInfo("name")',ctx);
assert.equal(calls.info.length,1);
assert.equal(calls.info[0][0],"name");
assert.equal(calls.info[0][1],true);
assert(elements.get("choices").innerHTML.includes('infoTile chosen'),
 "Native-confirmed display state is rendered as chosen");
vm.runInContext('openPanel("location")',ctx);
assert.equal(calls.height.at(-1)[0],141);
vm.runInContext('openPanel("period")',ctx);
assert.equal(calls.height.at(-1)[0],235);
console.log("LT181: P1 location+period+info pixel geometry, full theme slider and ••• actions PASS");

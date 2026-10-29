"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const root = "app/src/main/";
const file = (p) => fs.readFileSync(root+p,"utf8");
const probe = file("assets/rare_candy_probe.js");
const service = file("java/com/lucianotoscano/pokesearchoverlay/RareCandyOverlayService.java");
const home = file("java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const menus = file("java/com/lucianotoscano/pokesearchoverlay/OverlayQuickMenus.java");
const manifest = file("AndroidManifest.xml");
new vm.Script(probe);
assert(manifest.includes('android:name=".RareCandyOverlayService"'));
assert(home.includes('controls.addView(rareCandyControl,candyLp)'));
assert(home.indexOf('controls.addView(rareCandyControl,candyLp)')>
       home.indexOf('controls.addView(homeThemeButton'));
assert(home.indexOf('controls.addView(rareCandyControl,candyLp)')<
       home.indexOf('controls.addView(heart,heartLp)'));
assert(service.includes("TYPE_APPLICATION_OVERLAY"));
assert(service.includes("bubbleWindow.setBackgroundColor(Color.TRANSPARENT)"),"candy artwork must have no dark tile");
assert(service.includes("CANDY_ART_DP=27"),"candy artwork must be smaller than the native hitbox");
assert(service.includes("candyGrip.setOnTouchListener"),"transparent grip must own gestures");
assert(service.includes("candyGrip.setOnClickListener(v->toggleResults())"),"tap must open results");
assert(service.includes("bubbleWindow.addView(candyGrip"),"grip must be a real native child");
assert(service.includes("bubbleWindow.addView(site,0"),"provider must render BEHIND native touch grip");
assert(!service.includes("bubbleWindow.setOnTouchListener"),"root touch dispatch must not compete with WebView");
assert(!service.includes("site.setOnTouchListener((v,e)->true)"),"hidden WebView must not consume bubble gestures");
assert(service.includes("resultsParams.y=belowY"),"result window must avoid covering the bubble");
assert(service.includes("resultsParams.y=aboveY"),"result window must reanchor above when needed");

assert(service.includes("main.postDelayed(longPress,600)"));
assert(service.includes("OverlayQuickMenus.showCandy"));
assert(service.includes("new FrameLayout.LayoutParams(dp(360),dp(640))"));
assert(service.includes("setAcceptThirdPartyCookies"));
assert(service.includes("getSharedPreferences(\"rare_candy_overlay\""));
assert(service.includes("validCoords(point)"));
assert(service.includes("new JSONArray(copied)"));
assert(service.includes("site.evaluateJavascript"));
assert(service.includes("seconds<=60?0xFFFF666D"));
assert(service.includes("expirePending"));
assert(service.includes("period*60000L"));
assert(service.includes("lastRefresh>=15000"));
assert(service.includes("setSaturation(0f)"));
assert(service.includes("countdownLabels"));
assert(service.includes("loadIcon(this)"));
assert(menus.includes("showCandyLocation"));
assert(menus.includes('new int[]{1,3,5}'));
assert(menus.includes("panelColor(c)"));
assert(service.includes('PogoAccountSlots.attach(site,account)'));
assert(!service.includes("addJavascriptInterface"));
assert(!service.includes("http://"));
const icon = Buffer.from(file("assets/rare_candy_icon.b64").trim(),"base64");
assert(icon.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
assert.equal(icon.readUInt32BE(16),32);
assert.equal(icon.readUInt32BE(20),32);

const coord="-23.584469,-46.656994";
const cardText="Rare Candy\n130 m away\nLOCATION\nParaíso, São Paulo, Brazil\nDESPAWNS IN\n15:26\nOpen in Maps\n"+coord;
const card={innerText:cardText,parentElement:null};
const node={innerText:coord,parentElement:card};
let selected=false,submitted=false,locationValue="old",radiusValue="1000";
const input1={
    value:locationValue,placeholder:"Paste coordinates (lat,lng)",
    dispatchEvent() {locationValue=this.valueHolder;}
};
const input2={value:radiusValue,placeholder:"Radius",
    dispatchEvent() {radiusValue=this.valueHolder;}};
const tab={
    textContent:"Rare Candy",className:"",classList:{contains:()=>false},
    getAttribute:()=>null,click(){selected=true;}
};
const search={
    textContent:"Search",disabled:false,click(){submitted=true;},
    getAttribute:()=>null,classList:{contains:()=>false}
};
const fields={innerText:"Location\nSearch",querySelectorAll:()=>[input1,input2]};
const document={
    querySelectorAll(selector){
        if(selector==="button,[role=button]")return [tab,search];
        if(selector==="section,form,div")return [fields];
        if(selector==="button, a, p, span, div")return [node];
        return [];
    },
    body:{innerText:"Rare Candy Search"}
};
const sandbox={
    window:{},document,
    location:{hostname:"pogocoordinates.com",pathname:"/search"},
    HTMLInputElement:function(){},
    HTMLTextAreaElement:function(){},
    Event:function(){},
    console
};
Object.defineProperty(sandbox.HTMLInputElement.prototype,"value",{
    set(v){this._value=v;this.valueHolder=v;},
    get(){return this.valueHolder||""}
});
Object.setPrototypeOf(input1,sandbox.HTMLInputElement.prototype);
Object.setPrototypeOf(input2,sandbox.HTMLInputElement.prototype);
vm.createContext(sandbox);
vm.runInContext(probe,sandbox);
let data=JSON.parse(sandbox.window.PokeSearchCandy.read());
assert(data.ok);
assert.equal(data.items.length,1);
assert.equal(data.items[0].coords,coord);
assert.equal(data.items[0].seconds,15*60+26);
assert.equal(data.items[0].distance,"130 m");
assert.equal(data.items[0].location,"Paraíso, São Paulo, Brazil");
assert.equal(sandbox.window.PokeSearchCandy.runSearch("",1000),"tab-switched");
assert(selected);
assert.equal(sandbox.window.PokeSearchCandy.runSearch(coord,300),"submitted");
assert(submitted);
assert.equal(locationValue,coord);
assert.equal(radiusValue,"300");
assert.equal(sandbox.window.PokeSearchCandy.runSearch("",1000),"submitted");
assert.equal(locationValue,"");
sandbox.location.hostname="untrusted.example";
assert.equal(JSON.parse(sandbox.window.PokeSearchCandy.read()).ok,false);
assert.equal(sandbox.window.PokeSearchCandy.runSearch(coord,300),"wrong-origin");
console.log("LT175: third bubble, shared menu, offline icon, copy and source DOM contract PASS");
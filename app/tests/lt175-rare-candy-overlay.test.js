"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const root="app/src/main/";
const read=p=>fs.readFileSync(root+p,"utf8");
const source=read("java/com/lucianotoscano/pokesearchoverlay/RareCandyOverlayService.java");
const home=read("java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const manifest=read("AndroidManifest.xml");
const probe=read("assets/rare_candy_probe.js");
const menu=read("assets/rare_candy_controls.html");
const workflow=fs.readFileSync(".github/workflows/lt175-rare-candy-signed-qa.yml","utf8");
assert(manifest.includes('android:name=".RareCandyOverlayService"'));
assert(home.includes("controls.addView(rareCandyControl,candyLp)"));
assert(source.includes("BUBBLE_DP=45, CANDY_ART_DP=20"),"artwork must match compact Pokémon result sprite");
assert(source.includes("bubbleWindow.setBackgroundColor(Color.TRANSPARENT)"),"no candy tile/background");
assert(source.includes("candyGrip.setOnTouchListener"),"native grip owns candy gestures");
assert(source.includes("candyGrip.setOnClickListener(v->toggleResults())"));
assert(source.includes("bubbleWindow.addView(site,0"),"remote WebView remains below native grip");
assert(source.includes("bubbleWindow.addView(candyGrip"),"same principle as Pokébola grip");
assert(!source.includes("bubbleWindow.setOnTouchListener"),"do not intercept touch in parent");
assert(!source.includes("site.setOnTouchListener((v,e)->true)"),"do not steal touch in hidden WebView");
assert(source.includes("createCandyMenu()"));
assert(source.includes("candyMenuPanel.loadUrl(\"file:///android_asset/rare_candy_controls.html\")"));
assert(source.includes("allowedMenuUrl"),"bridge must be confined to local page");
assert(source.includes("menuParams.width=dp(h>34?240:142)"),"resize pixel-matched menu popups");
assert(menu.includes("grid-template-columns:repeat(4,34px)"));
assert(menu.includes("grid-auto-rows:30px"));
assert(menu.includes("gap:2px"));
assert(menu.includes("background:#151b26e6"));
assert(menu.includes("border-radius:5px"));
assert(menu.includes("requestHeight(265,true)"));
assert(menu.includes("new int[]{1,3,5}")===false);
for(const part of ["choosePeriod(1)","choosePeriod(3)","choosePeriod(5)"]){
 // Buttons are generated dynamically, not hard-coded; guarded by [1,3,5].
 assert(menu.includes("[1,3,5]"));
}
assert(menu.includes('setCandyInfo(key,checked)'));
assert(menu.includes("Native.candyMenuFocus(true)"));
assert(source.includes("expires_at")&&source.includes("java.time.Instant.parse(expiry)"));
assert(source.includes("Math.round(kilometers*1000)+\" m\""));
assert(source.includes("setColorFilter(new ColorMatrixColorFilter(m))"));
assert(source.includes("new JSONArray(copied)"));
assert(source.includes("blockedUntil"));
assert(source.includes("setStatus(\"Limite de buscas"));
assert(source.includes("new LinearLayout.LayoutParams(0,-2,1)"));
assert(source.includes("row.setBackgroundColor(Color.TRANSPARENT)"));
assert(source.includes("resultsParams.y="));
assert(!source.includes("JSONObject.quote(token)"),"JWT must never be passed to Java");
assert(!source.includes("addJavascriptInterface(new Bridge()"));
assert(workflow.includes("PokeSearch-v0.01.76-LT-QA.apk")||
       workflow.includes("PokeSearch-v0.01.77-LT-QA.apk"));

const png=Buffer.from(read("assets/rare_candy_icon.b64").trim(),"base64");
assert(png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));

let lastRequest=null, httpStatus=200, retryAfter="61", authorizedToken="test-token";
let data={
  results:[
    {coords:"-23.584793,-46.657069",location:"Paraíso, São Paulo, Brazil",
     expires_at:new Date(Date.now()+600000).toISOString(),distance_km:0.04},
    {coords:"0,0",location:"Sem raio",
     expires_at:new Date(Date.now()+300000).toISOString(),distance_km:null},
    {coords:"invalid",expires_at:new Date(Date.now()+300000).toISOString()},
    {coords:"-23.5,-46.6",expires_at:"invalid timestamp"}
  ],tier:"logged_in",cap:10
};
const env={
  window:{}, location:{protocol:"https:",hostname:"pogocoordinates.com",pathname:"/search"},
  localStorage:{getItem:k=>k==="jwt"?authorizedToken:null},
  fetch:async(url,opts)=>{
    lastRequest={url,opts};
    return {ok:httpStatus===200,status:httpStatus,
      headers:{get:k=>k==="Retry-After"?retryAfter:null},
      json:async()=>data};
  },Date,Number,JSON,Math,isFinite,console
};
vm.createContext(env);
new vm.Script(probe);
vm.runInContext(probe,env);
async function check(){
  assert(env.window.PokeSearchCandy);
  const response=JSON.parse(await env.window.PokeSearchCandy.search("-23.584469,-46.656994",1000));
  assert.equal(response.ok,true);
  assert.equal(response.items.length,2);
  assert.equal(response.items[0].coords,"-23.584793,-46.657069");
  assert.equal(response.items[0].distance_km,0.04);
  assert.equal(lastRequest.url,"https://coordinates-api.pokemongopro.com/rare-candy/search");
  assert.equal(lastRequest.opts.method,"POST");
  assert.equal(lastRequest.opts.headers.Authorization,"Bearer "+authorizedToken);
  assert.equal(lastRequest.opts.credentials,"omit");
  const body=JSON.parse(lastRequest.opts.body);
  assert.equal(body.center_lat,-23.584469);
  assert.equal(body.center_lng,-46.656994);
  assert.equal(body.radius_km,1,"site metres must be converted to km");
  assert(!JSON.stringify(response).includes(authorizedToken),"never forward JWT to Android");
  const unrestricted=JSON.parse(await env.window.PokeSearchCandy.search("",1000));
  assert.equal(unrestricted.ok,true);
  assert.deepEqual(JSON.parse(lastRequest.opts.body),{},"empty coords must omit all location filters");
  authorizedToken="";
  JSON.parse(await env.window.PokeSearchCandy.search("",1000));
  assert.equal(lastRequest.opts.headers.Authorization,undefined,"anonymous must not add bearer");
  httpStatus=429;
  const limited=JSON.parse(await env.window.PokeSearchCandy.search("",1000));
  assert.equal(limited.status,429);assert(limited.retry_after>=60);
  env.location.hostname="evilpogocoordinates.com";
  assert.equal(JSON.parse(await env.window.PokeSearchCandy.search("",1000)).status,403);
  assert.equal(JSON.parse(await env.window.PokeSearchCandy.search("5,5",1000)).status,403);
  env.location.hostname="pogocoordinates.com";
  const invalidRadius=JSON.parse(await env.window.PokeSearchCandy.search("5,5",0));
  assert.equal(invalidRadius.status,400);
  console.log("LT177 Rare Candy official API + cloned Pokébola controls + privacy/429/TTL regression PASS");
}
check().catch(e=>{console.error(e);process.exitCode=1});
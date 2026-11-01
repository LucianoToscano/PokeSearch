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
assert(source.includes('boolean reference="location-cooldown".equals(panel)'),"full 16-row reference uses own native height");
assert(source.includes('"period".equals(panel)?142:158'),"original period and location widths remain unchanged");
assert(menu.includes("grid-template-columns:repeat(4,34px)"));
assert(menu.includes("grid-auto-rows:30px"));
assert(menu.includes("gap:2px"));
assert(menu.includes("background:var(--visual-menu-button-bg)"));
assert(menu.includes("border-radius:5px"));
assert(menu.includes("requestHeight(172,false)"));
assert(menu.includes("new int[]{1,3,5}")===false);
for(const part of ["choosePeriod(1)","choosePeriod(3)","choosePeriod(5)"]){
 // Pokébola period choices are generated dynamically in the Candy popup.
 assert(menu.includes("[0,3,5,10,15,20]"));
}
assert(menu.includes('setCandyInfo(key,checked)'));
assert(menu.includes('["name","Nome"]'),"Name visibility checkbox must exist");
assert(menu.includes('name:false,location:false,despawn:true,distance:false'),"Only despawn on by default in menu");
assert(source.includes('showName=false,showLocation=false,showDespawn=true,showDistance=false'),"Only despawn on by default in Android");
assert(source.includes('prefs.getBoolean("candyShowName",false)'),"Name checkbox must persist");
assert(source.includes('prefs.getBoolean("candyShowDespawn",true)'),"Despawn must default ON");
assert(source.includes('prefs.getBoolean("candyShowLocation",false)'),"Location must default OFF");
assert(source.includes('prefs.getBoolean("candyShowDistance",false)'),"Distance must default OFF");
assert(source.includes('"name".equals(field)'),"Name field must be handled by bridge");
assert(source.includes("FrameLayout spriteCell=new FrameLayout(this)"),"Distance must share sprite cell");
assert(source.includes("spriteCell.addView(distance,distLp)"),"Distance must overlay sprite");
assert(!source.includes('row.addView(distance,space(51,40,0))'),"No distant right-side distance column");
assert(source.includes('if(showName||showLocation)'),"Name and location should not reserve width when hidden");
assert(source.includes('int contentDp=(showName||showLocation)?228:50'),"Default results must be sprite-column width");
assert(menu.includes('class="periodTile'),"Compact Pokébola OFF/3/5/10/15/20 period tiles");

assert(menu.includes("Native.candyMenuFocus(true)"));
assert(source.includes('prefs.getInt("period",3)'),"New users start at three-minute auto refresh");
assert(source.includes('cards.size()==10'),"All-copied auto-refresh requires exactly ten candies");
assert(!source.includes("now-lastRefresh<15000"),"No extra local 15-second wait");
assert(menu.includes("candyRadiusSlider"),"P1-style location radius slider is available");
assert(menu.includes("Native.copyCandyLocation"),"P1-style copy coordinate action exists");
assert(menu.includes("Native.pasteCandyLocation"),"P1-style paste coordinate action exists");
assert(menu.includes("requestHeight(172,false)"),"Location popup matches Pokébola 148px");
assert(menu.includes("requestHeight(142,false)"),"Information popup is compact");
assert(menu.includes("infoGrid"),"Information options are a compact grid");

assert(menu.includes('refresh.addEventListener("pointerup"'),"Refresh tap must fire from pointerup");
assert(menu.includes('if(!refreshHeld)requestRefreshNow();'),"Short press must refresh immediately");
assert(menu.includes('refresh.addEventListener("click"'),"Click fallback must work when WebView drops pointerup");
assert(menu.includes('lastRefreshRequestAt'),"Prevent double search from pointerup plus synthetic click");
assert(menu.includes('refreshHeld=true;')&&menu.includes('openPanel("period")'),"Long hold must open interval menu");
assert(source.includes('private void refreshIfAllCollected()'),"Only confirmed candy collection may auto-refresh");
assert(source.includes('lastAllCopiedRefreshGeneration!=generation'),"At most one all-copied auto-refresh per batch");
assert(source.includes('if(visibleCount==10&&!hasUncollected)'),"Refresh only after all ten candies were confirmed collected");
assert(source.includes('if(pendingManualRefresh&&!busy&&ready'),"Queued refresh must resume after rate limit");
assert(source.includes('if(manual)pendingManualRefresh=true'),"Keep manual request during HTTP 429");
assert(source.includes('new LinkedHashSet<>()'),"Copied candy history must evict oldest entries");
assert(source.includes('pendingManualRefresh'),"Manual taps must survive a busy WebView");
assert(source.includes('finishPendingManualRefresh()'),"Deferred request must fire after in-flight search");
assert(source.includes('if(!ready||!isOfficialSearch())'),"Manual refresh must queue during initial loading");

assert(source.includes("expires_at")&&source.includes("java.time.Instant.parse(expiry)"));
assert(source.includes("Math.round(kilometers*1000)+\" m\""));
assert(source.includes("setColorFilter(new ColorMatrixColorFilter(m))"));
assert(source.includes("new JSONArray(copied)"));
assert(source.includes("blockedUntil"));
assert(source.includes("setStatus(providerWaitLabel())")&&source.includes("if(now<blockedUntil)"),
    "Provider 429 keeps real Retry-After while showing a locally updated waiting label");
assert(source.includes("new LinearLayout.LayoutParams(0,-2,1)"));
assert(source.includes("row.setBackgroundColor(Color.TRANSPARENT)"));
assert(source.includes("resultsParams.y="));
assert(source.includes("activeCount*rowHeight+4"),"Full ten-candy list is no longer cut by a 460dp cap");
assert(!source.includes("Math.min(460"),"No arbitrary 460dp result height cap");
assert(source.includes("scroll.setClipChildren(false)"),"Result sprites are not clipped at the child viewport");
assert(source.includes("roomBelow>=wantedHeight"),"Use the side that fits all candies");

assert(!source.includes("JSONObject.quote(token)"),"JWT must never be passed to Java");
assert(!source.includes("addJavascriptInterface(new Bridge()"));
assert(workflow.includes("PokeSearch-v0.01.78-LT-QA.apk"));

const png=Buffer.from(read("assets/rare_candy_icon.b64").trim(),"base64");
assert(png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
assert.equal(png.readUInt32BE(16),96);
assert.equal(png.readUInt32BE(20),96);

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
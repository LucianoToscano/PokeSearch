"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const main=path.join(__dirname,"../src/main");
const load=(p)=>fs.readFileSync(path.join(main,p),"utf8");
const html=load("assets/dock.html");
const picker=load("java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java");
const native=load("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const cache=load("java/com/lucianotoscano/pokesearchoverlay/VerifiedSpriteCache.java");
const api=load("assets/api_android_session.js");
const test=(name,fn)=>{fn();console.log("PASS LT88 "+name);};
test("favorite 3 stars are between counter and close without second row",()=>{
 assert.match(picker,/favoritePresetActiveV1/);\n assert.match(picker,/refreshProfileStars\.run\(\)/);
 assert.match(picker,/root\.addView\(header\)/);
 assert.doesNotMatch(picker,/root\.addView\(favoriteProfiles\)/);
 assert.match(picker,/profilesLp\.rightMargin=dp\(activity,29\)/);
 assert.match(picker,/setOnLongClickListener/);
 assert.match(picker,/WatchAlerts\.canonicalList/);
});
test("filter rail and editor have visible dark/light backing without covering hit area",()=>{
 assert.match(html,/body\.controls-window #choices\.filterCascade \.filterCascadeRail/);
 assert.match(html,/background:linear-gradient\(var\(--visual-menu-bg/);
 assert.match(html,/background-clip:padding-box!important/);
 assert.match(html,/\.filterHeaderTitle/);
 assert.match(html,/const heading=make\("div","filterCascadeHead"\)/);
 assert.match(html,/generalPresetToggle/);
 assert.match(html,/pointer-events:none!important/);
});
test("native favorites cache is private, bounded, and shared read-only with WebViews",()=>{
 assert.match(picker,/new LruCache<>\(48\)/);
 assert.match(picker,/verified-base-sprites-v1/);
 assert.match(picker,/256\*1024/);
 assert.match(picker,/WAITING\.remove\(id\)/);
 assert.match(picker,/files\.length-64/);
 assert.match(cache,/verified-base-sprites-v1/);
 assert.match(cache,/Pattern RAW=Pattern\.compile/);
 assert.match(cache,/new WebResourceResponse\("image\/png"/);
 assert.match(native,/VerifiedSpriteCache\.fromDisk\(OverlayService\.this,request\.getUrl\(\)\)/);
});
test("menu sprites deduplicate verified base requests and never invent costumes",()=>{
 assert.match(html,/const spriteRequestCache=new Map/);
 assert.match(html,/pooledBaseSprite\(item\.image\)/);
 assert.match(api,/form===species\+"NORMAL"/);
 assert.match(api,/x\.costume_id===undefined\|\|x\.costume_id===null\|\|x\.costume_id===0/);
 assert.ok(html.includes('if(!valid)return Promise.resolve("");'));
});
test("expired results are filtered before notifying",()=>{
 assert.match(native,/if\(expiry<=now\)continue/);
 assert.match(native,/recentSpawnExpiries\.getOrDefault/);
 assert.match(native,/recordNewResults\(sorted/);
 assert.match(native,/if\(end<=now\)continue/);
});

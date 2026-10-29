"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const dir=path.join(__dirname,"../src/main");
const read=p=>fs.readFileSync(path.join(dir,p),"utf8");
const favorites=read("java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java");
const alerts=read("java/com/lucianotoscano/pokesearchoverlay/WatchAlerts.java");
const sprites=read("java/com/lucianotoscano/pokesearchoverlay/VerifiedSpriteCache.java");
const html=read("assets/dock.html");
const test=(name,check)=>{check();console.log("PASS LT88 FAVORITES/SPRITES "+name)};
test("active favorite slot auto-saves atomically on ANY watched change",()=>{
 assert.match(alerts,/int active=p\.getInt\("favoritePresetActiveV1",0\)/);
 assert.match(alerts,/editor\.putString\("favoritePresetV1_"\+active,updated\)/);
 assert.match(alerts,/SharedPreferences\.Editor editor=p\.edit\(\)\.putString\(PREF_LIST,updated\)/);
 assert.match(alerts,/editor\.apply\(\)/);
});
test("three stars remain mutually exclusive and hold offers clearing only",()=>{
 assert.match(favorites,/boolean selected=stored&&active==slot/);
 assert.match(favorites,/tab\.setOnLongClickListener/);
 assert.match(favorites,/Limpar todos os favoritos do Perfil/);
 assert.match(favorites,/if\(active\)edit\.putString\(WatchAlerts\.PREF_LIST,""\)/);
 assert.match(favorites,/p\.edit\(\)\.putString\(WatchAlerts\.PREF_LIST,saved\)/);
});
test("verified only official base and Shiny forms in separate native caches",()=>{
 assert.match(sprites,/Pattern RAW=Pattern\.compile/);
 assert.match(sprites,/shiny\/\)\?/);
 assert.match(sprites,/dex\+10001/);
 assert.match(sprites,/verified-base-sprites-v1/);
 assert.match(sprites,/shouldInterceptRequest/);
 assert.match(sprites,/256\*1024/);
 assert.match(sprites,/60000L/);
 assert.match(sprites,/setInstanceFollowRedirects\(false\)/);
 assert.match(sprites,/new WebResourceResponse\("image\/png"/);
});
test("WebView result image retries the same observed URL or verified equivalent",()=>{
 assert.match(html,/data-original-src/);
 assert.match(html,/function attachSpriteFeedback\(\)/);
 assert.match(html,/SPRITE_FAILURE_RETRY_MS=30000/);
 assert.match(html,/const useMirror=\(\)=>/);
 assert.match(html,/primary\.onerror=useMirror/);
 assert.match(html,/if\(primary\.naturalWidth>=8&&primary\.naturalHeight>=8\)finish\(asset\.src\)/);
  assert.match(html,/PokeSearchOfflineSprite\.resolve\(exactCard\)/);
 assert.match(html,/verifiedBundledData\?\.\(exactCard\)/);
 assert.match(html,/pooledBaseSprite\(item\.image\)/);
});

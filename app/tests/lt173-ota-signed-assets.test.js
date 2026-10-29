'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=(p)=>fs.readFileSync(p,'utf8');
const java=read('app/src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java');
const store=read('app/src/main/java/com/lucianotoscano/pokesearchoverlay/OtaAssets.java');
const dock=read('app/src/main/assets/dock.html');
const sprite=read('app/src/main/assets/sprite_offline.js');
const main=read('app/src/main/java/com/lucianotoscano/pokesearchoverlay/MainActivity.java');
const notes=read('app/src/main/java/com/lucianotoscano/pokesearchoverlay/ReleaseNotes.java');
const policy=read('app/src/main/java/com/lucianotoscano/pokesearchoverlay/LocalBridgePagePolicy.java');
assert.equal((java.match(/loadUrl\(OtaAssets\.webUrl\(/g)||[]).length,5,
 'all five overlay WebViews must load from protected appassets origin');
assert.equal((java.match(/OtaAssets\.intercept\(OverlayService\.this,otaWebLoader,request\.getUrl\(\)\)/g)||[]).length,5,
 'all five overlay WebViews must share identical OTA/sprite interceptor');
assert(java.includes('OtaAssets.open(this,"probe.js")'));
assert(main.includes('OtaAssets.open(this,path)'));
assert(notes.includes('OtaAssets.open(a,ASSET)'));
assert(dock.includes('https://appassets.androidplatform.net/assets/'));
assert(!dock.includes('file:///android_asset/'));
assert(!sprite.includes('file:///android_asset/'));
assert(store.includes('verifySignature(c,manifest,sig)'));
assert(store.includes('MessageDigest.getInstance("SHA-256")'));
assert(store.includes('pack-'+''), 'pack paths must exist');
assert(store.includes('renameTo(target)'), 'atomic swap required');
assert(store.includes('putInt("previous",current)'), 'rollback required');
assert(!store.includes('addJavascriptInterface('), 'OTA store must never create a bridge');
assert(policy.includes('appassets.androidplatform.net'));
console.log('LT173 signed OTA source contracts and dual-Pokébola wiring OK');

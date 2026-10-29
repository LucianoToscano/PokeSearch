"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"../src/main");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const cache=read("java/com/lucianotoscano/pokesearchoverlay/VerifiedSpriteCache.java");
const picker=read("java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java");
const native=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const builder=fs.readFileSync(path.join(__dirname,"../scripts/build_sprite_bundle.py"),"utf8");
const catalog=JSON.parse(read("assets/pokemon_catalog.json"));
let n=0;function test(name,fn){fn();n++;console.log("PASS LT105 "+name);}
test("exact 1025 Dex entries, never guessing alternate species or costumes",()=>{
 assert.equal(catalog.length,1025);
 assert.deepEqual(catalog.map(x=>x[0]),Array.from({length:1025},(_,i)=>i+1));
 assert.match(builder,/len\(ids\) != 1025/);
 assert.match(builder,/pokemon_catalog\.json/);
 assert.match(builder,/for dex in ids for special in \(False, True\)/);
 assert.ok(!builder.includes("costume_id"));
});
test("bundle validates PNG identity, dimensions and size",()=>{
 assert.match(builder,/verified_png\(data\)/);
 assert.ok(builder.includes("MAX_DIMENSION, MAX_BYTES = 8, 1024, 256 * 1024"));
 assert.match(builder,/struct\.unpack\(">II", data\[16:24\]\)/);
 assert.match(builder,/sha256\(data\)\.hexdigest\(\)/);
 assert.match(builder,/Insufficient verified base sprites/);
});
test("native WebViews use bundled images offline-first, without base fallback for unknown form",()=>{
 assert.match(cache,/static InputStream bundledSprite\(Context context,int dex,boolean shiny\)/);
 assert.match(cache,/if\(context==null\|\|dex<1\|\|dex>1025\)return null/);
 assert.match(cache,/"pokemon-sprites\/"\+\(shiny\?"shiny\/":"base\/"\)\+dex\+"\.png"/);
 const method=cache.split("static WebResourceResponse fromDisk(")[1];
 assert.ok(method.indexOf("bundledResponse(context,dex,shiny)")>=0);
 assert.ok(method.indexOf("bundledResponse(context,dex,shiny)")<method.indexOf("cached(context,dex,shiny)"));
 assert.match(cache,/Pattern RAW=Pattern\.compile/);
 assert.match(cache,/Pattern MIRROR=Pattern\.compile/);
 assert.equal((native.match(/OtaAssets\.intercept\(OverlayService\.this,otaWebLoader,request\.getUrl\(\)\)/g)||[]).length,5);
});
test("favorites picker consumes the same bundled images before disk and network",()=>{
 const pickerFetch=picker.split("private static Bitmap fetchVerifiedSprite(")[1]?.split("private static void setImage(")[0];
 assert.ok(pickerFetch.includes("VerifiedSpriteCache.bundledSprite(context,id,false)"));
 assert.ok(pickerFetch.indexOf("bundledSprite(context,id,false)")<pickerFetch.indexOf('new java.io.File(context.getCacheDir()'));
 assert.match(pickerFetch,/BitmapFactory\.decodeStream\(packaged\)/);
 assert.match(picker,/verified-base-sprites-v1/);
});
test("no runtime bulk fetching or base substitution from invalid unverified forms",()=>{
 assert.ok(!cache.includes("downloadAllSprites"));
 assert.ok(builder.includes("return None"));
 assert.match(cache,/if\(dex<1\|\|dex>10000\)return null/);
 assert.match(builder,/pokemon-sprites/);
});
console.log("LT105 OFFLINE-SPRITES "+n+"/"+n+" PASS");

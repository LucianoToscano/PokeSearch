"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main");
const d=fs.readFileSync(path.join(root,"assets/detail.html"),"utf8"),k=fs.readFileSync(path.join(root,"assets/dock.html"),"utf8"),j=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8"),f=fs.readFileSync(path.join(root,"assets/sprite_visual_scale.js"),"utf8");
const script=d.match(/<script>([\s\S]*?)<\/script>/)?.[1];assert.ok(script);new vm.Script(script);new vm.Script(f);
assert.ok(j.includes("DETAIL_DP=200"),"do not crush shell");
assert.ok(j.includes("detailHeight=125"),"smaller first frame");
assert.ok(j.includes("Math.min(520,available)"),"dynamic long-card growth remains");
assert.ok(d.includes('Math.ceil(document.getElementById("panel").scrollHeight)+3'),"remove 7px blank bottom");
const css=d.slice(d.indexOf("/* QA19: pack the OUTER"));
assert.ok(css.includes("#panel{padding:3px;"),"glass outer margins reduced");
assert.ok(css.includes("grid-template-columns:minmax(88px,1fr) 42px 38px;"),"restore useful IV, CP, level widths");
assert.ok(css.includes("justify-content:stretch;justify-items:stretch;"),"stat row fills available width from left");
assert.ok(css.includes("#major .statTile{height:23px;min-height:23px;max-height:23px;"),"keep requested height");
assert.ok(css.includes("#major .statValue{font-size:10px;"),"uncrushed IV numbers");
assert.ok(css.includes("#major .statTile:nth-child(2) .statValue{font-size:9px;"),"CP readable");
assert.ok(css.includes("#major .statTile:nth-child(3) .statValue{font-size:8px;"),"level readable");
assert.ok(d.includes('class="sexChip"')&&d.includes('class="sizeChip"'),"separate sex/size");
assert.ok(d.includes('class="ivTypes"'),"types left of IV");
assert.ok(d.includes('<span class="despawnLabel">Despawn</span>'),"timer beneath star");
assert.ok(d.includes('#coordRow #coords:not(.hasCoords):not(.isPending){'),"red coords");
assert.ok(d.includes('window.PokeSearchSpriteScale?.apply?.(img)'),"detail alpha scale");
assert.ok(k.includes('window.PokeSearchSpriteScale?.apply?.(img)'),"result alpha scale");
assert.ok(d.includes('src="sprite_visual_scale.js"')&&k.includes('src="sprite_visual_scale.js"'));
assert.ok(css.includes('.gengarHalloween #img{transform:scale(calc(.49 * var(--ps-alpha-scale,1)))'),"Halloween Gengar detail");
assert.ok(k.includes('const effectiveArtFit=halloweenGengar?0.42:artFit;'),"Halloween Gengar list");
assert.ok(k.includes('var(--visual-sprite-scale,1) * var(--ps-alpha-scale,1)'),"visual editor scale preserved");
const env={window:{}};
env.document={createElement:()=>({
 getContext:()=>({
  clearRect(){},drawImage(){},
  getImageData:()=>({data:new Uint8ClampedArray(96*96*4).fill(255)})
 })
})};
vm.runInNewContext(f,env);
assert.ok(env.window.PokeSearchSpriteScale);
const value=env.window.PokeSearchSpriteScale.factor({naturalWidth:96,naturalHeight:96});
assert.ok(value>=.76&&value<=.82,"large silhouette shrinks moderately");
const blocked={window:{}};
blocked.document={createElement:()=>({
 getContext:()=>({
  clearRect(){},drawImage(){},getImageData(){throw Error("tainted");}
 })
})};
vm.runInNewContext(f,blocked);
assert.equal(blocked.window.PokeSearchSpriteScale.factor({naturalWidth:96,naturalHeight:96}),1,"CORS-safe fallback");
console.log("LT145 QA19 packed entire card shell, readable stats, normalized sprites with CORS fallback PASS");

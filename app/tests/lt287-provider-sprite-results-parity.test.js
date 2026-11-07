"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.join(__dirname,"../src/main/assets");
const dock=fs.readFileSync(path.join(root,"dock.html"),"utf8");
const detail=fs.readFileSync(path.join(root,"detail.html"),"utf8");
const resolver=require(path.join(root,"sprite_offline.js"));
const probe=fs.readFileSync(path.join(root,"probe.js"),"utf8");
const base64="data:image/png;base64,"+"A".repeat(60);
const fromSite="https://pogocoordinates.com/images/pokemon/133.png";
const c={name:"Eevee",number:"#133",shiny:false,form:"NORMAL",image:fromSite,imageFromSite:true};
const run=(card,art,bridge)=>{
 const start=dock.indexOf("  const nativeArt=window.PokeSearchOfflineSprite?.bundledExactForArt?.(c,art)||\"\";");
 const end=dock.indexOf("  const hasImage=",start);
 assert.ok(start>=0&&end>start);
 const fn=new Function("c","art","window",dock.slice(start,end)+
  "return {nativeArt,verifiedSiteArt,imageUrl,originalUrl};");
 return fn(card,art,{PokeSearchOfflineSprite:{bundledExactForArt:bridge}});
};
let a=run(c,{src:fromSite,original:"file:///android_asset/pokemon-sprites/base/133.png",providerExact:true},
 ()=>base64);
assert.equal(a.imageUrl,fromSite,"verified PoGoCoordinates image is displayed first, just like detail");
assert.equal(a.nativeArt,base64,"exact native fallback remains available");
assert.equal(a.verifiedSiteArt,true);
let c2={...c,imageFromSite:false};
a=run(c2,{src:"https://unverified.test/a.png",original:"",providerExact:true},()=>base64);
assert.equal(a.imageUrl,base64,"unverified provider art cannot override verified local bytes");
a=run(c,{src:"http://untrusted.test/a.png",original:"",providerExact:true},()=>base64);
assert.equal(a.imageUrl,base64,"plain HTTP provider URL refused");
a=run(c,{src:fromSite,original:"",providerExact:false},()=>base64);
assert.equal(a.imageUrl,base64,"not explicitly card-verified must not be provider-first");
a=run({...c,shiny:true,form:"UNKNOWN",costume_id:999},
 {src:fromSite,original:"",providerExact:false},()=> "");
assert.equal(a.imageUrl,fromSite,"unknown special variants preserve source URL without guessing another form");
assert.equal(a.nativeArt,"");

const start=dock.indexOf("  const tryVerifiedLocal=()=>{");
const end=dock.indexOf("  const good=()=>",start);
assert.ok(start>0&&end>start);
const makeFallback=(localUrl,native,verified)=>{
 let localTried=false;
 const image={current:"https://remote.example/e.png",
  getAttribute(name){return name==="src"?this.current:"";},
  set src(value){this.current=value;}};
 const stages=new Set(["failed","loaded"]);
 const stage={classList:{remove:x=>stages.delete(x)}};
 const sourceCard={name:"Eevee",number:"#133",form:"NORMAL",shiny:false,
  image:"https://remote.example/e.png",imageFromSite:true};
 let resolved=0;
 const engine={verifiedBase:()=>verified,
  verifiedBundledData:()=>native,
  resolve:card=>{resolved++;assert.equal(card.image,"");
   assert.equal(card.imageFromSite,false);return {src:localUrl};}};
 const fragment=dock.slice(start,end);
 const fallback=new Function("sourceCard","window","img","stage",
  "let localTried=false;"+fragment+"return tryVerifiedLocal;")(
   sourceCard,{PokeSearchOfflineSprite:engine},image,stage);
 return {image,stage,stages,fallback,reads:()=>resolved};
};
let fb=makeFallback("https://appassets.androidplatform.net/assets/pokemon-sprites/base/133.png","",true);
assert.equal(fb.fallback(),true);
assert.equal(fb.image.current,"https://appassets.androidplatform.net/assets/pokemon-sprites/base/133.png");
assert.equal(fb.fallback(),false,"local retry is bounded per card");
fb=makeFallback("file:///android_asset/pokemon-sprites/base/133.png","",true);
assert.equal(fb.fallback(),true,"legacy Android URI remains compatible");
fb=makeFallback("https://remote.example/not-local.png",base64,true);
assert.equal(fb.fallback(),true);
assert.equal(fb.image.current,base64,"identical native PNG bridge used by detail");
fb=makeFallback("https://remote.example/not-local.png","",true);
assert.equal(fb.fallback(),false,"cannot trust arbitrary external fallback");
fb=makeFallback("https://appassets.androidplatform.net/assets/pokemon-sprites/base/133.png",base64,false);
assert.equal(fb.fallback(),false,"unsupported costume/form never inherits base");
assert.ok(detail.includes("const initialNative="));
assert.ok(detail.includes("useArt(initialNative||art.src)"));
assert.ok(detail.includes("const nativeFallback=()=>"));
assert.ok(probe.includes("imageFromSite:siteImageExact"));
assert.ok(probe.includes("image:siteImageUrl"));
assert.doesNotMatch(dock,/crossorigin="anonymous"/);
assert.ok(dock.includes("window.PokeSearchSpriteScale?.applyResultTile?.(img)"));
assert.ok(dock.includes("Sprite indisponível para a forma exata"));
assert.ok(dock.includes("if(resultWindow)document.getElementById(\"spawns\").innerHTML=cards.map"));
console.log("LT287 PASS: verified PoGoCoordinates image first, detail-native fallback, signed local HTTPS/legacy URI, safe unknown forms and no forced CORS");
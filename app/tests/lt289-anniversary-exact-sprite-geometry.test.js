"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const base=path.join(__dirname,"../src/main/assets");
const sprite=require(path.join(base,"sprite_offline.js"));
const scaler=fs.readFileSync(path.join(base,"sprite_visual_scale.js"),"utf8");
const dock=fs.readFileSync(path.join(base,"dock.html"),"utf8");
const manifest=fs.readFileSync(path.join(base,"go-exact-sprites.tsv"),"utf8");
const builder=fs.readFileSync(path.join(__dirname,"../scripts/build_sprite_bundle.py"),"utf8");
const release=fs.readFileSync(path.join(__dirname,"../../.github/workflows/pokesearch-official-release.yml"),"utf8");
const expected=[
 ["pm25.fANNIVERSARY_2026_SINGAPORE_01.icon.png","4238d152855a587381b0ea7ff3d1394227bcac2c"],
 ["pm25.fANNIVERSARY_2026_SINGAPORE_01.s.icon.png","47f371d38bdf8440e804fa6eb82252eaaeaa4d99"],
 ["pm25.fANNIVERSARY_2026_SINGAPORE_01.g2.icon.png","ac3f648547fcb8b17791e582bce8da47ed5616a5"],
 ["pm25.fANNIVERSARY_2026_SINGAPORE_01.g2.s.icon.png","c1ebb52b3b7c253a694b962ae6d6c111afc7c574"]
];
for(const [file,hash] of expected){
 assert.ok(manifest.includes(file+"\t"+hash),"exact pinned GO asset hash: "+file);
 assert.ok(builder.includes('"costumes/'+file+'"'),"builder includes "+file);
 assert.ok(builder.includes('"'+hash+'"'),"builder verifies GO blob hash");
 assert.ok(release.includes('"'+file+'"'),"signed APK must contain "+file);
 assert.equal(sprite.bundledGoCostumeSource({
  src:"https://raw.githubusercontent.com/PokeMiners/pogo_assets/c2a686eb08ace6e890d8fe3d2134c76988db87b5/Images/Pokemon%20-%20256x256/Addressable%20Assets/"+file
 }),"file:///android_asset/pokemon-sprites/costumes/"+file);
}
for(const shiny of [false,true]){
 for(const gender of ["male","female"]){
  const suffix=(gender==="female"?".g2":"")+(shiny?".s":"")+".icon.png";
  const file="pm25.fANNIVERSARY_2026_SINGAPORE_01"+suffix;
  const card={name:"Pikachu",number:"#25",form:"Anniversary 2026 Singapore 01",
   costume_id:9026,gender,shiny};
  const exact=sprite.goExactIcon(card);
  assert.ok(exact?.src.endsWith(file),"must preserve named Singapore, gender, shiny: "+file);
  const provider="https://pogocoordinates.com/pokemon/singapore-2026.png";
  const resolved=sprite.resolve({...card,image:provider,imageFromSite:true});
  assert.equal(resolved.src,provider,"do not replace working PoGoCoordinates sprite");
  assert.ok(resolved.original.endsWith("costumes/"+file),"exact same-form signed fallback");
 }
}
assert.ok(sprite.goExactIcon({
 name:"Pikachu",number:"#25",costume:"Anniversary 2026 Singapore 01",costume_id:9026,gender:"male",
})?.src.endsWith("pm25.fANNIVERSARY_2026_SINGAPORE_01.icon.png"));
assert.equal(sprite.goExactIcon({
 name:"Pikachu",number:"#25",form:"Anniversary 2026 Malaysia 01",costume_id:9026
}),null,"other regional event not silently Singapore");
assert.equal(sprite.goExactIcon({
 name:"Pikachu",number:"#25",form:"Anniversary 2026 Singapore 01",costume:"Halloween 2026",costume_id:9026
}),null,"conflicting costume identity fails closed");
assert.equal(sprite.goExactIcon({
 name:"Pikachu",number:"#25",form:"Other Party 2026",costume_id:9026
}),null,"unknown numeric costume ID cannot reuse Singapore");

new vm.Script(scaler);
assert.match(scaler,/function tileFit\(img,box,maxZoom=2\.85\)/);
assert.match(scaler,/const exactGo=img\.dataset\?\.psExactGoGeometry==="1"/);
assert.match(scaler,/const maxZoom=exactGo\?4\.25:2\.85/);
assert.match(scaler,/zoom:clamp\(measured\.zoom,\.80,exactGo\?4\.25:1\.8\)/);
assert.match(dock,/if\(exactReference&&packaged&&img\.dataset\)/);
assert.match(dock,/img\.dataset\.psExactGoGeometry="1"/);
assert.match(dock,/engine\?\.bundledGoCostumeSource\?\.\(go\)/);
assert.ok(dock.includes('window.PokeSearchSpriteScale?.applyResultTile?.(img,exactReference)'));
assert.match(dock,/const tile=size===55\?40:size===45\?32:24/);
assert.match(dock,/const imageUrl=verifiedSiteArt\?art\.src:\(nativeArt\|\|art\.src\)/);
const data="data:image/png;base64,"+"A".repeat(64);
function mock(exact){
 const pixels=new Uint8ClampedArray(96*96*4);
 for(let y=38;y<=57;y++)for(let x=38;x<=57;x++)pixels[(y*96+x)*4+3]=255;
 let drawn=null;
 class RefImage{constructor(){this.naturalWidth=96;this.naturalHeight=96;}
  set src(url){this._src=url;this.onload?.();}
 }
 const state={};
 const img={src:"https://pogocoordinates.com/art.png",
  currentSrc:"https://pogocoordinates.com/art.png",
  naturalWidth:96,naturalHeight:96,isConnected:true,
  dataset:{psExactGoGeometry:exact?"1":"0"},
  closest:()=>({clientWidth:40}),
  style:{setProperty(k,v){state[k]=String(v);}}};
 const env={window:{},Image:RefImage,document:{createElement:()=>({getContext:()=>({
  clearRect(){},drawImage(i){drawn=i;},
  getImageData(){if(drawn===img)throw Error("SecurityError: remote provider art");
   return {data:pixels};}
 })})}};
 vm.runInNewContext(scaler,env);
 env.window.PokeSearchSpriteScale.applyResultTile(img,data);
 return {state,img};
}
let x=mock(true);
assert.equal(Number(x.state["--tile-alpha-zoom"]),4.25,"exact 2026 event silhouette can be normalized above old 1.8 cap");
assert.equal(x.img.src,"https://pogocoordinates.com/art.png","provider artwork remains unchanged");
x=mock(false);
assert.equal(Number(x.state["--tile-alpha-zoom"]),1.8,"unverified silhouettes retain conservative cap");
assert.ok(Math.abs(Number.parseFloat(x.state["--tile-alpha-x"]))<=40*.12+.01);
console.log("LT289 PASS: exact Singapore 2026 Pikachu signed for 4 variants; scaled miniature without swapping provider image, unknown costumes fail closed");

"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.join(__dirname,"../src/main/assets");
const helper=fs.readFileSync(path.join(root,"sprite_visual_scale.js"),"utf8");
const dock=fs.readFileSync(path.join(root,"dock.html"),"utf8");
const editor=fs.readFileSync(path.join(root,"visual_editor.js"),"utf8");
new vm.Script(helper);
const code=dock.slice(dock.lastIndexOf("/* LT225: menu button equivalence only at P."));
assert.match(code,/transform:translate\(var\(--tile-alpha-x,0px\),var\(--tile-alpha-y,0px\)\)/);
assert.match(code,/scale\(var\(--tile-alpha-zoom,1\)\)!important/);
assert.match(code,/object-fit:contain!important;object-position:center center!important/);
assert.match(code,/width:var\(--result-art-size,21\.12px\)!important/);
assert.match(dock,/window\.PokeSearchSpriteScale\?\.applyResultTile\?\.\(img,exactReference\)/);
assert.match(dock,/sourceCard\?\.imageFromSite===true&&engine\?\.resolve/);
assert.match(dock,/const verifiedSiteArt=c\.imageFromSite===true&&art\.providerExact===true/);
assert.match(dock,/const imageUrl=verifiedSiteArt\?art\.src:\(nativeArt\|\|art\.src\)/);
assert.doesNotMatch(dock,/crossorigin="anonymous"/,
 "displaying trusted provider art cannot require cross-origin pixel access");
assert.match(editor,/P 24×24 dp · M 32×32 dp · G 40×40 dp/);
assert.match(dock,/const tile=size===55\?40:size===45\?32:24/);

function spriteEnv(rect,tainted=false) {
 const pixels=new Uint8ClampedArray(96*96*4);
 for(let y=rect.top;y<=rect.bottom;y++)
  for(let x=rect.left;x<=rect.right;x++)pixels[(y*96+x)*4+3]=255;
 const props={};
 const stage={clientWidth:50};
 const img={
  naturalWidth:96,naturalHeight:96,
  currentSrc:"data:image/png;base64,alpha-mock-"+rect.left+"-"+rect.top,
  clientWidth:44,
  style:{setProperty:(key,value)=>{props[key]=value;}},
  closest:(selector)=>selector===".spriteStage"?stage:null
 };
 const env={window:{},document:{createElement:()=>({
  getContext:()=>({clearRect(){},drawImage(){},
   getImageData(){if(tainted)throw Error("SecurityError");return {data:pixels};}})
 })}};
 vm.runInNewContext(helper,env);
 return {api:env.window.PokeSearchSpriteScale,img,props};
}
let e=spriteEnv({left:24,right:70,top:20,bottom:75});
let f=e.api.applyResultTile(e.img);
assert.ok(f.zoom>1.4&&f.zoom<1.9);
assert.ok(f.x>0&&Math.abs(f.y)<.1,"already vertically centered silhouette should not be shifted");
assert.ok(Math.max(47,56)/96*.88*f.zoom >= .84); // visible silhouette target
assert.ok(Math.max(47,56)/96*.88*f.zoom <= .90);
assert.equal(Number(e.props["--tile-alpha-zoom"]),f.zoom);
assert.equal(e.props["--tile-alpha-x"],f.x+"px");
assert.equal(e.props["--tile-alpha-y"],f.y+"px");

e=spriteEnv({left:12,right:36,top:23,bottom:69});
f=e.api.applyResultTile(e.img);
assert.ok(f.zoom>1.8);
assert.ok(f.x>3,"off-centre alpha art is shifted toward centre");
assert.ok(f.y>0);
e=spriteEnv({left:0,right:95,top:0,bottom:95});
f=e.api.applyResultTile(e.img);
assert.ok(f.zoom>=.96&&f.zoom<=1.01,"full-frame image scales near unity without cropping");
e=spriteEnv({left:40,right:54,top:40,bottom:54});
f=e.api.applyResultTile(e.img);
assert.ok(f.zoom>6&&f.zoom<7,"tiny icon grows to meet 87% from its own measured pixels");
assert.ok(Math.abs((15/96)*.88*f.zoom-.87)<.01,
 "even tiny but confirmed art fills 85–90% without cropping");
e=spriteEnv({left:24,right:70,top:20,bottom:75},true);
assert.equal(e.api.applyResultTile(e.img),null,"CORS-tainted original is not replaced");
assert.equal(e.props["--tile-alpha-zoom"],"1");
assert.equal(e.props["--tile-alpha-x"],"0px");
assert.equal(e.props["--tile-alpha-y"],"0px");
assert.equal(e.api.factor(e.img),1,"legacy detail fallback unaffected");
console.log("LT226 PASS: measured alpha silhouette, visible 85–90%, centered offsets, P/M/G and CORS-safe original");

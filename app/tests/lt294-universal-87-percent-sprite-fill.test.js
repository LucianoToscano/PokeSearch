"use strict";
/* LT294: 85–90% opaque-art fill in ALL 100% and #1 result boxes. */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const dir=path.join(__dirname,"../src/main/assets");
const scaleCode=fs.readFileSync(path.join(dir,"sprite_visual_scale.js"),"utf8");
const dock=fs.readFileSync(path.join(dir,"dock.html"),"utf8");
new vm.Script(scaleCode);
for(const assertion of [/const RESULT_VISIBLE_TARGET=\.87/,/const RESULT_IMAGE_BOX=\.88/,
 /const SOURCE_MEASURED_MAX_ZOOM=24/,/tileFit\(img,artworkBox,SOURCE_MEASURED_MAX_ZOOM\)/,
 /geometryFit\(bounds,cardSize\*RESULT_IMAGE_BOX,SOURCE_MEASURED_MAX_ZOOM\)/])
 assert.match(scaleCode,assertion);
assert.doesNotMatch(scaleCode,/if\(fit\.occupancy<\.80\)setResultTileFit/);
assert.match(dock,/const tile=size===55\?40:size===45\?32:24/);
assert.match(dock,/--result-art-size",\(resultLayout\.sprite\*0\.88\)\.toFixed\(1\)\+"px"/);
assert.match(dock,/body\.result-window \.spriteStage \.sprite\{/);
assert.match(dock,/body\.result-window\.visual-results-tiles \.spriteStage::before\{/);
assert.match(dock,/body\.result-window:not\(\.visual-results-tiles\) \.spriteStage::before\{/);
function mock(rect,tile,tainted=false,native=false){
 const pixels=new Uint8ClampedArray(96*96*4);
 for(let y=rect.top;y<=rect.bottom;y++)for(let x=rect.left;x<=rect.right;x++)
  pixels[(y*96+x)*4+3]=255;
 const props={},requests=[],url="https://pogocoordinates.com/assets/pokemon/current.png";
 const img={src:url,currentSrc:url,naturalWidth:256,naturalHeight:256,
  dataset:{psSourceMeasured:"0",psNativeProbeUrl:""},isConnected:true,
  closest:selector=>selector===".spriteStage"?{clientWidth:tile}:null,
  style:{setProperty(k,v){props[k]=String(v);}}};
 const env={window:native?{Native:{requestSpriteSilhouette(src,token){
  requests.push({src,token});return true;}}}:{},
  document:{createElement:()=>({getContext:()=>({
   drawImage(){},clearRect(){},
   getImageData(){if(tainted)throw Error("SecurityError");return {data:pixels};}
  })})}};
 vm.runInNewContext(scaleCode,env);
 return {img,url,props,requests,scale:env.window.PokeSearchSpriteScale};
}
const candidates=[
 {name:"Charmander event",r:{left:42,right:47,top:43,bottom:50}},
 {name:"Torchic",r:{left:37,right:56,top:34,bottom:61}},
 {name:"Treecko",r:{left:10,right:84,top:8,bottom:88}},
 {name:"Snorlax",r:{left:4,right:91,top:6,bottom:90}},
 {name:"Psyduck",r:{left:0,right:95,top:0,bottom:95}}
];
function checkFill(env,rect,label){
 const occ=Math.max((rect.right-rect.left+1)/96,(rect.bottom-rect.top+1)/96);
 const zoom=Number(env.props["--tile-alpha-zoom"]);
 const fill=occ*.88*zoom;
 assert.ok(zoom>0&&zoom<=24,label+" bounded zoom "+zoom);
 assert.ok(fill>=.845&&fill<=.905,label+" expected 85-90% visible fill, got "+fill);
 assert.ok(Number.isFinite(parseFloat(env.props["--tile-alpha-x"])),label+" x");
 assert.ok(Number.isFinite(parseFloat(env.props["--tile-alpha-y"])),label+" y");
}
for(const size of [24,32,40]){
 for(const framed of [true,false]){
  for(const mode of ["100%","#1"]){
   for(const {name,r} of candidates){
    const x=mock(r,size);
    assert.ok(x.scale.applyResultTile(x.img));
    checkFill(x,r,mode+" "+framed+" "+size+" "+name);
    assert.equal(x.img.dataset.psSourceMeasured,"1");
    assert.equal(x.scale.enhanceProviderTile(x.img,null,false,true),true);
    assert.equal(x.requests.length,0,"canvas-readable sprite requires no native request");
    assert.equal(x.img.src,x.url,"sprite and identity unchanged");
   }
  }
 }
 const c=candidates[0].r,x=mock(c,size,true,true);
 assert.equal(x.scale.applyResultTile(x.img),null);
 assert.equal(x.scale.enhanceProviderTile(x.img,null,false,true),true);
 assert.equal(x.requests.length,1);
 assert.equal(x.scale.onNativeBounds(x.requests[0].token,x.url,c),true);
 checkFill(x,c,"native CORS "+size);
 assert.equal(x.scale.enhanceProviderTile(x.img,null,false,true),true);
 assert.equal(x.requests.length,1);
}
for(const {name,r} of candidates){
 const x=mock(r,32,true);
 assert.equal(x.scale.enhanceProviderTile(x.img,{url:x.url,...r},false,false),true);
 checkFill(x,r,"provider page "+name);
}
let x=mock(candidates[2].r,32);
x.scale.applyResultTile(x.img);
const prior=x.props["--tile-alpha-zoom"];
assert.equal(x.scale.enhanceProviderTile(x.img,{url:"https://wrong.example/art.png",...candidates[0].r},false,true),false);
assert.equal(x.props["--tile-alpha-zoom"],prior,"stale bounds must not overwrite current row");
x=mock(candidates[0].r,32,true);
assert.equal(x.scale.applyResultTile(x.img),null);
assert.equal(x.scale.enhanceProviderTile(x.img,null,false,false),false);
assert.equal(x.props["--tile-alpha-zoom"],"1","no fabricated geometry on unreadable art");
console.log("LT294 PASS: 87% visible silhouette for P/M/G, both result modes, framed and frameless, local+provider+native, no blind zoom");

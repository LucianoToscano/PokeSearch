"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main/assets");
const scaler=fs.readFileSync(path.join(root,"sprite_visual_scale.js"),"utf8");
const dock=fs.readFileSync(path.join(root,"dock.html"),"utf8");
const detail=fs.readFileSync(path.join(root,"detail.html"),"utf8");
new vm.Script(scaler);
assert.match(scaler,/function applyResultTile\(img,verifiedReference\)/);
assert.match(scaler,/const reference=new Image\(\)/);
assert.match(scaler,/img\.isConnected===false/);
assert.match(scaler,/clamp\(measured\.zoom,\.80,1\.8\)/);
assert.match(dock,/sourceCard\?\.imageFromSite===true&&engine\?\.resolve/);
assert.match(dock,/art\?\.providerExact===true&&\/\^https:/);
assert.match(dock,/engine\?\.bundledExactForArt\?\.\(sourceCard,art\)/);
assert.match(dock,/window\.PokeSearchSpriteScale\?\.applyResultTile\?\.\(img,exactReference\)/);
assert.match(dock,/const imageUrl=verifiedSiteArt\?art\.src:\(nativeArt\|\|art\.src\)/);
assert.match(dock,/const tile=size===55\?40:size===45\?32:24/);
assert.match(dock,/width:var\(--result-art-size,21\.12px\)!important/);
assert.ok(!dock.includes('crossorigin="anonymous"'));
assert.ok(detail.includes("useArt(initialNative||art.src)"));
const DATA="data:image/png;base64,"+"A".repeat(64);
function testEnv(loadNow=true){
 const drawn=[];
 const pixels=new Uint8ClampedArray(96*96*4);
 for(let y=21;y<=73;y++)for(let x=25;x<=71;x++)pixels[(y*96+x)*4+3]=255;
 let tainted=true,created=0,refs=[];
 class FakeImage{
  constructor(){created++;this.naturalWidth=96;this.naturalHeight=96;refs.push(this);}
  set src(v){this._src=v;if(loadNow)this.onload?.();}
  get src(){return this._src;}
 }
 const tile={clientWidth:40},props={};
 const img={currentSrc:"https://pogocoordinates.com/img/133.png",src:"https://pogocoordinates.com/img/133.png",
   naturalWidth:96,naturalHeight:96,isConnected:true,
   closest:q=>q===".spriteStage"?tile:null,
   style:{setProperty:(key,val)=>{props[key]=val;}}};
 const env={window:{},Image:FakeImage,document:{createElement:()=>({
  getContext:()=>({clearRect(){},drawImage(image){drawn.push(image);},
   getImageData(){if(drawn[drawn.length-1]===img&&tainted)
     throw new Error("SecurityError: tainted canvas");
    return {data:pixels};}})
 })}};
 vm.runInNewContext(scaler,env);
 return {scale:env.window.PokeSearchSpriteScale,img,props,refs,created:()=>created,
  disableTaint:()=>tainted=false,setTileSize:v=>tile.clientWidth=v};
}
let e=testEnv();
assert.equal(e.scale.applyResultTile(e.img),null);
assert.equal(e.props["--tile-alpha-zoom"],"1");
assert.equal(e.created(),0);
e=testEnv();
assert.equal(e.scale.applyResultTile(e.img,"https://untrusted.example/a.png"),null);
assert.equal(e.created(),0);
e=testEnv();
assert.equal(e.scale.applyResultTile(e.img,DATA),null);
assert.equal(e.created(),1);
assert.ok(Number(e.props["--tile-alpha-zoom"])>1);
assert.ok(Number(e.props["--tile-alpha-zoom"])<=1.8);
assert.ok(Math.abs(parseFloat(e.props["--tile-alpha-x"]))<=40*.12);
assert.ok(Math.abs(parseFloat(e.props["--tile-alpha-y"]))<=40*.12);
assert.equal(e.img.src,"https://pogocoordinates.com/img/133.png");
e=testEnv(false);
e.scale.applyResultTile(e.img,DATA);
e.img.currentSrc="https://pogocoordinates.com/img/other.png";
e.refs[0].onload();
assert.equal(e.props["--tile-alpha-zoom"],"1");
e=testEnv(false);
e.scale.applyResultTile(e.img,DATA);
e.img.isConnected=false;
e.refs[0].onload();
assert.equal(e.props["--tile-alpha-zoom"],"1");
e=testEnv();
e.disableTaint();
const f=e.scale.applyResultTile(e.img,DATA);
assert.ok(f&&f.zoom>1);
assert.equal(e.created(),0);
for(const size of [24,32,40]){
 e=testEnv();e.setTileSize(size);e.scale.applyResultTile(e.img,DATA);
 assert.ok(Number(e.props["--tile-alpha-zoom"])<=1.8);
 assert.ok(Math.abs(parseFloat(e.props["--tile-alpha-x"]))<=size*.12+.01);
}
console.log("LT288 PASS: consistent P/M/G visual dimensions from exact local PNG reference; no provider CORS dependency or stale-row changes");

"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.join(__dirname,"../src/main/assets");
const probe=fs.readFileSync(path.join(root,"probe.js"),"utf8");
const scaler=fs.readFileSync(path.join(root,"sprite_visual_scale.js"),"utf8");
const dock=fs.readFileSync(path.join(root,"dock.html"),"utf8");
new vm.Script(scaler);
const begin=probe.indexOf("function exactCardSpriteAlphaBounds(img,url){");
const end=probe.indexOf("function parseCard(box,sourceIndex){",begin);
assert.ok(begin>0&&end>begin,"probe must measure selected source-card image");
const helper=probe.slice(begin,end);
new vm.Script(helper);
const site="https://pogocoordinates.com/assets/pm4.cJAN_2020_NOEVOLVE.icon.png";
const tinyPixels=new Uint8ClampedArray(96*96*4);
for(let y=41;y<=61;y++)for(let x=40;x<=55;x++)tinyPixels[(y*96+x)*4+3]=255;
const bigPixels=new Uint8ClampedArray(96*96*4);
for(let y=6;y<=89;y++)for(let x=7;x<=90;x++)bigPixels[(y*96+x)*4+3]=255;
let sourceCORS=false;
const cardImg={tagName:"IMG",naturalWidth:256,naturalHeight:256,src:site,currentSrc:site};
const docSource={createElement:()=>({getContext:()=>({
 clearRect(){},drawImage(){},getImageData(){if(sourceCORS)throw new Error("SecurityError");
  return {data:tinyPixels};}
})})};
const page={URL,location:{href:"https://pogocoordinates.com/search"},document:docSource};
vm.runInNewContext(helper,page);
const read=page.exactCardSpriteAlphaBounds;
const source=read(cardImg,site);
assert.equal(source.url,site);
assert.equal(source.left,40);
assert.equal(source.top,41);
assert.equal(source.right,55);
assert.equal(source.bottom,61);
assert.equal(read(cardImg,site+"?altered=1"),null,"never read a mismatched URL");
assert.equal(read({...cardImg,tagName:"SOURCE"},site),null);
assert.equal(read({...cardImg,naturalWidth:1},site),null);
sourceCORS=true;
assert.equal(read(cardImg,site),null,"provider CORS restrictions are harmless");
assert.ok(probe.includes("imageAlphaBounds=siteImageExact?"));
assert.ok(probe.includes("imageFromSite:siteImageExact,imageAlphaBounds"));
assert.ok(dock.includes("window.PokeSearchSpriteScale?.enhanceProviderTile?.("));
assert.ok(dock.includes("sourceCard.imageAlphaBounds:null"));
assert.ok(dock.includes("verifiedEvent"));
assert.ok(dock.includes("window.PokeSearchSpriteScale?.applyResultTile?.(img,exactReference)"),
 "LT288/289 bundled fallback path must still be present");
assert.ok(!dock.includes('crossorigin="anonymous"'),
 "the VISIBLE provider sprite is never switched to anonymous CORS");
assert.ok(scaler.includes('source.crossOrigin="anonymous"'),
 "only a separate optional measuring image requests CORS");
assert.ok(scaler.includes('state.psEventProbeUrl=src'));
assert.ok(scaler.includes('img.dataset?.psSourceMeasured==="1"'),
 "a completed source measurement outranks approximate local reference");

function environment(sourcePixels=tinyPixels){
 const box={clientWidth:40},props={},created=[],drawn=[];
 let tainted=true;
 const img={src:site,currentSrc:site,naturalWidth:256,naturalHeight:256,isConnected:true,
  dataset:{psSourceMeasured:"0"},
  closest:q=>q===".spriteStage"?box:null,
  style:{setProperty:(k,v)=>{props[k]=String(v);}}};
 class FakeImage{
  constructor(){this.naturalWidth=256;this.naturalHeight=256;created.push(this);}
  set src(value){this._src=value;}
  get src(){return this._src;}
 }
 const context={window:{},Image:FakeImage,
  document:{createElement:()=>({getContext:()=>({
   clearRect(){},drawImage(x){drawn.push(x);},
   getImageData(){if(drawn[drawn.length-1]===img&&tainted)
    throw new Error("SecurityError: ordinary WebView image lacks CORS");
    return {data:sourcePixels};}
  })})}};
 vm.runInNewContext(scaler,context);
 return {img,box,props,created,scale:context.window.PokeSearchSpriteScale,
  setTainted:x=>tainted=x};
}
let e=environment();
assert.equal(e.scale.applyResultTile(e.img),null);
assert.equal(e.props["--tile-alpha-zoom"],"1");
assert.equal(e.scale.enhanceProviderTile(e.img,source,false),true);
const providerZoom=Number(e.props["--tile-alpha-zoom"]);
assert.ok(providerZoom>2.85&&providerZoom<=7,
 "small EVENT sprite uses measured original opaque silhouette beyond old blanket cap");
assert.equal(e.img.currentSrc,site,"provider artwork remains unchanged");
assert.equal(e.created.length,0,"source-side geometry needs no second HTTP request");
assert.equal(e.img.dataset.psSourceMeasured,"1");
assert.equal(e.scale.enhanceProviderTile(e.img,{...source,url:site+"?other"},false),false,
 "geometry from another encounter cannot change the current sprite");
assert.equal(e.props["--tile-alpha-zoom"],String(providerZoom));

e=environment(bigPixels);
const broad={url:site,left:7,right:90,top:6,bottom:89};
assert.equal(e.scale.enhanceProviderTile(e.img,broad,false),true);
assert.equal(e.props["--tile-alpha-zoom"],"1",
 "standard well-filled sprites retain fixed P/M/G size with no forced magnification");

e=environment();
assert.equal(e.scale.enhanceProviderTile(e.img,null,false),false);
assert.equal(e.created.length,0,"non-event CORS-tainted sprites do not gain extra network requests");

e=environment();
assert.equal(e.scale.enhanceProviderTile(e.img,null,true),true);
assert.equal(e.created.length,1);
assert.equal(e.created[0].crossOrigin,"anonymous");
assert.equal(e.created[0].src,site);
assert.equal(e.scale.enhanceProviderTile(e.img,null,true),false,"one retry per tile and URL");
e.created[0].onload();
assert.ok(Number(e.props["--tile-alpha-zoom"])>2.85,
 "optional CORS image of the same verified event supports normalizing tiny art");
assert.equal(e.img.src,site);

e=environment();
assert.equal(e.scale.enhanceProviderTile(e.img,null,true),true);
e.img.currentSrc="https://pogocoordinates.com/assets/other.png";
e.created[0].onload();
assert.equal(e.props["--tile-alpha-zoom"],undefined,
 "out-of-date response cannot modify a different result");

e=environment();
e.scale.enhanceProviderTile(e.img,null,true);
e.img.isConnected=false;
e.created[0].onload();
assert.equal(e.props["--tile-alpha-zoom"],undefined,
 "removed results never receive an obsolete CSS transform");

console.log("LT290 PASS: direct same-card silhouette, conservative normal sprites, one CORS-only event probe, identity and stale-result guards");
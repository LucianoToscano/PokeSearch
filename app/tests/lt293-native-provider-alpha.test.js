"use strict";
/* LT293 Samsung reproduction: Charmander appears ~half sized in the same
 * tile as Treecko or Snorlax because provider PNG alpha was canvas-tainted.
 * The native reader may inspect ONLY the exact site-verified HTTPS sprite,
 * without changing the displayed artwork or any results/IV data.
 */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../src/main/assets");
const scaler=fs.readFileSync(path.join(root,"sprite_visual_scale.js"),"utf8");
const dock=fs.readFileSync(path.join(root,"dock.html"),"utf8");
const java=fs.readFileSync(path.join(__dirname,
 "../src/main/java/com/lucianotoscano/pokesearchoverlay/VerifiedSpriteGeometry.java"),"utf8");
const bridge=fs.readFileSync(path.join(__dirname,
 "../src/main/java/com/lucianotoscano/pokesearchoverlay/OverlayService.java"),"utf8");
new vm.Script(scaler);
assert.match(dock,/verifiedProvider=String\(img\.currentSrc\|\|img\.src\|\|""\)===String\(art\.src\|\|""\)/);
assert.match(dock,/verifiedEvent,verifiedProvider\)/);
assert.match(dock,/sourceCard\?\.imageFromSite===true&&engine\?\.resolve/);
assert.match(scaler,/function enhanceProviderTile\(img,cardBounds,verifiedEvent,verifiedProvider=false\)/);
assert.match(scaler,/if\(verifiedProvider&&nativeSourceGeometry\(img,src,applyMeasured,tryCors\)\)/);
assert.match(scaler,/const fit=geometryFit\(bounds,cardSize\*RESULT_IMAGE_BOX,SOURCE_MEASURED_MAX_ZOOM\)/);
assert.match(scaler,/setResultTileFit\(img,fit\);/);
assert.match(scaler,/root\.PokeSearchSpriteScale=Object\.freeze\(\{.*onNativeBounds\}\)/);
assert.match(java,/class VerifiedSpriteGeometry/);
for(const host of ["pogocoordinates.com","raw.githubusercontent.com","cdn.jsdelivr.net"])
 assert.ok(java.includes('"'+host+'"'),"native restricts source hosts "+host);
assert.match(java,/new ArrayBlockingQueue<>\(24\)/);
assert.match(java,/private static final int MAX_BYTES=384\*1024/);
assert.match(java,/conn\.setInstanceFollowRedirects\(false\)/);
assert.match(java,/if\(!"https"\.equalsIgnoreCase\(uri\.getScheme\(\)\)/);
assert.match(java,/conn\.setReadTimeout\(3200\)/);
assert.match(java,/BitmapFactory\.decodeByteArray\(data,0,data\.length,opts\)/);
assert.match(java,/return "\{\\"left\\":"/);
assert.doesNotMatch(java,/CookieManager|getCookie\(|setRequestProperty\("Authorization"|Bearer [A-Z]|\/search\/api/i,
 "native image metadata probe must not send user credentials or API searches");
assert.match(bridge,/@JavascriptInterface public boolean requestSpriteSilhouette\(/);
assert.match(bridge,/VerifiedSpriteGeometry\.request\(OverlayService\.this,/);
assert.match(bridge,/if\(stopped\|\|resultPanel==null\|\|!resultLoaded\)return/);
assert.match(bridge,/JSONObject\.quote\(requestToken\)/);
assert.match(bridge,/JSONObject\.quote\(sourceUrl\)/);

const url="https://pogocoordinates.com/assets/pm4.cPARTY_2026.icon.png";
function env(options={}){
 const requests=[],props={},native=options.native!==false;
 const box={clientWidth:40};
 const img={src:url,currentSrc:url,naturalWidth:256,naturalHeight:256,isConnected:true,
   dataset:{psNativeProbeUrl:"",psSourceMeasured:"0"},
   closest:()=>box,
   style:{setProperty(key,value){props[key]=String(value);}}};
 const context={window:{Native:native?{requestSpriteSilhouette(src,token){
    requests.push({src,token});return options.reject?false:true;}}:undefined},
  Image:class {
    constructor(){this.naturalWidth=96;this.naturalHeight=96;}
    set src(value){this._src=value;}
    get src(){return this._src;}
   },
  document:{createElement:()=>({getContext:()=>({
    clearRect(){},drawImage(){},
    getImageData(){throw new Error("SecurityError: canvas-tainted website art");}
   })})}};
 vm.runInNewContext(scaler,context);
 const scale=context.window.PokeSearchSpriteScale;
 return {scale,img,props,requests};
}
// Verified provider sprite, not marked event in API: still measured natively.
let x=env();
x.scale.applyResultTile(x.img);
assert.equal(x.props["--tile-alpha-zoom"],"1");
assert.equal(x.scale.enhanceProviderTile(x.img,null,false,true),true);
assert.equal(x.requests.length,1);
assert.equal(x.requests[0].src,url);
assert.ok(/^psg\d+$/.test(x.requests[0].token));
const tiny={left:38,right:56,top:34,bottom:61};
assert.equal(x.scale.onNativeBounds(x.requests[0].token,url,tiny),true);
assert.equal(x.img.currentSrc,url,"same provider picture remains displayed");
assert.ok(Number(x.props["--tile-alpha-zoom"])>2,
 "the tiny visual Charmander grows based on its own verified alpha contour");
assert.equal(x.img.dataset.psSourceMeasured,"1");
assert.equal(x.scale.enhanceProviderTile(x.img,null,false,true),true);
assert.equal(x.requests.length,1,"same image never triggers repeated download");
assert.equal(x.scale.onNativeBounds(x.requests[0].token,url,tiny),false,
 "native callback is one-use only");

// Already large images also use the same 87% target, near 1x.
x=env();
x.scale.enhanceProviderTile(x.img,null,false,true);
assert.equal(x.scale.onNativeBounds(x.requests[0].token,url,
 {left:4,right:91,top:5,bottom:90}),true);
assert.ok(Math.abs(Number(x.props["--tile-alpha-zoom"])*.88*(88/96)-.87)<.01,
 "well-filled Snorlax is still normalized to the same 87% target");

// Invalid result source identity: no native fetch, no enhancement.
x=env();
assert.equal(x.scale.enhanceProviderTile(x.img,null,false,false),false);
assert.equal(x.requests.length,0);
assert.equal(x.props["--tile-alpha-zoom"],undefined);
// Removed row: delayed result cannot change its old sprite.
x=env();
x.scale.enhanceProviderTile(x.img,null,false,true);
x.img.isConnected=false;
assert.equal(x.scale.onNativeBounds(x.requests[0].token,url,tiny),false);
assert.equal(x.props["--tile-alpha-zoom"],undefined);
// Reused slot for a different image: stale bounds rejected.
x=env();
x.scale.enhanceProviderTile(x.img,null,false,true);
x.img.currentSrc="https://pogocoordinates.com/assets/pm4.cOTHER.png";
assert.equal(x.scale.onNativeBounds(x.requests[0].token,url,tiny),false);
assert.equal(x.props["--tile-alpha-zoom"],undefined);
// Spoofed callback URL is rejected even with a valid token.
x=env();
x.scale.enhanceProviderTile(x.img,null,false,true);
assert.equal(x.scale.onNativeBounds(x.requests[0].token,"https://other.example.net/file.png",tiny),false);
assert.equal(x.props["--tile-alpha-zoom"],undefined);
// No native bridge on old WebView: existing LT290 CORS attempt remains.
x=env({native:false});
assert.equal(x.scale.enhanceProviderTile(x.img,null,true,true),true);
assert.equal(x.requests.length,0);
assert.equal(x.img.src,url);
// Native queue rejected: falls through to safe conservative neutral fit.
x=env({reject:true});
assert.equal(x.scale.enhanceProviderTile(x.img,null,false,true),false);
assert.equal(x.requests.length,1);
assert.equal(x.img.dataset.psNativeProbeUrl,"");
console.log("LT293 PASS: verified provider native alpha fixes tiny Charmander; normal, unknown, stale, replaced, callback spoofing & CORS fallback safe");

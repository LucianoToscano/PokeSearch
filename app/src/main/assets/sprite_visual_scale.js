/* QA19: alpha-silhouette normalization. No asset rewrite or proxy. */
(function(root){
"use strict";
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function measure(img){
 const w=Number(img?.naturalWidth)||0,h=Number(img?.naturalHeight)||0;
 if(w<8||h<8||typeof document==="undefined")return null;
 try{
  const canvas=document.createElement("canvas");canvas.width=96;canvas.height=96;
  const ctx=canvas.getContext("2d",{willReadFrequently:true});if(!ctx)return null;
  const dw=96*w/Math.max(w,h),dh=96*h/Math.max(w,h);
  ctx.clearRect(0,0,96,96);ctx.drawImage(img,(96-dw)/2,(96-dh)/2,dw,dh);
  const a=ctx.getImageData(0,0,96,96).data;
  let left=96,right=-1,top=96,bottom=-1,count=0;
  for(let y=0;y<96;y++)for(let x=0;x<96;x++){
   if(a[(y*96+x)*4+3]<38)continue;
   left=Math.min(left,x);right=Math.max(right,x);
   top=Math.min(top,y);bottom=Math.max(bottom,y);count++;
  }
  if(count<32||right<0)return null;
  return clamp(Math.max((right-left+1)/96,(bottom-top+1)/96),.05,1);
 }catch(_){return null;} // CORS-tainted remote art: keep conservative CSS fit.
}
function factor(img){
 const occupancy=measure(img);
 return occupancy==null?1:Math.round(clamp(.78/occupancy,.76,1.06)*1000)/1000;
}
function apply(img){
 if(!img?.style?.setProperty)return 1;
 const value=factor(img);img.style.setProperty("--ps-alpha-scale",String(value));return value;
}
// LT226: result-only visible-art normalization. 88% of an image element
// is NOT 88% of the Pokémon when PNG/WebP includes transparent margins.
// Measure the actually opaque silhouette; keep the original image bytes,
// form, outfit, sprites, quality and aspect ratio untouched.
const tileBoundsCache=new Map();
const SAMPLE=96;
function visibleBounds(img){
 const w=Number(img?.naturalWidth)||0,h=Number(img?.naturalHeight)||0;
 if(w<8||h<8||typeof document==="undefined")return null;
 const url=String(img.currentSrc||img.src||"");
 const cacheKey=url+"|"+w+"x"+h;
 if(url&&tileBoundsCache.has(cacheKey))return tileBoundsCache.get(cacheKey);
 try{
  const canvas=document.createElement("canvas");
  canvas.width=SAMPLE;canvas.height=SAMPLE;
  const ctx=canvas.getContext("2d",{willReadFrequently:true});
  if(!ctx)return null;
  const dw=SAMPLE*w/Math.max(w,h),dh=SAMPLE*h/Math.max(w,h);
  ctx.clearRect(0,0,SAMPLE,SAMPLE);
  ctx.drawImage(img,(SAMPLE-dw)/2,(SAMPLE-dh)/2,dw,dh);
  const pixels=ctx.getImageData(0,0,SAMPLE,SAMPLE).data;
  let left=SAMPLE,right=-1,top=SAMPLE,bottom=-1,count=0;
  for(let y=0;y<SAMPLE;y++)for(let x=0;x<SAMPLE;x++){
   if(pixels[(y*SAMPLE+x)*4+3]<38)continue;
   left=Math.min(left,x);right=Math.max(right,x);
   top=Math.min(top,y);bottom=Math.max(bottom,y);count++;
  }
  if(count<22||right<0)return null;
  const bounds={left,right,top,bottom};
  if(url){if(tileBoundsCache.size>200)tileBoundsCache.clear();tileBoundsCache.set(cacheKey,bounds);}
  return bounds;
 }catch(_){return null;} // Remote CORS: keep original pixels instead of hiding.
}
function tileFit(img,box){
 const bounds=visibleBounds(img);
 if(!bounds)return null;
 const spanX=(bounds.right-bounds.left+1)/SAMPLE;
 const spanY=(bounds.bottom-bounds.top+1)/SAMPLE;
 const occupancy=Math.max(spanX,spanY);
 if(!(occupancy>0))return null;
 // Image box already measures 88% of the card. Result silhouette should be
 // ~87% (inside requested 85–90%), with no crop; cap unusual tiny art.
 const zoom=Math.round(clamp(.87/(.88*occupancy),.80,2.85)*1000)/1000;
 const imageBox=Number(box)||Number(img?.clientWidth)||0;
 const cx=(bounds.left+bounds.right+1)/(2*SAMPLE);
 const cy=(bounds.top+bounds.bottom+1)/(2*SAMPLE);
 return {zoom,
   x:Math.round((.5-cx)*zoom*imageBox*100)/100,
   y:Math.round((.5-cy)*zoom*imageBox*100)/100,
   occupancy};
}
function applyResultTile(img){
 if(!img?.style?.setProperty)return null;
 const tile=img.closest?.(".spriteStage");
 const cardSize=Number(tile?.clientWidth)||0;
 const artworkBox=cardSize*.88;
 const fit=tileFit(img,artworkBox);
 if(!fit){
  // Security-tainted provider/CDN assets: do not attempt unsafe pixel reads
  // or scale blindly (which could crop horns, tails and costumes).
  img.style.setProperty("--tile-alpha-zoom","1");
  img.style.setProperty("--tile-alpha-x","0px");
  img.style.setProperty("--tile-alpha-y","0px");
  return null;
 }
 img.style.setProperty("--tile-alpha-zoom",String(fit.zoom));
 img.style.setProperty("--tile-alpha-x",fit.x+"px");
 img.style.setProperty("--tile-alpha-y",fit.y+"px");
 return fit;
}
root.PokeSearchSpriteScale=Object.freeze({measure,factor,apply,visibleBounds,tileFit,applyResultTile});
})(window);

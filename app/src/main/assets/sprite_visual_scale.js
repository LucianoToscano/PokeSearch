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
root.PokeSearchSpriteScale=Object.freeze({measure,factor,apply});
})(window);

"use strict";
// LT397 validates the actual user-provided icon pack, preserving pixel
// geometry and independent module actions without building an APK.
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),zlib=require("node:zlib");
const root=path.join(__dirname,"../src/main");
const src=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
const atlas=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/HomeUserIconAtlas.java"),"utf8");
const file=fs.readFileSync(path.join(root,"assets/home-lt397-owner-icons.png"));
assert.equal(crypto.createHash("sha256").update(file).digest("hex"),
  "aec9248bfab9f74e058e990fbea079840010db75afc071737fa9ddddd96928ba");
assert.equal(file.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
assert.equal(file.readUInt32BE(16),768);
assert.equal(file.readUInt32BE(20),256);
assert.equal(file[25],6,"PNG must have transparency (RGBA)");
// Reconstruct alpha data to validate margins across each square cell.
let i=8,chunks=[];
while(i<file.length){
 const size=file.readUInt32BE(i),name=file.toString("ascii",i+4,i+8);
 if(name==="IDAT")chunks.push(file.subarray(i+8,i+8+size));
 i+=12+size;
 if(name==="IEND")break;
}
const raw=zlib.inflateSync(Buffer.concat(chunks));
const width=768,height=256,stride=width*4,bpp=4;
const pixels=Buffer.alloc(stride*height);
let at=0;
for(let y=0;y<height;y++){
 const filter=raw[at++];
 assert.ok(filter>=0&&filter<=4,"PNG filter");
 for(let x=0;x<stride;x++){
  const v=raw[at++],left=x>=bpp?pixels[y*stride+x-bpp]:0,
        up=y?pixels[(y-1)*stride+x]:0,
        diag=y&&x>=bpp?pixels[(y-1)*stride+x-bpp]:0;
  const p=left+up-diag;
  const aa=Math.abs(p-left),bb=Math.abs(p-up),cc=Math.abs(p-diag);
  const paeth=aa<=bb&&aa<=cc?left:bb<=cc?up:diag;
  const pred=[0,left,up,Math.floor((left+up)/2),paeth][filter];
  pixels[y*stride+x]=(v+pred)&255;
 }
}
const bboxes=[];
for(let tile=0;tile<3;tile++){
 let left=256,top=256,right=-1,bottom=-1,count=0;
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const alpha=pixels[(y*width+tile*256+x)*4+3];
  if(alpha>=64){left=Math.min(x,left);top=Math.min(y,top);
   right=Math.max(x,right);bottom=Math.max(y,bottom);count++;}
 }
 assert.ok(count>1500,"tile "+tile+" must contain visible artwork");
 assert.ok(left>=20&&top>=20&&right<=235&&bottom<=235,
   "tile "+tile+" artwork must be centered with safe transparent margins");
 bboxes.push([left,top,right,bottom]);
}
assert.match(atlas,/position==3\|\|position==13\|\|position==15/);
assert.match(atlas,/position==3\?0:position==13\?TILE:2\*TILE/);
assert.match(atlas,/home-lt397-owner-icons\.png/);
assert.match(src,/HomeUserIconAtlas\.icon\(this,index\)/);
assert.match(src,/index==3\|\|index==13\|\|index==15/);
assert.match(src,/artwork\.setPadding\(d\(3\),d\(2\),d\(3\),d\(2\)\)/);
assert.match(src,/artwork\.clearColorFilter\(\)/);
assert.match(src,/artwork\.setImageTintList\(null\)/);
assert.doesNotMatch(src,/muted\.setSaturation\(\.20f\)/);
assert.match(src,/homeModuleNames=\{/);
for(const name of ['"Assistente"','"Trocas"','"Comunidade"']){
 assert.ok(src.includes(name),"Preserve module label "+name);
}
assert.match(src,/homeModuleIcons\[15\]\.setOnClickListener\(v->showCommunityHomeOptions\(\)\)/);
assert.match(src,/for\(int line=0;line<4;line\+\+\)/);
assert.match(src,/for\(int col=0;col<4;col\+\+\)/);
console.log("LT397: three original white owner icons in balanced cells; action routes and 4x4 layout preserved. Bounds:",JSON.stringify(bboxes));

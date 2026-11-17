"use strict";
// LT396 verifies the missing strokes themselves, not only icon padding.
// PNG decoder uses Node builtins to keep Android CI independent from Pillow.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const crypto=require("node:crypto"),zlib=require("node:zlib");
const root=path.join(__dirname,"../src/main");
const repo=path.join(__dirname,"../..");
function pngData(file){
 const bytes=fs.readFileSync(file);
 assert.equal(bytes.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
 let pos=8,w=0,h=0,channels=0,compressed=[];
 while(pos<bytes.length){
  const size=bytes.readUInt32BE(pos);const kind=bytes.toString("ascii",pos+4,pos+8);
  const data=bytes.subarray(pos+8,pos+8+size);pos+=size+12;
  if(kind==="IHDR"){
   w=data.readUInt32BE(0);h=data.readUInt32BE(4);
   assert.equal(data[8],8,"8-bit PNG");
   assert.equal(data[9],6,"RGBA PNG");
   channels=4;
  }
  if(kind==="IDAT")compressed.push(data);
  if(kind==="IEND")break;
 }
 const inflated=zlib.inflateSync(Buffer.concat(compressed));
 const pixels=Buffer.alloc(w*h*channels);
 const stride=w*channels;let offset=0;
 function paeth(a,b,c){
   const p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);
   return da<=db&&da<=dc?a:db<=dc?b:c;
 }
 for(let y=0;y<h;y++){
  const filter=inflated[offset++];
  for(let x=0;x<stride;x++){
   const prev=y?pixels[(y-1)*stride+x]:0;
   const left=x>=4?pixels[y*stride+x-4]:0;
   const ul=y&&x>=4?pixels[(y-1)*stride+x-4]:0;
   const v=inflated[offset++];
   const correction=filter===0?0:filter===1?left:filter===2?prev:
     filter===3?Math.floor((left+prev)/2):filter===4?paeth(left,prev,ul):NaN;
   assert.ok(Number.isFinite(correction),"unsupported PNG filter");
   pixels[y*stride+x]=(v+correction)&255;
  }
 }
 return {w,h,pixel:(x,y)=>pixels[(y*w+x)*4+3]};
}
function checkHash(file,expected){
 const b=fs.readFileSync(file);
 assert.equal(crypto.createHash("sha256").update(b).digest("hex"),expected);
}
const questPath=path.join(repo,"docs/assets/LT396_Quests_restaurado.png");
const communityPath=path.join(repo,"docs/assets/LT396_Comunidade_restaurado.png");
checkHash(questPath,"f9a9b04c7ed10d500b3e75282129304e1b9d8459d3c4198cd9c260ad53e3989e");
checkHash(communityPath,"49d34f6f35e4d93992f2b696e93a6e674665c48d25cb52d114e2f953780cdd9b");
checkHash(path.join(root,"assets/home-user-icons-atlas.png"),"abdebce91043c4576fcedf3e64f63492a9e18f5d600246090a5032f6d54976af");
const quest=pngData(questPath),community=pngData(communityPath);
assert.equal(quest.w,512);assert.equal(community.w,512);
assert.ok(quest.pixel(255,496)>220,"Quest bottom arc actually restored beyond 484px cut");
assert.equal(quest.pixel(255,500),0,"Quest should not flood remaining canvas");
assert.ok(community.pixel(500,275)>220,"Community right outline actually restored beyond 488px cut");
assert.equal(community.pixel(509,275),0,"Community tip should end within canvas");
const code=fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay/MainActivity.java"),"utf8");
assert.match(code,/if\(index==6\)/);
assert.match(code,/artwork\.setPadding\(d\(6\),d\(2\),d\(6\),d\(3\)\)/);
assert.match(code,/index==3\|\|index==13\|\|index==15/);
assert.match(code,/artwork\.setPadding\(d\(3\),d\(2\),d\(3\),d\(2\)\)/);
assert.match(code,/artwork\.clearColorFilter\(\)/);
assert.doesNotMatch(code,/new android\.graphics\.ColorMatrixColorFilter\(muted\)/);
assert.match(code,/if\(index==0\|\|index==1\|\|index==3\)/);
assert.match(code,/for\(int line=0;line<4;line\+\+\)/);
assert.match(code,/for\(int col=0;col<4;col\+\+\)/);
console.log("PASS LT396: original Quest and Community pixel repairs archived; LT397 user art correctly overrides Home tile");

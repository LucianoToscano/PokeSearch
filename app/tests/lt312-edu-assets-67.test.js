"use strict";
const assert=require("node:assert/strict");
const crypto=require("node:crypto");
const fs=require("node:fs");
const path=require("node:path");
const assetPath=path.join(__dirname,"../src/main/assets/edu_avatar_extra_5.webp");
const src=fs.readFileSync(assetPath);
assert.equal(src.length,12374,"Atlas suplementar: 12374 bytes originais");
assert.equal(src.toString("ascii",0,4),"RIFF");
assert.equal(src.toString("ascii",8,12),"WEBP");
assert.equal(src.toString("ascii",12,16),"VP8L","WebP lossless de 5 poses");
assert.equal(crypto.createHash("sha256").update(src).digest("hex"),
  "cfcccdc0981899200073da63bb0ba6e61396fc7e575656304acf5f1c041cd933");
// VP8L lossless: width-1 14 bits, height-1 14 bits.
const b1=src[21],b2=src[22],b3=src[23],b4=src[24];
const width=1+(b1|((b2&0x3f)<<8));
const height=1+((b2>>6)|(b3<<2)|((b4&0x0f)<<10));
assert.equal(width,640,"Atlas 5×128 px largura");
assert.equal(height,128,"Uma linha de quadros 128 px");
const java=fs.readFileSync(path.join(__dirname,
  "../src/main/java/com/lucianotoscano/pokesearchoverlay/EduSpriteAtlas.java"),"utf8");
assert(java.includes('EXTRA_ASSET="edu_avatar_extra_5.webp"'));
assert(java.includes("EXTRA_COLS=5, EXTRA_COUNT=5"));
assert(java.includes("TOTAL_COUNT=COUNT+EXTRA_COUNT"));
assert(java.includes('if(uniform==null&&i>=COUNT&&i<TOTAL_COUNT&&extras==null&&'),
  "A ausência de extras antigos deve preservar o fallback, sem afetar a nova Sombria");
assert(java.includes('CONSISTENT_IDLE_ASSET="edu_avatar_idle_consistent_22.webp"'));\nassert(java.includes('UNIFORM_ASSET="edu_avatar_uniform_68.webp"'),"68 novos com prioridade");
assert(java.includes('consistentIdle!=null&&consistentFrame>=0'));
// A versão LT313 pode renderizar as cinco extras pelo atlas novo quando disponível.
for (const [name,index] of Object.entries({edu_shiny:62,edu_jogando_01:63,edu_jogando_02:64,edu_armadura_mewtwo:65,edu_armadura_mewtwo_shiny:66})){
 assert(java.includes('case "'+name+'": return '+index+';'),name);
}
assert(java.includes("Bitmap crop=Bitmap.createBitmap(source,left,top,CELL,CELL)"));
assert(java.includes('case "edu_jogando": return new int[]{63,64}'));
console.log("LT312 extra assets PASS: WebP lossless 640×128, SHA-256 e 67 quadros preservados");

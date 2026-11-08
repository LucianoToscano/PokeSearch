"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const crypto=require("node:crypto");
const atlasJava=fs.readFileSync("app/src/main/java/com/lucianotoscano/pokesearchoverlay/EduSpriteAtlas.java","utf8");
const data=fs.readFileSync("app/src/main/assets/edu_avatar_uniform_68_lt316.b64","utf8").trim();
const decoded=Buffer.from(data,"base64");
assert.equal(decoded.length,220866,"Atlas QA precisa ter o tamanho verificado");
assert.equal(crypto.createHash("sha256").update(decoded).digest("hex"),
  "cb9ffbc0886824b04977140a3c7cfc381f9c9244700a72c8e8011af204050a1c",
  "Integridade dos 68 quadros alterada");
assert.equal(decoded.toString("ascii",0,4),"RIFF","Imagem deve ser WebP");
assert.equal(decoded.toString("ascii",8,12),"WEBP");
assert.equal(decoded.toString("ascii",12,16),"VP8L","Lossless mantém a pixel art");
assert.equal(decoded[20],0x2f,"Bitstream WebP lossless válido");
const width=1+decoded[21]+((decoded[22]&63)<<8);
const height=1+(decoded[22]>>6)+(decoded[23]<<2)+((decoded[24]&15)<<10);
assert.deepEqual([width,height],[1024,1152],"8x9 sprites em células de 128x128");
assert.match(atlasJava,/CORRECTED_UNIFORM_ASSET="edu_avatar_uniform_68_lt316.b64"/);
assert.match(atlasJava,/if\(unified!=null\)unified\.recycle\(\)/);
assert.match(atlasJava,/catch\(IOException\|RuntimeException ignored\)/);
assert.match(atlasJava,/i<COUNT\?atlas:extras/);
assert.match(atlasJava,/if\(!uniformFrame\)\{/,"A nova arte não deve sofrer segunda reescala");
assert.match(atlasJava,/COLLECTION_COUNT=TOTAL_COUNT\+1/);
assert.match(atlasJava,/SHADOW_INDEX=67/);
assert.match(atlasJava,/UNIFORM_COLS=8, UNIFORM_ROWS=9/);
assert.match(atlasJava,/SIZES_PX=\{50,75,100\}/,"P/M/G mantidos");
console.log("LT316 PASS: WebP 68 quadros, SHA-256, fallback e imagem sem segunda escala");

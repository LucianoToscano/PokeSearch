"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const crypto=require("node:crypto");
const path=require("node:path");
const base=path.join(__dirname,"../src/main");
const asset=fs.readFileSync(path.join(base,"assets/edu_avatar_idle_consistent_22.webp"));
const java=fs.readFileSync(path.join(base,"java/com/lucianotoscano/pokesearchoverlay/EduSpriteAtlas.java"),"utf8");
const service=fs.readFileSync(path.join(base,"java/com/lucianotoscano/pokesearchoverlay/RaidDayAssistantOverlayService.java"),"utf8");
const old=fs.readFileSync(path.join(base,"assets/edu_avatar_atlas_62.webp"));
const extra=fs.readFileSync(path.join(base,"assets/edu_avatar_extra_5.webp"));
assert.equal(asset.toString("ascii",0,4),"RIFF");
assert.equal(asset.toString("ascii",8,12),"WEBP");
assert.equal(asset.toString("ascii",12,16),"VP8L","lossless WebP, preservar pixel art");
assert.equal(asset[20],0x2F,"WebP lossless signature");
const bits=asset.readUInt32LE(21);
assert.equal((bits&0x3fff)+1,1024,"atlas 8 colunas");
assert.equal(((bits>>>14)&0x3fff)+1,384,"atlas 3 linhas");
assert.ok(asset.length>50000&&asset.length<500000,"asset compactado offline");
assert.equal(crypto.createHash("sha256").update(asset).digest("hex"),
  "9ec3afa294d06d9d1cad9db8d4a3256e5f7230623f58cd6819e835192eee1a62");
assert.match(java,/COUNT=62/,"62 frames LT309 imutáveis");
assert.match(java,/EXTRA_COUNT=5/,"mais cinco LT312");
assert.match(java,/TOTAL_COUNT=COUNT\+EXTRA_COUNT/,"67 frames");
assert.match(java,/IDLE_COLS=8, IDLE_ROWS=3, IDLE_COUNT=22/);
assert.match(java,/CONSISTENT_IDLE_ASSET="edu_avatar_idle_consistent_22.webp"/);
assert.match(java,/BitmapFactory\.decodeStream\(idleInput,null,noScale\)/);
assert.match(java,/noScale\.inScaled=false/);
assert.match(java,/if\(!replacement\)crop=normalizeIdleBody\(crop,i\)/,
    "não duplicar escala das 22 poses novas");
assert.match(java,/drawable\.setFilterBitmap\(false\)/);
assert.match(java,/drawable\.setAntiAlias\(false\)/);
assert.match(java,/consistentIdle!=null&&consistentFrame>=0/);
assert.match(java,/if\(i>=COUNT && extras==null && \(consistentIdle==null\|\|consistentFrame<0\)\)/,
    "sem crash se novos assets estiverem ausentes");
const mapped=new Map([
 [42,0],[0,1],[1,2],[2,3],[3,4],
 [5,5],[6,6],[7,7],[8,8],
 [24,9],[25,10],[26,11],[27,12],
 [32,13],[33,14],[34,15],[35,16],
 [62,17],[63,18],[64,19],[65,20],[66,21]
]);
assert.equal(mapped.size,22);
const mapping=java.slice(java.indexOf("public static int consistentIdleFrameIndex"),
                         java.indexOf("private static int idleSourceHeight"));
for(const [original,target] of mapped){
 assert.ok(mapping.includes("case "+original+": return "+target+";"),
  "índice original "+original+" deve usar quadro uniforme "+target);
}
for(const forbidden of [9,20,23,28,29,36,37,38,39,40,41,43,44,45,46,47,48,49,50,51,52,53,54,60,61]){
 assert.ok(!mapping.includes("case "+forbidden+":"),
   "não alterar reações e outros estados fora do idle "+forbidden);
}
assert.match(java,/if\(consistentIdle!=null&&!consistentIdle\.isRecycled\(\)\)/,
    "bitmaps suplementares são liberados ao fechar");
assert.match(service,/EDU_IDLE_ROTATION/);
for(const seq of ["pokebola_gesto","caminhada_frente","caminhada_direita",
   "caminhada_esquerda","edu_jogando","edu_shiny",
   "edu_armadura_mewtwo","edu_armadura_mewtwo_shiny"])
 assert.ok(service.includes('"'+seq+'"'),"ciclo ocioso "+seq);
assert.match(java,/SIZES_PX=\{50,75,100\}/,"não muda P/M/G");
assert.ok(old.length>700000,"atlas de 62 continua incluído");
assert.ok(extra.length>5000,"atlas de 5 continua incluído");
console.log("LT313: asset WebP lossless 22, proporções consistentes, mapeamento e fallback PASS");

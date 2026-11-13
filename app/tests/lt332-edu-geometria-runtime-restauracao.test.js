"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const base="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const atlas=fs.readFileSync(base+"EduSpriteAtlas.java","utf8");
const svc=fs.readFileSync(base+"RaidDayAssistantOverlayService.java","utf8");
const masters=fs.readFileSync(base+"EduSpriteMasters.java","utf8");
const rotations=svc.match(/private static final String\[\] EDU_IDLE_ROTATION=\{([\s\S]*?)\};/);
assert.ok(rotations,"O ciclo idle precisa estar presente");
const names=[...rotations[1].matchAll(/"([^"]+)"/g)].map(x=>x[1]);
assert.deepEqual(names,[
 "pokebola_gesto","caminhada_frente","caminhada_direita",
 "caminhada_esquerda","edu_jogando","edu_shiny",
 "edu_armadura_mewtwo","edu_armadura_mewtwo_shiny"
],"A LT331 não pode eliminar seis sequências de novo");
const ids=[0,1,2,3,5,6,7,8,24,25,26,27,32,33,34,35,62,63,64,65,66];
assert.equal(new Set(ids).size,21);
for(const [name,frames] of Object.entries({
 pokebola_gesto:[0,1,2,3],caminhada_frente:[5,6,7,8],
 caminhada_direita:[24,25,26,27],caminhada_esquerda:[32,33,34,35],
 edu_jogando:[63,64],edu_shiny:[62],edu_armadura_mewtwo:[65],
 edu_armadura_mewtwo_shiny:[66]
}))assert.ok(atlas.includes('case "'+name+'": return new int[]{'+frames.join(',')+'};'),
 "Quadros do atlas preservados "+name);
// LT333: não repetir a deformação/borrão que vinha do ajuste LT332.
const native=atlas.slice(atlas.indexOf("Bitmap original512=masters.frame(i);"),
 atlas.indexOf("if(cache[i]==null)",atlas.indexOf("Bitmap original512=masters.frame(i);")));
assert.match(native,/if\(original512!=null\)/);
assert.doesNotMatch(native,/EduSpriteGeometry512|\.normalize\(/,
 "Não modificar os pixels dos masters já carregados em 512");
assert.match(native,/drawable\.setFilterBitmap\(false\)/,
 "Nearest-neighbor na saída nativa");
assert.match(native,/drawable\.setAntiAlias\(false\)/);
assert.match(native,/displayCache\.put\(i,drawable\)/);
assert.doesNotMatch(atlas,/drawable\.setFilterBitmap\(true\)/,
 "Nenhum BitmapDrawable do Edu deve ser reamostrado com filtro bilinear");
assert.match(atlas,/EduPixelArtUpscale\.scale4x/,
 "Fallback de 128px preservado");
assert.match(atlas,/if\(!uniformFrame\)/);
assert.ok(!fs.existsSync(base+"EduSpriteGeometry512.java"),
 "Remover normalizador anisotrópico; não manter código de deformação morto");
assert.match(masters,/COUNT = 68/);
assert.match(atlas,/SIZES_PX=\{100,150,200\}/);
assert.match(svc,/eduIdleNextAt=now\+5800L/);
assert.match(svc,/now-eduLastInteractionAt<6500L/);
const notes=JSON.parse(fs.readFileSync("app/src/main/assets/release_notes.json","utf8"));
const current=notes.releases.find(x=>x.minVersionCode===54537);
assert.ok(current && current.title.includes("0.03.31"));
assert.match(JSON.stringify(current),/não constituem redesenho/,"Não superestimar QA visual");
console.log("LT332/LT333 PASS: 68 frames, 8 sequências, sem deformar 512, filtros nítidos, notas corretas");

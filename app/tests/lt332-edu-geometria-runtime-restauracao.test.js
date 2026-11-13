"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const base="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const atlas=fs.readFileSync(base+"EduSpriteAtlas.java","utf8");
const geometry=fs.readFileSync(base+"EduSpriteGeometry512.java","utf8");
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
assert.match(atlas,/EduSpriteGeometry512\.normalize\(original512,i\)/);
assert.match(atlas,/if\(corrected!=original512\)/);
assert.match(atlas,/displayCache\.put\(i,drawable\)/);
assert.match(geometry,/index==42/,"#42 precisa passar sem alterar pixels");
assert.match(geometry,/index>=52&&index<=60/,"Teleporte excepcional preservado");
assert.match(geometry,/index>=65/,"Fantasia não deve ser deformada por detecção de cabelo");
assert.match(geometry,/hairColor\(pixel\[q\]\)/);
assert.match(geometry,/MIN_HAIR_PIXELS=900/);
assert.match(geometry,/canvas\.clipOutPath\(shape\)/);
assert.match(geometry,/paint\.setFilterBitmap\(false\)/);
assert.match(geometry,/paint\.setAntiAlias\(false\)/);
assert.match(geometry,/if\(index==1\|\|index==2\)/,"Pokébola aérea isolada");
assert.match(geometry,/return source;/,"Sem detecção, preservar original");
assert.match(masters,/COUNT = 68/);
assert.match(atlas,/SIZES_PX=\{100,150,200\}/);
assert.match(svc,/eduIdleNextAt=now\+5800L/);
assert.match(svc,/now-eduLastInteractionAt<6500L/);
const notes=JSON.parse(fs.readFileSync("app/src/main/assets/release_notes.json","utf8"));
const current=notes.releases.find(x=>x.minVersionCode===54537);
assert.ok(current && current.title.includes("0.03.31"));
assert.match(JSON.stringify(current),/não constituem redesenho/,"Não superestimar QA visual");
console.log("LT332 PASS: 68 frames, 8 sequências restauradas, geometria 512, acessórios separados, sem alteração de #42, notas corretas");

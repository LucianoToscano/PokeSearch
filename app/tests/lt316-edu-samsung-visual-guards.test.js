"use strict";
// QA estático adicional: não substitui validação visual física no Samsung.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const src = fs.readFileSync("app/src/main/java/com/lucianotoscano/pokesearchoverlay/RaidDayAssistantOverlayService.java", "utf8");
const atlas = fs.readFileSync("app/src/main/java/com/lucianotoscano/pokesearchoverlay/EduSpriteAtlas.java", "utf8");
const fine = fs.readFileSync("app/src/main/java/com/lucianotoscano/pokesearchoverlay/EduSpriteManualRetouch.java", "utf8");
const agents = fs.readFileSync("AGENTS.md", "utf8");

const idle = src.match(/private static final String\[\] EDU_IDLE_ROTATION=\{([\s\S]*?)\};/);
assert.ok(idle, "Não retirar a lista ociosa do Edu");
const names = [...idle[1].matchAll(/"([^"]+)"/g)].map(match => match[1]);
assert.deepEqual(names, [
  "pokebola_gesto", "caminhada_frente", "caminhada_direita",
  "caminhada_esquerda", "edu_jogando", "edu_shiny",
  "edu_armadura_mewtwo", "edu_armadura_mewtwo_shiny"
], "Não sortear sprites de reides/eventos/ansiedade no idle");

const sequences = {
  pokebola_gesto: [0,1,2,3],
  caminhada_frente: [5,6,7,8],
  caminhada_direita: [24,25,26,27],
  caminhada_esquerda: [32,33,34,35],
  edu_jogando: [63,64],
  edu_shiny: [62],
  edu_armadura_mewtwo: [65],
  edu_armadura_mewtwo_shiny: [66]
};
const idleFrames = [42];
for (const [name, frames] of Object.entries(sequences)) {
  assert.ok(atlas.includes('case "' + name + '": return new int[]{' + frames.join(",") + '};'),
    "Sequência do atlas alterada: " + name);
  idleFrames.push(...frames);
}
assert.equal(idleFrames.length, 22, "Parado + 21 quadros = 22 poses ociosas");
assert.equal(new Set(idleFrames).size, 22, "Quadros ociosos não podem se repetir");
assert.ok(!idleFrames.includes(67), "Sombria nunca entra na rotação aleatória");
for (let i = 52; i <= 60; i++) {
  assert.ok(!idleFrames.includes(i), "Teleportes só com gatilho");
}
assert.match(src, /eduIdleNextAt=now\+5800L/, "Pausa entre sequências");
assert.match(src, /now-eduLastInteractionAt<6500L/, "Pausa após interação");
assert.match(src, /if\(!visible\)return eduIdleFrame\(now\)/,
  "Prioridade da conversa/tutoriais sobre o ciclo ocioso");

// Correção LT316: se a sprite Edu carrega, P/M/G deve funcionar mesmo
// quando RaidDayAvatarFrames (legado) estiver ausente.
assert.match(src, /if\(eduSprites!=null\)return EduSpriteAtlas\.SIZES_PX\[avatarSizeIndex\]/);
assert.match(src, /if\(avatarSprites!=null\)return RaidDayAvatarFrames\.SIZES_PX\[avatarSizeIndex\]/);
assert.match(src, /int art=eduAvatarArtSize\(\)/);
assert.match(src, /int artSize=eduAvatarArtSize\(\)/);
assert.match(atlas, /SIZES_PX=\{100,150,200\}/);
assert.match(src, /avatarSizeIndex=1/, "Tamanho inicial M");

// Regressão: 68 poses, apenas cinco retoques localizados, fallback LT315.
assert.match(atlas, /SHADOW_INDEX=67, COLLECTION_COUNT=TOTAL_COUNT\+1/);
assert.match(atlas, /if\(uniformFrame&&correctedAtlas\)/);
assert.match(atlas, /EduSpriteManualRetouch\.apply\(crop,i\)/);
assert.match(atlas, /if\(!uniformFrame\)/);
assert.match(fine, /i==20\|\|i==28\|\|i==30\|\|i==36\|\|i==49/);
assert.match(fine, /paint\.setFilterBitmap\(false\)/);
assert.match(fine, /canvas\.clipOutPath\(path\)/);
// Since LT322, AGENTS puts the verified current release first and keeps LT320
// explicitly historical. Never parse the historical LT320 as today's baseline.
const documented=agents.match(/ESTADO OFICIAL VERIFICADO EM \d{2}\/\d{2}\/\d{4}:\*\* LT(\d+)/)||
 agents.match(/BASE OFICIAL ATUAL: LT(\d+)/);
assert.ok(documented&&Number(documented[1])>=318,
  "A continuidade não deve rebaixar a base oficial LT318 ou superior");
assert.ok(!agents.startsWith("BASE OFICIAL ATUAL: LT320"),
  "A antiga LT320 não pode reaparecer como release atual");
console.log("LT316 PASS: idle 22 poses, Sombria/teleporte sob gatilho, P/M/G, fallback e retoques.");

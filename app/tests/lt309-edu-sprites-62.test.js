"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const base=path.join(__dirname,"../src/main");
const asset=fs.readFileSync(path.join(base,"assets/edu_avatar_atlas_62.png"));
const java=fs.readFileSync(path.join(base,"java/com/lucianotoscano/pokesearchoverlay/EduSpriteAtlas.java"),"utf8");
const overlay=fs.readFileSync(path.join(base,"java/com/lucianotoscano/pokesearchoverlay/RaidDayAssistantOverlayService.java"),"utf8");
const old=fs.readFileSync(path.join(base,"java/com/lucianotoscano/pokesearchoverlay/RaidDayAvatarFrames.java"),"utf8");
assert.equal(asset.subarray(0,8).toString("hex"),"89504e470d0a1a0a");
assert.equal(asset.readUInt32BE(16),2048);
assert.equal(asset.readUInt32BE(20),2048);
assert.equal(asset[25],6,"Atlas Edu deve ser PNG RGBA");
assert.equal(crypto.createHash("sha256").update(asset).digest("hex"),
    "0737ac6a7c8e8164c0b702093fa4e0672714d06d5da8668dd467ae610a4ad65f");
assert.match(java,/CELL=256, COLS=8, COUNT=62/);
assert.match(java,/SIZES_PX=\{50,75,100\}/);
assert.match(java,/options\.inScaled=false/);
assert.match(java,/drawable\.setFilterBitmap\(false\)/);
assert.match(java,/drawable\.setAntiAlias\(false\)/);
for(const [name,indexes] of Object.entries({
    caminhada_frente:[5,6,7,8],
    caminhada_direita:[24,25,26,27],
    caminhada_esquerda:[32,33,34,35],
    arrastando:[9,10,11,12,13,14,15,16,17,18],
    teleporte_efeito:[52,53,54,55,56,57,58,59,60],
    pokebola_gesto:[0,1,2,3]
})){
    const arr=indexes.join(",");
    assert.ok(java.includes('case "'+name+'": return new int[]{'+arr+'}'),name);
}
for(const name of [
    "parado","apresentacao","perguntando","alerta","confirmando",
    "guardar_passe_vespera","sem_passe_disponivel","passe_extra_confirmado",
    "softban_aviso","esperando_carregamento_1","esperando_batalha_reide",
    "reide_perdida","reide_abandonada","pokemon_fugiu",
    "fechar_reabrir_jogo","repetir_ciclo","evento_nao_comecou",
    "evento_comecou","evento_encerrou","ir_local_evento_escolhido",
    "resumo_concluido","arrastado_final"
])assert.ok(java.includes('"'+name+'"'),"Estado "+name);
assert.match(overlay,/eduSprites=EduSpriteAtlas\.load\(this\)/);
assert.match(overlay,/catch\(Exception invalidAtlas\)\{eduSprites=null;\}/);
assert.match(overlay,/avatarSprites=RaidDayAvatarFrames\.load\(this\)/);
assert.match(overlay,/EduSpriteAtlas\.sequence\("arrastando"\)/);
assert.match(overlay,/playEduAnimation\("teleporte_efeito"\)/);
assert.match(overlay,/playEduAnimation\("caminhada_direita"\)/);
assert.match(overlay,/playEduAnimation\("caminhada_esquerda"\)/);
assert.match(overlay,/playEduAnimation\("caminhada_frente"\)/);
assert.match(overlay,/reactEdu\("reide_perdida"\)/);
assert.match(overlay,/reactEdu\("reide_abandonada"\)/);
assert.match(overlay,/reactEdu\("pokemon_fugiu"\)/);
assert.match(overlay,/reactEdu\("arrastado_final"\)/);
assert.match(overlay,/reactEdu\("sem_passe_disponivel"\)/);
assert.match(overlay,/return "evento_nao_comecou"/);
assert.match(overlay,/return "evento_comecou"/);
assert.match(overlay,/return "ir_local_evento_escolhido"/);
assert.match(overlay,/if\(eduSprites!=null\)\{eduSprites\.release\(\);eduSprites=null;\}/);
assert.match(old,/CELL=64, COLS=6, COUNT=12/,"Fallback LT304 intacto");
assert.doesNotMatch(overlay,/startActivity\(new Intent\([^)]*Teleporte/i,
    "Sprite não move GPS");
console.log("LT309 EDU: atlas 62 PNG RGBA, seis sequências, gatilhos, fallback, P/M/G OK");

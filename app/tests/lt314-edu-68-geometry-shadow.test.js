"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const root=path.join(__dirname,"../src/main");
const java=n=>fs.readFileSync(path.join(root,"java/com/lucianotoscano/pokesearchoverlay",n),"utf8");
const atlas=java("EduSpriteAtlas.java");
const geometry=java("EduSpriteGeometry.java");
const service=java("RaidDayAssistantOverlayService.java");
const shadowB64=fs.readFileSync(path.join(root,"assets/edu_sombria_68.b64"),"utf8").trim();
const shadow=Buffer.from(shadowB64,"base64");
assert(shadow.length>2000&&shadow.length<12000,"Sprite Sombria otimizada");
assert.equal(shadow.subarray(0,8).toString("hex"),"89504e470d0a1a0a","PNG válido");
assert.equal(shadow.readUInt32BE(16),128,"Largura 128px");
assert.equal(shadow.readUInt32BE(20),128,"Altura 128px");
assert.equal(crypto.createHash("sha256").update(shadow).digest("hex"),
  "fe3f7a29464148e8e1e032c6770aefa542b7a70caf7a1fe6264254a2d0b5ca3c",
  "Sprite Sombria idêntica ao PNG revisado");
assert(atlas.includes("CELL=128, COLS=8, COUNT=62"),"Preserva 62 originais");
assert(atlas.includes("TOTAL_COUNT=COUNT+EXTRA_COUNT"),"Preserva extras 62–66");
assert(atlas.includes("SHADOW_INDEX=67, COLLECTION_COUNT=TOTAL_COUNT+1"),"68ª sprite");
assert(atlas.includes('SHADOW_ASSET="edu_sombria_68.b64"'));
assert(atlas.includes('case "edu_sombria": case "ansioso": return SHADOW_INDEX;'));
assert(atlas.includes("BitmapFactory.decodeByteArray(raw,0,raw.length,noScale)"));
assert(atlas.includes("if(uniform==null&&i==SHADOW_INDEX&&shadowSprite==null)"),"Fallback Sombria");
assert(atlas.includes("if(!uniformFrame){")&&atlas.includes("EduSpriteGeometry.stabilize(crop,i,replacement)"),"Todas as imagens verificadas no carregamento");
assert(atlas.includes("BitmapDrawable[] cache=new BitmapDrawable[COLLECTION_COUNT]"),"Cache 68 sem trabalho a cada tick");
assert(atlas.includes("drawable.setFilterBitmap(false)"));
assert(atlas.includes("drawable.setAntiAlias(false)"));
assert(atlas.includes("shadowSprite.recycle()"));
assert(atlas.includes('CONSISTENT_IDLE_ASSET="edu_avatar_idle_consistent_22.webp"'));
for(const [state,index] of [
 ["edu_shiny",62],["edu_jogando_01",63],["edu_jogando_02",64],
 ["edu_armadura_mewtwo",65],["edu_armadura_mewtwo_shiny",66]])
 assert(atlas.includes('case "'+state+'": return '+index+';'),"Índice antigo intacto "+state);
assert(geometry.includes("FACE_ANCHOR_X=64"),"Âncora do rosto estável");
assert(geometry.includes("FEET_ANCHOR_Y=119"),"Pés estáveis");
assert(geometry.includes("BODY_REFERENCE_HEIGHT=112"),"Altura de referência");
assert(geometry.includes("if(index>=52&&index<=60)return original"),
  "Efeitos teleporte preservados sem ampliação");
assert(geometry.includes("if(!consistent)"),"Não redimensionar as 22 sprites já unificadas");
assert(geometry.includes("int alpha=(pixel>>>24)&255"));
assert(geometry.includes("faceCount>=24?faceX/faceCount"),"Usar rosto, não acessórios");
assert(geometry.includes("dx=Math.round(dx)"),"Deslocamento em pixels inteiros");
assert(geometry.includes("dy=Math.round(dy)"));
assert(geometry.includes("pixelPaint.setFilterBitmap(false)"));
assert(geometry.includes("original.recycle()"),"Descartar cópia após processamento");
assert(geometry.includes("Bitmap result=Bitmap.createBitmap(CELL,CELL"),"Mesma célula e transparência");
assert(service.includes('return "edu_sombria";'),"Ansiedade ativa Sombria");
for(const state of ["event_wait","event_pass_wait","travel_wait","kiribati_wait","nz_retry_check_wait"])
 assert(service.includes('"'+state+'".equals(eduDialogueState)'),"Estado ansioso "+state);
assert(service.includes('private static final String[] EDU_IDLE_ROTATION'),"Idle existente intacto");
assert(!service.match(/EDU_IDLE_ROTATION=\{[^}]*edu_sombria/s),"Sombria não é exibida ociosamente");
const old=fs.readFileSync(path.join(root,"assets/edu_avatar_atlas_62.webp"));
assert.equal(crypto.createHash("sha256").update(old).digest("hex"),
 "5c81ba10976328ab479bf1d04d9082203cb8c5f45ee403f23265b05f6947942f",
 "Atlas original das 62 sprites preservado");
console.log("LT314 QA PASS — 68 sprites, Sombria, centro do rosto, pés e pixel-art sem interpolação");

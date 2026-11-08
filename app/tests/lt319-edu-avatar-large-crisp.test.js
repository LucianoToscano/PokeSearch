"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const root="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const edu=fs.readFileSync(root+"EduSpriteAtlas.java","utf8");
const legacy=fs.readFileSync(root+"RaidDayAvatarFrames.java","utf8");
const service=fs.readFileSync(root+"RaidDayAssistantOverlayService.java","utf8");
const retouch=fs.readFileSync(root+"EduSpriteManualRetouch.java","utf8");

// Os 68 quadros continuam os mesmos: mudar a exibição não redesenha olhos,
// óculos, cabelo ou os detalhes dos acessórios das poses.
assert.match(edu,/CELL=128, COLS=8, COUNT=62/);
assert.match(edu,/SHADOW_INDEX=67, COLLECTION_COUNT=TOTAL_COUNT\+1/);
assert.match(edu,/SIZES_PX=\{100,150,200\}/);
assert.match(legacy,/SIZES_PX=\{100,150,200\}/);
assert.match(service,/avatarSizeIndex=1,avatarAnimationTick=0/,
  "M=150 deve ser o tamanho inicial");
assert.match(service,/int savedAvatarSize=prefs\.getInt\(RaidDayAvatarFrames\.PREF_SIZE,-1\)/);
assert.match(service,/if\(!prefs\.getBoolean\(sizeMigration,false\)\)/);
assert.match(service,/savedAvatarSize==50\?100:\s*savedAvatarSize==75\?150:savedAvatarSize==100\?200:150/,
  "As categorias antigas P/M/G migram corretamente e ausência usa M");
assert.match(service,/putBoolean\(sizeMigration,true\)\.apply\(\)/);
assert.match(service,/avatarSizeIndex=savedAvatarSize==100\?0:savedAvatarSize==200\?2:1/);
assert.match(service,/EduSpriteAtlas\.SIZES_PX\[avatarSizeIndex\]/);
assert.match(service,/RaidDayAvatarFrames\.SIZES_PX\[avatarSizeIndex\]/);
assert.match(service,/RaidDayAvatarFrames\.SIZES_PX\[i\]\+" pixels"/,
  "Acessibilidade deve informar o novo tamanho real");
// Sem resize das células originais, evitar blur no rosto e nos olhos.
assert.match(edu,/options\.inScaled=false/);
assert.match(edu,/noScale\.inScaled=false/);
assert.match(edu,/drawable\.setFilterBitmap\(false\)/);
assert.match(edu,/drawable\.setAntiAlias\(false\)/);
assert.match(edu,/drawable\.setDither\(false\)/);
assert.match(legacy,/drawable\.setFilterBitmap\(false\)/);
assert.match(legacy,/drawable\.setAntiAlias\(false\)/);
assert.match(legacy,/drawable\.setDither\(false\)/);
assert.match(service,/avatarView\.setLayerType\(View\.LAYER_TYPE_SOFTWARE,null\)/);
assert.match(service,/avatarView\.setScaleType\(ImageView\.ScaleType\.FIT_CENTER\)/);
assert.match(service,/Math\.max\(dp\(BUBBLE_DP\),artSize\+dp\(6\)\)/);
assert.match(service,/Math\.max\(dp\(BUBBLE_DP\),art\+dp\(6\)\)/);
assert.match(retouch,/i==20\|\|i==28\|\|i==30\|\|i==36\|\|i==49/);
assert.match(retouch,/paint\.setFilterBitmap\(false\)/);
console.log("LT319 PASS: P100 M150 G200, M padrão, migração e pixel art sem filtro");

"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const dir="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const atlas=fs.readFileSync(dir+"EduSpriteAtlas.java","utf8");
const clock=fs.readFileSync(dir+"EduClockSettingsActivity.java","utf8");
const service=fs.readFileSync(dir+"RaidDayAssistantOverlayService.java","utf8");
const moments=fs.readFileSync(dir+"EduEventMomentPresets.java","utf8");

// O atlas publicado continua 128px, mas cada quadro em exibição pode
// receber amostragem 512px em RAM, sem aumentar a Release ou apagar o original.
assert.match(atlas,/CELL=128, COLS=8, COUNT=62/);
assert.match(atlas,/COLLECTION_COUNT=TOTAL_COUNT\+1/);
assert.match(atlas,/DISPLAY_SOURCE_PX=512/);
assert.match(atlas,/new LruCache<>\(8\)/);
assert.match(atlas,/Bitmap\.createScaledBitmap\(cache\[i\]\.getBitmap\(\),\s*DISPLAY_SOURCE_PX,DISPLAY_SOURCE_PX,false\)/);
assert.match(atlas,/drawable\.setFilterBitmap\(true\)/);
assert.match(atlas,/catch\(OutOfMemoryError memory\)/);
assert.match(atlas,/return cache\[i\]/);
assert.match(atlas,/displayCache\.evictAll\(\)/);
assert.match(atlas,/UNIFORM_ASSET="edu_avatar_uniform_68.webp"/);
assert.match(atlas,/CORRECTED_UNIFORM_ASSET="edu_avatar_uniform_68_lt316.b64"/);

// Momentos rápidos na mesma tela, não em um segundo menu/modal.
// Os 17 offsets internos continuam preservados para projetos e testes legados.
const list=clock.match(/private static final String\[\] QUICK_MOMENTS=\{([\s\S]+?)\};/);
assert.ok(list,"Momento do evento não existe");
const chosen=[...list[1].matchAll(/"([^"]+)"/g)].map(m=>m[1]);
assert.deepEqual(chosen,[
  "Faltam 24 horas","Falta 1 hora","10 minutos antes",
  "10 segundos antes","Início do evento","2 horas após o início",
  "10 minutos antes do fim","10 minutos depois do fim"
]);
assert.equal((moments.match(/add\(result,/g)||[]).length,17);
assert.match(clock,/addQuickMomentGrid\(mainCard\)/);
assert.match(clock,/int i=line\*2\+column/);
assert.match(clock,/chooseQuickMoment\(i\)/);
assert.doesNotMatch(clock,/new AlertDialog\.Builder\(this\)\s*\.setTitle\("Momento do evento"\)/);

// Tamanho e transparência no mesmo painel, com persistência e sincronização
// imediata ao overlay. A transparência jamais se aplica à fonte do texto.
assert.match(clock,/addSizeSelector\(appearance\)/);
assert.match(clock,/addBalloonAlphaSlider\(appearance\)/);
assert.match(clock,/String\[\] labels=\{"P · 100","M · 150","G · 200"\}/);
assert.match(clock,/getSharedPreferences\("raid_assistant_overlay",MODE_PRIVATE\)/);
assert.match(clock,/final int\[\] sizes=\{100,150,200\}/);
assert.match(clock,/SeekBar\.OnSeekBarChangeListener/);
assert.match(clock,/balloonAlpha\.setMin\(0\)/);
assert.match(clock,/balloonAlpha\.setMax\(60\)/);
assert.match(clock,/100-value\)\.apply\(\)/,
  "Maior transparência deve significar menos opacidade no fundo");
assert.match(clock,/PREF_BUBBLE_OPACITY/);
assert.match(service,/static final String PREF_BUBBLE_OPACITY="edu_speech_opacity_percent"/);
assert.match(service,/registerOnSharedPreferenceChangeListener\(visualSettingsListener\)/);
assert.match(service,/unregisterOnSharedPreferenceChangeListener/);
assert.match(service,/applyBubbleTransparency\(\)/);
assert.match(service,/eduSpeechBackground\.setAlpha\(Math\.round\(value\*2\.55f\)\)/);
assert.match(service,/panelParams\.alpha=1f/);
assert.match(service,/avatarSizeIndex=savedAvatarSize==100\?0:savedAvatarSize==200\?2:1/);
assert.match(service,/updateAvatarSize\(\)/);

assert.doesNotMatch(clock,/Settings\.Global|Settings\.Secure|LocationManager/);
console.log("LT320 PASS: amostragem 512 limitada, 8 momentos inline, tamanho e slider do balão");

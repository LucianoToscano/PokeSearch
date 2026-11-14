"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const dir="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const atlas=fs.readFileSync(dir+"EduSpriteAtlas.java","utf8");
const pose=fs.readFileSync(dir+"EduSpritePoseComposer.java","utf8");
const inspector=fs.readFileSync(dir+"EduSpriteInspector.java","utf8");
const guides=fs.readFileSync(dir+"EduSpriteGuideView.java","utf8");
const metrics=fs.readFileSync(dir+"EduSpriteMeasurements.java","utf8");
const service=fs.readFileSync(dir+"RaidDayAssistantOverlayService.java","utf8");
const masters=fs.readFileSync(dir+"EduSpriteMasters.java","utf8");

assert.match(pose,/canonical\.copy\(Bitmap\.Config\.ARGB_8888,true\)/);
assert.match(pose,/drawPokeball\(canvas,p,index\)/);
assert.match(pose,/drawPhone\(canvas,p,index\)/);
assert.match(pose,/drawPhone\(Canvas c,Paint p,int frame\)/);
assert.match(pose,/frame==63\?0:8/);
assert.match(pose,/PorterDuff\.Mode\.CLEAR/);
assert.match(pose,/path\.close\(\)/);
assert.doesNotMatch(pose,/gestureRight[(]|armEraseRight[(]|ARM_SCALE=|createScaledBitmap[(]/);
assert.match(pose,/setAntiAlias\(false\)/);
assert.match(pose,/setFilterBitmap\(false\)/);
assert.match(atlas,/EduSpritePoseComposer\.supports\(i\)/);
assert.match(atlas,/Bitmap reference=masters\.frame\(42\)/);
assert.match(atlas,/EduSpritePoseComposer\.compose\(reference,i\)/);
assert.match(masters,/COUNT = 68/);
assert.match(atlas,/COLLECTION_COUNT=TOTAL_COUNT\+1/);
assert.match(atlas,/SIZES_PX=\{100,150,200\}/);
assert.match(atlas,/drawable\.setFilterBitmap\(false\)/);
assert.match(atlas,/drawable\.setAntiAlias\(false\)/);

// Controles INDEPENDENTES da sprite (WindowManager distinto) + 68 índices.
assert.match(inspector,/new WindowManager\.LayoutParams/);
assert.match(inspector,/TYPE_APPLICATION_OVERLAY/);
assert.match(inspector,/private void ensureToolbar\(\)/);
assert.match(inspector,/String\[\] icons=\{"◀️","⏯️","🎦","▶️","👬","📐","❌"\}/);
assert.match(inspector,/togglePlayback\(\)/);
assert.match(inspector,/showGroupChoices\(\)/);
assert.match(inspector,/toggleGuides\(\)/);
assert.match(inspector,/EduSpriteAtlas\.COLLECTION_COUNT/);
assert.match(inspector,/DEFAULT_FRAME=42/);
assert.match(inspector,/listener\.selected\(selectedIndex\)/);
assert.match(inspector,/listener\.comparing\(showComparison\)/);
assert.match(inspector,/indexLabel\.setOnClickListener\(v->\{stopReview\(\);updateLabel\(\);\}\)/);
assert.match(inspector,/atlas\.frame\(42\)/);
assert.match(inspector,/atlas\.frame\(selectedIndex\)/);
// LT336: retirar métricas heurísticas enganosas do painel, preservar inspeção lado a lado.
assert.doesNotMatch(inspector,/EduSpriteMeasurements\.compare\(reference,chosen\)/);
assert.doesNotMatch(inspector,/measurements\.setText\(/);
assert.match(inspector,/int above=lastBubbleY-comparisonParams.height-gap/);
assert.match(inspector,/FLAG_NOT_TOUCHABLE/);
assert.match(inspector,/getBoolean\(PREF_CONTROLS,true\)/);
assert.match(inspector,/getBoolean\(PREF_GUIDES,false\)/);
assert.match(inspector,/prefs\.edit\(\)\.putBoolean\(PREF_GUIDES,enabled\)/);
assert.match(inspector,/prefs\.edit\(\)\.putBoolean\(PREF_CONTROLS,enabled\)/);

// Guias seguem sempre as mesmas coordenadas da #42, não alteram bitmap.
assert.match(guides,/CELL=512f/);
for(const token of ["256","41","185","342","476","149.5f","362.5f"])
 assert.ok(guides.includes(token),"Marcador essencial "+token);
assert.match(guides,/void setEnabledGuides\(boolean enabled\)/);
assert.doesNotMatch(guides,/setPixels\(|drawBitmap\(/);

// Medidas informativas; não impõem geometria onde efeitos/roupas mudam.
assert.match(metrics,/static String compare\(Drawable standard,Drawable candidate\)/);
for(const property of ["head","glasses","hands","feet","height"])
 assert.match(metrics,new RegExp("test\\."+property));
assert.match(metrics,/String\.format\(Locale\.ROOT/);

// Segurança de ciclo de vida / screenshot / toque e seleção manual.
assert.match(service,/new EduSpriteInspector\(this,wm,eduSprites,prefs/);
assert.match(service,/if\(eduReviewActive\)return eduReviewIndex;/);
assert.match(service,/if\(!eduReviewComparison\)/);
assert.match(service,/eduInspector\.sync\(bubbleParams,eduAvatarArtSize\(\)\)/);
assert.match(service,/eduInspector\.sync\(bubbleParams,art\)/);
assert.match(service,/eduInspector\.stopReview\(\)/);
assert.match(service,/eduInspector\.destroy\(\)/);
assert.match(service,/eduInspector\.setOverlayVisible\(false\)/);
assert.match(service,/eduInspector\.setOverlayVisible\(true\)/);
assert.match(service,/eduReviewGuides\.setEnabledGuides\(enabled\)/);
assert.match(service,/new FrameLayout\.LayoutParams\(\s*artSize,artSize,Gravity.CENTER\)/);
assert.match(service,/!eduReviewActive&&eduFirstBubbleMode/);
const cycles=service.match(/private static final String\[\] EDU_IDLE_ROTATION=\{([\s\S]*?)\};/);
assert.ok(cycles);
const names=[...cycles[1].matchAll(/"([^"]+)"/g)].map(x=>x[1]);
assert.deepEqual(names,[
 "pokebola_gesto","caminhada_frente","caminhada_direita",
 "caminhada_esquerda","edu_jogando","edu_shiny",
 "edu_armadura_mewtwo","edu_armadura_mewtwo_shiny"
]);
const notes=JSON.parse(fs.readFileSync("app/src/main/assets/release_notes.json","utf8"));
assert.ok(notes.releases.some(x=>x.minVersionCode===54540 && x.title.includes("0.03.34")));
console.log("LT335 PASS: braços sem corte, celular #42, revisão 68, #42 lado a lado, guias e lifecycle");

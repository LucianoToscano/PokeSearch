"use strict";
// Fluxo de UI e motor PGS sem APK; testes físicos Samsung continuam obrigatórios.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const root="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const read=name=>fs.readFileSync(root+name+".java","utf8");
const engine=read("PgsAutoClickService"),menu=read("PgsAutoMenus");
const home=read("PgsBuscasPanel"),map=read("PgsAutoMapReadiness");
const policy=read("PgsAutoCyclePolicy"),models=read("PgsAutoTemplateStore");
const shiny=read("PgsAutoShinySignal");

// Selecionar Lucario na Home realmente inicia o cadastro quando o feed aparecer.
assert.match(home,/PgsAutoClickService\.requestTeaching\(s\.name\)/);
assert.match(engine,/public static void requestTeaching\(String species\)/);
assert.match(engine,/queueTeachingWhenReady\(\)/);
assert.match(engine,/event\.getEventType\(\)==AccessibilityEvent\.TYPE_WINDOW_STATE_CHANGED/);
assert.match(engine,/if\(!isGameVisible\(\)\)\{queueTeachingWhenReady\(\);return;\}/);
assert.match(engine,/quickMenus\.dismissAll\(\)/);
assert.match(engine,/bubble\.setVisibility\(View\.INVISIBLE\)/);
assert.match(engine,/takeScreenshot\(/);
assert.match(engine,/PgsAutoTemplateStore\.saveSample\(this,name,model\)/);
assert.match(engine,/PgsAutoTemplateStore\.clearTeaching\(this\)/);
assert.match(engine,/boolean loaded=reloadDetector\(\)/);
assert.match(engine,/teachingInProgress/);
assert.match(menu,/actions\.teach\(pokemon\.name\)/);
assert.match(models,/static synchronized void saveSample\(/);

// Regras visíveis e não redundantes.
assert.match(menu,/String\[\] keys=\{"load_timeout","post_load"\}/);
assert.match(home,/final String\[\] keys=\{"load_timeout","post_load"\}/);
assert.doesNotMatch(menu,/String\[\] keys=\{"post_load","load_timeout","first_empty"/);
assert.doesNotMatch(menu,/CheckBox loop=/);
assert.doesNotMatch(home,/Switch repeat=/);
assert.doesNotMatch(menu,/Reiniciar buscas/);
assert.doesNotMatch(home,/Button restart=button\(a,"Reiniciar buscas"\)/);
assert.match(engine,/PgsAutoClickService\.cyclePrefs|static SharedPreferences cyclePrefs/);
assert.match(engine,/cycle_60_2_migrated/);

// Lógica: após cada toque, watchdog 60s; cena pronta deve ter sinais de
// PokéStops/ginásios, e após 2s o próximo alvo é automático.
assert.match(engine,/PgsAutoCyclePolicy\.mapTimedOut\(now,clickedAt,maxSeconds\)/);
assert.match(engine,/PgsAutoCyclePolicy\.readyToAdvance\(when,sceneReadyAt,minSeconds\)/);
assert.match(engine,/maxSeconds\*1000L/);
assert.match(engine,/PgsAutoCyclePolicy\.EMPTY_FEED_RETRY_SECONDS\*1000L/);
assert.match(engine,/if\(nextIndex>=limit\)/);
assert.match(engine,/scanAndTap\(\)/);
assert.doesNotMatch(engine,/getBoolean\("repeat",true\)/);
assert.match(map,/active>=2 && \(magenta>\.005f\|\|blue>\.0025f\)/);
assert.doesNotMatch(map,/texture>\.21f/);

// Não atribuir shiny à espécie errada nem confundir aviso genérico com prova.
assert.match(engine,/PgsAutoCyclePolicy\.shouldPauseForTarget\(/);
assert.match(policy,/PgsAutoShinySignal\.isPositive\(notification\)/);
assert.match(policy,/return \(" "\+norm\+" "\)\.contains\(" "\+species\+" "\)/);
assert.match(shiny,/shiny found/);
console.log("LT339 PGS ciclo/cadastro: contrato de fonte PASS (sem homologação Android)");

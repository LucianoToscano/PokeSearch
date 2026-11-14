"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs");
const root="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const read=x=>fs.readFileSync(root+x+".java","utf8");
const main=read("MainActivity"),engine=read("PgsAutoClickService"),
 menu=read("PgsAutoMenus"),store=read("PgsAutoTemplateStore"),
 catalog=read("PgsAutoCatalog"),detector=read("PgsAutoIconDetector"),
 shiny=read("PgsAutoShinyListener"),
 manifest=fs.readFileSync("app/src/main/AndroidManifest.xml","utf8");
assert.match(main,/v->toggleHomePgsOverlay\(\)/);
assert.doesNotMatch(main,/PgsBuscasPanel\.show\(this\)/);
assert.match(main,/PgsAutoClickService\.isOverlayVisible\(\)/);
assert.match(engine,/isOverlayVisible\(\)/);
assert.match(engine,/TYPE_WINDOWS_CHANGED/);
assert.match(engine,/pkg\.equals\(getPackageName\(\)\)/);
assert.match(engine,/takeScreenshot\(/);
assert.match(engine,/dispatchGesture\(/);
assert.match(engine,/gestureTicket/);
assert.match(engine,/toggle\(\);/);
assert.match(engine,/PgsAutoTemplateStore\.saveSample\(this,name,model,refWidth,refHeight\)/);
assert.match(store,/referenceWidth/);
assert.match(store,/referenceHeight/);
assert.match(store,/optInt\("referenceWidth",WIDTH\)/);
assert.match(store,/refWidth,refHeight/);
assert.match(catalog,/MAX_SELECTED=10/);
assert.match(store,/model\.referenceWidth/); // metadata used by store decode
assert.match(menu,/imagesFor\(PgsAutoCatalog\.Pokemon p\)/);
assert.match(menu,/showModelActions\(/);
assert.match(menu,/PgsAutoTemplateStore\.delete\(context,model\.id\)/);
assert.match(menu,/PgsAutoCatalog\.move\(context,pokemon\.number,-1\)/);
assert.match(menu,/PgsAutoCatalog\.move\(context,pokemon\.number,1\)/);
assert.match(menu,/actions\.teach\(pokemon\.name\)/);
assert.match(menu,/PgsAutoNotificationPolicy\.SHINY/);
assert.match(menu,/R\.drawable\.pgs_speaker_silent/);
assert.match(menu,/mount\(root,138,218\)/);
assert.doesNotMatch(menu,/••• MAIS|private void report\(|private void donate\(/);
assert.match(engine,/PgsAutoCyclePolicy\.mapTimedOut/);
assert.match(engine,/PgsAutoCyclePolicy\.readyToAdvance/);
assert.match(engine,/PgsAutoCyclePolicy\.shouldPauseForTarget/);
assert.match(engine,/PgsAutoMapReadiness\.analyze/);
assert.match(engine,/R\.drawable\.busca_pokemon_on/);
assert.match(engine,/R\.drawable\.busca_pokemon_off/);
assert.match(shiny,/NotificationListenerService/);
assert.match(shiny,/PgsAutoShinySignal\.isPositive\(content\)/);
assert.match(manifest,/android:name="\.PgsAutoClickService"/);
assert.match(manifest,/android:name="\.PgsAutoShinyListener"/);
console.log("LT340 PGS: Home direto, modelos, prioridade, gestos, menus PASS (Android físico pendente)");

"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const root="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const read=n=>fs.readFileSync(root+n+".java","utf8");
const menu=read("PgsAutoMenus"),svc=read("PgsAutoClickService"),
  prefs=read("PgsSmartSearchSettings"),store=read("PgsAutoTemplateStore"),
  detector=read("PgsAutoIconDetector"),host=read("PgsAutoHostPolicy"),
  probe=read("PgsAutoHostProbePolicy"),shiny=read("PgsAutoShinyListener");
// Three goals, no claim of a native PaC/PaS API.
for(const name of ["GOAL_SHINY","GOAL_CATCH","GOAL_BOTH",
  "SCOPE_ALL","SCOPE_FAVORITES","GESTURES","SMART_REPEAT"])
  assert.ok(prefs.includes(name),"missing "+name);
assert.match(prefs,/getBoolean\(GESTURES,false\)/);
assert.match(prefs,/pgs_smart_central_/);
assert.match(menu,/OBJETIVO DA BUSCA/);
assert.match(menu,/Procurar Shiny/);
assert.match(menu,/Auxiliar encontros/);
assert.match(menu,/Procurar \+ auxiliar/);
assert.match(menu,/Captura, bolas e frutas continuam manuais/);
assert.match(menu,/Sem arremesso automático e sem capturas presumidas/);
assert.match(menu,/actions\.startSmartSearch\(goal\)/);
assert.match(menu,/PgsAutoShinyListener\.hasAccess\(context\)/);
assert.match(shiny,/isNotificationListenerAccessGranted/);
assert.match(svc,/smartGoalSession=PgsSmartSearchSettings\.normalizedGoal\(goal\)/);
assert.match(svc,/smartGoalSession=null/);
assert.match(svc,/ENCONTRO VISÍVEL · CAPTURA MANUAL/);
assert.match(svc,/Capture manualmente; resultado ainda não verificado/);
assert.match(svc,/!PgsSmartSearchSettings\.repeat\(this\)/);
// All available means only real, enabled, client-matching image models.
assert.match(store,/activeForSearch\(Context c\)/);
assert.match(store,/activeForProfile\(Context c,String host,boolean all\)/);
assert.match(store,/PgsAutoCatalog\.MAX_SELECTED/);
assert.match(detector,/PgsAutoTemplateStore\.activeForProfile/);
assert.match(menu,/Modelos disponíveis nesta busca/);
assert.match(menu,/Disponíveis \(até 10\)/);
assert.match(menu,/Sem miniaturas de feed válidas/);
// Provider auto-detection is visual, never manager app presence.
assert.match(menu,/actions\.autoDetectHost\(\)/);
assert.match(menu,/Interface incorreta\? Selecionar manualmente/);
assert.match(probe,/pgsharpStable==pokemodStable/);
assert.match(svc,/stableHostMatch\(firstPg,secondPg/);
assert.match(svc,/stableHostMatch\(firstPm,secondPm/);
assert.match(svc,/PgsAutoHostProbePolicy\.choose/);
assert.match(svc,/PgsAutoWatchPolicy\.sameSprite\(/);
assert.doesNotMatch(svc.split("private void probeActiveFeedHost()")[1]
    .split("private void scanAndTap()")[0],/pokemodManagerInstalled|dispatchGesture/);
assert.match(host,/OTHER="other"/);
assert.match(menu,/private void appendCentralSequence\(LinearLayout root\)/);
assert.match(menu,/mount\(root,240,385\)/);
assert.match(menu,/root\.addView\(content,margined\(-1,/);
assert.doesNotMatch(svc,/Runtime\.getRuntime\(\)\.exec|forceStopPackage/);
console.log("LT370: PGTools-inspired goals, bounded models, visual host proof, manual-capture honesty PASS");
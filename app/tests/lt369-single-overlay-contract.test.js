"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict");
const root="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const menu=fs.readFileSync(root+"PgsAutoMenus.java","utf8");
const service=fs.readFileSync(root+"PgsAutoClickService.java","utf8");
const style=fs.readFileSync(root+"PgsAutoMenuStyle.java","utf8");
const start=menu.split("void toggle(int x,int y)")[1].split("void dismissAll()")[0];
const central=menu.split("private void showCentral(int selectedTab)")[1].split("private void appendCentralPokemon")[0];
const settings=menu.split("private void appendCentralSettings(LinearLayout root)")[1].split("private boolean hasCentralSprite()")[0];
const actions=menu.split("private void appendCentralActions(LinearLayout root)")[1].split("private void appendCentralSettings(LinearLayout root)")[0];
// One tap on the hand gives one panel directly, never legacy five-tile toolbar.
// LT409: default to one compact choice screen, not the long Pokémon list.
assert.match(start,/showCentral\(1\)/);
assert.match(start,/showAdvancedActions=false/);
assert.match(start,/searchDetailsExpanded=false/);
assert.doesNotMatch(start,/showToolbar\(/);
assert.match(start,/if\(isOpen\(\)\)/);
assert.match(central,/String\[\] names=\{"Pokémon","Ação","Ajustes"\}/);
assert.match(central,/mount\(root,240,385\)/);
assert.match(menu,/LT369: popup no lado do próprio ícone de mão/);
assert.ok(menu.includes("LT370: automatic recognition is an optional two-frame visual probe"));
const pokemon=menu.split("private void appendCentralPokemon(LinearLayout root)")[1].split("private void appendCentralActions")[0];
assert.match(pokemon,/PgsAutoHostSettings\.select\(context,profile\)/);
assert.match(pokemon,/PgsAutoHostSettings\.setSidebarSide/);
assert.doesNotMatch(pokemon,/showHostProfiles\(\)/);
assert.match(menu,/if\(panel==opened\)reanchor\(anchorX,anchorY\)/);
// Keep same bubble single-tap retract and long press for menu.
assert.match(service,/quickMenus\.collapseOneLevel\(\)/);
assert.match(service,/quickMenus\.toggle\(/);
// Nontrivial settings stay in the same scrollable Ajustes panel.
for(const text of ["TEMPOS","NOTIFICAÇÕES","VISUAL","Tempos padrão automáticos",
 "Aguardar mapa","Após mapa/sem Shiny","Contador na bolha",
 "Mostrar efeito do toque","Ícones:","appendCentralAlert(root,prefs",
 "appendCentralAdvanced(root,hunt,cycles)",
 "PgsAutoHuntSettings.MAX_CLICKS","PgsAutoHuntSettings.PROXIMITY",
 "PgsAutoHuntSettings.MAP_RETRY","PgsAutoNotificationPolicy.SHINY",
 "showTapIndicator","Acesso manual às notificações Android"])
 assert.ok(settings.includes(text),"inline settings missing: "+text);
assert.doesNotMatch(settings,/this::showTime|this::showNotifications|this::showAppearance|showAutoHunt\(\)/);
// No duplicate wait selector in Action.
assert.doesNotMatch(actions,/huntNumeric\(root,hunt,PgsAutoHuntSettings.WAIT/);
// The old functions may stay as inactive compatibility code in LT369 but are
// NEVER reachable from toggle or the three main tabs.
assert.match(style,/static final int CELL_DP=30, ART_DP=16, BASE_GAP_DP=2, CORNER_DP=5/);
// LT369: long press and drag, no three-bar grip or visible arrows.
const catalog=fs.readFileSync(root+"PgsAutoCatalog.java","utf8");
const store=fs.readFileSync(root+"PgsSequenceStore.java","utf8");
assert.match(menu,/private void holdToReorder\(View touch,View row,List<View> ordered/);
assert.match(menu,/row\.performHapticFeedback/);
assert.match(menu,/row\.setTranslationY\(event\.getRawY\(\)-downY\[0\]\)/);
assert.match(menu,/nearestRow\(ordered,event\.getRawY\(\),from\)/);
const drag=menu.split("private void holdToReorder(View touch")[1]
    .split("private void markAlertIcon")[0];
assert.ok(drag.indexOf("row.setTranslationY(0f)") <
          drag.indexOf("int target=nearestRow(ordered,event.getRawY(),from)"),
    "the dragged row must reset before finding destination");
assert.match(menu,/holdToReorder\(label,line,speciesRows,from/);
assert.match(menu,/holdToReorder\(entry,entry,stepRows,index/);
assert.match(menu,/ACTION_SCROLL_FORWARD/);
assert.match(menu,/ACTION_SCROLL_BACKWARD/);
assert.match(menu,/PgsAutoCatalog\.moveTo\(context,pokemon\.number,target\)/);
assert.match(menu,/PgsSequenceStore\.moveTo\(context,index,target\)/);
assert.match(catalog,/static synchronized boolean moveTo\(Context ctx,int number,int target\)/);
assert.match(store,/static synchronized boolean moveTo\(Context c,int from,int target\)/);
assert.doesNotMatch(menu,/R\.drawable\.pgs_drag_handle/);
assert.doesNotMatch(menu,/String\[\] icons=\{"↑","↓"/);
assert.doesNotMatch(menu,/≡ Sequência/);
assert.doesNotMatch(menu,/Runtime\.getRuntime\(\)\.exec|ProcessBuilder|forceStopPackage/);
console.log("LT369 single hand popup, three tabs, inline time/alerts/visual/hunt PASS");

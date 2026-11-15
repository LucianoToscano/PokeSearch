"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict");
const root="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const get=name=>fs.readFileSync(root+name+".java","utf8");
const menu=get("PgsAutoMenus"),engine=get("PgsAutoClickService"),
  settings=get("PgsAutoHuntSettings"),policy=get("PgsAutoHuntPolicy"),
  notify=get("PgsAutoShinyListener"),notificationPolicy=get("PgsAutoNotificationPolicy");
const qa=fs.readFileSync(".github/workflows/qa-core-contracts.yml","utf8");
const manifest=fs.readFileSync("app/src/main/AndroidManifest.xml","utf8");
const toolbar=menu.split("void showToolbar(int x,int y)")[1]?.split("private void positionToolbar")[0]||"";
assert.match(toolbar,/R\.drawable\.pgs_menu_search,R\.drawable\.pgs_menu_timer/);
assert.match(toolbar,/R\.drawable\.ic_bell_outline,R\.drawable\.pgs_menu_customize/);
assert.match(toolbar,/R\.drawable\.pgs_menu_close/);
// LT368: o modo Auto Hunt fica na aba Ação, sem menu extra principal.
assert.match(menu,/void showSearch\\(\\)\\{showCentral\\(0\\);\\}/);
assert.match(menu,/appendCentralActions\\(body\\)/);
assert.match(menu,/PgsSmartSearchSettings\\.HUNT/);
assert.match(menu,/PgsSmartSearchSettings\\.SEQUENCE/);
assert.match(menu,/private void startCentral\\(\\)/);
assert.match(menu,/void showAutoHunt\(\)/);
assert.match(menu,/PgsAutoHostPolicy\.shortLabel\(host\)/);
assert.match(menu,/PgsAutoMenuStyle\.read\(context\)\.popupHeight/);
assert.match(menu,/mount\(root,238,340\)/);
for(const key of ["ENABLED","CLICK_ENABLED","WAIT","MAX_CLICKS",
 "STOP_IV100","STOP_DITTO","RINGTONE","VIBRATE","SHOW_COOLDOWN",
 "SHOW_INFO","FIX_MAP","MAP_RETRY","PROXIMITY"]){
 assert.ok(menu.includes("PgsAutoHuntSettings."+key),"the "+key+" real setting is shown");
 assert.ok(settings.includes(key+"=")||settings.includes(" "+key+"="),"host setting declared: "+key);
}
for(const future of ["Tele por IV100/Shiny","Reiniciar PoGo por falha",
 "Auto Catch / lançar bolas","Zoom máximo"]){
 assert.ok(menu.includes(future),"unsupported capability is labeled unavailable");
}
assert.match(menu,/ACTION_NOTIFICATION_LISTENER_SETTINGS/);
assert.match(menu,/setEnabled\(false\)/);
assert.match(settings,/pgs_hunt_settings_/);
assert.match(settings,/PgsAutoHostSettings\.current\(context\)/);
assert.match(settings,/PgsAutoHostPolicy\.OTHER\.equals\(profile\)/);
assert.doesNotMatch(settings,/prefs|firebase|gmail|authToken|account1|account2/i,
 "Auto Hunt must never read OAuth, Google or P1/P2 settings");
assert.match(engine,/PgsAutoHuntSettings\.enabled\(this\)/);
assert.match(engine,/startWatchOnly\(\)/);
assert.match(engine,/huntTapSession/);
assert.match(engine,/huntClicks\+\+/);
assert.match(engine,/PgsAutoHuntPolicy\.mayKeepScanning\(/);
assert.match(engine,/PgsAutoHuntPolicy\.nextDelayMs\(/);
assert.match(engine,/mapReadFailures/);
assert.match(engine,/huntProximityListener/);
assert.match(engine,/Sensor\.TYPE_PROXIMITY/);
assert.match(engine,/refreshHuntProximity\(\)/);
assert.match(engine,/AUTO HUNT · SENSOR COBERTO/);
assert.match(engine,/huntCountdownTick/);
assert.match(engine,/huntNextAt/);
assert.match(menu,/Sensor proximidade · pausar se coberto/);
assert.match(engine,/PgsAutoHuntSettings\.FIX_MAP/);
assert.match(engine,/onAutoHuntNotice\(String message\)/);
assert.match(engine,/PgsAutoHuntPolicy\.explicitNotice\(/);
assert.match(engine,/live\.gameAccountSafetyNoticePresent\(\)/);
assert.match(engine,/live\.passengerPromptPresent\(\)/);
assert.match(engine,/live\.awaitingMap/);
assert.match(engine,/live\.isGameVisible\(\)/);
assert.match(engine,/notifyConfigured\(PgsAutoNotificationPolicy\.HUNT/);
assert.match(engine,/public static void huntSettingsChanged\(\)/);
assert.match(notify,/PgsAutoHostPolicy\.isGameWindow\(pkg\)/);
assert.match(notify,/PgsAutoClickService\.onAutoHuntNotice\(content\.trim\(\)\)/);
assert.match(notificationPolicy,/HUNT="huntEvent"/);
assert.match(notificationPolicy,/return 2104/);
assert.match(engine,/channelId\+="_"\+PgsAutoHostSettings\.current\(this\)/);
assert.match(qa,/PgsAutoHuntPolicy/);
assert.match(policy,/DEFAULT_WAIT_SECONDS=35/);
assert.match(policy,/DEFAULT_MAX_CLICKS=10/);
assert.match(policy,/matches\("/);
assert.doesNotMatch(menu,/forceStopPackage|restartPackage|Runtime\.getRuntime|ProcessBuilder/);
assert.doesNotMatch(engine,/getCurrentLocation\(|requestLocationUpdates\(|forceStopPackage\(/);
assert.doesNotMatch(manifest,/android\.permission\.(QUERY_ALL_PACKAGES|ACCESS_FINE_LOCATION|ACCESS_SUPERUSER)/);
console.log("LT366 per-profile Auto Hunt UI, real opt-in scheduling, notification pause and disabled unsafe features PASS");

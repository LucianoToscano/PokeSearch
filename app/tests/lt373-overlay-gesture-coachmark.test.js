"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const base="app/src/main/java/com/lucianotoscano/pokesearchoverlay/";
const java=n=>fs.readFileSync(base+n+".java","utf8");
const engine=java("OverlayGestureTour"),
 ball=java("OverlayService"),candy=java("RareCandyOverlayService"),
 search=java("PgsAutoClickService"),home=java("MainActivity"),
 dock=fs.readFileSync("app/src/main/assets/dock.html","utf8");
const check=(source,regex,label)=>assert.match(source,regex,label);
// Visual: the REAL target remains visible, but tutorial cannot tap for user.
check(engine,/FLAG_NOT_TOUCHABLE/,"full-screen spotlight never intercepts taps");
check(engine,/FLAG_NOT_FOCUSABLE/,"do not steal focus from game");
check(engine,/lp\.alpha=\.72f/,"Android 12 safe untrusted touch opacity");
check(engine,/private static OverlayGestureTour activeTour/,"no stacked dimmers across features");
check(engine,/Path\.FillType\.EVEN_ODD/,"transparent hole centered on actual icon");
check(ball,/grip.getLocationOnScreen/,"manual bounds from real Pokeball grip");
check(engine,/DashPathEffect/,"dotted guide");
check(engine,/Path hand=new Path/,"vector transparent animated hand");
check(engine,/SystemClock\.uptimeMillis\(\)/,"animated ring/touch frames");
check(engine,/postInvalidateDelayed\(85\)/,"bounded animation redraw");
check(engine,/Pular/,"single skip chip");
check(engine,/prefs\.edit\(\)\.putBoolean\(DONE_KEY,true\)/,"persistent per-overlay completion");
assert.doesNotMatch(engine,/dispatchGesture|performClick\(|AccessibilityNodeInfo|setMockLocation/,
 "no synthetic touches, no game inspection or GPS");
// Preserve each account by relying on its native preference provider.
check(ball,/overlayPrefs\(\)/,"P1/P2 independent preferences");
check(ball,/OverlayGestureTour.Kind.POKEBALL/,"Pokeball real grip");
check(ball,/gestureTourAction\(menuExpanded\?OverlayGestureTour.SHOW_MENU/,"real 600ms hold");
check(ball,/gestureTourAction\(resultCollapsed\?OverlayGestureTour.HIDE_RESULTS/,"real expansion");
check(ball,/window\.reportRefreshCoachTarget/,"real refresh bounds obtained from menu");
check(ball,/@JavascriptInterface public void tutorialRefreshAnchor/,"local WebView bridge");
check(ball,/@JavascriptInterface public void tutorialRefreshHeld/,"long refresh requires actual JS hold");
check(ball,/handler\.postDelayed\(\(\)->beginGestureTour\(false\),1900L\)/,"only after first start");
check(ball,/REPLAY_GESTURE_TOUR/,"explicit replay action");
// Candy tap retracts actual open menu; doesn't need a fake clickable icon.
check(candy,/OverlayGestureTour.Kind.CANDY/,"Candy sprite has spotlight");
check(candy,/if\(candyMenuVisible\)\{\s*closeCandyMenu\(\);\s*coach\(OverlayGestureTour.HIDE_MENU\)/,"Candy short closes menu");
check(candy,/coach\(candyMenuVisible\?OverlayGestureTour.SHOW_MENU/,"actual candy long hold");
check(candy,/coach\(visible\?OverlayGestureTour.SHOW_RESULTS/,"actual Candy result state");
check(candy,/gestureTour\.close\(false\)/,"Candy cleanup");
// Search short tap may activate a search: do not require it for onboarding.
check(search,/OverlayGestureTour.Kind.SEARCH/,"PGS accessibility overlay spotlight");
check(search,/TYPE_ACCESSIBILITY_OVERLAY/,"trusted accessibility window");
check(search,/quickMenus\.toggle\(left,bubbleParams\.y\);\s*if\(quickMenus\.isOpen\(\)\)coach/,"PGS real hold");
check(search,/quickMenus\.collapseOneLevel\(\);\s*coach\(OverlayGestureTour.HIDE_MENU\)/,"PGS real menu retract");
check(engine,/Do not require that potentially destructive action/,"no compelled auto search");
check(home,/Rever tutorial interativo dos overlays/,"home replay UI");
for(const key of ['"prefs"','"prefs_secondary"','"rare_candy_overlay"','"pgs_auto_settings_v1"'])
 assert.ok(home.includes(key),"replay contains "+key);
check(dock,/function reportRefreshCoachTarget\(\)/,"real refresh DOM tile locator");
check(dock,/Native\.tutorialRefreshAnchor\(bounds\.left,bounds\.top,bounds\.width,bounds\.height\)/,
 "native receives measured CSS bounds");
check(dock,/Native\.tutorialRefreshHeld\(\)/,"refresh event fires on actual hold");
assert.ok(!engine.includes("new ImageButton"),"no fake image button");
console.log("LT373 coachmarks: native spotlight, real gesture events, replay and cleanup PASS");

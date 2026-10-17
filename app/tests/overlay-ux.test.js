"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..","src","main");
const read=(p)=>fs.readFileSync(path.join(root,p),"utf8");
const dock=read("assets/dock.html");
const service=read("java/com/lucianotoscano/pokesearchoverlay/OverlayService.java");
const main=read("java/com/lucianotoscano/pokesearchoverlay/MainActivity.java");
const picker=read("java/com/lucianotoscano/pokesearchoverlay/PokemonPicker.java");
let count=0;
function test(name,ok){assert.ok(ok,name);count++;}
test("Mode button opens options instead of cycling",dock.includes("toggleChoices('mode')")&&!dock.includes('onclick="Native.cycleMode()"'));
test("Auto button opens interval options",dock.includes("toggleChoices('period')"));
test("Five explicit search modes",["100% · 15/15/15","0% · 0/0/0","GL · Escolher Rank","UL · Escolher Rank","_/_/_ · IV 0–15"].every(v=>dock.includes(v)));
test("Intervals include minimum 3 minutes",["AUTO · 3 min","AUTO · 5 min","AUTO · 10 min","AUTO · 15 min","AUTO · 20 min"].every(v=>dock.includes(v)));
test("Choice panel resizes native window",dock.includes('popup.getBoundingClientRect().bottom')&&dock.includes('Native.resize(h)'));
test("Bridge supports explicit filter selection",service.includes("public void setMode(String s)"));
test("Bridge supports explicit interval selection",service.includes("public void setIntervalMinutes(int minutes)"));
test("Favorites remain in overlay",service.includes("PokemonPicker.show(OverlayService.this")&&!service.includes('intent.setAction("com.lucianotoscano.pokesearchoverlay.EDIT_WATCH_LIST")'));
test("Favorites picker is service-safe and focusable",picker.includes("TYPE_APPLICATION_OVERLAY")&&picker.includes("Runnable dismissed"));
test("Login has one top toolbar and no native footer buttons",main.includes('done.setText("✓ PokeSearch")')&&main.includes('loginDialog.requestWindowFeature(android.view.Window.FEATURE_NO_TITLE)')&&main.includes('MATCH_PARENT,\n                android.view.WindowManager.LayoutParams.MATCH_PARENT'));
test("Shiny never changes selected filter",service.includes('shiny=!shiny;')&&service.includes('mode.equals(s)'));
test("Throttled refresh is queued",service.includes('handler.postDelayed(queuedRefresh,remaining*1000L+300L)'));
test("Quick guide remains accessible",main.includes("showQuickGuide()")&&main.includes("tutorialSeenV41")&&main.includes("tutorial.html"));
test("Sprite rows must not overlap artwork",service.includes("return Math.max(26,spriteSize-8);"));
test("Sprites remain vertically centered",dock.includes("align-items:center;justify-content:center")&&dock.includes("height:var(--row)"));
test("Sprite list uses scroll instead of clipping overflow",dock.includes("overflow-y:auto;overflow-x:hidden")&&dock.includes("--list-limit"));
test("Long lists have list height supplied by native screen size",service.includes("Math.min(rowDp()*8,screenHeightDp()-160)"));

test("Chevron is at bottom of the sprites",dock.indexOf('id="collapse"')>dock.indexOf('id="spawns"')&&dock.includes('m5 15 7-7 7 7'));
test("Red close is alongside heart with standard background",dock.indexOf('id="close"')>dock.indexOf('id="donate"')&&dock.includes("#controls #close{"));
test("No duplicate close/collapse above gear",!dock.includes('id="topActions"'));
test("Menu occupies separate window rather than wide sprite dock",service.includes('menuRoot=new FrameLayout(this)')&&service.includes('menuPanel=new WebView(this)')&&dock.includes('controlsWindow=window.location.search'));
test("Original horizontal toolbar defaults to 34dp and vertical menu is optional",service.includes('new WindowManager.LayoutParams(dp(menuDp()),dp(menuBaseHeight())')&&service.includes("MENU_BASE_DP=34")&&service.includes('return menuVertical?Math.min(440'));
test("Minimize hides options and restores using gear",service.includes('if(yes&&menuExpanded)menu(false)')&&service.includes('if(minimized)minimize(false);'));
test("Login returns to Home and does not send it to background",!main.includes('postDelayed(()->moveTaskToBack(true)'));
test("Favorites dialog is one panel with integrated Concluir",picker.includes('finish.setText("Concluir")')&&!picker.includes('.setPositiveButton("Concluído"'));
test("Translucent favorites with optional background blur",picker.includes('Color.argb(187,30,42,58)')&&picker.includes('setBlurBehindRadius'));
test("Tutorial matches actual icon artwork",main.includes('tutorial.html')&&require('node:fs').readFileSync(require('node:path').join(root,'assets/tutorial.html'),'utf8').includes('Guia rápido · PokeSearch'));
test("Toolbar hides during login and favorite editing",service.includes('if(menuRoot!=null)menuRoot.setVisibility(View.GONE)'));
test("Only one pin control appears in toolbar",(dock.match(/id="location"/g)||[]).length===1);
test("Single pin control expands the location editor",dock.includes('onclick="toggleChoices(\'location\')"'));
test("Coords control has inline ON/OFF switch",dock.includes('fieldRow.append(field,toggle)')&&dock.includes('toggle.setAttribute("role","switch")'));
test("Location supports independent hide and disable",dock.includes('hide.onclick=closeChoices')&&dock.includes('Native.setLocation(false,"",0)'));
test("Slider covers inclusive range 0 to 1000",dock.includes('slide.min="0"')&&dock.includes('slide.max="1000"'));
test("Location enforces valid latitude and longitude",dock.includes('Math.abs(Number(match[1]))>90')&&dock.includes('Math.abs(Number(match[2]))>180'));
test("Location preference persisted without exposing secrets",service.includes('putBoolean("locationEnabled",locationEnabled)')&&service.includes('prefs.remove("locationCoords").remove("locationRadius")'));
test("Location is verified before search submission",service.includes('configureLocationAndVerify(generation,manual,0)')&&service.includes('execute("verifyLocation:"+data'));
test("Login, Shiny and league filters remain independent",service.includes('JSONObject.quote(mode)')&&service.includes('locationEnabled'));

const toolbarCols=dock.match(/#controls\{[^}]*grid-template-columns:([^;]+);/);
const toolbarButtons=dock.slice(dock.indexOf('<div id="menu"><div id="controls">'),dock.indexOf('</div><div id="choices"')).match(/<button\b/g)||[];
test("All thirteen toolbar actions fit compactly side by side on one row",
  !!toolbarCols&&toolbarCols[1].trim()==="34fr 22fr 41fr 20fr 20fr 22fr 22fr 22fr 38fr 22fr 22fr 22fr"&&
  toolbarButtons.length===14&&dock.includes("grid-auto-flow:column"));
test("Single pin shows active radius without a second settings button",
  (dock.match(/id="location"/g)||[]).length===1&&dock.includes('id="locationRadiusText"')&&
  dock.includes('textContent=locationEnabled?locationRadius+"km":""'));
test("Active radius is readable even when toolbar is closed",
  dock.includes('id="locBadge"')&&dock.includes('geoBadge.textContent=locationEnabled?"📍 "+locationRadius+" km":""')&&
  dock.includes('pointer-events:none')&&dock.includes('body.controls-window #locBadge{display:none!important}'));
test("When OFF, icon and badge never display outdated radius",
  dock.includes('geoBadge.classList.toggle("active",locationEnabled)')&&
  dock.includes('document.getElementById("locationRadiusText").textContent=locationEnabled?locationRadius+"km":""'));
test("Switching from location editor to mode releases keyboard focus",
  dock.includes('if((choiceOpen==="location"||choiceOpen==="filters")&&kind!==choiceOpen)')&&dock.includes('Native.locationEditor(false)'));
test("Responsive toolbar avoids the gear",service.includes("boolean right=")&&service.includes("boolean left=")&&service.includes("int below=params.y+dp(TOOLBAR_DP)"));
test("Compact toolbar resizes to narrow and wide Android screens",dock.includes("grid-template-columns:34fr 22fr 41fr")&&service.includes("Math.min(wanted,screenWidthDp()-8)")&&service.includes("30*visibleControls"));
test("Menu reverses order on left edge",dock.includes("body.menu-left #controls{direction:rtl}"));
test("Chevron has visible artwork and no surface background",dock.includes("#collapse{width:34px;height:27px")&&dock.includes("background:transparent!important"));
test("No extra gap when popup padding zero",dock.includes("Math.max(0,Number(pad)||0)"));
test("Coalesce resize events",dock.includes("if(fitPending)return"));
test("Location validation refuses blank radius",read("assets/probe.js").includes('radiusInput!==""'));
test("Location selection requires state confirmation",read("assets/probe.js").includes("active===true"));
test("AUTO provides feedback",service.includes("AUTO: "));
const expiry=service.split("private final Runnable expiryRefresh=new Runnable(){")[1]?.split("private void armNextDespawn")[0]||"";
test("Despawn removes expired sprites without triggering an extra site search",expiry.includes("armNextDespawn(active);")&&!expiry.includes("refresh(false);"));
test("AUTO retains 5/10/15/20 minute scheduling",service.includes("handler.postDelayed(periodic,intervalMinutes*60000L)"));
test("Manual refresh does not misleadingly claim queued work",service.includes("Toque ↻ novamente quando terminar."));
test("Login pauses and invalidates pending site callbacks",service.includes("loginPaused=true;\n            ++requestGeneration;\n            searchInProgress=false;")&&service.includes("cancelSessionCallbacks();"));
test("After login a fresh search is attempted safely",service.includes("if(!stopped&&!loginPaused&&!pickerOpen&&")&&service.includes("handler.postDelayed(loginEndRefresh,1600L)"));
test("Shiny verification distinguishes trainer linking",service.includes('verified.optBoolean("pending",false)'));
test("Shiny failure does not imply confirmed trainer authentication",service.includes("Verifique login e vínculo do treinador"));
test("Diagnostic logs only coarse authentication states",service.includes('BugReport.log(this,"SESSION","Shiny="'));
test("Menus are never clipped by the HTML viewport",dock.includes("html.controls-root,body.controls-window{overflow:visible!important"));
test("Mode AUTO and location work before delayed native menu sync",dock.includes("if(controlsWindow&&!menuOpen)setMenuOpen(true"));
test("Mode and AUTO provide immediate visible feedback",dock.includes("Native.selectPreset(String(value))")&&service.includes("public void selectPreset(String choice)")&&dock.includes("period=Number(value);draw();Native.setIntervalMinutes(period)"));
test("Manual refresh button has touch feedback",dock.includes('onclick="manualRefreshTap()"')&&dock.includes('button.classList.add("requested")'));
test("Gear has a visible touch target",dock.includes("#gear{width:35px;height:30px;background:transparent!important"));
test("Toolbar menu responds in narrow and wide sizes",service.includes("Math.min(wanted,screenWidthDp()-8)")&&service.includes("menuDp()"));
test("Favorites use translucent gradient without background dim",picker.includes("Color.argb(159,24,34,47)")&&picker.includes("window.setDimAmount(0.0f)"));
test("Home has explicit login and logout",main.includes('signIn.setText("Entrar / vincular")')&&main.includes('signOut.setText("Sair")'));
test("Login does not start overlay if none is running",main.includes("if(!OverlayService.isRunning())return;"));
test("Logout clears local cookies and web storage only",main.includes("removeAllCookies")&&main.includes("WebStorage.getInstance().deleteAllData()"));
test("Home login does not force Shiny",main.includes("openLoginDialog(false)")&&
    !main.includes('view.evaluateJavascript(readAsset("shiny_login.js"),null)')&&
    main.includes('String probe=readAsset("probe.js")'));
test("Verified Home login returns to PokeSearch",main.includes("loginAutoReturnQueued=true")&&main.includes("loginDialog.dismiss()"));
test("Verified login returns regardless of Shiny switch state",main.includes('JSONObject.quote("session")')&&
    main.includes('loginAutoReturnQueued=true;')&&main.includes('loginDialog.dismiss();')&&
    !main.includes('checkShinyReturn('));
test("Menu orientation sent to BOTH native WebViews",service.includes('js(menuPanel,menuLoaded,"window.syncMenu(true,"+edge+",0)")'));
test("Near-right vertical dock still reverses order",service.includes("menuLeft=params.x+dp(dockDp())/2>screen/2"));
test("Service lifecycle prevents spurious background site",service.includes("public static boolean isRunning()")&&service.includes("running=false;"));
const gradleSettings=fs.readFileSync(path.join(__dirname,'../../settings.gradle.kts'),'utf8');
const gradleBuild=fs.readFileSync(path.join(__dirname,'../build.gradle.kts'),'utf8');
const iconGenerator=fs.readFileSync(path.join(__dirname,'../scripts/RoundIcon.java'),'utf8');
const ci=fs.readFileSync(path.join(__dirname,'../../.github/workflows/build-overlay.yml'),'utf8');
const manifest=fs.readFileSync(path.join(root,'AndroidManifest.xml'),'utf8');
test("Settings Gradle exists and includes application",gradleSettings.includes('include(":app")'));
test("PokeSearch 0.54 source configured",gradleBuild.includes('versionCode = 54')&&gradleBuild.includes('versionName = "0.54-beta"'));
test("Round icon generator always uses headless mode",gradleBuild.includes('-Djava.awt.headless=true')&&iconGenerator.includes('System.setProperty("java.awt.headless","true")'));
test("Network main-frame error is handled",service.includes('request.isForMainFrame()')&&service.includes('Falha de navegação principal'));
test("Browser exception and parse failures recorded",service.includes('recordFailure("executar JS site",e)')&&service.includes('recordFailure("interpretar resposta JS",e)'));
test("Exception logging excludes raw message or full URL",service.includes('error.getClass().getSimpleName()')&&!service.includes('error.getMessage()'));
test("Source archive contains icon and functional wrapper",ci.includes('gradle/wrapper/gradle-wrapper.jar')&&ci.includes('pokesearch_round.png'));
test("CI verifies checksum and source settings",ci.includes('sha256sum -c SHA256SUMS.txt')&&ci.includes('settings.gradle.kts | grep'));
test("Foreground service migration is not silently activated",manifest.includes('FOREGROUND_SERVICE')&&!manifest.includes('android:foregroundServiceType="specialUse"'));
const watch=fs.readFileSync(path.join(root,'java/com/lucianotoscano/pokesearchoverlay/WatchAlerts.java'),'utf8');
const report=fs.readFileSync(path.join(root,'java/com/lucianotoscano/pokesearchoverlay/BugReport.java'),'utf8');
const sanitizer=fs.readFileSync(path.join(root,'java/com/lucianotoscano/pokesearchoverlay/DiagnosticSanitizer.java'),'utf8');
const notifXml=fs.readFileSync(path.join(root,'res/drawable/ic_notification.xml'),'utf8');
test("All notification small icons use our monochrome vector",service.includes('.setSmallIcon(R.drawable.ic_notification)')&&watch.includes('.setSmallIcon(R.drawable.ic_notification)')&&!service.includes('android.R.drawable.ic_menu_search')&&!watch.includes('android.R.drawable.ic_menu_search'));
test("Monochrome vector icon exists",notifXml.includes('android:strokeColor="#FFFFFFFF"')&&notifXml.includes('android:viewportWidth="24"'));
test("BugReport sanitizes before storing and again before export",report.includes('DiagnosticSanitizer.clean(value)')&&report.includes('clean(a.optString(i))'));
test("Report no longer rewrites literal backslash-n globally",!report.includes('.replace("\\\\n","\\n")')&&report.includes('return s.toString();'));
test("BugReport no longer promises perfect sensitive-data removal",report.includes("Revise o TXT antes de compartilhar"));
test("Plain Java privacy tests run in CI",ci.includes('DiagnosticSanitizerTest.java')&&ci.includes('javac -encoding UTF-8'));
test("Notification errors are logged without raw exception messages",watch.includes('BugReport.log(context,"NOTIFICATION"')&&service.includes('recordFailure("notificação geral",e)'));
test("Optional overlay teardown errors report their type",service.includes('recordFailure("remover menu",e)'));
// B06 regression checks: named timers, session generation and deterministic shutdown.
const cancelBlock=service.split('private void cancelSessionCallbacks(){')[1]?.split('\n    }')[0]||'';
const beginBlock=service.split('if("com.lucianotoscano.pokesearchoverlay.LOGIN_BEGIN".equals(action)){')[1]?.split('return START_STICKY;')[0]||'';
const endBlock=service.split('if("com.lucianotoscano.pokesearchoverlay.LOGIN_END".equals(action)){')[1]?.split('return START_STICKY;')[0]||'';
const reloadBlock=service.split('if("com.lucianotoscano.pokesearchoverlay.REFRESH_LOGIN".equals(action)||')[1]?.split('// v0.20')[0]||'';
const pageBlock=service.split('private void newWebsite(){')[1]?.split('    @Override public void onCreate()')[0]||'';
const destroyBlock=service.split('    @Override public void onDestroy(){')[1]?.split('    @Override public IBinder')[0]||'';
test("B06 named page/login/reload timer callbacks",['pageFinishedRefresh','loginEndRefresh','deferredSessionReload'].every(n=>service.includes('private final Runnable '+n+'=')));
test("B06 LOGIN_BEGIN pauses and invalidates active search",beginBlock.includes('loginPaused=true;')&&beginBlock.includes('++requestGeneration;')&&beginBlock.includes('searchInProgress=false;'));
test("B06 all six kinds of scheduled work are canceled",['queuedRefresh','periodic','expiryRefresh','pageFinishedRefresh','loginEndRefresh','deferredSessionReload'].every(n=>cancelBlock.includes('handler.removeCallbacks('+n+')')));
test("B06 LOGIN_BEGIN cancels callbacks and hides all windows",beginBlock.includes('cancelSessionCallbacks();')&&['root','menuRoot','detailRoot'].every(v=>beginBlock.includes(v+'.setVisibility(View.GONE)')));
test("B06 LOGIN_END cancels before 1600ms and periodic restarts after",endBlock.indexOf('cancelSessionCallbacks();')<endBlock.indexOf('handler.postDelayed(loginEndRefresh,1600L)')&&endBlock.indexOf('schedulePeriodic();')>endBlock.indexOf('handler.postDelayed(loginEndRefresh,1600L)'));
test("B06 periodic suppressed during login",service.includes('if(stopped||loginPaused||intervalMinutes<=0)return;')&&service.includes('if(!stopped&&!loginPaused&&intervalMinutes>0)handler.postDelayed(this,intervalMinutes*60000L)'));
test("B06 page generation captured at start and compared on finish",pageBlock.includes('onPageStarted')&&pageBlock.includes('pageLoadGeneration=requestGeneration;')&&pageBlock.includes('pageLoadGeneration!=requestGeneration'));
test("B06 page finish 2500ms handler is cancelable",pageBlock.includes('handler.removeCallbacks(pageFinishedRefresh);')&&pageBlock.includes('handler.postDelayed(pageFinishedRefresh,2500L)')&&!pageBlock.includes('handler.postDelayed(()->{if(!stopped&&!loginPaused)refresh();}'));
test("B06 REFRESH_LOGIN cancels callbacks before cookie flush",reloadBlock.includes('++requestGeneration;')&&reloadBlock.indexOf('cancelSessionCallbacks();')<reloadBlock.indexOf('CookieManager.getInstance().flush();'));
test("B06 reload occurs after 350ms with generation guard",reloadBlock.includes('handler.postDelayed(deferredSessionReload,350L)')&&service.includes('pendingReloadGeneration!=requestGeneration'));
test("B06 delayed search stages verify pause/generation",(service.match(/if\(stopped\|\|loginPaused\|\|generation!=requestGeneration\)return;/g)||[]).length>=8);
test("B06 destruction cancels callbacks and removes windows before WebViews",destroyBlock.indexOf('stopped=true;')<destroyBlock.indexOf('handler.removeCallbacksAndMessages(null)')&&destroyBlock.indexOf('wm.removeView(detailRoot)')<destroyBlock.indexOf('destroyWebView(panel,true'));
test("B06 privacy of errors unchanged",service.includes('error.getClass().getSimpleName()')&&!service.includes('error.getMessage()'));
test("B06 Android SDK and manifest unchanged",manifest.includes('<service android:name=".OverlayService" android:exported="false" />')&&gradleBuild.includes('targetSdk = 33')&&gradleBuild.includes('compileSdk = 36'));
// PS-075–PS-080 regression contracts
test("PS-075 Favorites provides accessible test notification action",picker.includes('testNotification.setText("🔔 Testar notificação")')&&picker.includes('WatchAlerts.test(activity)')&&picker.includes('WatchAlerts.permissionGranted(activity)'));
test("PS-075 Home Preferences provides both toggles and test action",main.includes("settingAlertMode(body,prefs);")&&main.includes('settingCheckbox(body,prefs,WatchAlerts.PREF_ENABLED,')&&main.includes('WatchAlerts.test(this)'));
test("PS-076 Android Back returns within OAuth dialog history",main.includes('loginDialog.setOnKeyListener(')&&main.includes('android.view.KeyEvent.KEYCODE_BACK')&&main.includes('website.canGoBack()')&&main.includes('website.goBack()'));
test("PS-077 loginEndRefresh is cancelable across all transitions",service.includes('private final Runnable loginEndRefresh=')&&cancelBlock.includes('handler.removeCallbacks(loginEndRefresh)')&&beginBlock.includes('cancelSessionCallbacks();')&&endBlock.includes('cancelSessionCallbacks();')&&reloadBlock.includes('cancelSessionCallbacks();'));
const javaSignedLat='[-+]?'+String.fromCharCode(92,92)+'d{1,2}';
const javaSignedLon='[-+]?'+String.fromCharCode(92,92)+'d{1,3}';
const jsSignedLat='[-+]?'+String.fromCharCode(92)+'d{1,2}';
const jsSignedLon='[-+]?'+String.fromCharCode(92)+'d{1,3}';
test("PS-078 explicit positive signs allowed in Java and JS coordinates",service.includes('('+javaSignedLat)&&sanitizer.includes(javaSignedLat)&&dock.includes(jsSignedLat));
test("PS-078 longitude explicitly accepts plus and minus signs",service.includes('('+javaSignedLon)&&sanitizer.includes(javaSignedLon)&&dock.includes(jsSignedLon));
test("PS-079 menu positions before a single sync",service.includes('deferMenuSync=true;')&&service.includes('finally{deferMenuSync=false;}')&&service.indexOf('try{updateWindow();}')<service.indexOf('js(panel,panelLoaded,"window.syncMenu("+show+')&&service.includes('&&!deferMenuSync'));
test("PS-080 IV verification has no unreachable success",!read("assets/probe.js").includes('não confirmados"};\\n  return {ok:true};'));
test("PS-080 bug report notice requires manual review",main.includes('O relatório filtra formatos comuns de dados sensíveis. Revise o conteúdo antes de compartilhar.'));
// v0.50 regression contracts: PS-081–PS-085 and stale bridge replies.
const prefSync=service.split('private void syncPreferencesWithoutSearch(){')[1]?.split('    @Override public int onStartCommand(')[0]||'';
const startCommand=service.split('    @Override public int onStartCommand(')[1]?.split('    private void destroyWebView(')[0]||'';
test("PS-081 home requests POST_NOTIFICATIONS from test action",main.includes('requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},203)'));
test("PS-081 callback runs notification test only after permission granted",main.includes('if(requestCode==203)')&&main.includes('results[0]==PackageManager.PERMISSION_GRANTED')&&main.includes('granted&&WatchAlerts.permissionGranted(this)')&&main.includes('WatchAlerts.test(this)'));
test("PS-081 picker provides permission directions without requesting service permission",picker.includes('Conceda notificações na tela inicial do PokeSearch ou nas Configurações do Android')&&!picker.includes('requestPermissions('));
test("PS-082 sync action from Home requires running overlay",main.includes('OverlayService.isRunning()')&&main.includes('serviceAction("com.lucianotoscano.pokesearchoverlay.SYNC_PREFS")'));
test("PS-082 Home syncs on spinner, checkbox and dismiss",main.includes('syncOverlayPreferences();')&&main.includes('dialog.setOnDismissListener(d->syncOverlayPreferences())')&&main.includes('check.setOnCheckedChangeListener'));
test("PS-082 Overlay handles SYNC_PREFS without network refresh",startCommand.includes('com.lucianotoscano.pokesearchoverlay.SYNC_PREFS')&&startCommand.includes('syncPreferencesWithoutSearch();')&&!prefSync.includes('refresh(')&&!prefSync.includes('execute(')&&!prefSync.includes('loadUrl('));
test("PS-082 re-sorts current results and updates dock",prefSync.includes('sortItems(items)')&&prefSync.includes('params.width=dp(minimized?BUBBLE_DP:dockDp())')&&prefSync.includes('update();'));
test("PS-082 preferences keys for sprite size, sort, timers, alerts",
  prefSync.includes('getInt("spriteSize"')&&prefSync.includes('getString("sort"')&&
  prefSync.includes('getBoolean("alerts"')&&prefSync.includes('loadDisplayPreferences(prefs)')&&
  service.includes('showTimers=pref.getBoolean("showTimers"'));
test("Probe result is discarded across generation switches",service.includes('final int callbackGeneration=requestGeneration;')&&service.includes('if(stopped||loginPaused||callbackGeneration!=requestGeneration)return;'));
test("PS-084 catalogue asset failures log only class and stage",picker.includes('BugReport.log(activity,"ASSET","ler catálogo Pokémon · "+e.getClass().getSimpleName())'));
test("PS-084 MainActivity asset failures log only stage and class",main.includes('BugReport.log(this,"ASSET"')&&main.includes('e.getClass().getSimpleName()')&&!main.includes('e.getMessage()'));
test("PS-085 sanitizer masks OAuth code/state and discord_token",sanitizer.includes('discord[_-]?token')&&sanitizer.includes('code|state|secret'));
// Additional physical feedback for the v0.50 stabilization pass.
test("v0.50 no phantom gap when toolbar is beside dock",
    service.includes("menuPadDp=0; // No spacer: side toolbar")&&dock.includes("#spawns{margin-top:var(--top-space);gap:0}"));
test("v0.50 transparent floating collapse arrow",
    dock.includes("#collapse{width:34px;height:27px")&&dock.includes("background:transparent!important"));
test("v0.50 AUTO OFF in UI and service, with no periodic posts",
    dock.includes('[[0,"AUTO · OFF')&&dock.includes('period===0?"OFF"')&&dock.includes("period=[0,3,5,10,15,20].includes(Number(interval))?Number(interval):5")&&
    service.includes('if(minutes!=0&&minutes!=3&&minutes!=5')&&
    service.includes('if(!stopped&&!loginPaused&&intervalMinutes>0)handler.postDelayed(periodic,'));
test("v0.50 notifications cycle off / on / silent",
    service.includes('alertsMode="off".equals(alertsMode)?"on":"on".equals(alertsMode)?"silent":"off"')&&
    dock.includes('bell.classList.toggle("generalSilent",alertMode==="silent")'));
test("v0.50 silent channels are actually without sound",
    service.includes('pokesearch_alerts_silent_v1')&&
    watch.includes('pokesearch_watch_silent_v1')&&watch.includes('channel.setSound(null,null)'));
test("v0.50 direct login uses the real site switch without guessed OAuth routes",
    main.includes('readAsset("login_entry.js")')&&
    read("assets/login_entry.js").includes('candidate.click();')&&
    main.includes('website.loadUrl("https://pogocoordinates.com/search")'));
test("v0.50 service accepts missing action on initial start",
    service.includes('i==null||i.getAction()==null?"":i.getAction()'));
test("v0.50 neutral UI includes smaller location icon",
    dock.includes('#controls #location svg{width:14px;height:14px}')&&
    dock.includes('#choices{background:#252628ee'));
test("Android responsive controls have no phantom spacer below popup",
  service.includes('Math.round((menuParams.y+menuParams.height-params.y)/d.density)-30+2')&&
  service.includes('menuPadDp=0; // No spacer: side toolbar')&&
  dock.includes('#choices{display:none;position:absolute;top:34px;'));
test("Android responsive controls measure actual one-row menu height",
  dock.includes('if(controlsWindow)h=Math.max(34,Math.ceil(document.getElementById("controls").getBoundingClientRect().height)+4);')&&
  service.includes('menuParams.height=dp(menuBaseHeight())')&&
  service.includes('Math.min(450,screenHeightDp()-72)'));
test("Android responsive layout contains all 14 controls exactly once",
  toolbarButtons.length===14&&
  ['cycle','sh','period','manualRefresh','size','clock','bell','star','location','filters','report','donate','close']
  .every(id=>(dock.match(new RegExp('id="'+id+'"','g'))||[]).length===1));
test("Shiny tap skips Search cooldown to inspect site and auth",
  service.includes('private void prepareImmediateShiny(int generation)')&&
  service.includes('private void applyShinyOnSite(int generation,int attempt)')&&
  service.includes('execute("setShiny",applied->')&&
  service.includes('execute("session",session->')&&
  service.includes('handler.removeCallbacks(queuedRefresh);'));
test("Shiny tap launches login directly when not authenticated",
  service.includes('"login necessário".equals(cachedAuth)||"desconectado".equals(cachedAuth)')&&
  service.includes('openShinyLogin();')&&
  service.includes('if(!loaded||website==null){'));
test("Shiny off works without forced login",
  service.includes('if(!shiny){')&&
  service.includes('prepareImmediateShiny(generation);')&&
  read("assets/probe.js").includes('if(action==="setShiny")return JSON.stringify(setShiny(shinyOnly))'));
test("Shiny is only verified after reading site state",
  service.includes('execute("verifyShiny",verified->')&&
  service.includes('shinyVerified=shiny;')&&
  service.includes('if(stopped||loginPaused||generation!=requestGeneration)return;'));
test("Login retries the official control for delayed site hydration",
  main.includes('private void openOfficialLoginControl(WebView view,int remaining)')&&
  main.includes('view.postDelayed(()->openOfficialLoginControl(view,remaining-1),260L)')&&
  main.includes('openOfficialLoginControl(view,8);'));
test("Login uses official site and Shiny activation remains in background collector",
  main.includes('host.equalsIgnoreCase("pogocoordinates.com")')&&
  !main.includes('view.evaluateJavascript(readAsset("shiny_login.js"),null)')&&
  main.includes('website.loadUrl("https://pogocoordinates.com/search")')&&
  service.includes('private void prepareImmediateShiny(int generation)'));
test("Official account badge returns immediately to PokeSearch Home",
  main.includes('private void checkLoginSession(WebView view,int attemptsLeft,int pageGeneration)')&&
  main.includes('if("autenticada".equals(auth)){')&&
  main.includes('loginDialog.dismiss();')&&
  main.includes('checkLoginSession(view,14,generation);'));
test("Login stays monitored during in-page OAuth without forcing navigation",
  main.includes('view.postDelayed(()->checkLoginSession(view,next,pageGeneration)')&&
  main.includes('attemptsLeft>1?400L:850L')&&
  main.includes('++loginPageGeneration; // Invalidate pending WebView session probes.'));
test("Login session detection reuses sanitized probe not a visible Logout alone",
  main.includes('JSONObject.quote("session")')&&
  read("assets/probe.js").includes('const accountBadge=elements("p,small,span,div,label")'));
test("Shiny state sync starts on site load independently of Search cooldown",
  service.includes('if(shiny&&!shinyVerified){')&&
  service.includes('prepareImmediateShiny(generation);')&&
  service.includes('},420L);'));
test("After login, authenticated site missing switch never restarts login loop",
  service.includes('"autenticada".equals(auth)')&&
  service.includes('Conta conectada; controle Shiny não encontrado no site.'));
test("Gap between gear and first sprite is never a fabricated 34dp",
  service.includes('menuPadDp=0; // Only the measured overlap')&&
  service.includes('params.y=targetY;')&&
  service.includes('menuPadDp=0;')&&
  dock.includes('#spawns{margin-top:var(--top-space);gap:0}'));
const directShiny=service.split('private void prepareImmediateShiny(int generation){')[1]?.split('private void verifyAndSubmit(')[0]||'';
test("Shiny on visible Pokémon page never requires Stats/PvP tab",
  directShiny.includes('applyShinyOnSite(generation,0);')&&!directShiny.includes('execute("prepareSearch"'));
test("Shiny retries unhydrated site control without repeated login loops",
  service.includes('handler.postDelayed(()->applyShinyOnSite(generation,attempt+1),300L)')&&
  service.includes('Conta conectada; controle Shiny não encontrado no site.'));
test("Mobile session probe has a text-node badge fallback",
  read("assets/probe.js").includes('document.body&&document.body.innerText'));
test("Login initially masks the unrelated PoGoCoordinates search page",
  main.includes("FrameLayout loginStage=new FrameLayout(this);")&&
  main.includes("loginStage.addView(website,new FrameLayout.LayoutParams(-1,-1));")&&
  main.includes("loginStage.addView(loginWaiting,new FrameLayout.LayoutParams(-1,-1));")&&
  main.includes("loginCover=loginWaiting;"));
test("Login only reveals official provider dialog and supports Shiny switch tap",
  main.includes("if(loginCover!=null)loginCover.setVisibility(View.GONE);")&&
  main.includes('result.contains("\\\"ready\\\"")')&&
  read("assets/login_entry.js").includes('return "ready";')&&
  read("assets/login_entry.js").includes('candidate.click();'));
test("Login tests session before opening a fresh login link",
  main.indexOf("checkLoginSession(view,14,generation);")>=0&&
  main.includes("if(attemptsLeft<=13&&!loginDiscoveryStarted&&!loginLinkAttempted)")&&
  main.includes("openOfficialLoginControl(view,8);"));
test("Provider OAuth is visible and return to site is covered until session confirmed",
  main.includes("loginCover.setVisibility(site?View.VISIBLE:View.GONE);")&&
  main.includes('if("autenticada".equals(auth)){')&&
  main.includes("loginDialog.dismiss();"));
test("Unknown site login has an accessible explicit fallback, not infinite masking",
  main.includes('loginFallback.setText("Mostrar o site para entrar");')&&
  main.includes("loginFallback.setVisibility(View.VISIBLE);")&&
  main.includes("if(loginCover!=null)loginCover.setVisibility(View.GONE);"));
test("Minimal login surface is neutral and release clears native references",
  main.includes('loginWaitLabel.setText("Preparando acesso ao PoGoCoordinates')&&
  main.includes("loginWaiting.setBackgroundColor(Color.rgb(11,13,18));")&&
  main.includes("loginCover=null;")&&main.includes("loginFallback=null;"));
test("Regression: a single line instead of two oversized icon rows",
  dock.includes('#menu{display:none;position:absolute;top:0;left:var(--dock);width:396px;height:34px;')&&
  dock.includes('#controls{grid-auto-flow:column}')&&
  dock.includes('body.controls-window #menu{min-height:34px}')&&
  !dock.includes('repeat(6,minmax(0,1fr))'));
test("Official Shiny switch can initiate login without exposing search page",
  read("assets/login_entry.js").includes('const fromShiny=__SHINY__;')&&
  read("assets/login_entry.js").includes('window.__psShinyLoginTapped=true;')&&
  main.includes('.replace("__SHINY__",loginStartedForShiny?"true":"false")'));
test("The site is only exposed once sign-in content is actually ready",
  read("assets/login_entry.js").includes('if(authDialog||providerChoices)return "ready";')&&
  main.includes('result.contains("\\\"ready\\\"")'));
console.log("PokeSearch UX contract: "+count+" tests passed");

const guard=read("java/com/lucianotoscano/pokesearchoverlay/IntegrityGuard.java");
const proguard=fs.readFileSync(path.join(__dirname,"..","proguard-rules.pro"),"utf8");
const gradle=fs.readFileSync(path.join(__dirname,"..","build.gradle.kts"),"utf8");
test("IntegrityGuard invoked in activity and service",main.includes("IntegrityGuard.verify(this)")&&service.includes("IntegrityGuard.verify(this)"));
test("Pix digest checked with SHA-256 and constant-time compare",guard.includes("PixSupport.PAYLOAD")&&guard.includes("SHA-256")&&guard.includes("MessageDigest.isEqual"));
test("Login protected from screenshots",main.includes("loginDialog.getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE)"));
test("R8 keeps JavascriptInterface",proguard.includes("@android.webkit.JavascriptInterface")&&proguard.includes("-keepattributes"));
test("Release minifies and shrinks",gradle.includes("isMinifyEnabled = true")&&gradle.includes("isShrinkResources = true"));

// v0.52 opt-in UI regression coverage
 test("v0.52 keeps vertical menu optional without changing original colors",dock.includes('body.controls-window.vertical #controls')&&dock.includes('#controls #cycle.ivOn{background:#3a5040bd'));
 test("v0.52 rank is optional and only shown with a numeric result",dock.includes('showRanks=ranks!==false')&&dock.includes('Number.isInteger(rv)'));
 test("v0.52 home preferences persist hidden icon choices",main.includes('prefs.getString("hiddenControls"')&&main.includes('prefs.edit().putString("hiddenControls"'));

test("v0.53 floating filter action and popup are present",dock.includes('id="filters"')&&dock.includes("renderFiltersPanel()")&&dock.includes('Native.setSearchOptions(JSON.stringify(val))'));
test("v0.53 rank badges show verified upper limit when exact rank is unknown",dock.includes('rankUpperBound')&&dock.includes('showRanks&&(league==="gl"||league==="ul")'));
test("v0.53 Android validates floating search preference values",service.includes('public void setSearchOptions(String value)')&&service.includes('options.put("rankMax"'));

test("Multi-search profiles have native persistence and sequential retrieval",service.includes('setSearchProfiles(String value)')&&service.includes('beginProfileCycle(boolean manual)')&&service.includes('finishProfileCycleStep(JSONObject r,JSONArray sorted)'));
test("Three independent group headers and folding are implemented",dock.includes('toggleResultGroup(index)')&&dock.includes('groupBlock')&&dock.includes('profileIndex'));
test("Toolbar can show text with horizontal and vertical layouts",dock.includes('body.controls-window.with-text #controls')&&dock.includes('body.controls-window.vertical.with-text #controls'));

test("v0.54 three independent Android overlay windows",service.includes('private final FrameLayout[] groupRoots=new FrameLayout[3]')&&service.includes('createGroupWindows()')&&service.includes('wm.updateViewLayout(frame,coords)'));
test("v0.54 layers remember positions separately",service.includes('putInt("layerX"+i')&&service.includes('putInt("layerY"+i'));
test("v0.54 each group loads an isolated WebView",service.includes('dock.html?group=')&&dock.includes('const groupWindow=!!matchedGroup')&&dock.includes('Native.resizeGroup(groupId,h)'));
test("v0.54 independent result windows only render their own profile",dock.includes('Number(x.c.profileIndex)===groupId')&&dock.includes('document.getElementById("spawns").replaceChildren()'));
test("v0.54 eye toggles CP, level, timer, rank, spawn count and IV",dock.includes('id="eye"')&&dock.includes('renderInfoChoices()')&&service.includes('setDisplayOptions(String value)'));
test("v0.54 mode selector includes 100, 0, GL, UL and custom",dock.includes('"iv100","100%')&&dock.includes('"iv0","0%')&&dock.includes('"gl","GL')&&dock.includes('"ul","UL')&&dock.includes('"custom","_/_/_'));
test("v0.54 preserves vertical text by default with icon-only option",service.includes('menuVertical=true')&&service.includes('menuShowText=true')&&main.includes('settingCheckbox(body,prefs,"menuShowText"'));

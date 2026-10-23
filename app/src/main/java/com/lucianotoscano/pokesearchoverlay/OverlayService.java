package com.lucianotoscano.pokesearchoverlay;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ClipboardManager;
import android.content.ClipData;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceError;
import android.widget.FrameLayout;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.function.Consumer;

public class OverlayService extends Service {
    private static volatile boolean running=false;
    public static boolean isRunning(){return running;}
    private static final int BUBBLE_DP=45, DETAIL_DP=226, TOOLBAR_DP=34, MENU_BASE_DP=34;
    private static final int RESULTS_HEADER_DP=30;
    private int spriteSize=45;
    private String visualPrefsJson="{}";
    private boolean visualMenuVertical=false,visualResultsHorizontal=false;
    private int visualMenuOffsetX=0,visualMenuOffsetY=0,
        visualResultsOffsetX=0,visualResultsOffsetY=0,
        visualGearMenuGap=0,visualMenuItemGap=0,visualResultGapBetween=31,
        visualHeaderY=0,visualHeaderX=0,visualHeaderTouchWidth=35,
        visualHeaderTouchHeight=30,visualHeaderAfterGap=0;
    private int visualMenuBaseDp(){
        return visualMenuVertical?232:MENU_BASE_DP;
    }
    private int vInt(JSONObject obj,String key,int def,int min,int max){
        return Math.max(min,Math.min(max,obj.optInt(key,def)));
    }
    private JSONObject normalizeVisualPrefs(String raw) throws org.json.JSONException {
        if(raw==null||raw.length()>5000)throw new org.json.JSONException("Visual settings too large");
        JSONObject input=new JSONObject(raw),clean=new JSONObject();
        String[] keys={"resultGapTop","resultGapBetween","resultSpriteScale","headerIconY",
            "headerOffsetX","headerTouchWidth","headerTouchHeight","headerAfterGap",
            "resultsOffsetX","resultsOffsetY","menuOffsetX","menuOffsetY",
            "gearMenuGap","menuItemGap","popupWidth","popupHeight","resultsTransparency","menuTransparency"};
        int[][] limits={{-80,80,0},{0,65,31},{70,160,100},{0,72,0},
            {-16,16,0},{26,42,35},{24,50,30},{0,36,0},
            {-200,200,0},{-350,350,0},{-200,200,0},{-350,350,0},
            {0,80,0},{0,16,0},{160,330,232},{140,420,390},{0,100,100},{0,100,35}};
        for(int i=0;i<keys.length;i++)clean.put(keys[i],
            vInt(input,keys[i],limits[i][2],limits[i][0],limits[i][1]));
        for(String key:new String[]{"resultsOrientation","menuOrientation"}){
            String value=input.optString(key,"vertical");
            if("menuOrientation".equals(key)&&!input.has(key))value="horizontal";
            clean.put(key,"horizontal".equals(value)?"horizontal":"vertical");
        }
        for(String key:new String[]{"resultsBgMode","menuBgMode"}){
            clean.put(key,"light".equals(input.optString(key,"dark"))?"light":"dark");
        }
        clean.put("showGuides",input.optBoolean("showGuides",false));
        clean.put("menuGuides",input.optBoolean("menuGuides",input.optBoolean("showGuides",false)));
        clean.put("resultsGuides",input.optBoolean("resultsGuides",input.optBoolean("showGuides",false)));
        return clean;
    }
    private void readVisualRuntime(){
        try{
            JSONObject o=new JSONObject(visualPrefsJson);
            visualMenuVertical="vertical".equals(o.optString("menuOrientation","horizontal"));
            visualResultsHorizontal="horizontal".equals(o.optString("resultsOrientation","vertical"));
            visualMenuOffsetX=o.optInt("menuOffsetX",0);
            visualMenuOffsetY=o.optInt("menuOffsetY",0);
            visualResultsOffsetX=o.optInt("resultsOffsetX",0);
            visualResultsOffsetY=o.optInt("resultsOffsetY",0);
            visualGearMenuGap=o.optInt("gearMenuGap",0);
            visualMenuItemGap=o.optInt("menuItemGap",0);
            visualResultGapBetween=o.optInt("resultGapBetween",31);
            visualHeaderY=o.optInt("headerIconY",0);
            visualHeaderX=o.optInt("headerOffsetX",0);
            visualHeaderTouchWidth=o.optInt("headerTouchWidth",35);
            visualHeaderTouchHeight=o.optInt("headerTouchHeight",30);
            visualHeaderAfterGap=o.optInt("headerAfterGap",0);
        }catch(org.json.JSONException ignored){}
    }
    private void broadcastVisualPrefs(){
        String jsCode="window.onVisualPrefs&&window.onVisualPrefs("+visualPrefsJson+")";
        js(panel,panelLoaded,jsCode);
        js(menuPanel,menuLoaded,jsCode);
        js(resultPanel,resultLoaded,jsCode);
        broadcastVisualPreview();
    }
    private void saveVisualPrefs(String raw){
        if(stopped)return;
        try{
            JSONObject cleaned=normalizeVisualPrefs(raw);
            // Overlay themes remain independent of the Home theme.
            String next=cleaned.toString();
            if(next.equals(visualPrefsJson)){
                // Acknowledge even no-op saves so the WebView can release its
                // pending local slider value after a concurrent theme change.
                broadcastVisualPrefs();
                return;
            }
            int oldX=visualResultsOffsetX,oldY=visualResultsOffsetY;
            int oldMenuBase=visualMenuBaseDp();
            visualPrefsJson=next;
            readVisualRuntime();
            getSharedPreferences("prefs",0).edit()
                .putString("visualPrefsJson",visualPrefsJson).apply();
            if(resultParams!=null&&resultRoot!=null&&wm!=null){
                updateResultHeaderGrip();
                resultParams.height=Math.max(resultParams.height,dp(minResultsHeaderHeightDp()));
                resultParams.width=dp(resultWidthDp());
                resultParams.x+=dp(visualResultsOffsetX-oldX);
                resultParams.y+=dp(visualResultsOffsetY-oldY);
                DisplayMetrics m=metrics();
                resultParams.x=Math.max(0,Math.min(Math.max(0,m.widthPixels-resultParams.width),resultParams.x));
                resultParams.y=Math.max(0,Math.min(Math.max(0,m.heightPixels-resultParams.height),resultParams.y));
                try{wm.updateViewLayout(resultRoot,resultParams);}
                catch(Exception e){recordFailure("editor posição resultados",e);}
                moveDetail();
            }
            if(menuExpanded&&menuParams!=null){
                menuDrawHeight=-1;menuDrawWidth=-1;
                menuRequestedHeightDp=visualMenuBaseDp()+
                    Math.max(0,menuRequestedHeightDp-oldMenuBase);
                updateMenuPosition();
            }
            broadcastVisualPrefs();
        }catch(org.json.JSONException e){
            BugReport.log(this,"UX","Configuração visual inválida");
        }
    }
    private void syncHomeThemeVisual(boolean broadcast){ } // Legacy action is now Home-only.
    private String visualEditorPreview="";
    private void setVisualEditorPreview(String area){
        String next="menu".equals(area)||"results".equals(area)?area:"";
        if(next.equals(visualEditorPreview))return;
        visualEditorPreview=next;broadcastVisualPreview();
    }
    private void broadcastVisualPreview(){
        String code="window.onVisualEditorPreview&&window.onVisualEditorPreview('"+visualEditorPreview+"')";
        js(panel,panelLoaded,code);js(menuPanel,menuLoaded,code);js(resultPanel,resultLoaded,code);
    }
    private int dockDp(){return spriteSize+8;}
    private int resultWidthDp(){
        if(visualResultsHorizontal&&!resultCollapsed){
            // Never cover the full screen with an invisible touch-blocking overlay
            // when the site returned only one or two Pokemon.
            int columns=Math.max(1,Math.min(5,count()));
            int perCard=dockDp()+resultMetadataWidthDp;
            // CSS flex gap occupies additional real width between cards.
            // Reserve 2dp for fractional WebView measurement/rounding.
            int width=perCard*columns+visualResultGapBetween*(columns-1)+2;
            return Math.max(dockDp(),Math.min(screenWidthDp()-16,width));
        }
        return dockDp()+resultMetadataWidthDp;
    }
    private String resultDisplayOptionsJson(){
        return "{\"count\":"+resultShowCount+
            ",\"name\":"+resultShowName+",\"number\":"+resultShowNumber+
            ",\"gender\":"+resultShowGender+",\"size\":"+resultShowSize+
            ",\"form\":"+resultShowForm+",\"moves\":"+resultShowMoves+
            ",\"location\":"+resultShowLocation+",\"distance\":"+resultShowDistance+
            ",\"shiny\":"+resultShowShiny+",\"cp\":"+resultShowCp+
            ",\"level\":"+resultShowLevel+",\"despawn\":"+showTimers+
            ",\"iv\":"+showResultText+",\"overallRank\":"+resultShowOverallRank+
            ",\"speciesIvRank\":"+resultShowSpeciesIvRank+
            ",\"rawIv\":"+resultShowRawIv+
            ",\"overallRankGl\":"+resultShowOverallRankGl+",\"overallRankUl\":"+resultShowOverallRankUl+
            ",\"overallRankMl\":"+resultShowOverallRankMl+
            ",\"speciesIvRankGl\":"+resultShowSpeciesIvRankGl+",\"speciesIvRankUl\":"+resultShowSpeciesIvRankUl+
            ",\"speciesIvRankMl\":"+resultShowSpeciesIvRankMl+"}";
    }
    private int menuDp(){return visualMenuVertical?
        Math.max(1,Math.min(198,screenWidthDp()-8)):
        Math.max(1,Math.min(330,screenWidthDp()-8));} // twelve compact icons, single-row thin menu
    private final Handler handler=new Handler(Looper.getMainLooper());
    private WindowManager wm;
    private WindowManager.LayoutParams params,detailParams,menuParams,resultParams;
    private FrameLayout root,detailRoot,menuRoot,resultRoot;
    private View grip;
    private WebView panel,detailPanel,website,menuPanel,resultPanel;
    private View resultGrip;
    private boolean menuExpanded=false,menuLeft=false,minimized=false,shiny=false,loaded=false,panelLoaded=false,menuLoaded=false,detailLoaded=false,stopped=false;
    private int height=32,detailHeight=225,requestGeneration=0,selected=-1,intervalMinutes=5,menuPadDp=0;
    private boolean deferMenuSync=false;
    private boolean resultLoaded=false,resultCollapsed=false;
    private int menuDrawX=Integer.MIN_VALUE,menuDrawY=Integer.MIN_VALUE,menuDrawHeight=-1,menuDrawWidth=-1;
    // Keep the requested popup height independent from the clipped current window height.
    private int menuRequestedHeightDp=MENU_BASE_DP;
    private boolean popupAbove=false;
    private int popupOffsetDp=-1,popupRoomDp=-1;
    private String probeScriptCache;
    private boolean searchInProgress=false;
    private boolean loginPaused=false;
    // PL-02: a UI selection and an already submitted query are distinct.
    private boolean queuedManualRefresh=false;
    private int submittedSearchGeneration=-1,submittingSearchGeneration=-1,watchdogGeneration=-1;
    private long submitAttemptAtMs=0L;
    // Recovery watchdog (not a search rate limit).
    private static final long SEARCH_WATCHDOG_MS=90_000L;
    private final Runnable searchWatchdog=()->{
        if(stopped||loginPaused||!searchInProgress||watchdogGeneration!=requestGeneration)return;
        guardSubmittedSearchBeforeReplacement();
        // Invalidate every callback still held by WebView. A late collect
        // after the timeout must never publish cards or trigger alerts.
        ++requestGeneration;
        searchInProgress=false;
        confirmedSubmittedFiltersGeneration=-1;
        searchFailure("⚠ Tempo limite","O navegador não concluiu a consulta. Tente atualizar.");
    };
    private boolean pickerOpen=false;
    private final Runnable queuedRefresh=()->refresh(false);
    private final Runnable filterChangeRefresh=()->refresh(true);
    private void scheduleFilterChangeRefresh(){
        // Debounce UI-only changes. The latest selection always wins; never
        // submit one Search per tap during fast Raw/IV%/GL/UL transitions.
        handler.removeCallbacks(filterChangeRefresh);
        handler.postDelayed(filterChangeRefresh,240L);
    }
    private int pageLoadGeneration=-1;
    private int pendingPageRefreshGeneration=-1;
    private int pendingLoginRefreshGeneration=-1;
    private int pendingReloadGeneration=-1;
    private final Runnable pageFinishedRefresh=()->{
        if(!stopped&&!loginPaused&&loaded&&!searchInProgress&&
            pendingPageRefreshGeneration==requestGeneration)refresh(false);
    };
    private final Runnable loginEndRefresh=()->{
        if(!stopped&&!loginPaused&&!pickerOpen&&
            pendingLoginRefreshGeneration==requestGeneration)refresh(false);
    };
    private final Runnable deferredSessionReload=()->{
        if(stopped||loginPaused||pendingReloadGeneration!=requestGeneration)return;
        if(website!=null)website.loadUrl("https://pogocoordinates.com/search");
    };
    private void cancelSessionCallbacks(){
        handler.removeCallbacks(queuedRefresh);
        handler.removeCallbacks(filterChangeRefresh);
        handler.removeCallbacks(searchWatchdog);
        handler.removeCallbacks(periodic);
        handler.removeCallbacks(expiryRefresh);
        handler.removeCallbacks(pageFinishedRefresh);
        handler.removeCallbacks(loginEndRefresh);
        handler.removeCallbacks(deferredSessionReload);
    }
    // Never enforce an artificial minimum interval after changing IV / GL / UL.
    // One active native request and upstream policy remain authoritative.
    private static final long RESULT_PREVIEW_CACHE_TTL_MS=120_000L;
    private long nextScheduledSearchAtMs=0L;
    private long lastSearchStartMs=0L;
    private boolean shinyVerified=false;
    private boolean shinyLoginPromptRequested=false;
    private boolean shinyLoginWindowOpened=false;
    private boolean firstStart=true;
    private boolean locationEnabled=false;
    private boolean locationVerified=false; // true only after DOM verification for current search
    private String locationCoords="";
    private int locationRadius=0;
    private boolean locationEditorOpen=false;
    private boolean showTimers=false,alerts=false,showResultText=false;
    // Display-only preferences: they must never change remote search filters.
    private boolean resultShowName=false,resultShowNumber=false,resultShowGender=false,
        resultShowSize=false,resultShowForm=false,resultShowMoves=false,
        resultShowLocation=false,resultShowDistance=false,resultShowShiny=false;
    private boolean resultShowCount=false,resultShowCp=false,resultShowLevel=false,
        resultShowOverallRank=false,resultShowSpeciesIvRank=false,resultShowRawIv=false,
        resultShowOverallRankGl=false,resultShowOverallRankUl=false,resultShowOverallRankMl=false,
        resultShowSpeciesIvRankGl=false,resultShowSpeciesIvRankUl=false,resultShowSpeciesIvRankMl=false;
    private int resultMetadataWidthDp=0;
    private String alertsMode="off"; // off / on / silent, separate from favorite opt-in
    private String sort="site"; // Follow the ten results returned by the site, not an inverted local despawn sort.
    private long lastAlertAt=0L;
    private final java.util.Set<String> knownSpawns=new java.util.HashSet<>();
    private long armedDespawnMillis=0L;
    private final Runnable expiryRefresh=new Runnable(){
        @Override public void run(){
            armedDespawnMillis=0L;
            if(stopped)return;
            // Expiration is local and must clean sprites even during a slow
            // remote query, while the hidden collector loads or during login.
            try{
                JSONArray old=new JSONArray(results),active=new JSONArray();
                long now=System.currentTimeMillis();
                for(int i=0;i<old.length();i++){
                    JSONObject card=old.optJSONObject(i);
                    if(card==null)continue;
                    long expiry=card.optLong("expiresAtMs",Long.MAX_VALUE);
                    if(expiry>now)active.put(card);
                }
                boolean expired=active.length()!=old.length();
                if(expired){
                    // Despawn is authoritative locally: remove expired sprites at
                    // once, before requesting any new site results.
                    results=active.toString();hideDetails();update();
                }
                armNextDespawn(active);
                if(expired&&!stopped&&!loginPaused){
                    // Independent of AUTO/OFF: reload when a spawn expires so
                    // newly available matches replace the expired entry.
                    // Reset the periodic timer to avoid a duplicate scheduled
                    // request immediately after this despawn refresh.
                    schedulePeriodic();
                    if(searchInProgress)queuedManualRefresh=true;
                    else refresh(true); // If not loaded, onPageFinished restarts it.
                }
            }catch(Exception e){recordFailure("limpar vencidos",e);}
        }
    };
    private void armNextDespawn(JSONArray cards){
        handler.removeCallbacks(expiryRefresh);
        armedDespawnMillis=0L;
        long now=System.currentTimeMillis(),next=Long.MAX_VALUE;
        if(cards==null)return;
        for(int i=0;i<cards.length();i++){
            JSONObject card=cards.optJSONObject(i);
            if(card==null)continue;
            String timer=card.optString("despawn","");
            String[] parts=timer.split(":");
            if(parts.length!=2)continue;
            try{
                long seconds=Long.parseLong(parts[0])*60L+Long.parseLong(parts[1]);
                if(seconds<=0||seconds>86400)continue;
                long readAt=card.optLong("sampledAt",now);
                long deadline=readAt+seconds*1000L;
                if(deadline>now&&deadline<next)next=deadline;
            }catch(NumberFormatException ignored){}
        }
        if(next==Long.MAX_VALUE)return;
        armedDespawnMillis=next;
        handler.postDelayed(expiryRefresh,Math.max(250L,next-now+150L));
    }
    private String mode="raw",results="[]",status="Conectando...",searchPhase="idle";
    // Provenance of the last site-confirmed result set, not the pending filter.
    // Never relabel previous Pokémon with the new mode while validation fails.
    private String shownMode="raw",shownConfigJson="{}";
    private boolean shownShiny=false,resultsStale=false;
    // In-memory only: previews are from confirmed searches, never fresh results.
    private static final class FilterPreview{
        final String results,sourceMode,sourceConfig;
        final boolean sourceShiny;
        final long confirmedAtMs;
        FilterPreview(String cards,String mode,String config,boolean shiny,long at){
            results=cards;sourceMode=mode;sourceConfig=config;sourceShiny=shiny;confirmedAtMs=at;
        }
    }
    private final java.util.LinkedHashMap<String,FilterPreview> recentFilterPreviews=
        new java.util.LinkedHashMap<String,FilterPreview>(8,0.75f,true){
            @Override protected boolean removeEldestEntry(java.util.Map.Entry<String,FilterPreview> eldest){
                return size()>8;
            }
        };
    private String filterPreviewKey(){
        return mode+"|"+shiny+"|"+locationEnabled+"|"+locationCoords+"|"+
            locationRadius+"|"+filterConfigJson();
    }
    private void rememberConfirmedPreview(JSONArray cards,long now){
        if(cards==null)return;
        recentFilterPreviews.put(filterPreviewKey(),
            new FilterPreview(cards.toString(),shownMode,shownConfigJson,shownShiny,now));
    }
    // Only show still-existing Pokémon from earlier confirmed results.
    // Never trigger alerts or claim that this preview is a new site search.
    private boolean restoreFilterPreview(){
        FilterPreview cached=recentFilterPreviews.get(filterPreviewKey());
        if(cached==null)return false;
        long now=System.currentTimeMillis();
        if(now<cached.confirmedAtMs||now-cached.confirmedAtMs>RESULT_PREVIEW_CACHE_TTL_MS){
            recentFilterPreviews.remove(filterPreviewKey());return false;
        }
        try{
            JSONArray previous=new JSONArray(cached.results),alive=new JSONArray();
            for(int i=0;i<previous.length();i++){
                JSONObject card=previous.optJSONObject(i);
                if(card==null)continue;
                long expiry=card.optLong("expiresAtMs",Long.MAX_VALUE);
                if(expiry>now)alive.put(card);
            }
            results=alive.toString();
            shownMode=cached.sourceMode;shownConfigJson=cached.sourceConfig;
            shownShiny=cached.sourceShiny;resultsStale=true;
            armNextDespawn(alive);
            return true;
        }catch(org.json.JSONException ignored){
            recentFilterPreviews.remove(filterPreviewKey());return false;
        }
    }
    // Independent parameters remain intact when switching between search modes.
    private int rawAttack=15,rawDefense=15,rawStamina=15,glRank=1,ulRank=1,ivPercentMin=0,ivPercentMax=100;
    // Additional optional search criteria belong to the active site session, not to the toolbar.
    private String extraFiltersJson="{}";
    // Evidence of checked website filters belongs only to the active search.
    private int confirmedSubmittedFiltersGeneration=-1;
    private String filterConfigJson(){
        JSONObject config=new JSONObject();
        try{
            config.put("attack",rawAttack);config.put("defense",rawDefense);
            config.put("stamina",rawStamina);config.put("glRank",glRank);
            config.put("ulRank",ulRank);config.put("percentMin",ivPercentMin);
            config.put("percentMax",ivPercentMax);
            JSONObject extra=new JSONObject(extraFiltersJson);
            java.util.Iterator<String> keys=extra.keys();
            while(keys.hasNext()){String key=keys.next();config.put(key,extra.get(key));}
        }catch(org.json.JSONException ignored){}
        return config.toString();
    }
    // The three raw IV stats each span 0–15, so the displayed IV% can take
    // only these 46 rounded values from an integer sum of 0..45.
    private static int ivPercentageForSum(int sum){
        return Math.round(sum*100f/45f);
    }
    private static boolean isAllowedIvPercent(int value){
        for(int total=0;total<=45;total++)
            if(ivPercentageForSum(total)==value)return true;
        return false;
    }
    private static int floorIvPercent(int value){
        int candidate=0;
        for(int total=0;total<=45;total++){
            int percent=ivPercentageForSum(total);
            if(percent>value)break;
            candidate=percent;
        }
        return candidate;
    }
    private static int ceilIvPercent(int value){
        for(int total=0;total<=45;total++){
            int percent=ivPercentageForSum(total);
            if(percent>=value)return percent;
        }
        return 100;
    }
    private static boolean within(int value,int min,int max){return value>=min&&value<=max;}

    private float startRawX,startRawY;
    private int startX,startY;
    private boolean dragged=false;
    private final Runnable periodic=new Runnable(){
        @Override public void run(){
            if(stopped||loginPaused||intervalMinutes<=0)return;
            refresh();
            if(!stopped&&!loginPaused&&intervalMinutes>0)handler.postDelayed(this,intervalMinutes*60000L);
        }
    };
    private void schedulePeriodic(){
        handler.removeCallbacks(periodic);
        if(!stopped&&!loginPaused&&intervalMinutes>0)handler.postDelayed(periodic,intervalMinutes*60000L);
    }
    private int dp(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
    private DisplayMetrics metrics(){
        DisplayMetrics m=new DisplayMetrics();
        wm.getDefaultDisplay().getMetrics(m);
        return m;
    }
    private int screenWidthDp(){DisplayMetrics m=metrics();return Math.round(m.widthPixels/m.density);}
    private int screenHeightDp(){DisplayMetrics m=metrics();return Math.round(m.heightPixels/m.density);}
    // Exception messages may contain account data or locations. Export only stage and class.
    private void recordFailure(String stage,Exception error){
        BugReport.log(this,"OVERLAY",stage+" · "+error.getClass().getSimpleName());
    }
    private void js(WebView web,boolean ready,String code){
        if(web!=null&&ready)web.evaluateJavascript(code,null);
    }
    private int count(){
        try{return new JSONArray(results).length();}catch(Exception e){recordFailure("contar resultados",e);return 0;}
    }
    private int rowDp(){
        // UX-SPRITE-01: one equal-height, nonoverlapping slot per Pokemon.
        // Keep a minimal 3dp breathing room in P/M/G without cropping sprites.
        return spriteSize+3;
    }
    private void update(){
        // Result count changes the native horizontal hit area, not only the HTML.
        if(visualResultsHorizontal&&resultParams!=null&&resultParams.width!=dp(resultWidthDp()))
            updateResultsWidth();
        String data="window.onNativeData("+results+","+JSONObject.quote(status)+","+
                JSONObject.quote(mode)+","+(shiny&&shinyVerified)+","+rowDp()+","+intervalMinutes+","+spriteSize+","+showTimers+",false,"+alerts+","+(WatchAlerts.watched(this).size()>0)+","+(shiny&&!shinyVerified)+","+Math.max(rowDp()*2,Math.min(rowDp()*10,screenHeightDp()-52))+","+locationEnabled+","+JSONObject.quote(locationEnabled?locationCoords:"")+","+locationRadius+","+JSONObject.quote(alertsMode)+","+filterConfigJson()+","+JSONObject.quote(shownMode)+","+shownConfigJson+","+shownShiny+","+resultsStale+","+nextScheduledSearchAtMs+","+searchInProgress+","+showResultText+","+getSharedPreferences("prefs",0).getString("menuUiPrefs","{}")+","+(locationEnabled&&locationVerified)+","+screenHeightDp()+","+resultDisplayOptionsJson()+","+WatchAlerts.permissionGranted(this)+","+WatchAlerts.enabled(this)+","+JSONObject.quote(searchPhase)+","+
                JSONObject.quote(WatchAlerts.mode(this))+","+
                WatchAlerts.hasCustomTone(this,false)+","+
                WatchAlerts.hasCustomTone(this,true)+","+
                WatchAlerts.speciesToneCount(this)+","+
                // FILTERS-POGO-06: show "Aplicado" only after THIS generation
                // was verified, submitted, and collected from the live website.
                (confirmedSubmittedFiltersGeneration==requestGeneration&&
                 submittedSearchGeneration==requestGeneration&&
                 !searchInProgress&&!resultsStale&&
                 ("updated".equals(searchPhase)||"empty".equals(searchPhase)))+")";
        js(panel,panelLoaded,data);
        js(menuPanel,menuLoaded,data);
        js(resultPanel,resultLoaded,data);
        broadcastVisualPrefs();
        if(selected>=0)showDetails(selected);
    }
    private void status(String s){
        status=s;
        getSharedPreferences("prefs",0).edit().putString("lastStatus",s).apply();
        update();
        // Only one manual retry survives an in-progress search. Dispatch it
        // after the search ends, never concurrently with remote submission.
        if(!searchInProgress&&queuedManualRefresh&&!stopped&&!loginPaused){
            queuedManualRefresh=false;
            final int queuedGeneration=requestGeneration;
            handler.postDelayed(()->{
                if(!stopped&&!loginPaused&&queuedGeneration==requestGeneration)refresh(true);
            },250L);
        }
    }
    private void guardSubmittedSearchBeforeReplacement(){
        if(!searchInProgress)return;
        // The current result belongs to the old generation; never publish
        // it under a newly selected mode. There is no 60-second wait.
        if(submittedSearchGeneration==requestGeneration||
            submittingSearchGeneration==requestGeneration)
            BugReport.log(this,"SEARCH_REPLACED","Consulta anterior invalidada por novo filtro");
    }
    private void replaceActiveFilterSearch(){
        // Logical cancel only; a previously submitted HTTP request may still
        // finish upstream, so keep a conservative remote drain guard.
        guardSubmittedSearchBeforeReplacement();
        ++requestGeneration;
        searchInProgress=false;
        queuedManualRefresh=false;
        confirmedSubmittedFiltersGeneration=-1;
        nextScheduledSearchAtMs=0L;
        handler.removeCallbacks(searchWatchdog);
        handler.removeCallbacks(queuedRefresh);
        handler.removeCallbacks(filterChangeRefresh);
    }
    private void diagnosticError(String s){
        getSharedPreferences("prefs",0).edit().putString("lastError",s).apply();
        BugReport.log(this,"ERROR",s);
        status(s);
    }
    private void searchFailure(String shortReason,String detail){
        searchPhase="error";
        // Show one concise message; keep the detailed diagnosis for the ⚠ report.
        getSharedPreferences("prefs",0).edit().putString("lastError",detail).apply();
        BugReport.log(this,"FILTER",detail);
        if(count()>0)resultsStale=true;
        status(shortReason+(count()>0?" · resultados anteriores":""));
    }
    private void updateWindow(){
        if(wm!=null&&root!=null&&params!=null){
            try{wm.updateViewLayout(root,params);}catch(Exception e){recordFailure("reposicionar dock",e);}
        }
        updateMenuPosition();
    }
    private void updateMenuPosition(){
        if(!menuExpanded||menuRoot==null||menuParams==null||params==null||wm==null)return;
        DisplayMetrics d=metrics();
        int screen=d.widthPixels, bottom=d.heightPixels, width=dp(menuDp());
        int menuBase=visualMenuBaseDp();
        int gap=dp(visualGearMenuGap);
        // Rotation and window switching can change the available screen width.
        // Keep the native hit area aligned with the 12 visible toolbar buttons.
        if(menuParams.width!=width)menuParams.width=width;
        boolean right=params.x+dp(dockDp())+gap+width<=screen;
        boolean left=params.x-width-gap>=0;
        int priorPad=menuPadDp;
        boolean priorLeft=menuLeft;
        int rowY;
        if(right||left){
            menuLeft=!right;
            menuParams.x=right?params.x+dp(dockDp())+gap:params.x-width-gap;
            rowY=params.y;
        }else{
            // Keep the one-row toolbar next to, never ON TOP of, the gear.
            menuLeft=params.x+dp(dockDp())/2>screen/2;
            menuParams.x=Math.max(0,Math.min(screen-width,
                params.x+dp(dockDp())/2-width/2));
            int below=params.y+dp(TOOLBAR_DP);
            int above=params.y-dp(menuBase);
            rowY=above>=0?above:below;
        }
        // Never let the toolbar or its touch targets drift outside the display
        // after dragging, returning from the keyboard, or rotating the device.
        menuParams.x=Math.max(0,Math.min(Math.max(0,screen-width),
            menuParams.x+dp(visualMenuOffsetX)));
        rowY=Math.max(0,Math.min(Math.max(0,bottom-dp(menuBase)),rowY+dp(visualMenuOffsetY)));
        menuPadDp=0; // Results remain in their own separate native overlay.

        // The old resize/clamp moved the entire toolbar when a long numeric
        // picker opened. Preserve rowY and expand the touchable window ABOVE
        // or BELOW it without moving the row under the user's finger.
        int rowHeight=dp(menuBase);
        int requestedPopup=Math.max(0,dp(menuRequestedHeightDp)-rowHeight);
        int roomAbove=Math.max(0,rowY);
        int roomBelow=Math.max(0,bottom-(rowY+rowHeight)-dp(5));
        boolean abovePopup=requestedPopup>roomBelow&&roomAbove>roomBelow;
        int available=abovePopup?roomAbove:roomBelow;
        int actualPopup=Math.min(requestedPopup,available);
        menuParams.height=rowHeight+actualPopup;
        menuParams.y=Math.max(0,Math.min(bottom-menuParams.height,
            rowY-(abovePopup?actualPopup:0)));

        int offsetDp=abovePopup?Math.round(actualPopup/d.density):0;
        int roomDp=requestedPopup==0?420:Math.max(0,Math.round(actualPopup/d.density)-5);
        if(menuDrawX!=menuParams.x||menuDrawY!=menuParams.y||
           menuDrawHeight!=menuParams.height||menuDrawWidth!=menuParams.width){
            try{
                wm.updateViewLayout(menuRoot,menuParams);
                menuDrawX=menuParams.x;menuDrawY=menuParams.y;
                menuDrawHeight=menuParams.height;menuDrawWidth=menuParams.width;
            }catch(Exception e){recordFailure("posicionar menu",e);}
        }
        if(popupAbove!=abovePopup||popupOffsetDp!=offsetDp||popupRoomDp!=roomDp){
            popupAbove=abovePopup;popupOffsetDp=offsetDp;popupRoomDp=roomDp;
            js(menuPanel,menuLoaded,"window.setMenuPopupPlacement("+
                abovePopup+","+offsetDp+","+roomDp+")");
        }
        if((priorPad!=menuPadDp||priorLeft!=menuLeft)&&!deferMenuSync){
            String edge=JSONObject.quote(menuLeft?"left":"right");
            js(panel,panelLoaded,"window.syncMenu(true,"+edge+","+menuPadDp+")");
            js(menuPanel,menuLoaded,"window.syncMenu(true,"+edge+",0)");
            moveDetail();
        }
    }
    private void resizeMenu(int desiredDp){
        if(!menuExpanded||menuParams==null||menuRoot==null)return;
        int maxMenuHeight=Math.max(visualMenuBaseDp(),Math.min(450,screenHeightDp()-24));
        menuRequestedHeightDp=Math.max(visualMenuBaseDp(),Math.min(maxMenuHeight,desiredDp));
        // Always recompute placement from the untruncated size, including after a drag
        // or switching between a tall cascade and a short settings strip.
        updateMenuPosition();
    }
    private void locationEditor(boolean open){
        locationEditorOpen=open;
        if(menuParams==null||menuRoot==null||wm==null)return;
        final int base=WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL;
        final int unfocusable=WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
        if(open){
            menuParams.flags=(menuParams.flags|base)&~unfocusable;
            menuParams.softInputMode=WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE;
        }else{
            menuParams.flags|=unfocusable|base;
            menuParams.softInputMode=0;
            if(menuPanel!=null){
                android.view.inputmethod.InputMethodManager keyboard=
                    (android.view.inputmethod.InputMethodManager)getSystemService(INPUT_METHOD_SERVICE);
                if(keyboard!=null)keyboard.hideSoftInputFromWindow(menuPanel.getWindowToken(),0);
                menuPanel.clearFocus();
            }
        }
        try{wm.updateViewLayout(menuRoot,menuParams);}catch(Exception e){recordFailure("atualizar menu",e);}
        updateMenuPosition(); // a keyboard/focus transition must not leave controls clipped
        if(open&&menuPanel!=null){
            menuPanel.setFocusableInTouchMode(true);
            menuPanel.requestFocus();
        }
    }
    private String locationPayload(){
        JSONObject data=new JSONObject();
        try{
            data.put("enabled",locationEnabled);
            data.put("coords",locationEnabled?locationCoords:"");
            data.put("radius",locationEnabled?locationRadius:0);
        }catch(Exception e){recordFailure("preparar filtro de localização",e);}
        return data.toString();
    }
    private void moveDetail(){
        if(detailRoot==null||detailParams==null||params==null)return;
        int w=screenWidthDp(),h=screenHeightDp(),gap=5;
        // The details card follows the independently positioned result layer.
        int dockPos=(resultParams!=null?resultParams.x:params.x)/dp(1);
        int right=dockPos+resultWidthDp()+gap;
        int left=dockPos-DETAIL_DP-gap;
        int preferred=right+DETAIL_DP<=w-4?right:left;
        detailParams.x=dp(Math.max(0,Math.min(w-DETAIL_DP,preferred)));
        int dockY=(resultParams!=null?resultParams.y:params.y)/dp(1)+RESULTS_HEADER_DP;
        detailParams.y=dp(Math.max(0,Math.min(h-detailHeight-45,dockY+18)));
        try{wm.updateViewLayout(detailRoot,detailParams);}catch(Exception e){recordFailure("reposicionar detalhes",e);}
    }
    private void newWebsite(){
        website=new WebView(this);
        website.getSettings().setJavaScriptEnabled(true);
        website.getSettings().setDomStorageEnabled(true);
        website.getSettings().setDatabaseEnabled(true);
        website.setAlpha(0);
        website.setFocusable(false);
        website.setClickable(false);
        website.setOnTouchListener((v,e)->true);
        website.getSettings().setAllowContentAccess(false);
        website.getSettings().setAllowFileAccess(false);
        website.getSettings().setAllowFileAccessFromFileURLs(false);
        website.getSettings().setAllowUniversalAccessFromFileURLs(false);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(website,true);
        root.addView(website,new FrameLayout.LayoutParams(dp(390),dp(690),Gravity.TOP|Gravity.LEFT));
        website.setWebViewClient(new WebViewClient(){
            @Override public void onPageStarted(WebView view,String url,android.graphics.Bitmap favicon){
                if(view!=website||stopped)return;
                if(loginPaused){pageLoadGeneration=-1;return;}
                pageLoadGeneration++;
                pendingPageRefreshGeneration=-1;
                loaded=false;
                handler.removeCallbacks(pageFinishedRefresh);
                // React document replacement invalidates partially configured
                // form fields. Submitted searches instead retain their polling.
                if(searchInProgress&&submittedSearchGeneration!=requestGeneration&&
                   submittingSearchGeneration!=requestGeneration)
                    replaceActiveFilterSearch();
            }
            @Override public void onPageFinished(WebView view,String url){
                if(view!=website||stopped||loginPaused)return;
                // A navigation epoch is independent of filter requestGeneration.
                // Ignore redirects from older pages and foreign origins.
                if(url!=null&&url.startsWith("https://pogocoordinates.com/")&&
                   (view.getUrl()==null||url.equals(view.getUrl())||
                    (view.getProgress()==100&&view.getUrl().startsWith("https://pogocoordinates.com/")))){
                    loaded=true;
                    handler.removeCallbacks(pageFinishedRefresh);
                    pendingPageRefreshGeneration=searchInProgress?-1:requestGeneration;
                    if(!searchInProgress)handler.postDelayed(pageFinishedRefresh,2500L);
                    if(shiny&&!shinyVerified){
                        // The site is visible to JS now. Confirm the Shiny state
                        // as soon as the tab is hydrated, not after a new Search.
                        final int generation=requestGeneration;
                        handler.postDelayed(()->{
                            if(!stopped&&!loginPaused&&loaded&&!searchInProgress&&
                               shiny&&!shinyVerified&&generation==requestGeneration)
                                prepareImmediateShiny(generation);
                        },420L);
                    }
                }
            }
            @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error){
                if(!request.isForMainFrame()||stopped)return;
                loaded=false;
                guardSubmittedSearchBeforeReplacement();
                searchInProgress=false;
                queuedManualRefresh=false;
                ++requestGeneration;
                cancelSessionCallbacks();
                BugReport.log(OverlayService.this,"NETWORK","Falha de navegação principal; código="+error.getErrorCode());
                status("Não foi possível carregar PoGoCoordinates. Confira conexão e tente ↻.");
            }
        });
    }
    @Override public void onCreate(){
        super.onCreate();
        if (!IntegrityGuard.verify(this)) {
            BugReport.log(this,"SECURITY","Falha de integridade do pacote");
            android.widget.Toast.makeText(this,"Cópia não autorizada ou inválida",android.widget.Toast.LENGTH_LONG).show();
            stopSelf();
            return;
        }
        NotificationManager nm=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
        nm.createNotificationChannel(new NotificationChannel("pokesearch","PokeSearch",
                NotificationManager.IMPORTANCE_LOW));
        PendingIntent pi=PendingIntent.getActivity(this,0,new Intent(this,MainActivity.class),
                PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
        Notification note=new Notification.Builder(this,"pokesearch")
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle("PokeSearch ativo")
                .setContentText("Toque para abrir PokeSearch")
                .setContentIntent(pi).setOngoing(true).build();
        startForeground(73,note);
        FirebaseStats.setOverlayVisible(this,true);
        wm=(WindowManager)getSystemService(WINDOW_SERVICE);
        try{visualPrefsJson=normalizeVisualPrefs(
            getSharedPreferences("prefs",0).getString("visualPrefsJson","{}")).toString();}
        catch(org.json.JSONException ignored){visualPrefsJson="{}";}
        syncHomeThemeVisual(false);
        readVisualRuntime();
        root=new FrameLayout(this);
        root.setBackgroundColor(Color.TRANSPARENT);
        root.setClipChildren(true);
        newWebsite();
        panel=new WebView(this);
        panel.setBackgroundColor(Color.TRANSPARENT);
        panel.getSettings().setJavaScriptEnabled(true);
        panel.getSettings().setAllowContentAccess(false);
        panel.getSettings().setAllowFileAccessFromFileURLs(false);
        panel.getSettings().setAllowUniversalAccessFromFileURLs(false);
        panel.addJavascriptInterface(new Bridge(),"Native");
        root.addView(panel,new FrameLayout.LayoutParams(-1,-1));
        panel.setWebViewClient(new WebViewClient(){
            @Override public void onPageFinished(WebView v,String url){
                if(url!=null&&url.startsWith("file:///android_asset/")){
                    panelLoaded=true;update();
                }
            }
        });
        grip=new View(this);
        grip.setBackgroundColor(Color.TRANSPARENT);
        grip.setOnTouchListener((v,event)->{
            if(params==null)return true;
            switch(event.getActionMasked()){
                case MotionEvent.ACTION_DOWN:
                    startRawX=event.getRawX();startRawY=event.getRawY();
                    startX=params.x;startY=params.y;dragged=false;return true;
                case MotionEvent.ACTION_MOVE:
                    int dx=Math.round(event.getRawX()-startRawX);
                    int dy=Math.round(event.getRawY()-startRawY);
                    if(Math.abs(dx)+Math.abs(dy)>dp(4))dragged=true;
                    if(dragged){
                        DisplayMetrics d=metrics();
                        int winWidth=dp(minimized?BUBBLE_DP:dockDp());
                        int winHeight=dp(minimized?BUBBLE_DP:height);
                        params.x=Math.max(0,Math.min(d.widthPixels-winWidth,startX+dx));
                        params.y=Math.max(0,Math.min(d.heightPixels-winHeight,startY+dy));
                        updateWindow();moveDetail();
                    }
                    return true;
                case MotionEvent.ACTION_UP:
                    // The same gear is the drag handle and menu toggle.
                    if(!dragged){
                        if(minimized)minimize(false);
                        else menu(!menuExpanded);
                    }
                    return true;
                case MotionEvent.ACTION_CANCEL:return true;
            }
            return true;
        });
        root.addView(grip,new FrameLayout.LayoutParams(dp(dockDp()),dp(30),Gravity.TOP|Gravity.LEFT));

        params=new WindowManager.LayoutParams(dp(dockDp()),dp(height),
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
                PixelFormat.TRANSLUCENT);
        params.gravity=Gravity.TOP|Gravity.LEFT;
        params.x=dp(Math.max(0,screenWidthDp()-dockDp()-7));params.y=dp(120);
        try{wm.addView(root,params);}catch(Exception e){recordFailure("abrir dock",e);stopSelf();return;}

        // Dedicated 308dp-by-29dp touchable window for the toolbar.
        // Transparent regions outside this rectangle belong to Pokémon GO:
        // a single expanded WebView used to intercept every tap underneath.
        menuRoot=new FrameLayout(this);
        menuRoot.setBackgroundColor(Color.TRANSPARENT);
        menuPanel=new WebView(this);
        menuPanel.setBackgroundColor(Color.TRANSPARENT);
        menuPanel.getSettings().setJavaScriptEnabled(true);
        // LT58-MORE-STABLE: honor <meta viewport width=device-width> in the
        // toolbar-only WebView. Increasing the window height for the cascade
        // must not trigger Android WebView's overview-scale fit/reflow, which
        // made the same ten tiles shrink/grow in Samsung screenshots.
        menuPanel.getSettings().setUseWideViewPort(true);
        menuPanel.getSettings().setLoadWithOverviewMode(false);
        menuPanel.getSettings().setAllowContentAccess(false);
        menuPanel.getSettings().setAllowFileAccessFromFileURLs(false);
        menuPanel.getSettings().setAllowUniversalAccessFromFileURLs(false);
        menuPanel.addJavascriptInterface(new Bridge(),"Native");
        menuRoot.addView(menuPanel,new FrameLayout.LayoutParams(-1,-1));
        menuPanel.setWebViewClient(new WebViewClient(){
            @Override public void onPageFinished(WebView view,String url){
                if(url!=null&&url.startsWith("file:///android_asset/")){
                    menuLoaded=true;
                    update();
                    if(menuExpanded)js(menuPanel,true,"window.syncMenu(true,"+
                        JSONObject.quote(menuLeft?"left":"right")+",0)");
                }
            }
        });
        menuParams=new WindowManager.LayoutParams(dp(menuDp()),dp(visualMenuBaseDp()),
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
                PixelFormat.TRANSLUCENT);
        menuParams.gravity=Gravity.TOP|Gravity.LEFT;
        menuParams.x=0;menuParams.y=params.y;
        menuRoot.setVisibility(View.GONE);
        try{wm.addView(menuRoot,menuParams);}catch(Exception e){recordFailure("abrir controles",e);menuRoot=null;menuPanel=null;}
        if(menuPanel!=null)menuPanel.loadUrl("file:///android_asset/dock.html?controls=1");

        // The Pokémon list is always its OWN Android overlay. The gear remains
        // a small independent control even if there is only one active search.
        createResultsWindow();

        detailRoot=new FrameLayout(this);
        detailRoot.setBackgroundColor(Color.TRANSPARENT);
        detailPanel=new WebView(this);
        detailPanel.setBackgroundColor(Color.TRANSPARENT);
        detailPanel.getSettings().setJavaScriptEnabled(true);
        detailPanel.getSettings().setAllowContentAccess(false);
        detailPanel.getSettings().setAllowFileAccessFromFileURLs(false);
        detailPanel.getSettings().setAllowUniversalAccessFromFileURLs(false);
        detailPanel.addJavascriptInterface(new Bridge(),"Native");
        detailRoot.addView(detailPanel,new FrameLayout.LayoutParams(-1,-1));
        detailPanel.setWebViewClient(new WebViewClient(){
            @Override public void onPageFinished(WebView v,String url){
                if(url!=null&&url.startsWith("file:///android_asset/")){
                    detailLoaded=true;
                    if(selected>=0)showDetails(selected);
                }
            }
        });
        detailParams=new WindowManager.LayoutParams(dp(DETAIL_DP),dp(detailHeight),
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
                PixelFormat.TRANSLUCENT);
        detailParams.gravity=Gravity.TOP|Gravity.LEFT;
        detailParams.x=dp(15);detailParams.y=dp(135);
        detailRoot.setVisibility(View.GONE);
        try{wm.addView(detailRoot,detailParams);}catch(Exception e){recordFailure("abrir detalhes",e);detailRoot=null;}
        panel.loadUrl("file:///android_asset/dock.html");
        if(detailRoot!=null)detailPanel.loadUrl("file:///android_asset/detail.html");
        // Initial navigation is scheduled after cookie flush in onStartCommand.
        running=true;
    }
    private void createResultsWindow(){
        android.content.SharedPreferences prefs=getSharedPreferences("prefs",0);
        resultCollapsed=prefs.getBoolean("resultsCollapsed",false);
        resultRoot=new FrameLayout(this);
        resultRoot.setBackgroundColor(Color.TRANSPARENT);
        resultRoot.setClipChildren(true);
        resultPanel=new WebView(this);
        resultPanel.setBackgroundColor(Color.TRANSPARENT);
        resultPanel.getSettings().setJavaScriptEnabled(true);
        resultPanel.getSettings().setAllowContentAccess(false);
        resultPanel.getSettings().setAllowFileAccessFromFileURLs(false);
        resultPanel.getSettings().setAllowUniversalAccessFromFileURLs(false);
        resultPanel.addJavascriptInterface(new Bridge(),"Native");
        resultRoot.addView(resultPanel,new FrameLayout.LayoutParams(-1,-1));

        // Transparent native hit area over the league icon:
        // short tap collapses/expands; drag moves ONLY the results window.
        final float[] touchStart=new float[2];
        final int[] positionStart=new int[2];
        final boolean[] hasDragged={false};
        resultGrip=new View(this);
        resultGrip.setBackgroundColor(Color.TRANSPARENT);
        resultGrip.setOnTouchListener((view,event)->{
            if(resultParams==null||resultRoot==null||wm==null)return true;
            switch(event.getActionMasked()){
                case MotionEvent.ACTION_DOWN:
                    touchStart[0]=event.getRawX();touchStart[1]=event.getRawY();
                    positionStart[0]=resultParams.x;positionStart[1]=resultParams.y;
                    hasDragged[0]=false;
                    return true;
                case MotionEvent.ACTION_MOVE:
                    int xMove=Math.round(event.getRawX()-touchStart[0]);
                    int yMove=Math.round(event.getRawY()-touchStart[1]);
                    if(Math.abs(xMove)+Math.abs(yMove)>dp(5))hasDragged[0]=true;
                    if(hasDragged[0]){
                        DisplayMetrics m=metrics();
                        resultParams.x=Math.max(0,Math.min(m.widthPixels-resultParams.width,
                            positionStart[0]+xMove));
                        resultParams.y=Math.max(0,Math.min(m.heightPixels-resultParams.height,
                            positionStart[1]+yMove));
                        try{wm.updateViewLayout(resultRoot,resultParams);}
                        catch(Exception e){recordFailure("arrastar resultados",e);}
                        moveDetail();
                    }
                    return true;
                case MotionEvent.ACTION_UP:
                    if(!hasDragged[0])toggleResultsCollapsed();
                    else{
                        float density=getResources().getDisplayMetrics().density;
                        getSharedPreferences("prefs",0).edit()
                            .putInt("resultsX",Math.round(resultParams.x/density)-visualResultsOffsetX)
                            .putInt("resultsY",Math.round(resultParams.y/density)-visualResultsOffsetY).apply();
                    }
                    return true;
                case MotionEvent.ACTION_CANCEL:return true;
            }
            return true;
        });
        resultRoot.addView(resultGrip,new FrameLayout.LayoutParams(
            dp(35),dp(RESULTS_HEADER_DP),Gravity.TOP|Gravity.LEFT));
        updateResultHeaderGrip();

        int preferredX=Math.max(0,screenWidthDp()-2*dockDp()-35);
        int preferredY=165;
        int savedX=prefs.getInt("resultsX",preferredX);
        int savedY=prefs.getInt("resultsY",preferredY);
        resultParams=new WindowManager.LayoutParams(dp(resultWidthDp()),dp(minResultsHeaderHeightDp()),
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT);
        resultParams.gravity=Gravity.TOP|Gravity.LEFT;
        resultParams.x=dp(Math.max(0,Math.min(
            screenWidthDp()-resultWidthDp(),savedX+visualResultsOffsetX)));
        resultParams.y=dp(Math.max(0,Math.min(
            screenHeightDp()-72,savedY+visualResultsOffsetY)));
        try{wm.addView(resultRoot,resultParams);}
        catch(Exception e){
            recordFailure("criar janela independente de resultados",e);
            resultRoot=null;resultParams=null;resultLoaded=false;
            destroyWebView(resultPanel,true,"resultados indisponíveis");
            resultPanel=null;resultGrip=null;return;
        }
        resultPanel.setWebViewClient(new WebViewClient(){
            @Override public void onPageFinished(WebView web,String url){
                if(url!=null&&url.startsWith("file:///android_asset/")){
                    resultLoaded=true;
                    js(resultPanel,true,"window.setResultsCollapsed("+resultCollapsed+")");
                    update();
                }
            }
        });
        resultPanel.loadUrl("file:///android_asset/dock.html?results=1");
    }
    private int minResultsHeaderHeightDp(){
        return Math.max(RESULTS_HEADER_DP,visualHeaderY+visualHeaderTouchHeight);
    }
    // Native drag/tap hitbox follows the HTML button without enlarging the
    // transparent touch-blocking surface outside the sprite column.
    private void updateResultHeaderGrip(){
        if(resultGrip==null)return;
        int width=visualHeaderTouchWidth;
        int maxLeft=Math.max(0,dockDp()-width);
        int left=Math.max(0,Math.min(maxLeft,Math.round((dockDp()-width)/2f)+visualHeaderX));
        FrameLayout.LayoutParams box=new FrameLayout.LayoutParams(
            dp(width),dp(visualHeaderTouchHeight),Gravity.TOP|Gravity.LEFT);
        box.leftMargin=dp(left);
        box.topMargin=dp(visualHeaderY);
        resultGrip.setLayoutParams(box);
    }
    private void updateResultsWidth(){
        if(resultParams==null||resultRoot==null)return;
        resultParams.width=dp(resultWidthDp());
        resultParams.x=Math.max(0,Math.min(metrics().widthPixels-resultParams.width,resultParams.x));
        updateResultHeaderGrip();
        try{wm.updateViewLayout(resultRoot,resultParams);}
        catch(Exception e){recordFailure("redimensionar largura dos resultados",e);}
    }
    private void resizeResultsMetadata(int widthDp){
        // Data column is an optional 0–100dp beside the original sprite column.
        // Preserve the Pokéball anchor at the centre of the left sprite column.
        int safe=Math.max(0,Math.min(100,widthDp));
        if(safe==resultMetadataWidthDp)return;
        resultMetadataWidthDp=safe;
        updateResultsWidth();
        moveDetail();
    }
    private String script(){
        if(probeScriptCache!=null)return probeScriptCache;
        try(InputStream in=getAssets().open("probe.js")){
            ByteArrayOutputStream out=new ByteArrayOutputStream();
            byte[] buf=new byte[4096];int n;
            while((n=in.read(buf))!=-1)out.write(buf,0,n);
            probeScriptCache=out.toString("UTF-8");
            return probeScriptCache;
        }catch(Exception e){recordFailure("ler probe.js",e);return "null";}
    }
    private void execute(String action,Consumer<JSONObject> callback){
        if(stopped||loginPaused)return;
        // Each asynchronous JS response belongs to the session that launched it.
        // A login, page reload or replacement search invalidates stale responses.
        final int callbackGeneration=requestGeneration;
        final int callbackPage=pageLoadGeneration;
        final WebView callbackWebsite=website;
        final boolean mayNavigate="submitSearch".equals(action);
        if(!loaded||website==null){
            if(callback!=null){
                JSONObject failure=new JSONObject();
                try{failure.put("ok",false);failure.put("reason","Site indisponível");}catch(Exception ignored){}
                callback.accept(failure);
            }else status("Abra o app e faça login.");
            return;
        }
        String queryFilters=filterConfigJson();
        if("collect".equals(action)&&confirmedSubmittedFiltersGeneration==callbackGeneration){
            try{
                JSONObject validated=new JSONObject(queryFilters);
                validated.put("_preSubmitVerified",true);
                queryFilters=validated.toString();
            }catch(org.json.JSONException ignored){}
        }
        String code=script().replace("__ACTION__",JSONObject.quote(action))
                .replace("__MODE__",JSONObject.quote(mode))
                .replace("__SHINY__",shiny?"true":"false")
                .replace("__FILTERS__",queryFilters);
        try{website.evaluateJavascript(code,raw->{
            if(stopped||loginPaused||callbackGeneration!=requestGeneration||callbackWebsite!=website||(!mayNavigate&&callbackPage!=pageLoadGeneration))return;
            try{
                String decoded=new JSONArray("["+raw+"]").getString(0);
                JSONObject r=new JSONObject(decoded);
                if(callback!=null)callback.accept(r);
            }catch(Exception e){
                recordFailure("interpretar resposta JS",e);
                JSONObject failure=new JSONObject();
                try{failure.put("ok",false);failure.put("reason","Resposta inválida do navegador interno");}catch(Exception ignored){}
                if(callback!=null)callback.accept(failure);
                else diagnosticError("Falha ao ler resultados no site.");
            }
        });}catch(RuntimeException e){
            if(stopped||loginPaused||callbackGeneration!=requestGeneration||callbackWebsite!=website||(!mayNavigate&&callbackPage!=pageLoadGeneration))return;
            recordFailure("executar JS site",e);
            if(callback!=null){
                JSONObject failure=new JSONObject();
                try{failure.put("ok",false);failure.put("reason","Navegador indisponível");}catch(org.json.JSONException ignored){}
                callback.accept(failure);
            }else diagnosticError("Navegador indisponível. Tente atualizar.");
        }
    }
    private void refresh(){refresh(false);}
    private void refresh(boolean manual){
        if(stopped||loginPaused)return;
        if(searchInProgress){
            if(manual){
                queuedManualRefresh=true;
                status("↻ Nova busca agendada após a atual.");
            }
            return;
        }
        if(!loaded||website==null){
            // onPageFinished will trigger the pending refresh automatically.
            status("Carregando o site. Aguarde alguns segundos...");
            return;
        }
        // Explicit filter changes always request a new search without waiting
        // for a locally invented network cooldown.
        handler.removeCallbacks(queuedRefresh);
        nextScheduledSearchAtMs=0L;
        BugReport.log(this,"PREPARE","Filtros "+mode+" Shiny="+shiny+" manual="+manual);
        // Preserve the despawn cleanup timer while the network search is pending.
        searchInProgress=true;
        searchPhase="filling";
        if(count()>0)resultsStale=true;
        if(shiny){shinyVerified=false;update();}
        final int generation=++requestGeneration;
        // LT60-LOC-STATE-01: every new Search needs fresh Coords/Radius proof.
        // Prior cards remain untouched; only the CURRENT request loses its proof.
        locationVerified=false;
        confirmedSubmittedFiltersGeneration=-1;
        submittedSearchGeneration=-1;
        submittingSearchGeneration=-1;
        watchdogGeneration=generation;
        handler.removeCallbacks(searchWatchdog);
        handler.postDelayed(searchWatchdog,SEARCH_WATCHDOG_MS);
        status(manual?"Busca manual iniciada...":"Atualizando...");
        execute("session",session->{
            if(stopped||loginPaused||generation!=requestGeneration)return;
            final String auth=session.optString("auth","não confirmado");
            // A partially hydrated mobile page is not proof that the stored
            // authentication expired. Do not turn a verified session into
            // "login necessary" merely because the DOM is temporarily empty.
            if(!"não confirmado".equals(auth))
                getSharedPreferences("prefs",0).edit().putString("sessionStatus",auth).apply();
            // Only record a coarse authentication state, never cookies, codes or tokens.
            BugReport.log(this,"SESSION","Shiny="+shiny+" autenticação="+auth);
            if(shiny&&!siteConfirmsShinyAccount(session)){
                // Public searches remain accessible without login: turn OFF
                // Shiny and continue the same requested search, never discard it.
                revertUnverifiedShiny("✨ Shiny exige login e treinador vinculado · busca comum liberada");
                update();
            }
            execute("prepareSearch",prepared->{
                if(stopped||loginPaused||generation!=requestGeneration)return;
                if(!prepared.optBoolean("ok")){
                    searchInProgress=false;
                    searchFailure("⚠ Aba não confirmada","Não foi possível selecionar a aba de busca.");
                    return;
                }
                status("Preparando "+("raw".equals(mode)?"Raw IV":"percent".equals(mode)?"IV%":"gl".equals(mode)?"Grande Liga":"Ultra Liga")+"...");
                handler.postDelayed(()->{
                    if(stopped||loginPaused||generation!=requestGeneration)return;
                    configureSearchWithRetry(generation,manual,0);
                },600L);
            });
        });
    }
    // React dropdowns are asynchronous: opening and selecting an option cannot
    // reliably happen in a single evaluateJavascript() call.
    private void configureSearchWithRetry(int generation,boolean manual,int attempt){
        if(stopped||loginPaused||generation!=requestGeneration)return;
        execute("configureSearch",configured->{
            if(stopped||loginPaused||generation!=requestGeneration)return;
            if(configured.optBoolean("ok")&&configured.optBoolean("configured",false)){
                status("Conferindo os filtros aplicados...");
                configureLocationAndVerify(generation,manual,0);return;
            }
            if(configured.optBoolean("pending",false)&&attempt<32){
                if(attempt==0)status("Preparando filtros no site...");
                handler.postDelayed(()->configureSearchWithRetry(generation,manual,attempt+1),300L);
                return;
            }
            searchInProgress=false;
            String reason=configured.optString("reason","Controle do site indisponível");
            // Show concrete filter name; no account data or coordinates from the DOM.
            String summary=reason.replace("Filtros adicionais: ","").trim();
            if(summary.length()>38)summary=summary.substring(0,38);
            searchFailure("⚠ Filtro: "+summary,"Falha na configuração: "+reason);
        });
    }
    private void configureLocationAndVerify(int generation,boolean manual,int attempt){
        if(stopped||loginPaused||generation!=requestGeneration)return;
        String data=locationPayload();
        execute("configureLocation:"+data,configured->{
            if(stopped||loginPaused||generation!=requestGeneration)return;
            if(!configured.optBoolean("ok")){
                if(configured.optBoolean("pending",false)&&attempt<16){
                    handler.postDelayed(()->{
                        if(stopped||loginPaused||generation!=requestGeneration)return;
                        configureLocationAndVerify(generation,manual,attempt+1);
                    },350L);
                    return;
                }
                searchInProgress=false;
                searchFailure(locationEnabled?"⚠ Localização não aplicada":"⚠ Pesquisa não confirmada",
                    (locationEnabled?"Não foi possível configurar localização: ":
                    "Filtro geográfico do site não pôde ser neutralizado: ")+
                    configured.optString("reason","verifique o formulário do site."));
                return;
            }
            handler.postDelayed(()->{
                if(stopped||loginPaused||generation!=requestGeneration)return;
                execute("verifyLocation:"+data,verified->{
                if(stopped||loginPaused||generation!=requestGeneration)return;
                if(!verified.optBoolean("ok")){
                    if(attempt<12){
                        handler.postDelayed(()->configureLocationAndVerify(generation,manual,attempt+1),350L);
                        return;
                    }
                    searchInProgress=false;
                    searchFailure("⚠ Localização não confirmada",
                        "Aguardando confirmação dos dois campos Coords/Radius no site: "+
                        verified.optString("reason","estado ainda diferente")+
                        ". Pesquisa não enviada.");
                    return;
                }
                // Only confirm after the actual fields and active Coords form
                // match exactly, never merely on a user ON tap.
                // Fields were verified in the live site's DOM, but Search was
                // not submitted yet. Do not display 'applied' prematurely.
                locationVerified=false;
                update();
                verifyShinyAfterLocation(generation,manual,0);
                });
            },400L);
        });
    }
    // UX-LOC-SHINY-01: React can reset the shiny switch when selecting Coords.
    // Reapply only after verifying location, and never submit an unconfirmed filter.
    private void verifyShinyAfterLocation(int generation,boolean manual,int attempt){
        if(stopped||loginPaused||generation!=requestGeneration)return;
        if(!shiny){verifyAndSubmit(generation,manual,0);return;}
        execute("setShiny",applied->{
            if(stopped||loginPaused||generation!=requestGeneration)return;
            if(!applied.optBoolean("ok",false)){
                if(attempt<3){
                    handler.postDelayed(()->verifyShinyAfterLocation(generation,manual,attempt+1),350L);
                    return;
                }
                searchInProgress=false;
                shinyVerified=false;
                searchFailure("⚠ Shiny não aplicado", "O site não confirmou ✨ após aplicar coordenadas. Busca não enviada.");
                return;
            }
            handler.postDelayed(()->{
                if(stopped||loginPaused||generation!=requestGeneration)return;
                execute("verifyShiny",verified->{
                    if(stopped||loginPaused||generation!=requestGeneration)return;
                    if(verified.optBoolean("ok",false))verifyAndSubmit(generation,manual,0);
                    else if(attempt<3)verifyShinyAfterLocation(generation,manual,attempt+1);
                    else{
                        searchInProgress=false;
                        shinyVerified=false;
                        searchFailure("⚠ Shiny não confirmado", "O brilho não permaneceu ativo após aplicar localização. Busca não enviada.");
                    }
                });
            },250L);
        });
    }
    private void openShinyLogin(){
        if(!shinyLoginPromptRequested||shinyLoginWindowOpened||stopped)return;
        shinyLoginPromptRequested=false;
        shinyLoginWindowOpened=true;
        Intent intent=new Intent(this,MainActivity.class);
        intent.setAction("com.lucianotoscano.pokesearchoverlay.OPEN_SHINY_LOGIN");
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|
            Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP);
        try{startActivity(intent);}catch(Exception e){
            recordFailure("abrir fluxo de login",e);
            shinyLoginWindowOpened=false;
            diagnosticError("Não foi possível abrir a etapa de login/vinculação.");
        }
    }
    // Shiny is an account-specific result type: never infer linkage from a
    // cookie, Shiny switch or stored login status alone. The trainer fields
    // originate only from the verified official /profile card (HOME-04).
    private boolean hasConfirmedTrainerLink(){
        android.content.SharedPreferences p=getSharedPreferences("prefs",0);
        return "linked".equals(p.getString("profileTrainerState","unknown"))&&
            !p.getString("profileTrainerName","").trim().isEmpty()&&
            p.getString("profileTrainerCode","").matches("[0-9]{12}");
    }
    private boolean siteConfirmsShinyAccount(JSONObject session){
        return "autenticada".equals(session.optString("auth","")) &&
            (session.optBoolean("trainerLinked",false)||hasConfirmedTrainerLink());
    }
    private void revertUnverifiedShiny(String reason){
        shiny=false;
        shinyVerified=false;
        // Keep a user-initiated login prompt pending until it is opened.
        getSharedPreferences("prefs",0).edit().putBoolean("shiny",false).apply();
        status(reason);
    }
    // Shiny control and the following search never wait for a local 60s timer.
    // Site state is still verified and all JS replies use requestGeneration.
    private void applyShinyOnSite(int generation,int attempt){
        if(stopped||loginPaused||generation!=requestGeneration)return;
        execute("setShiny",applied->{
            if(stopped||loginPaused||generation!=requestGeneration)return;
            if(!applied.optBoolean("ok",false)){
                shinyVerified=false;
                if(attempt<2){
                    // Hydration may not have rendered the switch yet.
                    handler.postDelayed(()->applyShinyOnSite(generation,attempt+1),300L);
                    return;
                }
                if(shiny&&!applied.optBoolean("controlFound",true)){
                    // A missing control can mean an unfinished page, not logout.
                    execute("session",session->{
                        if(stopped||loginPaused||generation!=requestGeneration)return;
                        String auth=session.optString("auth","não confirmado");
                        if("autenticada".equals(auth)){
                            diagnosticError("✨ Conta conectada; controle Shiny não encontrado no site.");
                        }else{
                            status("✨ Login necessário para habilitar Shiny no site.");
                            openShinyLogin();
                        }
                    });
                }else{
                    diagnosticError("✨ Não foi possível alterar o filtro Shiny no site.");
                }
                return;
            }
            handler.postDelayed(()->{
                if(stopped||loginPaused||generation!=requestGeneration)return;
                execute("verifyShiny",verified->{
                    if(stopped||loginPaused||generation!=requestGeneration)return;
                    if(verified.optBoolean("ok",false)){
                        shinyVerified=shiny;
                        shinyLoginPromptRequested=false;
                        status(shiny?"✨ Shiny ativado e confirmado no site.":
                            "✨ Shiny desativado e confirmado no site.");
                        // Existing network rate limit still applies to Search.
                        refresh(false);
                    }else if(attempt<2){
                        handler.postDelayed(()->applyShinyOnSite(generation,attempt+1),260L);
                    }else{
                        shinyVerified=false;
                        if(shiny&&verified.optBoolean("pending",false)){
                            status("✨ Vinculação necessária para Shiny.");
                            openShinyLogin();
                        }else diagnosticError("✨ Alteração de Shiny não confirmada pelo site.");
                    }
                });
            },240L);
        });
    }
    private void prepareImmediateShiny(int generation){
        if(stopped||loginPaused||generation!=requestGeneration)return;
        // OFF never requires login or a linked trainer.
        if(!shiny){applyShinyOnSite(generation,0);return;}
        // Also gate the page-finished path: do not trust a stale "Shiny ON"
        // preference after account changes, logout or WebView navigation.
        execute("session",session->{
            if(stopped||loginPaused||generation!=requestGeneration)return;
            if(!siteConfirmsShinyAccount(session)){
                revertUnverifiedShiny("✨ Vincule o treinador no perfil PoGoCoordinates para Shiny.");
                openShinyLogin();
                refresh(false); // Revert to guest-safe ordinary results.
                return;
            }
            applyShinyOnSite(generation,0);
        });
    }
    private void reconfigureBeforeSubmit(int generation,boolean manual,int verifyAttempt,int retry){
        if(stopped||loginPaused||generation!=requestGeneration)return;
        execute("configureSearch",configured->{
            if(stopped||loginPaused||generation!=requestGeneration)return;
            if(configured.optBoolean("ok")&&configured.optBoolean("configured",false)){
                handler.postDelayed(()->verifyAndSubmit(generation,manual,verifyAttempt),300L);
                return;
            }
            if(configured.optBoolean("pending",false)&&retry<20){
                handler.postDelayed(()->reconfigureBeforeSubmit(generation,manual,verifyAttempt,retry+1),300L);
                return;
            }
            searchInProgress=false;
            shinyVerified=false;
            searchFailure("⚠ Filtros não aplicados",
                configured.optString("reason","Os campos do site não ficaram prontos após a troca de aba."));
        });
    }
    private void verifyAndSubmit(int generation,boolean manual,int attempt){
        handler.postDelayed(()->{
            if(stopped||loginPaused||generation!=requestGeneration)return;
            execute("verifyShiny",verified->{
            if(stopped||loginPaused||generation!=requestGeneration)return;
            if(!verified.optBoolean("ok")){
                if(attempt<4){
                    execute("prepareSearch",preparedRetry->execute("configureSearch",ignored->{
                        if(stopped||loginPaused||generation!=requestGeneration)return;
                        verifyAndSubmit(generation,manual,attempt+1);
                    }));
                    return;
                }
                searchInProgress=false;
                shinyVerified=false;
                diagnosticError(shiny
                    ?(verified.optBoolean("pending",false)
                        ?"✨ Vinculação do treinador pendente no PoGoCoordinates. Confirme no site e tente novamente."
                        :"✨ Shiny não foi confirmado pelo site. Verifique login e vínculo do treinador; IV100/GL/UL seguem disponíveis com ✨ desligado.")
                    :"Não foi possível confirmar Shiny desativado no site.");
                if(shinyLoginPromptRequested)openShinyLogin();
                return;
            }
            execute("verifyFilters",filters->{
                if(stopped||loginPaused||generation!=requestGeneration)return;
                if(!filters.optBoolean("ok")){
                    if(attempt<2){
                        // Reconfiguration may switch asynchronous React tabs. Do
                        // not verify until the requested fields are ready again.
                        reconfigureBeforeSubmit(generation,manual,attempt+1,0);
                        return;
                    }
                    searchInProgress=false;
                    shinyVerified=false;
                    searchFailure("⚠ Filtros não confirmados","Filtros IV/ligas não confirmados: "
                        +filters.optString("reason","verifique as opções no site."));
                    return;
                }
                // React may re-render Coords after the first confirmation
                // while configuring IV/GL/UL. Re-verify the exact coordinate
                // pair and radius at the LAST boundary, just before Search.
                // In OFF mode this also catches rehydrated stale coordinates.
                execute("verifyLocation:"+locationPayload(),lastLocation->{
                    if(stopped||loginPaused||generation!=requestGeneration)return;
                    if(!lastLocation.optBoolean("ok")){
                        locationVerified=false;
                        searchInProgress=false;
                        searchFailure(locationEnabled?"⚠ Localização não aplicada":"⚠ Localização residual",
                            "Busca não enviada: último formulário de localização divergente. "+
                            lastLocation.optString("reason","reabra Localização, confirme os dados e tente novamente."));
                        return;
                    }
                    shinyVerified=shiny;
                    confirmedSubmittedFiltersGeneration=generation;
                    update();
                    // Mark the submission boundary before JS clicks Search.
                    submittingSearchGeneration=generation;
                    submitAttemptAtMs=System.currentTimeMillis();
                    execute("submitSearch",submitted->{
                        if(stopped||loginPaused||generation!=requestGeneration)return;
                        if(!submitted.optBoolean("ok")){
                            submittingSearchGeneration=-1;
                            confirmedSubmittedFiltersGeneration=-1;
                            searchInProgress=false;
                            shinyVerified=false;
                            locationVerified=false;
                            searchFailure("⚠ Busca não enviada",
                                submitted.optString("reason","Falha ao pressionar Search."));
                            return;
                        }
                        long submittedAt=System.currentTimeMillis();
                        lastSearchStartMs=submittedAt;
                        submittingSearchGeneration=-1;
                        submittedSearchGeneration=generation;
                        // This means the exact values were still present when
                        // Search was pressed, not merely selected in our UI.
                        locationVerified=locationEnabled;
                        getSharedPreferences("prefs",0).edit()
                            .putLong("lastNetworkSearchAt",submittedAt).apply();
                        BugReport.log(this,"SUBMIT","Busca "+mode+" Shiny="+shiny+
                            " geofiltro="+(locationEnabled?"confirmado":"OFF"));
                        searchPhase="searching";
            status(manual?"Busca manual em andamento...":"Buscando...");
                        pollSearch(generation,0,manual);
                    });
                });
            });
            });
        },650L);
    }
    private void pollSearch(int generation,int attempt,boolean manual){
        handler.postDelayed(()->{
            if(stopped||loginPaused||generation!=requestGeneration)return;
            if(!loaded||website==null){
                // Search can navigate to a result document. A temporarily
                // unavailable WebView is not an empty or failed search.
                if(attempt<24){pollSearch(generation,attempt+1,manual);return;}
                searchInProgress=false;
                searchFailure("⚠ Site não carregado","A página não terminou de carregar após Search.");
                return;
            }
            execute("collect",r->{
            if(stopped||loginPaused||generation!=requestGeneration)return;
            if(!r.optBoolean("ok")){
                searchInProgress=false;
                searchFailure("⚠ Falha na leitura","Falha na leitura dos resultados do site.");
                return;
            }
            // A React result page can expose transient incomplete cards while loading.
            // Do not classify those as a failed extraction or a verified empty response.
            if(r.optBoolean("loading",false)){
                if(attempt<24){pollSearch(generation,attempt+1,manual);return;}
                searchInProgress=false;
                searchFailure("⚠ Tempo limite","O site não concluiu a consulta de resultados.");
                return;
            }
            // Shiny was verified before submission. A missing switch after navigation
            // is not proof it was switched OFF; an explicit OFF state still fails.
            boolean shinySwitchMissing=!r.has("siteShiny")||r.isNull("siteShiny");
            boolean trustedShinyHidden=shiny&&shinyVerified&&
                confirmedSubmittedFiltersGeneration==generation&&shinySwitchMissing;
            if((shiny&&!trustedShinyHidden&&
                   (shinySwitchMissing||!r.optBoolean("siteShiny",false))) ||
                (!shiny&&!shinySwitchMissing&&r.optBoolean("siteShiny",false))){
                searchInProgress=false;
                shinyVerified=false;
                searchFailure("⚠ Shiny não confirmado","Filtro Shiny mudou durante a busca. Resultados não confirmados.");
                return;
            }
            // A result page may have changed the site's filters after Search.
            // An explicitly empty response is NOT trustworthy unless the requested
            // site settings are still confirmed; keep old cards instead.
            if(!r.optBoolean("criteriaConfirmed",false)){
                searchInProgress=false;
                searchFailure("⚠ Filtro não confirmado",
                    "Busca ignorada: "+r.optString("criteriaReason","controles não confirmados")+
                    " · "+r.optString("confirmationSource","sem confirmação")+".");
                return;
            }
            if(("gl".equals(mode)||"ul".equals(mode))&&!r.optBoolean("leagueConfirmed",false)){
                searchInProgress=false;
                shinyVerified=false;
                searchFailure("⚠ Ranking não confirmado","Liga PvP/ranking configurado não confirmado. Resultados preservados.");
                return;
            }
            int found=r.optInt("found",0);
            int onSite=r.optInt("siteCount",0);
            if(attempt==0)BugReport.log(this,"SEARCH_RESULT",
                "Pokémon identificados="+found+" • site="+onSite+
                " • validação="+r.optString("confirmationSource","desconhecida")+
                " • modo="+mode);
            if(r.optBoolean("parseFailure",false)&&!r.optBoolean("loading",false)){
                // The old result DOM can remain visible while React replaces it.
                // Do not fail after the first incomplete frame.
                if(attempt<24){pollSearch(generation,attempt+1,manual);return;}
                searchInProgress=false;
                searchFailure("⚠ Leitura não confirmada","Leitura do site: "+onSite+" ocorrências exibidas, mas nenhum cartão foi reconhecido.");
                return;
            }
            if(found>0&&r.optJSONArray("cards")!=null&&r.optJSONArray("cards").length()==0){
                // Switching GL/UL/IV leaves old cards visible briefly. Retry
                // rather than treating them as definitive results of the new mode.
                if(attempt<24){pollSearch(generation,attempt+1,manual);return;}
                searchInProgress=false;
                boolean pvp="gl".equals(mode)||"ul".equals(mode);
                searchFailure(pvp?"⚠ Ranking não confirmado":"⚠ IV não comprovado",
                    "Site retornou "+found+" Pokémon, mas nenhum cartão comprovou os IVs/ranking solicitados."+
                    (pvp?"":" IVs ausentes ou divergentes: "+r.optInt("unverifiedIv",0))+".");
                return;
            }
            // A site with ten visible spawns can temporarily yield fewer parsed
            // cards while it updates after any IV, GL or UL mode switch.
            // Never mark that partial snapshot as a complete result too soon.
            if(r.optBoolean("siteIncomplete",false)&&attempt<24){
                if(attempt==0)BugReport.log(this,"RESULTS_PARTIAL",
                    "Modo="+mode+" • identificados="+found+
                    " • esperado="+r.optInt("expectedVisible",0));
                pollSearch(generation,attempt+1,manual);
                return;
            }
            boolean loading=r.optBoolean("loading",false);
            boolean empty=r.optBoolean("explicitEmpty",false);
            if((loading||(!empty&&found==0))&&attempt<24){
                pollSearch(generation,attempt+1,manual);
                return;
            }
            if(loading||(!empty&&found==0&&attempt>=24)){
                searchInProgress=false;
                searchFailure("⚠ Site sem confirmação","Busca não confirmada no site (tempo limite). Resultados anteriores mantidos.");
                return;
            }
            applyCollectedResults(r);
            });
        }, attempt==0?3000L:1300L);
    }
    private long expiration(JSONObject item){
        if(item==null)return Long.MAX_VALUE;
        String[] p=item.optString("despawn","").split(":");
        if(p.length!=2)return Long.MAX_VALUE;
        try{
            long secs=Long.parseLong(p[0])*60+Long.parseLong(p[1]);
            if(secs<0||secs>86400)return Long.MAX_VALUE;
            return item.optLong("sampledAt",System.currentTimeMillis())+secs*1000L;
        }catch(NumberFormatException ignored){return Long.MAX_VALUE;}
        catch(Exception e){recordFailure("interpretar despawn",e);return Long.MAX_VALUE;}
    }
    private String spawnKey(JSONObject c){
        return mode+"|"+c.optString("name","")+"|"+c.optString("cp","")+"|"+
            c.optString("level","")+"|"+c.optString("location","");
    }
    private JSONArray sortItems(JSONArray source){
        java.util.ArrayList<JSONObject> a=new java.util.ArrayList<>();
        if(source!=null)for(int i=0;i<source.length();i++){
            JSONObject c=source.optJSONObject(i);if(c!=null)a.add(c);
        }
        // The site sorts before we read the first ten cards. Preserve that order.
        if("site".equals(sort)){
            JSONArray inSiteOrder=new JSONArray();
            for(JSONObject card:a)inSiteOrder.put(card);
            return inSiteOrder;
        }
        java.util.Comparator<JSONObject> comparator;
        switch(sort){
            case "rank":
                comparator=(a1,a2)->Integer.compare(rankForSort(a1),rankForSort(a2));break;
            case "iv":
                comparator=(a1,a2)->Double.compare(a2.optDouble("ivPercent",0),a1.optDouble("ivPercent",0));break;
            case "shiny":
                comparator=(a1,a2)->Boolean.compare(a2.optBoolean("shiny"),a1.optBoolean("shiny"));break;
            default:
                comparator=(a1,a2)->Long.compare(expiration(a1),expiration(a2));
        }
        a.sort(comparator);
        JSONArray sorted=new JSONArray();
        for(JSONObject c:a)sorted.put(c);
        return sorted;
    }
    private int rankForSort(JSONObject card){
        try{return Integer.parseInt(card.optString("rank","999999"));}
        catch(NumberFormatException ignored){return 999999;}
    }
    private boolean verifiedTargetCriteria(JSONObject card){
        if(card==null)return false;
        // A configured site filter never proves the IV of an individual spawn.
        // Independently validate site value(s) before showing or notifying.
        if("iv".equals(mode)||"raw".equals(mode)||"percent".equals(mode)){
            String raw=card.optString("iv","").trim();
            String pct=card.optString("ivPercent","").trim();
            boolean hasRaw=!raw.isEmpty();
            int computed=-1;
            if(hasRaw){
                if(!raw.matches("(?:[0-9]|1[0-5])/(?:[0-9]|1[0-5])/(?:[0-9]|1[0-5])"))
                    return false;
                String[] stats=raw.split("/");
                int sum=Integer.parseInt(stats[0])+Integer.parseInt(stats[1])+Integer.parseInt(stats[2]);
                computed=ivPercentageForSum(sum);
            }
            int actual=computed;
            if(!pct.isEmpty()){
                if(!pct.matches("(?:0|[1-9][0-9]?|100)"))return false;
                actual=Integer.parseInt(pct);
                if(!isAllowedIvPercent(actual)||(computed>=0&&actual!=computed))return false;
            }
            if("iv".equals(mode))return actual==100;
            if("raw".equals(mode))
                return hasRaw&&(rawAttack+"/"+rawDefense+"/"+rawStamina).equals(raw);
            return actual>=0&&within(actual,ivPercentMin,ivPercentMax);
        }
        if("gl".equals(mode)||"ul".equals(mode)){
            int max="ul".equals(mode)?ulRank:glRank;
            int shown=rankForSort(card);
            return (shown>=1&&shown<=max) ||
                ("verified-site-filter".equals(card.optString("rankSource",""))&&shown==999999);
        }
        return false;
    }
    private boolean sendGeneralNotification(String title,String info,int id){
        // This is a confirmed-result notice or an explicit manual test.
        if(!WatchAlerts.permissionGranted(this))return false;
        NotificationManager nm=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
        if(nm==null)return false;
        boolean quiet="silent".equals(alertsMode);
        String channelId=quiet?"pokesearch_alerts_silent_v1":
            WatchAlerts.soundChannelId(this,false,null);
        NotificationChannel channel=new NotificationChannel(channelId,
            quiet?"Novos Pokémon · silencioso":"Novos Pokémon encontrados",
            quiet?NotificationManager.IMPORTANCE_LOW:NotificationManager.IMPORTANCE_DEFAULT);
        if(quiet)channel.setSound(null,null);
        else channel.setSound(WatchAlerts.selectedTone(this,false,null),
            new android.media.AudioAttributes.Builder()
                .setUsage(android.media.AudioAttributes.USAGE_NOTIFICATION_EVENT).build());
        try{nm.createNotificationChannel(channel);}
        catch(Exception error){recordFailure("criar canal de novos Pokémon",error);return false;}
        // The user owns channel sound/importance after first creation.
        if(nm.getNotificationChannel(channelId)==null||
            nm.getNotificationChannel(channelId).getImportance()==NotificationManager.IMPORTANCE_NONE)
            return false;
        Intent open=new Intent(this,MainActivity.class);
        PendingIntent pending=PendingIntent.getActivity(this,74,open,
            PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
        Notification note=new Notification.Builder(this,channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title).setContentText(info).setAutoCancel(true)
            .setContentIntent(pending)
            .setStyle(new Notification.BigTextStyle().bigText(info)).build();
        try{nm.notify(id,note);return true;}
        catch(Exception e){recordFailure("notificação geral",e);return false;}
    }
    private void recordNewResults(JSONArray cards,boolean leagueConfirmed){
        android.content.SharedPreferences preferences=getSharedPreferences("prefs",0);
        JSONArray history;
        try{history=new JSONArray(preferences.getString("history","[]"));}
        catch(Exception e){recordFailure("ler histórico",e);history=new JSONArray();}
        java.util.Set<String> current=new java.util.HashSet<>();
        String firstNew="";
        String firstWatched="";
        String watchDetails="";
        int watchedCount=0;
        java.util.LinkedHashMap<String,String[]> individualFavorites=new java.util.LinkedHashMap<>();
        java.util.Set<String> wanted=WatchAlerts.watched(this);
        long now=System.currentTimeMillis();
        for(int i=0;i<cards.length();i++){
            JSONObject c=cards.optJSONObject(i);
            if(c==null)continue;
            String key=spawnKey(c);
            current.add(key);
            if(knownSpawns.contains(key))continue;
            if(firstNew.isEmpty() &&
                ("iv".equals(mode)||"raw".equals(mode)||"percent".equals(mode)||leagueConfirmed) && verifiedTargetCriteria(c))
                firstNew=c.optString("name","Pokémon");
            if(WatchAlerts.enabled(this) &&
                ("iv".equals(mode)||"raw".equals(mode)||"percent".equals(mode)||leagueConfirmed) &&
                verifiedTargetCriteria(c) &&
                WatchAlerts.matches(c.optString("name",""),wanted)){
                watchedCount++;
                if(firstWatched.isEmpty()){
                    firstWatched=c.optString("name","Pokémon");
                    watchDetails="Busca "+mode.toUpperCase(java.util.Locale.ROOT)+
                        " · PC "+c.optString("cp","?")+
                        (c.optString("location","").isEmpty()?"":" · "+c.optString("location",""));
                }
                String favoriteName=c.optString("name","Pokémon");
                if(!individualFavorites.containsKey(WatchAlerts.normalized(favoriteName)))
                    individualFavorites.put(WatchAlerts.normalized(favoriteName),
                        new String[]{favoriteName,"PC "+c.optString("cp","?")});
            }
            JSONObject entry=new JSONObject();
            try{
                entry.put("name",c.optString("name","Pokémon"));
                entry.put("cp",c.optString("cp",""));
                entry.put("mode",mode.toUpperCase(java.util.Locale.ROOT));
                entry.put("rank",c.optString("rank",""));
                entry.put("at",now);
                history.put(entry);
            }catch(Exception e){recordFailure("gravar histórico",e);}
        }
        knownSpawns.clear();knownSpawns.addAll(current);
        JSONArray limited=new JSONArray();
        for(int i=Math.max(0,history.length()-40);i<history.length();i++)limited.put(history.opt(i));
        preferences.edit().putString("history",limited.toString()).apply();
        if(watchedCount>0&&!firstWatched.isEmpty()){
            if(WatchAlerts.speciesToneCount(this)>0){
                // Distinct custom cries are meaningful only if every matching
                // species gets its own channel. Cap each refresh to 5 notices.
                int count=0;
                for(String[] info:individualFavorites.values()){
                    if(count++>=5)break;
                    WatchAlerts.match(this,info[0],
                        "Busca "+mode.toUpperCase(java.util.Locale.ROOT)+" · "+info[1]);
                }
            }else{
                if(watchedCount>1)watchDetails+=" · +"+(watchedCount-1)+" Pokémon da lista";
                WatchAlerts.match(this,firstWatched,watchDetails);
            }
            if(!WatchAlerts.permissionGranted(this))
                preferences.edit().putString("lastWatchAlertError",
                    "Permissão de notificações não concedida").apply();
        }
        if(!"off".equals(alertsMode)&&alerts&&!firstNew.isEmpty()&&now-lastAlertAt>60000L){
            if(sendGeneralNotification("Novo Pokémon: "+firstNew,
                "Encontrado nos filtros confirmados · "+mode.toUpperCase(java.util.Locale.ROOT),74))
                lastAlertAt=now;
        }
    }
    private void applyCollectedResults(JSONObject r){
        BugReport.log(this,"RESULTS","Modo "+mode+" • válidos "+
            (r.optJSONArray("cards")==null?0:r.optJSONArray("cards").length())+
            " • encontrados "+r.optInt("found",0));
        JSONArray items=r.optJSONArray("cards");
        if(items==null)items=new JSONArray();
        // Defence in depth: JS collection can never be the sole IV gate.
        // Filter BEFORE cache, display, history and any general/watch alert.
        if("iv".equals(mode)||"raw".equals(mode)||"percent".equals(mode)){
            JSONArray verified=new JSONArray();
            int rejected=0;
            for(int i=0;i<items.length();i++){
                JSONObject card=items.optJSONObject(i);
                if(card!=null&&verifiedTargetCriteria(card))verified.put(card);
                else rejected++;
            }
            if(rejected>0){
                BugReport.log(this,"IV_EVIDENCE","Cartões não comprovados="+rejected+" modo="+mode);
                if(verified.length()==0){
                    searchInProgress=false;
                    searchFailure("⚠ IV não comprovado",
                        "Todos os "+rejected+" cartões foram rejeitados pela verificação nativa; resultados anteriores preservados.");
                    return;
                }
            }
            items=verified;
        }
        long now=System.currentTimeMillis();
        JSONArray unexpired=new JSONArray();
        for(int i=0;i<items.length();i++){
            JSONObject card=items.optJSONObject(i);
            if(card==null)continue;
            try{
                card.put("sampledAt",now);
                long end=expiration(card);
                // Even if the site briefly shows an old 0:00 card during
                // React updates, do not reinsert an expired spawn or notify it.
                if(end<=now)continue;
                if(end!=Long.MAX_VALUE)card.put("expiresAtMs",end);
            }catch(Exception e){recordFailure("marcar despawn",e);}
            unexpired.put(card);
        }
        JSONArray sorted=sortItems(unexpired);
        recordNewResults(sorted,r.optBoolean("leagueConfirmed",false));
        results=sorted.toString();
        searchPhase=sorted.length()==0?"empty":"updated";
        shownMode=mode;shownConfigJson=filterConfigJson();
        shownShiny=shiny&&shinyVerified;resultsStale=false;
        rememberConfirmedPreview(sorted,now);
        searchInProgress=false;
        armNextDespawn(sorted);
        if(selected>=0)hideDetails();
        getSharedPreferences("prefs",0).edit()
            .putLong("lastSearchAt",now).putString("lastError","Nenhum").apply();
        if(r.optBoolean("siteIncomplete",false)){
            // Show independently verified matches, but never label a visibly
            // incomplete extraction as the complete result set.
            BugReport.log(this,"RESULTS_PARTIAL",
                "Modo="+mode+" • site="+r.optInt("siteCount",0)+
                " • extraídos="+r.optInt("found",0)+
                " • confirmados="+sorted.length());
            status(sorted.length()+" Pokémon confirmados • site indica "+
                r.optInt("expectedVisible",0)+" • leitura parcial");
        }else if(r.optBoolean("uncertain"))
            status(("raw".equals(mode)||"percent".equals(mode)||"iv".equals(mode))
                ?"Alguns IVs não comprovados foram ignorados.":"Alguns rankings PvP não confirmados.");
        else if(sorted.length()==0)status("Sem resultados confirmados");
        else status(sorted.length()+" Pokémon atualizados");
    }
    private void resize(int h){
        // The gear window never expands with the Pokémon results.
        if(minimized||params==null)return;
        int target=Math.max(30,Math.min(36,h));
        if(Math.abs(target-height)<2)return;
        height=target;params.height=dp(height);updateWindow();
    }
    private void resizeResults(int desiredDp){
        if(resultParams==null||resultRoot==null||minimized)return;
        // The WebView already budgets all up to ten cards against the full display.
        // Resize the native touch window to that exact measured height; never
        // force an 8-row scroll or clip the bottom when dragged near an edge.
        int min=minResultsHeaderHeightDp();
        int max=Math.max(min,screenHeightDp()-16);
        int desired=resultCollapsed?min:
            Math.max(min,Math.min(max,desiredDp));
        int pixels=dp(desired);
        int screenPixels=metrics().heightPixels;
        int fittedY=Math.max(0,Math.min(Math.max(0,screenPixels-pixels),resultParams.y));
        if(Math.abs(resultParams.height-pixels)<dp(2)&&resultParams.y==fittedY)return;
        resultParams.height=pixels;
        resultParams.y=fittedY;
        try{wm.updateViewLayout(resultRoot,resultParams);}
        catch(Exception e){recordFailure("redimensionar resultados",e);}
        moveDetail();
    }
    private void toggleResultsCollapsed(){
        if(minimized||resultRoot==null)return;
        resultCollapsed=!resultCollapsed;
        getSharedPreferences("prefs",0).edit()
            .putBoolean("resultsCollapsed",resultCollapsed).apply();
        js(resultPanel,resultLoaded,"window.setResultsCollapsed("+resultCollapsed+")");
        updateResultsWidth();
        if(resultCollapsed){
            hideDetails();
            resizeResults(minResultsHeaderHeightDp());
        }
    }
    private void menu(boolean show){
        if(params==null||minimized)return;
        if(show==menuExpanded)return;
        if(!show&&locationEditorOpen)locationEditor(false);
        menuExpanded=show;
        menuPadDp=0; // Only the measured overlap may shift the sprite list.
        if(show){
            menuDrawHeight=-1;menuDrawWidth=-1;
            if(menuRoot!=null)menuRoot.setVisibility(View.VISIBLE);
            if(menuParams!=null){menuRequestedHeightDp=visualMenuBaseDp();
                menuParams.width=dp(menuDp());menuParams.height=dp(visualMenuBaseDp());
                popupOffsetDp=-1;popupRoomDp=-1;}
        }else{
            if(menuRoot!=null)menuRoot.setVisibility(View.GONE);
        }
        // Position first and send one sync for this open/close transition.
        // Future drags still synchronize from updateMenuPosition().
        deferMenuSync=true;
        try{updateWindow();}
        finally{deferMenuSync=false;}
        String edge=JSONObject.quote(menuLeft?"left":"right");
        js(panel,panelLoaded,"window.syncMenu("+show+","+edge+","+menuPadDp+")");
        js(menuPanel,menuLoaded,"window.syncMenu("+show+","+edge+",0)");
        moveDetail();
    }
    private void minimize(boolean yes){
        if(params==null)return;
        if(yes&&menuExpanded)menu(false);
        minimized=yes;
        if(yes)hideDetails();
        params.width=dp(yes?BUBBLE_DP:dockDp());
        params.height=dp(yes?BUBBLE_DP:height);
        grip.setLayoutParams(new FrameLayout.LayoutParams(
                dp(yes?BUBBLE_DP:dockDp()),dp(yes?BUBBLE_DP:30),Gravity.TOP|Gravity.LEFT));
        js(panel,panelLoaded,"window.setMinimized("+yes+")");
        if(resultRoot!=null)resultRoot.setVisibility(
            yes||loginPaused||pickerOpen?View.GONE:View.VISIBLE);
        updateWindow();
    }
    private void showDetails(int index){
        if(detailRoot==null||detailPanel==null||!detailLoaded||minimized)return;
        try{
            JSONArray a=new JSONArray(results);
            if(index<0||index>=a.length()){hideDetails();return;}
            selected=index;
            JSONObject obj=a.getJSONObject(index);
            js(detailPanel,true,"window.showDetails("+obj.toString()+","+JSONObject.quote(count()>0?shownMode:mode)+","+WatchAlerts.isWatched(this,obj.optString("name",""))+")");
            detailRoot.setVisibility(View.VISIBLE);
            moveDetail();
            js(resultPanel,resultLoaded,"window.highlight("+index+")");
            // RANK-EVO-DETAIL-03: request derived PvP projections only on tap.
            // Read-only on the results WebView: no extra GM, network or site filters.
            if(resultPanel!=null&&resultLoaded){
                final int expectedGeneration=requestGeneration;
                final int expectedSource=obj.optInt("sourceIndex",-1);
                final String expectedName=obj.optString("name","");
                final String expectedIv=obj.optString("iv","");
                final String expectedCp=obj.optString("cp","");
                String query="(function(){if(typeof window.pvpEvolutionDetails!=='function')return 'null';"+
                        "return JSON.stringify(window.pvpEvolutionDetails("+index+"));})()";
                resultPanel.evaluateJavascript(query,raw->{
                    if(raw==null||raw.isEmpty()||selected!=index||
                            requestGeneration!=expectedGeneration||!detailLoaded||
                            detailRoot==null||detailRoot.getVisibility()!=View.VISIBLE)return;
                    try{
                        // evaluateJavascript encodes the returned JSON as a quoted string.
                        // Decode once and reject stale results before sending to detail.html.
                        String json=new JSONArray("["+raw+"]").optString(0,"");
                        if(json.isEmpty()||"null".equals(json))return;
                        JSONObject payload=new JSONObject(json);
                        JSONArray currentArray=new JSONArray(results);
                        if(index>=currentArray.length())return;
                        JSONObject current=currentArray.getJSONObject(index);
                        if(current.optInt("sourceIndex",-1)!=expectedSource||
                                !expectedName.equals(current.optString("name",""))||
                                !expectedIv.equals(current.optString("iv",""))||
                                !expectedCp.equals(current.optString("cp",""))||
                                payload.optInt("sourceIndex",-1)!=expectedSource||
                                !expectedName.equals(payload.optString("name",""))||
                                !expectedIv.equals(payload.optString("iv",""))||
                                !expectedCp.equals(payload.optString("cp",""))||
                                payload.optJSONArray("leagues")==null||
                                payload.optJSONArray("leagues").length()!=3)return;
                        js(detailPanel,detailLoaded,"window.showEvolutionDetails("+payload.toString()+")");
                    }catch(Exception e){recordFailure("dados de evoluções PvP",e);}
                });
            }
        }catch(Exception e){recordFailure("mostrar detalhes",e);hideDetails();}
    }
    private void hideDetails(){
        selected=-1;
        // UX-DETAIL-TIMER-01: pause JS countdown while detail WebView is hidden.
        js(detailPanel,detailLoaded,"window.pauseDetailTimer()");
        if(detailRoot!=null)detailRoot.setVisibility(View.GONE);
        js(resultPanel,resultLoaded,"window.highlight(-1)");
    }
    private void resizeDetail(int heightDp){
        detailHeight=Math.max(90,Math.min(310,heightDp));
        if(detailParams!=null&&detailRoot!=null){
            detailParams.height=dp(detailHeight);moveDetail();
        }
    }
    private void pollCoordinates(JSONObject target,int attempt,boolean autoCopy){
        if(stopped||loginPaused)return;
        JSONObject query=new JSONObject();
        try{
            query.put("name",target.optString("name",""));
            query.put("cp",target.optString("cp",""));
        }catch(Exception e){recordFailure("preparar consulta de coordenadas",e);}
        execute("readCoords:"+query.toString(),result->{
            String coords=result.optString("coords","");
            if(result.optBoolean("ok")&&!coords.isEmpty()){
                try{
                    JSONArray existing=new JSONArray(results);
                    for(int i=0;i<existing.length();i++){
                        JSONObject card=existing.getJSONObject(i);
                        if(card.optInt("sourceIndex",-1)==target.optInt("sourceIndex",-2)){
                            card.put("coords",coords);
                            break;
                        }
                    }
                    results=existing.toString();
                }catch(Exception e){recordFailure("armazenar coordenadas",e);}
                if(autoCopy)copyCoordinatesInternal(coords);
                deliverCoords(coords,autoCopy?"Coordenadas copiadas":"Coordenadas obtidas");return;
            }
            if(attempt<8){
                handler.postDelayed(()->{
                    if(!stopped&&!loginPaused)pollCoordinates(target,attempt+1,autoCopy);
                },450L);
            }else{
                deliverCoords("","O site não retornou coordenadas. Confira no navegador interno.");
            }
        });
    }
    private void copyCoordinatesInternal(String value){
        String coords=extractCoordinates(value);
        ClipboardManager cb=(ClipboardManager)getSystemService(CLIPBOARD_SERVICE);
        if(cb!=null&&!coords.isEmpty())cb.setPrimaryClip(ClipData.newPlainText("Pokémon coordinates",coords));
    }
    private String extractCoordinates(String input){
        java.util.regex.Matcher m=java.util.regex.Pattern.compile("^\\s*([-+]?\\d{1,2}(?:\\.\\d+)?)\\s*[,;]\\s*([-+]?\\d{1,3}(?:\\.\\d+)?)\\s*$").matcher(input==null?"":input);
        if(m.find()){
            try{
                double lat=Double.parseDouble(m.group(1)),lon=Double.parseDouble(m.group(2));
                if(Math.abs(lat)<=90&&Math.abs(lon)<=180)
                    return String.format(java.util.Locale.US,"%s,%s",m.group(1),m.group(2));
            }catch(NumberFormatException ignored){}
            catch(Exception e){recordFailure("interpretar coordenadas",e);}
        }
        return "";
    }
    private void deliverCoords(String coordinates,String message){
        js(detailPanel,detailLoaded,"window.coordsResult("+JSONObject.quote(coordinates)+","+JSONObject.quote(message)+")");
        status(message);
    }
    public class Bridge{
        @JavascriptInterface public void previewVisualArea(String area){
            handler.post(()->OverlayService.this.setVisualEditorPreview(area));
        }
        @JavascriptInterface public void saveVisualPrefs(String json){
            handler.post(()->OverlayService.this.saveVisualPrefs(json));
        }
        @JavascriptInterface public void visualEditorFocus(boolean focused){
            handler.post(()->locationEditor(focused));
        }
        @JavascriptInterface public void copyVisualPrefs(String json){
            handler.post(()->{
                try{
                    JSONObject clean=normalizeVisualPrefs(json);
                    clean.put("schema","pokesearch-visual-v1");
                    android.content.ClipboardManager clipboard=
                        (android.content.ClipboardManager)getSystemService(CLIPBOARD_SERVICE);
                    if(clipboard!=null)clipboard.setPrimaryClip(
                        ClipData.newPlainText("PokeSearch layout JSON",clean.toString(2)));
                }catch(Exception ignored){}
            });
        }
        @JavascriptInterface public void toggleWatch(String pokemon){handler.post(()->{
            boolean watched=WatchAlerts.toggle(OverlayService.this,pokemon);
            js(detailPanel,detailLoaded,"window.watchFeedback("+watched+")");
        });}
        @JavascriptInterface public void copyCoords(String coords){handler.post(()->{
            String valid=extractCoordinates(coords);
            if(valid.isEmpty()){js(detailPanel,detailLoaded,"window.copyFeedback("+JSONObject.quote("Coordenadas inválidas")+")");return;}
            ClipboardManager clipboard=(ClipboardManager)getSystemService(CLIPBOARD_SERVICE);
            if(clipboard!=null){clipboard.setPrimaryClip(ClipData.newPlainText("Coordenadas Pokémon",valid));js(detailPanel,detailLoaded,"window.copyFeedback("+JSONObject.quote("✓ Copiado!")+ ")");}
        });}

        @JavascriptInterface public void setLocation(boolean enabled,String coords,int radius){handler.post(()->{
            // Validate BEFORE mutating even the confirmed-state flag. An invalid
            // clipboard or hand-typed coordinate must not discard a proven filter.
            String valid=enabled?extractCoordinates(coords==null?"":coords):"";
            if(enabled&&(valid.isEmpty()||radius<0||radius>1000)){
                diagnosticError("📍 Cole latitude,longitude válidas e escolha raio de 0 a 1000km.");
                update();return;
            }
            if(locationEnabled==enabled&&
                (!enabled||(locationCoords.equals(valid)&&locationRadius==radius))){
                // A user tap on ✓ Aplicar is the equivalent of Search even
                // if Coords/Radius were already verified. Keep the existing
                // settings, avoid resetting proof prematurely, and respect the
                // in-flight/rate-limit gate before launching a fresh search.
                if(!searchInProgress&&nextScheduledSearchAtMs<=System.currentTimeMillis()){
                    status(enabled?"📍 Pesquisando com coordenadas e filtros ativos...":
                        "📍 Pesquisando com filtros ativos (busca geral)...");
                    OverlayService.this.refresh(true);
                }else{
                    status("⌛ Aguarde a busca atual ou o intervalo do site antes de pesquisar novamente.");
                    update();
                }
                return;
            }
            locationVerified=false;
            locationEnabled=enabled;
            locationCoords=enabled?valid:"";
            locationRadius=enabled?radius:0;
            android.content.SharedPreferences.Editor prefs=getSharedPreferences("prefs",0).edit();
            prefs.putBoolean("locationEnabled",locationEnabled);
            if(locationEnabled)prefs.putString("locationCoords",locationCoords).putInt("locationRadius",locationRadius);
            else prefs.remove("locationCoords").remove("locationRadius");
            prefs.apply();
            // Do not erase valid previously confirmed cards just because the
            // next location request may fail or be rate-limited.
            replaceActiveFilterSearch();
            resultsStale=count()>0;
            hideDetails();
            BugReport.log(OverlayService.this,"LOCATION",
                locationEnabled?"Coordenadas solicitadas, ainda não confirmadas":"Filtro geográfico desligado");
            status(locationEnabled?"📍 Localização solicitada • aguardando confirmação no site":"📍 Localização desligada • busca geral");
            OverlayService.this.refresh(true);
        });}
        @JavascriptInterface public void pasteLocationCoords(){handler.post(()->{
            // Clipboard is read ONLY after a user tap. Never log or persist a
            // clipboard value that was not explicitly applied as a filter.
            String parsed="";
            try{
                ClipboardManager cb=(ClipboardManager)getSystemService(CLIPBOARD_SERVICE);
                if(cb!=null&&cb.hasPrimaryClip()){
                    android.content.ClipData clip=cb.getPrimaryClip();
                    if(clip!=null&&clip.getItemCount()>0){
                        CharSequence value=clip.getItemAt(0).coerceToText(OverlayService.this);
                        if(value!=null&&value.length()<=128)
                            parsed=extractCoordinates(value.toString());
                    }
                }
            }catch(Exception e){recordFailure("colar coordenadas",e);}
            js(menuPanel,menuLoaded,"window.onLocationPaste("+JSONObject.quote(parsed)+")");
        });}
        @JavascriptInterface public void locationEditor(boolean open){handler.post(()->OverlayService.this.locationEditor(open));}
        @JavascriptInterface public void requestFilterOptions(){handler.post(()->requestFilterOptionsLater(0));}
        private void requestFilterOptionsLater(int attempt){
            if(stopped||loginPaused||!menuExpanded)return;
            if(searchInProgress||!loaded){
                // Opening the menu during an automatic refresh must not permanently
                // disable its filter selectors. Re-check without touching the site.
                if(attempt<36)handler.postDelayed(()->requestFilterOptionsLater(attempt+1),500L);
                return;
            }
            final int generation=requestGeneration;
            execute("describeFilters",found->{
                if(stopped||generation!=requestGeneration||menuPanel==null||!menuLoaded)return;
                js(menuPanel,true,"window.onFilterOptions("+found.toString()+")");
                discoverFilterMenu(0,generation);
            });
        }
        private void discoverFilterMenu(int position,int generation){
            if(stopped||loginPaused||searchInProgress||generation!=requestGeneration||!menuExpanded)return;
            final String[] keys={"sortBy","size","form","gender","weather"};
            if(position>=keys.length)return;
            String key=keys[position];
            execute("openFilterOptions:"+key,opened->{
                if(stopped||generation!=requestGeneration)return;
                if(!opened.optBoolean("ok")){
                    discoverFilterMenu(position+1,generation);return;
                }
                handler.postDelayed(()->execute("readFilterOptions:"+key,options->{
                    if(stopped||generation!=requestGeneration)return;
                    if(options.optBoolean("ok")&&menuPanel!=null&&menuLoaded){
                        JSONObject message=new JSONObject();
                        try{
                            message.put("ok",true);
                            JSONObject fields=new JSONObject();
                            JSONObject field=new JSONObject();
                            field.put("present",true);
                            field.put("options",options.optJSONArray("options"));
                            fields.put(key,field);
                            message.put("options",fields);
                            message.put("partial",true);
                        }catch(org.json.JSONException ignored){}
                        js(menuPanel,true,"window.onFilterOptions("+message.toString()+")");
                    }
                    execute("closeFilterOptions:"+key,closed->discoverFilterMenu(position+1,generation));
                }),210L);
            });
        }
        private int pokemonSuggestionSequence=0;
        @JavascriptInterface public void cancelPokemonSuggestions(){handler.post(()->++pokemonSuggestionSequence);}
        @JavascriptInterface public void requestPokemonSuggestions(String query){handler.post(()->{
            if(stopped||loginPaused||!menuExpanded||menuPanel==null||!menuLoaded)return;
            if(searchInProgress){
                js(menuPanel,true,"window.onPokemonSuggestions({ok:false,reason:'Aguarde a busca atual terminar'})");
                return;
            }
            final String wanted=query==null?"":query.trim();
            if(wanted.length()>65)return;
            final int generation=requestGeneration;
            final int sequence=++pokemonSuggestionSequence;
            requestPokemonSuggestionsLater(wanted,generation,sequence,0);
        });}
        private void requestPokemonSuggestionsLater(String query,int generation,int sequence,int attempt){
            if(stopped||loginPaused||searchInProgress||generation!=requestGeneration||
                sequence!=pokemonSuggestionSequence||!menuExpanded)return;
            execute("pokemonSuggest:"+JSONObject.quote(query),response->{
                if(stopped||generation!=requestGeneration||sequence!=pokemonSuggestionSequence||
                    menuPanel==null||!menuLoaded)return;
                if(response.optBoolean("pending",false)&&attempt<12){
                    handler.postDelayed(()->requestPokemonSuggestionsLater(query,generation,sequence,attempt+1),300L);
                    return;
                }
                // Even the final timeout must be displayed as a wait/error, not
                // as proven absence of an official species or event form.
                try{response.put("query",query);}catch(org.json.JSONException ignored){}
                js(menuPanel,true,"window.onPokemonSuggestions("+response.toString()+")");
            });
        }
        // LT57 single-form bridge: menus submit a DELTA, not a stale copy of
        // all search settings. Pokémon, Raw IV, Shiny and Location are untouched.
        @JavascriptInterface public void patchSearchFilters(String payload){handler.post(()->{
            try{
                JSONObject delta=new JSONObject(payload),updated=new JSONObject(extraFiltersJson);
                java.util.HashSet<String> allowed=new java.util.HashSet<>(java.util.Arrays.asList(
                    "sortBy","weather","size","form","gender","cpMin","cpMax",
                    "levelMin","levelMax","minPvpCp","sizeSelections","genderSelections",
                    "includePreviousEvolutions"));
                if(delta.length()==0||delta.length()>allowed.size())return;
                java.util.Iterator<String> requested=delta.keys();
                while(requested.hasNext())if(!allowed.contains(requested.next()))return;
                org.json.JSONArray priorClear=updated.optJSONArray("clearExtraKeys");
                java.util.LinkedHashSet<String> clears=new java.util.LinkedHashSet<>();
                if(priorClear!=null)for(int i=0;i<priorClear.length();i++)
                    clears.add(priorClear.optString(i));
                for(String key:allowed){
                    if(!delta.has(key))continue;
                    if(key.equals("includePreviousEvolutions")){
                        updated.put(key,delta.optBoolean(key,true));continue;
                    }
                    if(key.equals("sizeSelections")||key.equals("genderSelections")){
                        org.json.JSONArray input=delta.optJSONArray(key);
                        if(input==null||input.length()>(key.equals("genderSelections")?1:7))return;
                        org.json.JSONArray cleaned=new org.json.JSONArray();
                        java.util.HashSet<String> unique=new java.util.HashSet<>();
                        for(int i=0;i<input.length();i++){
                            String value=input.optString(i,"").trim();
                            if(value.length()>30||value.matches("(?s).*[<>\\r\\n].*"))return;
                            if(!value.isEmpty()&&unique.add(value.toLowerCase(java.util.Locale.ROOT)))
                                cleaned.put(value);
                        }
                        boolean wasActive=updated.optJSONArray(key)!=null&&
                            updated.optJSONArray(key).length()>0;
                        if(cleaned.length()==0&&
                        (wasActive||!updated.optString(key.replace("Selections",""),"").isEmpty()))
                        clears.add(key);
                        if(cleaned.length()>0)clears.remove(key);
                        updated.put(key,cleaned);
                        updated.put(key.replace("Selections",""),"");
                        continue;
                    }
                    String value=delta.optString(key,"").trim();
                    if(value.length()>100||value.matches("(?s).*[<>\\r\\n].*"))return;
                    if((key.equals("cpMin")||key.equals("cpMax")||key.equals("minPvpCp"))&&
                        !value.isEmpty()&&!value.matches("[0-9]{1,5}"))return;
                    if((key.equals("levelMin")||key.equals("levelMax"))&&
                        !value.isEmpty()&&!value.matches("[0-9]{1,2}(\\.[0-9])?"))return;
                    if(key.equals("sortBy")&&value.isEmpty())value="Despawn (longest)";
                    if(value.isEmpty()&&!updated.optString(key,"").isEmpty())clears.add(key);
                    if(!value.isEmpty())clears.remove(key);
                    updated.put(key,value);
                }
                for(String[] pair:new String[][]{{"cpMin","cpMax"},{"levelMin","levelMax"}}){
                    String low=updated.optString(pair[0]),high=updated.optString(pair[1]);
                    if(!low.isEmpty()&&!high.isEmpty()&&Double.parseDouble(low)>Double.parseDouble(high))return;
                }
                org.json.JSONArray clear=new org.json.JSONArray();
                for(String key:clears)clear.put(key);
                updated.put("clearExtraKeys",clear);
                String serialized=updated.toString();
                if(extraFiltersJson.equals(serialized)){
                    OverlayService.this.refresh(true);return;
                }
                extraFiltersJson=serialized;
                getSharedPreferences("prefs",0).edit().putString("extraFiltersJson",serialized).apply();
                replaceActiveFilterSearch(); // Preserve shiny, mode, Pokémon, coords.
                resultsStale=count()>0;
                status("Filtro atualizado • pesquisando com os demais campos preservados");
                scheduleFilterChangeRefresh();
            }catch(org.json.JSONException ex){
                status("Filtro inválido; nenhuma configuração foi alterada.");
            }
        });}
        @JavascriptInterface public void setSearchConfig(String payload){handler.post(()->{
            try{
                JSONObject input=new JSONObject(payload);
                String nextMode=input.getString("mode");
                if(!nextMode.equals("raw")&&!nextMode.equals("percent")&&
                    !nextMode.equals("gl")&&!nextMode.equals("ul"))return;
                int a=input.getInt("attack"),d=input.getInt("defense"),st=input.getInt("stamina");
                int gl=input.getInt("glRank"),ul=input.getInt("ulRank");
                int min=input.getInt("percentMin"),max=input.getInt("percentMax");
                if(!within(a,0,15)||!within(d,0,15)||!within(st,0,15)||
                    !within(gl,1,50)||!within(ul,1,50)||
                    !isAllowedIvPercent(min)||!isAllowedIvPercent(max)||min>max)return;
                JSONObject extra=new JSONObject();
                String[] strings={"sortBy","pokemon","form","size","gender","weather","cpMin","cpMax","levelMin","levelMax","minPvpCp"};
                for(String key:strings){
                    String value=input.optString(key,"").trim();
                    if(value.length()>100)return;
                    if((key.equals("cpMin")||key.equals("cpMax")||key.equals("minPvpCp"))&&
                       !value.isEmpty()&&!value.matches("[0-9]{1,5}"))return;
                    if((key.equals("levelMin")||key.equals("levelMax"))&&
                       !value.isEmpty()&&!value.matches("[0-9]{1,2}(\\.[0-9])?"))return;
                    extra.put(key,value);
                }
                // LT57 ONE-FORM: size and gender independently allow multiple
                // values. Empty array is "Any"; do not discard previous state
                // if an older Modes/Pokémon UI omits the arrays.
                JSONObject previousMulti=new JSONObject(extraFiltersJson);
                for(String key:new String[]{"size","gender"}){
                    String plural=key+"Selections";
                    org.json.JSONArray requested=input.optJSONArray(plural);
                    if(requested==null)requested=previousMulti.optJSONArray(plural);
                    org.json.JSONArray allowed=new org.json.JSONArray();
                    java.util.HashSet<String> seen=new java.util.HashSet<>();
                    if(requested!=null){
                        if(requested.length()>7)return;
                        for(int i=0;i<requested.length();i++){
                            String value=requested.optString(i,"").trim();
                            if(value.length()>30||value.matches("(?s).*[<>\\r\\n].*"))return;
                            if(!value.isEmpty()&&seen.add(value.toLowerCase(java.util.Locale.ROOT))){
                                // The previous build allowed multiple genders. Keep the
                                // first value during migration; the site is single-choice.
                                if(!key.equals("gender")||allowed.length()==0)allowed.put(value);
                            }
                        }
                    }else if(!input.optString(key,"").trim().isEmpty()){
                        allowed.put(input.optString(key,"").trim());
                    }
                    extra.put(plural,allowed);
                    // Never apply obsolete single-choice selection concurrently.
                    extra.put(key,"");
                }
                org.json.JSONArray species=input.optJSONArray("pokemonSelections");
                if(species!=null){
                    if(species.length()>50)return;
                    org.json.JSONArray cleaned=new org.json.JSONArray();
                    java.util.HashSet<String> dedup=new java.util.HashSet<>();
                    for(int i=0;i<species.length();i++){
                        String label=species.optString(i,"").trim();
                        if(label.isEmpty()||label.length()>90||label.matches("(?s).*[<>\\r\\n].*"))return;
                        if(dedup.add(label.toLowerCase(java.util.Locale.ROOT)))cleaned.put(label);
                    }
                    extra.put("pokemonSelections",cleaned);
                    extra.put("pokemon",""); // Multi-select replaces legacy single text.
                }
                if(extra.optString("sortBy","").isEmpty())extra.put("sortBy","Despawn (longest)");
                for(String[] pair:new String[][]{{"cpMin","cpMax"},{"levelMin","levelMax"}}){
                    String low=extra.optString(pair[0]),high=extra.optString(pair[1]);
                    if(!low.isEmpty()&&!high.isEmpty()&&Double.parseDouble(low)>Double.parseDouble(high))return;
                }
                // Clear a previously selected site restriction only when the
                // user explicitly switches it back to Any. Ordinary blank
                // options must never block Raw IV or GL/UL searches.
                JSONObject previousExtra=new JSONObject(extraFiltersJson);
                org.json.JSONArray previouslyCleared=previousExtra.optJSONArray("clearExtraKeys");
                org.json.JSONArray clearKeys=new org.json.JSONArray();
                for(String key:strings){
                    String before=previousExtra.optString(key,"").trim();
                    String after=extra.optString(key,"").trim();
                    boolean stillNeedsClear=false;
                    if(previouslyCleared!=null)for(int i=0;i<previouslyCleared.length();i++)
                        if(key.equals(previouslyCleared.optString(i)))stillNeedsClear=true;
                    if(after.isEmpty()&&(!before.isEmpty()||stillNeedsClear)){
                        clearKeys.put(key);
                        // A legacy one-choice Size/Gender value belongs to
                        // this same site control and must be cleared once.
                        if((key.equals("size")||key.equals("gender"))&&
                            extra.optJSONArray(key+"Selections")!=null&&
                            extra.optJSONArray(key+"Selections").length()==0)
                            clearKeys.put(key+"Selections");
                    }
                }
                for(String key:new String[]{"sizeSelections","genderSelections"}){
                    org.json.JSONArray before=previousExtra.optJSONArray(key),after=extra.optJSONArray(key);
                    if(before!=null&&before.length()>0&&after!=null&&after.length()==0)clearKeys.put(key);
                    if(previouslyCleared!=null&&after!=null&&after.length()==0)
                        for(int i=0;i<previouslyCleared.length();i++)
                            if(key.equals(previouslyCleared.optString(i)))clearKeys.put(key);
                }
                org.json.JSONArray beforeSpecies=previousExtra.optJSONArray("pokemonSelections");
                org.json.JSONArray afterSpecies=extra.optJSONArray("pokemonSelections");
                if(afterSpecies!=null&&afterSpecies.length()==0&&beforeSpecies!=null&&beforeSpecies.length()>0)
                    clearKeys.put("pokemonSelections");
                if(afterSpecies!=null&&afterSpecies.length()==0&&input.optBoolean("clearPokemonSelection",false))
                    clearKeys.put("pokemonSelections");
                if(previouslyCleared!=null&&afterSpecies!=null&&afterSpecies.length()==0)
                    for(int i=0;i<previouslyCleared.length();i++)
                        if("pokemonSelections".equals(previouslyCleared.optString(i)))clearKeys.put("pokemonSelections");
                extra.put("clearExtraKeys",clearKeys);
                extra.put("includePreviousEvolutions",input.optBoolean("includePreviousEvolutions",true));
                String updatedExtras=extra.toString();
                if(mode.equals(nextMode)&&rawAttack==a&&rawDefense==d&&rawStamina==st&&
                    glRank==gl&&ulRank==ul&&ivPercentMin==min&&ivPercentMax==max&&
                    extraFiltersJson.equals(updatedExtras)){
                    // Applying the same values must retry a previously failed
                    // site submission instead of silently doing nothing.
                    status("Repetindo busca com o filtro atual...");
                    OverlayService.this.refresh(true);
                    return;
                }
                mode=nextMode;rawAttack=a;rawDefense=d;rawStamina=st;
                glRank=gl;ulRank=ul;ivPercentMin=min;ivPercentMax=max;
                extraFiltersJson=updatedExtras;
                getSharedPreferences("prefs",0).edit()
                    .putString("mode",mode).putInt("rawAttack",a).putInt("rawDefense",d)
                    .putInt("rawStamina",st).putInt("glRank",gl).putInt("ulRank",ul)
                    .putInt("ivPercentMin",min).putInt("ivPercentMax",max)
                    .putString("extraFiltersJson",extraFiltersJson).apply();
                replaceActiveFilterSearch();
                // Preserve authenticated Shiny preference; reverify it after location when searching.
                // Keep site-confirmed cards with their original mode/icon
                // until the new search passes all checks and returns valid cards.
                boolean preview=restoreFilterPreview();
                if(!preview)resultsStale=count()>0;
                hideDetails();
                status(preview?"Prévia anterior do filtro · aguardando nova consulta":"Filtro selecionado · aguardando consulta");
                scheduleFilterChangeRefresh();
            }catch(org.json.JSONException ex){
                status("Filtro inválido. Escolha os valores novamente.");
            }
        });}
        @JavascriptInterface public void setMode(String s){select(s);}
        @JavascriptInterface public void select(String s){handler.post(()->{
            if(!s.equals("iv")&&!s.equals("raw")&&!s.equals("percent")&&!s.equals("gl")&&!s.equals("ul"))return;
            String selected=s.equals("iv")?"raw":s;
            if(mode.equals(selected))return;
            mode=selected;
            // Legacy IV100 calls mean Raw IV 15/15/15; no separate selector is exposed.
            if(s.equals("iv")){rawAttack=15;rawDefense=15;rawStamina=15;}
            android.content.SharedPreferences.Editor changed=getSharedPreferences("prefs",0).edit().putString("mode",selected);
            if(s.equals("iv"))changed.putInt("rawAttack",15).putInt("rawDefense",15).putInt("rawStamina",15);
            changed.apply();
            android.widget.Toast.makeText(OverlayService.this,
                "Filtro selecionado: "+(s.equals("iv")?"Raw IV 15/15/15":s.equals("raw")?"Raw IV":s.equals("percent")?"% IV":s.equals("gl")?"Grande Liga":"Ultra Liga"),
                android.widget.Toast.LENGTH_SHORT).show();
            replaceActiveFilterSearch();shinyVerified=false;
            boolean preview=restoreFilterPreview();
            if(!preview)resultsStale=count()>0;
            hideDetails();
            status(preview?"Prévia anterior do filtro · aguardando nova consulta":"Filtro selecionado · aguardando consulta");
            scheduleFilterChangeRefresh();
        });}
        @JavascriptInterface public void menu(boolean open){handler.post(()->OverlayService.this.menu(open));}
        @JavascriptInterface public void cycleMode(){handler.post(()->{
            mode=mode.equals("raw")?"percent":mode.equals("percent")?"gl":mode.equals("gl")?"ul":"raw";
            getSharedPreferences("prefs",0).edit().putString("mode",mode).apply();
            replaceActiveFilterSearch();shinyVerified=false;
            boolean preview=restoreFilterPreview();
            if(!preview)resultsStale=count()>0;
            hideDetails();
            status(preview?"Prévia anterior do filtro · aguardando nova consulta":"Filtro selecionado · aguardando consulta");
            scheduleFilterChangeRefresh();
        });}
        private void applySpriteSize(int size){
            if(size!=35&&size!=45&&size!=55)return;
            if(size==spriteSize){update();return;}
            spriteSize=size;
            getSharedPreferences("prefs",0).edit().putInt("spriteSize",size).apply();
            if(params!=null){
                params.width=dp(minimized?BUBBLE_DP:dockDp());
                params.x=Math.max(0,Math.min(metrics().widthPixels-params.width,params.x));
                grip.setLayoutParams(new FrameLayout.LayoutParams(
                    dp(minimized?BUBBLE_DP:dockDp()),dp(minimized?BUBBLE_DP:30),
                    Gravity.TOP|Gravity.LEFT));
                updateWindow();
                updateResultsWidth();
            }
            update();
        }
        // Direct P/M/G selection keeps the Personalização popup open.
        @JavascriptInterface public void setSpriteSize(int size){
            handler.post(()->applySpriteSize(size));
        }
        @JavascriptInterface public void cycleSpriteSize(){handler.post(()->{
            int[] sizes={35,45,55};
            int at=1;
            for(int j=0;j<sizes.length;j++)if(sizes[j]==spriteSize)at=j;
            int size=sizes[(at+1)%sizes.length];
            boolean wasExpanded=menuExpanded;
            if(wasExpanded)menu(false);
            applySpriteSize(size);
            if(wasExpanded)menu(true);
            android.widget.Toast.makeText(OverlayService.this,
                new String[]{"P","M","G"}[(at+1)%sizes.length]+" · "+size+" × "+size,
                android.widget.Toast.LENGTH_SHORT).show();
        });}
        // UX-MENU-01: presentation choices are private to this device;
        // never alter search criteria or the official PoGoCoordinates session.
        @JavascriptInterface public void setResultTextVisible(boolean value){handler.post(()->{
            showResultText=value;
            getSharedPreferences("prefs",0).edit().putBoolean("showResultText",value).apply();
            update();
        });}
        @JavascriptInterface public void setResultDisplayOption(String key,boolean value){
            handler.post(()->{
                String pref;
                switch(key){
                    case "count":resultShowCount=value;pref="resultShowCount";break;
                    case "name":resultShowName=value;pref="resultShowName";break;
                    case "number":resultShowNumber=value;pref="resultShowNumber";break;
                    case "gender":resultShowGender=value;pref="resultShowGender";break;
                    case "size":resultShowSize=value;pref="resultShowSize";break;
                    case "form":resultShowForm=value;pref="resultShowForm";break;
                    case "moves":resultShowMoves=value;pref="resultShowMoves";break;
                    case "location":resultShowLocation=value;pref="resultShowLocation";break;
                    case "distance":resultShowDistance=value;pref="resultShowDistance";break;
                    case "shiny":resultShowShiny=value;pref="resultShowShiny";break;
                    case "rawIv":resultShowRawIv=value;pref="resultShowRawIv";break;
                    case "overallRankGl":resultShowOverallRankGl=value;pref="resultShowOverallRankGl";break;
                    case "overallRankUl":resultShowOverallRankUl=value;pref="resultShowOverallRankUl";break;
                    case "overallRankMl":resultShowOverallRankMl=value;pref="resultShowOverallRankMl";break;
                    case "speciesIvRankGl":resultShowSpeciesIvRankGl=value;pref="resultShowSpeciesIvRankGl";break;
                    case "speciesIvRankUl":resultShowSpeciesIvRankUl=value;pref="resultShowSpeciesIvRankUl";break;
                    case "speciesIvRankMl":resultShowSpeciesIvRankMl=value;pref="resultShowSpeciesIvRankMl";break;
                    case "cp":resultShowCp=value;pref="resultShowCp";break;
                    case "level":resultShowLevel=value;pref="resultShowLevel";break;
                    case "overallRank":resultShowOverallRank=value;pref="resultShowOverallRank";break;
                    case "speciesIvRank":resultShowSpeciesIvRank=value;pref="resultShowSpeciesIvRank";break;
                    default:return; // Timers/IV keep their original separate controls.
                }
                getSharedPreferences("prefs",0).edit().putBoolean(pref,value).apply();
                update();
            });
        }
        @JavascriptInterface public void setAlertMode(String value){handler.post(()->{
            if(!"on".equals(value)&&!"silent".equals(value)&&!"off".equals(value))return;
            alertsMode=value;alerts=!"off".equals(value);
            getSharedPreferences("prefs",0).edit().putString("alertsMode",value)
                .putBoolean("alerts",alerts).apply();
            update();
        });}
        @JavascriptInterface public void setFavoriteAlertMode(String mode){handler.post(()->{
            if(!"on".equals(mode)&&!"silent".equals(mode)&&!"off".equals(mode))return;
            WatchAlerts.setMode(OverlayService.this,mode);
            update();
        });}
        private void requestAlertTonePicker(String target){
            Intent intent=new Intent(OverlayService.this,MainActivity.class);
            intent.setAction("com.lucianotoscano.pokesearchoverlay.PICK_ALERT_TONE");
            intent.putExtra("alertToneTarget",target);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_SINGLE_TOP|
                Intent.FLAG_ACTIVITY_CLEAR_TOP);
            try{startActivity(intent);}
            catch(Exception ex){recordFailure("selecionar som de notificação",ex);}
        }
        @JavascriptInterface public void pickAlertTone(String target){handler.post(()->{
            if(!"general".equals(target)&&!"favorites".equals(target)&&
                !"species".equals(target))return;
            requestAlertTonePicker(target);
        });}
        @JavascriptInterface public void testNotification(){handler.post(()->{
            boolean sent=WatchAlerts.test(OverlayService.this);
            android.widget.Toast.makeText(OverlayService.this,
                sent?"Teste do canal Favoritos enviado":"Aviso favorito bloqueado. Confira permissão e canal.",
                android.widget.Toast.LENGTH_SHORT).show();
            update();
        });}
        @JavascriptInterface public void testGeneralNotification(){handler.post(()->{
            boolean sent=sendGeneralNotification("🔔 Teste de aviso geral",
                "Teste do canal de novos Pokémon · nenhuma captura real foi detectada.",75);
            android.widget.Toast.makeText(OverlayService.this,
                sent?"Teste de aviso geral enviado":"Aviso geral bloqueado. Confira permissão e canal.",
                android.widget.Toast.LENGTH_SHORT).show();
            update();
        });}
        @JavascriptInterface public void refreshNotificationStatus(){handler.post(()->update());}
        @JavascriptInterface public void requestNotificationPermission(){handler.post(()->{
            Intent intent=new Intent(OverlayService.this,MainActivity.class);
            intent.setAction("com.lucianotoscano.pokesearchoverlay.REQUEST_NOTIFICATION_PERMISSION");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_SINGLE_TOP|
                Intent.FLAG_ACTIVITY_CLEAR_TOP);
            try{startActivity(intent);}catch(Exception e){recordFailure("pedir permissão de alertas",e);}
        });}
        @JavascriptInterface public void openNotificationSettings(){handler.post(()->{
            Intent intent=new Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS);
            intent.putExtra(android.provider.Settings.EXTRA_APP_PACKAGE,getPackageName());
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try{startActivity(intent);}
            catch(Exception e){
                Intent fallback=new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                    android.net.Uri.parse("package:"+getPackageName()));
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                try{startActivity(fallback);}catch(Exception failed){recordFailure("ajustes de notificações",failed);}
            }
        });}
        @JavascriptInterface public void saveMenuPrefs(String json){handler.post(()->{
            if(json==null||json.length()>1600)return;
            try{
                JSONObject incoming=new JSONObject(json);
                JSONObject clean=new JSONObject();
                String direction=incoming.optString("direction","vertical");
                clean.put("direction","horizontal".equals(direction)?"horizontal":"vertical");
                clean.put("labels",incoming.optBoolean("labels",true));
                String[] allowed={"mode","sh","filters","location","pokemon","star",
                    "bell","period","appearance","report","donate","close"};
                java.util.Set<String> valid=new java.util.HashSet<>(java.util.Arrays.asList(allowed));
                for(String key:new String[]{"order","hidden"}){
                    org.json.JSONArray items=incoming.optJSONArray(key),safe=new org.json.JSONArray();
                    java.util.Set<String> seen=new java.util.HashSet<>();
                    if(items!=null)for(int i=0;i<items.length()&&i<12;i++){
                        String id=items.optString(i,"");
                        if(valid.contains(id)&&seen.add(id)&&(!"hidden".equals(key)||(!"close".equals(id)&&!"appearance".equals(id)&&!"period".equals(id)&&!"sh".equals(id))))
                            safe.put(id);
                    }
                    clean.put(key,safe);
                }
                getSharedPreferences("prefs",0).edit()
                    .putString("menuUiPrefs",clean.toString()).apply();
                update();
            }catch(Exception ignored){}
        });}
        @JavascriptInterface public void toggleTimers(){handler.post(()->{
            showTimers=!showTimers;
            getSharedPreferences("prefs",0).edit().putBoolean("showTimers",showTimers).apply();
            update();
        });}
        @JavascriptInterface public void toggleGeneralAlerts(){handler.post(()->{
            alertsMode="off".equals(alertsMode)?"on":"on".equals(alertsMode)?"silent":"off";
            alerts=!"off".equals(alertsMode);
            getSharedPreferences("prefs",0).edit().putString("alertsMode",alertsMode)
                .putBoolean("alerts",alerts).apply();
            update();
            android.widget.Toast.makeText(OverlayService.this,
                "Novos Pokémon: "+("on".equals(alertsMode)?"ligadas":"silent".equals(alertsMode)?"silenciosas":"desligadas"),
                android.widget.Toast.LENGTH_SHORT).show();
        });}
        @JavascriptInterface public void toggleWatchAlerts(){handler.post(()->{
            boolean enabled=!WatchAlerts.enabled(OverlayService.this);
            WatchAlerts.setMode(OverlayService.this,enabled?"on":"off");
            update();
            android.widget.Toast.makeText(OverlayService.this,
                enabled?"Alertas de procurados ativados":"Alertas de procurados pausados",
                android.widget.Toast.LENGTH_SHORT).show();
        });}
        @JavascriptInterface public void openPix(){handler.post(()->{
            Intent intent=new Intent(OverlayService.this,MainActivity.class);
            intent.setAction("com.lucianotoscano.pokesearchoverlay.OPEN_PIX");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|
                Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP);
            try{startActivity(intent);}catch(Exception e){recordFailure("abrir atalho",e);}
        });}
        @JavascriptInterface public void openSettings(){handler.post(()->{
            Intent intent=new Intent(OverlayService.this,MainActivity.class);
            intent.setAction("com.lucianotoscano.pokesearchoverlay.OPEN_SETTINGS");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|
                Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP);
            try{startActivity(intent);}catch(Exception e){recordFailure("abrir preferências",e);}
        });}
        @JavascriptInterface public void showStatus(){handler.post(()->{
            android.widget.Toast.makeText(OverlayService.this,
                status==null?"Aguardando busca":status,android.widget.Toast.LENGTH_LONG).show();
        });}
        @JavascriptInterface public void openReport(){handler.post(()->{
            Intent intent=new Intent(OverlayService.this,MainActivity.class);
            intent.setAction("com.lucianotoscano.pokesearchoverlay.OPEN_REPORT");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|
                Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP);
            try{startActivity(intent);}catch(Exception e){
                diagnosticError("Não foi possível abrir o relatório de bugs.");
            }
        });}
        @JavascriptInterface public void openWatchList(){handler.post(()->{
            if(root==null||loginPaused||pickerOpen)return;
            pickerOpen=true;
            hideDetails();
            root.setVisibility(View.GONE);
            if(resultRoot!=null)resultRoot.setVisibility(View.GONE);
            if(menuRoot!=null)menuRoot.setVisibility(View.GONE);
            try{
                PokemonPicker.show(OverlayService.this,()->{
                    if(!stopped)update();
                },()->{
                    pickerOpen=false;
                    if(!stopped&&!loginPaused&&root!=null)root.setVisibility(View.VISIBLE);
                    if(!stopped&&!loginPaused&&!minimized&&resultRoot!=null)
                        resultRoot.setVisibility(View.VISIBLE);
                    if(!stopped&&!loginPaused&&menuExpanded&&menuRoot!=null)menuRoot.setVisibility(View.VISIBLE);
                    update();
                });
            }catch(Exception e){
                pickerOpen=false;
                if(root!=null&&!loginPaused)root.setVisibility(View.VISIBLE);
                if(resultRoot!=null&&!loginPaused&&!minimized)
                    resultRoot.setVisibility(View.VISIBLE);
                if(menuRoot!=null&&!loginPaused&&menuExpanded)menuRoot.setVisibility(View.VISIBLE);
                diagnosticError("Não foi possível abrir favoritos no overlay.");
            }
        });}
        @JavascriptInterface public void setIntervalMinutes(int minutes){handler.post(()->{
            if(minutes!=0&&minutes!=3&&minutes!=5&&minutes!=10&&minutes!=15&&minutes!=20)return;
            if(intervalMinutes==minutes)return;
            intervalMinutes=minutes;
            getSharedPreferences("prefs",0).edit()
                .putInt("intervalMinutes",intervalMinutes).putBoolean("intervalExplicit",true).apply();
            schedulePeriodic();
            update();
            android.widget.Toast.makeText(OverlayService.this,
                intervalMinutes==0?"AUTO desligado":"AUTO: "+intervalMinutes+" minutos",android.widget.Toast.LENGTH_SHORT).show();
        });}
        @JavascriptInterface public void cycleInterval(){handler.post(()->{
            int[] options={0,3,5,10,15,20};
            int next=0;
            for(int j=0;j<options.length;j++){
                if(options[j]==intervalMinutes){next=(j+1)%options.length;break;}
            }
            intervalMinutes=options[next];
            getSharedPreferences("prefs",0).edit().putInt("intervalMinutes",intervalMinutes).putBoolean("intervalExplicit",true).apply();
            schedulePeriodic();update();
        });}
        @JavascriptInterface public void shiny(){handler.post(()->{
            if(stopped||loginPaused)return;
            shiny=!shiny;
            android.content.SharedPreferences prefs=getSharedPreferences("prefs",0);
            prefs.edit().putBoolean("shiny",shiny).apply();
            replaceActiveFilterSearch();
            final int generation=requestGeneration;
            shinyVerified=false;
            shinyLoginWindowOpened=false;
            shinyLoginPromptRequested=shiny;
            // Keep existing results visible while the new site state is pending.
            status(shiny?"✨ Verificando acesso ao Shiny...":"✨ Desativando Shiny no site...");
            if(!loaded||website==null){
                if(shiny){
                    status("✨ Abrindo login; pesquisa ainda não carregada.");
                    openShinyLogin();
                }else status("✨ Shiny desligado; sincronização no próximo carregamento.");
                return;
            }
            if(!shiny){
                // Coords, Shiny and other filters belong to one site form.
                // Refresh fills only changed fields and verifies all selections.
                if(locationEnabled){OverlayService.this.refresh(true);return;}
                prepareImmediateShiny(generation);
                return;
            }
            execute("session",session->{
                if(stopped||loginPaused||generation!=requestGeneration)return;
                String auth=session.optString("auth","não confirmado");
                prefs.edit().putString("sessionStatus",auth).apply();
                if(!siteConfirmsShinyAccount(session)){
                    revertUnverifiedShiny("✨ Conta logada e treinador confirmado são obrigatórios para Shiny.");
                    openShinyLogin();
                    return;
                }
                if(locationEnabled){
                    // Re-enter the unified form so the site does not discard
                    // active Coords when switching Shiny.
                    status("✨ Sincronizando Shiny e localização na mesma pesquisa...");
                    OverlayService.this.refresh(true);
                    return;
                }
                prepareImmediateShiny(generation);
            });
        });}
        @JavascriptInterface public void refresh(){handler.post(()->{
            android.widget.Toast.makeText(OverlayService.this,
                "↻ Atualização solicitada",android.widget.Toast.LENGTH_SHORT).show();
            OverlayService.this.refresh(true);
        });}
        @JavascriptInterface public void minimize(){handler.post(()->OverlayService.this.minimize(true));}
        @JavascriptInterface public void restore(){handler.post(()->OverlayService.this.minimize(false));}
        @JavascriptInterface public void close(){handler.post(()->stopSelf());}
        @JavascriptInterface public void resize(int size){handler.post(()->OverlayService.this.resize(size));}
        @JavascriptInterface public void resizeResults(int size){handler.post(()->OverlayService.this.resizeResults(size));}
        @JavascriptInterface public void resizeResultsMetadata(int widthDp){
            handler.post(()->OverlayService.this.resizeResultsMetadata(widthDp));
        }
        @JavascriptInterface public void toggleResultsCollapsed(){handler.post(OverlayService.this::toggleResultsCollapsed);}
        @JavascriptInterface public void resizeMenu(int size){handler.post(()->OverlayService.this.resizeMenu(size));}
        @JavascriptInterface public void resizeDetail(int size){handler.post(()->OverlayService.this.resizeDetail(size));}
        @JavascriptInterface public void toggleDetail(int index){handler.post(()->{
            if(selected==index)hideDetails();else showDetails(index);
        });}
        @JavascriptInterface public void hideDetail(){handler.post(OverlayService.this::hideDetails);}
        @JavascriptInterface public void longPressCoords(int i){handler.post(()->{
            try{
                JSONArray a=new JSONArray(results);
                if(i>=0&&i<a.length())requestCoordinates(a.getJSONObject(i).optInt("sourceIndex",-1),true);
            }catch(Exception e){recordFailure("detalhes coordenadas",e);}
        });}
        @JavascriptInterface public void coords(int sourceIndex){handler.post(()->requestCoordinates(sourceIndex,false));}
    }
    private void requestCoordinates(int sourceIndex,boolean autoCopy){
        JSONObject chosen=null;
        try{
            JSONArray a=new JSONArray(results);
            for(int i=0;i<a.length();i++){
                JSONObject item=a.getJSONObject(i);
                if(item.optInt("sourceIndex",-1)==sourceIndex){chosen=item;break;}
            }
        }catch(Exception e){recordFailure("ler cartão coordenadas",e);}
        if(chosen==null){deliverCoords("","Pokémon indisponível");return;}
        JSONObject target=chosen;
        execute("coords:"+sourceIndex,response->{
            if(!response.optBoolean("ok")){
                deliverCoords("",response.optString("status","Get coords indisponível"));return;
            }
            pollCoordinates(target,0,autoCopy);
        });
    }
    private void syncPreferencesWithoutSearch(){
        if(stopped)return;
        android.content.SharedPreferences prefs=getSharedPreferences("prefs",0);
        int wanted=prefs.getInt("spriteSize",45);
        spriteSize=(wanted==35||wanted==45||wanted==55)?wanted:45;
        showTimers=prefs.getBoolean("showTimers",false);
        showResultText=prefs.getBoolean("showResultText",false);
        // Never auto-enable a Pokémon info field, including spawn count.
        // Existing individually saved ON/OFF preferences remain untouched.
        resultShowCount=prefs.getBoolean("resultShowCount",false);
        resultShowName=prefs.getBoolean("resultShowName",false);
        resultShowNumber=prefs.getBoolean("resultShowNumber",false);
        resultShowGender=prefs.getBoolean("resultShowGender",false);
        resultShowSize=prefs.getBoolean("resultShowSize",false);
        resultShowForm=prefs.getBoolean("resultShowForm",false);
        resultShowMoves=prefs.getBoolean("resultShowMoves",false);
        resultShowLocation=prefs.getBoolean("resultShowLocation",false);
        resultShowDistance=prefs.getBoolean("resultShowDistance",false);
        resultShowShiny=prefs.getBoolean("resultShowShiny",false);
        resultShowCp=prefs.getBoolean("resultShowCp",false);
        resultShowLevel=prefs.getBoolean("resultShowLevel",false);
        resultShowOverallRank=prefs.getBoolean("resultShowOverallRank",false);
        resultShowSpeciesIvRank=prefs.getBoolean("resultShowSpeciesIvRank",false);
        resultShowRawIv=prefs.getBoolean("resultShowRawIv",false);
        // Migrate the former single rank switch to GL without guessing a league
        // for newly selected displays; UL/ML remain independently opt-in.
        resultShowOverallRankGl=prefs.getBoolean("resultShowOverallRankGl",resultShowOverallRank);
        resultShowOverallRankUl=prefs.getBoolean("resultShowOverallRankUl",false);
        resultShowOverallRankMl=prefs.getBoolean("resultShowOverallRankMl",false);
        resultShowSpeciesIvRankGl=prefs.getBoolean("resultShowSpeciesIvRankGl",resultShowSpeciesIvRank);
        resultShowSpeciesIvRankUl=prefs.getBoolean("resultShowSpeciesIvRankUl",false);
        resultShowSpeciesIvRankMl=prefs.getBoolean("resultShowSpeciesIvRankMl",false);
        alerts=prefs.getBoolean("alerts",false);
        alertsMode=prefs.getString("alertsMode",alerts?"on":"off");
        if(!"on".equals(alertsMode)&&!"silent".equals(alertsMode))alertsMode="off";
        alerts=!"off".equals(alertsMode);
        String wantedSort=prefs.getString("sort","despawn");
        sort=("rank".equals(wantedSort)||"iv".equals(wantedSort)||
              "shiny".equals(wantedSort))?wantedSort:"despawn";
        try{
            // Site order is authoritative when the user selected remote Sort by.
            JSONObject extras=new JSONObject(extraFiltersJson);
            if(!extras.optString("sortBy","").trim().isEmpty())sort="site";
        }catch(org.json.JSONException ignored){}
        try{
            JSONArray items=new JSONArray(results);
            results=sortItems(items).toString();
            if(selected>=0)hideDetails(); // Row indices can change when sorting.
            armNextDespawn(new JSONArray(results));
        }catch(Exception e){recordFailure("sincronizar ordenação",e);}
        if(params!=null){
            params.width=dp(minimized?BUBBLE_DP:dockDp());
            params.x=Math.max(0,Math.min(params.x,metrics().widthPixels-params.width));
            if(grip!=null)grip.setLayoutParams(new FrameLayout.LayoutParams(
                dp(minimized?BUBBLE_DP:dockDp()),dp(minimized?BUBBLE_DP:30),
                Gravity.TOP|Gravity.LEFT));
            updateWindow();
            updateResultsWidth();
            moveDetail();
        }
        update(); // Local UI only; does not call refresh or navigate the website.
    }
    @Override public int onStartCommand(Intent i,int flags,int id){
        String action=i==null||i.getAction()==null?"":i.getAction();
        if("com.lucianotoscano.pokesearchoverlay.SYNC_PREFS".equals(action)){
            syncPreferencesWithoutSearch();
            return START_STICKY;
        }
        if("com.lucianotoscano.pokesearchoverlay.SYNC_HOME_THEME".equals(action)){
            syncHomeThemeVisual(true);
            return START_STICKY;
        }
        if("com.lucianotoscano.pokesearchoverlay.LOGIN_BEGIN".equals(action)){
            loginPaused=true;
            guardSubmittedSearchBeforeReplacement();
            ++requestGeneration;
            searchInProgress=false;
            pageLoadGeneration=-1;
            pendingPageRefreshGeneration=-1;
            pendingLoginRefreshGeneration=-1;
            pendingReloadGeneration=-1;
            // Cancels queued, periodic, expiration, page, login and reload timers.
            cancelSessionCallbacks();
            if(root!=null)root.setVisibility(View.GONE);
            if(resultRoot!=null)resultRoot.setVisibility(View.GONE);
            if(menuRoot!=null)menuRoot.setVisibility(View.GONE);
            if(detailRoot!=null)detailRoot.setVisibility(View.GONE);
            BugReport.log(this,"LOGIN","Página de autenticação aberta, overlay oculto");
            return START_STICKY;
        }
        if("com.lucianotoscano.pokesearchoverlay.LOGIN_END".equals(action)){
            loginPaused=false;
            if(root!=null&&!pickerOpen)root.setVisibility(View.VISIBLE);
            if(resultRoot!=null&&!pickerOpen&&!minimized)resultRoot.setVisibility(View.VISIBLE);
            if(menuRoot!=null&&!pickerOpen&&menuExpanded)menuRoot.setVisibility(View.VISIBLE);
            if(detailRoot!=null&&selected>=0&&!pickerOpen)detailRoot.setVisibility(View.VISIBLE);
            cancelSessionCallbacks();
            pendingLoginRefreshGeneration=requestGeneration;
            // A canceled dialog only resumes the overlay; it never starts an
            // unnecessary network request. Successful login is handled by
            // REFRESH_LOGIN, which reloads the collector exactly once.
            boolean authConfirmed=i!=null&&i.getBooleanExtra("authConfirmed",false);
            if(authConfirmed&&!stopped&&!loginPaused&&!pickerOpen)
                handler.postDelayed(loginEndRefresh,1600L);
            schedulePeriodic();
            BugReport.log(this,"LOGIN","Página de autenticação fechada");
            return START_STICKY;
        }
        boolean initialStart=firstStart;
        firstStart=false;
        if("com.lucianotoscano.pokesearchoverlay.REFRESH_LOGIN".equals(action)||
           (initialStart&&action.isEmpty())){
            shinyLoginPromptRequested=false;
            shinyLoginWindowOpened=false;
            guardSubmittedSearchBeforeReplacement();
            ++requestGeneration;
            searchInProgress=false;
            shinyVerified=false;
            loaded=false;
            pageLoadGeneration=-1;
            pendingPageRefreshGeneration=-1;
            pendingLoginRefreshGeneration=-1;
            cancelSessionCallbacks();
            if(!initialStart){
                // Keep previously verified Pokémon visible until the collector
                // confirms the newly shared login session.
                resultsStale=count()>0;
                hideDetails();
                status("Sincronizando sessão após login...");
            }
            try{CookieManager.getInstance().flush();}
            catch(RuntimeException e){recordFailure("sincronizar cookies",e);}
            pendingReloadGeneration=requestGeneration;
            if(!stopped&&!loginPaused)
                handler.postDelayed(deferredSessionReload,350L);
            // Keep knownSpawns on session reload to prevent duplicate notifications.
        }
        // v0.20 saved 10 as the implicit default; only keep a rate the user explicitly chose.
        android.content.SharedPreferences pref=getSharedPreferences("prefs",0);
        if(!pref.getBoolean("shinyOptInV32",false)){
            pref.edit().putBoolean("shiny",false).putBoolean("shinyOptInV32",true).apply();
            shiny=false;
        }
        if(!pref.getBoolean("intervalExplicit",false)){
            intervalMinutes=5;
            pref.edit().putInt("intervalMinutes",5).apply();
        }else{
            intervalMinutes=pref.getInt("intervalMinutes",5);
        }
        if(intervalMinutes!=0&&intervalMinutes!=3&&intervalMinutes!=5&&
           intervalMinutes!=10&&intervalMinutes!=15&&intervalMinutes!=20)intervalMinutes=5;
        schedulePeriodic();
        spriteSize=pref.getInt("spriteSize",45);
        if(spriteSize!=35&&spriteSize!=45&&spriteSize!=55)spriteSize=45;
        showTimers=pref.getBoolean("showTimers",false);
        showResultText=pref.getBoolean("showResultText",false);
        alerts=pref.getBoolean("alerts",false);
        alertsMode=pref.getString("alertsMode",alerts?"on":"off");
        if(!"on".equals(alertsMode)&&!"silent".equals(alertsMode))alertsMode="off";
        alerts=!"off".equals(alertsMode);
        sort="site"; // Sort remotely before the ten-result cutoff; preserve its returned order.
        if(params!=null&&!menuExpanded){
            params.width=dp(minimized?BUBBLE_DP:dockDp());
            params.x=Math.min(params.x,metrics().widthPixels-params.width);
            grip.setLayoutParams(new FrameLayout.LayoutParams(
                dp(minimized?BUBBLE_DP:dockDp()),dp(minimized?BUBBLE_DP:30),Gravity.TOP|Gravity.LEFT));
            updateWindow();
        }
        // Apply saved P/M/G sizing to the independent Pokémon window on startup too.
        updateResultsWidth();
        locationEnabled=pref.getBoolean("locationEnabled",false);
        locationCoords=locationEnabled?pref.getString("locationCoords",""):"";
        locationRadius=locationEnabled?pref.getInt("locationRadius",0):0;
        if(locationEnabled&&(extractCoordinates(locationCoords).isEmpty()||locationRadius<0||locationRadius>1000)){
            locationEnabled=false;locationCoords="";locationRadius=0;
            pref.edit().putBoolean("locationEnabled",false).remove("locationCoords").remove("locationRadius").apply();
        }
        extraFiltersJson=pref.getString("extraFiltersJson","{}");
        try{new JSONObject(extraFiltersJson);}catch(org.json.JSONException ignored){extraFiltersJson="{}";}
        mode=pref.getString("mode",mode);
        boolean migrateLegacyHundo="iv".equals(mode);
        if(migrateLegacyHundo)mode="raw";
        if(!mode.equals("raw")&&!mode.equals("percent")&&!mode.equals("gl")&&!mode.equals("ul"))
            mode="raw";
        rawAttack=Math.max(0,Math.min(15,pref.getInt("rawAttack",15)));
        rawDefense=Math.max(0,Math.min(15,pref.getInt("rawDefense",15)));
        rawStamina=Math.max(0,Math.min(15,pref.getInt("rawStamina",15)));
        if(migrateLegacyHundo){
            rawAttack=15;rawDefense=15;rawStamina=15;
            pref.edit().putString("mode","raw").putInt("rawAttack",15)
                .putInt("rawDefense",15).putInt("rawStamina",15).apply();
        }
        glRank=Math.max(1,Math.min(50,pref.getInt("glRank",1)));
        ulRank=Math.max(1,Math.min(50,pref.getInt("ulRank",1)));
        // Existing installations may have saved unattainable values such as 90%.
        // Round Min DOWN and Max UP, preserving the intended inclusive range.
        int previousMin=Math.max(0,Math.min(100,pref.getInt("ivPercentMin",0)));
        int previousMax=Math.max(previousMin,Math.min(100,pref.getInt("ivPercentMax",100)));
        ivPercentMin=floorIvPercent(previousMin);
        ivPercentMax=Math.max(ivPercentMin,ceilIvPercent(previousMax));
        if(ivPercentMin!=previousMin||ivPercentMax!=previousMax)
            pref.edit().putInt("ivPercentMin",ivPercentMin)
                .putInt("ivPercentMax",ivPercentMax).apply();
        shiny=getSharedPreferences("prefs",0).getBoolean("shiny",false);
        if(!shiny)shinyVerified=false;
        update();
        return START_STICKY;
    }
    private void destroyWebView(WebView web,boolean hasBridge,String stage){
        if(web==null)return;
        try{web.stopLoading();}catch(RuntimeException e){recordFailure(stage+" stop",e);}
        if(hasBridge){
            try{web.removeJavascriptInterface("Native");}
            catch(RuntimeException e){recordFailure(stage+" JS",e);}
        }
        try{
            android.view.ViewParent parent=web.getParent();
            if(parent instanceof android.view.ViewGroup)
                ((android.view.ViewGroup)parent).removeView(web);
        }catch(RuntimeException e){recordFailure(stage+" detach",e);}
        try{web.destroy();}catch(RuntimeException e){recordFailure(stage+" destroy",e);}
    }
    @Override public void onDestroy(){
        FirebaseStats.setOverlayVisible(this,false);
        stopped=true;
        running=false;
        ++requestGeneration;
        searchInProgress=false;
        handler.removeCallbacksAndMessages(null);
        if(wm!=null&&root!=null){try{wm.removeView(root);}catch(Exception e){recordFailure("remover dock",e);}}
        if(wm!=null&&menuRoot!=null){try{wm.removeView(menuRoot);}catch(Exception e){recordFailure("remover menu",e);}}
        if(wm!=null&&resultRoot!=null){try{wm.removeView(resultRoot);}catch(Exception e){recordFailure("remover resultados",e);}}
        if(wm!=null&&detailRoot!=null){try{wm.removeView(detailRoot);}catch(Exception e){recordFailure("remover detalhes",e);}}
        destroyWebView(panel,true,"painel");panel=null;
        destroyWebView(menuPanel,true,"menu");menuPanel=null;
        destroyWebView(resultPanel,true,"resultados");resultPanel=null;
        destroyWebView(detailPanel,true,"detalhes");detailPanel=null;
        destroyWebView(website,false,"site");website=null;
        root=null;menuRoot=null;detailRoot=null;resultRoot=null;resultGrip=null;resultParams=null;
        super.onDestroy();
    }
    @Override public IBinder onBind(Intent intent){return null;}
}

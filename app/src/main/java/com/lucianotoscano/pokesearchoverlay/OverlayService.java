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
    // Screen-off is a real system transition, not a touch. Never credit a gap across it.
    private final android.content.BroadcastReceiver missionScreenOffReceiver =
        new android.content.BroadcastReceiver() {
            @Override public void onReceive(android.content.Context context, Intent intent) {
                if (intent != null && Intent.ACTION_SCREEN_OFF.equals(intent.getAction()))
                    SupportMissionState.overlayStopped();
            }
        };
    private boolean missionScreenOffRegistered = false;
    private static final String ACTION_TRAINER_CHANGED =
        "com.lucianotoscano.pokesearchoverlay.TRAINER_CHANGED";
    private final android.content.BroadcastReceiver trainerChangedReceiver =
        new android.content.BroadcastReceiver(){
            @Override public void onReceive(android.content.Context ctx, Intent intent){
                if(intent==null||!ACTION_TRAINER_CHANGED.equals(intent.getAction())||stopped)return;
                // The selected trainer must be reflected in BOTH independent
                // Pokeball searches. Revalidate the official login and Shiny
                // before emitting new cards/alerts; never mix cached results.
                ++requestGeneration;
                searchInProgress=false;
                queuedManualRefresh=false;
                results="[]";resultsStale=false;
                displayedApiResults=false;displayedApiSearchId=-1;
                selected=-1;shinyVerified=false;
                status("Treinador alterado · sincronizando resultados...");
                update();
                refresh(true);
            }
        };
    private boolean trainerChangedReceiverRegistered=false;
    private static final String ACTION_COOLDOWN_CHANGED =
        "com.lucianotoscano.pokesearchoverlay.COOLDOWN_CHANGED";
    private boolean cooldownChangedReceiverRegistered=false;
    private final android.content.BroadcastReceiver cooldownChangedReceiver =
        new android.content.BroadcastReceiver(){
            @Override public void onReceive(android.content.Context c,Intent intent){
                if(stopped||intent==null||!ACTION_COOLDOWN_CHANGED.equals(intent.getAction()))return;
                pushCooldownState();
            }
        };
    private void notifyCooldownChanged(){
        sendBroadcast(new Intent(ACTION_COOLDOWN_CHANGED).setPackage(getPackageName()));
    }
    private String cooldownTrainerScope(){
        // Cooldown checkpoints are keyed by the confirmed trainer for
        // THIS Pokébola, never the other account's global selection.
        return PogoAccountSlots.trainer(this,isSecondaryOverlay());
    }
    private boolean cooldownEnabled(String scope){
        return !scope.isEmpty()&&getSharedPreferences("prefs",MODE_PRIVATE)
            .getBoolean("cooldownEnabled_"+scope,false);
    }
    private void pushCooldownState(){
        String scope=cooldownTrainerScope();
        JSONObject data=CooldownCaptureStore.ui(this,scope,cooldownEnabled(scope));
        try{
            data.put("searchCenter",displayedApiResults&&locationEnabled&&locationVerified?
                locationCoords:"");
            data.put("apiVerified",displayedApiResults&&locationVerified&&
                !resultsStale&&!searchInProgress);
            data.put("fresh",!resultsStale&&!searchInProgress);
        }catch(Exception ignored){}
        String jsPayload="window.onCooldownState("+data.toString()+")";
        js(resultPanel,resultLoaded,jsPayload);
        js(menuPanel,menuLoaded,jsPayload);
        js(popupPanel,popupLoaded,jsPayload);
        js(detailPanel,detailLoaded,"window.cooldownChanged("+data.toString()+")");
    }
    private void cooldownFeedback(String message){
        js(detailPanel,detailLoaded,"window.cooldownFeedback("+JSONObject.quote(message)+")");
    }
    private void confirmCooldownCapture(int index){
        if(stopped||loginPaused||index<0||selected<0||detailRoot==null||
            detailRoot.getVisibility()!=View.VISIBLE)return;
        String scope=cooldownTrainerScope();
        if(scope.isEmpty()){cooldownFeedback("Vincule um treinador para registrar a captura.");return;}
        try{
            JSONArray arr=new JSONArray(results);
            // JS passes sourceIndex from the provider, while selected is the
            // displayed array index. Never confuse them after sorting/filtering.
            if(selected>=arr.length()){cooldownFeedback("Resultado alterado.");return;}
            JSONObject item=arr.getJSONObject(selected);
            if(item.optInt("sourceIndex",-1)!=index||!currentCoordinateTarget(item)){
                cooldownFeedback("Identidade do Pokémon alterada.");return;
            }
            String coords=extractCoordinates(item.optString("coords",""));
            if(coords.isEmpty()){cooldownFeedback("Use Get coords antes de confirmar.");return;}
            String fingerprint=coords+"|"+item.optString("number")+"|"+
                item.optString("cp")+"|"+item.optString("iv")+"|"+
                item.optString("expiresAtMs",item.optString("despawn",""));
            boolean saved=CooldownCaptureStore.record(this,scope,coords,fingerprint,
                System.currentTimeMillis());
            if(!saved){cooldownFeedback("Captura já registrada. Use Desfazer para corrigir.");return;}
            getSharedPreferences("prefs",MODE_PRIVATE).edit()
                .putBoolean("cooldownEnabled_"+scope,true).apply();
            pushCooldownState();notifyCooldownChanged();
            cooldownFeedback("✓ Captura registrada localmente, sem publicar no chat.");
        }catch(Exception ignored){cooldownFeedback("Não foi possível validar esta captura.");}
    }
    private void toggleCooldown(){
        String scope=cooldownTrainerScope();
        if(scope.isEmpty()){cooldownFeedback("Selecione um treinador vinculado.");return;}
        boolean now=!cooldownEnabled(scope);
        getSharedPreferences("prefs",MODE_PRIVATE).edit()
            .putBoolean("cooldownEnabled_"+scope,now).apply();
        pushCooldownState();notifyCooldownChanged();
        cooldownFeedback(now?"Cooldown estimado ativado.":"Cooldown oculto.");
    }
    private void undoCooldown(){
        String scope=cooldownTrainerScope();
        if(CooldownCaptureStore.undo(this,scope)){
            pushCooldownState();notifyCooldownChanged();
            cooldownFeedback("Última confirmação desfeita.");
        }else cooldownFeedback("Nenhuma confirmação recente para desfazer.");
    }
    private void resetCooldown(){
        String scope=cooldownTrainerScope();
        if(scope.isEmpty())return;
        CooldownCaptureStore.reset(this,scope);
        pushCooldownState();notifyCooldownChanged();
        cooldownFeedback("Referência de cooldown removida.");
    }
    private static volatile boolean running=false;
    private static volatile boolean secondaryRunning=false;
    public static boolean isRunning(){return running;}
    public static boolean isSecondaryRunning(){return secondaryRunning;}
    // A segunda instância mantém TODA a pesquisa, filtros e posições isolados.
    // Cookies WebView continuam compartilhados automaticamente pelo app Android.
    protected boolean isSecondaryOverlay(){return false;}
    private android.content.SharedPreferences overlayPrefs(){
        return getSharedPreferences(isSecondaryOverlay()?"prefs_secondary":"prefs",0);
    }
    private static final int BUBBLE_DP=45, DETAIL_DP=200, TOOLBAR_DP=34, MENU_BASE_DP=34;
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
            "gearMenuGap","menuItemGap","popupWidth","popupHeight","resultsTransparency","menuTransparency","menuBlur"};
        int[][] limits={{-80,80,0},{0,65,31},{70,160,100},{0,72,0},
            {-16,16,0},{26,42,35},{24,50,30},{0,36,0},
            {-200,200,0},{-350,350,0},{-200,200,0},{-350,350,0},
            {0,80,0},{0,16,0},{160,330,232},{140,420,390},{0,100,100},{0,100,50},{0,16,4}};
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
        js(popupPanel,popupLoaded,jsCode);
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
            int oldMenuBase=visualMenuBaseDp();
            visualPrefsJson=next;
            readVisualRuntime();
            overlayPrefs().edit()
                .putString("visualPrefsJson",visualPrefsJson).apply();
            if(resultParams!=null&&resultRoot!=null&&wm!=null){
                updateResultHeaderGrip();
                resultParams.height=Math.max(resultParams.height,dp(minResultsHeaderHeightDp()));
                resultParams.width=dp(resultWidthDp());
                positionResultsUnderPokeball(true); // Editor offsets now relative to the unified icon.
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
        js(panel,panelLoaded,code);js(menuPanel,menuLoaded,code);js(popupPanel,popupLoaded,code);js(resultPanel,resultLoaded,code);
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
            int width=perCard*columns+
                ResultsSpacingPolicy.additionalRowGapPx(visualResultGapBetween)*(columns-1)+2;
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
    private WindowManager.LayoutParams params,detailParams,menuParams,resultParams,popupParams;
    private FrameLayout root,detailRoot,menuRoot,resultRoot,popupRoot;
    private View grip;
    private WebView panel,detailPanel,website,menuPanel,resultPanel,popupPanel;
    private androidx.webkit.WebViewAssetLoader otaWebLoader;
    private boolean popupLoaded=false;
    private String popupKind="";
    // ACTION_OUTSIDE can arrive BEFORE the toolbar click for the same physical
    // tap. Without a latch the outside event closes a popup and its launcher
    // immediately reopens it, making the second tap look broken.
    private String outsideClosedPopupKind="";
    private long outsideClosedPopupUptimeMs=0L;
    // One in-flight Get coords request may own the detail/clipboard at a time.
    private long coordinateRequestToken=0L;
    private int popupTriggerDp,popupTriggerYDp,popupTriggerHeightDp,popupTriggerWidthDp,popupWidthDp,popupHeightDp;
    private int lastPopupX=Integer.MIN_VALUE,lastPopupY=Integer.MIN_VALUE,lastPopupW=-1,lastPopupH=-1;
    private View resultGrip;
    private boolean menuExpanded=false,menuLeft=false,minimized=false,shiny=false,loaded=false,panelLoaded=false,menuLoaded=false,detailLoaded=false,stopped=false;
    private int height=32,detailHeight=125,requestGeneration=0,selected=-1,intervalMinutes=5,menuPadDp=0;
    private boolean deferMenuSync=false;
    private boolean resultLoaded=false,resultCollapsed=false;
    private int menuDrawX=Integer.MIN_VALUE,menuDrawY=Integer.MIN_VALUE,menuDrawHeight=-1,menuDrawWidth=-1;
    // Keep the requested popup height independent from the clipped current window height.
    private int menuRequestedHeightDp=MENU_BASE_DP;
    private boolean popupAbove=false;
    private int popupOffsetDp=-1,popupRoomDp=-1;
    private String probeScriptCache;
    // User preference controls API/DOM source; current default is API ON, not DOM.
    private AuthorizedApiCollector authorizedApiCollector;
    private boolean displayedApiResults=false;
    private int displayedApiSearchId=-1;
    // Provider 429 is an upstream limit, never a permission to switch accounts,
    // force DOM searches, or retry until accepted. Both Pokeballs share this
    // conservative search gate so concurrent overlays do not cause a burst.
    private static final String API_RATE_BACKOFF_PREF="pogoApiSearchBackoffUntilMs";
    private static final long API_RATE_BACKOFF_DEFAULT_MS=60_000L;
    private static final long API_RATE_BACKOFF_MAX_MS=86_400_000L;
    private final Runnable providerRateLimitResume=this::resumeProviderRateLimitedSearch;
    private void resumeProviderRateLimitedSearch(){
        if(!stopped&&!loginPaused&&authorizedApiQaSelected())refresh(false);
    }
    private long apiProviderBackoffUntil(){
        long now=System.currentTimeMillis();
        long until=getSharedPreferences("prefs",MODE_PRIVATE).getLong(API_RATE_BACKOFF_PREF,0L);
        return until>now&&until-now<=API_RATE_BACKOFF_MAX_MS?until:0L;
    }
    private void scheduleProviderRateLimitResume(){
        handler.removeCallbacks(providerRateLimitResume);
        long until=apiProviderBackoffUntil();
        if(until==0L||stopped||loginPaused||!authorizedApiQaSelected())return;
        nextScheduledSearchAtMs=until;
        // One device with two overlays should not dispatch simultaneously.
        long stagger=isSecondaryOverlay()?3_000L:0L;
        handler.postDelayed(providerRateLimitResume,until-System.currentTimeMillis()+stagger);
    }
    private void noteProviderRateLimit(int suggestedSeconds){
        long wait=API_RATE_BACKOFF_DEFAULT_MS;
        if(suggestedSeconds>=1&&suggestedSeconds<=86400)
            wait=Math.max(wait,(long)suggestedSeconds*1000L);
        long now=System.currentTimeMillis();
        long old=apiProviderBackoffUntil();
        getSharedPreferences("prefs",MODE_PRIVATE).edit()
            .putLong(API_RATE_BACKOFF_PREF,Math.max(old,now+wait)).apply();
        scheduleProviderRateLimitResume();
    }
    private boolean authorizedApiQaSelected(){
        return overlayPrefs().getBoolean("authorizedApiQaOptIn",true);
    }
    // LT115: API first, verified DOM fallback only on transient failures.
    // Never bypass access denial, login requirements or server rate limiting.
    // Both Pokeballs inherit this policy with independent state and filters.
    private static boolean allowDomAfterApiFailure(String reason){
        return "network-or-cors-error".equals(reason)||"timeout".equals(reason)||
            "service-unavailable".equals(reason)||"invalid-results".equals(reason)||
            "api-unavailable".equals(reason)||"catalog-unavailable".equals(reason);
    }
    // Sanitized counts only: never log JWT, coordinates, trainer IDs or raw response.
    private void logApiEvidence(String state,JSONObject response){
        if(response==null||!response.has("siteCount"))return;
        JSONObject reasons=response.optJSONObject("rejectionCounts");
        StringBuilder summary=new StringBuilder(
            (isSecondaryOverlay()?"P2":"P1")+" state="+state+" mode="+mode);
        for(String key:new String[]{"siteCount","found","eligible","rejected","expired","filtered","duplicates"}){
            summary.append(" ").append(key).append("=")
                .append(Math.max(0,Math.min(2000,response.optInt(key,0))));
        }
        for(String key:new String[]{"shape","identity","iv","cpLevel","metadata","despawn"}){
            summary.append(" ").append(key).append("=")
                .append(reasons==null?0:Math.max(0,Math.min(2000,reasons.optInt(key,0))));
        }
        BugReport.log(this,"API_IV_EVIDENCE",summary.toString());
    }
    private void performAuthorizedApiSearch(int generation,boolean manual){
        if(authorizedApiCollector==null){
            authorizedApiCollector=new AuthorizedApiCollector(website,getAssets(),handler);
        }
        try{
            JSONObject config=new JSONObject(filterConfigJson());
            config.put("mode",mode);
            config.put("shiny",ProviderFeatureFlags.SHINY_AVAILABLE&&shiny);
            // Both shiny_only and background_only are account-specific
            // filters. Reuse only trainers verified under the assigned
            // PoGoCoordinates account and never guess another account.
            if(shiny||config.optBoolean("backgroundOnly",false)){
                int slot=PogoAccountSlots.assigned(this,isSecondaryOverlay());
                String selected=PogoAccountSlots.trainer(this,isSecondaryOverlay());
                if(PogoAccountSlots.hasTrainer(this,slot,selected))
                    config.put("shinyAccount",selected);
            }
            config.put("locationEnabled",locationEnabled);
            config.put("locationCoords",locationEnabled?locationCoords:"");
            if(locationEnabled)config.put("locationRadius",locationRadius);
            // Restore the beloved Pokeball capture pulse for API searches.
            searchPhase="searching";
            status(manual?"API: busca manual...":"API: pesquisando...");
            authorizedApiCollector.search(config,response->{
                if(stopped||loginPaused||generation!=requestGeneration)return;
                logApiEvidence(response.optBoolean("ok",false)?"accepted":"inconclusive",response);
                if(!response.optBoolean("ok",false)){
                    String reason=response.optString("reason","api-unavailable");
                    if(reason.length()>50)reason="api-unavailable";
                    if(allowDomAfterApiFailure(reason)){
                        // A single active generation uses exactly one verified
                        // source at a time; never merge unverified API and DOM rows.
                        searchPhase="searching";
                        status("API temporariamente indisponível; conferindo no site...");
                        execute("session",session->
                            continueVerifiedSearchSession(generation,manual,session,0));
                        return;
                    }
                    searchInProgress=false;
                    if("rate-limited".equals(reason)){
                        // Respect Retry-After when present. No retry or DOM bypass
                        // before the provider window expires; keep previous cards.
                        noteProviderRateLimit(response.optInt("retryAfterSeconds",60));
                        searchFailure("⚠ API: limite temporário",
                            "HTTP 429 do provedor; próxima tentativa somente após intervalo de segurança.");
                    }else if("invalid-request".equals(reason)){
                        int code=response.optInt("httpStatus",0);
                        if(code!=400&&code!=422)code=0;
                        // The API session forwards ONLY an allowlisted schema
                        // key, never provider messages, JWTs, trainer IDs or
                        // coordinate values. Do not blindly retry a 400/422.
                        String key=response.optString("rejectedField","");
                        String label=switch(key){
                            case "pokemon_ids","species_forms","forms",
                                 "blacklist_pokemon_ids","blacklist_species_forms",
                                 "blacklist_forms" -> "Pokémon/formas";
                            case "center_lat","center_lng","radius_km","location" ->
                                 "Localização";
                            case "raw_iv_atk","raw_iv_def","raw_iv_sta",
                                 "iv_mode","iv_percent_min","iv_percent_max" -> "IV";
                            case "pvp_mode","pvp_league","pvp_top_rank",
                                 "pvp_min_cp","pvp_include_pre_evolutions" -> "PvP";
                            case "cp_min","cp_max" -> "PC";
                            case "level_min","level_max" -> "Nível";
                            case "sort" -> "Ordenação";
                            case "shiny_only","shiny_account" -> "Shiny/treinador";
                            case "sizes","gender","weather_id","boosted",
                                 "min_ttl","background_only" -> "Filtros";
                            default -> "";
                        };
                        int count=Math.max(0,Math.min(20,response.optInt("rejectedFieldCount",0)));
                        BugReport.log(this,"API_SCHEMA",
                            (isSecondaryOverlay()?"P2":"P1")+" HTTP="+code+
                            " field="+(label.isEmpty()?"unknown":key)+
                            " fields="+count+" mode="+mode);
                        searchFailure("⚠ API"+(code>0?" "+code:"")+": "+
                            (label.isEmpty()?(count>1?"vários campos":"requisição rejeitada"):label),
                            "Provedor rejeitou a busca"+
                            (code>0?" (HTTP "+code+")":"")+
                            (label.isEmpty()?(count>1?". Campos inválidos: "+count+".":
                                ". Campo não identificado."):
                                ". Campo: "+key+".")+
                            " Nenhuma pesquisa alternativa nem filtro removido automaticamente.");
                    }else{
                        String hint="login-required".equals(reason)?"Sessão expirada. Entre novamente no PoGoCoordinates.":
                            "access-denied".equals(reason)?"Acesso negado (HTTP 403). Confira permissões e vínculo.":
                            "unverified-results".equals(reason)?"A API retornou ocorrências, mas nenhuma passou na validação. Não foram tratadas como zero Pokémon.":
                            "timeout".equals(reason)?"Tempo esgotado. Verifique a conexão.":
                            "Consulta API não validada ("+reason+").";
                        searchFailure("⚠ API: "+reason,
                            hint+" Resultados anteriores preservados.");
                    }
                    return;
                }
                JSONArray cards=response.optJSONArray("cards");
                if(!"authorized-api-qa".equals(response.optString("source"))||
                    !response.optBoolean("criteriaConfirmed",false)||
                    cards==null||cards.length()>10||
                    response.optInt("searchId",-1)<0||
                    (response.optBoolean("requestedShiny",false)!=shiny)||
                     (shiny&&(!response.optBoolean("apiFilterAccepted",false)||
                      (!response.optBoolean("explicitEmpty",false)&&
                       !response.optBoolean("apiReturnedShiny",false))))||
                    (("gl".equals(mode)||"ul".equals(mode))&&
                     !response.optBoolean("leagueConfirmed",false))){
                    searchInProgress=false;
                    searchFailure("⚠ API: resultado não validado",
                        "A resposta não confirmou os filtros atuais.");return;
                }
                shinyVerified=shiny;
                applyCollectedResults(response);
                // Mark the active API request applied only if native IV checks
                // also accepted the response. Failed QA searches retain old cards.
                if(!searchInProgress&&displayedApiResults&&
                    ("updated".equals(searchPhase)||"empty".equals(searchPhase))){
                    displayedApiSearchId=response.optInt("searchId",-1);
                    locationVerified=locationEnabled;
                    confirmedSubmittedFiltersGeneration=generation;
                    submittedSearchGeneration=generation;
                    update();
                }
            });
        }catch(Exception ignored){
            searchInProgress=false;
            searchFailure("⚠ API: filtros inválidos","Falha ao converter filtros para a API.");
        }
    }
    private void revealAuthorizedCoords(JSONObject target,boolean autoCopy,long requestToken){
        if(authorizedApiCollector==null||displayedApiSearchId<0){
            deliverCoords("","Sessão API indisponível. Atualize a busca.");return;
        }
        try{
            JSONObject selection=new JSONObject();
            selection.put("searchId",displayedApiSearchId);
            selection.put("sourceIndex",target.optInt("sourceIndex",-1));
            selection.put("pokemonId",Integer.parseInt(
                target.optString("number","").replace("#","")));
            selection.put("cp",Integer.parseInt(target.optString("cp","")));
            authorizedApiCollector.reveal(selection,response->{
                if(stopped||loginPaused||requestToken!=coordinateRequestToken)return;
                if(!currentCoordinateTarget(target)){
                    deliverCoords("","Resultados mudaram; coordenadas não copiadas.");return;
                }
                String coords=extractCoordinates(response.optString("coords",""));
                if(!response.optBoolean("ok",false)||coords.isEmpty()){
                    String reason=response.optString("reason","indisponível");
                    if("stale-or-ambiguous-selection".equals(reason)||
                       "superseded-search".equals(reason)){
                        // A new search invalidates old one-use reveal codes.
                        // Never guess a different Pokemon's coordinates.
                        deliverCoords("","Pesquisa atualizada. Abra o Pokémon na lista atual e tente novamente.");
                    }else if("expired-spawn".equals(reason)||
                             "expired-or-missing-spawn".equals(reason)){
                        deliverCoords("","Pokémon expirou. Aguarde um novo resultado.");
                    }else if("reveal-in-progress".equals(reason)){
                        deliverCoords("","Coordenadas já estão sendo consultadas.");
                    }else if("rate-limited".equals(reason)){
                        // HTTP 429: confirmed provider block. No fabricated countdown.
                        deliverCoordsRestricted("rate",0);
                    }else if("vip-required".equals(reason)){
                        deliverCoordsRestricted("quota",0);
                    }else{
                        if(reason.length()>60)reason="indisponível";
                        deliverCoords("","Get coords API: "+reason);
                    }
                    return;
                }
                try{
                    JSONArray cards=new JSONArray(results);
                    for(int i=0;i<cards.length();i++){
                        JSONObject card=cards.getJSONObject(i);
                        if(card.optInt("sourceIndex",-1)==target.optInt("sourceIndex",-2)){
                            card.put("coords",coords);break;
                        }
                    }
                    results=cards.toString();
                }catch(Exception ignored){
                    deliverCoords("","Erro ao guardar coordenadas.");return;
                }
                if(autoCopy)copyCoordinatesInternal(coords);
                CoordsQuotaStore.successfulReveal(this,null);
                deliverCoords(coords,autoCopy?"✓ Coordenadas API copiadas":
                    "Coordenadas API disponíveis");
                pushCoordsQuota(response.optJSONObject("quota"));
            });
        }catch(Exception ignored){
            deliverCoords("","Get coords API: identidade inválida.");
        }
    }
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
    private android.app.Dialog favoritePickerDialog;
    private android.app.Dialog quickActionDialog;
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
        handler.removeCallbacks(providerRateLimitResume);
        handler.removeCallbacks(searchWatchdog);
        handler.removeCallbacks(periodic);
        handler.removeCallbacks(expiryRefresh);
        handler.removeCallbacks(pageFinishedRefresh);
        handler.removeCallbacks(loginEndRefresh);
        handler.removeCallbacks(deferredSessionReload);
        handler.removeCallbacks(drainFavoriteAlerts);
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
    private int locationFinalRetryCount=0; // bound React rebinds before Search
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
    // Only a freshly accepted API/DOM result generation may be rechecked when
    // the global Favorites list changes. Persisted/stale cards never notify.
    private int verifiedFavoriteResultsGeneration=-1;
    // Recent identity TTL protects against duplicate notices when a briefly
    // missing encounter reappears. It is never persisted or used for API retry.
    // Discovery history is distinct from actual notification delivery.
    // Only notify() success can consume a general-alert identity; P1 and P2
    // each own one map because SecondaryOverlayService inherits this service.
    private final java.util.LinkedHashMap<String,Long> successfullyNotifiedGeneralSpawns=
        new java.util.LinkedHashMap<String,Long>(256,0.75f,true){
            @Override protected boolean removeEldestEntry(java.util.Map.Entry<String,Long> item){
                return size()>256;
            }
        };
    private final java.util.LinkedHashMap<String,Long> recentSpawnExpiries=
        new java.util.LinkedHashMap<String,Long>(256,0.75f,true){
            @Override protected boolean removeEldestEntry(java.util.Map.Entry<String,Long> item){
                return size()>256;
            }
        };
    // LT112 dual-Pokeball parity: New and Favorite discoveries need separate
    // deduplication. A seen encounter can become a newly enabled Favorite.
    // Both OverlayService and SecondaryOverlayService own one independent map.
    // Keys remain exact verified spawn identities and expire with the spawn.
    private final java.util.LinkedHashMap<String,Long> recentFavoriteAlertExpiries=
        new java.util.LinkedHashMap<String,Long>(256,0.75f,true){
            @Override protected boolean removeEldestEntry(java.util.Map.Entry<String,Long> item){
                return size()>256;
            }
        };

    private static final int FAVORITE_ALERT_BATCH_SIZE=5;
    private static final long FAVORITE_ALERT_BATCH_INTERVAL_MS=12_000L;
    private static final long FAVORITE_ALERT_RETRY_DELAY_MS=60_000L;
    private static final int MAX_QUEUED_FAVORITES=100;
    private static final java.util.concurrent.atomic.AtomicInteger NEXT_GENERAL_ALERT_ID=
        new java.util.concurrent.atomic.AtomicInteger(33000);
    private static final class QueuedFavoriteAlert{
        final String key,name,title,details;
        final JSONObject encounter;
        final long expiry;
        QueuedFavoriteAlert(String key,String name,String title,String details,
                            long expiry,JSONObject encounter){
            this.key=key;this.name=name;this.title=title;this.details=details;
            this.expiry=expiry;this.encounter=encounter;
        }
    }
    private final java.util.LinkedHashMap<String,QueuedFavoriteAlert> queuedFavoriteAlerts=
        new java.util.LinkedHashMap<>();
    private final Runnable drainFavoriteAlerts=()->drainFavoriteAlertQueue();
    // Favorites are shared across P1 and P2, while their actual results and
    // alert dedup maps are private per service instance. Observe the common
    // preference store so a change in either picker reaches BOTH Pokeballs.
    private final android.content.SharedPreferences.OnSharedPreferenceChangeListener
        sharedFavoritesListener=(preferences,key)->{
            if(!WatchAlerts.PREF_LIST.equals(key)&&
               !WatchAlerts.PREF_MODE.equals(key)&&
               !WatchAlerts.PREF_ENABLED.equals(key))return;
            handler.post(()->{
                if(stopped)return;
                if(WatchAlerts.PREF_LIST.equals(key)||!WatchAlerts.enabled(this)){
                    queuedFavoriteAlerts.clear();
                    handler.removeCallbacks(drainFavoriteAlerts);
                }
                if(WatchAlerts.enabled(this))recheckConfirmedFavoriteResults();
                update();
            });
        };
    private void recheckConfirmedFavoriteResults(){
        // No remote search, no general alert, no cached/stale notification.
        // Per-Pokeball criteria and exact verified encounters stay authoritative.
        if(stopped||loginPaused||searchInProgress||resultsStale||
           verifiedFavoriteResultsGeneration!=requestGeneration||
           !shownMode.equals(mode)||!shownConfigJson.equals(filterConfigJson())||
           shownShiny!=(shiny&&shinyVerified)||
           !("updated".equals(searchPhase)||"empty".equals(searchPhase)))return;
        java.util.Set<String> wanted=WatchAlerts.watched(this);
        if(wanted.isEmpty())return;
        JSONArray accepted;
        try{accepted=new JSONArray(results);}
        catch(org.json.JSONException ignored){return;}
        long now=System.currentTimeMillis();
        int eligible=0;
        for(int i=0;i<accepted.length();i++){
            JSONObject card=accepted.optJSONObject(i);
            if(card==null)continue;
            long expiry=card.optLong("expiresAtMs",Long.MAX_VALUE);
            // If the provider omitted despawn, a previously confirmed card
            // becomes too old for rechecks after fifteen minutes.
            long sampledAt=card.optLong("sampledAt",0L);
            if(expiry==Long.MAX_VALUE&&
               (sampledAt<=0||sampledAt>now||now-sampledAt>15L*60_000L))
                continue;
            if(expiry<=now||!verifiedTargetCriteria(card)||
               !WatchAlerts.matches(card.optString("name",""),wanted))continue;
            String key=spawnKey(card);
            if(recentFavoriteAlertExpiries.getOrDefault(key,0L)>now||
               queuedFavoriteAlerts.containsKey(key))continue;
            if(queuedFavoriteAlerts.size()>=MAX_QUEUED_FAVORITES)break;
            long deadline=expiry==Long.MAX_VALUE?now+15L*60_000L:expiry;
            queuedFavoriteAlerts.put(key,new QueuedFavoriteAlert(key,
                card.optString("name","Pokémon"),encounterAlertTitle(card),
                encounterAlertDetails(card,true),deadline,card));
            eligible++;
        }
        if(eligible>0)drainFavoriteAlertQueue();
        BugReport.log(this,"FAVORITE_ALERT_SYNC",
            (isSecondaryOverlay()?"P2":"P1")+" rechecagem="+eligible+
            " selecionados="+wanted.size()+" geração="+requestGeneration);
    }
    private void scheduleFavoriteAlertDrain(long delay){
        handler.removeCallbacks(drainFavoriteAlerts);
        if(!stopped&&!queuedFavoriteAlerts.isEmpty())
            handler.postDelayed(drainFavoriteAlerts,delay);
    }
    private void drainFavoriteAlertQueue(){
        if(stopped){queuedFavoriteAlerts.clear();return;}
        long now=System.currentTimeMillis();
        queuedFavoriteAlerts.entrySet().removeIf(entry->entry.getValue().expiry<=now ||
            recentFavoriteAlertExpiries.getOrDefault(entry.getKey(),0L)>now);
        if(queuedFavoriteAlerts.isEmpty())return;
        if(!WatchAlerts.enabled(this)||"off".equals(WatchAlerts.mode(this))){
            queuedFavoriteAlerts.clear();return; // explicit user OFF is authoritative
        }
        if(!WatchAlerts.permissionGranted(this)){
            scheduleFavoriteAlertDrain(FAVORITE_ALERT_RETRY_DELAY_MS);return;
        }
        java.util.Set<String> wanted=WatchAlerts.watched(this);
        int delivered=0;
        for(QueuedFavoriteAlert pending:
            new java.util.ArrayList<>(queuedFavoriteAlerts.values())){
            if(delivered>=FAVORITE_ALERT_BATCH_SIZE)break;
            if(!WatchAlerts.matches(pending.name,wanted)){
                queuedFavoriteAlerts.remove(pending.key);continue;
            }
            // Each encounter gets its own title: never hide a Shundo behind a
            // different Pokémon of the same species, or dismiss unreported hits.
            if(WatchAlerts.match(this,pending.name,pending.title,pending.details,
                                notificationArtwork(pending.encounter))){
                delivered++;
                recentFavoriteAlertExpiries.put(pending.key,pending.expiry);
                queuedFavoriteAlerts.remove(pending.key);
            }
        }
        if(!queuedFavoriteAlerts.isEmpty())
            scheduleFavoriteAlertDrain(delivered==0?FAVORITE_ALERT_RETRY_DELAY_MS:
                FAVORITE_ALERT_BATCH_INTERVAL_MS);
        BugReport.log(this,"FAVORITE_ALERT_BATCH",
            (isSecondaryOverlay()?"P2":"P1")+" avisos="+delivered+
            " pendentes="+queuedFavoriteAlerts.size());
    }
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
    // LT64: expiry uses the immutable absolute timestamp captured at Search.
    // The old code recalculated from a moving MM:SS, which could rearm an
    // already expired spawn indefinitely if the site updated its timer.
    private void armNextDespawn(JSONArray cards){
        handler.removeCallbacks(expiryRefresh);
        armedDespawnMillis=0L;
        if(cards==null||cards.length()==0||stopped)return;
        long now=System.currentTimeMillis(),next=Long.MAX_VALUE;
        for(int i=0;i<cards.length();i++){
            JSONObject card=cards.optJSONObject(i);
            if(card==null)continue;
            long absolute=card.optLong("expiresAtMs",Long.MAX_VALUE);
            if(absolute==Long.MAX_VALUE)absolute=expiration(card);
            if(absolute<next)next=absolute;
        }
        if(next==Long.MAX_VALUE)return;
        armedDespawnMillis=next;
        handler.postDelayed(expiryRefresh,Math.max(150L,next-now+150L));
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
    // A newly requested IV/IV%/GL/UL search must not keep a different mode's
    // sprites and badge visible when the site/API has not confirmed results.
    // A matching, previously verified cached filter may still show its own
    // (explicitly stale) preview, but never rows from another filter.
    private boolean restoreMatchingFilterPreview(){
        if(restoreFilterPreview())return true;
        results="[]";
        selected=-1;
        shownMode=mode;
        shownConfigJson=filterConfigJson();
        shownShiny=shiny&&shinyVerified;
        resultsStale=false;
        armNextDespawn(new JSONArray());
        return false;
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
                JSONObject.quote(mode)+","+(shiny&&shinyVerified)+","+rowDp()+","+intervalMinutes+","+spriteSize+","+showTimers+",false,"+alerts+","+(WatchAlerts.watched(this).size()>0)+","+(shiny&&!shinyVerified)+","+Math.max(rowDp()*2,Math.min(rowDp()*10,screenHeightDp()-52))+","+locationEnabled+","+JSONObject.quote(locationEnabled?locationCoords:"")+","+locationRadius+","+JSONObject.quote(alertsMode)+","+filterConfigJson()+","+JSONObject.quote(shownMode)+","+shownConfigJson+","+shownShiny+","+resultsStale+","+nextScheduledSearchAtMs+","+searchInProgress+","+showResultText+","+overlayPrefs().getString("menuUiPrefs","{}")+","+(locationEnabled&&locationVerified)+","+screenHeightDp()+","+resultDisplayOptionsJson()+","+WatchAlerts.permissionGranted(this)+","+WatchAlerts.enabled(this)+","+JSONObject.quote(searchPhase)+","+
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
        js(popupPanel,popupLoaded,data);
        js(resultPanel,resultLoaded,data);
        broadcastVisualPrefs();
        pushCooldownState();
        if(selected>=0)showDetails(selected);
    }
    private void status(String s){
        status=s;
        overlayPrefs().edit().putString("lastStatus",s).apply();
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
        overlayPrefs().edit().putString("lastError",s).apply();
        BugReport.log(this,"ERROR",s);
        status(s);
    }
    private void searchFailure(String shortReason,String detail){
        searchPhase="error";
        // Show one concise message; keep the detailed diagnosis for the ⚠ report.
        overlayPrefs().edit().putString("lastError",detail).apply();
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
        positionIndependentPopup();
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
    // Two separate TYPE_APPLICATION_OVERLAY hit rectangles: the menu stays
    // exactly its original toolbar height. The popup is content-sized.
    private void positionIndependentPopup(){
        if(popupRoot==null||popupParams==null||menuParams==null||wm==null||
                !menuExpanded||popupKind.isEmpty()||popupWidthDp<1||popupHeightDp<1)return;
        DisplayMetrics m=metrics();
        // menuParams.y can include a reserved native popup ABOVE the toolbar.
        // Position from the real visible row, never the expanded window top.
        int toolbarTop=menuParams.y+dp(popupOffsetDp);
        PopupTouchGeometry.Bounds b=visualMenuVertical?
            (popupTriggerHeightDp>0?
                PopupTouchGeometry.placeBesideMeasured(m.widthPixels,m.heightPixels,
                    menuParams.x,toolbarTop,menuParams.width,dp(visualMenuBaseDp()),
                    dp(popupTriggerYDp),dp(popupTriggerHeightDp),
                    dp(popupWidthDp),dp(popupHeightDp),dp(6)):
                PopupTouchGeometry.placeBeside(m.widthPixels,m.heightPixels,
                    menuParams.x,toolbarTop,menuParams.width,dp(visualMenuBaseDp()),
                    dp(popupTriggerYDp),dp(popupWidthDp),dp(popupHeightDp),dp(6))):
            PopupTouchGeometry.place(m.widthPixels,m.heightPixels,menuParams.x,toolbarTop,
                menuParams.width,dp(visualMenuBaseDp()),dp(popupTriggerDp),
                dp(popupWidthDp),dp(popupHeightDp),dp(6));
        if(!visualMenuVertical&&("filters".equals(popupKind)||"mode".equals(popupKind)))
            b=PopupTouchGeometry.alignRail(b,m.widthPixels,menuParams.x,menuParams.width,
                dp(popupTriggerDp),dp("filters".equals(popupKind)?78:52),dp(6));
        // LT63: the results WebView is another native overlay rectangle. A CSS
        // transparent area cannot pass Android touches through another window.
        if(resultParams!=null&&resultRoot!=null&&!resultCollapsed&&!minimized&&
                resultRoot.getVisibility()==View.VISIBLE)
            b=PopupTouchGeometry.avoidResult(b,new PopupTouchGeometry.Bounds(
                resultParams.x,resultParams.y,resultParams.width,resultParams.height,false),
                m.widthPixels,m.heightPixels,dp(6));
        if(!b.visible()){popupRoot.setVisibility(View.GONE);return;}
        if(lastPopupX!=b.x||lastPopupY!=b.y||lastPopupW!=b.width||lastPopupH!=b.height){
            popupParams.x=b.x;popupParams.y=b.y;
            popupParams.width=b.width;popupParams.height=b.height;
            try{wm.updateViewLayout(popupRoot,popupParams);}
            catch(Exception ex){recordFailure("posicionar popup independente",ex);return;}
            lastPopupX=b.x;lastPopupY=b.y;lastPopupW=b.width;lastPopupH=b.height;
        }
        if(popupRoot.getVisibility()!=View.VISIBLE)popupRoot.setVisibility(View.VISIBLE);
        js(popupPanel,popupLoaded,"window.setNativePopupRoom&&window.setNativePopupRoom("+
            Math.max(30,Math.round(b.height/m.density))+")");
    }
    private void resizeIndependentPopup(int width,int height){
        if(popupKind.isEmpty()||!popupLoaded||!menuExpanded)return;
        int w=Math.max(1,Math.min(330,width)),h=Math.max(1,Math.min(450,height));
        // The Location popup must never feed a transient shrinking WebView
        // width back to WindowManager after keyboard focus or React updates.
        // LT103: the LOCATION native window was hard-clamped to 286dp even
        // after the WebView CSS was reduced. Its actual hitbox must also shrink.
        if("location".equals(popupKind))
            w=Math.max(1,Math.min(148,screenWidthDp()-12));
        if(popupWidthDp==w&&popupHeightDp==h)return;
        popupWidthDp=w;popupHeightDp=h;positionIndependentPopup();
    }
    private void closeIndependentPopupFromOutside(){
        if(popupKind.isEmpty())return;
        outsideClosedPopupKind=popupKind;
        outsideClosedPopupUptimeMs=android.os.SystemClock.uptimeMillis();
        closeIndependentPopup();
    }
    private void closeIndependentPopup(){
        if(popupKind.isEmpty())return;
        popupKind="";popupWidthDp=popupHeightDp=0;
        // The toolbar is a separate WebView; notify it when native closes.
        js(menuPanel,menuLoaded,"window.setActiveNativePopupKind&&window.setActiveNativePopupKind(\"\")");
        locationEditorOpen=false;
        if(popupPanel!=null){
            android.view.inputmethod.InputMethodManager keyboard=
                (android.view.inputmethod.InputMethodManager)getSystemService(INPUT_METHOD_SERVICE);
            if(keyboard!=null)keyboard.hideSoftInputFromWindow(popupPanel.getWindowToken(),0);
        }
        if(popupRoot!=null)popupRoot.setVisibility(View.GONE);
        if(popupParams!=null&&popupRoot!=null&&wm!=null){
            popupParams.flags|=WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL;
            popupParams.softInputMode=0;
            try{wm.updateViewLayout(popupRoot,popupParams);}
            catch(Exception ex){recordFailure("recolher popup",ex);}
        }
        if(popupPanel!=null){
            popupPanel.clearFocus();
            js(popupPanel,popupLoaded,"window.hideNativePopup&&window.hideNativePopup()");
        }
    }
    private void openIndependentPopup(String kind,int x,int y){
        openIndependentPopup(kind,x,y,0);
    }
    private void openIndependentPopup(String kind,int x,int y,int triggerHeight){
        openIndependentPopup(kind,x,y,triggerHeight,0);
    }
    private void openIndependentPopup(String kind,int x,int y,int triggerHeight,int triggerWidth){
        if(!validIndependentPopup(kind)||!menuExpanded||loginPaused||stopped||pickerOpen)return;
        long elapsed=android.os.SystemClock.uptimeMillis()-outsideClosedPopupUptimeMs;
        boolean wasSameOutsideTap=kind.equals(outsideClosedPopupKind)&&
            elapsed>=0L&&elapsed<=450L;
        outsideClosedPopupKind="";
        outsideClosedPopupUptimeMs=0L;
        // If an ACTION_OUTSIDE already closed this exact popup on pointer-down,
        // consume the launcher click from that same gesture instead of reopening.
        if(wasSameOutsideTap)return;
        if(kind.equals(popupKind)){closeIndependentPopup();return;}
        popupKind=kind;
        // Mirror native state back to the toolbar: tapping Location again closes.
        js(menuPanel,menuLoaded,"window.setActiveNativePopupKind&&window.setActiveNativePopupKind("+JSONObject.quote(kind)+")");
        popupTriggerDp=Math.max(0,Math.min(menuDp(),x));
        popupTriggerYDp=Math.max(0,Math.min(visualMenuBaseDp(),y));
        popupTriggerHeightDp=Math.max(0,Math.min(visualMenuBaseDp(),triggerHeight));
        // The independent popup WebView cannot measure the toolbar's ⋯ tile.
        popupTriggerWidthDp="more".equals(kind)?
            Math.max(0,Math.min(80,triggerWidth)):0;
        popupWidthDp=popupHeightDp=0;
        lastPopupX=Integer.MIN_VALUE;lastPopupY=Integer.MIN_VALUE;
        // A GONE WebView may suspend requestAnimationFrame on Samsung, so
        // its JS cannot measure the popup and would never make itself visible.
        // Boot with a ONE-PIXEL-HIGH visible strip; native geometry replaces
        // the hitbox as soon as the real DOM height arrives.
        if(popupRoot!=null&&popupParams!=null&&wm!=null){
            DisplayMetrics m=metrics();
            popupParams.width=dp(Math.max(1,Math.min(330,screenWidthDp()-12)));
            popupParams.height=Math.max(1,dp(1));
            popupParams.x=Math.max(0,Math.min(m.widthPixels-popupParams.width,
                menuParams!=null?menuParams.x:0));
            int anchorY=menuParams==null?0:
                menuParams.y+dp(popupOffsetDp)+
                (visualMenuVertical?dp(popupTriggerYDp)-dp(popupTriggerHeightDp)/2:
                    dp(visualMenuBaseDp()));
            popupParams.y=Math.max(0,Math.min(m.heightPixels-popupParams.height,anchorY));
            try{
                wm.updateViewLayout(popupRoot,popupParams);
                popupRoot.setVisibility(View.VISIBLE);
            }catch(Exception ex){recordFailure("medir popup inicial",ex);return;}
        }
        if(popupLoaded)js(popupPanel,true,
            "window.showNativePopup&&window.showNativePopup("+
                JSONObject.quote(kind)+","+popupTriggerWidthDp+")");
    }
    private static boolean validIndependentPopup(String kind){
        if(kind==null)return false;
        switch(kind){
            case "mode":case "filters":case "location":case "pokemon":
            case "alerts":case "appearance":case "visual":case "info":
            case "period":case "more":return true;
            default:return false;
        }
    }
    private void locationEditor(boolean open){
        locationEditorOpen=open;
        if(menuParams==null||menuRoot==null||wm==null)return;
        boolean inPopup=!popupKind.isEmpty()&&popupParams!=null&&popupRoot!=null;
        WindowManager.LayoutParams target=inPopup?popupParams:menuParams;
        FrameLayout surface=inPopup?popupRoot:menuRoot;
        WebView web=inPopup?popupPanel:menuPanel;
        final int base=WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL;
        final int unfocusable=WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;
        if(open){
            target.flags=(target.flags|base)&~unfocusable;
            target.softInputMode=WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE;
        }else{
            target.flags|=unfocusable|base;
            target.softInputMode=0;
            if(web!=null){
                android.view.inputmethod.InputMethodManager keyboard=
                    (android.view.inputmethod.InputMethodManager)getSystemService(INPUT_METHOD_SERVICE);
                if(keyboard!=null)keyboard.hideSoftInputFromWindow(web.getWindowToken(),0);
                web.clearFocus();
            }
        }
        try{wm.updateViewLayout(surface,target);}catch(Exception e){recordFailure("atualizar foco popup",e);}
        updateMenuPosition();
        if(open&&web!=null){web.setFocusableInTouchMode(true);web.requestFocus();}
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
    private boolean detailManuallyPositioned=false;
    private void moveDetail(){
        if(detailRoot==null||detailParams==null||params==null)return;
        if(detailManuallyPositioned){
            DisplayMetrics bounds=metrics();
            detailParams.x=Math.max(0,Math.min(
                Math.max(0,bounds.widthPixels-detailParams.width),detailParams.x));
            detailParams.y=Math.max(0,Math.min(
                Math.max(0,bounds.heightPixels-detailParams.height),detailParams.y));
            try{wm.updateViewLayout(detailRoot,detailParams);}
            catch(Exception e){recordFailure("limitar cartão movido",e);}
            return;
        }
        // LT65 Samsung: do not paint the floating detail card over its
        // originating toolbar. Prefer a position beside the result sprites,
        // then place it below the native dock (or above when near the bottom).
        // Native WindowManager rectangles, not transparent CSS dimensions,
        // determine the areas able to intercept touches.
        DisplayMetrics screen=metrics();
        int margin=dp(6),cardWidth=detailParams.width;
        int cardHeight=detailParams.height;
        int anchorX=resultParams!=null?resultParams.x:params.x;
        int railWidth=resultParams!=null?resultParams.width:dp(resultWidthDp());
        int right=anchorX+railWidth+margin;
        int left=anchorX-cardWidth-margin;
        int x=right+cardWidth<=screen.widthPixels-margin?right:left;
        x=Math.max(margin,Math.min(Math.max(margin,screen.widthPixels-cardWidth-margin),x));
        int rowY=(resultParams!=null?resultParams.y:params.y)+dp(RESULTS_HEADER_DP+18);
        int minY=margin,maxY=Math.max(margin,screen.heightPixels-cardHeight-margin);
        int y=Math.max(minY,Math.min(maxY,rowY));
        int toolbarHeight=Math.max(params.height,dp(TOOLBAR_DP));
        boolean crossesToolbar=x<params.x+params.width&&params.x<x+cardWidth&&
            y<params.y+toolbarHeight&&params.y<y+cardHeight;
        if(crossesToolbar){
            int below=params.y+toolbarHeight+margin;
            int above=params.y-cardHeight-margin;
            if(below<=maxY)y=below;
            else if(above>=minY)y=above;
            else{
                // Last resort: prefer the side with more usable height,
                // without allowing a native touch rectangle over the tools.
                int spaceBelow=screen.heightPixels-(params.y+toolbarHeight);
                int spaceAbove=params.y;
                y=Math.max(minY,Math.min(maxY,
                    spaceAbove>spaceBelow?above:below));
            }
        }
        detailParams.x=x;detailParams.y=y;
        try{wm.updateViewLayout(detailRoot,detailParams);}
        catch(Exception e){recordFailure("reposicionar detalhes",e);}
    }
    private void newWebsite(){
        website=new WebView(this);
        // Account 1 preserves its current default WebView storage. Account 2
        // MUST use its own Chromium profile, before any WebSettings access.
        int slot=PogoAccountSlots.assigned(this,isSecondaryOverlay());
        PogoAccountSlots.attach(website,slot);
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
        CookieManager cookies=PogoAccountSlots.cookieManager(slot);
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(website,true);
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
                    // A single verified Search now owns Shiny and all filters.
                    // Avoid starting a concurrent setShiny/verifyShiny sequence
                    // before the deferred page-finished Search (race on React).
                    if(!searchInProgress)handler.postDelayed(pageFinishedRefresh,
                        shiny&&!shinyVerified?900L:2500L);
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
                // A navigation failure must not strand previously confirmed
                // spawn deadlines; local expiration is independent of Search.
                try{armNextDespawn(new JSONArray(results));}
                catch(org.json.JSONException ex){recordFailure("rearmar despawn após rede",ex);}
                BugReport.log(OverlayService.this,"NETWORK","Falha de navegação principal; código="+error.getErrorCode());
                status("Não foi possível carregar PoGoCoordinates. Confira conexão e tente ↻.");
            }
        });
    }
    @Override public void onCreate(){
        super.onCreate();
        otaWebLoader=OtaAssets.loader(this);
        OtaAssets.checkAsync(this);
        // No second account may accidentally use the default cookie profile.
        final int selectedAccount=PogoAccountSlots.assigned(this,isSecondaryOverlay());
        if(selectedAccount==2&&(!PogoAccountSlots.supportsSecond()||
           !PogoAccountSlots.loggedIn(this,2))){
            android.widget.Toast.makeText(this,
                "Conecte a Conta 2 antes de usar esta Pokébola",
                android.widget.Toast.LENGTH_LONG).show();
            stopSelf();return;
        }
        // Independent app-wide maintenance and per-version stop for both overlays.
        if(!AppAvailability.isAllowed(this)){stopSelf();return;}
        // Only P2 needs a Premium lease. P1 remains free and works offline.
        if(isSecondaryOverlay()&&PremiumAccess.controlled()&&!PremiumAccess.permitted(true)){
            stopSelf();
            return;
        }
        if (!IntegrityGuard.verify(this)) {
            BugReport.log(this,"SECURITY","Falha de integridade do pacote");
            android.widget.Toast.makeText(this,"Cópia não autorizada ou inválida",android.widget.Toast.LENGTH_LONG).show();
            stopSelf();
            return;
        }
        try {
            registerReceiver(missionScreenOffReceiver,
                new android.content.IntentFilter(Intent.ACTION_SCREEN_OFF));
            missionScreenOffRegistered = true;
        } catch (RuntimeException e) {
            recordFailure("escuta de tela apagada",e);
        }
        try{
            android.content.IntentFilter trainerFilter=
                new android.content.IntentFilter(ACTION_TRAINER_CHANGED);
            if(android.os.Build.VERSION.SDK_INT>=33)
                registerReceiver(trainerChangedReceiver,trainerFilter,
                    android.content.Context.RECEIVER_NOT_EXPORTED);
            else registerReceiver(trainerChangedReceiver,trainerFilter);
            trainerChangedReceiverRegistered=true;
        }catch(RuntimeException error){
            recordFailure("sincronizar treinador",error);
        }
        try{
            android.content.IntentFilter filter=new android.content.IntentFilter(ACTION_COOLDOWN_CHANGED);
            if(android.os.Build.VERSION.SDK_INT>=33)
                registerReceiver(cooldownChangedReceiver,filter,android.content.Context.RECEIVER_NOT_EXPORTED);
            else registerReceiver(cooldownChangedReceiver,filter);
            cooldownChangedReceiverRegistered=true;
        }catch(RuntimeException error){recordFailure("sincronizar cooldown",error);}
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
        startForeground(isSecondaryOverlay()?74:73,note);
        FirebaseStats.setOverlayVisible(this,true,isSecondaryOverlay());
        final Runnable availabilityGuard=new Runnable(){
            @Override public void run(){
                if(stopped)return;
                AppAvailability.refresh(OverlayService.this,state->{
                    if(!state.allowed&&!stopped)stopSelf();
                });
                if(!stopped)handler.postDelayed(this,90000L);
            }
        };
        handler.post(availabilityGuard);
        if(isSecondaryOverlay()&&PremiumAccess.controlled()){
            // A revoked or expired P2 lease stops only the secondary overlay.
            handler.postDelayed(new Runnable(){
                @Override public void run(){
                    if(stopped)return;
                    if(!PremiumAccess.permitted(isSecondaryOverlay())){stopSelf();return;}
                    handler.postDelayed(this,5000L);
                }
            },5000L);
            handler.postDelayed(new Runnable(){
                @Override public void run(){
                    if(stopped)return;
                    PremiumAccess.verify(OverlayService.this,(allowed,premium)->{
                        if(!allowed||(isSecondaryOverlay()&&!premium))stopSelf();
                    });
                    if(!stopped)handler.postDelayed(this,45000L);
                }
            },45000L);
        }
        wm=(WindowManager)getSystemService(WINDOW_SERVICE);
        try{visualPrefsJson=normalizeVisualPrefs(
            overlayPrefs().getString("visualPrefsJson","{}")).toString();}
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
            // Never expose the Native bridge to a navigated remote document.
            @Override public boolean shouldOverrideUrlLoading(
                    WebView view,android.webkit.WebResourceRequest request){
                return !LocalBridgePagePolicy.allows(
                    request.getUrl().toString(),"dock.html");
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view,String url){
                return !LocalBridgePagePolicy.allows(url,"dock.html");
            }
            @Override public android.webkit.WebResourceResponse shouldInterceptRequest(
                    WebView view,android.webkit.WebResourceRequest request){
                return OtaAssets.intercept(OverlayService.this,otaWebLoader,request.getUrl());
            }
            @Override public void onPageFinished(WebView v,String url){
                if(LocalBridgePagePolicy.allows(url,"dock.html")){
                    panelLoaded=true;update();
                }
            }
        });
        grip=new View(this);
        grip.setBackgroundColor(Color.TRANSPARENT);
        // LT62-ONE-POKEBALL: native grip owns taps/holds/drags. The dock WebView
        // is only a renderer, avoiding click+contextmenu double dispatch.
        final boolean[] dockHeld={false};
        final int[] dragResultStart={0,0};
        // One 16ms frame budget for BOTH native windows (Pokébola and list).
        final long[] lastDockFrameAt={0L};
        final Runnable dockLongPress=()->{
            if(dragged||params==null||stopped||loginPaused)return;
            dockHeld[0]=true;
            if(minimized)minimize(false);
            menu(!menuExpanded);
        };
        grip.setOnTouchListener((v,event)->{
            if(event.getActionMasked()==MotionEvent.ACTION_DOWN)
                SupportMissionState.overlayTouch(OverlayService.this);
            if(params==null)return true;
            switch(event.getActionMasked()){
                case MotionEvent.ACTION_DOWN:
                    startRawX=event.getRawX();startRawY=event.getRawY();
                    startX=params.x;startY=params.y;dragged=false;dockHeld[0]=false;
                    if(resultParams!=null){
                        dragResultStart[0]=resultParams.x;
                        dragResultStart[1]=resultParams.y;
                    }
                    lastDockFrameAt[0]=0L;
                    handler.removeCallbacks(dockLongPress);
                    handler.postDelayed(dockLongPress,600L);
                    return true;
                case MotionEvent.ACTION_MOVE:
                    int dx=Math.round(event.getRawX()-startRawX);
                    int dy=Math.round(event.getRawY()-startRawY);
                    if(Math.abs(dx)+Math.abs(dy)>dp(4)){
                        dragged=true;handler.removeCallbacks(dockLongPress);
                    }
                    if(dragged){
                        DisplayMetrics d=metrics();
                        int dockWidth=dp(minimized?BUBBLE_DP:dockDp());
                        int dockHeight=dp(minimized?BUBBLE_DP:height);
                        // Share one clamped translation, not two independently
                        // clamped coordinates: preserve the saved relative spacing
                        // between the unified Pokébola, its results, and details.
                        int minDx=-startX,maxDx=Math.max(0,d.widthPixels-dockWidth)-startX;
                        int minDy=-startY,maxDy=Math.max(0,d.heightPixels-dockHeight)-startY;
                        // LT86: the Pokébola's own screen bounds govern its drag.
                        // A wide information/result pane must NOT forbid reaching
                        // the right edge; clamp the pane independently below.
                        int moveX=Math.max(minDx,Math.min(maxDx,dx));
                        int moveY=Math.max(minDy,Math.min(maxDy,dy));
                        params.x=startX+moveX;
                        params.y=startY+moveY;
                        if(resultParams!=null){
                            resultParams.x=Math.max(0,Math.min(
                                Math.max(0,d.widthPixels-resultParams.width),
                                dragResultStart[0]+moveX));
                            resultParams.y=Math.max(0,Math.min(
                                Math.max(0,d.heightPixels-resultParams.height),
                                dragResultStart[1]+moveY));
                        }
                        // Throttle both native windows together. Updating the dock
                        // on every MotionEvent while limiting only results made
                        // their relative positions appear to drift during fast drags.
                        long now=android.os.SystemClock.uptimeMillis();
                        if(now-lastDockFrameAt[0]>=16L){
                            lastDockFrameAt[0]=now;
                            updateWindow(); // Includes open toolbar reposition.
                            if(resultParams!=null&&resultRoot!=null&&wm!=null){
                                try{wm.updateViewLayout(resultRoot,resultParams);}
                                catch(Exception e){recordFailure("arrastar resultados com Pokébola",e);}
                            }
                            moveDetail();
                        }
                    }
                    return true;
                case MotionEvent.ACTION_UP:
                    handler.removeCallbacks(dockLongPress);
                    if(dragged){
                        // Always commit the final position for BOTH windows,
                        // even when ACTION_UP falls between throttled frames.
                        // Re-anchor to the icon once at the end of the drag.
                        // Prevent a full-width info strip from leaving the old
                        // origin when the Pokébola reaches the screen edge.
                        positionResultsUnderPokeball(false);
                        updateWindow();
                        if(resultParams!=null&&resultRoot!=null&&wm!=null){
                            try{wm.updateViewLayout(resultRoot,resultParams);}
                            catch(Exception e){recordFailure("finalizar arraste conjunto",e);}
                        }
                        moveDetail();
                        positionIndependentPopup(); // Re-evaluate against new results bounds.
                        float density=getResources().getDisplayMetrics().density;
                        android.content.SharedPreferences.Editor saved=
                            overlayPrefs().edit()
                                .putInt("pokeballX",Math.round(params.x/density))
                                .putInt("pokeballY",Math.round(params.y/density));
                        if(resultParams!=null){
                            saved.putInt("resultsX",Math.round(resultParams.x/density)-visualResultsOffsetX)
                                .putInt("resultsY",Math.round(resultParams.y/density)-visualResultsOffsetY);
                        }
                        saved.apply();
                    }
                    if(!dragged&&!dockHeld[0]){
                        if(minimized)minimize(false);
                        else if(menuExpanded)menu(false); // Short tap always closes open menu.
                        else toggleResultsCollapsed();  // Otherwise short tap toggles results.
                    }
                    // Long press or drag never triggers a second short-tap action.
                    return true;
                case MotionEvent.ACTION_CANCEL:
                    handler.removeCallbacks(dockLongPress);
                    if(dragged){
                        // A canceled gesture still leaves the two windows together.
                        if(resultParams!=null&&resultRoot!=null&&wm!=null){
                            try{wm.updateViewLayout(resultRoot,resultParams);}
                            catch(Exception e){recordFailure("encerrar arraste conjunto",e);}
                        }
                        moveDetail();
                    }
                    return true;
            }
            return true;
        });
        root.addView(grip,new FrameLayout.LayoutParams(dp(dockDp()),dp(30),Gravity.TOP|Gravity.LEFT));

        params=new WindowManager.LayoutParams(dp(dockDp()),dp(height),
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
                PixelFormat.TRANSLUCENT);
        params.gravity=Gravity.TOP|Gravity.LEFT;
        android.content.SharedPreferences dockPrefs=overlayPrefs();
        int oldDefaultX=Math.max(0,screenWidthDp()-dockDp()-7);
        int savedPokeballX=dockPrefs.getInt("pokeballX",isSecondaryOverlay()?12:oldDefaultX);
        int savedPokeballY=dockPrefs.getInt("pokeballY",isSecondaryOverlay()?220:120);
        params.x=dp(Math.max(0,Math.min(screenWidthDp()-dockDp(),savedPokeballX)));
        params.y=dp(Math.max(0,Math.min(screenHeightDp()-height,savedPokeballY)));
        // The dock is attached AFTER the menu and results overlays, so its
        // independent 53x32dp gear/grip stays above any transparent popup
        // rectangle. Reordering avoids removing/readding an active WebView.

        // Dedicated 308dp-by-29dp touchable window for the toolbar.
        // Transparent regions outside this rectangle belong to Pokémon GO:
        // a single expanded WebView used to intercept every tap underneath.
        // FLAG_WATCH_OUTSIDE_TOUCH delivers ACTION_OUTSIDE when the user
        // touches beyond the native window; do not consume the underlying tap.
        // Transparent pixels *inside* this window are still not pass-through.
        menuRoot=new FrameLayout(this){
            @Override public boolean dispatchTouchEvent(MotionEvent event){
                if(event.getActionMasked()==MotionEvent.ACTION_DOWN)
                    SupportMissionState.overlayTouch(OverlayService.this);
                if(event.getActionMasked()==MotionEvent.ACTION_OUTSIDE){
                    if(menuExpanded&&menuLoaded&&menuPanel!=null)
                        js(menuPanel,true,"if(window.closeChoices)window.closeChoices()");
                    closeIndependentPopupFromOutside();
                    return false;
                }
                return super.dispatchTouchEvent(event);
            }
        };
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
            // Never expose the Native bridge to a navigated remote document.
            @Override public boolean shouldOverrideUrlLoading(
                    WebView view,android.webkit.WebResourceRequest request){
                return !LocalBridgePagePolicy.allows(
                    request.getUrl().toString(),"dock.html");
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view,String url){
                return !LocalBridgePagePolicy.allows(url,"dock.html");
            }
            @Override public android.webkit.WebResourceResponse shouldInterceptRequest(
                    WebView view,android.webkit.WebResourceRequest request){
                return OtaAssets.intercept(OverlayService.this,otaWebLoader,request.getUrl());
            }
            @Override public void onPageFinished(WebView view,String url){
                if(LocalBridgePagePolicy.allows(url,"dock.html")){
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
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL|
                    WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
                PixelFormat.TRANSLUCENT);
        menuParams.gravity=Gravity.TOP|Gravity.LEFT;
        menuParams.x=0;menuParams.y=params.y;
        menuRoot.setVisibility(View.GONE);
        try{wm.addView(menuRoot,menuParams);}catch(Exception e){recordFailure("abrir controles",e);menuRoot=null;menuPanel=null;}
        if(menuPanel!=null)menuPanel.loadUrl(OtaAssets.webUrl("dock.html?controls=1"));
        // The Pokémon list is always its OWN Android overlay. The gear remains
        // a small independent control even if there is only one active search.
        createResultsWindow();
        // LT62: topmost small dock receives taps/drags even if Modos is open.
        // Only this small dock can pass through the native menu hit rectangle;
        // arbitrary touches behind a popup require separate native touch windows.
        try{wm.addView(root,params);}
        catch(Exception e){recordFailure("abrir dock",e);stopSelf();return;}

        detailRoot=new FrameLayout(this){
            @Override public boolean dispatchTouchEvent(MotionEvent event){
                if(event.getActionMasked()==MotionEvent.ACTION_DOWN)
                    SupportMissionState.overlayTouch(OverlayService.this);
                return super.dispatchTouchEvent(event);
            }
        };
        detailRoot.setBackgroundColor(Color.TRANSPARENT);
        detailPanel=new WebView(this);
        detailPanel.setBackgroundColor(Color.TRANSPARENT);
        detailPanel.getSettings().setJavaScriptEnabled(true);
        detailPanel.getSettings().setAllowContentAccess(false);
        detailPanel.getSettings().setAllowFileAccessFromFileURLs(false);
        detailPanel.getSettings().setAllowUniversalAccessFromFileURLs(false);
        detailPanel.addJavascriptInterface(new Bridge(),"Native");
        detailRoot.addView(detailPanel,new FrameLayout.LayoutParams(-1,-1));
        // A narrow transparent header grip lets the *detail card* move
        // independently of the Pokémon and the Pokébola. It deliberately
        // excludes Share, Favorites and Close buttons (3 × 23dp) plus gaps.
        View detailDragGrip=new View(this);
        detailDragGrip.setBackgroundColor(Color.TRANSPARENT);
        detailDragGrip.setContentDescription("Arrastar cartão de informações");
        FrameLayout.LayoutParams detailGripParams=new FrameLayout.LayoutParams(
            dp(DETAIL_DP-100),dp(49),Gravity.TOP|Gravity.LEFT);
        detailRoot.addView(detailDragGrip,detailGripParams);
        final float[] detailStartTouch=new float[2];
        final int[] detailStartPosition=new int[2];
        final long[] detailLastFrame={0L};
        detailDragGrip.setOnTouchListener((view,event)->{
            if(detailParams==null||wm==null||detailRoot==null)return false;
            switch(event.getActionMasked()){
                case MotionEvent.ACTION_DOWN:
                    detailStartTouch[0]=event.getRawX();
                    detailStartTouch[1]=event.getRawY();
                    detailStartPosition[0]=detailParams.x;
                    detailStartPosition[1]=detailParams.y;
                    return true;
                case MotionEvent.ACTION_MOVE:
                case MotionEvent.ACTION_UP:
                    int deltaX=Math.round(event.getRawX()-detailStartTouch[0]);
                    int deltaY=Math.round(event.getRawY()-detailStartTouch[1]);
                    if(Math.abs(deltaX)+Math.abs(deltaY)>dp(4))
                        detailManuallyPositioned=true;
                    if(detailManuallyPositioned){
                        DisplayMetrics screen=metrics();
                        detailParams.x=Math.max(0,Math.min(
                            Math.max(0,screen.widthPixels-detailParams.width),
                            detailStartPosition[0]+deltaX));
                        detailParams.y=Math.max(0,Math.min(
                            Math.max(0,screen.heightPixels-detailParams.height),
                            detailStartPosition[1]+deltaY));
                        long tick=android.os.SystemClock.uptimeMillis();
                        if(event.getActionMasked()==MotionEvent.ACTION_UP||
                            tick-detailLastFrame[0]>=16L){
                            detailLastFrame[0]=tick;
                            try{wm.updateViewLayout(detailRoot,detailParams);}
                            catch(Exception e){recordFailure("arrastar cartão",e);}
                        }
                    }
                    return true;
                case MotionEvent.ACTION_CANCEL:return true;
                default:return false;
            }
        });
        detailPanel.setWebViewClient(new WebViewClient(){
            // Never expose the Native bridge to a navigated remote document.
            @Override public boolean shouldOverrideUrlLoading(
                    WebView view,android.webkit.WebResourceRequest request){
                return !LocalBridgePagePolicy.allows(
                    request.getUrl().toString(),"detail.html");
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view,String url){
                return !LocalBridgePagePolicy.allows(url,"detail.html");
            }
            // Preserve native card initialization and its offline sprites.
            // Two separate setWebViewClient calls would cancel one another.
            @Override public android.webkit.WebResourceResponse shouldInterceptRequest(
                    WebView view,android.webkit.WebResourceRequest request){
                return OtaAssets.intercept(OverlayService.this,otaWebLoader,request.getUrl());
            }
            @Override public void onPageFinished(WebView v,String url){
                if(LocalBridgePagePolicy.allows(url,"detail.html")){
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
        // A second hidden WebView owns the submenu hitbox; the toolbar never stretches.
        popupRoot=new FrameLayout(this){
            @Override public boolean dispatchTouchEvent(MotionEvent event){
                if(event.getActionMasked()==MotionEvent.ACTION_DOWN)
                    SupportMissionState.overlayTouch(OverlayService.this);
                if(event.getActionMasked()==MotionEvent.ACTION_OUTSIDE){
                    closeIndependentPopupFromOutside();return false;
                }
                return super.dispatchTouchEvent(event);
            }
        };
        popupRoot.setBackgroundColor(Color.TRANSPARENT);
        popupPanel=new WebView(this);
        popupPanel.setBackgroundColor(Color.TRANSPARENT);
        popupPanel.getSettings().setJavaScriptEnabled(true);
        popupPanel.getSettings().setUseWideViewPort(true);
        popupPanel.getSettings().setLoadWithOverviewMode(false);
        popupPanel.getSettings().setAllowContentAccess(false);
        popupPanel.getSettings().setAllowFileAccessFromFileURLs(false);
        popupPanel.getSettings().setAllowUniversalAccessFromFileURLs(false);
        popupPanel.addJavascriptInterface(new Bridge(),"Native");
        popupRoot.addView(popupPanel,new FrameLayout.LayoutParams(-1,-1));
        popupPanel.setWebViewClient(new WebViewClient(){
            // Never expose the Native bridge to a navigated remote document.
            @Override public boolean shouldOverrideUrlLoading(
                    WebView view,android.webkit.WebResourceRequest request){
                return !LocalBridgePagePolicy.allows(
                    request.getUrl().toString(),"dock.html");
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view,String url){
                return !LocalBridgePagePolicy.allows(url,"dock.html");
            }
            @Override public android.webkit.WebResourceResponse shouldInterceptRequest(
                    WebView view,android.webkit.WebResourceRequest request){
                return OtaAssets.intercept(OverlayService.this,otaWebLoader,request.getUrl());
            }
            @Override public void onPageFinished(WebView web,String url){
                if(LocalBridgePagePolicy.allows(url,"dock.html")){
                    popupLoaded=true;update();
                    if(menuExpanded&&!popupKind.isEmpty())
                        js(popupPanel,true,"window.showNativePopup&&window.showNativePopup("+
                            JSONObject.quote(popupKind)+","+popupTriggerWidthDp+")");
                }
            }
        });
        popupParams=new WindowManager.LayoutParams(dp(Math.max(1,Math.min(330,screenWidthDp()-12))),dp(450),
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL|
                WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
            PixelFormat.TRANSLUCENT);
        popupParams.gravity=Gravity.TOP|Gravity.LEFT;
        popupRoot.setVisibility(View.GONE);
        try{wm.addView(popupRoot,popupParams);}
        catch(Exception ex){recordFailure("criar popup independente",ex);
            popupRoot=null;popupPanel=null;popupParams=null;}
        if(popupPanel!=null)popupPanel.loadUrl(OtaAssets.webUrl("dock.html?controls=1&popup=1"));

        panel.loadUrl(OtaAssets.webUrl("dock.html"));
        if(detailRoot!=null)detailPanel.loadUrl(OtaAssets.webUrl("detail.html"));
        // Initial navigation is scheduled after cookie flush in onStartCommand.
        if(isSecondaryOverlay())secondaryRunning=true;
        else running=true;
        WatchAlerts.sharedPreferences(this)
            .registerOnSharedPreferenceChangeListener(sharedFavoritesListener);
    }
    private void createResultsWindow(){
        android.content.SharedPreferences prefs=overlayPrefs();
        resultCollapsed=prefs.getBoolean("resultsCollapsed",false);
        resultRoot=new FrameLayout(this){
            @Override public boolean dispatchTouchEvent(MotionEvent event){
                if(event.getActionMasked()==MotionEvent.ACTION_DOWN)
                    SupportMissionState.overlayTouch(OverlayService.this);
                return super.dispatchTouchEvent(event);
            }
        };
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
        final long[] lastLayoutMoveAt={0L};
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
                        // LT65-PERF: do not dispatch WindowManager work for every MotionEvent.
                        long now=android.os.SystemClock.uptimeMillis();
                        if(now-lastLayoutMoveAt[0]>=16L){
                            lastLayoutMoveAt[0]=now;
                            try{wm.updateViewLayout(resultRoot,resultParams);}
                            catch(Exception e){recordFailure("arrastar resultados",e);}
                            moveDetail();
                        }
                    }
                    return true;
                case MotionEvent.ACTION_UP:
                    if(!hasDragged[0])toggleResultsCollapsed();
                    else{
                        // Always commit the final coordinates even after a throttled move.
                        try{wm.updateViewLayout(resultRoot,resultParams);}
                        catch(Exception e){recordFailure("finalizar arraste",e);}
                        moveDetail();
                        positionIndependentPopup(); // Re-evaluate against new results bounds.
                        float density=getResources().getDisplayMetrics().density;
                        overlayPrefs().edit()
                            .putInt("resultsX",Math.round(resultParams.x/density)-visualResultsOffsetX)
                            .putInt("resultsY",Math.round(resultParams.y/density)-visualResultsOffsetY).apply();
                    }
                    return true;
                case MotionEvent.ACTION_CANCEL:return true;
            }
            return true;
        });
        // The Pokébola lives ONLY in the native dock grip. Disable the old
        // results-header hit area; the result list remains a separate WebView.
        resultRoot.addView(resultGrip,new FrameLayout.LayoutParams(
            dp(35),dp(RESULTS_HEADER_DP),Gravity.TOP|Gravity.LEFT));
        resultGrip.setVisibility(View.GONE);
        updateResultHeaderGrip();

        int preferredX=isSecondaryOverlay()?12:Math.max(0,screenWidthDp()-2*dockDp()-35);
        int preferredY=isSecondaryOverlay()?260:165;
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
            // Never expose the Native bridge to a navigated remote document.
            @Override public boolean shouldOverrideUrlLoading(
                    WebView view,android.webkit.WebResourceRequest request){
                return !LocalBridgePagePolicy.allows(
                    request.getUrl().toString(),"dock.html");
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view,String url){
                return !LocalBridgePagePolicy.allows(url,"dock.html");
            }
            @Override public android.webkit.WebResourceResponse shouldInterceptRequest(
                    WebView view,android.webkit.WebResourceRequest request){
                return OtaAssets.intercept(OverlayService.this,otaWebLoader,request.getUrl());
            }
            @Override public void onPageFinished(WebView web,String url){
                if(LocalBridgePagePolicy.allows(url,"dock.html")){
                    resultLoaded=true;
                    js(resultPanel,true,"window.setResultsCollapsed("+resultCollapsed+")");
                    update();
                }
            }
        });
        resultPanel.loadUrl(OtaAssets.webUrl("dock.html?results=1"));
        positionResultsUnderPokeball(true); // Migrate legacy independently saved list coordinates.
        if(resultCollapsed)resultRoot.setVisibility(View.GONE);
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
    // LT62-RESULTS-ANCHOR-01: The result list belongs visually to the
    // unified Pokébola, not to the old separately draggable result header.
    // Always derive its absolute position from the native dock and the Editor's
    // RELATIVE resultsOffsetX/Y; legacy resultsX/Y are kept only as fallback.
    // Never move a live user's login, filters, or poke search state.
    private void positionResultsUnderPokeball(boolean applyLayout){
        if(params==null||resultParams==null)return;
        DisplayMetrics display=metrics();
        // The old independent results header is hidden. Keep the NORMAL gap
        // exactly 2 physical pixels, not 2dp (which grows with density).
        // Only an explicit Editor Visual after-header offset adds to it.
        int gap=ResultsSpacingPolicy.DEFAULT_TOP_GAP_PX+dp(visualHeaderAfterGap);
        int x=params.x+dp(visualResultsOffsetX);
        int below=params.y+dp(30)+gap+dp(visualResultsOffsetY);
        int above=params.y-resultParams.height-gap+dp(visualResultsOffsetY);
        int y=below;
        // When the list cannot fit below the icon, prefer ABOVE over clipping
        // 10 Pokémon or silently shifting the whole icon away from the finger.
        if(below+resultParams.height>display.heightPixels&&above>=0)
            y=above;
        int maxX=Math.max(0,display.widthPixels-resultParams.width);
        int maxY=Math.max(0,display.heightPixels-resultParams.height);
        int desiredX=Math.max(0,Math.min(maxX,x));
        int desiredY=Math.max(0,Math.min(maxY,y));
        if(resultParams.x==desiredX&&resultParams.y==desiredY)return;
        resultParams.x=desiredX;
        resultParams.y=desiredY;
        if(applyLayout&&resultRoot!=null&&wm!=null&&resultRoot.isAttachedToWindow()){
            try{wm.updateViewLayout(resultRoot,resultParams);}
            catch(Exception e){recordFailure("alinhar resultados com Pokébola",e);}
        }
        moveDetail();
    }
    private void updateResultsWidth(){
        if(resultParams==null||resultRoot==null)return;
        resultParams.width=dp(resultWidthDp());
        // Width/orientation changes may invalidate the old X clamp.
        // Re-anchor under the same Pokébola instead of leaving a detached list.
        positionResultsUnderPokeball(false);
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
        try(InputStream in=OtaAssets.open(this,"probe.js")){
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
        if(authorizedApiQaSelected()&&apiProviderBackoffUntil()>0L){
            scheduleProviderRateLimitResume();
            long remaining=(apiProviderBackoffUntil()-System.currentTimeMillis()+999L)/1000L;
            String waitText=remaining>=3600L?(remaining+3599L)/3600L+"h":
                remaining>=60L?(remaining+59L)/60L+"min":Math.max(1L,remaining)+"s";
            status("⚠ API: limite temporário; nova tentativa em cerca de "+waitText+".");
            return;
        }
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
        locationFinalRetryCount=0;
        confirmedSubmittedFiltersGeneration=-1;
        submittedSearchGeneration=-1;
        submittingSearchGeneration=-1;
        watchdogGeneration=generation;
        handler.removeCallbacks(searchWatchdog);
        handler.postDelayed(searchWatchdog,SEARCH_WATCHDOG_MS);
        status(manual?"Busca manual iniciada...":"Atualizando...");
        if(authorizedApiQaSelected()){
            // No DOM Search is also dispatched: each generation uses one source.
            if(authorizedApiCollector==null)
                authorizedApiCollector=new AuthorizedApiCollector(website,getAssets(),handler);
            performAuthorizedApiSearch(generation,manual);
            return;
        }
        execute("session",session->continueVerifiedSearchSession(generation,manual,session,0));
    }
    // Keep the second (in-search) auth proof as careful as the Shiny tap.
    // React hydration may temporarily report "não confirmado" even after
    // the first session gate returned an authenticated trainer.
    private void continueVerifiedSearchSession(int generation,boolean manual,JSONObject session,int attempt){
            if(stopped||loginPaused||generation!=requestGeneration)return;
            final String auth=session.optString("auth","não confirmado");
            if(shiny&&"não confirmado".equals(auth)){
                if(attempt<6){
                    if(attempt==0)status("✨ Confirmando sessão Shiny antes da busca...");
                    handler.postDelayed(()->{
                        if(stopped||loginPaused||generation!=requestGeneration)return;
                        execute("session",nextSession->
                            continueVerifiedSearchSession(generation,manual,nextSession,attempt+1));
                    },400L);
                    return;
                }
                // No proof of logout: keep the user's ON intent and reject
                // this search rather than silently submitting an OFF query.
                searchInProgress=false;
                shinyVerified=false;
                searchFailure("⚠ Sessão Shiny pendente",
                    "O site não confirmou a sessão Shiny após novas leituras. "+
                    "Shiny solicitado permanece pendente; nenhuma busca foi enviada.");
                return;
            }
            // A partially hydrated mobile page is not proof that the stored
            // authentication expired. Do not turn a verified session into
            // "login necessary" merely because the DOM is temporarily empty.
            if(!"não confirmado".equals(auth))
                PogoAccountSlots.prefs(this,PogoAccountSlots.assigned(this,
                    isSecondaryOverlay())).edit().putString("sessionStatus",auth).apply();
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
            String summary=reason.contains("portal oficial do seletor Pokémon")?
                "Seletor Pokémon não abriu no site":
                reason.replace("Filtros adicionais: ","").trim();
            if(summary.length()>38)summary=summary.substring(0,38);
            searchFailure("⚠ Filtro: "+summary,
                "Falha na configuração do site: "+reason+
                (reason.contains("portal oficial do seletor Pokémon")?
                 ". A seleção continua salva. Reabra o seletor oficial e tente novamente.":""));
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
                String why=configured.optString("reason","verifique o formulário do site.");
                // The official React page can change selectors without making
                // the coordinates invalid. Surface a safe, actionable category,
                // without echoing any private latitude/longitude to the UI.
                String label=why.contains("Coords")?"Modo/Campo Coords indisponível":
                    why.contains("raio")||why.contains("Radius")?"Raio não aplicado":
                    why.contains("coordenadas")?"Coordenadas não persistiram":
                    "Verificação pendente no site";
                searchFailure(locationEnabled?"⚠ Localização: "+label:"⚠ Pesquisa não confirmada",
                    (locationEnabled?"Não foi possível configurar localização: ":
                    "Filtro geográfico do site não pôde ser neutralizado: ")+why);
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
                    String why=verified.optString("reason","estado ainda diferente");
                    String label=why.contains("Radius")||why.contains("Raio")?"Raio não confirmado":
                        why.contains("Coords")||why.contains("modo")?"Modo/Campo Coords não confirmado":
                        why.contains("Coordenadas")?"Coordenadas não persistiram":
                        "Campos não confirmados no site";
                    searchFailure("⚠ Localização: "+label,
                        "Aguardando confirmação dos dois campos Coords/Radius no site: "+
                        why+". Pesquisa não enviada.");
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
        intent.putExtra("pogoAccountSlot",PogoAccountSlots.assigned(this,isSecondaryOverlay()));
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
        return PogoAccountSlots.hasTrainer(this,
            PogoAccountSlots.assigned(this,isSecondaryOverlay()),
            PogoAccountSlots.trainer(this,isSecondaryOverlay()));
    }
    private boolean siteConfirmsShinyAccount(JSONObject session){
        return "autenticada".equals(session.optString("auth","")) &&
            (session.optBoolean("trainerLinked",false)||hasConfirmedTrainerLink());
    }
    private void revertUnverifiedShiny(String reason){
        shiny=false;
        shinyVerified=false;
        // Keep a user-initiated login prompt pending until it is opened.
        overlayPrefs().edit().putBoolean("shiny",false).apply();
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
    // LT62-SHINY-ONE-PASS: no duplicated setShiny -> verify -> Search.
    // On a half-hydrated page, "não confirmado" is not proof of logout.
    // Retry the SITE session briefly before showing an account-link prompt.
    private void startVerifiedShinySearch(int generation,int attempt){
        if(stopped||loginPaused||generation!=requestGeneration||!shiny)return;
        if(!loaded||website==null){
            status("✨ Site ainda carregando; Shiny será conferido no próximo carregamento.");
            return;
        }
        execute("session",session->{
            if(stopped||loginPaused||generation!=requestGeneration||!shiny)return;
            String auth=session.optString("auth","não confirmado");
            if("não confirmado".equals(auth)&&attempt<6){
                if(attempt==0)status("✨ Aguardando confirmação da sessão no site...");
                handler.postDelayed(()->startVerifiedShinySearch(generation,attempt+1),400L);
                return;
            }
            PogoAccountSlots.prefs(this,PogoAccountSlots.assigned(this,
                isSecondaryOverlay())).edit().putString("sessionStatus",auth).apply();
            if(!siteConfirmsShinyAccount(session)){
                revertUnverifiedShiny("✨ Conta logada e treinador confirmado são obrigatórios para Shiny.");
                openShinyLogin();
                return;
            }
            // One site search applies and verifies all active filters, including
            // Shiny after Coords, before submitting Search. A single generation
            // prevents stale answers from replacing the selected state.
            status(locationEnabled?"✨ Verificando Shiny e localização na mesma busca...":
                "✨ Verificando Shiny e pesquisando...");
            refresh(true);
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
                        // Re-hydration of Shiny/IV widgets can replace the
                        // coordinates fields after earlier successful checks.
                        // Rebind no more than twice; never submit blindly.
                        if(locationFinalRetryCount<2){
                            locationFinalRetryCount++;
                            status("📍 Reconfirmando coordenadas e raio no site...");
                            configureLocationAndVerify(generation,manual,0);
                            return;
                        }
                        searchInProgress=false;
                        searchFailure(locationEnabled?"⚠ Localização: campos divergentes":"⚠ Localização residual",
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
                        overlayPrefs().edit()
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
    // Probe the hydrated result DOM early, then back off. These are local
    // evaluateJavascript reads; never dispatch extra upstream Search requests.
    private static long resultPollDelayMs(int attempt){
        if(attempt==0)return 700L;
        return attempt<=6?650L:1150L;
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
            // LT60-E9: the site may briefly retain cards from the previous
            // Search while React switches GL/UL or IV modes. A verified filter
            // form alone is not proof that those visible cards were refreshed.
            if(r.optBoolean("resultFreshnessPending",false)){
                if(attempt<24){
                    pollSearch(generation,attempt+1,manual);
                    return;
                }
                searchInProgress=false;
                searchFailure("⚠ Resultados anteriores",
                    "O site não apresentou alteração comprovável da lista após Search. "+
                    "Os cartões anteriores foram preservados, sem novos alertas.");
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
                int missingEvidence=r.optInt("unverifiedIv",found);
                int differentIv=r.optInt("verifiedNonmatchingIv",0);
                // A valid encounter with a DIFFERENT IV is not missing proof.
                // Example: after IV% 0–92, 7/15/5 must not trigger
                // "IV não comprovado" when the requested raw IV is 0/15/15.
                // Never promote mismatched cards to results, alerts or cache.
                if(!pvp&&found>0&&missingEvidence==0&&differentIv==found&&
                    r.optBoolean("resultChanged",false)){
                    if(count()==0){
                        // Mode switches already cleared other filters' sprites.
                        // No verified match exists for this requested IV;
                        // do not claim a provider-confirmed zero result.
                        results="[]";selected=-1;
                        shownMode=mode;shownConfigJson=filterConfigJson();
                        shownShiny=shiny&&shinyVerified;
                        resultsStale=false;searchPhase="empty";
                        overlayPrefs().edit().putString("lastError","Nenhum").apply();
                        armNextDespawn(new JSONArray());
                        hideDetails();
                        status("Nenhum Pokémon com o IV selecionado foi confirmado.");
                    }else{
                        // Same-filter previously verified cards stay visible.
                        searchFailure("⚠ Resultados divergentes",
                            "O site mostrou IVs diferentes do filtro atual; resultados confirmados preservados.");
                    }
                    return;
                }
                searchFailure(pvp?"⚠ Ranking não confirmado":
                        (missingEvidence>0?"⚠ IV não comprovado":"⚠ Resultados divergentes"),
                    "Nenhum cartão atendeu ao filtro solicitado após a leitura do site. "+
                    (pvp?"Rank não confirmado.":"IVs sem comprovação: "+missingEvidence+
                     "; IVs comprovados de outros filtros: "+differentIv)+".");
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
                String evidence=r.optBoolean("emptySignalFound",false)?
                    (r.optBoolean("resultChanged",false)?"estado vazio não concluído":"estado vazio anterior sem atualização"):
                    "sem cartões nem sinal explícito de zero resultados";
                searchFailure("⚠ Site sem confirmação",
                    "Tempo limite: "+evidence+". Resultados anteriores preservados.");
                return;
            }
            // Diagnostic only: record bounded local DOM polling latency, not
            // user coordinates, trainer code, cookies or full query details.
            if(lastSearchStartMs>0L)BugReport.log(this,"SEARCH_LATENCY",
                "mode="+mode+" attempts="+attempt+
                " elapsedMs="+Math.max(0L,System.currentTimeMillis()-lastSearchStartMs)+
                " cards="+found+" empty="+empty);
            applyCollectedResults(r);
            });
        }, resultPollDelayMs(attempt));
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
        // Never dedupe merely by the same species/CP/location. Different
        // absolute expiries and verified form/IV can denote different spawns.
        // Mode deliberately is not part of the encounter identity.
        return c.optString("number","")+"|"+c.optString("name","")+"|"+
            c.optString("form","")+"|"+c.optString("cp","")+"|"+
            c.optString("level","")+"|"+c.optString("location","")+"|"+
            c.optString("iv","")+"|"+c.optLong("expiresAtMs",0);
    }
    // Sort by distance can re-collect a partially hydrated result. Retain
    // previously VERIFIED fields only for the identical unexpired encounter:
    // same species, name, CP, level, location AND absolute despawn timestamp.
    // Never copy between lookalike spawns or across a changed PvP mode.
    private JSONArray retainVerifiedEncounterFields(JSONArray incoming){
        if(incoming==null||incoming.length()==0)return incoming;
        JSONArray previous;
        try{previous=new JSONArray(results);}catch(org.json.JSONException ignored){return incoming;}
        java.util.HashMap<String,JSONObject> existing=new java.util.HashMap<>();
        long now=System.currentTimeMillis();
        for(int i=0;i<previous.length();i++){
            JSONObject old=previous.optJSONObject(i);
            if(old==null||old.optLong("expiresAtMs",0)<=now)continue;
            String key=encounterIdentityForMetadata(old);
            if(!key.isEmpty())existing.put(key,old);
        }
        boolean samePvPMode=shownMode.equals(mode);
        String[] stable={"iv","ivPercent","moves","gender","size","form"};
        String[] scoped={"rank","ivRank","ivRankSource","ivRankLeague"};
        for(int i=0;i<incoming.length();i++){
            JSONObject card=incoming.optJSONObject(i);
            if(card==null)continue;
            JSONObject prior=existing.get(encounterIdentityForMetadata(card));
            if(prior==null)continue;
            try{
                for(String field:stable)
                    if((!card.has(field)||card.isNull(field)||
                         card.optString(field,"").trim().isEmpty())&&
                        prior.has(field)&&!prior.isNull(field)&&
                        !prior.optString(field,"").trim().isEmpty())
                        card.put(field,prior.get(field));
                if(samePvPMode)for(String field:scoped)
                    if((!card.has(field)||card.isNull(field)||
                         card.optString(field,"").trim().isEmpty())&&
                        prior.has(field)&&!prior.isNull(field)&&
                        !prior.optString(field,"").trim().isEmpty())
                        card.put(field,prior.get(field));
                // Lazy site images may disappear on refresh while their exact
                // encounter stays visible. Keep the original URL ONLY when
                // form, costume, Shiny and identity all still match.
                boolean sameArtIdentity=card.optString("form","").equals(prior.optString("form",""))&&
                    card.optString("costume","").equals(prior.optString("costume",""))&&
                    card.optBoolean("shiny",false)==prior.optBoolean("shiny",false)&&
                    card.optString("gender","").equals(prior.optString("gender",""));
                if(sameArtIdentity&&card.optString("image","").isEmpty()&&
                    prior.optBoolean("imageFromSite",false)&&
                    prior.optString("image","").startsWith("https://")&&
                    prior.optString("image","").length()<=1600&&
                    !prior.optString("image","").contains(" ")){
                    card.put("image",prior.getString("image"));
                    card.put("imageFromSite",true);
                }
            }catch(org.json.JSONException ignored){}
        }
        return incoming;
    }
    private String encounterIdentityForMetadata(JSONObject card){
        if(card==null||card.optLong("expiresAtMs",0)<=0)return "";
        for(String key:new String[]{"number","name","cp","level","location"})
            if(card.optString(key,"").isEmpty())return "";
        return card.optString("number")+"|"+card.optString("name")+"|"+
            card.optString("cp")+"|"+card.optString("level")+"|"+
            card.optString("location")+"|"+card.optLong("expiresAtMs");
    }
    private JSONArray sortItems(JSONArray source){
        java.util.ArrayList<JSONObject> a=new java.util.ArrayList<>();
        if(source!=null)for(int i=0;i<source.length();i++){
            JSONObject c=source.optJSONObject(i);if(c!=null)a.add(c);
        }
        // The site sorts before our first verified cards. Preserve that order.
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
    // Shared production policy is a pure Java class with executable JVM tests.
    private static boolean matchesVerifiedIvPercent(double observed,int sum){
        return VerifiedIvMath.matchesVerifiedPercent(observed,sum);
    }
    private boolean verifiedTargetCriteria(JSONObject card){
        if(card==null)return false;
        if("iv".equals(mode)||"raw".equals(mode)||"percent".equals(mode))
            return VerifiedIvMath.matchesCriteria(mode,
                card.optString("iv",""),card.optString("ivPercent",""),
                rawAttack,rawDefense,rawStamina,ivPercentMin,ivPercentMax);
        if("gl".equals(mode)||"ul".equals(mode)){
            int max="ul".equals(mode)?ulRank:glRank;
            int shown=rankForSort(card);
            return (shown>=1&&shown<=max) ||
                ("verified-site-filter".equals(card.optString("rankSource",""))&&shown==999999);
        }
        return false;
    }
    private String encounterAlertTitle(JSONObject card){
        return EncounterAlertText.title(card.optString("name","Pokémon"),
            card.optString("number",""),card.optString("iv",""),
            card.optString("ivPercent",""),card.optBoolean("shiny",false),
            mode,card.optString("rank",""));
    }
    private String encounterAlertDetails(JSONObject card,boolean favorite){
        return EncounterAlertText.details(favorite,isSecondaryOverlay(),
            card.optString("cp",""),card.optString("iv",""),
            card.optString("ivPercent",""),card.optString("form",""),
            card.optString("costume",""),card.optString("size",""),
            card.optString("gender",card.optString("sex","")),
            card.optString("location",""));
    }
    /** Display only the packed, species-exact base picture for ordinary forms.
     * A missing or unverified costume must NOT borrow a misleading base sprite.
     */
    private android.graphics.Bitmap notificationArtwork(JSONObject card){
        if(card==null||card.optBoolean("isCostume",false)||
            card.optInt("costume_id",0)!=0)return null;
        String costume=card.optString("costume","").trim();
        String form=card.optString("form","").trim();
        String region=card.optString("region","").trim();
        String variant=card.optString("variant","").trim();
        if((!costume.isEmpty()&&!"normal".equalsIgnoreCase(costume)&&
            !"none".equalsIgnoreCase(costume))||
            (!form.isEmpty()&&!"normal".equalsIgnoreCase(form)&&
             !"default".equalsIgnoreCase(form))||
            !region.isEmpty()||!variant.isEmpty())return null;
        String id=card.optString("number","").replace("#","").trim();
        if(!id.matches("[0-9]{1,4}"))return null;
        int dex=Integer.parseInt(id);
        if(dex<1||dex>1025)return null;
        String file="pokemon-sprites/"+
            (card.optBoolean("shiny",false)?"shiny/":"base/")+dex+".png";
        try(java.io.InputStream input=OtaAssets.open(this,file)){
            android.graphics.Bitmap bitmap=android.graphics.BitmapFactory.decodeStream(input);
            if(bitmap==null)return null;
            return android.graphics.Bitmap.createScaledBitmap(bitmap,96,96,true);
        }catch(java.io.IOException|RuntimeException ignored){return null;}
    }
    private boolean sendGeneralNotification(String title,String info,int id){
        return sendGeneralNotification(title,info,id,null);
    }
    private boolean sendGeneralNotification(String title,String info,int id,
                                            android.graphics.Bitmap artwork){
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
        Notification.Builder builder=new Notification.Builder(this,channelId)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title).setContentText(info).setAutoCancel(true)
            .setSubText("PokeSearch · Novos Pokémon")
            .setContentIntent(pending)
            .setStyle(new Notification.BigTextStyle().bigText(info));
        if(artwork!=null)builder.setLargeIcon(artwork);
        Notification note=builder.build();
        try{nm.notify(id,note);return true;}
        catch(Exception e){recordFailure("notificação geral",e);return false;}
    }
    private void recordNewResults(JSONArray cards,boolean leagueConfirmed){
        android.content.SharedPreferences preferences=overlayPrefs();
        JSONArray history;
        try{history=new JSONArray(preferences.getString("history","[]"));}
        catch(Exception e){recordFailure("ler histórico",e);history=new JSONArray();}
        java.util.Set<String> current=new java.util.HashSet<>();
        String firstNew="";
        JSONObject firstNewCard=null;
        String firstGeneralKey="";
        long firstGeneralExpiry=0L;
        int watchedCount=0;
        // Commit Favorite TTL ONLY after Android accepts the actual notice.
        // Missing permission, OFF, blocked channels and retries cannot silently
        // consume an encounter without a delivered alert.
        java.util.LinkedHashMap<String,Long> pendingFavoriteKeys=new java.util.LinkedHashMap<>();
        java.util.LinkedHashMap<String,String> pendingFavoriteSpecies=new java.util.LinkedHashMap<>();
        java.util.Set<String> wanted=WatchAlerts.watched(this);
        long now=System.currentTimeMillis();
        recentSpawnExpiries.entrySet().removeIf(entry->entry.getValue()<=now);
        successfullyNotifiedGeneralSpawns.entrySet().removeIf(entry->entry.getValue()<=now);
        recentFavoriteAlertExpiries.entrySet().removeIf(entry->entry.getValue()<=now);
        for(int i=0;i<cards.length();i++){
            JSONObject c=cards.optJSONObject(i);
            if(c==null)continue;
            long expiry=c.optLong("expiresAtMs",Long.MAX_VALUE);
            if(expiry<=now)continue; // expired Pokémon can never notify
            String key=spawnKey(c);
            current.add(key);
            boolean newSpawn=!knownSpawns.contains(key)&&
                recentSpawnExpiries.getOrDefault(key,0L)<=now;
            long expireAt=expiry==Long.MAX_VALUE?now+15L*60_000L:expiry;
            // Never let a previous ordinary sighting suppress a newly enabled
            // Favorite alert. Its own dedup key prevents duplicate sound on
            // every refresh. Neither path accepts unverified/expired spawns.
            if(newSpawn)recentSpawnExpiries.put(key,expireAt);
            // A discovery can be seen while Android notifications are OFF.
            // Retain eligibility until an actual accepted notification or TTL.
            if(firstNew.isEmpty() &&
                successfullyNotifiedGeneralSpawns.getOrDefault(key,0L)<=now &&
                ("iv".equals(mode)||"raw".equals(mode)||"percent".equals(mode)||leagueConfirmed) &&
                verifiedTargetCriteria(c)){
                firstNew=c.optString("name","Pokémon");
                firstNewCard=c;
                firstGeneralKey=key;
                firstGeneralExpiry=expireAt;
            }
            if(WatchAlerts.enabled(this) &&
                recentFavoriteAlertExpiries.getOrDefault(key,0L)<=now &&
                ("iv".equals(mode)||"raw".equals(mode)||"percent".equals(mode)||leagueConfirmed) &&
                verifiedTargetCriteria(c) &&
                WatchAlerts.matches(c.optString("name",""),wanted)){
                pendingFavoriteKeys.put(key,expireAt);
                pendingFavoriteSpecies.put(key,WatchAlerts.normalized(c.optString("name","")));
                watchedCount++;
                // Queue every verified encounter, not just the first species.
                // Each published alert carries its own exact IV/rank/form/PC.
                if(!queuedFavoriteAlerts.containsKey(key)){
                    if(queuedFavoriteAlerts.size()>=MAX_QUEUED_FAVORITES)
                        queuedFavoriteAlerts.entrySet().removeIf(
                            entry->entry.getValue().expiry<=now);
                    if(queuedFavoriteAlerts.size()<MAX_QUEUED_FAVORITES)
                        queuedFavoriteAlerts.put(key,new QueuedFavoriteAlert(key,
                            c.optString("name","Pokémon"),
                            encounterAlertTitle(c),encounterAlertDetails(c,true),
                            expireAt,c));
                }
            }
            if(!newSpawn)continue; // history is only for truly new encounters
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
        if(watchedCount>0){
            int before=queuedFavoriteAlerts.size();
            drainFavoriteAlertQueue();
            int delivered=Math.max(0,before-queuedFavoriteAlerts.size());
            BugReport.log(this,"FAVORITE_ALERT_PARITY",
                (isSecondaryOverlay()?"P2":"P1")+" candidatos="+watchedCount+
                " avisos="+delivered+" perfil="+
                    getSharedPreferences("prefs",0).getInt("favoritePresetActiveV1",0)+
                " modo="+WatchAlerts.mode(this)+" permissão="+WatchAlerts.permissionGranted(this));
            if(!WatchAlerts.permissionGranted(this))
                getSharedPreferences("prefs",0).edit().putString("lastWatchAlertError",
                    "Permissão de notificações não concedida").apply();
        }
        if(!"off".equals(alertsMode)&&alerts&&!firstNew.isEmpty()&&now-lastAlertAt>60000L){
            if(firstNewCard!=null&&sendGeneralNotification(
                encounterAlertTitle(firstNewCard),encounterAlertDetails(firstNewCard,false),
                NEXT_GENERAL_ALERT_ID.updateAndGet(old->old>=43999?33000:old+1),
                notificationArtwork(firstNewCard)))
                {
                    lastAlertAt=now;
                    successfullyNotifiedGeneralSpawns.put(firstGeneralKey,firstGeneralExpiry);
                }
        }
    }
    // A reset request is pending until a real Search is submitted and its
    // results pass the website + native criteria gates. Never clear it on a
    // click, timeout or rejected response; that would hide an active site filter.
    private void acknowledgeConfirmedExtraResets(){
        try{
            JSONObject updated=new JSONObject(extraFiltersJson);
            org.json.JSONArray pending=updated.optJSONArray("clearExtraKeys");
            if(pending==null||pending.length()==0)return;
            updated.remove("clearExtraKeys");
            extraFiltersJson=updated.toString();
            overlayPrefs().edit()
                .putString("extraFiltersJson",extraFiltersJson).apply();
        }catch(org.json.JSONException error){
            recordFailure("confirmar limpeza de filtros",error);
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
            int rejected=0,differentVerifiedIv=0;
            for(int i=0;i<items.length();i++){
                JSONObject card=items.optJSONObject(i);
                if(card!=null&&verifiedTargetCriteria(card))verified.put(card);
                else {
                    rejected++;
                    if(card!=null){
                        String raw=card.optString("iv","").trim();
                        if(raw.matches("(?:[0-9]|1[0-5])/(?:[0-9]|1[0-5])/(?:[0-9]|1[0-5])")){
                            String[] parts=raw.split("/");
                            int sum=Integer.parseInt(parts[0])+Integer.parseInt(parts[1])+
                                Integer.parseInt(parts[2]);
                            String pct=card.optString("ivPercent","").trim();
                            if(pct.isEmpty())differentVerifiedIv++;
                            else if(pct.matches("(?:0|[1-9][0-9]?|100)(?:[.,][0-9]{1,8})?")){
                                try{
                                    double observed=Double.parseDouble(pct.replace(',','.'));
                                    if(matchesVerifiedIvPercent(observed,sum))
                                        differentVerifiedIv++;
                                }catch(NumberFormatException ignored){}
                            }
                        }
                    }
                }
            }
            if(rejected>0){
                BugReport.log(this,"IV_EVIDENCE",
                    "Rejeitados="+rejected+" • IV identificado de outro filtro="+
                    differentVerifiedIv+" modo="+mode);
                if(verified.length()==0){
                    searchInProgress=false;
                    searchFailure(differentVerifiedIv>0?"⚠ Resultados divergentes":
                            "⚠ IV não comprovado",
                        "Nenhum cartão passou na conferência do filtro nativo. "+
                        "IVs comprovados mas diferentes="+differentVerifiedIv+
                        "; outros rejeitados="+(rejected-differentVerifiedIv)+
                        ". Nenhum resultado indevido foi exibido ou notificado.");
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
                // The API sends an authoritative absolute despawn timestamp;
                // do not replace/ignore it because its legacy MM:SS is empty.
                long absolute=card.optLong("expiresAtMs",Long.MAX_VALUE);
                long end=absolute!=Long.MAX_VALUE?absolute:expiration(card);
                // Even if the site briefly shows an old 0:00 card during
                // React updates, do not reinsert an expired spawn or notify it.
                if(end<=now)continue;
                if(end!=Long.MAX_VALUE)card.put("expiresAtMs",end);
            }catch(Exception e){recordFailure("marcar despawn",e);}
            unexpired.put(card);
        }
        JSONArray inSortOrder=sortItems(retainVerifiedEncounterFields(unexpired));
        JSONArray sorted=new JSONArray();
        // Both P1 and P2 must cap display, cache, history and notifications.
        for(int i=0;i<inSortOrder.length()&&i<10;i++)sorted.put(inSortOrder.opt(i));
        // An authenticated, criteria-verified API search is a REAL search,
        // not synthetic QA fixture data. Previously all API-backed encounters
        // skipped recordNewResults, so neither New nor Favorites ever alerted.
        // Never alert an untrusted API response or an invalid/stale filter.
        boolean authorizedApiQa="authorized-api-qa".equals(r.optString("source",""));
        boolean apiConfirmed=authorizedApiQa&&
            r.optBoolean("criteriaConfirmed",false)&&
            r.optBoolean("resultChanged",false)&&
            r.optBoolean("requestValidated",false)&&
            "api-http-200".equals(r.optString("confirmationSource",""))&&
            (!("gl".equals(mode)||"ul".equals(mode))||
                r.optBoolean("leagueConfirmed",false));
        if(!authorizedApiQa||apiConfirmed){
            recordNewResults(sorted,r.optBoolean("leagueConfirmed",false));
            verifiedFavoriteResultsGeneration=requestGeneration;
        }
        else BugReport.log(this,"ALERT_AUDIT","API não confirmada, alertas bloqueados");
        if(!authorizedApiQa||apiConfirmed){
            BugReport.log(this,"ALERT_AUDIT",
                "fonte="+(authorizedApiQa?"api-confirmada":"site-confirmado")+
                " • encontrados="+sorted.length()+" • favoritos="+
                WatchAlerts.watched(this).size()+" • modo-favoritos="+WatchAlerts.mode(this)+
                " • modo-novos="+alertsMode+" • permissão="+
                WatchAlerts.permissionGranted(this));
        }
        displayedApiResults=authorizedApiQa;
        results=sorted.toString();
        searchPhase=sorted.length()==0?"empty":"updated";
        // Criteria were verified before Search and rechecked during collection.
        // Acknowledge transient clear intents only after accepting the result.
        acknowledgeConfirmedExtraResets();
        shownMode=mode;shownConfigJson=filterConfigJson();
        shownShiny=shiny&&shinyVerified;resultsStale=false;
        rememberConfirmedPreview(sorted,now);
        searchInProgress=false;
        armNextDespawn(sorted);
        if(selected>=0)hideDetails();
        overlayPrefs().edit()
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
        else status(sorted.length()+(authorizedApiQa?
            " Pokémon da API atualizados":" Pokémon atualizados"));
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
        if(Math.abs(resultParams.height-pixels)<dp(2)){
            // E.g. changing visual Y offset while the list height is unchanged.
            positionResultsUnderPokeball(true);
            return;
        }
        resultParams.height=pixels;
        positionResultsUnderPokeball(false);
        try{wm.updateViewLayout(resultRoot,resultParams);}
        catch(Exception e){recordFailure("redimensionar resultados",e);}
        moveDetail();
    }
    private void toggleResultsCollapsed(){
        if(minimized||resultRoot==null)return;
        resultCollapsed=!resultCollapsed;
        overlayPrefs().edit()
            .putBoolean("resultsCollapsed",resultCollapsed).apply();
        js(resultPanel,resultLoaded,"window.setResultsCollapsed("+resultCollapsed+")");
        if(resultRoot!=null)resultRoot.setVisibility(
            resultCollapsed||minimized||loginPaused||pickerOpen?View.GONE:View.VISIBLE);
        updateResultsWidth();
        if(resultCollapsed){
            hideDetails();
            resizeResults(minResultsHeaderHeightDp());
        }
    }
    private void menu(boolean show){
        if(params==null||minimized)return;
        if(show==menuExpanded)return;
        if(!show){if(locationEditorOpen)locationEditor(false);closeIndependentPopup();}
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
        // Hidden result WebView must not keep its 1-second despawn ticker active.
        js(resultPanel,resultLoaded,"window.setResultsPaused("+yes+")");
        if(resultRoot!=null)resultRoot.setVisibility(
            yes||resultCollapsed||loginPaused||pickerOpen?View.GONE:View.VISIBLE);
        updateWindow();
    }
    private void showDetails(int index){
        if(detailRoot==null||detailPanel==null||!detailLoaded||minimized)return;
        try{
            JSONArray a=new JSONArray(results);
            if(index<0||index>=a.length()){hideDetails();return;}
            // A previous Get coords callback must never update another card.
            if(selected!=index){coordinateRequestToken++;detailManuallyPositioned=false;}
            selected=index;
            JSONObject obj=a.getJSONObject(index);
            js(detailPanel,true,"window.showDetails("+obj.toString()+","+JSONObject.quote(count()>0?shownMode:mode)+","+WatchAlerts.isWatched(this,obj.optString("name",""))+")");
            detailRoot.setVisibility(View.VISIBLE);
            pushCoordsQuota();
            checkCoordsAccount(false);
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
        detailManuallyPositioned=false;
        coordinateRequestToken++; // Invalidates pending site callbacks after dismiss.
        selected=-1;
        offeredCapture=null;offeredGeneration=-1;
        // UX-DETAIL-TIMER-01: pause JS countdown while detail WebView is hidden.
        js(detailPanel,detailLoaded,"window.pauseDetailTimer()");
        if(detailRoot!=null)detailRoot.setVisibility(View.GONE);
        js(resultPanel,resultLoaded,"window.highlight(-1)");
    }
    private void resizeDetail(int heightDp){
        // LT66: 310dp clipped expanded PvP leagues on Samsung. Keep a
        // screen-bounded native window and let #panel scroll all content.
        // Show the complete compact card whenever the device has room; use
        // inner scrolling only for genuinely tall content/evolution details.
        int available=Math.max(96,screenHeightDp()-40);
        detailHeight=Math.max(96,Math.min(Math.min(520,available),heightDp));
        if(detailParams!=null&&detailRoot!=null){
            detailParams.height=dp(detailHeight);moveDetail();
        }
    }
    private boolean currentCoordinateTarget(JSONObject target){
        try{
            JSONArray a=new JSONArray(results);
            for(int i=0;i<a.length();i++){
                JSONObject card=a.getJSONObject(i);
                if(card.optInt("sourceIndex",-1)!=target.optInt("sourceIndex",-2))continue;
                return card.optString("name","").equals(target.optString("name",""))&&
                    card.optString("cp","").equals(target.optString("cp",""))&&
                    card.optString("number","").equals(target.optString("number",""))&&
                    card.optString("location","").equals(target.optString("location",""))&&
                    card.optString("iv","").equals(target.optString("iv",""))&&
                    card.optString("gender","").equals(target.optString("gender",""))&&
                    card.optString("level","").equals(target.optString("level",""));
            }
        }catch(Exception e){recordFailure("verificar identidade Get coords",e);}
        return false;
    }
    private void pollCoordinates(JSONObject target,int attempt,boolean autoCopy,long requestToken){
        if(stopped||loginPaused||requestToken!=coordinateRequestToken)return;
        if(!currentCoordinateTarget(target)){
            deliverCoords("","Resultados mudaram; selecione o Pokémon novamente.");return;
        }
        JSONObject query=new JSONObject();
        try{
            query.put("index",target.optInt("sourceIndex",-1));
            query.put("name",target.optString("name",""));
            query.put("cp",target.optString("cp",""));
            query.put("number",target.optString("number",""));
            query.put("location",target.optString("location",""));
            query.put("iv",target.optString("iv",""));
            query.put("gender",target.optString("gender",""));
            query.put("level",target.optString("level",""));
        }catch(Exception e){recordFailure("preparar consulta de coordenadas",e);}
        execute("readCoords:"+query.toString(),result->{
            if(stopped||loginPaused||requestToken!=coordinateRequestToken)return;
            if(!currentCoordinateTarget(target)){
                deliverCoords("","Resultados mudaram; coordenadas não copiadas.");return;
            }
            String coords=extractCoordinates(result.optString("coords",""));
            if(result.optBoolean("ok")&&!coords.isEmpty()){
                try{
                    JSONArray existing=new JSONArray(results);
                    for(int i=0;i<existing.length();i++){
                        JSONObject card=existing.getJSONObject(i);
                        if(card.optInt("sourceIndex",-1)==target.optInt("sourceIndex",-2)){
                            card.put("coords",coords);break;
                        }
                    }
                    results=existing.toString();
                }catch(Exception e){recordFailure("armazenar coordenadas",e);}
                if(autoCopy)copyCoordinatesInternal(coords);
                CoordsQuotaStore.successfulReveal(this,null);
                deliverCoords(coords,autoCopy?"Coordenadas copiadas":"Coordenadas obtidas");return;
            }
            String limitType=result.optString("limitType","");
            if("rate".equals(limitType)||"quota".equals(limitType)){
                deliverCoordsRestricted(limitType,result.optInt("retrySeconds",0));
                return;
            }
            if(result.optBoolean("pending",false)&&attempt<9){
                // Bounded polling of this one verified card, never a second
                // Get coords click. Give slow React hydration time to settle.
                handler.postDelayed(()->{
                    if(!stopped&&!loginPaused&&requestToken==coordinateRequestToken)
                        pollCoordinates(target,attempt+1,autoCopy,requestToken);
                },750L);
            }else{
                String reason=result.optString("status","");
                if(reason.startsWith("Aguardando reidentificação")){
                    deliverCoords("","Não foi possível confirmar o mesmo Pokémon no site; nenhuma coordenada copiada.");
                }else{
                    deliverCoords("",reason.isEmpty()?
                        "O site ainda não liberou Get coords; tente novamente mais tarde.":reason);
                }
            }
        });
    }
    // LT129: one optional, nonblocking inline action in the currently open
    // detail card. Silent long-press copies NEVER open a modal or steal game focus.
    private JSONObject offeredCapture;
    private int offeredGeneration=-1;
    private final java.util.Set<String> sharedCaptureKeys=new java.util.HashSet<>();
    private String captureKey(JSONObject item){
        return requestGeneration+"|"+item.optString("sourceIndex","")+"|"+
            item.optString("number","")+"|"+item.optString("name","")+"|"+
            item.optString("cp","")+"|"+item.optString("iv","");
    }
    private void offerCaptureAfterCopy(){
        // Copying still enables the capture-share affordance, but never posts.
        prepareCaptureShare(-1);
    }
    private void prepareCaptureShare(int sourceIndex){
        // An explicit tap on Capturei can prepare the currently selected card
        // without revealing coordinates or making additional API requests.
        if(stopped||loginPaused||selected<0||detailRoot==null||
           detailRoot.getVisibility()!=View.VISIBLE||!detailLoaded)return;
        try{
            JSONArray array=new JSONArray(results);
            if(selected>=array.length())return;
            JSONObject card=array.getJSONObject(selected);
            if(sourceIndex>=0&&card.optInt("sourceIndex",-1)!=sourceIndex){
                js(detailPanel,true,"window.captureShareAvailability(false,"+
                    JSONObject.quote("Resultado alterado; selecione o Pokémon novamente.")+")");
                return;
            }
            if(card.optString("name","").isEmpty()||!currentCoordinateTarget(card)||
               sharedCaptureKeys.contains(captureKey(card))){
                js(detailPanel,true,"window.captureShareAvailability(false,"+
                    JSONObject.quote("Esta captura não está disponível para compartilhar.")+")");
                return;
            }
            offeredCapture=new JSONObject(card.toString());
            offeredGeneration=requestGeneration;
            js(detailPanel,true,"window.offerCaptureShare("+card.optInt("sourceIndex",-1)+")");
        }catch(Exception e){
            recordFailure("preparar confirmação de captura",e);
            js(detailPanel,true,"window.captureShareAvailability(false,"+
               JSONObject.quote("Não foi possível preparar a captura.")+")");
        }
    }
    private void confirmCaptureShare(int sourceIndex){
        JSONObject offer=offeredCapture;
        if(offer==null||offeredGeneration!=requestGeneration||stopped||loginPaused||
           !currentCoordinateTarget(offer)||selected<0||
           detailRoot==null||detailRoot.getVisibility()!=View.VISIBLE||
           offer.optInt("sourceIndex",-99)!=sourceIndex)return;
        // No coordinates, location, Trainer ID or encounter data is posted.\n        // Only an existing trusted raw 0..15 IV tuple is included in visible text.
        String key=captureKey(offer);
        if(sharedCaptureKeys.contains(key))return;
        try{
            JSONArray now=new JSONArray(results);
            if(selected>=now.length()||
               now.getJSONObject(selected).optInt("sourceIndex",-1)!=sourceIndex){
                js(detailPanel,true,"window.captureShareFeedback(false,"+
                   JSONObject.quote("Resultado mudou. Abra o Pokémon novamente.")+")");
                return;
            }
        }catch(Exception ignored){return;}
        offeredCapture=null; // one in-flight submission per confirmed tap
        // Produce a public allowlisted text summary from the exact verified card.
        // The service retains the coordinates locally; publisher never uploads them.
        CaptureSharePublisher.publish(this,offer,
            (success,message)->handler.post(()->{
            if(stopped)return;
            if(success)sharedCaptureKeys.add(key);
            else if(selected>=0&&requestGeneration==offeredGeneration)
                offeredCapture=offer;
            if(selected>=0&&detailRoot!=null&&detailRoot.getVisibility()==View.VISIBLE
               &&requestGeneration==offeredGeneration)
                js(detailPanel,detailLoaded,"window.captureShareFeedback("+success+","+
                   JSONObject.quote(message)+")");
        }));
    }
    private void copyCoordinatesInternal(String value){
        String coords=extractCoordinates(value);
        ClipboardManager cb=(ClipboardManager)getSystemService(CLIPBOARD_SERVICE);
        if(cb!=null&&!coords.isEmpty()){
            cb.setPrimaryClip(ClipData.newPlainText("Pokémon coordinates",coords));
            offerCaptureAfterCopy();
        }
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
    // Clipboard may contain coordinates inside a maps link or formatted text.
    // Fail closed on two different coordinate pairs instead of choosing at random.
    private String extractClipboardCoordinates(String input){
        if(input==null||input.length()>512)return "";
        String exact=extractCoordinates(input.trim());
        if(!exact.isEmpty())return exact;
        java.util.regex.Matcher matches=java.util.regex.Pattern.compile(
            "(?<![0-9.])([-+]?\\d{1,2}(?:\\.\\d+)?)\\s*[,;]\\s*([-+]?\\d{1,3}(?:\\.\\d+)?)(?![0-9.])")
            .matcher(input.replace('−','-'));
        String found="";
        while(matches.find()){
            String candidate=extractCoordinates(matches.group());
            if(candidate.isEmpty())continue;
            if(!found.isEmpty()&&!found.equals(candidate))return "";
            found=candidate;
        }
        return found;
    }
    private long coordsAccountCheckedAt=0L;
    private void checkCoordsAccount(boolean force){
        if(stopped||loginPaused||detailPanel==null||!detailLoaded)return;
        long now=System.currentTimeMillis();
        if(!force&&now-coordsAccountCheckedAt<45_000L)return;
        coordsAccountCheckedAt=now;
        js(detailPanel,true,"window.coordsAccountUpdated({auth:'checking'})");
        if(authorizedApiCollector==null){
            authorizedApiCollector=new AuthorizedApiCollector(website,getAssets(),handler);
        }
        authorizedApiCollector.accountStatus(response->{
            if(stopped||loginPaused||!detailLoaded)return;
            String auth="unknown";
            if(response.optBoolean("ok",false)){
                String value=response.optString("auth","");
                if("authenticated".equals(value)||"login-required".equals(value))auth=value;
            }else if("rate-limited".equals(response.optString("reason")))auth="limited";
            js(detailPanel,true,"window.coordsAccountUpdated({auth:"+JSONObject.quote(auth)+"})");
        });
    }
    private void pushCoordsQuota(){pushCoordsQuota(null);}
    private void pushCoordsQuota(JSONObject liveQuota){
        js(detailPanel,detailLoaded,"window.coordsQuotaUpdated("+CoordsQuotaStore.snapshot(this,liveQuota).toString()+")");
    }
    private void deliverCoords(String coordinates,String message){
        js(detailPanel,detailLoaded,"window.coordsResult("+JSONObject.quote(coordinates)+","+JSONObject.quote(message)+")");
        pushCoordsQuota();
        status(message);
    }
    private void deliverCoordsRestricted(String kind,int reportedSeconds){
        // Only the matched provider denial or the API's explicit 429/VIP reason
        // may show this notice. Never emulate/retry around PoGoCoordinates limits.
        if(!"rate".equals(kind)&&!"quota".equals(kind))return;
        JSONObject evidence=new JSONObject();
        try{
            evidence.put("type",kind);
            evidence.put("retrySeconds",reportedSeconds>=1&&reportedSeconds<=86400?
                reportedSeconds:0);
        }catch(org.json.JSONException ignored){}
        String message="Taxa Limitada PoGoCoordinates";
        js(detailPanel,detailLoaded,"window.coordsResult(\"\","+
            JSONObject.quote(message)+","+evidence.toString()+")");
        pushCoordsQuota();
        status(message);
    }
    // The regular Favorites picker is not a #choices popup. Give it the same
    // originating icon coordinates while preserving its non-modal native dialog.
    private void showFavoritePicker(int anchorX,int anchorY){
        if(root==null||loginPaused||stopped)return;
        // Favorites is a separate non-modal Dialog, not a WebView #choices.
        // A second tap on its very same toolbar icon must dismiss it.
        if(pickerOpen){
            if(favoritePickerDialog!=null)favoritePickerDialog.dismiss();
            return;
        }
        closeIndependentPopup();
        pickerOpen=true;
        hideDetails();
        try{
            favoritePickerDialog=PokemonPicker.show(OverlayService.this,()->{
                if(!stopped)update();
            },()->{
                pickerOpen=false;favoritePickerDialog=null;
                if(!stopped)update();
            },anchorX,anchorY,
                menuParams==null?-1:menuParams.y+dp(Math.max(0,popupOffsetDp)),
                menuParams==null?-1:menuParams.y+dp(Math.max(0,popupOffsetDp))+dp(visualMenuBaseDp()));
            // Empty catalog: no dialog was created, so don't leave pickerOpen stuck.
            if(favoritePickerDialog==null)pickerOpen=false;
        }catch(Exception e){
            pickerOpen=false;favoritePickerDialog=null;
            diagnosticError("Não foi possível abrir favoritos no overlay.");
        }
    }
    public class Bridge{
        // The result list and detail card run in separate Android WebViews. On
        // some devices their file:// image load fails even though the bundled
        // sprite exists. Only an exact Dex-verified base (normal or shiny) may
        // call this read-only bridge. No network, storage path or credentials.
        @JavascriptInterface public String bundledBaseSprite(int dex,boolean shiny){
            if(dex<1||dex>1025)return "";
            return readBundledPng("pokemon-sprites/"+
                (shiny?"shiny/":"base/")+dex+".png");
        }
        @JavascriptInterface public String bundledExactSprite(String relative){
            // A known exact costume/form image, never a supplied remote URL or
            // general file path. Both overlay services share the same assets.
            if(relative==null||relative.contains("..")||
               !relative.matches("(?:forms|costumes)/[A-Za-z0-9_.-]{4,140}\\.png"))
                return "";
            return readBundledPng("pokemon-sprites/"+relative);
        }
        private String readBundledPng(String file){
            try(InputStream stream=OtaAssets.open(OverlayService.this,file);
                ByteArrayOutputStream buffer=new ByteArrayOutputStream()){
                byte[] chunk=new byte[4096];int count;
                while((count=stream.read(chunk))!=-1){
                    if(buffer.size()+count>128*1024)return "";
                    buffer.write(chunk,0,count);
                }
                byte[] png=buffer.toByteArray();
                if(png.length<30||png[0]!=(byte)0x89||png[1]!=0x50||
                   png[2]!=0x4e||png[3]!=0x47)return "";
                return "data:image/png;base64,"+
                    android.util.Base64.encodeToString(png,android.util.Base64.NO_WRAP);
            }catch(Exception ignored){return "";}
        }
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
            if(clipboard!=null){
                clipboard.setPrimaryClip(ClipData.newPlainText("Coordenadas Pokémon",valid));
                js(detailPanel,detailLoaded,"window.copyFeedback("+JSONObject.quote("✓ Copiado!")+ ")");
                offerCaptureAfterCopy();
            }
        });}

        @JavascriptInterface public void prepareCaptureShare(int sourceIndex){
            handler.post(()->OverlayService.this.prepareCaptureShare(sourceIndex));
        }
        @JavascriptInterface public void confirmCaptureShare(int sourceIndex){
            handler.post(()->OverlayService.this.confirmCaptureShare(sourceIndex));
        }
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
                // Clicking ✓ is an explicit retry even with UNCHANGED coords.
                // A local nextScheduledSearchAtMs must not permanently block
                // Apply after a failed attempt. refresh(true) already enforces
                // the real HTTP 429 / Retry-After gate and the in-flight lock.
                if(!searchInProgress){
                    status(enabled?"📍 Revalidando coordenadas e raio...":
                        "📍 Revalidando busca geral...");
                    OverlayService.this.refresh(true);
                }else{
                    queuedManualRefresh=true;
                    status("⌛ Busca atual em andamento; nova tentativa de localização em seguida.");
                    update();
                }
                return;
            }
            locationVerified=false;
            locationEnabled=enabled;
            locationCoords=enabled?valid:"";
            locationRadius=enabled?radius:0;
            android.content.SharedPreferences.Editor prefs=overlayPrefs().edit();
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
        // LT91-A: local-only named hunt locations, no physical GPS or API call
        // when saving. Applying always uses the existing validated setLocation.
        private String savedLocationKey(int slot){return "savedSearchLocationV1_"+slot;}
        @JavascriptInterface public void requestSavedSearchLocations(){handler.post(()->{
            JSONArray slots=new JSONArray();
            android.content.SharedPreferences p=overlayPrefs();
            int active=p.getInt("savedSearchLocationActiveV1",0);
            for(int slot=1;slot<=3;slot++){
                JSONObject item=new JSONObject();
                try{
                    JSONObject stored=new JSONObject(p.getString(savedLocationKey(slot),"{}"));
                    item.put("slot",slot)
                        .put("saved",stored.has("coords")&&stored.has("radius"))
                        .put("name",stored.optString("name","Local "+slot))
                        .put("active",slot==active&&locationEnabled&&
                            locationCoords.equals(stored.optString("coords",""))&&
                            locationRadius==stored.optInt("radius",-1));
                }catch(org.json.JSONException ignored){
                    try{item.put("slot",slot).put("saved",false)
                        .put("name","Local "+slot);}catch(org.json.JSONException ignoredAgain){}
                }
                slots.put(item);
            }
            String script="window.onSavedSearchLocations&&window.onSavedSearchLocations("+slots.toString()+")";
            js(menuPanel,menuLoaded,script);js(popupPanel,popupLoaded,script);
        });}
        @JavascriptInterface public void saveSearchLocation(int slot,String label,String coords,int radius){handler.post(()->{
            if(stopped||slot<1||slot>3||radius<0||radius>1000)return;
            String clean=extractCoordinates(coords==null?"":coords);
            if(clean.isEmpty())return;
            String name=label==null?"":label.trim().replaceAll("[\\r\\n\\t<>]"," ");
            if(name.isEmpty())name="Local "+slot;
            if(name.length()>30)return;
            try{
                JSONObject data=new JSONObject();
                data.put("name",name).put("coords",clean).put("radius",radius);
                overlayPrefs().edit()
                    .putString(savedLocationKey(slot),data.toString())
                    .putInt("savedSearchLocationActiveV1",slot).apply();
                requestSavedSearchLocations();
                android.widget.Toast.makeText(OverlayService.this,
                    "✓ Local "+slot+" salvo",android.widget.Toast.LENGTH_SHORT).show();
            }catch(org.json.JSONException ignored){}
        });}
        @JavascriptInterface public void loadSearchLocation(int slot){handler.post(()->{
            if(stopped||slot<1||slot>3)return;
            try{
                JSONObject saved=new JSONObject(overlayPrefs()
                    .getString(savedLocationKey(slot),"{}"));
                String coords=extractCoordinates(saved.optString("coords",""));
                int radius=saved.optInt("radius",-1);
                if(coords.isEmpty()||radius<0||radius>1000)return;
                overlayPrefs().edit()
                    .putInt("savedSearchLocationActiveV1",slot).apply();
                new Bridge().setLocation(true,coords,radius);
                requestSavedSearchLocations();
            }catch(org.json.JSONException ignored){}
        });}
        @JavascriptInterface public void deleteSavedSearchLocation(int slot){handler.post(()->{
            if(stopped||slot<1||slot>3)return;
            android.content.SharedPreferences prefs=overlayPrefs();
            android.content.SharedPreferences.Editor edit=prefs.edit().remove(savedLocationKey(slot));
            if(prefs.getInt("savedSearchLocationActiveV1",0)==slot)
                edit.putInt("savedSearchLocationActiveV1",0);
            edit.apply();
            requestSavedSearchLocations();
            android.widget.Toast.makeText(OverlayService.this,
                "Local "+slot+" excluído",android.widget.Toast.LENGTH_SHORT).show();
        });}
        @JavascriptInterface public void pasteLocationCoords(){handler.post(()->{
            if(stopped)return;
            // Android 10+ restricts clipboard reads to the focused app/IME.
            // The menu overlay is normally FLAG_NOT_FOCUSABLE. Focus only after
            // the explicit Colar tap, then read once after WindowManager updates.
            OverlayService.this.locationEditor(true);
            WebView editor=!popupKind.isEmpty()&&popupPanel!=null?popupPanel:menuPanel;
            if(editor!=null)editor.requestFocus();
            handler.postDelayed(()->{
                if(stopped)return;
                String parsed="",reason="unavailable";
                try{
                    ClipboardManager cb=(ClipboardManager)getSystemService(CLIPBOARD_SERVICE);
                    android.content.ClipData clip=cb==null?null:cb.getPrimaryClip();
                    if(clip!=null&&clip.getItemCount()>0){
                        reason="invalid";
                        boolean conflict=false;
                        for(int i=0;i<Math.min(clip.getItemCount(),5);i++){
                            CharSequence value=clip.getItemAt(i).coerceToText(OverlayService.this);
                            String candidate=extractClipboardCoordinates(value==null?"":value.toString());
                            if(candidate.isEmpty())continue;
                            if(!parsed.isEmpty()&&!parsed.equals(candidate)){conflict=true;break;}
                            parsed=candidate;
                        }
                        if(conflict){parsed="";reason="ambiguous";}
                    }
                }catch(SecurityException denied){
                    reason="unavailable"; // OS restriction, not a bad coordinate
                }catch(Exception e){reason="unavailable";recordFailure("colar coordenadas",e);}
                // No clipboard contents are logged, saved or sent to the API.
                String callback="window.onLocationPaste&&window.onLocationPaste("+
                    JSONObject.quote(parsed)+","+JSONObject.quote(reason)+")";
                js(menuPanel,menuLoaded,callback);
                js(popupPanel,popupLoaded,callback);
            },180L);
        });}
        @JavascriptInterface public void copyLocationCoords(String input){handler.post(()->{
            String valid=extractCoordinates(input==null?"":input.trim());
            String message="⚠ Informe coordenadas válidas para copiar";
            if(!valid.isEmpty())try{
                ClipboardManager clipboard=(ClipboardManager)getSystemService(CLIPBOARD_SERVICE);
                if(clipboard!=null){
                    clipboard.setPrimaryClip(ClipData.newPlainText("Coordenadas PokeSearch",valid));
                    message="✓ Coordenadas copiadas";
                }
            }catch(Exception e){recordFailure("copiar localização",e);}
            String callback="window.onLocationCopy&&window.onLocationCopy("+JSONObject.quote(message)+")";
            js(menuPanel,menuLoaded,callback);js(popupPanel,popupLoaded,callback);
        });}
        @JavascriptInterface public void locationEditor(boolean open){handler.post(()->OverlayService.this.locationEditor(open));}
        @JavascriptInterface public void requestFilterOptions(){handler.post(()->{
            if(stopped||loginPaused||!menuExpanded)return;
            if(authorizedApiQaSelected()){
                // API is the primary source. Official contract values are
                // immediately available; do not click React dropdowns.
                try{
                    JSONObject fields=new JSONObject();
                    String[] keys={"sortBy","weather","size","gender"};
                    String[][] values={
                        {"Despawn (longest)","CP (highest)","IV % (highest)",
                            "Level (highest)","Distance (nearest)"},
                        {"Any","Boosted","Sunny","Rainy","Partly Cloudy","Cloudy",
                            "Windy","Snow","Fog"},
                        {"XXS","XS","S","M","L","XL","XXL"},
                        {"Male","Female","Genderless"}
                    };
                    for(int i=0;i<keys.length;i++){
                        JSONObject field=new JSONObject();
                        field.put("present",true).put("options",new JSONArray(values[i]));
                        fields.put(keys[i],field);
                    }
                    JSONObject payload=new JSONObject();
                    payload.put("ok",true).put("partial",true).put("options",fields);
                    js(menuPanel,menuLoaded,"window.onFilterOptions("+payload.toString()+")");
                    js(popupPanel,popupLoaded,"window.onFilterOptions("+payload.toString()+")");
                }catch(org.json.JSONException ignored){}
                // Preload official API forms for the checkbox-style Forma picker.
                // Reuse the existing 300-second catalogue cache; no React DOM.
                if(authorizedApiCollector==null)
                    authorizedApiCollector=new AuthorizedApiCollector(website,getAssets(),handler);
                final int searchGeneration=requestGeneration;
                authorizedApiCollector.forms("",formResponse->{
                    if(stopped||loginPaused||searchGeneration!=requestGeneration||
                        !menuExpanded)return;
                    try{formResponse.put("key","form").put("query","");}
                    catch(org.json.JSONException ignored){}
                    js(menuPanel,menuLoaded,"window.onFormOptions("+formResponse.toString()+")");
                    js(popupPanel,popupLoaded,"window.onFormOptions("+formResponse.toString()+")");
                });
                return;
            }
            requestFilterOptionsLater(0);
        });}
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
            js(popupPanel,popupLoaded,"window.onFilterOptions("+found.toString()+")");
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
            js(popupPanel,popupLoaded,"window.onFilterOptions("+message.toString()+")");
                    }
                    execute("closeFilterOptions:"+key,closed->discoverFilterMenu(position+1,generation));
                }),"form".equals(key)?500L:210L);
            });
        }
        private int formOptionsSequence=0;
        @JavascriptInterface public void requestFormOptions(String query){handler.post(()->{
            if(stopped||loginPaused||(!authorizedApiQaSelected()&&searchInProgress)||
                !menuExpanded||!menuLoaded)return;
            String wanted=query==null?"":query.trim();
            if(wanted.length()>70)return;
            int generation=requestGeneration,sequence=++formOptionsSequence;
            if(authorizedApiQaSelected()){
                if(authorizedApiCollector==null)
                    authorizedApiCollector=new AuthorizedApiCollector(website,getAssets(),handler);
                authorizedApiCollector.forms(wanted,response->{
                    if(stopped||loginPaused||generation!=requestGeneration||
                        sequence!=formOptionsSequence||!menuExpanded)return;
                    try{
                        response.put("key","form").put("query",wanted);
                        if(!response.optBoolean("ok",false))response.put("pending",false);
                    }catch(org.json.JSONException ignored){}
                    js(menuPanel,menuLoaded,"window.onFormOptions("+response.toString()+")");
                    js(popupPanel,popupLoaded,"window.onFormOptions("+response.toString()+")");
                });
                return;
            }
            requestFormOptionsLater(wanted,generation,sequence,0);
        });}
        private void requestFormOptionsLater(String query,int generation,int sequence,int attempt){
            if(stopped||loginPaused||searchInProgress||!menuExpanded||
               generation!=requestGeneration||sequence!=formOptionsSequence)return;
            execute("searchFormOptions:"+JSONObject.quote(query),result->{
                if(stopped||generation!=requestGeneration||sequence!=formOptionsSequence||
                   menuPanel==null||!menuLoaded)return;
                if(result.optBoolean("pending",false)&&attempt<15){
                    handler.postDelayed(()->requestFormOptionsLater(query,generation,sequence,attempt+1),300L);
                    return;
                }
                try{
                    result.put("key","form").put("query",query);
                    if(result.optBoolean("pending",false)){
                        result.put("pending",false).put("ok",false)
                            .put("reason","Form não foi confirmado no site; tente novamente.");
                    }
                }catch(org.json.JSONException ignored){}
                js(menuPanel,true,"window.onFormOptions("+result.toString()+")");
            js(popupPanel,popupLoaded,"window.onFormOptions("+result.toString()+")");
            });
        }
        private int pokemonSuggestionSequence=0;
        @JavascriptInterface public void cancelPokemonSuggestions(){handler.post(()->++pokemonSuggestionSequence);}
        @JavascriptInterface public void requestPokemonSuggestions(String query){handler.post(()->{
            if(stopped||loginPaused||!menuExpanded||menuPanel==null||!menuLoaded)return;
            // API catalogue and choices are read-only, independent of an
            // active POST /search. Only the DOM picker must wait for React.
            if(searchInProgress&&!authorizedApiQaSelected()){
                js(menuPanel,true,"window.onPokemonSuggestions({ok:false,reason:'Aguarde a busca atual terminar'})");
            js(popupPanel,popupLoaded,"window.onPokemonSuggestions({ok:false,reason:'Aguarde a busca atual terminar'})");
                return;
            }
            final String wanted=query==null?"":query.trim();
            if(wanted.length()>65)return;
            final int generation=requestGeneration;
            final int sequence=++pokemonSuggestionSequence;
            if(authorizedApiQaSelected()){
                if(authorizedApiCollector==null)
                    authorizedApiCollector=new AuthorizedApiCollector(website,getAssets(),handler);
                authorizedApiCollector.suggest(wanted,response->{
                    if(stopped||loginPaused||generation!=requestGeneration||
                       sequence!=pokemonSuggestionSequence||!menuExpanded||!menuLoaded)return;
                    try{
                        response.put("query",wanted);
                        if(!response.optBoolean("ok",false)){
                            response.put("state","failed").put("pending",false);
                            response.put("reason","Catálogo da API indisponível ("+
                                response.optString("reason","erro")+"). Selecione DOM nas configurações.");
                        }
                    }catch(org.json.JSONException ignored){}
                    js(menuPanel,menuLoaded,"window.onPokemonSuggestions("+response.toString()+")");
                    js(popupPanel,popupLoaded,"window.onPokemonSuggestions("+response.toString()+")");
                });
                return;
            }
            requestPokemonSuggestionsLater(wanted,generation,sequence,0);
        });}
        private void requestPokemonSuggestionsLater(String query,int generation,int sequence,int attempt){
            if(stopped||loginPaused||searchInProgress||generation!=requestGeneration||
                sequence!=pokemonSuggestionSequence||!menuExpanded)return;
            execute("pokemonSuggest:"+JSONObject.quote(query),response->{
                if(stopped||generation!=requestGeneration||sequence!=pokemonSuggestionSequence||
                    menuPanel==null||!menuLoaded)return;
                if(response.optBoolean("pending",false)&&attempt<20){
                    handler.postDelayed(()->requestPokemonSuggestionsLater(query,generation,sequence,attempt+1),300L);
                    return;
                }
                // Timeout means FAILED, never 'none found'. Only the linked
                // live Pokémon portal may explicitly prove an empty search.
                try{
                    response.put("query",query);
                    if(response.optBoolean("pending",false)){
                        response.put("ok",false).put("pending",false).put("state","failed");
                        response.put("reason","Tempo esgotado aguardando opções oficiais do site. Tente novamente.");
                    }
                }catch(org.json.JSONException ignored){}
                js(menuPanel,true,"window.onPokemonSuggestions("+response.toString()+")");
            js(popupPanel,popupLoaded,"window.onPokemonSuggestions("+response.toString()+")");
            });
        }
        // LT57 single-form bridge: menus submit a DELTA, not a stale copy of
        // all search settings. Pokémon, Raw IV, Shiny and Location are untouched.
        // Three opt-in general presets. Only search-mode/form fields are stored:
        // Location, Shiny and existing favorite/notification preferences remain
        // independent so loading a preset cannot silently change those controls.
        private String generalPresetKey(int slot){return "generalFilterPresetV1_"+slot;}
        private String generalPresetNameKey(int slot){return "generalPresetNameV1_"+slot;}
        @JavascriptInterface public void requestGeneralFilterPresets(){handler.post(()->{
            android.content.SharedPreferences p=overlayPrefs();
            JSONArray available=new JSONArray(),names=new JSONArray();
            for(int slot=1;slot<=3;slot++){
                available.put(p.contains(generalPresetKey(slot)));
                names.put(p.getString(generalPresetNameKey(slot),"Perfil "+slot));
            }
            JSONObject status=new JSONObject();
            try{status.put("saved",available).put("names",names)
                .put("active",p.getInt("generalPresetActiveV1",0));}
            catch(org.json.JSONException ignored){}
            String script="window.onGeneralPresetStatus&&window.onGeneralPresetStatus("+status.toString()+")";
            js(menuPanel,menuLoaded,script);
            js(popupPanel,popupLoaded,script);
        });}
        @JavascriptInterface public void renameGeneralFilterPreset(int slot,String requested){handler.post(()->{
            if(slot<1||slot>3||stopped||requested==null)return;
            String clean=requested.trim().replaceAll("[\\r\\n\\t<>]"," ");
            clean=clean.replaceAll(" +"," ");
            if(clean.isEmpty()||clean.length()>20)return;
            overlayPrefs().edit()
                .putString(generalPresetNameKey(slot),clean).apply();
            requestGeneralFilterPresets();
        });}
        @JavascriptInterface public void saveGeneralFilterPreset(int slot){handler.post(()->{
            if(slot<1||slot>3||stopped)return;
            try{
                JSONObject snapshot=new JSONObject(filterConfigJson());
                snapshot.put("mode",mode);
                String value=snapshot.toString();
                if(value.length()>16000)return;
                overlayPrefs().edit()
                    .putString(generalPresetKey(slot),value)
                    .putInt("generalPresetActiveV1",slot).apply();
                android.widget.Toast.makeText(OverlayService.this,
                    "✓ Filtro geral "+slot+" salvo",android.widget.Toast.LENGTH_SHORT).show();
                requestGeneralFilterPresets();
            }catch(org.json.JSONException ignored){}
        });}
        @JavascriptInterface public void deleteGeneralFilterPreset(int slot){handler.post(()->{
            if(stopped||slot<1||slot>3)return;
            android.content.SharedPreferences p=overlayPrefs();
            android.content.SharedPreferences.Editor edit=p.edit().remove(generalPresetKey(slot));
            if(p.getInt("generalPresetActiveV1",0)==slot)
                edit.putInt("generalPresetActiveV1",0);
            edit.apply();
            requestGeneralFilterPresets();
            android.widget.Toast.makeText(OverlayService.this,
                "Filtro "+slot+" excluído",android.widget.Toast.LENGTH_SHORT).show();
        });}
        @JavascriptInterface public void clearGeneralFilterPreset(){handler.post(()->{
            if(stopped)return;
            // "Padrão" clears the optional search fields without changing
            // the user's Shiny, location, sound, Favorites or mode preferences.
            try{
                JSONObject reset=new JSONObject(filterConfigJson());
                // A neutral search uses IV% 0..100 (no IV restriction). It
                // avoids implicitly retaining a prior 15/15/15 or GL rank.
                reset.put("mode","percent");
                reset.put("percentMin",0).put("percentMax",100);
                for(String key:new String[]{"pokemon","sortBy","weather","size","gender",
                    "form","cpMin","cpMax","levelMin","levelMax","minPvpCp"})
                    reset.put(key,"");
                for(String key:new String[]{"sizeSelections","genderSelections",
                    "formSelections","pokemonSelections"})
                    reset.put(key,new JSONArray());
                reset.put("clearPokemonSelection",true);
                reset.put("includePreviousEvolutions",true);
                overlayPrefs().edit().putInt("generalPresetActiveV1",0).apply();
                new Bridge().setSearchConfig(reset.toString());
                requestGeneralFilterPresets();
            }catch(org.json.JSONException ignored){}
        });}
        @JavascriptInterface public void loadGeneralFilterPreset(int slot){handler.post(()->{
            if(slot<1||slot>3||stopped)return;
            String value=overlayPrefs().getString(generalPresetKey(slot),"");
            if(value.length()<10||value.length()>16000)return;
            try{
                JSONObject snapshot=new JSONObject(value);
                String presetMode=snapshot.optString("mode","");
                if(!("raw".equals(presetMode)||"percent".equals(presetMode)||
                     "gl".equals(presetMode)||"ul".equals(presetMode)))return;
                // Use the existing validated, atomic setSearchConfig pathway
                // instead of introducing a second filter-submission mechanism.
                overlayPrefs().edit().putInt("generalPresetActiveV1",slot).apply();
                new Bridge().setSearchConfig(value);
                requestGeneralFilterPresets();
                android.widget.Toast.makeText(OverlayService.this,
                    "✓ Carregando filtro geral "+slot,
                    android.widget.Toast.LENGTH_SHORT).show();
            }catch(org.json.JSONException ignored){}
        });}
        @JavascriptInterface public void filterDistanceNotice(){handler.post(()->{
            android.widget.Toast.makeText(OverlayService.this,
                "Ordenar por distância exige coordenadas e raio ativos. Outros filtros continuam disponíveis.",
                android.widget.Toast.LENGTH_LONG).show();
        });}
        @JavascriptInterface public void patchSearchFilters(String payload){handler.post(()->{
            try{
                JSONObject delta=new JSONObject(payload),updated=new JSONObject(extraFiltersJson);
                java.util.HashSet<String> allowed=new java.util.HashSet<>(java.util.Arrays.asList(
                    "sortBy","weather","size","form","gender","cpMin","cpMax",
                    "levelMin","levelMax","minPvpCp","sizeSelections","genderSelections","formSelections",
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
                    if(key.equals("sizeSelections")||key.equals("genderSelections")||
                       key.equals("formSelections")){
                        org.json.JSONArray input=delta.optJSONArray(key);
                        if(input==null||input.length()>(key.equals("genderSelections")?1:
                            key.equals("formSelections")?500:7))return;
                        org.json.JSONArray cleaned=new org.json.JSONArray();
                        java.util.HashSet<String> unique=new java.util.HashSet<>();
                        for(int i=0;i<input.length();i++){
                            String value=input.optString(i,"").trim();
                            if(value.length()>(key.equals("formSelections")?100:30)||value.matches("(?s).*[<>\\r\\n].*"))return;
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
                // Defensive guard for migrations/older menus: a stale
                // Distance order with location OFF cannot block unrelated
                // Gender/Size/Weather/PC edits from reaching the API.
                if("Distance (nearest)".equals(updated.optString("sortBy"))&&
                        !(locationEnabled&&locationVerified)){
                    updated.put("sortBy","Despawn (longest)");
                    clears.remove("sortBy");
                    android.widget.Toast.makeText(OverlayService.this,
                        "Sem localização ativa: ordenação padrão aplicada; demais filtros mantidos.",
                        android.widget.Toast.LENGTH_SHORT).show();
                }
                org.json.JSONArray clear=new org.json.JSONArray();
                for(String key:clears)clear.put(key);
                updated.put("clearExtraKeys",clear);
                String serialized=updated.toString();
                if(extraFiltersJson.equals(serialized)){
                    OverlayService.this.refresh(true);return;
                }
                extraFiltersJson=serialized;
                overlayPrefs().edit().putString("extraFiltersJson",serialized).apply();
                replaceActiveFilterSearch(); // Preserve shiny, mode, Pokémon, coords.
                resultsStale=count()>0;
                status("Filtro atualizado • pesquisando com os demais campos preservados");
                scheduleFilterChangeRefresh();
            }catch(org.json.JSONException ex){
                status("Filtro inválido; nenhuma configuração foi alterada.");
            }
        });}
        // Pause only this Pokéball's species/form criterion. Do not delete saved chips.
        @JavascriptInterface public void setPokemonFilterEnabled(boolean enabled){handler.post(()->{
            if(stopped)return;
            try{
                JSONObject extra=new JSONObject(extraFiltersJson);
                if(extra.optBoolean("pokemonFilterEnabled",true)==enabled)return;
                org.json.JSONArray saved=extra.optJSONArray("pokemonSavedSelections");
                if(saved==null)saved=extra.optJSONArray("pokemonSelections");
                if(saved==null)saved=new org.json.JSONArray();
                org.json.JSONArray previouslyActive=extra.optJSONArray("pokemonSelections");
                java.util.LinkedHashSet<String> clears=new java.util.LinkedHashSet<>();
                org.json.JSONArray previousClears=extra.optJSONArray("clearExtraKeys");
                if(previousClears!=null)for(int i=0;i<previousClears.length();i++)
                    clears.add(previousClears.optString(i));
                if(!enabled&&((previouslyActive!=null&&previouslyActive.length()>0)||saved.length()>0))
                    clears.add("pokemonSelections"); // Clears an active website selection as well.
                if(enabled&&saved.length()>0)clears.remove("pokemonSelections");
                extra.put("pokemonFilterEnabled",enabled);
                extra.put("pokemonSavedSelections",new org.json.JSONArray(saved.toString()));
                extra.put("pokemonSelections",enabled?
                    new org.json.JSONArray(saved.toString()):new org.json.JSONArray());
                extra.put("pokemon","");
                org.json.JSONArray resets=new org.json.JSONArray();
                for(String key:clears)if(!key.isEmpty())resets.put(key);
                extra.put("clearExtraKeys",resets);
                extraFiltersJson=extra.toString();
                overlayPrefs().edit().putString("extraFiltersJson",extraFiltersJson).apply();
                replaceActiveFilterSearch();
                resultsStale=count()>0;
                hideDetails();
                status(enabled?"Filtro Pokémon reativado • "+saved.length()+" selecionados":
                    "Filtro Pokémon pausado • seleção preservada");
                scheduleFilterChangeRefresh();
            }catch(org.json.JSONException error){
                status("Não foi possível alternar o filtro Pokémon.");
            }
        });}
        // LT64-FILTER-DELTA: Pokémon/form selections never replace other filters.
        @JavascriptInterface public void setPokemonSelections(String payload){handler.post(()->{
            try{
                JSONObject request=new JSONObject(payload);
                org.json.JSONArray values=request.getJSONArray("selections");
                if(values.length()>50)return;
                JSONObject extra=new JSONObject(extraFiltersJson);
                org.json.JSONArray previous=extra.optJSONArray("pokemonSelections");
                org.json.JSONArray cleaned=new org.json.JSONArray();
                java.util.HashSet<String> unique=new java.util.HashSet<>();
                for(int i=0;i<values.length();i++){
                    String label=values.optString(i,"").trim();
                    if(label.isEmpty()||label.length()>90||label.matches("(?s).*[<>\\r\\n].*"))return;
                    if(unique.add(label.toLowerCase(java.util.Locale.ROOT)))cleaned.put(label);
                }
                java.util.LinkedHashSet<String> clears=new java.util.LinkedHashSet<>();
                org.json.JSONArray oldClears=extra.optJSONArray("clearExtraKeys");
                if(oldClears!=null)for(int i=0;i<oldClears.length();i++)
                    clears.add(oldClears.optString(i));
                boolean enabled=extra.optBoolean("pokemonFilterEnabled",true);
                org.json.JSONArray oldSaved=extra.optJSONArray("pokemonSavedSelections");
                if(cleaned.length()==0&&(request.optBoolean("clear",false)||
                    (previous!=null&&previous.length()>0)||
                    (oldSaved!=null&&oldSaved.length()>0)||
                    !extra.optString("pokemon","").isEmpty()))
                    clears.add("pokemonSelections");
                if(cleaned.length()>0&&enabled)clears.remove("pokemonSelections");
                extra.put("pokemonFilterEnabled",enabled);
                extra.put("pokemonSavedSelections",cleaned);
                extra.put("pokemonSelections",enabled?cleaned:new org.json.JSONArray());
                extra.put("pokemon","");
                org.json.JSONArray reset=new org.json.JSONArray();
                for(String key:clears)if(!key.isEmpty())reset.put(key);
                extra.put("clearExtraKeys",reset);
                String next=extra.toString();
                if(extraFiltersJson.equals(next)){OverlayService.this.refresh(true);return;}
                extraFiltersJson=next;
                overlayPrefs().edit().putString("extraFiltersJson",next).apply();
                replaceActiveFilterSearch();
                resultsStale=count()>0;
                hideDetails();
                status("Espécies/formas solicitadas · aguardando confirmação no site; demais filtros preservados");
                scheduleFilterChangeRefresh();
            }catch(org.json.JSONException ex){
                status("Seleção Pokémon inválida · filtros anteriores preservados.");
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
                    !within(min,0,100)||!within(max,0,100)||min>max)return;
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
                for(String key:new String[]{"size","gender","form"}){
                    String plural=key+"Selections";
                    org.json.JSONArray requested=input.optJSONArray(plural);
                    if(requested==null)requested=previousMulti.optJSONArray(plural);
                    org.json.JSONArray allowed=new org.json.JSONArray();
                    java.util.HashSet<String> seen=new java.util.HashSet<>();
                    if(requested!=null){
                        if(requested.length()>(key.equals("form")?500:7))return;
                        for(int i=0;i<requested.length();i++){
                            String value=requested.optString(i,"").trim();
                            if(value.length()>(key.equals("form")?100:30)||value.matches("(?s).*[<>\\r\\n].*"))return;
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
                // Mode changes must not delete paused species/form selections.
                // This flag is controlled by the standalone switch only.
                // A stale mode dialog/preset must not reactivate it by accident.
                boolean pokemonEnabled=previousMulti.optBoolean("pokemonFilterEnabled",true);
                org.json.JSONArray remembered=previousMulti.optJSONArray("pokemonSavedSelections");
                if(remembered==null)remembered=previousMulti.optJSONArray("pokemonSelections");
                // Old installs have an active list but no saved-list key.
                // Native persisted state wins over a stale mode dialog snapshot.
                org.json.JSONArray fromUi=input.optJSONArray("pokemonSavedSelections");
                if(remembered==null)remembered=fromUi;
                if(remembered==null)remembered=input.optJSONArray("pokemonSelections");
                if(remembered==null)remembered=new org.json.JSONArray();
                if(remembered.length()==0){
                    String legacy=previousMulti.optString("pokemon","").trim();
                    if(legacy.isEmpty())legacy=input.optString("pokemon","").trim();
                    if(!legacy.isEmpty())remembered.put(legacy);
                }
                if(input.optBoolean("clearPokemonSelection",false))remembered=new org.json.JSONArray();
                if(remembered==null||remembered.length()>50)return;
                org.json.JSONArray validatedSaved=new org.json.JSONArray();
                java.util.HashSet<String> seenSaved=new java.util.HashSet<>();
                for(int i=0;i<remembered.length();i++){
                    String label=remembered.optString(i,"").trim();
                    if(label.isEmpty()||label.length()>90||label.matches("(?s).*[<>\\r\\n].*"))return;
                    if(seenSaved.add(label.toLowerCase(java.util.Locale.ROOT)))
                        validatedSaved.put(label);
                }
                extra.put("pokemonFilterEnabled",pokemonEnabled);
                extra.put("pokemonSavedSelections",validatedSaved);
                extra.put("pokemonSelections",pokemonEnabled?
                    new org.json.JSONArray(validatedSaved.toString()):new org.json.JSONArray());
                extra.put("pokemon","");
                if(extra.optString("sortBy","").isEmpty())extra.put("sortBy","Despawn (longest)");
                for(String[] pair:new String[][]{{"cpMin","cpMax"},{"levelMin","levelMax"}}){
                    String low=extra.optString(pair[0]),high=extra.optString(pair[1]);
                    if(!low.isEmpty()&&!high.isEmpty()&&Double.parseDouble(low)>Double.parseDouble(high))return;
                }
                // Clear a previously selected site restriction only when the
                // user explicitly switches it back to Any. Ordinary blank
                // options must never block Raw IV or GL/UL searches.
                JSONObject previousExtra=new JSONObject(extraFiltersJson);
                // A general preset must not delete exclusions from existing users.
                for(String preservedKey:new String[]{"blacklistPokemonIds",
                    "blacklistSpeciesForms","blacklistForms"}){
                    if(previousExtra.has(preservedKey))
                        extra.put(preservedKey,previousExtra.get(preservedKey));
                }
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
                for(String key:new String[]{"sizeSelections","genderSelections","formSelections"}){
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
                overlayPrefs().edit()
                    .putString("mode",mode).putInt("rawAttack",a).putInt("rawDefense",d)
                    .putInt("rawStamina",st).putInt("glRank",gl).putInt("ulRank",ul)
                    .putInt("ivPercentMin",min).putInt("ivPercentMax",max)
                    .putString("extraFiltersJson",extraFiltersJson).apply();
                replaceActiveFilterSearch();
                // Preserve authenticated Shiny preference; reverify it after location when searching.
                // Keep site-confirmed cards with their original mode/icon
                // until the new search passes all checks and returns valid cards.
                boolean preview=restoreMatchingFilterPreview();
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
            android.content.SharedPreferences.Editor changed=overlayPrefs().edit().putString("mode",selected);
            if(s.equals("iv"))changed.putInt("rawAttack",15).putInt("rawDefense",15).putInt("rawStamina",15);
            changed.apply();
            android.widget.Toast.makeText(OverlayService.this,
                "Filtro selecionado: "+(s.equals("iv")?"Raw IV 15/15/15":s.equals("raw")?"Raw IV":s.equals("percent")?"% IV":s.equals("gl")?"Grande Liga":"Ultra Liga"),
                android.widget.Toast.LENGTH_SHORT).show();
            replaceActiveFilterSearch();shinyVerified=false;
            boolean preview=restoreMatchingFilterPreview();
            hideDetails();
            status(preview?"Prévia anterior do filtro · aguardando nova consulta":"Filtro selecionado · aguardando consulta");
            scheduleFilterChangeRefresh();
        });}
        @JavascriptInterface public void menu(boolean open){handler.post(()->OverlayService.this.menu(open));}
        @JavascriptInterface public void cycleMode(){handler.post(()->{
            mode=mode.equals("raw")?"percent":mode.equals("percent")?"gl":mode.equals("gl")?"ul":"raw";
            overlayPrefs().edit().putString("mode",mode).apply();
            replaceActiveFilterSearch();shinyVerified=false;
            boolean preview=restoreMatchingFilterPreview();
            hideDetails();
            status(preview?"Prévia anterior do filtro · aguardando nova consulta":"Filtro selecionado · aguardando consulta");
            scheduleFilterChangeRefresh();
        });}
        private void applySpriteSize(int size){
            if(size!=35&&size!=45&&size!=55)return;
            if(size==spriteSize){update();return;}
            spriteSize=size;
            overlayPrefs().edit().putInt("spriteSize",size).apply();
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
            overlayPrefs().edit().putBoolean("showResultText",value).apply();
            update();
        });}
        // One explicit, atomic visibility action. Never change Search filters,
        // account limits, rank verification, saved Favorites or coordinates.
        @JavascriptInterface public void setAllResultDisplayOptions(boolean enabled){
            handler.post(()->{
                resultShowCount=enabled;resultShowName=enabled;
                resultShowNumber=enabled;resultShowGender=enabled;
                resultShowSize=enabled;resultShowForm=enabled;
                resultShowMoves=enabled;resultShowLocation=enabled;
                resultShowDistance=enabled;resultShowShiny=enabled;
                resultShowCp=enabled;resultShowLevel=enabled;
                resultShowRawIv=enabled;resultShowOverallRank=enabled;
                resultShowSpeciesIvRank=enabled;
                resultShowOverallRankGl=enabled;resultShowOverallRankUl=enabled;
                resultShowOverallRankMl=enabled;
                resultShowSpeciesIvRankGl=enabled;resultShowSpeciesIvRankUl=enabled;
                resultShowSpeciesIvRankMl=enabled;
                showTimers=enabled;showResultText=enabled;
                android.content.SharedPreferences.Editor pref=
                    overlayPrefs().edit();
                String[] keys={"resultShowCount","resultShowName","resultShowNumber",
                    "resultShowGender","resultShowSize","resultShowForm","resultShowMoves",
                    "resultShowLocation","resultShowDistance","resultShowShiny",
                    "resultShowCp","resultShowLevel","resultShowRawIv",
                    "resultShowOverallRank","resultShowSpeciesIvRank",
                    "resultShowOverallRankGl","resultShowOverallRankUl",
                    "resultShowOverallRankMl","resultShowSpeciesIvRankGl",
                    "resultShowSpeciesIvRankUl","resultShowSpeciesIvRankMl",
                    "showTimers","showResultText"};
                for(String key:keys)pref.putBoolean(key,enabled);
                pref.apply();
                update();
                status(enabled?"Informações disponíveis ativadas · deslize para ver todos os dados":
                    "Informações opcionais desativadas");
            });
        }
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
                overlayPrefs().edit().putBoolean(pref,value).apply();
                update();
            });
        }
        private void alertModeCaption(String group,String choice){
            String label="on".equals(choice)?"Som ativado":
                "silent".equals(choice)?"Sem som · apenas aviso":"Notificações desativadas";
            // Android system text toast: a short transient caption outside the panel.
            boolean systemBlocked=!"off".equals(choice)&&
                !WatchAlerts.permissionGranted(OverlayService.this);
            android.widget.Toast.makeText(OverlayService.this,
                group+" · "+(systemBlocked?
                    "preferência salva; libere as notificações no Android":label),
                android.widget.Toast.LENGTH_SHORT).show();
        }
        @JavascriptInterface public void setAlertMode(String value){handler.post(()->{
            if(!"on".equals(value)&&!"silent".equals(value)&&!"off".equals(value))return;
            alertsMode=value;alerts=!"off".equals(value);
            overlayPrefs().edit().putString("alertsMode",value)
                .putBoolean("alerts",alerts).apply();
            update();
            alertModeCaption("Novos Pokémon",value);
        });}
        @JavascriptInterface public void setFavoriteAlertMode(String mode){handler.post(()->{
            if(!"on".equals(mode)&&!"silent".equals(mode)&&!"off".equals(mode))return;
            WatchAlerts.setMode(OverlayService.this,mode);
            update();
            alertModeCaption("Pokémon Favoritos",mode);
        });}
        private int menuActionAnchorY(){
            if(menuParams==null)return dp(70);
            return menuParams.y+dp(visualMenuBaseDp()+4);
        }
        private void closeQuickActionDialog(){
            android.app.Dialog current=quickActionDialog;
            quickActionDialog=null;
            if(current!=null)try{current.dismiss();}catch(RuntimeException ignored){}
        }
        private void requestAlertTonePicker(String target){
            if(stopped||root==null)return;
            if(!"general".equals(target)&&!"favorites".equals(target)){
                android.widget.Toast.makeText(OverlayService.this,
                    "Som individual: use a configuração de Favoritos",
                    android.widget.Toast.LENGTH_SHORT).show();
                return;
            }
            closeQuickActionDialog();
            try{
                quickActionDialog=OverlayQuickMenus.showTone(OverlayService.this,
                    target,menuActionAnchorY(),()->{if(!stopped)update();});
            }catch(Exception ex){recordFailure("selecionar som de notificação",ex);}
        }
        @JavascriptInterface public void pickAlertTone(String target){handler.post(()->{
            if(!"general".equals(target)&&!"favorites".equals(target)&&
                !"species".equals(target))return;
            requestAlertTonePicker(target);
        });}
        @JavascriptInterface public void testNotification(){handler.post(()->{
            boolean sent=WatchAlerts.test(OverlayService.this,isSecondaryOverlay());
            String diagnostic=WatchAlerts.soundDiagnostic(OverlayService.this);
            android.widget.Toast.makeText(OverlayService.this,
                sent?"Teste de Favoritos enviado · "+diagnostic:diagnostic,
                android.widget.Toast.LENGTH_LONG).show();
            update();
        });}
        @JavascriptInterface public void testGeneralNotification(){handler.post(()->{
            boolean sent=sendGeneralNotification("🔔 Teste de aviso geral",
                "Teste do canal de novos Pokémon · nenhuma captura real foi detectada.",
                isSecondaryOverlay()?12077:12076);
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
                        if(valid.contains(id)&&seen.add(id)&&(!"hidden".equals(key)||!"appearance".equals(id)))
                            safe.put(id);
                    }
                    clean.put(key,safe);
                }
                overlayPrefs().edit()
                    .putString("menuUiPrefs",clean.toString()).apply();
                update();
            }catch(Exception ignored){}
        });}
        @JavascriptInterface public void toggleTimers(){handler.post(()->{
            showTimers=!showTimers;
            overlayPrefs().edit().putBoolean("showTimers",showTimers).apply();
            update();
        });}
        @JavascriptInterface public void toggleGeneralAlerts(){handler.post(()->{
            alertsMode="off".equals(alertsMode)?"on":"on".equals(alertsMode)?"silent":"off";
            alerts=!"off".equals(alertsMode);
            overlayPrefs().edit().putString("alertsMode",alertsMode)
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
            if(stopped||root==null)return;
            if(quickActionDialog!=null&&quickActionDialog.isShowing()){
                closeQuickActionDialog();return;
            }
            try{quickActionDialog=OverlayQuickMenus.showPix(
                OverlayService.this,menuActionAnchorY());}
            catch(Exception e){recordFailure("abrir Pix flutuante",e);}
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
        @JavascriptInterface public void openWatchList(){
            handler.post(()->showFavoritePicker(menuParams==null?-1:
                menuParams.x+dp(menuDp()/2),menuParams==null?-1:
                menuParams.y+dp(visualMenuBaseDp()/2)));
        }
        @JavascriptInterface public void openWatchListAt(int triggerDp,int triggerYDp){
            handler.post(()->{
                int anchorX=menuParams==null?-1:
                    menuParams.x+dp(Math.max(0,Math.min(menuDp(),triggerDp)));
                int anchorY=menuParams==null?-1:
                    menuParams.y+dp(Math.max(0,Math.min(visualMenuBaseDp(),triggerYDp)));
                showFavoritePicker(anchorX,anchorY);
            });
        }
        @JavascriptInterface public void setIntervalMinutes(int minutes){handler.post(()->{
            if(minutes!=0&&minutes!=3&&minutes!=5&&minutes!=10&&minutes!=15&&minutes!=20)return;
            if(intervalMinutes==minutes)return;
            intervalMinutes=minutes;
            overlayPrefs().edit()
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
            overlayPrefs().edit().putInt("intervalMinutes",intervalMinutes).putBoolean("intervalExplicit",true).apply();
            schedulePeriodic();update();
        });}
        @JavascriptInterface public void shiny(){handler.post(()->{
            if(stopped||loginPaused)return;
            if(!ProviderFeatureFlags.SHINY_AVAILABLE){
                // Never send shiny_only=true or force a login/trainer link
                // while the provider is not supporting this feature.
                shiny=false;shinyVerified=false;
                overlayPrefs().edit().putBoolean("shiny",false).apply();
                android.widget.Toast.makeText(OverlayService.this,
                    "✨ Shiny temporariamente indisponível · busca normal liberada",
                    android.widget.Toast.LENGTH_LONG).show();
                update();
                return;
            }
            shiny=!shiny;
            overlayPrefs().edit().putBoolean("shiny",shiny).apply();
            replaceActiveFilterSearch();
            final int generation=requestGeneration;
            shinyVerified=false;
            shinyLoginWindowOpened=false;
            shinyLoginPromptRequested=shiny;
            // Existing cards were collected under the prior Shiny selection.
            // Keep them visible but clearly stale until the site confirms new ones.
            resultsStale=count()>0;
            hideDetails();
            // Show the neutral pending state immediately; it becomes yellow
            // only after the actual website confirms the active Shiny filter.
            status(shiny?"✨ Shiny solicitado · verificando no site...":
                "✨ Shiny OFF · aplicando na busca...");
            if(!loaded||website==null){
                if(shiny)status("✨ Site carregando; Shiny aguardando confirmação.");
                else status("✨ Shiny desligado; sincronização no próximo carregamento.");
                return;
            }
            if(!shiny){
                // No login is required for OFF. Reconfigure Shiny plus all
                // existing filters in ONE verified request (even with Coords).
                OverlayService.this.refresh(true);
                return;
            }
            startVerifiedShinySearch(generation,0);
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
        @JavascriptInterface public void openPopup(String kind,int triggerDp,int triggerYDp){
            handler.post(()->openIndependentPopup(kind,triggerDp,triggerYDp));
        }
        @JavascriptInterface public void openPopupMeasured(String kind,int triggerDp,
                                                            int triggerYDp,int triggerHeightDp){
            handler.post(()->openIndependentPopup(kind,triggerDp,triggerYDp,triggerHeightDp));
        }
        @JavascriptInterface public void openPopupMeasuredWidth(String kind,int triggerDp,
                                    int triggerYDp,int triggerHeightDp,int triggerWidthDp){
            handler.post(()->openIndependentPopup(kind,triggerDp,triggerYDp,
                triggerHeightDp,triggerWidthDp));
        }
        @JavascriptInterface public void closePopup(){handler.post(OverlayService.this::closeIndependentPopup);}
        @JavascriptInterface public void resizePopup(int width,int height){
            handler.post(()->resizeIndependentPopup(width,height));
        }
        @JavascriptInterface public void resizeDetail(int size){handler.post(()->OverlayService.this.resizeDetail(size));}
        @JavascriptInterface public void toggleDetail(int index){handler.post(()->{
            if(selected==index)hideDetails();else showDetails(index);
        });}
        @JavascriptInterface public void hideDetail(){handler.post(OverlayService.this::hideDetails);}
        @JavascriptInterface public void expiredResults(){handler.post(()->{
            // The WebView timer is a safety net when an Android handler was
            // canceled by an interrupted navigation. Expire only on time.
            // A UI timer may reach zero when the handler alarm was lost on
            // navigation/Doze, or when an API result arrived after arming.
            // The sweep is idempotent and never removes a future spawn.
            if(!stopped)expiryRefresh.run();
        });}
        @JavascriptInterface public void longPressCoords(int i){handler.post(()->{
            try{
                JSONArray a=new JSONArray(results);
                if(i>=0&&i<a.length())requestCoordinates(a.getJSONObject(i).optInt("sourceIndex",-1),true);
            }catch(Exception e){recordFailure("detalhes coordenadas",e);}
        });}
        @JavascriptInterface public void coords(int sourceIndex){handler.post(()->requestCoordinates(sourceIndex,true));}
        @JavascriptInterface public void confirmCooldownCapture(int sourceIndex){handler.post(()->OverlayService.this.confirmCooldownCapture(sourceIndex));}
        @JavascriptInterface public void toggleCooldown(){handler.post(OverlayService.this::toggleCooldown);}
        @JavascriptInterface public void undoCooldown(){handler.post(OverlayService.this::undoCooldown);}
        @JavascriptInterface public void resetCooldown(){handler.post(OverlayService.this::resetCooldown);}
        @JavascriptInterface public void refreshCoordsAccount(){handler.post(()->checkCoordsAccount(true));}
    }
    private void requestCoordinates(int sourceIndex,boolean autoCopy){
        final long requestToken=++coordinateRequestToken;
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
        // Reuse a previously verified coordinate without another site click.
        String saved=extractCoordinates(target.optString("coords",""));
        if(!saved.isEmpty()){
            if(autoCopy)copyCoordinatesInternal(saved);
            deliverCoords(saved,autoCopy?"✓ Coordenadas copiadas":"Coordenadas disponíveis");
            return;
        }
        if(displayedApiResults){
            // A periodic/API refresh clears the former one-use reveal map
            // before new results become visible. Reject the old selection
            // until the new search is confirmed, on BOTH Pokeballs.
            if(searchInProgress){
                deliverCoords("","Busca atualizando. Abra o Pokémon no resultado atualizado.");
                return;
            }
            revealAuthorizedCoords(target,autoCopy,requestToken);
            return;
        }
        JSONObject fingerprint=new JSONObject();
        try{
            fingerprint.put("index",sourceIndex);
            fingerprint.put("name",target.optString("name",""));
            fingerprint.put("cp",target.optString("cp",""));
            fingerprint.put("number",target.optString("number",""));
            fingerprint.put("location",target.optString("location",""));
        }catch(org.json.JSONException e){recordFailure("identificar cartão coordenadas",e);}
        execute("coords:"+fingerprint.toString(),response->{
            if(stopped||loginPaused||requestToken!=coordinateRequestToken)return;
            if(!currentCoordinateTarget(target)){
                deliverCoords("","Resultados mudaram; selecione o Pokémon novamente.");return;
            }
            if(!response.optBoolean("ok")){
                // A transient page refresh may return only "reason". Surface
                // the actual bounded reason in the detail, never clear it via
                // a generic status refresh or pretend the coords were copied.
                String limitType=response.optString("limitType","");
                if("rate".equals(limitType)||"quota".equals(limitType)){
                    deliverCoordsRestricted(limitType,response.optInt("retrySeconds",0));
                    return;
                }
                String why=response.optString("status",
                    response.optString("reason","Get coords indisponível"));
                deliverCoords("",why);return;
            }
            pollCoordinates(target,0,autoCopy,requestToken);
        });
    }
    private void syncPreferencesWithoutSearch(){
        if(stopped)return;
        android.content.SharedPreferences prefs=overlayPrefs();
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
        if("com.lucianotoscano.pokesearchoverlay.SYNC_NOTIFICATION_PERMISSION".equals(action)){
            // Refresh only UI evidence from Android, never remote search filters.
            update();
            return START_STICKY;
        }
        if("com.lucianotoscano.pokesearchoverlay.SYNC_HOME_THEME".equals(action)){
            syncHomeThemeVisual(true);
            return START_STICKY;
        }
        if("com.lucianotoscano.pokesearchoverlay.LOGIN_BEGIN".equals(action)){
            closeIndependentPopup();
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
            if(resultRoot!=null&&!pickerOpen&&!minimized&&!resultCollapsed)resultRoot.setVisibility(View.VISIBLE);
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
            try{PogoAccountSlots.cookieManager(
                PogoAccountSlots.assigned(this,isSecondaryOverlay())).flush();}
            catch(RuntimeException e){recordFailure("sincronizar cookies",e);}
            pendingReloadGeneration=requestGeneration;
            if(!stopped&&!loginPaused)
                handler.postDelayed(deferredSessionReload,350L);
            // Keep knownSpawns on session reload to prevent duplicate notifications.
        }
        // v0.20 saved 10 as the implicit default; only keep a rate the user explicitly chose.
        android.content.SharedPreferences pref=overlayPrefs();
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
        if(initialStart&&!pref.getBoolean("gestureHelpV1Shown",false)){
            pref.edit().putBoolean("gestureHelpV1Shown",true).apply();
            handler.postDelayed(()->{
                if(!stopped&&!loginPaused)
                    android.widget.Toast.makeText(OverlayService.this,
                        "👆 Pokébola: toque = resultados · segure = menu · arraste = mover",
                        android.widget.Toast.LENGTH_LONG).show();
            },1100L);
            handler.postDelayed(()->{
                if(!stopped&&!loginPaused)
                    android.widget.Toast.makeText(OverlayService.this,
                        "👆 ↻: toque = atualizar · segure = escolher intervalo",
                        android.widget.Toast.LENGTH_LONG).show();
            },4200L);
        }
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
        try{
            JSONObject savedExtra=new JSONObject(extraFiltersJson);
            // LT109 migration: an older Distance sort can remain stored after
            // the user disables/clears Location. Fix ONLY the stale sort on
            // startup; never erase size, gender, weather, PC, level or presets.
            if(!locationEnabled&&"Distance (nearest)".equals(
                    savedExtra.optString("sortBy",""))){
                savedExtra.put("sortBy","Despawn (longest)");
                extraFiltersJson=savedExtra.toString();
                pref.edit().putString("extraFiltersJson",extraFiltersJson).apply();
                BugReport.log(this,"FILTER_MIGRATION",
                    "Ordenação por distância inválida sem localização reiniciada; outros filtros mantidos");
            }
        }catch(org.json.JSONException ignored){extraFiltersJson="{}";}
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
        // LT62: accept any typed integer 0..100 and preserve it across restarts.
        // Spawn values remain physically attainable IV sums; thresholds can be
        // any integer and the site receives the exact requested min/max.
        ivPercentMin=Math.max(0,Math.min(100,pref.getInt("ivPercentMin",0)));
        ivPercentMax=Math.max(ivPercentMin,
            Math.min(100,pref.getInt("ivPercentMax",100)));
        // Shiny is paused upstream, not the general search. An old ON value
        // must never strand a guest or a logged-in user behind trainer checks.
        if(!ProviderFeatureFlags.SHINY_AVAILABLE&&
           overlayPrefs().getBoolean("shiny",false))
            overlayPrefs().edit().putBoolean("shiny",false).apply();
        shiny=ProviderFeatureFlags.SHINY_AVAILABLE&&
            overlayPrefs().getBoolean("shiny",false);
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
        WatchAlerts.sharedPreferences(this)
            .unregisterOnSharedPreferenceChangeListener(sharedFavoritesListener);
        if(cooldownChangedReceiverRegistered){
            try{unregisterReceiver(cooldownChangedReceiver);}catch(IllegalArgumentException ignored){}
            cooldownChangedReceiverRegistered=false;
        }
        if(!running&&!secondaryRunning)SupportMissionState.overlayStopped();
        if(trainerChangedReceiverRegistered){
            try{unregisterReceiver(trainerChangedReceiver);}
            catch(IllegalArgumentException ignored){}
            trainerChangedReceiverRegistered=false;
        }
        if (missionScreenOffRegistered) {
            try { unregisterReceiver(missionScreenOffReceiver); }
            catch (IllegalArgumentException ignored) {}
            missionScreenOffRegistered = false;
        }
        stopped=true;
        if(isSecondaryOverlay())secondaryRunning=false;
        else running=false;
        if(!running&&!secondaryRunning){
            SupportMissionState.overlayStopped();
            FirebaseStats.setOverlayVisible(this,false,isSecondaryOverlay());
        }
        if(favoritePickerDialog!=null){
            favoritePickerDialog.dismiss();favoritePickerDialog=null;
        }
        if(quickActionDialog!=null){
            try{quickActionDialog.dismiss();}catch(RuntimeException ignored){}
            quickActionDialog=null;
        }
        pickerOpen=false;
        ++requestGeneration;
        ++coordinateRequestToken;
        if(authorizedApiCollector!=null){
            authorizedApiCollector.dispose();authorizedApiCollector=null;
        }
        // Form/Pokémon sequences belong to Bridge and their callbacks already
        // check stopped/requestGeneration before touching any live WebView.
        searchInProgress=false;
        // Cancels periodic refresh, timers, popup retries and all delayed polls.
        handler.removeCallbacksAndMessages(null);
        if(wm!=null&&root!=null){try{wm.removeView(root);}catch(Exception e){recordFailure("remover dock",e);}}
        if(wm!=null&&menuRoot!=null){try{wm.removeView(menuRoot);}catch(Exception e){recordFailure("remover menu",e);}}
        if(wm!=null&&popupRoot!=null){try{wm.removeView(popupRoot);}catch(Exception e){recordFailure("remover popup",e);}}
        if(wm!=null&&resultRoot!=null){try{wm.removeView(resultRoot);}catch(Exception e){recordFailure("remover resultados",e);}}
        if(wm!=null&&detailRoot!=null){try{wm.removeView(detailRoot);}catch(Exception e){recordFailure("remover detalhes",e);}}
        destroyWebView(panel,true,"painel");panel=null;
        destroyWebView(menuPanel,true,"menu");menuPanel=null;
        destroyWebView(popupPanel,true,"popup");popupPanel=null;popupLoaded=false;
        destroyWebView(resultPanel,true,"resultados");resultPanel=null;
        destroyWebView(detailPanel,true,"detalhes");detailPanel=null;
        destroyWebView(website,false,"site");website=null;
        root=null;menuRoot=null;popupRoot=null;popupParams=null;detailRoot=null;resultRoot=null;resultGrip=null;resultParams=null;
        super.onDestroy();
    }
    @Override public IBinder onBind(Intent intent){return null;}
}

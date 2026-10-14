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
import android.widget.FrameLayout;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.function.Consumer;

public class OverlayService extends Service {
    private static final int BUBBLE_DP=45, DETAIL_DP=226;
    private int spriteSize=45;
    private int dockDp(){return spriteSize+8;}
    private int menuDp(){return 333;}
    private final Handler handler=new Handler(Looper.getMainLooper());
    private WindowManager wm;
    private WindowManager.LayoutParams params,detailParams,menuParams;
    private FrameLayout root,detailRoot,menuRoot;
    private View grip;
    private WebView panel,detailPanel,website,menuPanel;
    private boolean menuExpanded=false,menuLeft=false,minimized=false,shiny=false,loaded=false,panelLoaded=false,menuLoaded=false,detailLoaded=false,stopped=false;
    private int height=72,detailHeight=225,requestGeneration=0,selected=-1,intervalMinutes=5,menuPadDp=0;
    private String probeScriptCache;
    private boolean searchInProgress=false;
    private final Runnable queuedRefresh=()->refresh(false);
    private static final long MIN_SEARCH_GAP_MS=60_000L;
    private long lastSearchStartMs=0L;
    private boolean shinyVerified=false;
    private boolean shinyLoginPromptRequested=false;
    private boolean shinyLoginWindowOpened=false;
    private boolean firstStart=true;
    private boolean loginPaused=false;
    private boolean pickerOpen=false;
    private boolean locationEnabled=false;
    private String locationCoords="";
    private int locationRadius=0;
    private boolean locationEditorOpen=false;
    private boolean showTimers=false,alerts=false;
    private String sort="despawn";
    private long lastAlertAt=0L;
    private final java.util.Set<String> knownSpawns=new java.util.HashSet<>();
    private long armedDespawnMillis=0L;
    private final Runnable expiryRefresh=new Runnable(){
        @Override public void run(){
            armedDespawnMillis=0L;
            if(stopped||!loaded)return;
            if(searchInProgress){
                handler.postDelayed(this,2000L);
                return;
            }
            try{
                JSONArray old=new JSONArray(results),active=new JSONArray();
                long now=System.currentTimeMillis();
                for(int i=0;i<old.length();i++){
                    JSONObject card=old.optJSONObject(i);
                    if(card==null)continue;
                    long expiry=card.optLong("expiresAtMs",Long.MAX_VALUE);
                    if(expiry>now)active.put(card);
                }
                if(active.length()!=old.length()){
                    results=active.toString();hideDetails();update();
                }
            }catch(Exception ignored){}
            refresh(false);
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
    private String mode="iv",results="[]",status="Conectando...";
    private float startRawX,startRawY;
    private int startX,startY;
    private boolean dragged=false;
    private final Runnable periodic=new Runnable(){
        @Override public void run(){
            if(!stopped){refresh();handler.postDelayed(this,intervalMinutes*60000L);}
        }
    };
    private void schedulePeriodic(){
        handler.removeCallbacks(periodic);
        if(!stopped)handler.postDelayed(periodic,intervalMinutes*60000L);
    }
    private int dp(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
    private DisplayMetrics metrics(){
        DisplayMetrics m=new DisplayMetrics();
        wm.getDefaultDisplay().getMetrics(m);
        return m;
    }
    private int screenWidthDp(){DisplayMetrics m=metrics();return Math.round(m.widthPixels/m.density);}
    private int screenHeightDp(){DisplayMetrics m=metrics();return Math.round(m.heightPixels/m.density);}
    private void js(WebView web,boolean ready,String code){
        if(web!=null&&ready)web.evaluateJavascript(code,null);
    }
    private int count(){
        try{return new JSONArray(results).length();}catch(Exception e){return 0;}
    }
    private int rowDp(){
        // Compact vertical rhythm: real sprites have transparent margins.
        // The old +10dp gap was visually excessive; allow 4dp transparent
        // edge overlap without changing the sprite image dimensions.
        return Math.max(26,spriteSize-8);
    }
    private void update(){
        String data="window.onNativeData("+results+","+JSONObject.quote(status)+","+
                JSONObject.quote(mode)+","+(shiny&&shinyVerified)+","+rowDp()+","+intervalMinutes+","+spriteSize+","+showTimers+",false,"+alerts+","+(WatchAlerts.watched(this).size()>0)+","+(shiny&&!shinyVerified)+","+Math.max(rowDp()*2,Math.min(rowDp()*8,screenHeightDp()-160))+","+locationEnabled+","+JSONObject.quote(locationEnabled?locationCoords:"")+","+locationRadius+")";
        js(panel,panelLoaded,data);
        js(menuPanel,menuLoaded,data);
        if(selected>=0)showDetails(selected);
    }
    private void status(String s){
        status=s;
        getSharedPreferences("prefs",0).edit().putString("lastStatus",s).apply();
        update();
    }
    private void diagnosticError(String s){
        getSharedPreferences("prefs",0).edit().putString("lastError",s).apply();
        BugReport.log(this,"ERROR",s);
        status(s);
    }
    private void updateWindow(){
        if(wm!=null&&root!=null&&params!=null){
            try{wm.updateViewLayout(root,params);}catch(Exception ignored){}
        }
        updateMenuPosition();
    }
    private void updateMenuPosition(){
        if(!menuExpanded||menuRoot==null||menuParams==null||params==null||wm==null)return;
        int screen=metrics().widthPixels;
        int width=dp(menuDp());
        menuLeft=params.x+dp(dockDp())+width>screen;
        menuParams.x=menuLeft?Math.max(0,params.x-width):Math.min(screen-width,params.x+dp(dockDp()));
        menuParams.y=params.y;
        try{wm.updateViewLayout(menuRoot,menuParams);}catch(Exception ignored){}
    }
    private void resizeMenu(int desiredDp){
        if(!menuExpanded||menuParams==null||menuRoot==null)return;
        int target=dp(Math.max(29,Math.min(295,desiredDp)));
        if(Math.abs(menuParams.height-target)<=dp(1))return;
        menuParams.height=target;
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
        }
        try{wm.updateViewLayout(menuRoot,menuParams);}catch(Exception ignored){}
    }
    private String locationPayload(){
        JSONObject data=new JSONObject();
        try{
            data.put("enabled",locationEnabled);
            data.put("coords",locationEnabled?locationCoords:"");
            data.put("radius",locationEnabled?locationRadius:0);
        }catch(Exception ignored){}
        return data.toString();
    }
    private void moveDetail(){
        if(detailRoot==null||detailParams==null||params==null)return;
        int w=screenWidthDp(),h=screenHeightDp(),gap=5;
        int dockPos=params.x/dp(1);
        int right=dockPos+dockDp()+gap;
        int left=dockPos-DETAIL_DP-gap;
        int preferred=right+DETAIL_DP<=w-4?right:left;
        detailParams.x=dp(Math.max(0,Math.min(w-DETAIL_DP,preferred)));
        int dockY=params.y/dp(1)+menuPadDp;
        detailParams.y=dp(Math.max(0,Math.min(h-detailHeight-45,dockY+18)));
        try{wm.updateViewLayout(detailRoot,detailParams);}catch(Exception ignored){}
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
            @Override public void onPageFinished(WebView view,String url){
                if(url!=null&&url.startsWith("https://pogocoordinates.com/")){
                    loaded=true;
                    handler.postDelayed(()->{if(!stopped)refresh();},2500);
                }
            }
        });
    }
    @Override public void onCreate(){
        super.onCreate();
        NotificationManager nm=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
        nm.createNotificationChannel(new NotificationChannel("pokesearch","PokeSearch",
                NotificationManager.IMPORTANCE_LOW));
        PendingIntent pi=PendingIntent.getActivity(this,0,new Intent(this,MainActivity.class),
                PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
        Notification note=new Notification.Builder(this,"pokesearch")
                .setSmallIcon(android.R.drawable.ic_menu_search)
                .setContentTitle("PokeSearch ativo")
                .setContentText("Toque para abrir PokeSearch")
                .setContentIntent(pi).setOngoing(true).build();
        startForeground(73,note);
        wm=(WindowManager)getSystemService(WINDOW_SERVICE);
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
        root.addView(grip,new FrameLayout.LayoutParams(dp(dockDp()),dp(21),Gravity.TOP|Gravity.LEFT));

        params=new WindowManager.LayoutParams(dp(dockDp()),dp(height),
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
                PixelFormat.TRANSLUCENT);
        params.gravity=Gravity.TOP|Gravity.LEFT;
        params.x=dp(Math.max(0,screenWidthDp()-dockDp()-7));params.y=dp(120);
        try{wm.addView(root,params);}catch(Exception e){stopSelf();return;}

        // Dedicated 308dp-by-29dp touchable window for the toolbar.
        // Transparent regions outside this rectangle belong to Pokémon GO:
        // a single expanded WebView used to intercept every tap underneath.
        menuRoot=new FrameLayout(this);
        menuRoot.setBackgroundColor(Color.TRANSPARENT);
        menuPanel=new WebView(this);
        menuPanel.setBackgroundColor(Color.TRANSPARENT);
        menuPanel.getSettings().setJavaScriptEnabled(true);
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
        menuParams=new WindowManager.LayoutParams(dp(menuDp()),dp(29),
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
                PixelFormat.TRANSLUCENT);
        menuParams.gravity=Gravity.TOP|Gravity.LEFT;
        menuParams.x=0;menuParams.y=params.y;
        menuRoot.setVisibility(View.GONE);
        try{wm.addView(menuRoot,menuParams);}catch(Exception e){menuRoot=null;menuPanel=null;}
        if(menuPanel!=null)menuPanel.loadUrl("file:///android_asset/dock.html?controls=1");

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
        try{wm.addView(detailRoot,detailParams);}catch(Exception e){detailRoot=null;}
        panel.loadUrl("file:///android_asset/dock.html");
        if(detailRoot!=null)detailPanel.loadUrl("file:///android_asset/detail.html");
        website.loadUrl("https://pogocoordinates.com/search");
        schedulePeriodic();
    }
    private String script(){
        if(probeScriptCache!=null)return probeScriptCache;
        try(InputStream in=getAssets().open("probe.js")){
            ByteArrayOutputStream out=new ByteArrayOutputStream();
            byte[] buf=new byte[4096];int n;
            while((n=in.read(buf))!=-1)out.write(buf,0,n);
            probeScriptCache=out.toString("UTF-8");
            return probeScriptCache;
        }catch(Exception e){return "null";}
    }
    private void execute(String action,Consumer<JSONObject> callback){
        if(!loaded||website==null){
            if(callback!=null){
                JSONObject failure=new JSONObject();
                try{failure.put("ok",false);failure.put("reason","Site indisponível");}catch(Exception ignored){}
                callback.accept(failure);
            }else status("Abra o app e faça login.");
            return;
        }
        String code=script().replace("__ACTION__",JSONObject.quote(action))
                .replace("__MODE__",JSONObject.quote(mode))
                .replace("__SHINY__",shiny?"true":"false");
        website.evaluateJavascript(code,raw->{
            if(stopped)return;
            try{
                String decoded=new JSONArray("["+raw+"]").getString(0);
                JSONObject r=new JSONObject(decoded);
                if(callback!=null)callback.accept(r);
            }catch(Exception e){
                JSONObject failure=new JSONObject();
                try{failure.put("ok",false);failure.put("reason","Resposta inválida do navegador interno");}catch(Exception ignored){}
                if(callback!=null)callback.accept(failure);
                else diagnosticError("Falha ao ler resultados no site.");
            }
        });
    }
    private void refresh(){refresh(false);}
    private void refresh(boolean manual){
        if(stopped||loginPaused)return;
        if(searchInProgress){
            if(manual)status("A busca atual ainda está em andamento.");
            return;
        }
        if(!loaded||website==null){
            // onPageFinished will trigger the pending refresh automatically.
            status("Carregando o site. Aguarde alguns segundos...");
            return;
        }
        long now=System.currentTimeMillis();
        long previous=getSharedPreferences("prefs",0).getLong("lastNetworkSearchAt",0L);
        if(previous>0L&&now>=previous&&now-previous<MIN_SEARCH_GAP_MS){
            long remaining=(MIN_SEARCH_GAP_MS-(now-previous)+999L)/1000L;
            status("Próxima busca em "+remaining+"s · mantendo "+mode.toUpperCase(java.util.Locale.ROOT)
                +(shiny?" com ✨":" sem ✨")+".");
            handler.removeCallbacks(queuedRefresh);
            handler.postDelayed(queuedRefresh,remaining*1000L+300L);
            return;
        }
        handler.removeCallbacks(queuedRefresh);
        BugReport.log(this,"PREPARE","Filtros "+mode+" Shiny="+shiny+" manual="+manual);
        handler.removeCallbacks(expiryRefresh);
        armedDespawnMillis=0L;
        searchInProgress=true;
        if(shiny){shinyVerified=false;update();}
        final int generation=++requestGeneration;
        status(manual?"Busca manual iniciada...":"Atualizando...");
        execute("session",session->{
            if(stopped||generation!=requestGeneration)return;
            final String auth=session.optString("auth","não confirmado");
            getSharedPreferences("prefs",0).edit().putString("sessionStatus",auth).apply();
            if(shiny&&auth.equals("login necessário")){
                searchInProgress=false;
                diagnosticError("✨ Faça login e vincule seu código de amizade no PoGoCoordinates.");
                if(shinyLoginPromptRequested)openShinyLogin();
                return;
            }
            execute("prepareSearch",prepared->{
                if(stopped||generation!=requestGeneration)return;
                if(!prepared.optBoolean("ok")){
                    searchInProgress=false;
                    diagnosticError("Não foi possível selecionar a aba de busca.");
                    return;
                }
                handler.postDelayed(()->execute("configureSearch",configured->{
                    if(stopped||generation!=requestGeneration)return;
                    if(!configured.optBoolean("ok")||!configured.optBoolean("configured",false)){
                        searchInProgress=false;
                        diagnosticError("Falha nos controles IV/R1. Verifique se a página de busca carregou.");
                        return;
                    }
                    configureLocationAndVerify(generation,manual,0);
                }),600L);
            });
        });
    }
    private void configureLocationAndVerify(int generation,boolean manual,int attempt){
        String data=locationPayload();
        execute("configureLocation:"+data,configured->{
            if(stopped||generation!=requestGeneration)return;
            if(!configured.optBoolean("ok")){
                if(attempt<2){
                    handler.postDelayed(()->configureLocationAndVerify(generation,manual,attempt+1),450L);
                    return;
                }
                searchInProgress=false;
                diagnosticError("📍 Não foi possível configurar a localização: "+
                    configured.optString("reason","verifique o formulário do site."));
                return;
            }
            handler.postDelayed(()->execute("verifyLocation:"+data,verified->{
                if(stopped||generation!=requestGeneration)return;
                if(!verified.optBoolean("ok")){
                    if(attempt<2){
                        configureLocationAndVerify(generation,manual,attempt+1);
                        return;
                    }
                    searchInProgress=false;
                    diagnosticError("📍 Filtro de localização não confirmado. Pesquisa não enviada.");
                    return;
                }
                verifyAndSubmit(generation,manual,0);
            }),400L);
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
            shinyLoginWindowOpened=false;
            diagnosticError("Não foi possível abrir a etapa de login/vinculação.");
        }
    }
    private void verifyAndSubmit(int generation,boolean manual,int attempt){
        handler.postDelayed(()->execute("verifyShiny",verified->{
            if(stopped||generation!=requestGeneration)return;
            if(!verified.optBoolean("ok")){
                if(attempt<4){
                    execute("prepareSearch",preparedRetry->execute("configureSearch",ignored->{
                        if(stopped||generation!=requestGeneration)return;
                        verifyAndSubmit(generation,manual,attempt+1);
                    }));
                    return;
                }
                searchInProgress=false;
                shinyVerified=false;
                diagnosticError(shiny
                    ?"✨ Shiny não confirmado no site. Entre/vincule seu treinador para habilitar."
                    :"Não foi possível confirmar Shiny desativado no site.");
                if(shinyLoginPromptRequested)openShinyLogin();
                return;
            }
            execute("verifyFilters",filters->{
                if(stopped||generation!=requestGeneration)return;
                if(!filters.optBoolean("ok")){
                    if(attempt<2){
                        execute("configureSearch",ignored->{
                            if(stopped||generation!=requestGeneration)return;
                            verifyAndSubmit(generation,manual,attempt+1);
                        });
                        return;
                    }
                    searchInProgress=false;
                    shinyVerified=false;
                    diagnosticError("Filtros IV/ligas não confirmados: "
                        +filters.optString("reason","verifique as opções no site."));
                    return;
                }
                shinyVerified=shiny;
                update();
                execute("submitSearch",submitted->{
                    if(stopped||generation!=requestGeneration)return;
                    if(!submitted.optBoolean("ok")){
                        searchInProgress=false;
                        shinyVerified=false;
                        diagnosticError(submitted.optString("reason","Falha ao pressionar Search."));
                        return;
                    }
                    long submittedAt=System.currentTimeMillis();
                    lastSearchStartMs=submittedAt;
                    getSharedPreferences("prefs",0).edit().putLong("lastNetworkSearchAt",submittedAt).apply();
                    BugReport.log(this,"SUBMIT","Busca "+mode+" Shiny="+shiny);
                    status(manual?"Busca manual em andamento...":"Buscando...");
                    pollSearch(generation,0,manual);
                });
            });
        }),650L);
    }
    private void pollSearch(int generation,int attempt,boolean manual){
        handler.postDelayed(()->execute("collect",r->{
            if(stopped||generation!=requestGeneration)return;
            if(!r.optBoolean("ok")){
                searchInProgress=false;
                diagnosticError("Falha na leitura dos resultados do site.");
                return;
            }
            if((shiny && (!r.has("siteShiny")||r.isNull("siteShiny")||
                !r.optBoolean("siteShiny",false))) ||
                (!shiny&&r.has("siteShiny")&&!r.isNull("siteShiny")&&r.optBoolean("siteShiny",false))){
                searchInProgress=false;
                shinyVerified=false;
                diagnosticError("Filtro Shiny mudou durante a busca. Resultados não confirmados.");
                return;
            }
            if(!"iv".equals(mode)&&!r.optBoolean("leagueConfirmed",false)){
                searchInProgress=false;
                shinyVerified=false;
                diagnosticError("Liga PvP/ranking 1 não confirmado. Resultados preservados.");
                return;
            }
            int found=r.optInt("found",0);
            int onSite=r.optInt("siteCount",0);
            if(r.optBoolean("parseFailure",false)&&!r.optBoolean("loading",false)){
                searchInProgress=false;
                diagnosticError("Leitura do site: "+onSite+" ocorrências exibidas, mas nenhum cartão foi reconhecido. Abra ⚠ para exportar o diagnóstico.");
                return;
            }
            if(found>0&&r.optJSONArray("cards")!=null&&r.optJSONArray("cards").length()==0){
                searchInProgress=false;
                diagnosticError("Site retornou "+found+" Pokémon, mas nenhum comprovou os IVs/ranking esperados; confira os filtros com ⚠.");
                return;
            }
            boolean loading=r.optBoolean("loading",false);
            boolean empty=r.optBoolean("explicitEmpty",false);
            if((loading||(!empty&&found==0))&&attempt<8){
                pollSearch(generation,attempt+1,manual);
                return;
            }
            if(loading||(!empty&&found==0&&attempt>=8)){
                searchInProgress=false;
                diagnosticError("Busca não confirmada no site (tempo limite). Resultados anteriores mantidos.");
                return;
            }
            applyCollectedResults(r);
        }), attempt==0?3000L:1300L);
    }
    private long expiration(JSONObject item){
        if(item==null)return Long.MAX_VALUE;
        String[] p=item.optString("despawn","").split(":");
        if(p.length!=2)return Long.MAX_VALUE;
        try{
            long secs=Long.parseLong(p[0])*60+Long.parseLong(p[1]);
            if(secs<=0||secs>86400)return Long.MAX_VALUE;
            return item.optLong("sampledAt",System.currentTimeMillis())+secs*1000L;
        }catch(Exception e){return Long.MAX_VALUE;}
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
        catch(Exception ignored){return 999999;}
    }
    private boolean verifiedTargetCriteria(JSONObject card){
        if(card==null)return false;
        if("iv".equals(mode)){
            return "15/15/15".equals(card.optString("iv","")) ||
                "100".equals(card.optString("ivPercent",""));
        }
        if("gl".equals(mode)||"ul".equals(mode)){
            return "1".equals(card.optString("rank","").trim());
        }
        return false;
    }
    private void recordNewResults(JSONArray cards,boolean leagueConfirmed){
        android.content.SharedPreferences preferences=getSharedPreferences("prefs",0);
        JSONArray history;
        try{history=new JSONArray(preferences.getString("history","[]"));}
        catch(Exception ignored){history=new JSONArray();}
        java.util.Set<String> current=new java.util.HashSet<>();
        String firstNew="";
        String firstWatched="";
        String watchDetails="";
        int watchedCount=0;
        java.util.Set<String> wanted=WatchAlerts.watched(this);
        long now=System.currentTimeMillis();
        for(int i=0;i<cards.length();i++){
            JSONObject c=cards.optJSONObject(i);
            if(c==null)continue;
            String key=spawnKey(c);
            current.add(key);
            if(knownSpawns.contains(key))continue;
            if(firstNew.isEmpty() &&
                ("iv".equals(mode)||leagueConfirmed) && verifiedTargetCriteria(c))
                firstNew=c.optString("name","Pokémon");
            if(WatchAlerts.enabled(this) &&
                ("iv".equals(mode)||leagueConfirmed) &&
                verifiedTargetCriteria(c) &&
                WatchAlerts.matches(c.optString("name",""),wanted)){
                watchedCount++;
                if(firstWatched.isEmpty()){
                    firstWatched=c.optString("name","Pokémon");
                    watchDetails="Busca "+mode.toUpperCase(java.util.Locale.ROOT)+
                        " · PC "+c.optString("cp","?")+
                        (c.optString("location","").isEmpty()?"":" · "+c.optString("location",""));
                }
            }
            JSONObject entry=new JSONObject();
            try{
                entry.put("name",c.optString("name","Pokémon"));
                entry.put("cp",c.optString("cp",""));
                entry.put("mode",mode.toUpperCase(java.util.Locale.ROOT));
                entry.put("rank",c.optString("rank",""));
                entry.put("at",now);
                history.put(entry);
            }catch(Exception ignored){}
        }
        knownSpawns.clear();knownSpawns.addAll(current);
        JSONArray limited=new JSONArray();
        for(int i=Math.max(0,history.length()-40);i<history.length();i++)limited.put(history.opt(i));
        preferences.edit().putString("history",limited.toString()).apply();
        if(watchedCount>0&&!firstWatched.isEmpty()){
            if(watchedCount>1)watchDetails+=" · +"+(watchedCount-1)+" Pokémon da lista";
            boolean sent=WatchAlerts.match(this,firstWatched,watchDetails);
            if(!sent&&!WatchAlerts.permissionGranted(this))
                preferences.edit().putString("lastWatchAlertError",
                    "Permissão de notificações não concedida").apply();
        }
        if(alerts&&!firstNew.isEmpty()&&now-lastAlertAt>60000L){
            lastAlertAt=now;
            NotificationManager nm=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
            if(nm!=null){
                nm.createNotificationChannel(new NotificationChannel("pokesearch_alerts",
                    "Novos Pokémon encontrados",NotificationManager.IMPORTANCE_DEFAULT));
                Notification note=new Notification.Builder(this,"pokesearch_alerts")
                    .setSmallIcon(android.R.drawable.ic_menu_search)
                    .setContentTitle("Novo Pokémon: "+firstNew)
                    .setContentText("Encontrado na busca "+mode.toUpperCase(java.util.Locale.ROOT))
                    .setAutoCancel(true).build();
                try{nm.notify(74,note);}catch(Exception ignored){}
            }
        }
    }
    private void applyCollectedResults(JSONObject r){
        BugReport.log(this,"RESULTS","Modo "+mode+" • válidos "+
            (r.optJSONArray("cards")==null?0:r.optJSONArray("cards").length())+
            " • encontrados "+r.optInt("found",0));
        JSONArray items=r.optJSONArray("cards");
        if(items==null)items=new JSONArray();
        long now=System.currentTimeMillis();
        for(int i=0;i<items.length();i++){
            JSONObject card=items.optJSONObject(i);
            if(card==null)continue;
            try{
                card.put("sampledAt",now);
                long end=expiration(card);
                if(end!=Long.MAX_VALUE)card.put("expiresAtMs",end);
            }catch(Exception ignored){}
        }
        JSONArray sorted=sortItems(items);
        recordNewResults(sorted,r.optBoolean("leagueConfirmed",false));
        results=sorted.toString();
        searchInProgress=false;
        armNextDespawn(sorted);
        if(selected>=0)hideDetails();
        getSharedPreferences("prefs",0).edit()
            .putLong("lastSearchAt",now).putString("lastError","Nenhum").apply();
        if(r.optBoolean("uncertain"))
            status("iv".equals(mode)?"Alguns IVs não confirmados.":"Alguns rankings PvP não confirmados.");
        else if(sorted.length()==0)status("Sem resultados confirmados");
        else status(sorted.length()+" Pokémon atualizados");
    }
    private void resize(int h){
        if(minimized||params==null)return;
        int target=Math.max(46,Math.min(screenHeightDp()-95,h));
        if(Math.abs(target-height)<2)return;
        height=target;params.height=dp(height);updateWindow();moveDetail();
    }
    private void menu(boolean show){
        if(params==null||minimized)return;
        if(show==menuExpanded)return;
        if(!show&&locationEditorOpen)locationEditor(false);
        menuExpanded=show;
        menuPadDp=show?29:0;
        if(show){
            menuLeft=params.x+dp(dockDp())+dp(menuDp())>metrics().widthPixels;
            if(menuRoot!=null)menuRoot.setVisibility(View.VISIBLE);
            if(menuParams!=null)menuParams.height=dp(29);
        }else{
            if(menuRoot!=null)menuRoot.setVisibility(View.GONE);
        }
        // Main dock remains narrow and stationary. Only the Pokémon column
        // drops 29dp below the expanded controls, so the remaining game area
        // keeps receiving touches.
        js(panel,panelLoaded,"window.syncMenu("+show+","+
            JSONObject.quote(menuLeft?"left":"right")+","+menuPadDp+")");
        js(menuPanel,menuLoaded,"window.syncMenu("+show+","+
            JSONObject.quote(menuLeft?"left":"right")+",0)");
        updateWindow();
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
                dp(yes?BUBBLE_DP:dockDp()),dp(yes?BUBBLE_DP:21),Gravity.TOP|Gravity.LEFT));
        js(panel,panelLoaded,"window.setMinimized("+yes+")");
        updateWindow();
    }
    private void showDetails(int index){
        if(detailRoot==null||detailPanel==null||!detailLoaded||minimized)return;
        try{
            JSONArray a=new JSONArray(results);
            if(index<0||index>=a.length()){hideDetails();return;}
            selected=index;
            JSONObject obj=a.getJSONObject(index);
            js(detailPanel,true,"window.showDetails("+obj.toString()+","+JSONObject.quote(mode)+","+WatchAlerts.isWatched(this,obj.optString("name",""))+")");
            detailRoot.setVisibility(View.VISIBLE);
            moveDetail();
            js(panel,panelLoaded,"window.highlight("+index+")");
        }catch(Exception e){hideDetails();}
    }
    private void hideDetails(){
        selected=-1;
        if(detailRoot!=null)detailRoot.setVisibility(View.GONE);
        js(panel,panelLoaded,"window.highlight(-1)");
    }
    private void resizeDetail(int heightDp){
        detailHeight=Math.max(90,Math.min(310,heightDp));
        if(detailParams!=null&&detailRoot!=null){
            detailParams.height=dp(detailHeight);moveDetail();
        }
    }
    private void pollCoordinates(JSONObject target,int attempt,boolean autoCopy){
        JSONObject query=new JSONObject();
        try{
            query.put("name",target.optString("name",""));
            query.put("cp",target.optString("cp",""));
        }catch(Exception ignored){}
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
                }catch(Exception ignored){}
                if(autoCopy)copyCoordinatesInternal(coords);
                deliverCoords(coords,autoCopy?"Coordenadas copiadas":"Coordenadas obtidas");return;
            }
            if(attempt<8){
                handler.postDelayed(()->pollCoordinates(target,attempt+1,autoCopy),450L);
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
        java.util.regex.Matcher m=java.util.regex.Pattern.compile("(-?\\d{1,2}(?:\\.\\d+)?)\\s*[,;]\\s*(-?\\d{1,3}(?:\\.\\d+)?)").matcher(input);
        if(m.find()){
            try{
                double lat=Double.parseDouble(m.group(1)),lon=Double.parseDouble(m.group(2));
                if(Math.abs(lat)<=90&&Math.abs(lon)<=180)return m.group(1)+","+m.group(2);
            }catch(Exception ignored){}
        }
        return "";
    }
    private void deliverCoords(String coordinates,String message){
        js(detailPanel,detailLoaded,"window.coordsResult("+JSONObject.quote(coordinates)+","+JSONObject.quote(message)+")");
        status(message);
    }
    public class Bridge{
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
            if(enabled){
                String valid=extractCoordinates(coords==null?"":coords);
                if(valid.isEmpty()||radius<0||radius>1000){
                    diagnosticError("📍 Cole latitude,longitude válidas e escolha raio de 0 a 1000km.");
                    update();return;
                }
                locationEnabled=true;
                locationCoords=valid;
                locationRadius=radius;
            }else{
                locationEnabled=false;
                locationCoords="";
                locationRadius=0;
            }
            android.content.SharedPreferences.Editor prefs=getSharedPreferences("prefs",0).edit();
            prefs.putBoolean("locationEnabled",locationEnabled);
            if(locationEnabled)prefs.putString("locationCoords",locationCoords).putInt("locationRadius",locationRadius);
            else prefs.remove("locationCoords").remove("locationRadius");
            prefs.apply();
            ++requestGeneration;searchInProgress=false;
            results="[]";hideDetails();
            BugReport.log(OverlayService.this,"LOCATION",locationEnabled?"Filtro de coordenadas ativado":"Filtro de coordenadas desativado");
            status(locationEnabled?"📍 Localização ligada • "+locationRadius+"km":"📍 Localização desligada • busca geral");
            OverlayService.this.refresh(true);
        });}
        @JavascriptInterface public void locationEditor(boolean open){handler.post(()->OverlayService.this.locationEditor(open));}
        @JavascriptInterface public void setMode(String s){select(s);}
        @JavascriptInterface public void select(String s){handler.post(()->{
            if(!s.equals("iv")&&!s.equals("gl")&&!s.equals("ul"))return;
            if(mode.equals(s))return;
            mode=s;getSharedPreferences("prefs",0).edit().putString("mode",s).apply();
            ++requestGeneration;searchInProgress=false;shinyVerified=false;
            results="[]";hideDetails();update();refresh();
        });}
        @JavascriptInterface public void menu(boolean open){handler.post(()->OverlayService.this.menu(open));}
        @JavascriptInterface public void cycleMode(){handler.post(()->{
            mode=mode.equals("iv")?"gl":mode.equals("gl")?"ul":"iv";
            getSharedPreferences("prefs",0).edit().putString("mode",mode).apply();
            ++requestGeneration;searchInProgress=false;shinyVerified=false;
            results="[]";hideDetails();update();refresh();
        });}
        @JavascriptInterface public void cycleSpriteSize(){handler.post(()->{
            int[] sizes={35,45,55};
            int at=1;
            for(int j=0;j<sizes.length;j++)if(sizes[j]==spriteSize)at=j;
            int size=sizes[(at+1)%sizes.length];
            boolean wasExpanded=menuExpanded;
            if(wasExpanded)menu(false);
            spriteSize=size;
            getSharedPreferences("prefs",0).edit().putInt("spriteSize",size).apply();
            if(params!=null){
                params.width=dp(minimized?BUBBLE_DP:dockDp());
                params.x=Math.max(0,Math.min(metrics().widthPixels-params.width,params.x));
                grip.setLayoutParams(new FrameLayout.LayoutParams(
                    dp(minimized?BUBBLE_DP:dockDp()),dp(minimized?BUBBLE_DP:21),
                    Gravity.TOP|Gravity.LEFT));
                updateWindow();
            }
            update();
            if(wasExpanded)menu(true);
            android.widget.Toast.makeText(OverlayService.this,
                new String[]{"P","M","G"}[(at+1)%sizes.length]+" · "+size+" × "+size,
                android.widget.Toast.LENGTH_SHORT).show();
        });}
        @JavascriptInterface public void toggleTimers(){handler.post(()->{
            showTimers=!showTimers;
            getSharedPreferences("prefs",0).edit().putBoolean("showTimers",showTimers).apply();
            update();
        });}
        @JavascriptInterface public void toggleGeneralAlerts(){handler.post(()->{
            alerts=!alerts;
            getSharedPreferences("prefs",0).edit().putBoolean("alerts",alerts).apply();
            update();
            android.widget.Toast.makeText(OverlayService.this,
                alerts?"Novos Pokémon: notificações ativadas":"Novos Pokémon: notificações desligadas",
                android.widget.Toast.LENGTH_SHORT).show();
        });}
        @JavascriptInterface public void toggleWatchAlerts(){handler.post(()->{
            boolean enabled=!WatchAlerts.enabled(OverlayService.this);
            getSharedPreferences("prefs",0).edit()
                .putBoolean(WatchAlerts.PREF_ENABLED,enabled).apply();
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
            try{startActivity(intent);}catch(Exception ignored){}
        });}
        @JavascriptInterface public void openSettings(){handler.post(()->{
            Intent intent=new Intent(OverlayService.this,MainActivity.class);
            intent.setAction("com.lucianotoscano.pokesearchoverlay.OPEN_SETTINGS");
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|
                Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP);
            try{startActivity(intent);}catch(Exception ignored){}
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
            if(menuRoot!=null)menuRoot.setVisibility(View.GONE);
            try{
                PokemonPicker.show(OverlayService.this,()->{
                    if(!stopped)update();
                },()->{
                    pickerOpen=false;
                    if(!stopped&&!loginPaused&&root!=null)root.setVisibility(View.VISIBLE);
                    if(!stopped&&!loginPaused&&menuExpanded&&menuRoot!=null)menuRoot.setVisibility(View.VISIBLE);
                    update();
                });
            }catch(Exception e){
                pickerOpen=false;
                if(root!=null&&!loginPaused)root.setVisibility(View.VISIBLE);
                if(menuRoot!=null&&!loginPaused&&menuExpanded)menuRoot.setVisibility(View.VISIBLE);
                diagnosticError("Não foi possível abrir favoritos no overlay.");
            }
        });}
        @JavascriptInterface public void setIntervalMinutes(int minutes){handler.post(()->{
            if(minutes!=5&&minutes!=10&&minutes!=15&&minutes!=20)return;
            if(intervalMinutes==minutes)return;
            intervalMinutes=minutes;
            getSharedPreferences("prefs",0).edit()
                .putInt("intervalMinutes",intervalMinutes).putBoolean("intervalExplicit",true).apply();
            schedulePeriodic();
            update();
        });}
        @JavascriptInterface public void cycleInterval(){handler.post(()->{
            int[] options={5,10,15,20};
            int next=0;
            for(int j=0;j<options.length;j++){
                if(options[j]==intervalMinutes){next=(j+1)%options.length;break;}
            }
            intervalMinutes=options[next];
            getSharedPreferences("prefs",0).edit().putInt("intervalMinutes",intervalMinutes).putBoolean("intervalExplicit",true).apply();
            schedulePeriodic();update();
        });}
        @JavascriptInterface public void shiny(){handler.post(()->{
            shiny=!shiny;
            getSharedPreferences("prefs",0).edit().putBoolean("shiny",shiny).apply();
            ++requestGeneration;
            searchInProgress=false;
            shinyVerified=false;
            shinyLoginWindowOpened=false;
            shinyLoginPromptRequested=shiny;
            results="[]";hideDetails();update();
            status(shiny?"✨ Confirmando Shiny no site...":"Desativando Shiny no site...");
            OverlayService.this.refresh(true);
        });}
        @JavascriptInterface public void refresh(){handler.post(()->OverlayService.this.refresh(true));}
        @JavascriptInterface public void minimize(){handler.post(()->OverlayService.this.minimize(true));}
        @JavascriptInterface public void restore(){handler.post(()->OverlayService.this.minimize(false));}
        @JavascriptInterface public void close(){handler.post(()->stopSelf());}
        @JavascriptInterface public void resize(int size){handler.post(()->OverlayService.this.resize(size));}
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
            }catch(Exception ignored){}
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
        }catch(Exception ignored){}
        if(chosen==null){deliverCoords("","Pokémon indisponível");return;}
        JSONObject target=chosen;
        execute("coords:"+sourceIndex,response->{
            if(!response.optBoolean("ok")){
                deliverCoords("",response.optString("status","Get coords indisponível"));return;
            }
            pollCoordinates(target,0,autoCopy);
        });
    }
    @Override public int onStartCommand(Intent i,int flags,int id){
        String action=i==null?"":i.getAction();
        if("com.lucianotoscano.pokesearchoverlay.LOGIN_BEGIN".equals(action)){
            loginPaused=true;
            handler.removeCallbacks(periodic);
            if(root!=null)root.setVisibility(View.GONE);
            if(menuRoot!=null)menuRoot.setVisibility(View.GONE);
            if(detailRoot!=null)detailRoot.setVisibility(View.GONE);
            BugReport.log(this,"LOGIN","Página de autenticação aberta, overlay oculto");
            return START_STICKY;
        }
        if("com.lucianotoscano.pokesearchoverlay.LOGIN_END".equals(action)){
            loginPaused=false;
            if(root!=null&&!pickerOpen)root.setVisibility(View.VISIBLE);
            if(menuRoot!=null&&!pickerOpen&&menuExpanded)menuRoot.setVisibility(View.VISIBLE);
            if(detailRoot!=null&&selected>=0&&!pickerOpen)detailRoot.setVisibility(View.VISIBLE);
            schedulePeriodic();
            BugReport.log(this,"LOGIN","Página de autenticação fechada");
            return START_STICKY;
        }
        boolean initialStart=firstStart;
        firstStart=false;
        if(i!=null&&"com.lucianotoscano.pokesearchoverlay.REFRESH_LOGIN".equals(i.getAction())){
            shinyLoginPromptRequested=false;
            shinyLoginWindowOpened=false;
            if(!initialStart){
                ++requestGeneration;
                searchInProgress=false;
                shinyVerified=false;
                handler.removeCallbacks(expiryRefresh);
                results="[]";hideDetails();loaded=false;
                status("Atualizando sessão após login...");
                CookieManager.getInstance().flush();
                if(website!=null)website.loadUrl("https://pogocoordinates.com/search");
                // Keep knownSpawns on session reload to prevent duplicate notifications.
            }
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
        if(intervalMinutes!=5&&intervalMinutes!=10&&
           intervalMinutes!=15&&intervalMinutes!=20)intervalMinutes=5;
        schedulePeriodic();
        spriteSize=pref.getInt("spriteSize",45);
        if(spriteSize!=35&&spriteSize!=45&&spriteSize!=55)spriteSize=45;
        showTimers=pref.getBoolean("showTimers",false);
        alerts=pref.getBoolean("alerts",false);
        sort=pref.getString("sort","despawn");
        if(params!=null&&!menuExpanded){
            params.width=dp(minimized?BUBBLE_DP:dockDp());
            params.x=Math.min(params.x,metrics().widthPixels-params.width);
            grip.setLayoutParams(new FrameLayout.LayoutParams(
                dp(minimized?BUBBLE_DP:dockDp()),dp(minimized?BUBBLE_DP:21),Gravity.TOP|Gravity.LEFT));
            updateWindow();
        }
        locationEnabled=pref.getBoolean("locationEnabled",false);
        locationCoords=locationEnabled?pref.getString("locationCoords",""):"";
        locationRadius=locationEnabled?pref.getInt("locationRadius",0):0;
        if(locationEnabled&&(extractCoordinates(locationCoords).isEmpty()||locationRadius<0||locationRadius>1000)){
            locationEnabled=false;locationCoords="";locationRadius=0;
            pref.edit().putBoolean("locationEnabled",false).remove("locationCoords").remove("locationRadius").apply();
        }
        mode=getSharedPreferences("prefs",0).getString("mode",mode);
        shiny=getSharedPreferences("prefs",0).getBoolean("shiny",false);
        if(!shiny)shinyVerified=false;
        update();
        return START_STICKY;
    }
    @Override public void onDestroy(){
        stopped=true;handler.removeCallbacksAndMessages(null);
        if(wm!=null&&root!=null){try{wm.removeView(root);}catch(Exception ignored){}}
        if(wm!=null&&menuRoot!=null){try{wm.removeView(menuRoot);}catch(Exception ignored){}}
        if(wm!=null&&detailRoot!=null){try{wm.removeView(detailRoot);}catch(Exception ignored){}}
        if(panel!=null){panel.removeJavascriptInterface("Native");panel.destroy();panel=null;}
        if(menuPanel!=null){menuPanel.removeJavascriptInterface("Native");menuPanel.destroy();menuPanel=null;}
        if(detailPanel!=null){detailPanel.removeJavascriptInterface("Native");detailPanel.destroy();detailPanel=null;}
        if(website!=null){website.destroy();website=null;}
        super.onDestroy();
    }
    @Override public IBinder onBind(Intent intent){return null;}
}

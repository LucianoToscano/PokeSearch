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
    private int dockDp(){return spriteSize+8;}
    private int menuDp(){return Math.max(1,Math.min(396,screenWidthDp()-8));}
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
    private boolean popupAbove=false;
    private int popupOffsetDp=-1,popupRoomDp=-1;
    private String probeScriptCache;
    private boolean searchInProgress=false;
    private boolean loginPaused=false;
    private boolean pickerOpen=false;
    private final Runnable queuedRefresh=()->refresh(false);
    private int pageLoadGeneration=-1;
    private int pendingPageRefreshGeneration=-1;
    private int pendingLoginRefreshGeneration=-1;
    private int pendingReloadGeneration=-1;
    private final Runnable pageFinishedRefresh=()->{
        if(!stopped&&!loginPaused&&pageLoadGeneration==requestGeneration&&
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
        handler.removeCallbacks(periodic);
        handler.removeCallbacks(expiryRefresh);
        handler.removeCallbacks(pageFinishedRefresh);
        handler.removeCallbacks(loginEndRefresh);
        handler.removeCallbacks(deferredSessionReload);
    }
    private static final long MIN_SEARCH_GAP_MS=60_000L;
    private long lastSearchStartMs=0L;
    private boolean shinyVerified=false;
    private boolean shinyLoginPromptRequested=false;
    private boolean shinyLoginWindowOpened=false;
    private boolean firstStart=true;
    private boolean locationEnabled=false;
    private String locationCoords="";
    private int locationRadius=0;
    private boolean locationEditorOpen=false;
    private boolean showTimers=false,alerts=false;
    private String alertsMode="off"; // off / on / silent, separate from favorite opt-in
    private String sort="site"; // Follow the ten results returned by the site, not an inverted local despawn sort.
    private long lastAlertAt=0L;
    private final java.util.Set<String> knownSpawns=new java.util.HashSet<>();
    private long armedDespawnMillis=0L;
    private final Runnable expiryRefresh=new Runnable(){
        @Override public void run(){
            armedDespawnMillis=0L;
            if(stopped||loginPaused||!loaded)return;
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
                // Expiration is a local UI event, never a reason to query the site.
                // Re-arm the next remaining deadline without changing AUTO cadence.
                armNextDespawn(active);
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
    private String mode="raw",results="[]",status="Conectando...";
    // Provenance of the last site-confirmed result set, not the pending filter.
    // Never relabel previous Pokémon with the new mode while validation fails.
    private String shownMode="raw",shownConfigJson="{}";
    private boolean shownShiny=false,resultsStale=false;
    // Independent parameters remain intact when switching between search modes.
    private int rawAttack=15,rawDefense=15,rawStamina=15,glRank=1,ulRank=1,ivPercentMin=0,ivPercentMax=100;
    // Additional optional search criteria belong to the active site session, not to the toolbar.
    private String extraFiltersJson="{}";
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
        // Compact vertical rhythm: real sprites have transparent margins.
        // The old +10dp gap was visually excessive; allow 4dp transparent
        // edge overlap without changing the sprite image dimensions.
        return Math.max(26,spriteSize-8);
    }
    private void update(){
        String data="window.onNativeData("+results+","+JSONObject.quote(status)+","+
                JSONObject.quote(mode)+","+(shiny&&shinyVerified)+","+rowDp()+","+intervalMinutes+","+spriteSize+","+showTimers+",false,"+alerts+","+(WatchAlerts.watched(this).size()>0)+","+(shiny&&!shinyVerified)+","+Math.max(rowDp()*2,Math.min(rowDp()*8,screenHeightDp()-160))+","+locationEnabled+","+JSONObject.quote(locationEnabled?locationCoords:"")+","+locationRadius+","+JSONObject.quote(alertsMode)+","+filterConfigJson()+","+JSONObject.quote(shownMode)+","+shownConfigJson+","+shownShiny+","+resultsStale+")";
        js(panel,panelLoaded,data);
        js(menuPanel,menuLoaded,data);
        js(resultPanel,resultLoaded,data);
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
    private void searchFailure(String shortReason,String detail){
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
        boolean right=params.x+dp(dockDp())+width<=screen;
        boolean left=params.x-width>=0;
        int priorPad=menuPadDp;
        boolean priorLeft=menuLeft;
        int rowY;
        if(right||left){
            menuLeft=!right;
            menuParams.x=right?params.x+dp(dockDp()):params.x-width;
            rowY=params.y;
        }else{
            // Keep the one-row toolbar next to, never ON TOP of, the gear.
            menuLeft=params.x+dp(dockDp())/2>screen/2;
            menuParams.x=Math.max(0,Math.min(screen-width,
                params.x+dp(dockDp())/2-width/2));
            int below=params.y+dp(TOOLBAR_DP);
            int above=params.y-dp(MENU_BASE_DP);
            rowY=above>=0?above:below;
        }
        menuPadDp=0; // Results remain in their own separate native overlay.

        // The old resize/clamp moved the entire toolbar when a long numeric
        // picker opened. Preserve rowY and expand the touchable window ABOVE
        // or BELOW it without moving the row under the user's finger.
        int rowHeight=dp(MENU_BASE_DP);
        int requestedPopup=Math.max(0,menuParams.height-rowHeight);
        int roomAbove=Math.max(0,rowY);
        int roomBelow=Math.max(0,bottom-(rowY+rowHeight)-dp(5));
        boolean abovePopup=requestedPopup>roomBelow&&roomAbove>roomBelow;
        int available=abovePopup?roomAbove:roomBelow;
        int actualPopup=Math.min(requestedPopup,available);
        menuParams.height=rowHeight+actualPopup;
        menuParams.y=Math.max(0,Math.min(bottom-menuParams.height,
            rowY-(abovePopup?actualPopup:0)));

        int offsetDp=abovePopup?Math.round(actualPopup/d.density):0;
        int roomDp=requestedPopup==0?420:Math.max(50,Math.round(actualPopup/d.density)-5);
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
        int maxMenuHeight=Math.max(MENU_BASE_DP,Math.min(450,screenHeightDp()-24));
        int target=dp(Math.max(MENU_BASE_DP,Math.min(maxMenuHeight,desiredDp)));
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
            if(menuPanel!=null){
                android.view.inputmethod.InputMethodManager keyboard=
                    (android.view.inputmethod.InputMethodManager)getSystemService(INPUT_METHOD_SERVICE);
                if(keyboard!=null)keyboard.hideSoftInputFromWindow(menuPanel.getWindowToken(),0);
                menuPanel.clearFocus();
            }
        }
        try{wm.updateViewLayout(menuRoot,menuParams);}catch(Exception e){recordFailure("atualizar menu",e);}
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
        int right=dockPos+dockDp()+gap;
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
                pageLoadGeneration=requestGeneration;
                pendingPageRefreshGeneration=-1;
                loaded=false;
                handler.removeCallbacks(pageFinishedRefresh);
            }
            @Override public void onPageFinished(WebView view,String url){
                if(view!=website||stopped||loginPaused||
                   pageLoadGeneration!=requestGeneration)return;
                if(url!=null&&url.startsWith("https://pogocoordinates.com/")){
                    loaded=true;
                    handler.removeCallbacks(pageFinishedRefresh);
                    pendingPageRefreshGeneration=pageLoadGeneration;
                    handler.postDelayed(pageFinishedRefresh,2500L);
                    if(shiny&&!shinyVerified){
                        // The site is visible to JS now. Confirm the Shiny state
                        // as soon as the tab is hydrated, not after a new Search.
                        final int generation=pageLoadGeneration;
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
                searchInProgress=false;
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
        menuParams=new WindowManager.LayoutParams(dp(menuDp()),dp(MENU_BASE_DP),
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
                            .putInt("resultsX",Math.round(resultParams.x/density))
                            .putInt("resultsY",Math.round(resultParams.y/density)).apply();
                    }
                    return true;
                case MotionEvent.ACTION_CANCEL:return true;
            }
            return true;
        });
        resultRoot.addView(resultGrip,new FrameLayout.LayoutParams(
            dp(35),dp(RESULTS_HEADER_DP),Gravity.TOP|Gravity.CENTER_HORIZONTAL));

        int preferredX=Math.max(0,screenWidthDp()-2*dockDp()-35);
        int preferredY=165;
        int savedX=prefs.getInt("resultsX",preferredX);
        int savedY=prefs.getInt("resultsY",preferredY);
        resultParams=new WindowManager.LayoutParams(dp(dockDp()),dp(RESULTS_HEADER_DP),
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT);
        resultParams.gravity=Gravity.TOP|Gravity.LEFT;
        resultParams.x=dp(Math.max(0,Math.min(screenWidthDp()-dockDp(),savedX)));
        resultParams.y=dp(Math.max(0,Math.min(screenHeightDp()-72,savedY)));
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
    private void updateResultsWidth(){
        if(resultParams==null||resultRoot==null)return;
        resultParams.width=dp(dockDp());
        resultParams.x=Math.max(0,Math.min(metrics().widthPixels-resultParams.width,resultParams.x));
        if(resultGrip!=null)resultGrip.setLayoutParams(new FrameLayout.LayoutParams(
            dp(35),dp(RESULTS_HEADER_DP),Gravity.TOP|Gravity.CENTER_HORIZONTAL));
        try{wm.updateViewLayout(resultRoot,resultParams);}
        catch(Exception e){recordFailure("redimensionar largura dos resultados",e);}
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
                .replace("__SHINY__",shiny?"true":"false")
                .replace("__FILTERS__",filterConfigJson());
        try{website.evaluateJavascript(code,raw->{
            if(stopped||loginPaused||callbackGeneration!=requestGeneration)return;
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
            if(stopped||loginPaused||callbackGeneration!=requestGeneration)return;
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
            if(manual)status("Busca em andamento. Toque ↻ novamente quando terminar.");
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
            if(manual)android.widget.Toast.makeText(this,"↻ Nova busca em "+remaining+"s",android.widget.Toast.LENGTH_SHORT).show();
            status("Próxima busca em "+remaining+"s · mantendo "+mode.toUpperCase(java.util.Locale.ROOT)
                +(shiny?" com ✨":" sem ✨")+".");
            handler.removeCallbacks(queuedRefresh);
            handler.postDelayed(queuedRefresh,remaining*1000L+300L);
            return;
        }
        handler.removeCallbacks(queuedRefresh);
        BugReport.log(this,"PREPARE","Filtros "+mode+" Shiny="+shiny+" manual="+manual);
        // Preserve the despawn cleanup timer while the network search is pending.
        searchInProgress=true;
        if(count()>0)resultsStale=true;
        if(shiny){shinyVerified=false;update();}
        final int generation=++requestGeneration;
        status(manual?"Busca manual iniciada...":"Atualizando...");
        execute("session",session->{
            if(stopped||loginPaused||generation!=requestGeneration)return;
            final String auth=session.optString("auth","não confirmado");
            getSharedPreferences("prefs",0).edit().putString("sessionStatus",auth).apply();
            // Only record a coarse authentication state, never cookies, codes or tokens.
            BugReport.log(this,"SESSION","Shiny="+shiny+" autenticação="+auth);
            if(shiny&&auth.equals("login necessário")){
                searchInProgress=false;
                diagnosticError("✨ Faça login e vincule seu código de amizade no PoGoCoordinates.");
                if(shinyLoginPromptRequested)openShinyLogin();
                return;
            }
            execute("prepareSearch",prepared->{
                if(stopped||loginPaused||generation!=requestGeneration)return;
                if(!prepared.optBoolean("ok")){
                    searchInProgress=false;
                    searchFailure("⚠ Aba não confirmada","Não foi possível selecionar a aba de busca.");
                    return;
                }
                handler.postDelayed(()->{
                    if(stopped||loginPaused||generation!=requestGeneration)return;
                    execute("configureSearch",configured->{
                    if(stopped||loginPaused||generation!=requestGeneration)return;
                    if(!configured.optBoolean("ok")||!configured.optBoolean("configured",false)){
                        searchInProgress=false;
                        searchFailure("⚠ Filtro não aplicado","Falha nos controles IV/ranking. Verifique se a página carregou.");
                        return;
                    }
                    configureLocationAndVerify(generation,manual,0);
                    });
                },600L);
            });
        });
    }
    private void configureLocationAndVerify(int generation,boolean manual,int attempt){
        String data=locationPayload();
        execute("configureLocation:"+data,configured->{
            if(stopped||loginPaused||generation!=requestGeneration)return;
            if(!configured.optBoolean("ok")){
                if(attempt<2){
                    handler.postDelayed(()->{
                        if(stopped||loginPaused||generation!=requestGeneration)return;
                        configureLocationAndVerify(generation,manual,attempt+1);
                    },450L);
                    return;
                }
                searchInProgress=false;
                searchFailure("⚠ Localização não aplicada","Não foi possível configurar localização: "+
                    configured.optString("reason","verifique o formulário do site."));
                return;
            }
            handler.postDelayed(()->{
                if(stopped||loginPaused||generation!=requestGeneration)return;
                execute("verifyLocation:"+data,verified->{
                if(stopped||loginPaused||generation!=requestGeneration)return;
                if(!verified.optBoolean("ok")){
                    if(attempt<2){
                        configureLocationAndVerify(generation,manual,attempt+1);
                        return;
                    }
                    searchInProgress=false;
                    searchFailure("⚠ Localização não confirmada","Filtro de localização não confirmado. Pesquisa não enviada.");
                    return;
                }
                verifyAndSubmit(generation,manual,0);
                });
            },400L);
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
    // A ✨ tap must not wait for Pokémon search cooldown, polling or AUTO.
    // Only the site control is changed here; a subsequent search still respects
    // MIN_SEARCH_GAP_MS. All JS replies are guarded by requestGeneration.
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
        // Shiny lives in the visible Pokémon filter card. The old
        // prepareSearch ("Stats"/"PvP") could fail or switch tabs needlessly.
        // Clicking ✨ should control the switch on the CURRENT page directly.
        applyShinyOnSite(generation,0);
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
                        execute("configureSearch",ignored->{
                            if(stopped||loginPaused||generation!=requestGeneration)return;
                            verifyAndSubmit(generation,manual,attempt+1);
                        });
                        return;
                    }
                    searchInProgress=false;
                    shinyVerified=false;
                    searchFailure("⚠ Filtros não confirmados","Filtros IV/ligas não confirmados: "
                        +filters.optString("reason","verifique as opções no site."));
                    return;
                }
                shinyVerified=shiny;
                update();
                execute("submitSearch",submitted->{
                    if(stopped||loginPaused||generation!=requestGeneration)return;
                    if(!submitted.optBoolean("ok")){
                        searchInProgress=false;
                        shinyVerified=false;
                        searchFailure("⚠ Busca não enviada",submitted.optString("reason","Falha ao pressionar Search."));
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
            });
        },650L);
    }
    private void pollSearch(int generation,int attempt,boolean manual){
        handler.postDelayed(()->{
            if(stopped||loginPaused||generation!=requestGeneration)return;
            execute("collect",r->{
            if(stopped||loginPaused||generation!=requestGeneration)return;
            if(!r.optBoolean("ok")){
                searchInProgress=false;
                searchFailure("⚠ Falha na leitura","Falha na leitura dos resultados do site.");
                return;
            }
            if((shiny && (!r.has("siteShiny")||r.isNull("siteShiny")||
                !r.optBoolean("siteShiny",false))) ||
                (!shiny&&r.has("siteShiny")&&!r.isNull("siteShiny")&&r.optBoolean("siteShiny",false))){
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
                    "Busca ignorada: controles IV/ligas não confirmados ao ler resultados.");
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
            if(r.optBoolean("parseFailure",false)&&!r.optBoolean("loading",false)){
                searchInProgress=false;
                searchFailure("⚠ Leitura não confirmada","Leitura do site: "+onSite+" ocorrências exibidas, mas nenhum cartão foi reconhecido.");
                return;
            }
            if(found>0&&r.optJSONArray("cards")!=null&&r.optJSONArray("cards").length()==0){
                searchInProgress=false;
                searchFailure("⚠ IV/ranking não confirmado","Site retornou "+found+" Pokémon, mas nenhum comprovou os IVs/ranking esperados.");
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
            if(secs<=0||secs>86400)return Long.MAX_VALUE;
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
        if("iv".equals(mode))
            return "15/15/15".equals(card.optString("iv","")) ||
                "100".equals(card.optString("ivPercent",""));
        if("raw".equals(mode)){
            String iv=card.optString("iv","");
            return iv.isEmpty()||(rawAttack+"/"+rawDefense+"/"+rawStamina).equals(iv);
        }
        if("percent".equals(mode)){
            String pct=card.optString("ivPercent","");
            if(pct.isEmpty())return true; // Filter itself is verified in probe.js.
            try{int v=Integer.parseInt(pct);return v>=ivPercentMin&&v<=ivPercentMax;}
            catch(NumberFormatException ignored){return false;}
        }
        if("gl".equals(mode)||"ul".equals(mode)){
            int max="ul".equals(mode)?ulRank:glRank;
            int shown=rankForSort(card);
            return (shown>=1&&shown<=max) ||
                ("verified-site-filter".equals(card.optString("rankSource",""))&&shown==999999);
        }
        return false;
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
            if(watchedCount>1)watchDetails+=" · +"+(watchedCount-1)+" Pokémon da lista";
            boolean sent=WatchAlerts.match(this,firstWatched,watchDetails);
            if(!sent&&!WatchAlerts.permissionGranted(this))
                preferences.edit().putString("lastWatchAlertError",
                    "Permissão de notificações não concedida").apply();
        }
        if(!"off".equals(alertsMode)&&alerts&&!firstNew.isEmpty()&&now-lastAlertAt>60000L){
            lastAlertAt=now;
            NotificationManager nm=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
            if(nm!=null){
                boolean quiet="silent".equals(alertsMode);
                String channelId=quiet?"pokesearch_alerts_silent_v1":"pokesearch_alerts";
                NotificationChannel alertChannel=new NotificationChannel(channelId,
                    quiet?"Novos Pokémon · silencioso":"Novos Pokémon encontrados",
                    quiet?NotificationManager.IMPORTANCE_LOW:NotificationManager.IMPORTANCE_DEFAULT);
                if(quiet)alertChannel.setSound(null,null);
                nm.createNotificationChannel(alertChannel);
                Notification note=new Notification.Builder(this,channelId)
                    .setSmallIcon(R.drawable.ic_notification)
                    .setContentTitle("Novo Pokémon: "+firstNew)
                    .setContentText("Encontrado na busca "+mode.toUpperCase(java.util.Locale.ROOT))
                    .setAutoCancel(true).build();
                try{nm.notify(74,note);}catch(Exception e){recordFailure("notificação geral",e);}
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
            }catch(Exception e){recordFailure("marcar despawn",e);}
        }
        JSONArray sorted=sortItems(items);
        recordNewResults(sorted,r.optBoolean("leagueConfirmed",false));
        results=sorted.toString();
        shownMode=mode;shownConfigJson=filterConfigJson();
        shownShiny=shiny&&shinyVerified;resultsStale=false;
        searchInProgress=false;
        armNextDespawn(sorted);
        if(selected>=0)hideDetails();
        getSharedPreferences("prefs",0).edit()
            .putLong("lastSearchAt",now).putString("lastError","Nenhum").apply();
        if(r.optBoolean("uncertain"))
            status(("raw".equals(mode)||"percent".equals(mode)||"iv".equals(mode))
                ?"Alguns IVs não confirmados.":"Alguns rankings PvP não confirmados.");
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
        int max=Math.max(RESULTS_HEADER_DP,screenHeightDp()-72);
        int desired=resultCollapsed?RESULTS_HEADER_DP:
            Math.max(RESULTS_HEADER_DP,Math.min(max,desiredDp));
        int pixels=dp(desired);
        if(Math.abs(resultParams.height-pixels)<dp(2))return;
        resultParams.height=pixels;
        resultParams.y=Math.max(0,Math.min(metrics().heightPixels-pixels,resultParams.y));
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
        if(resultCollapsed){
            hideDetails();
            resizeResults(RESULTS_HEADER_DP);
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
            if(menuParams!=null){menuParams.width=dp(menuDp());menuParams.height=dp(MENU_BASE_DP);popupOffsetDp=-1;popupRoomDp=-1;}
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
        }catch(Exception e){recordFailure("mostrar detalhes",e);hideDetails();}
    }
    private void hideDetails(){
        selected=-1;
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
                if(Math.abs(lat)<=90&&Math.abs(lon)<=180)return m.group(1)+","+m.group(2);
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
        @JavascriptInterface public void requestFilterOptions(){handler.post(()->{
            if(stopped||loginPaused||searchInProgress)return;
            execute("describeFilters",found->{
                if(stopped||menuPanel==null||!menuLoaded)return;
                js(menuPanel,true,"window.onFilterOptions("+found.toString()+")");
            });
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
                       !value.isEmpty()&&!value.matches("[0-9]{1,2}(\\\\.[0-9])?"))return;
                    extra.put(key,value);
                }
                for(String[] pair:new String[][]{{"cpMin","cpMax"},{"levelMin","levelMax"}}){
                    String low=extra.optString(pair[0]),high=extra.optString(pair[1]);
                    if(!low.isEmpty()&&!high.isEmpty()&&Double.parseDouble(low)>Double.parseDouble(high))return;
                }
                extra.put("includePreviousEvolutions",input.optBoolean("includePreviousEvolutions",true));
                String updatedExtras=extra.toString();
                if(mode.equals(nextMode)&&rawAttack==a&&rawDefense==d&&rawStamina==st&&
                    glRank==gl&&ulRank==ul&&ivPercentMin==min&&ivPercentMax==max&&
                    extraFiltersJson.equals(updatedExtras))return;
                mode=nextMode;rawAttack=a;rawDefense=d;rawStamina=st;
                glRank=gl;ulRank=ul;ivPercentMin=min;ivPercentMax=max;
                extraFiltersJson=updatedExtras;
                getSharedPreferences("prefs",0).edit()
                    .putString("mode",mode).putInt("rawAttack",a).putInt("rawDefense",d)
                    .putInt("rawStamina",st).putInt("glRank",gl).putInt("ulRank",ul)
                    .putInt("ivPercentMin",min).putInt("ivPercentMax",max)
                    .putString("extraFiltersJson",extraFiltersJson).apply();
                ++requestGeneration;searchInProgress=false;shinyVerified=false;
                // Keep site-confirmed cards with their original mode/icon
                // until the new search passes all checks and returns valid cards.
                resultsStale=count()>0;hideDetails();update();refresh();
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
            ++requestGeneration;searchInProgress=false;shinyVerified=false;
            resultsStale=count()>0;hideDetails();update();refresh();
        });}
        @JavascriptInterface public void menu(boolean open){handler.post(()->OverlayService.this.menu(open));}
        @JavascriptInterface public void cycleMode(){handler.post(()->{
            mode=mode.equals("raw")?"percent":mode.equals("percent")?"gl":mode.equals("gl")?"ul":"raw";
            getSharedPreferences("prefs",0).edit().putString("mode",mode).apply();
            ++requestGeneration;searchInProgress=false;shinyVerified=false;
            resultsStale=count()>0;hideDetails();update();refresh();
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
                    dp(minimized?BUBBLE_DP:dockDp()),dp(minimized?BUBBLE_DP:30),
                    Gravity.TOP|Gravity.LEFT));
                updateWindow();
                updateResultsWidth();
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
            if(minutes!=0&&minutes!=5&&minutes!=10&&minutes!=15&&minutes!=20)return;
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
            int[] options={0,5,10,15,20};
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
            final int generation=++requestGeneration;
            searchInProgress=false;
            handler.removeCallbacks(queuedRefresh);
            shinyVerified=false;
            shinyLoginWindowOpened=false;
            shinyLoginPromptRequested=shiny;
            // Keep existing results visible while the new site state is pending.
            status(shiny?"✨ Verificando acesso ao Shiny...":"✨ Desativando Shiny no site...");
            if(shiny){
                String cachedAuth=prefs.getString("sessionStatus","não confirmado");
                if(!loaded&&("login necessário".equals(cachedAuth)||"desconectado".equals(cachedAuth))){
                    status("✨ Faça login para ativar Shiny.");
                    openShinyLogin();
                    return;
                }
            }
            if(!loaded||website==null){
                if(shiny){
                    status("✨ Abrindo login; pesquisa ainda não carregada.");
                    openShinyLogin();
                }else status("✨ Shiny desligado; sincronização no próximo carregamento.");
                return;
            }
            if(!shiny){
                // OFF never requires signing in and never waits for Search cooldown.
                prepareImmediateShiny(generation);
                return;
            }
            execute("session",session->{
                if(stopped||loginPaused||generation!=requestGeneration)return;
                String auth=session.optString("auth","não confirmado");
                prefs.edit().putString("sessionStatus",auth).apply();
                if("login necessário".equals(auth)){
                    status("✨ Faça login para ativar Shiny.");
                    openShinyLogin();
                    return;
                }
                // Auth can be 'não confirmado' on a partially hydrated page;
                // attempt the switch, then prompt only if the control is absent.
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
        alerts=prefs.getBoolean("alerts",false);
        alertsMode=prefs.getString("alertsMode",alerts?"on":"off");
        if(!"on".equals(alertsMode)&&!"silent".equals(alertsMode))alertsMode="off";
        alerts=!"off".equals(alertsMode);
        String wantedSort=prefs.getString("sort","despawn");
        sort=("rank".equals(wantedSort)||"iv".equals(wantedSort)||
              "shiny".equals(wantedSort))?wantedSort:"despawn";
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
        if("com.lucianotoscano.pokesearchoverlay.LOGIN_BEGIN".equals(action)){
            loginPaused=true;
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
            if(!stopped&&!loginPaused&&!pickerOpen)
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
            ++requestGeneration;
            searchInProgress=false;
            shinyVerified=false;
            loaded=false;
            pageLoadGeneration=-1;
            pendingPageRefreshGeneration=-1;
            pendingLoginRefreshGeneration=-1;
            cancelSessionCallbacks();
            if(!initialStart){results="[]";hideDetails();status("Atualizando sessão após login...");}
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
        if(intervalMinutes!=0&&intervalMinutes!=5&&intervalMinutes!=10&&
           intervalMinutes!=15&&intervalMinutes!=20)intervalMinutes=5;
        schedulePeriodic();
        spriteSize=pref.getInt("spriteSize",45);
        if(spriteSize!=35&&spriteSize!=45&&spriteSize!=55)spriteSize=45;
        showTimers=pref.getBoolean("showTimers",false);
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

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
    private int spriteSize=45;
    private int dockDp(){return spriteSize+8;}
    private boolean menuVertical=true,menuChoicesOpen=false,menuShowText=true;
    private final FrameLayout[] groupRoots=new FrameLayout[2];
    private final WebView[] groupPanels=new WebView[2];
    private final WindowManager.LayoutParams[] groupParams=new WindowManager.LayoutParams[2];
    private final boolean[] groupLoaded=new boolean[2];
    private boolean showLevel=false,showCp=false,showIv=false,showSpawnCount=true;
    private static final int GROUP_WIDTH_DP=100;
    private int resultWidthDp(){
        int sprite=getSharedPreferences("prefs",0).getInt("spriteSize",45);
        boolean horizontal="horizontal".equals(
            getSharedPreferences("prefs",0).getString("resultsOrientation","vertical"));
        int width=horizontal?Math.min(320,Math.max(130,sprite*3+40)):Math.max(82,sprite+44);
        return Math.min(width,screenWidthDp()-12);
    }
    private void loadDisplayPreferences(android.content.SharedPreferences pref){
        showTimers=pref.getBoolean("showTimers",true);
        showLevel=pref.getBoolean("showLevel",false);
        showCp=pref.getBoolean("showCp",false);
        showIv=pref.getBoolean("showIv",false);
        showSpawnCount=pref.getBoolean("showSpawnCount",true);
    }
    private void updateGroupWindows(){
        JSONArray profiles=getSearchProfiles();
        for(int i=0;i<2;i++){
            if(groupRoots[i]==null)continue;
            JSONObject p=profiles.optJSONObject(i);
            boolean enabled=!stopped&&!loginPaused&&!pickerOpen&&multiEnabled()
                &&p!=null&&p.optBoolean("enabled",false);
            groupRoots[i].setVisibility(enabled?View.VISIBLE:View.GONE);
        }
    }
    private void resizeGroup(int i,int heightDp){
        if(i<0||i>=2||groupRoots[i]==null||groupParams[i]==null||wm==null)return;
        WindowManager.LayoutParams p=groupParams[i];
        int width=dp(resultWidthDp());
        if(p.width!=width){
            p.width=width;
            p.x=Math.max(0,Math.min(metrics().widthPixels-width,p.x));
        }
        int next=dp(Math.max(37,Math.min(Math.min(440,screenHeightDp()-65),heightDp)));
        if(Math.abs(p.height-next)<=dp(1))return;
        p.height=next;
        p.y=Math.max(0,Math.min(metrics().heightPixels-next,p.y));
        try{wm.updateViewLayout(groupRoots[i],p);}
        catch(Exception e){recordFailure("redimensionar camada "+i,e);}
    }
    private void createGroupWindows(){
        for(int i=0;i<2;i++)createGroupWindow(i);
        updateGroupWindows();
    }
    private void createGroupWindow(int i){
        FrameLayout frame=new FrameLayout(this);
        frame.setBackgroundColor(Color.TRANSPARENT);
        WebView web=new WebView(this);
        web.setBackgroundColor(Color.TRANSPARENT);
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setAllowContentAccess(false);
        web.getSettings().setAllowFileAccessFromFileURLs(false);
        web.getSettings().setAllowUniversalAccessFromFileURLs(false);
        web.addJavascriptInterface(new Bridge(),"Native");
        frame.addView(web,new FrameLayout.LayoutParams(-1,-1));
        android.content.SharedPreferences pref=getSharedPreferences("prefs",0);
        int defaultX=Math.max(0,screenWidthDp()-resultWidthDp()-64-(i%2)*108);
        int defaultY=190+i*122;
        WindowManager.LayoutParams p=new WindowManager.LayoutParams(
            dp(resultWidthDp()),dp(56),WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT);
        p.gravity=Gravity.TOP|Gravity.LEFT;
        p.x=dp(Math.max(0,Math.min(screenWidthDp()-resultWidthDp(),
            pref.getInt("layerX"+i,defaultX))));
        p.y=dp(Math.max(0,Math.min(screenHeightDp()-60,
            pref.getInt("layerY"+i,defaultY))));
        groupRoots[i]=frame;groupPanels[i]=web;groupParams[i]=p;
        View handle=new View(this);handle.setBackgroundColor(Color.TRANSPARENT);
        final float[] touch={0,0};
        final int[] origin={0,0};
        handle.setOnTouchListener((v,event)->{
            WindowManager.LayoutParams coords=groupParams[i];
            if(coords==null)return true;
            switch(event.getActionMasked()){
              case MotionEvent.ACTION_DOWN:
                touch[0]=event.getRawX();touch[1]=event.getRawY();
                origin[0]=coords.x;origin[1]=coords.y;return true;
              case MotionEvent.ACTION_MOVE:
                coords.x=Math.max(0,Math.min(metrics().widthPixels-coords.width,
                    origin[0]+Math.round(event.getRawX()-touch[0])));
                coords.y=Math.max(0,Math.min(metrics().heightPixels-coords.height,
                    origin[1]+Math.round(event.getRawY()-touch[1])));
                try{wm.updateViewLayout(frame,coords);moveDetail();}
                catch(Exception e){recordFailure("mover camada "+i,e);}
                return true;
              case MotionEvent.ACTION_UP:
              case MotionEvent.ACTION_CANCEL:
                getSharedPreferences("prefs",0).edit()
                    .putInt("layerX"+i,Math.round(coords.x/getResources().getDisplayMetrics().density))
                    .putInt("layerY"+i,Math.round(coords.y/getResources().getDisplayMetrics().density)).apply();
                return true;
            }
            return true;
        });
        frame.addView(handle,new FrameLayout.LayoutParams(dp(24),dp(29),Gravity.TOP|Gravity.LEFT));
        frame.setVisibility(View.GONE);
        try{wm.addView(frame,p);}
        catch(Exception e){recordFailure("abrir camada "+i,e);groupRoots[i]=null;groupPanels[i]=null;groupParams[i]=null;return;}
        web.setWebViewClient(new WebViewClient(){
            @Override public void onPageFinished(WebView view,String url){
                if(url!=null&&url.startsWith("file:///android_asset/")){
                    groupLoaded[i]=true;update();
                }
            }
        });
        web.loadUrl("file:///android_asset/dock.html?group="+i);
    }
    private boolean multiCycleActive=false;
    private int profileIndex=-1,lastProfileSearched=-1;
    private String previousMode="iv";
    private final java.util.ArrayList<Integer> profileQueue=new java.util.ArrayList<>();
    private final java.util.HashMap<Integer,JSONArray> profileCache=new java.util.HashMap<>();
    private JSONArray getSearchProfiles(){
        try{return new JSONArray(getSharedPreferences("prefs",0).getString("searchProfiles","[]"));}
        catch(Exception e){recordFailure("carregar pesquisas",e);return new JSONArray();}
    }
    private boolean multiEnabled(){
        return getSharedPreferences("prefs",0).getBoolean("multiEnabled",false)
            &&getSearchProfiles().length()>0;
    }
    private JSONObject currentProfile(){
        return profileIndex<0?null:getSearchProfiles().optJSONObject(profileIndex);
    }
    private void beginProfileCycle(boolean manual){
        if(multiCycleActive||searchInProgress)return;
        JSONArray profiles=getSearchProfiles();
        profileQueue.clear();
        for(int i=0;i<Math.min(2,profiles.length());i++){
            JSONObject p=profiles.optJSONObject(i);
            if(p!=null&&p.optBoolean("enabled",false)){
                String chosen=p.optString("mode","");
                if("iv".equals(chosen)||"gl".equals(chosen)||"ul".equals(chosen))
                    profileQueue.add(i);
            }
        }
        if(profileQueue.isEmpty()){
            status("Ative pelo menos uma das duas pesquisas.");
            return;
        }
        previousMode=mode;
        multiCycleActive=true;
        profileCache.clear();
        runNextProfile(manual);
    }
    private void runNextProfile(boolean manual){
        if(stopped||loginPaused){multiCycleActive=false;return;}
        if(profileQueue.isEmpty()){
            multiCycleActive=false;profileIndex=-1;mode=previousMode;
            status("Duas pesquisas concluídas · listas independentes.");
            return;
        }
        profileIndex=profileQueue.remove(0);
        JSONObject p=currentProfile();
        if(p==null){runNextProfile(manual);return;}
        mode=p.optString("mode","iv");
        searchInProgress=false;
        status("Pesquisando lista "+(profileIndex+1)+" de até 2 · "+mode.toUpperCase(java.util.Locale.ROOT));
        refreshSingle(manual);
    }
    private void finishProfileCycleStep(JSONObject r,JSONArray sorted){
        profileCache.put(profileIndex,sorted);
        lastProfileSearched=profileIndex;
        JSONArray merged=new JSONArray();
        JSONArray allProfiles=getSearchProfiles();
        for(int i=0;i<Math.min(2,allProfiles.length());i++){
            JSONObject profile=allProfiles.optJSONObject(i);
            if(profile==null||!profile.optBoolean("enabled",false))continue;
            JSONArray stored=profileCache.get(i);
            if(stored==null)continue;
            for(int j=0;j<stored.length();j++){
                JSONObject card=stored.optJSONObject(j);
                if(card==null)continue;
                try{
                    JSONObject copied=new JSONObject(card.toString());
                    int siteIndex=copied.optInt("sourceIndex",-1);
                    copied.put("siteSourceIndex",siteIndex);
                    copied.put("sourceIndex",i*100+Math.max(0,siteIndex));
                    copied.put("profileIndex",i);
                    copied.put("searchMode",profile.optString("mode","iv"));
                    copied.put("profileRankMax",profile.optInt("rankMax",1));
                    merged.put(copied);
                }catch(Exception e){recordFailure("identificar perfil",e);}
            }
        }
        results=merged.toString();
        armNextDespawn(merged);
        if(selected>=0)hideDetails();
        update();
        if(!profileQueue.isEmpty()){
            long wait=Math.max(850L,MIN_SEARCH_GAP_MS-
                (System.currentTimeMillis()-getSharedPreferences("prefs",0)
                    .getLong("lastNetworkSearchAt",0L))+300L);
            status("Lista "+(profileIndex+1)+" pronta. Próxima pesquisa em "+
                Math.max(1L,(wait+999L)/1000L)+"s.");
            handler.postDelayed(()->{if(multiCycleActive&&!stopped)runNextProfile(true);},wait);
        }else{
            multiCycleActive=false;
            profileIndex=-1;
            mode=previousMode;
            status("Buscas concluídas · "+merged.length()+" Pokémon em listas separadas");
        }
    }
    private String hiddenControls="";
    private int visibleControls=13;
    private int menuDp(){
        int wanted=menuVertical?(menuShowText?154:44):(menuShowText?screenWidthDp()-8:Math.max(35,30*visibleControls+4));
        if(menuChoicesOpen)wanted=Math.max(wanted,316);
        return Math.max(1,Math.min(wanted,screenWidthDp()-8));
    }
    private int menuBaseHeight(){return menuVertical?Math.min(440,Math.max(34,visibleControls*32)):MENU_BASE_DP;}
    private void loadMenuPreferences(android.content.SharedPreferences pref){
        String orientation=pref.getString("menuOrientation","vertical");
        menuVertical="vertical".equals(orientation);
        menuShowText=pref.getBoolean("menuShowText",true);
        hiddenControls=pref.getString("hiddenControls","");
        int count=0;
        String[] ids={"cycle","sh","period","manualRefresh","size","clock",
            "bell","star","location","filters","eye","report","donate","close"};
        for(String id:ids)if(!hiddenControls.contains("|"+id+"|"))count++;
        visibleControls=count;
    }
    private final Handler handler=new Handler(Looper.getMainLooper());
    private WindowManager wm;
    private WindowManager.LayoutParams params,detailParams,menuParams;
    private FrameLayout root,detailRoot,menuRoot;
    private View grip;
    private WebView panel,detailPanel,website,menuPanel;
    private boolean menuExpanded=false,menuLeft=false,minimized=false,shiny=false,loaded=false,panelLoaded=false,menuLoaded=false,detailLoaded=false,stopped=false;
    private int height=72,detailHeight=225,requestGeneration=0,selected=-1,intervalMinutes=5,menuPadDp=0;
    private boolean deferMenuSync=false;
    private int menuDrawX=Integer.MIN_VALUE,menuDrawY=Integer.MIN_VALUE,menuDrawHeight=-1,menuDrawWidth=-1;
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
    private String sort="despawn";
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
                // Refresh on the last despawn, never faster than three minutes.
                // Keep OFF mode strictly manual and avoid duplicated pending callbacks.
                if(active.length()==0&&old.length()>0&&intervalMinutes>0){
                    long last=getSharedPreferences("prefs",0)
                        .getLong("lastNetworkSearchAt",0L);
                    long wait=Math.max(0L,180000L-(now-last));
                    handler.removeCallbacks(queuedRefresh);
                    handler.postDelayed(queuedRefresh,wait);
                }
                // Also re-arm the deadline of any remaining spawn.
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
    private String mode="iv",results="[]",status="Conectando...";
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
    private JSONObject searchOptionsJson(){
        android.content.SharedPreferences pref=getSharedPreferences("prefs",0);
        JSONObject options=new JSONObject();
        try{
            options.put("rankMax",Math.max(1,Math.min(200,pref.getInt("rankMax",1))));
            options.put("customIvEnabled",pref.getBoolean("customIvEnabled",false));
            options.put("ivA",pref.getInt("customIvAttack",0));
            options.put("ivD",pref.getInt("customIvDefense",15));
            options.put("ivH",pref.getInt("customIvHp",15));
            options.put("showRanks",pref.getBoolean("showRanks",true));
            options.put("ivFilter",pref.getString("ivFilter","raw"));
            options.put("ivMin",pref.getInt("ivMin",100));
            options.put("ivMax",pref.getInt("ivMax",100));
            options.put("sort",pref.getString("sort","despawn"));
            for(String key:new String[]{"cpMin","cpMax","levelMin","levelMax",
                    "weather","size","form","gender"})
                options.put(key,pref.getString(key,""));
            JSONObject profile=currentProfile();
            if(profile!=null){
                options.put("rankMax",Math.max(1,Math.min(200,profile.optInt("rankMax",1))));
                options.put("customIvEnabled",profile.optBoolean("customIvEnabled",false));
                options.put("ivA",profile.optInt("ivA",15));
                options.put("ivD",profile.optInt("ivD",15));
                options.put("ivH",profile.optInt("ivH",15));
                if(profile.has("ivFilter"))options.put("ivFilter",profile.optString("ivFilter","raw"));
                if(profile.has("ivMin"))options.put("ivMin",profile.optInt("ivMin",100));
                if(profile.has("ivMax"))options.put("ivMax",profile.optInt("ivMax",100));
            }
        }catch(Exception e){recordFailure("serializar filtros",e);}
        return options;
    }
    private void update(){
        String data="window.onNativeData("+results+","+JSONObject.quote(status)+","+
                JSONObject.quote(mode)+","+(shiny&&shinyVerified)+","+rowDp()+","+intervalMinutes+","+spriteSize+","+showTimers+",false,"+alerts+","+(WatchAlerts.watched(this).size()>0)+","+(shiny&&!shinyVerified)+","+Math.max(rowDp()*2,Math.min(rowDp()*8,screenHeightDp()-160))+","+locationEnabled+","+JSONObject.quote(locationEnabled?locationCoords:"")+","+locationRadius+","+JSONObject.quote(alertsMode)+","+
                JSONObject.quote(hiddenControls)+","+JSONObject.quote(menuVertical?"vertical":"horizontal")+","+
                getSharedPreferences("prefs",0).getBoolean("showRanks",true)+","+
                Math.max(1,Math.min(200,getSharedPreferences("prefs",0).getInt("rankMax",1)))+","+
                getSharedPreferences("prefs",0).getBoolean("customIvEnabled",false)+","+
                JSONObject.quote(getSharedPreferences("prefs",0).getInt("customIvAttack",0)+"/"+
                    getSharedPreferences("prefs",0).getInt("customIvDefense",15)+"/"+
                    getSharedPreferences("prefs",0).getInt("customIvHp",15))+","+
                searchOptionsJson().toString()+","+
                multiEnabled()+","+getSearchProfiles().toString()+","+
                menuShowText+","+showLevel+","+showCp+","+showIv+","+showSpawnCount+","+
                JSONObject.quote(getSharedPreferences("prefs",0).getString("resultsOrientation","vertical"))+","+
                Math.max(0,Math.min(100,getSharedPreferences("prefs",0).getInt("resultsBackground",12)))+","+
                JSONObject.quote(getSharedPreferences("prefs",0).getString("menuOrder",""))+")";
        js(panel,panelLoaded,data);
        js(menuPanel,menuLoaded,data);
        for(int i=0;i<2;i++)js(groupPanels[i],groupLoaded[i],data);
        updateGroupWindows();
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
        if(multiCycleActive){
            final int failed=profileIndex;
            if(profileQueue.isEmpty()||s.contains("login")||s.contains("Shiny")){
                multiCycleActive=false;profileQueue.clear();profileIndex=-1;mode=previousMode;
                status("Pesquisa "+(failed+1)+" interrompida: "+s);
            }else{
                long wait=Math.max(850L,MIN_SEARCH_GAP_MS-
                    (System.currentTimeMillis()-getSharedPreferences("prefs",0)
                        .getLong("lastNetworkSearchAt",0L))+300L);
                status("Lista "+(failed+1)+" indisponível; próxima lista em "+
                    Math.max(1,(wait+999L)/1000L)+"s. "+s);
                handler.postDelayed(()->{
                    if(multiCycleActive&&!stopped&&!loginPaused)runNextProfile(true);
                },wait);
            }
        }else status(s);
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
        if(right||left){
            menuLeft=!right;
            menuParams.x=right?params.x+dp(dockDp()):params.x-width;
            menuParams.y=Math.max(0,Math.min(params.y,bottom-menuParams.height-dp(8)));
            menuPadDp=0; // No spacer: side toolbar does not cover the sprites.
        }else{
            // Narrow display: position toolbar above/below the gear instead of covering it.
            menuLeft=params.x+dp(dockDp())/2>screen/2;
            menuParams.x=Math.max(0,Math.min(screen-width,params.x+dp(dockDp())/2-width/2));
            int below=params.y+dp(TOOLBAR_DP);
            int above=params.y-menuParams.height;
            // On phones the single compact row fits above/below the gear.
            // the gear, so the gear and the Pokémon column stay close together.
            if(above<0){
                // Keep the gear and first sprite together. Reposition the
                // *whole* dock below the popover rather than inserting a huge
                // empty margin between the gear and the first Pokémon.
                int targetY=menuParams.height+dp(3);
                int bottomBound=bottom-params.height-dp(8);
                if(targetY<=bottomBound){
                    params.y=targetY;
                    try{wm.updateViewLayout(root,params);}
                    catch(Exception e){recordFailure("aproximar dock do menu",e);}
                    above=params.y-menuParams.height;
                }
            }
            if(above>=0){
                menuParams.y=above;
                menuPadDp=0;
            }else{
                menuParams.y=Math.max(0,Math.min(below,bottom-menuParams.height));
                // Only shift sprites if the controls genuinely occupy this space.
                // Reserve only the space really covered below the 30dp gear.
                // No 34dp phantom gap between menu and sprite column.
                menuPadDp=Math.max(0,
                    Math.round((menuParams.y+menuParams.height-params.y)/d.density)-30+2);
            }
        }
        if(menuDrawX!=menuParams.x||menuDrawY!=menuParams.y||
           menuDrawHeight!=menuParams.height||menuDrawWidth!=menuParams.width){
            try{
                wm.updateViewLayout(menuRoot,menuParams);
                menuDrawX=menuParams.x;menuDrawY=menuParams.y;
                menuDrawHeight=menuParams.height;menuDrawWidth=menuParams.width;
            }catch(Exception e){recordFailure("posicionar menu",e);}
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
        int maxMenuHeight=Math.max(MENU_BASE_DP,Math.min(450,screenHeightDp()-72));
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
        int dockPos=params.x/dp(1);
        int dockY=params.y/dp(1)+menuPadDp;
        if(multiEnabled()&&selected>=0){
            try{
                JSONObject item=new JSONArray(results).optJSONObject(selected);
                int group=item==null?-1:item.optInt("profileIndex",-1);
                if(group>=0&&group<3&&groupParams[group]!=null){
                    dockPos=Math.round(groupParams[group].x/getResources().getDisplayMetrics().density);
                    dockY=Math.round(groupParams[group].y/getResources().getDisplayMetrics().density);
                }
            }catch(Exception e){recordFailure("posicionar detalhes de perfil",e);}
        }
        int right=dockPos+dockDp()+gap;
        int left=dockPos-DETAIL_DP-gap;
        int preferred=right+DETAIL_DP<=w-4?right:left;
        detailParams.x=dp(Math.max(0,Math.min(w-DETAIL_DP,preferred)));
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
        menuParams=new WindowManager.LayoutParams(dp(menuDp()),dp(menuBaseHeight()),
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
                PixelFormat.TRANSLUCENT);
        menuParams.gravity=Gravity.TOP|Gravity.LEFT;
        menuParams.x=0;menuParams.y=params.y;
        menuRoot.setVisibility(View.GONE);
        try{wm.addView(menuRoot,menuParams);}catch(Exception e){recordFailure("abrir controles",e);menuRoot=null;menuPanel=null;}
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
        try{wm.addView(detailRoot,detailParams);}catch(Exception e){recordFailure("abrir detalhes",e);detailRoot=null;}
        panel.loadUrl("file:///android_asset/dock.html");
        if(detailRoot!=null)detailPanel.loadUrl("file:///android_asset/detail.html");
        createGroupWindows();
        // Initial navigation is scheduled after cookie flush in onStartCommand.
        running=true;
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
        JSONObject searchOptions=searchOptionsJson();
        String code=script().replace("__OPTIONS__",searchOptions.toString())
                .replace("__ACTION__",JSONObject.quote(action))
                .replace("__MODE__",JSONObject.quote(mode))
                .replace("__SHINY__",shiny?"true":"false");
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
        if(multiCycleActive)return; // Only the ordered profile scheduler advances this batch.
        if(multiEnabled()){
            beginProfileCycle(manual);return;
        }
        refreshSingle(manual);
    }
    private void refreshSingle(boolean manual){
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
                    diagnosticError("Não foi possível selecionar a aba de busca.");
                    return;
                }
                handler.postDelayed(()->{
                    if(stopped||loginPaused||generation!=requestGeneration)return;
                    execute("configureSearch",configured->{
                    if(stopped||loginPaused||generation!=requestGeneration)return;
                    if(!configured.optBoolean("ok")||!configured.optBoolean("configured",false)){
                        searchInProgress=false;
                        diagnosticError("Falha nos controles IV/R1. Verifique se a página de busca carregou.");
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
                diagnosticError("📍 Não foi possível configurar a localização: "+
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
                    diagnosticError("📍 Filtro de localização não confirmado. Pesquisa não enviada.");
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
                    diagnosticError("Filtros IV/ligas não confirmados: "
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
        java.util.Comparator<JSONObject> comparator;
        switch(sort){
            case "rank":
                comparator=(a1,a2)->Integer.compare(rankForSort(a1),rankForSort(a2));break;
            case "iv":
                comparator=(a1,a2)->Double.compare(a2.optDouble("ivPercent",0),a1.optDouble("ivPercent",0));break;
            case "cp":
                comparator=(a1,a2)->Integer.compare(a2.optInt("cp",0),a1.optInt("cp",0));break;
            case "level":
                comparator=(a1,a2)->Double.compare(a2.optDouble("level",0),a1.optDouble("level",0));break;
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
        android.content.SharedPreferences prefs=getSharedPreferences("prefs",0);
        JSONObject current=searchOptionsJson();
        if("iv".equals(mode)){
            if(current.optBoolean("customIvEnabled",false)){
                String target=current.optInt("ivA",0)+"/"+
                    current.optInt("ivD",15)+"/"+current.optInt("ivH",15);
                return target.equals(card.optString("iv",""));
            }
            return "15/15/15".equals(card.optString("iv","")) ||
                "100".equals(card.optString("ivPercent",""));
        }
        if("gl".equals(mode)||"ul".equals(mode)){
            int rank=rankForSort(card),limit=Math.max(1,Math.min(200,current.optInt("rankMax",1)));
            return rank<=limit||(rank==999999);
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
            }catch(Exception e){recordFailure("gravar histórico",e);}
        }
        if(!multiCycleActive)knownSpawns.clear();knownSpawns.addAll(current);
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
        searchInProgress=false;
        if(multiCycleActive&&profileIndex>=0){
            finishProfileCycleStep(r,sorted);
            return;
        }
        results=sorted.toString();
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
    private void setChoicesOpen(boolean value){
        if(!menuExpanded||menuParams==null)return;
        if(menuChoicesOpen==value)return;
        menuChoicesOpen=value;
        menuParams.width=dp(menuDp());
        menuDrawWidth=-1;
        updateWindow();
        moveDetail();
    }
    private void menu(boolean show){
        if(params==null||minimized)return;
        if(show==menuExpanded)return;
        if(!show&&locationEditorOpen)locationEditor(false);
        if(!show)menuChoicesOpen=false;
        menuExpanded=show;
        menuPadDp=0; // Only the measured overlap may shift the sprite list.
        if(show){
            menuDrawHeight=-1;menuDrawWidth=-1;
            if(menuRoot!=null)menuRoot.setVisibility(View.VISIBLE);
            if(menuParams!=null){menuParams.width=dp(menuDp());menuParams.height=dp(menuBaseHeight());}
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
        updateWindow();
    }
    private void showDetails(int index){
        if(detailRoot==null||detailPanel==null||!detailLoaded||minimized)return;
        try{
            JSONArray a=new JSONArray(results);
            if(index<0||index>=a.length()){hideDetails();return;}
            selected=index;
            JSONObject obj=a.getJSONObject(index);
            js(detailPanel,true,"window.showDetails("+obj.toString()+","+JSONObject.quote(obj.optString("searchMode",mode))+","+WatchAlerts.isWatched(this,obj.optString("name",""))+")");
            detailRoot.setVisibility(View.VISIBLE);
            moveDetail();
            js(panel,panelLoaded,"window.highlight("+index+")");
        for(int group=0;group<groupPanels.length;group++)
            js(groupPanels[group],groupLoaded[group],"window.highlight("+index+")");
        }catch(Exception e){recordFailure("mostrar detalhes",e);hideDetails();}
    }
    private void hideDetails(){
        selected=-1;
        if(detailRoot!=null)detailRoot.setVisibility(View.GONE);
        js(panel,panelLoaded,"window.highlight(-1)");
        for(int group=0;group<groupPanels.length;group++)
            js(groupPanels[group],groupLoaded[group],"window.highlight(-1)");
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
        @JavascriptInterface public void selectPreset(String choice){handler.post(()->{
            String next;
            if("gl".equals(choice)||"ul".equals(choice))next=choice;
            else if("iv100".equals(choice)||"iv0".equals(choice)||"custom".equals(choice))next="iv";
            else return;
            mode=next;
            android.content.SharedPreferences.Editor pref=getSharedPreferences("prefs",0)
                .edit().putString("mode",mode);
            if("iv100".equals(choice)){
                pref.putBoolean("customIvEnabled",false);
            }else if("iv0".equals(choice)){
                pref.putBoolean("customIvEnabled",true)
                    .putInt("customIvAttack",0).putInt("customIvDefense",0).putInt("customIvHp",0);
            }else if("custom".equals(choice))pref.putBoolean("customIvEnabled",true);
            pref.apply();
            ++requestGeneration;searchInProgress=false;shinyVerified=false;
            results="[]";hideDetails();update();
            OverlayService.this.refresh(true);
        });}
        @JavascriptInterface public void setMode(String s){select(s);}
        @JavascriptInterface public void select(String s){handler.post(()->{
            if(!s.equals("iv")&&!s.equals("gl")&&!s.equals("ul"))return;
            if(mode.equals(s))return;
            mode=s;getSharedPreferences("prefs",0).edit().putString("mode",s).apply();
            android.widget.Toast.makeText(OverlayService.this,
                "Filtro selecionado: "+(s.equals("iv")?"IV100":s.equals("gl")?"Grande Liga #1":"Ultra Liga #1"),
                android.widget.Toast.LENGTH_SHORT).show();
            ++requestGeneration;searchInProgress=false;shinyVerified=false;
            results="[]";hideDetails();update();refresh();
        });}
        @JavascriptInterface public void menu(boolean open){handler.post(()->OverlayService.this.menu(open));}
        @JavascriptInterface public void setModeFilter(String input){handler.post(()->{
            if(input==null||input.length()>450)return;
            try{
                JSONObject data=new JSONObject(input);
                String kind=data.optString("kind","");
                if(!"percent".equals(kind)&&!"raw".equals(kind)&&
                   !"gl".equals(kind)&&!"ul".equals(kind))return;
                int min=data.optInt("ivMin",0),max=data.optInt("ivMax",100);
                int a=data.optInt("ivA",-1),d=data.optInt("ivD",-1),h=data.optInt("ivH",-1);
                int rank=data.optInt("rankMax",1);
                if(min<0||max>100||min>max||a<0||a>15||d<0||d>15||
                    h<0||h>15||rank<1||rank>50)return;
                String next="gl".equals(kind)||"ul".equals(kind)?kind:"iv";
                android.content.SharedPreferences pref=getSharedPreferences("prefs",0);
                android.content.SharedPreferences.Editor e=pref.edit()
                    .putString("mode",next)
                    .putString("ivFilter",kind)
                    .putBoolean("customIvEnabled","raw".equals(kind))
                    .putInt("ivMin",min).putInt("ivMax",max)
                    .putInt("customIvAttack",a).putInt("customIvDefense",d)
                    .putInt("customIvHp",h).putInt("rankMax",rank);
                if(multiEnabled()){
                    JSONArray arr=getSearchProfiles();
                    JSONObject first=arr.optJSONObject(0);
                    if(first==null)first=new JSONObject();
                    first.put("enabled",true).put("mode",next).put("rankMax",rank)
                        .put("customIvEnabled","raw".equals(kind))
                        .put("ivA",a).put("ivD",d).put("ivH",h)
                        .put("ivMin",min).put("ivMax",max).put("ivFilter",kind);
                    arr.put(0,first);
                    e.putString("searchProfiles",arr.toString());
                }
                e.apply();
                mode=next;multiCycleActive=false;profileQueue.clear();profileIndex=-1;
                ++requestGeneration;searchInProgress=false;
                results="[]";hideDetails();update();OverlayService.this.refresh(true);
            }catch(Exception e){recordFailure("filtro de modo",e);}
        });}
        @JavascriptInterface public void setAlertsMode(String value){handler.post(()->{
            if(!"off".equals(value)&&!"silent".equals(value)&&!"on".equals(value))return;
            alertsMode=value;alerts=!"off".equals(value);
            getSharedPreferences("prefs",0).edit().putString("alertsMode",value)
                .putBoolean("alerts",alerts).apply();update();
        });}
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
                    dp(minimized?BUBBLE_DP:dockDp()),dp(minimized?BUBBLE_DP:30),
                    Gravity.TOP|Gravity.LEFT));
                updateWindow();
            }
            update();
            if(wasExpanded)menu(true);
            android.widget.Toast.makeText(OverlayService.this,
                new String[]{"P","M","G"}[(at+1)%sizes.length]+" · "+size+" × "+size,
                android.widget.Toast.LENGTH_SHORT).show();
        });}
        @JavascriptInterface public void setChoicesOpen(boolean open){
            handler.post(()->OverlayService.this.setChoicesOpen(open));
        }
        @JavascriptInterface public void setSearchProfiles(String value){handler.post(()->{
            if(value==null||value.length()>5200)return;
            try{
                JSONObject input=new JSONObject(value);
                boolean enabled=input.optBoolean("enabled",false);
                JSONArray profiles=input.optJSONArray("profiles");
                if(profiles==null||profiles.length()>2||profiles.length()<1)
                    throw new IllegalArgumentException("Quantidade de pesquisas");
                JSONArray safe=new JSONArray();
                for(int i=0;i<profiles.length();i++){
                    JSONObject p=profiles.optJSONObject(i);
                    if(p==null)throw new IllegalArgumentException("Perfil inválido");
                    String kind=p.optString("mode","iv");
                    if(!"iv".equals(kind)&&!"gl".equals(kind)&&!"ul".equals(kind))
                        throw new IllegalArgumentException("Modo inválido");
                    int rank=p.optInt("rankMax",1);
                    int a=p.optInt("ivA",15),d=p.optInt("ivD",15),h=p.optInt("ivH",15);
                    if(rank<1||rank>200||a<0||a>15||d<0||d>15||h<0||h>15)
                        throw new IllegalArgumentException("Ranking/IV inválidos");
                    JSONObject cleaned=new JSONObject();
                    cleaned.put("enabled",p.optBoolean("enabled",true));
                    cleaned.put("mode",kind);cleaned.put("rankMax",rank);
                    cleaned.put("customIvEnabled",p.optBoolean("customIvEnabled",false));
                    cleaned.put("ivA",a);cleaned.put("ivD",d);cleaned.put("ivH",h);
                    int min=p.optInt("ivMin",100),percentMax=p.optInt("ivMax",100);
                    if(min<0||percentMax>100||min>percentMax)throw new IllegalArgumentException("Porcentagem inválida");
                    cleaned.put("ivMin",min);cleaned.put("ivMax",percentMax);
                    cleaned.put("ivFilter",p.optString("ivFilter","raw"));
                    safe.put(cleaned);
                }
                getSharedPreferences("prefs",0).edit()
                    .putBoolean("multiEnabled",enabled)
                    .putString("searchProfiles",safe.toString()).apply();
                multiCycleActive=false;profileIndex=-1;profileQueue.clear();profileCache.clear();
                ++requestGeneration;searchInProgress=false;
                results="[]";hideDetails();update();
                if(enabled)beginProfileCycle(true);else OverlayService.this.refresh(true);
            }catch(Exception e){
                android.widget.Toast.makeText(OverlayService.this,
                   "Confira as duas abas e seus IVs",android.widget.Toast.LENGTH_LONG).show();
            }
        });}
        @JavascriptInterface public void setSearchOptions(String value){handler.post(()->{
            if(value==null||value.length()>3500)return;
            try{
                JSONObject json=new JSONObject(value);
                int max=json.optInt("rankMax",1);
                int attack=json.optInt("ivA",-1),defense=json.optInt("ivD",-1),hp=json.optInt("ivH",-1);
                if(max<1||max>200||attack<0||attack>15||defense<0||defense>15||hp<0||hp>15)
                    throw new IllegalArgumentException("IV/rank fora do limite");
                String[] numbers={"cpMin","cpMax","levelMin","levelMax"};
                String[] contents=new String[numbers.length];
                for(int i=0;i<numbers.length;i++){
                    String val=json.optString(numbers[i],"").trim();
                    if(!val.isEmpty()){
                        if(!val.matches(i<2?"\\d{1,5}":"\\d{1,3}(?:\\.\\d)?"))
                            throw new IllegalArgumentException("PC/Nível inválido");
                        double num=Double.parseDouble(val);
                        if(num<0||(i<2&&num>99999)||(i>=2&&num>100))
                            throw new IllegalArgumentException("PC/Nível fora do limite");
                    }
                    contents[i]=val;
                }
                for(int i=0;i<4;i+=2){
                    if(!contents[i].isEmpty()&&!contents[i+1].isEmpty()&&
                       Double.parseDouble(contents[i])>Double.parseDouble(contents[i+1]))
                        throw new IllegalArgumentException("Mínimo maior que máximo");
                }
                String[] keys={"weather","size","form","gender"};
                String[] extras=new String[keys.length];
                for(int i=0;i<keys.length;i++){
                    String val=json.optString(keys[i],"").trim();
                    if(val.length()>80||!val.matches("[A-Za-z0-9À-ÿ _,/\\-]*"))
                        throw new IllegalArgumentException("Filtro adicional inválido");
                    extras[i]=val;
                }
                String sorting=json.optString("sort","despawn");
                if(!java.util.Arrays.asList("despawn","rank","iv","cp","level","shiny").contains(sorting))
                    throw new IllegalArgumentException("Ordenação inválida");
                sort=sorting;
                android.content.SharedPreferences.Editor edit=
                    getSharedPreferences("prefs",0).edit()
                    .putString("sort",sorting)
                    .putInt("rankMax",max)
                    .putBoolean("customIvEnabled",json.optBoolean("customIvEnabled",false))
                    .putInt("customIvAttack",attack).putInt("customIvDefense",defense)
                    .putInt("customIvHp",hp)
                    .putBoolean("showRanks",json.optBoolean("showRanks",true));
                for(int i=0;i<numbers.length;i++)edit.putString(numbers[i],contents[i]);
                for(int i=0;i<keys.length;i++)edit.putString(keys[i],extras[i]);
                edit.apply();
                update();
                // Only explicit confirmation requests the next site search.
                multiCycleActive=false;profileQueue.clear();profileIndex=-1;
                ++requestGeneration;searchInProgress=false;
                results="[]";hideDetails();
                OverlayService.this.refresh(true);
                android.widget.Toast.makeText(OverlayService.this,
                    "Filtros atualizados",android.widget.Toast.LENGTH_SHORT).show();
            }catch(Exception e){
                android.widget.Toast.makeText(OverlayService.this,
                    "Confira valores de IV, Rank e demais filtros",android.widget.Toast.LENGTH_LONG).show();
            }
        });}
        @JavascriptInterface public void setToolbarText(boolean shown){handler.post(()->{
            boolean expanded=menuExpanded;
            if(expanded)menu(false);
            getSharedPreferences("prefs",0).edit().putBoolean("menuShowText",shown).apply();
            loadMenuPreferences(getSharedPreferences("prefs",0));
            update();
            if(expanded)menu(true);
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
            updateGroupWindows();
            if(menuRoot!=null)menuRoot.setVisibility(View.GONE);
            try{
                PokemonPicker.show(OverlayService.this,()->{
                    if(!stopped)update();
                },()->{
                    pickerOpen=false;
                    if(!stopped&&!loginPaused&&root!=null)root.setVisibility(View.VISIBLE);
                    if(!stopped&&!loginPaused&&menuExpanded&&menuRoot!=null)menuRoot.setVisibility(View.VISIBLE);
                    updateGroupWindows();
                    update();
                });
            }catch(Exception e){
                pickerOpen=false;
                if(root!=null&&!loginPaused)root.setVisibility(View.VISIBLE);
                if(menuRoot!=null&&!loginPaused&&menuExpanded)menuRoot.setVisibility(View.VISIBLE);
                updateGroupWindows();
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
            if(multiCycleActive){
                multiCycleActive=false;profileQueue.clear();profileIndex=-1;
                mode=previousMode;
            }
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
        @JavascriptInterface public void resizeMenu(int size){handler.post(()->OverlayService.this.resizeMenu(size));}
        @JavascriptInterface public void resizeGroup(int i,int size){handler.post(()->OverlayService.this.resizeGroup(i,size));}
        @JavascriptInterface public void setAppearanceOptions(String json){handler.post(()->{
            try{
                JSONObject o=new JSONObject(json);
                String menu=o.optString("menuOrientation","vertical");
                String results=o.optString("resultsOrientation","vertical");
                if(!"vertical".equals(menu)&&!"horizontal".equals(menu))return;
                if(!"vertical".equals(results)&&!"horizontal".equals(results))return;
                int background=o.optInt("resultsBackground",12);
                if(background<0||background>100)return;
                android.content.SharedPreferences prefs=getSharedPreferences("prefs",0);
                prefs.edit().putString("menuOrientation",menu)
                    .putString("resultsOrientation",results)
                    .putBoolean("menuShowText",o.optBoolean("menuShowText",true))
                    .putInt("resultsBackground",background).apply();
                loadMenuPreferences(prefs);
                boolean expanded=menuExpanded;
                if(expanded)menu(false);
                update();
                if(expanded)menu(true);
                for(int i=0;i<2;i++)if(groupRoots[i]!=null&&groupParams[i]!=null)
                    resizeGroup(i,Math.round(groupParams[i].height/getResources().getDisplayMetrics().density));
            }catch(Exception e){recordFailure("aparência",e);}
        });}
        @JavascriptInterface public void setDisplayOptions(String value){handler.post(()->{
            try{
                JSONObject obj=new JSONObject(value);
                android.content.SharedPreferences.Editor edit=getSharedPreferences("prefs",0).edit();
                for(String key:new String[]{"showTimers","showRanks","showLevel","showCp","showIv","showSpawnCount"})
                    if(obj.has(key))edit.putBoolean(key,obj.getBoolean(key));
                edit.apply();
                loadDisplayPreferences(getSharedPreferences("prefs",0));
                update();
            }catch(Exception e){recordFailure("indicadores do olho",e);}
        });}
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
        if(multiEnabled()&&chosen.optInt("profileIndex",-1)!=lastProfileSearched){
            deliverCoords("","Coordenadas deste grupo exigem reabrir sua busca; não são lidas de outra lista.");
            return;
        }
        JSONObject target=chosen;
        execute("coords:"+target.optInt("siteSourceIndex",sourceIndex),response->{
            if(!response.optBoolean("ok")){
                deliverCoords("",response.optString("status","Get coords indisponível"));return;
            }
            pollCoordinates(target,0,autoCopy);
        });
    }
    private void syncPreferencesWithoutSearch(){
        if(stopped)return;
        android.content.SharedPreferences prefs=getSharedPreferences("prefs",0);
        boolean oldVertical=menuVertical;
        String oldHidden=hiddenControls;
        boolean wasMenuOpen=menuExpanded;
        if(wasMenuOpen)menu(false);
        loadMenuPreferences(prefs);
        menuChoicesOpen=false;
        int wanted=prefs.getInt("spriteSize",45);
        spriteSize=(wanted==35||wanted==45||wanted==55)?wanted:45;
        loadDisplayPreferences(prefs);
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
            moveDetail();
        }
        update(); // Local UI only; does not call refresh or navigate the website.
        if(wasMenuOpen)menu(true);
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
            updateGroupWindows();
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
            updateGroupWindows();
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
        loadMenuPreferences(pref);
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
        if(intervalMinutes!=0&&intervalMinutes!=3&&intervalMinutes!=5&&intervalMinutes!=10&&
           intervalMinutes!=15&&intervalMinutes!=20)intervalMinutes=5;
        schedulePeriodic();
        spriteSize=pref.getInt("spriteSize",45);
        if(spriteSize!=35&&spriteSize!=45&&spriteSize!=55)spriteSize=45;
        loadDisplayPreferences(pref);
        alerts=pref.getBoolean("alerts",false);
        alertsMode=pref.getString("alertsMode",alerts?"on":"off");
        if(!"on".equals(alertsMode)&&!"silent".equals(alertsMode))alertsMode="off";
        alerts=!"off".equals(alertsMode);
        sort=pref.getString("sort","despawn");
        if(params!=null&&!menuExpanded){
            params.width=dp(minimized?BUBBLE_DP:dockDp());
            params.x=Math.min(params.x,metrics().widthPixels-params.width);
            grip.setLayoutParams(new FrameLayout.LayoutParams(
                dp(minimized?BUBBLE_DP:dockDp()),dp(minimized?BUBBLE_DP:30),Gravity.TOP|Gravity.LEFT));
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
        if(wm!=null&&detailRoot!=null){try{wm.removeView(detailRoot);}catch(Exception e){recordFailure("remover detalhes",e);}}
        for(int i=0;i<2;i++)if(wm!=null&&groupRoots[i]!=null)
            try{wm.removeView(groupRoots[i]);}
            catch(Exception e){recordFailure("remover camada "+i,e);}
        for(int i=0;i<2;i++){
            destroyWebView(groupPanels[i],true,"camada "+i);
            groupPanels[i]=null;groupRoots[i]=null;groupParams[i]=null;
        }
        destroyWebView(panel,true,"painel");panel=null;
        destroyWebView(menuPanel,true,"menu");menuPanel=null;
        destroyWebView(detailPanel,true,"detalhes");detailPanel=null;
        destroyWebView(website,false,"site");website=null;
        root=null;menuRoot=null;detailRoot=null;
        super.onDestroy();
    }
    @Override public IBinder onBind(Intent intent){return null;}
}

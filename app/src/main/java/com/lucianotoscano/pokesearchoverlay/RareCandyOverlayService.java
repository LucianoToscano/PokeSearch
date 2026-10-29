package com.lucianotoscano.pokesearchoverlay;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.ColorMatrix;
import android.graphics.ColorMatrixColorFilter;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.Settings;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * LT175: third, independent floating Rare Candy overlay, not a Pokémon result mode.
 * Source is the official PoGoCoordinates /search Rare Candy tab in a private
 * WebView. No direct backend, token copy, new privileges or fabricated spawns.
 * The installed site's actual coordinates and deadlines are authoritative.
 */
public final class RareCandyOverlayService extends Service {
    private static volatile boolean running=false;
    static boolean isRunning(){return running;}
    private static final String SOURCE="https://pogocoordinates.com/search?tab=rarecandy";
    // Same compact touch box as the Pokébola dock; candy artwork is smaller.
    private static final int BUBBLE_DP=45, CANDY_ART_DP=20;
    private final Handler main=new Handler(Looper.getMainLooper());
    private final Map<String,Candy> cards=new LinkedHashMap<>();
    private final Map<String,TextView> countdownLabels=new LinkedHashMap<>();
    private final Set<String> copied=new LinkedHashSet<>();
    private SharedPreferences prefs;
    private WindowManager wm;
    private FrameLayout bubbleWindow;
    private LinearLayout resultsShell,resultsList;
    private FrameLayout candyMenuRoot;
    private WebView candyMenuPanel;
    private boolean candyMenuVisible=false,candyMenuLoaded=false;
    private WindowManager.LayoutParams bubbleParams,resultsParams,menuParams;
    private WebView site;
    private Bitmap icon;
    private TextView status;
    private String probe="";
    private boolean visible=false,ready=false,destroyed=false,busy=false,showInfos=true;
    private boolean showName=false,showLocation=false,showDespawn=true,showDistance=false;
    private String coords="";
    private int radius=1000,period=1,generation=0;
    private long lastRefresh=0,blockedUntil=0;
    private boolean expirePending=false,pendingManualRefresh=false;
    private int lastAllCopiedRefreshGeneration=-1;

    private static final class Candy {
        String coords,city,distance;
        long deadline;
        Candy(String p,String c,String d,long end){
            coords=p;city=c;distance=d;deadline=end;
        }
    }
    private int dp(int n){return Math.round(getResources().getDisplayMetrics().density*n);}
    private GradientDrawable background(int color,int radius,int border){
        GradientDrawable g=new GradientDrawable();
        g.setColor(color);g.setCornerRadius(dp(radius));
        if(border!=0)g.setStroke(dp(1),border);
        return g;
    }
    private TextView label(String value,int size,int color,boolean bold){
        TextView t=new TextView(this);
        t.setText(value);t.setTextSize(size);t.setTextColor(color);
        t.setGravity(Gravity.CENTER_VERTICAL);
        if(bold)t.setTypeface(null,android.graphics.Typeface.BOLD);
        return t;
    }
    private LinearLayout.LayoutParams space(int width,int height,int top){
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(width<0?width:dp(width),
            height<0?height:dp(height));
        p.topMargin=dp(top);return p;
    }
    static Bitmap loadIcon(Context context){
        try(InputStream s=context.getAssets().open("rare_candy_icon.b64")){
            byte[] encoded=new byte[s.available()];
            int count=0;while(count<encoded.length){
                int n=s.read(encoded,count,encoded.length-count);
                if(n<0)break;count+=n;
            }
            byte[] data=android.util.Base64.decode(new String(encoded,0,count,
                StandardCharsets.US_ASCII),android.util.Base64.DEFAULT);
            return BitmapFactory.decodeByteArray(data,0,data.length);
        }catch(Exception ignored){return null;}
    }
    private ImageView sprite(int size,boolean dim){
        ImageView view=new ImageView(this);
        view.setScaleType(ImageView.ScaleType.FIT_CENTER);
        if(icon!=null)view.setImageBitmap(icon);
        else view.setImageResource(R.drawable.ic_notification);
        if(dim){
            ColorMatrix m=new ColorMatrix();m.setSaturation(0f);
            view.setColorFilter(new ColorMatrixColorFilter(m));view.setAlpha(.65f);
        }
        view.setContentDescription(dim?"Doce Raro · coordenadas já copiadas":
            "Doce Raro · toque para copiar coordenadas");
        return view;
    }
    @Override public void onCreate(){
        super.onCreate();
        if(Build.VERSION.SDK_INT>=23&&!Settings.canDrawOverlays(this)){
            stopSelf();return;
        }
        prefs=getSharedPreferences("rare_candy_overlay",MODE_PRIVATE);
        coords=prefs.getString("coords","");
        radius=Math.max(1,Math.min(1000000,prefs.getInt("radius",1000)));
        int saved=prefs.getInt("period",1);
        period=saved==3||saved==5?saved:1;
        // LT178: only despawn is enabled by default. Honor explicit choices
        // saved on older versions instead of resetting user preferences.
        showInfos=prefs.getBoolean("infos",false);
        showName=prefs.getBoolean("candyShowName",false);
        showLocation=prefs.getBoolean("candyShowLocation",false);
        showDespawn=prefs.getBoolean("candyShowDespawn",true);
        showDistance=prefs.getBoolean("candyShowDistance",false);
        try{
            JSONArray state=new JSONArray(prefs.getString("copied","[]"));
            for(int i=0;i<state.length()&&i<100;i++){
                String p=state.optString(i,"");
                if(validCoords(p))copied.add(p);
            }
        }catch(Exception ignored){}
        icon=loadIcon(this);
        running=true;
        NotificationManager manager=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
        manager.createNotificationChannel(new NotificationChannel("pokesearch",
            "PokeSearch",NotificationManager.IMPORTANCE_LOW));
        PendingIntent home=PendingIntent.getActivity(this,75,
            new Intent(this,MainActivity.class),
            PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
        Notification note=new Notification.Builder(this,"pokesearch")
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("PokeSearch · Doce Raro")
            .setContentText("Pesquisa flutuante independente")
            .setOngoing(true).setContentIntent(home).build();
        startForeground(75,note);
        wm=(WindowManager)getSystemService(WINDOW_SERVICE);
        createBubble();
        createResults();
        createCandyMenu();
        attachSource();
        main.post(tick);
    }
    private void createBubble(){
        bubbleWindow=new FrameLayout(this);
        // The candy has NO background. Only its transparent 45dp native hitbox
        // remains; the art itself matches the compact Pokébola result sprites.
        bubbleWindow.setBackgroundColor(Color.TRANSPARENT);
        bubbleWindow.setClipChildren(true);
        bubbleWindow.setClipToPadding(true);
        ImageView candy=sprite(CANDY_ART_DP,false);
        candy.setPadding(0,0,0,0);
        candy.setClickable(false);
        candy.setFocusable(false);
        bubbleWindow.addView(candy,new FrameLayout.LayoutParams(
            dp(CANDY_ART_DP),dp(CANDY_ART_DP),Gravity.CENTER));
        // An actual touch-grip ABOVE the hidden WebView, identical in principle
        // to OverlayService.grip. No underlying WebView can swallow drag/tap.
        View candyGrip=new View(this);
        candyGrip.setBackgroundColor(Color.TRANSPARENT);
        candyGrip.setClickable(true);
        candyGrip.setContentDescription("Doce Raro: toque para resultados; segure para menu; arraste para mover");
        candyGrip.setOnClickListener(v->toggleResults());
        bubbleWindow.addView(candyGrip,new FrameLayout.LayoutParams(-1,-1));
        bubbleParams=new WindowManager.LayoutParams(dp(BUBBLE_DP),dp(BUBBLE_DP),
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            android.graphics.PixelFormat.TRANSLUCENT);
        bubbleParams.gravity=Gravity.TOP|Gravity.LEFT;
        int screen=getResources().getDisplayMetrics().widthPixels;
        int height=getResources().getDisplayMetrics().heightPixels;
        bubbleParams.x=Math.max(0,Math.min(screen-dp(BUBBLE_DP),
            dp(prefs.getInt("x",88))));
        bubbleParams.y=Math.max(0,Math.min(height-dp(BUBBLE_DP),
            dp(prefs.getInt("y",240))));
        candyGrip.setOnTouchListener(new View.OnTouchListener(){
            float downX,downY;int startX,startY;boolean moved=false,held=false;
            final Runnable longPress=()->{
                if(destroyed||moved)return;
                held=true;
                toggleCandyMenu();
            };
            @Override public boolean onTouch(View view,MotionEvent event){
                switch(event.getActionMasked()){
                    case MotionEvent.ACTION_DOWN:
                        downX=event.getRawX();downY=event.getRawY();
                        startX=bubbleParams.x;startY=bubbleParams.y;
                        moved=false;held=false;
                        main.postDelayed(longPress,600);return true;
                    case MotionEvent.ACTION_MOVE:
                        int dx=Math.round(event.getRawX()-downX);
                        int dy=Math.round(event.getRawY()-downY);
                        if(Math.abs(dx)+Math.abs(dy)>dp(5)){
                            moved=true;main.removeCallbacks(longPress);
                        }
                        if(moved){
                            int w=getResources().getDisplayMetrics().widthPixels;
                            int h=getResources().getDisplayMetrics().heightPixels;
                            bubbleParams.x=Math.max(0,Math.min(w-dp(BUBBLE_DP),startX+dx));
                            bubbleParams.y=Math.max(0,Math.min(h-dp(BUBBLE_DP),startY+dy));
                            try{wm.updateViewLayout(bubbleWindow,bubbleParams);}
                            catch(Exception ignored){}
                            placeResults();
                            placeCandyMenu();
                        }
                        return true;
                    case MotionEvent.ACTION_CANCEL:
                        main.removeCallbacks(longPress);return true;
                    case MotionEvent.ACTION_UP:
                        main.removeCallbacks(longPress);
                        if(moved){
                            prefs.edit().putInt("x",Math.round(bubbleParams.x/
                                getResources().getDisplayMetrics().density))
                                .putInt("y",Math.round(bubbleParams.y/
                                getResources().getDisplayMetrics().density)).apply();
                        }else if(!held)view.performClick();
                        return true;
                    default:return true;
                }
            }
        });
        wm.addView(bubbleWindow,bubbleParams);
    }
    private void createResults(){
        // A Pokébola-style vertical stack of sprites and short metadata,
        // not a large card/dialog/website overlay.
        resultsShell=new LinearLayout(this);
        resultsShell.setOrientation(LinearLayout.VERTICAL);
        resultsShell.setPadding(0,0,0,0);
        resultsShell.setBackgroundColor(Color.TRANSPARENT);
        status=label("Consultando Doce Raro…",10,0xFFB3C4DC,false);
        status.setMaxLines(2);
        resultsShell.addView(status,space(-1,35,0));
        ScrollView scroll=new ScrollView(this);
        scroll.setFillViewport(false);
        scroll.setVerticalScrollBarEnabled(false);
        resultsList=new LinearLayout(this);
        resultsList.setOrientation(LinearLayout.VERTICAL);
        resultsList.setClipToPadding(false);
        scroll.addView(resultsList,new ScrollView.LayoutParams(-1,-2));
        resultsShell.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
        resultsParams=new WindowManager.LayoutParams(dp(236),dp(40),
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            android.graphics.PixelFormat.TRANSLUCENT);
        resultsParams.gravity=Gravity.TOP|Gravity.LEFT;
        placeResults();
        wm.addView(resultsShell,resultsParams);
        resultsShell.setVisibility(View.GONE);
    }
    private void placeResults(){
        if(resultsParams==null||bubbleParams==null)return;
        int width=getResources().getDisplayMetrics().widthPixels;
        int height=getResources().getDisplayMetrics().heightPixels;
        int margin=dp(3);
        // Default to only the candy + despawn sprite column. Widen only
        // when the user has explicitly enabled name/location information.
        int contentDp=(showName||showLocation)?228:48;
        resultsParams.width=Math.min(dp(contentDp),width-margin*2);
        // The 45dp rows follow the sprite cadence of the Pokébola result list.
        int wantedHeight=dp(Math.min(460,Math.max(35,cards.size()*47+4)));
        int belowY=bubbleParams.y+dp(BUBBLE_DP)+dp(1);
        int roomBelow=height-margin-belowY;
        int roomAbove=bubbleParams.y-margin;
        if(roomBelow>=Math.min(wantedHeight,dp(130))||roomBelow>=roomAbove){
            resultsParams.height=Math.max(dp(1),Math.min(wantedHeight,Math.max(1,roomBelow)));
            resultsParams.y=Math.max(margin,Math.min(height-margin-resultsParams.height,belowY));
        }else{
            resultsParams.height=Math.max(dp(1),Math.min(wantedHeight,Math.max(1,roomAbove)));
            resultsParams.y=Math.max(margin,bubbleParams.y-resultsParams.height-dp(1));
        }
        resultsParams.x=Math.max(margin,Math.min(width-resultsParams.width-margin,
            bubbleParams.x-dp(6)));
        if(resultsShell!=null&&resultsShell.isAttachedToWindow()){
            try{wm.updateViewLayout(resultsShell,resultsParams);}
            catch(Exception ignored){}
        }
    }
    private void toggleResults(){
        visible=!visible;
        if(resultsShell!=null)resultsShell.setVisibility(visible?View.VISIBLE:View.GONE);
        if(candyMenuVisible&&!visible)closeCandyMenu();
        if(visible){
            placeResults();render();
            if(!ready||cards.isEmpty())refresh(true);
        }
    }

    /** Candy toolbar reuses the exact 30dp icon tiles, colors, popup fields and
     * 2dp spacing from the Pokébola dock, not unrelated native Dialog buttons. */
    private void createCandyMenu(){
        candyMenuRoot=new FrameLayout(this);
        candyMenuRoot.setBackgroundColor(Color.TRANSPARENT);
        candyMenuPanel=new WebView(this);
        candyMenuPanel.setBackgroundColor(Color.TRANSPARENT);
        candyMenuPanel.getSettings().setJavaScriptEnabled(true);
        candyMenuPanel.getSettings().setAllowContentAccess(false);
        candyMenuPanel.getSettings().setAllowFileAccessFromFileURLs(false);
        candyMenuPanel.getSettings().setAllowUniversalAccessFromFileURLs(false);
        candyMenuPanel.getSettings().setUseWideViewPort(true);
        candyMenuPanel.getSettings().setLoadWithOverviewMode(false);
        candyMenuPanel.addJavascriptInterface(new CandyMenuBridge(),"Native");
        candyMenuRoot.addView(candyMenuPanel,new FrameLayout.LayoutParams(-1,-1));
        candyMenuPanel.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view,String url){
                return !allowedMenuUrl(url);
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view,
                    android.webkit.WebResourceRequest request){
                return !allowedMenuUrl(request.getUrl().toString());
            }
            @Override public void onPageFinished(WebView view,String url){
                if(allowedMenuUrl(url)){candyMenuLoaded=true;syncCandyMenu();}
            }
        });
        menuParams=new WindowManager.LayoutParams(dp(142),dp(34),
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL|
            WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
            android.graphics.PixelFormat.TRANSLUCENT);
        menuParams.gravity=Gravity.TOP|Gravity.LEFT;
        placeCandyMenu();
        candyMenuRoot.setVisibility(View.GONE);
        wm.addView(candyMenuRoot,menuParams);
        candyMenuPanel.loadUrl("file:///android_asset/rare_candy_controls.html");
    }
    private static boolean allowedMenuUrl(String url){
        return "file:///android_asset/rare_candy_controls.html".equals(url);
    }
    private void syncCandyMenu(){
        if(!candyMenuLoaded||candyMenuPanel==null)return;
        JSONObject state=new JSONObject();
        try{
            state.put("coords",coords).put("radius",radius).put("period",period)
                .put("name",showName).put("location",showLocation)
                .put("despawn",showDespawn).put("distance",showDistance);
            candyMenuPanel.evaluateJavascript("window.syncCandy("+
                JSONObject.quote(state.toString())+")",null);
        }catch(org.json.JSONException ignored){}
    }
    private void placeCandyMenu(){
        if(menuParams==null||bubbleParams==null||wm==null)return;
        int width=getResources().getDisplayMetrics().widthPixels;
        int height=getResources().getDisplayMetrics().heightPixels;
        int right=bubbleParams.x+dp(BUBBLE_DP)+dp(2);
        int left=bubbleParams.x-menuParams.width-dp(2);
        menuParams.x=right+menuParams.width<=width?right:
            left>=0?left:Math.max(0,width-menuParams.width);
        int y=bubbleParams.y;
        menuParams.y=Math.max(0,Math.min(
            Math.max(0,height-menuParams.height),y));
        if(candyMenuRoot!=null&&candyMenuRoot.isAttachedToWindow()){
            try{wm.updateViewLayout(candyMenuRoot,menuParams);}catch(Exception ignored){}
        }
    }
    private void toggleCandyMenu(){
        if(candyMenuVisible){closeCandyMenu();return;}
        candyMenuVisible=true;
        menuParams.height=dp(34);
        menuParams.width=dp(142);
        candyMenuRoot.setVisibility(View.VISIBLE);
        placeCandyMenu();
        syncCandyMenu();
    }
    private void closeCandyMenu(){
        candyMenuVisible=false;
        if(candyMenuRoot!=null)candyMenuRoot.setVisibility(View.GONE);
        if(menuParams!=null){
            menuParams.height=dp(34);
            menuParams.width=dp(142);
            menuParams.flags=WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL|
                WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH;
        }
    }
    private final class CandyMenuBridge {
        private boolean permitted(){return candyMenuLoaded&&
            candyMenuPanel!=null&&allowedMenuUrl(candyMenuPanel.getUrl())&&!destroyed;}
        @android.webkit.JavascriptInterface public void closeCandyMenu(){
            main.post(()->{if(permitted())RareCandyOverlayService.this.closeCandyMenu();});
        }
        @android.webkit.JavascriptInterface public void refreshCandy(){
            main.post(()->{
                if(!permitted())return;
                long remaining=blockedUntil-SystemClock.elapsedRealtime();
                Toast.makeText(RareCandyOverlayService.this,
                    remaining>0?"Limite do site · atualizar em "+((remaining+999)/1000)+" s":
                        "Atualizando doces…",Toast.LENGTH_SHORT).show();
                refresh(true);
            });
        }
        @android.webkit.JavascriptInterface public void candyMenuHeight(int height,boolean focus){
            main.post(()->{
                if(!permitted()||menuParams==null||!candyMenuVisible)return;
                int h=Math.max(34,Math.min(290,height));
                menuParams.height=dp(h);
                menuParams.width=dp(h>34?240:142);
                menuParams.flags=WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL|
                    WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH|
                    (focus?0:WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE);
                placeCandyMenu();
            });
        }
        @android.webkit.JavascriptInterface public void candyMenuFocus(boolean focus){
            main.post(()->{
                if(!permitted()||menuParams==null||!candyMenuVisible)return;
                menuParams.flags=WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL|
                    WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH|
                    (focus?0:WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE);
                placeCandyMenu();
            });
        }
        @android.webkit.JavascriptInterface public void setCandyPeriod(int selected){
            if(selected!=1&&selected!=3&&selected!=5)return;
            main.post(()->{
                if(!permitted())return;
                period=selected;prefs.edit().putInt("period",selected).apply();
                syncCandyMenu();
            });
        }
        @android.webkit.JavascriptInterface public void setCandyInfo(String field,boolean enabled){
            main.post(()->{
                if(!permitted())return;
                SharedPreferences.Editor editor=prefs.edit();
                if("name".equals(field)){
                    showName=enabled;editor.putBoolean("candyShowName",enabled);
                }else if("location".equals(field)){
                    showLocation=enabled;editor.putBoolean("candyShowLocation",enabled);
                }else if("despawn".equals(field)){
                    showDespawn=enabled;editor.putBoolean("candyShowDespawn",enabled);
                }else if("distance".equals(field)){
                    showDistance=enabled;editor.putBoolean("candyShowDistance",enabled);
                }else return;
                editor.apply();render();syncCandyMenu();
            });
        }
        @android.webkit.JavascriptInterface public void setCandyLocation(String center,int meters){
            main.post(()->{
                if(!permitted()||meters<1||meters>1000000||
                   (!center.isEmpty()&&!validCoords(center)))return;
                coords=center.trim();radius=meters;cards.clear();
                prefs.edit().putString("coords",coords).putInt("radius",meters).apply();
                render();syncCandyMenu();refresh(true);
            });
        }
        @android.webkit.JavascriptInterface public void pasteCandyLocation(){
            main.post(()->{
                if(!permitted())return;
                ClipboardManager clip=(ClipboardManager)getSystemService(CLIPBOARD_SERVICE);
                if(clip==null||!clip.hasPrimaryClip())return;
                CharSequence val=clip.getPrimaryClip().getItemAt(0).coerceToText(
                    RareCandyOverlayService.this);
                String point=val==null?"":val.toString().trim();
                if(validCoords(point))candyMenuPanel.evaluateJavascript(
                    "window.setPastedCoords("+JSONObject.quote(point)+")",null);
                else Toast.makeText(RareCandyOverlayService.this,
                    "Área de transferência sem coordenadas",Toast.LENGTH_SHORT).show();
            });
        }
    }
    private boolean isOfficialSearch(){
        if(site==null||site.getUrl()==null)return false;
        try{
            android.net.Uri url=android.net.Uri.parse(site.getUrl());
            return "https".equals(url.getScheme())&&
                ("pogocoordinates.com".equals(url.getHost())||
                "www.pogocoordinates.com".equals(url.getHost()))&&
                url.getPath()!=null&&url.getPath().startsWith("/search");
        }catch(Exception ignored){return false;}
    }
    private void attachSource(){
        site=new WebView(this);
        // Like P1, use the actual selected, already-authenticated browser
        // profile; never transfer cookies/JWT between account slots manually.
        int account=PogoAccountSlots.assigned(this,false);
        PogoAccountSlots.attach(site,account);
        site.getSettings().setJavaScriptEnabled(true);
        site.getSettings().setUseWideViewPort(true);
        site.getSettings().setLoadWithOverviewMode(false);
        site.getSettings().setDomStorageEnabled(true);
        site.getSettings().setAllowFileAccess(false);
        site.getSettings().setAllowContentAccess(false);
        site.getSettings().setAllowFileAccessFromFileURLs(false);
        site.getSettings().setAllowUniversalAccessFromFileURLs(false);
        CookieManager cookies=PogoAccountSlots.cookieManager(account);
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(site,true);
        site.setAlpha(0f);site.setClickable(false);
        site.setFocusable(false);
        site.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS);
        // Rendering the official site requires a mobile-sized viewport, but
        // its WebView is inserted BEHIND both the image and the input grip.
        // Do not install a consuming OnTouchListener over the 45dp hitbox.
        site.setOnTouchListener((v,e)->false);
        bubbleWindow.addView(site,0,new FrameLayout.LayoutParams(dp(360),dp(640)));
        try(InputStream in=getAssets().open("rare_candy_probe.js")){
            byte[] raw=new byte[in.available()];
            int total=0;
            while(total<raw.length){
                int n=in.read(raw,total,raw.length-total);
                if(n<0)break;total+=n;
            }
            probe=new String(raw,0,total,StandardCharsets.UTF_8);
        }catch(Exception ignored){probe="";}
        site.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view,String url){
                return !isAllowedUrl(url);
            }
            @Override public boolean shouldOverrideUrlLoading(
                WebView view,android.webkit.WebResourceRequest request){
                return !isAllowedUrl(request.getUrl().toString());
            }
            @Override public void onPageFinished(WebView view,String url){
                if(!destroyed&&isAllowedUrl(url)){
                    ready=true;
                    // A manual tap while loading must never be silently lost.
                    main.postDelayed(()->{
                        if(destroyed)return;
                        pendingManualRefresh=false;
                        refresh(true);
                    },250L);
                }
            }
            @Override public void onReceivedError(WebView v,
                    android.webkit.WebResourceRequest request,
                    android.webkit.WebResourceError error){
                if(request.isForMainFrame()&&!destroyed){
                    ready=false;busy=false;
                    setStatus("Site indisponível · atualize quando houver rede");
                }
            }
        });
        if(!probe.isEmpty())site.loadUrl(SOURCE);
        else setStatus("Recurso de leitura do site indisponível");
    }
    private static boolean isAllowedUrl(String uri){
        if(uri==null)return false;
        try{
            android.net.Uri p=android.net.Uri.parse(uri);
            return "https".equals(p.getScheme())&&
                ("pogocoordinates.com".equals(p.getHost())||
                 "www.pogocoordinates.com".equals(p.getHost()))&&
                 p.getPath()!=null&&p.getPath().startsWith("/search");
        }catch(Exception ignored){return false;}
    }
    private void setStatus(String message){
        if(status!=null){
            status.setText(message);
            status.setVisibility(cards.isEmpty()?View.VISIBLE:View.GONE);
        }
    }
    private void refresh(boolean manual){
        if(destroyed||site==null)return;
        if(!ready||!isOfficialSearch()){
            if(manual){
                pendingManualRefresh=true;
                setStatus("Conectando à pesquisa Doce Raro…");
            }
            return;
        }
        if(busy){
            if(manual){
                // Send a single subsequent request after the in-flight result.
                // Do not start simultaneous requests and trigger site 429.
                pendingManualRefresh=true;
                setStatus("Atualização solicitada…");
            }
            return;
        }
        long now=SystemClock.elapsedRealtime();
        if(now<blockedUntil){
            // Keep the last explicit tap/all-copied request until the provider
            // permits another call; never bypass 429 Retry-After.
            if(manual)pendingManualRefresh=true;
            setStatus("Limite do site · repetir em "+((blockedUntil-now+999)/1000)+" s");
            return;
        }
        if(!manual&&now-lastRefresh<15000)return;
        busy=true;expirePending=false;lastRefresh=now;
        final int gen=++generation;
        setStatus("Consultando Doce Raro…");
        // No DOM scraping, fake time-to-live or /reveal. The source contract
        // is POST /rare-candy/search and expires_at in UTC. The logged-in
        // website origin sends its own JWT without exposing it to Android.
        // Async Promise results are polled via evaluateJavascript: no native
        // bridge is ever exposed to a remote origin.
        final String script=probe+"\n(function(){"+
            "window.__pokesearchCandyState={generation:"+gen+",done:false};"+
            "window.PokeSearchCandy.search("+JSONObject.quote(coords)+","+radius+")"+
            ".then(function(s){window.__pokesearchCandyState={generation:"+gen+
            ",done:true,response:JSON.parse(s)};})"+
            ".catch(function(){window.__pokesearchCandyState={generation:"+gen+
            ",done:true,response:{ok:false,status:0,error:'network'}};});"+
            "})();";
        site.evaluateJavascript(script,unused->{
            if(!destroyed&&gen==generation)main.postDelayed(()->readResults(gen,0),600L);
        });
    }
    private void finishPendingManualRefresh(){
        if(destroyed||!pendingManualRefresh)return;
        pendingManualRefresh=false;
        main.post(()->refresh(true));
    }
    private void readResults(int gen,int attempt){
        if(destroyed||gen!=generation||site==null||!isOfficialSearch())return;
        site.evaluateJavascript("JSON.stringify(window.__pokesearchCandyState||{})",raw->{
            if(destroyed||gen!=generation)return;
            try{
                String json=new JSONArray("["+raw+"]").optString(0,"{}");
                JSONObject state=new JSONObject(json);
                if(state.optInt("generation",-1)!=gen||!state.optBoolean("done",false)){
                    if(attempt<24){
                        main.postDelayed(()->readResults(gen,attempt+1),600L);
                    }else{
                        busy=false;setStatus("Sem resposta do site · tente atualizar");
                        finishPendingManualRefresh();
                    }
                    return;
                }
                JSONObject response=state.optJSONObject("response");
                if(response==null)throw new org.json.JSONException("missing response");
                if(!response.optBoolean("ok",false)){
                    busy=false;
                    int code=response.optInt("status",0);
                    if(code==429){
                        int retry=Math.max(60,Math.min(3600,response.optInt("retry_after",60)));
                        blockedUntil=SystemClock.elapsedRealtime()+retry*1000L;
                        setStatus("Limite de buscas · "+retry+" s");
                    }else if(code==401){
                        setStatus("Sessão expirada · entre no PoGoCoordinates");
                    }else setStatus("Busca indisponível · tente novamente");
                    finishPendingManualRefresh();
                    return;
                }
                JSONArray items=response.optJSONArray("items");
                if(items==null)throw new org.json.JSONException("missing items");
                long clock=System.currentTimeMillis();
                long elapsed=SystemClock.elapsedRealtime();
                Map<String,Candy> accepted=new LinkedHashMap<>();
                for(int i=0;i<items.length()&&i<100;i++){
                    JSONObject row=items.optJSONObject(i);
                    if(row==null)continue;
                    String point=row.optString("coords","").trim();
                    if(!validCoords(point))continue;
                    String expiry=row.optString("expires_at","");
                    long utcMillis;
                    try{utcMillis=java.time.Instant.parse(expiry).toEpochMilli();}
                    catch(Exception ignored){continue;}
                    long ttl=utcMillis-clock;
                    if(ttl<=0)continue;
                    String city=row.optString("location","").trim();
                    if(city.length()>110)city=city.substring(0,110);
                    String distance="";
                    if(!row.isNull("distance_km")&&row.has("distance_km")){
                        double kilometers=row.optDouble("distance_km",Double.NaN);
                        if(!Double.isNaN(kilometers)&&kilometers>=0&&
                           !Double.isInfinite(kilometers)){
                            distance=kilometers<1?
                                Math.round(kilometers*1000)+" m":
                                String.format(java.util.Locale.US,"%.1f km",kilometers);
                        }
                    }
                    accepted.put(point,new Candy(point,city,distance,elapsed+ttl));
                }
                cards.clear();cards.putAll(accepted);
                busy=false;
                setStatus(cards.isEmpty()?"Nenhum Doce Raro no momento":
                    cards.size()+" Doce Raro · PoGoCoordinates");
                render();
                finishPendingManualRefresh();
            }catch(Exception ex){
                busy=false;
                setStatus("Falha ao ler dados do Doce Raro");
                finishPendingManualRefresh();
            }
        });
    }
    private static boolean validCoords(String point){
        if(point==null||!point.matches(
            "-?[0-9]{1,2}(?:\\.[0-9]+)?\\s*,\\s*-?[0-9]{1,3}(?:\\.[0-9]+)?"))
            return false;
        try{
            String[] pair=point.split(",");
            return Math.abs(Double.parseDouble(pair[0].trim()))<=90&&
                Math.abs(Double.parseDouble(pair[1].trim()))<=180;
        }catch(NumberFormatException ex){return false;}
    }
    private void copy(String point){
        if(!validCoords(point))return;
        ClipboardManager clipboard=(ClipboardManager)getSystemService(CLIPBOARD_SERVICE);
        clipboard.setPrimaryClip(ClipData.newPlainText("Doce Raro",point));
        boolean newlyCopied=copied.add(point);
        // Keep the last 100 copied points, independent of P1/P2 and tokens.
        if(copied.size()>100){
            String first=copied.iterator().next();
            copied.remove(first);
        }
        prefs.edit().putString("copied",new JSONArray(copied).toString()).apply();
        Toast.makeText(this,"Coordenadas copiadas",Toast.LENGTH_SHORT).show();
        render();
        // Trigger once on the transition to ALL visible candies copied. A
        // repeated tap on an already-gray candy must not generate a loop if
        // the provider returns the same ten coordinates in the next response.
        if(newlyCopied&&lastAllCopiedRefreshGeneration!=generation){
            long now=SystemClock.elapsedRealtime();
            boolean hasVisible=false,hasUncopied=false;
            for(Candy candidate:cards.values()){
                if(candidate.deadline<=now)continue;
                hasVisible=true;
                if(!copied.contains(candidate.coords)){hasUncopied=true;break;}
            }
            if(hasVisible&&!hasUncopied){
                lastAllCopiedRefreshGeneration=generation;
                refresh(true);
            }
        }
    }
    private void render(){
        if(resultsList==null)return;
        resultsList.removeAllViews();
        countdownLabels.clear();
        long now=SystemClock.elapsedRealtime();
        for(Candy card:new ArrayList<>(cards.values())){
            if(card.deadline<=now)continue;
            LinearLayout row=new LinearLayout(this);
            row.setGravity(Gravity.CENTER_VERTICAL);
            row.setPadding(0,0,0,0);
            row.setBackgroundColor(Color.TRANSPARENT);

            // Match the narrow sprite column of the existing Pokébola list.
            // Distance is WITHIN this same transparent sprite cell, not a
            // separate wide right-hand column that leaves an empty gap.
            LinearLayout spriteColumn=new LinearLayout(this);
            spriteColumn.setOrientation(LinearLayout.VERTICAL);
            spriteColumn.setGravity(Gravity.CENTER_HORIZONTAL|Gravity.TOP);
            FrameLayout spriteCell=new FrameLayout(this);
            ImageView image=sprite(CANDY_ART_DP,copied.contains(card.coords));
            FrameLayout.LayoutParams imageLp=new FrameLayout.LayoutParams(
                dp(CANDY_ART_DP),dp(CANDY_ART_DP),Gravity.TOP|Gravity.CENTER_HORIZONTAL);
            spriteCell.addView(image,imageLp);
            if(showDistance&&!card.distance.isEmpty()){
                TextView distance=label(card.distance,8,0xFFF0F5FF,true);
                distance.setGravity(Gravity.CENTER);
                distance.setSingleLine(true);
                distance.setMaxLines(1);
                distance.setPadding(dp(2),0,dp(2),0);
                distance.setBackground(background(0xB8111A26,5,0));
                FrameLayout.LayoutParams distLp=new FrameLayout.LayoutParams(
                    -2,dp(13),Gravity.RIGHT|Gravity.BOTTOM);
                spriteCell.addView(distance,distLp);
                distance.setOnClickListener(v->copy(card.coords));
            }
            spriteColumn.addView(spriteCell,space(46,29,0));
            if(showDespawn){
                long seconds=Math.max(0,(card.deadline-now+999)/1000);
                TextView countdown=label((seconds/60)+":"+String.format(
                    java.util.Locale.US,"%02d",seconds%60),9,
                    seconds<=60?0xFFFF666D:seconds<=300?0xFFFFC35A:0xFFC0D9EE,true);
                countdown.setGravity(Gravity.CENTER);
                spriteColumn.addView(countdown,space(46,15,0));
                countdownLabels.put(card.coords,countdown);
            }
            row.addView(spriteColumn,space(46,-2,0));

            if(showName||showLocation){
                LinearLayout info=new LinearLayout(this);
                info.setOrientation(LinearLayout.VERTICAL);
                info.setGravity(Gravity.CENTER_VERTICAL);
                if(showName){
                    TextView title=label(copied.contains(card.coords)?"Doce Raro ✓":"Doce Raro",
                        11,copied.contains(card.coords)?0xFFB1B6C1:0xFFF1F6FF,true);
                    info.addView(title,space(-1,16,0));
                }
                if(showLocation&&!card.city.isEmpty()){
                    TextView city=label(card.city,10,0xFFCFD9E7,false);
                    city.setMaxLines(2);
                    info.addView(city,space(-1,-2,0));
                }
                row.addView(info,new LinearLayout.LayoutParams(0,-2,1));
            }
            row.setOnClickListener(v->copy(card.coords));
            image.setOnClickListener(v->copy(card.coords));
            resultsList.addView(row,space(-1,45,2));
        }
        if(status!=null)status.setVisibility(cards.isEmpty()?View.VISIBLE:View.GONE);
        placeResults();
    }
    private final Runnable tick=new Runnable(){
        @Override public void run(){
            if(destroyed)return;
            long now=SystemClock.elapsedRealtime();
            boolean removed=false;
            for(String key:new ArrayList<>(cards.keySet())){
                Candy candy=cards.get(key);
                if(candy!=null&&candy.deadline>0&&candy.deadline<=now){
                    cards.remove(key);removed=true;
                }
            }
            if(removed){
                render();expirePending=true;
            }
            for(Map.Entry<String,TextView> entry:countdownLabels.entrySet()){
                Candy current=cards.get(entry.getKey());
                if(current==null||current.deadline<=0)continue;
                long seconds=Math.max(0,(current.deadline-now+999)/1000);
                TextView label=entry.getValue();
                label.setText((seconds/60)+":"+String.format(
                    java.util.Locale.US,"%02d",seconds%60));
                label.setTextColor(seconds<=60?0xFFFF666D:
                    seconds<=300?0xFFFFC35A:0xFFC0D9EE);
            }
            // Immediately request a new batch after expiry, but obey a small
            // local throttle so simultaneous expirations cannot spam the site.
            if(pendingManualRefresh&&!busy&&ready&&
                    isOfficialSearch()&&now>=blockedUntil){
                pendingManualRefresh=false;
                refresh(true);
            }else if(expirePending&&!busy&&now-lastRefresh>=15000){
                expirePending=false;refresh(false);
            }else if(!busy&&ready&&now-lastRefresh>=period*60000L){
                refresh(false);
            }
            main.postDelayed(this,1000L);
        }
    };
    private final OverlayQuickMenus.CandyActions actions=
        new OverlayQuickMenus.CandyActions(){
            @Override public String coordinates(){return coords;}
            @Override public int radius(){return radius;}
            @Override public int period(){return period;}
            @Override public boolean infos(){return showInfos;}
            @Override public void saveLocation(String value,int km){
                if(!value.isEmpty()&&!validCoords(value))return;
                coords=value;radius=km;cards.clear();
                prefs.edit().putString("coords",value).putInt("radius",km).apply();
                render();RareCandyOverlayService.this.refresh(true);
            }
            @Override public void refresh(){RareCandyOverlayService.this.refresh(true);}
            @Override public void updatePeriod(int value){
                period=value;prefs.edit().putInt("period",value).apply();
            }
            @Override public void updateInfos(boolean value){
                showInfos=value;prefs.edit().putBoolean("infos",value).apply();render();
            }
        };
    @Override public int onStartCommand(Intent i,int flags,int startId){
        if(i!=null&&"STOP_CANDY".equals(i.getAction())){stopSelf();return START_NOT_STICKY;}
        if(i!=null&&"REFRESH_CANDY".equals(i.getAction()))refresh(true);
        return START_STICKY;
    }
    @Override public void onDestroy(){
        destroyed=true;running=false;
        ++generation;main.removeCallbacksAndMessages(null);
        if(site!=null){
            site.stopLoading();
            if(bubbleWindow!=null)bubbleWindow.removeView(site);
            site.destroy();site=null;
        }
        if(wm!=null){
            if(candyMenuRoot!=null){try{wm.removeView(candyMenuRoot);}catch(Exception ignored){}}
            if(resultsShell!=null){try{wm.removeView(resultsShell);}catch(Exception ignored){}}
            if(bubbleWindow!=null){try{wm.removeView(bubbleWindow);}catch(Exception ignored){}}
        }
        if(candyMenuPanel!=null){candyMenuPanel.destroy();candyMenuPanel=null;}
        if(icon!=null&&!icon.isRecycled())icon.recycle();
        super.onDestroy();
    }
    @Override public IBinder onBind(Intent i){return null;}
}

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
import java.util.HashSet;
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
    private final Set<String> copied=new HashSet<>();
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
    private boolean showLocation=true,showDespawn=true,showDistance=true;
    private String coords="";
    private int radius=1000,period=1,generation=0;
    private long lastRefresh=0,blockedUntil=0;
    private boolean expirePending=false;

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
        radius=Math.max(0,Math.min(1000,prefs.getInt("radius",1000)));
        int saved=prefs.getInt("period",1);
        period=saved==3||saved==5?saved:1;
        showInfos=prefs.getBoolean("infos",true);
        showLocation=prefs.getBoolean("candyShowLocation",showInfos);
        showDespawn=prefs.getBoolean("candyShowDespawn",showInfos);
        showDistance=prefs.getBoolean("candyShowDistance",showInfos);
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
        resultsShell=new LinearLayout(this);
        resultsShell.setOrientation(LinearLayout.VERTICAL);
        resultsShell.setPadding(dp(7),dp(6),dp(7),dp(7));
        resultsShell.setBackground(background(OverlayQuickMenus.panelColor(this),
            12,0x887E91A5));
        LinearLayout title=new LinearLayout(this);
        title.setGravity(Gravity.CENTER_VERTICAL);
        TextView name=label("Doce Raro",13,0xFFF4F7FF,true);
        title.addView(name,new LinearLayout.LayoutParams(0,dp(30),1));
        TextView refresh=label("↻",24,0xFFCCECFF,true);
        refresh.setGravity(Gravity.CENTER);
        title.addView(refresh,space(35,30,0));
        refresh.setOnClickListener(v->refresh(true));
        refresh.setOnLongClickListener(v->{
            OverlayQuickMenus.showCandyPeriod(this,
                resultsParams==null?bubbleParams.y:resultsParams.y+dp(32),actions);
            return true;
        });
        TextView close=label("×",25,0xFFEEAABB,false);
        close.setGravity(Gravity.CENTER);
        title.addView(close,space(30,30,0));
        close.setOnClickListener(v->toggleResults());
        resultsShell.addView(title,new LinearLayout.LayoutParams(-1,dp(32)));
        status=label("Conectando ao PoGoCoordinates…",11,0xFFB3C4DC,false);
        resultsShell.addView(status,space(-1,25,0));
        ScrollView scroll=new ScrollView(this);
        scroll.setFillViewport(false);
        scroll.setVerticalScrollBarEnabled(false);
        resultsList=new LinearLayout(this);resultsList.setOrientation(LinearLayout.VERTICAL);
        scroll.addView(resultsList);
        resultsShell.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
        resultsParams=new WindowManager.LayoutParams(dp(292),dp(330),
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
        int w=getResources().getDisplayMetrics().widthPixels;
        int h=getResources().getDisplayMetrics().heightPixels;
        int gap=dp(6),margin=dp(4);
        int desiredW=Math.min(dp(292),Math.max(dp(150),w-margin*2));
        int desiredH=Math.min(dp(330),Math.max(dp(130),h-margin*2));
        int bubbleX=bubbleParams.x,bubbleY=bubbleParams.y;
        int diameter=dp(BUBBLE_DP);
        int rightX=bubbleX+diameter+gap;
        int leftX=bubbleX-gap-desiredW;
        resultsParams.width=desiredW;
        resultsParams.height=desiredH;
        // Put the native results window BESIDE the bubble when there is room.
        // Otherwise put it fully BELOW/ABOVE. It must never cover its own
        // grip, including on 360dp Android devices or after a drag.
        if(rightX+desiredW<=w-margin){
            resultsParams.x=rightX;
            resultsParams.y=Math.max(margin,Math.min(h-desiredH-margin,bubbleY));
        }else if(leftX>=margin){
            resultsParams.x=leftX;
            resultsParams.y=Math.max(margin,Math.min(h-desiredH-margin,bubbleY));
        }else{
            resultsParams.x=Math.max(margin,Math.min(
                w-desiredW-margin,bubbleX+diameter/2-desiredW/2));
            int belowY=bubbleY+diameter+gap;
            int aboveY=bubbleY-gap-desiredH;
            if(belowY+desiredH<=h-margin){
                resultsParams.y=belowY;
            }else if(aboveY>=margin){
                resultsParams.y=aboveY;
            }else{
                int aboveSpace=Math.max(0,bubbleY-gap-margin);
                int belowSpace=Math.max(0,h-margin-belowY);
                if(belowSpace>=aboveSpace){
                    resultsParams.y=belowY;
                    resultsParams.height=Math.max(1,Math.min(desiredH,belowSpace));
                }else{
                    resultsParams.height=Math.max(1,Math.min(desiredH,aboveSpace));
                    resultsParams.y=Math.max(margin,bubbleY-gap-resultsParams.height);
                }
            }
        }
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
                .put("location",showLocation).put("despawn",showDespawn)
                .put("distance",showDistance);
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
        candyMenuRoot.setVisibility(View.VISIBLE);
        placeCandyMenu();
        syncCandyMenu();
    }
    private void closeCandyMenu(){
        candyMenuVisible=false;
        if(candyMenuRoot!=null)candyMenuRoot.setVisibility(View.GONE);
        if(menuParams!=null){
            menuParams.height=dp(34);
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
            main.post(()->{if(permitted())refresh(true);});
        }
        @android.webkit.JavascriptInterface public void candyMenuHeight(int height,boolean focus){
            main.post(()->{
                if(!permitted()||menuParams==null||!candyMenuVisible)return;
                int h=Math.max(34,Math.min(240,height));
                menuParams.height=dp(h);
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
                if("location".equals(field)){
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
                    main.postDelayed(()->refresh(true),1400L);
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
        if(status!=null)status.setText(message);
    }
    private void refresh(boolean manual){
        if(destroyed||site==null||!ready||busy||!isOfficialSearch())return;
        long now=SystemClock.elapsedRealtime();
        if(now<blockedUntil){
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
            }catch(Exception ex){
                busy=false;
                setStatus("Falha ao ler dados do Doce Raro");
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
        copied.add(point);
        // Keep the last 100 copied points, independent of P1/P2 and tokens.
        if(copied.size()>100){
            String first=copied.iterator().next();
            copied.remove(first);
        }
        prefs.edit().putString("copied",new JSONArray(copied).toString()).apply();
        Toast.makeText(this,"Coordenadas copiadas",Toast.LENGTH_SHORT).show();
        render();
    }
    private void render(){
        if(resultsList==null||!visible)return;
        resultsList.removeAllViews();
        countdownLabels.clear();
        long now=SystemClock.elapsedRealtime();
        for(Candy card:new ArrayList<>(cards.values())){
            if(card.deadline>0&&card.deadline<=now)continue;
            LinearLayout row=new LinearLayout(this);
            row.setGravity(Gravity.CENTER_VERTICAL);
            row.setPadding(dp(4),dp(5),dp(4),dp(5));
            row.setBackground(background(0x5530445B,9,0x55788DA8));
            LinearLayout left=new LinearLayout(this);
            left.setOrientation(LinearLayout.VERTICAL);
            left.setGravity(Gravity.CENTER_HORIZONTAL);
            ImageView image=sprite(43,copied.contains(card.coords));
            left.addView(image,space(43,43,0));
            if(showInfos&&card.deadline>0){
                long seconds=Math.max(0,(card.deadline-now+999)/1000);
                String value=(seconds/60)+":"+String.format(java.util.Locale.US,
                    "%02d",seconds%60);
                int color=seconds<=60?0xFFFF666D:
                    seconds<=300?0xFFFFC35A:0xFFC0D9EE;
                TextView countdown=label(value,10,color,true);
                countdown.setGravity(Gravity.CENTER);
                left.addView(countdown,space(-1,18,0));
                countdownLabels.put(card.coords,countdown);
            }
            row.addView(left,space(49,-2,0));
            LinearLayout mainText=new LinearLayout(this);
            mainText.setOrientation(LinearLayout.VERTICAL);
            if(showInfos&&!card.city.isEmpty()){
                TextView city=label(card.city,11,0xFFF0F4FF,true);
                city.setMaxLines(2);
                mainText.addView(city,space(-1,-2,0));
            }else{
                mainText.addView(label(copied.contains(card.coords)?"Copiado ✓":"Doce Raro",
                    12,0xFFE8F2FF,true),space(-1,25,0));
            }
            if(copied.contains(card.coords)){
                mainText.addView(label("✓ Copiado",10,0xFFB8C8D8,false),
                    space(-1,18,0));
            }
            row.addView(mainText,new LinearLayout.LayoutParams(0,-2,1));
            if(showInfos&&!card.distance.isEmpty()){
                TextView distance=label(card.distance,10,0xFFB5CBE6,false);
                distance.setGravity(Gravity.BOTTOM|Gravity.RIGHT);
                row.addView(distance,space(53,40,0));
            }
            row.setOnClickListener(v->copy(card.coords));
            image.setOnClickListener(v->copy(card.coords));
            resultsList.addView(row,space(-1,-2,4));
        }
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
            if(expirePending&&!busy&&now-lastRefresh>=15000){
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

package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.os.Bundle;
import android.os.Build;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import android.graphics.Color;
import android.webkit.CookieManager;
import android.webkit.WebStorage;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import android.widget.Button;
import android.widget.Spinner;
import android.widget.ArrayAdapter;
import android.widget.CheckBox;
import android.widget.EditText;
import android.text.InputType;
import android.content.pm.PackageManager;
import android.Manifest;
import android.widget.Toast;
import android.widget.ScrollView;
import android.app.AlertDialog;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.Date;
import java.text.SimpleDateFormat;
import java.util.Locale;
import android.widget.LinearLayout;
import android.widget.FrameLayout;
import android.view.View;
import android.widget.TextView;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.view.Gravity;
import android.graphics.Typeface;

public class MainActivity extends Activity {
    private WebView website;
    // HOME-V200-02: custom local UI; the existing OverlayService owns all site queries.
    private WebView homeFiltersWebView;
    private final android.os.Handler homeHandler=new android.os.Handler(android.os.Looper.getMainLooper());
    private boolean homeForeground=false;
    private final Runnable homePoll=new Runnable(){
        @Override public void run(){
            if(!homeForeground)return;
            syncHomeUi();
            homeHandler.postDelayed(this,850L);
        }
    };
    private final android.content.BroadcastReceiver homeEvents=new android.content.BroadcastReceiver(){
        @Override public void onReceive(android.content.Context context,Intent intent){
            if(intent==null||!HomeFilterState.ACTION_EVENT.equals(intent.getAction()))return;
            WebView view=homeFiltersWebView;
            if(view==null||!homeForeground)return;
            String event=intent.getStringExtra("payload");
            if(event==null||event.length()>128000)return;
            // Broadcast is package scoped and receiver not exported. Only the
            // local HOME has a bridge; do not forward this data to the site.
            try {
                JSONObject decoded=new JSONObject(event);
                if("suggestions".equals(decoded.optString("kind")))
                    view.evaluateJavascript("window.onHomeSuggestions("+
                        decoded.optJSONObject("response").toString()+")",null);
                else if("result".equals(decoded.optString("kind")))
                    view.evaluateJavascript("window.onHomeResults("+event+")",null);
            }catch(Exception ignored){}
            syncHomeUi();
        }
    };
    private TextView watchSummary;
    private TextView sessionSummary;
    private boolean loginStartedForShiny=false;
    private boolean loginAutoReturnQueued=false;
    private String loginPurpose="login"; // login | manage
    private boolean profileCaptureInProgress=false;
    private int avatarReadRetryCount=0; // bounded retry for lazy official Google image
    private boolean profileDiscoveryAttempted=false;
    private android.app.Dialog loginDialog;
    private boolean loginSessionNotified=false;
    private boolean loginLinkAttempted=false;
    private boolean loginDiscoveryStarted=false;
    private View loginCover;
    private TextView loginWaitLabel,loginFallback;
    private int loginPageGeneration=0;
    private String pendingReportText="";
    private FrameLayout homeRoot;
    private LinearLayout guestPanel, connectedPanel, trainerPanel, trainerCodeGroup, trainerCodeTexts;
    private View trainerCopyButton;
    private View guestHeading;
    private ImageView teamBadge, accountAvatar;
    private Button trainerAction;
    private TextView trainerSectionTitle;
    private TextView accountDisplay, accountProvider, trainerDisplay, trainerDetails, trainerCode;
    private ImageView overlayControl;
    private TextView sessionHint;
    private View homeDrawerLayer;
    private String pendingExportText="";
    private String preferredLoginProvider="";
    private String observedLoginProvider="";
    @Override public void onCreate(Bundle b){
        super.onCreate(b);
        if (!IntegrityGuard.verify(this)) {
            BugReport.log(this,"SECURITY","Falha de integridade do pacote");
            android.widget.Toast.makeText(this,"Cópia não autorizada ou inválida",android.widget.Toast.LENGTH_LONG).show();
            finish();
            return;
        }
        // HOME-01: rebuild only the presentation, never discard existing features.
        getWindow().setStatusBarColor(Color.rgb(12,33,67));
        getWindow().setNavigationBarColor(Color.rgb(9,20,37));
        FrameLayout root=buildHome();
        setContentView(root);
        refreshSessionSummary();
        refreshHomeOverlay();
        handleShinyLoginIntent(getIntent());
        if(!getSharedPreferences("prefs",0).getBoolean("tutorialSeenV41",false)&&
           !"com.lucianotoscano.pokesearchoverlay.OPEN_SHINY_LOGIN".equals(getIntent().getAction())&&
            !"com.lucianotoscano.pokesearchoverlay.REQUEST_NOTIFICATION_PERMISSION".equals(getIntent().getAction()))
            root.post(this::showQuickGuide);
        if("com.lucianotoscano.pokesearchoverlay.EDIT_WATCH_LIST".equals(getIntent().getAction()))
            root.post(this::openPicker);
        if("com.lucianotoscano.pokesearchoverlay.OPEN_SETTINGS".equals(getIntent().getAction()))
            root.post(this::showPreferencesDialog);
        if("com.lucianotoscano.pokesearchoverlay.OPEN_PIX".equals(getIntent().getAction()))
            root.post(()->PixSupport.show(this));
        if("com.lucianotoscano.pokesearchoverlay.OPEN_REPORT".equals(getIntent().getAction()))
            root.post(this::showBugReportDialog);
        if("com.lucianotoscano.pokesearchoverlay.REQUEST_NOTIFICATION_PERMISSION".equals(getIntent().getAction()))
            root.post(this::requestOverlayNotificationPermission);
    }

    private TextView homeText(String value,int sp,int color,boolean bold){
        TextView t=new TextView(this);
        t.setText(value);t.setTextColor(color);t.setTextSize(sp);
        if(bold)t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        t.setGravity(Gravity.CENTER_VERTICAL);
        return t;
    }
    private android.graphics.drawable.GradientDrawable homeSurface(int color,int radius,int stroke){
        android.graphics.drawable.GradientDrawable bg=round(color,radius);
        if(stroke!=0)bg.setStroke(d(1),stroke);
        return bg;
    }
    private TextView homeMiniButton(String glyph,String description){
        TextView t=homeText(glyph,21,Color.WHITE,true);
        t.setGravity(Gravity.CENTER);
        t.setContentDescription(description);
        t.setBackground(homeSurface(Color.argb(130,9,25,49),11,Color.argb(90,180,221,255)));
        return t;
    }
    private FrameLayout buildHome(){
        FrameLayout frame=new FrameLayout(this);
        homeRoot=frame;
        // HOME: restore owner's actual wallpaper across the entire page.
        frame.setBackgroundColor(Color.rgb(10,14,23));
        ImageView pageBackground=new ImageView(this);
        pageBackground.setImageResource(R.drawable.ps_home_background_dark);
        // The dark wallpaper supplied for the Home was being cropped into its
        // nearly-black center on portrait phones. Fill the whole surface.
        pageBackground.setScaleType(ImageView.ScaleType.FIT_XY);
        pageBackground.setAlpha(1.0f);
        frame.addView(pageBackground,new FrameLayout.LayoutParams(-1,-1));
        View dim=new View(this);
        dim.setBackgroundColor(Color.argb(16,6,12,24)); // Keep artwork visible.
        frame.addView(dim,new FrameLayout.LayoutParams(-1,-1));

        LinearLayout screen=new LinearLayout(this);
        screen.setOrientation(LinearLayout.VERTICAL);
        screen.setPadding(d(14),d(6),d(14),d(12));
        frame.addView(screen,new FrameLayout.LayoutParams(-1,-1));

        LinearLayout header=new LinearLayout(this);
        header.setGravity(Gravity.TOP|Gravity.CENTER_VERTICAL);
        header.setOrientation(LinearLayout.HORIZONTAL);
        screen.addView(header,new LinearLayout.LayoutParams(-1,d(56)));

        // HOME-02: icon only at top left; compact actions on the right.
        ImageView brand=new ImageView(this);
        brand.setImageResource(R.drawable.ps_home_brand_transparent);
        brand.setScaleType(ImageView.ScaleType.FIT_CENTER);
        brand.setContentDescription("Ícone PokeSearch");
        header.addView(brand,new LinearLayout.LayoutParams(d(38),d(38)));

        header.addView(new View(this),new LinearLayout.LayoutParams(0,d(1),1));
        LinearLayout controls=new LinearLayout(this);
        controls.setGravity(Gravity.RIGHT|Gravity.CENTER_VERTICAL);
        controls.setOrientation(LinearLayout.HORIZONTAL);
        header.addView(controls,new LinearLayout.LayoutParams(-2,d(46)));

        overlayControl=makeIcon(R.drawable.ic_overlay_off,"Ativar overlay");
        overlayControl.setPadding(d(5),d(5),d(5),d(5));
        overlayControl.setBackground(homeSurface(Color.argb(125,9,25,49),10,0));
        controls.addView(overlayControl,new LinearLayout.LayoutParams(d(34),d(34)));
        overlayControl.setOnClickListener(v->toggleHomeOverlay());

        ImageButton heart=makeIcon(R.drawable.ic_heart_outline,"Apoiar o PokeSearch");
        heart.setPadding(d(6),d(6),d(6),d(6));
        heart.setBackground(homeSurface(Color.argb(125,9,25,49),10,0));
        LinearLayout.LayoutParams heartLp=new LinearLayout.LayoutParams(d(34),d(34));
        heartLp.leftMargin=d(5);
        controls.addView(heart,heartLp);
        heart.setOnClickListener(v->PixSupport.show(this));

        TextView menu=homeMiniButton("☰","Abrir menu lateral");
        menu.setTextSize(18);
        menu.setBackground(homeSurface(Color.argb(125,9,25,49),10,0));
        LinearLayout.LayoutParams menuLp=new LinearLayout.LayoutParams(d(34),d(34));
        menuLp.leftMargin=d(5);
        controls.addView(menu,menuLp);
        menu.setOnClickListener(v->showHomeMenu());

        // HOME-04: compact reference card, fed only by verified profile fields.
        LinearLayout auth=new LinearLayout(this);
        auth.setOrientation(LinearLayout.VERTICAL);
        auth.setPadding(d(15),d(15),d(15),d(16));
        auth.setBackground(homeSurface(Color.rgb(16,22,34),20,Color.rgb(43,60,91)));
        screen.addView(auth,new LinearLayout.LayoutParams(-1,-2));

        LinearLayout accountHeading=new LinearLayout(this);
        guestHeading=accountHeading;
        accountHeading.setGravity(Gravity.CENTER_VERTICAL);
        ImageView providerIcon=new ImageView(this);
        providerIcon.setImageResource(R.drawable.ps_pogocoordinates);
        providerIcon.setScaleType(ImageView.ScaleType.FIT_CENTER);
        providerIcon.setContentDescription("PoGoCoordinates");
        LinearLayout.LayoutParams providerIconLp=new LinearLayout.LayoutParams(d(42),d(42));
        providerIconLp.rightMargin=d(9);
        accountHeading.addView(providerIcon,providerIconLp);
        LinearLayout headingTexts=new LinearLayout(this);
        headingTexts.setOrientation(LinearLayout.VERTICAL);
        accountHeading.addView(headingTexts,new LinearLayout.LayoutParams(0,-2,1));
        TextView heading=homeText("PoGoCoordinates",17,Color.WHITE,true);
        headingTexts.addView(heading);
        sessionHint=homeText("Buscas comuns sem login · Shiny exige treinador vinculado",11,
            Color.rgb(156,174,205),false);
        headingTexts.addView(sessionHint);
        LinearLayout.LayoutParams headingLp=new LinearLayout.LayoutParams(-1,-2);
        headingLp.bottomMargin=d(12);
        auth.addView(accountHeading,headingLp);

        guestPanel=new LinearLayout(this);
        guestPanel.setGravity(Gravity.CENTER_VERTICAL);
        guestPanel.setOrientation(LinearLayout.HORIZONTAL);
        auth.addView(guestPanel,new LinearLayout.LayoutParams(-1,d(42)));
        Button discord=homeAuthButton("◉  Discord",Color.rgb(80,95,246),Color.WHITE);
        Button google=homeAuthButton("G  Google",Color.WHITE,Color.rgb(27,32,42));
        guestPanel.addView(discord,new LinearLayout.LayoutParams(0,-1,1));
        LinearLayout.LayoutParams googleLp=new LinearLayout.LayoutParams(0,-1,1);
        googleLp.leftMargin=d(8);
        guestPanel.addView(google,googleLp);
        discord.setOnClickListener(v->openProviderLogin("discord"));
        google.setOnClickListener(v->openProviderLogin("google"));

        connectedPanel=new LinearLayout(this);
        connectedPanel.setOrientation(LinearLayout.VERTICAL);
        auth.addView(connectedPanel,new LinearLayout.LayoutParams(-1,-2));
        LinearLayout accountRow=new LinearLayout(this);
        accountRow.setGravity(Gravity.CENTER_VERTICAL);
        connectedPanel.addView(accountRow,new LinearLayout.LayoutParams(-1,-2));
        ImageView avatar=new ImageView(this);
        accountAvatar=avatar;
        // A rebuilt Home owns a new ImageView; do not suppress reloading an
        // already-known URL just because the old view had shown that URL.
        shownAvatarUrl="";
        // A neutral fallback is used until the official profile provides
        // an allowlisted Google-hosted image (never a guessed portrait).
        avatar.setImageResource(android.R.drawable.ic_menu_myplaces);
        avatar.setColorFilter(Color.rgb(183,201,229));
        avatar.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        avatar.setPadding(d(11),d(11),d(11),d(11));
        android.graphics.drawable.GradientDrawable avatarBg=homeSurface(
            Color.rgb(34,46,69),30,Color.rgb(85,113,153));
        avatarBg.setShape(android.graphics.drawable.GradientDrawable.OVAL);
        avatar.setBackground(avatarBg);
        LinearLayout.LayoutParams avatarLp=new LinearLayout.LayoutParams(d(52),d(52));
        avatarLp.rightMargin=d(10);
        accountRow.addView(avatar,avatarLp);

        LinearLayout identity=new LinearLayout(this);
        identity.setOrientation(LinearLayout.VERTICAL);
        accountRow.addView(identity,new LinearLayout.LayoutParams(0,-2,1));
        accountDisplay=homeText("Conta conectada",17,Color.WHITE,true);
        accountDisplay.setSingleLine(true);
        accountDisplay.setEllipsize(android.text.TextUtils.TruncateAt.END);
        accountProvider=homeText("Conectado ao PoGoCoordinates",11,
            Color.rgb(175,191,224),false);
        accountProvider.setSingleLine(true);
        accountProvider.setEllipsize(android.text.TextUtils.TruncateAt.END);
        identity.addView(accountDisplay);
        identity.addView(accountProvider);
        Button logout=homeAuthButton("⇥  Logout",Color.rgb(28,37,54),Color.WHITE);
        logout.setBackground(homeSurface(Color.rgb(27,36,52),13,Color.rgb(51,67,92)));
        LinearLayout.LayoutParams logoutLp=new LinearLayout.LayoutParams(d(88),d(37));
        logoutLp.leftMargin=d(7);
        accountRow.addView(logout,logoutLp);
        logout.setOnClickListener(v->askLogout());

        trainerPanel=new LinearLayout(this);
        trainerPanel.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams trainLp=new LinearLayout.LayoutParams(-1,-2);
        trainLp.topMargin=d(13);
        connectedPanel.addView(trainerPanel,trainLp);
        View rule=new View(this);
        rule.setBackgroundColor(Color.rgb(39,53,74));
        LinearLayout.LayoutParams ruleLp=new LinearLayout.LayoutParams(-1,d(1));
        ruleLp.bottomMargin=d(10);
        trainerPanel.addView(rule,ruleLp);
        trainerSectionTitle=homeText("Treinador vinculado",12,Color.rgb(171,188,215),false);
        LinearLayout.LayoutParams sectionLp=new LinearLayout.LayoutParams(-1,-2);
        sectionLp.bottomMargin=d(7);
        trainerPanel.addView(trainerSectionTitle,sectionLp);

        LinearLayout trainerRow=new LinearLayout(this);
        trainerRow.setGravity(Gravity.CENTER_VERTICAL);
        trainerPanel.addView(trainerRow,new LinearLayout.LayoutParams(-1,-2));
        teamBadge=new ImageView(this);
        teamBadge.setImageResource(R.drawable.ps_team_neutral);
        teamBadge.setScaleType(ImageView.ScaleType.FIT_CENTER);
        teamBadge.setContentDescription("Sem equipe");
        // Individual team PNGs have transparent alpha; never put a tile behind them.
        teamBadge.setBackgroundColor(Color.TRANSPARENT);
        LinearLayout.LayoutParams badgeLp=new LinearLayout.LayoutParams(d(53),d(53));
        badgeLp.rightMargin=d(10);
        trainerRow.addView(teamBadge,badgeLp);
        LinearLayout trainerIdentity=new LinearLayout(this);
        trainerIdentity.setOrientation(LinearLayout.VERTICAL);
        trainerRow.addView(trainerIdentity,new LinearLayout.LayoutParams(0,-2,1));
        trainerDisplay=homeText("Treinador não confirmado",15,Color.WHITE,true);
        trainerDisplay.setSingleLine(true);
        trainerDisplay.setEllipsize(android.text.TextUtils.TruncateAt.END);
        trainerDetails=homeText("",11,Color.rgb(177,205,244),false);
        trainerIdentity.addView(trainerDisplay);
        trainerIdentity.addView(trainerDetails);

        trainerCodeGroup=new LinearLayout(this);
        trainerCodeGroup.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams codeRowLp=new LinearLayout.LayoutParams(-1,-2);
        codeRowLp.topMargin=d(5);
        trainerPanel.addView(trainerCodeGroup,codeRowLp);
        LinearLayout codeTexts=new LinearLayout(this);
        trainerCodeTexts=codeTexts;
        codeTexts.setOrientation(LinearLayout.VERTICAL);
        trainerCodeGroup.addView(codeTexts,new LinearLayout.LayoutParams(0,-2,1));
        TextView codeHeading=homeText("Código de Treinador",10,
            Color.rgb(158,178,207),false);
        trainerCode=homeText("",15,Color.WHITE,true);
        trainerCode.setLetterSpacing(.025f);
        codeTexts.addView(codeHeading);
        codeTexts.addView(trainerCode);
        TextView copy=homeMiniButton("⧉","Copiar código do treinador");
        trainerCopyButton=copy;
        copy.setTextSize(18);
        copy.setBackgroundColor(Color.TRANSPARENT);
        LinearLayout.LayoutParams copyLp=new LinearLayout.LayoutParams(d(34),d(38));
        copyLp.leftMargin=d(3);
        trainerCodeGroup.addView(copy,copyLp);
        copy.setOnClickListener(v->copyTrainerCode());
        trainerAction=homeAuthButton("Remover",Color.rgb(54,28,39),
            Color.rgb(255,145,158));
        trainerAction.setBackground(homeSurface(Color.rgb(52,29,40),12,
            Color.rgb(94,50,61)));
        LinearLayout.LayoutParams actionLp=new LinearLayout.LayoutParams(d(90),d(38));
        actionLp.leftMargin=d(7);
        trainerCodeGroup.addView(trainerAction,actionLp);
        trainerAction.setOnClickListener(v->openTrainerManagement());

        // HOME-V200: same live website DOM and site functions, embedded below
        // the existing account panel; never a second/fake form or backend.
        TextView filterCaption=homeText("Filtros oficiais  •  PoGoCoordinates",11,
            Color.rgb(176,199,229),true);
        filterCaption.setPadding(d(3),d(8),0,d(5));
        screen.addView(filterCaption,new LinearLayout.LayoutParams(-1,-2));
        FrameLayout filtersHost=new FrameLayout(this);
        filtersHost.setBackground(homeSurface(Color.rgb(10,11,15),13,Color.rgb(39,46,57)));
        filtersHost.setClipToOutline(true);
        homeFiltersWebView=new WebView(this);
        homeFiltersWebView.setBackgroundColor(Color.rgb(10,11,15));
        homeFiltersWebView.getSettings().setJavaScriptEnabled(true);
        homeFiltersWebView.getSettings().setDomStorageEnabled(false);
        homeFiltersWebView.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);
        homeFiltersWebView.getSettings().setAllowFileAccess(false);
        homeFiltersWebView.getSettings().setAllowContentAccess(false);
        homeFiltersWebView.getSettings().setBlockNetworkLoads(true);
        homeFiltersWebView.getSettings().setGeolocationEnabled(false);
        // The only WebView with HomeNative is local, no remote page or iframe.
        homeFiltersWebView.addJavascriptInterface(new HomeBridge(),"HomeNative");
        homeFiltersWebView.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view,android.webkit.WebResourceRequest req){
                return true; // No navigation from locally rendered HOME.
            }
            @Override public void onPageFinished(WebView view,String url){
                if(url!=null&&url.startsWith("https://pokesearch.invalid/")){
                    // Load the bundled Pokédex into the local, network-blocked HOME.
                    // The catalog only suggests species; actual forms and filters
                    // are always validated against the live official page.
                    try{
                        JSONArray catalog=new JSONArray(readAsset("pokemon_catalog.json"));
                        if(catalog.length()>1000)
                            view.evaluateJavascript("window.onHomeCatalog("+catalog.toString()+")",null);
                    }catch(org.json.JSONException e){
                        BugReport.log(MainActivity.this,"HOME","Catálogo Pokémon inválido");
                    }
                    syncHomeUi();
                }
            }
        });
        filtersHost.addView(homeFiltersWebView,new FrameLayout.LayoutParams(-1,-1));
        screen.addView(filtersHost,new LinearLayout.LayoutParams(-1,0,1));
        // Local HTML, CSP connect-src none. No duplicate PoGoCoordinates WebView.
        homeFiltersWebView.loadDataWithBaseURL("https://pokesearch.invalid/",
            readAsset("home_v200.html"),"text/html","UTF-8",null);
        return frame;
    }
    private void syncHomeUi(){
        WebView view=homeFiltersWebView;
        if(view==null)return;
        JSONObject state=HomeFilterState.snapshot(this);
        view.evaluateJavascript("window.onHomeState("+state.toString()+")",null);
    }
    private void sendHomeAction(String action,Intent extras){
        if(!OverlayService.isRunning())return;
        Intent intent=extras!=null?extras:new Intent(this,OverlayService.class);
        intent.setClass(this,OverlayService.class);
        intent.setAction(action);
        // Already running foreground service, no unrequested background start.
        startService(intent);
    }
    private final class HomeBridge {
        @android.webkit.JavascriptInterface public String snapshot(){
            return HomeFilterState.snapshot(MainActivity.this).toString();
        }
        @android.webkit.JavascriptInterface public void applyConfig(String json){
            if(json==null||json.length()>12000)return;
            runOnUiThread(()->{
                if(OverlayService.isRunning()){
                    Intent i=new Intent(MainActivity.this,OverlayService.class);
                    i.putExtra("config",json);
                    sendHomeAction(HomeFilterState.ACTION_CONFIG,i);
                }else if(!HomeFilterState.saveConfigIfStopped(MainActivity.this,json)){
                    Toast.makeText(MainActivity.this,"Valores de filtro inválidos",Toast.LENGTH_SHORT).show();
                }
                syncHomeUi();
            });
        }
        @android.webkit.JavascriptInterface public void setLocation(boolean enabled,String coords,int radius){
            if(coords==null||coords.length()>128)return;
            runOnUiThread(()->{
                if(OverlayService.isRunning()){
                    Intent i=new Intent(MainActivity.this,OverlayService.class);
                    i.putExtra("enabled",enabled);i.putExtra("coords",coords);i.putExtra("radius",radius);
                    sendHomeAction(HomeFilterState.ACTION_LOCATION,i);
                }else if(!HomeFilterState.saveLocationIfStopped(MainActivity.this,enabled,coords,radius)){
                    Toast.makeText(MainActivity.this,"Coordenadas inválidas",Toast.LENGTH_SHORT).show();
                }
                syncHomeUi();
            });
        }
        @android.webkit.JavascriptInterface public void setShiny(boolean enabled){
            runOnUiThread(()->{
                boolean current=getSharedPreferences("prefs",0).getBoolean("shiny",false);
                if(current!=enabled){
                    if(OverlayService.isRunning()){
                        Intent i=new Intent(MainActivity.this,OverlayService.class);
                        i.putExtra("enabled",enabled);
                        sendHomeAction(HomeFilterState.ACTION_SHINY,i);
                    }else getSharedPreferences("prefs",0).edit().putBoolean("shiny",enabled).apply();
                }
                syncHomeUi();
            });
        }
        @android.webkit.JavascriptInterface public void search(String payload){
            if(payload==null||payload.length()>12000)return;
            runOnUiThread(()->{
                if(OverlayService.isRunning()){
                    Intent intent=new Intent(MainActivity.this,OverlayService.class);
                    intent.putExtra("config",payload);
                    sendHomeAction(HomeFilterState.ACTION_SEARCH,intent);
                }else {
                    if(!HomeFilterState.saveConfigIfStopped(MainActivity.this,payload)){
                        Toast.makeText(MainActivity.this,"Reveja os filtros antes da busca",Toast.LENGTH_LONG).show();return;
                    }
                    Toast.makeText(MainActivity.this,
                        "Iniciando consulta no serviço oficial",Toast.LENGTH_LONG).show();
                    startOverlay(true); // Permissions still apply; remain in HOME.
                }
            });
        }
        @android.webkit.JavascriptInterface public void suggest(String query){
            if(query==null||query.length()>65)return;
            runOnUiThread(()->{
                if(OverlayService.isRunning()){
                    Intent i=new Intent(MainActivity.this,OverlayService.class);
                    i.putExtra("query",query);
                    sendHomeAction(HomeFilterState.ACTION_SUGGEST,i);
                }
                // With the overlay stopped, the local bundled catalog already
                // serves valid Pokédex species; do not clear those suggestions.
            });
        }
        @android.webkit.JavascriptInterface public void savePreset(String name,String value){
            if(name==null||value==null||name.trim().length()<1||name.length()>36||value.length()>12000)return;
            runOnUiThread(()->{
                try{
                    android.content.SharedPreferences p=getSharedPreferences("prefs",0);
                    JSONObject presets=new JSONObject(p.getString("homeSavedFilters","{}"));
                    if(presets.length()>=30&&!presets.has(name))return;
                    presets.put(name.trim(),new JSONObject(value));
                    p.edit().putString("homeSavedFilters",presets.toString()).apply();syncHomeUi();
                }catch(Exception ignored){}
            });
        }
        @android.webkit.JavascriptInterface public void deletePreset(String name){
            if(name==null||name.length()>36)return;
            runOnUiThread(()->{
                try{
                    android.content.SharedPreferences p=getSharedPreferences("prefs",0);
                    JSONObject presets=new JSONObject(p.getString("homeSavedFilters","{}"));
                    presets.remove(name);p.edit().putString("homeSavedFilters",presets.toString()).apply();syncHomeUi();
                }catch(Exception ignored){}
            });
        }
        @android.webkit.JavascriptInterface public void openAlerts(){runOnUiThread(()->{
            new AlertDialog.Builder(MainActivity.this).setTitle("Alertas do PokeSearch")
                .setMessage("As notificações são enviadas apenas para resultados confirmados pelo site. Configure os canais e favoritos no overlay.")
                .setPositiveButton("Configurar permissão",(d,w)->requestOverlayNotificationPermission())
                .setNegativeButton("Fechar",null).show();
        });}
    }
    private void openTrainerManagement(){
        String code=getSharedPreferences("prefs",0).getString("profileTrainerCode","");
        if(!code.matches("[0-9]{12}")){
            openLoginDialog(false,"manage");
            return;
        }
        new AlertDialog.Builder(this)
            .setTitle("Remover treinador vinculado")
            .setMessage("A remoção precisa ser confirmada no perfil oficial do PoGoCoordinates. Deseja abrir o gerenciamento?")
            .setNegativeButton("Cancelar",null)
            .setPositiveButton("Abrir perfil oficial",(dialog,which)->
                openLoginDialog(false,"manage"))
            .show();
    }
    private int homeTeamIcon(String team){
        if("Mystic".equalsIgnoreCase(team))return R.drawable.ps_team_mystic;
        if("Valor".equalsIgnoreCase(team))return R.drawable.ps_team_valor;
        if("Instinct".equalsIgnoreCase(team))return R.drawable.ps_team_instinct;
        return R.drawable.ps_team_neutral;
    }
    private Button homeAuthButton(String name,int bg,int fg){
        Button button=new Button(this);
        button.setText(name);button.setAllCaps(false);button.setTextSize(12);
        button.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        button.setTextColor(fg);button.setMinWidth(0);button.setMinimumWidth(0);
        button.setMinHeight(0);button.setMinimumHeight(0);
        button.setPadding(d(7),0,d(7),0);
        button.setBackground(homeSurface(bg,10,0));
        return button;
    }
    private void closeHomeMenu(){
        if(homeDrawerLayer!=null&&homeRoot!=null){
            homeRoot.removeView(homeDrawerLayer);
            homeDrawerLayer=null;
        }
    }
    private void addHomeDrawerItem(LinearLayout panel,String icon,String name,Runnable callback){
        TextView item=homeText(icon+"     "+name,15,Color.WHITE,false);
        item.setPadding(d(18),0,d(12),0);
        panel.addView(item,new LinearLayout.LayoutParams(-1,d(48)));
        item.setOnClickListener(v->{closeHomeMenu();callback.run();});
    }
    private void showHomeMenu(){
        if(homeRoot==null)return;
        if(homeDrawerLayer!=null){closeHomeMenu();return;}
        FrameLayout layer=new FrameLayout(this);
        View scrim=new View(this);
        scrim.setBackgroundColor(Color.argb(160,0,5,14));
        scrim.setOnClickListener(v->closeHomeMenu());
        layer.addView(scrim,new FrameLayout.LayoutParams(-1,-1));
        LinearLayout drawer=new LinearLayout(this);
        drawer.setOrientation(LinearLayout.VERTICAL);
        drawer.setPadding(0,d(14),0,d(10));
        drawer.setBackgroundColor(Color.rgb(25,42,60));
        int width=Math.min(d(286),getResources().getDisplayMetrics().widthPixels-d(48));
        FrameLayout.LayoutParams lp=new FrameLayout.LayoutParams(width,-1,Gravity.RIGHT|Gravity.TOP);
        layer.addView(drawer,lp);
        drawer.setOnClickListener(v->{});
        TextView label=homeText("  PokeSearch",19,Color.WHITE,true);
        drawer.addView(label,new LinearLayout.LayoutParams(-1,d(60)));
        View rule=new View(this);rule.setBackgroundColor(Color.argb(90,174,199,235));
        drawer.addView(rule,new LinearLayout.LayoutParams(-1,d(1)));
        addHomeDrawerItem(drawer,"★","Favoritos",this::openPicker);
        addHomeDrawerItem(drawer,"⚙","Preferências",this::showPreferencesDialog);
        addHomeDrawerItem(drawer,"⇩","Exportar dados",this::exportHomeData);
        addHomeDrawerItem(drawer,"?","Guia rápido",this::showQuickGuide);
        addHomeDrawerItem(drawer,"!","Reportar problema",this::showBugReportDialog);
        homeRoot.addView(layer,new FrameLayout.LayoutParams(-1,-1));
        homeDrawerLayer=layer;
    }
    private void exportHomeData(){
        // Export a fixed whitelist. No cookies, OAuth state, coordinates, trainer
        // codes, private identifiers, account profile or diagnostic logs.
        try{
            SharedPreferences prefs=getSharedPreferences("prefs",0);
            JSONObject out=new JSONObject();
            out.put("schema","pokesearch-home-export-v1");
            out.put("createdAt",new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ssZ",Locale.US)
                .format(new Date()));
            JSONObject settings=new JSONObject();
            String[] keys={"mode","rawAttack","rawDefense","rawStamina",
                "ivPercentMin","ivPercentMax","glRank","ulRank","shiny",
                "sort","intervalMinutes","spriteSize","showTimers",
                "alertsMode","alerts","locationEnabled","locationRadius"};
            for(String key:keys){
                Object value=prefs.getAll().get(key);
                if(value instanceof String||value instanceof Number||value instanceof Boolean)
                    settings.put(key,value);
            }
            out.put("filtersAndPreferences",settings);
            JSONArray favorites=new JSONArray();
            for(String name:WatchAlerts.watched(this))favorites.put(name);
            out.put("favorites",favorites);
            pendingExportText=out.toString(2);
            Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType("application/json");
            intent.putExtra(Intent.EXTRA_TITLE,"PokeSearch-dados-"+
                new SimpleDateFormat("yyyyMMdd-HHmm",Locale.US).format(new Date())+".json");
            startActivityForResult(intent,302);
        }catch(Exception e){
            pendingExportText="";
            Toast.makeText(this,"Não foi possível preparar os dados",Toast.LENGTH_SHORT).show();
        }
    }
    private void toggleHomeOverlay(){
        if(OverlayService.isRunning()){
            stopService(new Intent(this,OverlayService.class));
            Toast.makeText(this,"Overlay desativado",Toast.LENGTH_SHORT).show();
            refreshHomeOverlay();
            return;
        }
        startOverlay();
        if(homeRoot!=null)homeRoot.postDelayed(this::refreshHomeOverlay,750);
    }
    private void refreshHomeOverlay(){
        if(overlayControl==null)return;
        boolean on=OverlayService.isRunning();
        overlayControl.setImageResource(on?R.drawable.ic_overlay_on:R.drawable.ic_overlay_off);
        overlayControl.setContentDescription(on?"Desativar overlay":"Ativar overlay");
        overlayControl.setBackground(homeSurface(on?Color.argb(180,9,70,68):
            Color.argb(125,9,25,49),10,0));
    }
    private void openProviderLogin(String provider){
        preferredLoginProvider=provider;
        openLoginDialog(false);
    }
    private void copyTrainerCode(){
        String code=getSharedPreferences("prefs",0).getString("profileTrainerCode","");
        if(!code.matches("[0-9]{12}"))return;
        android.content.ClipboardManager manager=
            (android.content.ClipboardManager)getSystemService(CLIPBOARD_SERVICE);
        manager.setPrimaryClip(android.content.ClipData.newPlainText("Código de treinador",code));
        Toast.makeText(this,"Código copiado",Toast.LENGTH_SHORT).show();
    }

    private void showQuickGuide(){
        getSharedPreferences("prefs",0).edit().putBoolean("tutorialSeenV41",true).apply();
        // A scrollable visual guide reuses the actual icons from dock.html.
        // The action button belongs to the same charcoal translucent panel.
        LinearLayout layout=new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        android.graphics.drawable.GradientDrawable background=new android.graphics.drawable.GradientDrawable();
        background.setColor(Color.argb(240,43,50,61));
        background.setCornerRadius(d(16));
        layout.setBackground(background);
        WebView guide=new WebView(this);
        guide.setBackgroundColor(Color.TRANSPARENT);
        guide.getSettings().setJavaScriptEnabled(false);
        layout.addView(guide,new LinearLayout.LayoutParams(-1,0,1));
        TextView done=new TextView(this);
        done.setText("✓  Entendi");
        done.setGravity(Gravity.CENTER);
        done.setTextColor(Color.rgb(173,245,219));
        done.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        done.setTextSize(15);
        android.graphics.drawable.GradientDrawable buttonBg=new android.graphics.drawable.GradientDrawable();
        buttonBg.setColor(Color.argb(228,26,67,60));
        buttonBg.setCornerRadius(d(10));
        done.setBackground(buttonBg);
        LinearLayout.LayoutParams doneParams=new LinearLayout.LayoutParams(-1,d(44));
        doneParams.setMargins(d(13),d(5),d(13),d(13));
        layout.addView(done,doneParams);
        android.app.Dialog dialog=new android.app.Dialog(this);
        dialog.requestWindowFeature(android.view.Window.FEATURE_NO_TITLE);
        dialog.setContentView(layout);
        done.setOnClickListener(v->dialog.dismiss());
        dialog.show();
        if(dialog.getWindow()!=null){
            android.view.Window window=dialog.getWindow();
            window.setBackgroundDrawableResource(android.R.color.transparent);
            window.setLayout(Math.min(getResources().getDisplayMetrics().widthPixels-d(22),d(450)),
                Math.min(getResources().getDisplayMetrics().heightPixels-d(95),d(770)));
        }
        guide.loadUrl("file:///android_asset/tutorial.html");
    }
    private ImageButton makeIcon(int drawable,String description){
        ImageButton button=new ImageButton(this);
        button.setImageResource(drawable);
        button.setContentDescription(description);
        button.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        button.setPadding(d(10),d(10),d(10),d(10));
        button.setBackgroundColor(Color.TRANSPARENT);
        return button;
    }
    private android.graphics.drawable.GradientDrawable round(int color,int radius){
        android.graphics.drawable.GradientDrawable bg=new android.graphics.drawable.GradientDrawable();
        bg.setColor(color);bg.setCornerRadius(d(radius));return bg;
    }

    // Fetch only a public Google avatar URL explicitly present in the
    // authenticated /profile DOM. Never forward cookies or OAuth secrets.
    private static boolean allowedGoogleAvatar(String url){
        if(url==null||url.length()>1600)return false;
        try{
            Uri uri=Uri.parse(url);
            String host=uri.getHost(),scheme=uri.getScheme();
            return "https".equalsIgnoreCase(scheme)&&host!=null&&
                (host.equalsIgnoreCase("googleusercontent.com")||
                 host.toLowerCase(Locale.ROOT).endsWith(".googleusercontent.com"))&&
                uri.getUserInfo()==null;
        }catch(Exception ignored){return false;}
    }
    private String shownAvatarUrl="";
    private void refreshGoogleAvatar(String url){
        if(accountAvatar==null)return;
        final String next=allowedGoogleAvatar(url)?url:"";
        if(shownAvatarUrl.equals(next))return;
        shownAvatarUrl=next;
        accountAvatar.setImageResource(android.R.drawable.ic_menu_myplaces);
        accountAvatar.setColorFilter(Color.rgb(183,201,229));
        accountAvatar.setPadding(d(11),d(11),d(11),d(11));
        if(next.isEmpty())return;
        new Thread(()->{
            android.graphics.Bitmap bitmap=null;
            java.net.HttpURLConnection connection=null;
            try{
                // Google public avatar CDN occasionally redirects between
                // googleusercontent hosts. Follow only a short allowlisted chain,
                // never forward WebView cookies or bearer credentials.
                String current=next;
                boolean ready=false;
                for(int redirect=0;redirect<4;redirect++){
                    if(!allowedGoogleAvatar(current))break;
                    if(connection!=null)connection.disconnect();
                    connection=(java.net.HttpURLConnection)new java.net.URL(current).openConnection();
                    connection.setInstanceFollowRedirects(false);
                    connection.setConnectTimeout(5000);
                    connection.setReadTimeout(6000);
                    int code=connection.getResponseCode();
                    if(code==200){ready=true;break;}
                    if(code!=301&&code!=302&&code!=303&&code!=307&&code!=308)break;
                    String location=connection.getHeaderField("Location");
                    if(location==null)break;
                    String redirected=new java.net.URL(new java.net.URL(current),location).toExternalForm();
                    if(!allowedGoogleAvatar(redirected))break;
                    current=redirected;
                }
                if(!ready)return;
                if(!String.valueOf(connection.getContentType()).startsWith("image/"))return;
                if(connection.getContentLengthLong()>2_500_000L)return;
                try(InputStream stream=new java.io.BufferedInputStream(connection.getInputStream())){
                    ByteArrayOutputStream data=new ByteArrayOutputStream();
                    byte[] buf=new byte[8192];int n;
                    while((n=stream.read(buf))!=-1){
                        if(data.size()+n>2_500_000)return;
                        data.write(buf,0,n);
                    }
                    byte[] bytes=data.toByteArray();
                    bitmap=android.graphics.BitmapFactory.decodeByteArray(bytes,0,bytes.length);
                }
            }catch(Exception ignored){
                // Network or an unavailable avatar keeps the neutral icon.
            }finally{
                if(connection!=null)connection.disconnect();
                if(bitmap==null)runOnUiThread(()->{
                    // Includes early returns on HTTP failure/redirect/size.
                    // Do not permanently cache a failed URL on the new Home.
                    if(next.equals(shownAvatarUrl))shownAvatarUrl="";
                });
            }
            final android.graphics.Bitmap photo=bitmap;
            if(photo!=null)runOnUiThread(()->{
                if(accountAvatar==null||!shownAvatarUrl.equals(next)||
                    !"autenticada".equals(getSharedPreferences("prefs",0)
                        .getString("sessionStatus","")))return;
                accountAvatar.clearColorFilter();
                accountAvatar.setPadding(0,0,0,0);
                accountAvatar.setScaleType(ImageView.ScaleType.CENTER_CROP);
                accountAvatar.setImageBitmap(photo);
            });
        },"PokeSearch-Google-Avatar").start();
    }

    private void refreshSessionSummary(){
        SharedPreferences prefs=getSharedPreferences("prefs",0);
        boolean logged="autenticada".equals(prefs.getString("sessionStatus","não confirmado"));
        if(guestHeading!=null)guestHeading.setVisibility(logged?View.GONE:View.VISIBLE);
        if(guestPanel!=null)guestPanel.setVisibility(logged?View.GONE:View.VISIBLE);
        if(connectedPanel!=null)connectedPanel.setVisibility(logged?View.VISIBLE:View.GONE);
        if(sessionHint!=null)sessionHint.setText(
            "Buscas comuns sem login · Shiny exige treinador vinculado");
        if(accountDisplay!=null)accountDisplay.setText(
            prefs.getString("profileDisplayName","Conta conectada"));
        refreshGoogleAvatar(logged?prefs.getString("profileAvatarUrl",""):"");
        if(accountProvider!=null){
            String provider=prefs.getString("profileProvider","");
            accountProvider.setText("Google".equals(provider)?"G  Logado via Google":
                "Discord".equals(provider)?"◉  Logado via Discord":
                "Conectado ao PoGoCoordinates");
        }
        String trainer=prefs.getString("profileTrainerName",""),
            code=prefs.getString("profileTrainerCode","");
        boolean linked=logged&&!trainer.isEmpty()&&code.matches("[0-9]{12}")&&
            "linked".equals(prefs.getString("profileTrainerState","unknown"));
        if(trainerPanel!=null)trainerPanel.setVisibility(logged?View.VISIBLE:View.GONE);
        if(trainerCodeGroup!=null)trainerCodeGroup.setVisibility(logged?View.VISIBLE:View.GONE);
        if(trainerCodeTexts!=null)trainerCodeTexts.setVisibility(linked?View.VISIBLE:View.INVISIBLE);
        if(trainerCopyButton!=null)trainerCopyButton.setVisibility(linked?View.VISIBLE:View.GONE);
        if(trainerSectionTitle!=null)trainerSectionTitle.setText(linked?
            "Treinador vinculado":"Conta Pokémon GO");
        String team=prefs.getString("profileTrainerTeam","");
        String details=prefs.getString("profileTrainerDetails","");
        if(team.isEmpty()){
            if(details.contains("Mystic"))team="Mystic";
            else if(details.contains("Valor"))team="Valor";
            else if(details.contains("Instinct"))team="Instinct";
        }
        if(teamBadge!=null){
            teamBadge.setImageResource(homeTeamIcon(linked?team:""));
            teamBadge.setContentDescription(linked&&team.length()>0?
                "Equipe "+team:"Sem equipe");
        }
        if(trainerDisplay!=null)trainerDisplay.setText(linked?trainer:
            "unlinked".equals(prefs.getString("profileTrainerState","unknown"))?
                "Nenhum treinador vinculado":"Treinador não confirmado");
        if(trainerDetails!=null){
            trainerDetails.setText(linked?(details.isEmpty()?
                (team.isEmpty()?"Sem equipe":team):"★ "+details):
                "Gerencie seu vínculo no PoGoCoordinates");
            trainerDetails.setTextColor("Mystic".equals(team)?Color.rgb(104,183,255):
                "Valor".equals(team)?Color.rgb(255,130,134):
                "Instinct".equals(team)?Color.rgb(255,211,99):
                Color.rgb(165,185,214));
        }
        if(linked&&trainerCode!=null)
            trainerCode.setText(code.substring(0,4)+" "+code.substring(4,8)+" "+code.substring(8));
        if(trainerAction!=null)trainerAction.setText(linked?"Remover":"Gerenciar");
        if(sessionSummary!=null)sessionSummary.setText(logged?
            "● Sessão identificada · PoGoCoordinates":"○ Login necessário");
    }
    private void askLogout(){
        new AlertDialog.Builder(this)
            .setTitle("Desconectar PoGoCoordinates?")
            .setMessage("Sair apagará a sessão local do site neste aplicativo e encerrará o overlay ativo. Favoritos e preferências gerais serão mantidos. Sua conta Google/Discord continuará intacta.")
            .setNegativeButton("Cancelar",null)
            .setPositiveButton("Desconectar",(dialog,which)->logoutLocalSession())
            .show();
    }
    private void logoutLocalSession(){
        // Do not start a service for sign-out. Stop the collector before revoking cookies.
        stopService(new Intent(this,OverlayService.class));
        if(loginDialog!=null&&loginDialog.isShowing())loginDialog.dismiss();
        getSharedPreferences("prefs",0).edit()
            .putString("sessionStatus","desconectado")
            .remove("profileDisplayName").remove("profileProvider").remove("profileAvatarUrl")
            .remove("profileTrainerName").remove("profileTrainerCode")
            .remove("profileTrainerDetails").remove("profileTrainerState")
            .remove("profileTrainerTeam").remove("profileTrainerLevel")
            .putBoolean("shiny",false)
            .putString("lastStatus","Sessão local desconectada")
            .putString("lastError","Nenhum")
            .apply();
        refreshSessionSummary();
        CookieManager.getInstance().removeAllCookies(cleared->{
            CookieManager.getInstance().flush();
            WebStorage.getInstance().deleteAllData();
            runOnUiThread(()->Toast.makeText(this,
                "Sessão do PokeSearch desconectada",Toast.LENGTH_SHORT).show());
        });
        BugReport.log(this,"SESSION","Desconexão local solicitada");
    }
    private void refreshWatchCount(){
        if(watchSummary==null)return;
        int size=WatchAlerts.watched(this).size();
        watchSummary.setText(size==0?"Nenhum favorito · toque para escolher":
            size+" favorito"+(size==1?"":"s")+" · toque para editar");
    }
    private void openPicker(){
        PokemonPicker.show(this,this::refreshWatchCount);
    }
    @Override protected void onResume(){
        super.onResume();
        refreshWatchCount();
        refreshSessionSummary();
        refreshHomeOverlay();
        homeForeground=true;
        android.content.IntentFilter filter=new android.content.IntentFilter(HomeFilterState.ACTION_EVENT);
        if(android.os.Build.VERSION.SDK_INT>=33)
            registerReceiver(homeEvents,filter,android.content.Context.RECEIVER_NOT_EXPORTED);
        else registerReceiver(homeEvents,filter);
        homeHandler.removeCallbacks(homePoll);
        homePoll.run();
        sendHomeAction(HomeFilterState.ACTION_SYNC,null);
    }
    @Override protected void onPause(){
        homeForeground=false;homeHandler.removeCallbacks(homePoll);
        try{unregisterReceiver(homeEvents);}catch(IllegalArgumentException ignored){}
        super.onPause();
    }
    private void handleShinyLoginIntent(Intent intent){
        if(intent!=null && "com.lucianotoscano.pokesearchoverlay.OPEN_SHINY_LOGIN".equals(intent.getAction()))
            getWindow().getDecorView().post(this::openLoginDialog);
    }
    private void serviceAction(String action){serviceAction(action,false);}
    private void serviceAction(String action,boolean authConfirmed){
        Intent intent=new Intent(this,OverlayService.class);
        intent.setAction(action);
        intent.putExtra("authConfirmed",authConfirmed);
        if(!OverlayService.isRunning())return;
        if(Build.VERSION.SDK_INT>=26)startForegroundService(intent);else startService(intent);
    }
    private void notifyOverlaySessionReady(){
        CookieManager.getInstance().flush();
        if(!OverlayService.isRunning())return;
        Intent intent=new Intent(this,OverlayService.class);
        intent.setAction("com.lucianotoscano.pokesearchoverlay.REFRESH_LOGIN");
        if(Build.VERSION.SDK_INT>=26)startForegroundService(intent);else startService(intent);
    }
    // Checking only Logout fails on mobile where it sits inside the hamburger.
    // Use the same sanitized session probe as the collector. Never read/log the
    // account identifier itself. Login completion is independent from Shiny ON.
    private void checkLoginSession(WebView view,int attemptsLeft,int pageGeneration){
        if(attemptsLeft<=0||view!=website||loginPageGeneration!=pageGeneration||
           loginDialog==null||!loginDialog.isShowing()||loginAutoReturnQueued)return;
        Uri current=Uri.parse(view.getUrl()==null?"":view.getUrl());
        String host=current.getHost();
        if(host==null||!(host.equalsIgnoreCase("pogocoordinates.com")||
           host.toLowerCase(Locale.ROOT).endsWith(".pogocoordinates.com")))return;
        String probe=readAsset("probe.js")
            .replace("__ACTION__",JSONObject.quote("session"))
            .replace("__MODE__",JSONObject.quote("iv"))
            .replace("__SHINY__","false")
            .replace("__FILTERS__","{}");
        view.evaluateJavascript(probe,raw->{
            if(view!=website||loginPageGeneration!=pageGeneration||
               loginDialog==null||!loginDialog.isShowing()||loginAutoReturnQueued)return;
            String auth="não confirmado";
            try{
                String json=new JSONArray("["+raw+"]").getString(0);
                auth=new JSONObject(json).optString("auth","não confirmado");
            }catch(Exception e){
                BugReport.log(MainActivity.this,"SESSION",
                    "interpretar login · "+e.getClass().getSimpleName());
            }
            if("autenticada".equals(auth)){
                loginSessionNotified=true;
                // A newly confirmed OAuth session may belong to another account.
                // Never reuse the prior trainer proof while /profile hydrates.
                getSharedPreferences("prefs",0).edit()
                    .putString("sessionStatus","autenticada")
                    .putString("profileTrainerState","unknown")
                    .remove("profileAvatarUrl")
                    .remove("profileTrainerName").remove("profileTrainerCode")
                    .remove("profileTrainerDetails").remove("profileTrainerTeam")
                    .remove("profileTrainerLevel").apply();
                CookieManager.getInstance().flush();
                if("manage".equals(loginPurpose)){
                    // Management must stay open until the user explicitly leaves.
                    refreshSessionSummary();
                    return;
                }
                loginAutoReturnQueued=true;
                refreshSessionSummary();
                // The site returns to /search after OAuth. Public account
                // metadata is at /profile, not the search view.
                profileCaptureInProgress=true;
                avatarReadRetryCount=0;
                if("/profile".equals(current.getPath())){
                    captureOfficialProfile(view,pageGeneration);
                }else{
                    if(loginWaitLabel!=null)loginWaitLabel.setText("Sincronizando perfil…");
                    if(loginCover!=null)loginCover.setVisibility(View.VISIBLE);
                    view.loadUrl("https://pogocoordinates.com/profile");
                }
                // Site-origin failures must never trap the user in a page.
                view.postDelayed(()->{
                    if(view==website&&loginAutoReturnQueued&&
                       loginDialog!=null&&loginDialog.isShowing())
                        loginDialog.dismiss();
                },6500L);
            }else{
                // Search does not expose a Shiny badge for unlinked trainers.
                // On an ambiguous, hydrated page, visit the official profile once.
                if("não confirmado".equals(auth)&&!profileDiscoveryAttempted&&
                   !"/profile".equals(current.getPath())&&attemptsLeft<=12){
                    profileDiscoveryAttempted=true;
                    view.loadUrl("https://pogocoordinates.com/profile");
                    return;
                }
                if(!"manage".equals(loginPurpose)&&attemptsLeft<=13&&
                   !loginDiscoveryStarted&&!loginLinkAttempted){
                    loginDiscoveryStarted=true;
                    openOfficialLoginControl(view,8);
                }
                // Do not infinitely retry an unauthenticated or unhydrated page.
                if(attemptsLeft>1)view.postDelayed(
                    ()->checkLoginSession(view,attemptsLeft-1,pageGeneration),450L);
                else if(loginWaitLabel!=null){
                    loginWaitLabel.setText("Login não confirmado. Você pode voltar ou abrir o site.");
                    if(loginFallback!=null)loginFallback.setVisibility(View.VISIBLE);
                }
            }
        });
    }
    private void captureOfficialProfile(WebView view,int generation){
        if(view!=website||loginDialog==null||!loginDialog.isShowing()||
           !loginAutoReturnQueued||!profileCaptureInProgress)return;
        Uri current=Uri.parse(view.getUrl()==null?"":view.getUrl());
        String host=current.getHost();
        if(host==null||!(host.equalsIgnoreCase("pogocoordinates.com")||
            host.toLowerCase(Locale.ROOT).endsWith(".pogocoordinates.com"))||
            !"/profile".equals(current.getPath()))return;
        // Allow the React profile cards to hydrate after onPageFinished.
        view.evaluateJavascript(readAsset("profile_summary.js"),raw->{
            if(view!=website||generation!=loginPageGeneration||
               loginDialog==null||!loginDialog.isShowing()||
               !profileCaptureInProgress)return;
            boolean parsed=false;
            boolean avatarAwaitingHydration=false;
            try{
                String payload=new JSONArray("["+raw+"]").getString(0);
                JSONObject profile=new JSONObject(payload);
                if(profile.optBoolean("ok",false)&&
                   "profile".equals(profile.optString("page"))){
                    SharedPreferences.Editor edit=getSharedPreferences("prefs",0).edit();
                    String name=profile.optString("displayName","").trim();
                    String provider=profile.optString("provider","");
                    // Linked Google/Discord provider is NOT proof of the
                    // provider used this time. Only observed OAuth is.
                    if(!provider.equals("Google")&&!provider.equals("Discord"))
                        provider=observedLoginProvider;
                    if(name.length()>0&&name.length()<=65)
                        edit.putString("profileDisplayName",name);
                    if(provider.equals("Google")||provider.equals("Discord"))
                        edit.putString("profileProvider",provider);
                    String avatar=profile.optString("avatarUrl","");
                    if("Google".equals(provider)&&allowedGoogleAvatar(avatar))
                        edit.putString("profileAvatarUrl",avatar);
                    else {
                        edit.remove("profileAvatarUrl");
                        // The official React profile can show the name before
                        // its public Google avatar has finished loading.
                        avatarAwaitingHydration="Google".equals(provider);
                    }
                    String state=profile.optString("trainerState","unknown");
                    String trainer=profile.optString("trainerName","");
                    String code=profile.optString("trainerCode","");
                    if("linked".equals(state)&&trainer.length()>0&&
                       trainer.length()<=40&&code.matches("[0-9]{12}")){
                        String level=profile.optString("level","");
                        String team=profile.optString("team","");
                        String details=(level.matches("[0-9]{1,2}")?"Nível "+level:"")+
                            (team.matches("Mystic|Valor|Instinct")?
                             (level.isEmpty()?"":" · ")+team:"");
                        edit.putString("profileTrainerState","linked")
                            .putString("profileTrainerName",trainer)
                            .putString("profileTrainerCode",code)
                            .putString("profileTrainerDetails",details)
                            .putString("profileTrainerTeam",team.matches("Mystic|Valor|Instinct")?team:"")
                            .putString("profileTrainerLevel",level.matches("[0-9]{1,2}")?level:"");
                    }else{
                        // Unlinked or unverified current account never inherits
                        // a linked trainer from the previous login.
                        edit.putString("profileTrainerState",
                                "unlinked".equals(state)?"unlinked":"unknown")
                            .remove("profileTrainerName").remove("profileTrainerCode")
                            .remove("profileTrainerDetails")
                            .remove("profileTrainerTeam").remove("profileTrainerLevel");
                    }
                    edit.apply();
                    parsed=true;
                }
            }catch(Exception e){
                BugReport.log(MainActivity.this,"HOME",
                    "Perfil não confirmado · "+e.getClass().getSimpleName());
            }
            if(!parsed){
                // A returned 200 is not proof that React rendered the cards.
                view.postDelayed(()->captureOfficialProfile(view,generation),600L);
                return;
            }
            if(avatarAwaitingHydration&&avatarReadRetryCount<2){
                avatarReadRetryCount++;
                // Preserve the already confirmed trainer data, wait briefly for
                // the public picture; do not attempt OAuth or access cookies.
                view.postDelayed(()->captureOfficialProfile(view,generation),700L);
                return;
            }
            profileCaptureInProgress=false;
            refreshSessionSummary();
            if(loginDialog!=null&&loginDialog.isShowing())loginDialog.dismiss();
        });
    }
    // Site controls may hydrate after onPageFinished. Retry briefly instead
    // of opening the full search page and leaving the user to locate Login.
    // Never invent a private OAuth endpoint or click on provider domains.
    private void openOfficialLoginControl(WebView view,int remaining){
        if(remaining<=0){
            // Site DOM is not under our control. Do not trap users behind a mask.
            // Only an explicit tap reveals the full site as a fallback.
            if(loginWaitLabel!=null)loginWaitLabel.setText("Acesso não encontrado automaticamente");
            if(loginFallback!=null)loginFallback.setVisibility(View.VISIBLE);
            return;
        }
        if(view!=website||loginLinkAttempted||
           loginDialog==null||!loginDialog.isShowing())return;
        Uri current=Uri.parse(view.getUrl()==null?"":view.getUrl());
        String host=current.getHost();
        if(host==null||!(host.equalsIgnoreCase("pogocoordinates.com")||
           host.toLowerCase(Locale.ROOT).endsWith(".pogocoordinates.com")))return;
        String script=readAsset("login_entry.js")
            .replace("__SHINY__",loginStartedForShiny?"true":"false")
            .replace("__PROVIDER__",JSONObject.quote(preferredLoginProvider));
        view.evaluateJavascript(script,result->{
            if(view!=website||loginLinkAttempted||loginDialog==null||
               !loginDialog.isShowing())return;
            if(result!=null&&result.contains("\"authenticated\"")){
                // The independent session probe will return to PokeSearch.
                loginLinkAttempted=true;
            }else if(result!=null&&result.contains("\"ready\"")){
                // Only the actual Google/Discord/sign-in choice becomes visible.
                loginLinkAttempted=true;
                if(loginCover!=null)loginCover.setVisibility(View.GONE);
            }else{
                // The official login / Shiny switch was triggered, but let the
                // modal finish rendering before revealing the page.
                view.postDelayed(()->openOfficialLoginControl(view,remaining-1),260L);
            }
        });
    }
    private void openLoginDialog(){openLoginDialog(true,"login");}
    private void openLoginDialog(boolean shinyRequest){openLoginDialog(shinyRequest,"login");}
    private void openLoginDialog(boolean shinyRequest,String purpose){
        if(loginDialog!=null&&loginDialog.isShowing())return;
        loginPurpose="manage".equals(purpose)?"manage":"login";
        loginStartedForShiny=shinyRequest;
        profileCaptureInProgress=false;
        profileDiscoveryAttempted=false;
        if(shinyRequest)preferredLoginProvider="";
        observedLoginProvider="";
        loginAutoReturnQueued=false;
        loginSessionNotified=false;
        loginLinkAttempted=false;
        loginDiscoveryStarted=false;
        website=new WebView(this);
        website.setBackgroundColor(Color.rgb(11,13,18));
        website.getSettings().setJavaScriptEnabled(true);
        website.getSettings().setDomStorageEnabled(true);
        website.getSettings().setDatabaseEnabled(true);
        website.setFocusable(true);
        website.setFocusableInTouchMode(true);
        website.setImportantForAutofill(android.view.View.IMPORTANT_FOR_AUTOFILL_YES);
        website.getSettings().setJavaScriptCanOpenWindowsAutomatically(true);
        website.getSettings().setAllowFileAccess(false);
        website.getSettings().setAllowContentAccess(false);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(website,true);
        website.setWebChromeClient(new WebChromeClient());
        website.setWebViewClient(new WebViewClient(){
            @Override public void onPageStarted(WebView view,String url,android.graphics.Bitmap icon){
                ++loginPageGeneration;
                loginLinkAttempted=false;
                loginDiscoveryStarted=false;
                Uri current=Uri.parse(url==null?"":url);
                String host=current.getHost();
                if(host!=null){
                    String lower=host.toLowerCase(Locale.ROOT);
                    if(lower.equals("accounts.google.com"))observedLoginProvider="Google";
                    else if(lower.equals("discord.com")||lower.endsWith(".discord.com"))
                        observedLoginProvider="Discord";
                }
                boolean site=host!=null&&(host.equalsIgnoreCase("pogocoordinates.com")||
                    host.toLowerCase(Locale.ROOT).endsWith(".pogocoordinates.com"));
                if(loginCover!=null)loginCover.setVisibility(site?View.VISIBLE:View.GONE);
            }
            @Override public void onPageFinished(WebView view,String url){
                if(url==null||view!=website)return;
                String host=Uri.parse(url).getHost();
                if(host==null||!(host.equalsIgnoreCase("pogocoordinates.com")||
                     host.toLowerCase(Locale.ROOT).endsWith(".pogocoordinates.com")))return;
                int generation=loginPageGeneration;
                if(loginAutoReturnQueued){
                    if("/profile".equals(Uri.parse(url).getPath()))
                        view.postDelayed(()->captureOfficialProfile(view,generation),700L);
                    return;
                }
                if("manage".equals(loginPurpose)){
                    // Profile management is an intentional official-site view.
                    if(loginCover!=null)loginCover.setVisibility(View.GONE);
                    return;
                }
                checkLoginSession(view,14,generation);
            }
        });
        // Single full-screen login surface. No Android alert footer competing
        // with Google/Discord or the trainer-code keyboard.
        LinearLayout loginRoot=new LinearLayout(this);
        loginRoot.setOrientation(LinearLayout.VERTICAL);
        loginRoot.setBackgroundColor(Color.rgb(11,13,18));
        LinearLayout toolbar=new LinearLayout(this);
        toolbar.setOrientation(LinearLayout.HORIZONTAL);
        toolbar.setGravity(Gravity.CENTER_VERTICAL);
        toolbar.setPadding(d(12),0,d(12),0);
        toolbar.setBackgroundColor(Color.rgb(20,24,31));
        TextView loginName=new TextView(this);
        loginName.setText("manage".equals(loginPurpose)?"PoGoCoordinates · Perfil":"PoGoCoordinates · Login");
        loginName.setTextColor(Color.WHITE);
        loginName.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        loginName.setTextSize(15);
        toolbar.addView(loginName,new LinearLayout.LayoutParams(0,d(48),1));
        TextView done=new TextView(this);
        done.setText("✓ PokeSearch");
        done.setTextColor(Color.rgb(126,212,204));
        done.setTextSize(14);
        done.setGravity(Gravity.CENTER);
        done.setPadding(d(8),0,d(8),0);
        toolbar.addView(done,new LinearLayout.LayoutParams(d(95),d(48)));
        loginRoot.addView(toolbar);
        // Keep the full search page invisible unless the official login
        // control actually opens or the user explicitly requests fallback.
        FrameLayout loginStage=new FrameLayout(this);
        loginStage.addView(website,new FrameLayout.LayoutParams(-1,-1));
        LinearLayout loginWaiting=new LinearLayout(this);
        loginWaiting.setOrientation(LinearLayout.VERTICAL);
        loginWaiting.setGravity(Gravity.CENTER);
        loginWaiting.setPadding(d(22),d(24),d(22),d(24));
        loginWaiting.setBackgroundColor(Color.rgb(11,13,18));
        android.widget.ProgressBar spinner=new android.widget.ProgressBar(this);
        loginWaiting.addView(spinner,new LinearLayout.LayoutParams(d(32),d(32)));
        loginWaitLabel=new TextView(this);
        loginWaitLabel.setText("Preparando acesso ao PoGoCoordinates…");
        loginWaitLabel.setTextColor(Color.rgb(224,226,228));
        loginWaitLabel.setTextSize(14);
        loginWaitLabel.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams msgLp=new LinearLayout.LayoutParams(-1,-2);
        msgLp.topMargin=d(14);
        loginWaiting.addView(loginWaitLabel,msgLp);
        loginFallback=new TextView(this);
        loginFallback.setText("Mostrar o site para entrar");
        loginFallback.setTextColor(Color.WHITE);
        loginFallback.setTextSize(13);
        loginFallback.setGravity(Gravity.CENTER);
        loginFallback.setPadding(d(16),d(12),d(16),d(12));
        loginFallback.setBackground(round(Color.rgb(54,57,61),10));
        loginFallback.setVisibility(View.GONE);
        loginFallback.setOnClickListener(v->{
            if(loginCover!=null)loginCover.setVisibility(View.GONE);
        });
        LinearLayout.LayoutParams fallbackLp=new LinearLayout.LayoutParams(-2,-2);
        fallbackLp.topMargin=d(14);
        loginWaiting.addView(loginFallback,fallbackLp);
        loginStage.addView(loginWaiting,new FrameLayout.LayoutParams(-1,-1));
        loginCover=loginWaiting;
        loginRoot.addView(loginStage,new LinearLayout.LayoutParams(-1,0,1));
        loginDialog=new android.app.Dialog(this);
        if(loginDialog.getWindow()!=null)loginDialog.getWindow().addFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE);
        loginDialog.requestWindowFeature(android.view.Window.FEATURE_NO_TITLE);
        loginDialog.setContentView(loginRoot);
        // Dialog consumes Android Back before Activity.onBackPressed().
        // Navigate OAuth/WebView history instead of prematurely closing login.
        loginDialog.setOnKeyListener((dialog,keyCode,event)->{
            if(keyCode!=android.view.KeyEvent.KEYCODE_BACK||website==null||!website.canGoBack())
                return false;
            if(event.getAction()==android.view.KeyEvent.ACTION_UP)website.goBack();
            return event.getAction()==android.view.KeyEvent.ACTION_DOWN||
                   event.getAction()==android.view.KeyEvent.ACTION_UP;
        });
        done.setOnClickListener(v->loginDialog.dismiss());
        loginDialog.setOnDismissListener(d->{
            boolean authenticatedNow=loginSessionNotified;
            boolean fromOverlay=loginStartedForShiny;
            ++loginPageGeneration; // Invalidate pending WebView session probes.
            loginCover=null;
            profileCaptureInProgress=false;
            loginWaitLabel=null;
            loginFallback=null;
            if(website!=null){website.stopLoading();website.destroy();website=null;}
            loginDialog=null;
            serviceAction("com.lucianotoscano.pokesearchoverlay.LOGIN_END",authenticatedNow);
            // Closing without a confirmed login must not reload the session.
            if(authenticatedNow)notifyOverlaySessionReady();
            refreshSessionSummary();
            if(authenticatedNow&&fromOverlay&&OverlayService.isRunning()){
                // Return to Pokémon GO with the PokeSearch overlay visible.
                getWindow().getDecorView().postDelayed(()->moveTaskToBack(true),220L);
            }
        });
        serviceAction("com.lucianotoscano.pokesearchoverlay.LOGIN_BEGIN");
        loginDialog.show();
        android.view.Window loginWindow=loginDialog.getWindow();
        if(loginWindow!=null){
            loginWindow.addFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE);
            loginWindow.setBackgroundDrawableResource(android.R.color.transparent);
            loginWindow.setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
            loginWindow.setLayout(android.view.WindowManager.LayoutParams.MATCH_PARENT,
                android.view.WindowManager.LayoutParams.MATCH_PARENT);
            loginWindow.clearFlags(android.view.WindowManager.LayoutParams.FLAG_ALT_FOCUSABLE_IM);
        }
        website.requestFocus();
        website.loadUrl("manage".equals(loginPurpose)?
            "https://pogocoordinates.com/profile":"https://pogocoordinates.com/search");
    }
    @Override protected void onNewIntent(Intent intent){
        super.onNewIntent(intent);
        setIntent(intent);
        handleShinyLoginIntent(intent);
        if("com.lucianotoscano.pokesearchoverlay.EDIT_WATCH_LIST".equals(intent.getAction()))
            getWindow().getDecorView().post(this::openPicker);
        if("com.lucianotoscano.pokesearchoverlay.OPEN_SETTINGS".equals(intent.getAction()))
            getWindow().getDecorView().post(this::showPreferencesDialog);
        if("com.lucianotoscano.pokesearchoverlay.OPEN_PIX".equals(intent.getAction()))
            getWindow().getDecorView().post(()->PixSupport.show(this));
        if("com.lucianotoscano.pokesearchoverlay.OPEN_REPORT".equals(intent.getAction()))
            getWindow().getDecorView().post(this::showBugReportDialog);
        if("com.lucianotoscano.pokesearchoverlay.REQUEST_NOTIFICATION_PERMISSION".equals(intent.getAction()))
            getWindow().getDecorView().post(this::requestOverlayNotificationPermission);
    }
    private void showBugReportDialog(){
        BugReport.log(this,"report","Relatório aberto manualmente");
        EditText description=new EditText(this);
        description.setHint("Descreva o erro ou sua sugestão (opcional)");
        description.setMinLines(3);
        description.setMaxLines(6);
        description.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_FLAG_MULTI_LINE);
        new AlertDialog.Builder(this)
            .setTitle("⚠️ Reportar bug / sugestão")
            .setMessage("O relatório filtra formatos comuns de dados sensíveis. Revise o conteúdo antes de compartilhar.")
            .setView(description)
            .setNegativeButton("Fechar",null)
            .setNeutralButton("Exportar TXT",(dialog,which)->exportBugReport(description.getText().toString()))
            .setPositiveButton("WhatsApp",(dialog,which)->reportWhatsApp(description.getText().toString()))
            .show();
    }
    private void exportBugReport(String suggestion){
        pendingReportText=BugReport.export(this,suggestion);
        Intent create=new Intent(Intent.ACTION_CREATE_DOCUMENT);
        create.addCategory(Intent.CATEGORY_OPENABLE);
        create.setType("text/plain");
        create.putExtra(Intent.EXTRA_TITLE,"PokeSearch-relatorio-"+System.currentTimeMillis()+".txt");
        try{startActivityForResult(create,301);}
        catch(Exception e){Toast.makeText(this,"Não foi possível abrir o salvamento TXT",Toast.LENGTH_LONG).show();}
    }
    private void reportWhatsApp(String suggestion){
        String report=BugReport.export(this,suggestion);
        // No automatic upload. The user sees and sends the prepared WhatsApp message.
        String sample=report.substring(0,Math.min(1300,report.length()));
        Intent browser=new Intent(Intent.ACTION_VIEW,
            Uri.parse("https://wa.me/5584991319021?text="+Uri.encode(sample)));
        try{startActivity(browser);}
        catch(Exception e){Toast.makeText(this,"WhatsApp indisponível. Use Exportar TXT.",Toast.LENGTH_LONG).show();}
    }
    private int d(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
    private void syncOverlayPreferences(){
        if(OverlayService.isRunning())
            serviceAction("com.lucianotoscano.pokesearchoverlay.SYNC_PREFS");
    }
    private void showPreferencesDialog(){
        ScrollView view=buildPreferences();
        AlertDialog dialog=new AlertDialog.Builder(this)
            .setTitle("⚙ Preferências")
            .setView(view)
            .setPositiveButton("Concluído",(d,which)->syncOverlayPreferences())
            .create();
        dialog.setOnDismissListener(d->syncOverlayPreferences());
        dialog.show();
    }
    private ScrollView buildPreferences(){
        SharedPreferences prefs=getSharedPreferences("prefs",0);
        ScrollView sc=new ScrollView(this);
        LinearLayout body=new LinearLayout(this);
        body.setOrientation(LinearLayout.VERTICAL);
        body.setPadding(d(14),d(10),d(14),d(14));
        sc.addView(body);
        android.widget.TextView subtitle=new android.widget.TextView(this);
        subtitle.setText("Tamanho do Pokémon · altere também por P / M / G no overlay");
        subtitle.setTextColor(Color.LTGRAY);body.addView(subtitle);
        Spinner sizes=new Spinner(this);
        String[] sizeLabels={"P · 35 × 35","M · 45 × 45","G · 55 × 55"};
        sizes.setAdapter(new ArrayAdapter<String>(this,android.R.layout.simple_spinner_dropdown_item,sizeLabels));
        int current=prefs.getInt("spriteSize",45);
        sizes.setSelection(current==35?0:current==55?2:1);
        sizes.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener(){
            @Override public void onItemSelected(android.widget.AdapterView<?> p,android.view.View v,int pos,long id){
                prefs.edit().putInt("spriteSize",new int[]{35,45,55}[pos]).apply();
                syncOverlayPreferences();
            }
            @Override public void onNothingSelected(android.widget.AdapterView<?> p){}
        });
        body.addView(sizes);
        android.widget.TextView orderTitle=new android.widget.TextView(this);
        orderTitle.setText("Ordenação dos resultados");orderTitle.setTextColor(Color.LTGRAY);body.addView(orderTitle);
        Spinner order=new Spinner(this);
        String[] choices={"Despawn mais próximo","Melhor ranking PvP","Maior IV","Shiny primeiro"};
        String[] values={"despawn","rank","iv","shiny"};
        order.setAdapter(new ArrayAdapter<String>(this,android.R.layout.simple_spinner_dropdown_item,choices));
        String val=prefs.getString("sort","despawn");
        int pos=0;for(int i=0;i<values.length;i++)if(values[i].equals(val))pos=i;
        order.setSelection(pos);
        order.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener(){
            @Override public void onItemSelected(android.widget.AdapterView<?> p,android.view.View v,int index,long id){
                prefs.edit().putString("sort",values[index]).apply();
                syncOverlayPreferences();
            }
            @Override public void onNothingSelected(android.widget.AdapterView<?> p){}
        });
        body.addView(order);
        settingCheckbox(body,prefs,"showTimers","Mostrar tempo individual de despawn",false);
        settingAlertMode(body,prefs);
        settingCheckbox(body,prefs,WatchAlerts.PREF_ENABLED,
            "Alertar ao encontrar favorito nos filtros confirmados",true);
        Button testNotification=new Button(this);
        testNotification.setText("🔔 Testar notificação");
        testNotification.setAllCaps(false);
        testNotification.setTextSize(12);
        testNotification.setOnClickListener(v->{
            if(!WatchAlerts.permissionGranted(this)){
                if(Build.VERSION.SDK_INT>=33){
                    requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},203);
                }else Toast.makeText(this,"Ative notificações nas Configurações do Android",Toast.LENGTH_LONG).show();
                return;
            }
            boolean sent=WatchAlerts.test(this);
            Toast.makeText(this,sent?"Notificação de teste enviada":
                "Não foi possível enviar a notificação de teste",Toast.LENGTH_LONG).show();
        });
        body.addView(testNotification,new LinearLayout.LayoutParams(-1,d(42)));
        return sc;
    }
    private void settingAlertMode(LinearLayout body,SharedPreferences prefs){
        TextView label=new TextView(this);
        label.setText("Notificações de novos Pokémon");
        label.setTextColor(Color.LTGRAY);
        body.addView(label);
        Spinner alertSpinner=new Spinner(this);
        String[] labels={"Desligadas","Ligadas (som)","Silenciosas"};
        String[] values={"off","on","silent"};
        alertSpinner.setAdapter(new ArrayAdapter<String>(this,
            android.R.layout.simple_spinner_dropdown_item,labels));
        String current=prefs.getString("alertsMode",
            prefs.getBoolean("alerts",false)?"on":"off");
        int selected="silent".equals(current)?2:"on".equals(current)?1:0;
        alertSpinner.setSelection(selected);
        alertSpinner.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener(){
            @Override public void onItemSelected(android.widget.AdapterView<?> parent,
                    android.view.View view,int index,long id){
                String mode=values[index];
                prefs.edit().putString("alertsMode",mode)
                    .putBoolean("alerts",!"off".equals(mode)).apply();
                syncOverlayPreferences();
            }
            @Override public void onNothingSelected(android.widget.AdapterView<?> parent){}
        });
        body.addView(alertSpinner);
    }
    private void settingCheckbox(LinearLayout root,SharedPreferences prefs,String key,String label,boolean def){
        CheckBox check=new CheckBox(this);check.setText(label);check.setTextColor(Color.WHITE);
        check.setChecked(prefs.getBoolean(key,def));
        check.setOnCheckedChangeListener((button,enabled)->{
            prefs.edit().putBoolean(key,enabled).apply();
            syncOverlayPreferences();
        });
        root.addView(check);
    }
    private String readAsset(String path){
        try(InputStream in=getAssets().open(path)){
            ByteArrayOutputStream out=new ByteArrayOutputStream();
            byte[] b=new byte[4096];int n;
            while((n=in.read(b))!=-1)out.write(b,0,n);
            return out.toString("UTF-8");
        }catch(Exception e){
            BugReport.log(this,"ASSET","ler "+("probe.js".equals(path)?"probe.js":
                "shiny_login.js".equals(path)?"shiny_login.js":"recurso interno")+
                " · "+e.getClass().getSimpleName());
            return "void 0";
        }
    }
    private void startOverlay(){startOverlay(false);}
    private boolean homeStartPending=false;
    private void startOverlay(boolean stayOnHome){
        homeStartPending=stayOnHome;
        CookieManager.getInstance().flush();
        if(Build.VERSION.SDK_INT>=23&&!Settings.canDrawOverlays(this)){
            startActivityForResult(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                  Uri.parse("package:"+getPackageName())),101);
            return;
        }
        // Android 13+: alert channels need explicit runtime permission.
        // Ask once, then continue launching the overlay even when denied.
        SharedPreferences notifPrefs=getSharedPreferences("prefs",0);
        if(Build.VERSION.SDK_INT>=33 &&
           checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED &&
           !notifPrefs.getBoolean("notificationPermissionAskedV38",false)){
            notifPrefs.edit().putBoolean("notificationPermissionAskedV38",true).apply();
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},202);
            return;
        }
        Intent i=new Intent(this,OverlayService.class);
        i.setAction("com.lucianotoscano.pokesearchoverlay.REFRESH_LOGIN");
        if(Build.VERSION.SDK_INT>=26)startForegroundService(i);else startService(i);
        if(!stayOnHome)moveTaskToBack(true);
    }
    @Override protected void onActivityResult(int req,int result,Intent data){
        super.onActivityResult(req,result,data);
        if(req==101&&Settings.canDrawOverlays(this))startOverlay(homeStartPending);
        if(req==302){
            if(result==RESULT_OK&&data!=null&&data.getData()!=null&&!pendingExportText.isEmpty()){
                try(java.io.OutputStream out=getContentResolver().openOutputStream(data.getData())){
                    if(out==null)throw new java.io.IOException("Arquivo indisponível");
                    out.write(pendingExportText.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                    Toast.makeText(this,"Dados exportados em JSON",Toast.LENGTH_SHORT).show();
                }catch(Exception e){
                    Toast.makeText(this,"Falha ao salvar os dados",Toast.LENGTH_SHORT).show();
                }
            }
            pendingExportText="";
        }
        if(req==301 && result==RESULT_OK && data!=null && data.getData()!=null){
            try(java.io.OutputStream out=getContentResolver().openOutputStream(data.getData())){
                if(out==null)throw new java.io.IOException("Documento indisponível");
                out.write(pendingReportText.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                Toast.makeText(this,"Relatório TXT salvo",Toast.LENGTH_LONG).show();
            }catch(Exception e){Toast.makeText(this,"Não foi possível salvar o relatório",Toast.LENGTH_LONG).show();}
            pendingReportText="";
        }
    }
    private void requestOverlayNotificationPermission(){
        // A Service/WebView cannot present the Android 13+ runtime permission
        // dialog. Only the foreground Activity requests it after a real tap.
        if(Build.VERSION.SDK_INT>=33&&!WatchAlerts.permissionGranted(this)){
            if(checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED){
                requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},204);
                return;
            }
        }
        Toast.makeText(this,WatchAlerts.permissionGranted(this)?
            "Notificações permitidas":"Notificações bloqueadas. Abra os canais nas Configurações do Android.",
            Toast.LENGTH_LONG).show();
    }
    @Override public void onRequestPermissionsResult(int requestCode,String[] permissions,int[] results){
        super.onRequestPermissionsResult(requestCode,permissions,results);
        if(requestCode==202)startOverlay(homeStartPending);
        if(requestCode==204){
            boolean granted=results.length>0&&results[0]==PackageManager.PERMISSION_GRANTED;
            Toast.makeText(this,granted&&WatchAlerts.permissionGranted(this)?
                "Permissão de notificações concedida":"Permissão negada. Configure as notificações no Android.",
                Toast.LENGTH_LONG).show();
        }
        if(requestCode==203){
            boolean granted=results.length>0&&results[0]==PackageManager.PERMISSION_GRANTED;
            if(granted&&WatchAlerts.permissionGranted(this)){
                boolean sent=WatchAlerts.test(this);
                Toast.makeText(this,sent?"Notificação de teste enviada":
                    "Não foi possível enviar a notificação de teste",Toast.LENGTH_LONG).show();
            }else{
                Toast.makeText(this,"Permissão de notificações negada. Ative nas Configurações do Android.",Toast.LENGTH_LONG).show();
            }
        }
    }
    @Override public void onBackPressed(){
        if(homeDrawerLayer!=null){closeHomeMenu();return;}
        if(loginDialog!=null&&loginDialog.isShowing()&&website!=null&&website.canGoBack()){
            website.goBack();return;
        }
        super.onBackPressed();
    }
    @Override protected void onDestroy(){
        if(homeFiltersWebView!=null){
            homeFiltersWebView.stopLoading();homeFiltersWebView.destroy();homeFiltersWebView=null;
        }
        if(loginDialog!=null){loginDialog.setOnDismissListener(null);loginDialog.dismiss();loginDialog=null;}
        if(website!=null){website.stopLoading();website.destroy();website=null;}
        super.onDestroy();
    }
}

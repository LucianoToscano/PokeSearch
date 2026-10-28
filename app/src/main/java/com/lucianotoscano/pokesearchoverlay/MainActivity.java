package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.os.Bundle;
import android.os.Build;
import android.content.Intent;
import android.net.Uri;
import android.media.RingtoneManager;
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
    private android.app.Dialog tutorialDialog;
    private WebView tutorialWebView;
    private volatile boolean activityClosing=false;
    private int avatarRequestGeneration=0;
    private void releaseTutorialWebView(){
        WebView guide=tutorialWebView;
        tutorialWebView=null;
        tutorialDialog=null;
        if(guide==null)return;
        try{guide.stopLoading();}catch(RuntimeException ignored){}
        android.view.ViewParent parent=guide.getParent();
        if(parent instanceof android.view.ViewGroup)
            ((android.view.ViewGroup)parent).removeView(guide);
        try{guide.destroy();}catch(RuntimeException ignored){}
    }
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
    private String alertToneTarget="";
    private String alertToneSpecies="";
    private android.media.MediaPlayer bundledTonePreview;
    private android.media.Ringtone systemTonePreview;
    // Shared Google Drive file ID stays stable across explicitly approved APK updates.
    // No GitHub/release/token link is exposed by the Android share chooser.
    private static final String SHARE_APK_DRIVE_URL=
        "https://drive.google.com/file/d/1XXKGy3AjtDx4uMnt2N4Wd3FVNV0Qn_5P/view";
    private FrameLayout homeRoot;
    private boolean homeLightMode=false;
    // LT72: Home-only update card; does not own or recreate the overlay/WebView.
    private LinearLayout homeUpdateHolder;
    private UpdateCenter.Manifest currentDriveUpdate;
    private GitHubUpdateCenter.Release currentGithubUpdate;

    // Native Home panels change alpha; the wallpaper never changes transparency.
    private final java.util.List<android.graphics.drawable.GradientDrawable> homeSurfaces=
        new java.util.ArrayList<>();
    private int homeSurfacesTransparency(){
        android.content.SharedPreferences p=getSharedPreferences("prefs",0);
        return Math.max(0,Math.min(100,p.getInt("homePanelsTransparency",
            p.getInt("homeBackgroundTransparency",0))));
    }
    private void refreshHomeSurfaceOpacity(){
        int alpha=Math.round(255f*(100-homeSurfacesTransparency())/100f);
        for(android.graphics.drawable.GradientDrawable bg:homeSurfaces)bg.setAlpha(alpha);
    }
    private TextView homeThemeButton;
    private LinearLayout guestPanel, connectedPanel, trainerPanel, trainerCodeGroup, trainerCodeTexts, trainerChoices;
    private View trainerCopyButton;
    private View guestHeading;
    private ImageView teamBadge, accountAvatar, accountAvatarFrame;
    private Button trainerAction;
    private TextView trainerSectionTitle;
    private TextView accountDisplay, accountProvider, trainerDisplay, trainerDetails, trainerCode;
    private ImageView overlayControl,secondaryOverlayControl;
    private TextView sessionHint;
    private View homeDrawerLayer;
    private View tributeOverlay, communityHomePanel;
    private ScrollView communityHomeScroll;
    private boolean welcomeMissionOpening;
    // Optional mission: never open without an explicit tap.
    private ImageView homeMissionBadge;
    private boolean missionResumed=false;
    private final android.os.Handler missionHandler=
        new android.os.Handler(android.os.Looper.getMainLooper());
    private final Runnable missionHeartbeat=new Runnable(){
        @Override public void run(){
            if(!missionResumed || !hasWindowFocus())return;
            SupportMissionState.homeTick(MainActivity.this);
            syncMissionBadge();
            missionHandler.postDelayed(this,5000L);
        }
    };
    private void syncMissionBadge(){
        if(homeMissionBadge==null)return;
        int state=SupportMissionState.badge(this);
        homeMissionBadge.setVisibility(state==SupportMissionState.HIDDEN?View.GONE:View.VISIBLE);
        if(state!=SupportMissionState.HIDDEN){
            homeMissionBadge.setImageResource(state==SupportMissionState.NEW?
                R.drawable.support_home_new:R.drawable.support_home_seen);
            homeMissionBadge.setContentDescription(state==SupportMissionState.NEW?
                "Nova Missão Especial de Apoio":"Reabrir Missão Especial de Apoio");
        }
    }
    private void maybeWelcomeMission(){
        if(welcomeMissionOpening||isFinishing()||isDestroyed()||!missionResumed||
           !hasWindowFocus()||!SupportMissionState.welcomePending(this)||
           (tutorialDialog!=null&&tutorialDialog.isShowing())||tributeOverlay!=null)return;
        welcomeMissionOpening=true;
        openSupportMission();
    }
    private void openTribute(){
        if(homeRoot==null||tributeOverlay!=null)return;
        closeHomeMenu();
        tributeOverlay=CommunityTribute.show(this,homeRoot,homeLightMode,
            ()->tributeOverlay=null);
    }
    private void scrollToCommunity(){
        if(communityHomePanel==null||communityHomeScroll==null)return;
        CommunityScrapbookOnline.expandFromMenu(communityHomePanel);
        communityHomePanel.post(()->communityHomeScroll.smoothScrollTo(0,
            Math.max(0,communityHomePanel.getTop()-d(12))));
    }
    private void openSupportMission(){
        int style=SupportMissionState.open(this);
        if(style<0){syncMissionBadge();return;}
        syncMissionBadge();
        SupportMissionDialog.show(this,style,homeLightMode,this::syncMissionBadge);
    }
    private void syncMissionClock(boolean focused){
        missionHandler.removeCallbacks(missionHeartbeat);
        boolean active=focused&&missionResumed&&!isFinishing();
        SupportMissionState.homeVisibility(this,active);
        if(active){
            missionHandler.postDelayed(missionHeartbeat,5000L);
            if(SupportMissionState.welcomePending(this))
                missionHandler.postDelayed(this::maybeWelcomeMission,1000L);
        }
        syncMissionBadge();
    }
    @Override public void onWindowFocusChanged(boolean hasFocus){
        super.onWindowFocusChanged(hasFocus);
        syncMissionClock(hasFocus);
    }
    private String pendingExportText="";
    private String preferredLoginProvider="";
    private String observedLoginProvider="";
    private final android.os.Handler availabilityHandler=
        new android.os.Handler(android.os.Looper.getMainLooper());
    private android.app.AlertDialog availabilityDialog;
    private final Runnable availabilityTick=new Runnable(){
        @Override public void run(){
            if(activityClosing)return;
            AppAvailability.refresh(MainActivity.this,MainActivity.this::applyAppAvailability);
            availabilityHandler.postDelayed(this,90000L);
        }
    };
    private void applyAppAvailability(AppAvailability.State state){
        if(activityClosing||isFinishing())return;
        if(!state.allowed){
            stopService(new Intent(this,OverlayService.class));
            stopService(new Intent(this,SecondaryOverlayService.class));
            refreshHomeOverlay();
            if(availabilityDialog==null||!availabilityDialog.isShowing()){
                availabilityDialog=new AlertDialog.Builder(this)
                    .setTitle(state.maintenance?"PokeSearch em manutenção":"Versão desativada")
                    .setMessage(state.reason())
                    .setCancelable(false)
                    .setPositiveButton("Fechar",(dialog,which)->finish())
                    .create();
                availabilityDialog.show();
            }
        }else if(availabilityDialog!=null&&availabilityDialog.isShowing()){
            availabilityDialog.dismiss();
            availabilityDialog=null;
        }
    }
    @Override public void onCreate(Bundle b){
        super.onCreate(b);
        if (!IntegrityGuard.verify(this)) {
            BugReport.log(this,"SECURITY","Falha de integridade do pacote");
            android.widget.Toast.makeText(this,"Cópia não autorizada ou inválida",android.widget.Toast.LENGTH_LONG).show();
            finish();
            return;
        }
        SupportMissionState.onLauncherIntent(this,getIntent(),b);
        // HOME-01: rebuild only the presentation, never discard existing features.
        getWindow().setStatusBarColor(Color.rgb(12,33,67));
        getWindow().setNavigationBarColor(Color.rgb(9,20,37));
        FrameLayout root=buildHome();
        setContentView(root);
        FirebaseStats.setHomeVisible(this,true);
        refreshSessionSummary();
        refreshHomeOverlay();
        handleShinyLoginIntent(getIntent());
        if(!getSharedPreferences("prefs",0).getBoolean("tutorialSeenV41",false)&&
           !"com.lucianotoscano.pokesearchoverlay.OPEN_SHINY_LOGIN".equals(getIntent().getAction())&&
            !"com.lucianotoscano.pokesearchoverlay.REQUEST_NOTIFICATION_PERMISSION".equals(getIntent().getAction())&&
            !"com.lucianotoscano.pokesearchoverlay.PICK_ALERT_TONE".equals(getIntent().getAction()))
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
        if("com.lucianotoscano.pokesearchoverlay.PICK_ALERT_TONE".equals(getIntent().getAction()))
            root.post(()->beginAlertToneChoice(getIntent().getStringExtra("alertToneTarget")));
        // Release notes belong only to a normal Home opening. Never interrupt OAuth,
        // notification permissions or overlay callbacks. The quick guide comes first.
        if(Intent.ACTION_MAIN.equals(getIntent().getAction())&&
            getSharedPreferences("prefs",0).getBoolean("tutorialSeenV41",false)){
            root.post(()->ReleaseNotes.maybeShowAfterUpgrade(this));
            root.postDelayed(this::maybeWelcomeMission,1500L);
        }
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
        homeSurfaces.add(bg);
        bg.setAlpha(Math.round(255f*(100-homeSurfacesTransparency())/100f));
        return bg;
    }
    private TextView homeMiniButton(String glyph,String description){
        TextView t=homeText(glyph,21,Color.WHITE,true);
        t.setGravity(Gravity.CENTER);
        t.setContentDescription(description);
        t.setBackground(homeSurface(homeLightMode?Color.rgb(248,251,254):Color.rgb(27,32,41),
            11,homeLightMode?Color.rgb(148,163,179):Color.rgb(86,99,114)));
        return t;
    }
    // HOME-THEME-01: one saved switch; no WebView recreation and no new OAuth.
    private void updateHomeSystemBars(){
        getWindow().setStatusBarColor(homeLightMode?Color.rgb(236,242,247):Color.rgb(12,33,67));
        getWindow().setNavigationBarColor(homeLightMode?Color.rgb(236,242,247):Color.rgb(9,20,37));
        View decor=getWindow().getDecorView();
        int previous=decor.getSystemUiVisibility();
        int light=View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        decor.setSystemUiVisibility((previous&~light)|(homeLightMode?light:0));
    }
    private void toggleHomeTheme(){
        homeLightMode=!homeLightMode;
        getSharedPreferences("prefs",0).edit().putBoolean("homeLightMode",homeLightMode).apply();
        // Home theme is independent of the overlay editor themes.
        closeHomeMenu();
        // Refresh only the native Home presentation. Persistent site login,
        // overlay service, results, filter preferences and watched species stay.
        setContentView(buildHome());
        refreshSessionSummary();
        refreshHomeOverlay();
    }
    private FrameLayout buildHome(){
        homeLightMode=getSharedPreferences("prefs",0).getBoolean("homeLightMode",false);
        updateHomeSystemBars();
        FrameLayout frame=new FrameLayout(this);
        homeRoot=frame;
        homeSurfaces.clear();
        // Owner-supplied backgrounds share the same 941×1672 portrait geometry.
        // CENTER_CROP (one gravity for both) avoids distortion when switching.
        frame.setBackgroundColor(homeLightMode?Color.rgb(239,245,249):Color.rgb(10,14,23));
        ImageView pageBackground=new ImageView(this);
        // Wallpaper remains an independent, full-opacity decorative image.
        pageBackground.setImageResource(homeLightMode?
            R.drawable.ps_home_background_light:R.drawable.ps_home_background_dark);
        pageBackground.setScaleType(ImageView.ScaleType.CENTER_CROP);
        pageBackground.setContentDescription(homeLightMode?"Fundo PokeSearch claro":"Fundo PokeSearch escuro");
        pageBackground.setAlpha(1f); // Slider affects surfaces only.
        frame.addView(pageBackground,new FrameLayout.LayoutParams(-1,-1));
        View dim=new View(this);
        dim.setBackgroundColor(homeLightMode?Color.argb(8,255,255,255):Color.argb(16,6,12,24));
        frame.addView(dim,new FrameLayout.LayoutParams(-1,-1));

        LinearLayout screen=new LinearLayout(this);
        screen.setOrientation(LinearLayout.VERTICAL);
        screen.setPadding(d(14),d(6),d(14),d(12));
        // Native Home scroll prevents clipping with scrapbook and thank-you card.
        final boolean scrapbookPreview=CommunityScrapbookStage1.isEnabled(this);
        ScrollView stage1HomeScroll=new ScrollView(this);
        stage1HomeScroll.setFillViewport(true);
        stage1HomeScroll.setClipToPadding(false);
        stage1HomeScroll.setVerticalScrollBarEnabled(false);
        stage1HomeScroll.addView(screen,new ScrollView.LayoutParams(-1,-2));
        frame.addView(stage1HomeScroll,new FrameLayout.LayoutParams(-1,-1));
        communityHomeScroll=stage1HomeScroll;
        communityHomePanel=null;

        LinearLayout header=new LinearLayout(this);
        header.setGravity(Gravity.TOP|Gravity.CENTER_VERTICAL);
        header.setOrientation(LinearLayout.HORIZONTAL);
        // 3:1 wordmark should have natural height, without crowding toolbar.
        screen.addView(header,new LinearLayout.LayoutParams(-1,d(70)));
        // Header directly precedes paired controls, so neither Pokébola
        // is hidden among the unrelated theme/support actions.
        LinearLayout dualOverlayRow=new LinearLayout(this);
        dualOverlayRow.setGravity(Gravity.CENTER);
        dualOverlayRow.setOrientation(LinearLayout.HORIZONTAL);
        dualOverlayRow.setBackground(homeSurface(
            homeLightMode?Color.rgb(243,248,251):Color.rgb(24,31,46),11,0));
        dualOverlayRow.setPadding(d(7),d(4),d(7),d(4));
        overlayControl=makeIcon(R.drawable.sem_filtro,"Ativar Pokébola 1");
        secondaryOverlayControl=makeIcon(R.drawable.sem_filtro,
            PremiumAccess.controlled()?"Pokébola 2 Premium - requer licença":"Ativar Pokébola 2");
        ImageView[] paired={overlayControl,secondaryOverlayControl};
        for(int i=0;i<paired.length;i++){
            final int which=i;
            LinearLayout item=new LinearLayout(this);
            item.setGravity(Gravity.CENTER_VERTICAL|Gravity.CENTER_HORIZONTAL);
            item.setOrientation(LinearLayout.HORIZONTAL);
            item.setPadding(d(5),0,d(5),0);
            ImageView icon=paired[i];
            icon.setScaleType(ImageView.ScaleType.FIT_CENTER);
            icon.setPadding(d(2),d(2),d(2),d(2));
            item.addView(icon,new LinearLayout.LayoutParams(d(41),d(41)));
            TextView title=homeText(i==0?"Pokébola 1":"Pokébola 2",12,
                homeLightMode?Color.rgb(34,51,69):Color.rgb(233,240,252),true);
            LinearLayout.LayoutParams nameLp=new LinearLayout.LayoutParams(-2,-2);
            nameLp.leftMargin=d(5);
            item.addView(title,nameLp);
            dualOverlayRow.addView(item,new LinearLayout.LayoutParams(0,d(46),1));
            item.setOnClickListener(v->{
                if(which==0)toggleHomeOverlay();else toggleSecondaryOverlay();
            });
        }
        LinearLayout.LayoutParams dualLp=new LinearLayout.LayoutParams(-1,d(54));
        dualLp.leftMargin=d(4);dualLp.rightMargin=d(4);
        dualLp.bottomMargin=d(6);
        dualOverlayRow.setVisibility(View.VISIBLE);
        // Insert after header, preserving top toolbar space.
        screen.addView(dualOverlayRow,dualLp);
        if(PremiumAccess.controlled()){
            TextView accountPremium=homeText("Conta Premium  ·  Gerenciar / Sair",11,
                homeLightMode?Color.rgb(34,87,143):Color.rgb(149,203,255),true);
            accountPremium.setGravity(Gravity.CENTER_VERTICAL|Gravity.RIGHT);
            accountPremium.setContentDescription(
                "Gerenciar ou sair da conta Google Premium");
            accountPremium.setMinHeight(d(30));
            accountPremium.setPadding(d(6),0,d(8),d(3));
            accountPremium.setOnClickListener(v->showPremiumAccountOptions());
            LinearLayout.LayoutParams accountLp=new LinearLayout.LayoutParams(-1,d(30));
            accountLp.leftMargin=d(4);accountLp.rightMargin=d(4);
            accountLp.bottomMargin=d(4);
            screen.addView(accountPremium,accountLp);
        }

        // HOME-02: icon only at top left; compact actions on the right.
        ImageView brand=new ImageView(this);
        brand.setImageResource(R.drawable.ps_home_brand_transparent);
        brand.setScaleType(ImageView.ScaleType.FIT_CENTER);
        brand.setContentDescription("Ícone PokeSearch");
        header.addView(brand,new LinearLayout.LayoutParams(d(38),d(38)));
        LinearLayout brandLabels=new LinearLayout(this);
        brandLabels.setOrientation(LinearLayout.VERTICAL);
        brandLabels.setPadding(d(6),0,0,0);
        ImageView brandTitle=new ImageView(this);
        brandTitle.setImageResource(R.drawable.ps_home_official_wordmark);
        brandTitle.setScaleType(ImageView.ScaleType.FIT_CENTER);
        brandTitle.setContentDescription("PokeSearch");
        // Protected builds only; server validates the admin claim, not the display name.
        if(PremiumAccess.controlled())brandTitle.setOnLongClickListener(v->{
            if(PremiumGoogleLogin.isGoogleSignedIn(this))PremiumAdminDialog.show(this);
            else PremiumGoogleLogin.signIn(this,(ok,message)->{
                if(ok)PremiumAdminDialog.show(this);
                else Toast.makeText(this,message,Toast.LENGTH_LONG).show();
            });
            return true;
        });
        TextView brandSubtitle=homeText("POKÉMON GO",9,
            homeLightMode?Color.rgb(53,79,98):Color.rgb(178,202,230),true);
        // Original wordmark: 2172 × 724 (3:1). Avoid fixed 118×36 squeezing.
        // Reserve the four native 34dp action targets (plus 5dp margins).
        int availableBrandWidth=getResources().getDisplayMetrics().widthPixels
            -d(28)-d(38)-d(6)-(d(34)*3+d(5)*2)-d(3);
        int wordmarkWidth=Math.max(d(90),Math.min(d(156),availableBrandWidth));
        int wordmarkHeight=Math.round(wordmarkWidth/3f);
        brandTitle.setAdjustViewBounds(false);
        brandLabels.addView(brandTitle,
            new LinearLayout.LayoutParams(wordmarkWidth,wordmarkHeight));
        brandLabels.addView(brandSubtitle);
        header.addView(brandLabels,new LinearLayout.LayoutParams(-2,-2));

        header.addView(new View(this),new LinearLayout.LayoutParams(0,d(1),1));
        LinearLayout controls=new LinearLayout(this);
        controls.setGravity(Gravity.RIGHT|Gravity.CENTER_VERTICAL);
        controls.setOrientation(LinearLayout.HORIZONTAL);
        header.addView(controls,new LinearLayout.LayoutParams(-2,d(46)));

        homeThemeButton=homeMiniButton(homeLightMode?"☾":"☀",
            homeLightMode?"Ativar modo escuro":"Ativar modo claro");
        homeThemeButton.setTextSize(21);
        homeThemeButton.setTextColor(homeLightMode?Color.rgb(22,45,61):Color.rgb(255,230,155));
        homeThemeButton.setBackground(homeSurface(
            homeLightMode?Color.argb(225,244,249,253):Color.argb(150,9,25,49),10,
            homeLightMode?Color.argb(110,67,98,128):Color.argb(90,180,221,255)));
        controls.addView(homeThemeButton,new LinearLayout.LayoutParams(d(34),d(34)));
        homeThemeButton.setOnClickListener(v->toggleHomeTheme());

        ImageButton heart=makeIcon(R.drawable.ic_heart_outline,"Apoiar o PokeSearch");
        heart.setPadding(d(6),d(6),d(6),d(6));
        heart.setBackground(homeSurface(homeLightMode?Color.rgb(247,251,255):Color.rgb(30,35,45),10,0));
        LinearLayout.LayoutParams heartLp=new LinearLayout.LayoutParams(d(34),d(34));
        heartLp.leftMargin=d(5);
        controls.addView(heart,heartLp);
        heart.setOnClickListener(v->PixSupport.show(this));

        TextView menu=homeMiniButton("☰","Abrir menu lateral");
        menu.setTextSize(18);
        menu.setBackground(homeSurface(homeLightMode?Color.rgb(247,251,255):Color.rgb(30,35,45),10,0));
        LinearLayout.LayoutParams menuLp=new LinearLayout.LayoutParams(d(34),d(34));
        menuLp.leftMargin=d(5);
        controls.addView(menu,menuLp);
        menu.setOnClickListener(v->showHomeMenu());

        // HOME-04: compact reference card, fed only by verified profile fields.
        LinearLayout auth=new LinearLayout(this);
        auth.setOrientation(LinearLayout.VERTICAL);
        auth.setPadding(d(15),d(15),d(15),d(16));
        auth.setBackground(homeSurface(
            homeLightMode?Color.rgb(251,253,255):Color.rgb(33,37,44),
            20,homeLightMode?Color.rgb(175,188,204):Color.rgb(77,84,96)));
        auth.setElevation(d(5));
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
        TextView heading=homeText("PoGoCoordinates",17,
            homeLightMode?Color.rgb(19,38,59):Color.WHITE,true);
        headingTexts.addView(heading);
        sessionHint=homeText("Buscas comuns sem login · Shiny exige treinador vinculado",11,
            homeLightMode?Color.rgb(74,93,116):Color.rgb(156,174,205),false);
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
        FrameLayout avatarShell=new FrameLayout(this);
        // Clip the actual photo to a perfect circle. No ornamental PNG square corners.
        android.graphics.drawable.GradientDrawable avatarClip=round(Color.TRANSPARENT,30);
        avatarClip.setShape(android.graphics.drawable.GradientDrawable.OVAL);
        avatarShell.setBackground(avatarClip);
        avatarShell.setOutlineProvider(android.view.ViewOutlineProvider.BACKGROUND);
        avatarShell.setClipToOutline(true);
        FrameLayout.LayoutParams photoLp=new FrameLayout.LayoutParams(-1,-1);
        photoLp.setMargins(d(3),d(3),d(3),d(3));
        avatarShell.addView(avatar,photoLp);
        accountAvatarFrame=new ImageView(this);
        accountAvatarFrame.setImageDrawable(homeAvatarOutline(""));
        accountAvatarFrame.setScaleType(ImageView.ScaleType.FIT_XY);
        accountAvatarFrame.setContentDescription("Moldura da equipe");
        accountAvatarFrame.setClickable(false);
        avatarShell.addView(accountAvatarFrame,new FrameLayout.LayoutParams(-1,-1));
        accountRow.addView(avatarShell,avatarLp);

        LinearLayout identity=new LinearLayout(this);
        identity.setOrientation(LinearLayout.VERTICAL);
        accountRow.addView(identity,new LinearLayout.LayoutParams(0,-2,1));
        accountDisplay=homeText("Conta conectada",17,
            homeLightMode?Color.rgb(19,38,59):Color.WHITE,true);
        accountDisplay.setSingleLine(true);
        accountDisplay.setEllipsize(android.text.TextUtils.TruncateAt.END);
        accountProvider=homeText("Conectado ao PoGoCoordinates",11,
            homeLightMode?Color.rgb(69,88,109):Color.rgb(175,191,224),false);
        accountProvider.setSingleLine(true);
        accountProvider.setEllipsize(android.text.TextUtils.TruncateAt.END);
        identity.addView(accountDisplay);
        identity.addView(accountProvider);
        Button logout=homeAuthButton("⇥  Sair site",Color.rgb(28,37,54),Color.WHITE);
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
        rule.setBackgroundColor(homeLightMode?Color.rgb(194,205,218):Color.rgb(62,72,84));
        LinearLayout.LayoutParams ruleLp=new LinearLayout.LayoutParams(-1,d(1));
        ruleLp.bottomMargin=d(10);
        trainerPanel.addView(rule,ruleLp);
        trainerSectionTitle=homeText("Treinador vinculado",12,
            homeLightMode?Color.rgb(72,92,111):Color.rgb(171,188,215),false);
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
        trainerDisplay=homeText("Treinador não confirmado",15,
            homeLightMode?Color.rgb(19,38,59):Color.WHITE,true);
        trainerDisplay.setSingleLine(true);
        trainerDisplay.setEllipsize(android.text.TextUtils.TruncateAt.END);
        trainerDetails=homeText("",11,
            homeLightMode?Color.rgb(72,92,111):Color.rgb(177,205,244),false);
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
            homeLightMode?Color.rgb(72,92,111):Color.rgb(158,178,207),false);
        trainerCode=homeText("",15,
            homeLightMode?Color.rgb(19,38,59):Color.WHITE,true);
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
        trainerChoices=new LinearLayout(this);
        trainerChoices.setOrientation(LinearLayout.VERTICAL);
        trainerPanel.addView(trainerChoices,new LinearLayout.LayoutParams(-1,-2));

        // LT72: a zero-height, GONE placeholder unless Drive announces a
        // valid, enabled and newer version. Never reserve blank Home space.
        homeUpdateHolder=new LinearLayout(this);
        homeUpdateHolder.setOrientation(LinearLayout.VERTICAL);
        homeUpdateHolder.setVisibility(View.GONE);
        LinearLayout.LayoutParams updateLp=new LinearLayout.LayoutParams(-1,-2);
        updateLp.topMargin=d(5);
        screen.addView(homeUpdateHolder,updateLp);
        renderDriveUpdateBanner();

        // New compact LT54 counters; a dash indicates missing connectivity/rules.
        LinearLayout stats=new LinearLayout(this);
        stats.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams statsLp=new LinearLayout.LayoutParams(-1,d(48));
        statsLp.topMargin=d(8);
        screen.addView(stats,statsLp);
        TextView online=homeText("●  Ativos agora: —",11,
            homeLightMode?Color.rgb(34,63,80):Color.rgb(224,237,245),true);
        TextView installations=homeText("▣  Instalações: —",11,
            homeLightMode?Color.rgb(34,63,80):Color.rgb(224,237,245),true);
        online.setGravity(Gravity.CENTER);installations.setGravity(Gravity.CENTER);
        online.setBackground(homeSurface(homeLightMode?Color.rgb(251,253,255):Color.rgb(33,37,44),11,0));
        installations.setBackground(homeSurface(homeLightMode?Color.rgb(251,253,255):Color.rgb(33,37,44),11,0));
        LinearLayout.LayoutParams firstStat=new LinearLayout.LayoutParams(0,-1,1);
        firstStat.rightMargin=d(5);
        stats.addView(online,firstStat);
        LinearLayout.LayoutParams secondStat=new LinearLayout.LayoutParams(0,-1,1);
        secondStat.leftMargin=d(5);
        stats.addView(installations,secondStat);
        FirebaseStats.bind(this,online,installations);

        // LT88 R7: always-visible Home sharing, without adding a fifth header icon.
        TextView share=homeText("↗  Compartilhar app",12,
            homeLightMode?Color.rgb(24,65,78):Color.rgb(205,235,246),true);
        share.setGravity(Gravity.CENTER);
        share.setContentDescription("Compartilhar APK PokeSearch pelo Google Drive");
        share.setBackground(homeSurface(
            homeLightMode?Color.rgb(235,247,250):Color.rgb(27,49,62),
            11,homeLightMode?Color.rgb(155,192,204):Color.rgb(72,118,135)));
        // LT103: integrate the small thank-you shortcut into an existing
        // Home action row, not as a floating banner stranded between sections.
        LinearLayout shareActions=new LinearLayout(this);
        shareActions.setOrientation(LinearLayout.HORIZONTAL);
        shareActions.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams shareRowLp=new LinearLayout.LayoutParams(-1,d(48));
        shareRowLp.topMargin=d(6);
        screen.addView(shareActions,shareRowLp);
        LinearLayout.LayoutParams shareLp=new LinearLayout.LayoutParams(0,-1,1);
        shareActions.addView(share,shareLp);
        share.setOnClickListener(v->sharePokeSearch());
        View thanks=CommunityTribute.homeCard(this,homeLightMode,this::openTribute);
        LinearLayout.LayoutParams thanksLp=new LinearLayout.LayoutParams(d(164),-1);
        thanksLp.leftMargin=d(6);
        shareActions.addView(thanks,thanksLp);

        if(scrapbookPreview){
            LinearLayout.LayoutParams scrapbookLp=new LinearLayout.LayoutParams(-1,-2);
            scrapbookLp.topMargin=d(6);
            communityHomePanel=CommunityScrapbookStage1.homePanel(this,homeLightMode);
            screen.addView(communityHomePanel,scrapbookLp);
        }

        // Keep the center open for the user's Pokémon GO wallpaper.
        screen.addView(new View(this),new LinearLayout.LayoutParams(1,0,1));
        // LT73: show the installed APK's real version; no manual version strings.
        TextView footer=homeText("PokeSearch v"+BuildConfig.VERSION_NAME+" LT  •  PoGoCoordinates /search",10,
            homeLightMode?Color.rgb(26,51,72):Color.rgb(185,208,233),false);
        footer.setGravity(Gravity.CENTER);
        footer.setBackground(homeSurface(
            homeLightMode?Color.argb(200,248,251,255):Color.argb(135,9,23,42),
            12,homeLightMode?Color.argb(80,33,65,89):Color.argb(75,180,215,247)));
        footer.setPadding(d(9),d(5),d(9),d(5));
        screen.addView(footer,new LinearLayout.LayoutParams(-1,d(30)));
        // Mission icon floats above the footer, without stealing space from
        // header controls, update alerts, counters or trainer details.
        homeMissionBadge=new ImageView(this);
        homeMissionBadge.setScaleType(ImageView.ScaleType.FIT_CENTER);
        homeMissionBadge.setBackgroundColor(Color.TRANSPARENT);
        homeMissionBadge.setOnClickListener(v->openSupportMission());
        FrameLayout.LayoutParams missionLp=new FrameLayout.LayoutParams(
            d(52),d(52),Gravity.RIGHT|Gravity.BOTTOM);
        missionLp.rightMargin=d(16);
        missionLp.bottomMargin=d(49);
        frame.addView(homeMissionBadge,missionLp);
        syncMissionBadge();
        return frame;
    }
    /** Callback from UpdateCenter, always on Android's UI thread. */
    void onDriveUpdateLoaded(UpdateCenter.Manifest manifest) {
        if(activityClosing||isFinishing()||isDestroyed())return;
        currentDriveUpdate=manifest;
        renderDriveUpdateBanner();
    }

    void onGithubUpdateLoaded(GitHubUpdateCenter.Release info) {
        if(activityClosing||isFinishing()||isDestroyed())return;
        currentGithubUpdate=info;renderDriveUpdateBanner();
    }
    private void renderDriveUpdateBanner() {
        LinearLayout holder=homeUpdateHolder;
        if(holder==null)return;
        holder.removeAllViews();
        if(GitHubUpdateCenter.eligible(this,currentGithubUpdate)){
            renderGithubUpdateBanner(holder,currentGithubUpdate);
            return;
        }
        final UpdateCenter.Manifest info=currentDriveUpdate;
        if(!UpdateCenter.isEligible(this,info)){
            holder.setVisibility(View.GONE);
            return;
        }
        boolean light=homeLightMode;
        int primary=light?Color.rgb(27,48,68):Color.rgb(245,250,255);
        int secondary=light?Color.rgb(68,89,108):Color.rgb(191,210,229);
        LinearLayout card=new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(d(9),d(6),d(8),d(7));
        card.setBackground(homeSurface(
            light?Color.argb(240,248,252,255):Color.argb(233,24,35,49),
            11,light?Color.rgb(183,201,214):Color.rgb(69,91,112)));
        holder.addView(card,new LinearLayout.LayoutParams(-1,-2));

        LinearLayout titleRow=new LinearLayout(this);
        titleRow.setGravity(Gravity.CENTER_VERTICAL);
        card.addView(titleRow,new LinearLayout.LayoutParams(-1,-2));
        TextView title=homeText("⬇ "+info.message,12,primary,true);
        title.setSingleLine(true);
        title.setEllipsize(android.text.TextUtils.TruncateAt.END);
        titleRow.addView(title,new LinearLayout.LayoutParams(0,-2,1));

        TextView close=homeText("✕",15,secondary,true);
        close.setGravity(Gravity.CENTER);
        close.setContentDescription("Dispensar atualização "+info.versionName);
        titleRow.addView(close,new LinearLayout.LayoutParams(d(34),d(29)));
        close.setOnClickListener(v->{
            UpdateCenter.dismiss(this,info.versionCode);
            renderDriveUpdateBanner();
        });

        LinearLayout bodyRow=new LinearLayout(this);
        bodyRow.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams bodyLp=new LinearLayout.LayoutParams(-1,-2);
        bodyLp.topMargin=d(1);
        card.addView(bodyRow,bodyLp);

        TextView version=homeText("PokeSearch v"+info.versionName+" LT",12,primary,true);
        version.setSingleLine(true);
        version.setEllipsize(android.text.TextUtils.TruncateAt.END);
        bodyRow.addView(version,new LinearLayout.LayoutParams(0,-2,1));

        TextView download=homeText("Baixar APK",11,
            light?Color.rgb(11,80,75):Color.rgb(172,246,215),true);
        download.setGravity(Gravity.CENTER);
        download.setContentDescription("Baixar APK oficial "+info.apkName+" do Google Drive");
        download.setPadding(d(9),0,d(9),0);
        download.setBackground(homeSurface(
            light?Color.rgb(221,244,237):Color.rgb(23,70,61),
            8,light?Color.rgb(159,206,193):Color.rgb(68,138,116)));
        bodyRow.addView(download,new LinearLayout.LayoutParams(-2,d(33)));
        download.setOnClickListener(v->UpdateCenter.openDownload(this,info));

        if(!info.description.isEmpty()){
            TextView note=homeText(info.description,10,secondary,false);
            note.setMaxLines(2);
            note.setEllipsize(android.text.TextUtils.TruncateAt.END);
            LinearLayout.LayoutParams noteLp=new LinearLayout.LayoutParams(-1,-2);
            noteLp.topMargin=d(2);
            card.addView(note,noteLp);
        }
        holder.setVisibility(View.VISIBLE);
    }

    /** Native update UI; the server address and asset links are never rendered. */
    private void renderGithubUpdateBanner(LinearLayout holder,GitHubUpdateCenter.Release info){
        boolean light=homeLightMode;
        int primary=light?Color.rgb(27,48,68):Color.rgb(245,250,255);
        int secondary=light?Color.rgb(68,89,108):Color.rgb(191,210,229);
        LinearLayout card=new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(d(10),d(7),d(10),d(8));
        card.setBackground(homeSurface(
            light?Color.argb(240,248,252,255):Color.argb(233,24,35,49),
            11,light?Color.rgb(183,201,214):Color.rgb(69,91,112)));
        holder.addView(card,new LinearLayout.LayoutParams(-1,-2));
        TextView title=homeText("PokeSearch · versão "+info.versionName+" disponível",12,primary,true);
        card.addView(title);
        if(!info.notes.isEmpty()){
            TextView subtitle=homeText(info.notes,10,secondary,false);
            subtitle.setMaxLines(2);
            subtitle.setEllipsize(android.text.TextUtils.TruncateAt.END);
            card.addView(subtitle);
        }
        LinearLayout actions=new LinearLayout(this);
        actions.setGravity(Gravity.CENTER_VERTICAL);
        card.addView(actions);
        TextView download=homeText("⬇ Baixar atualização",11,
            light?Color.rgb(11,80,75):Color.rgb(172,246,215),true);
        download.setPadding(d(7),d(8),d(7),d(8));
        actions.addView(download,new LinearLayout.LayoutParams(0,-2,1));
        download.setOnClickListener(v->GitHubUpdateCenter.showDialog(this,info));
        TextView later=homeText("Depois",10,secondary,false);
        later.setPadding(d(8),d(8),d(8),d(8));
        actions.addView(later);
        later.setOnClickListener(v->{
            GitHubUpdateCenter.later(this,info.versionCode);renderDriveUpdateBanner();
        });
        TextView ignore=homeText("Ignorar",10,secondary,false);
        ignore.setPadding(d(8),d(8),0,d(8));
        actions.addView(ignore);
        ignore.setOnClickListener(v->{
            GitHubUpdateCenter.ignore(this,info.versionCode);renderDriveUpdateBanner();
        });
        holder.setVisibility(View.VISIBLE);
    }

    private void openTrainerManagement(){
        String all=getSharedPreferences("prefs",0).getString("profileTrainersJson","[]");
        if(all.contains("\"code\"")&&all.indexOf("\"code\"")!=all.lastIndexOf("\"code\"")){
            openLoginDialog(false,"manage");
            return;
        }
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
        TextView item=homeText(icon+"     "+name,15,
            homeLightMode?Color.rgb(29,47,66):Color.WHITE,false);
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
        drawer.setBackground(homeSurface(homeLightMode?Color.rgb(247,250,254):Color.rgb(31,35,43),
            12,homeLightMode?Color.rgb(173,187,202):Color.rgb(85,95,111)));
        int width=Math.min(d(286),getResources().getDisplayMetrics().widthPixels-d(48));
        FrameLayout.LayoutParams lp=new FrameLayout.LayoutParams(width,-1,Gravity.RIGHT|Gravity.TOP);
        layer.addView(drawer,lp);
        drawer.setOnClickListener(v->{});
        TextView label=homeText("  PokeSearch",19,
            homeLightMode?Color.rgb(29,47,66):Color.WHITE,true);
        drawer.addView(label,new LinearLayout.LayoutParams(-1,d(60)));
        View rule=new View(this);rule.setBackgroundColor(Color.argb(90,174,199,235));
        drawer.addView(rule,new LinearLayout.LayoutParams(-1,d(1)));
        addHomeDrawerItem(drawer,"★","Favoritos",this::openPicker);
        addHomeDrawerItem(drawer,"◐","Transparência dos fundos",this::showHomeTransparencyDialog);
        addHomeDrawerItem(drawer,"⚙","Preferências",this::showPreferencesDialog);
        addHomeDrawerItem(drawer,"⇩","Exportar dados",this::exportHomeData);
        addHomeDrawerItem(drawer,"↗","Compartilhar app",this::sharePokeSearch);
        addHomeDrawerItem(drawer,"💙","Agradecimentos",this::openTribute);
        if(CommunityScrapbookStage1.isEnabled(this))
            addHomeDrawerItem(drawer,"💬","Chat ao vivo",this::scrollToCommunity);
        // Users can collapse the chat without affecting P1/P2 overlays or login.
        boolean chatVisible=CommunityScrapbookStage1.isEnabled(this);
        addHomeDrawerItem(drawer,"💬",chatVisible?"Ocultar Chat":"Mostrar Chat",
            this::toggleCommunityScrapbookStage1);
        addHomeDrawerItem(drawer,"?","Guia rápido",this::showQuickGuide);
        addHomeDrawerItem(drawer,"✦","Novidades",()->ReleaseNotes.showHistory(this));
        addHomeDrawerItem(drawer,"!","Reportar problema",this::showBugReportDialog);
        homeRoot.addView(layer,new FrameLayout.LayoutParams(-1,-1));
        homeDrawerLayer=layer;
    }
    /** Text-only Android Sharesheet: forwards a verified Drive APK address, never
     * grants URI access to private app storage or exposes a GitHub API endpoint.
     * The Drive file is updated in place only after an approved verified build. */
    private void sharePokeSearch(){
        Intent send=new Intent(Intent.ACTION_SEND);
        send.setType("text/plain");
        send.putExtra(Intent.EXTRA_SUBJECT,"PokeSearch para Android");
        send.putExtra(Intent.EXTRA_TEXT,
            "PokeSearch para Android — baixe o APK pelo Google Drive:\n"+SHARE_APK_DRIVE_URL);
        try {
            startActivity(Intent.createChooser(send,"Compartilhar PokeSearch"));
        }catch(android.content.ActivityNotFoundException e){
            Toast.makeText(this,"Não há aplicativo disponível para compartilhar",
                Toast.LENGTH_SHORT).show();
        }
    }
    private void toggleCommunityScrapbookStage1(){
        SharedPreferences prefs=getSharedPreferences("prefs",0);
        prefs.edit().putBoolean("communityLiveChatVisible",
            !CommunityScrapbookStage1.isEnabled(this)).apply();
        // Presentation-only rebuild: existing filters, login, location, stats,
        // live overlay and Home preferences are preserved.
        setContentView(buildHome());
        refreshSessionSummary();
        refreshHomeOverlay();
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
    private void initializeSecondaryFilterDefaults(){
        SharedPreferences secondary=getSharedPreferences("prefs_secondary",0);
        if(secondary.getBoolean("secondaryInitializedV1",false))return;
        SharedPreferences primary=getSharedPreferences("prefs",0);
        SharedPreferences.Editor editor=secondary.edit();
        // Somente a aparência é herdada. Nada de copiar filtros, sessão ou localização.
        editor.putString("visualPrefsJson",primary.getString("visualPrefsJson","{}"));
        editor.putInt("spriteSize",primary.getInt("spriteSize",45));
        editor.putBoolean("showResultText",primary.getBoolean("showResultText",false));
        editor.putBoolean("showTimers",primary.getBoolean("showTimers",false));
        for(java.util.Map.Entry<String,?> entry:primary.getAll().entrySet()){
            String key=entry.getKey();
            Object value=entry.getValue();
            if(key.startsWith("resultShow")&&value instanceof Boolean)
                editor.putBoolean(key,(Boolean)value);
        }
        editor.putString("mode","raw")
            .putInt("rawAttack",0).putInt("rawDefense",0).putInt("rawStamina",0)
            .putString("extraFiltersJson","{}").putBoolean("shiny",false)
            .putBoolean("shinyOptInV32",true)
            .putBoolean("alerts",false).putString("alertsMode","off")
            .putBoolean("secondaryInitializedV1",true).apply();
    }
    private void toggleSecondaryOverlay(){
        if(!AppAvailability.isAllowed(this)){
            applyAppAvailability(AppAvailability.cached(this));return;
        }
        if(OverlayService.isSecondaryRunning()){
            stopService(new Intent(this,SecondaryOverlayService.class));
            Toast.makeText(this,"Segunda Pokébola desativada",Toast.LENGTH_SHORT).show();
            refreshHomeOverlay();
            return;
        }
        if(PremiumAccess.controlled()){
            if(!PremiumGoogleLogin.isGoogleSignedIn(this)){
                PremiumPurchaseDialog.show(this,()->{
                    if(PremiumAccess.permitted(true))startSecondaryOverlayAuthorized();
                });
                return;
            }
            PremiumAccess.verify(this,(allowed,premium)->{
                if(!allowed){
                    Toast.makeText(this,"Esta versão de testes ainda não foi liberada ou está offline.",
                        Toast.LENGTH_LONG).show();
                }else if(!premium){
                    if(PremiumAccess.deviceConflict()){
                        promptPremiumDeviceTransfer(this::startSecondaryOverlayAuthorized);
                    }else PremiumPurchaseDialog.show(this,()->{
                        if(PremiumAccess.permitted(true))startSecondaryOverlayAuthorized();
                    });
                }else startSecondaryOverlayAuthorized();
            });
            return;
        }
        startSecondaryOverlayAuthorized();
    }
    private void logoutPremiumAccount(boolean switchAccount){
        // Sign-out must NEVER depend indefinitely on a network response.
        // Keep P1, saved filters, chat and PoGoCoordinates session untouched.
        stopService(new Intent(this,SecondaryOverlayService.class));
        PremiumAccess.invalidateLease();
        final java.util.concurrent.atomic.AtomicBoolean finished=
            new java.util.concurrent.atomic.AtomicBoolean(false);
        final android.os.Handler main=new android.os.Handler(android.os.Looper.getMainLooper());
        final boolean[] remoteReleased={false};
        Runnable localLogout=()->{
            if(!finished.compareAndSet(false,true))return;
            PremiumGoogleLogin.signOut(this,()->{
                if(isFinishing()||isDestroyed())return;
                refreshHomeOverlay();
                if(switchAccount){
                    PremiumGoogleLogin.signIn(this,(success,message)->{
                        if(isFinishing()||isDestroyed())return;
                        Toast.makeText(this,message,Toast.LENGTH_LONG).show();
                        refreshHomeOverlay();
                    });
                }else Toast.makeText(this,remoteReleased[0]?
                    "Conta Google desconectada. Sua licença continua válida.":
                    "Conta Google desconectada. Liberação remota pendente.",
                    Toast.LENGTH_LONG).show();
            });
        };
        // Start the server release while the Google token still exists.
        // A slow or offline connection cannot keep the user signed in.
        main.postDelayed(localLogout,1500L);
        PremiumAccess.releaseDevice(this,(result,error)->{
            remoteReleased[0]=error==null;
            main.post(localLogout);
        });
        refreshHomeOverlay();
    }
    /** Account detail uses server-confirmed expiry, not the device purchase timestamp. */
    private static String premiumValidityDetails(java.util.Map<String,Object> state){
        if(state==null)return "\nValidade: consulta indisponível";
        String source=String.valueOf(state.getOrDefault("licenseSource",""));
        String kind=String.valueOf(state.getOrDefault("licenseKind",""));
        String type="Licença Premium";
        if("welcomeTrial".equals(source)||"trial".equals(kind))type="Teste grátis";
        else if("coupon100".equals(source))type="Cupom 100%";
        else if("paid".equals(kind))type="Premium pago";
        else if("manual".equals(kind))type="Licença manual";
        if(Boolean.TRUE.equals(state.get("lifetime")))
            return "\nPlano: "+type+" · vitalício\nValidade: sem vencimento";
        Object expiryValue=state.get("expiresAt");
        long expires=expiryValue instanceof Number?((Number)expiryValue).longValue():0L;
        if(expires<=0L)return "\nPlano: "+type+"\nValidade: ainda não definida";
        Object nowValue=state.get("serverNow");
        long now=nowValue instanceof Number?((Number)nowValue).longValue():
            System.currentTimeMillis();
        String date=new java.text.SimpleDateFormat("dd/MM/yyyy 'às' HH:mm",
            new java.util.Locale("pt","BR")).format(new java.util.Date(expires));
        if(!Boolean.TRUE.equals(state.get("licenseActive"))||expires<=now)
            return "\nPlano: "+type+"\nSituação: vencida em "+date;
        long hours=(expires-now+3599999L)/3600000L;
        long days=hours/24L,extraHours=hours%24L;
        String timeLeft=days>0L?
            days+" "+(days==1?"dia":"dias")+
                (extraHours>0L?" e "+extraHours+" h":""):
            hours>0L?hours+" "+(hours==1?"hora":"horas"):"menos de 1 hora";
        return "\nPlano: "+type+"\nTempo restante: "+timeLeft+
            "\nVálida até: "+date;
    }
    private void showPremiumAccountOptions(){
        if(!PremiumAccess.controlled())return;
        if(!PremiumGoogleLogin.isGoogleSignedIn(this)){
            new AlertDialog.Builder(this)
                .setTitle("Conta Premium")
                .setMessage("Entre com Google para gerenciar a Pokébola 2. "+
                    "A Pokébola 1 continua gratuita.")
                .setPositiveButton("Entrar com Google",(dialog,which)->
                    PremiumGoogleLogin.signIn(this,(success,message)->{
                        Toast.makeText(this,message,Toast.LENGTH_LONG).show();
                        refreshHomeOverlay();
                    }))
                .setNegativeButton("Cancelar",null).show();
            return;
        }
        final String mail=PremiumGoogleLogin.email(this);
        PremiumAccess.sessionInfo(this,(state,error)->{
            if(isFinishing()||isDestroyed())return;
            String license=error!=null?"Não foi possível consultar":
                Boolean.TRUE.equals(state.get("licenseActive"))?"Ativa":"Inativa ou vencida";
            String device=error!=null?"Verificação indisponível":
                String.valueOf(state.getOrDefault("deviceName",""));
            if(device.trim().isEmpty())device="Nenhum dispositivo autorizado";
            String status=error!=null?"Offline":
                Boolean.TRUE.equals(state.get("authorizedHere"))?
                    "Este aparelho autorizado":"Outro aparelho autorizado";
            String validity=error!=null?
                "\nValidade: consulta indisponível":premiumValidityDetails(state);
            String details="Google: "+mail+"\nLicença: "+license+validity+
                "\nAparelho: "+device+"\nSessão: "+status+
                "\n\nSua licença não é cancelada ao sair ou trocar de aparelho. "+
                "A Pokébola 1 e suas configurações permanecem gratuitas.";
            // Android AlertDialog setMessage() and setItems() both use the
            // content region: the message hides the action list on Android.
            // Render explicit visible buttons in a scrollable, accessible view.
            LinearLayout body=new LinearLayout(this);
            body.setOrientation(LinearLayout.VERTICAL);
            body.setPadding(d(18),d(8),d(18),d(8));
            TextView summary=new TextView(this);
            summary.setText(details);
            summary.setTextSize(14);
            summary.setTextColor(Color.rgb(223,232,246));
            summary.setPadding(0,0,0,d(10));
            body.addView(summary,new LinearLayout.LayoutParams(-1,-2));
            ScrollView scroll=new ScrollView(this);
            scroll.setFillViewport(false);
            scroll.addView(body);
            AlertDialog dialog=new AlertDialog.Builder(this)
                .setTitle("Conta Premium · Gerenciar")
                .setView(scroll)
                .setNegativeButton("Fechar",null)
                .create();
            Button signOut=homeAuthButton("Sair da conta Google",
                Color.rgb(157,47,68),Color.WHITE);
            signOut.setContentDescription("Sair do Premium neste aparelho");
            body.addView(signOut,new LinearLayout.LayoutParams(-1,d(48)));
            signOut.setOnClickListener(v->{
                dialog.dismiss();
                logoutPremiumAccount(false);
            });
            Button change=homeAuthButton("Trocar conta Google",
                Color.rgb(39,64,96),Color.WHITE);
            LinearLayout.LayoutParams changeLp=new LinearLayout.LayoutParams(-1,d(44));
            changeLp.topMargin=d(7);
            body.addView(change,changeLp);
            change.setOnClickListener(v->{
                dialog.dismiss();
                logoutPremiumAccount(true);
            });
            Button transfer=homeAuthButton("Transferir Premium para outro aparelho",
                Color.rgb(36,51,72),Color.WHITE);
            LinearLayout.LayoutParams transferLp=new LinearLayout.LayoutParams(-1,d(44));
            transferLp.topMargin=d(7);
            body.addView(transfer,transferLp);
            transfer.setOnClickListener(v->{
                dialog.dismiss();
                new AlertDialog.Builder(this)
                    .setTitle("Transferir Premium")
                    .setMessage("No novo celular, entre com a mesma conta Google "+
                        "e toque em 'Usar neste aparelho' quando solicitado. "+
                        "A Pokébola 2 anterior será encerrada na próxima validação.")
                    .setPositiveButton("Entendi",null)
                    .setNegativeButton("Sair deste aparelho",(d,w)->
                        logoutPremiumAccount(false))
                    .show();
            });
            dialog.show();
        });
    }
    /**
     * Only the owner of the verified Google session can replace an existing P2
     * installation. The server decides; client text cannot grant Premium.
     */
    void promptPremiumDeviceTransfer(Runnable onActivated){
        if(!PremiumGoogleLogin.isGoogleSignedIn(this))return;
        String current=PremiumAccess.activeDeviceName();
        String message="Sua licença está ativa em "+current+".\\n\\n"+
            "Deseja usar a Pokébola 2 neste aparelho? O anterior perderá acesso "+
            "quando renovar sua autorização (normalmente em até 1 minuto). "+
            "Sua licença e a Pokébola 1 não serão alteradas.";
        new AlertDialog.Builder(this)
            .setTitle("Trocar aparelho Premium")
            .setMessage(message)
            .setNegativeButton("Cancelar",null)
            .setPositiveButton("Usar neste aparelho",(dialog,which)->
                PremiumAccess.transferDevice(this,(result,error)->{
                    if(error!=null){
                        Toast.makeText(this,error,Toast.LENGTH_LONG).show();return;
                    }
                    PremiumAccess.invalidateLease();
                    PremiumAccess.verify(this,(allowed,premium)->{
                        if(premium){
                            Toast.makeText(this,"Este aparelho agora está autorizado.",
                                Toast.LENGTH_LONG).show();
                            if(onActivated!=null)onActivated.run();
                        }else Toast.makeText(this,
                            "Não foi possível confirmar a troca. Verifique sua conexão.",
                            Toast.LENGTH_LONG).show();
                    });
                }))
            .show();
    }
    private void startSecondaryOverlayAuthorized(){
        if(PremiumAccess.controlled()&&!PremiumAccess.permitted(true))return;
        if(Build.VERSION.SDK_INT>=23&&!Settings.canDrawOverlays(this)){
            startActivityForResult(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:"+getPackageName())),101);
            return;
        }
        initializeSecondaryFilterDefaults();
        CookieManager.getInstance().flush();
        Intent intent=new Intent(this,SecondaryOverlayService.class);
        if(Build.VERSION.SDK_INT>=26)startForegroundService(intent);else startService(intent);
        if(homeRoot!=null)homeRoot.postDelayed(this::refreshHomeOverlay,750);
    }
    private void refreshHomeOverlay(){
        if(overlayControl==null)return;
        boolean on=OverlayService.isRunning();
        overlayControl.setImageResource(on?R.drawable.personalizado:R.drawable.sem_filtro);
        overlayControl.setContentDescription(on?"Desativar Pokébola 1":"Ativar Pokébola 1");
        overlayControl.setBackground(homeSurface(on?Color.rgb(18,94,82):
            homeLightMode?Color.rgb(247,251,255):Color.rgb(30,35,45),10,0));
        if(secondaryOverlayControl!=null){
            boolean secondaryOn=OverlayService.isSecondaryRunning();
            secondaryOverlayControl.setImageResource(secondaryOn?R.drawable.personalizado:R.drawable.sem_filtro);
            secondaryOverlayControl.setContentDescription(secondaryOn?
                "Desativar segunda Pokébola":"Ativar segunda Pokébola");
            secondaryOverlayControl.setBackground(homeSurface(secondaryOn?Color.rgb(18,94,82):
                homeLightMode?Color.rgb(247,251,255):Color.rgb(30,35,45),10,0));
        }
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

    private void showHomeTransparencyDialog(){
        android.content.SharedPreferences prefs=getSharedPreferences("prefs",0);
        int old=homeSurfacesTransparency();
        LinearLayout view=new LinearLayout(this);
        view.setPadding(d(18),d(12),d(18),d(10));
        view.setOrientation(LinearLayout.VERTICAL);
        TextView label=homeText("Transparência: "+old+"%",14,Color.rgb(25,42,60),true);
        view.addView(label);
        android.widget.SeekBar slider=new android.widget.SeekBar(this);
        slider.setMax(100);slider.setProgress(old);view.addView(slider);
        slider.setOnSeekBarChangeListener(new android.widget.SeekBar.OnSeekBarChangeListener(){
            @Override public void onProgressChanged(android.widget.SeekBar bar,int value,boolean user){
                label.setText("Transparência: "+value+"%");
                prefs.edit().putInt("homePanelsTransparency",value).apply();
                refreshHomeSurfaceOpacity();
            }
            @Override public void onStartTrackingTouch(android.widget.SeekBar bar){}
            @Override public void onStopTrackingTouch(android.widget.SeekBar bar){}
        });
        new android.app.AlertDialog.Builder(this).setTitle("Transparência dos fundos da Home")
            .setView(view).setPositiveButton("Concluído",(dialog,which)->{}).show();
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
        tutorialDialog=dialog;
        tutorialWebView=guide;
        dialog.setOnDismissListener(ignored->{
            releaseTutorialWebView();
            getWindow().getDecorView().postDelayed(this::maybeWelcomeMission,500L);
            // First-time users read the guide before any pending upgrade notes.
            if(Intent.ACTION_MAIN.equals(getIntent().getAction()))
                ReleaseNotes.maybeShowAfterUpgrade(this);
        });
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
        final int avatarRequestId=++avatarRequestGeneration;
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
                    if(!activityClosing&&!isDestroyed()&&avatarRequestId==avatarRequestGeneration&&next.equals(shownAvatarUrl))shownAvatarUrl="";
                });
            }
            final android.graphics.Bitmap photo=bitmap;
            if(photo!=null)runOnUiThread(()->{
                if(activityClosing||isFinishing()||isDestroyed()||avatarRequestId!=avatarRequestGeneration||
                     accountAvatar==null||!shownAvatarUrl.equals(next)||
                    !"autenticada".equals(getSharedPreferences("prefs",0)
                        .getString("sessionStatus","")))return;
                accountAvatar.clearColorFilter();
                accountAvatar.setPadding(0,0,0,0);
                accountAvatar.setScaleType(ImageView.ScaleType.CENTER_CROP);
                accountAvatar.setImageBitmap(photo);
            });
        },"PokeSearch-Google-Avatar").start();
    }

    // Precisely follows the circular photo instead of stretching 1254px ornamental frames.
    private android.graphics.drawable.GradientDrawable homeAvatarOutline(String team){
        int border=Color.rgb(189,193,199);
        if("Mystic".equalsIgnoreCase(team)||"Místico".equalsIgnoreCase(team))
            border=Color.rgb(80,165,248);
        else if("Valor".equalsIgnoreCase(team)||"Valentia".equalsIgnoreCase(team))
            border=Color.rgb(238,82,97);
        else if("Instinct".equalsIgnoreCase(team)||"Instinto".equalsIgnoreCase(team))
            border=Color.rgb(245,202,74);
        android.graphics.drawable.GradientDrawable outline=new android.graphics.drawable.GradientDrawable();
        outline.setShape(android.graphics.drawable.GradientDrawable.OVAL);
        outline.setColor(Color.TRANSPARENT);
        outline.setStroke(d(3),border);
        return outline;
    }
    private int homeUserFrame(String team){
        if("Mystic".equalsIgnoreCase(team)||"Místico".equalsIgnoreCase(team))return R.drawable.ps_user_frame_mystic;
        if("Valor".equalsIgnoreCase(team)||"Valentia".equalsIgnoreCase(team))return R.drawable.ps_user_frame_valor;
        if("Instinct".equalsIgnoreCase(team)||"Instinto".equalsIgnoreCase(team))return R.drawable.ps_user_frame_instinct;
        return R.drawable.ps_user_frame_neutral;
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
        int trainerCount=0;
        JSONArray savedTrainers=null;
        try{savedTrainers=new JSONArray(prefs.getString("profileTrainersJson","[]"));
            trainerCount=Math.min(10,savedTrainers.length());}
        catch(Exception ignored){trainerCount=0;}
        if(trainerSectionTitle!=null)trainerSectionTitle.setText(trainerCount>1?
            "Treinadores vinculados ("+trainerCount+")":linked?
            "Treinador vinculado":"Conta Pokémon GO");
        if(trainerChoices!=null){
            trainerChoices.removeAllViews();
            trainerChoices.setVisibility(logged&&trainerCount>1?View.VISIBLE:View.GONE);
            String activeCode=prefs.getString("profileTrainerActiveCode","");
            for(int i=0;logged&&savedTrainers!=null&&i<trainerCount&&trainerCount>1;i++){
                JSONObject entry=savedTrainers.optJSONObject(i);
                if(entry==null)continue;
                String trainerName=entry.optString("name","");
                String trainerTeam=entry.optString("team","");
                String trainerLevel=entry.optString("level","");
                String entryCode=entry.optString("code","");
                if(!entryCode.matches("[0-9]{12}")||trainerName.isEmpty())continue;
                boolean officialActive=activeCode.equals(entryCode);
                TextView choice=homeText((officialActive?"✓ ":"○ ")+trainerName+
                    " · "+trainerTeam+" · Nv "+trainerLevel+
                    (officialActive?" · Ativo":" · Selecionar no site"),12,
                    officialActive?Color.rgb(113,226,188):
                    homeLightMode?Color.rgb(42,66,89):Color.rgb(211,226,244),officialActive);
                choice.setPadding(d(8),d(7),d(8),d(7));
                trainerChoices.addView(choice,new LinearLayout.LayoutParams(-1,-2));
                choice.setOnClickListener(v->openLoginDialog(false,"manage"));
            }
        }
        String team=prefs.getString("profileTrainerTeam","");
        String details=prefs.getString("profileTrainerDetails","");
        if(team.isEmpty()){
            if(details.contains("Mystic"))team="Mystic";
            else if(details.contains("Valor"))team="Valor";
            else if(details.contains("Instinct"))team="Instinct";
        }
        if(accountAvatarFrame!=null)accountAvatarFrame.setImageDrawable(homeAvatarOutline(linked?team:""));
        if(teamBadge!=null){
            teamBadge.setImageResource(homeTeamIcon(linked?team:""));
            teamBadge.setContentDescription(linked&&team.length()>0?
                "Equipe "+team:"Sem equipe");
        }
        if(trainerDisplay!=null)trainerDisplay.setText(trainerCount>1&&!linked?
            "Escolha o treinador no site":linked?trainer:
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
        if(trainerAction!=null)trainerAction.setText(trainerCount>1?"Trocar":linked?"Remover":"Gerenciar");
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
        stopService(new Intent(this,SecondaryOverlayService.class));
        if(loginDialog!=null&&loginDialog.isShowing())loginDialog.dismiss();
        getSharedPreferences("prefs",0).edit()
            .putString("sessionStatus","desconectado")
            .remove("profileDisplayName").remove("profileProvider").remove("profileAvatarUrl")
            .remove("profileTrainerName").remove("profileTrainerCode")
            .remove("profileTrainerDetails").remove("profileTrainerState")
            .remove("profileTrainerTeam").remove("profileTrainerLevel")
            .remove("profileTrainersJson").remove("profileTrainerActiveCode")
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
        missionResumed=true;
        syncMissionClock(hasWindowFocus());
        FirebaseStats.setHomeVisible(this,true);
        applyAppAvailability(AppAvailability.cached(this));
        availabilityHandler.removeCallbacks(availabilityTick);
        availabilityHandler.post(availabilityTick);
        if(PremiumAccess.controlled())PremiumAccess.verify(this,(allowed,premium)->{
            if(!allowed){
                stopService(new Intent(this,OverlayService.class));
                stopService(new Intent(this,SecondaryOverlayService.class));
            }else if(!premium)stopService(new Intent(this,SecondaryOverlayService.class));
            refreshHomeOverlay();
        });
        refreshWatchCount();
        refreshSessionSummary();
        refreshHomeOverlay();
        UpdateCenter.check(this); // Preserve existing Google Drive fallback.
        GitHubUpdateCenter.schedule(this); // 30 min, Doze-aware; no extra service.
        GitHubUpdateCenter.check(this); // Official stable Releases only.
        if(OverlayService.isRunning())
            serviceAction("com.lucianotoscano.pokesearchoverlay.SYNC_NOTIFICATION_PERMISSION");
    }
    @Override protected void onPause(){
        availabilityHandler.removeCallbacks(availabilityTick);
        missionResumed=false;
        syncMissionClock(false);
        FirebaseStats.setHomeVisible(this,false);
        super.onPause();
    }
    private void handleShinyLoginIntent(Intent intent){
        if(intent!=null && "com.lucianotoscano.pokesearchoverlay.OPEN_SHINY_LOGIN".equals(intent.getAction()))
            getWindow().getDecorView().post(this::openLoginDialog);
    }
    private void sendActionToRunningOverlay(Class<?> serviceType,String action,boolean authConfirmed){
        boolean enabled=serviceType==OverlayService.class?
            OverlayService.isRunning():OverlayService.isSecondaryRunning();
        if(!enabled)return;
        Intent intent=new Intent(this,serviceType);
        intent.setAction(action);
        intent.putExtra("authConfirmed",authConfirmed);
        if(Build.VERSION.SDK_INT>=26)startForegroundService(intent);else startService(intent);
    }
    private void serviceAction(String action){serviceAction(action,false);}
    private void serviceAction(String action,boolean authConfirmed){
        sendActionToRunningOverlay(OverlayService.class,action,authConfirmed);
        sendActionToRunningOverlay(SecondaryOverlayService.class,action,authConfirmed);
    }
    private void notifyOverlaySessionReady(){
        CookieManager.getInstance().flush();
        serviceAction("com.lucianotoscano.pokesearchoverlay.REFRESH_LOGIN");
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
                    .remove("profileTrainerLevel")
                    .remove("profileTrainersJson").remove("profileTrainerActiveCode").apply();
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
                    JSONArray trainers=profile.optJSONArray("trainers");
                    String officialActiveCode=profile.optString("activeTrainerCode","");
                    if(trainers!=null&&trainers.length()>0&&trainers.length()<=10){
                        edit.putString("profileTrainersJson",trainers.toString());
                        edit.putString("profileTrainerActiveCode",
                            officialActiveCode.matches("[0-9]{12}")?officialActiveCode:"");
                    }else edit.remove("profileTrainersJson").remove("profileTrainerActiveCode");
                    String trainer=profile.optString("trainerName","");
                    String code=profile.optString("trainerCode","");
                    if(trainers!=null&&officialActiveCode.matches("[0-9]{12}")){
                        for(int ti=0;ti<trainers.length();ti++){
                            JSONObject candidate= trainers.optJSONObject(ti);
                            if(candidate!=null&&officialActiveCode.equals(candidate.optString("code",""))){
                                trainer=candidate.optString("name","");
                                code=officialActiveCode;
                                break;
                            }
                        }
                    }
                    if("linked".equals(state)&&trainer.length()>0&&
                       trainer.length()<=40&&code.matches("[0-9]{12}")){
                        String level=profile.optString("level","");
                        String team=profile.optString("team","");
                        if(trainers!=null){
                            for(int ti=0;ti<trainers.length();ti++){
                                JSONObject candidate=trainers.optJSONObject(ti);
                                if(candidate!=null&&code.equals(candidate.optString("code",""))){
                                    level=candidate.optString("level",level);
                                    team=candidate.optString("team",team);
                                    break;
                                }
                            }
                        }
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
                                "linked".equals(state)?"linked":
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
        done.setOnClickListener(v->{
            if("manage".equals(loginPurpose)&&website!=null&&
               loginDialog!=null&&loginDialog.isShowing()){
                loginAutoReturnQueued=true;
                profileCaptureInProgress=true;
                avatarReadRetryCount=0;
                int currentGeneration=loginPageGeneration;
                Uri location=Uri.parse(website.getUrl()==null?"":website.getUrl());
                if("/profile".equals(location.getPath()))
                    captureOfficialProfile(website,currentGeneration);
                else website.loadUrl("https://pogocoordinates.com/profile");
                website.postDelayed(()->{
                    if(loginDialog!=null&&loginDialog.isShowing()&&
                       profileCaptureInProgress&&currentGeneration==loginPageGeneration){
                        profileCaptureInProgress=false;
                        Toast.makeText(this,"Seleção não confirmada pelo site.",Toast.LENGTH_SHORT).show();
                        loginDialog.dismiss();
                    }
                },6500L);
                return;
            }
            loginDialog.dismiss();
        });
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
        SupportMissionState.onLauncherIntent(this,intent,null);
        syncMissionBadge();
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
        if("com.lucianotoscano.pokesearchoverlay.PICK_ALERT_TONE".equals(intent.getAction()))
            getWindow().getDecorView().post(()->beginAlertToneChoice(intent.getStringExtra("alertToneTarget")));
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
        // API is the primary built-in source for new installs. Preserve an
        // explicit stored DOM opt-out and never bypass authorization failures.
        // The refresh icon re-runs Search using only the selected source.
        settingCheckbox(body,prefs,"authorizedApiQaOptIn",
            "Pesquisa direta pela API (padrão ON; desmarque para usar DOM)",true);
        // LT79: separate update notifications and explicit user-driven check.
        CheckBox updateAlerts=new CheckBox(this);
        updateAlerts.setText("Avisar quando sair nova atualização do PokeSearch");
        updateAlerts.setTextColor(Color.WHITE);
        updateAlerts.setChecked(GitHubUpdateCenter.alertsEnabled(this));
        updateAlerts.setOnCheckedChangeListener((button,enabled)->{
            GitHubUpdateCenter.setAlerts(this,enabled);
            if(enabled&&Build.VERSION.SDK_INT>=33&&
                checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=
                    PackageManager.PERMISSION_GRANTED)
                requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},205);
        });
        body.addView(updateAlerts);
        Button checkUpdates=new Button(this);
        checkUpdates.setText("↻ Verificar atualizações");
        checkUpdates.setAllCaps(false);checkUpdates.setTextSize(12);
        checkUpdates.setOnClickListener(v->{
            GitHubUpdateCenter.checkManual(this);
            Toast.makeText(this,"Consultando versões oficiais…",Toast.LENGTH_SHORT).show();
        });
        body.addView(checkUpdates,new LinearLayout.LayoutParams(-1,d(42)));
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
        check.setChecked(WatchAlerts.PREF_ENABLED.equals(key)?
            WatchAlerts.enabled(this):prefs.getBoolean(key,def));
        check.setOnCheckedChangeListener((button,enabled)->{
            if(WatchAlerts.PREF_ENABLED.equals(key))
                WatchAlerts.setMode(this,enabled?"on":"off");
            else prefs.edit().putBoolean(key,enabled).apply();
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
    private void startOverlay(){
        // P1 is always free when this APK is enabled and not in maintenance.
        if(!AppAvailability.isAllowed(this)){
            applyAppAvailability(AppAvailability.cached(this));return;
        }
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
        moveTaskToBack(true);
    }

    // Launched only after user interaction with the Notifications menu.
    private void beginAlertToneChoice(String target){
        if("general".equals(target)||"favorites".equals(target)){
            openBundledAlertTonePicker(target,"");
            return;
        }
        if(!"species".equals(target))return;
        java.util.LinkedHashMap<String,String> names=WatchAlerts.names(
            getSharedPreferences("prefs",0).getString(WatchAlerts.PREF_LIST,""));
        if(names.isEmpty()){
            Toast.makeText(this,"Adicione um Pokémon aos favoritos primeiro",Toast.LENGTH_LONG).show();
            return;
        }
        String[] options=names.values().toArray(new String[0]);
        new AlertDialog.Builder(this).setTitle("Som de qual Pokémon favorito?")
            .setItems(options,(dialog,which)->{
                if(which>=0&&which<options.length)
                    chooseAlertToneSource("species",options[which]);
            }).setNegativeButton("Cancelar",null).show();
    }
    // Local preview is triggered only by tapping a sound. No preference
    // is changed until the separate confirmation button is pressed.
    private void stopBundledTonePreview(){
        android.media.Ringtone oldSystem=systemTonePreview;
        systemTonePreview=null;
        if(oldSystem!=null)try{oldSystem.stop();}catch(RuntimeException ignored){}
        android.media.MediaPlayer previous=bundledTonePreview;
        bundledTonePreview=null;
        if(previous!=null){
            try{previous.setOnCompletionListener(null);previous.release();}
            catch(RuntimeException ignored){}
        }
    }
    private boolean playBundledTonePreview(int selection){
        stopBundledTonePreview();
        Uri source=PokeSoundLibrary.soundUri(this,selection);
        if(source==null)return false;
        try{
            android.media.MediaPlayer player=android.media.MediaPlayer.create(this,source);
            if(player==null){
                Toast.makeText(this,"Não foi possível reproduzir este som",Toast.LENGTH_SHORT).show();
                return false;
            }
            bundledTonePreview=player;
            player.setOnCompletionListener(done->stopBundledTonePreview());
            player.start();
            return true;
        }catch(RuntimeException error){
            stopBundledTonePreview();
            Toast.makeText(this,"Prévia indisponível para este som",Toast.LENGTH_SHORT).show();
            return false;
        }
    }
    private void openBundledAlertTonePicker(String target,String pokemon){
        stopBundledTonePreview();
        // First item is the Android default, next the 36 locally bundled MP3
        // resources, and the last opens ACTION_OPEN_DOCUMENT to upload audio.
        final int count=PokeSoundLibrary.size();
        String[] choices=new String[count+2];
        choices[0]="Padrão";
        System.arraycopy(PokeSoundLibrary.LABELS,0,choices,1,count);
        choices[count+1]="＋ Enviar áudio";
        final int[] selected={-1};
        AlertDialog dialog=new AlertDialog.Builder(this)
            .setTitle("Toque para ouvir · confirme em ✓")
            .setSingleChoiceItems(choices,-1,(opened,which)->{
                if(which==count+1){
                    opened.dismiss();
                    openAlertAudioFilePicker(target,pokemon);
                    return;
                }
                if(which==0){
                    stopBundledTonePreview();
                    selected[0]=-2; // Explicit Android default; no custom URI.
                    try{
                        systemTonePreview=RingtoneManager.getRingtone(this,
                            RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION));
                        if(systemTonePreview!=null)systemTonePreview.play();
                    }catch(RuntimeException ignored){}
                }else{
                    selected[0]=playBundledTonePreview(which-1)?which-1:-1;
                }
                ((AlertDialog)opened).getButton(AlertDialog.BUTTON_POSITIVE)
                    .setEnabled(selected[0]!=-1);
            })
            .setPositiveButton("✓ Usar áudio",(opened,which)->{
                if(selected[0]==-1)return;
                if(selected[0]==-2){storeAlertTone(target,pokemon,"");return;}
                Uri chosen=PokeSoundLibrary.soundUri(this,selected[0]);
                if(chosen!=null)storeAlertTone(target,pokemon,chosen.toString());
            })
            .setNegativeButton("Cancelar",null)
            .create();
        dialog.setOnShowListener(opened->
            dialog.getButton(AlertDialog.BUTTON_POSITIVE).setEnabled(false));
        dialog.setOnDismissListener(closed->stopBundledTonePreview());
        dialog.show();
    }
    private void chooseAlertToneSource(String target,String pokemon){
        new AlertDialog.Builder(this)
            .setTitle("Som de "+("species".equals(target)?pokemon:
                "favorites".equals(target)?"favoritos":"novos Pokémon"))
            .setItems(new String[]{"🎶 Biblioteca PokeSearch ("+PokeSoundLibrary.size()+" sons)","🔔 Toques do Android",
                "🎵 Escolher áudio (MP3/OGG) do aparelho ou Drive","↩ Restaurar som padrão"},
                (dialog,which)->{
                    if(which==0)openBundledAlertTonePicker(target,pokemon);
                    else if(which==1)openAlertRingtonePicker(target,pokemon);
                    else if(which==2)openAlertAudioFilePicker(target,pokemon);
                    else if(which==3)storeAlertTone(target,pokemon,"");
                }).setNegativeButton("Cancelar",null).show();
    }
    private void openAlertAudioFilePicker(String target,String pokemon){
        alertToneTarget=target;alertToneSpecies=pokemon;
        Intent pick=new Intent(Intent.ACTION_OPEN_DOCUMENT);
        pick.addCategory(Intent.CATEGORY_OPENABLE);
        pick.setType("audio/*");
        pick.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|
            Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        try{startActivityForResult(pick,306);}
        catch(Exception error){
            alertToneTarget="";alertToneSpecies="";
            Toast.makeText(this,"Abra um arquivo de áudio local ou do Drive",Toast.LENGTH_LONG).show();
        }
    }
    private void openAlertRingtonePicker(String target,String pokemon){
        alertToneTarget=target;alertToneSpecies=pokemon;
        Uri existing=WatchAlerts.selectedTone(this,
            !"general".equals(target),"species".equals(target)?pokemon:null);
        Intent intent=new Intent(RingtoneManager.ACTION_RINGTONE_PICKER);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE,RingtoneManager.TYPE_NOTIFICATION);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_TITLE,
            "species".equals(target)?"Som · "+pokemon:
            "favorites".equals(target)?"Som de favoritos":"Som de novos Pokémon");
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT,true);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT,false);
        intent.putExtra(RingtoneManager.EXTRA_RINGTONE_EXISTING_URI,existing);
        try{startActivityForResult(intent,305);}
        catch(Exception e){
            alertToneTarget="";alertToneSpecies="";
            Toast.makeText(this,"Seletor de sons indisponível no Android",Toast.LENGTH_LONG).show();
        }
    }
    private void confirmUploadedAlertTone(String target,String species,Uri chosen){
        stopBundledTonePreview();
        AlertDialog confirm=new AlertDialog.Builder(this)
            .setTitle("Áudio enviado")
            .setMessage("Ouça a prévia e confirme para usar nas notificações.")
            .setNeutralButton("▶ Ouvir",null)
            .setPositiveButton("✓ Usar áudio",(dialog,which)->
                storeAlertTone(target,species,chosen.toString()))
            .setNegativeButton("Cancelar",null).create();
        confirm.setOnShowListener(shown->
            confirm.getButton(AlertDialog.BUTTON_NEUTRAL).setOnClickListener(v->{
                stopBundledTonePreview();
                try{
                    bundledTonePreview=android.media.MediaPlayer.create(this,chosen);
                    if(bundledTonePreview==null){
                        Toast.makeText(this,"Prévia indisponível",Toast.LENGTH_SHORT).show();
                        return;
                    }
                    bundledTonePreview.setOnCompletionListener(done->stopBundledTonePreview());
                    bundledTonePreview.start();
                }catch(RuntimeException error){
                    stopBundledTonePreview();
                    Toast.makeText(this,"Não foi possível ouvir o arquivo",Toast.LENGTH_SHORT).show();
                }
            }));
        confirm.setOnDismissListener(done->stopBundledTonePreview());
        confirm.show();
    }
    private void saveChosenAlertTone(Intent data,boolean document){
        String target=alertToneTarget,species=alertToneSpecies;
        alertToneTarget="";alertToneSpecies="";
        if(data==null||target.isEmpty())return;
        Uri uri=document?data.getData():
            data.getParcelableExtra(RingtoneManager.EXTRA_RINGTONE_PICKED_URI);
        if(uri==null)return;
        String scheme=uri.getScheme();
        if(!"content".equals(scheme)&&!"android.resource".equals(scheme))return;
        if(document){
            try{
                getContentResolver().takePersistableUriPermission(uri,
                    Intent.FLAG_GRANT_READ_URI_PERMISSION);
            }catch(Exception unavailable){
                Toast.makeText(this,"O provedor de áudio não concedeu acesso permanente. Baixe o MP3 no aparelho.",Toast.LENGTH_LONG).show();
                return;
            }
            // Choosing a file does not persist the tone: preview + confirm first.
            confirmUploadedAlertTone(target,species,uri);
            return;
        }
        String chosen=uri.equals(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))?
            "":uri.toString();
        storeAlertTone(target,species,chosen);
    }
    private void storeAlertTone(String target,String species,String chosen){
        SharedPreferences prefs=getSharedPreferences("prefs",0);
        if("general".equals(target)||"favorites".equals(target)){
            prefs.edit().putString("general".equals(target)?
                WatchAlerts.PREF_GENERAL_TONE:WatchAlerts.PREF_FAVORITE_TONE,chosen).apply();
        }else if("species".equals(target)&&!species.isEmpty()){
            try{
                JSONObject own=new JSONObject(prefs.getString(WatchAlerts.PREF_SPECIES_TONES,"{}"));
                String key=WatchAlerts.normalized(species);
                if(!WatchAlerts.watched(this).contains(key))return;
                if(chosen.isEmpty())own.remove(key);else own.put(key,chosen);
                prefs.edit().putString(WatchAlerts.PREF_SPECIES_TONES,own.toString()).apply();
            }catch(Exception e){
                Toast.makeText(this,"Não foi possível salvar o som individual",Toast.LENGTH_LONG).show();
                return;
            }
        }
        Toast.makeText(this,"Som escolhido para futuras notificações",Toast.LENGTH_LONG).show();
        syncOverlayPreferences();
    }
    @Override protected void onActivityResult(int req,int result,Intent data){
        super.onActivityResult(req,result,data);
        if((req==CommunityScrapbookOnline.REQUEST_PHOTO ||
            req==CommunityScrapbookOnline.REQUEST_GOOGLE_ADMIN) &&
            CommunityScrapbookOnline.onActivityResult(communityHomePanel,req,result,data))return;
        if(req==305||req==306){
            if(result==RESULT_OK)saveChosenAlertTone(data,req==306);
            else{alertToneTarget="";alertToneSpecies="";}
            return;
        }
        if(req==101&&Settings.canDrawOverlays(this))startOverlay();
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
        if(requestCode==202)startOverlay();
        if(requestCode==204){
            boolean granted=results.length>0&&results[0]==PackageManager.PERMISSION_GRANTED;
            serviceAction("com.lucianotoscano.pokesearchoverlay.SYNC_NOTIFICATION_PERMISSION");
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
        if(tributeOverlay!=null&&homeRoot!=null){
            homeRoot.removeView(tributeOverlay);tributeOverlay=null;return;
        }
        if(homeDrawerLayer!=null){closeHomeMenu();return;}
        if(website!=null&&website.canGoBack())website.goBack();else super.onBackPressed();
    }
    @Override protected void onDestroy(){
        availabilityHandler.removeCallbacks(availabilityTick);
        if(availabilityDialog!=null){
            availabilityDialog.dismiss();availabilityDialog=null;
        }
        missionResumed=false;
        missionHandler.removeCallbacks(missionHeartbeat);
        SupportMissionState.homeVisibility(this,false);
        stopBundledTonePreview();
        activityClosing=true;
        avatarRequestGeneration++;
        if(tutorialDialog!=null)tutorialDialog.dismiss();
        releaseTutorialWebView();
        if(loginDialog!=null){loginDialog.setOnDismissListener(null);loginDialog.dismiss();loginDialog=null;}
        if(website!=null){website.stopLoading();website.destroy();website=null;}
        super.onDestroy();
    }
}

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
    private TextView watchSummary;
    private TextView sessionSummary;
    private boolean loginStartedForShiny=false;
    private boolean loginAutoReturnQueued=false;
    private android.app.Dialog loginDialog;
    private boolean loginSessionNotified=false;
    private boolean loginLinkAttempted=false;
    private boolean loginDiscoveryStarted=false;
    private View loginCover;
    private TextView loginWaitLabel,loginFallback;
    private int loginPageGeneration=0;
    private String pendingReportText="";
    @Override public void onCreate(Bundle b){
        super.onCreate(b);
        if (!IntegrityGuard.verify(this)) {
            BugReport.log(this,"SECURITY","Falha de integridade do pacote");
            android.widget.Toast.makeText(this,"Cópia não autorizada ou inválida",android.widget.Toast.LENGTH_LONG).show();
            finish();
            return;
        }
        getWindow().setStatusBarColor(Color.rgb(11,13,18));
        getWindow().setNavigationBarColor(Color.rgb(11,13,18));
        LinearLayout root=new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(11,13,18));
        root.setPadding(d(12),d(3),d(12),0);
        LinearLayout header=new LinearLayout(this);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setOrientation(LinearLayout.HORIZONTAL);
        TextView brand=new TextView(this);
        brand.setText("PokeSearch");
        brand.setTextColor(Color.WHITE);
        brand.setTextSize(22);
        brand.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        brand.setPadding(d(7),0,0,0);
        header.addView(brand,new LinearLayout.LayoutParams(0,d(51),1));
        ImageButton heart=makeIcon(R.drawable.ic_heart_outline,"Contribuir com um café via Pix");
        heart.setOnClickListener(v->PixSupport.show(this));
        header.addView(heart,new LinearLayout.LayoutParams(d(45),d(45)));
        ImageButton gear=makeIcon(R.drawable.ic_settings_outline,"Preferências");
        gear.setOnClickListener(v->showPreferencesDialog());
        header.addView(gear,new LinearLayout.LayoutParams(d(45),d(45)));
        root.addView(header);
        Button start=new Button(this);
        start.setText("Ativar overlay");
        start.setTextColor(Color.WHITE);
        start.setTextSize(15);
        start.setAllCaps(false);
        start.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        start.setBackground(round(Color.rgb(213,45,79),12));
        LinearLayout.LayoutParams startParams=new LinearLayout.LayoutParams(-1,d(49));
        startParams.setMargins(d(2),d(3),d(2),d(9));
        root.addView(start,startParams);
        start.setOnClickListener(v->startOverlay());
        // Account controls stay on the native Home; the site is a temporary login surface.
        LinearLayout account=new LinearLayout(this);
        account.setOrientation(LinearLayout.VERTICAL);
        account.setPadding(d(12),d(9),d(12),d(10));
        account.setBackground(round(Color.rgb(23,30,41),11));
        sessionSummary=new TextView(this);
        sessionSummary.setTextColor(Color.rgb(188,204,222));
        sessionSummary.setTextSize(12);
        sessionSummary.setPadding(0,0,0,d(8));
        account.addView(sessionSummary);
        LinearLayout buttons=new LinearLayout(this);
        buttons.setOrientation(LinearLayout.HORIZONTAL);
        Button signIn=new Button(this);
        signIn.setText("Entrar / vincular");
        signIn.setAllCaps(false);
        signIn.setTextSize(12);
        signIn.setTextColor(Color.rgb(213,255,238));
        signIn.setBackground(round(Color.rgb(30,91,73),9));
        buttons.addView(signIn,new LinearLayout.LayoutParams(0,d(42),1));
        signIn.setOnClickListener(v->openLoginDialog(false));
        Button signOut=new Button(this);
        signOut.setText("Sair");
        signOut.setAllCaps(false);
        signOut.setTextSize(12);
        signOut.setTextColor(Color.rgb(255,204,213));
        signOut.setBackground(round(Color.rgb(77,40,52),9));
        LinearLayout.LayoutParams signOutParams=new LinearLayout.LayoutParams(d(91),d(42));
        signOutParams.setMargins(d(8),0,0,0);
        buttons.addView(signOut,signOutParams);
        signOut.setOnClickListener(v->askLogout());
        account.addView(buttons);
        LinearLayout.LayoutParams accountParams=new LinearLayout.LayoutParams(-1,-2);
        accountParams.setMargins(d(2),0,d(2),d(10));
        root.addView(account,accountParams);
        refreshSessionSummary();
        LinearLayout watchRow=new LinearLayout(this);
        watchRow.setOrientation(LinearLayout.HORIZONTAL);
        watchRow.setGravity(Gravity.CENTER_VERTICAL);
        watchRow.setPadding(d(11),d(5),d(10),d(5));
        watchRow.setBackground(round(Color.rgb(24,28,36),11));
        ImageView bell=new ImageView(this);
        bell.setImageResource(R.drawable.ic_star_outline);
        watchRow.addView(bell,new LinearLayout.LayoutParams(d(27),d(27)));
        LinearLayout watchTexts=new LinearLayout(this);
        watchTexts.setOrientation(LinearLayout.VERTICAL);
        watchTexts.setPadding(d(9),0,0,0);
        TextView watchTitle=new TextView(this);
        watchTitle.setText("Pokémon favoritos");
        watchTitle.setTextColor(Color.WHITE);
        watchTitle.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        watchTitle.setTextSize(13);
        watchTexts.addView(watchTitle);
        watchSummary=new TextView(this);
        watchSummary.setTextSize(11);
        watchSummary.setTextColor(Color.rgb(159,169,183));
        watchTexts.addView(watchSummary);
        watchRow.addView(watchTexts,new LinearLayout.LayoutParams(0,-2,1));
        TextView arrow=new TextView(this);
        arrow.setText("›");
        arrow.setTextColor(Color.rgb(175,184,195));
        arrow.setTextSize(23);
        watchRow.addView(arrow);
        LinearLayout.LayoutParams rowParams=new LinearLayout.LayoutParams(-1,d(60));
        rowParams.setMargins(d(2),0,d(2),d(10));
        root.addView(watchRow,rowParams);
        watchRow.setOnClickListener(v->openPicker());
        refreshWatchCount();
        TextView guide=new TextView(this);
        guide.setText("ⓘ  Guia rápido · entenda os botões");
        guide.setTextColor(Color.rgb(189,207,223));
        guide.setTextSize(13);
        guide.setGravity(Gravity.CENTER_VERTICAL);
        guide.setPadding(d(14),0,d(12),0);
        guide.setBackground(round(Color.rgb(24,29,38),10));
        LinearLayout.LayoutParams guideParams=new LinearLayout.LayoutParams(-1,d(43));
        guideParams.setMargins(d(2),0,d(2),d(9));
        root.addView(guide,guideParams);
        guide.setOnClickListener(v->showQuickGuide());
        // Home independente: a interface do site não faz parte da tela principal.
        TextView hint=new TextView(this);
        hint.setText("IV100  ·  GL#1  ·  UL#1\nToque em Ativar overlay para começar.");
        hint.setTextColor(Color.rgb(155,165,181));
        hint.setTextSize(12);
        hint.setGravity(Gravity.CENTER);
        root.addView(hint,new LinearLayout.LayoutParams(-1,0,1));
        setContentView(root);
        handleShinyLoginIntent(getIntent());
        if(!getSharedPreferences("prefs",0).getBoolean("tutorialSeenV41",false)&&
           !"com.lucianotoscano.pokesearchoverlay.OPEN_SHINY_LOGIN".equals(getIntent().getAction()))
            root.post(this::showQuickGuide);
        if("com.lucianotoscano.pokesearchoverlay.EDIT_WATCH_LIST".equals(getIntent().getAction()))
            root.post(this::openPicker);
        if("com.lucianotoscano.pokesearchoverlay.OPEN_SETTINGS".equals(getIntent().getAction()))
            root.post(this::showPreferencesDialog);
        if("com.lucianotoscano.pokesearchoverlay.OPEN_PIX".equals(getIntent().getAction()))
            root.post(()->PixSupport.show(this));
        if("com.lucianotoscano.pokesearchoverlay.OPEN_REPORT".equals(getIntent().getAction()))
            root.post(this::showBugReportDialog);
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
    private void refreshSessionSummary(){
        if(sessionSummary==null)return;
        String state=getSharedPreferences("prefs",0).getString("sessionStatus","não confirmado");
        String text="autenticada".equals(state)?"● Sessão identificada · PoGoCoordinates":
            "desconectado".equals(state)?"○ Sessão local desconectada":
            "login necessário".equals(state)?"○ Login necessário para Shiny":
            "○ Sessão ainda não confirmada";
        sessionSummary.setText(text);
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
    }
    private void handleShinyLoginIntent(Intent intent){
        if(intent!=null && "com.lucianotoscano.pokesearchoverlay.OPEN_SHINY_LOGIN".equals(intent.getAction()))
            getWindow().getDecorView().post(this::openLoginDialog);
    }
    private void serviceAction(String action){
        Intent intent=new Intent(this,OverlayService.class);
        intent.setAction(action);
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
            .replace("__SHINY__","false");
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
                loginAutoReturnQueued=true;
                getSharedPreferences("prefs",0).edit()
                    .putString("sessionStatus","autenticada").apply();
                refreshSessionSummary();
                BugReport.log(MainActivity.this,"LOGIN","Sessão confirmada; retornando ao aplicativo");
                CookieManager.getInstance().flush();
                // A confirmed session closes the WebView even when the switch
                // still needs to be enabled by the background collector.
                view.post(()->{
                    if(view==website&&loginDialog!=null&&loginDialog.isShowing())
                        loginDialog.dismiss();
                });
            }else{
                // Check actual session before opening Login. This also handles
                // already-signed-in users with a hidden mobile Logout button.
                if(attemptsLeft<=13&&!loginDiscoveryStarted&&!loginLinkAttempted){
                    loginDiscoveryStarted=true;
                    openOfficialLoginControl(view,8);
                }
                // Logins completed by an in-page modal can take longer than the
                // first hydration window and may not navigate the WebView.
                // Keep one bounded-frequency probe until dialog is dismissed.
                final int next=Math.max(1,attemptsLeft-1);
                view.postDelayed(()->checkLoginSession(view,next,pageGeneration),
                    attemptsLeft>1?400L:850L);
            }
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
            .replace("__SHINY__",loginStartedForShiny?"true":"false");
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
    private void openLoginDialog(){openLoginDialog(true);}
    private void openLoginDialog(boolean shinyRequest){
        if(loginDialog!=null&&loginDialog.isShowing())return;
        loginStartedForShiny=shinyRequest;
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
                boolean site=host!=null&&(host.equalsIgnoreCase("pogocoordinates.com")||
                    host.toLowerCase(Locale.ROOT).endsWith(".pogocoordinates.com"));
                if(loginCover!=null)loginCover.setVisibility(site?View.VISIBLE:View.GONE);
            }
            @Override public void onPageFinished(WebView view,String url){
                if(url==null||view!=website)return;
                String host=Uri.parse(url).getHost();
                if(host==null||!(host.equalsIgnoreCase("pogocoordinates.com")||
                     host.toLowerCase(Locale.ROOT).endsWith(".pogocoordinates.com")))return;
                // First verify session. Only a logged-out user should be sent
                // through the official Login control.
                int generation=loginPageGeneration;
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
        loginName.setText("PoGoCoordinates · Login");
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
            ++loginPageGeneration; // Invalidate pending WebView session probes.
            loginCover=null;
            loginWaitLabel=null;
            loginFallback=null;
            if(website!=null){website.stopLoading();website.destroy();website=null;}
            loginDialog=null;
            serviceAction("com.lucianotoscano.pokesearchoverlay.LOGIN_END");
            notifyOverlaySessionReady();
            refreshSessionSummary();
            // Return to PokeSearch Home, not a permanent standalone site screen.
        });
        serviceAction("com.lucianotoscano.pokesearchoverlay.LOGIN_BEGIN");
        loginDialog.show();
        android.view.Window loginWindow=loginDialog.getWindow();
        if(loginWindow!=null){
            loginWindow.setBackgroundDrawableResource(android.R.color.transparent);
            loginWindow.setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
            loginWindow.setLayout(android.view.WindowManager.LayoutParams.MATCH_PARENT,
                android.view.WindowManager.LayoutParams.MATCH_PARENT);
            loginWindow.clearFlags(android.view.WindowManager.LayoutParams.FLAG_ALT_FOCUSABLE_IM);
        }
        website.requestFocus();
        website.loadUrl("https://pogocoordinates.com/search");
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
            "Alertar com som ao encontrar favorito",true);
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
    private void startOverlay(){
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
    @Override protected void onActivityResult(int req,int result,Intent data){
        super.onActivityResult(req,result,data);
        if(req==101&&Settings.canDrawOverlays(this))startOverlay();
        if(req==301 && result==RESULT_OK && data!=null && data.getData()!=null){
            try(java.io.OutputStream out=getContentResolver().openOutputStream(data.getData())){
                if(out==null)throw new java.io.IOException("Documento indisponível");
                out.write(pendingReportText.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                Toast.makeText(this,"Relatório TXT salvo",Toast.LENGTH_LONG).show();
            }catch(Exception e){Toast.makeText(this,"Não foi possível salvar o relatório",Toast.LENGTH_LONG).show();}
            pendingReportText="";
        }
    }
    @Override public void onRequestPermissionsResult(int requestCode,String[] permissions,int[] results){
        super.onRequestPermissionsResult(requestCode,permissions,results);
        if(requestCode==202)startOverlay();
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
        if(website!=null&&website.canGoBack())website.goBack();else super.onBackPressed();
    }
    @Override protected void onDestroy(){
        if(loginDialog!=null){loginDialog.setOnDismissListener(null);loginDialog.dismiss();loginDialog=null;}
        if(website!=null){website.stopLoading();website.destroy();website=null;}
        super.onDestroy();
    }
}

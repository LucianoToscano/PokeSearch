package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.os.Bundle;
import android.os.Build;
import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import android.graphics.Color;
import android.webkit.CookieManager;
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
import android.widget.TextView;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.view.Gravity;
import android.graphics.Typeface;

public class MainActivity extends Activity {
    private WebView website;
    private TextView watchSummary;
    private AlertDialog loginDialog;
    private boolean loginSessionNotified=false;
    private String pendingReportText="";
    @Override public void onCreate(Bundle b){
        super.onCreate(b);
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
        // Home independente: a interface do site não faz parte da tela principal.
        TextView hint=new TextView(this);
        hint.setText("IV100  ·  GL#1  ·  UL#1\nToque em Ativar overlay para começar.");
        hint.setTextColor(Color.rgb(155,165,181));
        hint.setTextSize(12);
        hint.setGravity(Gravity.CENTER);
        root.addView(hint,new LinearLayout.LayoutParams(-1,0,1));
        setContentView(root);
        handleShinyLoginIntent(getIntent());
        if("com.lucianotoscano.pokesearchoverlay.EDIT_WATCH_LIST".equals(getIntent().getAction()))
            root.post(this::openPicker);
        if("com.lucianotoscano.pokesearchoverlay.OPEN_SETTINGS".equals(getIntent().getAction()))
            root.post(this::showPreferencesDialog);
        if("com.lucianotoscano.pokesearchoverlay.OPEN_PIX".equals(getIntent().getAction()))
            root.post(()->PixSupport.show(this));
        if("com.lucianotoscano.pokesearchoverlay.OPEN_REPORT".equals(getIntent().getAction()))
            root.post(this::showBugReportDialog);
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
    }
    private void handleShinyLoginIntent(Intent intent){
        if(intent!=null && "com.lucianotoscano.pokesearchoverlay.OPEN_SHINY_LOGIN".equals(intent.getAction()))
            getWindow().getDecorView().post(this::openLoginDialog);
    }
    private void serviceAction(String action){
        Intent intent=new Intent(this,OverlayService.class);
        intent.setAction(action);
        if(Build.VERSION.SDK_INT>=26)startForegroundService(intent);else startService(intent);
    }
    private void notifyOverlaySessionReady(){
        CookieManager.getInstance().flush();
        Intent intent=new Intent(this,OverlayService.class);
        intent.setAction("com.lucianotoscano.pokesearchoverlay.REFRESH_LOGIN");
        if(Build.VERSION.SDK_INT>=26)startForegroundService(intent);else startService(intent);
    }
    private void openLoginDialog(){
        if(loginDialog!=null&&loginDialog.isShowing())return;
        loginSessionNotified=false;
        website=new WebView(this);
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
            @Override public void onPageFinished(WebView view,String url){
                if(url==null || !"pogocoordinates.com".equalsIgnoreCase(Uri.parse(url).getHost()))return;
                // Trigger the native site's Shiny linking prompt when requested.
                // The user enters their 12-digit trainer friend code on the real page.
                view.evaluateJavascript(readAsset("shiny_login.js"),null);
                // OAuth may complete without dismissing the dialog. A successful
                // return to the site refreshes the collector in-place.
                view.evaluateJavascript("(function(){return Array.from(document.querySelectorAll('a,button')).some(e=>/^(log\\s*out|sign\\s*out|sair|desconectar)$/i.test((e.innerText||e.textContent||'').trim()))})()",
                    value->{
                        if("true".equals(value)&&!loginSessionNotified){
                            loginSessionNotified=true;
                            BugReport.log(MainActivity.this,"LOGIN","Login identificado; aguardando vinculação");
                        }
                    });
            }
        });
        android.widget.FrameLayout holder=new android.widget.FrameLayout(this);
        holder.addView(website,new android.widget.FrameLayout.LayoutParams(-1,d(450)));
        loginDialog=new AlertDialog.Builder(this)
            .setTitle("Login • PoGoCoordinates")
            .setMessage("Entre com sua conta. Ao concluir, a busca do overlay será atualizada sem precisar fechá-lo.")
            .setView(holder)
            .setNegativeButton("Cancelar",null)
            .setPositiveButton("Voltar ao overlay",(d,which)->
                getWindow().getDecorView().postDelayed(()->moveTaskToBack(true),200L))
            .create();
        loginDialog.setOnDismissListener(d->{
            if(website!=null){website.stopLoading();website.destroy();website=null;}
            loginDialog=null;
            // Restore overlay first; then reload authenticated collector once.
            serviceAction("com.lucianotoscano.pokesearchoverlay.LOGIN_END");
            notifyOverlaySessionReady();
        });
        serviceAction("com.lucianotoscano.pokesearchoverlay.LOGIN_BEGIN");
        loginDialog.show();
        android.view.Window loginWindow=loginDialog.getWindow();
        if(loginWindow!=null){
            loginWindow.setSoftInputMode(android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE|
                android.view.WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_HIDDEN);
            loginWindow.clearFlags(android.view.WindowManager.LayoutParams.FLAG_ALT_FOCUSABLE_IM);
            loginWindow.setLayout(android.view.WindowManager.LayoutParams.MATCH_PARENT,
                Math.min(getResources().getDisplayMetrics().heightPixels-d(88),d(680)));
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
            .setMessage("O relatório reúne diagnóstico técnico sem senhas, cookies ou códigos de amizade. Confira antes de compartilhar.")
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
    private void showPreferencesDialog(){
        ScrollView view=buildPreferences();
        new AlertDialog.Builder(this)
            .setTitle("⚙ Preferências")
            .setView(view)
            .setPositiveButton("Concluído",null)
            .show();
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
            }
            @Override public void onNothingSelected(android.widget.AdapterView<?> p){}
        });
        body.addView(order);
        settingCheckbox(body,prefs,"showTimers","Mostrar tempo individual de despawn",false);
        return sc;
    }
    private void settingCheckbox(LinearLayout root,SharedPreferences prefs,String key,String label,boolean def){
        CheckBox check=new CheckBox(this);check.setText(label);check.setTextColor(Color.WHITE);
        check.setChecked(prefs.getBoolean(key,def));
        check.setOnCheckedChangeListener((button,enabled)->prefs.edit().putBoolean(key,enabled).apply());
        root.addView(check);
    }
    private String readAsset(String path){
        try(InputStream in=getAssets().open(path)){
            ByteArrayOutputStream out=new ByteArrayOutputStream();
            byte[] b=new byte[4096];int n;
            while((n=in.read(b))!=-1)out.write(b,0,n);
            return out.toString("UTF-8");
        }catch(Exception e){return "void 0";}
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

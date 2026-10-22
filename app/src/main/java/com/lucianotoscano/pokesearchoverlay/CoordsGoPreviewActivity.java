package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.TextView;
import java.util.Locale;

/**
 * Isolated, opt-in CoordsGo website preview. The partner explicitly authorized
 * embedding its site. No scraper, JS bridge, GPS, API or overlay collector yet.
 */
public final class CoordsGoPreviewActivity extends Activity {
    private static final String COORDSGO_URL="https://coordsgo.com/";
    private WebView preview;
    private TextView status;
    private boolean destroyed=false;

    private int dp(int amount){
        return (int)(amount*getResources().getDisplayMetrics().density+0.5f);
    }

    private static boolean allowedSite(Uri uri){
        if(uri==null||!"https".equalsIgnoreCase(uri.getScheme()))return false;
        final String host=uri.getHost();
        return host!=null&&("coordsgo.com".equalsIgnoreCase(host)||
            "www.coordsgo.com".equalsIgnoreCase(host));
    }

    private GradientDrawable tile(int background,int outline){
        GradientDrawable drawable=new GradientDrawable();
        drawable.setColor(background);
        drawable.setCornerRadius(dp(9));
        drawable.setStroke(dp(1),outline);
        return drawable;
    }

    private TextView action(String title,String description,boolean light){
        TextView button=new TextView(this);
        button.setText(title);
        button.setTextSize(19);
        button.setGravity(Gravity.CENTER);
        button.setContentDescription(description);
        button.setTextColor(light?Color.rgb(28,50,68):Color.WHITE);
        button.setBackground(tile(light?Color.argb(238,250,252,254):
                Color.argb(205,25,43,62),
            light?Color.argb(110,55,80,100):Color.argb(130,160,188,211)));
        button.setClickable(true);
        button.setFocusable(true);
        return button;
    }

    @Override public void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        final boolean light=getSharedPreferences("prefs",0).getBoolean("homeLightMode",false);
        final int text=light?Color.rgb(22,43,61):Color.WHITE;
        final int subtext=light?Color.rgb(74,99,118):Color.rgb(170,197,221);
        final LinearLayout root=new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(light?Color.rgb(239,245,249):Color.rgb(10,18,31));
        setContentView(root);
        getWindow().setStatusBarColor(light?Color.rgb(236,242,247):Color.rgb(12,33,67));
        getWindow().setNavigationBarColor(light?Color.rgb(236,242,247):Color.rgb(9,20,37));

        LinearLayout top=new LinearLayout(this);
        top.setGravity(Gravity.CENTER_VERTICAL);
        top.setPadding(dp(10),dp(8),dp(10),dp(8));
        top.setOrientation(LinearLayout.HORIZONTAL);
        root.addView(top,new LinearLayout.LayoutParams(-1,dp(58)));

        TextView close=action("‹","Voltar ao PokeSearch",light);
        top.addView(close,new LinearLayout.LayoutParams(dp(39),dp(39)));
        close.setOnClickListener(v->finish());

        LinearLayout headings=new LinearLayout(this);
        headings.setPadding(dp(10),0,dp(4),0);
        headings.setOrientation(LinearLayout.VERTICAL);
        top.addView(headings,new LinearLayout.LayoutParams(0,-2,1));
        TextView label=new TextView(this);
        label.setText("Missões · CoordsGo");
        label.setTextSize(16);
        label.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        label.setTextColor(text);
        headings.addView(label);
        TextView subtitle=new TextView(this);
        subtitle.setText("Prévia autorizada dentro do PokeSearch");
        subtitle.setTextSize(10);
        subtitle.setTextColor(subtext);
        headings.addView(subtitle);

        TextView reload=action("↻","Recarregar CoordsGo",light);
        top.addView(reload,new LinearLayout.LayoutParams(dp(39),dp(39)));

        View divider=new View(this);
        divider.setBackgroundColor(light?Color.argb(65,30,49,67):Color.argb(80,167,193,222));
        root.addView(divider,new LinearLayout.LayoutParams(-1,dp(1)));

        status=new TextView(this);
        status.setTextColor(subtext);
        status.setTextSize(11);
        status.setPadding(dp(13),dp(8),dp(12),dp(8));
        status.setText("Abrindo CoordsGo…");
        root.addView(status,new LinearLayout.LayoutParams(-1,-2));

        preview=new WebView(this);
        preview.setBackgroundColor(light?Color.WHITE:Color.rgb(12,20,33));
        root.addView(preview,new LinearLayout.LayoutParams(-1,0,1));
        WebSettings settings=preview.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setGeolocationEnabled(false);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(preview,false);
        preview.setWebChromeClient(new WebChromeClient(){
            @Override public void onProgressChanged(WebView view,int progress){
                if(!destroyed&&status!=null&&progress<100)
                    status.setText("Carregando CoordsGo… "+progress+"%");
            }
        });
        preview.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){
                if(!request.isForMainFrame())return false;
                Uri url=request.getUrl();
                if(allowedSite(url))return false;
                // External HTTPS map links open in the system browser, not the
                // PokeSearch collector or the untrusted preview WebView.
                if(url!=null&&"https".equalsIgnoreCase(url.getScheme())){
                    try{
                        Intent external=new Intent(Intent.ACTION_VIEW,url);
                        external.addCategory(Intent.CATEGORY_BROWSABLE);
                        startActivity(external);
                    }catch(Exception ignored){
                        if(status!=null)status.setText("Link externo indisponível");
                    }
                }
                return true;
            }
            @Override public void onPageFinished(WebView view,String url){
                if(destroyed||view!=preview)return;
                if(!allowedSite(Uri.parse(url))){
                    status.setText("Navegação fora do CoordsGo bloqueada");
                    return;
                }
                // Tiny read-only DOM probe to confirm JS execution, never
                // changes site filters or shares the PoGoCoordinates session.
                view.evaluateJavascript(
                    "(function(){return !!document.body&&document.readyState!=='loading';})()",
                    value->{
                        if(!destroyed&&view==preview&&status!=null)
                            status.setText("true".equals(value)?
                                "CoordsGo aberto · selecione uma missão no site":
                                "Aguardando conteúdo do CoordsGo");
                    });
            }
            @Override public void onReceivedError(WebView view,WebResourceRequest request,WebResourceError error){
                if(request.isForMainFrame()&&!destroyed&&status!=null)
                    status.setText("Não foi possível carregar o CoordsGo · toque em ↻");
            }
        });
        reload.setOnClickListener(v->{
            status.setText("Atualizando CoordsGo…");
            if(preview!=null)preview.reload();
        });
        preview.loadUrl(COORDSGO_URL);
    }

    @Override public void onBackPressed(){
        if(preview!=null&&preview.canGoBack())preview.goBack();
        else super.onBackPressed();
    }

    @Override protected void onDestroy(){
        destroyed=true;
        WebView web=preview;
        preview=null;
        if(web!=null){
            web.stopLoading();
            web.setWebViewClient(new WebViewClient());
            web.setWebChromeClient(null);
            if(web.getParent() instanceof android.view.ViewGroup)
                ((android.view.ViewGroup)web.getParent()).removeView(web);
            web.destroy();
        }
        status=null;
        super.onDestroy();
    }
}

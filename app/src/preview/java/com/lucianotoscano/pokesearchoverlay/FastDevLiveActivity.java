package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Spinner;
import android.widget.ArrayAdapter;
import android.widget.TextView;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import javax.net.ssl.HttpsURLConnection;

/**
 * A dedicated visual sandbox: refreshes real HTML assets from the repository
 * without APK installation. It does not replace production service overlays or
 * grant Native Android bridges to remote HTML.
 */
public final class FastDevLiveActivity extends Activity {
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private final Handler main=new Handler(Looper.getMainLooper());
    private static final String RAW=
        "https://raw.githubusercontent.com/LucianoToscano/PokeSearch/";
    private static final String[] PAGES={"dock.html","overlay.html","detail.html"};
    private EditText branch;
    private Spinner page;
    private TextView status;
    private WebView view;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);
        int pad=(int)(8*getResources().getDisplayMetrics().density);
        root.setPadding(pad,pad,pad,pad);
        TextView title=new TextView(this);
        title.setText("FastDev Live — somente visual"); title.setTextSize(17);
        root.addView(title);
        LinearLayout bar=new LinearLayout(this);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        branch=new EditText(this);branch.setSingleLine(true);branch.setText("main");
        branch.setHint("Branch (ex: main)");
        bar.addView(branch,new LinearLayout.LayoutParams(0,
            LinearLayout.LayoutParams.WRAP_CONTENT,1));
        page=new Spinner(this);
        page.setAdapter(new ArrayAdapter<>(this,android.R.layout.simple_spinner_dropdown_item,PAGES));
        bar.addView(page);
        root.addView(bar);
        Button refresh=new Button(this);refresh.setText("Recarregar HTML atualizado");
        root.addView(refresh);
        status=new TextView(this);
        status.setText("Esta visualização não controla o overlay real. Gestos nativos exigem APK.");
        root.addView(status);
        view=new WebView(this);
        view.setBackgroundColor(0xff22222a);
        view.getSettings().setJavaScriptEnabled(true);
        view.getSettings().setAllowFileAccess(false);
        view.getSettings().setAllowContentAccess(false);
        view.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView v,
                android.webkit.WebResourceRequest request) {
                // No arbitrary navigation away from the preview.
                return !request.getUrl().toString().startsWith(RAW);
            }
        });
        root.addView(view,new LinearLayout.LayoutParams(-1,0,1));
        setContentView(root);
        refresh.setOnClickListener(v->refresh());
        refresh();
    }
    private void refresh() {
        final String ref=branch.getText().toString().trim();
        final String file=PAGES[page.getSelectedItemPosition()];
        // Never let an editable ref insert query, redirect, .. or host changes.
        if(ref.length()<1||ref.length()>100||
            !ref.matches("[A-Za-z0-9_-]+(?:/[A-Za-z0-9_.-]+)*")||
            ref.contains("..")) {
            status.setText("Branch inválida");return;
        }
        status.setText("Buscando "+file+" em "+ref+"...");
        io.execute(()->{
            try {
                String base=RAW+ref+"/app/src/main/assets/";
                URL url=new URL(base+file);
                HttpsURLConnection connection=(HttpsURLConnection)url.openConnection();
                connection.setInstanceFollowRedirects(false);
                connection.setConnectTimeout(9000);connection.setReadTimeout(15000);
                connection.setRequestProperty("Cache-Control","no-cache");
                String html;
                try{
                    if(connection.getResponseCode()!=200)
                        throw new IllegalStateException("HTTP "+connection.getResponseCode());
                    try(InputStream in=connection.getInputStream();
                        ByteArrayOutputStream out=new ByteArrayOutputStream()){
                        byte[] buf=new byte[8192];int n;
                        while((n=in.read(buf))!=-1){
                            if(out.size()+n>1_500_000)
                                throw new IllegalStateException("HTML muito grande");
                            out.write(buf,0,n);
                        }
                        html=out.toString(StandardCharsets.UTF_8.name());
                    }
                }finally{connection.disconnect();}
                // No Java bridge is exposed. Simulate no-op native hooks for layout.
                String stub="<script>window.Native=new Proxy({}, {get:()=>()=>undefined});</script>";
                if(html.contains("<head>")) html=html.replaceFirst("<head>","<head>"+stub);
                final String content=html;
                main.post(()->{
                    if(isFinishing()||isDestroyed())return;
                    view.loadDataWithBaseURL(base,content,"text/html","UTF-8",null);
                    status.setText("Prévia "+file+" da branch "+ref+
                        " atualizada. Reabra para comparar alterações.");
                });
            }catch(Exception error){
                main.post(()->{
                    if(!isFinishing()&&!isDestroyed())status.setText("Erro: "+error.getMessage());
                });
            }
        });
    }
    @Override protected void onDestroy(){
        io.shutdownNow();
        view.destroy();
        super.onDestroy();
    }
}

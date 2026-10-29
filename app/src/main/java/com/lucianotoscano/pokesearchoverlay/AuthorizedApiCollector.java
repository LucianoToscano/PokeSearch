package com.lucianotoscano.pokesearchoverlay;

import android.content.res.AssetManager;
import android.net.Uri;
import android.os.Handler;
import android.webkit.WebView;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;

/** LT77 optional QA bridge. All credentials and reveal codes stay on the site origin.
 * Only bounded, sanitized JSON returned by api_android_session.js reaches Java.
 * NEVER add a JavascriptInterface to the remote website.
 */
final class AuthorizedApiCollector {
    interface Callback { void onResult(JSONObject result); }
    private final WebView site;
    private final AssetManager assets;
    private final Handler handler;
    private int ticket=0;
    private boolean disposed=false;
    private String bundle;
    AuthorizedApiCollector(WebView site,AssetManager assets,Handler handler) {
        this.site=site;this.assets=assets;this.handler=handler;
    }
    private JSONObject failure(String reason) {
        JSONObject result=new JSONObject();
        try{result.put("ok",false).put("reason",reason);}
        catch(org.json.JSONException ignored){}
        return result;
    }
    private boolean official() {
        if(disposed||site==null)return false;
        try {
            Uri uri=Uri.parse(site.getUrl());
            return "https".equalsIgnoreCase(uri.getScheme())&&
                "pogocoordinates.com".equalsIgnoreCase(uri.getHost())&&
                (uri.getPort()==-1||uri.getPort()==443);
        }catch(Exception ignored){return false;}
    }
    private void js(String code,Callback cb) {
        if(!official()){cb.onResult(failure("invalid-origin"));return;}
        try{
            final String startedUrl=site.getUrl();
            site.evaluateJavascript(code,raw->{
                if(!official()||!startedUrl.equals(site.getUrl())){
                    cb.onResult(failure("page-changed"));return;
                }
                try{
                    String value=new JSONArray("["+raw+"]").getString(0);
                    cb.onResult(new JSONObject(value));
                }catch(Exception ignored){
                    cb.onResult(failure("invalid-browser-response"));
                }
            });
        }catch(Exception ignored){cb.onResult(failure("browser-unavailable"));}
    }
    private String loadScripts() {
        if(bundle!=null)return bundle;
        StringBuilder content=new StringBuilder();
        String[] files={"api_result_contract.js","api_reveal_contract.js",
            "coords_quota.js","api_browser_transport.js","api_catalog_cache.js","api_android_session.js"};
        try {
            for(String name:files){
                try(InputStream in=assets.open(name)){
                    ByteArrayOutputStream out=new ByteArrayOutputStream();
                    byte[] bytes=new byte[4096];int size;
                    while((size=in.read(bytes))!=-1)out.write(bytes,0,size);
                    content.append(out.toString("UTF-8")).append(";\n");
                }
            }
            bundle=content.toString();return bundle;
        }catch(Exception ignored){return "";}
    }
    private void bootstrap(Callback cb) {
        String modules=loadScripts();
        if(modules.isEmpty()){cb.onResult(failure("api-assets-unavailable"));return;}
        String code="(function(){if(location.origin!=='https://pogocoordinates.com')"+
            "return JSON.stringify({ok:false,reason:'invalid-origin'});"+
            "if(!window.PokeSearchAndroidApi){"+modules+
            "window.PokeSearchAndroidApi=window.PokeSearchAndroidApiFactory.createBrowserSession();}"+
            "return JSON.stringify({ok:!!window.PokeSearchAndroidApi,reason:'api-bootstrap'});})()";
        js(code,cb);
    }
    private void poll(int request,int attempt,int max,Callback cb){
        if(disposed){cb.onResult(failure("disposed"));return;}
        if(attempt>=max){cb.onResult(failure("timeout"));return;}
        handler.postDelayed(()->js("(function(){return JSON.stringify("+
            "window.PokeSearchAndroidApi?window.PokeSearchAndroidApi.take("+
            request+"):{ok:false,reason:'session-lost'});})()",response->{
            if(response.optBoolean("pending",false))poll(request,attempt+1,max,cb);
            else cb.onResult(response);
        }),350L);
    }
    void suggest(String query,Callback cb){
        if(!official()){cb.onResult(failure("invalid-origin"));return;}
        if(query==null||query.length()>65){cb.onResult(failure("invalid-request"));return;}
        bootstrap(ready->{
            if(!ready.optBoolean("ok",false)){cb.onResult(ready);return;}
            int request=++ticket;
            js("(function(){return JSON.stringify("+
                "window.PokeSearchAndroidApi.startSuggestions("+request+","+
                JSONObject.quote(query)+"));})()",started->{
                if(!started.optBoolean("ok",false)){cb.onResult(started);return;}
                poll(request,0,45,cb);
            });
        });
    }
    // Read-only official forms; never moves JWT or reveal codes into Java.
    void forms(String query,Callback cb){
        if(!official()){cb.onResult(failure("invalid-origin"));return;}
        if(query==null||query.length()>70){cb.onResult(failure("invalid-request"));return;}
        bootstrap(ready->{
            if(!ready.optBoolean("ok",false)){cb.onResult(ready);return;}
            int request=++ticket;
            js("(function(){return JSON.stringify("+
                "window.PokeSearchAndroidApi.startForms("+request+","+
                JSONObject.quote(query)+"));})()",started->{
                if(!started.optBoolean("ok",false)){cb.onResult(started);return;}
                poll(request,0,45,cb);
            });
        });
    }
    void search(JSONObject filters,Callback cb){
        if(!official()){cb.onResult(failure("invalid-origin"));return;}
        bootstrap(ready->{
            if(!ready.optBoolean("ok",false)){cb.onResult(ready);return;}
            int request=++ticket;
            js("(function(){return JSON.stringify("+
                "window.PokeSearchAndroidApi.startSearch("+request+","+
                filters.toString()+"));})()",started->{
                if(!started.optBoolean("ok",false)){cb.onResult(started);return;}
                poll(request,0,65,cb);
            });
        });
    }
    // Provider session check on the same authenticated WebView only.
    // Never transfer an email address, account ID, JWT or raw profile to Java.
    void accountStatus(Callback cb){
        if(!official()){cb.onResult(failure("invalid-origin"));return;}
        bootstrap(ready->{
            if(!ready.optBoolean("ok",false)){cb.onResult(ready);return;}
            int request=++ticket;
            js("(function(){return JSON.stringify("+
                "window.PokeSearchAndroidApi.startAccountStatus("+request+"));})()",started->{
                if(!started.optBoolean("ok",false)){cb.onResult(started);return;}
                poll(request,0,26,cb);
            });
        });
    }
    void reveal(JSONObject selection,Callback cb){
        if(!official()){cb.onResult(failure("invalid-origin"));return;}
        int request=++ticket;
        js("(function(){return JSON.stringify("+
            "window.PokeSearchAndroidApi?window.PokeSearchAndroidApi.startReveal("+
            request+","+selection.toString()+
            "):{ok:false,reason:'session-lost'});})()",started->{
            if(!started.optBoolean("ok",false)){cb.onResult(started);return;}
            poll(request,0,22,cb);
        });
    }
    void dispose(){
        if(disposed)return;
        if(official()){
            try{site.evaluateJavascript(
                "if(window.PokeSearchAndroidApi)window.PokeSearchAndroidApi.dispose()",null);}
            catch(Exception ignored){}
        }
        disposed=true;
    }
}

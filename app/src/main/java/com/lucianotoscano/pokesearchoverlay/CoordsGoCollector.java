package com.lucianotoscano.pokesearchoverlay;
import android.content.Context;
import android.graphics.Color;
import android.net.Uri;
import android.os.Handler;
import android.view.Gravity;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceError;
import android.webkit.WebSettings;
import android.widget.FrameLayout;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.util.function.Consumer;

/** Independent WebView; no GPS, API, backend or native JS bridge on CoordsGo. */
final class CoordsGoCollector {
 private final Context context;
 private final FrameLayout root;
 private final Handler handler;
 private final Consumer<JSONObject> callback;
 private WebView web;
 private String probe=null;
 private static final int MAX_JSON_CHARS=110_000;
 private boolean loaded=false,destroyed=false;
 private int generation=0;
 private static final String URL="https://coordsgo.com/";
 CoordsGoCollector(Context c,FrameLayout r,Handler h,Consumer<JSONObject> cb){
  context=c;root=r;handler=h;callback=cb;
 }
 private boolean allowed(String url){
  if(url==null)return false;
  try{
   Uri u=Uri.parse(url);String host=u.getHost();
   return "https".equalsIgnoreCase(u.getScheme())&&host!=null&&
    ("coordsgo.com".equalsIgnoreCase(host)||"www.coordsgo.com".equalsIgnoreCase(host));
  }catch(Exception e){return false;}
 }
 private JSONObject info(boolean ok,String status){
  JSONObject j=new JSONObject();
  try{j.put("ok",ok);j.put("status",status);j.put("cards",new JSONArray());}
  catch(Exception ignored){}return j;
 }
 private void send(JSONObject j){if(!destroyed)callback.accept(j);}
 private void create(){
  web=new WebView(context);
  web.setBackgroundColor(Color.TRANSPARENT);web.setAlpha(0);
  web.setFocusable(false);web.setClickable(false);web.setEnabled(false);
  web.setImportantForAccessibility(android.view.View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS);
  WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);
  s.setGeolocationEnabled(false);s.setAllowFileAccess(false);s.setAllowContentAccess(false);
  s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  s.setSupportMultipleWindows(false);s.setJavaScriptCanOpenWindowsAutomatically(false);
  web.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest request){
    return request.isForMainFrame()&&!allowed(request.getUrl().toString());
   }
   @Override public void onPageStarted(WebView v,String url,android.graphics.Bitmap bmp){
    loaded=false;generation++;
   }
   @Override public void onPageFinished(WebView v,String url){
    if(destroyed||v!=web||!allowed(url))return;
    loaded=true;final int gen=generation;
    handler.postDelayed(()->{if(!destroyed&&gen==generation)run("collect","",0);},1250L);
   }
   @Override public void onReceivedError(WebView v,WebResourceRequest r,WebResourceError e){
    if(r.isForMainFrame()){loaded=false;send(info(false,"Falha de rede CoordsGo"));}
   }
  });
  float density=context.getResources().getDisplayMetrics().density;
  FrameLayout.LayoutParams lp=new FrameLayout.LayoutParams((int)(390*density),(int)(690*density),Gravity.TOP|Gravity.LEFT);
  root.addView(web,0,lp); // BEHIND gear and other interactive overlay views.
  send(info(false,"Carregando o CoordsGo…"));web.loadUrl(URL);
 }
 void refresh(){if(destroyed)return;if(web==null)create();else if(loaded)run("collect","",0);
  else send(info(false,"Aguardando carregamento…"));}
 void setCity(String name){if(!destroyed&&loaded)run("city",name==null?"":name,0);}
 void selectReward(int index){if(!destroyed&&loaded&&index>=0&&index<=250)run("select","",index);}
 private String source(){
  if(probe!=null)return probe;
  try(InputStream in=context.getAssets().open("coordsgo_probe.js")){
   ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] b=new byte[4096];int n;
   while((n=in.read(b))!=-1)out.write(b,0,n);
   return probe=out.toString("UTF-8");
  }catch(Exception e){send(info(false,"Script do CoordsGo indisponível"));return "";}
 }
 private void run(String action,String text,int index){
  if(destroyed||web==null||!loaded||!allowed(web.getUrl()))return;
  String script=source();if(script.isEmpty())return;
  final WebView current=web;final int gen=generation;
  script=script.replace("__ACTION__",JSONObject.quote(action))
   .replace("__VALUE__",JSONObject.quote(text)).replace("__INDEX__",Integer.toString(index));
  current.evaluateJavascript(script,raw->{
   if(destroyed||current!=web||gen!=generation)return;
   try{
    String response=new JSONArray("["+raw+"]").getString(0);
    if(response.length()>MAX_JSON_CHARS){send(info(false,"Resposta CoordsGo excedeu o limite"));return;}
    JSONObject d=new JSONObject(response);send(d);
    if(!"collect".equals(action))handler.postDelayed(
     ()->{if(!destroyed&&gen==generation)run("collect","",0);},850L);
   }catch(Exception e){send(info(false,"Erro de leitura do CoordsGo"));}
  });
 }
 void destroy(){
  destroyed=true;loaded=false;generation++;
  WebView v=web;web=null;if(v==null)return;
  v.stopLoading();v.setWebViewClient(new WebViewClient());
  if(v.getParent() instanceof android.view.ViewGroup)
   ((android.view.ViewGroup)v.getParent()).removeView(v);
  v.destroy();
 }
}

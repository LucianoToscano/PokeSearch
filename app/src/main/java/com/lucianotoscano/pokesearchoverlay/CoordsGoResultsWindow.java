package com.lucianotoscano.pokesearchoverlay;

import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Independent, touch-isolated results window for the CoordsGo site. */
final class CoordsGoResultsWindow {
 private final Context context;
 private final WindowManager wm;
 private final Handler handler=new Handler(Looper.getMainLooper());
 private final ExecutorService thumbnails=Executors.newSingleThreadExecutor();
 private final HashMap<Integer,Bitmap> cached=new HashMap<>();
 private final Runnable refresh;
 private FrameLayout container;
 private LinearLayout content;
 private ScrollView scrolling;
 private TextView subtitle;
 private WindowManager.LayoutParams params;
 private boolean attached=false,destroyed=false;
 private int generation=0;
 private JSONObject latest=new JSONObject();
 private String query="";
 private boolean shiny=false,event=false;
 private int dp(int n){return (int)(n*context.getResources().getDisplayMetrics().density+0.5f);}
 CoordsGoResultsWindow(Context ctx,Runnable refreshAction){
  context=ctx;refresh=refreshAction;
  wm=(WindowManager)ctx.getSystemService(Context.WINDOW_SERVICE);
 }
 private GradientDrawable bg(int color,int border,int radius){
  GradientDrawable d=new GradientDrawable();d.setColor(color);
  d.setCornerRadius(dp(radius));d.setStroke(dp(1),border);return d;
 }
 private TextView label(String s,int font,boolean strong){
  TextView v=new TextView(context);v.setText(s);v.setTextSize(font);
  v.setTextColor(Color.WHITE);
  if(strong)v.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
  return v;
 }
 private Button button(String s){
  Button b=new Button(context);b.setText(s);b.setTextSize(10);b.setAllCaps(false);
  b.setTextColor(Color.rgb(236,241,255));b.setMinHeight(0);b.setMinimumHeight(0);
  b.setPadding(dp(5),dp(1),dp(5),dp(1));
  b.setBackground(bg(Color.argb(210,37,48,68),Color.argb(95,181,194,216),6));
  return b;
 }
 private void ensure(){
  if(container!=null||destroyed)return;
  int width=dp(Math.min(256,Math.max(192,context.getResources().getDisplayMetrics().widthPixels/
   context.getResources().getDisplayMetrics().density>280?256:205)));
  container=new FrameLayout(context);
  container.setBackground(bg(Color.argb(241,10,23,39),Color.argb(140,160,192,220),10));
  LinearLayout entire=new LinearLayout(context);entire.setOrientation(LinearLayout.VERTICAL);
  entire.setPadding(dp(6),dp(5),dp(6),dp(7));
  container.addView(entire,new FrameLayout.LayoutParams(-1,-2));
  LinearLayout header=new LinearLayout(context);header.setGravity(Gravity.CENTER_VERTICAL);
  entire.addView(header,new LinearLayout.LayoutParams(-1,dp(33)));
  TextView drag=label("🎯 Missões  ⠿",13,true);drag.setGravity(Gravity.CENTER_VERTICAL);
  drag.setPadding(dp(5),0,dp(3),0);
  header.addView(drag,new LinearLayout.LayoutParams(0,-1,1));
  final float[] touch={0,0};
  final int[] start={0,0};
  drag.setOnTouchListener((v,e)->{
   if(params==null||!attached)return false;
   switch(e.getActionMasked()){
    case MotionEvent.ACTION_DOWN:
     touch[0]=e.getRawX();touch[1]=e.getRawY();start[0]=params.x;start[1]=params.y;return true;
    case MotionEvent.ACTION_MOVE:
     int screenW=context.getResources().getDisplayMetrics().widthPixels;
     int screenH=context.getResources().getDisplayMetrics().heightPixels;
     params.x=Math.max(0,Math.min(screenW-params.width,start[0]+(int)(e.getRawX()-touch[0])));
     params.y=Math.max(0,Math.min(screenH-dp(90),start[1]+(int)(e.getRawY()-touch[1])));
     wm.updateViewLayout(container,params);return true;
    case MotionEvent.ACTION_UP:return true;
   }return false;
  });
  Button reload=button("↻");header.addView(reload,new LinearLayout.LayoutParams(dp(31),dp(28)));
  reload.setOnClickListener(v->refresh.run());
  Button close=button("×");
  LinearLayout.LayoutParams closeLp=new LinearLayout.LayoutParams(dp(31),dp(28));closeLp.leftMargin=dp(4);
  header.addView(close,closeLp);close.setOnClickListener(v->hide());
  subtitle=label("Aguardando CoordsGo…",10,false);
  subtitle.setTextColor(Color.rgb(186,210,231));subtitle.setPadding(dp(3),dp(4),0,dp(5));
  entire.addView(subtitle,new LinearLayout.LayoutParams(-1,-2));
  scrolling=new ScrollView(context);
  scrolling.setFillViewport(false);scrolling.setVerticalScrollBarEnabled(false);
  entire.addView(scrolling,new LinearLayout.LayoutParams(-1,dp(170)));
  content=new LinearLayout(context);content.setOrientation(LinearLayout.VERTICAL);
  scrolling.addView(content,new ScrollView.LayoutParams(-1,-2));
  params=new WindowManager.LayoutParams(width,-2,
   WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
   WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
   PixelFormat.TRANSLUCENT);
  params.gravity=Gravity.TOP|Gravity.LEFT;
  int screen=context.getResources().getDisplayMetrics().widthPixels;
  params.x=Math.max(0,screen-width-dp(8));params.y=dp(150);
 }
 boolean isVisible(){return attached&&!destroyed;}
 void show(JSONObject data,String queryText,boolean shinyOnly,boolean eventOnly){
  if(destroyed)return;
  query=queryText==null?"":queryText.trim().toLowerCase(Locale.ROOT);
  if(query.length()>70)query=query.substring(0,70);
  shiny=shinyOnly;event=eventOnly;
  latest=data==null?new JSONObject():data;
  ensure();redraw();
  if(!attached){
   try{wm.addView(container,params);attached=true;}
   catch(Exception e){attached=false;}
  }
 }
 void onData(JSONObject data){if(destroyed)return;latest=data==null?new JSONObject():data;
  if(attached)redraw();}
 private static String validCoords(String input){
  String raw=input==null?"":input.trim();
  if(!raw.matches("-?\\d{1,2}(?:\\.\\d+)?,\\s*-?\\d{1,3}(?:\\.\\d+)?"))return "";
  String[] split=raw.split(",");
  try{
   double lat=Double.parseDouble(split[0].trim()),lon=Double.parseDouble(split[1].trim());
   if(!Double.isFinite(lat)||!Double.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return "";
   return split[0].trim()+","+split[1].trim();
  }catch(Exception e){return "";}
 }
 private void copy(String coords){
  ClipboardManager clipboard=(ClipboardManager)context.getSystemService(Context.CLIPBOARD_SERVICE);
  if(clipboard!=null)clipboard.setPrimaryClip(ClipData.newPlainText("Coordenadas PokéParada",coords));
 }
 private void openMaps(String coords){
  try{
   Intent intent=new Intent(Intent.ACTION_VIEW,Uri.parse("geo:0,0?q="+Uri.encode(coords)));
   intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
   context.startActivity(intent);
  }catch(Exception e){android.widget.Toast.makeText(context,
    "Nenhum aplicativo de mapas disponível",android.widget.Toast.LENGTH_SHORT).show();}
 }
 private void renderEmpty(String s){
  TextView v=label(s,11,false);v.setPadding(dp(8),dp(10),dp(8),dp(9));
  content.addView(v);
 }
 private void redraw(){
  if(destroyed||content==null)return;
  final int epoch=++generation;
  content.removeAllViews();
  JSONArray arr=latest.optJSONArray("cards");
  int siteCount=latest.optInt("missionCount",-1);
  String state=siteCount==0?"0 missões ativas · catálogo":
    siteCount>0?siteCount+" missões informadas · conferir local":"Missões sem confirmação · catálogo";
  subtitle.setText(state);
  if(arr==null||arr.length()==0){renderEmpty(latest.optString("status","Aguardando resultados do CoordsGo"));setHeight(1);return;}
  int n=0;
  for(int i=0;i<arr.length()&&n<10;i++){
   JSONObject item=arr.optJSONObject(i);if(item==null)continue;
   String name=item.optString("name",""),task=item.optString("task","");
   if(shiny&&!item.optBoolean("shiny",false))continue;
   if(event&&!item.optBoolean("event",false))continue;
   if(!query.isEmpty()&&!(name+" "+task+" "+item.optString("number",""))
       .toLowerCase(Locale.ROOT).contains(query))continue;
   renderCard(item,epoch);n++;
  }
  if(n==0)renderEmpty("Nenhuma recompensa corresponde aos filtros.");
  setHeight(n);
 }
 private void setHeight(int n){
  if(scrolling==null)return;
  int safe=Math.max(1,Math.min(10,n));
  scrolling.setLayoutParams(new LinearLayout.LayoutParams(-1,dp(Math.min(370,safe*88))));
  if(attached&&params!=null){
   try{wm.updateViewLayout(container,params);}catch(Exception ignored){}
  }
 }
 private void renderCard(JSONObject item,int epoch){
  LinearLayout card=new LinearLayout(context);card.setOrientation(LinearLayout.VERTICAL);
  card.setBackground(bg(Color.argb(210,29,44,63),Color.argb(86,168,198,222),7));
  LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-1,-2);cp.bottomMargin=dp(4);
  content.addView(card,cp);card.setPadding(dp(5),dp(4),dp(5),dp(5));
  LinearLayout heading=new LinearLayout(context);heading.setGravity(Gravity.CENTER_VERTICAL);
  card.addView(heading,new LinearLayout.LayoutParams(-1,-2));
  String name=item.optString("name","Recompensa"),number=item.optString("number","");
  int dex=-1;try{dex=Integer.parseInt(number);}catch(Exception ignored){}
  ImageView image=new ImageView(context);
  image.setScaleType(ImageView.ScaleType.FIT_CENTER);
  image.setImageResource(R.drawable.ic_notification);
  heading.addView(image,new LinearLayout.LayoutParams(dp(39),dp(39)));
  TextView title=label((!number.isEmpty()?"#"+number+" ":"")+name+
   (item.optBoolean("shiny",false)?" ✨":"")+(item.optBoolean("event",false)?" 🌄":""),11,true);
  title.setPadding(dp(4),0,0,0);
  heading.addView(title,new LinearLayout.LayoutParams(0,-2,1));
  if(dex>=1&&dex<=1025)loadSprite(dex,image,epoch);
  String task=item.optString("task","");
  if(!task.isEmpty()){TextView detail=label(task,10,false);detail.setPadding(0,dp(2),0,dp(2));
   card.addView(detail);}
  String low=item.optString("cpMin",""),high=item.optString("cpMax","");
  if(low.matches("\\d{1,5}")&&high.matches("\\d{1,5}"))card.addView(label("PC "+low+"–"+high,10,false));
  String coords=validCoords(item.optString("coords",""));
  LinearLayout buttons=new LinearLayout(context);card.addView(buttons,new LinearLayout.LayoutParams(-1,dp(29)));
  Button copy=button("⧉ Copiar"),map=button("⌖ Localizar");
  LinearLayout.LayoutParams a=new LinearLayout.LayoutParams(0,-1,1);
  LinearLayout.LayoutParams b=new LinearLayout.LayoutParams(0,-1,1);b.leftMargin=dp(4);
  buttons.addView(copy,a);buttons.addView(map,b);
  boolean verified=!coords.isEmpty();
  copy.setEnabled(verified);map.setEnabled(verified);
  if(!verified){copy.setAlpha(.38f);map.setAlpha(.38f);}
  copy.setOnClickListener(v->copy(coords));map.setOnClickListener(v->openMaps(coords));
 }
 private void loadSprite(int dex,ImageView iv,int epoch){
  Bitmap cachedImage=cached.get(dex);
  if(cachedImage!=null){iv.setImageBitmap(cachedImage);return;}
  final int id=dex;
  thumbnails.execute(()->{
   HttpURLConnection conn=null;
   try{
    URL url=new URL("https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/"+id+".png");
    conn=(HttpURLConnection)url.openConnection();
    conn.setConnectTimeout(4000);conn.setReadTimeout(4000);
    if(conn.getResponseCode()!=200||conn.getContentLengthLong()>220000)return;
    ByteArrayOutputStream bytes=new ByteArrayOutputStream();
    try(InputStream stream=conn.getInputStream()){
     byte[] buf=new byte[4096];int got;
     while((got=stream.read(buf))>0){if(bytes.size()+got>220000)return;bytes.write(buf,0,got);}
    }
    final Bitmap bitmap=BitmapFactory.decodeByteArray(bytes.toByteArray(),0,bytes.size());
    if(bitmap==null)return;
    handler.post(()->{
     if(destroyed)return;
     cached.put(id,bitmap);
     if(epoch==generation&&iv.getParent()!=null)iv.setImageBitmap(bitmap);
    });
   }catch(Exception ignored){}finally{if(conn!=null)conn.disconnect();}
  });
 }
 void hide(){
  if(!attached||container==null)return;
  try{wm.removeView(container);}catch(Exception ignored){}
  attached=false;generation++;
 }
 void destroy(){destroyed=true;hide();thumbnails.shutdownNow();cached.clear();container=null;}
}

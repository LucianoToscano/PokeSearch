package com.lucianotoscano.pokesearchoverlay;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.media.AudioAttributes;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.Point;
import android.graphics.drawable.GradientDrawable;
import android.hardware.HardwareBuffer;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.Display;
import android.view.Gravity;
import android.view.WindowManager;
import android.graphics.drawable.GradientDrawable;
import android.view.MotionEvent;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;
import java.io.File;
import android.view.accessibility.AccessibilityEvent;
import android.widget.Button;
import android.widget.Toast;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Lê a tela localmente via AccessibilityService.takeScreenshot. A imagem não
 * sai do aparelho. Identifica os pequenos sprites de Metagross e toca apenas
 * nos centros encontrados; não atua em coordenadas fixas nem no mapa do jogo.
 * Notificações de shiny são gerenciadas pelo PgsAutoShinyListener.
 */
public final class PgsAutoClickService extends AccessibilityService {
    private static final String CHANNEL = "pgs_alerts";
    private static final String SHINY_CHANNEL = "pgs_shiny_alarm_v05";
    private static final String SHINY_DEFAULT = "pgs_shiny_default_v07";
    private static final String SHINY_MUTED = "pgs_shiny_muted_v07";
    public static volatile PgsAutoClickService instance;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ExecutorService analysis=Executors.newSingleThreadExecutor();
    private WindowManager windowManager;
    private FrameLayout bubble;
    private ImageView handView;
    private boolean searchPulseActive=false;
    private TextView handBadge;

    private PgsAutoMenus quickMenus;
    private WindowManager.LayoutParams bubbleParams;
    private PgsAutoIconDetector detector;
    private FrameLayout picker;
    private Bitmap pickerBitmap;
    private boolean running=false, pausedByShiny=false, pausedByError=false;
    private boolean awaitingMap=false;
    private int nextIndex=0, total=0, limit=20, ticket=0, stableRepeats=0;
    // Histórico das posições tocadas; a lista atual pode diminuir ou mudar.
    private final List<VisitedSlot> visitedSlots=new ArrayList<>();
    private int noFreshAttempts=0,verifyMisses=0,emptyRetries=0;
    private long lastNoIconScan=0;
    private String currentTargetName="";
    private static final class VisitedSlot {
        final float x,y;
        final String group;
        VisitedSlot(PgsAutoIconDetector.Match match,int width,int height){
            x=match.x/(float)Math.max(1,width);
            y=match.y/(float)Math.max(1,height);
            group=match.group;
        }
        boolean samePlace(PgsAutoIconDetector.Match match,int width,int height){
            float mx=match.x/(float)Math.max(1,width);
            float my=match.y/(float)Math.max(1,height);
            // Só considera repetido o MESMO Pokémon na mesma região aproximada.
            // Ícones idênticos que trocaram de posição continuam indistinguíveis.
            return group.equals(match.group)&&
                Math.abs(x-mx)<.027f&&Math.abs(y-my)<.018f;
        }
    }
    private boolean alreadyVisited(PgsAutoIconDetector.Match item,int width,int height){
        for(VisitedSlot slot:visitedSlots)if(slot.samePlace(item,width,height))return true;
        return false;
    }
    private int minSeconds=5,maxSeconds=60;
    private int[] lastColors;
    private long clickedAt=0;
    private long sceneReadyAt=0;
    private int loadedStreak=0;
    private String foreground="";

    interface CaptureCallback {void onBitmap(Bitmap bitmap);void onError(String message);}

    @Override public void onServiceConnected() {
        super.onServiceConnected();
        instance=this;
        createChannel();
        try { detector=new PgsAutoIconDetector(this); }
        catch(IOException e) { showReason("Leitor visual indisponível: "+e.getMessage()); }
        showBubble();
    }

    @Override public void onAccessibilityEvent(AccessibilityEvent event) {
        if(event.getPackageName()!=null &&
            event.getEventType()==AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED)
            foreground=event.getPackageName().toString();
    }
    @Override public void onInterrupt() {halt("INTERRUPÇÃO");}
    @Override public void onDestroy() {
        halt("PARADO");
        if(quickMenus!=null)quickMenus.dismissAll();
        if(bubble!=null&&windowManager!=null) {
            try {windowManager.removeView(bubble);}catch(Exception ignored){}
        }
        
        
        if(handView!=null)handView.clearAnimation();
        handView=null;handBadge=null;
        dismissPicker();
        analysis.shutdownNow();
        bubble=null;instance=null;
        super.onDestroy();
    }

    private void showBubble() {
        windowManager=(WindowManager)getSystemService(WINDOW_SERVICE);
        if(bubble!=null)return;
        bubble=new FrameLayout(this);
        bubble.setContentDescription("Mão PGS Auto: toque para ligar/desligar; segure para abrir menus");
        GradientDrawable background=new GradientDrawable();
        background.setColor(0xB8111824);
        background.setCornerRadius(dp(11));
        background.setStroke(dp(1),0x977A899C);
        bubble.setBackground(null);
        handView=new ImageView(this);
        handView.setImageResource(R.drawable.pgs_hand_off);

        handView.setScaleType(ImageView.ScaleType.FIT_CENTER);
        FrameLayout.LayoutParams icon=new FrameLayout.LayoutParams(dp(34),dp(34),Gravity.CENTER);
        bubble.addView(handView,icon);
        handBadge=new TextView(this);
        handBadge.setText("✨");handBadge.setTextSize(13);
        handBadge.setGravity(Gravity.CENTER);
        handBadge.setVisibility(View.GONE);
        FrameLayout.LayoutParams sparkle=new FrameLayout.LayoutParams(dp(19),dp(19),Gravity.TOP|Gravity.RIGHT);
        sparkle.rightMargin=dp(-3);sparkle.topMargin=dp(-5);
        bubble.addView(handBadge,sparkle);
        quickMenus=new PgsAutoMenus(this,windowManager,new PgsAutoMenus.Actions(){
            @Override public void teach(String species){
                PgsAutoTemplateStore.startTeaching(PgsAutoClickService.this,species);
                handler.postDelayed(()->startTeaching(),350);
            }
            @Override public void retryNow(){
                emptyRetries=0;lastNoIconScan=0;
                if(!running){toggle();return;}
                awaitingMap=false;ticket++;scanAndTap();
            }
            @Override public void closeOverlay(){
                halt("FECHADO");
                if(quickMenus!=null)quickMenus.dismissAll();
                if(bubble!=null){
                    try{windowManager.removeView(bubble);}catch(Exception ignored){}
                    bubble=null;
                }
            }
            @Override public void testShiny(){testShinyAlert();}
        });
        SharedPreferences prefs=getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE);
        bubbleParams=new WindowManager.LayoutParams(dp(44),dp(44),
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT);
        bubbleParams.gravity=Gravity.RIGHT|Gravity.TOP;
        bubbleParams.x=Math.max(0,prefs.getInt("bubbleX",dp(12)));
        bubbleParams.y=Math.max(0,prefs.getInt("bubbleY",dp(190)));
        final float[] down={0f,0f};
        final int[] original={0,0};
        final long[] pressAt={0L};
        final boolean[] moved={false};
        bubble.setOnTouchListener((view,event)->{
            int action=event.getActionMasked();
            if(action==MotionEvent.ACTION_DOWN){
                down[0]=event.getRawX();down[1]=event.getRawY();
                original[0]=bubbleParams.x;original[1]=bubbleParams.y;
                pressAt[0]=SystemClock.uptimeMillis();moved[0]=false;
                return true;
            }
            if(action==MotionEvent.ACTION_MOVE){
                float dx=event.getRawX()-down[0],dy=event.getRawY()-down[1];
                if(Math.hypot(dx,dy)>dp(9))moved[0]=true;
                if(moved[0]){
                    Point display=new Point();windowManager.getDefaultDisplay().getRealSize(display);
                    bubbleParams.x=Math.max(0,Math.min(display.x-dp(44),original[0]-Math.round(dx)));
                    bubbleParams.y=Math.max(0,Math.min(display.y-dp(44),original[1]+Math.round(dy)));
                    try{windowManager.updateViewLayout(bubble,bubbleParams);}catch(Exception ignored){}
                }
                return true;
            }
            if(action==MotionEvent.ACTION_UP){
                if(moved[0]){
                    prefs.edit().putInt("bubbleX",bubbleParams.x)
                        .putInt("bubbleY",bubbleParams.y).apply();
                    if(quickMenus!=null)quickMenus.dismissAll();
                }else if(SystemClock.uptimeMillis()-pressAt[0]>=570){
                    Point display=new Point();windowManager.getDefaultDisplay().getRealSize(display);
                    int left=display.x-bubbleParams.x-dp(22);
                    quickMenus.toggle(left,bubbleParams.y);
                }else {
                    if(quickMenus!=null&&quickMenus.isOpen())quickMenus.dismissAll();
                    toggle();
                }
                return true;
            }
            return action==MotionEvent.ACTION_CANCEL;
        });
        try{windowManager.addView(bubble,bubbleParams);}
        catch(Exception e){Toast.makeText(this,"Não foi possível abrir botão de mão",Toast.LENGTH_LONG).show();}
        status("PARADO");
    }
    public static void restoreBubble(){
        PgsAutoClickService service=instance;
        if(service!=null)service.handler.post(()->service.showBubble());
    }
    private int dp(float n){return (int)(getResources().getDisplayMetrics().density*n+.5f);}
    private void status(String value){
        if(bubble==null)return;
        boolean shiny=pausedByShiny||value.contains("SHINY");
        boolean on=running&&!shiny;
        if(handView!=null){
            handView.setImageResource(on?R.drawable.pgs_hand_on:R.drawable.pgs_hand_off);
            boolean searching=on&&(value.startsWith("PROCURANDO")||value.startsWith("CONFIRMANDO"));
            if(searching&&!searchPulseActive){
                android.view.animation.AlphaAnimation pulse=new android.view.animation.AlphaAnimation(1f,.62f);
                pulse.setDuration(720);pulse.setRepeatMode(android.view.animation.Animation.REVERSE);
                pulse.setRepeatCount(android.view.animation.Animation.INFINITE);
                handView.startAnimation(pulse);searchPulseActive=true;
            }else if(!searching&&searchPulseActive){handView.clearAnimation();searchPulseActive=false;}
        }
        if(handBadge!=null){handBadge.setText(shiny?"✨":value.contains("PAUSADO")?"!":"");
            handBadge.setVisibility(shiny||value.contains("PAUSADO")?View.VISIBLE:View.GONE);}
        bubble.setAlpha(on?1f:.78f);
        bubble.setContentDescription("PGS Favoritos Auto: "+value+
            (on?", ligado":", desligado")+
            ". Toque para ligar/desligar; segure para abrir menus.");
    }
    private boolean reloadDetector(){
        try {detector=new PgsAutoIconDetector(this);return detector.templateCount()>0;}
        catch(IOException e){detector=null;showReason("Não foi possível carregar modelo: "+e.getMessage());return false;}
    }
    private void loadSettings(){
        SharedPreferences p=getSharedPreferences("pgs_buscas_auto_v1",MODE_PRIVATE);
        limit=50;
        minSeconds=Math.max(1,Math.min(30,p.getInt("post_load",5)));
        maxSeconds=Math.max(10,Math.min(180,p.getInt("load_timeout",60)));
    }
    private float setting(SharedPreferences p,String key,float def){
        try{return Float.parseFloat(p.getString(key,String.valueOf(def)));}catch(Exception ignored){return def;}
    }

    private void toggle(){
        if(running){halt("PARADO");return;}
        if(!reloadDetector()){
            showReason("Nenhum modelo selecionado ou imagem inválida. Abra o PGS Favoritos Auto e marque um Pokémon.");
            status("PAUSADO");return;
        }
        if(pausedByShiny||pausedByError){
            pausedByShiny=false;pausedByError=false;
            running=true;status("RETOMANDO");
            handler.postDelayed(this::scanAndTap,500);
            return;
        }
        loadSettings();
        nextIndex=0;total=0;lastColors=null;stableRepeats=0;sceneReadyAt=0;loadedStreak=0;
        visitedSlots.clear();noFreshAttempts=0;verifyMisses=0;currentTargetName="";
        emptyRetries=0;lastNoIconScan=0;
        running=true;
        status("LENDO TELA");
        handler.postDelayed(this::scanAndTap,400);
    }

    /** Segure o botão para localizar os ícones sem tocar em nenhum deles. */
    private void preview(){
        if(running){Toast.makeText(this,"Toque para pausar antes da prévia",Toast.LENGTH_LONG).show();return;}
        if(!reloadDetector()){status("SEM MODELO");showReason("Marque pelo menos um Pokémon no aplicativo.");return;}
        status("ANALISANDO");
        capture(new CaptureCallback(){
            @Override public void onBitmap(Bitmap bitmap){
                Bitmap copy=bitmap.copy(Bitmap.Config.ARGB_8888,false);
                if(copy==null){status("SEM CAPTURA");showReason("Imagem de tela indisponível.");return;}
                PgsAutoIconDetector current=detector;
                analysis.execute(()->{
                    List<PgsAutoIconDetector.Match> items;
                    try{items=current.find(copy);}catch(Exception e){items=null;}
                    finally{copy.recycle();}
                    final List<PgsAutoIconDetector.Match> found=items;
                    handler.post(()->{
                        if(found==null){status("SEM CAPTURA");showReason("Erro na detecção visual.");return;}
                        status("ACHEI "+found.size());
                        Toast.makeText(PgsAutoClickService.this,
                            "Encontrei "+found.size()+" ícones dos Pokémon selecionados",Toast.LENGTH_LONG).show();
                    });
                });
            }
            @Override public void onError(String error){status("SEM CAPTURA");showReason(error);}
        });
    }

    private void scanAndTap(){
        if(!running)return;
        if(!("com.nianticlabs.pokemongo".equals(foreground)||foreground.contains("pgsharp"))){
            status("ABRA O JOGO");
            handler.postDelayed(()->{if(running)scanAndTap();},2500L);return;
        }
        loadSettings();
        if(nextIndex>=total && total>0){
            if(getSharedPreferences("pgs_buscas_auto_v1",MODE_PRIVATE).getBoolean("repeat",true)){
                nextIndex=0;total=0;visitedSlots.clear();
            }else{complete();return;}
        }
        if(detector==null){fail("Modelo visual não disponível.");return;}
        final int stamp=++ticket;
        status("PROCURANDO "+(nextIndex+1));
        capture(new CaptureCallback(){
            @Override public void onBitmap(Bitmap bitmap){
                if(!running||ticket!=stamp)return;
                Bitmap copy=bitmap.copy(Bitmap.Config.ARGB_8888,false);
                if(copy==null){fail("Captura visual vazia.");return;}
                PgsAutoIconDetector current=detector;
                final int screenWidth=bitmap.getWidth();
                final int screenHeight=bitmap.getHeight();
                analysis.execute(()->{
                    List<PgsAutoIconDetector.Match> detected;
                    try{detected=current.find(copy);}catch(Exception e){detected=null;}
                    finally{copy.recycle();}
                    final List<PgsAutoIconDetector.Match> items=detected;
                    handler.post(()->{
                if(!running||ticket!=stamp)return;
                if(items==null){fail("Erro ao reconhecer os modelos visuais.");return;}
                if(total==0 && !items.isEmpty()){
                    total=limit;
                    Toast.makeText(PgsAutoClickService.this,
                        "Encontrei "+items.size()+" ícones selecionados; vou procurar até "+limit+".",
                        Toast.LENGTH_SHORT).show();
                }
                // A quantidade de ícones não é fixa; não usar items.get(nextIndex).
                // Escolhe a primeira posição reconhecida que ainda não foi tocada.
                PgsAutoIconDetector.Match match=null;
                for(PgsAutoIconDetector.Match candidate:items){
                    if(!alreadyVisited(candidate,screenWidth,screenHeight)){
                        match=candidate;
                        break;
                    }
                }
                if(match==null){
                    // O feed vazio ou apenas com posições visitadas nunca gera PAUSA.
                    // Primeira leitura: +60s, segunda: até +120s do início; depois loop.
                    SharedPreferences cfg=getSharedPreferences("pgs_buscas_auto_v1",MODE_PRIVATE);
                    int first=Math.max(10,Math.min(3600,cfg.getInt("first_empty",60)));
                    int second=Math.max(first,Math.min(7200,cfg.getInt("second_empty",120)));
                    int cycle=Math.max(10,Math.min(7200,cfg.getInt("repeat_interval",120)));
                    boolean repeat=cfg.getBoolean("repeat",true);
                    if(!repeat && nextIndex>0){complete();return;}
                    int delay=PgsAutoRetryPolicy.delaySeconds(emptyRetries,first,second,cycle);
                    emptyRetries++;
                    lastNoIconScan=SystemClock.uptimeMillis();
                    status("REBUSCAR "+delay+"s");
                    handler.postDelayed(()->{
                        if(running && ticket==stamp)scanAndTap();
                    },delay*1000L);
                    return;
                }
                emptyRetries=0;noFreshAttempts=0;
                verifyAndTap(match,screenWidth,screenHeight,stamp);
                    });
                });
            }
            @Override public void onError(String msg){if(running&&stamp==ticket)fail(msg);}
        });
    }

    /**
     * Exige que o MESMO modelo apareça em duas capturas antes de qualquer gesto.
     * Não escolhe uma espécie 3D no mapa; trabalha com os sprites do feed.
     */
    private void verifyAndTap(PgsAutoIconDetector.Match candidate,int width,int height,int stamp){
        if(!running||ticket!=stamp)return;
        status("CONFIRMANDO "+candidate.name);
        handler.postDelayed(()->{
            if(!running||ticket!=stamp)return;
            capture(new CaptureCallback(){
                @Override public void onBitmap(Bitmap bitmap){
                    if(!running||ticket!=stamp)return;
                    Bitmap copy=bitmap.copy(Bitmap.Config.ARGB_8888,false);
                    if(copy==null){fail("Não foi possível confirmar a captura.");return;}
                    final int w=bitmap.getWidth(),h=bitmap.getHeight();
                    final PgsAutoIconDetector current=detector;
                    analysis.execute(()->{
                        List<PgsAutoIconDetector.Match> detected;
                        try{detected=current.find(copy);}catch(Exception e){detected=null;}
                        finally{copy.recycle();}
                        final List<PgsAutoIconDetector.Match> confirmed=detected;
                        handler.post(()->{
                            if(!running||ticket!=stamp)return;
                            PgsAutoIconDetector.Match found=null;
                            if(confirmed!=null)for(PgsAutoIconDetector.Match m:confirmed){
                                if(!m.group.equals(candidate.group))continue;
                                if(Math.abs(m.x/(float)w-candidate.x/(float)width)>.026f)continue;
                                if(Math.abs(m.y/(float)h-candidate.y/(float)height)>.018f)continue;
                                if(alreadyVisited(m,w,h))continue;
                                found=m;break;
                            }
                            if(found==null){
                                verifyMisses++;
                                if(verifyMisses>=4){
                                    fail("Ícones instáveis: não consegui confirmar um alvo em duas capturas.");
                                }else{
                                    status("RELENDO ÍCONES");
                                    handler.postDelayed(()->{
                                        if(running&&ticket==stamp)scanAndTap();
                                    },700L);
                                }
                                return;
                            }
                            verifyMisses=0;
                            Point size=new Point();
                            windowManager.getDefaultDisplay().getRealSize(size);
                            int x=Math.round(found.x*size.x/(float)w);
                            int y=Math.round(found.y*size.y/(float)h);
                            if(x<0||x>=size.x||y<0||y>=size.y){
                                fail("Ícone confirmado fora da área de toque.");return;
                            }
                            tap(x,y,nextIndex,found,w,h);
                        });
                    });
                }
                @Override public void onError(String error){
                    if(running&&ticket==stamp)fail("Sem confirmação visual: "+error);
                }
            });
        },430L);
    }

    private void tap(int x,int y,int index,PgsAutoIconDetector.Match match,int screenWidth,int screenHeight){
        if(!running)return;
        if(!("com.nianticlabs.pokemongo".equals(foreground)||foreground.contains("pgsharp"))){
            status("ABRA O JOGO");handler.postDelayed(this::scanAndTap,1500L);return;
        }
        status("TOQUE "+(index+1)+"/"+total);
        Path path=new Path();path.moveTo(x,y);
        GestureDescription gesture=new GestureDescription.Builder()
            .addStroke(new GestureDescription.StrokeDescription(path,0,90)).build();
        boolean accepted=dispatchGesture(gesture,new GestureResultCallback(){
            @Override public void onCompleted(GestureDescription g){handler.post(()->{
                if(!running||index!=nextIndex)return;
                visitedSlots.add(new VisitedSlot(match,screenWidth,screenHeight));
                currentTargetName=match.name;
                String foundMode=getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE).getString("searchSound","mute");
                if(!"mute".equals(foundMode)){
                    notifyUser("PGS Busca: "+match.name,"Ícone selecionado para teleporte.",false);
                }
                awaitingMap=true;clickedAt=SystemClock.uptimeMillis();
                lastColors=null;stableRepeats=0;
                sceneReadyAt=0;loadedStreak=0;
                final int stamp=++ticket;
                status("AGUARDANDO MAPA");
                handler.postDelayed(()->checkMap(stamp),1300L);
            });}
            @Override public void onCancelled(GestureDescription g){handler.post(()->fail("Toque cancelado pelo Android."));}
        },null);
        if(!accepted)fail("O Android não autorizou o toque de Acessibilidade.");
    }

    private void checkMap(int stamp){
        if(!running||!awaitingMap||ticket!=stamp)return;
        long now=SystemClock.uptimeMillis();
        if(now-clickedAt>=maxSeconds*1000L){
            finishMapVisit(stamp,true);
            return;
        }
        capture(new CaptureCallback(){
            @Override public void onBitmap(Bitmap bitmap){
                if(!running||!awaitingMap||ticket!=stamp)return;
                long when=SystemClock.uptimeMillis();
                int[] colors=sampleMap(bitmap);
                if(lastColors!=null&&difference(lastColors,colors)<=10f)stableRepeats++;
                else stableRepeats=0;
                lastColors=colors;
                PgsAutoMapReadiness.Evidence evidence=PgsAutoMapReadiness.analyze(bitmap);
                // O terreno sozinho não é prova de carregamento. Precisa
                // estabilidade E indícios de objetos (ginásios/PokéStops).
                if(stableRepeats>=1 && evidence.scenePopulated)loadedStreak++;
                else loadedStreak=0;
                if(sceneReadyAt==0 && loadedStreak>=2){
                    sceneReadyAt=when;
                    status("MAPA VISÍVEL");
                }
                if(sceneReadyAt>0){
                    long remaining=minSeconds*1000L-(when-sceneReadyAt);
                    if(remaining<=0){
                        finishMapVisit(stamp,false);
                        return;
                    }
                    status("ESPERA "+Math.max(1,(remaining+999)/1000)+"s");
                }else{
                    int elapsed=(int)((when-clickedAt)/1000);
                    status("CARREGANDO "+elapsed+"/"+maxSeconds);
                }
                handler.postDelayed(()->checkMap(stamp),1500L);
            }
            @Override public void onError(String msg){
                if(running&&stamp==ticket)fail("Falha na leitura da tela: "+msg);
            }
        });
    }
    private void finishMapVisit(int stamp,boolean timeout){
        if(!running||!awaitingMap||stamp!=ticket)return;
        awaitingMap=false;
        nextIndex++;
        sceneReadyAt=0;loadedStreak=0;lastColors=null;stableRepeats=0;
        status(timeout?"TEMPO ESGOTADO":"PRÓXIMO");
        handler.postDelayed(()->{
            if(!running||ticket!=stamp)return;
            if(nextIndex>=limit){
                if(getSharedPreferences("pgs_buscas_auto_v1",MODE_PRIVATE).getBoolean("repeat",true)){
                    nextIndex=0;total=0;visitedSlots.clear();scanAndTap();
                }else complete();
            }else scanAndTap();
        },800L);
    }
    private int[] sampleMap(Bitmap bitmap){
        int cols=14,rows=11, i=0;
        int[] signature=new int[cols*rows*3];
        for(int yy=0;yy<rows;yy++)for(int xx=0;xx<cols;xx++){
            int px=Math.min(bitmap.getWidth()-1,(int)(bitmap.getWidth()*(.53+.35*(xx+.5)/cols)));
            int py=Math.min(bitmap.getHeight()-1,(int)(bitmap.getHeight()*(.44+.26*(yy+.5)/rows)));
            int c=bitmap.getPixel(px,py);
            signature[i++]=Color.red(c);signature[i++]=Color.green(c);signature[i++]=Color.blue(c);
        }
        return signature;
    }
    private float difference(int[] a,int[] b){
        if(a.length!=b.length)return 255;
        long sum=0;for(int i=0;i<a.length;i++)sum+=Math.abs(a[i]-b[i]);
        return (float)sum/a.length;
    }

    /** Captura um frame do mapa e deixa o usuário escolher um sprite pequeno. */
    private void startTeaching(){
        if(running){showReason("Pare a sequência antes de cadastrar um Pokémon.");return;}
        String pokemon=PgsAutoTemplateStore.pending(this);
        if(pokemon.isEmpty()){preview();return;}
        if(bubble!=null)bubble.setVisibility(View.INVISIBLE);
        handler.postDelayed(()->capture(new CaptureCallback(){
            @Override public void onBitmap(Bitmap bitmap){
                try {
                    Bitmap saved=bitmap.copy(Bitmap.Config.ARGB_8888,false);
                    if(saved==null)throw new IOException("Captura vazia");
                    showPicker(saved,pokemon);
                }catch(Exception e){
                    if(bubble!=null)bubble.setVisibility(View.VISIBLE);
                    showReason("Erro ao preparar seleção: "+e.getMessage());
                }
            }
            @Override public void onError(String msg){
                if(bubble!=null)bubble.setVisibility(View.VISIBLE);
                showReason(msg);
            }
        }),250);
    }
    private void showPicker(Bitmap screenshot,String name){
        dismissPicker();
        pickerBitmap=screenshot;
        picker=new FrameLayout(this);
        picker.setBackgroundColor(Color.BLACK);
        ImageView photo=new ImageView(this);
        photo.setImageBitmap(screenshot);
        photo.setScaleType(ImageView.ScaleType.FIT_XY);
        picker.addView(photo,new FrameLayout.LayoutParams(-1,-1));
        photo.setOnTouchListener((v,event)->{
            if(event.getAction()!=MotionEvent.ACTION_UP)return true;
            int x=Math.round(event.getX()*screenshot.getWidth()/Math.max(1,v.getWidth()));
            int y=Math.round(event.getY()*screenshot.getHeight()/Math.max(1,v.getHeight()));
            // Permite ensinar um ícone pequeno em QUALQUER ponto da tela.
            if(x<0||y<0||x>=screenshot.getWidth()||y>=screenshot.getHeight())return true;
            try {
                // O ícone será ajustado à resolução de referência (740px de largura).
                int rw=Math.max(20,Math.round(PgsAutoTemplateStore.WIDTH*screenshot.getWidth()/740f));
                int rh=Math.max(18,Math.round(PgsAutoTemplateStore.HEIGHT*screenshot.getWidth()/740f));
                rw=Math.min(rw,screenshot.getWidth());rh=Math.min(rh,screenshot.getHeight());
                int left=Math.max(0,Math.min(screenshot.getWidth()-rw,x-rw/2));
                int top=Math.max(0,Math.min(screenshot.getHeight()-rh,y-rh/2));
                Bitmap piece=Bitmap.createBitmap(screenshot,left,top,rw,rh);
                Bitmap model=Bitmap.createScaledBitmap(piece,PgsAutoTemplateStore.WIDTH,PgsAutoTemplateStore.HEIGHT,true);
                try { PgsAutoTemplateStore.saveSample(this,name,model); }
                finally {if(piece!=model)piece.recycle();model.recycle();}
                PgsAutoTemplateStore.clearTeaching(this);
                dismissPicker();
                status("PARADO");
                Toast.makeText(this,name+" adicionado! Marque/desmarque no aplicativo.",Toast.LENGTH_LONG).show();
            }catch(Exception e){showReason("Não foi possível salvar o ícone: "+e.getMessage());}
            return true;
        });
        TextView help=new TextView(this);
        help.setText("Toque no ícone pequeno de "+name+" onde ele estiver.");
        help.setTextColor(Color.WHITE);help.setTextSize(13);
        help.setBackgroundColor(Color.rgb(22,73,93));help.setPadding(dp(10),dp(8),dp(10),dp(8));
        FrameLayout.LayoutParams hp=new FrameLayout.LayoutParams(-1,-2,Gravity.BOTTOM);
        hp.bottomMargin=dp(62);picker.addView(help,hp);
        Button cancel=new Button(this);cancel.setText("Cancelar seleção");
        cancel.setTextSize(12);cancel.setAllCaps(false);
        FrameLayout.LayoutParams cp=new FrameLayout.LayoutParams(-1,dp(56),Gravity.BOTTOM);
        picker.addView(cancel,cp);
        cancel.setOnClickListener(v->{dismissPicker();status("PARADO");});
        WindowManager.LayoutParams params=new WindowManager.LayoutParams(-1,-1,
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT);
        params.gravity=Gravity.TOP|Gravity.LEFT;
        try{windowManager.addView(picker,params);}
        catch(Exception e){dismissPicker();showReason("Não consegui abrir a seleção: "+e.getMessage());}
    }
    private void dismissPicker(){
        if(picker!=null && windowManager!=null){
            try{windowManager.removeView(picker);}catch(Exception ignored){}
            picker=null;
        }
        if(pickerBitmap!=null){pickerBitmap.recycle();pickerBitmap=null;}
        if(bubble!=null)bubble.setVisibility(View.VISIBLE);
    }

    private void capture(CaptureCallback callback){
        final Executor executor=command->handler.post(command);
        try{
            takeScreenshot(Display.DEFAULT_DISPLAY,executor,new TakeScreenshotCallback(){
                @Override public void onSuccess(ScreenshotResult result){
                    HardwareBuffer buffer=result.getHardwareBuffer();
                    Bitmap copy=null;
                    try{
                        Bitmap hardware=Bitmap.wrapHardwareBuffer(buffer,result.getColorSpace());
                        if(hardware==null)throw new IllegalStateException("Imagem protegida ou vazia");
                        copy=hardware.copy(Bitmap.Config.ARGB_8888,false);
                        if(copy==null)throw new IllegalStateException("Cópia de imagem vazia");
                        callback.onBitmap(copy);
                    }catch(Exception e){callback.onError("Não foi possível interpretar a captura de tela: "+e.getMessage());}
                    finally{
                        if(copy!=null)copy.recycle();
                        try{buffer.close();}catch(Exception ignored){}
                    }
                }
                @Override public void onFailure(int errorCode){
                    callback.onError("O Android recusou a captura de tela (código "+errorCode+"). Verifique a permissão do serviço de Acessibilidade.");
                }
            });
        }catch(Exception e){callback.onError("Capture de tela bloqueada. Confira as permissões da Acessibilidade.");}
    }
    private void showReason(String reason){
        getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE).edit().putString("lastError",reason).apply();
        Toast.makeText(this,reason,Toast.LENGTH_LONG).show();
    }
    private void fail(String reason){
        if(!running){showReason(reason);return;}
        running=false;awaitingMap=false;pausedByError=true;ticket++;
        status("PAUSADO\nVER AVISO");
        showReason(reason);
        notifyUser("PGS Favoritos pausado",reason,true);
    }
    private void complete(){
        running=false;awaitingMap=false;pausedByShiny=false;pausedByError=false;ticket++;
        status("CONCLUÍDO "+nextIndex);
        notifyUser("Varredura concluída","Visitei "+nextIndex+" ícone(s) reconhecidos. O feed pode ter mudado durante a sequência.",false);
    }
    private void halt(String label){
        running=false;awaitingMap=false;pausedByShiny=false;pausedByError=false;
        ticket++;nextIndex=0;total=0;visitedSlots.clear();noFreshAttempts=0;verifyMisses=0;emptyRetries=0;currentTargetName="";status(label);
    }
    /** Teste local separado de um shiny real: não altera o estado da rodada. */
    public static void testShinyAlert(){
        PgsAutoClickService service=instance;
        if(service==null)return;
        service.handler.post(()->{
            service.notifyUser("TESTE SHINY — alarme","Simulação local, sem Pokémon detectado.",true);
            service.playShinySound();
            Vibrator vib=(Vibrator)service.getSystemService(VIBRATOR_SERVICE);
            if(service.getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE).getBoolean("shinyVibrate",true)
                &&vib!=null&&vib.hasVibrator())
                vib.vibrate(VibrationEffect.createWaveform(new long[]{0,250,140,250},-1));
            Toast.makeText(service,"Teste de alerta enviado.",Toast.LENGTH_SHORT).show();
        });
    }
    public static void onPgsharpShiny(String message){
        PgsAutoClickService live=instance;
        if(live!=null)live.handler.post(()->live.pauseForShiny(message));
    }
    private void pauseForShiny(String message){
        if(!running)return;
        if(awaitingMap && nextIndex<total)nextIndex++;
        running=false;awaitingMap=false;pausedByShiny=true;ticket++;
        status("✨ SHINY\nPAUSADO");
        String alert="Alvo: "+(currentTargetName.isEmpty()?"não identificado":currentTargetName)+". "+message;
        getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE).edit()
            .putString("lastShinyNotice",alert).apply();
        notifyUser("✨ SHINY — pausa automática",alert,true);
        playShinySound();
        Vibrator v=(Vibrator)getSystemService(VIBRATOR_SERVICE);
        if(getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE).getBoolean("shinyVibrate",true)
            &&v!=null&&v.hasVibrator())
            v.vibrate(VibrationEffect.createWaveform(new long[]{0,350,180,350,180,550},-1));
    }
    private void createChannel(){
        NotificationManager n=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
        NotificationChannel general=new NotificationChannel(CHANNEL,"PGS: sequência e pausas",NotificationManager.IMPORTANCE_DEFAULT);
        general.enableVibration(false);
        n.createNotificationChannel(general);
        NotificationChannel shiny=new NotificationChannel(SHINY_CHANNEL,"PGS: shiny com som",NotificationManager.IMPORTANCE_HIGH);
        shiny.enableVibration(true);
        Uri tone=RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if(tone==null)tone=RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        shiny.setSound(tone,new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ALARM)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
        n.createNotificationChannel(shiny);
        NotificationChannel normalShiny=new NotificationChannel(SHINY_DEFAULT,
            "PGS: shiny padrão",NotificationManager.IMPORTANCE_HIGH);
        Uri standard=RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        normalShiny.setSound(standard,new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
        n.createNotificationChannel(normalShiny);
        NotificationChannel quietShiny=new NotificationChannel(SHINY_MUTED,
            "PGS: shiny silencioso",NotificationManager.IMPORTANCE_HIGH);
        quietShiny.setSound(null,null);
        quietShiny.enableVibration(false);
        n.createNotificationChannel(quietShiny);
    }
    private void playShinySound(){
        String mode=getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE).getString("shinyMode","strong");
        if("mute".equals(mode))return;
        try{
            Uri tone="custom".equals(mode)?
                PokeSoundLibrary.soundUri(this,getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE).getInt("shinyModeSoundIndex",21)):
                RingtoneManager.getDefaultUri(
                "default".equals(mode)?RingtoneManager.TYPE_NOTIFICATION:RingtoneManager.TYPE_ALARM);
            if(tone==null)tone=RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            if(tone==null)return;
            Ringtone ringtone=RingtoneManager.getRingtone(this,tone);
            if(ringtone==null)return;
            ringtone.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
            ringtone.play();
            handler.postDelayed(()->{try{ringtone.stop();}catch(Exception ignored){}},3500L);
        }catch(Exception ignored){ }
    }
    private void notifyUser(String title,String body,boolean important){
        try{
            Intent intent=new Intent(this,MainActivity.class);
            PendingIntent pi=PendingIntent.getActivity(this,0,intent,PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
            String channel=CHANNEL;
            if(title.contains("SHINY")){
                String mode=getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE).getString("shinyMode","strong");
                channel=("mute".equals(mode)||"custom".equals(mode))?SHINY_MUTED:"default".equals(mode)?SHINY_DEFAULT:SHINY_CHANNEL;
            }
            Notification n=new Notification.Builder(this,channel)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title).setContentText(body)
                .setStyle(new Notification.BigTextStyle().bigText(body))
                .setContentIntent(pi).setAutoCancel(true)
                .setCategory(important?Notification.CATEGORY_ALARM:Notification.CATEGORY_STATUS).build();
            ((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).notify(important?102:103,n);
        }catch(SecurityException ignored){}
    }
}

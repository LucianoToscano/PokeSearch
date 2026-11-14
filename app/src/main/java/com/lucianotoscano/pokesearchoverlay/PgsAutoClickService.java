package com.lucianotoscano.pokesearchoverlay;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.media.AudioAttributes;
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
import android.view.Display;
import android.view.Gravity;
import android.view.WindowManager;
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
    private View coreIndicator;
    private GradientDrawable coreBackground;
    private PgsAutoVisualState.Core currentCore;
    private Boolean currentArtworkOn;
    private TextView handBadge;

    private PgsAutoMenus quickMenus;
    private WindowManager.LayoutParams bubbleParams;
    private PgsAutoIconDetector detector;
    private FrameLayout picker;
    private Bitmap pickerBitmap;
    private boolean running=false, pausedByShiny=false, pausedByError=false;
    private boolean awaitingMap=false;
    private boolean teachingScheduled=false,teachingInProgress=false;
    private boolean isGameVisible(){
        return "com.nianticlabs.pokemongo".equals(foreground)||
            foreground.contains("pgsharp");
    }
    /** Pedido da Home ou do overlay: só captura o feed quando PGSharp estiver visível. */
    public static void requestTeaching(String species){
        PgsAutoClickService live=instance;
        if(live==null)return;
        live.handler.post(()->{
            PgsAutoTemplateStore.startTeaching(live,species);
            live.queueTeachingWhenReady();
        });
    }
    private void queueTeachingWhenReady(){
        if(teachingInProgress||teachingScheduled||running)return;
        String pending=PgsAutoTemplateStore.pending(this);
        if(pending.isEmpty())return;
        if(!isGameVisible()){
            Toast.makeText(this,
                "Abra o feed de Pokémon do PGSharp. A seleção do ícone de "+
                pending+" aparecerá automaticamente.",Toast.LENGTH_LONG).show();
            return;
        }
        teachingScheduled=true;
        handler.postDelayed(()->{
            teachingScheduled=false;
            if(!running&&isGameVisible()&&!PgsAutoTemplateStore.pending(this).isEmpty())
                startTeaching();
        },650L);
    }
    private int nextIndex=0, total=0, limit=20, ticket=0, stableRepeats=0;
    // Histórico das posições tocadas; a lista atual pode diminuir ou mudar.
    private final List<VisitedSlot> visitedSlots=new ArrayList<>();
    private int noFreshAttempts=0,verifyMisses=0,emptyRetries=0;
    private long lastNoIconScan=0;
    private String currentTargetName="";
    // Avisar somente alvos novos confirmados nesta rodada; repetir o feed não dispara spam.
    private final java.util.HashSet<String> notifiedFeedSlots=new java.util.HashSet<>();
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
        if(!PgsAutoTemplateStore.pending(this).isEmpty())queueTeachingWhenReady();
    }

    @Override public void onAccessibilityEvent(AccessibilityEvent event) {
        if(event==null||event.getPackageName()==null)return;
        int type=event.getEventType();
        if(type!=AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED &&
            type!=AccessibilityEvent.TYPE_WINDOWS_CHANGED)return;
        String pkg=event.getPackageName().toString();
        // Acessibilidade pode anunciar NOSSA bolha como janela superior.
        // Nunca sobrescrever o jogo por causa dos menus do próprio PokeSearch.
        if(pkg.equals(getPackageName()))return;
        foreground=pkg;
        if(isGameVisible()&&!PgsAutoTemplateStore.pending(this).isEmpty())
            queueTeachingWhenReady();
    }
    @Override public void onInterrupt() {halt("INTERRUPÇÃO");}
    @Override public void onDestroy() {
        halt("PARADO");
        if(quickMenus!=null)quickMenus.dismissAll();
        if(bubble!=null&&windowManager!=null) {
            try {windowManager.removeView(bubble);}catch(Exception ignored){}
        }
        
        
        if(handView!=null)handView.clearAnimation();
        if(coreIndicator!=null)coreIndicator.clearAnimation();
        handView=null;coreIndicator=null;coreBackground=null;
        currentCore=null;currentArtworkOn=null;handBadge=null;
        dismissPicker();
        analysis.shutdownNow();
        bubble=null;instance=null;
        super.onDestroy();
    }

    private void showBubble() {
        windowManager=(WindowManager)getSystemService(WINDOW_SERVICE);
        if(bubble!=null)return;
        bubble=new FrameLayout(this);
        bubble.setContentDescription("Busca Pokémon PGS: toque para ligar/desligar; segure para abrir menus");
        bubble.setBackground(null);
        // Mesma proporção da Pokébola de resultados: slot 35x30 e arte 21dp.
        // Hitbox de 44x44 mantém arraste e gesto de toque/segurar existentes.
        FrameLayout iconSlot=new FrameLayout(this);
        FrameLayout.LayoutParams slotLp=new FrameLayout.LayoutParams(
            dp(PgsAutoVisualState.RESULT_SLOT_WIDTH_DP),
            dp(PgsAutoVisualState.RESULT_SLOT_HEIGHT_DP),Gravity.CENTER);
        bubble.addView(iconSlot,slotLp);
        handView=new ImageView(this);
        handView.setImageResource(R.drawable.busca_pokemon_overlay_off);
        handView.setScaleType(ImageView.ScaleType.FIT_CENTER);
        FrameLayout.LayoutParams artLp=new FrameLayout.LayoutParams(
            dp(PgsAutoVisualState.RESULT_ART_DP),
            dp(PgsAutoVisualState.RESULT_ART_DP),Gravity.CENTER);
        iconSlot.addView(handView,artLp);
        coreIndicator=new View(this);
        coreBackground=new GradientDrawable();
        coreBackground.setShape(GradientDrawable.OVAL);
        coreBackground.setColor(Color.WHITE);
        coreBackground.setStroke(dp(1),0xFFC4CFDB);
        coreIndicator.setBackground(coreBackground);
        coreIndicator.setVisibility(View.GONE); // Branco natural da imagem: nunca cobrir.
        FrameLayout.LayoutParams coreLp=new FrameLayout.LayoutParams(
            dp(PgsAutoVisualState.CORE_DP),dp(PgsAutoVisualState.CORE_DP),Gravity.CENTER);
        iconSlot.addView(coreIndicator,coreLp);
        currentCore=null;currentArtworkOn=null;
        handBadge=new TextView(this);
        handBadge.setText("✨");handBadge.setTextSize(13);
        handBadge.setGravity(Gravity.CENTER);
        handBadge.setVisibility(View.GONE);
        FrameLayout.LayoutParams sparkle=new FrameLayout.LayoutParams(dp(19),dp(19),Gravity.TOP|Gravity.RIGHT);
        sparkle.rightMargin=dp(-3);sparkle.topMargin=dp(-5);
        bubble.addView(handBadge,sparkle);
        quickMenus=new PgsAutoMenus(this,windowManager,new PgsAutoMenus.Actions(){
            @Override public void teach(String species){
                requestTeaching(species);
            }
            @Override public void retryNow(){restartSession();}
            @Override public void closeOverlay(){removeHand();}
            @Override public void testNotification(String type){testPgsNotification(type);}
        });
        SharedPreferences prefs=getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE);
        bubbleParams=new WindowManager.LayoutParams(dp(PgsAutoVisualState.TOUCH_DP),dp(PgsAutoVisualState.TOUCH_DP),
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
                    bubbleParams.x=Math.max(0,Math.min(display.x-dp(PgsAutoVisualState.TOUCH_DP),original[0]-Math.round(dx)));
                    bubbleParams.y=Math.max(0,Math.min(display.y-dp(PgsAutoVisualState.TOUCH_DP),original[1]+Math.round(dy)));
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
                    if(!PgsAutoTemplateStore.pending(PgsAutoClickService.this).isEmpty()){
                        queueTeachingWhenReady();
                        return true;
                    }
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
        catch(Exception e){Toast.makeText(this,"Não foi possível abrir o botão Busca Pokémon",Toast.LENGTH_LONG).show();}
        status("PARADO");
    }
    public static void restartSearch(){
        PgsAutoClickService service=instance;
        if(service!=null)service.handler.post(service::restartSession);
    }
    public static void closeHand(){
        PgsAutoClickService service=instance;
        if(service!=null)service.handler.post(service::removeHand);
    }
    /** A Home reflete a visibilidade da bolha (como Pokébolas 1/2),
     * não o estado da varredura após toque na arte. */
    public static boolean isOverlayVisible(){
        PgsAutoClickService live=instance;
        return live!=null&&live.bubble!=null&&
            live.bubble.getVisibility()==View.VISIBLE;
    }
    /** Edição de amostras pelo submenu da lupa; nunca deixar detector velho. */
    public static void modelsChanged(){
        PgsAutoClickService live=instance;
        if(live!=null)live.handler.post(()->{
            if(live.running)live.halt("PARADO");
            live.reloadDetector();
            live.status("PARADO");
        });
    }
    public static String searchStatus(){
        PgsAutoClickService live=instance;
        if(live==null)return "Acessibilidade desligada";
        if(live.running&&!live.isGameVisible())return "Abra PGSharp";
        if(live.running&&live.awaitingMap)return "Aguardando mapa";
        if(live.running)return "Procurando ícones";
        if(live.pausedByError)return "Erro · verificar acesso";
        if(live.pausedByShiny)return "Shiny confirmado";
        return "Parado";
    }
    private void restartSession(){
        emptyRetries=0;lastNoIconScan=0;visitedSlots.clear();notifiedFeedSlots.clear();
        nextIndex=0;total=0;awaitingMap=false;
        ++ticket;
        if(!running){toggle();return;}
        if(!reloadDetector()){fail("Nenhum modelo visual ativo para reiniciar.");return;}
        status("REINICIANDO");
        handler.postDelayed(this::scanAndTap,350L);
    }
    private void removeHand(){
        halt("FECHADO");
        if(quickMenus!=null)quickMenus.dismissAll();
        if(bubble!=null&&windowManager!=null){
            try{windowManager.removeView(bubble);}catch(Exception ignored){}
            bubble=null;
        }
        if(coreIndicator!=null)coreIndicator.clearAnimation();
        coreIndicator=null;coreBackground=null;handView=null;handBadge=null;
        currentCore=null;currentArtworkOn=null;
    }
    public static void restoreBubble(){
        PgsAutoClickService service=instance;
        if(service!=null)service.handler.post(()->service.showBubble());
    }
    private int dp(float n){return (int)(getResources().getDisplayMetrics().density*n+.5f);}
    /** A Home usa o estado REAL do serviço, nunca uma preferência desatualizada. */
    public static boolean isSearchActive(){
        PgsAutoClickService live=instance;
        return live!=null && PgsAutoVisualState.active(
            live.running,live.pausedByShiny,live.pausedByError);
    }
    private void setCoreState(PgsAutoVisualState.Core next){
        if(coreIndicator==null||coreBackground==null||currentCore==next)return;
        // Branco não é pintado por cima: preservar a bola branca original,
        // sem retângulo, contorno ou animação de alpha sobre ela.
        coreIndicator.clearAnimation();
        if(next==PgsAutoVisualState.Core.WHITE){
            coreIndicator.setVisibility(View.GONE);
            currentCore=next;return;
        }
        coreIndicator.setVisibility(View.VISIBLE);
        int color=next==PgsAutoVisualState.Core.GREEN?0xFF38E18D:
            next==PgsAutoVisualState.Core.RED?0xFFFF515B:Color.WHITE;
        coreBackground.setColor(color);
        coreBackground.setStroke(dp(1),next==PgsAutoVisualState.Core.WHITE?
            0xFFC4CFDB:Color.WHITE);
        android.view.animation.AlphaAnimation pulse=
            new android.view.animation.AlphaAnimation(.22f,1f);
        pulse.setDuration(PgsAutoVisualState.PULSE_MS);
        pulse.setRepeatMode(android.view.animation.Animation.REVERSE);
        pulse.setRepeatCount(android.view.animation.Animation.INFINITE);
        coreIndicator.startAnimation(pulse);
        currentCore=next;
    }
    private void status(String value){
        if(bubble==null)return;
        boolean shiny=pausedByShiny||value.contains("SHINY");
        boolean on=PgsAutoVisualState.active(running,pausedByShiny,pausedByError);
        if(handView!=null&&(!Boolean.valueOf(on).equals(currentArtworkOn))){
            handView.setImageResource(on?
                R.drawable.busca_pokemon_overlay_on:R.drawable.busca_pokemon_overlay_off);
            currentArtworkOn=on;
        }
        setCoreState(PgsAutoVisualState.core(running,awaitingMap,pausedByError,value));
        if(handBadge!=null){
            handBadge.setText(shiny?"✨":value.contains("PAUSADO")?"!":"");
            handBadge.setVisibility(shiny||value.contains("PAUSADO")?View.VISIBLE:View.GONE);
        }
        bubble.setAlpha(1f); // Estado OFF fica na arte, não num quadrado translúcido.
        bubble.setContentDescription("PGS Busca Pokémon: "+value+
            (on?", ligado":", desligado")+
            ". Toque para ligar/desligar; segure para abrir menus.");
    }
    private boolean reloadDetector(){
        try {detector=new PgsAutoIconDetector(this);return detector.templateCount()>0;}
        catch(IOException e){detector=null;showReason("Não foi possível carregar modelo: "+e.getMessage());return false;}
    }
    /** Compatibilidade LT338: migra temporizadores uma vez e mantém as escolhas novas. */
    static SharedPreferences cyclePrefs(Context context){
        SharedPreferences p=context.getSharedPreferences("pgs_buscas_auto_v1",MODE_PRIVATE);
        if(!p.getBoolean("cycle_60_2_migrated",false)){
            p.edit()
                .putInt("load_timeout",PgsAutoCyclePolicy.DEFAULT_MAP_TIMEOUT_SECONDS)
                .putInt("post_load",PgsAutoCyclePolicy.DEFAULT_SHINY_CHECK_SECONDS)
                .putBoolean("cycle_60_2_migrated",true).commit();
        }
        return p;
    }
    private void loadSettings(){
        SharedPreferences p=cyclePrefs(this);
        limit=50;
        minSeconds=PgsAutoCyclePolicy.shinyCheckSeconds(
            p.getInt("post_load",PgsAutoCyclePolicy.DEFAULT_SHINY_CHECK_SECONDS));
        maxSeconds=PgsAutoCyclePolicy.mapTimeoutSeconds(
            p.getInt("load_timeout",PgsAutoCyclePolicy.DEFAULT_MAP_TIMEOUT_SECONDS));
    }
    private float setting(SharedPreferences p,String key,float def){
        try{return Float.parseFloat(p.getString(key,String.valueOf(def)));}catch(Exception ignored){return def;}
    }

    private void toggle(){
        if(running){halt("PARADO");return;}
        if(!PgsAutoTemplateStore.pending(this).isEmpty()){
            queueTeachingWhenReady();return;
        }
        if(!reloadDetector()){
            showReason("Nenhum modelo selecionado ou imagem inválida. Abra o PGS Favoritos Auto e marque um Pokémon.");
            status("SEM MODELO");return; // Falha visual: vermelho no centro.
        }
        if(pausedByShiny||pausedByError){
            pausedByShiny=false;pausedByError=false;
            running=true;status("RETOMANDO");
            handler.postDelayed(this::scanAndTap,500);
            return;
        }
        loadSettings();
        nextIndex=0;total=0;lastColors=null;stableRepeats=0;sceneReadyAt=0;loadedStreak=0;
        visitedSlots.clear();notifiedFeedSlots.clear();noFreshAttempts=0;verifyMisses=0;currentTargetName="";
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
            // Recomeça a leitura do feed automaticamente, sem checkbox
            // "repetir buscas" nem reinício manual redundante.
            nextIndex=0;total=0;visitedSlots.clear();notifiedFeedSlots.clear();
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
                    // Recomeça a fila quando a única coisa que resta na tela
                    // são posições já visitadas. Sem checkbox de repetição.
                    if(!items.isEmpty()&&++noFreshAttempts>=3){
                        visitedSlots.clear();notifiedFeedSlots.clear();
                        nextIndex=0;total=0;noFreshAttempts=0;
                    }else if(items.isEmpty())noFreshAttempts=0;
                    status("FEED VAZIO · NOVA LEITURA");
                    handler.postDelayed(()->{
                        if(running&&ticket==stamp)scanAndTap();
                    },PgsAutoCyclePolicy.EMPTY_FEED_RETRY_SECONDS*1000L);
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
                            // Só registra quando a MESMA imagem foi confirmada 2x.
                            // Slot relativo + espécie evita repetição por revarredura.
                            String evidence=found.group+":"+
                                Math.round(found.x*100f/Math.max(1,w))+":"+
                                Math.round(found.y*100f/Math.max(1,h));
                            if(notifiedFeedSlots.size()<150&&notifiedFeedSlots.add(evidence))
                                notifyConfigured(PgsAutoNotificationPolicy.NEW,
                                    "PGS: novo Pokémon no feed",
                                    found.name+" confirmado na lista de buscas.",false);
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
        final int gestureTicket=ticket;
        boolean accepted=dispatchGesture(gesture,new GestureResultCallback(){
            @Override public void onCompleted(GestureDescription g){handler.post(()->{
                if(!running||index!=nextIndex)return;
                visitedSlots.add(new VisitedSlot(match,screenWidth,screenHeight));
                currentTargetName=match.name;
                // A seleção de som PGS independe da Pokébola 1 e 2.
                notifyConfigured(PgsAutoNotificationPolicy.SEARCH,
                    "PGS Busca: "+match.name,"Alvo confirmado para teleporte.",false);
                awaitingMap=true;clickedAt=SystemClock.uptimeMillis();
                lastColors=null;stableRepeats=0;
                sceneReadyAt=0;loadedStreak=0;
                final int stamp=++ticket;
                status("AGUARDANDO MAPA");
                // Watchdog próprio: o limite continua valendo mesmo se um frame
                // Android nunca responder (não ficar preso em tela/carregamento).
                handler.postDelayed(()->{
                    if(running&&awaitingMap&&ticket==stamp)
                        finishMapVisit(stamp,true);
                },maxSeconds*1000L);
                handler.postDelayed(()->checkMap(stamp),1300L);
            });}
            @Override public void onCancelled(GestureDescription g){handler.post(()->fail("Toque cancelado pelo Android."));}
        },null);
        if(!accepted)fail("O Android não autorizou o toque de Acessibilidade.");
        else handler.postDelayed(()->{
            if(running&&!awaitingMap&&ticket==gestureTicket)
                fail("O Android não confirmou o toque. Confira Acessibilidade e PGSharp.");
        },3500L);
    }

    private void checkMap(int stamp){
        if(!running||!awaitingMap||ticket!=stamp)return;
        long now=SystemClock.uptimeMillis();
        if(PgsAutoCyclePolicy.mapTimedOut(now,clickedAt,maxSeconds)){
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
                    if(PgsAutoCyclePolicy.readyToAdvance(when,sceneReadyAt,minSeconds)){
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
                if(!running||stamp!=ticket)return;
                // Erro temporário de frame não anula o relógio de 60s.
                // Se a permissão Android foi negada, pausa com diagnóstico.
                if(msg.contains("permissão")||msg.contains("recusou a captura"))
                    fail("Captura bloqueada pelo Android: "+msg);
                else{
                    status("AGUARDANDO CAPTURA");
                    handler.postDelayed(()->checkMap(stamp),1500L);
                }
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
                nextIndex=0;total=0;visitedSlots.clear();
                notifiedFeedSlots.clear();
            }
            scanAndTap();
        },500L);
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
        if(teachingInProgress)return;
        if(running){showReason("Pare a busca antes de cadastrar o ícone.");return;}
        String pokemon=PgsAutoTemplateStore.pending(this);
        if(pokemon.isEmpty()){showReason("Selecione primeiro um Pokémon para cadastrar.");return;}
        if(!isGameVisible()){queueTeachingWhenReady();return;}
        teachingInProgress=true;
        if(quickMenus!=null)quickMenus.dismissAll();
        if(bubble!=null)bubble.setVisibility(View.INVISIBLE);
        // Esconde menus e o botão antes de capturar, evitando que virem modelo.
        handler.postDelayed(()->{
            if(!isGameVisible()){
                teachingInProgress=false;
                if(bubble!=null)bubble.setVisibility(View.VISIBLE);
                queueTeachingWhenReady();return;
            }
            capture(new CaptureCallback(){
            @Override public void onBitmap(Bitmap bitmap){
                try {
                    Bitmap saved=bitmap.copy(Bitmap.Config.ARGB_8888,false);
                    if(saved==null)throw new IOException("Captura vazia");
                    showPicker(saved,pokemon);
                }catch(Exception e){
                    teachingInProgress=false;
                    if(bubble!=null)bubble.setVisibility(View.VISIBLE);
                    showReason("Erro ao preparar seleção: "+e.getMessage());
                }
            }
            @Override public void onError(String msg){
                teachingInProgress=false;
                if(bubble!=null)bubble.setVisibility(View.VISIBLE);
                showReason(msg);
            }
            });
        },400L);
    }
    private void showPicker(Bitmap screenshot,String name){
        dismissPicker();
        teachingInProgress=true;
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
                boolean loaded=reloadDetector();
                status(loaded?"PARADO":"SEM MODELO");
                Toast.makeText(this,
                    loaded?name+" gravado. Iniciando a busca no feed...":
                        name+" salvo. Verifique se está selecionado na lupa.",
                    Toast.LENGTH_LONG).show();
                // O usuário já escolheu o Pokémon e tocou a amostra: não
                // exigir mais um botão oculto para iniciar o primeiro gesto.
                if(loaded&&isGameVisible()&&!running)
                    handler.postDelayed(()->{
                        if(!running&&isGameVisible())toggle();
                    },350L);
            }catch(Exception e){showReason("Não foi possível salvar o ícone: "+e.getMessage());}
            return true;
        });
        TextView help=new TextView(this);
        help.setText("Toque no CENTRO do ícone de "+name+" no feed do PGSharp. Não toque no Pokémon 3D.");
        help.setTextColor(Color.WHITE);help.setTextSize(13);
        help.setBackgroundColor(Color.rgb(22,73,93));help.setPadding(dp(10),dp(8),dp(10),dp(8));
        FrameLayout.LayoutParams hp=new FrameLayout.LayoutParams(-1,-2,Gravity.BOTTOM);
        hp.bottomMargin=dp(62);picker.addView(help,hp);
        Button cancel=new Button(this);cancel.setText("Cancelar seleção");
        cancel.setTextSize(12);cancel.setAllCaps(false);
        FrameLayout.LayoutParams cp=new FrameLayout.LayoutParams(-1,dp(56),Gravity.BOTTOM);
        picker.addView(cancel,cp);
        cancel.setOnClickListener(v->{
            PgsAutoTemplateStore.clearTeaching(this);
            dismissPicker();status("PARADO");
        });
        WindowManager.LayoutParams params=new WindowManager.LayoutParams(-1,-1,
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT);
        params.gravity=Gravity.TOP|Gravity.LEFT;
        try{windowManager.addView(picker,params);}
        catch(Exception e){dismissPicker();showReason("Não consegui abrir a seleção: "+e.getMessage());}
    }
    private void dismissPicker(){
        teachingInProgress=false;
        if(picker!=null && windowManager!=null){
            try{windowManager.removeView(picker);}catch(Exception ignored){}
            picker=null;
        }
        if(pickerBitmap!=null){pickerBitmap.recycle();pickerBitmap=null;}
        if(bubble!=null)bubble.setVisibility(View.VISIBLE);
    }

    private void capture(CaptureCallback callback){
        if(android.os.Build.VERSION.SDK_INT<30){
            callback.onError("Captura por Acessibilidade requer Android 11 ou superior.");
            return;
        }
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
        ticket++;nextIndex=0;total=0;visitedSlots.clear();notifiedFeedSlots.clear();noFreshAttempts=0;verifyMisses=0;emptyRetries=0;currentTargetName="";status(label);
    }
    /** Teste local por categoria, nunca simula detecção real. */
    public static void testPgsNotification(String type){
        PgsAutoClickService live=instance;
        if(live==null||!PgsAutoNotificationPolicy.validKind(type))return;
        live.handler.post(()->{
            String label=PgsAutoNotificationPolicy.SHINY.equals(type)?"Shiny":
                PgsAutoNotificationPolicy.NEW.equals(type)?"Novos Pokémon":"Pokémon de buscas";
            live.notifyConfigured(type,"Teste PGS · "+label,
                "Prévia local de notificação, sem encontro confirmado.",
                PgsAutoNotificationPolicy.SHINY.equals(type));
            Toast.makeText(live,"Notificação de "+label+" solicitada ao Android.",
                Toast.LENGTH_SHORT).show();
        });
    }
    public static void testShinyAlert(){
        testPgsNotification(PgsAutoNotificationPolicy.SHINY);
    }
    public static void onPgsharpShiny(String message){
        PgsAutoClickService live=instance;
        if(live!=null)live.handler.post(()->live.pauseForShiny(message));
    }
    private void pauseForShiny(String message){
        // Nunca confundir notificação de outra espécie com o alvo atual.
        // Um "Shiny: true" sem nome não comprova Lucario Shiny.
        if(!PgsAutoCyclePolicy.shouldPauseForTarget(
            message,currentTargetName,running,awaitingMap))return;
        if(awaitingMap && nextIndex<total)nextIndex++;
        running=false;awaitingMap=false;pausedByShiny=true;ticket++;
        status("✨ SHINY\nPAUSADO");
        String alert="Alvo: "+(currentTargetName.isEmpty()?"não identificado":currentTargetName)+". "+message;
        getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE).edit()
            .putString("lastShinyNotice",alert).apply();
        // Canal PGS exclusivo. O Android toca uma vez, sem ringtone duplicado.
        notifyConfigured(PgsAutoNotificationPolicy.SHINY,
            "✨ SHINY — pausa automática",alert,true);
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
    /** Usa canais privados ao PGS: cada tipo/modo/som tem ID distinto.
     * O Android gerencia DND, permissões, volume e escolha do canal.
     */
    private void notifyConfigured(String kind,String title,String body,boolean important){
        if(!PgsAutoNotificationPolicy.validKind(kind))return;
        try{
            NotificationManager manager=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
            if(manager==null)return;
            SharedPreferences prefs=getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE);
            String mode=PgsAutoNotificationPolicy.mode(kind,
                prefs.getString(kind,PgsAutoNotificationPolicy.defaultMode(kind)));
            int index=prefs.getInt(kind+"SoundIndex",PgsAutoNotificationPolicy.SHINY.equals(kind)?21:0);
            if("custom".equals(mode)&&(index<0||index>=PokeSoundLibrary.size()))
                mode="default"; // Não criar canal sem som por índice corrompido.
            String channelId=PgsAutoNotificationPolicy.channelId(kind,mode,index);
            boolean isShiny=PgsAutoNotificationPolicy.SHINY.equals(kind);
            boolean vibrate=isShiny&&prefs.getBoolean("shinyVibrate",true);
            if(isShiny)channelId+=vibrate?"_vibrate":"_no_vibrate";
            if(manager.getNotificationChannel(channelId)==null){
                String titleChannel=isShiny?"PGS · Shiny":
                    PgsAutoNotificationPolicy.NEW.equals(kind)?"PGS · Novos Pokémon":
                    "PGS · Pokémon de buscas";
                NotificationChannel channel=new NotificationChannel(channelId,titleChannel,
                    isShiny?NotificationManager.IMPORTANCE_HIGH:
                        NotificationManager.IMPORTANCE_DEFAULT);
                channel.setDescription("Exclusivo de Buscar Pokémon · não altera P1 ou P2");
                Uri sound=null;
                if("default".equals(mode))
                    sound=RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                else if("strong".equals(mode))
                    sound=RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                else if("custom".equals(mode))
                    sound=PokeSoundLibrary.soundUri(this,index);
                if(sound==null)channel.setSound(null,null);
                else channel.setSound(sound,new AudioAttributes.Builder()
                    .setUsage(isShiny?AudioAttributes.USAGE_ALARM:
                        AudioAttributes.USAGE_NOTIFICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
                channel.enableVibration(vibrate);
                manager.createNotificationChannel(channel);
            }
            Intent intent=new Intent(this,MainActivity.class);
            PendingIntent open=PendingIntent.getActivity(this,0,intent,
                PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
            Notification notification=new Notification.Builder(this,channelId)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle(title).setContentText(body)
                .setStyle(new Notification.BigTextStyle().bigText(body))
                .setContentIntent(open).setAutoCancel(true)
                .setCategory(important?Notification.CATEGORY_ALARM:Notification.CATEGORY_STATUS)
                .build();
            manager.notify(PgsAutoNotificationPolicy.notificationId(kind),notification);
        }catch(SecurityException ignored) {
            // POST_NOTIFICATIONS negada: não simular entrega de alarme.
        }catch(RuntimeException ignored) {
            // Canal/dispositivo indisponível: não interromper a automação.
        }
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

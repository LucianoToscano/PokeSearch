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
import android.widget.LinearLayout;
import android.widget.ImageView;
import android.widget.TextView;
import java.io.File;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
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
    private TextView handBadge,countdownBadge;
    private String lastStatus="PARADO";
    private long passengerHoldAt=0L;
    private boolean passengerWarningLatched=false;

    private PgsAutoMenus quickMenus;
    private PgsAutoTapIndicator tapIndicator;
    private PgsAutoTargetPicker pointPicker;
    // LT367: editor de sequências não interfere no ciclo do Auto Hunt.
    private PgsSequenceMarkers sequenceMarkers;
    private boolean sequenceActive=false;
    private int sequenceTicket=0,sequenceIndex=0;
    private int sequenceWidth=0,sequenceHeight=0;
    private long sequenceStartedAt=0L;
    private String sequenceProfile="";
    private List<PgsSequencePolicy.Step> sequencePlan=new ArrayList<>();
    private PgsAutoIconDetector sequenceDetector;
    private PgsAutoTargetPolicy.Mode tapMode=PgsAutoTargetPolicy.Mode.SPRITE;
    private boolean shinyNegativeConfirmed=false;
    private SharedPreferences targetPrefs(){
        return getSharedPreferences("pgs_auto_target_v1",MODE_PRIVATE);
    }
    private WindowManager.LayoutParams bubbleParams;
    private PgsAutoIconDetector detector;
    private FrameLayout picker;
    private Bitmap pickerBitmap;
    private boolean running=false, pausedByShiny=false, pausedByError=false;
    // Monitor passivo LT361: sessão exclusiva, sem dispatchGesture.
    private boolean watching=false,watchBusy=false;
    private int watchTicket=0;
    // LT363: métricas locais temporárias; sem capturas, conta, GPS ou rede.
    private final PgsWatchSessionDiagnostics watchMetrics=
        new PgsWatchSessionDiagnostics();
    private final java.util.HashMap<String,Long> watchLastAlert=
        new java.util.HashMap<>();
    private final Runnable watchTick=this::scanWatchOnly;
    private long lastAccountSafetyEventCheck=0L;
    private boolean awaitingMap=false;
    // LT366: cada sessão registra explicitamente seu perfil e consentimento.
    private boolean huntTapSession=false,huntWatchSession=false;
    private int huntClicks=0,mapReadFailures=0;
    private long huntNextAt=0L;
    private final Runnable huntCountdownTick=new Runnable(){
        @Override public void run(){
            if(!running||!huntTapSession||huntNextAt<=0L)return;
            long remaining=huntNextAt-SystemClock.uptimeMillis();
            if(remaining<=0L)return;
            status("PRÓXIMO EM "+((remaining+999L)/1000L)+"s");
            handler.postDelayed(this,1000L);
        }
    };
    private boolean armedByHome=false;
    private boolean teachingScheduled=false,teachingInProgress=false;
    // LT366: sensor Android opcional, acionado somente durante a sessão
    // Auto Hunt. Proximidade coberta apenas PARA; nunca retoma sozinha.
    private android.hardware.SensorManager huntSensorManager;
    private android.hardware.Sensor huntProximitySensor;
    private boolean huntProximityListening=false;
    private final android.hardware.SensorEventListener huntProximityListener=
        new android.hardware.SensorEventListener(){
            @Override public void onSensorChanged(android.hardware.SensorEvent event){
                if(event==null||event.sensor==null||event.values==null||
                   event.values.length==0||!huntProximityListening)return;
                float near=event.values[0];
                if(!Float.isFinite(near)||near<0f||
                   near>=event.sensor.getMaximumRange())return;
                boolean active=huntTapSession||huntWatchSession;
                if(!active)return;
                if(huntTapSession)halt("AUTO HUNT · SENSOR COBERTO");
                else if(huntWatchSession){
                    stopWatchOnly(true);
                    status("AUTO HUNT · SENSOR COBERTO");
                }
                notifyConfigured(PgsAutoNotificationPolicy.HUNT,
                    "Auto Hunt pausado por proximidade",
                    "Sensor do aparelho coberto. Retome manualmente quando desejar.",
                    true);
            }
            @Override public void onAccuracyChanged(
                    android.hardware.Sensor sensor,int accuracy){}
        };
    private void refreshHuntProximity(){
        boolean desired=PgsAutoHuntSettings.enabled(this)&&
            PgsAutoHuntSettings.forCurrent(this).getBoolean(
                PgsAutoHuntSettings.PROXIMITY,false)&&
            (huntTapSession||huntWatchSession);
        if(!desired){
            if(huntProximityListening&&huntSensorManager!=null)
                huntSensorManager.unregisterListener(huntProximityListener);
            huntProximityListening=false;return;
        }
        if(huntProximityListening)return;
        if(huntSensorManager==null)
            huntSensorManager=(android.hardware.SensorManager)
                getSystemService(Context.SENSOR_SERVICE);
        if(huntSensorManager==null)return;
        if(huntProximitySensor==null)huntProximitySensor=
            huntSensorManager.getDefaultSensor(
                android.hardware.Sensor.TYPE_PROXIMITY);
        if(huntProximitySensor==null)return;
        huntProximityListening=huntSensorManager.registerListener(
            huntProximityListener,huntProximitySensor,
            android.hardware.SensorManager.SENSOR_DELAY_NORMAL,handler);
    }
    private boolean isGamePackage(String pkg){
        // LT362: ambos os perfis só podem ler a janela do jogo oficial.
        // Nome contendo "pgsharp" não é prova de identidade do processo.
        // O gerenciador do Pokemod também nunca é a janela do jogo.
        return PgsAutoHostPolicy.isGameWindow(pkg);
    }
    private boolean isGameVisible(){
        // Samsung: uma janela TYPE_ACCESSIBILITY_OVERLAY do próprio PGS
        // pode ser retornada como root, embora Pokémon GO esteja ativo atrás.
        // Nunca confiar no cache de foreground quando outro app aparece.
        AccessibilityNodeInfo root=null;
        String activePackage=null;
        try{
            root=getRootInActiveWindow();
            if(root!=null&&root.getPackageName()!=null)
                activePackage=root.getPackageName().toString();
            if(isGamePackage(activePackage)){
                foreground=activePackage;return true;
            }
            if(activePackage!=null&&!getPackageName().equals(activePackage))
                return false;
            java.util.List<android.view.accessibility.AccessibilityWindowInfo> windows=getWindows();
            if(windows!=null)for(android.view.accessibility.AccessibilityWindowInfo w:windows){
                if(w==null||w.getType()!=
                    android.view.accessibility.AccessibilityWindowInfo.TYPE_APPLICATION)continue;
                if(!w.isActive()&&!w.isFocused())continue;
                AccessibilityNodeInfo game=null;
                try{
                    game=w.getRoot();
                    if(game!=null&&game.getPackageName()!=null&&
                        isGamePackage(game.getPackageName().toString())){
                        foreground=game.getPackageName().toString();
                        return true;
                    }
                }finally{if(game!=null)game.recycle();}
            }
            return false;
        }catch(RuntimeException ignored){return false;}
        finally{if(root!=null)root.recycle();}
    }
    /**
     * Inspeciona somente a janela do jogo, nunca outros apps nem o próprio
     * overlay. Aviso Unity pode não expor texto acessível: cobertura parcial.
     */
    private boolean gameAccountSafetyNoticePresent(){
        AccessibilityNodeInfo root=null;
        try{
            root=getRootInActiveWindow();
            if(root!=null&&root.getPackageName()!=null&&
                isGamePackage(root.getPackageName().toString())&&
                containsAccountSafetyNotice(root,0))return true;
            java.util.List<android.view.accessibility.AccessibilityWindowInfo> windows=getWindows();
            if(windows!=null)for(android.view.accessibility.AccessibilityWindowInfo window:windows){
                if(window==null||window.getType()!=
                    android.view.accessibility.AccessibilityWindowInfo.TYPE_APPLICATION)continue;
                if(!window.isActive()&&!window.isFocused())continue;
                AccessibilityNodeInfo game=null;
                try{
                    game=window.getRoot();
                    if(game!=null&&game.getPackageName()!=null&&
                        isGamePackage(game.getPackageName().toString())&&
                        containsAccountSafetyNotice(game,0))return true;
                }finally{if(game!=null)game.recycle();}
            }
            return false;
        }catch(RuntimeException blocked){return false;}
        finally{if(root!=null)root.recycle();}
    }
    private boolean containsAccountSafetyNotice(AccessibilityNodeInfo node,int depth){
        if(node==null||depth>12)return false;
        if(PgsAutoSafetyNoticePolicy.accountSafetyNotice(
            node.getText()==null?"":node.getText().toString())||
            PgsAutoSafetyNoticePolicy.accountSafetyNotice(
            node.getContentDescription()==null?"":node.getContentDescription().toString()))
            return true;
        for(int i=0;i<node.getChildCount();i++){
            AccessibilityNodeInfo child=node.getChild(i);
            if(child==null)continue;
            try{if(containsAccountSafetyNotice(child,depth+1))return true;}
            finally{child.recycle();}
        }
        return false;
    }
    private boolean passengerPromptPresent(){
        // Aviso de velocidade do jogo exige declaração MANUAL do usuário.
        // Nunca gerar gesto sobre "Sou passageiro" ou "I'm a passenger".
        AccessibilityNodeInfo root=null;
        try{
            root=getRootInActiveWindow();
            if(root!=null&&root.getPackageName()!=null&&
                isGamePackage(root.getPackageName().toString())&&
                containsPassengerLabel(root,0))return true;
            // A própria bolha pode ser a raiz ativa: procurar o diálogo
            // também na janela de aplicação focada, nunca tocar nele.
            java.util.List<android.view.accessibility.AccessibilityWindowInfo> windows=getWindows();
            if(windows!=null)for(android.view.accessibility.AccessibilityWindowInfo w:windows){
                if(w==null||w.getType()!=
                    android.view.accessibility.AccessibilityWindowInfo.TYPE_APPLICATION)continue;
                if(!w.isActive()&&!w.isFocused())continue;
                AccessibilityNodeInfo game=null;
                try{
                    game=w.getRoot();
                    if(game!=null&&game.getPackageName()!=null&&
                        isGamePackage(game.getPackageName().toString())&&
                        containsPassengerLabel(game,0))return true;
                }finally{if(game!=null)game.recycle();}
            }
            return false;
        }catch(RuntimeException ignored){return false;}
        finally{if(root!=null)root.recycle();}
    }
    /**
     * Confirmação de segurança do jogo é sempre humana: NUNCA tocar no
     * aviso "Sou passageiro". A busca fica em espera, com um único aviso
     * visível, e retoma a leitura após desaparecer o diálogo.
     */
    private boolean holdForPassengerPrompt(){
        // Bloquear imediatamente antes de QUALQUER gesto, além de avisos
        // disparados por eventos de acessibilidade. Não auto-dismissar.
        if(gameAccountSafetyNoticePresent()){
            if(running)fail("Aviso de segurança da conta no jogo. "+
                "Revisão manual necessária; toque automático bloqueado.");
            else status("REVISE AVISO DA CONTA");
            return true;
        }
        boolean visible=passengerPromptPresent();
        if(visible){
            if(!passengerWarningLatched){
                passengerWarningLatched=true;
                String message="Aviso do jogo: confirme manualmente apenas se você "+
                    "for realmente passageiro e não estiver dirigindo. "+
                    "A busca retomará após a mensagem desaparecer.";
                Toast.makeText(this,message,Toast.LENGTH_LONG).show();
                notifyUser("PGS: confirmação manual necessária",
                    "Sou passageiro: confirme no jogo somente quando for seguro. "+
                    "Nenhum toque automático será feito nesse aviso.",false);
                BugReport.log(this,"PGS",
                    "Confirmação de segurança detectada. Aguardando usuário, sem gesto.");
            }
            status("CONFIRME MANUALMENTE");
            return true;
        }
        if(passengerWarningLatched){
            passengerWarningLatched=false;
            if(running){
                status("RETOMANDO BUSCA");
                BugReport.log(this,"PGS",
                    "Aviso saiu da tela; retomada da leitura após ação humana");
            }
        }
        return false;
    }

    private boolean containsPassengerLabel(AccessibilityNodeInfo node,int depth){
        if(node==null||depth>12)return false;
        CharSequence text=node.getText(),desc=node.getContentDescription();
        String combined=(text==null?"":text.toString())+" "+(desc==null?"":desc.toString());
        String normalized=combined.toLowerCase(java.util.Locale.ROOT);
        if(normalized.contains("sou passageiro")||
           normalized.contains("sou um passageiro")||
           normalized.contains("i'm a passenger")||
           normalized.contains("i’m a passenger")||
           normalized.contains("i am a passenger")||
           normalized.contains("estou seguro")||
           normalized.contains("estou em segurança")||
           normalized.contains("i am safe")||
           normalized.contains("i'm safe")||
           normalized.contains("i’m safe"))return true;
        for(int i=0;i<node.getChildCount();i++){
            AccessibilityNodeInfo child=node.getChild(i);
            if(child==null)continue;
            try{if(containsPassengerLabel(child,depth+1))return true;}
            finally{child.recycle();}
        }
        return false;
    }
    private final Runnable armedStartTick=new Runnable(){
        @Override public void run(){
            if(!armedByHome||running||teachingInProgress)return;
            if(isGameVisible())startArmedSearch();
            if(armedByHome&&!running)handler.postDelayed(this,1000L);
        }
    };
    private void scheduleArmedStart(){
        handler.removeCallbacks(armedStartTick);
        if(armedByHome)handler.postDelayed(armedStartTick,600L);
    }
    /** Pedido da Home ou do overlay: só captura o feed quando PGSharp estiver visível. */
    public static void requestTeaching(String species){
        PgsAutoClickService live=instance;
        if(live==null)return;
        live.handler.post(()->{
            live.stopWatchOnly(true); // Não capturar em paralelo ao tutorial.
            if(live.running)live.halt("CADASTRANDO");
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
                "Abra o feed de "+
                PgsAutoHostPolicy.displayLabel(PgsAutoHostSettings.current(this))+
                " no jogo. A seleção do ícone de "+
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
    // LT354: compare a map sample from BEFORE the gesture with subsequent
    // frames. A stable, unchanged map must never prove a game reaction.
    private int[] sceneBeforeGesture;
    private boolean sceneChangedAfterGesture=false,sceneUnchangedLogged=false;
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
        if(PgsAutoWatchSettings.enabled(this)){
            startWatchOnly();
            if(watching&&PgsAutoHuntSettings.enabled(this)&&
                !PgsAutoHuntSettings.forCurrent(this).getBoolean(
                    PgsAutoHuntSettings.CLICK_ENABLED,false)){
                huntWatchSession=true;
                refreshHuntProximity();
            }
        }
        armedByHome=getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE)
            .getBoolean("armFromHome",false);
        if(!PgsAutoTemplateStore.pending(this).isEmpty())queueTeachingWhenReady();
        if(watching){
            armedByHome=false;
            getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE).edit()
                .putBoolean("armFromHome",false).apply();
        }
        if(armedByHome&&isGameVisible())startArmedSearch();
        else scheduleArmedStart();
    }

    @Override public void onAccessibilityEvent(AccessibilityEvent event) {
        if(event==null||event.getPackageName()==null)return;
        int type=event.getEventType();
        String pkg=event.getPackageName().toString();
        // Notificações de conteúdo do jogo podem aparecer sem trocar a janela.
        if(type==AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED){
            if(!running||!isGamePackage(pkg))return;
            long now=SystemClock.uptimeMillis();
            // ContentChanged pode chegar várias vezes por segundo no Unity.
            // Gesto sempre revalida o aviso sem depender desse intervalo.
            if(now-lastAccountSafetyEventCheck<450L)return;
            lastAccountSafetyEventCheck=now;
            if(gameAccountSafetyNoticePresent())
                fail("Aviso de segurança da conta detectado. Revise no jogo "+
                    "manualmente; nenhuma ação automática será realizada.");
            return;
        }
        if(type!=AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED &&
            type!=AccessibilityEvent.TYPE_WINDOWS_CHANGED)return;
        // Acessibilidade pode anunciar NOSSA bolha como janela superior.
        // Nunca sobrescrever o jogo por causa dos menus do próprio PokeSearch.
        if(pkg.equals(getPackageName()))return;
        foreground=pkg;
        if(running&&isGamePackage(pkg)&&gameAccountSafetyNoticePresent()){
            fail("Aviso de segurança da conta detectado. Revise no jogo "+
                "manualmente; nenhuma ação automática será realizada.");
            return;
        }
        if(isGameVisible()&&armedByHome)startArmedSearch();
        else if(isGameVisible()&&!PgsAutoTemplateStore.pending(this).isEmpty())
            queueTeachingWhenReady();
        else if(armedByHome)scheduleArmedStart();
    }
    private void startArmedSearch(){
        if(!armedByHome||running||teachingInProgress)return;
        // Reativar a partir dos modelos SALVOS, sem obrigar nova captura.
        // Uma seleção de ensino antiga não deve bloquear a retomada.
        if(PgsAutoTargetPolicy.mode(targetPrefs().getString("mode","SPRITE"))!=
                PgsAutoTargetPolicy.Mode.SPRITE){
            armedByHome=false;
            getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE).edit()
                .putBoolean("armFromHome",false).apply();
            toggle();return;
        }
        if(!PgsAutoTemplateStore.pending(this).isEmpty()){
            boolean existing=false;
            for(PgsAutoTemplateStore.Model model:PgsAutoTemplateStore.active(this))
                if(PgsAutoCatalog.isSelectedName(this,model.name)){existing=true;break;}
            if(existing)PgsAutoTemplateStore.clearTeaching(this);
            else {queueTeachingWhenReady();return;}
        }
        armedByHome=false;
        getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE).edit()
            .putBoolean("armFromHome",false).apply();
        if(PgsAutoTargetPolicy.mode(targetPrefs().getString("mode","SPRITE"))==
                PgsAutoTargetPolicy.Mode.SPRITE&&!reloadDetector()){
            status("SEM MODELO");
            showReason("Ícone não cadastrado para os Pokémon selecionados. "+
                "Abra a lupa e grave uma imagem do feed do PGSharp.");
            return;
        }
        toggle();
    }

    @Override public void onConfigurationChanged(android.content.res.Configuration config){
        super.onConfigurationChanged(config);
        // Nunca reenquadrar pontos gravados durante gesto/rotação em curso.
        stopSequence("SEQUÊNCIA · ROTAÇÃO");
        // Rotation/resolution: clamp bubble and move the existing menu with it.
        handler.post(()->{
            if(bubble==null||bubbleParams==null||windowManager==null)return;
            Point display=new Point();windowManager.getDefaultDisplay().getRealSize(display);
            bubbleParams.x=Math.max(0,Math.min(
                display.x-dp(PgsAutoVisualState.TOUCH_DP),bubbleParams.x));
            bubbleParams.y=Math.max(0,Math.min(
                display.y-dp(PgsAutoVisualState.TOUCH_DP),bubbleParams.y));
            try{windowManager.updateViewLayout(bubble,bubbleParams);}catch(Exception ignored){}
            if(quickMenus!=null&&quickMenus.isOpen())
                quickMenus.reanchor(display.x-bubbleParams.x-
                    dp(PgsAutoVisualState.TOUCH_DP/2),bubbleParams.y);
        });
    }

    @Override public void onInterrupt() {
        stopSequence("SEQUÊNCIA · SERVIÇO INTERROMPIDO");
        // Uma perda temporária do foco de acessibilidade não equivale a "desligar".
        // Nenhum gesto/captura enquanto a janela ativa não é o jogo.
        status(watching?"MONITOR · AGUARDANDO JOGO":"AGUARDANDO JOGO");
    }
    @Override public void onDestroy() {
        // Perda do serviço invalida leituras, mas não revoga opt-in do usuário.
        // A Home exibirá falta de Acessibilidade até uma reconexão autorizada.
        stopWatchOnly(false);
        stopSequence("PARADO");
        halt("PARADO");
        if(quickMenus!=null)quickMenus.dismissAll();
        if(tapIndicator!=null){tapIndicator.clear();tapIndicator=null;}
        if(bubble!=null&&windowManager!=null) {
            try {windowManager.removeView(bubble);}catch(Exception ignored){}
        }
        
        
        if(handView!=null)handView.clearAnimation();
        if(coreIndicator!=null)coreIndicator.clearAnimation();
        handView=null;coreIndicator=null;coreBackground=null;
        currentCore=null;currentArtworkOn=null;handBadge=null;countdownBadge=null;
        dismissPicker();
        if(pointPicker!=null){pointPicker.close();pointPicker=null;}
        analysis.shutdownNow();
        bubble=null;instance=null;
        super.onDestroy();
    }

    private void showBubble() {
        windowManager=(WindowManager)getSystemService(WINDOW_SERVICE);
        if(bubble!=null)return;
        if(tapIndicator==null&&windowManager!=null)
            tapIndicator=new PgsAutoTapIndicator(this,windowManager);
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
        handView.setImageResource(R.drawable.busca_pokemon_off);
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
        countdownBadge=new TextView(this);
        countdownBadge.setTextSize(9);
        countdownBadge.setTextColor(Color.WHITE);
        countdownBadge.setGravity(Gravity.CENTER);
        countdownBadge.setBackground(roundedCounter());
        countdownBadge.setVisibility(View.GONE);
        FrameLayout.LayoutParams counterLp=new FrameLayout.LayoutParams(
            dp(21),dp(13),Gravity.BOTTOM|Gravity.RIGHT);
        bubble.addView(countdownBadge,counterLp);
        quickMenus=new PgsAutoMenus(this,windowManager,new PgsAutoMenus.Actions(){
            @Override public void teach(String species){
                requestTeaching(species);
            }
            @Override public void closeOverlay(){removeHand();}
            @Override public void testNotification(String type){testPgsNotification(type);}
            @Override public void setWatchEnabled(boolean enabled){setWatchOnly(enabled);}
            @Override public void modelsChanged(){PgsAutoClickService.modelsChanged();}
            @Override public void appearanceChanged(){refreshAppearance();}
            @Override public void previewTapIndicator(){
                // Apenas prévia local: nenhum dispatchGesture é enviado.
                if(!getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE)
                    .getBoolean("showTapIndicator",true)){
                    Toast.makeText(PgsAutoClickService.this,
                        "Ative Mostrar local do toque para ver a prévia.",
                        Toast.LENGTH_SHORT).show();
                    return;
                }
                if(tapIndicator==null&&windowManager!=null)
                    tapIndicator=new PgsAutoTapIndicator(PgsAutoClickService.this,windowManager);
                if(tapIndicator!=null){
                    Point screen=new Point();
                    windowManager.getDefaultDisplay().getRealSize(screen);
                    tapIndicator.show(screen.x/2,screen.y/2);
                    Toast.makeText(PgsAutoClickService.this,
                        "Prévia visual — nenhum toque enviado ao jogo.",
                        Toast.LENGTH_SHORT).show();
                }
            }
            @Override public void previewSprites(){preview();}
            @Override public void choosePoint(String mode){
                stopWatchOnly(true);
                showTargetSelector(mode);
            }
            @Override public void selectSprites(){
                if(running)halt("ALVO ALTERADO");tapMode=PgsAutoTargetPolicy.Mode.SPRITE;
                status("SPRITES DO FEED");
            }
            @Override public void sequencePick(String type,int index,boolean dest){
                pickSequencePoint(type,index,dest);
            }
            @Override public void sequencePreview(){previewSequence();}
            @Override public void sequenceRun(){startSequence();}
            @Override public void sequenceStop(){stopSequence("SEQUÊNCIA PARADA");}
            @Override public void sequenceChanged(){
                stopSequence("SEQUÊNCIA ALTERADA");
                if(sequenceMarkers!=null)sequenceMarkers.close();
            }
            @Override public boolean sequenceRunning(){return sequenceActive;}
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
                    if(quickMenus!=null&&quickMenus.isOpen())
                        quickMenus.reanchor(display.x-bubbleParams.x-
                            dp(PgsAutoVisualState.TOUCH_DP/2),bubbleParams.y);
                }
                return true;
            }
            if(action==MotionEvent.ACTION_UP){
                if(moved[0]){
                    prefs.edit().putInt("bubbleX",bubbleParams.x)
                        .putInt("bubbleY",bubbleParams.y).apply();
                    // Barra e submenu ficam ancorados após soltar o dedo.
                    if(quickMenus!=null&&quickMenus.isOpen()){
                        Point screen=new Point();windowManager.getDefaultDisplay().getRealSize(screen);
                        quickMenus.reanchor(screen.x-bubbleParams.x-
                            dp(PgsAutoVisualState.TOUCH_DP/2),bubbleParams.y);
                    }
                }else if(SystemClock.uptimeMillis()-pressAt[0]>=570){
                    if(!PgsAutoTemplateStore.pending(PgsAutoClickService.this).isEmpty()){
                        queueTeachingWhenReady();
                        return true;
                    }
                    Point display=new Point();windowManager.getDefaultDisplay().getRealSize(display);
                    int left=display.x-bubbleParams.x-dp(22);
                    quickMenus.toggle(left,bubbleParams.y);
                }else {
                    // Toque com menu aberto apenas retrai o menu.
                    if(quickMenus!=null&&quickMenus.isOpen()){
                        quickMenus.collapseOneLevel();return true;
                    }
                    toggle();
                }
                return true;
            }
            return action==MotionEvent.ACTION_CANCEL;
        });
        try{windowManager.addView(bubble,bubbleParams);}
        catch(Exception e){Toast.makeText(this,"Não foi possível abrir o botão Busca Pokémon",Toast.LENGTH_LONG).show();}
        refreshAppearance();
        status("PARADO");
    }
    private GradientDrawable roundedCounter(){
        GradientDrawable bg=new GradientDrawable();
        bg.setColor(0xD9212C3B);bg.setCornerRadius(dp(4));
        bg.setStroke(dp(1),0x99FFFFFF);
        return bg;
    }
    private void refreshAppearance(){
        SharedPreferences p=getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE);
        String size=p.getString("iconScale","M");
        int dpSize="P".equals(size)?17:"G".equals(size)?25:21;
        if(handView!=null&&handView.getLayoutParams()!=null){
            FrameLayout.LayoutParams params=(FrameLayout.LayoutParams)handView.getLayoutParams();
            params.width=dp(dpSize);params.height=dp(dpSize);
            handView.setLayoutParams(params);
        }
        status(lastStatus);
    }
    public static void closeHand(){
        PgsAutoClickService live=instance;
        if(live!=null)live.handler.post(live::removeHand);
    }
    public static void activateFromHome(){
        PgsAutoClickService live=instance;
        if(live==null)return;
        live.handler.post(()->{
            live.stopWatchOnly(true); // Home pediu busca; monitor passivo é exclusivo.
            live.showBubble();
            live.armedByHome=true;
            live.getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE).edit()
                .putBoolean("armFromHome",true).apply();
            if(live.isGameVisible())live.startArmedSearch();
            else live.scheduleArmedStart();
        });
    }
    /** A Home reflete se a bolha está visível, independente da varredura. */
    public static boolean isOverlayVisible(){
        PgsAutoClickService live=instance;
        return live!=null&&live.bubble!=null&&
            live.bubble.getVisibility()==View.VISIBLE;
    }
    /** Reage imediatamente quando a pessoa revoga o Auto Hunt/click ativo. */
    public static void huntSettingsChanged(){
        PgsAutoClickService live=instance;
        if(live==null)return;
        live.handler.post(()->{
            if(live.huntTapSession&&(!PgsAutoHuntSettings.enabled(live)||
                !PgsAutoHuntSettings.forCurrent(live).getBoolean(
                    PgsAutoHuntSettings.CLICK_ENABLED,false)))
                live.halt("AUTO HUNT · DESATIVADO");
            if(live.huntWatchSession&&!PgsAutoHuntSettings.enabled(live)){
                live.stopWatchOnly(true);
                live.status("AUTO HUNT · DESATIVADO");
            }
            live.refreshHuntProximity();
        });
    }
    public static void modelsChanged(){
        PgsAutoClickService live=instance;
        if(live!=null)live.handler.post(()->{
            live.stopWatchOnly(true); // Nunca migrar sessão para outro perfil.
            if(live.running)live.halt("PARADO");
            live.reloadDetector();
            live.status("PARADO");
        });
    }
    /**
     * LT362: só informa o estado do monitor passivo à Home.
     * Nunca consulta estado de gesto/teleporte para classificá-lo como favorito.
     */
    /** Snapshot RAM, solicitado apenas ao abrir o diagnóstico. */
    public static String monitorDiagnostics(){
        PgsAutoClickService live=instance;
        return live==null?"Serviço de Acessibilidade desconectado; sem métricas.": 
            live.watchMetrics.summary();
    }
    public static String monitorHomeState(Context context){
        boolean optedIn=PgsAutoWatchSettings.enabled(context);
        PgsAutoClickService live=instance;
        if(live==null)return PgsAutoWatchUiPolicy.resolve(
            optedIn,false,false,false,false,false);
        boolean hasModel=live.detector!=null&&live.detector.templateCount()>0;
        boolean gameVisible=optedIn&&live.watching&&live.isGameVisible();
        boolean safe=gameVisible&&
            !live.gameAccountSafetyNoticePresent()&&
            !live.passengerPromptPresent()&&
            !(live.quickMenus!=null&&live.quickMenus.hasPanel())&&
            !live.running&&!live.teachingInProgress&&!live.teachingScheduled;
        boolean confirmed=live.lastStatus.contains("FAVORITO(S)");
        return PgsAutoWatchUiPolicy.resolve(
            optedIn,true,live.watching,hasModel,safe,confirmed);
    }
    public static String searchStatus(){
        PgsAutoClickService live=instance;
        if(live==null)return "Acessibilidade desligada";
        if(live.armedByHome&&!live.isGameVisible())
            return "Abra o feed de "+
                PgsAutoHostPolicy.displayLabel(PgsAutoHostSettings.current(live))+
                " no jogo";
        if(live.watching)return live.isGameVisible()?
            "Monitorando favoritos · sem clique":"Monitor pausado · abra o jogo";
        if(live.running&&!live.isGameVisible())return "Abra o jogo";
        if(live.running&&live.awaitingMap)return "Aguardando mapa";
        if(live.running)return "Procurando ícones";
        if(live.pausedByError)return "Erro · verificar acesso";
        if(live.pausedByShiny)return "Shiny confirmado";
        return "Parado";
    }
    private void removeHand(){
        stopWatchOnly(true);
        armedByHome=false;
        getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE).edit()
            .putBoolean("armFromHome",false).apply();
        halt("FECHADO");
        if(tapIndicator!=null)tapIndicator.clear();
        if(quickMenus!=null)quickMenus.dismissAll();
        if(bubble!=null&&windowManager!=null){
            try{windowManager.removeView(bubble);}catch(Exception ignored){}
            bubble=null;
        }
        if(coreIndicator!=null)coreIndicator.clearAnimation();
        coreIndicator=null;coreBackground=null;handView=null;handBadge=null;countdownBadge=null;
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
        return live!=null && (live.watching||PgsAutoVisualState.active(
            live.running,live.pausedByShiny,live.pausedByError));
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
        lastStatus=value;
        if(bubble==null)return;
        boolean shiny=pausedByShiny||value.contains("SHINY");
        boolean on=watching||PgsAutoVisualState.active(
            running,pausedByShiny,pausedByError);
        if(handView!=null&&(!Boolean.valueOf(on).equals(currentArtworkOn))){
            handView.setImageResource(on?
                R.drawable.busca_pokemon_on:R.drawable.busca_pokemon_off);
            currentArtworkOn=on;
        }
        if(watching)setCoreState(PgsAutoVisualState.Core.WHITE);
        else setCoreState(PgsAutoVisualState.core(running,awaitingMap,pausedByError,value));
        if(handBadge!=null){
            handBadge.setText(watching?"◎":shiny?"✨":
                value.contains("PAUSADO")?"!":"");
            handBadge.setVisibility(watching||shiny||
                value.contains("PAUSADO")?View.VISIBLE:View.GONE);
        }
        if(countdownBadge!=null){
            boolean enabled=huntTapSession?
                PgsAutoHuntSettings.forCurrent(this).getBoolean(
                    PgsAutoHuntSettings.SHOW_COOLDOWN,false):
                getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE)
                    .getBoolean("showCountdown",false);
            if(enabled&&running&&(awaitingMap||
                (huntTapSession&&huntNextAt>SystemClock.uptimeMillis()))){
                long now=SystemClock.uptimeMillis();
                long remaining=awaitingMap?(sceneReadyAt>0?
                    sceneReadyAt+minSeconds*1000L-now:
                    clickedAt+maxSeconds*1000L-now):huntNextAt-now;
                countdownBadge.setText(String.valueOf(Math.max(0,(remaining+999)/1000L)));
                countdownBadge.setVisibility(View.VISIBLE);
            }else countdownBadge.setVisibility(View.GONE);
        }
        bubble.setAlpha(1f); // Estado OFF fica na arte, não num quadrado translúcido.
        bubble.setContentDescription("PGS Busca Pokémon: "+value+
            (on?", ligado":", desligado")+
            (watching?". Monitor somente leitura: toque para parar.":
             ". Toque para ligar/desligar; segure para abrir menus."));
    }
    private boolean reloadDetector(){
        try{
            detector=new PgsAutoIconDetector(this);
            int deferred=PgsAutoNativeModels.deferredCount();
            if(deferred>0)BugReport.log(this,"PGS",
                "LT357: "+deferred+" variantes nativas adiadas pelo limite "+
                "de recursos; não são modelos ativos, sem clique cego");
            if(detector.templateCount()>0)return true;
            showReason(detector.selectedModelCount()>0?
                "Modelo selecionado sem pixels úteis ou arquivo ausente. "+
                "Abra a lupa e recorte a sprite novamente, sem fundo opcional.":
                "Selecione uma espécie e salve ao menos uma sprite do feed.");
            return false;
        }catch(IOException e){
            detector=null;
            showReason("Falha ao carregar modelo: "+e.getMessage());
            return false;
        }
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
        // Uma só migração do valor legado 60s; preservar valores distintos
        // e mudanças explícitas feitas pelo usuário após a LT344.
        if(!p.getBoolean("lt344_default_25_migrated",false)){
            SharedPreferences.Editor e=p.edit().putBoolean("lt344_default_25_migrated",true);
            if(!p.getBoolean("lt344_timeout_user_set",false)&&
                p.getInt("load_timeout",60)==60)e.putInt("load_timeout",25);
            e.apply();
        }
        return p;
    }
    private void loadSettings(){
        SharedPreferences p=cyclePrefs(this);
        limit=PgsAutoCatalog.MAX_SELECTED;
        minSeconds=PgsAutoCyclePolicy.shinyCheckSeconds(
            p.getInt("post_load",PgsAutoCyclePolicy.DEFAULT_SHINY_CHECK_SECONDS));
        maxSeconds=PgsAutoCyclePolicy.mapTimeoutSeconds(
            p.getInt("load_timeout",PgsAutoCyclePolicy.DEFAULT_MAP_TIMEOUT_SECONDS));
    }
    private float setting(SharedPreferences p,String key,float def){
        try{return Float.parseFloat(p.getString(key,String.valueOf(def)));}catch(Exception ignored){return def;}
    }


    /** Posição confirmada, vinculada à resolução exata: jamais clicar após
     * rotação/popup/escala diferente sem uma nova escolha humana. */
    private boolean validTarget(){
        SharedPreferences p=targetPrefs();
        Point display=new Point();windowManager.getDefaultDisplay().getRealSize(display);
        return p.getBoolean("confirmed",false)&&PgsAutoTargetPolicy.valid(
            p.getFloat("fx",Float.NaN),p.getFloat("fy",Float.NaN),
            p.getInt("screenW",0),p.getInt("screenH",0),display.x,display.y);
    }
    private void showTargetSelector(String name){
        PgsAutoTargetPolicy.Mode requested=PgsAutoTargetPolicy.mode(name);
        if(requested==PgsAutoTargetPolicy.Mode.SPRITE){
            targetPrefs().edit().putString("mode","SPRITE").apply();
            if(running)halt("ALVO ALTERADO");
            status("SPRITES DO FEED");return;
        }
        if(running)halt("CONFIGURANDO MIRA");
        if(!isGameVisible()||passengerPromptPresent()){
            showReason("Abra o mapa do jogo sem avisos para posicionar a mira.");
            return;
        }
        if(pointPicker!=null){pointPicker.close();pointPicker=null;}
        if(quickMenus!=null)quickMenus.dismissAll();
        if(bubble!=null)bubble.setVisibility(View.GONE);
        pointPicker=PgsAutoTargetPicker.open(this,windowManager,name,
            new PgsAutoTargetPicker.Callback(){
                @Override public void confirmed(float fx,float fy,int w,int h){
                    targetPrefs().edit().putFloat("fx",fx).putFloat("fy",fy)
                        .putInt("screenW",w).putInt("screenH",h)
                        .putString("mode",requested.name())
                        .putBoolean("confirmed",true).apply();
                    tapMode=requested;pointPicker=null;
                    if(bubble!=null)bubble.setVisibility(View.VISIBLE);
                    status("MIRA SALVA · "+requested.name());
                    Toast.makeText(PgsAutoClickService.this,
                        "Ponto confirmado. Toque na bolha para iniciar com o mapa aberto.",
                        Toast.LENGTH_LONG).show();
                }
                @Override public void cancelled(){
                    pointPicker=null;
                    if(bubble!=null)bubble.setVisibility(View.VISIBLE);
                    status("MIRA CANCELADA");
                }
            });
    }
    /** Reconhece o mapa antes de tocar uma coordenada; não usa texto/imagem
     * antiga do feed como prova de que o PokéStop ou ponto ainda está lá. */
    private void scanFixedTarget(){
        if(!running||awaitingMap)return;
        if(!validTarget()){
            fail("Resolução ou posição mudou: confirme novamente a mira.");
            return;
        }
        final int stamp=++ticket;
        status("CONFIRMANDO MAPA");
        capture(new CaptureCallback(){
            @Override public void onBitmap(Bitmap bitmap){
                if(!running||stamp!=ticket)return;
                boolean loaded=PgsAutoMapReadiness.analyze(bitmap).scenePopulated;
                int[] colors=sampleMap(bitmap);
                if(lastColors!=null&&difference(lastColors,colors)<=10f&&loaded)
                    stableRepeats++;
                else stableRepeats=0;
                lastColors=colors;
                // Dois frames estáveis, não uma única captura cheia de ícones.
                if(!loaded||stableRepeats<1){
                    if(++emptyRetries>=12){
                        fail("Mapa não confirmado após várias capturas. Sem toque automático.");
                        return;
                    }
                    status("AGUARDANDO MAPA");
                    handler.postDelayed(()->{
                        if(running&&ticket==stamp)scanAndTap();
                    },1500L);
                    return;
                }
                emptyRetries=0;
                Point display=new Point();windowManager.getDefaultDisplay().getRealSize(display);
                SharedPreferences prefs=targetPrefs();
                float fx=prefs.getFloat("fx",Float.NaN),fy=prefs.getFloat("fy",Float.NaN);
                if(!PgsAutoTargetPolicy.valid(fx,fy,
                    prefs.getInt("screenW",0),prefs.getInt("screenH",0),
                    display.x,display.y)){
                    fail("A mira não corresponde à resolução atual.");return;
                }
                int x=PgsAutoTargetPolicy.pointX(fx,display.x);
                int y=PgsAutoTargetPolicy.pointY(fy,display.y,tapMode,
                    prefs.getInt("stopOffsetPx",24));
                if(y>=display.y*.91f){
                    fail("Ponto muito próximo dos controles inferiores. Reposicione.");
                    return;
                }
                // Verificação final imediatamente antes de gestos acessíveis.
                if(!PgsAutoTargetPolicy.safeToTap(isGameVisible(),
                    passengerPromptPresent(),loaded,validTarget())){
                    status("AGUARDANDO JOGO");return;
                }
                tapFixedTarget(x,y);
            }
            @Override public void onError(String message){
                if(running&&stamp==ticket)fail("Falha na captura do mapa: "+message);
            }
        });
    }
    private void tapFixedTarget(int x,int y){
        if(!running)return;
        if(holdForPassengerPrompt()){
            handler.postDelayed(()->{if(running)scanAndTap();},1200L);
            return;
        }
        if(!isGameVisible()){
            handler.postDelayed(()->{if(running)scanAndTap();},1200L);
            return;
        }
        final PgsAutoTargetPolicy.Mode action=tapMode;
        final int oldTicket=ticket;
        status("TOQUE · "+action.name());
        BugReport.log(this,"PGS","Mira: gesto solicitado após mapa confirmado; resultado no jogo não verificado");
        Path path=new Path();path.moveTo(x,y);
        GestureDescription gesture=new GestureDescription.Builder()
            .addStroke(new GestureDescription.StrokeDescription(path,0,90L)).build();
        boolean accepted=dispatchGesture(gesture,new GestureResultCallback(){
            @Override public void onCompleted(GestureDescription g){handler.post(()->{
                if(!running||ticket!=oldTicket)return;
                clickedAt=SystemClock.uptimeMillis();
                shinyNegativeConfirmed=false;
                passengerHoldAt=0L;sceneReadyAt=0L;loadedStreak=0;
                lastColors=null;stableRepeats=0;
                currentTargetName=action.name();
                final int stamp=++ticket;
                if(action==PgsAutoTargetPolicy.Mode.ENCOUNTER){
                    status("CONFIRMANDO ENCONTRO");
                    handler.postDelayed(()->checkEncounterThenSwipe(stamp),1200L);
                }else{
                    awaitingMap=true;
                    status("AGUARDANDO MAPA");
                    handler.postDelayed(()->checkMap(stamp),1300L);
                }
                BugReport.log(PgsAutoClickService.this,"PGS",
                    "Mira: gesto Android concluído; ação no jogo ainda sem confirmação");
            });}
            @Override public void onCancelled(GestureDescription g){
                handler.post(()->fail("Gesto cancelado pelo Android."));
            }
        },null);
        if(!accepted)fail("Android recusou gesto da mira.");
        else{
            if(tapIndicator!=null)tapIndicator.show(x,y);
            handler.postDelayed(()->{
            if(running&&ticket==oldTicket)
                fail("Sem confirmação do gesto Android para o ponto escolhido.");
            },3500L);
        }
    }
    /** Evita deslizamento cego em telas que podem ser mapa, aviso ou menu.
     * O jogo precisa expor as pistas nativas de um encontro; sem isso pausa. */
    private boolean encounterWindowConfirmed(){
        AccessibilityNodeInfo root=null;
        try{
            root=getRootInActiveWindow();
            if(root==null||root.getPackageName()==null||
                !isGamePackage(root.getPackageName().toString()))return false;
            StringBuilder details=new StringBuilder();
            collectEncounterLabels(root,details,0);
            String evidence=details.toString().toLowerCase(java.util.Locale.ROOT);
            boolean ball=evidence.contains("poké ball")||
                evidence.contains("poke ball")||evidence.contains("pokeball");
            boolean exit=evidence.contains("fugir")||evidence.contains("run away")||
                evidence.contains("flee encounter");
            return ball&&exit;
        }catch(RuntimeException ignored){return false;}
        finally{if(root!=null)root.recycle();}
    }
    private void collectEncounterLabels(AccessibilityNodeInfo node,StringBuilder out,int depth){
        if(node==null||depth>8||out.length()>9000)return;
        if(node.getText()!=null)out.append(' ').append(node.getText());
        if(node.getContentDescription()!=null)
            out.append(' ').append(node.getContentDescription());
        for(int i=0;i<node.getChildCount();i++){
            AccessibilityNodeInfo child=node.getChild(i);
            if(child!=null)try{collectEncounterLabels(child,out,depth+1);}
            finally{child.recycle();}
        }
    }
    private void checkEncounterThenSwipe(int stamp){
        if(!running||ticket!=stamp)return;
        if(holdForPassengerPrompt()){
            handler.postDelayed(()->checkEncounterThenSwipe(stamp),1200L);
            return;
        }
        if(!isGameVisible()){
            fail("Encontro interrompido: jogo não está visível.");return;
        }
        capture(new CaptureCallback(){
            @Override public void onBitmap(Bitmap bitmap){
                if(!running||ticket!=stamp)return;
                boolean map=PgsAutoMapReadiness.analyze(bitmap).scenePopulated;
                if(map||!encounterWindowConfirmed()){
                    fail("Encontro não comprovado. Sem gesto de deslizar automático.");
                    return;
                }
                Point size=new Point();windowManager.getDefaultDisplay().getRealSize(size);
                Path swipe=new Path();
                swipe.moveTo(size.x*.5f,size.y*.78f);
                swipe.lineTo(size.x*.5f,size.y*.43f);
                GestureDescription gesture=new GestureDescription.Builder()
                    .addStroke(new GestureDescription.StrokeDescription(swipe,0,250L))
                    .build();
                boolean accepted=dispatchGesture(gesture,new GestureResultCallback(){
                    @Override public void onCompleted(GestureDescription g){
                        handler.post(()->{
                            if(!running||stamp!=ticket)return;
                            halt("DESLIZOU · VALIDAR NO JOGO");
                            BugReport.log(PgsAutoClickService.this,"PGS",
                                "Deslizamento concluído pelo Android, efeito no jogo não certificado");
                        });
                    }
                    @Override public void onCancelled(GestureDescription g){
                        handler.post(()->fail("Deslizamento cancelado pelo Android."));
                    }
                },null);
                if(!accepted)fail("Android não autorizou o deslizamento.");
                else if(tapIndicator!=null)
                    tapIndicator.show(Math.round(size.x*.5f),Math.round(size.y*.78f));
            }
            @Override public void onError(String msg){
                if(running&&ticket==stamp)fail("Sem prova da tela de encontro: "+msg);
            }
        });
    }

    /** LT367: abre a mira nativa para os pontos de ações locais. */
    private boolean sequenceLandscape(){
        Point p=new Point();windowManager.getDefaultDisplay().getRealSize(p);
        return p.x>=p.y;
    }
    private void pickSequencePoint(String kind,int index,boolean destination){
        if(running||watching||teachingInProgress||sequenceActive||
           PgsAutoHostPolicy.OTHER.equals(PgsAutoHostSettings.current(this))){
            showReason("Pare o monitor e selecione PGSharp ou Pokemod "+
                "para editar os pontos.");return;
        }
        if(windowManager==null)return;
        if(sequenceMarkers!=null)sequenceMarkers.close();
        final boolean landscape=sequenceLandscape();
        final boolean edit="EDIT".equals(kind);
        pointPicker=PgsAutoTargetPicker.open(this,windowManager,
            "SEQUÊNCIA",new PgsAutoTargetPicker.Callback(){
            @Override public void confirmed(float fx,float fy,int width,int height){
                pointPicker=null;
                if((width>=height)!=landscape||sequenceLandscape()!=landscape){
                    showReason("Orientação alterada; selecione o ponto novamente.");
                    if(quickMenus!=null)quickMenus.showSequence();return;
                }
                if(edit){
                    boolean ok=PgsSequenceStore.changePoint(
                        PgsAutoClickService.this,index,fx,fy,destination);
                    if(!ok)showReason("Ponto inválido para este passo.");
                    if(quickMenus!=null)quickMenus.showSequence();return;
                }
                if("TAP".equals(kind)){
                    if(!PgsSequenceStore.add(PgsAutoClickService.this,
                        PgsSequencePolicy.tap(fx,fy),landscape))
                        showReason("Limite de passos ou orientação incompatível.");
                    if(quickMenus!=null)quickMenus.showSequence();
                }else if("SWIPE".equals(kind)){
                    final float startX=fx,startY=fy;
                    pointPicker=PgsAutoTargetPicker.open(
                        PgsAutoClickService.this,windowManager,
                        "DESTINO DO ARRASTE",new PgsAutoTargetPicker.Callback(){
                        @Override public void confirmed(float dx,float dy,
                                int w,int h){
                            pointPicker=null;
                            if((w>=h)!=landscape||
                                sequenceLandscape()!=landscape){
                                showReason("Orientação mudou durante o arraste.");
                            }else if(!PgsSequenceStore.add(
                                PgsAutoClickService.this,
                                PgsSequencePolicy.swipe(startX,startY,dx,dy),
                                landscape)){
                                showReason("Arraste inválido ou limite de passos.");
                            }
                            if(quickMenus!=null)quickMenus.showSequence();
                        }
                        @Override public void cancelled(){
                            pointPicker=null;
                            if(quickMenus!=null)quickMenus.showSequence();
                        }
                    });
                }
            }
            @Override public void cancelled(){
                pointPicker=null;
                if(quickMenus!=null)quickMenus.showSequence();
            }
        });
    }
    private void previewSequence(){
        if(windowManager==null)return;
        if(sequenceMarkers==null)
            sequenceMarkers=new PgsSequenceMarkers(this,windowManager);
        if(sequenceMarkers.visible()){sequenceMarkers.close();return;}
        List<PgsSequencePolicy.Step> steps=PgsSequenceStore.load(this);
        if(steps.isEmpty()||PgsSequenceStore.landscape(this)!=sequenceLandscape()){
            showReason("Adicione passos na orientação atual para prévia.");
            return;
        }
        sequenceMarkers.show(steps);
        status("PRÉVIA · NENHUM GESTO");
        // A prévia é transparente e NÃO bloqueia toque nem captura do jogo.
        Toast.makeText(this,"Pontos numerados: prévia sem execução. "+
            "Abra o editor novamente para ocultar.",Toast.LENGTH_SHORT).show();
    }
    private void stopSequence(String reason){
        boolean wasActive=sequenceActive;
        sequenceActive=false;sequenceTicket++;sequenceIndex=0;
        sequencePlan=new ArrayList<>();
        sequenceDetector=null;sequenceStartedAt=0L;
        if(sequenceMarkers!=null)sequenceMarkers.close();
        if(wasActive){
            status(reason);
            BugReport.log(this,"PGS","LT367 sequência encerrada: "+reason+
                "; nenhum efeito no jogo foi confirmado");
        }
    }
    private boolean sequenceGuard(){
        if(!sequenceActive||windowManager==null)return false;
        Point dims=new Point();windowManager.getDefaultDisplay().getRealSize(dims);
        boolean orientationMatches=sequenceWidth==dims.x&&
            sequenceHeight==dims.y&&
            (sequenceWidth>=sequenceHeight)==PgsSequenceStore.landscape(this);
        boolean safe=!gameAccountSafetyNoticePresent()&&
            !passengerPromptPresent();
        return SystemClock.uptimeMillis()-sequenceStartedAt<180000L&&
            PgsSequencePolicy.mayExecute(sequenceProfile,
                PgsAutoHostSettings.current(this),orientationMatches,
                PgsSequenceStore.canRun(this),isGameVisible(),safe,
                running||watching||teachingInProgress||
                (quickMenus!=null&&quickMenus.isOpen()));
    }
    private void startSequence(){
        if(sequenceActive||running||watching||teachingInProgress||
            pointPicker!=null)return;
        if(windowManager==null||android.os.Build.VERSION.SDK_INT<30){
            showReason("Execução por confirmação visual requer Android 11+.");
            return;
        }
        final String host=PgsAutoHostSettings.current(this);
        List<PgsSequencePolicy.Step> steps=PgsSequenceStore.load(this);
        if(!PgsSequencePolicy.validSequence(steps)||
            !PgsSequenceStore.canRun(this)||
            PgsSequenceStore.landscape(this)!=sequenceLandscape()||
            PgsAutoHostPolicy.OTHER.equals(host)){
            showReason("Sequência inválida ou execução não autorizada "+
                "neste perfil e orientação.");return;
        }
        for(PgsSequencePolicy.Step step:steps){
            if(step.type!=PgsSequencePolicy.Type.SPRITE)continue;
            boolean found=false;
            for(PgsAutoTemplateStore.Model model:PgsAutoTemplateStore.active(this))
                if(model.id.equals(step.modelId)&&
                   PgsAutoCatalog.isSelectedName(this,model.name)){
                    found=true;break;
                }
            if(!found){
                showReason("Sprite indisponível neste perfil: "+
                    step.modelName+". Selecione uma imagem salva.");return;
            }
        }
        if(sequenceMarkers!=null)sequenceMarkers.close();
        Point size=new Point();windowManager.getDefaultDisplay().getRealSize(size);
        sequenceWidth=size.x;sequenceHeight=size.y;sequenceProfile=host;
        sequencePlan=new ArrayList<>(steps);
        sequenceIndex=0;sequenceActive=true;sequenceStartedAt=SystemClock.uptimeMillis();
        final int stamp=++sequenceTicket;
        if(!sequenceGuard()){
            stopSequence("SEQUÊNCIA · VERIFIQUE O JOGO E OS AVISOS");
            showReason("Abra a janela oficial de Pokémon GO, "+
                "feche diálogos e confirme as permissões.");return;
        }
        status("SEQUÊNCIA · ETAPA 1/"+steps.size());
        handler.postDelayed(()->sequenceNext(stamp),350L);
    }
    private void sequenceNext(int stamp){
        if(!sequenceActive||stamp!=sequenceTicket)return;
        if(!sequenceGuard()){
            stopSequence("SEQUÊNCIA PAUSADA · JOGO/AVISO/PERFIL");
            return;
        }
        if(sequenceIndex>=sequencePlan.size()){
            int count=sequencePlan.size();
            stopSequence("SEQUÊNCIA · "+count+" PASSOS CONCLUÍDOS");
            Toast.makeText(this,
                "Sequência concluída pelo Android. O resultado no jogo "+
                "não foi verificado.",Toast.LENGTH_LONG).show();
            return;
        }
        PgsSequencePolicy.Step step=sequencePlan.get(sequenceIndex);
        status("SEQUÊNCIA "+(sequenceIndex+1)+"/"+sequencePlan.size()+
            " · "+step.title());
        if(step.type==PgsSequencePolicy.Type.WAIT){
            final int at=sequenceIndex;
            handler.postDelayed(()->{
                if(sequenceActive&&stamp==sequenceTicket&&at==sequenceIndex){
                    sequenceIndex++;sequenceNext(stamp);
                }
            },step.waitMs);
        }else if(step.type==PgsSequencePolicy.Type.SPRITE){
            if(sequenceDetector==null){
                try{
                    sequenceDetector=new PgsAutoIconDetector(this);
                    if(sequenceDetector.templateCount()<1)throw new IOException(
                        "Nenhuma sprite válida no perfil");
                }catch(IOException err){
                    stopSequence("SEQUÊNCIA · MODELO AUSENTE");
                    showReason("Regrave a miniatura do feed: "+err.getMessage());
                    return;
                }
            }
            sequenceScanSprite(stamp,step,null,0,0);
        }else{
            int x=Math.round(step.x*sequenceWidth);
            int y=Math.round(step.y*sequenceHeight);
            int endX=Math.round(step.endX*sequenceWidth);
            int endY=Math.round(step.endY*sequenceHeight);
            sequenceGesture(stamp,step,x,y,endX,endY);
        }
    }
    private void sequenceScanSprite(int stamp,PgsSequencePolicy.Step step,
        PgsAutoIconDetector.Match first,int firstW,int firstH){
        if(!sequenceActive||stamp!=sequenceTicket||!sequenceGuard())return;
        capture(new CaptureCallback(){
            @Override public void onBitmap(Bitmap bitmap){
                if(!sequenceActive||stamp!=sequenceTicket||!sequenceGuard())return;
                Bitmap frame=bitmap.copy(Bitmap.Config.ARGB_8888,false);
                if(frame==null){
                    stopSequence("SEQUÊNCIA · IMAGEM INDISPONÍVEL");return;
                }
                final int w=frame.getWidth(),h=frame.getHeight();
                analysis.execute(()->{
                    PgsAutoIconDetector.Match candidate=null;
                    boolean valid=false;
                    try{
                        List<PgsAutoIconDetector.Match> matches=sequenceDetector.find(frame);
                        valid=!sequenceDetector.lastScanAborted();
                        if(valid)for(PgsAutoIconDetector.Match match:matches){
                            if(step.modelId.equals(match.id)&&
                                (candidate==null||match.score>candidate.score))
                                candidate=match;
                        }
                    }catch(Exception ignored){valid=false;}
                    finally{frame.recycle();}
                    final PgsAutoIconDetector.Match result=candidate;
                    final boolean complete=valid;
                    handler.post(()->{
                        if(!sequenceActive||stamp!=sequenceTicket)return;
                        if(!complete||result==null){
                            stopSequence("SEQUÊNCIA · SPRITE NÃO CONFIRMADA");
                            return;
                        }
                        if(first==null){
                            handler.postDelayed(()->sequenceScanSprite(
                                stamp,step,result,w,h),650L);
                        }else if(PgsAutoWatchPolicy.sameSprite(
                            first.id,first.group,first.x,first.y,firstW,firstH,
                            result.id,result.group,result.x,result.y,w,h)){
                            int x=Math.round(result.x*(sequenceWidth/(float)w));
                            int y=Math.round(result.y*(sequenceHeight/(float)h));
                            if(x<=0||y<=0||x>=sequenceWidth||y>=sequenceHeight){
                                stopSequence("SEQUÊNCIA · PONTO FORA DA TELA");
                                return;
                            }
                            sequenceGesture(stamp,step,x,y,x,y);
                        }else stopSequence("SEQUÊNCIA · SPRITE MUDOU");
                    });
                });
            }
            @Override public void onError(String reason){
                if(sequenceActive&&stamp==sequenceTicket){
                    stopSequence("SEQUÊNCIA · CAPTURA FALHOU");
                    showReason(reason);
                }
            }
        });
    }
    private void sequenceGesture(int stamp,PgsSequencePolicy.Step step,
        int x,int y,int endX,int endY){
        if(!sequenceActive||stamp!=sequenceTicket)return;
        if(!sequenceGuard()){
            stopSequence("SEQUÊNCIA · AVISO OU JOGO FECHADO");
            return;
        }
        final int index=sequenceIndex;
        Path path=new Path();path.moveTo(x,y);
        if(step.type==PgsSequencePolicy.Type.SWIPE)path.lineTo(endX,endY);
        GestureDescription gesture=new GestureDescription.Builder()
            .addStroke(new GestureDescription.StrokeDescription(
                path,0,step.gestureMs)).build();
        boolean accepted=dispatchGesture(gesture,new GestureResultCallback(){
            @Override public void onCompleted(GestureDescription result){
                handler.post(()->{
                    if(!sequenceActive||stamp!=sequenceTicket||
                        sequenceIndex!=index)return;
                    if(!sequenceGuard()){
                        stopSequence("SEQUÊNCIA · ESTADO ALTERADO");return;
                    }
                    BugReport.log(PgsAutoClickService.this,"PGS",
                        "LT367 gesto Android concluído em passo "+(index+1)+
                        "; efeito no Pokémon GO NÃO confirmado");
                    if(tapIndicator!=null&&getSharedPreferences(
                        "pgs_auto_settings_v1",MODE_PRIVATE)
                        .getBoolean("showTapIndicator",true))
                        tapIndicator.show(x,y);
                    sequenceIndex++;
                    handler.postDelayed(()->sequenceNext(stamp),
                        step.waitMs);
                });
            }
            @Override public void onCancelled(GestureDescription result){
                handler.post(()->{
                    if(sequenceActive&&stamp==sequenceTicket)
                        stopSequence("SEQUÊNCIA · GESTO CANCELADO");
                });
            }
        },null);
        if(!accepted){stopSequence("SEQUÊNCIA · ANDROID RECUSOU GESTO");return;}
        handler.postDelayed(()->{
            if(sequenceActive&&stamp==sequenceTicket&&sequenceIndex==index)
                stopSequence("SEQUÊNCIA · GESTO SEM CALLBACK");
        },step.gestureMs+4500L);
    }

    private void toggle(){
        if(sequenceActive){
            stopSequence("SEQUÊNCIA INTERROMPIDA PELO USUÁRIO");
            return;
        }
        if(watching){stopWatchOnly(true);return;}
        if(running){halt("PARADO");return;}
        // Auto Hunt sem clique reutiliza monitor passivo (2 frames), e a
        // autorização de clique precisa ser dada NESTE perfil explicitamente.
        if(PgsAutoHuntSettings.enabled(this)&&
           !PgsAutoHuntSettings.forCurrent(this).getBoolean(
               PgsAutoHuntSettings.CLICK_ENABLED,false)){
            startWatchOnly();
            if(watching)huntWatchSession=true;
            refreshHuntProximity();
            return;
        }
        // LT359: PGS é interface padrão; Pokemod exige seleção explícita e
        // modelos próprios. Outros clientes ficam em prévia até homologação.
        String hostProfile=PgsAutoHostSettings.current(this);
        if(PgsAutoHostPolicy.OTHER.equals(hostProfile)){
            status("SOMENTE PRÉVIA");
            showReason("Outro aplicativo ainda não homologado: grave uma "+
                "captura e use a prévia ◎, sem toque automático.");
            return;
        }
        // LT363: Aegis/Atlas e outras configurações visuais não exigem
        // com.pokemod.app.public. Somente janela do jogo, perfil explícito,
        // amostras daquele perfil e avisos manuais autorizam a sequência.
        // O gesto Android pode existir no 9/10, mas a confirmação visual de mapa
        // depende de takeScreenshot(API 30); nunca iniciar ciclo sem esse requisito.
        if(android.os.Build.VERSION.SDK_INT<30){
            status("REQUER ANDROID 11+");
            showReason("Busca PGS com leitura de sprites/mapa requer Android 11 "+
                "ou superior. O PGSharp pode abrir no Android 9/10, mas "+
                "a captura segura do PokeSearch não está disponível.");
            return;
        }
        tapMode=PgsAutoTargetPolicy.mode(targetPrefs().getString("mode","SPRITE"));
        if(tapMode==PgsAutoTargetPolicy.Mode.SPRITE&&
           !PgsAutoTemplateStore.pending(this).isEmpty()){
            boolean saved=false;
            for(PgsAutoTemplateStore.Model model:PgsAutoTemplateStore.active(this))
                if(PgsAutoCatalog.isSelectedName(this,model.name)){saved=true;break;}
            if(saved)PgsAutoTemplateStore.clearTeaching(this);
            else {queueTeachingWhenReady();return;}
        }
        if(tapMode==PgsAutoTargetPolicy.Mode.SPRITE&&!reloadDetector()){
            showReason("Nenhum modelo selecionado ou imagem inválida. Abra o PGS Favoritos Auto e marque um Pokémon.");
            status("SEM MODELO");return; // Falha visual: vermelho no centro.
        }
        if(tapMode!=PgsAutoTargetPolicy.Mode.SPRITE&&!validTarget()){
            showReason("Mira ausente ou resolução alterada. Segure Buscar Pokémon → Alvo e confirme novamente.");
            status("CONFIRMAR MIRA");return;
        }
        if(pausedByShiny||pausedByError){
            pausedByShiny=false;pausedByError=false;
            // Mesma reinicialização integral do ciclo normal: não herdar
            // tempo já gasto do último mapa ao reativar a busca.
        }
        loadSettings();
        nextIndex=0;total=0;clickedAt=0L;awaitingMap=false;passengerHoldAt=0L;
        passengerWarningLatched=false;
        lastColors=null;stableRepeats=0;sceneReadyAt=0;loadedStreak=0;
        sceneBeforeGesture=null;sceneChangedAfterGesture=false;sceneUnchangedLogged=false;
        visitedSlots.clear();notifiedFeedSlots.clear();noFreshAttempts=0;verifyMisses=0;currentTargetName="";
        emptyRetries=0;lastNoIconScan=0;shinyNegativeConfirmed=false;
        huntTapSession=PgsAutoHuntSettings.enabled(this);
        huntClicks=0;mapReadFailures=0;huntNextAt=0L;
        handler.removeCallbacks(huntCountdownTick);
        running=true;
        refreshHuntProximity();
        status("LENDO TELA");
        BugReport.log(this,"PGS","Busca reativada, cooldown mapa "+maxSeconds+
            "s, Sem Shiny "+minSeconds+"s; aguardando ícones do feed");
        handler.postDelayed(this::scanAndTap,400);
    }

    /**
     * LT361 — observação passiva, opt-in. Não chama tap(), scanAndTap(),
     * GestureDescription nem dispatchGesture. A notificação informa só
     * presença VISUAL de miniatura, nunca Shiny, encontro ou teleporte.
     */
    private void setWatchOnly(boolean enabled){
        if(enabled)startWatchOnly();
        else stopWatchOnly(true);
    }
    private void startWatchOnly(){
        if(watching){status("MONITOR · ATIVO");return;}
        String host=PgsAutoHostSettings.current(this);
        if(PgsAutoHostPolicy.OTHER.equals(host)){
            PgsAutoWatchSettings.setEnabled(this,false);
            showReason("Outro cliente está em prévia; monitor sem clique ainda não homologado.");
            return;
        }
        // LT363: não exigir app Pokemod Manager; Aegis/Atlas são pacotes
        // distintos e presença de qualquer um não prova mod ativo.
        if(android.os.Build.VERSION.SDK_INT<30){
            PgsAutoWatchSettings.setEnabled(this,false);
            showReason("Monitor visual exige captura de tela no Android 11+.");
            return;
        }
        if(teachingInProgress||teachingScheduled||
                !PgsAutoTemplateStore.pending(this).isEmpty()){
            PgsAutoWatchSettings.setEnabled(this,false);
            showReason("Conclua o cadastro da sprite antes de iniciar o monitor.");
            return;
        }
        if(running)halt("BUSCA INTERROMPIDA");
        armedByHome=false;
        getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE).edit()
            .putBoolean("armFromHome",false).apply();
        if(!reloadDetector()){
            PgsAutoWatchSettings.setEnabled(this,false);
            status("MONITOR · SEM SPRITE");
            return;
        }
        watching=true;watchBusy=false;watchTicket++;
        pausedByShiny=false;pausedByError=false;
        PgsAutoWatchSettings.setEnabled(this,true);
        status("MONITOR · SEM CLIQUE");
        BugReport.log(this,"PGS","LT361 monitor passivo ativado para "+
            host+"; somente espécies selecionadas e com modelo próprio");
        handler.removeCallbacks(watchTick);
        handler.postDelayed(watchTick,600L);
    }
    private void stopWatchOnly(boolean clearPreference){
        huntWatchSession=false;
        refreshHuntProximity();
        handler.removeCallbacks(watchTick);
        watchTicket++;watchBusy=false;watching=false;
        watchMetrics.cancel(); // descarte também a rodada de métricas antiga.
        if(clearPreference)PgsAutoWatchSettings.setEnabled(this,false);
        if(!running)status("PARADO");
    }
    private void scheduleWatch(long millis){
        if(watchBusy)watchMetrics.finish(SystemClock.elapsedRealtime(),lastStatus);
        watchBusy=false;
        handler.removeCallbacks(watchTick);
        if(watching){
            // Monitor Auto Hunt respeita a espera escolhida pelo usuário;
            // monitor antigo preserva exatamente sua política própria.
            long delay=huntWatchSession&&PgsAutoHuntSettings.enabled(this)?
                Math.max(millis,PgsAutoHuntSettings.waitSeconds(this)*1000L):
                millis;
            handler.postDelayed(watchTick,delay);
        }
    }
    private interface WatchFrameResult {
        void ready(java.util.List<PgsAutoIconDetector.Match> matches,
            int width,int height,boolean aborted);
        void failed(String reason);
    }
    private void captureWatchFrame(int stamp,WatchFrameResult result){
        if(!watching||watchTicket!=stamp)return;
        capture(new CaptureCallback(){
            @Override public void onBitmap(Bitmap bitmap){
                if(!watching||watchTicket!=stamp)return;
                Bitmap copy=null;
                try{copy=bitmap.copy(Bitmap.Config.ARGB_8888,false);}
                catch(RuntimeException ignored){}
                if(copy==null){result.failed("Captura vazia.");return;}
                final Bitmap frame=copy;
                final int w=frame.getWidth(),h=frame.getHeight();
                final PgsAutoIconDetector reader=detector;
                if(reader==null){frame.recycle();result.failed("Leitor indisponível.");return;}
                try{
                    analysis.execute(()->{
                        java.util.List<PgsAutoIconDetector.Match> matches=null;
                        boolean aborted=true;
                        try{
                            matches=reader.find(frame);
                            aborted=reader.lastScanAborted();
                        }catch(RuntimeException failure){
                            BugReport.log(PgsAutoClickService.this,"PGS",
                                "LT361 erro de leitura visual: "+
                                failure.getClass().getSimpleName());
                        }finally{frame.recycle();}
                        final java.util.List<PgsAutoIconDetector.Match> seen=matches;
                        final boolean incomplete=aborted;
                        handler.post(()->{
                            if(watching&&watchTicket==stamp)
                                result.ready(seen,w,h,incomplete);
                        });
                    });
                }catch(RuntimeException unavailable){
                    frame.recycle();
                    result.failed("Fila de leitura indisponível.");
                }
            }
            @Override public void onError(String error){
                if(watching&&watchTicket==stamp)result.failed(error);
            }
        });
    }
    private void scanWatchOnly(){
        if(!watching||watchBusy)return;
        String host=PgsAutoHostSettings.current(this);
        boolean game=isGameVisible();
        boolean warnings=game&&
            (gameAccountSafetyNoticePresent()||passengerPromptPresent());
        boolean panel=quickMenus!=null&&quickMenus.hasPanel();
        boolean may=PgsAutoWatchPolicy.mayCapture(
            watching,host,game,!warnings,detector!=null&&
            detector.templateCount()>0,running,
            teachingInProgress||teachingScheduled,panel);
        if(!may){
            status(warnings?"MONITOR · AVISO MANUAL":
                game?"MONITOR · PAUSADO":"MONITOR · ABRA O JOGO");
            scheduleWatch(PgsAutoWatchPolicy.PAUSED_RETRY_MS);
            return;
        }
        watchBusy=true;
        watchMetrics.begin(SystemClock.elapsedRealtime());
        final int stamp=watchTicket;
        status("MONITOR · LENDO LISTA");
        // Nem callback de screenshot ausente nem fila travada retém o monitor.
        handler.postDelayed(()->{
            if(!watching||!watchBusy||watchTicket!=stamp)return;
            watchTicket++; // frames atrasados desta rodada são descartados.
            status("MONITOR · TEMPO LIMITE");
            scheduleWatch(PgsAutoWatchPolicy.PAUSED_RETRY_MS);
        },PgsAutoWatchPolicy.WATCHDOG_MS);
        captureWatchFrame(stamp,new WatchFrameResult(){
            @Override public void ready(
                    java.util.List<PgsAutoIconDetector.Match> first,
                    int width,int height,boolean aborted){
                if(!watching||watchTicket!=stamp)return;
                if(aborted||first==null){
                    status("MONITOR · LIMITE DA LEITURA");
                    scheduleWatch(PgsAutoWatchPolicy.SCAN_INTERVAL_MS);return;
                }
                if(first.isEmpty()){
                    status("MONITOR · OBSERVANDO");
                    scheduleWatch(PgsAutoWatchPolicy.SCAN_INTERVAL_MS);return;
                }
                handler.postDelayed(()->{
                    if(!watching||watchTicket!=stamp)return;
                    if(!PgsAutoWatchPolicy.mayCapture(
                        watching,PgsAutoHostSettings.current(
                            PgsAutoClickService.this),
                        isGameVisible(),
                        !gameAccountSafetyNoticePresent()&&
                            !passengerPromptPresent(),
                        detector!=null&&detector.templateCount()>0,
                        running,teachingInProgress||teachingScheduled,
                        quickMenus!=null&&quickMenus.hasPanel())){
                        scheduleWatch(PgsAutoWatchPolicy.PAUSED_RETRY_MS);return;
                    }
                    captureWatchFrame(stamp,new WatchFrameResult(){
                        @Override public void ready(
                                java.util.List<PgsAutoIconDetector.Match> second,
                                int secondW,int secondH,boolean secondAborted){
                            if(!watching||watchTicket!=stamp)return;
                            if(secondAborted||second==null){
                                status("MONITOR · LEITURA INCOMPLETA");
                                scheduleWatch(PgsAutoWatchPolicy.SCAN_INTERVAL_MS);
                                return;
                            }
                            // Validar novamente o foreground após o processamento.
                            if(!isGameVisible()||gameAccountSafetyNoticePresent()||
                                    passengerPromptPresent()){
                                status("MONITOR · PAUSADO");
                                scheduleWatch(PgsAutoWatchPolicy.PAUSED_RETRY_MS);
                                return;
                            }
                            java.util.HashSet<String> distinct=
                                new java.util.HashSet<>();
                            java.util.ArrayList<String> names=
                                new java.util.ArrayList<>();
                            int visuallyConfirmed=0;
                            final long now=SystemClock.elapsedRealtime();
                            for(PgsAutoIconDetector.Match a:first){
                                if(!PgsAutoCatalog.isSelectedName(
                                    PgsAutoClickService.this,a.name))continue;
                                String key=host+":"+a.group;
                                if(!distinct.add(key))continue;
                                boolean verified=false;
                                for(PgsAutoIconDetector.Match b:second){
                                    if(PgsAutoWatchPolicy.sameSprite(a.id,a.group,
                                        a.x,a.y,width,height,b.id,b.group,
                                        b.x,b.y,secondW,secondH)){
                                        verified=true;break;
                                    }
                                }
                                if(!verified)continue;
                                visuallyConfirmed++;
                                Long last=watchLastAlert.get(key);
                                if(!PgsAutoWatchPolicy.mayNotify(true,
                                    last==null?-1L:last,now))continue;
                                if(names.size()>=PgsAutoWatchPolicy.
                                        MAX_ALERT_SPECIES_PER_SCAN)break;
                                names.add(a.name);
                                watchLastAlert.put(key,now);
                            }
                            // O número solicitado não comprova entrega Android/DND.
                            watchMetrics.observe(first.size(),visuallyConfirmed,names.size());
                            if(!names.isEmpty()){
                                String label=PgsAutoHostPolicy.displayLabel(host);
                                String body="Na lista: "+String.join(", ",names)+
                                    ". Presença visual confirmada; nenhum toque.";
                                notifyConfigured(PgsAutoNotificationPolicy.NEW,
                                    "PokeSearch · favoritos · "+label,body,false);
                                BugReport.log(PgsAutoClickService.this,"PGS",
                                    "LT361 monitor sem gesto: "+names.size()+
                                    " favorito(s) visuais confirmados em 2 frames");
                                status("MONITOR · "+names.size()+" FAVORITO(S)");
                            }else status("MONITOR · OBSERVANDO");
                            scheduleWatch(PgsAutoWatchPolicy.SCAN_INTERVAL_MS);
                        }
                        @Override public void failed(String reason){
                            if(!watching||watchTicket!=stamp)return;
                            status("MONITOR · SEM CAPTURA");
                            scheduleWatch(PgsAutoWatchPolicy.PAUSED_RETRY_MS);
                        }
                    });
                },PgsAutoWatchPolicy.RECONFIRM_DELAY_MS);
            }
            @Override public void failed(String reason){
                if(!watching||watchTicket!=stamp)return;
                status("MONITOR · SEM CAPTURA");
                if(reason.contains("permissão")||
                    reason.contains("recusou a captura")){
                    stopWatchOnly(true);
                    showReason("Monitor: captura negada pelo Android. "+
                        "Revise a permissão de Acessibilidade.");
                }else scheduleWatch(PgsAutoWatchPolicy.PAUSED_RETRY_MS);
            }
        });
    }

    /** Segure o botão para localizar os ícones sem tocar em nenhum deles. */
    private void preview(){
        if(watching){
            Toast.makeText(this,"Desligue o monitor no sino para usar a prévia.",
                Toast.LENGTH_LONG).show();return;
        }
        if(running){
            Toast.makeText(this,"Pause a busca antes de testar a prévia.",
                Toast.LENGTH_LONG).show();return;
        }
        if(!reloadDetector()){status("SEM MODELO");return;}
        // A prévia nunca verifica sprites da NOSSA própria barra/menu.
        if(quickMenus!=null)quickMenus.dismissAll();
        status("ANALISANDO FEED");
        handler.postDelayed(()->capture(new CaptureCallback(){
            @Override public void onBitmap(Bitmap bitmap){
                Bitmap copy=bitmap.copy(Bitmap.Config.ARGB_8888,false);
                if(copy==null){status("SEM CAPTURA");showReason("Captura vazia.");return;}
                final int screenWidth=bitmap.getWidth(),screenHeight=bitmap.getHeight();
                PgsAutoIconDetector current=detector;
                analysis.execute(()->{
                    List<PgsAutoIconDetector.Match> items;
                    try{items=current.find(copy);}catch(Exception e){items=null;}
                    finally{copy.recycle();}
                    final List<PgsAutoIconDetector.Match> found=items;
                    handler.post(()->{
                        if(found==null){
                            status("SEM CAPTURA");
                            showReason("Erro na leitura visual das sprites.");return;
                        }
                        if(current.lastScanAborted()){
                            status("LIMITE DO SCANNER");
                            showReason("Análise de sprites excedeu limite de tempo ou "+
                                "candidatos. Reduza o número de modelos por espécie.");return;
                        }
                        status("ACHEI "+found.size());
                        if(!found.isEmpty()){
                            PgsAutoIconDetector.Match first=found.get(0);
                            Point screen=new Point();
                            windowManager.getDefaultDisplay().getRealSize(screen);
                            // Prévia visual SEM dispatchGesture e sem interação no jogo.
                            int[] screenPoint=PgsAutoScreenGeometry.map(
                                first.x,first.y,screenWidth,screenHeight,screen.x,screen.y);
                            if(screenPoint==null){
                                status("CALIBRAR TELA");
                                showReason("Prévia sem toque: proporção da captura diferente "+
                                    "do display. Reabra o jogo e confira rotação/barras.");
                                return;
                            }
                            if(tapIndicator!=null)tapIndicator.show(
                                screenPoint[0],screenPoint[1]);
                            BugReport.log(PgsAutoClickService.this,"PGS",
                                "LT355 estágio PREVIA_SEM_GESTO: "+first.name+
                                " "+(first.nativeModel?"NATIVO":"PESSOAL")+
                                " id "+first.id+
                                " confiança "+Math.round(first.score*100)+"% no feed "+
                                first.x+","+first.y+" display "+screenPoint[0]+","+screenPoint[1]+
                                " tempo="+current.lastScanMillis()+"ms, ambíguos="+
                                current.lastAmbiguousSlots());
                        }
                        Toast.makeText(PgsAutoClickService.this,
                            found.isEmpty()?
                                (current.lastAmbiguousSlots()>0?
                                    "Possíveis sprites de espécies diferentes no mesmo local; "+
                                    "prévia bloqueada por ambiguidade. Revise os modelos.":
                                    "Nenhuma sprite reconhecida nas colunas laterais do feed. "+
                                    "Confira a miniatura e o modelo cadastrado."):
                                "Prévia sem toque: "+found.size()+" sprite(s). Primeiro: "+
                                found.get(0).name+" ("+
                                Math.round(found.get(0).score*100)+"%).",
                            Toast.LENGTH_LONG).show();
                    });
                });
            }
            @Override public void onError(String error){
                status("SEM CAPTURA");showReason(error);
            }
        }),260L);
    }

    private void scanAndTap(){
        if(!running)return;
        huntNextAt=0L;
        handler.removeCallbacks(huntCountdownTick);
        if(huntTapSession&&!PgsAutoHuntPolicy.mayKeepScanning(true,
                huntClicks,PgsAutoHuntSettings.maxClicks(this))){
            halt("AUTO HUNT · LIMITE DE TOQUES");
            return;
        }
        // A busca nunca captura miniaturas dos próprios menus PGS.
        if(quickMenus!=null&&quickMenus.hasPanel()){
            status("FECHE PAINEL PARA BUSCAR");
            handler.postDelayed(()->{if(running)scanAndTap();},1100L);
            return;
        }
        if(holdForPassengerPrompt()){
            handler.postDelayed(()->{if(running)scanAndTap();},1200L);
            return;
        }
        if(!isGameVisible()){
            status("ABRA O JOGO");
            handler.postDelayed(()->{if(running)scanAndTap();},2500L);return;
        }
        loadSettings();
        if(tapMode!=PgsAutoTargetPolicy.Mode.SPRITE){scanFixedTarget();return;}
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
                if(current.lastScanAborted()){
                    fail("Scanner PGS excedeu o limite de tempo ou candidatos. "+
                        "Reduza os modelos ativos e confira a prévia ◎.");
                    return;
                }
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
                    // Diagnóstico eventual: selecionado não significa
                    // modelo reconhecido na escala atual da tela.
                    if(items.isEmpty()&&++emptyRetries==6){
                        BugReport.log(PgsAutoClickService.this,"PGS",
                            "Sem sprite no feed; modelos úteis "+
                            detector.templateCount()+"/"+detector.selectedModelCount()+
                            ", ambíguos "+detector.lastAmbiguousSlots()+
                            ", duração "+detector.lastScanMillis()+"ms");
                        Toast.makeText(PgsAutoClickService.this,
                            "Nenhum ícone reconhecido no feed. Abra a lupa, "+
                            "confira a miniatura e grave novamente se preciso.",
                            Toast.LENGTH_LONG).show();
                    }
                    // Recomeça a fila quando a única coisa que resta na tela
                    // são posições já visitadas. Sem checkbox de repetição.
                    if(!items.isEmpty()&&++noFreshAttempts>=3){
                        visitedSlots.clear();notifiedFeedSlots.clear();
                        nextIndex=0;total=0;noFreshAttempts=0;
                    }else if(items.isEmpty())noFreshAttempts=0;
                    status(items.isEmpty()?
                        "SPRITE NÃO RECONHECIDA · RELENDO":
                        "FEED SEM NOVOS ALVOS · RELENDO");
                    handler.postDelayed(()->{
                        if(running&&ticket==stamp)scanAndTap();
                    },PgsAutoCyclePolicy.EMPTY_FEED_RETRY_SECONDS*1000L);
                    return;
                }
                emptyRetries=0;noFreshAttempts=0;
                BugReport.log(PgsAutoClickService.this,"PGS",
                    "Sprite do feed: "+match.name+" id "+match.id+
                    ", correlação "+Math.round(match.score*100)+"%, posição "+
                    match.x+","+match.y+" / "+screenWidth+"x"+screenHeight);
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
                    // Original frame is still valid here; the capture owner
                    // recycles it on return, so keep only a tiny color signature.
                    final int[] beforeGesture=sampleMap(bitmap);
                    final PgsAutoIconDetector current=detector;
                    analysis.execute(()->{
                        List<PgsAutoIconDetector.Match> detected;
                        try{detected=current.find(copy);}catch(Exception e){detected=null;}
                        finally{copy.recycle();}
                        final List<PgsAutoIconDetector.Match> confirmed=detected;
                        handler.post(()->{
                            if(!running||ticket!=stamp)return;
                            PgsAutoIconDetector.Match found=null;
                            if(current.lastScanAborted()){
                                fail("Confirmação visual lenta demais; nenhum gesto realizado.");
                                return;
                            }
                            if(confirmed!=null)for(PgsAutoIconDetector.Match m:confirmed){
                                if(!m.id.equals(candidate.id)||
                                   !m.group.equals(candidate.group))continue;
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
                            int[] point=PgsAutoScreenGeometry.map(
                                found.x,found.y,w,h,size.x,size.y);
                            if(point==null){
                                BugReport.log(PgsAutoClickService.this,"PGS",
                                    "LT355 estágio GEOMETRIA_INVALIDA: captura "+w+"x"+h+
                                    ", display "+size.x+"x"+size.y+"; sem gesto");
                                fail("Captura e display com geometria incompatível. "+
                                    "Confira orientação e barras do Android.");return;
                            }
                            int x=point[0],y=point[1];
                            // Só registra quando a MESMA imagem foi confirmada 2x.
                            // Slot relativo + espécie evita repetição por revarredura.
                            String evidence=found.group+":"+
                                Math.round(found.x*100f/Math.max(1,w))+":"+
                                Math.round(found.y*100f/Math.max(1,h));
                            if(notifiedFeedSlots.size()<150&&notifiedFeedSlots.add(evidence))
                                notifyConfigured(PgsAutoNotificationPolicy.NEW,
                                    "PGS: novo Pokémon no feed",
                                    found.name+" confirmado na lista de buscas.",false);
                            tap(x,y,nextIndex,found,w,h,beforeGesture);
                        });
                    });
                }
                @Override public void onError(String error){
                    if(running&&ticket==stamp)fail("Sem confirmação visual: "+error);
                }
            });
        },430L);
    }

    private void tap(int x,int y,int index,PgsAutoIconDetector.Match match,int screenWidth,int screenHeight,int[] beforeGesture){
        if(!running)return;
        if(huntTapSession&&
           !PgsAutoHuntSettings.forCurrent(this).getBoolean(
               PgsAutoHuntSettings.CLICK_ENABLED,false)){
            halt("AUTO HUNT · TOQUE DESATIVADO");
            return;
        }
        if(holdForPassengerPrompt()){
            handler.postDelayed(()->{if(running)scanAndTap();},1200L);return;
        }
        if(!isGameVisible()){
            status("ABRA O JOGO");handler.postDelayed(this::scanAndTap,1500L);return;
        }
        if(quickMenus!=null&&quickMenus.hasPanel()){
            status("FECHE PAINEL PARA BUSCAR");
            handler.postDelayed(()->{if(running)scanAndTap();},1100L);
            return;
        }
        // Última guarda de perfil antes do gesto; Match veio do detector
        // carregado somente com modelos da interface escolhida.
        if(!PgsAutoHostPolicy.mayAutoTap(
            PgsAutoHostSettings.current(this),true,
            !gameAccountSafetyNoticePresent(),match!=null)){
            fail("Perfil do feed incompatível ou aviso de segurança. "+
                "Confirme o jogo e a captura sem automatizar nenhum aviso.");
            return;
        }
        status("TOQUE "+(index+1)+"/"+total+
            (huntTapSession&&PgsAutoHuntSettings.forCurrent(this).getBoolean(
                PgsAutoHuntSettings.SHOW_INFO,true)?" · "+match.name:""));
        BugReport.log(this,"PGS","Gesto do feed "+match.name+
            " modelo "+match.id+" "+(match.nativeModel?"NATIVO":"PESSOAL")+
            " confiança "+Math.round(match.score*100)+
            "% @"+x+","+y+" tela "+screenWidth+"x"+screenHeight+
            " (callback Android não confirma ação no jogo)");
        Path path=new Path();path.moveTo(x,y);
        GestureDescription gesture=new GestureDescription.Builder()
            .addStroke(new GestureDescription.StrokeDescription(path,0,90)).build();
        final int gestureTicket=ticket;
        boolean accepted=dispatchGesture(gesture,new GestureResultCallback(){
            @Override public void onCompleted(GestureDescription g){handler.post(()->{
                if(!running||ticket!=gestureTicket||index!=nextIndex)return;
                sceneBeforeGesture=beforeGesture;
                sceneChangedAfterGesture=false;sceneUnchangedLogged=false;
                BugReport.log(PgsAutoClickService.this,"PGS",
                    "LT354 estágio GESTO_CONCLUIDO_ANDROID: "+match.id+
                    " @"+x+","+y+"; resposta do jogo ainda não observada");
                visitedSlots.add(new VisitedSlot(match,screenWidth,screenHeight));
                if(huntTapSession)huntClicks++;
                currentTargetName=match.name;
                // Alvo tocado NÃO é Shiny; não duplicar alerta de busca.
                awaitingMap=true;clickedAt=SystemClock.uptimeMillis();
                mapReadFailures=0;
                lastColors=null;stableRepeats=0;
                sceneReadyAt=0;loadedStreak=0;
                final int stamp=++ticket;
                status("AGUARDANDO MAPA");
                BugReport.log(PgsAutoClickService.this,"PGS","Gesto concluído pelo Android; teleporte no jogo ainda não verificado");
                // Watchdog próprio: o limite continua valendo mesmo se um frame
                // Android nunca responder (não ficar preso em tela/carregamento).
                handler.postDelayed(new Runnable(){
                    @Override public void run(){
                        if(!running||!awaitingMap||ticket!=stamp)return;
                        if(holdForPassengerPrompt()||!isGameVisible()){
                            handler.postDelayed(this,1200L);return;
                        }
                        if(PgsAutoCyclePolicy.mapTimedOut(
                            SystemClock.uptimeMillis(),clickedAt,maxSeconds))
                            finishMapVisit(stamp,true);
                        else handler.postDelayed(this,1200L);
                    }
                },maxSeconds*1000L);
                handler.postDelayed(()->checkMap(stamp),1300L);
            });}
            @Override public void onCancelled(GestureDescription g){handler.post(()->{
                if(!running||ticket!=gestureTicket)return;
                BugReport.log(PgsAutoClickService.this,"PGS",
                    "LT354 estágio GESTO_CANCELADO_ANDROID: "+match.id);
                fail("Toque cancelado pelo Android.");
            });}
        },null);
        if(!accepted){
            BugReport.log(this,"PGS","LT354 estágio GESTO_RECUSADO_ANDROID: "+match.id);
            fail("O Android não autorizou o toque de Acessibilidade.");
        }else{
            BugReport.log(this,"PGS","LT354 estágio GESTO_ACEITO_ANDROID: "+match.id+
                " @"+x+","+y+" / display "+windowManager.getDefaultDisplay().getDisplayId());
            if(tapIndicator!=null)tapIndicator.show(x,y);
            handler.postDelayed(()->{
            if(running&&!awaitingMap&&ticket==gestureTicket)
                fail("O Android não confirmou o toque. Confira Acessibilidade e PGSharp.");
            },3500L);
        }
    }

    private void checkMap(int stamp){
        if(!running||!awaitingMap||ticket!=stamp)return;
        long now=SystemClock.uptimeMillis();
        boolean passengerWarning=holdForPassengerPrompt();
        boolean gameVisible=isGameVisible();
        if(!gameVisible||passengerWarning){
            if(passengerHoldAt==0L)passengerHoldAt=now;
            status(passengerWarning?"CONFIRME MANUALMENTE":"AGUARDANDO JOGO");
            handler.postDelayed(()->checkMap(stamp),1200L);
            return;
        }
        if(passengerHoldAt!=0L){
            // O aviso não consome os 60s: o responsável confirma manualmente.
            long held=now-passengerHoldAt;
            clickedAt+=held;
            if(sceneReadyAt!=0L)sceneReadyAt+=held;
            passengerHoldAt=0L;
        }
        if(PgsAutoCyclePolicy.mapTimedOut(now,clickedAt,maxSeconds)){
            finishMapVisit(stamp,true);
            return;
        }
        capture(new CaptureCallback(){
            @Override public void onBitmap(Bitmap bitmap){
                if(!running||!awaitingMap||ticket!=stamp)return;
                mapReadFailures=0;
                long when=SystemClock.uptimeMillis();
                int[] colors=sampleMap(bitmap);
                if(lastColors!=null&&difference(lastColors,colors)<=10f)stableRepeats++;
                else stableRepeats=0;
                lastColors=colors;
                if(tapMode==PgsAutoTargetPolicy.Mode.SPRITE&&
                   sceneBeforeGesture!=null&&!sceneChangedAfterGesture){
                    float delta=PgsAutoGestureEvidence.meanColorDelta(sceneBeforeGesture,colors);
                    if(PgsAutoGestureEvidence.visualChangeCandidate(sceneBeforeGesture,colors)){
                        sceneChangedAfterGesture=true;
                        BugReport.log(PgsAutoClickService.this,"PGS",
                            "LT354 estágio MUDANCA_VISUAL: delta="+Math.round(delta)+
                            "; indício de reação, NÃO prova teleporte nem clique no jogo");
                    }else if(!sceneUnchangedLogged&&when-clickedAt>2300L){
                        sceneUnchangedLogged=true;
                        BugReport.log(PgsAutoClickService.this,"PGS",
                            "LT354 estágio SEM_RESPOSTA_VISUAL: mapa sem mudança detectável após callback Android");
                    }
                }
                PgsAutoMapReadiness.Evidence evidence=PgsAutoMapReadiness.analyze(bitmap);
                // O terreno sozinho não é prova de carregamento. Precisa
                // estabilidade E indícios de objetos (ginásios/PokéStops).
                if(PgsAutoGestureEvidence.canCountMapAsNew(
                    tapMode==PgsAutoTargetPolicy.Mode.SPRITE,
                    sceneChangedAfterGesture,stableRepeats>=1,evidence.scenePopulated))
                    loadedStreak++;
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
                    long elapsed=Math.max(0L,(when-clickedAt)/1000L);
                    status(tapMode==PgsAutoTargetPolicy.Mode.SPRITE&&!sceneChangedAfterGesture?
                        "SEM RESPOSTA VISÍVEL "+elapsed+"/"+maxSeconds:
                        "CARREGANDO "+elapsed+"/"+maxSeconds);
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
                    // LT366: apenas reCAPTURA visual limitada, nunca reinicia
                    // o jogo, não faz toque cego nem contorna segurança.
                    if(huntTapSession&&PgsAutoHuntSettings.forCurrent(
                            PgsAutoClickService.this).getBoolean(
                                PgsAutoHuntSettings.FIX_MAP,false)&&
                        ++mapReadFailures>PgsAutoHuntSettings.mapCaptureRetries(
                            PgsAutoClickService.this)){
                        fail("Captura do mapa falhou repetidamente; revise "+
                            "Acessibilidade e o jogo antes de continuar.");
                        return;
                    }
                    status("AGUARDANDO CAPTURA");
                    handler.postDelayed(()->checkMap(stamp),1500L);
                }
            }
        });
    }
    private void finishMapVisit(int stamp,boolean timeout){
        if(!running||!awaitingMap||stamp!=ticket)return;
        if(PgsAutoGestureEvidence.shouldStopForNoResponse(
            tapMode==PgsAutoTargetPolicy.Mode.SPRITE,timeout,sceneChangedAfterGesture)){
            BugReport.log(this,"PGS",
                "LT354 estágio SEM_RESPOSTA_JOGO: gesto concluído no Android, "+
                "sem alteração visual antes do timeout; nenhuma nova sprite tocada");
            fail("Gesto Android concluído, mas o jogo não mostrou mudança visual. "+
                "Confira prévia ◎, coordenadas, foco e permissões antes de tentar novamente.");
            return;
        }
        if(tapMode!=PgsAutoTargetPolicy.Mode.SPRITE){
            if(sceneReadyAt==0L){
                // Limite não autoriza clique cego em menu/diálogo/carregamento.
                if(timeout)fail("Cooldown esgotado: mapa não confirmado; nenhum novo toque.");
                else handler.postDelayed(()->checkMap(stamp),1200L);
                return;
            }
            PgsAutoTargetPolicy.Trigger trigger=PgsAutoTargetPolicy.trigger(
                targetPrefs().getString("trigger","MAP"));
            boolean cooled=SystemClock.uptimeMillis()-clickedAt>=maxSeconds*1000L;
            if(!cooled||!PgsAutoTargetPolicy.shouldRepeat(trigger,true,
                pausedByShiny,shinyNegativeConfirmed,cooled)){
                status(trigger==PgsAutoTargetPolicy.Trigger.NO_SHINY&&
                    !shinyNegativeConfirmed?"AGUARDANDO SEM SHINY":"COOLDOWN MAPA");
                handler.postDelayed(()->checkMap(stamp),1200L);return;
            }
        }
        awaitingMap=false;
        nextIndex++;
        sceneReadyAt=0;loadedStreak=0;lastColors=null;stableRepeats=0;
        if(huntTapSession&&!PgsAutoHuntPolicy.mayKeepScanning(true,huntClicks,
                PgsAutoHuntSettings.maxClicks(this))){
            int completed=huntClicks;
            halt("AUTO HUNT · LIMITE "+completed);
            notifyConfigured(PgsAutoNotificationPolicy.HUNT,
                "Auto Hunt · limite alcançado",
                "Interrompido após "+completed+
                " gesto(s) aceitos pelo Android; nenhuma captura confirmada.",false);
            return;
        }
        long huntDelay=PgsAutoHuntPolicy.nextDelayMs(
            huntTapSession,PgsAutoHuntSettings.waitSeconds(this));
        status(timeout?"TEMPO ESGOTADO":
            (huntTapSession?"PRÓXIMO EM "+(huntDelay/1000)+"s":"PRÓXIMO"));
        BugReport.log(this,"PGS",timeout?
            "Cooldown mapa esgotado sem evidência suficiente de mapa pronto; relendo feed":
            "Mapa com objetos estabilizado; Sem Shiny concluído; próximo ícone");
        huntNextAt=huntTapSession?SystemClock.uptimeMillis()+huntDelay:0L;
        handler.removeCallbacks(huntCountdownTick);
        if(huntNextAt>0L)handler.postDelayed(huntCountdownTick,1000L);
        handler.postDelayed(()->{
            if(!running||ticket!=stamp)return;
            if(nextIndex>=limit){
                nextIndex=0;total=0;visitedSlots.clear();
                notifiedFeedSlots.clear();
            }
            scanAndTap();
        },huntDelay);
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
        if(PgsAutoHostPolicy.POKEMOD.equals(PgsAutoHostSettings.current(this)))
            Toast.makeText(this,
                "Pokemod: recorte apenas o desenho do Pokémon na lista lateral. "+
                "Não inclua o círculo, o fundo do mapa ou o botão de radar.",
                Toast.LENGTH_LONG).show();
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
    private Bitmap pickerPreviewBitmap;
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

        // Recorte local visível. Tocar apenas POSICIONA; nunca salva sem confirmar.
        final PgsAutoCropSelection[] selected={null};
        final boolean[] removeFlatBackground={false};
        ImageView preview=new ImageView(this);
        preview.setScaleType(ImageView.ScaleType.FIT_CENTER);
        preview.setContentDescription("Prévia da imagem que será gravada");
        final Runnable[] updatePreview={null};
        updatePreview[0]=()->{
            if(selected[0]==null)return;
            android.graphics.Rect rect=selected[0].selectedBitmapRect();
            if(rect==null)return;
            try{
                Bitmap copy=Bitmap.createBitmap(screenshot,rect.left,rect.top,
                    rect.width(),rect.height());
                if(removeFlatBackground[0]){
                    Bitmap mask=PgsAutoSilhouette.tryRemoveFlatBackground(copy);
                    if(mask!=null){copy.recycle();copy=mask;}
                }
                Bitmap old=pickerPreviewBitmap;
                pickerPreviewBitmap=copy;
                preview.setImageBitmap(copy);
                if(old!=null&&old!=copy&&!old.isRecycled())old.recycle();
            }catch(RuntimeException ignored){}
        };
        PgsAutoCropSelection crop=new PgsAutoCropSelection(this,
            screenshot.getWidth(),screenshot.getHeight(),updatePreview[0]);
        selected[0]=crop;
        crop.setPreviewBitmap(screenshot); // lupa deslocada em tempo real
        picker.addView(crop,new FrameLayout.LayoutParams(-1,-1));



        // LT348: duas barras compactas alinhadas no rodapé. A barra lateral
        // contínua permanece na posição original; nenhuma ação salva sem OK.
        LinearLayout controlsStack=new LinearLayout(this);
        controlsStack.setOrientation(LinearLayout.VERTICAL);
        controlsStack.setGravity(Gravity.CENTER_HORIZONTAL);

        // Linha superior: CONFIRMAR à esquerda, PRÉVIA, CANCELAR à direita.
        LinearLayout actions=new LinearLayout(this);
        actions.setGravity(Gravity.CENTER);
        actions.setPadding(dp(4),dp(3),dp(4),dp(3));
        actions.setBackground(cropControlsBackground());
        ImageView confirm=cropIcon("confirmar_branco.webp",
            "Confirmar e salvar recorte",android.R.drawable.checkbox_on_background);
        ImageView cancel=cropIcon("cancelar_branco.webp",
            "Cancelar recorte",android.R.drawable.ic_menu_close_clear_cancel);
        // Reduce only artwork to 70% of the prior visible 34dp.
        // Retain full 48×46dp hit target for accessibility.
        confirm.setPadding(dp(12),dp(12),dp(12),dp(12));
        cancel.setPadding(dp(12),dp(12),dp(12),dp(12));
        preview.setPadding(dp(3),dp(3),dp(3),dp(3));
        actions.addView(confirm,new LinearLayout.LayoutParams(dp(48),dp(46)));
        actions.addView(preview,new LinearLayout.LayoutParams(dp(56),dp(46)));
        actions.addView(cancel,new LinearLayout.LayoutParams(dp(48),dp(46)));
        controlsStack.addView(actions,new LinearLayout.LayoutParams(-2,dp(52)));

        // Linha inferior: BACKGROUND | QUADRADO | LIVRE | VERTICAL.
        LinearLayout formats=new LinearLayout(this);
        formats.setGravity(Gravity.CENTER);
        formats.setPadding(dp(4),dp(3),dp(4),dp(3));
        formats.setBackground(cropControlsBackground());
        LinearLayout.LayoutParams formatsRow=new LinearLayout.LayoutParams(-2,dp(52));
        formatsRow.topMargin=dp(7);
        controlsStack.addView(formats,formatsRow);
        ImageView backgroundIcon=cropIcon("icone_background_off.webp",
            "Ativar remoção de fundo plano",android.R.drawable.ic_menu_gallery);
        backgroundIcon.setPadding(dp(12),dp(12),dp(12),dp(12));
        formats.addView(backgroundIcon,new LinearLayout.LayoutParams(dp(48),dp(46)));
        backgroundIcon.setAlpha(.94f);
        backgroundIcon.setOnClickListener(v->{
            removeFlatBackground[0]=!removeFlatBackground[0];
            setCropIconImage(backgroundIcon,removeFlatBackground[0]?
                "icone_background_on.png":"icone_background_off.webp",
                android.R.drawable.ic_menu_gallery);
            backgroundIcon.setAlpha(removeFlatBackground[0]?1f:.94f);
            backgroundIcon.setBackground(cropOptionBackground(removeFlatBackground[0]));
            backgroundIcon.setContentDescription(removeFlatBackground[0]?
                "Desativar remoção de fundo plano":"Ativar remoção de fundo plano");
            updatePreview[0].run();
        });

        // All three format glyphs use the SAME 24dp viewport, thin 1.45dp
        // strokes and centered touch cells. Original PNG/WebP kept in assets
        // for rollback; new vectors prevent mismatched strokes and centering.
        int[] icons={R.drawable.pgs_crop_square_thin,
            R.drawable.pgs_crop_free_thin,R.drawable.pgs_crop_vertical_thin};
        String[] descriptions={"Recorte quadrado","Recorte livre","Recorte vertical"};
        PgsAutoCropSelection.Mode[] values={
            PgsAutoCropSelection.Mode.SQUARE,
            PgsAutoCropSelection.Mode.FREE,
            PgsAutoCropSelection.Mode.VERTICAL};
        ImageView[] choices=new ImageView[3];
        for(int i=0;i<choices.length;i++){
            final int index=i;
            ImageView option=cropThinIcon(icons[i],descriptions[i]);
            choices[i]=option;
            option.setAlpha(i==0?1f:.94f);
            option.setBackground(cropOptionBackground(i==0));
            formats.addView(option,new LinearLayout.LayoutParams(dp(48),dp(46)));
            option.setOnClickListener(v->{
                crop.setMode(values[index]);
                option.setContentDescription(descriptions[index]);
                for(int j=0;j<choices.length;j++){
                    choices[j].setAlpha(j==index?1f:.94f);
                    choices[j].setBackground(cropOptionBackground(j==index));
                }
            });
            // Compatibilidade: segurar Vertical seleciona Horizontal legado.
            if(index==2)option.setOnLongClickListener(v->{
                crop.setMode(PgsAutoCropSelection.Mode.HORIZONTAL);
                option.setContentDescription("Recorte horizontal; toque curto volta ao vertical");
                for(int j=0;j<choices.length;j++){
                    choices[j].setAlpha(j==index?1f:.94f);
                    choices[j].setBackground(cropOptionBackground(j==index));
                }
                Toast.makeText(this,"Horizontal",Toast.LENGTH_SHORT).show();
                return true;
            });
        }
        FrameLayout.LayoutParams controlsLp=new FrameLayout.LayoutParams(
            -2,-2,Gravity.BOTTOM|Gravity.CENTER_HORIZONTAL);
        controlsLp.bottomMargin=dp(21);
        picker.addView(controlsStack,controlsLp);

        // Mesmo slider 16–92px de LT346, NÃO mover nem duplicar.
        PgsAutoCropSizeSlider slider=new PgsAutoCropSizeSlider(this,32,crop::setReferencePx);
        FrameLayout.LayoutParams sliderLp=new FrameLayout.LayoutParams(
            dp(48),dp(290),Gravity.LEFT|Gravity.CENTER_VERTICAL);
        sliderLp.leftMargin=dp(3);
        picker.addView(slider,sliderLp);

        SharedPreferences hints=getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE);
        if(!hints.getBoolean("cropGestureHintShown",false)){
            Toast.makeText(this,"Toque no ícone, ajuste o recorte pela barra ou alça e confirme.",
                Toast.LENGTH_LONG).show();
            hints.edit().putBoolean("cropGestureHintShown",true).apply();
        }
        cancel.setOnClickListener(v->{
            PgsAutoTemplateStore.clearTeaching(this);
            dismissPicker();status("PARADO");
        });
        confirm.setOnClickListener(v->{
            android.graphics.Rect cut=crop.selectedBitmapRect();
            if(cut==null){
                Toast.makeText(this,"Toque no ícone para posicionar o recorte.",
                    Toast.LENGTH_LONG).show();
                return;
            }
            try{
                int refWidth=Math.max(16,Math.min(92,
                    Math.round(cut.width()*740f/screenshot.getWidth())));
                int refHeight=Math.max(16,Math.min(92,
                    Math.round(refWidth*(float)cut.height()/cut.width())));
                Bitmap piece=Bitmap.createBitmap(screenshot,cut.left,cut.top,
                    cut.width(),cut.height());
                if(removeFlatBackground[0]){
                    Bitmap masked=PgsAutoSilhouette.tryRemoveFlatBackground(piece);
                    if(masked!=null){piece.recycle();piece=masked;}
                }
                Bitmap model=Bitmap.createScaledBitmap(piece,refWidth,refHeight,true);
                try{PgsAutoTemplateStore.saveSample(this,name,model,refWidth,refHeight);}
                finally{if(piece!=model)piece.recycle();model.recycle();}
                PgsAutoTemplateStore.clearTeaching(this);
                dismissPicker();
                boolean ready=reloadDetector();
                status(ready?"PARADO":"SEM MODELO");
                Toast.makeText(this,ready?
                    name+" gravado. Modelos preservados; retomando busca.":
                    name+" salvo. Ative-o na lupa para pesquisar.",
                    Toast.LENGTH_LONG).show();
                if(ready)handler.postDelayed(()->{
                    if(!running&&isGameVisible())toggle();
                },450L);
            }catch(Exception e){
                showReason("Não consegui salvar a imagem: "+e.getMessage());
            }
        });

        WindowManager.LayoutParams params=new WindowManager.LayoutParams(-1,-1,
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT);
        params.gravity=Gravity.TOP|Gravity.LEFT;
        try{windowManager.addView(picker,params);}
        catch(Exception e){dismissPicker();showReason("Não consegui abrir seleção: "+e.getMessage());}
    }


    private GradientDrawable cropControlsBackground(){
        GradientDrawable bg=new GradientDrawable();
        // 70% transparent grey surface (30% opacity), no bright blue outline.
        bg.setColor(0x4D35373D);
        bg.setCornerRadius(dp(13));
        bg.setStroke(dp(1),0x33FFFFFF);
        return bg;
    }
    private GradientDrawable cropOptionBackground(boolean selected){
        GradientDrawable bg=new GradientDrawable();
        bg.setColor(selected?0x334C5864:Color.TRANSPARENT);
        bg.setCornerRadius(dp(8));
        return bg;
    }

    private ImageView cropThinIcon(int drawable,String desc){
        ImageView icon=new ImageView(this);
        icon.setScaleType(ImageView.ScaleType.FIT_CENTER);
        icon.setImageResource(drawable);
        icon.setPadding(dp(8),dp(8),dp(8),dp(8));
        icon.setContentDescription(desc);
        icon.setFocusable(true);
        icon.setClickable(true);
        return icon;
    }

    private ImageView cropIcon(String asset,String desc,int fallback){
        ImageView icon=new ImageView(this);
        icon.setScaleType(ImageView.ScaleType.FIT_CENTER);
        icon.setPadding(dp(7),dp(7),dp(7),dp(7));
        icon.setContentDescription(desc);
        icon.setFocusable(true);
        icon.setClickable(true);
        setCropIconImage(icon,asset,fallback);
        return icon;
    }
    private void setCropIconImage(ImageView icon,String asset,int fallback){
        // Artes Background On/Off originais importadas dos anexos LT346;
        // fallback apenas defensivo contra asset ausente/corrompido.
        try(InputStream input=getAssets().open("pgs-crop/"+asset)){
            Bitmap bitmap=BitmapFactory.decodeStream(input);
            if(bitmap==null)throw new IOException("Ícone vazio: "+asset);
            icon.setImageBitmap(bitmap);
        }catch(IOException e){icon.setImageResource(fallback);}
    }

    private void dismissPicker(){
        teachingInProgress=false;
        if(picker!=null && windowManager!=null){
            try{windowManager.removeView(picker);}catch(Exception ignored){}
            picker=null;
        }
        if(pickerPreviewBitmap!=null){pickerPreviewBitmap.recycle();pickerPreviewBitmap=null;}
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
        passengerHoldAt=0L;passengerWarningLatched=false;
        sceneBeforeGesture=null;sceneChangedAfterGesture=false;sceneUnchangedLogged=false;
        ticket++;nextIndex=0;total=0;visitedSlots.clear();notifiedFeedSlots.clear();noFreshAttempts=0;verifyMisses=0;emptyRetries=0;currentTargetName="";
        huntTapSession=false;huntClicks=0;mapReadFailures=0;huntNextAt=0L;
        handler.removeCallbacks(huntCountdownTick);
        refreshHuntProximity();
        status(label);
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
    /**
     * LT366: notificação somente da janela do JOGO. Palavra isolada não
     * comprova IV100/Ditto; só paramos se a mensagem menciona o alvo atual
     * e o serviço já aguardava esse mapa. Não há teleporte por notificação.
     */
    public static void onAutoHuntNotice(String message){
        PgsAutoClickService live=instance;
        if(live==null||message==null||message.length()>600)return;
        live.handler.post(()->{
            if(!live.running||!live.awaitingMap||!live.huntTapSession||
                !PgsAutoHuntSettings.enabled(live)||!live.isGameVisible()||
                live.gameAccountSafetyNoticePresent()||live.passengerPromptPresent())return;
            String kind=PgsAutoHuntPolicy.explicitNotice(
                message,live.currentTargetName);
            SharedPreferences prefs=PgsAutoHuntSettings.forCurrent(live);
            boolean isIv=PgsAutoHuntPolicy.IV100.equals(kind)&&
                prefs.getBoolean(PgsAutoHuntSettings.STOP_IV100,true);
            boolean isDitto=PgsAutoHuntPolicy.DITTO.equals(kind)&&
                prefs.getBoolean(PgsAutoHuntSettings.STOP_DITTO,true);
            if(!isIv&&!isDitto)return;
            String title=isIv?"IV100":"Ditto";
            String target=live.currentTargetName;
            live.running=false;live.awaitingMap=false;live.huntTapSession=false;
            live.huntNextAt=0L;
            live.handler.removeCallbacks(live.huntCountdownTick);
            live.refreshHuntProximity();
            live.ticket++;live.armedByHome=false;
            live.status("AUTO HUNT · "+title+" · PAUSADO");
            BugReport.log(live,"PGS","LT366 Auto Hunt: alerta textual explícito "+
                title+" para alvo "+target+"; jogo NÃO verificado");
            live.notifyConfigured(PgsAutoNotificationPolicy.HUNT,
                "Auto Hunt pausado · "+title,
                "Notificação nomeia "+target+". Verifique no jogo. "+
                "Nenhuma captura ou IV foi confirmada pelo PokeSearch.",true);
        });
    }
    public static void onPgsharpShiny(String message){
        PgsAutoClickService live=instance;
        if(live!=null)live.handler.post(()->{
            if(!live.running||!live.awaitingMap)return;
            if(PgsAutoShinySignal.isExplicitNegative(message)){
                if(live.tapMode!=PgsAutoTargetPolicy.Mode.SPRITE){
                    live.shinyNegativeConfirmed=true;
                    BugReport.log(live,"PGS","Aviso explícito de ausência de Shiny registrado para gatilho");
                }
                return;
            }
            if(live.tapMode!=PgsAutoTargetPolicy.Mode.SPRITE&&
               PgsAutoShinySignal.isPositive(message)){
                live.running=false;live.awaitingMap=false;live.pausedByShiny=true;live.ticket++;
                live.status("✨ SHINY\\nPAUSADO");
                live.notifyConfigured(PgsAutoNotificationPolicy.SHINY,
                    "PGS: Shiny explícito","Detecção do jogo; sequência pausada.",true);
                return;
            }
            live.pauseForShiny(message);
        });
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
            boolean isHunt=PgsAutoNotificationPolicy.HUNT.equals(kind);
            SharedPreferences huntPrefs=isHunt?
                PgsAutoHuntSettings.forCurrent(this):null;
            String mode=isHunt?
                (huntPrefs.getBoolean(PgsAutoHuntSettings.RINGTONE,true)?
                    "strong":"mute"):
                PgsAutoNotificationPolicy.mode(kind,
                    prefs.getString(kind,PgsAutoNotificationPolicy.defaultMode(kind)));
            int index=prefs.getInt(kind+"SoundIndex",PgsAutoNotificationPolicy.SHINY.equals(kind)?21:0);
            if("off".equals(mode))return; // OFF não gera notificação nem som.
            if("custom".equals(mode)&&(index<0||index>=PokeSoundLibrary.size()))
                mode="default"; // Não criar canal sem som por índice corrompido.
            String channelId=PgsAutoNotificationPolicy.channelId(kind,mode,index);
            boolean isShiny=PgsAutoNotificationPolicy.SHINY.equals(kind);
            boolean vibrate=isHunt?
                huntPrefs.getBoolean(PgsAutoHuntSettings.VIBRATE,true):
                (isShiny&&prefs.getBoolean("shinyVibrate",true));
            if(isShiny||isHunt){
                if(isHunt)channelId+="_"+PgsAutoHostSettings.current(this);
                channelId+=vibrate?"_vibrate":"_no_vibrate";
            }
            if(manager.getNotificationChannel(channelId)==null){
                String titleChannel=isHunt?"PokeSearch · Auto Hunt · "+
                    PgsAutoHostPolicy.displayLabel(PgsAutoHostSettings.current(this)):
                    isShiny?"PGS · Shiny":
                    PgsAutoNotificationPolicy.NEW.equals(kind)?"PGS · Novos Pokémon":
                    "PGS · Pokémon de buscas";
                NotificationChannel channel=new NotificationChannel(channelId,titleChannel,
                    (isShiny||isHunt)?NotificationManager.IMPORTANCE_HIGH:
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
                    .setUsage((isShiny||isHunt)?AudioAttributes.USAGE_ALARM:
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

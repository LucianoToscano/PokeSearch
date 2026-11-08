package com.lucianotoscano.pokesearchoverlay;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.widget.Toast;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.ColorFilter;
import android.graphics.Rect;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.Settings;
import android.util.Base64;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
/**
 * A dedicated, opt-in MANUAL helper for the "Dia de Reides / Bug dos Passes"
 * tutorial in the video supplied by the user. It does not spoof locations,
 * interact with Pokemon GO, promise passes or validate the alleged exploit.
 * Its small pass-shaped bubble is separate from P1/P2 and Rare Candy.
 */
public final class RaidDayAssistantOverlayService extends Service {
    static final String ACTION_STOP="com.lucianotoscano.pokesearch.RAID_DAY_GUIDE_STOP";
    private static final String CHANNEL="pokesearch_raid_day_guide";
    private static final int NOTIFICATION_ID=1988;
    private static final int BUBBLE_DP=48, ART_DP=45;
    private static volatile boolean running;
    public static boolean isRunning(){return running;}

    // Os textos e a ordem E01–E11 vêm do JSON validado, não de arrays Java.

    private final Handler handler=new Handler(Looper.getMainLooper());
    private WindowManager wm;
    private FrameLayout bubble;
    private LinearLayout panel;
    private ScrollView panelScroll;
    private WindowManager.LayoutParams bubbleParams,panelParams;
    private SharedPreferences prefs;
    private TextView progressText,titleText,instructionText,statusText,confirmButton,pauseButton;
    private TextView copyButton,repeatButton,cycleText,skipButton;
    private TextView riskContinue,riskExit,startButton,trainButton,trainingExit;
    private TextView notHappenedButton,helpButton,endButton;
    private LinearLayout cycleActions,guideContent,riskSection,startSection,preparationSection,preparationChoices,raidRecordActions;
    private ProgressBar progressBar;
    private TextView prepTitle,prepStatus,clockText,summaryText,prepBack,prepNext;
    private TextView eventWindowText;
    // Edu: interface de conversa, isolada das opções avançadas.
    static final String ACTION_CONSENT_DONE="com.lucianotoscano.pokesearch.EDU_CONSENT_DONE";
    private boolean demoToday=false,eduWantsReal=false,eduSettingsOpen=false;
    private boolean eduHelpOpen=false,eduCaptureQuestion=false,eduMovePanel=false,eduRecordingExtraRaid=false;
    private String eduNote="";
    // Subperguntas por etapa: nunca concluir só por chegada, espera ou OCR.
    private String eduDialogueState="";
    private boolean eduIntroAccepted=false;
    // Etapa final relatada só uma vez; persistida em eventos da sessão real.
    private boolean eduKiribatiAttempted=false;
    private LinearLayout eduWelcome,eduSettings,eduActions,eduMiniActions,eduMainCard;
    private TextView eduHeader,eduBadge,eduSpeech,eduSubline,eduSettingsClose;
    private TextView eduPrepQuestion,eduPrepCaption;
    private int eduPanelWidth=0;
    private EduSpeechDrawable eduSpeechBackground;

    private TextView visualStatus,visualToggle,visualAccept,visualReject;
    private LinearLayout visualActions;
    private String visualCandidate="";
    private long visualSeenAt=0L;
    private final Runnable visualTicker=new Runnable(){
        @Override public void run(){
            updateVisual();
            handler.postDelayed(this,1600L);
        }
    };
    private RaidDayPreparation preparation;
    // TODAS as datas e verificações do Edu usam o mesmo relógio do ícone
    // dos passes, ajustável para testar eventos. Nenhuma fonte paralela.
    private Clock eventClock;
    private LocalDate lastEduClockDay;
    private Clock eduTrainingOrRealClock(){return eventClock;}
    private final Runnable clockPulse=new Runnable(){
        @Override public void run(){
            if(eventClock!=null){
                LocalDate day=EduEventClock.today(
                    RaidDayAssistantOverlayService.this);
                if(lastEduClockDay!=null&&!day.equals(lastEduClockDay)&&
                    visible&&eduSpeech!=null)updateStep();
                lastEduClockDay=day;
            }
            if(eduBadge!=null)updateEventClock();
            // Atualiza a conversa quando o relógio manual cruza meia-noite.
            handler.postDelayed(this,5000L);
        }
    };
    private boolean paused=false,finished=false,visible=false,dragging=false;
    private boolean active=false,training=false,riskAccepted=false,endPending=false;
    private RaidDayGuidePlan plan;
    private RaidDayDatabase journal;
    private String eventKey="evento_nao_configurado",sessionKey="";
    private int index=0;
    private int repeatedCycles=0;
    private long lastConfirmAt=0L;
    private int touchSlop;
    private Bitmap artwork;
    private RaidDayAvatarFrames avatarSprites;
    private EduSpriteAtlas eduSprites; // LT309: 62 quadros; atlas LT304 permanece fallback
    private ImageView avatarView;
    private TextView[] avatarSizeButtons;
    private TextView avatarMotionButton;
    private int avatarSizeIndex=2,avatarAnimationTick=0,avatarReactionFrame=-1;
    private long avatarReactionUntil=0L;
    private boolean avatarMotion=true;
    private String eduAnimationName="",eduReactionState="";
    private long eduAnimationStartedAt=0L,eduDragStartedAt=0L,eduReactionStateUntil=0L;
    // Exibição de efeitos não implica teleporte, passe, vitória ou evento confirmado.
    private int eduCurrentFrame(long now){
        if(dragging){
            int[] frames=EduSpriteAtlas.sequence("arrastando");
            int tick=(int)Math.max(0,(now-eduDragStartedAt)/185L);
            return frames[Math.min(frames.length-1,tick)];
        }
        if(!eduAnimationName.isEmpty()){
            int[] frames=EduSpriteAtlas.sequence(eduAnimationName);
            if(frames.length>0){
                long duration=EduSpriteAtlas.durationMs(eduAnimationName);
                int tick=(int)Math.max(0,(now-eduAnimationStartedAt)/duration);
                if(tick<frames.length)return frames[tick];
                // Reproduz uma passagem por gatilho. Nunca caminha
                // indefinidamente parado na tela.
            }
            eduAnimationName="";
        }
        if(!eduReactionState.isEmpty()&&now<eduReactionStateUntil)
            return EduSpriteAtlas.indexForState(eduReactionState);
        eduReactionState="";
        return EduSpriteAtlas.indexForState(eduContextState());
    }
    private String eduContextState(){
        if(finished)return "resumo_concluido";
        if(eduSettingsOpen)return "perguntando";
        if(paused)return "parado";
        if(eduCaptureQuestion)return "perguntando";
        if(!eduIntroAccepted||(!active&&!training))return "apresentacao";
        if(plan==null||index<0||index>=plan.size())return "parado";
        String id=plan.step(index).id;
        if("E01".equals(id)){
            if("pre_softban".equals(eduDialogueState))return "softban_aviso";
            if("pre_blocked".equals(eduDialogueState))return "alerta";
            if("pass_wait".equals(eduDialogueState))return "sem_passe_disponivel";
            return "guardar_passe_vespera";
        }
        if("E02".equals(id)||"E05".equals(id)){
            if("travel_reload".equals(eduDialogueState)&&"E05".equals(id))
                return "fechar_reabrir_jogo";
            if("travel_wait".equals(eduDialogueState)||
                "travel_reload".equals(eduDialogueState))
                return "esperando_carregamento_1";
            return "ir_local_evento_escolhido";
        }
        if("E03".equals(id)||"E06".equals(id)){
            if("nz_retry_reload".equals(eduDialogueState))
                return "fechar_reabrir_jogo";
            if("nz_retry_offer".equals(eduDialogueState))
                return "sem_passe_disponivel";
            return "conferir_passes";
        }
        if("E04".equals(id))
            return "raid_interrupted".equals(eduDialogueState)?
                "reide_perdida":"iniciar_reide";
        if("E07".equals(id))return "repetir_ciclo";
        if("E08".equals(id)){
            RaidDayRegionalWindow.Phase phase=eduConfiguredPhase();
            if(phase==RaidDayRegionalWindow.Phase.BEFORE)return "evento_nao_comecou";
            if(phase==RaidDayRegionalWindow.Phase.ENDED)return "evento_ja_acabou";
            if(phase==RaidDayRegionalWindow.Phase.ACTIVE)return "evento_comecou";
            if("event_wait".equals(eduDialogueState))
                return "evento_nao_comecou";
            if("event_pass".equals(eduDialogueState)||
                "event_pass_wait".equals(eduDialogueState))
                return "evento_comecou";
            return "perguntando";
        }
        if(("E09".equals(id)||"E10".equals(id))&&
            eduConfiguredPhase()==RaidDayRegionalWindow.Phase.ENDED)
            return "evento_ja_acabou";
        if("E09".equals(id))
            return "kiribati_reload".equals(eduDialogueState)||
                "kiribati_wait".equals(eduDialogueState)?
                "fechar_reabrir_jogo":"ir_local_evento_escolhido";
        if("E10".equals(id)){
            if("event_empty".equals(eduDialogueState))return "sem_passe_disponivel";
            if(eduRecordingExtraRaid)return "esperando_batalha_reide";
            return "conferir_passes";
        }
        if("E11".equals(id))return "resumo_concluido";
        return "parado";
    }
    private void reactEdu(String name){
        if(eduSprites==null||!avatarMotion)return;
        eduAnimationName="";
        eduReactionState=name;
        eduReactionStateUntil=SystemClock.elapsedRealtime()+1250L;
        if(avatarView!=null)avatarView.setImageDrawable(eduSprites.state(name));
    }
    private void playEduAnimation(String name){
        if(eduSprites==null||!avatarMotion)return;
        int[] frames=EduSpriteAtlas.sequence(name);
        if(frames.length==0)return;
        eduAnimationName=name;eduAnimationStartedAt=SystemClock.elapsedRealtime();
        if(avatarView!=null)avatarView.setImageDrawable(eduSprites.frame(frames[0]));
    }
    private void playEduStepTransition(){
        if(plan==null||finished||eduSprites==null||!avatarMotion)return;
        String id=plan.step(index).id;
        if("E02".equals(id)||"E05".equals(id)||"E09".equals(id))
            playEduAnimation("caminhada_direita");
        else if("E03".equals(id)||"E06".equals(id)||"E10".equals(id))
            playEduAnimation("caminhada_esquerda");
        else playEduAnimation("caminhada_frente");
    }
    private final Runnable avatarTicker=new Runnable(){
        @Override public void run(){
            if(eduSprites!=null){
                if(avatarView==null||!avatarMotion)return;
                long now=SystemClock.elapsedRealtime();
                avatarView.setImageDrawable(eduSprites.frame(eduCurrentFrame(now)));
                avatarAnimationTick++;
                handler.postDelayed(this,dragging?180L:
                    eduAnimationName.isEmpty()?500L:160L);
                return;
            }
            if(avatarSprites==null||avatarView==null||!avatarMotion)return;
            int frame;
            long now=SystemClock.elapsedRealtime();
            if(dragging){
                frame=RaidDayAvatarFrames.WALK_0+
                    (avatarAnimationTick%4);
            }else if(now<avatarReactionUntil && avatarReactionFrame>=0){
                frame=avatarReactionFrame;
            }else if(paused){
                frame=RaidDayAvatarFrames.IDLE_B;
            }else{
                frame=(avatarAnimationTick%2==0)?
                    RaidDayAvatarFrames.IDLE_A:RaidDayAvatarFrames.IDLE_B;
            }
            avatarView.setImageDrawable(avatarSprites.frame(frame));
            avatarAnimationTick++;
            handler.postDelayed(this,dragging?180L:450L);
        }
    };

    private int dp(int v){return Math.round(v*getResources().getDisplayMetrics().density);}
    private GradientDrawable surface(int fill,int border,int radius){
        GradientDrawable drawable=new GradientDrawable();
        drawable.setColor(fill);drawable.setCornerRadius(dp(radius));
        if(border!=0)drawable.setStroke(dp(1),border);
        return drawable;
    }
    private TextView text(String value,int size,int color,boolean bold){
        TextView view=new TextView(this);
        view.setText(value);view.setTextSize(size);view.setTextColor(color);
        if(bold)view.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        view.setGravity(Gravity.CENTER_VERTICAL);
        return view;
    }
    private TextView button(String label){
        TextView b=text(label,12,Color.rgb(38,47,56),true);
        b.setGravity(Gravity.CENTER);
        b.setMinHeight(dp(35));
        b.setPadding(dp(7),dp(3),dp(7),dp(3));
        b.setBackground(surface(Color.rgb(253,253,253),Color.rgb(183,191,199),22));
        b.setElevation(dp(2));
        b.setClickable(true);
        return b;
    }
    public static Bitmap loadArtwork(android.content.Context context){
        try(InputStream stream=context.getAssets().open("raid_assistant_icon.b64")){
            ByteArrayOutputStream out=new ByteArrayOutputStream();
            byte[] buffer=new byte[4096];int n;
            while((n=stream.read(buffer))!=-1)out.write(buffer,0,n);
            byte[] bytes=Base64.decode(
                new String(out.toByteArray(),StandardCharsets.US_ASCII),Base64.DEFAULT);
            return BitmapFactory.decodeByteArray(bytes,0,bytes.length);
        }catch(Exception ignored){return null;}
    }
    @Override public IBinder onBind(Intent intent){return null;}
    @Override public void onCreate(){
        super.onCreate();
        if(Build.VERSION.SDK_INT>=23&&!Settings.canDrawOverlays(this)){
            stopSelf();return;
        }
        if(!AppAvailability.isAllowed(this)){
            stopSelf();return;
        }
        prefs=getSharedPreferences("raid_assistant_overlay",MODE_PRIVATE);
        eventClock=EduEventClock.forEdu(this);
        preparation=RaidDayPreparation.load(this,prefs,eventClock);
        try{
            plan=RaidDayGuidePlan.load(this);
            journal=RaidDayDatabase.get(this);
            eventKey=prefs.getString("eventKey","evento_nao_configurado");
            int generation=Math.max(1,prefs.getInt("sessionGeneration",1));
            sessionKey=eventKey+"#"+generation;
            riskAccepted=(plan.riskVersion+":"+eventKey).equals(
                prefs.getString("riskAcceptance",""));
            restoreJournal();
        }catch(Exception invalid){
            Toast.makeText(this,"Não foi possível carregar o roteiro do Dia de Reides",
                Toast.LENGTH_LONG).show();
            stopSelf();return;
        }
        // G (100 pixels) e o tamanho inicial para quem ainda nao escolheu.
        // Uma preferencia de P/M/G previamente salva continua respeitada.
        int savedAvatarSize=prefs.getInt(RaidDayAvatarFrames.PREF_SIZE,100);
        avatarSizeIndex=savedAvatarSize==50?0:savedAvatarSize==75?1:2;
        avatarMotion=prefs.getBoolean(RaidDayAvatarFrames.PREF_MOTION,true);
        avatarSprites=RaidDayAvatarFrames.load(this);
        try{eduSprites=EduSpriteAtlas.load(this);}
        catch(Exception invalidAtlas){eduSprites=null;} // Sem crash: usar LT304
        touchSlop=ViewConfiguration.get(this).getScaledTouchSlop();
        wm=(WindowManager)getSystemService(WINDOW_SERVICE);
        if(wm==null){stopSelf();return;}
        NotificationManager nm=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
        nm.createNotificationChannel(new NotificationChannel(
            CHANNEL,"PokeSearch · Assistente do Dia de Reides",NotificationManager.IMPORTANCE_LOW));
        Intent stop=new Intent(this,RaidDayAssistantOverlayService.class).setAction(ACTION_STOP);
        PendingIntent stopAction=PendingIntent.getService(this,1988,stop,
            PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification note=new Notification.Builder(this,CHANNEL)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("PokeSearch · Assistente do Dia de Reides")
            .setContentText("Guia manual ativo · toque no ícone flutuante")
            .setOngoing(true)
            .addAction(new Notification.Action.Builder(
                android.R.drawable.ic_menu_close_clear_cancel,
                "Desativar",stopAction).build())
            .build();
        startForeground(NOTIFICATION_ID,note);
        artwork=loadArtwork(this);
        try{
            createBubble();
            createPanel();
            updateStep();
            handler.post(clockPulse);
            handler.post(visualTicker);
            running=true;
        }catch(RuntimeException error){
            stopSelf();
        }
    }
    @Override public int onStartCommand(Intent intent,int flags,int startId){
        if(intent!=null&&ACTION_STOP.equals(intent.getAction())){
            stopSelf();return START_NOT_STICKY;
        }
        if(intent!=null&&ACTION_CONSENT_DONE.equals(intent.getAction())){
            if(bubble!=null)bubble.setVisibility(View.VISIBLE);
            // A janela permanece recolhida para não obstruir o diálogo do Android.
            updateStep();
            return START_NOT_STICKY;
        }
        return START_NOT_STICKY;
    }
    /**
     * Reconstrói o estado a partir do registro Room da sessão real.
     * O Modo Treino é efêmero e nunca escreve nesses eventos.
     */
    private void restoreJournal(){
        index=0;repeatedCycles=0;paused=false;finished=false;active=false;
        eduKiribatiAttempted=false;
        java.util.List<RaidDayEvent> events=journal.events().all(sessionKey);
        if(events.isEmpty()){
            // Migração cautelosa do protótipo LT304 anterior: não apagar o progresso.
            if(prefs.contains("step")){
                int old=Math.max(0,Math.min(10,prefs.getInt("step",0)));
                int[] oldToV2={0,1,1,2,3,4,5,7,8,9,10};
                index=oldToV2[old];
                repeatedCycles=Math.max(0,Math.min(100,prefs.getInt("repeatedCycles",0)));
                finished=prefs.getBoolean("finished",false);
                paused=prefs.getBoolean("paused",false);
                active=true;
                appendEvent("LEGACY_IMPORTED");
                prefs.edit().remove("step").remove("repeatedCycles")
                    .remove("finished").remove("paused").apply();
            }
            return;
        }
        for(RaidDayEvent item:events){
            index=Math.max(0,Math.min(plan.size()-1,item.nextIndex));
            repeatedCycles=Math.max(0,Math.min(100,item.cycleCount));
            paused=item.paused;finished=item.finished;active=item.active;
            if("KIRIBATI_MAP_LOADED".equals(item.type)||
                "KIRIBATI_SKIPPED".equals(item.type))
                eduKiribatiAttempted=true;
        }
        // Se o jogo fechar entre chegar à região e carregar o mapa,
        // retomar a mesma pergunta, sem pular a confirmação humana.
        eduDialogueState="";
        String identity=sessionKey+":"+plan.step(index).id;
        if(active&&!finished&&identity.equals(prefs.getString("edu_dialogue_identity","")))
            eduDialogueState=prefs.getString("edu_dialogue_state","");
    }
    private void setEduDialogueState(String state){
        eduDialogueState=state==null?"":state;
        if(training||!active||prefs==null)return;
        prefs.edit().putString("edu_dialogue_state",eduDialogueState)
            .putString("edu_dialogue_identity",
                sessionKey+":"+plan.step(index).id).apply();
    }
    private LocalDate eduEventLocalToday(){
        if(!training&&preparation!=null&&RaidDaySchedule.valid(
            RaidDaySchedule.start(this),RaidDaySchedule.finish(this))&&
            preparation.eventDate()!=null&&preparation.eventDate().equals(
                RaidDaySchedule.eventDate(this)))
            return RaidDayRegionalWindow.day(eventClock.instant(),
                RaidDaySchedule.zone(this));
        return EduEventClock.today(this);
    }
    private RaidDayRegionalWindow.Phase eduConfiguredPhase(){
        if(training||preparation==null||preparation.eventDate()==null||
            !preparation.eventDate().equals(RaidDaySchedule.eventDate(this)))
            return RaidDayRegionalWindow.Phase.UNKNOWN;
        return RaidDaySchedule.phase(this,eventClock.instant());
    }
    private void editEduEventRegion(){
        startActivity(new Intent(this,RaidDayEventSettingsActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
    }
    private String eduEventWhen(){
        LocalDate date=training&&demoToday?
            EduEventClock.today(this):
            preparation.eventDate();
        if(date==null)return "data ainda não informada";
        DateTimeFormatter dateOnly=DateTimeFormatter.ofPattern("dd/MM/yyyy",
            Locale.forLanguageTag("pt-BR"));
        long begin=RaidDaySchedule.start(this);
        long end=RaidDaySchedule.finish(this);
        if(!training&&RaidDaySchedule.valid(begin,end)){
            java.time.ZoneId zone=RaidDaySchedule.zone(this);
            java.time.ZonedDateTime start=Instant.ofEpochMilli(begin).atZone(zone);
            if(start.toLocalDate().equals(date)){
                return start.format(DateTimeFormatter.ofPattern(
                    "dd/MM/yyyy 'às' HH:mm",Locale.forLanguageTag("pt-BR")))+
                    " em "+zone.getId()+
                    (RaidDaySchedule.isChandelureExample(this)?
                        " (exemplo histórico oficial)":
                        " (horário informado por você, não verificado)");
            }
        }
        return date.format(dateOnly)+(training?
            " (evento fictício, sem horário definido)":
            " (horário não informado)");
    }
    private void appendEvent(String type){
        appendEvent(type,plan.step(index).id);
    }
    private void appendEvent(String type,String actedOnStep){
        if(training||journal==null)return;
        RaidDayEvent event=new RaidDayEvent();
        event.sessionKey=sessionKey;
        event.type=type;
        event.stepId=actedOnStep;
        event.occurredAtMs=System.currentTimeMillis();
        event.nextIndex=index;
        event.cycleCount=repeatedCycles;
        event.paused=paused;
        event.finished=finished;
        event.active=active;
        journal.events().add(event);
    }
    private void beginRealSession(){
        if(active||training||!eduDateConfirmed()||!riskAccepted)return;
        LocalDate today=eduEventLocalToday();
        LocalDate date=preparation.eventDate();
        if(date==null||(!today.equals(date.minusDays(1))&&!today.equals(date))){
            eduNote="O roteiro real só começa na véspera (D−1) "+
                "ou no próprio dia do evento (D). Confira o relógio do Edu.";
            updateStep();
            return;
        }
        if(today.isAfter(date)){
            Toast.makeText(this,"A data informada já passou. Confira o relógio do Edu ou edite o evento.",
                Toast.LENGTH_LONG).show();
            return;
        }
        if(journal.events().count(sessionKey)>0){
            int generation=Math.max(1,prefs.getInt("sessionGeneration",1))+1;
            prefs.edit().putInt("sessionGeneration",generation).apply();
            sessionKey=eventKey+"#"+generation;
        }
        index=today.equals(date)?plan.indexOf("E08"):0;
        if(index<0)index=0;
        repeatedCycles=0;paused=false;finished=false;active=true;
        eduKiribatiAttempted=false;
        setEduDialogueState("");
        appendEvent(today.equals(date)?"STARTED_DAY_D":"STARTED");
        reactAvatar(RaidDayAvatarFrames.WAVE);
        updateStep();
    }
    private void beginTraining(){
        if(!demoToday&&(!riskAccepted||!preparation.isComplete()))return;
        training=true;active=false;index=0;repeatedCycles=0;
        eduKiribatiAttempted=false;
        eduDialogueState="";
        paused=false;finished=false;endPending=false;
        eduCaptureQuestion=false;eduRecordingExtraRaid=false;
        eduHelpOpen=false;eduSettingsOpen=false;
        reactAvatar(RaidDayAvatarFrames.WAVE);
        updateStep();
    }
    private void startDemoToday(){
        // Compatibilidade com sessões de treino antigas: a mesma fonte
        // de tempo é compartilhada com o Edu, não há relógio independente.
        demoToday=true;
        eduWantsReal=false;
        eduNote="";
        beginTraining(); // Modo Treino não grava eventos reais.
    }
    private void leaveTraining(){
        training=false;demoToday=false;eduWantsReal=false;
        eduRecordingExtraRaid=false;
        eduSettingsOpen=false;eduHelpOpen=false;eduCaptureQuestion=false;
        restoreJournal();updateStep();
    }

    private void reactAvatar(int frame){
        if(eduSprites!=null){
            if(frame==RaidDayAvatarFrames.WAVE)
                playEduAnimation("pokebola_gesto");
            else if(frame==RaidDayAvatarFrames.QUESTION)
                reactEdu("perguntando");
            else if(frame==RaidDayAvatarFrames.ALERT)
                reactEdu("alerta");
            else if(frame==RaidDayAvatarFrames.OK)
                reactEdu("confirmando");
            else reactEdu("parado");
            return;
        }
        if(avatarSprites==null||!avatarMotion)return;
        avatarReactionFrame=frame;
        avatarReactionUntil=SystemClock.elapsedRealtime()+1250L;
        if(avatarView!=null)avatarView.setImageDrawable(avatarSprites.frame(frame));
    }
    private void updateAvatarSize(){
        if(avatarView==null||bubbleParams==null||wm==null)return;
        int art=avatarSprites!=null?
            RaidDayAvatarFrames.SIZES_PX[avatarSizeIndex]:dp(ART_DP);
        avatarView.setLayoutParams(new FrameLayout.LayoutParams(
            art,art,Gravity.CENTER));
        int target=Math.max(dp(BUBBLE_DP),art+dp(6));
        bubbleParams.width=target;bubbleParams.height=target;
        int maxX=Math.max(0,getResources().getDisplayMetrics().widthPixels-target);
        int maxY=Math.max(0,getResources().getDisplayMetrics().heightPixels-target);
        bubbleParams.x=Math.max(0,Math.min(maxX,bubbleParams.x));
        bubbleParams.y=Math.max(0,Math.min(maxY,bubbleParams.y));
        try{wm.updateViewLayout(bubble,bubbleParams);}
        catch(IllegalArgumentException ignored){}
        prefs.edit().putInt("x",bubbleParams.x).putInt("y",bubbleParams.y)
            .putInt(RaidDayAvatarFrames.PREF_SIZE,
                RaidDayAvatarFrames.SIZES_PX[avatarSizeIndex]).apply();
        if(avatarSizeButtons!=null){
            for(int i=0;i<avatarSizeButtons.length;i++){
                avatarSizeButtons[i].setTextColor(i==avatarSizeIndex?
                    Color.rgb(118,235,195):Color.WHITE);
            }
        }
        if(visible){
            placePanelCoordinates();
            placePanel();
        }
    }
    private void setAvatarMotion(boolean enabled){
        avatarMotion=enabled;
        prefs.edit().putBoolean(RaidDayAvatarFrames.PREF_MOTION,enabled).apply();
        handler.removeCallbacks(avatarTicker);
        if(avatarView!=null&&(avatarSprites!=null||eduSprites!=null)){
            if(enabled)handler.post(avatarTicker);
            else if(eduSprites!=null)
                avatarView.setImageDrawable(eduSprites.state(eduContextState()));
            else avatarView.setImageDrawable(avatarSprites.frame(
                RaidDayAvatarFrames.IDLE_A));
        }
        if(avatarMotionButton!=null)
            avatarMotionButton.setText(enabled?"Animação ✓":"Animação ×");
    }
    private void createBubble(){
        bubble=new FrameLayout(this);
        bubble.setBackgroundColor(Color.TRANSPARENT);
        avatarView=new ImageView(this);
        avatarView.setScaleType(ImageView.ScaleType.FIT_CENTER);
        avatarView.setContentDescription("Personagem interativo do Assistente do Dia de Reides");
        if(eduSprites!=null)
            avatarView.setImageDrawable(eduSprites.state("parado"));
        else if(avatarSprites!=null)
            avatarView.setImageDrawable(avatarSprites.frame(RaidDayAvatarFrames.IDLE_A));
        else if(artwork!=null)avatarView.setImageBitmap(artwork);
        else avatarView.setImageResource(R.drawable.ic_notification);
        int artSize=avatarSprites!=null?
            RaidDayAvatarFrames.SIZES_PX[avatarSizeIndex]:dp(ART_DP);
        bubble.addView(avatarView,new FrameLayout.LayoutParams(
            artSize,artSize,Gravity.CENTER));
        View grip=new View(this);
        grip.setClickable(true);
        grip.setContentDescription(
            "Edu: toque para conversar, segure por um segundo para ajustes, arraste para mover");
        bubble.addView(grip,new FrameLayout.LayoutParams(-1,-1));
        bubbleParams=new WindowManager.LayoutParams(
            dp(BUBBLE_DP),dp(BUBBLE_DP),WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,PixelFormat.TRANSLUCENT);
        bubbleParams.gravity=Gravity.TOP|Gravity.LEFT;
        int touchSize=Math.max(dp(BUBBLE_DP),artSize+dp(6));
        bubbleParams.width=touchSize;
        bubbleParams.height=touchSize;
        int maxX=Math.max(0,getResources().getDisplayMetrics().widthPixels-touchSize);
        int maxY=Math.max(0,getResources().getDisplayMetrics().heightPixels-touchSize);
        bubbleParams.x=Math.max(0,Math.min(maxX,prefs.getInt("x",dp(80))));
        bubbleParams.y=Math.max(0,Math.min(maxY,prefs.getInt("y",dp(310))));
        grip.setOnTouchListener(new View.OnTouchListener(){
            private float downX,downY;
            private int startX,startY;
            private boolean held;
            // Ajustes ficam fora da conversa: só aparecem ao segurar a sprite.
            private final Runnable longPress=()->{
                if(!dragging){
                    held=true;
                    eduSettingsOpen=true;
                    eduHelpOpen=false;
                    reactAvatar(RaidDayAvatarFrames.QUESTION);
                    if(visible)updateStep();
                    else setVisible(true);
                }
            };
            @Override public boolean onTouch(View v,MotionEvent event){
                switch(event.getActionMasked()){
                    case MotionEvent.ACTION_DOWN:
                        downX=event.getRawX();downY=event.getRawY();
                        startX=bubbleParams.x;startY=bubbleParams.y;
                        held=false;dragging=false;
                        handler.postDelayed(longPress,1200L);
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        float dx=event.getRawX()-downX,dy=event.getRawY()-downY;
                        if(!dragging&&Math.hypot(dx,dy)>touchSlop){
                            dragging=true;handler.removeCallbacks(longPress);
                            eduDragStartedAt=SystemClock.elapsedRealtime();
                            eduAnimationName="";
                        }
                        if(dragging){
                            bubbleParams.x=Math.max(0,Math.min(
                                getResources().getDisplayMetrics().widthPixels-
                                bubbleParams.width,startX+Math.round(dx)));
                            bubbleParams.y=Math.max(0,Math.min(
                                getResources().getDisplayMetrics().heightPixels-
                                bubbleParams.height,startY+Math.round(dy)));
                            wm.updateViewLayout(bubble,bubbleParams);
                            if(visible){
                                placePanelCoordinates();
                                placePanel();
                            }
                        }
                        return true;
                    case MotionEvent.ACTION_CANCEL:
                    case MotionEvent.ACTION_UP:
                        handler.removeCallbacks(longPress);
                        if(dragging){
                            prefs.edit().putInt("x",bubbleParams.x).putInt("y",bubbleParams.y).apply();
                            reactEdu("arrastado_final");
                        }else if(!held&&event.getActionMasked()==MotionEvent.ACTION_UP){
                            reactAvatar(RaidDayAvatarFrames.WAVE);
                            setVisible(!visible);
                        }
                        dragging=false;return true;
                }
                return true;
            }
        });
        wm.addView(bubble,bubbleParams);
        if((avatarSprites!=null||eduSprites!=null)&&avatarMotion)
            handler.post(avatarTicker);
    }


    // EDU: uma conversa por vez. Ajustes não ocupam a tela do tutorial.
    private void createPreparationUi(){
        preparationSection=new LinearLayout(this);
        preparationSection.setOrientation(LinearLayout.VERTICAL);
        eduPrepQuestion=text("",14,Color.WHITE,true);
        preparationSection.addView(eduPrepQuestion);
        eduPrepCaption=text("",10,Color.rgb(170,196,212),false);
        LinearLayout.LayoutParams c=new LinearLayout.LayoutParams(-1,-2);
        c.topMargin=dp(5);
        preparationSection.addView(eduPrepCaption,c);
        preparationChoices=new LinearLayout(this);
        preparationChoices.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);
        p.topMargin=dp(8);
        preparationSection.addView(preparationChoices,p);
        panel.addView(preparationSection);
    }
    private void dateButton(LinearLayout row,String label,int days){
        TextView b=button(label);
        LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(0,dp(38),1);
        lp.leftMargin=dp(3);
        row.addView(b,lp);
        b.setOnClickListener(v->{
            preparation.shiftDate(days,eventClock);
            preparation.save(prefs);
            renderPreparation();
        });
    }
    private boolean eduDateConfirmed(){
        if(preparation==null||preparation.eventDate()==null)return false;
        return preparation.isComplete()||preparation.eventKey().equals(
            prefs.getString("edu_event_date_confirmed_key",""));
    }
    private void completePreparation(){
        // Fluxo simples: a data é suficiente para iniciar a conversa.
        // As outras seis respostas legadas permanecem salvas, se existirem.
        if(preparation.eventDate()==null)return;
        preparation.markComplete();
        preparation.save(prefs);
        String chosenEvent=preparation.eventKey();
        prefs.edit().putString("edu_event_date_confirmed_key",chosenEvent).apply();
        if(!eventKey.equals(chosenEvent)){
            // Não apagar a janela do próprio dia que já foi salvo na configuração.
            if(!preparation.eventDate().equals(RaidDaySchedule.eventDate(this)))
                RaidDaySchedule.clearWindow(this);
            eventKey=chosenEvent;
            prefs.edit().putString("eventKey",eventKey)
                .putInt("sessionGeneration",1).apply();
            sessionKey=eventKey+"#1";
            restoreJournal();
        }
        riskAccepted=(plan.riskVersion+":"+eventKey).equals(
            prefs.getString("riskAcceptance",""));
        eduNote="";
        updateStep();
    }
    private void renderPreparation(){
        if(preparationChoices==null)return;
        int q=preparation.question();
        eduPrepQuestion.setText("Edu: "+preparation.questionText(q));
        preparationChoices.removeAllViews();
        if(q==0){
            eduPrepCaption.setText("Evento real · data informada por você, sem horário oficial.");
            TextView chosen=text("Dia: "+preparation.displayDate(),13,
                Color.rgb(118,235,195),true);
            preparationChoices.addView(chosen);
            LinearLayout controls=new LinearLayout(this);
            dateButton(controls,"−7 dias",-7);
            dateButton(controls,"−1 dia",-1);
            dateButton(controls,"+1 dia",1);
            dateButton(controls,"+7 dias",7);
            LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-1,dp(39));
            cp.topMargin=dp(7);
            preparationChoices.addView(controls,cp);
            addChoice(preparationChoices,"✓ Esta é a data",()->nextPreparation());
        }else{
            eduPrepCaption.setText("Escolha uma resposta para continuar.");
            String selected=preparation.answer(q);
            LinearLayout responses=new LinearLayout(this);
            responses.setGravity(Gravity.CENTER);
            for(String option:preparation.optionsFor(q)){
                String shortLabel=option.startsWith("Híbrido")?"Híbrido":option;
                TextView b=button((option.equals(selected)?"✓ ":"")+shortLabel);
                b.setContentDescription(option);
                LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(
                    0,dp(41),1);
                lp.leftMargin=dp(3);
                responses.addView(b,lp);
                b.setOnClickListener(v->{
                    preparation.choose(option);
                    preparation.save(prefs);
                    nextPreparation();
                });
            }
            preparationChoices.addView(responses,
                new LinearLayout.LayoutParams(-1,dp(42)));
        }
        if(q>0)addChoice(preparationChoices,"← Pergunta anterior",()->{
            preparation.setQuestion(preparation.question()-1);
            preparation.save(prefs);
            renderPreparation();
        });
        if(visible)placePanel();
    }
    private void nextPreparation(){
        if(!preparation.currentAnswered())return;
        if(preparation.question()==0){
            completePreparation(); // Sem seis perguntas de configuração no tutorial.
            return;
        }
        if(preparation.question()<RaidDayPreparation.COUNT-1){
            preparation.setQuestion(preparation.question()+1);
            preparation.save(prefs);
            renderPreparation();
        }else completePreparation();
    }
    private void updateEventClock(){
        if(eduBadge==null)return;
        String now=RaidDayEventClock.format(eventClock.instant(),
            EduEventClock.zone(this));
        String source=EduEventClock.isAdjusted(this)?"Hora ajustada":
            (EduEventClock.zone(this).equals(RaidDayEventClock.BRASILIA)?
                "Brasília":"Relógio Edu");
        if(active||training)eduBadge.setText(
            "ETAPA "+(index+1)+"/11 · "+source+" "+now);
        else eduBadge.setText(source+" · "+now);
    }
    private void addChoice(LinearLayout target,String label,Runnable onTap){
        TextView b=button(label);
        LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,dp(39));
        lp.topMargin=dp(6);
        target.addView(b,lp);
        b.setOnClickListener(v->onTap.run());
    }
    private void addTwo(String first,Runnable a,String second,Runnable b){
        LinearLayout row=new LinearLayout(this);
        LinearLayout.LayoutParams parent=new LinearLayout.LayoutParams(-1,dp(41));
        parent.topMargin=dp(8);
        eduActions.addView(row,parent);
        TextView left=button(first);
        row.addView(left,new LinearLayout.LayoutParams(0,-1,1));
        left.setOnClickListener(v->a.run());
        TextView right=button(second);
        LinearLayout.LayoutParams rightLp=new LinearLayout.LayoutParams(0,-1,1);
        rightLp.leftMargin=dp(7);
        row.addView(right,rightLp);
        right.setOnClickListener(v->b.run());
    }
    private void addThree(String a,Runnable aa,String b,Runnable bb,
                          String c,Runnable cc){
        LinearLayout row=new LinearLayout(this);
        LinearLayout.LayoutParams rp=new LinearLayout.LayoutParams(-1,dp(42));
        rp.topMargin=dp(8);
        eduActions.addView(row,rp);
        String[] labels={a,b,c};
        Runnable[] actions={aa,bb,cc};
        for(int i=0;i<3;i++){
            TextView v=button(labels[i]);
            LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(0,-1,1);
            if(i>0)lp.leftMargin=dp(4);
            row.addView(v,lp);
            final Runnable tap=actions[i];
            v.setOnClickListener(w->tap.run());
        }
    }
    private void setTalk(String speech,String caption){
        eduSpeech.setText(speech);
        eduSubline.setText(caption);
        eduSubline.setVisibility(caption==null||caption.isEmpty()?
            View.GONE:View.VISIBLE);
    }

    /**
     * Um único contorno branco de quadrinhos. A cauda faz parte do MESMO path
     * da fala, e aponta horizontalmente ao avatar, sem outra caixa ao redor.
     */
    private final class EduSpeechDrawable extends Drawable {
        private final Paint fill=new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint edge=new Paint(Paint.ANTI_ALIAS_FLAG);
        private boolean pointerRight=true;
        EduSpeechDrawable(){
            fill.setColor(Color.WHITE);
            fill.setStyle(Paint.Style.FILL);
            edge.setColor(Color.rgb(166,175,184));
            edge.setStyle(Paint.Style.STROKE);
            edge.setStrokeWidth(Math.max(1f,dp(1)));
            edge.setStrokeJoin(Paint.Join.ROUND);
        }
        void setPointerRight(boolean right){
            if(pointerRight!=right){pointerRight=right;invalidateSelf();}
        }
        boolean pointsRight(){return pointerRight;}
        @Override public void draw(Canvas canvas){
            Rect bounds=getBounds();
            float l=bounds.left+dp(1),t=bounds.top+dp(1);
            float r=bounds.right-dp(1),bottom=bounds.bottom-dp(1);
            float tip=dp(15),rad=dp(15),half=dp(8);
            float bodyLeft=pointerRight?l:l+tip;
            float bodyRight=pointerRight?r-tip:r;
            float cy=(t+bottom)/2f;
            Path shape=new Path();
            shape.moveTo(bodyLeft+rad,t);
            shape.lineTo(bodyRight-rad,t);
            shape.quadTo(bodyRight,t,bodyRight,t+rad);
            if(pointerRight){
                shape.lineTo(bodyRight,cy-half);
                shape.lineTo(r,cy);
                shape.lineTo(bodyRight,cy+half);
            }
            shape.lineTo(bodyRight,bottom-rad);
            shape.quadTo(bodyRight,bottom,bodyRight-rad,bottom);
            shape.lineTo(bodyLeft+rad,bottom);
            shape.quadTo(bodyLeft,bottom,bodyLeft,bottom-rad);
            if(!pointerRight){
                shape.lineTo(bodyLeft,cy+half);
                shape.lineTo(l,cy);
                shape.lineTo(bodyLeft,cy-half);
            }
            shape.lineTo(bodyLeft,t+rad);
            shape.quadTo(bodyLeft,t,bodyLeft+rad,t);
            shape.close();
            canvas.drawPath(shape,fill);
            canvas.drawPath(shape,edge);
        }
        @Override public void setAlpha(int alpha){
            fill.setAlpha(alpha);edge.setAlpha(alpha);invalidateSelf();
        }
        @Override public void setColorFilter(ColorFilter filter){
            fill.setColorFilter(filter);edge.setColorFilter(filter);invalidateSelf();
        }
        @Override public int getOpacity(){return PixelFormat.TRANSLUCENT;}
    }
    private void pointSpeechAtEdu(){
        if(eduSpeechBackground==null||eduMainCard==null||
            panelParams==null||bubbleParams==null)return;
        boolean pointsRight=panelParams.x+eduPanelWidth/2<
            bubbleParams.x+bubbleParams.width/2;
        if(eduSpeechBackground.pointsRight()!=pointsRight){
            eduSpeechBackground.setPointerRight(pointsRight);
            eduMainCard.setPadding(dp(pointsRight?12:27),dp(11),
                dp(pointsRight?27:12),dp(11));
        }
    }
    private void createPanel(){
        panel=new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setPadding(dp(2),dp(2),dp(2),dp(5));
        // Sem caixa glass envolvendo fala e respostas. O jogo fica visível.
        panel.setBackgroundColor(Color.TRANSPARENT);
        eduPanelWidth=Math.min(dp(286),
            getResources().getDisplayMetrics().widthPixels-dp(22));

        LinearLayout header=new LinearLayout(this);
        header.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout nameChip=new LinearLayout(this);
        nameChip.setGravity(Gravity.CENTER_VERTICAL);
        nameChip.setPadding(dp(9),0,dp(9),0);
        nameChip.setBackground(surface(Color.argb(162,28,40,55),
            Color.argb(90,190,205,222),19));
        eduHeader=text("Edu",13,Color.WHITE,true);
        eduHeader.setContentDescription("Edu · arraste este identificador para mover o assistente");
        nameChip.addView(eduHeader,new LinearLayout.LayoutParams(-2,-1));
        eduBadge=text("",10,Color.rgb(127,219,189),false);
        eduBadge.setSingleLine(true);
        eduBadge.setEllipsize(android.text.TextUtils.TruncateAt.END);
        LinearLayout.LayoutParams smallBadge=
            new LinearLayout.LayoutParams(0,-1,1);
        smallBadge.leftMargin=dp(6);
        nameChip.addView(eduBadge,smallBadge);
        header.addView(nameChip,new LinearLayout.LayoutParams(0,dp(31),1));
        TextView close=button("×");
        close.setBackground(surface(Color.argb(166,32,44,60),
            Color.argb(105,200,215,230),22));
        close.setTextColor(Color.WHITE);
        close.setTextSize(17);
        close.setContentDescription("Recolher conversa do Edu");
        LinearLayout.LayoutParams closeP=new LinearLayout.LayoutParams(dp(33),dp(33));
        closeP.leftMargin=dp(5);
        header.addView(close,closeP);
        close.setOnClickListener(v->{
            eduSettingsOpen=false;
            setVisible(false);
        });
        View.OnTouchListener move=new View.OnTouchListener(){
            float originX,originY;
            int avatarX,avatarY;
            boolean moved;
            @Override public boolean onTouch(View view,MotionEvent event){
                switch(event.getActionMasked()){
                    case MotionEvent.ACTION_DOWN:
                        panelScroll.requestDisallowInterceptTouchEvent(true);
                        originX=event.getRawX();originY=event.getRawY();
                        avatarX=bubbleParams.x;avatarY=bubbleParams.y;
                        moved=false;return true;
                    case MotionEvent.ACTION_MOVE:
                        float dx=event.getRawX()-originX,dy=event.getRawY()-originY;
                        if(!moved&&Math.hypot(dx,dy)>touchSlop)moved=true;
                        if(moved){
                            // Arrastar o cabeçalho move também a sprite:
                            // balão e treinador nunca ficam visualmente separados.
                            int sw=getResources().getDisplayMetrics().widthPixels;
                            int sh=getResources().getDisplayMetrics().heightPixels;
                            bubbleParams.x=Math.max(0,Math.min(
                                sw-bubbleParams.width,avatarX+Math.round(dx)));
                            bubbleParams.y=Math.max(0,Math.min(
                                sh-bubbleParams.height,avatarY+Math.round(dy)));
                            try{wm.updateViewLayout(bubble,bubbleParams);}
                            catch(IllegalArgumentException ignored){}
                            placePanelCoordinates();
                            placePanel();
                        }
                        return true;
                    case MotionEvent.ACTION_UP:
                    case MotionEvent.ACTION_CANCEL:
                        panelScroll.requestDisallowInterceptTouchEvent(false);
                        if(moved)prefs.edit().putInt("x",bubbleParams.x)
                            .putInt("y",bubbleParams.y).apply();
                        return true;
                }
                return false;
            }
        };
        eduHeader.setOnTouchListener(move);
        nameChip.setOnTouchListener(move);
        header.setOnTouchListener(move);
        panel.addView(header);

        eduMainCard=new LinearLayout(this);
        eduMainCard.setOrientation(LinearLayout.VERTICAL);
        eduMainCard.setPadding(dp(12),dp(11),dp(27),dp(11));
        eduSpeechBackground=new EduSpeechDrawable();
        eduMainCard.setBackground(eduSpeechBackground);
        eduMainCard.setElevation(dp(2));
        LinearLayout.LayoutParams speechLp=new LinearLayout.LayoutParams(-1,-2);
        speechLp.topMargin=dp(8);
        panel.addView(eduMainCard,speechLp);
        eduSpeech=text("",14,Color.rgb(28,35,42),false);
        eduSpeech.setLineSpacing(dp(1),1f);
        eduMainCard.addView(eduSpeech);
        eduSubline=text("",10,Color.rgb(88,98,107),false);
        LinearLayout.LayoutParams subLp=new LinearLayout.LayoutParams(-1,-2);
        subLp.topMargin=dp(7);
        eduMainCard.addView(eduSubline,subLp);

        // A cauda lateral é desenhada pelo próprio EduSpeechDrawable:
        // não existe segundo triângulo solto nem balão dentro de painel.

        createPreparationUi();
        eduActions=new LinearLayout(this);
        eduActions.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams answersLp=new LinearLayout.LayoutParams(-1,-2);
        answersLp.topMargin=dp(14); // respostas flutuantes e independentes da fala
        panel.addView(eduActions,answersLp);
        eduMiniActions=new LinearLayout(this);
        eduMiniActions.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams mini=new LinearLayout.LayoutParams(-1,dp(35));
        mini.topMargin=dp(10);
        panel.addView(eduMiniActions,mini);

        eduSettings=new LinearLayout(this);
        eduSettings.setOrientation(LinearLayout.VERTICAL);
        panel.addView(eduSettings);
        TextView settingsCaption=text("Ajustes do Edu",12,Color.WHITE,true);
        eduSettings.addView(settingsCaption);
        LinearLayout sizes=new LinearLayout(this);
        avatarSizeButtons=new TextView[3];
        String[] sizeLabels={"P","M","G"};
        for(int i=0;i<3;i++){
            final int choice=i;
            TextView b=button(sizeLabels[i]);
            b.setContentDescription("Tamanho do Edu: "+
                RaidDayAvatarFrames.SIZES_PX[i]+" pixels");
            avatarSizeButtons[i]=b;
            LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(0,dp(38),1);
            if(i>0)p.leftMargin=dp(5);
            sizes.addView(b,p);
            b.setOnClickListener(v->{
                avatarSizeIndex=choice;
                updateAvatarSize();
            });
        }
        for(int i=0;i<avatarSizeButtons.length;i++)
            avatarSizeButtons[i].setTextColor(i==avatarSizeIndex?
                Color.rgb(118,235,195):Color.WHITE);
        LinearLayout.LayoutParams sizesLp=new LinearLayout.LayoutParams(-1,dp(39));
        sizesLp.topMargin=dp(6);
        eduSettings.addView(sizes,sizesLp);
        avatarMotionButton=button(avatarMotion?"Animação ✓":"Animação ×");
        addSettingsButton(avatarMotionButton,()->setAvatarMotion(!avatarMotion));
        TextView schedule=button("📅 Evento, lembretes e calendário");
        addSettingsButton(schedule,()->{
            setVisible(false);
            Intent intent=new Intent(this,RaidDayEventSettingsActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try{startActivity(intent);}
            catch(RuntimeException error){
                eduNote="Não foi possível abrir o calendário.";
                setVisible(true);
            }
        });
        visualToggle=button("Autorizar leitura de tela");
        addSettingsButton(visualToggle,()->toggleEduVision());
        TextView pause=button("Pausar / retomar roteiro");
        addSettingsButton(pause,()->{
            if(active||training){
                paused=!paused;persist(paused?"PAUSED":"RESUMED");updateStep();
            }
        });
        TextView exit=button("Sair do treino / voltar ao início");
        addSettingsButton(exit,()->{
            if(training)leaveTraining();
            else if(!active){eduWantsReal=false;eduSettingsOpen=false;updateStep();}
            else{
                endPending=true;
                eduSettingsOpen=false;
                eduNote="Confirme o encerramento para preservar o histórico.";
                updateStep();
            }
        });
        eduSettingsClose=button("✓ Voltar à conversa");
        addSettingsButton(eduSettingsClose,()->{
            eduSettingsOpen=false;updateStep();
        });

        visualAccept=button("Sim, é essa tela");
        visualReject=button("Não era isso");
        visualAccept.setOnClickListener(v->confirmEduVision());
        visualReject.setOnClickListener(v->rejectEduVision());

        panelScroll=new ScrollView(this){
            @Override protected void onMeasure(int w,int h){
                int maximum=Math.min(dp(285),
                    (int)(getResources().getDisplayMetrics().heightPixels*.43f));
                super.onMeasure(w,View.MeasureSpec.makeMeasureSpec(
                    Math.max(dp(145),maximum),View.MeasureSpec.AT_MOST));
            }
        };
        panelScroll.setFillViewport(false);
        panelScroll.setVerticalScrollBarEnabled(false);
        panelScroll.addView(panel,new ScrollView.LayoutParams(-1,-2));
        panelParams=new WindowManager.LayoutParams(
            eduPanelWidth,-2,WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,PixelFormat.TRANSLUCENT);
        panelParams.gravity=Gravity.TOP|Gravity.LEFT;
        // O balão branco e a tipografia não devem ficar translúcidos. Apenas a moldura é glass.
        panelParams.alpha=1f;
        placePanelCoordinates();
    }
    private void addSettingsButton(TextView b,Runnable action){
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,dp(38));
        p.topMargin=dp(6);
        eduSettings.addView(b,p);
        b.setOnClickListener(v->action.run());
    }
    private void toggleEduVision(){
        if(RaidDayScreenCaptureService.isActive()){
            stopService(new Intent(this,RaidDayScreenCaptureService.class)
                .setAction(RaidDayScreenCaptureService.STOP));
            eduNote="Acompanhamento visual encerrado. Você pode continuar manualmente.";
            updateStep();return;
        }
        if(training){
            eduNote="Na simulação, a leitura de tela fica desligada.";
            updateStep();return;
        }
        if(CandyScreenCaptureService.isActive()){
            eduNote="A captura do Doce Raro está ativa. Encerre aquela sessão primeiro.";
            updateStep();return;
        }
        // O painel e a bolha desaparecem ANTES do diálogo do sistema.
        eduSettingsOpen=false;
        setVisible(false);
        if(bubble!=null)bubble.setVisibility(View.GONE);
        Intent intent=new Intent(this,RaidDayCaptureConsentActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try{startActivity(intent);}
        catch(RuntimeException error){
            if(bubble!=null)bubble.setVisibility(View.VISIBLE);
            eduNote="O Android não abriu a autorização. Continue manualmente.";
        }
    }
    private void confirmEduVision(){
        if(training||!active||paused||visualCandidate.isEmpty())return;
        if(System.currentTimeMillis()-visualSeenAt>180000L){
            visualCandidate="";updateStep();return;
        }
        appendEvent("VISUAL_SUGGESTION_ACCEPTED_"+visualCandidate,
            plan.step(index).id);
        appendEvent(visualCandidate,plan.step(index).id);
        eduNote="Você confirmou a tela. A etapa não avançou automaticamente.";
        visualCandidate="";
        prefs.edit().remove("raid_day_capture_stage")
            .remove("raid_day_capture_time").apply();
        reactAvatar(RaidDayAvatarFrames.OK);
        updateStep();
    }
    private void rejectEduVision(){
        if(visualCandidate.isEmpty())return;
        if(!training&&active)appendEvent("VISUAL_REJECTED",plan.step(index).id);
        visualCandidate="";
        prefs.edit().remove("raid_day_capture_stage")
            .remove("raid_day_capture_time").apply();
        eduNote="Certo! Vamos continuar com o que você observar no jogo.";
        updateStep();
    }
    private void copyEduCoordinates(){
        String coords=plan.coords(index);
        if(coords==null||coords.isEmpty())return;
        ClipboardManager cb=(ClipboardManager)getSystemService(Context.CLIPBOARD_SERVICE);
        if(cb==null)return;
        cb.setPrimaryClip(ClipData.newPlainText("Coordenadas citadas no roteiro",coords));
        Toast.makeText(this,"Coordenadas copiadas",Toast.LENGTH_SHORT).show();
    }

    /** Grava eventos reais antes de mostrar a próxima etapa. */
    private void persist(String eventType){
        persist(eventType,plan.step(index).id);
    }
    private void persist(String eventType,String actedOnStep){
        if(training)return;
        appendEvent(eventType,actedOnStep);
    }


    /** A captura sugere apenas; não avança e não tem botão no tutorial. */
    private void updateVisual(){
        if(prefs==null)return;
        String candidate=prefs.getString("raid_day_capture_stage","");
        long seen=prefs.getLong("raid_day_capture_time",0L);
        if(training||!RaidDayScreenCaptureService.isActive()||
            System.currentTimeMillis()-seen>180000L)candidate="";
        if(!candidate.equals(visualCandidate)){
            visualCandidate=candidate;visualSeenAt=seen;
            if(visible&&!eduSettingsOpen&&active)updateStep();
        }
    }
    private String currentPhaseNote(RaidDayGuidePlan.Step step){
        if(step==null||training)return "";
        LocalDate date=preparation.eventDate();
        if(date==null)return "Confira a data do evento antes de continuar.";
        LocalDate now=eduEventLocalToday();
        if("D-1".equals(step.phase)&&!now.equals(date.minusDays(1)))
            return "Esta parte do roteiro é da VÉSPERA (D−1). "+
                "O horário correto não foi confirmado para o evento selecionado.";
        if("D".equals(step.phase)&&!now.equals(date))
            return "Esta etapa é do DIA DO EVENTO (D), conforme a "+
                "data LOCAL da região escolhida.";
        return "";
    }
    private String phaseClock(RaidDayGuidePlan.Step step){
        if(training){
            LocalDate today=EduEventClock.today(this);
            java.time.format.DateTimeFormatter shortDate=
                java.time.format.DateTimeFormatter.ofPattern("dd/MM",
                    java.util.Locale.forLanguageTag("pt-BR"));
            if("D-1".equals(step.phase))
                return "SIMULAÇÃO • Ontem "+today.minusDays(1).format(shortDate)+
                    " • Véspera fictícia";
            if("D".equals(step.phase))
                return "SIMULAÇÃO • Hoje "+today.format(shortDate)+
                    " • Dia do evento fictício";
            return "SIMULAÇÃO HOJE • Não altera o jogo";
        }
        String now=RaidDayEventClock.format(eventClock.instant(),
            EduEventClock.zone(this));
        String zone="";
        if("hawaii".equals(step.locationRef))
            zone=" · Havaí "+RaidDayEventClock.format(eventClock.instant(),
                RaidDayEventClock.HAWAII);
        else if("newzealand".equals(step.locationRef))
            zone=" · NZ "+RaidDayEventClock.format(eventClock.instant(),
                RaidDayEventClock.NEW_ZEALAND);
        else if("kiribati".equals(step.locationRef))
            zone=" · Kiribati "+RaidDayEventClock.format(eventClock.instant(),
                RaidDayEventClock.KIRIBATI);
        String clockLabel=EduEventClock.isAdjusted(this)?
            "Relógio ajustado ":EduEventClock.zone(this).equals(
                RaidDayEventClock.BRASILIA)?"Brasília ":"Relógio Edu ";
        boolean selected=eduConfiguredPhase()!=RaidDayRegionalWindow.Phase.UNKNOWN;
        String local=selected?" · Evento "+RaidDaySchedule.zone(this).getId()+
            " "+RaidDayEventClock.format(eventClock.instant(),
                RaidDaySchedule.zone(this)):"";
        return clockLabel+now+zone+local+" • "+
            (selected&&RaidDaySchedule.isChandelureExample(this)?
                "Janela oficial do exemplo histórico":
                "Horário do evento informado, não verificado");
    }
    private void advanceEdu(String type){
        if(paused||finished)return;
        RaidDayGuidePlan.Step current=plan.step(index);
        if(!training&&!currentPhaseNote(current).isEmpty()){
            eduNote=currentPhaseNote(current);updateStep();return;
        }
        String from=current.id;
        setEduDialogueState("");
        if(index<plan.size()-1)index++;else finished=true;
        eduHelpOpen=false;eduNote="";eduCaptureQuestion=false;
        eduRecordingExtraRaid=false;
        persist(finished?"FINISHED":type,from);
        reactAvatar(RaidDayAvatarFrames.OK);
        playEduStepTransition();
        updateStep();
    }
    private void navigateEdu(String destination,String type){
        if(paused||finished||destination==null||destination.isEmpty())return;
        int next=plan.indexOf(destination);
        if(next<0)return;
        String from=plan.step(index).id;
        setEduDialogueState("");
        if("CYCLE_REPEATED".equals(type))repeatedCycles++;
        index=next;eduNote="";eduHelpOpen=false;eduCaptureQuestion=false;
        eduRecordingExtraRaid=false;
        persist(type,from);
        reactAvatar(type.startsWith("NO_PASS")?RaidDayAvatarFrames.ALERT:
            RaidDayAvatarFrames.WAVE);
        if(type.startsWith("NO_PASS"))reactEdu("sem_passe_disponivel");
        else playEduStepTransition();
        updateStep();
    }
    private void recordEduOutcome(String type){
        if(paused||finished)return;
        persist(type);
        reactAvatar("RAID_WIN".equals(type)?RaidDayAvatarFrames.OK:
            RaidDayAvatarFrames.QUESTION);
        if("RAID_LOSS".equals(type))reactEdu("reide_perdida");
        else if("RAID_LEFT".equals(type))reactEdu("reide_abandonada");
        else if("RAID_WIN".equals(type))reactEdu("vitoria_informada");
        if("RAID_WIN".equals(type)){
            eduCaptureQuestion=true;
            eduNote="";updateStep();return;
        }
        if("E04".equals(plan.step(index).id)){
            // O autor diz que perder/sair pode interromper a primeira fase.
            // Não continuar o ciclo como se a vitória tivesse ocorrido.
            setEduDialogueState("raid_interrupted");
            updateStep();return;
        }
        if(eduRecordingExtraRaid){
            eduRecordingExtraRaid=false;
            eduNote="Reide anotada. Deseja registrar outra?";
            updateStep();return;
        }
        advanceEdu("STEP_CONFIRMED");
    }
    private void recordEduCapture(String type){
        if(paused||finished)return;
        persist(type);
        eduCaptureQuestion=false;
        if("RAID_CAUGHT".equals(type))reactEdu("captura_informada");
        else if("RAID_FLED".equals(type))reactEdu("pokemon_fugiu");
        else reactEdu("perguntando");
        if(eduRecordingExtraRaid){
            eduRecordingExtraRaid=false;
            eduNote="Resultado registrado. Você pode anotar outra reide.";
            updateStep();return;
        }
        advanceEdu("STEP_CONFIRMED");
    }
    private void showEduWelcome(){
        setTalk("Olá! Meu nome é Edu. Serei seu treinador hoje! "+
            "Vou te ensinar, passo a passo, o tutorial comunitário "+
            "“Bug dos Passes”. Está pronto?",
            eduNote.isEmpty()?"":eduNote);
        addTwo("Sim, vamos lá",()->{
            eduIntroAccepted=true;
            eduWantsReal=true;
            eduNote="";updateStep();
        },"Agora não",()->{
            eduNote="Tudo bem! Quando quiser começar, toque em Sim.";
            updateStep();
        });
    }
    private void showEduRisk(){
        setTalk("Edu: antes de começar, um aviso rápido.",
            "O método relatado pode violar os Termos do Pokémon GO e não garante passes. O PokeSearch não altera GPS nem joga por você.");
        addTwo("Entendi, continuar",()->{
            riskAccepted=true;
            prefs.edit().putString("riskAcceptance",
                plan.riskVersion+":"+eventKey)
                .putLong("riskAcceptedAtMs",System.currentTimeMillis()).apply();
            updateStep();
        },"Sair",()->{eduWantsReal=false;updateStep();});
    }
    private void showEduReady(){
        LocalDate day=preparation.eventDate();
        LocalDate today=eduEventLocalToday();
        boolean eve=day!=null&&today.equals(day.minusDays(1));
        boolean eventDay=day!=null&&today.equals(day);
        String reference=EduEventClock.isAdjusted(this)?
            "Relógio Edu ajustado manualmente, sem verificação oficial.":
            "Horário do celular no fuso "+EduEventClock.zone(this).getId()+
                "; horário do evento ainda não verificado.";
        boolean ended=eduConfiguredPhase()==RaidDayRegionalWindow.Phase.ENDED;
        setTalk(ended?
            "O evento já terminou na região escolhida. Não vamos presumir novos passes.":
            eventDay?
            "Hoje é o dia do evento no local escolhido. Vamos conferir seus passes!":
            eve?"Estamos na véspera do evento. Já guardou seu passe diário?":
            "A data do evento ainda não corresponde ao dia ou à véspera "+
                "mostrados no relógio do Edu.",
            "Evento: "+eduEventWhen()+" · "+reference);
        if(ended){
            addTwo("Rever horário",()->editEduEventRegion(),
                "Agora não",()->setVisible(false));
        }else if(eve||eventDay){
            addTwo("Começar",()->beginRealSession(),
                "Mudar data",()->editEduDate());
        }else{
            addTwo("Mudar data",()->editEduDate(),
                "Agora não",()->setVisible(false));
        }
    }
    private void editEduDate(){
        prefs.edit().remove("edu_event_date_confirmed_key").apply();
        preparation.beginEditing();
        preparation.save(prefs);
        updateStep();
    }
    private void showEduSettings(){
        eduMainCard.setVisibility(View.GONE);
        preparationSection.setVisibility(View.GONE);
        eduActions.setVisibility(View.GONE);
        eduMiniActions.setVisibility(View.GONE);
        eduSettings.setVisibility(View.VISIBLE);
        panel.setBackground(surface(Color.argb(217,25,36,49),
            Color.argb(90,185,204,226),14));
        panel.setPadding(dp(9),dp(8),dp(9),dp(9));
        visualToggle.setText(RaidDayScreenCaptureService.isActive()?
            "⏹ Parar leitura visual":"👁 Autorizar leitura de tela");
        if(!eduNote.isEmpty()){
            eduMainCard.setVisibility(View.VISIBLE);
            setTalk("Edu: "+eduNote,"");
        }
    }
    /** Um toque nas coordenadas COPIA, mas nunca altera a localização do aparelho. */
    private void addEduCoordinateButton(){
        String coords=plan.coords(index);
        if(coords==null||coords.isEmpty())return;
        TextView coordinate=button("📋 "+coords);
        coordinate.setContentDescription("Copiar local: "+coords);
        LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,dp(39));
        lp.topMargin=dp(6);
        eduActions.addView(coordinate,lp);
        coordinate.setOnClickListener(v->copyEduCoordinates());
    }
    private void askEduPass(String question,String caption,Runnable onYes,Runnable onNo){
        if("pass_check".equals(eduDialogueState)){
            setTalk("Confira a mochila no Pokémon GO. Você encontrou um Passe "+
                "de Reide Diário gratuito?", "Não vou avançar sem a sua confirmação.");
        }else if("pass_wait".equals(eduDialogueState)){
            setTalk("Ainda não tem um passe? Aguarde e confira a mochila. "+
                "Se conseguir um, guarde sem gastar.",
                "O tutorial não cria passes. Você pode continuar mais tarde.");
        }else{
            setTalk(question,caption);
        }
        addThree("Sim, tenho",onYes,"Não tenho",onNo,
            "Vou conferir",()->{
                setEduDialogueState("pass_check");
                reactAvatar(RaidDayAvatarFrames.QUESTION);
                updateStep();
            });
    }
    // Chegada e carregamento são confirmações independentes. Só o retorno ao
    // Havaí (E05) manda reiniciar: a primeira ida (E02) não exige isso.
    private void showEduTravel(String region,String firstSpeech,
                               boolean mustRestart){
        boolean arrived="travel_reload".equals(eduDialogueState)||
            "travel_wait".equals(eduDialogueState);
        if(!arrived){
            setTalk(("travel_pending".equals(eduDialogueState)?
                "Tudo bem. Confira a localização. ":firstSpeech)+
                " Já está em "+region+"?",
                "Toque nas coordenadas para copiar. Não interaja no Havaí, "+
                "conforme a condição mencionada pelo autor.");
            addEduCoordinateButton();
            addTwo("Sim, já estou",()->{
                setEduDialogueState("travel_reload");
                playEduAnimation("teleporte_efeito");updateStep();
            },"Ainda não",()->{
                setEduDialogueState("travel_pending");updateStep();
            });
            return;
        }
        setTalk(mustRestart?
            "Agora feche e reabra o Pokémon GO no Havaí. "+
            "O mapa, os Pokémon e as Poképaradas carregaram?":
            "Aguarde o mapa e os Pokémon carregarem no Havaí. Já carregaram?",
            "travel_wait".equals(eduDialogueState)?
            "Sem pressa. Confirme apenas quando aparecer na tela.":
            "A primeira chegada ao Havaí não pede reiniciar o jogo.");
        addTwo("Sim, carregaram",()->advanceEdu("MAP_LOADED"),
            "Ainda não",()->{setEduDialogueState("travel_wait");updateStep();});
    }
    private void showEduPreparationChecks(){
        if("pre_softban".equals(eduDialogueState)){
            setTalk("Antes de começar, você está sem softban/restrição de "+
                "ações no Pokémon GO?",
                "O autor coloca essa condição na véspera; Edu não "+
                "consegue confirmar uma restrição da conta.");
            addThree("Sim, sem restrição",()->{
                setEduDialogueState("pre_region");updateStep();
            },"Tenho restrição",()->{
                setEduDialogueState("pre_blocked");updateStep();
            },"Não sei",()->{
                setEduDialogueState("pre_blocked");updateStep();
            });
            return;
        }
        if("pre_region".equals(eduDialogueState)){
            setTalk("Na véspera, você já interagiu no jogo em algum "+
                "lugar onde o dia do evento já havia começado?",
                "No vídeo, isso impede a primeira parte do relato.");
            addThree("Não, ainda não",()->advanceEdu("PRECHECKS_CONFIRMED"),
                "Sim, já joguei",()->{setEduDialogueState("pre_blocked");updateStep();},
                "Não sei",()->{setEduDialogueState("pre_blocked");updateStep();});
            return;
        }
        if("pre_blocked".equals(eduDialogueState)){
            setTalk("O vídeo diz que uma condição da véspera não foi "+
                "confirmada. Não vamos presumir que essa parte funciona.",
                "Você pode revisar ou aguardar o dia do evento.");
            addTwo("Revisar",()->{setEduDialogueState("pre_softban");updateStep();},
                "Ir ao evento",()->navigateEdu("E08","PRECHECKS_NOT_MET"));
            return;
        }
        askEduPass("Na véspera do evento ("+eduEventWhen()+
            "), você guardou o Passe Diário laranja sem gastar?",
            training?"Treino fictício: nenhum passe real será obtido.":
            "No vídeo, o horário de 22h é apenas exemplo de 30/10.",
            ()->{setEduDialogueState("pre_softban");updateStep();},
            ()->{setEduDialogueState("pass_wait");updateStep();});
    }
    private void showEduNewZealandPass(RaidDayGuidePlan.Step step,
                                        boolean returning){
        boolean retryOffer="nz_retry_offer".equals(eduDialogueState);
        boolean retryReload="nz_retry_reload".equals(eduDialogueState);
        boolean retryCheck=eduDialogueState.startsWith("nz_retry_check");
        boolean checking="nz_check".equals(eduDialogueState)||
            "nz_check_wait".equals(eduDialogueState)||
            retryCheck;
        if(retryOffer){
            setTalk("Não apareceu passe no ginásio da Nova Zelândia? "+
                "O vídeo sugere fechar e reabrir o jogo aqui uma vez.",
                "É uma tentativa do relato, sem garantia de passe.");
            addTwo("Reabrir na NZ",()->{
                setEduDialogueState("nz_retry_reload");updateStep();
            },"Seguir ao evento",()->navigateEdu(step.noPassTo,"NO_PASS"));
            return;
        }
        if(retryReload){
            setTalk("Feche e reabra o Pokémon GO na Nova Zelândia. "+
                "O mapa carregou de novo?",
                "Depois, confira novamente o passe ao tocar na reide.");
            addTwo("Sim, carregou",()->{
                setEduDialogueState("nz_retry_check");updateStep();
            },"Ainda não",()->updateStep());
            return;
        }
        if(!checking){
            setTalk(("nz_pending".equals(eduDialogueState)?"Confira a região. ":
                returning?"Depois do Havaí, volte à Nova Zelândia. ":
                "Agora siga do Havaí para a Nova Zelândia. ")+
                "Já chegou?",
                "As coordenadas são copiáveis; Edu não altera seu GPS.");
            addEduCoordinateButton();
            addTwo("Sim, cheguei",()->{
                setEduDialogueState("nz_check");
                playEduAnimation("teleporte_efeito");updateStep();
            },"Ainda não",()->{
                setEduDialogueState("nz_pending");updateStep();
            });
            return;
        }
        setTalk(retryCheck?
            "Depois de reiniciar na própria Nova Zelândia, apareceu "+
                "um Passe Diário laranja ao verificar a reide?":
            returning?
            "No ginásio da Nova Zelândia, apareceu outro passe "+
                "laranja para fazer a próxima reide?":
            "Na Nova Zelândia, você tem um passe laranja válido "+
                "ao verificar a reide?",
            "Conte apenas passes realmente observados.");
        addThree("Sim, apareceu",()->advanceEdu("PASS_CONFIRMED"),
            "Não apareceu",()->{
                if(retryCheck)navigateEdu(step.noPassTo,"NO_PASS_AFTER_RETRY");
                else {setEduDialogueState("nz_retry_offer");updateStep();}
            },"Vou conferir",()->{
                setEduDialogueState(retryCheck?"nz_retry_check_wait":
                    "nz_check_wait");updateStep();
            });
    }
    private void showEduEventDay(){
        RaidDayRegionalWindow.Phase phase=eduConfiguredPhase();
        if(phase==RaidDayRegionalWindow.Phase.BEFORE){
            setTalk("O evento ainda NÃO começou em "+RaidDaySchedule.zone(this).getId()+
                ". Confira o horário local antes de iniciar.",
                "Evento: "+eduEventWhen()+". Relógio Edu no local: "+
                RaidDayEventClock.format(eventClock.instant(),
                    RaidDaySchedule.zone(this))+
                ". O evento pode já estar ativo em outra região.");
            addTwo("Conferir novamente",()->updateStep(),
                "Rever região",()->editEduEventRegion());
            return;
        }
        if(phase==RaidDayRegionalWindow.Phase.ENDED){
            setTalk("O evento JÁ ACABOU em "+RaidDaySchedule.zone(this).getId()+
                ". Não contabilize novos passes ou reides.",
                "Janela: "+eduEventWhen()+". O relógio Edu pode estar "+
                "ajustado manualmente, sem validar o servidor.");
            addTwo("Ver resumo",()->navigateEdu("E11","EVENT_ENDED"),
                "Rever região",()->editEduEventRegion());
            return;
        }
        if("event_wait".equals(eduDialogueState)){
            setTalk(phase==RaidDayRegionalWindow.Phase.ACTIVE?
                "O relógio mostra o evento ATIVO no local escolhido. "+
                "Confirme no Pokémon GO se ele começou.":
                "O evento já começou no lugar onde vai jogar? "+
                "Confira a data e o horário local.",
                "Sem confirmação, não vamos registrar novos passes.");
            addTwo("Confirmado no jogo",()->{
                setEduDialogueState("event_pass");updateStep();
            },"Continuar aguardando",()->updateStep());
            return;
        }
        if(!"event_pass".equals(eduDialogueState)&&
            !"event_pass_wait".equals(eduDialogueState)){
            setTalk(phase==RaidDayRegionalWindow.Phase.ACTIVE?
                "O relógio indica que o evento está acontecendo em "+
                RaidDaySchedule.zone(this).getId()+". Você confirma no jogo?":
                "A data informada para o evento é "+eduEventWhen()+
                ". Ele já começou no lugar onde vai jogar?",
                phase==RaidDayRegionalWindow.Phase.ACTIVE?
                    "Janela local: "+eduEventWhen()+
                    ". Isso não confirma passes automaticamente.":
                    "Sem janela configurada, confirme o horário manualmente.");
            addTwo("Sim, começou",()->{
                setEduDialogueState("event_pass");updateStep();
            },"Ainda não",()->{
                setEduDialogueState("event_wait");
                reactEdu("evento_nao_comecou");updateStep();
            });
            return;
        }
        setTalk("Com o evento iniciado, você ainda tem um passe "+
            "de reide disponível?",
            "Se tiver, faça as reides normalmente. Se esgotou, "+
            "o relato segue à etapa opcional em Kiribati.");
        addThree("Sim, tenho",()->navigateEdu("E10","EVENT_PASS_AVAILABLE"),
            "Não tenho",()->advanceEdu("NO_EVENT_PASS"),
            "Vou conferir",()->{
                setEduDialogueState("event_pass_wait");updateStep();
            });
    }
    private void showEduKiribati(){
        if("kiribati_pending".equals(eduDialogueState)){
            setTalk("Você chegou à região de Kiribati indicada no relato?",
                "Toque nas coordenadas para copiar. "+
                "A etapa final só vem depois de o evento começar.");
            addEduCoordinateButton();
            addTwo("Sim, cheguei",()->{
                setEduDialogueState("kiribati_reload");
                playEduAnimation("teleporte_efeito");updateStep();
            },"Ainda não",()->updateStep());
            return;
        }
        if("kiribati_reload".equals(eduDialogueState)||
            "kiribati_wait".equals(eduDialogueState)){
            setTalk("No vídeo, Edu fecha e reabre o jogo uma vez em "+
                "Kiribati. O mapa e os Pokémon carregaram?",
                "Depois volte ao local do evento; não reinicie "+
                "entre cada reide da etapa final.");
            addTwo("Sim, carregou",()->{
                eduKiribatiAttempted=true;
                navigateEdu("E10","KIRIBATI_MAP_LOADED");
            },"Ainda não",()->{
                setEduDialogueState("kiribati_wait");updateStep();
            });
            return;
        }
        setTalk("No relato, quando os passes acabam durante o evento, "+
            "Edu vai a Kiribati e reabre o Pokémon GO uma única vez. "+
            "Quer acompanhar essa etapa?",
            "Ele afirma antecipar um passe do dia seguinte, "+
            "que pode então faltar amanhã. Nada é garantido.");
        addTwo("Seguir relato",()->{
            setEduDialogueState("kiribati_pending");updateStep();
        },"Jogar normal",()->{
            eduKiribatiAttempted=true;
            navigateEdu("E10","KIRIBATI_SKIPPED");
        });
    }
    private void showEduEventRaids(){
        if(!"event_pass".equals(eduDialogueState)&&
            !"event_empty".equals(eduDialogueState)){
            setTalk("Você já está de volta ao local do evento para "+
                "fazer as reides?",
                "Confira o evento no lugar escolhido. Edu não teleporta.");
            addTwo("Sim, estou",()->{
                setEduDialogueState("event_pass");
                playEduAnimation("teleporte_efeito");updateStep();
            },"Ainda não",()->updateStep());
            return;
        }
        if("event_empty".equals(eduDialogueState)){
            setTalk("Nenhum passe confirmado para outra reide. "+
                "Quer tentar a etapa final do relato ou encerrar?",
                eduKiribatiAttempted?
                "Você já registrou a passagem por Kiribati nesta sessão.":
                "Kiribati faz parte da etapa final relatada, não é "+
                "obrigatório para jogar normalmente.");
            if(eduKiribatiAttempted){
                addTwo("Ver resumo",()->advanceEdu("NO_EVENT_PASS"),
                    "Conferir de novo",()->{
                        setEduDialogueState("event_pass");updateStep();
                    });
            }else{
                addTwo("Tentar Kiribati",()->navigateEdu("E09","EVENT_PASS_EMPTY"),
                    "Ver resumo",()->navigateEdu("E11","NO_EVENT_PASS"));
            }
            return;
        }
        setTalk("Confira o ginásio: tem um passe realmente "+
            "disponível para participar de outra reide?",
            "Na etapa final o vídeo não manda fechar e "+
            "reabrir entre as reides.");
        addThree("Sim, vou fazer",()->{
            eduRecordingExtraRaid=true;updateStep();
        },"Não apareceu",()->{
            setEduDialogueState("event_empty");updateStep();
        },"Vou conferir",()->updateStep());
    }
    private void showEduGuide(){
        RaidDayGuidePlan.Step step=plan.step(index);
        if(endPending){
            setTalk("Edu: quer mesmo encerrar? Seu histórico será preservado.","");
            addTwo("Encerrar sessão",()->{
                endPending=false;active=false;finished=true;
                persist("ENDED");updateStep();
            },"Continuar",()->{endPending=false;eduNote="";updateStep();});
            return;
        }
        if(paused){
            setTalk("Edu: roteiro pausado. Retomamos daqui, sem recomeçar.","");
            addChoice(eduActions,"▶ Retomar",()->{
                paused=false;persist("RESUMED");updateStep();
            });
            return;
        }
        // Ao virar a data do evento, uma sessão iniciada na véspera
        // não pode ficar bloqueada em E02–E07. A mudança é MANUAL.
        // O histórico anterior é preservado e nenhum passe é presumido.
        if(!training&&"D-1".equals(step.phase)&&
            eduEventLocalToday().equals(preparation.eventDate())){
            setTalk("Chegou o dia do evento! Ontem era a véspera. "+
                "Vamos conferir os passes de hoje?",
                "As etapas da véspera não serão marcadas como concluídas.");
            addTwo("Ir ao evento",()->navigateEdu("E08","DAY_CHANGED_TO_EVENT"),
                "Agora não",()->{
                    paused=true;persist("PAUSED");updateStep();
                });
            return;
        }
        RaidDayRegionalWindow.Phase regionPhase=eduConfiguredPhase();
        if(!training&&regionPhase==RaidDayRegionalWindow.Phase.ENDED&&
            ("E08".equals(step.id)||"E09".equals(step.id)||"E10".equals(step.id))){
            setTalk("O evento acabou na região escolhida. "+
                "Não vou avançar reides nem contar passes automaticamente.",
                "Acompanhe o resumo ou ajuste a região e o relógio Edu.");
            addTwo("Ver resumo",()->navigateEdu("E11","EVENT_ENDED"),
                "Rever região",()->editEduEventRegion());
            return;
        }
        String warning=currentPhaseNote(step);
        if(!warning.isEmpty()){
            setTalk("Edu: "+warning,"Para aprender sem alterar sua sessão, use o treino.");
            addTwo("Ver ajuda",()->{eduHelpOpen=true;updateStep();},
                "Pausar",()->{paused=true;persist("PAUSED");updateStep();});
            if(index>0)addMini("← Voltar",()->{
                String from=plan.step(index).id;
                setEduDialogueState("");
                index--;eduNote="";eduHelpOpen=false;
                persist("BACK",from);updateStep();
            });
            return;
        }
        if(eduHelpOpen){
            setTalk("Edu: "+step.help,
                training?"Treino sem histórico":
                    RaidDayRecovery.lastConfirmed(journal.events().all(sessionKey)));
            addChoice(eduActions,"✓ Entendi",()->{
                eduHelpOpen=false;eduNote="";updateStep();
            });
            return;
        }
        if(!visualCandidate.isEmpty()&&!training){
            setTalk("Edu: parece que encontrei esta tela: "+visualCandidate+
                ". É isso mesmo?","A análise visual não confirma passes e não pula etapas.");
            addTwo("✓ Sim, era",()->confirmEduVision(),
                "Não era",()->rejectEduVision());
            return;
        }
        if(eduCaptureQuestion){
            setTalk("Edu: depois da vitória, conseguiu capturar o Pokémon?",
                "A captura é separada da vitória da reide.");
            addThree("Capturei",()->recordEduCapture("RAID_CAUGHT"),
                "Fugiu",()->recordEduCapture("RAID_FLED"),
                "Não sei",()->recordEduCapture("RAID_UNKNOWN"));
            return;
        }
        if(eduRecordingExtraRaid){
            setTalk("Edu: como terminou essa reide?",
                "Registre o resultado. Você poderá adicionar outra depois.");
            addThree("Venci",()->recordEduOutcome("RAID_WIN"),
                "Perdi",()->recordEduOutcome("RAID_LOSS"),
                "Saí",()->recordEduOutcome("RAID_LEFT"));
            return;
        }
        switch(step.id){
            case "E01":
                showEduPreparationChecks();
                break;
            case "E02":
                showEduTravel("Havaí","A primeira região do relato é o Havaí.",
                    false);
                break;
            case "E03":
                showEduNewZealandPass(step,false);
                break;
            case "E04":
                if("raid_interrupted".equals(eduDialogueState)){
                    setTalk("Você registrou derrota ou saída da reide. "+
                        "O autor diz que isso pode afetar a primeira "+
                        "parte, mas não está comprovado.",
                        "Não vamos contar passe ou vitória inexistente.");
                    addTwo("Ir ao evento",()->navigateEdu("E08","RAID_INTERRUPTED"),
                        "Rever resultado",()->{
                            setEduDialogueState("");updateStep();
                        });
                    break;
                }
                setTalk("Na Nova Zelândia, entre na reide com um "+
                    "passe válido. Como terminou?",
                    "O autor recomenda vencer. Registre o que aconteceu "+
                    "de verdade; a captura será perguntada separadamente.");
                addThree("Venci",()->recordEduOutcome("RAID_WIN"),
                    "Perdi",()->recordEduOutcome("RAID_LOSS"),
                    "Saí",()->recordEduOutcome("RAID_LEFT"));
                break;
            case "E05":
                showEduTravel("Havaí",
                    "Depois da reide, volte ao Havaí.",true);
                break;
            case "E06":
                showEduNewZealandPass(step,true);
                break;
            case "E07":
                setTalk("Apareceu outro passe na Nova Zelândia. "+
                    "Quer fazer mais uma reide aí e repetir o retorno "+
                    "ao Havaí, ou encerrar a primeira parte?",
                    "O ciclo do vídeo é reide na Nova Zelândia → "+
                    "Havaí reinicia → Nova Zelândia.");
                addTwo("Outra reide",()->navigateEdu(step.repeatTo,"CYCLE_REPEATED"),
                    "Ir ao evento",()->navigateEdu(step.noPassTo,"FIRST_PART_ENDED"));
                break;
            case "E08":
                showEduEventDay();
                break;
            case "E09":
                showEduKiribati();
                break;
            case "E10":
                showEduEventRaids();
                break;
            case "E11":
                setTalk("Chegamos ao final! Vamos conferir os ciclos, "+
                    "passes observados, reides e capturas?",
                    "O resumo distingue o que você informou; não garante recompensas.");
                addChoice(eduActions,"Ver resumo",()->advanceEdu("FINISHED"));
                break;
            default:
                setTalk(step.speech,eduNote.isEmpty()?phaseClock(step):eduNote);
                addTwo("Concluí",()->advanceEdu("STEP_CONFIRMED"),
                    "Ainda não",()->{
                        persist("NOT_OBSERVED");
                        eduNote=step.help;
                        reactAvatar(RaidDayAvatarFrames.QUESTION);
                        updateStep();
                    });
                break;
        }
        if(index>0)addMini("← Voltar",()->{
            String from=plan.step(index).id;
            setEduDialogueState("");
            index--;eduNote="";eduHelpOpen=false;eduCaptureQuestion=false;
            persist("BACK",from);updateStep();
        });
        addMini("? Ajuda",()->{
            eduHelpOpen=true;eduNote="";
            reactAvatar(RaidDayAvatarFrames.QUESTION);updateStep();
        });
    }
    private void showEduFinished(){
        String stats=training?"O treino terminou; nenhuma ação foi salva.":
            RaidDayRecovery.stats(journal.events().all(sessionKey));
        setTalk("Edu: chegamos ao fim do roteiro!",""+
            (training?"SIMULAÇÃO concluída • sem recompensas reais":stats));
        if(training)addChoice(eduActions,"✓ Sair da simulação",()->leaveTraining());
        else addChoice(eduActions,"✓ Fechar o resumo",()->{
            active=false;finished=true;persist("ENDED");
            eduWantsReal=false;updateStep();
        });
    }
    private void addMini(String label,Runnable action){
        TextView b=button(label);
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(0,dp(34),1);
        if(eduMiniActions.getChildCount()>0)p.leftMargin=dp(4);
        eduMiniActions.addView(b,p);
        b.setOnClickListener(v->action.run());
    }
    private void updateStep(){
        if(eduSpeech==null)return;
        eduActions.removeAllViews();
        eduMiniActions.removeAllViews();
        panel.setBackgroundColor(Color.TRANSPARENT);
        panel.setPadding(dp(2),dp(2),dp(2),dp(5));
        eduSettings.setVisibility(View.GONE);
        eduMainCard.setVisibility(View.VISIBLE);
        preparationSection.setVisibility(View.GONE);
        eduActions.setVisibility(View.VISIBLE);
        eduMiniActions.setVisibility(View.VISIBLE);
        updateEventClock();
        if(eduSettingsOpen){showEduSettings();}
        else if(active||training){
            if(finished)showEduFinished();else showEduGuide();
        }else if(!eduWantsReal){
            showEduWelcome();
        }else if(!eduDateConfirmed()){
            eduMainCard.setVisibility(View.GONE);
            eduActions.setVisibility(View.GONE);
            preparationSection.setVisibility(View.VISIBLE);
            panel.setBackground(surface(Color.argb(217,25,36,49),
                Color.argb(90,185,204,226),14));
            panel.setPadding(dp(9),dp(8),dp(9),dp(9));
            preparation.setQuestion(0); // A conversa começa somente pela data.
            renderPreparation();
        }else if(!riskAccepted){showEduRisk();}
        else{showEduReady();}
        if(visible){
            // Centraliza novamente após a fala alterar a altura do balão.
            panelScroll.post(()->{
                if(visible){placePanelCoordinates();placePanel();}
            });
        }
    }
    private void placePanelCoordinates(){
        int sw=getResources().getDisplayMetrics().widthPixels;
        int sh=getResources().getDisplayMetrics().heightPixels;
        int gap=dp(6);
        int leftSpace=Math.max(0,bubbleParams.x-gap);
        int rightSpace=Math.max(0,sw-
            (bubbleParams.x+bubbleParams.width+gap));
        boolean dockLeft=leftSpace>=rightSpace;
        // Em celulares estreitos, encolher a fala para caber AO LADO do Edu:
        // nunca desenhar balão sobre sua sprite.
        eduPanelWidth=Math.min(dp(286),Math.max(dp(132),
            Math.max(leftSpace,rightSpace)));
        panelParams.width=eduPanelWidth;
        int docking=dockLeft?
            bubbleParams.x-gap-eduPanelWidth:
            bubbleParams.x+bubbleParams.width+gap;
        panelParams.x=Math.max(0,Math.min(
            Math.max(0,sw-eduPanelWidth),docking));
        int measured=panelScroll==null?dp(175):
            Math.max(dp(125),panelScroll.getHeight());
        panelParams.y=Math.max(0,Math.min(Math.max(0,sh-measured),
            bubbleParams.y+bubbleParams.height/2-measured/2));
        pointSpeechAtEdu();
    }
    private void placePanel(){
        if(!visible||panelScroll==null||panelParams==null)return;
        int sw=getResources().getDisplayMetrics().widthPixels;
        int sh=getResources().getDisplayMetrics().heightPixels;
        int height=Math.max(dp(90),panelScroll.getHeight());
        panelParams.x=Math.max(0,Math.min(sw-eduPanelWidth,panelParams.x));
        panelParams.y=Math.max(0,Math.min(Math.max(0,sh-height),panelParams.y));
        pointSpeechAtEdu();
        try{wm.updateViewLayout(panelScroll,panelParams);}
        catch(IllegalArgumentException ignored){}
    }
    private void setVisible(boolean show){
        if(panelScroll==null||wm==null||show==visible)return;
        visible=show;
        if(show){
            updateStep();
            placePanelCoordinates();
            wm.addView(panelScroll,panelParams);
            panelScroll.post(()->{
                if(visible){placePanelCoordinates();placePanel();}
            });
        }else{
            // Ao reabrir com toque curto, sempre voltar à conversa principal.
            eduSettingsOpen=false;
            try{wm.removeView(panelScroll);}
            catch(IllegalArgumentException ignored){}
        }
    }
    @Override public void onDestroy(){
        running=false;
        if(RaidDayScreenCaptureService.isActive())
            stopService(new Intent(this,RaidDayScreenCaptureService.class));
        handler.removeCallbacksAndMessages(null);
        if(wm!=null){
            if(panel!=null&&visible){
                try{wm.removeView(panelScroll);}catch(IllegalArgumentException ignored){}
            }
            if(bubble!=null){
                try{wm.removeView(bubble);}catch(IllegalArgumentException ignored){}
            }
        }
        visible=false;
        if(artwork!=null){artwork.recycle();artwork=null;}
        if(eduSprites!=null){eduSprites.release();eduSprites=null;}
        if(avatarSprites!=null){avatarSprites.release();avatarSprites=null;}
        super.onDestroy();
    }
}

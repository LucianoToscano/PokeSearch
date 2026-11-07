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
    private LinearLayout eduWelcome,eduSettings,eduActions,eduMiniActions,eduMainCard;
    private TextView eduHeader,eduBadge,eduSpeech,eduSubline,eduSettingsClose;
    private TextView eduPrepQuestion,eduPrepCaption;
    private int eduPanelWidth=0;

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
    private final Clock eventClock=Clock.systemUTC();
    private final Runnable clockPulse=new Runnable(){
        @Override public void run(){
            if(eduBadge!=null)updateEventClock();
            handler.postDelayed(this,60000L);
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
    private ImageView avatarView;
    private TextView[] avatarSizeButtons;
    private TextView avatarMotionButton;
    private int avatarSizeIndex=2,avatarAnimationTick=0,avatarReactionFrame=-1;
    private long avatarReactionUntil=0L;
    private boolean avatarMotion=true;
    private final Runnable avatarTicker=new Runnable(){
        @Override public void run(){
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
        b.setBackground(surface(Color.rgb(247,248,249),Color.rgb(157,168,177),9));
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
    private String eduEventWhen(){
        LocalDate date=training&&demoToday?
            RaidDayEventClock.todayBrasilia(eventClock):preparation.eventDate();
        if(date==null)return "data ainda não informada";
        DateTimeFormatter dateOnly=DateTimeFormatter.ofPattern("dd/MM/yyyy",
            Locale.forLanguageTag("pt-BR"));
        long begin=RaidDaySchedule.start(this);
        long end=RaidDaySchedule.finish(this);
        if(!training&&RaidDaySchedule.valid(begin,end)){
            java.time.ZonedDateTime start=Instant.ofEpochMilli(begin)
                .atZone(RaidDayEventClock.BRASILIA);
            if(start.toLocalDate().equals(date)){
                return start.format(DateTimeFormatter.ofPattern(
                    "dd/MM/yyyy 'às' HH:mm",Locale.forLanguageTag("pt-BR")))+
                    " (horário informado por você, não verificado)";
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
        LocalDate today=RaidDayEventClock.todayBrasilia(eventClock);
        LocalDate date=preparation.eventDate();
        if(date==null||(!today.equals(date.minusDays(1))&&!today.equals(date))){
            eduNote="O roteiro real só começa na véspera (D−1) "+
                "ou no próprio dia do evento (D). Use Simular hoje para treinar.";
            updateStep();
            return;
        }
        if(RaidDayEventClock.state(preparation.eventDate(),eventClock.instant())==
            RaidDayEventClock.DayState.AFTER_DAY){
            Toast.makeText(this,"A data informada já passou. Edite o evento ou use o Modo Treino.",
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
        setEduDialogueState("");
        appendEvent(today.equals(date)?"STARTED_DAY_D":"STARTED");
        reactAvatar(RaidDayAvatarFrames.WAVE);
        updateStep();
    }
    private void beginTraining(){
        if(!demoToday&&(!riskAccepted||!preparation.isComplete()))return;
        training=true;active=false;index=0;repeatedCycles=0;
        eduDialogueState="";
        paused=false;finished=false;endPending=false;
        eduCaptureQuestion=false;eduRecordingExtraRaid=false;
        eduHelpOpen=false;eduSettingsOpen=false;
        reactAvatar(RaidDayAvatarFrames.WAVE);
        updateStep();
    }
    private void startDemoToday(){
        // Usa a data atual de Brasília apenas neste TREINO, nunca como evento oficial.
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
        if(visible)placePanel();
    }
    private void setAvatarMotion(boolean enabled){
        avatarMotion=enabled;
        prefs.edit().putBoolean(RaidDayAvatarFrames.PREF_MOTION,enabled).apply();
        handler.removeCallbacks(avatarTicker);
        if(avatarView!=null&&avatarSprites!=null){
            if(enabled)handler.post(avatarTicker);
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
        if(avatarSprites!=null)
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
                        }
                        if(dragging){
                            bubbleParams.x=Math.max(0,Math.min(
                                getResources().getDisplayMetrics().widthPixels-
                                bubbleParams.width,startX+Math.round(dx)));
                            bubbleParams.y=Math.max(0,Math.min(
                                getResources().getDisplayMetrics().heightPixels-
                                bubbleParams.height,startY+Math.round(dy)));
                            wm.updateViewLayout(bubble,bubbleParams);
                            if(visible)placePanel();
                        }
                        return true;
                    case MotionEvent.ACTION_CANCEL:
                    case MotionEvent.ACTION_UP:
                        handler.removeCallbacks(longPress);
                        if(dragging){
                            prefs.edit().putInt("x",bubbleParams.x).putInt("y",bubbleParams.y).apply();
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
        if(avatarSprites!=null && avatarMotion)
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
            RaidDayEventClock.BRASILIA);
        if(demoToday)eduBadge.setText("SIMULAÇÃO HOJE · "+now);
        else if(active)eduBadge.setText("ETAPA "+(index+1)+"/11 · "+now);
        else eduBadge.setText("Brasília · "+now);
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
    private void createPanel(){
        panel=new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setPadding(dp(11),dp(8),dp(11),dp(10));
        // Moldura translúcida discreta; a mensagem fica no balão branco.
        panel.setBackground(surface(Color.argb(145,23,32,42),
            Color.argb(70,196,213,228),15));
        eduPanelWidth=Math.min(dp(286),
            getResources().getDisplayMetrics().widthPixels-dp(22));

        LinearLayout header=new LinearLayout(this);
        header.setGravity(Gravity.CENTER_VERTICAL);
        eduHeader=text("Edu",16,Color.WHITE,true);
        eduHeader.setContentDescription("Edu · segure e arraste este cabeçalho para mover a conversa");
        header.addView(eduHeader,new LinearLayout.LayoutParams(0,dp(34),1));
        TextView close=button("×");
        close.setContentDescription("Recolher conversa do Edu");
        LinearLayout.LayoutParams closeP=new LinearLayout.LayoutParams(dp(37),dp(33));
        closeP.leftMargin=dp(5);
        header.addView(close,closeP);
        close.setOnClickListener(v->{
            eduSettingsOpen=false;
            setVisible(false);
        });
        View.OnTouchListener move=new View.OnTouchListener(){
            float originX,originY;
            int panelX,panelY;
            boolean moved;
            @Override public boolean onTouch(View view,MotionEvent event){
                switch(event.getActionMasked()){
                    case MotionEvent.ACTION_DOWN:
                        panelScroll.requestDisallowInterceptTouchEvent(true);
                        originX=event.getRawX();originY=event.getRawY();
                        panelX=panelParams.x;panelY=panelParams.y;
                        moved=false;return true;
                    case MotionEvent.ACTION_MOVE:
                        float dx=event.getRawX()-originX,dy=event.getRawY()-originY;
                        if(!moved&&Math.hypot(dx,dy)>touchSlop)moved=true;
                        if(moved){
                            int sw=getResources().getDisplayMetrics().widthPixels;
                            int sh=getResources().getDisplayMetrics().heightPixels;
                            panelParams.x=Math.max(0,Math.min(
                                sw-eduPanelWidth,panelX+Math.round(dx)));
                            int height=Math.max(dp(80),panelScroll.getHeight());
                            panelParams.y=Math.max(0,Math.min(
                                Math.max(0,sh-height),panelY+Math.round(dy)));
                            try{wm.updateViewLayout(panelScroll,panelParams);}
                            catch(IllegalArgumentException ignored){}
                        }
                        return true;
                    case MotionEvent.ACTION_UP:
                    case MotionEvent.ACTION_CANCEL:
                        panelScroll.requestDisallowInterceptTouchEvent(false);
                        if(moved)prefs.edit().putInt("edu_panel_x",panelParams.x)
                            .putInt("edu_panel_y",panelParams.y).apply();
                        return true;
                }
                return false;
            }
        };
        eduHeader.setOnTouchListener(move);
        header.setOnTouchListener(move);
        panel.addView(header);
        eduBadge=text("",10,Color.rgb(127,219,189),true);
        LinearLayout.LayoutParams badgeLp=new LinearLayout.LayoutParams(-1,-2);
        badgeLp.topMargin=dp(2);
        panel.addView(eduBadge,badgeLp);

        eduMainCard=new LinearLayout(this);
        eduMainCard.setOrientation(LinearLayout.VERTICAL);
        eduMainCard.setPadding(dp(11),dp(9),dp(11),dp(9));
        eduMainCard.setBackground(surface(Color.rgb(253,253,253),
            Color.rgb(128,136,145),13));
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

        // Pequena cauda de quadrinhos conectada ao balão do Edu.
        View speechTail=new View(this){
            private final Paint white=new Paint(Paint.ANTI_ALIAS_FLAG);
            private final Paint line=new Paint(Paint.ANTI_ALIAS_FLAG);
            @Override protected void onDraw(Canvas canvas){
                super.onDraw(canvas);
                float w=getWidth(),h=getHeight();
                Path triangle=new Path();
                triangle.moveTo(1f,0f);
                triangle.lineTo(w-1f,0f);
                triangle.lineTo(dp(5),h-1f);
                triangle.close();
                white.setStyle(Paint.Style.FILL);
                white.setColor(Color.rgb(253,253,253));
                canvas.drawPath(triangle,white);
                Path outline=new Path();
                outline.moveTo(1f,0f);
                outline.lineTo(dp(5),h-1f);
                outline.lineTo(w-1f,0f);
                line.setStyle(Paint.Style.STROKE);
                line.setStrokeWidth(dp(1));
                line.setColor(Color.rgb(128,136,145));
                canvas.drawPath(outline,line);
            }
        };
        LinearLayout.LayoutParams tailParams=new LinearLayout.LayoutParams(dp(17),dp(11));
        tailParams.leftMargin=dp(22);
        tailParams.topMargin=-dp(2);
        panel.addView(speechTail,tailParams);

        createPreparationUi();
        eduActions=new LinearLayout(this);
        eduActions.setOrientation(LinearLayout.VERTICAL);
        panel.addView(eduActions);
        eduMiniActions=new LinearLayout(this);
        eduMiniActions.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams mini=new LinearLayout.LayoutParams(-1,dp(35));
        mini.topMargin=dp(7);
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
        LocalDate now=RaidDayEventClock.todayBrasilia(eventClock);
        if("D-1".equals(step.phase)&&!now.equals(date.minusDays(1)))
            return "Esta parte do roteiro é da VÉSPERA (D−1). "+
                "O horário correto não foi confirmado para o evento selecionado.";
        if("D".equals(step.phase)&&!now.equals(date))
            return "Esta etapa é do DIA DO EVENTO (D). "+
                "Ainda não estamos nessa data em Brasília.";
        return "";
    }
    private String phaseClock(RaidDayGuidePlan.Step step){
        if(training){
            LocalDate today=RaidDayEventClock.todayBrasilia(eventClock);
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
            RaidDayEventClock.BRASILIA);
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
        return "Brasília "+now+zone+" • Horário do método não verificado";
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
        reactAvatar("NO_PASS".equals(type)?RaidDayAvatarFrames.ALERT:
            RaidDayAvatarFrames.WAVE);
        updateStep();
    }
    private void recordEduOutcome(String type){
        if(paused||finished)return;
        persist(type);
        reactAvatar("RAID_WIN".equals(type)?RaidDayAvatarFrames.OK:
            RaidDayAvatarFrames.QUESTION);
        if("RAID_WIN".equals(type)){
            eduCaptureQuestion=true;
            eduNote="";updateStep();return;
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
        if(eduRecordingExtraRaid){
            eduRecordingExtraRaid=false;
            eduNote="Resultado registrado. Você pode anotar outra reide.";
            updateStep();return;
        }
        advanceEdu("STEP_CONFIRMED");
    }
    private void showEduWelcome(){
        if(!eduIntroAccepted){
            setTalk("Olá! Meu nome é Edu. Serei seu treinador hoje! "+
                "Vou te ensinar, passo a passo, o tutorial comunitário "+
                "“Bug dos Passes”. Está pronto?",
                eduNote.isEmpty()?"Uma resposta por vez. Nada será feito no jogo.":eduNote);
            addTwo("Sim, vamos lá",()->{
                eduIntroAccepted=true;eduNote="";updateStep();
            },"Agora não",()->{
                eduNote="Tudo bem! Quando quiser começar, toque em Sim.";
                updateStep();
            });
            return;
        }
        setTalk("Ótimo! Quer simular um evento acontecendo hoje ou "+
            "acompanhar um evento real?",
            "A simulação é fictícia e não concede passes. "+
            "O método comunitário não é garantido e pode violar os termos do jogo.");
        addTwo("Simular hoje",()->startDemoToday(),
            "Evento real",()->{eduWantsReal=true;eduNote="";updateStep();});
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
        LocalDate today=RaidDayEventClock.todayBrasilia(eventClock);
        boolean eve=day!=null&&today.equals(day.minusDays(1));
        boolean eventDay=day!=null&&today.equals(day);
        setTalk(eventDay?
            "Pela data informada, hoje é o dia do evento! Vamos conferir seus passes.":
            "Tudo pronto! Na véspera, vamos começar conferindo seu Passe Diário.",
            "Evento: "+eduEventWhen()+" · Brasília. "+
            "A data e o horário dependem da informação do jogador.");
        if(eve||eventDay){
            addTwo("Começar",()->beginRealSession(),"Treinar",()->{
                demoToday=true;beginTraining();
            });
        }else{
            addTwo("Simular hoje",()->startDemoToday(),
                "Mudar data",()->{
                    prefs.edit().remove("edu_event_date_confirmed_key").apply();
                    preparation.beginEditing();preparation.save(prefs);updateStep();
                });
        }
    }
    private void showEduSettings(){
        eduMainCard.setVisibility(View.GONE);
        preparationSection.setVisibility(View.GONE);
        eduActions.setVisibility(View.GONE);
        eduMiniActions.setVisibility(View.GONE);
        eduSettings.setVisibility(View.VISIBLE);
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
    private void showEduTravel(String region,String firstSpeech){
        boolean arrived="travel_reload".equals(eduDialogueState)||
            "travel_wait".equals(eduDialogueState);
        if(!arrived){
            setTalk(("travel_pending".equals(eduDialogueState)?
                "Sem pressa! Confirme a região antes de continuar. ":firstSpeech)+
                " Você já está no local indicado ("+region+")?",
                "Toque nas coordenadas para copiar. Edu não altera sua localização.");
            addEduCoordinateButton();
            addTwo("Sim, já estou",()->{
                setEduDialogueState("travel_reload");
                reactAvatar(RaidDayAvatarFrames.WAVE);
                updateStep();
            },"Ainda não",()->{
                setEduDialogueState("travel_pending");
                updateStep();
            });
            return;
        }
        setTalk("Ótimo! Agora feche e reabra o Pokémon GO. Aguarde cerca de "+
            "um minuto até o mapa e os Pokémon carregarem. Carregaram?",
            "travel_wait".equals(eduDialogueState)?
                "Aguarde o mapa carregar. Não precisa confirmar antes.":"Confirme o carregamento que você realmente viu.");
        addTwo("Sim, carregaram",()->advanceEdu("MAP_LOADED"),
            "Ainda não",()->{
                setEduDialogueState("travel_wait");updateStep();
            });
    }
    private void showEduNewZealand(RaidDayGuidePlan.Step step){
        boolean atPass="nz_pass".equals(eduDialogueState)||
            "pass_check".equals(eduDialogueState);
        if(!atPass){
            setTalk("nz_pending".equals(eduDialogueState)?
                "Sem pressa! Confira a região. Já chegou à Nova Zelândia?":
                "Agora vamos para a Nova Zelândia. Já está na região indicada?",
                "Toque nas coordenadas para copiar. Esta é a próxima região do relato.");
            addEduCoordinateButton();
            addTwo("Sim, já estou",()->{
                setEduDialogueState("nz_pass");updateStep();
            },"Ainda não",()->{
                setEduDialogueState("nz_pending");updateStep();
            });
            return;
        }
        askEduPass("Confira o Pokémon GO: apareceu um Passe de Reide "+
            "Diário gratuito?", "Só use um passe que você realmente veja no jogo.",
            ()->advanceEdu("PASS_CONFIRMED"),
            ()->navigateEdu(step.noPassTo,"NO_PASS"));
    }
    private void showEduEventDay(){
        if("no_event_pass".equals(eduDialogueState)){
            setTalk("Sem passe confirmado, não vamos registrar uma reide "+
                "que não aconteceu. Quer conferir novamente ou encerrar?",
                "Nenhum passe extra é garantido.");
            addTwo("Conferir de novo",()->{
                setEduDialogueState("");updateStep();
            },"Ver resumo",()->navigateEdu("E11","NO_PASS"));
            return;
        }
        askEduPass((training?"Na simulação, hoje é o evento fictício: ":
                "Pela data informada, hoje seria o dia do evento: ")+eduEventWhen()+
                ". Você já tem um passe disponível no inventário?",
            "Confira também o horário do evento. O horário informado não "+
                "é uma programação oficial verificada.",
            ()->advanceEdu("PASS_CONFIRMED"),
            ()->{setEduDialogueState("no_event_pass");updateStep();});
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
            RaidDayEventClock.todayBrasilia(eventClock).equals(
                preparation.eventDate())){
            setTalk("Chegou o dia do evento! Ontem era a véspera. "+
                "Vamos conferir os passes de hoje?",
                "As etapas da véspera não serão marcadas como concluídas.");
            addTwo("Ir ao evento",()->navigateEdu("E08","DAY_CHANGED_TO_EVENT"),
                "Ver ajuda",()->{eduHelpOpen=true;updateStep();});
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
                askEduPass("O evento será em "+eduEventWhen()+
                    ". Na véspera (D−1), guarde no inventário um Passe de "+
                    "Reide Diário gratuito, sem gastar. Você já tem esse passe?",
                    training?"Simulação: a véspera fictícia foi ontem. "+
                        "Nenhum passe real será usado.":
                        "Se ainda não apareceu, aguarde e confira no jogo.",
                    ()->advanceEdu("PASS_CONFIRMED"),
                    ()->{setEduDialogueState("pass_wait");updateStep();});
                break;
            case "E02":
                showEduTravel("Havaí","Ótimo! O primeiro local do relato é o Havaí.");
                break;
            case "E03":
                showEduNewZealand(step);
                break;
            case "E04":
                setTalk("Agora, se existe um passe válido, participe de uma reide. "+
                    "Como terminou?", "Vitória, captura e recompensas são coisas diferentes.");
                addThree("Venci",()->recordEduOutcome("RAID_WIN"),
                    "Perdi",()->recordEduOutcome("RAID_LOSS"),
                    "Saí",()->recordEduOutcome("RAID_LEFT"));
                break;
            case "E05":
                showEduTravel("Havaí","Depois da reide, o relato retorna ao Havaí.");
                break;
            case "E06":
                askEduPass("Agora abra a mochila: apareceu outro Passe Diário "+
                    "gratuito?", "Só conte um passe que realmente esteja no inventário.",
                    ()->advanceEdu("PASS_CONFIRMED"),
                    ()->navigateEdu(step.noPassTo,"NO_PASS"));
                break;
            case "E07":
                setTalk("Você quer repetir o ciclo a partir do Havaí ou "+
                    "seguir ao dia do evento?",
                    "Contamos ciclos realizados, não passes garantidos.");
                addTwo("Repetir ciclo",()->navigateEdu(step.repeatTo,"CYCLE_REPEATED"),
                    "Ir ao evento",()->navigateEdu(step.noPassTo,"NO_PASS"));
                break;
            case "E08":
                showEduEventDay();
                break;
            case "E09":
                setTalk("O relato também cita Kiribati (Kiritimati), mas "+
                    "esta etapa é opcional. Quer conferir ou pular?",
                    "Se conferir, o relato menciona reabrir o jogo e aguardar "+
                    "aproximadamente um minuto. Isso não prova um passe.");
                addEduCoordinateButton();
                addTwo("Já conferi",()->advanceEdu("STEP_CONFIRMED"),
                    "Pular",()->navigateEdu(step.skipTo,"OPTIONAL_SKIPPED"));
                break;
            case "E10":
                setTalk("Volte ao local onde vai jogar o evento. "+
                    "Quer registrar o resultado de uma reide?",
                    "Registre somente reides reais, uma por vez.");
                addTwo("Registrar reide",()->{
                    eduRecordingExtraRaid=true;eduNote="";updateStep();
                },"Seguir",()->advanceEdu("STEP_CONFIRMED"));
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
            preparation.setQuestion(0); // A conversa começa somente pela data.
            renderPreparation();
        }else if(!riskAccepted){showEduRisk();}
        else{showEduReady();}
        if(visible)placePanel();
    }
    private void placePanelCoordinates(){
        int width=eduPanelWidth;
        int sw=getResources().getDisplayMetrics().widthPixels;
        int sh=getResources().getDisplayMetrics().heightPixels;
        int preferred=bubbleParams.x+bubbleParams.width+dp(5);
        int fallback=preferred+width<sw?preferred:
            Math.max(0,bubbleParams.x-width-dp(5));
        panelParams.x=Math.max(0,Math.min(Math.max(0,sw-width),
            prefs.getInt("edu_panel_x",fallback)));
        panelParams.y=Math.max(0,Math.min(Math.max(0,sh-dp(125)),
            prefs.getInt("edu_panel_y",bubbleParams.y)));
    }
    private void placePanel(){
        if(!visible||panelScroll==null||panelParams==null)return;
        int sw=getResources().getDisplayMetrics().widthPixels;
        int sh=getResources().getDisplayMetrics().heightPixels;
        int height=Math.max(dp(90),panelScroll.getHeight());
        panelParams.x=Math.max(0,Math.min(sw-eduPanelWidth,panelParams.x));
        panelParams.y=Math.max(0,Math.min(Math.max(0,sh-height),panelParams.y));
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
            panelScroll.post(this::placePanel);
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
        if(avatarSprites!=null){avatarSprites.release();avatarSprites=null;}
        super.onDestroy();
    }
}

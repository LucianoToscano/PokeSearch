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
import android.widget.TextView;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

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
    private WindowManager.LayoutParams bubbleParams,panelParams;
    private SharedPreferences prefs;
    private TextView progressText,titleText,instructionText,statusText,confirmButton,pauseButton;
    private TextView copyButton,repeatButton,cycleText,skipButton;
    private TextView riskContinue,riskExit,startButton,trainButton,trainingExit;
    private TextView notHappenedButton,helpButton,endButton;
    private LinearLayout cycleActions,guideContent,riskSection,startSection;
    private ProgressBar progressBar;
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
        TextView b=text(label,12,Color.WHITE,true);
        b.setGravity(Gravity.CENTER);
        b.setMinHeight(dp(35));
        b.setPadding(dp(7),dp(3),dp(7),dp(3));
        b.setBackground(surface(Color.argb(222,40,52,66),Color.argb(90,180,203,225),8));
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
            running=true;
        }catch(RuntimeException error){
            stopSelf();
        }
    }
    @Override public int onStartCommand(Intent intent,int flags,int startId){
        if(intent!=null&&ACTION_STOP.equals(intent.getAction())){
            stopSelf();return START_NOT_STICKY;
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
        if(active||training)return;
        if(journal.events().count(sessionKey)>0){
            int generation=Math.max(1,prefs.getInt("sessionGeneration",1))+1;
            prefs.edit().putInt("sessionGeneration",generation).apply();
            sessionKey=eventKey+"#"+generation;
        }
        index=0;repeatedCycles=0;paused=false;finished=false;active=true;
        appendEvent("STARTED");
        updateStep();
    }
    private void beginTraining(){
        if(!riskAccepted)return;
        training=true;active=false;index=0;repeatedCycles=0;
        paused=false;finished=false;endPending=false;
        updateStep();
    }
    private void leaveTraining(){
        training=false;restoreJournal();updateStep();
    }

    private void createBubble(){
        bubble=new FrameLayout(this);
        bubble.setBackgroundColor(Color.TRANSPARENT);
        ImageView image=new ImageView(this);
        image.setScaleType(ImageView.ScaleType.FIT_CENTER);
        image.setContentDescription("Assistente do Dia de Reides");
        if(artwork!=null)image.setImageBitmap(artwork);
        else image.setImageResource(R.drawable.ic_notification);
        bubble.addView(image,new FrameLayout.LayoutParams(dp(ART_DP),dp(ART_DP),Gravity.CENTER));
        View grip=new View(this);
        grip.setClickable(true);
        grip.setContentDescription(
            "Assistente do Dia de Reides: toque para abrir, segure para ver, arraste para mover");
        bubble.addView(grip,new FrameLayout.LayoutParams(-1,-1));
        bubbleParams=new WindowManager.LayoutParams(
            dp(BUBBLE_DP),dp(BUBBLE_DP),WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,PixelFormat.TRANSLUCENT);
        bubbleParams.gravity=Gravity.TOP|Gravity.LEFT;
        int maxX=Math.max(0,getResources().getDisplayMetrics().widthPixels-dp(BUBBLE_DP));
        int maxY=Math.max(0,getResources().getDisplayMetrics().heightPixels-dp(BUBBLE_DP));
        bubbleParams.x=Math.max(0,Math.min(maxX,prefs.getInt("x",dp(80))));
        bubbleParams.y=Math.max(0,Math.min(maxY,prefs.getInt("y",dp(310))));
        grip.setOnTouchListener(new View.OnTouchListener(){
            private float downX,downY;
            private int startX,startY;
            private boolean held;
            private final Runnable longPress=()->{
                if(!dragging){
                    held=true;
                    if(!visible)setVisible(true);
                }
            };
            @Override public boolean onTouch(View v,MotionEvent event){
                switch(event.getActionMasked()){
                    case MotionEvent.ACTION_DOWN:
                        downX=event.getRawX();downY=event.getRawY();
                        startX=bubbleParams.x;startY=bubbleParams.y;
                        held=false;dragging=false;
                        handler.postDelayed(longPress,500L);
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        float dx=event.getRawX()-downX,dy=event.getRawY()-downY;
                        if(!dragging&&Math.hypot(dx,dy)>touchSlop){
                            dragging=true;handler.removeCallbacks(longPress);
                        }
                        if(dragging){
                            bubbleParams.x=Math.max(0,Math.min(maxX,startX+Math.round(dx)));
                            bubbleParams.y=Math.max(0,Math.min(maxY,startY+Math.round(dy)));
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
                            setVisible(!visible);
                        }
                        dragging=false;return true;
                }
                return true;
            }
        });
        wm.addView(bubble,bubbleParams);
    }
    private void createPanel(){
        panel=new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setPadding(dp(12),dp(11),dp(12),dp(12));
        panel.setBackground(surface(Color.argb(236,26,34,45),
            Color.argb(110,205,215,232),13));
        LinearLayout header=new LinearLayout(this);
        header.setGravity(Gravity.CENTER_VERTICAL);
        TextView heading=text(getString(R.string.raid_day_title),13,Color.WHITE,true);
        header.addView(heading,new LinearLayout.LayoutParams(0,dp(29),1));
        TextView close=button("×");
        close.setContentDescription("Recolher assistente");
        close.setOnClickListener(v->setVisible(false));
        header.addView(close,new LinearLayout.LayoutParams(dp(31),dp(29)));
        panel.addView(header);

        riskSection=new LinearLayout(this);
        riskSection.setOrientation(LinearLayout.VERTICAL);
        riskSection.setPadding(dp(6),dp(5),dp(6),dp(5));
        riskSection.setBackground(surface(Color.argb(170,73,46,31),
            Color.argb(100,249,182,119),9));
        TextView riskHeading=text(getString(R.string.raid_day_risk_title),13,Color.WHITE,true);
        riskSection.addView(riskHeading);
        TextView riskInfo=text(getString(R.string.raid_day_risk_message),
            11,Color.rgb(248,223,200),false);
        riskInfo.setPadding(0,dp(6),0,dp(7));
        riskSection.addView(riskInfo);
        LinearLayout riskActions=new LinearLayout(this);
        riskContinue=button(getString(R.string.raid_day_risk_agree));
        riskActions.addView(riskContinue,new LinearLayout.LayoutParams(0,dp(39),1));
        riskExit=button(getString(R.string.raid_day_risk_exit));
        LinearLayout.LayoutParams exitLp=new LinearLayout.LayoutParams(dp(64),dp(39));
        exitLp.leftMargin=dp(6);
        riskActions.addView(riskExit,exitLp);
        riskSection.addView(riskActions);
        riskContinue.setOnClickListener(v->{
            riskAccepted=true;
            prefs.edit().putString("riskAcceptance",plan.riskVersion+":"+eventKey)
                .putLong("riskAcceptedAtMs",System.currentTimeMillis()).apply();
            updateStep();
        });
        riskExit.setOnClickListener(v->stopSelf());
        panel.addView(riskSection,new LinearLayout.LayoutParams(-1,-2));

        startSection=new LinearLayout(this);
        startSection.setOrientation(LinearLayout.VERTICAL);
        TextView startInfo=text(getString(R.string.raid_day_manual_disclaimer),
            11,Color.rgb(211,222,235),false);
        startInfo.setPadding(0,dp(7),0,dp(7));
        startSection.addView(startInfo);
        startButton=button(getString(R.string.raid_day_manual_start));
        startSection.addView(startButton,new LinearLayout.LayoutParams(-1,dp(38)));
        trainButton=button(getString(R.string.raid_day_training_start));
        LinearLayout.LayoutParams tp=new LinearLayout.LayoutParams(-1,dp(38));
        tp.topMargin=dp(7);
        startSection.addView(trainButton,tp);
        startButton.setOnClickListener(v->beginRealSession());
        trainButton.setOnClickListener(v->beginTraining());
        panel.addView(startSection,new LinearLayout.LayoutParams(-1,-2));

        guideContent=new LinearLayout(this);
        guideContent.setOrientation(LinearLayout.VERTICAL);
        panel.addView(guideContent,new LinearLayout.LayoutParams(-1,-2));
        progressText=text("",10,Color.rgb(177,204,224),false);
        LinearLayout.LayoutParams pp=new LinearLayout.LayoutParams(-1,dp(24));
        guideContent.addView(progressText,pp);
        progressBar=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(plan.size());
        progressBar.setProgressTintList(android.content.res.ColorStateList.valueOf(
            Color.rgb(103,212,175)));
        progressBar.setProgressBackgroundTintList(
            android.content.res.ColorStateList.valueOf(Color.rgb(63,75,88)));
        guideContent.addView(progressBar,new LinearLayout.LayoutParams(-1,dp(4)));
        titleText=text("",14,Color.WHITE,true);
        LinearLayout.LayoutParams titleParams=new LinearLayout.LayoutParams(-1,-2);
        titleParams.topMargin=dp(10);
        guideContent.addView(titleText,titleParams);
        instructionText=text("",12,Color.rgb(219,227,235),false);
        instructionText.setLineSpacing(dp(2),1f);
        LinearLayout.LayoutParams instr=new LinearLayout.LayoutParams(-1,-2);
        instr.topMargin=dp(5);
        guideContent.addView(instructionText,instr);
        statusText=text("Tutorial dos Passes · confirmação manual",10,
            Color.rgb(174,195,214),false);
        LinearLayout.LayoutParams st=new LinearLayout.LayoutParams(-1,-2);
        st.topMargin=dp(8);
        guideContent.addView(statusText,st);
        // Only steps that mention a locality expose that exact coordinate,
        // copied upon an explicit user tap. No external-app interaction.
        copyButton=button(getString(R.string.raid_day_copy_coords));
        LinearLayout.LayoutParams copyLp=new LinearLayout.LayoutParams(-1,dp(33));
        copyLp.topMargin=dp(7);
        guideContent.addView(copyButton,copyLp);
        copyButton.setOnClickListener(v->{
            if(finished||plan.coords(index).isEmpty())return;
            ClipboardManager cb=(ClipboardManager)getSystemService(Context.CLIPBOARD_SERVICE);
            if(cb==null)return;
            cb.setPrimaryClip(ClipData.newPlainText("Local do roteiro",plan.coords(index)));
            Toast.makeText(this,"Coordenadas copiadas · confira antes de usar",
                Toast.LENGTH_SHORT).show();
        });
        cycleText=text("",10,Color.rgb(177,204,224),false);
        LinearLayout.LayoutParams cycleLp=new LinearLayout.LayoutParams(-1,-2);
        cycleLp.topMargin=dp(5);
        guideContent.addView(cycleText,cycleLp);
        LinearLayout actions=new LinearLayout(this);
        LinearLayout.LayoutParams ap=new LinearLayout.LayoutParams(-1,dp(37));
        ap.topMargin=dp(10);
        guideContent.addView(actions,ap);
        TextView back=button("←");
        back.setContentDescription("Voltar uma etapa");
        actions.addView(back,new LinearLayout.LayoutParams(dp(36),-1));
        back.setOnClickListener(v->{
            if(index>0){
                String from=plan.step(index).id;
                index--;finished=false;endPending=false;
                persist("BACK",from);updateStep();
            }
        });
        confirmButton=button(getString(R.string.raid_day_confirm));
        LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(0,-1,1);
        cp.leftMargin=dp(6);
        actions.addView(confirmButton,cp);
        confirmButton.setOnClickListener(v->{
            if(paused)return;
            long now=SystemClock.elapsedRealtime();
            if(now-lastConfirmAt<650L)return; // no accidental double-step
            lastConfirmAt=now;
            if(finished)return; // não reiniciar, nem apagar, pelo botão Confirmar
            String confirmedStep=plan.step(index).id;
            if(index<plan.size()-1)index++;
            else finished=true;
            endPending=false;
            persist(finished?"FINISHED":"STEP_CONFIRMED",confirmedStep);
            updateStep();
        });
        pauseButton=button("Ⅱ");
        pauseButton.setContentDescription("Pausar ou retomar guia");
        LinearLayout.LayoutParams pauseP=new LinearLayout.LayoutParams(dp(40),-1);
        pauseP.leftMargin=dp(6);
        actions.addView(pauseButton,pauseP);
        pauseButton.setOnClickListener(v->{
            paused=!paused;endPending=false;
            persist(paused?"PAUSED":"RESUMED");updateStep();
        });
        cycleActions=new LinearLayout(this);
        LinearLayout.LayoutParams cycleActionsLp=new LinearLayout.LayoutParams(-1,dp(36));
        cycleActionsLp.topMargin=dp(6);
        guideContent.addView(cycleActions,cycleActionsLp);
        repeatButton=button(getString(R.string.raid_day_cycle_repeat));
        cycleActions.addView(repeatButton,new LinearLayout.LayoutParams(0,-1,1));
        repeatButton.setOnClickListener(v->{
            if(paused||finished||plan.step(index).repeatTo.isEmpty())return;
            if(repeatedCycles>=100){
                statusText.setText("Limite de repetições salvas neste roteiro");
                return;
            }
            String from=plan.step(index).id;
            repeatedCycles++;
            index=plan.indexOf(plan.step(index).repeatTo);
            endPending=false;persist("CYCLE_REPEATED",from);updateStep();
        });
        skipButton=button(getString(R.string.raid_day_no_pass));
        LinearLayout.LayoutParams skipLp=new LinearLayout.LayoutParams(0,-1,1);
        skipLp.leftMargin=dp(6);
        cycleActions.addView(skipButton,skipLp);
        skipButton.setOnClickListener(v->{
            if(paused||finished)return;
            RaidDayGuidePlan.Step step=plan.step(index);
            if(!step.skipTo.isEmpty()){
                index=plan.indexOf(step.skipTo);
                endPending=false;
                persist("OPTIONAL_SKIPPED",step.id);updateStep();return;
            }
            if(step.noPassTo.isEmpty())return;
            index=plan.indexOf(step.noPassTo);
            endPending=false;
            persist("NO_PASS",step.id);updateStep();
        });
        LinearLayout fallbackActions=new LinearLayout(this);
        LinearLayout.LayoutParams fallbackLp=new LinearLayout.LayoutParams(-1,dp(36));
        fallbackLp.topMargin=dp(6);
        guideContent.addView(fallbackActions,fallbackLp);
        notHappenedButton=button(getString(R.string.raid_day_not_happened));
        fallbackActions.addView(notHappenedButton,
            new LinearLayout.LayoutParams(0,-1,1));
        helpButton=button(getString(R.string.raid_day_help));
        LinearLayout.LayoutParams hLp=new LinearLayout.LayoutParams(0,-1,1);
        hLp.leftMargin=dp(4);
        fallbackActions.addView(helpButton,hLp);
        endButton=button(getString(R.string.raid_day_end));
        LinearLayout.LayoutParams eLp=new LinearLayout.LayoutParams(0,-1,1);
        eLp.leftMargin=dp(4);
        fallbackActions.addView(endButton,eLp);
        notHappenedButton.setOnClickListener(v->{
            if(paused||finished)return;
            persist("NOT_OBSERVED");
            statusText.setText("Não confirmado. "+plan.step(index).onNotHappened);
        });
        helpButton.setOnClickListener(v->{
            if(finished)return;
            statusText.setText("Você está em "+plan.step(index).id+
                ". "+plan.step(index).safeReturn);
        });
        endButton.setOnClickListener(v->{
            if(training){leaveTraining();return;}
            if(!active)return;
            if(!endPending){
                endPending=true;
                endButton.setText("Confirmar fim");
                statusText.setText("Confirmar encerra esta sessão, sem apagar o histórico.");
                return;
            }
            endPending=false;active=false;finished=true;
            persist("ENDED");updateStep();
        });
        trainingExit=button("Sair do Modo Treino (não salvar)");
        LinearLayout.LayoutParams trainingLp=new LinearLayout.LayoutParams(-1,dp(36));
        trainingLp.topMargin=dp(6);
        guideContent.addView(trainingExit,trainingLp);
        trainingExit.setOnClickListener(v->leaveTraining());
        panelParams=new WindowManager.LayoutParams(
            dp(272),-2,WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,PixelFormat.TRANSLUCENT);
        panelParams.gravity=Gravity.TOP|Gravity.LEFT;
        // Android 12+ pode bloquear toques em outro app quando a janela
        // sobreposta obscurece excessivamente a tela.
        panelParams.alpha=.79f;
        placePanelCoordinates();
    }
    /** Grava eventos reais antes de mostrar a próxima etapa. */
    private void persist(String eventType){
        persist(eventType,plan.step(index).id);
    }
    private void persist(String eventType,String actedOnStep){
        if(training)return;
        appendEvent(eventType,actedOnStep);
    }
    private void updateStep(){
        if(progressText==null)return;
        riskSection.setVisibility(!riskAccepted?View.VISIBLE:View.GONE);
        startSection.setVisibility(riskAccepted&&!active&&!training?
            View.VISIBLE:View.GONE);
        boolean guiding=riskAccepted&&(active||training);
        guideContent.setVisibility(guiding?View.VISIBLE:View.GONE);
        if(!guiding){if(visible)placePanel();return;}
        RaidDayGuidePlan.Step current=plan.step(index);
        progressText.setText(finished?"Resumo concluído":
            (training?"TREINO · ":"")+"Etapa "+current.id+" de E11");
        progressBar.setMax(plan.size());
        progressBar.setProgress(finished?plan.size():index);
        titleText.setText(finished?"Roteiro finalizado":
            current.id+" — "+current.title);
        instructionText.setText(finished?
            "Registro encerrado. Ciclos não significam passes recebidos. "+
            "A confirmação manual não comprova recompensa do jogo.":
            current.instruction);
        statusText.setText(paused?"Pausado · toque em ▶ para retomar":
            training?"Modo Treino · nenhuma ação é salva":
            getString(R.string.raid_day_no_screen_access));
        copyButton.setVisibility(!finished&&!plan.coords(index).isEmpty()?
            View.VISIBLE:View.GONE);
        cycleText.setText("Ciclos repetidos: "+repeatedCycles+
            " · não representa passes");
        boolean check=!finished&&!current.repeatTo.isEmpty();
        boolean noPass=!finished&&!current.noPassTo.isEmpty();
        boolean optional=!finished&&!current.skipTo.isEmpty();
        cycleActions.setVisibility(check||noPass||optional?
            View.VISIBLE:View.GONE);
        repeatButton.setVisibility(check?View.VISIBLE:View.GONE);
        skipButton.setVisibility(check||noPass||optional?
            View.VISIBLE:View.GONE);
        skipButton.setText(optional?"Pular Kiribati":"Sem passe → evento");
        confirmButton.setText(finished?"✓ Concluído":
            check?"✓ Prosseguir":"✓ Confirmar");
        confirmButton.setAlpha(paused||finished?.45f:1f);
        pauseButton.setText(paused?"▶":"Ⅱ");
        trainingExit.setVisibility(training?View.VISIBLE:View.GONE);
        endButton.setText(training?"Sair do treino":
            endPending?"Confirmar fim":"Encerrar");
        if(visible)placePanel();
    }
    private void placePanelCoordinates(){
        int sw=getResources().getDisplayMetrics().widthPixels;
        int sh=getResources().getDisplayMetrics().heightPixels;
        int width=dp(272);
        int preferred=bubbleParams.x+dp(BUBBLE_DP)+dp(4);
        panelParams.x=preferred+width<=sw?preferred:
            Math.max(0,bubbleParams.x-width-dp(4));
        panelParams.x=Math.max(0,Math.min(sw-width,panelParams.x));
        panelParams.y=Math.max(0,Math.min(Math.max(0,sh-dp(355)),bubbleParams.y-dp(12)));
    }
    private void placePanel(){
        if(!visible||panel==null||panelParams==null)return;
        placePanelCoordinates();
        try{wm.updateViewLayout(panel,panelParams);}
        catch(IllegalArgumentException ignored){}
    }
    private void setVisible(boolean show){
        if(panel==null||wm==null||show==visible)return;
        visible=show;
        if(show){
            placePanelCoordinates();
            wm.addView(panel,panelParams);
        }else{
            try{wm.removeView(panel);}catch(IllegalArgumentException ignored){}
        }
    }
    @Override public void onDestroy(){
        running=false;
        handler.removeCallbacksAndMessages(null);
        if(wm!=null){
            if(panel!=null&&visible){
                try{wm.removeView(panel);}catch(IllegalArgumentException ignored){}
            }
            if(bubble!=null){
                try{wm.removeView(bubble);}catch(IllegalArgumentException ignored){}
            }
        }
        visible=false;
        if(artwork!=null){artwork.recycle();artwork=null;}
        super.onDestroy();
    }
}

package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.content.res.ColorStateList;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Switch;
import android.widget.SeekBar;
import android.widget.TextView;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.ArrayList;
import java.util.Locale;

/**
 * LT319 — painel compacto do relógio virtual. Este é o ÚNICO relógio do Edu;
 * nenhuma configuração desta tela altera a hora, o fuso ou o GPS do Android.
 * O simulador de testes não aparece nos balões de conversa do personagem.
 */
public final class EduClockSettingsActivity extends Activity {
    private static final int BACK=0xff131c28;
    private static final int CARD=0xff202b38;
    private static final int PRIMARY=0xfff1f5f6;
    private static final int SECONDARY=0xffa7b5bd;
    private static final int DIVIDER=0xff344451;
    private static final int ACCENT=0xff8fd0c5;
    private static final Locale BR=Locale.forLanguageTag("pt-BR");
    private static final String PREF_MOMENT="last_moment_label";

    private LinearLayout manualDateTime,advancedOptions;
    private Switch autoDate,format24;
    private TextView previewDate,previewTime,previewMode;
    private TextView momentDetail,dateTimeDetail,zoneDetail,moreDetail;
    private TextView alphaPercent;
    private final List<TextView> quickMomentButtons=new ArrayList<>();
    private final List<TextView> sizeButtons=new ArrayList<>();
    private SeekBar balloonAlpha;
    private SharedPreferences visualPrefs;
    // Só as fases que mudam decisões ou validam o contador/encerramento.
    // Os 17 offsets históricos continuam no modelo para compatibilidade.
    private static final String[] QUICK_MOMENTS={
        "Faltam 24 horas","Falta 1 hora",
        "10 minutos antes","10 segundos antes",
        "Início do evento","2 horas após o início",
        "10 minutos antes do fim","10 minutos depois do fim"
    };
    private static final String[] QUICK_LABELS={
        "24h antes","1h antes",
        "10min antes","10s antes",
        "Início","2h depois",
        "10min p/ fim","10min após fim"
    };
    private String chosenMomentLabel="";
    private boolean rendering=false,advancedOpen=false;
    private final Handler handler=new Handler(Looper.getMainLooper());
    private boolean active=false;
    private final Runnable tick=new Runnable(){
        @Override public void run(){
            if(!active)return;
            refresh();
            handler.postDelayed(this,1000);
        }
    };

    private int dp(float value){
        return Math.round(value*getResources().getDisplayMetrics().density);
    }
    private GradientDrawable bg(int color,int radius){
        GradientDrawable drawable=new GradientDrawable();
        drawable.setColor(color);
        drawable.setCornerRadius(dp(radius));
        drawable.setStroke(dp(1),0x28d7eeed);
        return drawable;
    }
    private TextView label(String title,int sp,int color,boolean bold){
        TextView view=new TextView(this);
        view.setText(title);
        view.setTextColor(color);
        view.setTextSize(sp);
        view.setIncludeFontPadding(false);
        if(bold)view.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        return view;
    }
    private LinearLayout column(){
        LinearLayout layout=new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        return layout;
    }
    private LinearLayout.LayoutParams match(){
        return new LinearLayout.LayoutParams(-1,-2);
    }
    private void divider(LinearLayout parent){
        View line=new View(this);
        line.setBackgroundColor(DIVIDER);
        LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(-1,dp(1));
        params.leftMargin=dp(17);
        params.rightMargin=dp(17);
        parent.addView(line,params);
    }
    private LinearLayout card(LinearLayout parent){
        LinearLayout container=column();
        container.setBackground(bg(CARD,19));
        LinearLayout.LayoutParams params=match();
        params.topMargin=dp(13);
        parent.addView(container,params);
        return container;
    }
    private void addSwitchRow(LinearLayout parent,String title,String sub,
                              Switch control,boolean checked){
        LinearLayout row=new LinearLayout(this);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(dp(17),dp(15),dp(17),dp(15));
        LinearLayout text=column();
        text.addView(label(title,16,PRIMARY,true),match());
        if(sub!=null&&!sub.isEmpty()){
            TextView detail=label(sub,12,SECONDARY,false);
            LinearLayout.LayoutParams params=match();
            params.topMargin=dp(4);
            text.addView(detail,params);
        }
        row.addView(text,new LinearLayout.LayoutParams(0,-2,1));
        LinearLayout.LayoutParams controlParams=new LinearLayout.LayoutParams(-2,-2);
        controlParams.leftMargin=dp(10);
        row.addView(control,controlParams);
        control.setChecked(checked);
        control.setContentDescription(title);
        int[][] states={
            {android.R.attr.state_checked},
            {}
        };
        control.setThumbTintList(new ColorStateList(states,
            new int[]{Color.WHITE,0xffd0d8d9}));
        control.setTrackTintList(new ColorStateList(states,
            new int[]{ACCENT,0xff5b6975}));
        parent.addView(row,match());
        row.setOnClickListener(v->control.setChecked(!control.isChecked()));
    }
    private TextView addAction(LinearLayout parent,String title,
                               String initial,Runnable click){
        LinearLayout row=column();
        row.setPadding(dp(17),dp(14),dp(17),dp(14));
        row.addView(label(title,16,PRIMARY,true),match());
        TextView detail=label(initial,12,ACCENT,false);
        LinearLayout.LayoutParams params=match();
        params.topMargin=dp(4);
        row.addView(detail,params);
        row.setContentDescription(title);
        row.setOnClickListener(v->click.run());
        parent.addView(row,match());
        return detail;
    }

    @Override public void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(BACK);
        getWindow().setNavigationBarColor(BACK);
        chosenMomentLabel=getPreferences(MODE_PRIVATE)
            .getString(PREF_MOMENT,"");
        visualPrefs=getSharedPreferences("raid_assistant_overlay",MODE_PRIVATE);
        migrateAvatarSizeIfNeeded();

        ScrollView scroll=new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setClipToPadding(false);
        GradientDrawable backdrop=new GradientDrawable(
            GradientDrawable.Orientation.TL_BR,
            new int[]{0xff121a25,0xff192635});
        scroll.setBackground(backdrop);
        LinearLayout screen=column();
        screen.setPadding(dp(15),dp(11),dp(15),dp(28));
        scroll.addView(screen,new ScrollView.LayoutParams(-1,-2));
        setContentView(scroll);

        LinearLayout heading=new LinearLayout(this);
        heading.setGravity(Gravity.CENTER_VERTICAL);
        TextView back=label("‹",32,PRIMARY,false);
        back.setGravity(Gravity.CENTER);
        heading.addView(back,new LinearLayout.LayoutParams(dp(42),dp(48)));
        back.setOnClickListener(v->finish());
        TextView title=label("Relógio virtual",23,PRIMARY,true);
        LinearLayout.LayoutParams titleParams=new LinearLayout.LayoutParams(-2,-2);
        titleParams.leftMargin=dp(3);
        heading.addView(title,titleParams);
        screen.addView(heading,match());

        TextView subtitle=label("Ajuste o horário para testar as etapas do evento.",
            12,SECONDARY,false);
        LinearLayout.LayoutParams subtitleParams=match();
        subtitleParams.leftMargin=dp(44);
        subtitleParams.topMargin=dp(2);
        screen.addView(subtitle,subtitleParams);

        LinearLayout preview=card(screen);
        preview.setPadding(dp(18),dp(17),dp(18),dp(17));
        previewDate=label("",13,SECONDARY,false);
        preview.addView(previewDate,match());
        previewTime=label("",34,PRIMARY,true);
        previewTime.setTypeface(Typeface.MONOSPACE,Typeface.BOLD);
        LinearLayout.LayoutParams timeParams=match();
        timeParams.topMargin=dp(7);
        preview.addView(previewTime,timeParams);
        previewMode=label("",12,ACCENT,false);
        LinearLayout.LayoutParams modeParams=match();
        modeParams.topMargin=dp(6);
        preview.addView(previewMode,modeParams);

        autoDate=new Switch(this);
        format24=new Switch(this);
        LinearLayout mainCard=card(screen);
        addSwitchRow(mainCard,"Automático","Usar a hora do celular",
            autoDate,EduEventClock.isAutomaticDateTime(this));
        divider(mainCard);
        // Os oito momentos essenciais ficam na própria tela, sem modal,
        // submenus ou a lista longa com 17 opções pouco utilizadas.
        TextView quickTitle=label("Momentos rápidos",15,PRIMARY,true);
        quickTitle.setPadding(dp(16),dp(12),dp(16),dp(7));
        mainCard.addView(quickTitle,match());
        addQuickMomentGrid(mainCard);
        momentDetail=label("",12,ACCENT,false);
        momentDetail.setPadding(dp(16),dp(8),dp(16),dp(11));
        mainCard.addView(momentDetail,match());
        manualDateTime=column();
        mainCard.addView(manualDateTime,match());
        divider(manualDateTime);
        dateTimeDetail=addAction(manualDateTime,"Ajustar data e hora",
            "",this::chooseDateTime);

        LinearLayout appearance=card(screen);
        appearance.setPadding(dp(16),dp(12),dp(16),dp(12));
        appearance.addView(label("Aparência do Edu",16,PRIMARY,true),match());
        addSizeSelector(appearance);
        addBalloonAlphaSlider(appearance);

        LinearLayout extras=card(screen);
        moreDetail=addAction(extras,"Mais opções",
            "Fuso horário e formato",()->{
                advancedOpen=!advancedOpen;
                showAdvancedOptions();
            });
        advancedOptions=column();
        extras.addView(advancedOptions,match());
        divider(advancedOptions);
        zoneDetail=addAction(advancedOptions,"Fuso horário","",
            this::chooseZone);
        divider(advancedOptions);
        addSwitchRow(advancedOptions,"Formato 24 horas","",
            format24,EduEventClock.is24HourFormat(this));
        showAdvancedOptions();

        autoDate.setOnCheckedChangeListener((v,checked)->{
            if(rendering)return;
            EduEventClock.setAutomaticDateTime(this,checked);
            clearMomentLabel();
            refresh();
        });
        format24.setOnCheckedChangeListener((v,checked)->{
            if(rendering)return;
            EduEventClock.set24HourFormat(this,checked);
            refresh();
        });
        refresh();
    }

    private void clearMomentLabel(){
        chosenMomentLabel="";
        getPreferences(MODE_PRIVATE).edit().remove(PREF_MOMENT).apply();
    }
    private void showAdvancedOptions(){
        advancedOptions.setVisibility(advancedOpen?View.VISIBLE:View.GONE);
        moreDetail.setText(advancedOpen?"Ocultar opções":
            "Fuso horário e formato");
    }

    /** Data e hora são definidas numa única ação: o cancelamento não altera nada. */
    private void chooseDateTime(){
        LocalDateTime current=EduEventClock.localNow(this);
        DatePickerDialog picker=new DatePickerDialog(this,(view,y,m,d)->{
            LocalDateTime day=current.withDayOfMonth(1)
                .withYear(y).withMonth(m+1).withDayOfMonth(d);
            new TimePickerDialog(this,(timePicker,h,minute)->{
                EduEventClock.setBrasiliaDateTime(this,
                    day.withHour(h).withMinute(minute).withSecond(0));
                clearMomentLabel();
                refresh();
            },current.getHour(),current.getMinute(),
              EduEventClock.is24HourFormat(this)).show();
        },current.getYear(),current.getMonthValue()-1,
          current.getDayOfMonth());
        picker.show();
    }

    /** Mantém a preferência P/M/G existente; novas contas iniciam em M. */
    private void migrateAvatarSizeIfNeeded(){
        final String migrated="edu_size_pmg_100_150_200_v1";
        if(visualPrefs.getBoolean(migrated,false))return;
        int previous=visualPrefs.getInt(RaidDayAvatarFrames.PREF_SIZE,-1);
        int next=previous==50?100:previous==75?150:
            previous==100?200:150;
        visualPrefs.edit().putInt(RaidDayAvatarFrames.PREF_SIZE,next)
            .putBoolean(migrated,true).apply();
    }
    private TextView chip(String label){
        TextView b=label(label,13,PRIMARY,true);
        b.setGravity(Gravity.CENTER);
        b.setPadding(dp(5),0,dp(5),0);
        b.setBackground(bg(0xff2c3a45,11));
        return b;
    }
    private void addQuickMomentGrid(LinearLayout parent){
        for(int line=0;line<4;line++){
            LinearLayout row=new LinearLayout(this);
            row.setPadding(dp(13),0,dp(13),0);
            for(int column=0;column<2;column++){
                int i=line*2+column;
                TextView button=chip(QUICK_LABELS[i]);
                button.setContentDescription("Simular "+QUICK_MOMENTS[i]);
                LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(
                    0,dp(37),1);
                if(column>0)p.leftMargin=dp(8);
                button.setOnClickListener(v->chooseQuickMoment(i));
                row.addView(button,p);
                quickMomentButtons.add(button);
            }
            LinearLayout.LayoutParams rp=match();
            rp.bottomMargin=dp(7);
            parent.addView(row,rp);
        }
    }
    /** Seleção imediata e no mesmo painel, sem abrir uma segunda janela. */
    private void chooseQuickMoment(int index){
        long begin=RaidDaySchedule.start(this);
        long finish=RaidDaySchedule.finish(this);
        if(!RaidDaySchedule.valid(begin,finish)){
            momentDetail.setText("Configure primeiro a data do evento.");
            return;
        }
        for(EduEventMomentPresets.Moment moment:
            EduEventMomentPresets.forWindow(begin,finish)){
            if(!moment.label.equals(QUICK_MOMENTS[index]))continue;
            EduEventClock.setManualInstant(this,
                Instant.ofEpochMilli(moment.epochMillis));
            chosenMomentLabel=moment.label;
            getPreferences(MODE_PRIVATE).edit()
                .putString(PREF_MOMENT,chosenMomentLabel).apply();
            refresh();
            return;
        }
    }
    private void addSizeSelector(LinearLayout parent){
        TextView title=label("Tamanho da sprite",13,SECONDARY,false);
        LinearLayout.LayoutParams header=match();
        header.topMargin=dp(12);
        parent.addView(title,header);
        LinearLayout row=new LinearLayout(this);
        final String[] labels={"P · 100","M · 150","G · 200"};
        final int[] sizes={100,150,200};
        for(int i=0;i<3;i++){
            TextView choice=chip(labels[i]);
            LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(
                0,dp(40),1);
            if(i>0)p.leftMargin=dp(8);
            final int size=sizes[i];
            choice.setOnClickListener(v->{
                visualPrefs.edit()
                    .putInt(RaidDayAvatarFrames.PREF_SIZE,size).apply();
                refreshVisualControls();
            });
            row.addView(choice,p);
            sizeButtons.add(choice);
        }
        LinearLayout.LayoutParams rp=match();
        rp.topMargin=dp(7);
        parent.addView(row,rp);
    }
    private void addBalloonAlphaSlider(LinearLayout parent){
        LinearLayout line=new LinearLayout(this);
        line.setGravity(Gravity.CENTER_VERTICAL);
        TextView title=label("Transparência do balão",13,SECONDARY,false);
        line.addView(title,new LinearLayout.LayoutParams(0,-2,1));
        alphaPercent=label("",13,ACCENT,true);
        line.addView(alphaPercent);
        LinearLayout.LayoutParams lp=match();
        lp.topMargin=dp(13);
        parent.addView(line,lp);
        balloonAlpha=new SeekBar(this);
        balloonAlpha.setMin(40);
        balloonAlpha.setMax(100);
        balloonAlpha.setProgress(visualPrefs.getInt(
            RaidDayAssistantOverlayService.PREF_BUBBLE_OPACITY,100));
        balloonAlpha.setOnSeekBarChangeListener(
            new SeekBar.OnSeekBarChangeListener(){
                @Override public void onProgressChanged(
                    SeekBar bar,int value,boolean fromUser){
                    alphaPercent.setText(value+"% opaco");
                    if(fromUser)visualPrefs.edit().putInt(
                        RaidDayAssistantOverlayService.PREF_BUBBLE_OPACITY,
                        value).apply();
                }
                @Override public void onStartTrackingTouch(SeekBar bar){}
                @Override public void onStopTrackingTouch(SeekBar bar){}
            });
        parent.addView(balloonAlpha,match());
        TextView hint=label(
            "Só o fundo muda; o texto continua legível.",
            11,SECONDARY,false);
        parent.addView(hint,match());
    }
    private void refreshVisualControls(){
        int selected=visualPrefs.getInt(RaidDayAvatarFrames.PREF_SIZE,150);
        int[] sizes={100,150,200};
        for(int i=0;i<sizeButtons.size();i++){
            boolean active=sizes[i]==selected;
            TextView choice=sizeButtons.get(i);
            choice.setBackground(bg(active?0xff245c58:0xff2c3a45,11));
            choice.setTextColor(active?0xffd6ffef:PRIMARY);
        }
        if(balloonAlpha!=null){
            int alpha=visualPrefs.getInt(
                RaidDayAssistantOverlayService.PREF_BUBBLE_OPACITY,100);
            if(balloonAlpha.getProgress()!=alpha)
                balloonAlpha.setProgress(alpha);
            alphaPercent.setText(alpha+"% opaco");
        }
    }
    private void highlightQuickMoment(){
        for(int i=0;i<quickMomentButtons.size();i++){
            boolean active=QUICK_MOMENTS[i].equals(chosenMomentLabel);
            TextView b=quickMomentButtons.get(i);
            b.setBackground(bg(active?0xff245c58:0xff2c3a45,11));
            b.setTextColor(active?0xffd6ffef:PRIMARY);
        }
    }

    private void chooseZone(){
        final String[] names={
            "Automático (celular)",
            "Brasília (UTC−3)",
            "Manaus (UTC−4)",
            "Fernando de Noronha (UTC−2)",
            "Rio Branco (UTC−5)"
        };
        final String[] ids={
            "", "America/Sao_Paulo","America/Manaus",
            "America/Noronha","America/Rio_Branco"
        };
        new AlertDialog.Builder(this)
            .setTitle("Fuso horário")
            .setItems(names,(dialog,which)->{
                if(which==0){
                    EduEventClock.setAutomaticTimeZone(this,true);
                    EduEventClock.setLocationBasedTimeZone(this,true);
                }else{
                    EduEventClock.setManualTimeZone(this,ids[which]);
                }
                refresh();
            })
            .setNegativeButton("Cancelar",null)
            .show();
    }

    private String zoneLabel(){
        if(EduEventClock.isAutomaticTimeZone(this))
            return EduEventClock.isLocationBasedTimeZone(this)?
                "Automático · celular":"Brasília (UTC−3)";
        String zone=EduEventClock.zone(this).getId();
        if(zone.equals("America/Sao_Paulo"))return "Brasília (UTC−3)";
        if(zone.equals("America/Manaus"))return "Manaus (UTC−4)";
        if(zone.equals("America/Noronha"))return "Fernando de Noronha (UTC−2)";
        if(zone.equals("America/Rio_Branco"))return "Rio Branco (UTC−5)";
        return "Fuso personalizado";
    }

    private void refresh(){
        if(autoDate==null)return;
        rendering=true;
        boolean automatic=EduEventClock.isAutomaticDateTime(this);
        // Restaurar pelo atalho da Home invalida a antiga seleção virtual.
        if(automatic&&!chosenMomentLabel.isEmpty())clearMomentLabel();
        autoDate.setChecked(automatic);
        format24.setChecked(EduEventClock.is24HourFormat(this));
        manualDateTime.setVisibility(automatic?View.GONE:View.VISIBLE);

        LocalDateTime now=EduEventClock.localNow(this);
        previewDate.setText(now.format(DateTimeFormatter.ofPattern(
            "d 'de' MMMM 'de' yyyy",BR)));
        previewTime.setText(EduEventClock.timeLabel(this));
        previewMode.setText(automatic?"Hora atual do celular":
            "Horário de teste · os segundos continuam passando");
        dateTimeDetail.setText(now.format(DateTimeFormatter.ofPattern(
            "dd/MM/yyyy · HH:mm",BR)));
        zoneDetail.setText(zoneLabel());
        boolean configured=RaidDaySchedule.valid(
            RaidDaySchedule.start(this),RaidDaySchedule.finish(this));
        momentDetail.setText(!configured?"Configure o evento para testar.":
            chosenMomentLabel.isEmpty()?
                "Toque para testar; a hora continua correndo.":
                "Selecionado: "+chosenMomentLabel);
        highlightQuickMoment();
        refreshVisualControls();
        rendering=false;
    }

    @Override protected void onResume(){
        super.onResume();
        active=true;
        handler.removeCallbacks(tick);
        handler.post(tick);
    }
    @Override protected void onPause(){
        active=false;
        handler.removeCallbacks(tick);
        super.onPause();
    }
}

package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.content.res.ColorStateList;
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
import android.widget.TextView;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
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
        momentDetail=addAction(mainCard,"Momento do evento",
            "Escolher entre 17 momentos",this::chooseEventMoment);
        manualDateTime=column();
        mainCard.addView(manualDateTime,match());
        divider(manualDateTime);
        dateTimeDetail=addAction(manualDateTime,"Ajustar data e hora",
            "",this::chooseDateTime);

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

    /** Os 17 momentos seguem a janela do evento e seu fuso real. */
    private void chooseEventMoment(){
        long begin=RaidDaySchedule.start(this);
        long finish=RaidDaySchedule.finish(this);
        if(!RaidDaySchedule.valid(begin,finish)){
            new AlertDialog.Builder(this)
                .setTitle("Momento do evento")
                .setMessage("Configure primeiro a data e o horário do evento.")
                .setPositiveButton("Entendi",null)
                .show();
            return;
        }
        List<EduEventMomentPresets.Moment> moments=
            EduEventMomentPresets.forWindow(begin,finish);
        DateTimeFormatter formatter=DateTimeFormatter.ofPattern(
            "dd/MM HH:mm:ss",BR);
        ZoneId eventZone=RaidDaySchedule.zone(this);
        String[] items=new String[moments.size()];
        for(int i=0;i<moments.size();i++){
            EduEventMomentPresets.Moment moment=moments.get(i);
            String when=Instant.ofEpochMilli(moment.epochMillis)
                .atZone(eventZone).format(formatter);
            items[i]=moment.label+"\n"+when;
        }
        new AlertDialog.Builder(this)
            .setTitle("Momento do evento")
            .setSingleChoiceItems(items,-1,(dialog,which)->{
                EduEventMomentPresets.Moment selected=moments.get(which);
                EduEventClock.setManualInstant(this,
                    Instant.ofEpochMilli(selected.epochMillis));
                chosenMomentLabel=selected.label;
                getPreferences(MODE_PRIVATE).edit()
                    .putString(PREF_MOMENT,chosenMomentLabel).apply();
                dialog.dismiss();
                refresh();
            })
            .setNegativeButton("Cancelar",null)
            .show();
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
            return "Automático · celular";
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
        momentDetail.setText(!configured?"Configure primeiro o evento":
            chosenMomentLabel.isEmpty()?"17 momentos disponíveis":
            chosenMomentLabel);
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

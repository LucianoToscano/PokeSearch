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
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Switch;
import android.widget.TextView;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Configuração visual do relógio do Edu, inspirada na tela de data/hora do
 * Android. Afeta EXCLUSIVAMENTE o relógio interno do Edu; nunca altera a
 * hora, fuso, modo de rede ou detector de localização do sistema.
 */
public final class EduClockSettingsActivity extends Activity {
    private static final int BACK=0xff000000;
    private static final int CARD=0xff1b1b1e;
    private static final int PRIMARY=0xfff7f7f9;
    private static final int SECONDARY=0xffa2a4ac;
    private static final int DIVIDER=0xff44444b;
    private static final int ACCENT=0xff4e91ff;

    private LinearLayout manualDateTime,manualZone;
    private Switch autoDate,autoZone,locationZone,format24;
    private TextView dateDetail,timeDetail,zoneDetail,clockInfo;
    private boolean rendering=false;
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
        GradientDrawable d=new GradientDrawable();
        d.setColor(color);
        d.setCornerRadius(dp(radius));
        return d;
    }
    private TextView label(String title,int sp,int color,boolean bold){
        TextView t=new TextView(this);
        t.setText(title);
        t.setTextColor(color);
        t.setTextSize(sp);
        if(bold)t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        return t;
    }
    private LinearLayout column(){
        LinearLayout c=new LinearLayout(this);
        c.setOrientation(LinearLayout.VERTICAL);
        return c;
    }
    private LinearLayout.LayoutParams match(){
        return new LinearLayout.LayoutParams(-1,-2);
    }
    private void divider(LinearLayout container){
        View line=new View(this);
        line.setBackgroundColor(DIVIDER);
        LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,dp(1));
        lp.leftMargin=dp(23);lp.rightMargin=dp(23);
        container.addView(line,lp);
    }
    private LinearLayout card(LinearLayout parent){
        LinearLayout card=column();
        card.setBackground(bg(CARD,28));
        card.setClipToOutline(true);
        LinearLayout.LayoutParams lp=match();
        lp.topMargin=dp(28);
        parent.addView(card,lp);
        return card;
    }
    private void addSwitchRow(LinearLayout card,String title,String sub,
                              Switch control,boolean enabled){
        LinearLayout row=new LinearLayout(this);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(dp(24),dp(23),dp(23),dp(23));
        LinearLayout text=column();
        TextView headline=label(title,18,PRIMARY,false);
        text.addView(headline,match());
        if(sub!=null&&!sub.isEmpty()){
            TextView detail=label(sub,14,SECONDARY,false);
            LinearLayout.LayoutParams subLp=match();
            subLp.topMargin=dp(4);
            text.addView(detail,subLp);
        }
        row.addView(text,new LinearLayout.LayoutParams(0,-2,1));
        LinearLayout.LayoutParams swLp=new LinearLayout.LayoutParams(-2,-2);
        swLp.leftMargin=dp(14);
        row.addView(control,swLp);
        control.setChecked(enabled);
        control.setContentDescription(title);
        int[][] states=new int[][]{
            new int[]{android.R.attr.state_checked},
            new int[]{}
        };
        control.setThumbTintList(new ColorStateList(states,
            new int[]{Color.WHITE,0xffe6e6eb}));
        control.setTrackTintList(new ColorStateList(states,
            new int[]{ACCENT,0xff777782}));
        card.addView(row,match());
        row.setOnClickListener(v->control.setChecked(!control.isChecked()));
    }
    private TextView addAction(LinearLayout card,String title,String initial,Runnable click){
        LinearLayout row=column();
        row.setPadding(dp(24),dp(19),dp(23),dp(19));
        TextView headline=label(title,18,PRIMARY,false);
        row.addView(headline,match());
        TextView value=label(initial,14,ACCENT,false);
        LinearLayout.LayoutParams detailLp=match();
        detailLp.topMargin=dp(5);
        row.addView(value,detailLp);
        row.setOnClickListener(v->click.run());
        card.addView(row,match());
        return value;
    }

    @Override public void onCreate(Bundle state){
        super.onCreate(state);
        getWindow().setStatusBarColor(BACK);
        getWindow().setNavigationBarColor(BACK);

        ScrollView scroll=new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(BACK);
        LinearLayout screen=column();
        screen.setPadding(dp(18),dp(13),dp(18),dp(32));
        scroll.addView(screen,new ScrollView.LayoutParams(-1,-2));
        setContentView(scroll);

        LinearLayout heading=new LinearLayout(this);
        heading.setGravity(Gravity.CENTER_VERTICAL);
        TextView back=label("‹",39,PRIMARY,false);
        back.setGravity(Gravity.CENTER);
        heading.addView(back,new LinearLayout.LayoutParams(dp(50),dp(60)));
        back.setOnClickListener(v->finish());
        TextView title=label("Data e hora",26,PRIMARY,true);
        LinearLayout.LayoutParams titleLp=new LinearLayout.LayoutParams(-2,-2);
        titleLp.leftMargin=dp(4);
        heading.addView(title,titleLp);
        screen.addView(heading,match());

        clockInfo=label("",12,SECONDARY,false);
        LinearLayout.LayoutParams infoLp=match();
        infoLp.topMargin=dp(5);
        infoLp.leftMargin=dp(31);
        screen.addView(clockInfo,infoLp);

        autoDate=new Switch(this);
        autoZone=new Switch(this);
        locationZone=new Switch(this);
        format24=new Switch(this);

        LinearLayout dateCard=card(screen);
        addSwitchRow(dateCard,"Data e hora automáticas",
            "Usa o relógio do aparelho (rede, se ativada no Android).",
            autoDate,EduEventClock.isAutomaticDateTime(this));
        manualDateTime=column();
        dateCard.addView(manualDateTime,match());
        divider(manualDateTime);
        dateDetail=addAction(manualDateTime,"Definir data","",
            this::chooseDate);
        divider(manualDateTime);
        timeDetail=addAction(manualDateTime,"Definir hora","",
            this::chooseTime);

        LinearLayout zoneCard=card(screen);
        addSwitchRow(zoneCard,"Fuso horário automático",
            "Segue o fuso já configurado no Android.",
            autoZone,EduEventClock.isAutomaticTimeZone(this));
        divider(zoneCard);
        addSwitchRow(zoneCard,"Definir fuso conforme localização",
            "Usa o fuso detectado pelo Android, sem acessar GPS.",
            locationZone,EduEventClock.isLocationBasedTimeZone(this));
        manualZone=column();
        zoneCard.addView(manualZone,match());
        divider(manualZone);
        zoneDetail=addAction(manualZone,"Definir fuso","",
            this::chooseZone);

        LinearLayout formatCard=card(screen);
        addSwitchRow(formatCard,"Formato 24 horas",
            "13:00",format24,EduEventClock.is24HourFormat(this));

        autoDate.setOnCheckedChangeListener((v,on)->{
            if(rendering)return;
            EduEventClock.setAutomaticDateTime(this,on);refresh();
        });
        autoZone.setOnCheckedChangeListener((v,on)->{
            if(rendering)return;
            EduEventClock.setAutomaticTimeZone(this,on);refresh();
        });
        locationZone.setOnCheckedChangeListener((v,on)->{
            if(rendering)return;
            EduEventClock.setLocationBasedTimeZone(this,on);refresh();
        });
        format24.setOnCheckedChangeListener((v,on)->{
            if(rendering)return;
            EduEventClock.set24HourFormat(this,on);refresh();
        });
        refresh();
    }

    private void chooseDate(){
        LocalDateTime date=EduEventClock.localNow(this);
        DatePickerDialog picker=new DatePickerDialog(this,(view,y,m,d)->{
            LocalDateTime latest=EduEventClock.localNow(this);
            EduEventClock.setBrasiliaDateTime(this,
                latest.withDayOfMonth(1).withYear(y)
                    .withMonth(m+1).withDayOfMonth(d));
            refresh();
        },date.getYear(),date.getMonthValue()-1,date.getDayOfMonth());
        picker.show();
    }

    private void chooseTime(){
        LocalDateTime value=EduEventClock.localNow(this);
        new TimePickerDialog(this,(picker,h,m)->{
            LocalDateTime latest=EduEventClock.localNow(this);
            EduEventClock.setBrasiliaDateTime(this,
                latest.withHour(h).withMinute(m).withSecond(0));
            refresh();
        },value.getHour(),value.getMinute(),
          EduEventClock.is24HourFormat(this)).show();
    }

    private void chooseZone(){
        final String[] names={
            "Brasília (UTC−3)",
            "Manaus (UTC−4)",
            "Fernando de Noronha (UTC−2)",
            "Rio Branco (UTC−5)",
            "Fuso atual do Android"
        };
        final String[] ids={
            "America/Sao_Paulo","America/Manaus","America/Noronha",
            "America/Rio_Branco",ZoneId.systemDefault().getId()
        };
        new AlertDialog.Builder(this)
            .setTitle("Fuso horário do Edu")
            .setItems(names,(d,which)->{
                EduEventClock.setManualTimeZone(this,ids[which]);
                refresh();
            })
            .setNegativeButton("Cancelar",null).show();
    }

    private void refresh(){
        if(autoDate==null)return;
        rendering=true;
        autoDate.setChecked(EduEventClock.isAutomaticDateTime(this));
        autoZone.setChecked(EduEventClock.isAutomaticTimeZone(this));
        locationZone.setChecked(EduEventClock.isLocationBasedTimeZone(this));
        format24.setChecked(EduEventClock.is24HourFormat(this));
        manualDateTime.setVisibility(autoDate.isChecked()?View.GONE:View.VISIBLE);
        manualZone.setVisibility(autoZone.isChecked()?View.GONE:View.VISIBLE);
        locationZone.setEnabled(autoZone.isChecked());
        locationZone.setAlpha(autoZone.isChecked()?1f:.5f);
        LocalDateTime now=EduEventClock.localNow(this);
        dateDetail.setText(now.format(DateTimeFormatter.ofPattern(
            "d 'de' MMMM 'de' yyyy",new Locale("pt","BR"))));
        timeDetail.setText(EduEventClock.timeLabel(this));
        zoneDetail.setText(EduEventClock.zone(this).getId());
        clockInfo.setText(
            (autoDate.isChecked()?"Automático":"Manual")+
            " · "+EduEventClock.dateLabel(this)+" "+EduEventClock.timeLabel(this)+
            " · "+EduEventClock.zone(this).getId()+
            (autoDate.isChecked()?"":" · horário ajustado (não oficial)"));
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

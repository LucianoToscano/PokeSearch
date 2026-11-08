package com.lucianotoscano.pokesearchoverlay;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.DatePickerDialog;
import android.app.TimePickerDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.provider.CalendarContract;
import android.view.Gravity;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Button;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/** Janela de configuração manual: nenhuma agenda ou notificação é criada sem toque. */
public final class RaidDayEventSettingsActivity extends Activity {
    private LinearLayout root;
    private TextView info;
    private LocalDate date;
    private LocalTime startTime=LocalTime.of(10,0),endTime=LocalTime.of(17,0);
    private SharedPreferences prefs;
    private static final DateTimeFormatter FORMAT=
        DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm",Locale.forLanguageTag("pt-BR"));

    @Override public void onCreate(Bundle state){
        super.onCreate(state);
        prefs=getSharedPreferences("raid_assistant_overlay",MODE_PRIVATE);
        RaidDayPreparation prep=RaidDayPreparation.load(this,prefs,
            EduEventClock.forEdu(this));
        date=prep.eventDate()!=null?prep.eventDate():
            RaidDayEventClock.todayBrasilia(EduEventClock.forEdu(this)).plusDays(1);
        try{
            long begin=RaidDaySchedule.start(this),end=RaidDaySchedule.finish(this);
            if(RaidDaySchedule.valid(begin,end)){
                ZonedDateTime a=Instant.ofEpochMilli(begin).atZone(RaidDayEventClock.BRASILIA);
                ZonedDateTime b=Instant.ofEpochMilli(end).atZone(RaidDayEventClock.BRASILIA);
                date=a.toLocalDate();
                startTime=a.toLocalTime();
                endTime=b.toLocalTime();
            }
        }catch(RuntimeException ignored){}
        root=new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(24,22,24,18);
        root.setBackgroundColor(0xff1b2630);
        info=new TextView(this);
        info.setTextColor(0xffeff3f5);
        info.setTextSize(15);
        info.setGravity(Gravity.CENTER);
        root.addView(info,new LinearLayout.LayoutParams(-1,-2));
        addButton("Escolher data",()->{
            DatePickerDialog dialog=new DatePickerDialog(this,(view,y,m,d)->{
                date=LocalDate.of(y,m+1,d);render();
            },date.getYear(),date.getMonthValue()-1,date.getDayOfMonth());
            dialog.show();
        });
        addButton("Horário inicial · Brasília",()->{
            new TimePickerDialog(this,(v,h,m)->{startTime=LocalTime.of(h,m);render();},
                startTime.getHour(),startTime.getMinute(),true).show();
        });
        addButton("Horário final · Brasília",()->{
            new TimePickerDialog(this,(v,h,m)->{endTime=LocalTime.of(h,m);render();},
                endTime.getHour(),endTime.getMinute(),true).show();
        });
        addButton("Salvar janela informada",()->{
            try{
                RaidDaySchedule.save(this,date,startTime,endTime);
                RaidDaySchedule.setReminders(this,
                    prefs.getBoolean("raid_day_alerts_enabled",false));
                render();
            }catch(IllegalArgumentException invalid){
                new AlertDialog.Builder(this).setMessage("Janela inválida. Verifique os horários.")
                    .setPositiveButton("OK",null).show();
            }
        });
        addButton("Ativar / desativar lembretes",()->{
            if(!RaidDaySchedule.valid(RaidDaySchedule.start(this),
                RaidDaySchedule.finish(this))){
                new AlertDialog.Builder(this).setMessage("Salve a janela antes de ativar alertas.")
                    .setPositiveButton("OK",null).show();return;
            }
            boolean enabled=!prefs.getBoolean("raid_day_alerts_enabled",false);
            if(enabled&&Build.VERSION.SDK_INT>=33&&
                checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=
                    getPackageManager().PERMISSION_GRANTED){
                requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},905);
                return;
            }
            RaidDaySchedule.setReminders(this,enabled);
            render();
        });
        addButton("Adicionar ao calendário",()->{
            long begin=RaidDaySchedule.start(this),end=RaidDaySchedule.finish(this);
            if(!RaidDaySchedule.valid(begin,end)){
                new AlertDialog.Builder(this)
                    .setMessage("Configure e salve os horários antes de abrir o calendário.")
                    .setPositiveButton("OK",null).show();return;
            }
            Intent calendar=new Intent(Intent.ACTION_INSERT)
                .setData(CalendarContract.Events.CONTENT_URI)
                .putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME,begin)
                .putExtra(CalendarContract.EXTRA_EVENT_END_TIME,end)
                .putExtra(CalendarContract.Events.TITLE,"Pokémon GO — Dia de Reides (PokeSearch)")
                .putExtra(CalendarContract.Events.DESCRIPTION,
                    "Horário INFORMADO PELO JOGADOR, NÃO VERIFICADO. "+
                    "Tutorial comunitário Bug dos Passes: não garante recompensas.");
            try{startActivity(calendar);}
            catch(RuntimeException noCalendar){
                new AlertDialog.Builder(this).setMessage(
                    "Nenhum aplicativo de calendário disponível.")
                    .setPositiveButton("OK",null).show();
            }
        });
        addButton("Fechar",this::finish);
        setContentView(root);
        render();
    }
    private void addButton(String label,Runnable action){
        Button button=new Button(this);
        button.setText(label);button.setAllCaps(false);
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);
        p.topMargin=5;root.addView(button,p);
        button.setOnClickListener(v->action.run());
    }
    private void render(){
        long a=RaidDaySchedule.start(this),b=RaidDaySchedule.finish(this);
        info.setText("Dia de Reides · configuração manual\n"+
            "Data: "+date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))+
            "\nInício: "+startTime+" · Fim: "+endTime+"\n"+
            "Relógio Edu "+(EduEventClock.isAdjusted(this)?"(ajustado, não oficial)":"(hora do celular)")+": "+
            RaidDayEventClock.summary(EduEventClock.forEdu(this).instant())+"\n"+
            (RaidDaySchedule.valid(a,b)?
                "Janela registrada (informação sua, NÃO oficial).":
                "Janela ainda não salva.")+"\n"+
            "Alertas: "+(prefs.getBoolean("raid_day_alerts_enabled",false)?
                "ativados (aproximados)":"desativados")+
            "\nCalendário: você confirma o evento no app de agenda.");
    }
    @Override public void onRequestPermissionsResult(int request,String[] permissions,
        int[] results){
        super.onRequestPermissionsResult(request,permissions,results);
        if(request==905&&results.length>0&&results[0]==
            getPackageManager().PERMISSION_GRANTED){
            RaidDaySchedule.setReminders(this,true);render();
        }
    }
}

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
import android.widget.EditText;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
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
    private ZoneId eventZone;
    private boolean chandelureExample=false;
    private static final DateTimeFormatter FORMAT=
        DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm",Locale.forLanguageTag("pt-BR"));

    @Override public void onCreate(Bundle state){
        super.onCreate(state);
        prefs=getSharedPreferences("raid_assistant_overlay",MODE_PRIVATE);
        eventZone=EduEventClock.zone(this);
        RaidDayPreparation prep=RaidDayPreparation.load(this,prefs,
            EduEventClock.forEdu(this));
        date=prep.eventDate()!=null?prep.eventDate():
            RaidDayEventClock.todayBrasilia(EduEventClock.forEdu(this)).plusDays(1);
        try{
            long begin=RaidDaySchedule.start(this),end=RaidDaySchedule.finish(this);
            if(RaidDaySchedule.valid(begin,end)){
                eventZone=RaidDaySchedule.zone(this);
                chandelureExample=RaidDaySchedule.isChandelureExample(this);
                ZonedDateTime a=Instant.ofEpochMilli(begin).atZone(eventZone);
                ZonedDateTime b=Instant.ofEpochMilli(end).atZone(eventZone);
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
        addButton("Exemplo oficial · Mega Chandelure (31/10/2026)",()->{
            date=RaidDayRegionalWindow.CHANDELURE_DATE;
            startTime=RaidDayRegionalWindow.CHANDELURE_START;
            endTime=RaidDayRegionalWindow.CHANDELURE_END;
            chandelureExample=true;
            render();
        });
        addButton("Região onde vai jogar",this::chooseRegion);
        addButton("Escolher data",()->{
            DatePickerDialog dialog=new DatePickerDialog(this,(view,y,m,d)->{
                date=LocalDate.of(y,m+1,d);chandelureExample=false;render();
            },date.getYear(),date.getMonthValue()-1,date.getDayOfMonth());
            dialog.show();
        });
        addButton("Horário inicial · local",()->{
            new TimePickerDialog(this,(v,h,m)->{
                startTime=LocalTime.of(h,m);chandelureExample=false;render();
            },
                startTime.getHour(),startTime.getMinute(),true).show();
        });
        addButton("Horário final · local",()->{
            new TimePickerDialog(this,(v,h,m)->{
                endTime=LocalTime.of(h,m);chandelureExample=false;render();
            },
                endTime.getHour(),endTime.getMinute(),true).show();
        });
        addButton("Salvar janela informada",()->{
            try{
                RaidDaySchedule.save(this,date,startTime,endTime,
                    eventZone,chandelureExample);
                // Data do roteiro acompanha a data LOCAL escolhida para o evento.
                // Requer reconfirmação somente quando a data anterior era diferente.
                RaidDayPreparation latest=RaidDayPreparation.load(this,prefs,
                    EduEventClock.forEdu(this));
                if(!date.equals(latest.eventDate())){
                    prefs.edit()
                        .putString("raid_day_prep_v2_answer_0",date.toString())
                        .putBoolean("raid_day_prep_v2_completed",false)
                        .putInt("raid_day_prep_v2_question",0)
                        .remove("edu_event_date_confirmed_key")
                        .apply();
                }
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
    private void chooseRegion(){
        String[] labels={
            "Fuso atual do relógio Edu",
            "Brasília · America/Sao_Paulo",
            "Nova Zelândia · Pacific/Auckland",
            "Singapura · Asia/Singapore",
            "Havaí · Pacific/Honolulu",
            "Kiribati · Pacific/Kiritimati",
            "Outro fuso IANA…"
        };
        String[] ids={
            EduEventClock.zone(this).getId(),
            "America/Sao_Paulo","Pacific/Auckland","Asia/Singapore",
            "Pacific/Honolulu","Pacific/Kiritimati"
        };
        new AlertDialog.Builder(this)
            .setTitle("Região de início do evento")
            .setItems(labels,(d,index)->{
                if(index<ids.length){
                    eventZone=ZoneId.of(ids[index]);
                    render();
                }else{
                    EditText input=new EditText(this);
                    input.setSingleLine(true);
                    input.setHint("Ex.: America/New_York");
                    input.setText(eventZone.getId());
                    new AlertDialog.Builder(this)
                        .setTitle("Fuso IANA do local")
                        .setView(input)
                        .setPositiveButton("Aplicar",(dialog,which)->{
                            try{
                                eventZone=ZoneId.of(input.getText().toString().trim());
                                render();
                            }catch(RuntimeException invalid){
                                new AlertDialog.Builder(this)
                                    .setMessage("Fuso inválido. Exemplo: Europe/London.")
                                    .setPositiveButton("OK",null).show();
                            }
                        })
                        .setNegativeButton("Cancelar",null).show();
                }
            }).show();
    }
    private void render(){
        long a=RaidDaySchedule.start(this),b=RaidDaySchedule.finish(this);
        String localZone=eventZone.getId();
        String origin=chandelureExample?
            "EXEMPLO oficial histórico Mega Chandelure": "Informado por você, não verificado";
        RaidDayRegionalWindow.Phase phase=RaidDayRegionalWindow.Phase.UNKNOWN;
        String preview="";
        try{
            long[] bounds=RaidDayRegionalWindow.bounds(date,startTime,endTime,eventZone);
            phase=RaidDayRegionalWindow.phase(EduEventClock.forEdu(this).instant(),
                bounds[0],bounds[1]);
            preview="\\nEm Brasília: "+
                RaidDayEventClock.format(Instant.ofEpochMilli(bounds[0]),
                    RaidDayEventClock.BRASILIA)+" até "+
                RaidDayEventClock.format(Instant.ofEpochMilli(bounds[1]),
                    RaidDayEventClock.BRASILIA);
        }catch(IllegalArgumentException ignored){
            preview="\\nJanela inválida, verifique as horas.";
        }
        long a=RaidDaySchedule.start(this),b=RaidDaySchedule.finish(this);
        info.setText("Dia de Reides · horário do LOCAL escolhido\\n"+
            "Data no local: "+date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))+
            "\\nHorário local: "+startTime+"–"+endTime+
            "\\nRegião: "+localZone+"\\n"+origin+
            preview+
            "\\nStatus no relógio do Edu: "+phase+
            "\\nRelógio Edu "+(EduEventClock.isAdjusted(this)?
                "(ajustado, não oficial)":"(hora do celular)")+": "+
            RaidDayEventClock.summary(EduEventClock.forEdu(this).instant())+
            "\\n"+(RaidDaySchedule.valid(a,b)?
                "Janela registrada. Confirme o evento no jogo.":
                "Janela ainda não salva.")+
            "\\nAlertas: "+(prefs.getBoolean("raid_day_alerts_enabled",false)?
                "ativados (aproximados)":"desativados"));

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

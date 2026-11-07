package com.lucianotoscano.pokesearchoverlay;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;

/** Horários INFORMADOS pelo usuário, nunca eventos oficiais presumidos. */
public final class RaidDaySchedule {
    private static final String PREF="raid_assistant_overlay";
    private static final int[] OFFSETS={60,15,0};
    private RaidDaySchedule(){}
    public static long start(Context ctx){
        return ctx.getSharedPreferences(PREF,Context.MODE_PRIVATE)
            .getLong("raid_day_window_start_ms",0);
    }
    public static long finish(Context ctx){
        return ctx.getSharedPreferences(PREF,Context.MODE_PRIVATE)
            .getLong("raid_day_window_end_ms",0);
    }
    public static boolean valid(long start,long finish){
        return start>0&&finish>start&&finish-start<=24*60*60*1000L;
    }
    public static void save(Context ctx,LocalDate date,LocalTime start,
                            LocalTime end){
        ZoneId zone=RaidDayEventClock.BRASILIA;
        long begin=LocalDateTime.of(date,start).atZone(zone).toInstant().toEpochMilli();
        long stop=LocalDateTime.of(date,end).atZone(zone).toInstant().toEpochMilli();
        if(stop<=begin)stop=LocalDateTime.of(date.plusDays(1),end).atZone(zone)
            .toInstant().toEpochMilli();
        if(!valid(begin,stop))throw new IllegalArgumentException("Janela inválida");
        ctx.getSharedPreferences(PREF,Context.MODE_PRIVATE).edit()
            .putLong("raid_day_window_start_ms",begin)
            .putLong("raid_day_window_end_ms",stop)
            .putString("raid_day_window_source","INFORMADO_USUARIO")
            .apply();
    }
    public static String status(Context ctx){
        long begin=start(ctx),end=finish(ctx);
        if(!valid(begin,end))return "Horário oficial NÃO verificado. Configure sua janela.";
        Instant now=Instant.now();
        String prefix=now.toEpochMilli()<begin?"Antes da janela informada":
            now.toEpochMilli()>end?"Depois da janela informada":"Dentro da janela informada";
        return prefix+" · horário informado pelo jogador, NÃO verificado.";
    }
    public static void setReminders(Context ctx,boolean enabled){
        ctx.getSharedPreferences(PREF,Context.MODE_PRIVATE).edit()
            .putBoolean("raid_day_alerts_enabled",enabled).apply();
        AlarmManager alarm=(AlarmManager)ctx.getSystemService(Context.ALARM_SERVICE);
        if(alarm==null)return;
        for(int i=0;i<OFFSETS.length;i++){
            int min=OFFSETS[i];
            long when=start(ctx)-min*60_000L;
            Intent intent=new Intent(ctx,RaidDayReminderReceiver.class)
                .setAction(RaidDayReminderReceiver.ACTION_REMIND)
                .putExtra("when",when)
                .putExtra("beforeMinutes",min)
                .putExtra("eventKey",ctx.getSharedPreferences(PREF,Context.MODE_PRIVATE)
                    .getString("eventKey",""));
            PendingIntent pi=PendingIntent.getBroadcast(ctx,8400+i,intent,
                PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
            alarm.cancel(pi);
            if(enabled&&valid(start(ctx),finish(ctx))&&
                when>System.currentTimeMillis()){
                if(Build.VERSION.SDK_INT>=23)
                    alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,when,pi);
                else alarm.set(AlarmManager.RTC_WAKEUP,when,pi);
            }
        }
    }
    public static void clearWindow(Context ctx){
        setReminders(ctx,false);
        ctx.getSharedPreferences(PREF,Context.MODE_PRIVATE).edit()
            .remove("raid_day_window_start_ms")
            .remove("raid_day_window_end_ms").apply();
    }
}

package com.lucianotoscano.pokesearchoverlay;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/** Lembrete local, sem leitura do Pokémon GO e sem acesso a agenda. */
public final class RaidDayReminderReceiver extends BroadcastReceiver {
    public static final String ACTION_REMIND="com.lucianotoscano.pokesearch.RAID_DAY_REMINDER";
    @Override public void onReceive(Context context,Intent intent){
        if(intent==null||!ACTION_REMIND.equals(intent.getAction()))return;
        long when=intent.getLongExtra("when",0L);
        int minutes=intent.getIntExtra("beforeMinutes",0);
        String eventKey=intent.getStringExtra("eventKey");
        android.content.SharedPreferences prefs=context.getSharedPreferences(
            "raid_assistant_overlay",Context.MODE_PRIVATE);
        if(when<=0||eventKey==null||
            !eventKey.equals(prefs.getString("eventKey",""))||
            !prefs.getBoolean("raid_day_alerts_enabled",false))return;
        if(Math.abs(System.currentTimeMillis()-when)>3*60*60*1000L)return;
        NotificationManager manager=(NotificationManager)
            context.getSystemService(Context.NOTIFICATION_SERVICE);
        if(manager==null)return;
        String channel="pokesearch_raid_day_reminders";
        if(Build.VERSION.SDK_INT>=26)manager.createNotificationChannel(
            new NotificationChannel(channel,"Dia de Reides · Lembretes",
                NotificationManager.IMPORTANCE_DEFAULT));
        Intent open=new Intent(context,MainActivity.class)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent tap=PendingIntent.getActivity(context,8400,open,
            PendingIntent.FLAG_IMMUTABLE|PendingIntent.FLAG_UPDATE_CURRENT);
        String text=minutes==0?"O horário informado para seu evento chegou.":
            "Faltam cerca de "+minutes+" minutos para o horário informado.";
        Notification note=new Notification.Builder(context,channel)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle("PokeSearch · Dia de Reides")
            .setContentText(text+" Confira no organizador.")
            .setContentIntent(tap).setAutoCancel(true).build();
        try{manager.notify(8400+minutes,note);}
        catch(SecurityException ignored){}
    }
}

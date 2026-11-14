package com.lucianotoscano.pokesearchoverlay;

import android.app.Notification;
import android.os.Bundle;
import android.os.SystemClock;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import java.util.Locale;

/** Recebe avisos do PGSharp / Pokémon GO sem enviar mensagens a servidores. */
public final class PgsAutoShinyListener extends NotificationListenerService {
    private String previousMessage="";
    private long previousAt=0;
    @Override public void onNotificationPosted(StatusBarNotification sbn) {
        if(sbn==null||sbn.getNotification()==null)return;
        String pkg=sbn.getPackageName().toLowerCase(Locale.ROOT);
        if(!(pkg.contains("pokemongo")||pkg.contains("pgsharp")))return;
        Bundle values=sbn.getNotification().extras;
        if(values==null)return;
        StringBuilder all=new StringBuilder();
        all.append(values.getCharSequence(Notification.EXTRA_TITLE,"")).append(' ');
        all.append(values.getCharSequence(Notification.EXTRA_TEXT,"")).append(' ');
        all.append(values.getCharSequence(Notification.EXTRA_BIG_TEXT,"")).append(' ');
        all.append(values.getCharSequence(Notification.EXTRA_SUB_TEXT,"")).append(' ');
        CharSequence[] lines=values.getCharSequenceArray(Notification.EXTRA_TEXT_LINES);
        if(lines!=null)for(CharSequence s:lines)all.append(s).append(' ');
        String content=all.toString();
        String normalized=content.toLowerCase(Locale.ROOT);
        if(normalized.contains("shiny")||normalized.contains("brilhante")||content.contains("✨")) {
            // Impede múltiplos alarmes da mesma notificação repetida pelo jogo.
            long now=SystemClock.elapsedRealtime();
            if(content.equals(previousMessage) && now-previousAt<15000L)return;
            previousMessage=content;previousAt=now;
            getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE).edit()
                .putString("lastShinyNotice",content.trim()).apply();
            PgsAutoClickService.onPgsharpShiny(content.trim());
        }
    }
}

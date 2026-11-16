package com.lucianotoscano.pokesearchoverlay;

import android.app.Notification;
import android.app.NotificationManager;
import android.content.ComponentName;
import android.content.Context;
import android.os.Bundle;
import android.os.SystemClock;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import java.util.Locale;

/** Recebe avisos do PGSharp / Pokémon GO sem enviar mensagens a servidores. */
public final class PgsAutoShinyListener extends NotificationListenerService {
    /** Check actual Android permission; a screenshot never grants notification access. */
    static boolean hasAccess(Context context){
        try{
            NotificationManager manager=(NotificationManager)
                context.getSystemService(Context.NOTIFICATION_SERVICE);
            return manager!=null&&manager.isNotificationListenerAccessGranted(
                new ComponentName(context,PgsAutoShinyListener.class));
        }catch(RuntimeException unavailable){return false;}
    }
    private String previousMessage="";
    private long previousAt=0;
    @Override public void onNotificationPosted(StatusBarNotification sbn) {
        if(sbn==null||sbn.getNotification()==null)return;
        // LT366: PGSharp/Pokemod compartilham a janela oficial do jogo.
        // Não aceitar notificações de apps com "pgsharp" no nome como prova
        // de origem, nem ler conteúdo privado de outros aplicativos.
        String pkg=sbn.getPackageName();
        if(!PgsAutoHostPolicy.isGameWindow(pkg))return;
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
        // IV100/Ditto só provocam pausa se nomearem o alvo atual e houver
        // Auto Hunt com consentimento ativo. A notificação não realiza toque.
        PgsAutoClickService.onAutoHuntNotice(content.trim());
        // Somente frase positiva explicita; emoji ou "shiny:" isolados
        // nao sao comprovacao de encontro no feed.
        if(PgsAutoShinySignal.isPositive(content)) {
            // Impede múltiplos alarmes da mesma notificação repetida pelo jogo.
            long now=SystemClock.elapsedRealtime();
            if(content.equals(previousMessage) && now-previousAt<15000L)return;
            previousMessage=content;previousAt=now;
            getSharedPreferences("pgs_auto_settings_v1",MODE_PRIVATE).edit()
                .putString("lastShinyNotice",content.trim()).apply();
            PgsAutoClickService.onPgsharpShiny(content.trim());
        }else if(PgsAutoShinySignal.isExplicitNegative(content)){
            // Só evidência textual EXPLÍCITA; não inferir ausência por silêncio.
            PgsAutoClickService.onPgsharpShiny(content.trim());
        }
    }
}

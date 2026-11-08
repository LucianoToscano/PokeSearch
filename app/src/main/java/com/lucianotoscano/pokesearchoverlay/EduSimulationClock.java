package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * LT308 — relógio temporário de treinamento do Edu.
 *
 * Começa com a data/hora do CELULAR, permite ancorar uma data/hora fictícia e
 * avança em tempo real (inclusive virada de dia). Nunca muda o relógio do
 * Android e NUNCA alimenta uma sessão real de evento/raid.
 *
 * Remoção futura: substituir a única referência do treinamento por
 * RaidDayEventClock.BRASILIA e apagar este componente/visor.
 */
public final class EduSimulationClock {
    private static final String PREFS="edu_simulation_clock";
    private static final String VIRTUAL_BASE="virtual_epoch_ms";
    private static final String WALL_BASE="wall_epoch_ms";
    private static final DateTimeFormatter DATE_FORMAT=
        DateTimeFormatter.ofPattern("dd/MM/yy",Locale.forLanguageTag("pt-BR"));
    private static final DateTimeFormatter TIME_FORMAT=
        DateTimeFormatter.ofPattern("HH:mm:ss",Locale.forLanguageTag("pt-BR"));
    private EduSimulationClock(){}

    private static SharedPreferences prefs(Context context){
        return context.getApplicationContext().getSharedPreferences(PREFS,Context.MODE_PRIVATE);
    }

    public static boolean isAdjusted(Context context){
        SharedPreferences p=prefs(context);
        return p.contains(VIRTUAL_BASE)&&p.contains(WALL_BASE);
    }

    public static long nowMillis(Context context){
        SharedPreferences p=prefs(context);
        long wall=System.currentTimeMillis();
        if(!p.contains(VIRTUAL_BASE)||!p.contains(WALL_BASE))return wall;
        return p.getLong(VIRTUAL_BASE,wall)+
            (wall-p.getLong(WALL_BASE,wall));
    }

    public static LocalDateTime localNow(Context context){
        return LocalDateTime.ofInstant(Instant.ofEpochMilli(nowMillis(context)),
            ZoneId.systemDefault());
    }

    public static String dateLabel(Context context){
        return localNow(context).format(DATE_FORMAT);
    }
    public static String timeLabel(Context context){
        return localNow(context).format(TIME_FORMAT);
    }

    /** A escolha é local: a contagem retoma de 00 segundos e segue continuamente. */
    public static void setLocalDateTime(Context context,LocalDateTime dateTime){
        long chosen=dateTime.atZone(ZoneId.systemDefault())
            .toInstant().toEpochMilli();
        prefs(context).edit()
            .putLong(VIRTUAL_BASE,chosen)
            .putLong(WALL_BASE,System.currentTimeMillis())
            .apply();
    }

    /** Volta a seguir o relógio do celular, sem alterar a data/hora do Android. */
    public static void reset(Context context){
        prefs(context).edit()
            .remove(VIRTUAL_BASE)
            .remove(WALL_BASE).apply();
    }

    /** Clock adaptador exclusivo para o modo de treino, nunca para o real. */
    public static Clock forTraining(Context context){
        return new SimulationClock(context.getApplicationContext(),ZoneId.systemDefault());
    }

    private static final class SimulationClock extends Clock {
        private final Context context;
        private final ZoneId zone;
        SimulationClock(Context context,ZoneId zone){
            this.context=context;
            this.zone=zone;
        }
        @Override public ZoneId getZone(){return zone;}
        @Override public Clock withZone(ZoneId newZone){
            return new SimulationClock(context,newZone);
        }
        @Override public Instant instant(){
            return Instant.ofEpochMilli(nowMillis(context));
        }
    }
}

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
 * LT308 — ÚNICO relógio de referência do Edu.
 * Parte da data/hora atual do aparelho e permite ajuste manual para testar
 * véspera/dia de evento. Um ajuste continua correndo segundo a segundo.
 * Não muda a hora do Android nem a localização, e não é uma fonte oficial
 * verificada: a futura versão de produção poderá substituí-lo pela fonte
 * oficial de Brasília sem recriar a interface do treinador.
 */
public final class EduEventClock {
    private static final String PREFS="edu_simulation_clock"; // preservar escolhas já salvas na PR
    private static final String VIRTUAL_BASE="virtual_epoch_ms";
    private static final String WALL_BASE="wall_epoch_ms";
    private static final DateTimeFormatter DATE_FORMAT=
        DateTimeFormatter.ofPattern("dd/MM/yy",Locale.forLanguageTag("pt-BR"));
    private static final DateTimeFormatter TIME_FORMAT=
        DateTimeFormatter.ofPattern("HH:mm:ss",Locale.forLanguageTag("pt-BR"));
    private EduEventClock(){}

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
            RaidDayEventClock.BRASILIA);
    }

    public static String dateLabel(Context context){
        return localNow(context).format(DATE_FORMAT);
    }
    public static String timeLabel(Context context){
        return localNow(context).format(TIME_FORMAT);
    }

    /** Escolha de data e hora DE BRASÍLIA; segundos podem ser definidos. */
    public static void setBrasiliaDateTime(Context context,LocalDateTime dateTime){
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
        EduClock(Context context,ZoneId zone){
            this.context=context;
            this.zone=zone;
        }
        @Override public ZoneId getZone(){return zone;}
        @Override public Clock withZone(ZoneId newZone){
            return new EduClock(context,newZone);
        }
        @Override public Instant instant(){
            return Instant.ofEpochMilli(nowMillis(context));
        }
    }
}

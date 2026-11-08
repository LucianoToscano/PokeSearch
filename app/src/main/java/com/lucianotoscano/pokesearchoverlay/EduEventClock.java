package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;
import android.text.format.DateFormat;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * LT308 — Único relógio do Edu, configurável na interface.
 *
 * Automático: acompanha o relógio do aparelho, cuja sincronização com a rede
 * é controlada pelo próprio Android. Manual: âncora local que segue correndo
 * segundo a segundo, sem alterar o relógio do aparelho nem o Pokémon GO.
 *
 * Fuso por localização = fuso JÁ DETECTADO PELO ANDROID (ZoneId.systemDefault);
 * não coleta GPS e não controla o detector de localização do sistema.
 * Desligado, a referência do Edu volta para Brasília. Os eventos reais
 * continuam dependendo de validação manual do horário do evento.
 */
public final class EduEventClock {
    private static final String PREFS="edu_simulation_clock";
    private static final String VIRTUAL_BASE="virtual_epoch_ms";
    private static final String WALL_BASE="wall_epoch_ms";
    private static final String AUTO_DATE_TIME="automatic_date_time";
    private static final String AUTO_TIME_ZONE="automatic_time_zone";
    private static final String ZONE_LOCATION="timezone_from_device";
    private static final String MANUAL_ZONE="manual_timezone";
    private static final String FORMAT_24H="format_24_hour";
    private static final Locale BR=Locale.forLanguageTag("pt-BR");
    private static final DateTimeFormatter DATE_FORMAT=
        DateTimeFormatter.ofPattern("dd/MM/yy",BR);
    private static final DateTimeFormatter TIME_24H=
        DateTimeFormatter.ofPattern("HH:mm:ss",BR);
    private static final DateTimeFormatter TIME_12H=
        DateTimeFormatter.ofPattern("hh:mm:ss a",Locale.US);

    private EduEventClock(){}

    private static SharedPreferences prefs(Context context){
        return context.getApplicationContext().getSharedPreferences(PREFS,Context.MODE_PRIVATE);
    }

    public static boolean isAutomaticDateTime(Context context){
        SharedPreferences p=prefs(context);
        // Compatibilidade com valores ajustados nas versões experimentais.
        return p.getBoolean(AUTO_DATE_TIME,
            !(p.contains(VIRTUAL_BASE)&&p.contains(WALL_BASE)));
    }

    public static void setAutomaticDateTime(Context context,boolean enabled){
        SharedPreferences.Editor edit=prefs(context).edit()
            .putBoolean(AUTO_DATE_TIME,enabled);
        if(enabled){
            edit.remove(VIRTUAL_BASE).remove(WALL_BASE);
        }else{
            long now=System.currentTimeMillis();
            edit.putLong(VIRTUAL_BASE,now).putLong(WALL_BASE,now);
        }
        edit.apply();
    }

    public static boolean isAdjusted(Context context){
        return !isAutomaticDateTime(context);
    }

    public static boolean isAutomaticTimeZone(Context context){
        return prefs(context).getBoolean(AUTO_TIME_ZONE,true);
    }

    public static void setAutomaticTimeZone(Context context,boolean enabled){
        SharedPreferences.Editor edit=prefs(context).edit()
            .putBoolean(AUTO_TIME_ZONE,enabled);
        // Ao desativar, fixa o fuso em uso, até o usuário escolher outro.
        if(!enabled)edit.putString(MANUAL_ZONE,zone(context).getId());
        edit.apply();
    }

    public static boolean isLocationBasedTimeZone(Context context){
        return prefs(context).getBoolean(ZONE_LOCATION,true);
    }

    /**
     * Quando ativado, usa o fuso que o Android já detectou.
     * Desativado, usa Brasília, sem tentar obter GPS ou alterar o Android.
     */
    public static void setLocationBasedTimeZone(Context context,boolean enabled){
        prefs(context).edit().putBoolean(ZONE_LOCATION,enabled).apply();
    }

    public static ZoneId zone(Context context){
        if(!isAutomaticTimeZone(context)){
            try{
                return ZoneId.of(prefs(context).getString(
                    MANUAL_ZONE,RaidDayEventClock.BRASILIA.getId()));
            }catch(RuntimeException ignored){
                return RaidDayEventClock.BRASILIA;
            }
        }
        return isLocationBasedTimeZone(context)?
            ZoneId.systemDefault():RaidDayEventClock.BRASILIA;
    }

    public static void setManualTimeZone(Context context,String zoneId){
        ZoneId valid=ZoneId.of(zoneId);
        prefs(context).edit().putString(MANUAL_ZONE,valid.getId())
            .putBoolean(AUTO_TIME_ZONE,false).apply();
    }

    public static boolean is24HourFormat(Context context){
        return prefs(context).getBoolean(FORMAT_24H,DateFormat.is24HourFormat(context));
    }

    public static void set24HourFormat(Context context,boolean enabled){
        prefs(context).edit().putBoolean(FORMAT_24H,enabled).apply();
    }

    public static long nowMillis(Context context){
        SharedPreferences p=prefs(context);
        long wall=System.currentTimeMillis();
        if(isAutomaticDateTime(context))return wall;
        if(!p.contains(VIRTUAL_BASE)||!p.contains(WALL_BASE))return wall;
        return p.getLong(VIRTUAL_BASE,wall)+(wall-p.getLong(WALL_BASE,wall));
    }

    public static LocalDateTime localNow(Context context){
        return LocalDateTime.ofInstant(Instant.ofEpochMilli(nowMillis(context)),
            zone(context));
    }

    /** O dia do Edu segue exatamente a data exibida no relógio dele. */
    public static java.time.LocalDate today(Context context){
        return localNow(context).toLocalDate();
    }

    public static RaidDayEventClock.DayState dayState(
        Context context,java.time.LocalDate eventDate){
        if(eventDate==null)return RaidDayEventClock.DayState.UNKNOWN;
        java.time.LocalDate today=today(context);
        if(today.isBefore(eventDate))return RaidDayEventClock.DayState.BEFORE_DAY;
        if(today.isAfter(eventDate))return RaidDayEventClock.DayState.AFTER_DAY;
        return RaidDayEventClock.DayState.EVENT_DAY;
    }

    public static String dateLabel(Context context){
        return localNow(context).format(DATE_FORMAT);
    }

    public static String timeLabel(Context context){
        return localNow(context).format(
            is24HourFormat(context)?TIME_24H:TIME_12H);
    }

    /** Ajuste da data/hora visível, preservando a zona selecionada. */
    public static void setBrasiliaDateTime(Context context,LocalDateTime dateTime){
        long chosen=dateTime.atZone(zone(context))
            .toInstant().toEpochMilli();
        prefs(context).edit()
            .putBoolean(AUTO_DATE_TIME,false)
            .putLong(VIRTUAL_BASE,chosen)
            .putLong(WALL_BASE,System.currentTimeMillis())
            .apply();
    }

    /**
     * Ajusta um instante EXATO para testar etapas de um evento com fuso próprio.
     * Evita a ambiguidade de horários locais na transição de horário de verão.
     * O único relógio do Edu continua correndo; Android e Pokémon GO intactos.
     */
    public static void setManualInstant(Context context,Instant moment){
        if(moment==null)throw new IllegalArgumentException("Momento obrigatório");
        long now=System.currentTimeMillis();
        prefs(context).edit()
            .putBoolean(AUTO_DATE_TIME,false)
            .putLong(VIRTUAL_BASE,moment.toEpochMilli())
            .putLong(WALL_BASE,now)
            .apply();
    }

    /** Restaura somente a data/hora automática, sem alterar o fuso/24h. */
    public static void reset(Context context){
        setAutomaticDateTime(context,true);
    }

    /** Mesma referência de tempo para todo o Edu, inclusive D−1 e D. */
    public static Clock forEdu(Context context){
        return new EduClock(context.getApplicationContext());
    }

    public static LocalDateTime nowBrasilia(Context context){
        return localNow(context);
    }

    public static void shiftDays(Context context,int days){
        setBrasiliaDateTime(context,localNow(context).plusDays(days));
    }

    private static final class EduClock extends Clock {
        private final Context context;
        private final ZoneId zoneOverride;
        EduClock(Context context){this(context,null);}
        EduClock(Context context,ZoneId override){
            this.context=context;this.zoneOverride=override;
        }
        @Override public ZoneId getZone(){
            // Sem override, acompanha a seleção de fuso em tempo real.
            return zoneOverride==null?zone(context):zoneOverride;
        }
        @Override public Clock withZone(ZoneId zone){
            return new EduClock(context,zone);
        }
        @Override public Instant instant(){
            return Instant.ofEpochMilli(nowMillis(context));
        }
    }
}

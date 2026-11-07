package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.provider.Settings;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Relógio de referência do Dia de Reides. Um DIA do calendário não equivale
 * à janela oficial do evento: até receber fonte/horário verificados, a UI
 * mostra explicitamente "horário não verificado".
 */
public final class RaidDayEventClock {
    public static final ZoneId BRASILIA=ZoneId.of("America/Sao_Paulo");
    public static final ZoneId HAWAII=ZoneId.of("Pacific/Honolulu");
    public static final ZoneId NEW_ZEALAND=ZoneId.of("Pacific/Auckland");
    public static final ZoneId KIRIBATI=ZoneId.of("Pacific/Kiritimati");
    private static final DateTimeFormatter DATE_TIME=
        DateTimeFormatter.ofPattern("dd/MM HH:mm",Locale.forLanguageTag("pt-BR"));
    private static final DateTimeFormatter DAY=
        DateTimeFormatter.ofPattern("dd/MM/yyyy",Locale.forLanguageTag("pt-BR"));

    public enum DayState { BEFORE_DAY, EVENT_DAY, AFTER_DAY, UNKNOWN }
    private RaidDayEventClock(){}

    public static String format(Instant instant,ZoneId zone){
        return DATE_TIME.format(ZonedDateTime.ofInstant(instant,zone));
    }
    public static String summary(Instant instant){
        return "Brasília "+format(instant,BRASILIA)+" | Havaí "+format(instant,HAWAII)+
            "\nNova Zelândia "+format(instant,NEW_ZEALAND)+
            " | Kiribati "+format(instant,KIRIBATI);
    }
    public static LocalDate todayBrasilia(Clock clock){
        return LocalDate.now(clock.withZone(BRASILIA));
    }
    public static DayState state(LocalDate configuredDay,Instant instant){
        if(configuredDay==null)return DayState.UNKNOWN;
        LocalDate today=instant.atZone(BRASILIA).toLocalDate();
        if(today.isBefore(configuredDay))return DayState.BEFORE_DAY;
        if(today.isAfter(configuredDay))return DayState.AFTER_DAY;
        return DayState.EVENT_DAY;
    }
    public static String describeDay(LocalDate configuredDay,Instant instant){
        if(configuredDay==null)return "Data ainda não informada.";
        long days=java.time.temporal.ChronoUnit.DAYS.between(
            instant.atZone(BRASILIA).toLocalDate(),configuredDay);
        String prefix=days>0?"Faltam "+days+" dia(s) para a data informada.":
            days<0?"Data informada já passou.":"Hoje é a data informada.";
        return "D: "+DAY.format(configuredDay)+" (Brasília). "+prefix+
            " Horário oficial do evento NÃO verificado.";
    }
    public static boolean automaticTimeEnabled(Context context){
        try{
            return Settings.Global.getInt(context.getContentResolver(),
                Settings.Global.AUTO_TIME,0)==1;
        }catch(Exception ignored){return false;}
    }
}

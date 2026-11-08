package com.lucianotoscano.pokesearchoverlay;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;

/** Janela do evento definida na hora LOCAL da região escolhida.
 * Conversões baseadas em IANA tzdb; não alteram GPS nem relógio do sistema.
 */
public final class RaidDayRegionalWindow {
    public enum Phase { UNKNOWN, BEFORE, ACTIVE, ENDED }
    public static final LocalDate CHANDELURE_DATE=LocalDate.of(2026,10,31);
    public static final LocalTime CHANDELURE_START=LocalTime.of(14,0);
    public static final LocalTime CHANDELURE_END=LocalTime.of(17,0);
    private RaidDayRegionalWindow(){}

    public static long[] bounds(LocalDate date, LocalTime from,
                                LocalTime to, ZoneId zone){
        if(date==null||from==null||to==null||zone==null)
            throw new IllegalArgumentException("Data, hora e região obrigatórias");
        long start=LocalDateTime.of(date,from).atZone(zone).toInstant().toEpochMilli();
        LocalDate endDate=to.isAfter(from)?date:date.plusDays(1);
        long end=LocalDateTime.of(endDate,to).atZone(zone).toInstant().toEpochMilli();
        if(start<=0||end<=start||end-start>24L*60*60*1000)
            throw new IllegalArgumentException("Janela regional inválida");
        return new long[]{start,end};
    }
    public static Phase phase(Instant instant,long begin,long end){
        if(instant==null||begin<=0||end<=begin)return Phase.UNKNOWN;
        long now=instant.toEpochMilli();
        if(now<begin)return Phase.BEFORE;
        if(now>=end)return Phase.ENDED; // término é exclusivo
        return Phase.ACTIVE;
    }
    public static LocalDate day(Instant instant,ZoneId zone){
        return instant.atZone(zone).toLocalDate();
    }
}

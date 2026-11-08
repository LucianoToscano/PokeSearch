package com.lucianotoscano.pokesearchoverlay;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

/**
 * Momentos pré-definidos para testar o relógio ÚNICO do Edu.
 * Não altera o horário do Android, o jogo ou a janela salva do evento.
 *
 * Datas são instantes absolutos. Ex.: +4h do início pode já estar
 * depois do encerramento de um evento com duração de 3 horas.
 */
public final class EduEventMomentPresets {
    private static final long SECOND=1_000L;
    private static final long MINUTE=60L*SECOND;
    private static final long HOUR=60L*MINUTE;
    private static final long DAY=24L*HOUR;

    private EduEventMomentPresets(){}

    public static final class Moment {
        public final String label;
        public final long epochMillis;
        private Moment(String name,long time){
            label=name;
            epochMillis=time;
        }
    }

    private static void add(List<Moment> list,String label,long time){
        list.add(new Moment(label,time));
    }

    /** A lista fica em ordem cronológica REAL para a duração configurada. */
    public static List<Moment> forWindow(long start,long end){
        if(start<=0L||end<=start||end-start>DAY)
            return Collections.emptyList();

        List<Moment> result=new ArrayList<>();
        // Sem sobrepor "Faltam 24h": o primeiro caso é três dias antes.
        add(result,"Evento não começou · 3 dias antes",start-3*DAY);
        add(result,"Faltam 24 horas",start-DAY);
        add(result,"Falta 1 hora",start-HOUR);
        add(result,"30 minutos antes",start-30*MINUTE);
        add(result,"10 minutos antes",start-10*MINUTE);
        add(result,"1 minuto antes",start-MINUTE);
        add(result,"10 segundos antes",start-10*SECOND);
        add(result,"Início do evento",start);

        add(result,"2 horas após o início",start+2*HOUR);
        add(result,"4 horas após o início",start+4*HOUR);
        add(result,"8 horas após o início",start+8*HOUR);
        add(result,"12 horas após o início",start+12*HOUR);
        add(result,"24 horas após o início",start+DAY);
        add(result,"48 horas após o início",start+2*DAY);

        add(result,"10 minutos antes do fim",end-10*MINUTE);
        add(result,"10 minutos depois do fim",end+10*MINUTE);
        add(result,"1 semana depois do fim",end+7*DAY);

        result.sort(Comparator.comparingLong(moment->moment.epochMillis));
        return Collections.unmodifiableList(result);
    }
}

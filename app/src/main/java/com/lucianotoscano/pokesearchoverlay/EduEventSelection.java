package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

/** LT312: uma seleção de evento tem prioridade sobre a antiga pergunta de data.
 * O relógio do Edu só reproduz o exemplo histórico se foi ajustado manualmente
 * para perto do evento e NÃO existe outra janela de evento escolhida.
 */
public final class EduEventSelection {
    private static final String PREP_DATE="raid_day_prep_v2_answer_0";
    private static final String CONFIRMED="edu_event_date_confirmed_key";
    private EduEventSelection(){}

    public static boolean isHistoricalExampleClock(Context ctx){
        if(!EduEventClock.isAdjusted(ctx))return false;
        LocalDate day=EduEventClock.today(ctx);
        LocalDate event=RaidDayRegionalWindow.CHANDELURE_DATE;
        return !day.isBefore(event.minusDays(1))&&
            !day.isAfter(event.plusDays(1));
    }

    /** Não sobrescreve eventos reais personalizados nem histórico da sessão. */
    public static boolean sync(Context ctx,SharedPreferences prefs,Clock eduClock){
        long begin=RaidDaySchedule.start(ctx);
        long end=RaidDaySchedule.finish(ctx);
        boolean configured=RaidDaySchedule.valid(begin,end);
        if(!configured&&isHistoricalExampleClock(ctx)){
            ZoneId place=EduEventClock.zone(ctx);
            RaidDaySchedule.save(ctx,
                RaidDayRegionalWindow.CHANDELURE_DATE,
                RaidDayRegionalWindow.CHANDELURE_START,
                RaidDayRegionalWindow.CHANDELURE_END,place,true);
            configured=true;
        }
        if(!configured)return false;
        LocalDate date=RaidDaySchedule.eventDate(ctx);
        if(date==null)return false;
        String iso=date.toString();
        String key="manual:"+iso;
        if(iso.equals(prefs.getString(PREP_DATE,""))&&
            key.equals(prefs.getString(CONFIRMED,"")))return false;
        // O jogador já definiu a janela OU selecionou o exemplo pelo relógio
        // manual. Confirma somente a DATA, nunca passes ou reides.
        prefs.edit().putString(PREP_DATE,iso)
            .putString(CONFIRMED,key)
            .putInt("raid_day_prep_v2_question",0)
            .apply();
        return true;
    }
}

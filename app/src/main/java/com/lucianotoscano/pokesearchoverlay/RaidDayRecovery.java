package com.lucianotoscano.pokesearchoverlay;

import java.util.List;
import java.util.Locale;

/** Diagnóstico exclusivo de eventos MANUAIS. Não deduz vitória ou captura do silêncio. */
public final class RaidDayRecovery {
    private RaidDayRecovery(){}
    public static String lastConfirmed(List<RaidDayEvent> events){
        if(events==null)return "Nenhuma etapa confirmada";
        for(int i=events.size()-1;i>=0;i--){
            RaidDayEvent e=events.get(i);
            if("STEP_CONFIRMED".equals(e.type)||"FINISHED".equals(e.type))
                return "Última etapa confirmada: "+e.stepId;
        }
        return "Nenhuma etapa confirmada";
    }
    public static String guide(List<RaidDayEvent> events,String current,
                               String safeReturn){
        return "Você está em "+current+". "+lastConfirmed(events)+
            ". Retorno seguro: "+safeReturn+
            ". Se o jogo fechou ou a reide foi interrompida, confirme o resultado "+
            "no próprio Pokémon GO antes de continuar. Nenhum passe é presumido.";
    }
    public static String stats(List<RaidDayEvent> events){
        int cycles=0,started=0,wins=0,losses=0,abandoned=0,caught=0,fled=0;
        for(RaidDayEvent e:events){
            switch(e.type){
                case "CYCLE_REPEATED":cycles++;break;
                case "RAID_BATTLE":started++;break;
                case "RAID_WIN":wins++;break;
                case "RAID_LOSS":losses++;break;
                case "RAID_LEFT":abandoned++;break;
                case "RAID_CAUGHT":caught++;break;
                case "RAID_FLED":fled++;break;
                default:break;
            }
        }
        return String.format(Locale.forLanguageTag("pt-BR"),
            "Ciclos: %d | Batalhas informadas: %d | Vitórias: %d | Derrotas: %d"+
            "\nSaídas: %d | Capturados: %d | Fugiram: %d\n"+
            "Informações fornecidas pelo jogador; recompensas não verificadas.",
            cycles,started,wins,losses,abandoned,caught,fled);
    }
}

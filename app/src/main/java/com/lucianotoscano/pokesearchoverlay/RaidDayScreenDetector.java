package com.lucianotoscano.pokesearchoverlay;

import java.text.Normalizer;
import java.util.Locale;

/** OCR conservador, PT-BR e EN. Sem contato com servidores e sem inferir passes. */
public final class RaidDayScreenDetector {
    private RaidDayScreenDetector(){}
    public static String guess(String extracted){
        if(extracted==null||extracted.trim().isEmpty())return "";
        String text=Normalizer.normalize(extracted,Normalizer.Form.NFD)
            .replaceAll("[\\p{M}]","").toUpperCase(Locale.ROOT);
        if(has(text,"POKEMON CAPTURADO","GOTCHA")||
            (has(text,"FOI CAPTURADO","WAS CAUGHT")&&has(text,"POKEMON")))
            return "RAID_CAUGHT";
        if(has(text,"POKEMON FUGIU","POKEMON FLED"))return "RAID_FLED";
        if(has(text,"VOCE VENCEU","YOU WIN","VITORIA NA REIDE"))return "RAID_WIN";
        if(has(text,"RECOMPENSAS","REWARDS")&&
           has(text,"PO","XP","ITEM","BONUS","BÔNUS"))return "RAID_REWARDS";
        if(has(text,"CONVITE DE REIDE","RAID LOBBY","AGUARDANDO JOGADORES",
                    "WAITING FOR PLAYERS"))return "RAID_LOBBY";
        if(has(text,"DERROTA NA REIDE","RAID LOST","YOU LOST"))return "RAID_LOSS";
        if(has(text,"POKEMON APARECEU","BONUS CHALLENGE","DESAFIO BONUS"))
            return "RAID_ENCOUNTER";
        // OCR do mapa ou da mochila NÃO prova de qual dia veio um passe.
        return "";
    }
    private static boolean has(String text,String... needles){
        for(String needle:needles)if(text.contains(needle))return true;
        return false;
    }
    /** Evita sugerir estado com apenas um quadro isolado. */
    public static final class Stable {
        private String last="";
        private int frames=0;
        public String observe(String label){
            if(label==null||label.isEmpty()){last="";frames=0;return "";}
            if(label.equals(last))frames++;else{last=label;frames=1;}
            return frames>=3?label:"";
        }
        public void reset(){frames=0;last="";}
    }
}

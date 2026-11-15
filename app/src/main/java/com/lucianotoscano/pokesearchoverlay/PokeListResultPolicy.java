package com.lucianotoscano.pokesearchoverlay;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * LT365 — apresentação do Radar inspirada nos dados exibidos pelo PokeList.
 * Distância sempre usa o centro que a pessoa DIGITOU (não posição atual).
 * Cooldown é apenas referência hipotética: nenhum evento de jogo é detectado.
 */
final class PokeListResultPolicy {
    private static final double EARTH_KM=6371d;
    private PokeListResultPolicy(){}

    static double distanceKm(double aLat,double aLon,double bLat,double bLon){
        if(!valid(aLat,aLon)||!valid(bLat,bLon))return Double.NaN;
        double rad=Math.PI/180d;
        double phi1=aLat*rad,phi2=bLat*rad;
        double deltaLat=(bLat-aLat)*rad,deltaLon=(bLon-aLon)*rad;
        double h=Math.pow(Math.sin(deltaLat/2d),2d)+
            Math.cos(phi1)*Math.cos(phi2)*Math.pow(Math.sin(deltaLon/2d),2d);
        return 2d*EARTH_KM*Math.asin(Math.min(1d,Math.sqrt(Math.max(0d,h))));
    }

    private static boolean valid(double lat,double lon){
        return Double.isFinite(lat)&&Double.isFinite(lon)&&
            lat>=-90d&&lat<=90d&&lon>=-180d&&lon<=180d;
    }

    static String distanceLabel(double km){
        if(!Double.isFinite(km)||km<0d)return "Distância indisponível";
        if(km<1d)return Math.round(km*1000d)+" m";
        return String.format(Locale.ROOT,"%.1f km",km);
    }

    static int hypotheticalCooldownSeconds(double km){
        if(!Double.isFinite(km)||km<0d)return -1;
        return CandyCooldownPolicy.recommendedSeconds(km*1000d);
    }

    static String cooldownLabel(double km){
        int seconds=hypotheticalCooldownSeconds(km);
        if(seconds<0)return "CD: sem referência";
        return "CD de referência ≈ "+
            CandyCooldownPolicy.compactTimerLabel(seconds);
    }

    static String genderLabel(String raw){
        if(raw==null)return "";
        switch(raw.trim().toLowerCase(Locale.ROOT)){
            case "male": case "m": case "masculino": return "♂";
            case "female": case "f": case "feminino": return "♀";
            case "genderless": case "sem sexo": return "Sem sexo";
            default: return "";
        }
    }

    static String countryLabel(String raw){
        if(raw==null)return "";
        String code=raw.trim().toUpperCase(Locale.ROOT);
        if(!code.matches("[A-Z]{2}"))return "";
        // Identificação legível pelo TalkBack, sem bandeira dependente de fonte.
        return code;
    }

    static String despawnLabel(long expiry,long now){
        if(expiry<=0)return "Desaparecimento desconhecido";
        if(now<=0||expiry<=now)return "Expirado";
        String time=new SimpleDateFormat("HH:mm:ss",new Locale("pt","BR"))
            .format(new Date(expiry));
        long seconds=(expiry-now+999L)/1000L;
        long minutes=seconds/60L;
        return "Desaparece "+time+" · "+minutes+"m "+(seconds%60L)+"s";
    }
}

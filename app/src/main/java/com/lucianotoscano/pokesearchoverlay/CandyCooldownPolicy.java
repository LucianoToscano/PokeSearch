package com.lucianotoscano.pokesearchoverlay;

/**
 * Local, informational time estimator for the NEXT Rare Candy hop.
 * A tap/copy is only a user-selected reference point. It does not confirm
 * a teleport or a completed Pokémon GO interaction. Never changes provider
 * request limits, spawn expiry, or account state.
 */
final class CandyCooldownPolicy {
    static final long MAX_AGE_MS=24L*60L*60L*1000L;
    private static final double EARTH_RADIUS_METERS=6371000d;
    private CandyCooldownPolicy(){}

    static double[] parseCoordinates(String coords){
        if(coords==null||!coords.matches(
            "-?[0-9]{1,2}(?:\\.[0-9]+)?\\s*,\\s*-?[0-9]{1,3}(?:\\.[0-9]+)?"))return null;
        try{
            String[] pair=coords.split(",");
            double lat=Double.parseDouble(pair[0].trim());
            double lon=Double.parseDouble(pair[1].trim());
            if(!Double.isFinite(lat)||!Double.isFinite(lon)||
                Math.abs(lat)>90||Math.abs(lon)>180)return null;
            return new double[]{lat,lon};
        }catch(NumberFormatException bad){return null;}
    }

    static double distanceMeters(String from,String to){
        double[] a=parseCoordinates(from),b=parseCoordinates(to);
        if(a==null||b==null)return Double.NaN;
        double lat1=Math.toRadians(a[0]),lat2=Math.toRadians(b[0]);
        double dLat=lat2-lat1,dLon=Math.toRadians(b[1]-a[1]);
        double h=Math.pow(Math.sin(dLat/2),2)+
            Math.cos(lat1)*Math.cos(lat2)*Math.pow(Math.sin(dLon/2),2);
        return 2d*EARTH_RADIUS_METERS*Math.asin(Math.min(1d,Math.sqrt(Math.max(0d,h))));
    }

    // User-provided travel-distance table, advisory only (not a Niantic guarantee).
    static int recommendedSeconds(double meters){
        if(!Double.isFinite(meters)||meters<0)return -1;
        if(meters<10)return 0;
        if(meters<100)return 3;
        if(meters<500)return 15;
        if(meters<1000)return 30;
        if(meters<5000)return 120;
        if(meters<10000)return 360;
        if(meters<25000)return 660;
        if(meters<30000)return 840;
        if(meters<65000)return 1320;
        if(meters<81000)return 1500;
        if(meters<100000)return 2100;
        if(meters<250000)return 2700;
        if(meters<500000)return 3600;
        if(meters<750000)return 4500;
        if(meters<1000000)return 5400;
        return 7200;
    }

    static int remainingSeconds(String origin,String next,long copiedAtMs,long nowMs){
        if(copiedAtMs<=0||nowMs<copiedAtMs||nowMs-copiedAtMs>MAX_AGE_MS)
            return -1;
        int wait=recommendedSeconds(distanceMeters(origin,next));
        if(wait<0)return -1;
        long elapsed=(nowMs-copiedAtMs)/1000L;
        return (int)Math.max(0L,wait-elapsed);
    }

    // Compact badge in the 46dp candy sprite. Keep full timerLabel for
    // accessibility while using h:mm for long waits, mm:ss below an hour.
    static boolean shouldWarnBeforeCopy(String confirmedOrigin,String next,
        long confirmedAtMs,long nowMs){
        return parseCoordinates(confirmedOrigin)!=null&&
            parseCoordinates(next)!=null&&
            !confirmedOrigin.equals(next)&&
            remainingSeconds(confirmedOrigin,next,confirmedAtMs,nowMs)>0;
    }

    static String compactTimerLabel(int seconds){
        if(seconds<0)return "";
        if(seconds==0)return "✓";
        if(seconds>=3600){
            int minutes=(seconds+59)/60; // always round up, never prematurely ready
            return (minutes/60)+"h"+two(minutes%60);
        }
        return (seconds/60)+":"+two(seconds%60);
    }

    static String timerLabel(int seconds){
        if(seconds<0)return "";
        if(seconds==0)return "✓ Pronto";
        if(seconds>=3600)return (seconds/3600)+":"+
            two((seconds%3600)/60)+":"+two(seconds%60);
        return (seconds/60)+":"+two(seconds%60);
    }
    private static String two(int n){return n<10?"0"+n:String.valueOf(n);}

    static int remainingColor(int seconds){
        if(seconds==0)return 0xFF50E39B; // green
        if(seconds>0&&seconds<=30)return 0xFFFF83BB; // pink
        return 0xFFFF5F70; // red
    }
}

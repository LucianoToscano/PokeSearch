package com.lucianotoscano.pokesearchoverlay;

import java.net.URLEncoder;
import java.util.LinkedHashSet;
import java.util.Locale;

/**
 * LT364: contrato independente para a API PokeList informada pelo proprietário.
 * A consulta é MANUAL; não usa GPS do aparelho, root ou APIs dos clientes.
 */
final class PokeListApiPolicy {
    static final String BASE="https://moonani.com/PokeList/api.v2.php";
    static final String[] TYPES={"pokemon","raid","quest","rocket","rocket_leader"};
    static final long MIN_REFRESH_MS=15000L;
    static final int MAX_BODY_BYTES=512*1024;
    static final int MAX_VISIBLE=80;
    private PokeListApiPolicy(){}

    static String normalizedType(String type){
        if(type!=null)for(String allowed:TYPES)if(allowed.equals(type))return allowed;
        throw new IllegalArgumentException("Tipo PokeList desconhecido");
    }
    static String ids(String input){
        if(input==null||input.trim().isEmpty())return "";
        String[] values=input.trim().split(",",-1);
        if(values.length>30)throw new IllegalArgumentException("Máximo de 30 IDs");
        LinkedHashSet<Integer> chosen=new LinkedHashSet<>();
        for(String item:values){
            String part=item.trim();
            if(!part.matches("[0-9]{1,5}"))throw new IllegalArgumentException(
                "Use somente IDs numéricos separados por vírgula");
            int id=Integer.parseInt(part);
            if(id<1||id>99999)throw new IllegalArgumentException("ID inválido");
            chosen.add(id);
        }
        StringBuilder sb=new StringBuilder();
        for(int n:chosen){if(sb.length()>0)sb.append(',');sb.append(n);}
        return sb.toString();
    }
    static final class Query {
        final String type,monIds;
        final double latitude,longitude;
        final int distance,ivMin;
        Query(String type,double lat,double lon,int distance,String ids,int ivMin){
            this.type=normalizedType(type);
            if(!Double.isFinite(lat)||lat< -90||lat>90||
               !Double.isFinite(lon)||lon< -180||lon>180)
                throw new IllegalArgumentException("Latitude/longitude inválidas");
            if(distance<1||distance>200)
                throw new IllegalArgumentException("Raio: 1 a 200 (unidade da API)");
            if(ivMin<0||ivMin>100)throw new IllegalArgumentException("IV: 0 a 100");
            this.latitude=lat;this.longitude=lon;
            this.distance=distance;this.monIds=ids(ids);this.ivMin=ivMin;
        }
        String url(long nowMs){
            if(nowMs<=0L)throw new IllegalArgumentException("Tempo inválido");
            StringBuilder b=new StringBuilder(BASE).append("?type=").append(type)
                .append("&mons=").append(monIds).append("&lat=")
                .append(String.format(Locale.ROOT,"%.6f",latitude))
                .append("&lng=").append(String.format(Locale.ROOT,"%.6f",longitude))
                .append("&distance=").append(distance);
            if("pokemon".equals(type)){
                b.append("&iv_type=0&ivMin=").append(ivMin).append("&ivMax=100");
            }
            b.append("&_time=").append(nowMs);
            return b.toString();
        }
    }
    static boolean mayRetry(int httpStatus){
        return httpStatus==408||httpStatus==429||httpStatus>=500;
    }
    static boolean mustStop(int httpStatus){
        return httpStatus==401||httpStatus==403;
    }
    static long backoffMillis(int status,String retryAfterSeconds){
        if(status!=429&&status!=503)return MIN_REFRESH_MS;
        try{
            long seconds=Long.parseLong(retryAfterSeconds==null?"":retryAfterSeconds.trim());
            if(seconds>=1&&seconds<=3600)return Math.max(MIN_REFRESH_MS,seconds*1000L);
        }catch(NumberFormatException ignored){}
        return 60000L;
    }
    static long epochMilliseconds(long raw){
        // Unix seconds vs milliseconds; never guess microseconds/nanoseconds.
        if(raw>=1_000_000_000L&&raw<100_000_000_000L)return raw*1000L;
        if(raw>=1_000_000_000_000L&&raw<=9_999_999_999_999L)return raw;
        return -1L;
    }
    static boolean expired(long rawEnd,long nowWallMs){
        if(rawEnd<=0)return false; // unknown, UI marks time not verified
        long end=epochMilliseconds(rawEnd);
        return end<0L||end<=nowWallMs;
    }
    static String safeLabel(String raw){
        if(raw==null)return "";
        StringBuilder out=new StringBuilder();
        for(int i=0;i<raw.length()&&out.length()<70;i++){
            char c=raw.charAt(i);
            if(c=='\n'||c=='\r'||c=='\t'||Character.isISOControl(c))continue;
            out.append(c);
        }
        return out.toString().trim();
    }
}

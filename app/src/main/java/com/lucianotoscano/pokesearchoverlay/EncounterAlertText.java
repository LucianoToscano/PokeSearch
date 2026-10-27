package com.lucianotoscano.pokesearchoverlay;

import java.util.Locale;

/** Pure formatting for compact, unambiguous Android encounter notifications.
 * The caller must validate the encounter BEFORE using these strings.
 * Do not infer IVs from the selected search mode alone.
 */
public final class EncounterAlertText {
    private EncounterAlertText(){}

    private static String clean(String input,int limit){
        if(input==null)return "";
        String value=input.replaceAll("[\\p{Cntrl}\\r\\n]+"," ").trim()
            .replaceAll(" +"," ");
        return value.length()>limit?value.substring(0,limit).trim():value;
    }
    static String quality(String iv,String percent,boolean shiny,String mode,String rank){
        String raw=clean(iv,32);
        boolean valid=raw.matches("(?:[0-9]|1[0-5])/(?:[0-9]|1[0-5])/(?:[0-9]|1[0-5])");
        int sum=-1;
        if(valid){
            String[] a=raw.split("/");
            sum=Integer.parseInt(a[0])+Integer.parseInt(a[1])+Integer.parseInt(a[2]);
        }
        int pct=-1;
        try{
            String p=clean(percent,6).replace("%","");
            if(p.matches("(?:0|[1-9][0-9]?|100)"))pct=Integer.parseInt(p);
        }catch(NumberFormatException ignored){}
        if(sum==45||(!valid&&pct==100))return shiny?"✨ SHUNDO":"💯 HUNDO";
        if(sum==0||(!valid&&pct==0))return shiny?"✨ SHNUNDO":"⭕ NUNDO";
        if("gl".equals(mode)||"ul".equals(mode)){
            String league="gl".equals(mode)?"GL":"UL";
            String place=clean(rank,5).replace("#","");
            if(place.matches("[1-9][0-9]{0,3}"))
                return league+" #"+place+(shiny?" ✨":"");
            return league+(shiny?" ✨":"");
        }
        if(valid)return (shiny?"✨ ":"")+"IV "+raw;
        if(pct>=0)return (shiny?"✨ ":"")+"IV "+pct+"%";
        return shiny?"✨ SHINY":"Pokémon encontrado";
    }
    public static String title(String name,String number,String iv,String percent,
                               boolean shiny,String mode,String rank){
        String species=clean(name,48);
        if(species.isEmpty())species="Pokémon";
        String dex=clean(number,6).replace("#","");
        String id=dex.matches("[0-9]{1,4}")?" #"+dex:"";
        return species+id+" · "+quality(iv,percent,shiny,mode,rank);
    }
    public static String details(boolean favorite,boolean secondary,String cp,
                                 String iv,String percent,String form,String costume,
                                 String size,String sex,String location){
        StringBuilder sb=new StringBuilder(secondary?"P2":"P1");
        sb.append(favorite?" · ⭐ Favorito":" · Novo Pokémon");
        String combat=clean(cp,7);
        if(combat.matches("[0-9]{1,6}"))sb.append(" · PC ").append(combat);
        String raw=clean(iv,32);
        if(raw.matches("(?:[0-9]|1[0-5])/(?:[0-9]|1[0-5])/(?:[0-9]|1[0-5])"))
            sb.append(" · ").append(raw);
        else{
            String pct=clean(percent,5);
            if(pct.matches("(?:0|[1-9][0-9]?|100)"))
                sb.append(" · IV ").append(pct).append("%");
        }
        String variant=clean(costume,32);
        if(variant.isEmpty()||"none".equalsIgnoreCase(variant)||"normal".equalsIgnoreCase(variant))
            variant=clean(form,32);
        if(!variant.isEmpty()&&!"normal".equalsIgnoreCase(variant)&&
            !"default".equalsIgnoreCase(variant))
            sb.append(" · ").append(variant);
        String stature=clean(size,7);
        if("XXS".equalsIgnoreCase(stature)||"XXL".equalsIgnoreCase(stature))
            sb.append(" · ").append(stature.toUpperCase(Locale.ROOT));
        String gender=clean(sex,8);
        if("Male".equalsIgnoreCase(gender)||"M".equalsIgnoreCase(gender))sb.append(" · ♂");
        else if("Female".equalsIgnoreCase(gender)||"F".equalsIgnoreCase(gender))sb.append(" · ♀");
        String city=clean(location,42);
        if(!city.isEmpty())sb.append(" · ").append(city);
        return sb.toString();
    }
}

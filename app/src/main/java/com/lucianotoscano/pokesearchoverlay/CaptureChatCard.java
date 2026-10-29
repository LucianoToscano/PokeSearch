package com.lucianotoscano.pokesearchoverlay;

import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** LT132: text-only interoperable capture card. No new Firebase fields or rules.
 * Older APKs show a readable text line; this APK renders compact verified badges.
 */
final class CaptureChatCard {
    private CaptureChatCard(){}
    private static final Pattern HEAD=Pattern.compile("^(🎉|✨) Capturou um (.+)!$");
    private static final Pattern IV=CaptureChatFormat.RAW_IV;
    private static final Pattern CP=Pattern.compile("^[0-9]{1,5}$");
    private static final Pattern LEVEL=Pattern.compile("^([1-9]|[1-4][0-9]|50)(?:\\.5)?$");
    private static final Pattern RANK=Pattern.compile("^(?:[1-9]|[1-4][0-9]|50)$");
    private static final Pattern SIZE=Pattern.compile("^(?:XXS|XS|S|M|L|XL|XXL)$");
    private static final String SEP=" · ";
    static final class Card {
        final String name,iv,league,rank,size,gender,cp,level,moves;
        final boolean shiny,boosted;
        Card(String name,boolean shiny,String iv,String league,String rank,String size,
             String gender,String cp,String level,String moves,boolean boosted) {
            this.name=name;this.shiny=shiny;this.iv=iv;this.league=league;
            this.rank=rank;this.size=size;this.gender=gender;
            this.cp=cp;this.level=level;this.moves=moves;this.boosted=boosted;
        }
        String headline(String nickname){
            return (shiny?"✨ ":"🎉 ")+nickname+" capturou um "+
                CaptureChatFormat.compactName(name)+"!";
        }
        String rarity(){
            if("15/15/15".equals(iv))return shiny?"Shundo":"Hundo";
            if("0/0/0".equals(iv))return shiny?"Shnundo":"Nundo";
            return "";
        }
        boolean hasDetails(){
            return !cp.isEmpty()||!level.isEmpty()||!moves.isEmpty()||boosted||
                name.contains("(");
        }
        String details(){
            List<String> parts=new ArrayList<>();
            if(!cp.isEmpty())parts.add("PC "+cp);
            if(!level.isEmpty())parts.add("Nv "+level);
            if(!iv.isEmpty()&&!rarity().isEmpty())parts.add("IV "+iv);
            if(!moves.isEmpty())parts.add("Golpes: "+moves);
            if(boosted)parts.add("Boost climático confirmado");
            return String.join(SEP,parts);
        }
    }
    private static String clean(String value,int limit){
        if(value==null)return "";
        String out=value.replace('\n',' ').replace('\r',' ').replace('|',' ')
            .replace('·',' ').trim();
        if(out.length()>limit)out=out.substring(0,limit).trim();
        return out;
    }
    private static String rawIv(String s){
        String iv=s==null?"":s.trim();
        return IV.matcher(iv).matches()?iv:"";
    }
    private static String clipNumber(String s,Pattern p){
        String n=s==null?"":s.trim();
        return p.matcher(n).matches()?n:"";
    }
    private static String suffix(String current,String text,int max){
        if(text.isEmpty())return current;
        return current.length()+text.length()<=max?current+text:current;
    }
    private static boolean isHalloween2021(String input){
        if(input==null)return false;
        String code=input.replaceAll("[^A-Za-z0-9]","").toUpperCase(Locale.ROOT);
        return "HALLOWEEN2021COSTUME".equals(code) ||
            "HALLOWEEN2021NOEVOLVE".equals(code) ||
            "HALLOWEEN2021".equals(code) ||
            "HALLOWEENMISCHIEF2021".equals(code);
    }
    static String fromResult(JSONObject item){
        if(item==null)return "";
        String name=clean(item.optString("name",""),60);
        if(name.isEmpty())return "";
        String form=clean(item.optString("form",""),28);
        String costume=clean(item.optString("costume",""),38);
        // The live site may supply the costume in both form and costume
        // fields, or inside the species title. Canonicalize only the exact
        // verified 2021 variants so the tiny sprite resolver still matches.
        String base=name.replaceFirst("\\s*\\([^)]*\\).*$","").trim();
        boolean halloween2021=base.matches("(?i)^(Pikachu|Piplup|Drifblim)$") &&
            (CaptureChatFormat.exactCostumeAsset(name,false).length()>0 ||
             isHalloween2021(form) || isHalloween2021(costume));
        if(halloween2021){
            name=base+" (Halloween 2021 Costume)";
        }else{
            if(!form.isEmpty() && !form.equalsIgnoreCase("Normal") &&
               !form.equalsIgnoreCase("Default") && !form.equalsIgnoreCase("None") &&
               !name.toLowerCase(Locale.ROOT).contains(form.toLowerCase(Locale.ROOT)))
                name=suffix(name," ("+form+")",95);
            if(!costume.isEmpty() && !name.toLowerCase(Locale.ROOT)
                    .contains(costume.toLowerCase(Locale.ROOT)))
                name=suffix(name," (Traje "+costume+")",95);
            else if(item.optInt("costume_id",0)>0 && costume.isEmpty())
                name=suffix(name," (Traje)",95);
            if(item.optInt("form_id",0)>0 && form.isEmpty())
                name=suffix(name," (Forma especial)",95);
        }
        boolean shiny=item.optBoolean("shiny",false);
        String head=(shiny?"✨":"🎉")+" Capturou um "+name+"!";
        List<String> badges=new ArrayList<>();
        String iv=rawIv(item.optString("iv",""));
        if(!iv.isEmpty())badges.add("IV:"+iv);
        // Only an exact species-specific rank from the API or explicitly labelled
        // IV rank on DOM; never treat a search limit as an actual PvP rank.
        String league=item.optString("ivRankLeague","").toLowerCase(Locale.ROOT);
        String source=item.optString("ivRankSource","");
        String rank="";
        if("api-pvp".equals(source))
            rank=clipNumber(item.optString("rank",""),RANK);
        else if("explicit-species-iv".equals(source))
            rank=clipNumber(item.optString("ivRank",""),RANK);
        if(!rank.isEmpty()){
            if("great".equals(league)||"gl".equals(league))badges.add("GL:#"+rank);
            if("ultra".equals(league)||"ul".equals(league))badges.add("UL:#"+rank);
        }
        String size=clean(item.optString("size",""),4).toUpperCase(Locale.ROOT);
        if(SIZE.matcher(size).matches())badges.add("T:"+size);
        String sex=item.optString("gender","");
        if("♂".equals(sex)||"♀".equals(sex)||"⚲".equals(sex))
            badges.add("S:"+sex); // Always the last badge.
        List<String> details=new ArrayList<>();
        String cp=clipNumber(item.optString("cp",""),CP);
        String level=clipNumber(item.optString("level",""),LEVEL);
        if(!cp.isEmpty())details.add("PC:"+cp);
        if(!level.isEmpty())details.add("Nv:"+level);
        String moves=clean(item.optString("moves",""),65);
        if(!moves.isEmpty())details.add("Golpes:"+moves);
        if(item.has("boosted") && item.optBoolean("boosted",false))details.add("Boost:Sim");
        String text=head;
        if(!badges.isEmpty())text=suffix(text,"\n"+String.join(SEP,badges),240);
        // LT133: never send a third row of PC, level or moves to public chat.
        // Existing LT132 three-line posts remain readable by parse(...).
        return text;
    }
    static Card parse(String value){
        if(value==null||value.length()>240)return null;
        String[] lines=value.split("\n",-1);
        if(lines.length>3 || lines.length==0)return null;
        Matcher match=HEAD.matcher(lines[0]);
        if(!match.matches())return null;
        String name=match.group(2);
        if(name.isEmpty()||name.length()>95)return null;
        String iv="",league="",rank="",size="",sex="",cp="",level="",moves="";
        boolean boost=false;
        if(lines.length>1){
            for(String part:lines[1].split(SEP)){
                String s=part.trim();
                if(s.startsWith("IV:"))iv=rawIv(s.substring(3));
                else if(s.matches("^GL:#[0-9]{1,2}$")){
                    String n=clipNumber(s.substring(4),RANK);
                    if(!n.isEmpty()){league="GL";rank=n;}
                }else if(s.matches("^UL:#[0-9]{1,2}$")){
                    String n=clipNumber(s.substring(4),RANK);
                    if(!n.isEmpty()){league="UL";rank=n;}
                }else if(s.startsWith("T:")){
                    String t=s.substring(2);
                    if(SIZE.matcher(t).matches())size=t;
                }else if(s.startsWith("S:")){
                    String g=s.substring(2);
                    if("♂".equals(g)||"♀".equals(g)||"⚲".equals(g))sex=g;
                }
            }
        }
        if(lines.length>2){
            for(String part:lines[2].split(SEP)){
                String s=part.trim();
                if(s.startsWith("PC:"))cp=clipNumber(s.substring(3),CP);
                else if(s.startsWith("Nv:"))level=clipNumber(s.substring(3),LEVEL);
                else if(s.startsWith("Golpes:"))moves=clean(s.substring(7),65);
                else if("Boost:Sim".equals(s))boost=true;
            }
        }
        return new Card(name,"✨".equals(match.group(1)),iv,league,rank,
            size,sex,cp,level,moves,boost);
    }
}

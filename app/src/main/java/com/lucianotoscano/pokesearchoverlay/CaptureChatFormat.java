package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import org.json.JSONArray;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** A capture is a voluntary report from a trainer, not a verified catch.
 * Use only the existing chat text field: no Firebase rules migration required.
 * The native renderer resolves a sprite from the same bundled catalog as the app.
 */
final class CaptureChatFormat {
    private CaptureChatFormat(){}
    static final Pattern RAW_IV=Pattern.compile(
        "^([0-9]|1[0-5])/([0-9]|1[0-5])/([0-9]|1[0-5])$");
    private static final Pattern CAPTURE=Pattern.compile(
        "^(🎉|✨) Capturou um (.+?)(?: ((?:[0-9]|1[0-5])/(?:[0-9]|1[0-5])/(?:[0-9]|1[0-5])))?!$");
    private static Map<String,Integer> species;

    static String build(String pokemon,boolean shiny,String rawIv,String form){
        String name=CaptureSharePublisher.cleanName(pokemon);
        if(name.isEmpty())return "";
        String variant=CaptureSharePublisher.cleanName(form);
        if(!variant.isEmpty() && !variant.equalsIgnoreCase("Normal") &&
           !variant.equalsIgnoreCase("Default") && !variant.equalsIgnoreCase("None") &&
           !name.toLowerCase(Locale.ROOT).contains(variant.toLowerCase(Locale.ROOT))){
            name=name+" ("+variant+")";
        }
        String validIv=rawIv==null?"":rawIv.trim();
        if(!RAW_IV.matcher(validIv).matches())validIv="";
        // Keep both desired examples exactly, without inventing unavailable IVs.
        String line=(shiny?"✨":"🎉")+" Capturou um "+name+
           (validIv.isEmpty()?"":" "+validIv)+"!";
        return line.length()>240?"":line;
    }
    static final class Capture {
        final String name,iv;
        final boolean shiny;
        Capture(String n,String v,boolean s){name=n;iv=v;shiny=s;}
        String display(String nickname){
            return (shiny?"✨ ":"🎉 ")+nickname+" capturou um "+name+
                (iv.isEmpty()?"":" "+iv)+"!";
        }
    }
    static Capture parse(String text){
        if(text==null)return null;
        Matcher m=CAPTURE.matcher(text.trim());
        if(!m.matches())return null;
        String name=m.group(2);
        if(name==null||name.isEmpty()||name.length()>90)return null;
        String iv=m.group(3)==null?"":m.group(3);
        return new Capture(name,iv,"✨".equals(m.group(1)));
    }
    /** Exact 2021 GO costume from pinned PokeMiners assets. A year, form,
     * species or shiny mismatch MUST fail closed instead of using base artwork. */
    static String exactCostumeAsset(String pokemon,boolean shiny){
        if(pokemon==null)return "";
        Matcher m=Pattern.compile(
            "^(Pikachu|Piplup|Drifblim)\\s*\\((?:Halloween 2021 Costume|HALLOWEEN_2021_NOEVOLVE|Halloween Mischief 2021|Traje Halloween 2021)\\)$",
            Pattern.CASE_INSENSITIVE).matcher(pokemon.trim());
        if(!m.matches())return "";
        String dex="Pikachu".equalsIgnoreCase(m.group(1))?"25":
                   "Piplup".equalsIgnoreCase(m.group(1))?"393":"426";
        return "pokemon-sprites/costumes/"+dex+"-halloween-2021"+
            (shiny?"-shiny":"")+".png";
    }
    static String compactName(String pokemon){
        if(exactCostumeAsset(pokemon,false).isEmpty())return pokemon;
        return pokemon.substring(0,pokemon.indexOf('(')).trim();
    }
    static synchronized int speciesDex(Context context,String name){
        // If a form/costume was announced, never substitute the base species sprite.
        if(name==null||name.contains("(")||name.contains(")")||
           name.length()>60)return 0;
        if(species==null){
            species=new HashMap<>();
            try(InputStream in=context.getAssets().open("pokemon_catalog.json");
                ByteArrayOutputStream buf=new ByteArrayOutputStream()){
                byte[] block=new byte[4096];int n;
                while((n=in.read(block))!=-1)buf.write(block,0,n);
                JSONArray array=new JSONArray(buf.toString(StandardCharsets.UTF_8.name()));
                for(int i=0;i<array.length();i++){
                    JSONArray row=array.optJSONArray(i);
                    if(row!=null && row.optInt(0)>0){
                        String label=row.optString(1,"").trim().toLowerCase(Locale.ROOT);
                        if(!label.isEmpty())species.put(label,row.optInt(0));
                    }
                }
            }catch(Exception ignored){species.clear();}
        }
        Integer dex=species.get(name.trim().toLowerCase(Locale.ROOT));
        return dex==null?0:dex;
    }
}
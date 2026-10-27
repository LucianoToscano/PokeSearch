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
    // Exact, immutable Pokémon GO costume PNGs from the bundled pinned archive.
    // A different year, sex or pumpkin size MUST NOT receive unrelated artwork.
    private static final String[][] HALLOWEEN_ART={
        {"Lapras", "COSTUME2020", "", "", "", "pm131.fCOSTUME_2020.icon.png"},
        {"Lapras", "COSTUME2020", "", "", "S", "pm131.fCOSTUME_2020.s.icon.png"},
        {"Pichu", "HALLOWEEN2017", "", "", "", "pm172.cHALLOWEEN_2017.icon.png"},
        {"Pichu", "HALLOWEEN2017", "", "", "S", "pm172.cHALLOWEEN_2017.s.icon.png"},
        {"Teddiursa", "HALLOWEEN2025", "", "", "", "pm216.cHALLOWEEN_2025.icon.png"},
        {"Teddiursa", "HALLOWEEN2025", "", "", "S", "pm216.cHALLOWEEN_2025.s.icon.png"},
        {"Ursaring", "HALLOWEEN2025", "", "F", "", "pm217.cHALLOWEEN_2025.g2.icon.png"},
        {"Ursaring", "HALLOWEEN2025", "", "F", "S", "pm217.cHALLOWEEN_2025.g2.s.icon.png"},
        {"Ursaring", "HALLOWEEN2025", "", "", "", "pm217.cHALLOWEEN_2025.icon.png"},
        {"Ursaring", "HALLOWEEN2025", "", "", "S", "pm217.cHALLOWEEN_2025.s.icon.png"},
        {"Pikachu", "HALLOWEEN2017", "", "F", "", "pm25.cHALLOWEEN_2017.g2.icon.png"},
        {"Pikachu", "HALLOWEEN2017", "", "F", "S", "pm25.cHALLOWEEN_2017.g2.s.icon.png"},
        {"Pikachu", "HALLOWEEN2017", "", "", "", "pm25.cHALLOWEEN_2017.icon.png"},
        {"Pikachu", "HALLOWEEN2017", "", "", "S", "pm25.cHALLOWEEN_2017.s.icon.png"},
        {"Pikachu", "HALLOWEEN2021", "", "F", "", "pm25.cHALLOWEEN_2021_NOEVOLVE.g2.icon.png"},
        {"Pikachu", "HALLOWEEN2021", "", "F", "S", "pm25.cHALLOWEEN_2021_NOEVOLVE.g2.s.icon.png"},
        {"Pikachu", "HALLOWEEN2021", "", "", "", "pm25.cHALLOWEEN_2021_NOEVOLVE.icon.png"},
        {"Pikachu", "HALLOWEEN2021", "", "", "S", "pm25.cHALLOWEEN_2021_NOEVOLVE.s.icon.png"},
        {"Pikachu", "COSTUME2020", "", "F", "", "pm25.fCOSTUME_2020.g2.icon.png"},
        {"Pikachu", "COSTUME2020", "", "F", "S", "pm25.fCOSTUME_2020.g2.s.icon.png"},
        {"Pikachu", "COSTUME2020", "", "", "", "pm25.fCOSTUME_2020.icon.png"},
        {"Pikachu", "COSTUME2020", "", "", "S", "pm25.fCOSTUME_2020.s.icon.png"},
        {"Pikachu", "HALLOWEEN2026", "", "F", "", "pm25.fHALLOWEEN_2026.g2.icon.png"},
        {"Pikachu", "HALLOWEEN2026", "", "F", "S", "pm25.fHALLOWEEN_2026.g2.s.icon.png"},
        {"Pikachu", "HALLOWEEN2026", "", "", "", "pm25.fHALLOWEEN_2026.icon.png"},
        {"Pikachu", "HALLOWEEN2026", "", "", "S", "pm25.fHALLOWEEN_2026.s.icon.png"},
        {"Raichu", "HALLOWEEN2017", "", "F", "", "pm26.cHALLOWEEN_2017.g2.icon.png"},
        {"Raichu", "HALLOWEEN2017", "", "F", "S", "pm26.cHALLOWEEN_2017.g2.s.icon.png"},
        {"Raichu", "HALLOWEEN2017", "", "", "", "pm26.cHALLOWEEN_2017.icon.png"},
        {"Raichu", "HALLOWEEN2017", "", "", "S", "pm26.cHALLOWEEN_2017.s.icon.png"},
        {"Sableye", "COSTUME2020", "", "", "", "pm302.fCOSTUME_2020.icon.png"},
        {"Sableye", "COSTUME2020", "", "", "S", "pm302.fCOSTUME_2020.s.icon.png"},
        {"Duskull", "FALL2022", "", "", "", "pm355.cFALL_2022_NOEVOLVE.icon.png"},
        {"Duskull", "FALL2022", "", "", "S", "pm355.cFALL_2022_NOEVOLVE.s.icon.png"},
        {"Dusclops", "FALL2022", "", "", "", "pm356.cFALL_2022_NOEVOLVE.icon.png"},
        {"Dusclops", "FALL2022", "", "", "S", "pm356.cFALL_2022_NOEVOLVE.s.icon.png"},
        {"Absol", "FALL2022", "", "", "", "pm359.cFALL_2022_NOEVOLVE.icon.png"},
        {"Absol", "FALL2022", "", "", "S", "pm359.cFALL_2022_NOEVOLVE.s.icon.png"},
        {"Vulpix", "FALL2022", "", "", "", "pm37.cFALL_2022.icon.png"},
        {"Vulpix", "FALL2022", "", "", "S", "pm37.cFALL_2022.s.icon.png"},
        {"Ninetales", "FALL2022", "", "", "", "pm38.cFALL_2022.icon.png"},
        {"Ninetales", "FALL2022", "", "", "S", "pm38.cFALL_2022.s.icon.png"},
        {"Piplup", "HALLOWEEN2021", "", "", "", "pm393.cHALLOWEEN_2021_NOEVOLVE.icon.png"},
        {"Piplup", "HALLOWEEN2021", "", "", "S", "pm393.cHALLOWEEN_2021_NOEVOLVE.s.icon.png"},
        {"Drifblim", "HALLOWEEN2021", "", "", "", "pm426.cHALLOWEEN_2021_NOEVOLVE.icon.png"},
        {"Drifblim", "HALLOWEEN2021", "", "", "S", "pm426.cHALLOWEEN_2021_NOEVOLVE.s.icon.png"},
        {"Dusknoir", "FALL2022", "", "", "", "pm477.cFALL_2022_NOEVOLVE.icon.png"},
        {"Dusknoir", "FALL2022", "", "", "S", "pm477.cFALL_2022_NOEVOLVE.s.icon.png"},
        {"Diglett", "FALL2022", "", "", "", "pm50.cFALL_2022.icon.png"},
        {"Diglett", "FALL2022", "", "", "S", "pm50.cFALL_2022.s.icon.png"},
        {"Dugtrio", "FALL2022", "", "", "", "pm51.cFALL_2022.icon.png"},
        {"Dugtrio", "FALL2022", "", "", "S", "pm51.cFALL_2022.s.icon.png"},
        {"Pumpkaboo", "FALL2022", "AVERAGE", "", "", "pm710.fAVERAGE.cFALL_2022.icon.png"},
        {"Pumpkaboo", "FALL2022", "AVERAGE", "", "S", "pm710.fAVERAGE.cFALL_2022.s.icon.png"},
        {"Pumpkaboo", "FALL2022", "LARGE", "", "", "pm710.fLARGE.cFALL_2022.icon.png"},
        {"Pumpkaboo", "FALL2022", "LARGE", "", "S", "pm710.fLARGE.cFALL_2022.s.icon.png"},
        {"Pumpkaboo", "FALL2022", "SMALL", "", "", "pm710.fSMALL.cFALL_2022.icon.png"},
        {"Pumpkaboo", "FALL2022", "SMALL", "", "S", "pm710.fSMALL.cFALL_2022.s.icon.png"},
        {"Pumpkaboo", "FALL2022", "SUPER", "", "", "pm710.fSUPER.cFALL_2022.icon.png"},
        {"Pumpkaboo", "FALL2022", "SUPER", "", "S", "pm710.fSUPER.cFALL_2022.s.icon.png"},
        {"Gourgeist", "FALL2022", "AVERAGE", "", "", "pm711.fAVERAGE.cFALL_2022.icon.png"},
        {"Gourgeist", "FALL2022", "AVERAGE", "", "S", "pm711.fAVERAGE.cFALL_2022.s.icon.png"},
        {"Gourgeist", "FALL2022", "LARGE", "", "", "pm711.fLARGE.cFALL_2022.icon.png"},
        {"Gourgeist", "FALL2022", "LARGE", "", "S", "pm711.fLARGE.cFALL_2022.s.icon.png"},
        {"Gourgeist", "FALL2022", "SMALL", "", "", "pm711.fSMALL.cFALL_2022.icon.png"},
        {"Gourgeist", "FALL2022", "SMALL", "", "S", "pm711.fSMALL.cFALL_2022.s.icon.png"},
        {"Gourgeist", "FALL2022", "SUPER", "", "", "pm711.fSUPER.cFALL_2022.icon.png"},
        {"Gourgeist", "FALL2022", "SUPER", "", "S", "pm711.fSUPER.cFALL_2022.s.icon.png"},
        {"Noibat", "HALLOWEEN2025", "", "", "", "pm714.cHALLOWEEN_2025.icon.png"},
        {"Noibat", "HALLOWEEN2025", "", "", "S", "pm714.cHALLOWEEN_2025.s.icon.png"},
        {"Noivern", "HALLOWEEN2025", "", "", "", "pm715.cHALLOWEEN_2025.icon.png"},
        {"Noivern", "HALLOWEEN2025", "", "", "S", "pm715.cHALLOWEEN_2025.s.icon.png"},
        {"Sinistea", "AHALLOWEEN202601", "", "", "", "pm854.fA_HALLOWEEN_2026_01.icon.png"},
        {"Sinistea", "AHALLOWEEN202601", "", "", "S", "pm854.fA_HALLOWEEN_2026_01.s.icon.png"},
        {"Sinistea", "PHALLOWEEN202601", "", "", "", "pm854.fP_HALLOWEEN_2026_01.icon.png"},
        {"Sinistea", "PHALLOWEEN202601", "", "", "S", "pm854.fP_HALLOWEEN_2026_01.s.icon.png"},
        {"Polteageist", "AHALLOWEEN202601", "", "", "", "pm855.fA_HALLOWEEN_2026_01.icon.png"},
        {"Polteageist", "AHALLOWEEN202601", "", "", "S", "pm855.fA_HALLOWEEN_2026_01.s.icon.png"},
        {"Polteageist", "PHALLOWEEN202601", "", "", "", "pm855.fP_HALLOWEEN_2026_01.icon.png"},
        {"Polteageist", "PHALLOWEEN202601", "", "", "S", "pm855.fP_HALLOWEEN_2026_01.s.icon.png"},
        {"Ursaluna", "HALLOWEEN2025", "", "", "", "pm901.cHALLOWEEN_2025.icon.png"},
        {"Ursaluna", "HALLOWEEN2025", "", "", "S", "pm901.cHALLOWEEN_2025.s.icon.png"},
        {"Gengar", "FALL2022", "", "", "", "pm94.cFALL_2022_NOEVOLVE.icon.png"},
        {"Gengar", "FALL2022", "", "", "S", "pm94.cFALL_2022_NOEVOLVE.s.icon.png"},
        {"Gengar", "COSTUME2020", "", "", "", "pm94.fCOSTUME_2020.icon.png"},
        {"Gengar", "COSTUME2020", "", "", "S", "pm94.fCOSTUME_2020.s.icon.png"},
    };
    static String exactCostumeAsset(String pokemon,boolean shiny){
        return exactCostumeAsset(pokemon,shiny,"");
    }
    static String exactCostumeAsset(String pokemon,boolean shiny,String gender){
        if(pokemon==null)return "";
        String value=pokemon.trim();
        int open=value.lastIndexOf('('),close=value.lastIndexOf(')');
        if(open<1||close<=open)return "";
        String base=value.substring(0,open).trim();
        String variant=value.substring(open+1,close).toUpperCase(Locale.ROOT)
            .replaceAll("[^A-Z0-9]","");
        // Costume must be identified by the actual text; no inference from
        // plain species or yearless "Halloween".
        String sex=gender==null?"":gender.trim().toUpperCase(Locale.ROOT);
        boolean female="♀".equals(sex)||"FEMALE".equals(sex)||"F".equals(sex);
        String[] selected=null;
        for(String[] row:HALLOWEEN_ART){
            if(!row[0].equalsIgnoreCase(base)||!variant.contains(row[1]))continue;
            if(!row[2].isEmpty()&&!variant.contains(row[2]))continue;
            if(shiny!=row[4].equals("S"))continue;
            if(row[3].equals("F")!=female)continue;
            selected=row;break;
        }
        // If an archive contains only sex-neutral artwork for this costume,
        // it is safe for either sex; NEVER guess a different costume/season.
        if(selected==null&&female){
            for(String[] row:HALLOWEEN_ART){
                if(row[0].equalsIgnoreCase(base)&&variant.contains(row[1])&&
                   (row[2].isEmpty()||variant.contains(row[2]))&&
                   row[3].isEmpty()&&shiny==row[4].equals("S")){
                    selected=row;break;
                }
            }
        }
        return selected==null?"":"pokemon-sprites/costumes/"+selected[5];
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
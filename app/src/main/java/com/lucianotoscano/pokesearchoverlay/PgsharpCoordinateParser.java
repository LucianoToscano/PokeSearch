package com.lucianotoscano.pokesearchoverlay;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Conservative, offline parser: accepts CURRENT player position only, never map destinations. */
public final class PgsharpCoordinateParser {
    private PgsharpCoordinateParser(){}
    // Coordinate must be accompanied by an explicit current-player label in the SAME accessible node.
    private static final Pattern PLAYER = Pattern.compile(
        "(?i)(?:current\\s+(?:player\\s+)?(?:location|position|coordinates|coords)|"+
        "player\\s+(?:location|position|coordinates|coords)|"+
        "my\\s+(?:location|position|coordinates|coords)|"+
        "(?:localiza[cç][aã]o|posi[cç][aã]o)\\s+atual\\s+(?:do\\s+(?:jogador|personagem))?)");
    private static final Pattern TARGET = Pattern.compile(
        "(?i)(?:destination|target|selected|teleport\\s+to|destino|selecionad[oa]|ir\\s+para)");
    private static final Pattern PAIR = Pattern.compile(
        "([-+]?\\d{1,2}(?:\\.\\d{1,9})?)\\s*[,;]\\s*([-+]?\\d{1,3}(?:\\.\\d{1,9})?)");
    private static final Pattern LABELED = Pattern.compile(
        "(?i)lat(?:itude)?\\s*[:=]\\s*([-+]?\\d{1,2}(?:\\.\\d{1,9})?)"+
        "\\s*[,;/ ]+\\s*(?:lon|lng|longitude)\\s*[:=]\\s*([-+]?\\d{1,3}(?:\\.\\d{1,9})?)");
    public static String parse(String text){
        if(text==null || text.length()>240 || !PLAYER.matcher(text).find() || TARGET.matcher(text).find())
            return "";
        Matcher m=LABELED.matcher(text);
        if(!m.find()){m=PAIR.matcher(text);if(!m.find())return "";}
        try{
            double latitude=Double.parseDouble(m.group(1)),longitude=Double.parseDouble(m.group(2));
            if(!Double.isFinite(latitude)||!Double.isFinite(longitude)||
                Math.abs(latitude)>90||Math.abs(longitude)>180)return "";
            return String.format(Locale.US,"%.7f,%.7f",latitude,longitude);
        }catch(RuntimeException ignored){return "";}
    }
}

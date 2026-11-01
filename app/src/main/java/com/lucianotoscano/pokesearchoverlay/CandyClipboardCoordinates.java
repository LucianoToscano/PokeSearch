package com.lucianotoscano.pokesearchoverlay;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Pure, no-network coordinate extraction shared by Candy clipboard flows.
 * Never use clipboard text as an API request until the user taps Apply.
 */
final class CandyClipboardCoordinates {
    private static final Pattern PAIR=Pattern.compile(
        "(?<![0-9.])([-+]?\\d{1,2}(?:\\.\\d+)?)\\s*[,;]\\s*"+
        "([-+]?\\d{1,3}(?:\\.\\d+)?)(?![0-9.])");
    private CandyClipboardCoordinates(){}

    static String extract(String input){
        if(input==null||input.length()>512)return "";
        Matcher matches=PAIR.matcher(input.replace('−','-'));
        String found="";
        while(matches.find()){
            String candidate=matches.group(1)+","+matches.group(2);
            if(CandyCooldownPolicy.parseCoordinates(candidate)==null)continue;
            if(!found.isEmpty()&&!found.equals(candidate))return ""; // ambiguity
            found=candidate;
        }
        return found;
    }
}

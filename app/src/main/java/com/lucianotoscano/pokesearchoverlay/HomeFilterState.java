package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;
import java.util.HashSet;
import java.util.Locale;

/** HOME and overlay read the same canonical filter preferences; the overlay remains
 * the only executor/validator of actual PoGoCoordinates searches. No remote API. */
public final class HomeFilterState {
    private HomeFilterState() {}
    public static final String PREFS="prefs";
    public static final String ACTION_CONFIG="com.lucianotoscano.pokesearchoverlay.HOME_CONFIG";
    public static final String ACTION_LOCATION="com.lucianotoscano.pokesearchoverlay.HOME_LOCATION";
    public static final String ACTION_SHINY="com.lucianotoscano.pokesearchoverlay.HOME_SHINY";
    public static final String ACTION_SYNC="com.lucianotoscano.pokesearchoverlay.HOME_SYNC";
    public static final String ACTION_SEARCH="com.lucianotoscano.pokesearchoverlay.HOME_SEARCH";
    public static final String ACTION_SUGGEST="com.lucianotoscano.pokesearchoverlay.HOME_SUGGEST";
    public static final String ACTION_EVENT="com.lucianotoscano.pokesearchoverlay.HOME_EVENT";

    public static JSONObject snapshot(Context context) {
        SharedPreferences p=context.getSharedPreferences(PREFS,0);
        JSONObject out=new JSONObject(),config=new JSONObject();
        try {
            String mode=p.getString("mode","raw");
            if(!mode.equals("raw")&&!mode.equals("percent")&&!mode.equals("gl")&&!mode.equals("ul"))mode="raw";
            out.put("mode",mode);
            config.put("mode",mode);
            config.put("attack",p.getInt("rawAttack",15));
            config.put("defense",p.getInt("rawDefense",15));
            config.put("stamina",p.getInt("rawStamina",15));
            config.put("glRank",p.getInt("glRank",1));
            config.put("ulRank",p.getInt("ulRank",1));
            config.put("percentMin",p.getInt("ivPercentMin",0));
            config.put("percentMax",p.getInt("ivPercentMax",100));
            JSONObject extra=new JSONObject(p.getString("extraFiltersJson","{}"));
            java.util.Iterator<String> keys=extra.keys();
            while(keys.hasNext()){String key=keys.next();config.put(key,extra.get(key));}
            if(!config.has("pokemonSelections"))config.put("pokemonSelections",new JSONArray());
            if(!config.has("includePreviousEvolutions"))config.put("includePreviousEvolutions",true);
            out.put("config",config);
            out.put("shinyRequested",p.getBoolean("shiny",false));
            out.put("locationEnabled",p.getBoolean("locationEnabled",false));
            out.put("locationCoords",p.getBoolean("locationEnabled",false)?p.getString("locationCoords",""):"");
            out.put("locationRadius",p.getBoolean("locationEnabled",false)?p.getInt("locationRadius",0):0);
            out.put("status",p.getString("lastStatus","Pronto para configurar filtros"));
            out.put("savedFilters",new JSONObject(p.getString("homeSavedFilters","{}")));
            out.put("overlayRunning",OverlayService.isRunning());
        }catch(Exception ignored){ /* malformed stored extras never crash Home */ }
        return out;
    }
    private static boolean percentValid(int value){
        for(int sum=0;sum<=45;sum++)if(Math.round(sum*100f/45f)==value)return true;
        return false;
    }
    public static boolean saveConfigIfStopped(Context c,String payload){
        if(OverlayService.isRunning())return false;
        try {
            JSONObject input=new JSONObject(payload);
            String mode=input.getString("mode");
            if(!mode.equals("raw")&&!mode.equals("percent")&&!mode.equals("gl")&&!mode.equals("ul"))return false;
            int a=input.getInt("attack"),d=input.getInt("defense"),s=input.getInt("stamina");
            int gl=input.getInt("glRank"),ul=input.getInt("ulRank");
            int min=input.getInt("percentMin"),max=input.getInt("percentMax");
            if(a<0||a>15||d<0||d>15||s<0||s>15||gl<1||gl>50||ul<1||ul>50||
                !percentValid(min)||!percentValid(max)||min>max)return false;
            SharedPreferences prefs=c.getSharedPreferences(PREFS,0);
            JSONObject old=new JSONObject(prefs.getString("extraFiltersJson","{}"));
            JSONObject extra=new JSONObject();
            JSONArray clears=new JSONArray();
            String[] names={"sortBy","pokemon","form","size","gender","weather","cpMin","cpMax","levelMin","levelMax","minPvpCp"};
            for(String key:names){
                String value=input.optString(key,"").trim();
                if(value.length()>100||value.matches("(?s).*[<>\\r\\n].*"))return false;
                if((key.equals("cpMin")||key.equals("cpMax")||key.equals("minPvpCp"))&&
                    !value.isEmpty()&&!value.matches("[0-9]{1,5}"))return false;
                if((key.equals("levelMin")||key.equals("levelMax"))&&
                    !value.isEmpty()&&!value.matches("[0-9]{1,2}(\\.[0-9])?"))return false;
                extra.put(key,value);
                if(value.isEmpty()&&!old.optString(key,"").isEmpty())clears.put(key);
            }
            for(String[] pair:new String[][]{{"cpMin","cpMax"},{"levelMin","levelMax"}}){
                String lo=extra.optString(pair[0]),hi=extra.optString(pair[1]);
                if(!lo.isEmpty()&&!hi.isEmpty()&&Double.parseDouble(lo)>Double.parseDouble(hi))return false;
            }
            JSONArray selection=input.optJSONArray("pokemonSelections");
            if(selection!=null){
                if(selection.length()>50)return false;
                JSONArray filtered=new JSONArray(); HashSet<String> seen=new HashSet<>();
                for(int i=0;i<selection.length();i++){
                    String label=selection.optString(i,"").trim();
                    if(label.isEmpty()||label.length()>90||label.matches("(?s).*[<>\\r\\n].*"))return false;
                    if(seen.add(label.toLowerCase(Locale.ROOT)))filtered.put(label);
                }
                extra.put("pokemonSelections",filtered);
                extra.put("pokemon","");
                JSONArray before=old.optJSONArray("pokemonSelections");
                if(selection.length()==0&&before!=null&&before.length()>0)clears.put("pokemonSelections");
                if(selection.length()==0&&input.optBoolean("clearPokemonSelection",false))clears.put("pokemonSelections");
            }
            JSONArray pending=old.optJSONArray("clearExtraKeys");
            if(pending!=null)for(int i=0;i<pending.length();i++){
                String k=pending.optString(i,"");
                if("pokemonSelections".equals(k)&&selection!=null&&selection.length()==0)clears.put(k);
                else if(extra.has(k)&&extra.optString(k,"").isEmpty())clears.put(k);
            }
            extra.put("clearExtraKeys",clears);
            extra.put("includePreviousEvolutions",input.optBoolean("includePreviousEvolutions",true));
            return prefs.edit().putString("mode",mode).putInt("rawAttack",a)
                .putInt("rawDefense",d).putInt("rawStamina",s).putInt("glRank",gl)
                .putInt("ulRank",ul).putInt("ivPercentMin",min).putInt("ivPercentMax",max)
                .putString("extraFiltersJson",extra.toString()).commit();
        }catch(Exception ignored){return false;}
    }
    public static boolean saveLocationIfStopped(Context c,boolean enabled,String coords,int radius){
        if(OverlayService.isRunning())return false;
        if(enabled){
            if(radius<0||radius>1000||coords==null||
                !coords.trim().matches("[-+]?(?:\\d{1,2})(?:\\.\\d+)?\\s*,\\s*[-+]?(?:\\d{1,3})(?:\\.\\d+)?"))return false;
            String[] split=coords.split(",");
            try{if(Math.abs(Double.parseDouble(split[0].trim()))>90||
                Math.abs(Double.parseDouble(split[1].trim()))>180)return false;}
            catch(Exception ignored){return false;}
        }
        SharedPreferences.Editor edit=c.getSharedPreferences(PREFS,0).edit()
            .putBoolean("locationEnabled",enabled);
        if(enabled)edit.putString("locationCoords",coords.trim()).putInt("locationRadius",radius);
        else edit.remove("locationCoords").remove("locationRadius");
        return edit.commit();
    }
}

package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONObject;

/** Experimental local capture checkpoint; never sent to a remote endpoint.
 * Keyed solely to a site-confirmed linked trainer ID. An unverified or switched
 * trainer cannot read the previous checkpoint. Both overlay services share it.
 */
final class CooldownCaptureStore {
    private static final String PREF="pokesearch-cooldown-v1";
    private CooldownCaptureStore(){}
    static String trainerScope(SharedPreferences session){
        if(!"linked".equals(session.getString("profileTrainerState","")))return "";
        String trainer=session.getString("profileTrainerCode","");
        return trainer.matches("[0-9]{12}")?trainer:"";
    }
    private static String slot(String scope){return "ref-"+scope;}
    private static String undoSlot(String scope){return "undo-"+scope;}
    private static boolean validCoordinates(String raw){
        if(raw==null||raw.length()>100)return false;
        java.util.regex.Matcher match=java.util.regex.Pattern.compile(
            "^\\s*([+-]?\\d{1,2}(?:\\.\\d+)?)\\s*,\\s*([+-]?\\d{1,3}(?:\\.\\d+)?)\\s*$").matcher(raw);
        if(!match.matches())return false;
        try{
            return Math.abs(Double.parseDouble(match.group(1)))<=90&&
                Math.abs(Double.parseDouble(match.group(2)))<=180;
        }catch(NumberFormatException ignored){return false;}
    }
    static JSONObject current(Context context,String scope){
        if(scope==null||!scope.matches("[0-9]{12}"))return new JSONObject();
        String raw=context.getSharedPreferences(PREF,Context.MODE_PRIVATE).getString(slot(scope),"");
        try{
            JSONObject value=new JSONObject(raw);
            if(!validCoordinates(value.optString("coords",""))||
                value.optLong("capturedAt",0)<=0||
                value.optLong("capturedAt")>System.currentTimeMillis()+60_000L||
                value.optString("captureKey","").isEmpty())return new JSONObject();
            return value;
        }catch(Exception ignored){return new JSONObject();}
    }
    static boolean record(Context context,String scope,String coords,String encounter,long capturedAt){
        if(scope==null||!scope.matches("[0-9]{12}")||
            !validCoordinates(coords)||encounter==null||encounter.isEmpty()||
            encounter.length()>200||capturedAt<=0)return false;
        JSONObject existing=current(context,scope);
        if(encounter.equals(existing.optString("captureKey","")))return false;
        try{
            JSONObject ref=new JSONObject();
            ref.put("coords",coords);
            ref.put("capturedAt",capturedAt);
            ref.put("captureKey",encounter);
            context.getSharedPreferences(PREF,Context.MODE_PRIVATE).edit()
                .putString(undoSlot(scope),existing.length()==0?"":existing.toString())
                .putString(slot(scope),ref.toString()).apply();
            return true;
        }catch(Exception ignored){return false;}
    }
    static boolean undo(Context context,String scope){
        if(scope==null||!scope.matches("[0-9]{12}"))return false;
        SharedPreferences p=context.getSharedPreferences(PREF,Context.MODE_PRIVATE);
        if(!p.contains(undoSlot(scope)))return false;
        String previous=p.getString(undoSlot(scope),"");
        SharedPreferences.Editor e=p.edit().remove(undoSlot(scope));
        if(previous.isEmpty())e.remove(slot(scope));
        else e.putString(slot(scope),previous);
        e.apply();return true;
    }
    static void reset(Context context,String scope){
        if(scope==null||!scope.matches("[0-9]{12}"))return;
        context.getSharedPreferences(PREF,Context.MODE_PRIVATE).edit()
            .remove(slot(scope)).remove(undoSlot(scope)).apply();
    }
    static JSONObject ui(Context context,String scope,boolean enabled){
        JSONObject state=new JSONObject();
        try{
            state.put("enabled",enabled);
            state.put("linked",scope!=null&&!scope.isEmpty());
            JSONObject ref=current(context,scope);
            if(ref.length()>0)state.put("reference",ref);
        }catch(Exception ignored){}
        return state;
    }
}

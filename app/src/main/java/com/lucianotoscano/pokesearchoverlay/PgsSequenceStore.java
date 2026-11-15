package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

/** LT367: sequências locais privadas e separadas por PGSharp/Pokemod. */
final class PgsSequenceStore {
    static final String KEY="steps", ORIENTATION="landscape", RUN_ENABLED="execution_consent";
    private PgsSequenceStore(){}

    static SharedPreferences prefs(Context c){
        String host=PgsAutoHostSettings.current(c);
        return c.getSharedPreferences("pgs_sequence_"+PgsAutoHostPolicy.profile(host)+
            "_v1",Context.MODE_PRIVATE);
    }
    static boolean landscape(Context c){
        return prefs(c).getBoolean(ORIENTATION,false);
    }
    static boolean canRun(Context c){
        return prefs(c).getBoolean(RUN_ENABLED,false);
    }
    static void setRunConsent(Context c,boolean enabled){
        prefs(c).edit().putBoolean(RUN_ENABLED,enabled).apply();
    }
    private static JSONObject json(PgsSequencePolicy.Step s) throws Exception{
        JSONObject o=new JSONObject();
        o.put("kind",s.type.name());o.put("x",s.x);o.put("y",s.y);
        o.put("endX",s.endX);o.put("endY",s.endY);
        o.put("gestureMs",s.gestureMs);o.put("waitMs",s.waitMs);
        o.put("modelId",s.modelId);o.put("modelName",s.modelName);
        return o;
    }
    private static PgsSequencePolicy.Step parse(JSONObject o) throws Exception{
        PgsSequencePolicy.Type kind=PgsSequencePolicy.Type.valueOf(o.getString("kind"));
        return new PgsSequencePolicy.Step(kind,
            (float)o.optDouble("x",Float.NaN),
            (float)o.optDouble("y",Float.NaN),
            (float)o.optDouble("endX",Float.NaN),
            (float)o.optDouble("endY",Float.NaN),
            o.getInt("gestureMs"),o.getInt("waitMs"),
            o.optString("modelId",""),o.optString("modelName",""));
    }
    static synchronized List<PgsSequencePolicy.Step> load(Context c){
        ArrayList<PgsSequencePolicy.Step> out=new ArrayList<>();
        try{
            JSONArray a=new JSONArray(prefs(c).getString(KEY,"[]"));
            if(a.length()>PgsSequencePolicy.MAX_STEPS)return out;
            for(int i=0;i<a.length();i++)out.add(parse(a.getJSONObject(i)));
            if(!out.isEmpty()&&!PgsSequencePolicy.validSequence(out))out.clear();
        }catch(Exception invalid){out.clear();}
        // Leitura inválida NUNCA apaga os dados persistidos.
        return out;
    }
    private static boolean save(Context c,List<PgsSequencePolicy.Step> steps,
        boolean landscape){
        if(steps==null||steps.size()>PgsSequencePolicy.MAX_STEPS||
            (!steps.isEmpty()&&!PgsSequencePolicy.validSequence(steps)))return false;
        try{
            JSONArray a=new JSONArray();
            for(PgsSequencePolicy.Step s:steps)a.put(json(s));
            return prefs(c).edit().putString(KEY,a.toString())
                .putBoolean(ORIENTATION,landscape).commit();
        }catch(Exception invalid){return false;}
    }
    static synchronized boolean add(Context c,PgsSequencePolicy.Step step,
        boolean landscape){
        if(step==null||PgsAutoHostPolicy.OTHER.equals(
            PgsAutoHostSettings.current(c)))return false;
        List<PgsSequencePolicy.Step> items=load(c);
        if(!items.isEmpty()&&landscape(c)!=landscape)return false;
        items.add(step);
        return save(c,items,landscape);
    }
    static synchronized boolean replace(Context c,int index,
        PgsSequencePolicy.Step step){
        List<PgsSequencePolicy.Step> items=load(c);
        if(index<0||index>=items.size()||step==null)return false;
        items.set(index,step);
        return save(c,items,landscape(c));
    }
    static synchronized boolean move(Context c,int index,int delta){
        List<PgsSequencePolicy.Step> items=load(c);
        int next=index+delta;
        if(index<0||next<0||index>=items.size()||next>=items.size())return false;
        java.util.Collections.swap(items,index,next);
        return save(c,items,landscape(c));
    }
    /** Mover etapa ao destino em uma única gravação validada (LT369). */
    static synchronized boolean moveTo(Context c,int from,int target){
        List<PgsSequencePolicy.Step> list=load(c);
        if(from<0||target<0||from>=list.size()||target>=list.size())
            return false;
        if(from==target)return true;
        PgsSequencePolicy.Step step=list.remove(from);
        list.add(target,step);
        return save(c,list,landscape(c));
    }
    static synchronized boolean delete(Context c,int index){
        List<PgsSequencePolicy.Step> items=load(c);
        if(index<0||index>=items.size())return false;
        items.remove(index);
        return save(c,items,landscape(c));
    }
    static synchronized boolean clear(Context c){
        return save(c,new ArrayList<>(),false);
    }
    static synchronized boolean copy(Context c,int index){
        List<PgsSequencePolicy.Step> list=load(c);
        if(index<0||index>=list.size())return false;
        try{
            return prefs(c).edit().putString("copied_step",
                json(list.get(index)).toString()).commit();
        }catch(Exception e){return false;}
    }
    static synchronized boolean paste(Context c,boolean landscape){
        try{
            String clipboard=prefs(c).getString("copied_step","");
            if(clipboard==null||clipboard.isEmpty())return false;
            return add(c,parse(new JSONObject(clipboard)),landscape);
        }catch(Exception e){return false;}
    }
    static synchronized boolean changeWait(Context c,int index,int value){
        List<PgsSequencePolicy.Step> steps=load(c);
        if(index<0||index>=steps.size())return false;
        try{return replace(c,index,steps.get(index).withWait(value));}
        catch(IllegalArgumentException e){return false;}
    }
    static synchronized boolean changeGesture(Context c,int index,int value){
        List<PgsSequencePolicy.Step> steps=load(c);
        if(index<0||index>=steps.size())return false;
        try{return replace(c,index,steps.get(index).withGesture(value));}
        catch(IllegalArgumentException e){return false;}
    }
    static synchronized boolean changePoint(Context c,int index,float x,float y,
        boolean destination){
        List<PgsSequencePolicy.Step> steps=load(c);
        if(index<0||index>=steps.size())return false;
        PgsSequencePolicy.Step old=steps.get(index);
        if(old.type!=PgsSequencePolicy.Type.TAP&&
            old.type!=PgsSequencePolicy.Type.SWIPE)return false;
        if(destination&&old.type!=PgsSequencePolicy.Type.SWIPE)return false;
        try{return replace(c,index,old.withPoint(x,y,destination));}
        catch(IllegalArgumentException e){return false;}
    }
}

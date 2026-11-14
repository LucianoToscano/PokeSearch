package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/** Offline Pokemon list from the owner's PokeSearch repository.
 * The selected species are a SEARCH PREFERENCE. An image template must still be
 * taught before a species can actually be recognized in the PGSharp feed.
 */
final class PgsAutoCatalog {
    static final int MAX_SELECTED=10;
    static final class Pokemon {
        final int number;
        final String name;
        Pokemon(int n,String s){number=n;name=s;}
        String label(){return String.format(Locale.ROOT,"#%03d  %s",number,name);}
    }
    private static List<Pokemon> cached;
    private static final String PREFS="pgs_buscas_auto_v1";
    private static final String KEY="species";
    static String normalize(String s){
        if(s==null)return "";
        String base=Normalizer.normalize(s.toLowerCase(Locale.ROOT),Normalizer.Form.NFD);
        return base.replaceAll("\\p{M}","").replaceAll("[^a-z0-9]","");
    }
    static synchronized List<Pokemon> all(Context ctx){
        if(cached!=null)return cached;
        ArrayList<Pokemon> list=new ArrayList<>();
        try(InputStream in=ctx.getAssets().open("pokemon_catalog.json")){
            ByteArrayOutputStream output=new ByteArrayOutputStream();
            byte[] buf=new byte[4096];int n;
            while((n=in.read(buf))!=-1)output.write(buf,0,n);
            JSONArray root=new JSONArray(output.toString("UTF-8"));
            for(int i=0;i<root.length();i++){
                JSONArray row=root.optJSONArray(i);
                if(row==null||row.length()<2)continue;
                int number=row.optInt(0,-1);
                String name=row.optString(1,"");
                if(number>0 && !name.isEmpty())list.add(new Pokemon(number,name));
            }
        }catch(Exception ignored){}
        cached=Collections.unmodifiableList(list);
        return cached;
    }
    static synchronized List<Integer> selected(Context ctx){
        SharedPreferences prefs=ctx.getSharedPreferences(PREFS,Context.MODE_PRIVATE);
        if(!prefs.contains(KEY)){
            ArrayList<Integer> defaults=new ArrayList<>();
            for(PgsAutoTemplateStore.Model m:PgsAutoTemplateStore.active(ctx)){
                int id=findNumber(ctx,m.name);
                if(id>0&&!defaults.contains(id))defaults.add(id);
            }
            persist(ctx,defaults);
            return defaults;
        }
        ArrayList<Integer> result=new ArrayList<>();
        try{
            JSONArray saved=new JSONArray(prefs.getString(KEY,"[]"));
            // LT344: preservar o cadastro antigo de até 50 IDs em backup
            // antes de restringir a lista ativa aos 10 primeiros.
            if(saved.length()>MAX_SELECTED &&
                !prefs.contains("species_legacy_backup_lt344"))
                prefs.edit().putString("species_legacy_backup_lt344",saved.toString()).apply();
            for(int i=0;i<saved.length();i++){
                int number=saved.optInt(i,-1);
                if(number>0 && !result.contains(number) && result.size()<MAX_SELECTED)result.add(number);
            }
        }catch(Exception ignored){}
        return result;
    }
    private static void persist(Context ctx,List<Integer> nums){
        JSONArray a=new JSONArray();
        for(int number:nums)a.put(number);
        ctx.getSharedPreferences(PREFS,Context.MODE_PRIVATE).edit().putString(KEY,a.toString()).apply();
    }
    static synchronized boolean toggle(Context ctx,int number){
        ArrayList<Integer> nums=new ArrayList<>(selected(ctx));
        boolean chosen;
        if(nums.contains(number)){nums.remove(Integer.valueOf(number));chosen=false;}
        else{
            if(nums.size()>=MAX_SELECTED)return false;
            nums.add(number);chosen=true;
        }
        persist(ctx,nums);
        for(PgsAutoTemplateStore.Model m:PgsAutoTemplateStore.list(ctx)){
            if(findNumber(ctx,m.name)==number)PgsAutoTemplateStore.setEnabled(ctx,m.id,chosen);
        }
        return chosen;
    }
    static synchronized void clear(Context ctx){
        persist(ctx,Collections.emptyList());
        for(PgsAutoTemplateStore.Model m:PgsAutoTemplateStore.list(ctx))PgsAutoTemplateStore.setEnabled(ctx,m.id,false);
    }
    static synchronized void move(Context ctx,int number,int dir){
        ArrayList<Integer> nums=new ArrayList<>(selected(ctx));
        int i=nums.indexOf(number),j=i+dir;
        if(i>=0&&j>=0&&j<nums.size()){
            Collections.swap(nums,i,j);persist(ctx,nums);
        }
    }
    static boolean isSelected(Context ctx,int number){return selected(ctx).contains(number);}
    static boolean isSelectedName(Context ctx,String name){
        int id=findNumber(ctx,name);
        if(id>0)return isSelected(ctx,id);
        // Backward compatible: a manually taught nickname without a Pokédex
        // number remains recognized if its legacy checkbox is enabled.
        for(PgsAutoTemplateStore.Model m:PgsAutoTemplateStore.active(ctx))
            if(normalize(m.name).equals(normalize(name)))return true;
        return false;
    }
    static int priority(Context ctx,String name){
        int id=findNumber(ctx,name);
        int index=selected(ctx).indexOf(id);
        return index<0?Integer.MAX_VALUE:index;
    }
    static int findNumber(Context ctx,String name){
        String key=normalize(name.replaceAll("(?i)\\s*\\(amostra\\s*\\d+\\)",""));
        for(Pokemon p:all(ctx))if(normalize(p.name).equals(key))return p.number;
        return -1;
    }
    static boolean hasTemplate(Context ctx,int number){
        for(PgsAutoTemplateStore.Model m:PgsAutoTemplateStore.list(ctx))
            if(findNumber(ctx,m.name)==number)return true;
        return false;
    }
    static List<Pokemon> search(Context ctx,String query,int max){
        String q=normalize(query);
        List<Pokemon> found=new ArrayList<>();
        if(q.isEmpty()){
            List<Integer> selected=selected(ctx);
            for(int id:selected)for(Pokemon p:all(ctx))if(p.number==id){found.add(p);break;}
            return found;
        }
        for(Pokemon p:all(ctx)){
            if(normalize(p.name).contains(q)||String.valueOf(p.number).startsWith(q)){
                found.add(p);if(found.size()>=max)break;
            }
        }
        return found;
    }
}

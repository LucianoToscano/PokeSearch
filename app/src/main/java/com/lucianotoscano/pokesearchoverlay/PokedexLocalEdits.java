package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;

/**
 * LT402: non-destructive, per-slot local editing layer for the personal Pokédex.
 * Data never leaves private app storage. Importing newer PGSStats replays the
 * user's personal changes without modifying the PGSharp file or Pokémon GO.
 */
final class PokedexLocalEdits {
    private static final int LIMIT=24*1024*1024;
    private PokedexLocalEdits(){}

    private static File dir(Context ctx){return new File(ctx.getFilesDir(),"pokedex_personal");}
    private static File file(Context ctx,int slot,String suffix){
        return new File(dir(ctx),"slot"+(slot==2?2:1)+suffix+".json");
    }
    static JSONObject read(File f) throws Exception {
        if(!f.isFile())return new JSONObject();
        if(f.length()>LIMIT)throw new IllegalArgumentException("Inventário excede o limite local.");
        byte[] bytes=new byte[(int)f.length()];
        try(FileInputStream in=new FileInputStream(f)){
            int pos=0,n;
            while(pos<bytes.length&&(n=in.read(bytes,pos,bytes.length-pos))>0)pos+=n;
            if(pos!=bytes.length)throw new IllegalArgumentException("Leitura incompleta.");
        }
        return new JSONObject(new String(bytes,StandardCharsets.UTF_8));
    }
    static void write(File f,JSONObject obj) throws Exception {
        byte[] bytes=obj.toString().getBytes(StandardCharsets.UTF_8);
        if(bytes.length>LIMIT)throw new IllegalArgumentException("Inventário excede 24 MB.");
        File d=f.getParentFile();
        if(!d.isDirectory()&&!d.mkdirs())throw new IllegalArgumentException("Armazenamento indisponível.");
        File tmp=new File(d,f.getName()+".pending");
        try(FileOutputStream out=new FileOutputStream(tmp)){
            out.write(bytes);out.getFD().sync();
        }
        if(!tmp.renameTo(f))throw new IllegalArgumentException("Falha ao salvar os dados.");
    }
    private static JSONObject object(JSONObject o,String k){
        JSONObject v=o.optJSONObject(k);
        if(v==null){v=new JSONObject();try{o.put(k,v);}catch(Exception ignored){}}
        return v;
    }
    private static JSONArray array(JSONObject o,String k){
        JSONArray v=o.optJSONArray(k);
        if(v==null){v=new JSONArray();try{o.put(k,v);}catch(Exception ignored){}}
        return v;
    }
    private static JSONArray removeValue(JSONArray a,String id) {
        JSONArray b=new JSONArray();
        for(int i=0;i<a.length();i++)if(!id.equals(a.optString(i)))b.put(a.opt(i));
        return b;
    }
    private static boolean includes(JSONArray a,String id){
        for(int i=0;i<a.length();i++)if(id.equals(a.optString(i)))return true;
        return false;
    }
    private static boolean id(String s){return s!=null&&s.matches("[0-9]{1,20}");}
    private static JSONObject find(JSONArray rows,String id){
        for(int i=0;i<rows.length();i++){
            JSONObject p=rows.optJSONObject(i);
            if(p!=null&&id.equals(p.optString("id")))return p;
        }
        return null;
    }
    private static JSONArray without(JSONArray rows,Set<String> ids) {
        JSONArray result=new JSONArray();
        for(int i=0;i<rows.length();i++){
            JSONObject p=rows.optJSONObject(i);
            if(p!=null&&!ids.contains(p.optString("id")))result.put(p);
        }
        return result;
    }
    private static void updateCount(JSONObject doc) throws Exception{
        doc.put("count",array(doc,"pokemons").length());
    }
    private static String label(Object v,int max){
        String s=String.valueOf(v==null?"":v).trim();
        if(s.length()>max)s=s.substring(0,max);
        return s.replaceAll("[\\p{Cntrl}&&[^\\n]]"," ");
    }
    private static int bounded(JSONObject data,String key,int lo,int hi){
        int n=data.optInt(key,lo);
        if(n<lo||n>hi)throw new IllegalArgumentException("Valor inválido para "+key+".");
        return n;
    }
    private static JSONObject sanitized(JSONObject fields,JSONObject base) throws Exception{
        JSONObject out=new JSONObject();
        for(String key:fields.keySet()){
            if("nickname".equals(key)){out.put(key,label(fields.optString(key),64));continue;}
            if("favorite".equals(key)||"bestBuddy".equals(key)){
                Object val=fields.opt(key);
                if(!(val instanceof Boolean))throw new IllegalArgumentException("Opção inválida: "+key);
                out.put(key,val);continue;
            }
            if("cp".equals(key)||"stamina".equals(key)||"maxStamina".equals(key)||
                "buddyHearts".equals(key)||"attack".equals(key)||"defense".equals(key)||
                "hpIv".equals(key)||"move1".equals(key)||"move2".equals(key)||"move3".equals(key)){
                int high=key.equals("buddyHearts")?300:
                    (key.equals("attack")||key.equals("defense")||key.equals("hpIv"))?15:
                    key.startsWith("move")?100000:99999;
                out.put(key,bounded(fields,key,0,high));continue;
            }
            if("tags".equals(key)){
                JSONArray tags=fields.optJSONArray(key);
                if(tags==null||tags.length()>60)throw new IllegalArgumentException("Tags inválidas.");
                JSONArray valid=new JSONArray();Set<String> seen=new HashSet<>();
                for(int i=0;i<tags.length();i++){
                    String tag=label(tags.optString(i),40);
                    if(!tag.isEmpty()&&seen.add(tag))valid.put(tag);
                }
                out.put(key,valid);continue;
            }
            throw new IllegalArgumentException("Campo não editável: "+key);
        }
        return out;
    }
    private static void overlay(JSONObject target,JSONObject changes)throws Exception{
        for(String k:changes.keySet())target.put(k,changes.opt(k));
    }
    private static JSONObject newPokemon(String id,int species) throws Exception {
        JSONObject p=new JSONObject();
        p.put("id",id);p.put("species",species);p.put("manual",true);
        p.put("nickname","");p.put("cp",0);p.put("attack",0);p.put("defense",0);
        p.put("hpIv",0);p.put("stamina",0);p.put("maxStamina",0);
        p.put("heightM",0);p.put("weightKg",0);p.put("favorite",false);
        p.put("hasMegaEvolved",false);p.put("megaFormsCount",0);p.put("megaLevel",0);
        p.put("hatchedFromEgg",false);p.put("buddyKm",0);p.put("buddyHearts",0);
        p.put("bestBuddy",false);p.put("lucky",false);p.put("shiny",false);
        p.put("alignment",0);p.put("form",0);p.put("formName","");
        p.put("costume",0);p.put("gender",0);p.put("size",0);p.put("pokeball",0);
        p.put("breadMode",0);p.put("events",new JSONArray());
        p.put("move1",0);p.put("move2",0);p.put("move3",0);
        p.put("caughtMs",System.currentTimeMillis());p.put("traded",false);
        p.put("backgroundId",0);p.put("tags",new JSONArray());
        return p;
    }
    private static String newId(JSONArray rows){
        long millis=System.currentTimeMillis();
        for(int i=0;i<10000;i++){
            String key="98"+millis+String.format(java.util.Locale.ROOT,"%04d",i);
            if(find(rows,key)==null)return key;
        }
        throw new IllegalArgumentException("Não foi possível gerar um ID local.");
    }
    private static JSONArray uniqueIds(JSONArray a){
        JSONArray out=new JSONArray();Set<String> seen=new HashSet<>();
        if(a!=null)for(int i=0;i<Math.min(a.length(),10000);i++){
            String v=a.optString(i);
            if(id(v)&&seen.add(v))out.put(v);
        }
        return out;
    }
    private static JSONArray tagsWithout(JSONArray tags,String id){
        JSONArray out=new JSONArray();
        for(int i=0;i<tags.length();i++){
            JSONObject row=tags.optJSONObject(i);
            if(row!=null&&!id.equals(row.optString("id")))out.put(row);
        }
        return out;
    }
    /** Replay personal edits on a fresh PGSharp export; source remains untouched. */
    static synchronized JSONObject replay(Context ctx,int slot,JSONObject imported) throws Exception{
        JSONObject local=read(file(ctx,slot,"-local"));
        JSONObject edits=object(local,"edits"),added=object(local,"added");
        JSONObject deleted=object(local,"deleted");
        JSONArray rows=array(imported,"pokemons"),merged=new JSONArray();
        Set<String> ids=new HashSet<>();
        for(int i=0;i<rows.length();i++){
            JSONObject row=rows.optJSONObject(i);
            if(row==null)continue;
            String key=row.optString("id");
            if(deleted.has(key))continue;
            JSONObject patch=edits.optJSONObject(key);
            if(patch!=null)overlay(row,patch);
            if(ids.add(key))merged.put(row);
        }
        for(String key:added.keySet()){
            JSONObject row=added.optJSONObject(key);
            if(row!=null&&!deleted.has(key)&&ids.add(key))merged.put(row);
        }
        imported.put("pokemons",merged);updateCount(imported);
        JSONObject tagNames=object(local,"tagNames"),deletedTags=object(local,"deletedTags");
        JSONArray tags=array(imported,"tags"),mergedTags=new JSONArray();
        Set<String> known=new HashSet<>();
        for(int i=0;i<tags.length();i++){
            JSONObject row=tags.optJSONObject(i);if(row==null)continue;
            String key=row.optString("id");
            if(deletedTags.has(key))continue;
            if(tagNames.has(key))row.put("name",tagNames.optString(key));
            mergedTags.put(row);known.add(key);
        }
        for(String key:tagNames.keySet()){
            if(known.contains(key)||deletedTags.has(key))continue;
            JSONObject row=new JSONObject();row.put("id",key);
            row.put("name",tagNames.optString(key));mergedTags.put(row);
        }
        imported.put("tags",mergedTags);
        return imported;
    }
    static synchronized String execute(Context ctx,int slot,String action,String raw){
        try{
            if(raw==null||raw.length()>1000000)
                throw new IllegalArgumentException("Solicitação grande demais.");
            JSONObject request=new JSONObject(raw);
            JSONObject current=read(file(ctx,slot,""));
            JSONObject local=read(file(ctx,slot,"-local"));
            JSONArray rows=array(current,"pokemons"),tags=array(current,"tags");
            JSONObject edits=object(local,"edits"),added=object(local,"added");
            JSONObject deleted=object(local,"deleted"),trash=object(local,"trash");
            JSONObject names=object(local,"tagNames"),removedTags=object(local,"deletedTags");
            String responseId="";
            if("add".equals(action)){
                if(rows.length()>=10000)throw new IllegalArgumentException("Capacidade local de 10.000.");
                int species=bounded(request,"species",1,1025);
                responseId=newId(rows);
                JSONObject row=newPokemon(responseId,species);
                JSONObject fields=sanitized(request.optJSONObject("fields")==null?
                    new JSONObject():request.getJSONObject("fields"),row);
                overlay(row,fields);rows.put(row);added.put(responseId,row);
            }else if("edit".equals(action)){
                String key=request.optString("id");
                JSONObject row=id(key)?find(rows,key):null;
                if(row==null)throw new IllegalArgumentException("Pokémon não encontrado.");
                JSONObject patch=sanitized(request.getJSONObject("fields"),row);
                overlay(row,patch);
                if(added.has(key))added.put(key,row);
                else {
                    JSONObject existing=object(edits,key);
                    overlay(existing,patch);
                }
                responseId=key;
            }else if("delete".equals(action)||"clear".equals(action)){
                JSONArray keys="clear".equals(action)?new JSONArray():uniqueIds(request.optJSONArray("ids"));
                if("clear".equals(action))for(int i=0;i<rows.length();i++)
                    keys.put(rows.getJSONObject(i).optString("id"));
                if(keys.length()==0)throw new IllegalArgumentException("Nenhum Pokémon selecionado.");
                Set<String> selection=new HashSet<>();
                JSONArray last=new JSONArray();
                for(int i=0;i<keys.length();i++){
                    String key=keys.optString(i);JSONObject p=find(rows,key);
                    if(p==null||!selection.add(key))continue;
                    trash.put(key,new JSONObject(p.toString()));
                    deleted.put(key,true);last.put(key);
                }
                if(last.length()==0)throw new IllegalArgumentException("Nenhum Pokémon encontrado.");
                rows=without(rows,selection);local.put("lastDelete",last);
            }else if("undo".equals(action)){
                JSONArray last=array(local,"lastDelete");
                if(last.length()==0)throw new IllegalArgumentException("Não há exclusão para desfazer.");
                for(int i=0;i<last.length();i++){
                    String key=last.optString(i);
                    JSONObject old=trash.optJSONObject(key);
                    if(old!=null&&find(rows,key)==null)rows.put(old);
                    deleted.remove(key);trash.remove(key);
                }
                local.put("lastDelete",new JSONArray());
            }else if("tagSave".equals(action)){
                String key=request.optString("id","");
                String name=label(request.optString("name"),45);
                if(name.isEmpty())throw new IllegalArgumentException("Informe o nome da tag.");
                if(key.isEmpty())key="local-tag-"+System.currentTimeMillis();
                if(key.length()>40||key.contains("\""))throw new IllegalArgumentException("Tag inválida.");
                responseId=key;
                names.put(key,name);removedTags.remove(key);
                boolean found=false;
                for(int i=0;i<tags.length();i++){
                    JSONObject t=tags.optJSONObject(i);
                    if(t!=null&&key.equals(t.optString("id"))){t.put("name",name);found=true;break;}
                }
                if(!found){JSONObject t=new JSONObject();t.put("id",key);t.put("name",name);tags.put(t);}
            }else if("tagDelete".equals(action)){
                String key=request.optString("id");
                if(key.isEmpty())throw new IllegalArgumentException("Tag inválida.");
                removedTags.put(key,true);names.remove(key);
                tags=tagsWithout(tags,key);
                for(int i=0;i<rows.length();i++){
                    JSONObject p=rows.optJSONObject(i);if(p==null)continue;
                    JSONArray old=p.optJSONArray("tags");if(old==null||!includes(old,key))continue;
                    JSONArray fresh=removeValue(old,key);p.put("tags",fresh);
                    if(added.has(p.optString("id")))added.put(p.optString("id"),p);
                    else object(edits,p.optString("id")).put("tags",fresh);
                }
            }else if("tagAssign".equals(action)){
                String key=request.optString("id");
                boolean exists=false;
                for(int i=0;i<tags.length();i++)
                    if(key.equals(tags.optJSONObject(i)==null?"":tags.optJSONObject(i).optString("id")))exists=true;
                if(!exists)throw new IllegalArgumentException("Tag inexistente.");
                JSONArray ids=uniqueIds(request.optJSONArray("ids"));
                boolean enable=request.optBoolean("enable",true);
                for(int i=0;i<ids.length();i++){
                    JSONObject p=find(rows,ids.optString(i));if(p==null)continue;
                    JSONArray old=array(p,"tags");
                    if(enable&&!includes(old,key))old.put(key);
                    if(!enable)old=removeValue(old,key);
                    p.put("tags",old);
                    if(added.has(p.optString("id")))added.put(p.optString("id"),p);
                    else object(edits,p.optString("id")).put("tags",old);
                }
            }else throw new IllegalArgumentException("Operação desconhecida.");
            current.put("pokemons",rows);current.put("tags",tags);updateCount(current);
            // Edits persist separately and can be replayed on every future import.
            write(file(ctx,slot,"-local"),local);
            write(file(ctx,slot,""),current);
            JSONObject result=new JSONObject();result.put("ok",true);
            result.put("id",responseId);result.put("count",rows.length());
            return result.toString();
        }catch(Exception e){
            JSONObject result=new JSONObject();
            try{result.put("ok",false);result.put("error",label(e.getMessage(),180));}
            catch(Exception ignored){}
            return result.toString();
        }
    }
}

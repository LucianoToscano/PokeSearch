package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Modelos locais escolhidos pelo usuário. Não lê dados do jogo ou da rede. */
final class PgsAutoTemplateStore {
    static final String PREF = "pgs_buscas_auto_models_v1";
    static final String KEY = "models";
    static final String PENDING = "pending_name";
    private static final String PENDING_REPLACE = "pending_replace_id";
    static final int WIDTH = 68, HEIGHT = 52, MAX_SAMPLES = 50;
    static final class Model {
        String id, name, file;
        boolean enabled, builtIn;
        Model(String id,String name,String file,boolean enabled,boolean builtIn) {
            this.id=id;this.name=name;this.file=file;this.enabled=enabled;this.builtIn=builtIn;
        }
    }
    private static SharedPreferences preferences(Context c) {
        return c.getSharedPreferences(PREF, Context.MODE_PRIVATE);
    }
    static synchronized List<Model> list(Context c) {
        SharedPreferences p=preferences(c);
        if (!p.contains(KEY)) {
            ArrayList<Model> defaults=new ArrayList<>();


            persist(c,defaults);
            return defaults;
        }
        ArrayList<Model> result=new ArrayList<>();
        try {
            JSONArray data=new JSONArray(p.getString(KEY,"[]"));
            for(int i=0;i<data.length();i++) {
                JSONObject obj=data.getJSONObject(i);
                result.add(new Model(obj.getString("id"),obj.getString("name"),obj.getString("file"),
                    obj.optBoolean("enabled",true),obj.optBoolean("builtIn",false)));
            }
        } catch(Exception e) {
            // Falha fechada: não clicar em Pokémon diferentes por engano.
            return new ArrayList<>();
        }
        return result;
    }
    static synchronized List<Model> active(Context c) {
        List<Model> selected=new ArrayList<>();
        for(Model m:list(c))if(m.enabled)selected.add(m);
        return selected;
    }
    static synchronized void setEnabled(Context c,String id,boolean enabled) {
        List<Model> models=list(c);
        for(Model m:models)if(m.id.equals(id))m.enabled=enabled;
        persist(c,models);
    }
    /** A ordem da lista é a prioridade: o primeiro modelo ativo vence. */
    static synchronized void move(Context c,String id,int direction){
        List<Model> models=list(c);
        for(int i=0;i<models.size();i++)if(models.get(i).id.equals(id)){
            int other=i+direction;
            if(other<0||other>=models.size())return;
            java.util.Collections.swap(models,i,other);
            persist(c,models);
            return;
        }
    }
    /** Não reescreve a estrutura antiga nem elimina amostras cadastradas. */
    static synchronized int countUserModels(Context c){
        int count=0;
        for(Model m:list(c))if(!m.builtIn)count++;
        return count;
    }

    static synchronized void delete(Context c,String id) {
        List<Model> models=list(c);
        for(int i=models.size()-1;i>=0;i--)if(models.get(i).id.equals(id)) {
            Model m=models.get(i);
            if(!m.builtIn) {
                new File(c.getFilesDir(),m.file).delete();
                models.remove(i);
            }
        }
        persist(c,models);
    }
    static synchronized void saveSample(Context c,String name,Bitmap cropped) throws IOException {
        List<Model> models=list(c);
        int count=0;for(Model m:models)if(!m.builtIn)count++;
        if(count>=MAX_SAMPLES)throw new IOException("Limite de 50 modelos adicionados; exclua um para continuar.");
        String file="pokemon_"+UUID.randomUUID().toString()+".png";
        File target=new File(c.getFilesDir(),file);
        try(FileOutputStream out=new FileOutputStream(target)) {
            if(!cropped.compress(Bitmap.CompressFormat.PNG,100,out))throw new IOException("Não foi possível salvar a imagem.");
        } catch(IOException err) {target.delete();throw err;}
        models.add(new Model(file,name.trim(),file,true,false));
        persist(c,models);
    }
    /** Substitui uma amostra por ID, mantendo o registro e a prioridade.
     * Salva o novo PNG antes de excluir o antigo: cancelamento não perde modelo.
     * Também funciona quando o limite de 50 imagens já foi atingido.
     */
    static synchronized void replaceSample(Context c,String id,String name,Bitmap cropped)
        throws IOException {
        List<Model> models=list(c);
        Model original=null;
        for(Model m:models)if(m.id.equals(id)&&!m.builtIn){original=m;break;}
        if(original==null)throw new IOException("Ícone original não encontrado.");
        String file="pokemon_"+UUID.randomUUID().toString()+".png";
        File output=new File(c.getFilesDir(),file);
        try(FileOutputStream stream=new FileOutputStream(output)){
            if(!cropped.compress(Bitmap.CompressFormat.PNG,100,stream))
                throw new IOException("Falha ao gravar nova imagem.");
        }catch(IOException error){output.delete();throw error;}
        String previous=original.file;
        original.file=file;
        original.name=name.trim();
        original.enabled=true;
        persist(c,models);
        new File(c.getFilesDir(),previous).delete();
    }
    /** Restaura uma amostra de um backup sem sobrescrever qualquer modelo atual. */
    static synchronized boolean restoreSample(Context c,String originalId,String name,
                                              Bitmap image,boolean enabled) throws IOException {
        if(originalId==null||!originalId.matches("[A-Za-z0-9_.-]{1,100}"))
            throw new IOException("Identificador inválido no backup.");
        if(name==null||name.trim().isEmpty()||name.length()>80)
            throw new IOException("Nome inválido no backup.");
        List<Model> models=list(c);
        int count=0;
        for(Model m:models){
            if(m.id.equals(originalId))return false;
            if(!m.builtIn)count++;
        }
        if(count>=MAX_SAMPLES)throw new IOException("Limite de modelos atingido: 50.");
        String file="pokemon_"+UUID.randomUUID().toString()+".png";
        File target=new File(c.getFilesDir(),file);
        Bitmap scaled=Bitmap.createScaledBitmap(image,WIDTH,HEIGHT,true);
        try(FileOutputStream out=new FileOutputStream(target)){
            if(!scaled.compress(Bitmap.CompressFormat.PNG,100,out))
                throw new IOException("Falha ao gravar imagem restaurada.");
        }catch(IOException error){target.delete();throw error;}
        finally{if(scaled!=image)scaled.recycle();}
        models.add(new Model(originalId,name.trim(),file,enabled,false));
        persist(c,models);
        return true;
    }
    static Bitmap decode(Context c,Model model) throws IOException {
        Bitmap bmp;
        if(model.builtIn) {
            try(InputStream in=c.getAssets().open(model.file)) {bmp=BitmapFactory.decodeStream(in);}
        } else bmp=BitmapFactory.decodeFile(new File(c.getFilesDir(),model.file).getAbsolutePath());
        if(bmp==null)throw new IOException("Imagem não encontrada: "+model.name);
        Bitmap scaled=Bitmap.createScaledBitmap(bmp,WIDTH,HEIGHT,true);
        if(scaled!=bmp)bmp.recycle();
        return scaled;
    }
    private static void persist(Context c,List<Model> models) {
        JSONArray arr=new JSONArray();
        try {
            for(Model m:models) {
                JSONObject obj=new JSONObject();
                obj.put("id",m.id);obj.put("name",m.name);obj.put("file",m.file);
                obj.put("enabled",m.enabled);obj.put("builtIn",m.builtIn);arr.put(obj);
            }
        } catch(Exception ignored) {return;}
        preferences(c).edit().putString(KEY,arr.toString()).apply();
    }
    static void startTeaching(Context c,String name) {
        preferences(c).edit().putString(PENDING,name.trim()).remove(PENDING_REPLACE).apply();
    }
    static void startReplacing(Context c,String name,String modelId){
        preferences(c).edit().putString(PENDING,name.trim())
            .putString(PENDING_REPLACE,modelId).apply();
    }
    static String pending(Context c) {return preferences(c).getString(PENDING,"");}
    static String pendingReplacement(Context c){
        return preferences(c).getString(PENDING_REPLACE,"");
    }
    static void clearTeaching(Context c){
        preferences(c).edit().remove(PENDING).remove(PENDING_REPLACE).apply();
    }
}

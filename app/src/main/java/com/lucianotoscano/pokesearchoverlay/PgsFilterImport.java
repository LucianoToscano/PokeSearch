package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

/** Read-only local PGSharp/PokeSearch filter catalog adapter.
 * Never reads a .dat backup, accounts, coordinates, trainer IDs or tokens.
 * Only a user-selected sanitized JSON template may become a query; unsupported
 * restrictions cause a rejection instead of silently broadening searches. */
public final class PgsFilterImport {
    private PgsFilterImport(){}
    public static final String SCHEMA="pokesearch_analysis_only_not_directly_importable";
    public static final String ACTION="com.lucianotoscano.pokesearchoverlay.APPLY_PGS_FILTER";
    public static final String EXTRA="pgsConfig";
    public static final String PRIVATE_FILE="pgs_catalog_sanitized_v1.json";
    public static final int BATCH_SIZE=50;

    public static final class Template {
        public final String id,name;
        public final JSONObject settings;
        Template(String id,String name,JSONObject settings){
            this.id=id;this.name=name;this.settings=settings;
        }
    }
    public static final class Prepared {
        public final JSONObject query;
        public final int count,total,parts,part;
        public final String warning;
        Prepared(JSONObject query,int count,int total,int parts,int part,String warning){
            this.query=query;this.count=count;this.total=total;
            this.parts=parts;this.part=part;this.warning=warning;
        }
    }
    public static List<Template> parse(JSONObject root) throws JSONException {
        if(root==null||!SCHEMA.equals(root.optString("catalog_type","")))
            throw new JSONException("Catálogo PGS sanitizado necessário");
        JSONArray list=root.optJSONArray("pokemon_filters");
        if(list==null||list.length()==0||list.length()>250)
            throw new JSONException("Número de filtros inválido");
        List<Template> result=new ArrayList<>();
        LinkedHashSet<String> unique=new LinkedHashSet<>();
        for(int i=0;i<list.length();i++){
            JSONObject item=list.optJSONObject(i);
            if(item==null)throw new JSONException("Filtro não é objeto");
            String id=item.optString("id","");
            JSONObject source=item.optJSONObject("source_settings");
            if(!id.matches("PGS_POKEMON_[0-9]{3}")||source==null||!unique.add(id))
                throw new JSONException("Identificador inválido/duplicado");
            String name=source.optString("name","").trim();
            if(name.isEmpty()||name.length()>120||name.matches("(?s).*[<>\r\n].*"))
                throw new JSONException("Nome de filtro inválido");
            result.add(new Template(id,name,source));
        }
        return result;
    }
    public static Map<Integer,String> dexNames(Context context) throws Exception {
        Map<Integer,String> names=new LinkedHashMap<>();
        try(InputStream input=context.getAssets().open("pokemon_catalog.json")){
            ByteArrayOutputStream out=new ByteArrayOutputStream();
            byte[] bytes=new byte[4096];int n;
            while((n=input.read(bytes))!=-1){
                if(out.size()+n>400000)throw new IllegalArgumentException("Catálogo Dex grande");
                out.write(bytes,0,n);
            }
            JSONArray rows=new JSONArray(out.toString("UTF-8"));
            for(int i=0;i<rows.length();i++){
                JSONArray item=rows.optJSONArray(i);
                if(item==null||item.length()<2)continue;
                int dex=item.optInt(0,-1);
                String name=item.optString(1,"").trim();
                if(dex>0&&dex<=1500&&!name.isEmpty()&&name.length()<91)
                    names.put(dex,name);
            }
        }
        return names;
    }
    private static int range(JSONObject s,String key,int min,int max)throws JSONException{
        Object raw=s.opt(key);
        if(!(raw instanceof Number))throw new JSONException("Falta "+key);
        int val=((Number)raw).intValue();
        if(((Number)raw).doubleValue()!=val||val<min||val>max)
            throw new JSONException("Fora de faixa: "+key);
        return val;
    }
    /** Batch is zero based; never silently truncate a >50-species search. */
    public static Prepared prepare(Template t,Map<Integer,String> dex,int batch)
        throws JSONException {
        JSONObject s=t.settings;
        if(s.optBoolean("onlyShiny",false)||s.optBoolean("shinyOnly",false)||
           s.optBoolean("shinyForMe",false))
            throw new JSONException("Filtro Shiny exige validação de conta/treinador");
        for(String key:new String[]{"form","gender","size"})
            if(range(s,key,0,50)!=0)
                throw new JSONException("Critério de "+key+" ainda não mapeado");
        int low=range(s,"level",1,50),high=range(s,"lvmax",1,50);
        if(low>high)throw new JSONException("Intervalo de nível inválido");
        int mode=range(s,"attrMode",0,1);
        int minIv=range(s,"minIV",0,100),maxIv=range(s,"maxIV",0,100);
        if(minIv>maxIv)throw new JSONException("Intervalo de IV% inválido");
        int atk=15,def=15,sta=15;
        String kind="percent";
        if(mode==1){
            int aMin=range(s,"minatk",0,15),aMax=range(s,"maxatk",0,15);
            int dMin=range(s,"mindef",0,15),dMax=range(s,"maxdef",0,15);
            int sMin=range(s,"minsta",0,15),sMax=range(s,"maxsta",0,15);
            if(aMin!=aMax||dMin!=dMax||sMin!=sMax)
                throw new JSONException("Intervalos IV individuais não podem ser convertidos sem perda");
            atk=aMin;def=dMin;sta=sMin;kind="raw";
        }
        JSONArray ids=s.optJSONArray("pokemons");
        LinkedHashSet<Integer> unique=new LinkedHashSet<>();
        if(ids!=null)for(int i=0;i<ids.length();i++){
            Object v=ids.opt(i);
            if(!(v instanceof Number))throw new JSONException("ID Pokémon inválido");
            int id=((Number)v).intValue();
            if(id<1||id>1500||!dex.containsKey(id))
                throw new JSONException("Espécie #"+id+" não está no catálogo verificado");
            unique.add(id);
        }
        List<Integer> values=new ArrayList<>(unique);
        int parts=Math.max(1,(values.size()+BATCH_SIZE-1)/BATCH_SIZE);
        if(batch<0||batch>=parts)throw new JSONException("Grupo inválido");
        JSONArray pokemon=new JSONArray();
        for(int i=batch*BATCH_SIZE;i<Math.min(values.size(),(batch+1)*BATCH_SIZE);i++)
            pokemon.put(dex.get(values.get(i)));
        JSONObject request=new JSONObject();
        request.put("mode",kind);
        request.put("attack",atk).put("defense",def).put("stamina",sta);
        request.put("glRank",1).put("ulRank",1);
        request.put("percentMin",minIv).put("percentMax",maxIv);
        request.put("pokemonSelections",pokemon);
        request.put("clearPokemonSelection",values.isEmpty());
        request.put("formSelections",new JSONArray());
        request.put("genderSelections",new JSONArray());
        request.put("sizeSelections",new JSONArray());
        request.put("levelMin",low==1?"":String.valueOf(low));
        request.put("levelMax",high==50?"":String.valueOf(high));
        request.put("includePreviousEvolutions",false);
        String warning="Distância/localização, alertas, ordenação e emojis do título "
            +"não são importados automaticamente; confira a busca antes de ativar alertas.";
        return new Prepared(request,pokemon.length(),values.size(),parts,batch,warning);
    }
}

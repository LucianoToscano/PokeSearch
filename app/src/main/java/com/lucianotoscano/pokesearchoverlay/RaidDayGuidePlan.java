package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Dados versionados do tutorial comunitário. O JSON é validado antes de o
 * assistente começar; uma etapa ausente não é inventada pelo aplicativo.
 */
public final class RaidDayGuidePlan {
    public static final int SCHEMA_VERSION=2;
    public final String id, variantId, variantName, source, url, verifiedAt;
    public final String confidence, riskVersion;
    private final List<Step> steps;
    private final Map<String,String> coordinates;

    public static final class Step {
        public final String id,title,instruction,locationRef,onNotHappened,safeReturn;
        public final boolean optional;
        public final List<String> preconditions, confirmations;
        Step(JSONObject o)throws JSONException{
            id=required(o,"id");
            title=required(o,"titulo");
            instruction=required(o,"instrucao");
            locationRef=o.isNull("local")?"":o.optString("local","");
            onNotHappened=required(o,"naoAconteceu");
            safeReturn=required(o,"retornoSeguro");
            optional=o.optBoolean("opcional",false);
            preconditions=readStrings(o.getJSONArray("precondicoes"));
            confirmations=readStrings(o.getJSONArray("confirmacoesAceitas"));
            if(confirmations.isEmpty())throw new JSONException("Etapa sem confirmação: "+id);
        }
    }
    private RaidDayGuidePlan(JSONObject root)throws JSONException{
        if(root.getInt("schemaVersion")!=SCHEMA_VERSION)
            throw new JSONException("Versão de roteiro incompatível");
        id=required(root,"id");
        riskVersion=required(root,"riskTextVersion");
        JSONArray variants=root.getJSONArray("variantes");
        if(variants.length()==0)throw new JSONException("Sem variante");
        JSONObject variant=variants.getJSONObject(0);
        variantId=required(variant,"id");
        variantName=required(variant,"nome");
        source=required(variant,"fonte");
        url=required(variant,"url");
        verifiedAt=required(variant,"verificadoEm");
        confidence=required(variant,"confianca");
        if(!"relato_comunitario_nao_verificado".equals(confidence))
            throw new JSONException("Confiança inesperada: "+confidence);
        JSONObject loc=variant.getJSONObject("locais");
        Map<String,String> coords=new HashMap<>();
        for(String key:new String[]{"hawaii","newzealand","kiribati"}){
            JSONObject node=loc.getJSONObject(key);
            String v=required(node,"coordenadas");
            if(!validCoords(v))throw new JSONException("Coordenadas inválidas: "+key);
            coords.put(key,v);
        }
        coordinates=Collections.unmodifiableMap(coords);
        JSONArray list=variant.getJSONArray("etapas");
        if(list.length()!=11)throw new JSONException("Roteiro precisa ter 11 etapas");
        List<Step> items=new ArrayList<>();
        for(int i=0;i<list.length();i++){
            Step step=new Step(list.getJSONObject(i));
            if(!String.format(java.util.Locale.ROOT,"E%02d",i+1).equals(step.id))
                throw new JSONException("Ordem de etapas inválida: "+step.id);
            if(!step.locationRef.isEmpty()&&!coords.containsKey(step.locationRef))
                throw new JSONException("Local não encontrado: "+step.locationRef);
            items.add(step);
        }
        steps=Collections.unmodifiableList(items);
    }
    private static String required(JSONObject o,String key)throws JSONException{
        String value=o.getString(key).trim();
        if(value.isEmpty())throw new JSONException("Campo obrigatório: "+key);
        return value;
    }
    private static List<String> readStrings(JSONArray array)throws JSONException{
        List<String> result=new ArrayList<>();
        for(int i=0;i<array.length();i++){
            String t=array.getString(i).trim();
            if(!t.isEmpty())result.add(t);
        }
        return Collections.unmodifiableList(result);
    }
    private static boolean validCoords(String raw){
        String[] parts=raw.split(",");
        if(parts.length!=2)return false;
        try{
            double lat=Double.parseDouble(parts[0]),lon=Double.parseDouble(parts[1]);
            return Double.isFinite(lat)&&Double.isFinite(lon)&&
                lat>=-90&&lat<=90&&lon>=-180&&lon<=180;
        }catch(NumberFormatException invalid){return false;}
    }
    public static RaidDayGuidePlan load(Context context)throws Exception{
        try(InputStream stream=context.getAssets().open("roteiro_bug_passes.json")){
            ByteArrayOutputStream output=new ByteArrayOutputStream();
            byte[] buf=new byte[4096];int len;
            while((len=stream.read(buf))!=-1){
                if(output.size()+len>48*1024)throw new JSONException("Roteiro grande demais");
                output.write(buf,0,len);
            }
            JSONObject root=new JSONObject(new String(output.toByteArray(),StandardCharsets.UTF_8));
            return new RaidDayGuidePlan(root);
        }
    }
    public int size(){return steps.size();}
    public Step step(int index){return steps.get(index);}
    public int indexOf(String stepId){
        for(int i=0;i<steps.size();i++)if(steps.get(i).id.equals(stepId))return i;
        return -1;
    }
    public String coords(int index){
        String ref=steps.get(index).locationRef;
        return ref.isEmpty()?"":coordinates.get(ref);
    }
}

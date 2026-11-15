package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.BitmapFactory;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * LT356: índice de modelos de todas as espécies e variantes, sem varrer milhares
 * de imagens a cada busca. Só modelos de até 10 espécies selecionadas são
 * verificados e entregues ao detector. Imagens sempre exigem direitos e QA.
 */
final class PgsAutoNativeModels {
    private static final String CATALOG="pgs-native/manifest.json";
    private static final String PACKAGE="com.nianticlabs.pokemongo";
    private static final int MAX_MODELS=4096,MAX_MANIFEST_BYTES=3*1024*1024;
    private static final class Entry {
        final int dex,width,height;
        final String species,form,variant,asset,sha256;
        Entry(int dex,int width,int height,String species,String form,String variant,
              String asset,String sha256){
            this.dex=dex;this.width=width;this.height=height;this.species=species;
            this.form=form;this.variant=variant;this.asset=asset;this.sha256=sha256;
        }
        String id(String version){return "native_"+dex+"_"+form+"_"+variant+"_"+version;}
    }
    private static Map<Integer,List<Entry>> indexed;
    private static final Map<String,Boolean> checkedAssets=new HashMap<>();
    private static String compatibleVersion;
    private static int lastDeferredCount=0;
    private PgsAutoNativeModels(){}
    static synchronized int deferredCount(){return lastDeferredCount;}

    /** Verificação sob demanda: não abrir 1025+ texturas quando só dez espécies são filtradas. */
    static synchronized List<PgsAutoTemplateStore.Model> available(
        Context context,List<Integer> selectedSpecies){
        // Não mostrar diagnóstico de variantes antigas após filtro/versão mudar.
        lastDeferredCount=0;
        if(selectedSpecies==null||selectedSpecies.isEmpty())return Collections.emptyList();
        if(indexed==null)readCatalog(context);
        if(indexed.isEmpty()||compatibleVersion==null||compatibleVersion.isEmpty()||
            !compatibleVersion.equals(installedVersion(context)))
            return Collections.emptyList();
        List<PgsAutoTemplateStore.Model> result=new ArrayList<>();
        lastDeferredCount=0;
        int totalAttempts=0;
        for(Integer dex:PgsAutoModelSelectionPolicy.selectedOnly(
            selectedSpecies,PgsAutoCatalog.MAX_SELECTED)){
            if(dex==null||dex<=0)continue;
            List<Entry> entries=indexed.get(dex);
            if(entries==null)continue;
            int attempts=0,speciesModels=0;
            for(Entry entry:entries){
                if(!PgsAutoRuntimeBudgetPolicy.mayVerify(
                    attempts,totalAttempts,speciesModels,result.size())){
                    lastDeferredCount+=entries.size()-attempts;
                    break; // nunca verificar infinitas variantes sem limite.
                }
                attempts++;totalAttempts++;
                String key=entry.asset+":"+entry.sha256+":"+entry.width+"x"+entry.height;
                Boolean ok=checkedAssets.get(key);
                if(ok==null){
                    ok=validAsset(context,entry.asset,entry.sha256,entry.width,entry.height);
                    checkedAssets.put(key,ok);
                }
                if(ok){
                    result.add(new PgsAutoTemplateStore.Model(
                        entry.id(compatibleVersion),entry.species,entry.asset,true,true,
                        entry.width,entry.height,entry.form,entry.variant));
                    speciesModels++;
                }
            }
        }
        return result;
    }
    private static String installedVersion(Context context){
        try{
            android.content.pm.PackageInfo info=context.getPackageManager()
                .getPackageInfo(PACKAGE,0);
            return info.versionName==null?"":info.versionName.trim();
        }catch(PackageManager.NameNotFoundException e){return "";}
        catch(RuntimeException error){return "";}
    }
    private static void readCatalog(Context context){
        Map<Integer,List<Entry>> next=new HashMap<>();
        String version="";
        try(InputStream stream=context.getAssets().open(CATALOG)){
            ByteArrayOutputStream output=new ByteArrayOutputStream();
            byte[] chunk=new byte[8192];int n;
            while((n=stream.read(chunk))!=-1){
                if(output.size()+n>MAX_MANIFEST_BYTES)
                    throw new IllegalArgumentException("Catálogo nativo excede limite");
                output.write(chunk,0,n);
            }
            JSONObject manifest=new JSONObject(output.toString("UTF-8"));
            if(manifest.optInt("schema",-1)!=1||
                !"pgsharp".equals(manifest.optString("provider","")))
                throw new IllegalArgumentException("Catálogo PGS inválido");
            version=manifest.optString("providerVersion","").trim();
            if(!version.matches("[0-9]+\\.[0-9]+\\.[0-9]+"))
                throw new IllegalArgumentException("Versão de feed inválida");
            JSONArray entries=manifest.optJSONArray("entries");
            if(entries==null||entries.length()>MAX_MODELS)
                throw new IllegalArgumentException("Quantidade inválida");
            Map<Integer,String> species=new HashMap<>();
            for(PgsAutoCatalog.Pokemon pokemon:PgsAutoCatalog.all(context))
                species.put(pokemon.number,pokemon.name);
            Set<String> uniqueIds=new HashSet<>();
            Map<String,Integer> imageOwner=new HashMap<>();
            for(int i=0;i<entries.length();i++){
                JSONObject item=entries.getJSONObject(i);
                if(!"device-verified".equals(item.optString("validation",""))||
                    !"redistribution-approved".equals(item.optString("rights",""))||
                    item.optString("evidence","").trim().length()<8)continue;
                int dex=item.optInt("dex",-1),width=item.optInt("width",-1),
                    height=item.optInt("height",-1);
                String form=item.optString("form",""),variant=item.optString("variant",""),
                    asset=item.optString("asset",""),hash=item.optString("sha256","");
                if(!species.containsKey(dex)||width<16||width>92||
                    height<16||height>92||
                    !form.matches("[a-z0-9_-]{1,30}")||
                    !variant.matches("[a-z0-9_-]{1,30}")||
                    !asset.matches("pgs-native/models/[a-z0-9_-]{4,100}\\.(png|webp)")||
                    !hash.matches("[a-f0-9]{64}"))continue;
                String modelKey=dex+":"+form+":"+variant;
                if(!uniqueIds.add(modelKey))continue;
                // Mesmos bytes para duas espécies diferentes gerariam ambiguidade.
                Integer owner=imageOwner.get(hash);
                if(owner!=null&&owner.intValue()!=dex)continue;
                imageOwner.put(hash,dex);
                Entry entry=new Entry(dex,width,height,species.get(dex),
                    form,variant,asset,hash);
                List<Entry> bucket=next.get(dex);
                if(bucket==null){bucket=new ArrayList<>();next.put(dex,bucket);}
                bucket.add(entry);
            }
        }catch(Exception invalid){
            next.clear();version="";
        }
        checkedAssets.clear();
        indexed=Collections.unmodifiableMap(next);
        compatibleVersion=version;
    }
    /** O hash atesta integridade dos bytes empacotados, não a licença declarada. */
    private static boolean validAsset(Context context,String file,String hash,int width,int height){
        try(InputStream in=context.getAssets().open(file)){
            MessageDigest sha=MessageDigest.getInstance("SHA-256");
            byte[] buf=new byte[4096];int n,length=0;
            while((n=in.read(buf))!=-1){
                length+=n;if(length>65536)return false;
                sha.update(buf,0,n);
            }
            StringBuilder hex=new StringBuilder();
            for(byte b:sha.digest())hex.append(String.format(Locale.ROOT,"%02x",b&255));
            if(!hash.equals(hex.toString()))return false;
            BitmapFactory.Options options=new BitmapFactory.Options();
            options.inJustDecodeBounds=true;
            try(InputStream image=context.getAssets().open(file)){
                BitmapFactory.decodeStream(image,null,options);
            }
            return options.outWidth==width&&options.outHeight==height;
        }catch(Exception invalid){return false;}
    }
}

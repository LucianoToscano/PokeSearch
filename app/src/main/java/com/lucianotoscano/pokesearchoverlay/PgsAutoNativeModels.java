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
import java.util.List;
import java.util.Locale;

/**
 * LT355: catálogo nativo somente-leitura. Apenas imagens próprias/autorizadas
 * e HOMOLOGADAS no feed podem ser incluídas. Um sprite da Pokédex NÃO é modelo PGS.
 * Os modelos são montados em memória; nunca entram nas preferências pessoais.
 */
final class PgsAutoNativeModels {
    private static final String CATALOG="pgs-native/manifest.json";
    private static final String PACKAGE="com.nianticlabs.pokemongo";
    private static final int MAX_MODELS=48;
    private static List<PgsAutoTemplateStore.Model> cached;
    private static String compatibleVersion;
    private PgsAutoNativeModels(){}

    static synchronized List<PgsAutoTemplateStore.Model> available(Context context){
        if(cached==null)readCatalog(context);
        // Falha fechada: não reconhecer com modelos de build desconhecida.
        if(compatibleVersion==null||compatibleVersion.isEmpty()||
            !compatibleVersion.equals(installedVersion(context)))
            return Collections.emptyList();
        List<PgsAutoTemplateStore.Model> models=new ArrayList<>(cached.size());
        for(PgsAutoTemplateStore.Model m:cached)
            models.add(new PgsAutoTemplateStore.Model(m.id,m.name,m.file,true,true,
                m.referenceWidth,m.referenceHeight));
        return models;
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
        ArrayList<PgsAutoTemplateStore.Model> models=new ArrayList<>();
        String version="";
        try(InputStream stream=context.getAssets().open(CATALOG)){
            ByteArrayOutputStream output=new ByteArrayOutputStream();
            byte[] chunk=new byte[4096];int n;
            while((n=stream.read(chunk))!=-1){
                if(output.size()+n>131072)throw new IllegalArgumentException("Catálogo grande demais");
                output.write(chunk,0,n);
            }
            JSONObject manifest=new JSONObject(output.toString("UTF-8"));
            if(manifest.optInt("schema",-1)!=1||
                !"pgsharp".equals(manifest.optString("provider","")))
                throw new IllegalArgumentException("Catálogo PGS inválido");
            version=manifest.optString("providerVersion","").trim();
            JSONArray entries=manifest.optJSONArray("entries");
            if(entries==null||entries.length()>MAX_MODELS)
                throw new IllegalArgumentException("Quantidade inválida");
            for(int i=0;i<entries.length();i++){
                JSONObject item=entries.getJSONObject(i);
                if(!"device-verified".equals(item.optString("validation",""))||
                    !"redistribution-approved".equals(item.optString("rights",""))||
                    item.optString("evidence","").trim().length()<8)
                    continue; // Modelo pendente NUNCA é elegível para clique.
                int dex=item.optInt("dex",-1),w=item.optInt("width",-1),
                    h=item.optInt("height",-1);
                String form=item.optString("form",""),variant=item.optString("variant",""),
                    asset=item.optString("asset",""),digest=item.optString("sha256","");
                if(dex<1||w<16||w>92||h<16||h>92||
                    !form.matches("[a-z0-9_-]{1,30}")||
                    !variant.matches("[a-z0-9_-]{1,30}")||
                    !asset.matches("pgs-native/models/[a-z0-9_-]{4,100}\\.(png|webp)")||
                    !digest.matches("[a-f0-9]{64}"))continue;
                String species=null;
                for(PgsAutoCatalog.Pokemon pokemon:PgsAutoCatalog.all(context))
                    if(pokemon.number==dex){species=pokemon.name;break;}
                if(species==null||!validAsset(context,asset,digest,w,h))continue;
                String id="native_"+dex+"_"+form+"_"+variant+"_"+version;
                boolean duplicate=false;
                for(PgsAutoTemplateStore.Model m:models)if(m.id.equals(id))duplicate=true;
                if(!duplicate)models.add(new PgsAutoTemplateStore.Model(
                    id,species,asset,true,true,w,h));
            }
        }catch(Exception error){
            // Catálogo ausente ou corrompido: nenhum nativo, jamais fallback visual cego.
            models.clear();version="";
        }
        cached=Collections.unmodifiableList(models);
        compatibleVersion=version;
    }
    private static boolean validAsset(Context context,String file,String hash,int width,int height){
        try(InputStream in=context.getAssets().open(file)){
            MessageDigest sha=MessageDigest.getInstance("SHA-256");
            byte[] buffer=new byte[4096];int n,length=0;
            while((n=in.read(buffer))!=-1){
                length+=n;if(length>65536)return false;sha.update(buffer,0,n);
            }
            StringBuilder hex=new StringBuilder();
            for(byte b:sha.digest())hex.append(String.format(Locale.ROOT,"%02x",b&255));
            if(!hash.equals(hex.toString()))return false;
            BitmapFactory.Options options=new BitmapFactory.Options();
            options.inJustDecodeBounds=true;
            try(InputStream picture=context.getAssets().open(file)){
                BitmapFactory.decodeStream(picture,null,options);
            }
            return options.outWidth==width&&options.outHeight==height;
        }catch(Exception invalid){return false;}
    }
}

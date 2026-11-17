package com.lucianotoscano.pokesearchoverlay;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.database.Cursor;
import android.provider.OpenableColumns;
import android.os.Handler;
import android.os.Looper;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.concurrent.atomic.AtomicBoolean;
import android.content.SharedPreferences;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * LT377: Inventário PGSStats opt-in, privado e local, independente de login,
 * captura e overlays. Não anuncia nem troca Pokémon. Nunca grava o JSON bruto,
 * coordenadas, sessão, identificadores da conta ou credenciais.
 */
public final class PersonalPokedexActivity extends Activity {
    private static final int PICK_STATS=3771;
    private static final long SYNC_INTERVAL_MS=60000L;
    private static final String SOURCE_SETTINGS="pokedex_source_link";
    private static final String HIDDEN_SETTINGS="pokedex_hidden_entries";
    private static final int MAX_IMPORT_BYTES=24*1024*1024;
    private static final int MAX_POKEMON=10000;
    private static final Pattern LARGE_ID=Pattern.compile("(\"id\"\\s*:\\s*)(\\d{16,20})(?=\\s*[,}])");
    private static final Pattern TAG_ARRAY=Pattern.compile("(\\\"pokemonTagIds\\\"\\s*:\\s*\\[)([^\\]]*)(\\])");
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private final ExecutorService backgroundWorker=Executors.newSingleThreadExecutor();
    private final AtomicBoolean backgroundCancel=new AtomicBoolean(false);
    private volatile boolean backgroundBusy=false;
    private volatile int backgroundDone=0;
    private volatile String backgroundError="";
    private static final String BG_ORIGIN=
        "https://raw.githubusercontent.com/PokeMiners/pogo_assets/db10df75d6f6f92018d9786af0aecc238fecc4ef/Images/LocationCards/";
    private static final Pattern SAFE_BG=Pattern.compile("[A-Za-z0-9_\\-]{1,110}\\.png");
    private static final int MAX_BG_BYTES=8*1024*1024;
    private PokedexSpriteStore spriteStore;
    private WebView view;
    private volatile boolean closing=false;
    private int pendingSlot=1;
    private boolean pendingLink=false;
    private final AtomicBoolean[] sourceSyncBusy={new AtomicBoolean(false),new AtomicBoolean(false),new AtomicBoolean(false)};
    private final Handler sourceHandler=new Handler(Looper.getMainLooper());
    private final Runnable sourceTicker=new Runnable(){
        @Override public void run(){
            if(closing)return;
            for(int s=1;s<=2;s++)if(isAutoLinked(s))enqueueRefresh(s,false);
            sourceHandler.postDelayed(this,SYNC_INTERVAL_MS);
        }
    };
    private SharedPreferences sourcePrefs(){
        return getSharedPreferences(SOURCE_SETTINGS,MODE_PRIVATE);
    }
    private static String sourceKey(int selected,String field){
        return "slot"+slot(selected)+"_"+field;
    }
    private boolean isAutoLinked(int selected){
        SharedPreferences prefs=sourcePrefs();
        return prefs.getBoolean(sourceKey(selected,"auto"),false)&&
            !prefs.getString(sourceKey(selected,"uri"),"").isEmpty();
    }
    private String sourceStatus(int selected){
        SharedPreferences p=sourcePrefs();
        JSONObject out=new JSONObject();
        String uri=p.getString(sourceKey(selected,"uri"),"");
        try{
            out.put("linked",!uri.isEmpty());
            out.put("auto",!uri.isEmpty()&&p.getBoolean(sourceKey(selected,"auto"),false));
            out.put("name",p.getString(sourceKey(selected,"name"),""));
            out.put("lastSync",p.getLong(sourceKey(selected,"last"),0L));
            out.put("error",p.getString(sourceKey(selected,"error"),""));
            out.put("busy",sourceSyncBusy[slot(selected)].get());
        }catch(Exception ignored){}
        return out.toString();
    }
    private void emitSourceStatus(int selected){
        runOnUiThread(()->{
            if(closing||view==null)return;
            view.evaluateJavascript("window.pokeSourceUpdated&&window.pokeSourceUpdated("+
                selected+","+sourceStatus(selected)+");",null);
        });
    }
    private static String sha256(byte[] bytes) throws Exception{
        byte[] hash=MessageDigest.getInstance("SHA-256").digest(bytes);
        StringBuilder out=new StringBuilder();
        for(byte value:hash)out.append(String.format(Locale.ROOT,"%02x",value&255));
        return out.toString();
    }
    private String sourceName(Uri uri){
        try(Cursor cursor=getContentResolver().query(uri,
            new String[]{OpenableColumns.DISPLAY_NAME},null,null,null)){
            if(cursor!=null&&cursor.moveToFirst())
                return text(cursor.getString(0),72);
        }catch(Exception ignored){}
        return "Arquivo JSON selecionado";
    }
    private void saveCompact(int selected,JSONObject compact) throws Exception{
        File dest=snapshot(selected);
        JSONObject previous=null;
        if(dest.isFile())try(FileInputStream old=new FileInputStream(dest)){
            previous=new JSONObject(new String(bounded(old,MAX_IMPORT_BYTES),StandardCharsets.UTF_8));
        }catch(Exception ignored){}
        if(!dest.getParentFile().isDirectory()&&!dest.getParentFile().mkdirs())
            throw new IOException("Armazenamento local indisponível.");
        File tmp=new File(dest.getParentFile(),"slot"+selected+".pending");
        try(FileOutputStream out=new FileOutputStream(tmp)){
            out.write(compact.toString().getBytes(StandardCharsets.UTF_8));
            out.getFD().sync();
        }
        if(!tmp.renameTo(dest))throw new IOException("Falha ao salvar coleção.");
        recordImportHistory(selected,compact,previous);
    }
    private void enqueueRefresh(int selected,boolean requested){
        if(!sourceSyncBusy[slot(selected)].compareAndSet(false,true))return;
        worker.execute(()->{
            try{
                SharedPreferences prefs=sourcePrefs();
                String stored=prefs.getString(sourceKey(selected,"uri"),"");
                if(stored.isEmpty())return;
                byte[] bytes;
                try(InputStream in=getContentResolver().openInputStream(Uri.parse(stored))){
                    if(in==null)throw new IOException("Não foi possível abrir o arquivo vinculado.");
                    bytes=bounded(in,MAX_IMPORT_BYTES);
                }
                String digest=sha256(bytes);
                String previous=prefs.getString(sourceKey(selected,"sha"),"");
                if(digest.equals(previous)){
                    if(requested)notifySourceWeb(selected,"Arquivo verificado: nenhuma alteração.",false);
                    prefs.edit().putString(sourceKey(selected,"error"),"").apply();
                    return;
                }
                JSONObject compact=compact(new String(bytes,StandardCharsets.UTF_8));
                saveCompact(selected,compact);
                prefs.edit().putString(sourceKey(selected,"sha"),digest)
                    .putLong(sourceKey(selected,"last"),System.currentTimeMillis())
                    .putString(sourceKey(selected,"error"),"").apply();
                notifySourceWeb(selected,"Sincronizado: "+compact.optInt("count")+" Pokémon no arquivo.",true);
            }catch(Exception e){
                String message="Fonte indisponível. Se o PGSharp substituiu o arquivo, escolha-o novamente.";
                sourcePrefs().edit().putString(sourceKey(selected,"error"),message).apply();
                if(requested)notifySourceWeb(selected,message,false);
            }finally{
                sourceSyncBusy[slot(selected)].set(false);
                emitSourceStatus(selected);
            }
        });
    }

    private File snapshot(int slot){
        return new File(new File(getFilesDir(),"pokedex_personal"),"slot"+slot+".json");
    }
    private static int slot(int s){return s==2?2:1;}
    private File backgroundDir(){return new File(getFilesDir(),"pokedex_backgrounds");}
    private JSONObject backgroundManifest(){
        try(InputStream in=getAssets().open("pokedex_background_manifest.json")){
            return new JSONObject(new String(bounded(in,120000),StandardCharsets.UTF_8));
        }catch(Exception ignored){return new JSONObject();}
    }
    private static String safeBackgroundName(String name){
        return name!=null&&SAFE_BG.matcher(name).matches()?name:"";
    }
    private File backgroundFile(String name){
        String valid=safeBackgroundName(name);
        return valid.isEmpty()?null:new File(backgroundDir(),valid);
    }
    private String backgroundStatus(){
        JSONArray rows=backgroundManifest().optJSONArray("assets");
        int total=rows==null?0:rows.length(),saved=0;
        long bytes=0;
        if(rows!=null)for(int i=0;i<rows.length();i++){
            JSONArray item=rows.optJSONArray(i);
            if(item==null)continue;
            File cached=backgroundFile(item.optString(0,""));
            if(cached!=null&&cached.isFile()&&cached.length()==item.optLong(1,-1)){
                saved++;bytes+=cached.length();
            }
        }
        JSONObject response=new JSONObject();
        try{
            response.put("downloaded",saved);response.put("total",total);
            response.put("bytes",bytes);response.put("running",backgroundBusy);
            response.put("processed",backgroundDone);response.put("error",backgroundError);
        }catch(Exception ignored){}
        return response.toString();
    }
    private void emitBackgroundStatus(){
        runOnUiThread(()->{
            if(closing||view==null)return;
            view.evaluateJavascript("window.pokeBackgroundProgress&&window.pokeBackgroundProgress("+
                backgroundStatus()+");",null);
        });
    }
    private static String gitBlobSha(File file,long declaredSize) throws Exception{
        MessageDigest digest=MessageDigest.getInstance("SHA-1");
        digest.update(("blob "+declaredSize).getBytes(StandardCharsets.UTF_8));
        digest.update((byte)0);
        try(InputStream in=new FileInputStream(file)){
            byte[] buffer=new byte[16384];int n;
            while((n=in.read(buffer))!=-1)digest.update(buffer,0,n);
        }
        StringBuilder b=new StringBuilder();
        for(byte v:digest.digest())b.append(String.format(Locale.ROOT,"%02x",v&255));
        return b.toString();
    }
    private void downloadBackgrounds(){
        if(backgroundBusy)return;
        backgroundBusy=true;backgroundDone=0;backgroundError="";
        backgroundCancel.set(false);
        backgroundWorker.execute(()->{
            try{
                JSONArray entries=backgroundManifest().optJSONArray("assets");
                if(entries==null||entries.length()==0)throw new IOException("Catálogo de fundos indisponível.");
                if(!backgroundDir().isDirectory()&&!backgroundDir().mkdirs())
                    throw new IOException("Sem armazenamento privado.");
                for(int i=0;i<entries.length();i++){
                    if(backgroundCancel.get()||Thread.currentThread().isInterrupted())break;
                    JSONArray item=entries.optJSONArray(i);
                    if(item==null)continue;
                    String name=safeBackgroundName(item.optString(0,""));
                    long length=item.optLong(1,-1);
                    String sha=item.optString(2,"");
                    if(name.isEmpty()||length<=0||length>MAX_BG_BYTES||!sha.matches("[0-9a-f]{40}"))
                        throw new IOException("Catálogo inválido: arquivo não permitido.");
                    File saved=backgroundFile(name);
                    if(saved==null)continue;
                    if(!(saved.isFile()&&saved.length()==length&&sha.equals(gitBlobSha(saved,length)))){
                        File pending=new File(backgroundDir(),name+".pending");
                        HttpURLConnection connection=null;
                        try{
                            URL url=new URL(BG_ORIGIN+name);
                            connection=(HttpURLConnection)url.openConnection();
                            connection.setConnectTimeout(12000);
                            connection.setReadTimeout(20000);
                            connection.setInstanceFollowRedirects(false);
                            connection.setRequestProperty("User-Agent","PokeSearch-private-background-cache/1");
                            if(connection.getResponseCode()!=200)
                                throw new IOException("HTTP "+connection.getResponseCode()+" em "+name);
                            try(InputStream in=connection.getInputStream();
                                FileOutputStream out=new FileOutputStream(pending)){
                                byte[] b=new byte[16384];int n;long count=0;
                                while((n=in.read(b))!=-1){
                                    if(backgroundCancel.get()||Thread.currentThread().isInterrupted())
                                        throw new IOException("Download cancelado.");
                                    count+=n;
                                    if(count>length||count>MAX_BG_BYTES)
                                        throw new IOException("Tamanho de imagem inesperado.");
                                    out.write(b,0,n);
                                }
                                out.getFD().sync();
                                if(count!=length)throw new IOException("Imagem incompleta: "+name);
                            }
                            if(!sha.equals(gitBlobSha(pending,length)))
                                throw new IOException("Imagem não confere com o catálogo: "+name);
                            if(!pending.renameTo(saved))throw new IOException("Não foi possível salvar "+name);
                        }finally{
                            if(connection!=null)connection.disconnect();
                            if(pending.isFile())pending.delete();
                        }
                    }
                    backgroundDone=i+1;
                    if(i%4==0||i==entries.length()-1)emitBackgroundStatus();
                }
            }catch(Exception e){backgroundError=text(e.getMessage(),130);}
            finally{
                backgroundBusy=false;
                if(backgroundCancel.get())backgroundError="Download interrompido; arquivos completos foram preservados.";
                emitBackgroundStatus();
            }
        });
        emitBackgroundStatus();
    }
    private void clearBackgrounds(){
        if(backgroundBusy)return;
        File[] files=backgroundDir().listFiles();
        if(files!=null)for(File file:files){
            if(file.isFile()&&file.getName().matches("[A-Za-z0-9_\\-]{1,110}\\.png"))
                file.delete();
        }
        backgroundDone=0;backgroundError="";
        emitBackgroundStatus();
    }
    private static byte[] bounded(InputStream source,int max) throws IOException {
        try(ByteArrayOutputStream out=new ByteArrayOutputStream()){
            byte[] b=new byte[8192];int n;
            while((n=source.read(b))!=-1){
                if(out.size()>max-n)throw new IOException("Arquivo excede 24 MB.");
                out.write(b,0,n);
            }
            return out.toByteArray();
        }
    }
    private static String text(String input,int max){
        return input==null?"":input.trim().substring(0,Math.min(max,input.trim().length()));
    }
    private static int number(JSONObject obj,String key,int maximum) {
        return Math.max(0,Math.min(maximum,obj.optInt(key,0)));
    }
    private static JSONObject displayMega(JSONObject p){
        JSONObject display=p.optJSONObject("pokemonDisplay");
        if(display==null)return new JSONObject();
        JSONObject mega=display.optJSONObject("megaEvolutionLevel");
        return mega==null?new JSONObject():mega;
    }
    static JSONObject compact(String raw) throws Exception {
        // Android JSONObject can round unsigned 64-bit Pokémon IDs. Quote the
        // exact lexical tokens BEFORE JSON parsing; never coerce them to double.
        Matcher matcher=LARGE_ID.matcher(raw);
        String stableIds=matcher.replaceAll("$1\"$2\"");
        Matcher tagMatch=TAG_ARRAY.matcher(stableIds);
        StringBuffer normalized=new StringBuffer(stableIds.length());
        while(tagMatch.find()){
            String numbers=tagMatch.group(2).replaceAll("(?<![0-9])([0-9]{16,20})(?![0-9])","\"$1\"");
            tagMatch.appendReplacement(normalized,Matcher.quoteReplacement(tagMatch.group(1)+numbers+tagMatch.group(3)));
        }
        tagMatch.appendTail(normalized);
        JSONObject source=new JSONObject(normalized.toString());
        JSONArray original=source.optJSONArray("pokemons");
        if(original==null||original.length()>MAX_POKEMON)
            throw new IOException("Lista Pokémon ausente ou excessiva.");
        JSONArray list=new JSONArray();
        JSONArray eggs=new JSONArray();
        HashSet<String> known=new HashSet<>();
        for(int i=0;i<original.length();i++){
            JSONObject p=original.optJSONObject(i);
            if(p==null)continue;
            if(p.optBoolean("isEgg",false)){
                JSONObject egg=new JSONObject();
                egg.put("distance",Math.max(0,Math.min(1000,p.optDouble("eggKmWalkedTarget",0))));
                egg.put("progress",Math.max(0,Math.min(1000,p.optDouble("eggKmWalkedStart",0))));
                egg.put("incubating",!p.optString("eggIncubatorId","").isEmpty());
                egg.put("type",number(p,"eggType",50));
                eggs.put(egg);
                continue;
            }
            String identifier=p.optString("id","");
            if(!identifier.matches("[0-9]{1,20}")||!known.add(identifier))
                throw new IOException("Identificador Pokémon inválido/duplicado.");
            int species=number(p,"pokemonId",5000);
            if(species==0)continue;
            JSONObject display=p.optJSONObject("pokemonDisplay");
            if(display==null)display=new JSONObject();
            JSONObject individual=new JSONObject();
            individual.put("id",identifier);
            individual.put("species",species);
            individual.put("nickname",text(p.optString("nickname",""),64));
            individual.put("cp",number(p,"cp",99999));
            individual.put("attack",number(p,"individualAttack",15));
            individual.put("defense",number(p,"individualDefense",15));
            individual.put("hpIv",number(p,"individualStamina",15));
            individual.put("stamina",number(p,"stamina",99999));
            individual.put("maxStamina",number(p,"maxStamina",99999));
            individual.put("heightM",Math.max(0,Math.min(100000,p.optDouble("heightM",0))));
            individual.put("weightKg",Math.max(0,Math.min(1000000,p.optDouble("weightKg",0))));
            individual.put("favorite",p.optBoolean("favorite",false));
            individual.put("hasMegaEvolved",p.optBoolean("hasMegaEvolved",false));
            JSONArray megaForms=p.optJSONArray("megaEvolvedForms");
            individual.put("megaFormsCount",megaForms==null?0:megaForms.length());
            JSONObject mega=displayMega(p);
            individual.put("megaLevel",mega.optInt("level",0));
            individual.put("hatchedFromEgg",p.optBoolean("hatchedFromEgg",false));
            individual.put("buddyKm",Math.max(0,Math.min(100000,p.optDouble("buddyKmWalked",0))));
            individual.put("lucky",p.optBoolean("isLucky",false));
            individual.put("shiny",display.optBoolean("shiny",false));
            individual.put("alignment",display.optInt("alignment",0));
            individual.put("form",display.optInt("form",0));
            individual.put("formName",text(display.optString("formName",""),70));
            individual.put("costume",number(display,"costume",100000));
            individual.put("gender",number(display,"gender",10));
            individual.put("size",number(p,"size",10));
            individual.put("pokeball",number(p,"pokeball",100));
            individual.put("breadMode",number(display,"breadModeEnum",40));
            JSONArray originEvents=p.optJSONArray("originEvents");
            JSONArray events=new JSONArray();
            if(originEvents!=null){
                for(int eventIndex=0;eventIndex<Math.min(originEvents.length(),6);eventIndex++){
                    String value=text(originEvents.optString(eventIndex,""),100);
                    if(!value.isEmpty())events.put(value);
                }
            }
            individual.put("events",events);
            individual.put("move1",number(p,"move1",100000));
            individual.put("move2",number(p,"move2",100000));
            individual.put("move3",number(p,"move3",100000));
            individual.put("caughtMs",Math.max(0,p.optLong("creationTimeMs",0)));
            individual.put("traded",p.optLong("tradedTimeMs",0)>0);
            JSONObject card=display.optJSONObject("locationCard");
            individual.put("backgroundId",card==null?0:number(card,"locationCard",100000));
            // Tag IDs are matched as opaque values within this single import.
            JSONArray ids=p.optJSONArray("pokemonTagIds");
            if(ids!=null){
                JSONArray safe=new JSONArray();
                for(int t=0;t<Math.min(ids.length(),60);t++)
                    safe.put(text(ids.optString(t,""),40));
                individual.put("tags",safe);
            }
            list.put(individual);
        }
        if(list.length()==0)throw new IOException("Nenhum Pokémon válido no arquivo.");
        JSONObject result=new JSONObject();
        result.put("schema",1);
        result.put("snapshotTime",text(source.optString("time",""),40));
        result.put("count",list.length());
        result.put("eggs",eggs);
        JSONObject account=source.optJSONObject("account");
        int capacity=account==null?0:number(account,"maxPokemonStorage",100000);
        result.put("capacity",capacity);
        result.put("pokemons",list);
        JSONArray sourceTags=source.optJSONArray("tags");
        JSONArray tags=new JSONArray();
        if(sourceTags!=null){
            for(int i=0;i<Math.min(sourceTags.length(),150);i++){
                JSONObject t=sourceTags.optJSONObject(i);
                if(t==null)continue;
                JSONObject safe=new JSONObject();
                safe.put("id",text(t.optString("id",""),40));
                safe.put("name",text(t.optString("name",""),45));
                tags.put(safe);
            }
        }
        result.put("tags",tags);
        return result;
    }
    @SuppressLint("SetJavaScriptEnabled")
    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        spriteStore=new PokedexSpriteStore(this, json->runOnUiThread(()->{
            if(closing||view==null)return;
            view.evaluateJavascript("window.pokeSpriteProgress&&window.pokeSpriteProgress("+json+");",null);
        }));
        view=new WebView(this);
        view.setBackgroundColor(0xfff6fbf7);
        WebSettings s=view.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(false);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(false);
        s.setAllowFileAccessFromFileURLs(false);
        s.setAllowUniversalAccessFromFileURLs(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        view.setWebViewClient(new WebViewClient(){
            @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest req){
                return !req.getUrl().toString().startsWith("file:///android_asset/");
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest req){
                String url=req.getUrl().toString();
                boolean local=url.startsWith("file:///android_asset/");
                boolean sprites=url.startsWith("https://raw.githubusercontent.com/PokeAPI/sprites/")||
                    url.startsWith("https://cdn.jsdelivr.net/gh/PokeAPI/sprites@");
                if(url.startsWith("https://pokesearch.local/sprite/")){
                    String rest=url.substring("https://pokesearch.local/sprite/".length());
                    int slash=rest.indexOf('/');
                    if(slash>0&&spriteStore!=null){
                        String group=rest.substring(0,slash);
                        String filename=rest.substring(slash+1);
                        try{
                            InputStream localSprite=spriteStore.openLocal(group,filename);
                            if(localSprite!=null)
                                return new WebResourceResponse("image/png",null,localSprite);
                        }catch(Exception ignored){}
                    }
                    return new WebResourceResponse("text/plain","UTF-8",
                        new java.io.ByteArrayInputStream(new byte[0]));
                }
                if(url.startsWith("https://pokesearch.local/bg/")){
                    String filename=url.substring("https://pokesearch.local/bg/".length());
                    File requested=backgroundFile(filename);
                    if(requested!=null&&requested.isFile()){
                        try{return new WebResourceResponse("image/png",null,new FileInputStream(requested));}
                        catch(Exception ignored){}
                    }
                    return new WebResourceResponse("text/plain","UTF-8",
                        new java.io.ByteArrayInputStream(new byte[0]));
                }
                if(local||sprites)return null;
                return new WebResourceResponse("text/plain","UTF-8",
                    new java.io.ByteArrayInputStream(new byte[0]));
            }
        });
        view.addJavascriptInterface(new InventoryBridge(),"PersonalInventory");
        setContentView(view);
        view.loadUrl("file:///android_asset/personal_pokedex.html");
    }
    private final class InventoryBridge {
        @JavascriptInterface public String getSnapshot(int requestedSlot){
            File target=snapshot(slot(requestedSlot));
            if(!target.isFile())return "{}";
            try(FileInputStream in=new FileInputStream(target)){
                return new String(bounded(in,MAX_IMPORT_BYTES),StandardCharsets.UTF_8);
            }catch(Exception ignored){return "{}";}
        }
        @JavascriptInterface public String getCatalog(){
            try(InputStream in=getAssets().open("pokemon_catalog.json")){
                return new String(bounded(in,120000),StandardCharsets.UTF_8);
            }catch(Exception ignored){return "[]";}
        }
        @JavascriptInterface public String getSpriteManifest(){
            return spriteStore==null?"{}":spriteStore.manifest();
        }
        @JavascriptInterface public String getCachedSpriteKeys(){
            return spriteStore==null?"[]":spriteStore.cachedKeys();
        }
        @JavascriptInterface public String getSpriteStatus(){
            return spriteStore==null?"{}":spriteStore.status();
        }
        @JavascriptInterface public void downloadSprites(String mode,String jsonKeys){
            if(spriteStore!=null)spriteStore.start(mode,jsonKeys);
        }
        @JavascriptInterface public void cancelSpriteDownload(){
            if(spriteStore!=null)spriteStore.cancel();
        }
        @JavascriptInterface public void clearSpriteCache(){
            if(spriteStore!=null)spriteStore.clear();
        }
        @JavascriptInterface public String getMetaCatalog(){
            try(InputStream in=getAssets().open("pokedex_catalog_meta.json")){
                return new String(bounded(in,180000),StandardCharsets.UTF_8);
            }catch(Exception ignored){return "{}";}
        }
        @JavascriptInterface public String getBackgroundManifest(){
            return backgroundManifest().toString();
        }
        @JavascriptInterface public String getCachedBackgroundNames(){
            JSONArray known=backgroundManifest().optJSONArray("assets");
            JSONArray found=new JSONArray();
            if(known!=null)for(int i=0;i<known.length();i++){
                JSONArray r=known.optJSONArray(i);
                if(r==null)continue;
                String name=safeBackgroundName(r.optString(0,""));
                File item=backgroundFile(name);
                if(item!=null&&item.isFile()&&item.length()==r.optLong(1,-1))
                    found.put(name);
            }
            return found.toString();
        }
        @JavascriptInterface public String getBackgroundStatus(){return backgroundStatus();}
        @JavascriptInterface public void downloadAllBackgrounds(){downloadBackgrounds();}
        @JavascriptInterface public void cancelBackgroundDownload(){backgroundCancel.set(true);}
        @JavascriptInterface public void clearBackgroundCache(){backgroundWorker.execute(()->clearBackgrounds());}
        @JavascriptInterface public String getNote(int requestedSlot,String pokemonId){
            if(!pokemonId.matches("[0-9]{1,20}"))return "";
            return getSharedPreferences("personal_pokedex_notes",MODE_PRIVATE)
                .getString(slot(requestedSlot)+":"+pokemonId,"");
        }
        @JavascriptInterface public void setNote(int requestedSlot,String pokemonId,String note){
            if(!pokemonId.matches("[0-9]{1,20}")||note==null)return;
            getSharedPreferences("personal_pokedex_notes",MODE_PRIVATE).edit()
                .putString(slot(requestedSlot)+":"+pokemonId,text(note,500)).apply();
        }
        @JavascriptInterface public String getImportHistory(int requestedSlot){
            return getSharedPreferences("pokedex_import_history",MODE_PRIVATE)
                .getString("slot"+slot(requestedSlot),"[]");
        }
        @JavascriptInterface public String getSourceStatus(int requestedSlot){
            return sourceStatus(slot(requestedSlot));
        }
        @JavascriptInterface public String getHiddenIds(int requestedSlot){
            return getSharedPreferences(HIDDEN_SETTINGS,MODE_PRIVATE)
                .getString("slot"+slot(requestedSlot),"[]");
        }
        @JavascriptInterface public void setHidden(int requestedSlot,String pokemonId,boolean hide){
            if(pokemonId==null||!pokemonId.matches("[0-9]{1,20}"))return;
            int selected=slot(requestedSlot);
            SharedPreferences p=getSharedPreferences(HIDDEN_SETTINGS,MODE_PRIVATE);
            HashSet<String> ids=new HashSet<>();
            try{
                JSONArray previous=new JSONArray(p.getString("slot"+selected,"[]"));
                for(int i=0;i<previous.length()&&i<MAX_POKEMON;i++){
                    String id=previous.optString(i,"");
                    if(id.matches("[0-9]{1,20}"))ids.add(id);
                }
            }catch(Exception ignored){}
            if(hide)ids.add(pokemonId);
            else ids.remove(pokemonId);
            JSONArray next=new JSONArray();
            for(String id:ids)next.put(id);
            p.edit().putString("slot"+selected,next.toString()).apply();
        }
        @JavascriptInterface public void restoreAllHidden(int requestedSlot){
            getSharedPreferences(HIDDEN_SETTINGS,MODE_PRIVATE).edit()
                .remove("slot"+slot(requestedSlot)).apply();
        }
        @JavascriptInterface public void setAutoSync(int requestedSlot,boolean enabled){
            int selected=slot(requestedSlot);
            String uri=sourcePrefs().getString(sourceKey(selected,"uri"),"");
            sourcePrefs().edit().putBoolean(sourceKey(selected,"auto"),enabled&&!uri.isEmpty()).apply();
            emitSourceStatus(selected);
            if(enabled&&!uri.isEmpty())enqueueRefresh(selected,false);
        }
        @JavascriptInterface public void refreshLinked(int requestedSlot){
            enqueueRefresh(slot(requestedSlot),true);
        }
        @JavascriptInterface public void unlinkSource(int requestedSlot){
            int selected=slot(requestedSlot);
            SharedPreferences prefs=sourcePrefs();
            String uri=prefs.getString(sourceKey(selected,"uri"),"");
            String other=prefs.getString(sourceKey(selected==1?2:1,"uri"),"");
            prefs.edit().remove(sourceKey(selected,"uri")).remove(sourceKey(selected,"name"))
                .remove(sourceKey(selected,"sha")).remove(sourceKey(selected,"last"))
                .remove(sourceKey(selected,"error")).remove(sourceKey(selected,"auto")).apply();
            if(!uri.isEmpty()&&!uri.equals(other)){
                try{getContentResolver().releasePersistableUriPermission(
                    Uri.parse(uri),Intent.FLAG_GRANT_READ_URI_PERMISSION);}catch(Exception ignored){}
            }
            emitSourceStatus(selected);
        }
        private void launchPicker(int requestedSlot,boolean link){
            runOnUiThread(()->{
                if(closing)return;
                pendingSlot=slot(requestedSlot);
                pendingLink=link;
                Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.setType("*/*");
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION|
                    Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
                intent.putExtra(Intent.EXTRA_MIME_TYPES,new String[]{
                    "application/json","text/plain","application/octet-stream"});
                startActivityForResult(intent,PICK_STATS);
            });
        }
        @JavascriptInterface public void chooseJson(int requestedSlot){
            launchPicker(requestedSlot,false);
        }
        @JavascriptInterface public void linkJson(int requestedSlot){
            launchPicker(requestedSlot,true);
        }
        @JavascriptInterface public String getDecoration(int requestedSlot,String pokemonId){
            if(!pokemonId.matches("[0-9]{1,20}"))return "default";
            return getSharedPreferences("personal_pokedex_looks",MODE_PRIVATE)
                .getString(slot(requestedSlot)+":"+pokemonId,"default");
        }
        @JavascriptInterface public void setDecoration(int requestedSlot,String pokemonId,String name){
            if(!pokemonId.matches("[0-9]{1,20}"))return;
            boolean basic="default".equals(name)||"aurora".equals(name)||"sunset".equals(name)||
                "ocean".equals(name)||"night".equals(name)||"original".equals(name);
            boolean userCached=false;
            if(name!=null&&name.startsWith("asset:")){
                String file=safeBackgroundName(name.substring(6));
                File cached=backgroundFile(file);
                userCached=cached!=null&&cached.isFile();
            }
            if(!basic&&!userCached)return;
            getSharedPreferences("personal_pokedex_looks",MODE_PRIVATE).edit()
                .putString(slot(requestedSlot)+":"+pokemonId,name).apply();
        }
        @JavascriptInterface public void closeScreen(){runOnUiThread(()->finish());}
    }
    @Override protected void onActivityResult(int request,int result,Intent intent){
        super.onActivityResult(request,result,intent);
        if(request!=PICK_STATS||result!=RESULT_OK||intent==null)return;
        Uri uri=intent.getData();
        if(uri==null)return;
        final int selected=pendingSlot;
        final boolean linking=pendingLink;
        if(linking){
            try{
                getContentResolver().takePersistableUriPermission(
                    uri,Intent.FLAG_GRANT_READ_URI_PERMISSION);
            }catch(SecurityException e){
                notifyWeb("Este provedor não permite acesso contínuo. Importe manualmente ou escolha outro arquivo.",false);
                return;
            }
        }
        worker.execute(()->{
            try(InputStream input=getContentResolver().openInputStream(uri)){
                if(input==null)throw new IOException("Não foi possível ler o arquivo.");
                byte[] bytes=bounded(input,MAX_IMPORT_BYTES);
                JSONObject compact=compact(new String(bytes,StandardCharsets.UTF_8));
                saveCompact(selected,compact);
                if(linking){
                    SharedPreferences prefs=sourcePrefs();
                    prefs.edit().putString(sourceKey(selected,"uri"),uri.toString())
                        .putString(sourceKey(selected,"name"),sourceName(uri))
                        .putString(sourceKey(selected,"sha"),sha256(bytes))
                        .putLong(sourceKey(selected,"last"),System.currentTimeMillis())
                        .putString(sourceKey(selected,"error"),"")
                        .putBoolean(sourceKey(selected,"auto"),true).apply();
                }
                notifyWeb((linking?"Arquivo vinculado e atualizado: ":"Importação concluída: ")+
                    compact.optInt("count")+" Pokémon.",true);
            }catch(Exception e){
                notifyWeb("Importação não concluída: "+text(e.getMessage(),160),false);
            }finally{
                emitSourceStatus(selected);
            }
        });
    }
    private void recordImportHistory(int selected,JSONObject current,JSONObject before){
        try{
            Map<String,String> previous=new HashMap<>(),next=new HashMap<>();
            JSONArray original=before==null?null:before.optJSONArray("pokemons");
            JSONArray updated=current.optJSONArray("pokemons");
            if(original!=null)for(int i=0;i<original.length();i++){
                JSONObject p=original.optJSONObject(i);if(p!=null)previous.put(p.optString("id",""),p.toString());
            }
            if(updated!=null)for(int i=0;i<updated.length();i++){
                JSONObject p=updated.optJSONObject(i);if(p!=null)next.put(p.optString("id",""),p.toString());
            }
            int added=0,removed=0,changed=0;
            for(Map.Entry<String,String> p:next.entrySet()){
                if(!previous.containsKey(p.getKey()))added++;
                else if(!p.getValue().equals(previous.get(p.getKey())))changed++;
            }
            for(String id:previous.keySet())if(!next.containsKey(id))removed++;
            SharedPreferences settings=getSharedPreferences("pokedex_import_history",MODE_PRIVATE);
            JSONArray existing=new JSONArray(settings.getString("slot"+selected,"[]"));
            JSONObject row=new JSONObject();
            row.put("at",System.currentTimeMillis());
            row.put("total",next.size());row.put("added",added);
            row.put("removed",removed);row.put("changed",changed);
            row.put("baseline",before!=null);
            JSONArray compact=new JSONArray();compact.put(row);
            for(int i=0;i<Math.min(existing.length(),9);i++)compact.put(existing.getJSONObject(i));
            settings.edit().putString("slot"+selected,compact.toString()).apply();
        }catch(Exception ignored){}
    }
    private void notifySourceWeb(int selected,String message,boolean ok){
        runOnUiThread(()->{
            if(closing||view==null)return;
            view.evaluateJavascript("window.pokeSourceImportCompleted&&window.pokeSourceImportCompleted("+
                selected+","+JSONObject.quote(message)+","+(ok?"true":"false")+");",null);
        });
    }
    private void notifyWeb(String message,boolean ok){
        runOnUiThread(()->{
            if(closing||view==null)return;
            view.evaluateJavascript("window.pokeImportCompleted("+
                JSONObject.quote(message)+","+(ok?"true":"false")+");",null);
        });
    }
    @Override public void onBackPressed(){
        if(view!=null)view.evaluateJavascript(
            "window.pokeBack&&window.pokeBack()===true",result->{
                if(!"true".equals(result))super.onBackPressed();
            });
        else super.onBackPressed();
    }
    @Override protected void onResume(){
        super.onResume();
        sourceHandler.removeCallbacks(sourceTicker);
        sourceHandler.postDelayed(sourceTicker,1200L);
    }
    @Override protected void onPause(){
        sourceHandler.removeCallbacks(sourceTicker);
        super.onPause();
    }
    @Override protected void onDestroy(){
        closing=true;
        sourceHandler.removeCallbacks(sourceTicker);
        backgroundCancel.set(true);
        backgroundWorker.shutdownNow();
        if(spriteStore!=null)spriteStore.shutdown();
        worker.shutdownNow();
        if(view!=null){
            view.removeJavascriptInterface("PersonalInventory");
            view.destroy();
            view=null;
        }
        super.onDestroy();
    }
}

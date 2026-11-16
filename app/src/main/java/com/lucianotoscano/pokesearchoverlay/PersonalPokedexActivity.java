package com.lucianotoscano.pokesearchoverlay;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
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
    private static final int MAX_IMPORT_BYTES=24*1024*1024;
    private static final int MAX_POKEMON=10000;
    private static final Pattern LARGE_ID=Pattern.compile("(\"id\"\\s*:\\s*)(\\d{16,20})(?=\\s*[,}])");
    private static final Pattern TAG_ARRAY=Pattern.compile("(\\\"pokemonTagIds\\\"\\s*:\\s*\\[)([^\\]]*)(\\])");
    private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private WebView view;
    private volatile boolean closing=false;
    private int pendingSlot=1;

    private File snapshot(int slot){
        return new File(new File(getFilesDir(),"pokedex_personal"),"slot"+slot+".json");
    }
    private static int slot(int s){return s==2?2:1;}
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
        HashSet<String> known=new HashSet<>();
        for(int i=0;i<original.length();i++){
            JSONObject p=original.optJSONObject(i);
            if(p==null||p.optBoolean("isEgg",false))continue;
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
            individual.put("lucky",p.optBoolean("isLucky",false));
            individual.put("shiny",display.optBoolean("shiny",false));
            individual.put("alignment",display.optInt("alignment",0));
            individual.put("form",display.optInt("form",0));
            individual.put("formName",text(display.optString("formName",""),70));
            individual.put("costume",number(display,"costume",100000));
            individual.put("gender",number(display,"gender",10));
            individual.put("size",number(p,"size",10));
            individual.put("pokeball",number(p,"pokeball",100));
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
        @JavascriptInterface public void chooseJson(int requestedSlot){
            runOnUiThread(()->{
                if(closing)return;
                pendingSlot=slot(requestedSlot);
                Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.setType("*/*"); // Some document providers label JSON as octet-stream.
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.putExtra(Intent.EXTRA_MIME_TYPES,new String[]{
                    "application/json","text/plain","application/octet-stream"});
                startActivityForResult(intent,PICK_STATS);
            });
        }
        @JavascriptInterface public String getDecoration(int requestedSlot,String pokemonId){
            if(!pokemonId.matches("[0-9]{1,20}"))return "default";
            return getSharedPreferences("personal_pokedex_looks",MODE_PRIVATE)
                .getString(slot(requestedSlot)+":"+pokemonId,"default");
        }
        @JavascriptInterface public void setDecoration(int requestedSlot,String pokemonId,String name){
            if(!pokemonId.matches("[0-9]{1,20}"))return;
            if(!("default".equals(name)||"aurora".equals(name)||"sunset".equals(name)||
                "ocean".equals(name)||"night".equals(name)))return;
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
        worker.execute(()->{
            try(InputStream input=getContentResolver().openInputStream(uri)){
                if(input==null)throw new IOException("Não foi possível ler o arquivo.");
                String raw=new String(bounded(input,MAX_IMPORT_BYTES),StandardCharsets.UTF_8);
                JSONObject compact=compact(raw);
                File dest=snapshot(selected);
                if(!dest.getParentFile().isDirectory()&&!dest.getParentFile().mkdirs())
                    throw new IOException("Armazenamento local indisponível.");
                File tmp=new File(dest.getParentFile(),"slot"+selected+".pending");
                try(FileOutputStream out=new FileOutputStream(tmp)){
                    out.write(compact.toString().getBytes(StandardCharsets.UTF_8));
                    out.getFD().sync();
                }
                if(!tmp.renameTo(dest))throw new IOException("Falha ao salvar coleção.");
                notifyWeb("Importação concluída: "+compact.optInt("count")+" Pokémon.",true);
            }catch(Exception e){
                notifyWeb("Importação não concluída: "+text(e.getMessage(),160),false);
            }
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
    @Override protected void onDestroy(){
        closing=true;
        worker.shutdownNow();
        if(view!=null){
            view.removeJavascriptInterface("PersonalInventory");
            view.destroy();
            view=null;
        }
        super.onDestroy();
    }
}

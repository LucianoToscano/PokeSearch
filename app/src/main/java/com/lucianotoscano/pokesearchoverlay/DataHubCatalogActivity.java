package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashSet;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * LT364: aproveita o catálogo de espécies/formas e classificações do APK
 * Data Hub autorizado, SEM executar código, instalar APK ou ler dados privados.
 * Fonte: APK instalado (arquivo publicamente legível) ou arquivo escolhido
 * explicitamente pelo usuário; depois mantém SOMENTE três JSONs no app.
 */
public final class DataHubCatalogActivity extends Activity {
    private static final int PICK_APK=514;
    private static final String DATA_HUB="net.pgtools.data_hub";
    private static final String[] SOURCE_NAMES={
        "assets/pokemons.json","assets/raidRatings.json","assets/maxBattleRatings.json"};
    private static final String[] CACHE_NAMES={
        "pokemons.json","raidRatings.json","maxBattleRatings.json"};
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private boolean destroyed=false,light=false,full=false;
    private int fg,bg,secondary,mode=0;
    private JSONArray species=new JSONArray(),raids=new JSONArray(),maxBattles=new JSONArray();
    private TextView status,heading;
    private EditText filter;
    private LinearLayout list;
    private int d(float v){return Math.round(v*getResources().getDisplayMetrics().density);}
    private TextView text(String value,int sp,boolean bold){
        TextView t=new TextView(this);t.setText(value);t.setTextSize(sp);
        t.setTextColor(fg);if(bold)t.setTypeface(null,1);return t;
    }
    private Button button(String label){
        Button b=new Button(this);b.setText(label);b.setAllCaps(false);
        b.setMinHeight(0);b.setMinimumHeight(0);b.setTextSize(11);return b;
    }
    private LinearLayout row(){
        LinearLayout l=new LinearLayout(this);
        l.setGravity(Gravity.CENTER_VERTICAL);
        l.setOrientation(LinearLayout.HORIZONTAL);return l;
    }
    private File storeDir(){return new File(getFilesDir(),"datahub_lt364");}
    @Override protected void onCreate(Bundle state){
        super.onCreate(state);
        light=getSharedPreferences("prefs",MODE_PRIVATE).getBoolean("homeLightMode",false);
        fg=light?0xFF15293C:0xFFEEF3FF;
        secondary=light?0xFF617184:0xFFABBCCC;
        bg=light?0xFFEFF5FA:0xFF111824;
        getWindow().setStatusBarColor(bg);getWindow().setNavigationBarColor(bg);
        ScrollView page=new ScrollView(this);
        page.setBackgroundColor(bg);
        LinearLayout root=new LinearLayout(this);
        root.setPadding(d(12),d(12),d(12),d(18));
        root.setOrientation(LinearLayout.VERTICAL);
        page.addView(root);setContentView(page);

        LinearLayout nav=row();
        Button back=button("‹");
        back.setContentDescription("Voltar para a Home do PokeSearch");
        back.setOnClickListener(v->finish());
        nav.addView(back,new LinearLayout.LayoutParams(d(48),d(44)));
        heading=text("DATA HUB · CATÁLOGO",16,true);
        nav.addView(heading,new LinearLayout.LayoutParams(0,-2,1));
        root.addView(nav);
        TextView explain=text("Espécies, formas e categorias do APK Data Hub. "+
            "Não são miniaturas do feed nem pontos ativos no mapa.",11,false);
        explain.setTextColor(secondary);root.addView(explain);
        status=text("Verificando catálogo local…",11,false);
        root.addView(status);

        LinearLayout controls=row();
        Button installed=button("Ler instalado");
        installed.setOnClickListener(v->loadInstalled());
        controls.addView(installed,new LinearLayout.LayoutParams(0,d(43),1));
        Button importApk=button("Selecionar APK");
        importApk.setOnClickListener(v->pickApk());
        controls.addView(importApk,new LinearLayout.LayoutParams(0,d(43),1));
        root.addView(controls);

        LinearLayout tabs=row();
        String[] tabsName={"Pokédex / formas","Reides","Max Battles"};
        for(int i=0;i<tabsName.length;i++){
            final int selected=i;Button tab=button(tabsName[i]);
            tab.setOnClickListener(v->{mode=selected;render();});
            tabs.addView(tab,new LinearLayout.LayoutParams(0,d(42),1));
        }
        root.addView(tabs);
        filter=new EditText(this);
        filter.setSingleLine(true);filter.setTextSize(13);
        filter.setHint("Número ou nome do Pokémon");
        filter.setTextColor(fg);filter.setHintTextColor(secondary);
        filter.setContentDescription("Filtrar catálogo de espécies e formas");
        root.addView(filter,new LinearLayout.LayoutParams(-1,d(45)));
        filter.addTextChangedListener(new TextWatcher(){
            public void beforeTextChanged(CharSequence s,int start,int count,int after){}
            public void onTextChanged(CharSequence s,int start,int before,int count){render();}
            public void afterTextChanged(Editable s){}
        });
        list=new LinearLayout(this);list.setOrientation(LinearLayout.VERTICAL);
        root.addView(list);
        mode="power_spots".equals(getIntent().getStringExtra("mode"))?2:0;
        loadBuiltInFallback();
        loadCached();
        loadInstalled();
    }
    private void loadBuiltInFallback(){
        try(InputStream input=getAssets().open("pokemon_catalog.json")){
            byte[] bytes=readBounded(input,80000);
            species=new JSONArray(new String(bytes,java.nio.charset.StandardCharsets.UTF_8));
        }catch(Exception error){species=new JSONArray();}
        full=false;render();
    }
    private static byte[] readBounded(InputStream input,int cap)throws IOException{
        try(ByteArrayOutputStream out=new ByteArrayOutputStream()){
            byte[] bytes=new byte[4096];int n;
            while((n=input.read(bytes))!=-1){
                if(out.size()+n>cap)throw new IOException("Catálogo excede tamanho permitido");
                out.write(bytes,0,n);
            }
            return out.toByteArray();
        }
    }
    private static JSONArray checked(String name,byte[] bytes)throws Exception{
        if(bytes==null||bytes.length==0)throw new IOException("Asset ausente: "+name);
        JSONArray array=new JSONArray(new String(bytes,
            java.nio.charset.StandardCharsets.UTF_8));
        if("pokemons.json".equals(name)){
            if(array.length()<500||array.length()>1500)
                throw new IOException("Quantidade de espécies inválida");
            HashSet<Integer> ids=new HashSet<>();
            for(int i=0;i<array.length();i++){
                JSONObject item=array.getJSONObject(i);
                int id=item.optInt("id",0);
                if(id<1||id>5000||!ids.add(id))
                    throw new IOException("ID duplicado/fora da faixa");
                JSONArray forms=item.optJSONArray("forms");
                if(forms==null||forms.length()>120)
                    throw new IOException("Formas inválidas");
                for(int j=0;j<forms.length();j++){
                    JSONObject f=forms.getJSONObject(j);
                    if(f.optInt("id",-1)<0||
                        PokeListApiPolicy.safeLabel(f.optString("name","")).isEmpty())
                        throw new IOException("Forma sem nome ou ID");
                }
            }
        }else if(array.length()>40)
            throw new IOException("Número de categorias inválido");
        return array;
    }
    private static final class BundleData {
        final byte[][] bytes=new byte[SOURCE_NAMES.length][];
        final JSONArray[] arrays=new JSONArray[SOURCE_NAMES.length];
    }
    private static BundleData inspectZip(File file)throws Exception{
        BundleData result=new BundleData();
        try(ZipFile zip=new ZipFile(file)){
            for(int i=0;i<SOURCE_NAMES.length;i++){
                ZipEntry entry=zip.getEntry(SOURCE_NAMES[i]);
                if(entry==null||entry.isDirectory()||entry.getSize()>256000)
                    throw new IOException("Asset Data Hub ausente/grande");
                try(InputStream input=zip.getInputStream(entry)){
                    result.bytes[i]=readBounded(input,256000);
                }
                result.arrays[i]=checked(CACHE_NAMES[i],result.bytes[i]);
            }
        }
        return result;
    }
    private void apply(BundleData data,String source){
        if(destroyed)return;
        species=data.arrays[0];raids=data.arrays[1];maxBattles=data.arrays[2];
        full=true;
        int forms=0;
        for(int i=0;i<species.length();i++)
            forms+=species.optJSONObject(i).optJSONArray("forms").length();
        status.setText(source+" · "+species.length()+" espécies / "+forms+
            " formas, "+raids.length()+" categorias de Reides, "+
            maxBattles.length()+" categorias Max Battles.");
        render();
    }
    private void persist(BundleData data)throws IOException{
        File dir=storeDir();
        if(!dir.isDirectory()&&!dir.mkdirs())
            throw new IOException("Sem espaço privado para catálogo");
        for(int i=0;i<CACHE_NAMES.length;i++){
            File target=new File(dir,CACHE_NAMES[i]);
            File temp=new File(dir,CACHE_NAMES[i]+".tmp");
            try(FileOutputStream out=new FileOutputStream(temp)){
                out.write(data.bytes[i]);out.getFD().sync();
            }
            if(!temp.renameTo(target)){
                temp.delete();throw new IOException("Falha ao guardar catálogo");
            }
        }
    }
    private void loadCached(){
        io.execute(()->{
            try{
                BundleData data=new BundleData();
                for(int i=0;i<CACHE_NAMES.length;i++){
                    try(InputStream input=new java.io.FileInputStream(
                        new File(storeDir(),CACHE_NAMES[i]))){
                        data.bytes[i]=readBounded(input,256000);
                    }
                    data.arrays[i]=checked(CACHE_NAMES[i],data.bytes[i]);
                }
                runOnUiThread(()->apply(data,"Catálogo salvo"));
            }catch(Exception ignored){}
        });
    }
    private void loadInstalled(){
        io.execute(()->{
            try{
                ApplicationInfo info=getPackageManager().getApplicationInfo(DATA_HUB,0);
                BundleData data=inspectZip(new File(info.sourceDir));
                persist(data);
                runOnUiThread(()->apply(data,"Data Hub instalado"));
            }catch(Exception absent){
                runOnUiThread(()->{
                    if(!destroyed&&!full)status.setText(
                        "Data Hub não acessível pelo sistema. "+
                        "Use Selecionar APK para importar o catálogo completo. "+
                        "Pokédex básica local disponível.");
                });
            }
        });
    }
    private void pickApk(){
        Intent file=new Intent(Intent.ACTION_OPEN_DOCUMENT);
        file.addCategory(Intent.CATEGORY_OPENABLE);
        file.setType("*/*");
        startActivityForResult(file,PICK_APK);
    }
    @Override protected void onActivityResult(int code,int result,Intent data){
        super.onActivityResult(code,result,data);
        if(code!=PICK_APK||result!=RESULT_OK||data==null||data.getData()==null)return;
        final Uri uri=data.getData();
        status.setText("Lendo somente JSONs de um APK escolhido…");
        io.execute(()->{
            File tmp=new File(getCacheDir(),"lt364-datahub-import.apk");
            try{
                try(InputStream input=getContentResolver().openInputStream(uri);
                    FileOutputStream output=new FileOutputStream(tmp)){
                    if(input==null)throw new IOException("Arquivo inacessível");
                    byte[] buf=new byte[8192];int n;long total=0;
                    while((n=input.read(buf))!=-1){
                        total+=n;
                        if(total>24*1024*1024)
                            throw new IOException("APK excede 24 MB");
                        output.write(buf,0,n);
                    }
                }
                BundleData validated=inspectZip(tmp);
                persist(validated);
                runOnUiThread(()->apply(validated,"Catálogo importado"));
            }catch(Exception e){
                runOnUiThread(()->{
                    if(!destroyed)status.setText("Importação recusada: "+
                        "selecione o APK Data Hub v2.5.3 com os três JSONs esperados.");
                });
            }finally{tmp.delete();}
        });
    }
    private void render(){
        if(list==null)return;
        list.removeAllViews();
        JSONArray source=mode==0?species:mode==1?raids:maxBattles;
        if(mode>0&&!full){
            list.addView(text("Classificações Data Hub não carregadas. "+
                "Abra o APK instalado ou importe o arquivo para visualizar.",12,false));
            return;
        }
        String needle=filter.getText().toString().trim().toLowerCase(java.util.Locale.ROOT);
        int matched=0,displayed=0;
        for(int i=0;i<source.length();i++){
            String title,detail;
            if(mode==0){
                JSONObject obj=source.optJSONObject(i);
                int id;String name;
                JSONArray forms=null;
                if(obj!=null){
                    id=obj.optInt("id",0);name=obj.optString("name","");
                    forms=obj.optJSONArray("forms");
                }else{
                    JSONArray pair=source.optJSONArray(i);
                    if(pair==null)continue;
                    id=pair.optInt(0,0);name=pair.optString(1,"");
                }
                title="#"+id+" · "+PokeListApiPolicy.safeLabel(name);
                if(forms==null)detail="Formas não carregadas (Pokédex básica)";
                else{
                    StringBuilder sb=new StringBuilder();
                    for(int j=0;j<Math.min(18,forms.length());j++){
                        JSONObject f=forms.optJSONObject(j);
                        if(f==null)continue;
                        if(sb.length()>0)sb.append(" · ");
                        sb.append(PokeListApiPolicy.safeLabel(f.optString("name","?")))
                            .append(" (").append(f.optInt("id",0)).append(")");
                    }
                    if(forms.length()>18)sb.append(" · +").append(forms.length()-18);
                    detail=sb.toString();
                }
            }else{
                JSONObject obj=source.optJSONObject(i);
                if(obj==null)continue;
                title=PokeListApiPolicy.safeLabel(obj.optString("key",""));
                detail="ID "+obj.optInt("ratingTypeID",0)+" · ícones "+
                    obj.optInt("icons",0)+" · padrão "+
                    PokeListApiPolicy.safeLabel(obj.optString("template",""));
            }
            if(!needle.isEmpty()&&!(title+" "+detail).toLowerCase(
                java.util.Locale.ROOT).contains(needle))continue;
            matched++;
            if(displayed++>=40)continue;
            LinearLayout card=new LinearLayout(this);
            card.setOrientation(LinearLayout.VERTICAL);
            card.setPadding(d(6),d(7),d(6),d(7));
            card.addView(text(title,12,true));
            TextView extra=text(detail,10,false);extra.setTextColor(secondary);
            card.addView(extra);
            LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,-2);
            lp.topMargin=d(4);
            list.addView(card,lp);
        }
        TextView count=text("Exibidos "+Math.min(matched,40)+" de "+
            matched+" · conteúdo local; não representa eventos ativos.",10,false);
        list.addView(count,0);
    }
    @Override protected void onDestroy(){
        destroyed=true;io.shutdownNow();super.onDestroy();
    }
}

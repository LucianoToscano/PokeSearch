package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.app.Dialog;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.widget.*;
import org.json.JSONArray;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

/** Integração nativa de preferências do PGS Buscas; motor de gestos ainda não habilitado. */
final class PgsBuscasPanel {
    private static final String PREFS="pgs_buscas_auto_v1",KEY="species";
    private static List<Species> cached;
    private static final class Species {
        final int number;final String name;
        Species(int n,String s){number=n;name=s;}
    }
    static String normalize(String s){
        return Normalizer.normalize(s.toLowerCase(Locale.ROOT),Normalizer.Form.NFD)
            .replaceAll("\\p{M}","").replaceAll("[^a-z0-9]","");
    }
    private static synchronized List<Species> catalog(Context c){
        if(cached!=null)return cached;
        ArrayList<Species> list=new ArrayList<>();
        try(InputStream in=c.getAssets().open("pokemon_catalog.json")){
            ByteArrayOutputStream out=new ByteArrayOutputStream();byte[] buf=new byte[4096];int n;
            while((n=in.read(buf))!=-1)out.write(buf,0,n);
            JSONArray rows=new JSONArray(out.toString("UTF-8"));
            for(int i=0;i<rows.length();i++){
                JSONArray row=rows.optJSONArray(i);
                if(row!=null&&row.length()>1)list.add(new Species(row.optInt(0),row.optString(1)));
            }
        }catch(Exception ignored){}
        cached=Collections.unmodifiableList(list);return cached;
    }
    private static List<Integer> selected(Context c){
        ArrayList<Integer> ids=new ArrayList<>();
        try{
            JSONArray data=new JSONArray(c.getSharedPreferences(PREFS,0).getString(KEY,"[]"));
            for(int i=0;i<data.length()&&ids.size()<50;i++){
                int id=data.optInt(i);
                if(id>0&&!ids.contains(id))ids.add(id);
            }
        }catch(Exception ignored){}
        return ids;
    }
    private static void save(Context c,List<Integer> ids){
        JSONArray json=new JSONArray();for(int id:ids)json.put(id);
        c.getSharedPreferences(PREFS,0).edit().putString(KEY,json.toString()).apply();
    }
    private static boolean toggle(Context c,int id){
        List<Integer> ids=selected(c);
        if(ids.contains(id))ids.remove(Integer.valueOf(id));
        else if(ids.size()>=50)return false;
        else ids.add(id);
        save(c,ids);return true;
    }
    private static int dp(Context c,int value){
        return Math.round(c.getResources().getDisplayMetrics().density*value);
    }
    private static TextView text(Context c,String value){
        TextView v=new TextView(c);v.setText(value);v.setTextColor(Color.WHITE);v.setTextSize(13);
        v.setGravity(Gravity.CENTER_VERTICAL);v.setPadding(dp(c,7),dp(c,6),dp(c,7),dp(c,6));return v;
    }
    private static Button button(Context c,String value){
        Button b=new Button(c);b.setAllCaps(false);b.setTextSize(12);b.setText(value);return b;
    }
    static void show(Activity a){
        Dialog dialog=new Dialog(a);
        LinearLayout root=new LinearLayout(a);root.setOrientation(1);root.setPadding(dp(a,8),dp(a,8),dp(a,8),dp(a,8));
        GradientDrawable bg=new GradientDrawable();bg.setColor(0xF010151F);bg.setCornerRadius(dp(a,12));root.setBackground(bg);
        TextView heading=text(a,"🔎 BUSCAS");
        root.addView(heading);
        LinearLayout tabs=new LinearLayout(a);
        LinearLayout content=new LinearLayout(a);content.setOrientation(1);
        String[] names={"🔎 Buscas","⏱ Tempo","🔔 Alertas","••• Mais"};
        for(int i=0;i<4;i++){
            final int index=i;Button b=button(a,names[i]);
            tabs.addView(b,new LinearLayout.LayoutParams(0,dp(a,44),1));
            b.setOnClickListener(v->render(a,content,heading,index,dialog));
        }
        root.addView(tabs);root.addView(content,new LinearLayout.LayoutParams(-1,dp(a,400)));
        render(a,content,heading,0,dialog);
        dialog.setContentView(root);dialog.show();
        dialog.getWindow().setLayout(Math.min(dp(a,350),a.getResources().getDisplayMetrics().widthPixels-dp(a,18)),-2);
    }
    private static void render(Activity a,LinearLayout content,TextView heading,int tab,Dialog dialog){
        content.removeAllViews();SharedPreferences prefs=a.getSharedPreferences(PREFS,0);
        if(tab==0){
            heading.setText("🔎 BUSCAS · Selecionados "+selected(a).size()+"/50");
            EditText search=new EditText(a);search.setSingleLine(true);search.setTextColor(Color.WHITE);
            search.setHint("Nome ou número");search.setHintTextColor(0xFFBFC8D5);content.addView(search);
            Button clear=button(a,"Limpar seleção");content.addView(clear);
            ScrollView scroll=new ScrollView(a);LinearLayout list=new LinearLayout(a);list.setOrientation(1);
            scroll.addView(list);content.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
            final Runnable[] refresh=new Runnable[1];
            refresh[0]=()->{
                list.removeAllViews();List<Integer> ids=selected(a);
                heading.setText("🔎 BUSCAS · Selecionados "+ids.size()+"/50");
                String q=normalize(search.getText().toString());int count=0;
                for(Species s:catalog(a)){
                    boolean chosen=ids.contains(s.number);
                    if(q.isEmpty()&&!chosen)continue;
                    if(!q.isEmpty()&&!normalize(s.name).contains(q)&&!String.valueOf(s.number).startsWith(q))continue;
                    LinearLayout row=new LinearLayout(a);row.setGravity(Gravity.CENTER_VERTICAL);
                    row.addView(text(a,(chosen?"✓ ":"")+"#"+s.number+" "+s.name),
                        new LinearLayout.LayoutParams(0,dp(a,44),1));
                    Button pick=button(a,chosen?"−":"+");row.addView(pick);
                    pick.setOnClickListener(v->{
                        if(!toggle(a,s.number))Toast.makeText(a,"Limite de 50 espécies",Toast.LENGTH_SHORT).show();
                        refresh[0].run();
                    });
                    if(chosen){
                        Button up=button(a,"↑");row.addView(up);
                        up.setOnClickListener(v->{
                            List<Integer> order=selected(a);int i=order.indexOf(s.number);
                            if(i>0){Collections.swap(order,i,i-1);save(a,order);}refresh[0].run();
                        });
                    }
                    list.addView(row);if(++count>=100)break;
                }
                if(count==0)list.addView(text(a,"Nenhum resultado"));
                list.addView(text(a,"Sem modelo visual confiável: cadastrar ícone antes da automação."));
            };
            clear.setOnClickListener(v->{save(a,new ArrayList<Integer>());refresh[0].run();});
            search.addTextChangedListener(new TextWatcher(){
                public void beforeTextChanged(CharSequence s,int st,int count,int after){}
                public void onTextChanged(CharSequence s,int st,int before,int count){refresh[0].run();}
                public void afterTextChanged(Editable e){}
            });
            refresh[0].run();
        }else if(tab==1){
            heading.setText("⏱ TEMPO");
            String[] keys={"post_load","load_timeout","first_empty","second_empty","repeat_interval"};
            String[] names={"Após carregamento","Limite do mapa","Primeira revarredura","Segunda revarredura","Repetição"};
            int[] defaults={5,60,60,120,120};
            for(int i=0;i<keys.length;i++){
                final String key=keys[i];LinearLayout row=new LinearLayout(a);
                row.addView(text(a,names[i]+" (s)"),new LinearLayout.LayoutParams(0,dp(a,48),1));
                EditText input=new EditText(a);input.setInputType(2);input.setTextColor(Color.WHITE);
                input.setText(String.valueOf(prefs.getInt(key,defaults[i])));
                row.addView(input,new LinearLayout.LayoutParams(dp(a,75),dp(a,48)));
                input.addTextChangedListener(new TextWatcher(){
                    public void beforeTextChanged(CharSequence s,int st,int count,int after){}
                    public void onTextChanged(CharSequence s,int st,int before,int count){
                        try{int n=Integer.parseInt(s.toString());
                            if(n>0&&n<=3600)prefs.edit().putInt(key,n).apply();
                        }catch(Exception ignored){}
                    }
                    public void afterTextChanged(Editable e){}
                });
                content.addView(row);
            }
            Switch repeat=new Switch(a);repeat.setText("Repetir automaticamente");
            repeat.setTextColor(Color.WHITE);repeat.setChecked(prefs.getBoolean("repeat",true));
            repeat.setOnCheckedChangeListener((v,on)->prefs.edit().putBoolean("repeat",on).apply());
            content.addView(repeat);
        }else if(tab==2){
            heading.setText("🔔 NOTIFICAÇÕES");
            content.addView(text(a,"Novos Pokémon · Pokémon de Buscas · Shiny"));
            content.addView(text(a,"Alertas dependem de fontes verificadas; não há detecção Shiny ativa."));
            Switch vibrate=new Switch(a);vibrate.setText("Vibração Shiny");vibrate.setTextColor(Color.WHITE);
            vibrate.setChecked(prefs.getBoolean("vibrate",true));
            vibrate.setOnCheckedChangeListener((v,on)->prefs.edit().putBoolean("vibrate",on).apply());
            content.addView(vibrate);
        }else{
            heading.setText("••• MAIS");
            content.addView(text(a,"Automação de toques ainda desabilitada para evitar cliques sem confirmação visual."));
            Button donate=button(a,"Doar");donate.setOnClickListener(v->PixSupport.show(a));content.addView(donate);
            Button close=button(a,"Fechar");close.setOnClickListener(v->dialog.dismiss());content.addView(close);
        }
    }
}

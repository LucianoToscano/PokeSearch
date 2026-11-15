package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.graphics.Color;
import android.os.Bundle;
import android.os.SystemClock;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Consulta manual, isolada das duas contas/Pokébolas e do serviço de acessibilidade. */
public final class PokeListRadarActivity extends Activity {
    private final ExecutorService io=Executors.newSingleThreadExecutor();
    private boolean destroyed=false,loading=false;
    private long nextAllowedElapsed=0L;
    private Spinner category;
    private EditText latitude,longitude,distance,ids,ivMin;
    private TextView state,subtitle;
    private LinearLayout results;
    private Button search;
    private boolean light;
    private int fg,bg,secondary;
    private int d(float v){return Math.round(v*getResources().getDisplayMetrics().density);}
    private TextView text(String value,int size,boolean bold){
        TextView t=new TextView(this);
        t.setText(value);t.setTextSize(size);t.setTextColor(fg);
        if(bold)t.setTypeface(null,1);
        return t;
    }
    private EditText input(String hint,String defaultValue,int type){
        EditText t=new EditText(this);
        t.setSingleLine(true);t.setTextSize(13);t.setTextColor(fg);
        t.setHintTextColor(secondary);t.setHint(hint);t.setText(defaultValue);
        t.setInputType(type);
        t.setPadding(d(8),d(5),d(8),d(5));
        t.setBackgroundTintList(android.content.res.ColorStateList.valueOf(secondary));
        return t;
    }
    private LinearLayout col(){
        LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.VERTICAL);return l;
    }
    private LinearLayout row(){
        LinearLayout l=new LinearLayout(this);
        l.setOrientation(LinearLayout.HORIZONTAL);l.setGravity(Gravity.CENTER_VERTICAL);
        return l;
    }
    private Button button(String label){
        Button b=new Button(this);b.setAllCaps(false);b.setText(label);
        b.setTextSize(12);b.setMinHeight(0);b.setMinimumHeight(0);
        return b;
    }
    private void addPair(LinearLayout parent,String a,EditText x,String b,EditText y){
        LinearLayout r=row();
        LinearLayout one=col(),two=col();
        one.addView(text(a,11,false));
        one.addView(x,new LinearLayout.LayoutParams(-1,d(40)));
        two.addView(text(b,11,false));
        two.addView(y,new LinearLayout.LayoutParams(-1,d(40)));
        r.addView(one,new LinearLayout.LayoutParams(0,-2,1));
        LinearLayout.LayoutParams second=new LinearLayout.LayoutParams(0,-2,1);
        second.leftMargin=d(8);r.addView(two,second);
        parent.addView(r);
    }
    @Override protected void onCreate(Bundle b){
        super.onCreate(b);
        light=getSharedPreferences("prefs",MODE_PRIVATE).getBoolean("homeLightMode",false);
        fg=light?Color.rgb(26,43,60):Color.rgb(239,246,255);
        bg=light?Color.rgb(239,245,250):Color.rgb(14,20,30);
        secondary=light?Color.rgb(81,101,117):Color.rgb(162,180,200);
        getWindow().setStatusBarColor(bg);
        getWindow().setNavigationBarColor(bg);
        ScrollView scroll=new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(bg);
        LinearLayout panel=col();panel.setPadding(d(13),d(12),d(13),d(22));
        scroll.addView(panel);
        setContentView(scroll);

        LinearLayout header=row();
        Button back=button("‹");
        back.setContentDescription("Voltar para a Home do PokeSearch");
        back.setOnClickListener(v->finish());
        header.addView(back,new LinearLayout.LayoutParams(d(48),d(46)));
        header.addView(text("RADAR · POKELIST",17,true),
            new LinearLayout.LayoutParams(0,-2,1));
        panel.addView(header);
        subtitle=text("Consulta autorizada pelo usuário · somente ao tocar Buscar. "+
            "Sem GPS automático, teleporte ou cliques no jogo.",11,false);
        subtitle.setTextColor(secondary);
        panel.addView(subtitle);

        category=new Spinner(this);
        String[] titles={"Pokémon","Raids","Quests","Rocket","Líderes Rocket"};
        ArrayAdapter<String> adapter=new ArrayAdapter<>(this,
            android.R.layout.simple_spinner_dropdown_item,titles);
        category.setAdapter(adapter);
        category.setContentDescription("Categoria de consulta PokeList");
        panel.addView(category,new LinearLayout.LayoutParams(-1,d(44)));
        String initial=getIntent().getStringExtra("type");
        for(int i=0;i<PokeListApiPolicy.TYPES.length;i++)
            if(PokeListApiPolicy.TYPES[i].equals(initial))category.setSelection(i);

        latitude=input("Latitude","",InputType.TYPE_CLASS_NUMBER|
            InputType.TYPE_NUMBER_FLAG_DECIMAL|InputType.TYPE_NUMBER_FLAG_SIGNED);
        longitude=input("Longitude","",InputType.TYPE_CLASS_NUMBER|
            InputType.TYPE_NUMBER_FLAG_DECIMAL|InputType.TYPE_NUMBER_FLAG_SIGNED);
        distance=input("1–200","50",InputType.TYPE_CLASS_NUMBER);
        ids=input("Ex.: 25,150 (opcional)","",InputType.TYPE_CLASS_TEXT);
        ivMin=input("0–100","0",InputType.TYPE_CLASS_NUMBER);
        addPair(panel,"Latitude (informada por você)",latitude,
            "Longitude (informada por você)",longitude);
        addPair(panel,"Raio (unidade conforme API)",distance,
            "IV mínimo (somente Pokémon)",ivMin);
        panel.addView(text("IDs separados por vírgula: Pokémon para Pokémon/Raids/Quests; "+
            "ID de Rocket para Rocket/Líderes.",10,false));
        panel.addView(ids,new LinearLayout.LayoutParams(-1,d(42)));
        search=button("Buscar agora");
        search.setContentDescription("Enviar consulta manual à API PokeList");
        search.setOnClickListener(v->query());
        panel.addView(search,new LinearLayout.LayoutParams(-1,d(44)));
        state=text("Informe latitude e longitude e toque Buscar. "+
            "Não há atualização automática.",11,false);
        panel.addView(state);
        results=col();results.setPadding(0,d(8),0,0);
        panel.addView(results);

        TextView footer=text("Fonte: PokeList / moonani.com. Resultado da API "+
            "não prova Shiny, captura, encontro nem disponibilidade no jogo. "+
            "Itens vencidos são ocultados; horários ausentes são desconhecidos.",10,false);
        footer.setTextColor(secondary);
        LinearLayout.LayoutParams footerLp=new LinearLayout.LayoutParams(-1,-2);
        footerLp.topMargin=d(12);panel.addView(footer,footerLp);
    }
    private static double coordinate(EditText field){
        String s=field.getText().toString().trim().replace(',','.');
        if(s.isEmpty())throw new IllegalArgumentException("Informe as coordenadas.");
        try{return Double.parseDouble(s);}catch(NumberFormatException bad){
            throw new IllegalArgumentException("Use coordenadas numéricas.");
        }
    }
    private static int integer(EditText field,String label){
        try{return Integer.parseInt(field.getText().toString().trim());}
        catch(NumberFormatException e){throw new IllegalArgumentException(label+" inválido.");}
    }
    private void query(){
        if(loading)return;
        long now=SystemClock.elapsedRealtime();
        if(now<nextAllowedElapsed){
            state.setText("Aguarde "+Math.max(1,(nextAllowedElapsed-now+999)/1000)+
                " s para consultar novamente; respeitando o provedor.");
            return;
        }
        final PokeListApiPolicy.Query q;
        try{
            q=new PokeListApiPolicy.Query(
                PokeListApiPolicy.TYPES[category.getSelectedItemPosition()],
                coordinate(latitude),coordinate(longitude),
                integer(distance,"Raio"),ids.getText().toString(),integer(ivMin,"IV"));
        }catch(IllegalArgumentException problem){
            state.setText(problem.getMessage());return;
        }
        loading=true;search.setEnabled(false);
        nextAllowedElapsed=now+PokeListApiPolicy.MIN_REFRESH_MS;
        state.setText("Consultando PokeList com TLS…");
        results.removeAllViews();
        io.execute(()->{
            try{
                PokeListFeedClient.Response response=PokeListFeedClient.fetch(q);
                runOnUiThread(()->{
                    if(destroyed)return;
                    loading=false;search.setEnabled(true);
                    showResults(response);
                });
            }catch(Exception error){
                final String safe;
                final long retryMs;
                if(error instanceof PokeListFeedClient.ApiError){
                    PokeListFeedClient.ApiError api=(PokeListFeedClient.ApiError)error;
                    safe=api.getMessage()+" (HTTP "+api.httpCode+")";
                    retryMs=api.waitMs;
                }else if(error instanceof java.net.SocketTimeoutException){
                    safe="Tempo limite da API; nenhuma resposta foi confirmada.";
                    retryMs=30000L;
                }else if(error instanceof org.json.JSONException){
                    safe="Formato de resposta inesperado da API.";
                    retryMs=30000L;
                }else{
                    safe="Não foi possível consultar a API. Verifique conexão/servidor.";
                    retryMs=30000L;
                }
                runOnUiThread(()->{
                    if(destroyed)return;
                    loading=false;search.setEnabled(true);
                    nextAllowedElapsed=Math.max(nextAllowedElapsed,
                        SystemClock.elapsedRealtime()+retryMs);
                    state.setText(safe);
                });
            }
        });
    }
    private void showResults(PokeListFeedClient.Response data){
        state.setText("Exibidos "+data.items.size()+" de "+data.sourceCount+
            " registros. Vencidos "+data.expired+" · descartados "+data.invalid+
            ". Limite visual "+PokeListApiPolicy.MAX_VISIBLE+".");
        if(data.items.isEmpty()){
            results.addView(text("Nenhum resultado válido nesta consulta.",12,false));
            return;
        }
        for(PokeListFeedClient.Item item:data.items){
            LinearLayout card=col();
            card.setPadding(d(8),d(7),d(8),d(7));
            android.graphics.drawable.GradientDrawable bgCard=
                new android.graphics.drawable.GradientDrawable();
            bgCard.setColor(light?0xFFF9FBFE:0xFF222B3A);
            bgCard.setCornerRadius(d(8));
            card.setBackground(bgCard);
            String title=(item.number>0?"#"+item.number+" · ":"")+item.name+
                (item.form.isEmpty()?"":" · "+item.form);
            card.addView(text(title,13,true));
            StringBuilder detail=new StringBuilder();
            if(item.iv>=0)detail.append("IV ").append(item.iv).append("%  ");
            if(item.level>=0)detail.append("Nível ").append(item.level).append("  ");
            if(item.cp>=0)detail.append("PC ").append(item.cp).append("  ");
            if(!item.kind.isEmpty())detail.append("Rocket ").append(item.kind).append("  ");
            if(!item.extra.isEmpty())detail.append(item.extra);
            if(item.expiryKnown){
                long remaining=(item.expiresAt-System.currentTimeMillis())/1000L;
                detail.append("  Expira ~").append(Math.max(0,remaining/60)).append("min");
            }else detail.append("  Validade não informada");
            TextView facts=text(detail.toString(),10,false);
            facts.setTextColor(secondary);card.addView(facts);
            if(item.hasCoordinates){
                String coordinateText=String.format(Locale.ROOT,"%.6f, %.6f",
                    item.latitude,item.longitude);
                LinearLayout coords=row();
                TextView position=text(coordinateText,11,false);
                coords.addView(position,new LinearLayout.LayoutParams(0,-2,1));
                Button copy=button("Copiar");
                copy.setContentDescription("Copiar coordenadas de "+item.name);
                copy.setOnClickListener(v->{
                    ClipboardManager clip=(ClipboardManager)
                        getSystemService(Context.CLIPBOARD_SERVICE);
                    if(clip!=null)clip.setPrimaryClip(
                        ClipData.newPlainText("Coordenadas PokeList",coordinateText));
                });
                coords.addView(copy,new LinearLayout.LayoutParams(d(77),d(36)));
                card.addView(coords);
            }
            LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,-2);
            lp.topMargin=d(5);results.addView(card,lp);
        }
    }
    @Override protected void onDestroy(){
        destroyed=true;io.shutdownNow();super.onDestroy();
    }
}

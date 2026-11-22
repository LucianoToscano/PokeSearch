package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.AdapterView;

/**
 * LT410: independent PvP battle preferences and local team-planning entry point.
 *
 * IMPORTANT: This Activity deliberately does not initiate or control battles,
 * send gestures, inspect the game screen, or claim PGSharp integration. A
 * verified PvP battle detector and an explicitly enabled, tested executor are
 * required before the preferences below can become gameplay automation.
 */
public final class PvpBattleActivity extends Activity {
    private static final String STORE="pvp_battle_preferences_v1";
    private static final int BG=0xFF101827;
    private static final int PANEL=0xFF1C293A;
    private static final int TEXT=0xFFF4F7FA;
    private static final int MUTED=0xFFB7C4D1;
    private static final int ACCENT=0xFF50DDC0;
    private SharedPreferences prefs;
    private LinearLayout content;

    private int dp(int value){
        return Math.round(value*getResources().getDisplayMetrics().density);
    }

    private GradientDrawable background(int color,int radius){
        GradientDrawable d=new GradientDrawable();
        d.setColor(color);
        d.setCornerRadius(dp(radius));
        return d;
    }

    private TextView text(String value,int sp,int color,boolean bold){
        TextView view=new TextView(this);
        view.setText(value);
        view.setTextColor(color);
        view.setTextSize(sp);
        if(bold)view.setTypeface(null,Typeface.BOLD);
        return view;
    }

    private void addSection(String title,String description){
        TextView head=text(title,18,ACCENT,true);
        LinearLayout.LayoutParams headParams=new LinearLayout.LayoutParams(-1,-2);
        headParams.topMargin=dp(22);
        content.addView(head,headParams);
        if(description!=null&&!description.isEmpty()){
            TextView help=text(description,13,MUTED,false);
            LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);
            p.topMargin=dp(7);
            content.addView(help,p);
        }
    }

    private void addOption(String key,String title,String summary){
        LinearLayout holder=new LinearLayout(this);
        holder.setOrientation(LinearLayout.VERTICAL);
        holder.setBackground(background(PANEL,14));
        holder.setPadding(dp(14),dp(12),dp(14),dp(12));

        LinearLayout line=new LinearLayout(this);
        line.setOrientation(LinearLayout.HORIZONTAL);
        line.setGravity(Gravity.CENTER_VERTICAL);
        TextView label=text(title,15,TEXT,true);
        line.addView(label,new LinearLayout.LayoutParams(0,-2,1f));
        Switch toggle=new Switch(this);
        toggle.setContentDescription(title+" (preferência futura; sem automação ativa)");
        toggle.setChecked(prefs.getBoolean(key,false));
        toggle.setOnCheckedChangeListener((button,checked)->
            prefs.edit().putBoolean(key,checked).apply());
        line.addView(toggle,new LinearLayout.LayoutParams(-2,-2));
        holder.addView(line);

        TextView detail=text(summary,12,MUTED,false);
        LinearLayout.LayoutParams sub=new LinearLayout.LayoutParams(-1,-2);
        sub.topMargin=dp(5);
        holder.addView(detail,sub);

        LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,-2);
        lp.topMargin=dp(9);
        content.addView(holder,lp);
    }

    private void addLeagueSelector(){
        String[] leagues={"Grande Liga","Ultra Liga","Liga Mestra","Copas especiais"};
        String[] codes={"great","ultra","master","cup"};
        Spinner spinner=new Spinner(this);
        ArrayAdapter<String> adapter=new ArrayAdapter<>(
            this,android.R.layout.simple_spinner_dropdown_item,leagues);
        spinner.setAdapter(adapter);
        spinner.setBackground(background(PANEL,12));
        spinner.setPadding(dp(12),dp(8),dp(12),dp(8));
        String saved=prefs.getString("league","great");
        int index=0;
        for(int i=0;i<codes.length;i++)if(codes[i].equals(saved))index=i;
        spinner.setSelection(index);
        spinner.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener(){
            @Override public void onItemSelected(AdapterView<?> parent,
                    View view,int position,long id){
                if(view instanceof TextView)((TextView)view).setTextColor(TEXT);
                prefs.edit().putString("league",codes[position]).apply();
            }
            @Override public void onNothingSelected(AdapterView<?> parent){}
        });
        LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,dp(54));
        lp.topMargin=dp(9);
        content.addView(spinner,lp);
    }

    private void addButton(String caption,View.OnClickListener action){
        Button button=new Button(this);
        button.setText(caption);
        button.setAllCaps(false);
        button.setTextColor(BG);
        button.setTextSize(14);
        button.setBackground(background(ACCENT,13));
        button.setOnClickListener(action);
        LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,dp(51));
        lp.topMargin=dp(12);
        content.addView(button,lp);
    }

    @Override protected void onCreate(Bundle savedInstanceState){
        super.onCreate(savedInstanceState);
        prefs=getSharedPreferences(STORE,MODE_PRIVATE);
        getWindow().setStatusBarColor(BG);
        getWindow().setNavigationBarColor(BG);

        LinearLayout root=new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(BG);
        root.setPadding(dp(18),dp(14),dp(18),0);
        setContentView(root);

        LinearLayout toolbar=new LinearLayout(this);
        toolbar.setOrientation(LinearLayout.HORIZONTAL);
        toolbar.setGravity(Gravity.CENTER_VERTICAL);
        TextView back=text("‹",32,ACCENT,true);
        back.setContentDescription("Voltar");
        back.setGravity(Gravity.CENTER);
        back.setOnClickListener(v->finish());
        toolbar.addView(back,new LinearLayout.LayoutParams(dp(46),dp(52)));
        TextView title=text("Batalhas PvP",23,TEXT,true);
        toolbar.addView(title,new LinearLayout.LayoutParams(0,-2,1f));
        root.addView(toolbar);

        ScrollView scroll=new ScrollView(this);
        scroll.setFillViewport(true);
        root.addView(scroll,new LinearLayout.LayoutParams(-1,0,1f));
        content=new LinearLayout(this);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setPadding(0,dp(8),0,dp(28));
        scroll.addView(content);

        TextView status=text(
            "Modo de preparação • motor PvP não conectado",14,ACCENT,true);
        status.setBackground(background(PANEL,12));
        status.setPadding(dp(14),dp(12),dp(14),dp(12));
        content.addView(status,new LinearLayout.LayoutParams(-1,-2));

        TextView notice=text(
            "Estas opções salvam preferências apenas neste aparelho. "+
            "Elas NÃO atacam, não usam escudos, não trocam Pokémon e "+
            "não controlam o PGSharp ou o Pokémon GO. "+
            "A execução automática exige detecção e homologação próprias.",13,MUTED,false);
        LinearLayout.LayoutParams noticeLp=new LinearLayout.LayoutParams(-1,-2);
        noticeLp.topMargin=dp(12);
        content.addView(notice,noticeLp);

        addSection("Liga PvP","Escolha a categoria usada no planejamento da equipe.");
        addLeagueSelector();

        addSection("Preferências da batalha",
            "Independentes das configurações da Equipe Rocket, Ginásios e Raids. "+
            "Controles preparados para uma futura implementação, ainda sem execução.");
        addOption("fast_attack","Ataque ágil automático",
            "Preferência de ataque básico; nenhum toque é enviado ao jogo.");
        addOption("charged_attack","Ataque carregado automático",
            "Preferência de golpes carregados; requer detecção de energia e minijogo.");
        addOption("auto_shield","Escudo automático",
            "Preferência de defesa; não consome escudos no jogo.");
        addOption("auto_switch","Troca ao desmaiar",
            "Preferência de substituição; não troca Pokémon automaticamente.");

        addSection("Equipe PvP","Utilize sua Pokédex privada para conferir "+
            "IV, golpes e Pokémon disponíveis antes da partida.");
        addButton("Abrir minha Pokédex",v->
            startActivity(new Intent(this,PersonalPokedexActivity.class)));
        addButton("Restaurar preferências PvP",v->{
            prefs.edit().clear().apply();
            recreate();
        });
    }
}

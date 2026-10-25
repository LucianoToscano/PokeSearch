package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.text.InputFilter;
import android.view.Gravity;
import android.view.View;
import android.widget.EditText;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

/** Full screen stage-1 scrapbook preview. Explicitly local, read-only and debug gated.
 * Nothing here reads or writes Firebase or requests overlay permissions. */
public final class CommunityScrapbookActivity extends Activity {
    private boolean light;
    private int filter=-1;
    private LinearLayout posts;
    private LinearLayout filters;
    @Override public void onCreate(Bundle state){
        super.onCreate(state);
        if(!CommunityScrapbookStage1.isEnabled(this)||!IntegrityGuard.verify(this)){
            finish();return;
        }
        light=getSharedPreferences("prefs",0).getBoolean("homeLightMode",false);
        getWindow().setStatusBarColor(light?0xFFECF3F8:0xFF0B182A);
        getWindow().setNavigationBarColor(light?0xFFECF3F8:0xFF0B182A);
        final int foreground=CommunityScrapbookStage1.primary(light);
        LinearLayout root=new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(light?0xFFF0F6FA:0xFF0E1725);
        root.setPadding(dp(12),dp(8),dp(12),dp(8));
        setContentView(root);
        LinearLayout top=new LinearLayout(this);
        top.setGravity(Gravity.CENTER_VERTICAL);
        TextView back=CommunityScrapbookStage1.chip(this,"‹ Voltar",light);
        back.setOnClickListener(v->finish());
        top.addView(back);
        TextView title=CommunityScrapbookStage1.text(this,"  💬 Comunidade PokeSearch",
            17,foreground,true);
        title.setMaxLines(2);
        top.addView(title,new LinearLayout.LayoutParams(0,-2,1));
        root.addView(top);
        TextView marker=CommunityScrapbookStage1.text(this,
            "MODO DEMONSTRAÇÃO · Dados fictícios · Nenhuma postagem online",
            10,CommunityScrapbookStage1.secondary(light),true);
        LinearLayout.LayoutParams ml=new LinearLayout.LayoutParams(-1,-2);
        ml.topMargin=dp(8);ml.bottomMargin=dp(8);
        root.addView(marker,ml);
        HorizontalScrollView horizontal=new HorizontalScrollView(this);
        horizontal.setHorizontalScrollBarEnabled(false);
        filters=new LinearLayout(this);
        filters.setOrientation(LinearLayout.HORIZONTAL);
        horizontal.addView(filters);
        root.addView(horizontal);
        ScrollView scroll=new ScrollView(this);
        scroll.setFillViewport(false);
        scroll.setClipToPadding(false);
        LinearLayout.LayoutParams sl=new LinearLayout.LayoutParams(-1,0,1);
        sl.topMargin=dp(8);root.addView(scroll,sl);
        posts=new LinearLayout(this);
        posts.setOrientation(LinearLayout.VERTICAL);
        scroll.addView(posts);
        render();
        EditText input=new EditText(this);
        input.setTextSize(12);input.setMinLines(2);input.setMaxLines(3);
        input.setHint("Escreva até 300 caracteres (disponível em outra etapa)");
        input.setFilters(new InputFilter[]{new InputFilter.LengthFilter(300)});
        input.setEnabled(false);input.setFocusable(false);
        input.setTextColor(foreground);
        input.setHintTextColor(CommunityScrapbookStage1.secondary(light));
        input.setBackground(CommunityScrapbookStage1.background(
            light?0xFFE2EDF6:0xFF25384F,8,light?0xFFAFC6DA:0xFF627B94,this));
        input.setPadding(dp(8),dp(6),dp(8),dp(6));
        root.addView(input,new LinearLayout.LayoutParams(-1,-2));
        TextView disabled=CommunityScrapbookStage1.text(this,
            "Publicar · curtir · responder · denunciar · excluir: indisponíveis no protótipo",
            10,CommunityScrapbookStage1.secondary(light),false);
        disabled.setGravity(Gravity.CENTER);
        root.addView(disabled);
    }
    private int dp(int n){return CommunityScrapbookStage1.dp(this,n);}
    private void render(){
        filters.removeAllViews();
        for(int i=-1;i<CommunityScrapbookStage1.CATEGORIES.length;i++){
            final int index=i;
            final boolean selected=filter==i;
            final String label=i==-1?"Todos":CommunityScrapbookStage1.CATEGORIES[i];
            TextView tab=CommunityScrapbookStage1.chip(this,(selected?"✓ ":"")+label,light);
            tab.setContentDescription("Filtrar "+label+(selected?" selecionado":""));
            LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-2,dp(32));
            lp.rightMargin=dp(5);filters.addView(tab,lp);
            tab.setOnClickListener(v->{filter=index;render();});
        }
        posts.removeAllViews();
        for(CommunityScrapbookStage1.Post p:CommunityScrapbookStage1.EXAMPLES){
            if(filter>=0&&!p.category.equals(CommunityScrapbookStage1.CATEGORIES[filter]))continue;
            LinearLayout card=new LinearLayout(this);
            card.setOrientation(LinearLayout.VERTICAL);
            card.setBackground(CommunityScrapbookStage1.background(
                light?0xEFFFFFFF:0xE8203045,10,
                light?0xFFB6CEDF:0xFF536E89,this));
            LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-1,-2);
            cp.bottomMargin=dp(7);
            posts.addView(card,cp);
            card.addView(CommunityScrapbookStage1.postRow(this,p,light,false));
            TextView inactive=CommunityScrapbookStage1.text(this,
                "♡ Curtir (demo)     ◌ Responder (demo)     ⚑ Denunciar (demo)",
                10,CommunityScrapbookStage1.secondary(light),false);
            inactive.setEnabled(false);inactive.setPadding(dp(8),0,dp(8),dp(7));
            card.addView(inactive);
        }
    }
}

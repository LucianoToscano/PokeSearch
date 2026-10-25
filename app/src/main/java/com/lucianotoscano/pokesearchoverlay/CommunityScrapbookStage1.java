package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;
import java.util.Arrays;
import java.util.List;

/** LT88–LT93 / Scrapbook stage 1.
 * In-memory, explicitly fictional examples only. NO Firebase imports, network,
 * persistence, posting, API credentials or interactions with the game overlay.
 */
final class CommunityScrapbookStage1 {
    private CommunityScrapbookStage1(){}
    static final String FLAG="communityScrapbookStage1Preview";
    static final String[] CATEGORIES={"💬 Recados","💡 Sugestões","🐞 Bugs","🎓 Dicas"};

    static final class Post {
        final String nickname,avatar,category,message,relativeTime;
        final int likes,replies;
        final boolean pinned;
        Post(String nickname,String avatar,String category,String message,
             String relativeTime,int likes,int replies,boolean pinned){
            this.nickname=nickname;this.avatar=avatar;this.category=category;
            this.message=message;this.relativeTime=relativeTime;
            this.likes=likes;this.replies=replies;this.pinned=pinned;
        }
    }
    // Names, times, counts and content are fictional mock data. Not synced.
    static final List<Post> EXAMPLES=java.util.Collections.unmodifiableList(Arrays.asList(
        new Post("Equipe PokeSearch","P","💬 Recados",
            "Bom dia, treinadores! 💙 Que a comunidade cresça e a gente encontre muitos Pokémon juntos!",
            "exemplo · agora",12,3,true),
        new Post("Treinadora Aurora","A","💡 Sugestões",
            "Eu adoraria uma aba para avisar sobre eventos e encontros. O que vocês acham?",
            "exemplo · 8 min",4,1,false),
        new Post("Caçador Shiny","C","🐞 Bugs",
            "Encontrei uma dificuldade para copiar coordenadas no celular. Vou testar outra vez!",
            "exemplo · 20 min",2,0,false),
        new Post("Mestre das Raids","M","🎓 Dicas",
            "Dica: confira os filtros de IV e Shiny antes de começar a caçada!",
            "exemplo · 35 min",8,2,false)
    ));

    /** QA demo is visible only in debug or a specially signed QA release.
     * Normal public releases ALWAYS deny, even if an old preference is true.
     * No Firebase writes, regardless of this flag.
     */
    static boolean isQaPreviewAllowed(){
        return BuildConfig.DEBUG||BuildConfig.SCRAPBOOK_STAGE1_QA;
    }
    static boolean isEnabled(Context context){
        return isQaPreviewAllowed()&&context.getSharedPreferences("prefs",0)
            .getBoolean(FLAG,BuildConfig.SCRAPBOOK_STAGE1_QA);
    }
    static int dp(Context c,int n){return Math.round(c.getResources().getDisplayMetrics().density*n);}
    static int primary(boolean light){return light?Color.rgb(23,45,68):Color.rgb(235,246,255);}
    static int secondary(boolean light){return light?Color.rgb(72,91,112):Color.rgb(167,190,214);}
    static GradientDrawable background(int color,int radius,int border,Context c){
        GradientDrawable b=new GradientDrawable();
        b.setColor(color);b.setCornerRadius(dp(c,radius));
        b.setStroke(dp(c,1),border);return b;
    }
    static TextView text(Context c,String content,int sp,int color,boolean bold){
        TextView v=new TextView(c);
        v.setText(content);v.setTextSize(sp);v.setTextColor(color);
        v.setGravity(Gravity.CENTER_VERTICAL);
        if(bold)v.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        return v;
    }
    static TextView chip(Context c,String content,boolean light){
        TextView t=text(c,content,11,primary(light),true);
        t.setGravity(Gravity.CENTER);t.setPadding(dp(c,8),dp(c,4),dp(c,8),dp(c,4));
        t.setBackground(background(light?0xFFE6EFF8:0xFF293A50,7,
            light?0xFFB4CBDC:0xFF53718E,c));
        return t;
    }
    static LinearLayout postRow(Context c,Post p,boolean light,boolean compact){
        LinearLayout row=new LinearLayout(c);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setPadding(dp(c,6),dp(c,7),dp(c,6),dp(c,7));
        TextView avatar=text(c,p.avatar,14,primary(light),true);
        avatar.setGravity(Gravity.CENTER);
        avatar.setContentDescription("Avatar de demonstração de "+p.nickname);
        avatar.setBackground(background(light?0xFFD7E9F6:0xFF39536E,24,
            light?0xFF98C0D8:0xFF6E8CAB,c));
        LinearLayout.LayoutParams ap=new LinearLayout.LayoutParams(dp(c,32),dp(c,32));
        ap.rightMargin=dp(c,8);row.addView(avatar,ap);
        LinearLayout body=new LinearLayout(c);
        body.setOrientation(LinearLayout.VERTICAL);
        row.addView(body,new LinearLayout.LayoutParams(0,-2,1));
        TextView byline=text(c,p.nickname+"  ·  "+p.category,compact?10:12,primary(light),true);
        byline.setMaxLines(2);body.addView(byline);
        TextView message=text(c,p.message,compact?10:12,primary(light),false);
        message.setMaxLines(compact?3:5);
        body.addView(message);
        TextView details=text(c,(p.pinned?"📌  Fixo (teste)  ·  ":"")+p.relativeTime+
            "     ♡ "+p.likes+"     ◌ "+p.replies,10,secondary(light),false);
        body.addView(details);
        View border=new View(c);border.setBackgroundColor(light?0x33809BAF:0x447890AD);
        return row;
    }
    static void openFull(Activity activity){
        if(!isEnabled(activity))return;
        activity.startActivity(new Intent(activity,CommunityScrapbookActivity.class));
    }
    static View homePanel(Activity activity,boolean light){
        if(CommunityScrapbookOnline.isQaAllowed())
            return CommunityScrapbookOnline.homePanel(activity,light);
        LinearLayout root=new LinearLayout(activity);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(activity,8),dp(activity,7),dp(activity,8),dp(activity,8));
        root.setBackground(background(light?0xEAF7FBFF:0xD81C2C41,12,
            light?0xFFAAC3D6:0xFF66839C,activity));
        LinearLayout header=new LinearLayout(activity);
        header.setGravity(Gravity.CENTER_VERTICAL);
        TextView title=text(activity,"💬 Comunidade PokeSearch",13,primary(light),true);
        header.addView(title,new LinearLayout.LayoutParams(0,dp(activity,30),1));
        TextView expand=chip(activity,"Recolher ⌃",light);
        header.addView(expand);root.addView(header);
        TextView demo=text(activity,"Prévia fictícia · sem publicações reais",10,secondary(light),false);
        root.addView(demo);
        LinearLayout content=new LinearLayout(activity);
        content.setOrientation(LinearLayout.VERTICAL);root.addView(content);
        for(int i=0;i<3;i++)content.addView(postRow(activity,EXAMPLES.get(i),light,true));
        LinearLayout actions=new LinearLayout(activity);
        actions.setGravity(Gravity.END|Gravity.CENTER_VERTICAL);
        TextView view=chip(activity,"Ver todos",light);
        view.setOnClickListener(v->openFull(activity));
        TextView write=chip(activity,"Escrever recado · em breve",light);
        write.setContentDescription("Escrever recado indisponível nesta demonstração");
        write.setAlpha(.65f);write.setEnabled(false);
        LinearLayout.LayoutParams wl=new LinearLayout.LayoutParams(0,-2,1);wl.rightMargin=dp(activity,4);
        actions.addView(write,wl);actions.addView(view);
        content.addView(actions);
        final boolean[] open={true};
        header.setOnClickListener(v->{
            open[0]=!open[0];content.setVisibility(open[0]?View.VISIBLE:View.GONE);
            expand.setText(open[0]?"Recolher ⌃":"Expandir ⌄");
        });
        header.setContentDescription("Recolher ou expandir prévia do mural de demonstração");
        return root;
    }
}

package com.lucianotoscano.pokesearchoverlay;

import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

/**
 * LT151 — a different native Home composition, not a recoloring of old cards.
 * Rehosts already-initialized application widgets (and their listeners) so
 * Firebase, login, chat, two Pokeballs, stats, overlays and update UI stay live.
 * This class performs presentation only; never grants Premium or changes data.
 */
final class HomeDashboardV2 {
    private HomeDashboardV2(){}
    // Native Home slider must update the NEW glass without rebuilding WebViews,
    // losing scroll position or recreating the authenticated account widgets.
    private static final java.util.WeakHashMap<MainActivity,
        java.util.ArrayList<GradientDrawable>> liveSurfaces=new java.util.WeakHashMap<>();
    static void begin(MainActivity a){
        liveSurfaces.put(a,new java.util.ArrayList<>());
    }
    private static GradientDrawable track(MainActivity a,GradientDrawable bg,int transparency){
        java.util.ArrayList<GradientDrawable> list=liveSurfaces.get(a);
        if(list!=null)list.add(bg);
        bg.setAlpha(Math.round(255f*(100-Math.max(0,Math.min(100,transparency)))/100f));
        return bg;
    }
    static void refreshOpacity(MainActivity a,int transparency){
        java.util.ArrayList<GradientDrawable> list=liveSurfaces.get(a);
        if(list==null)return;
        int alpha=Math.round(255f*(100-Math.max(0,Math.min(100,transparency)))/100f);
        for(GradientDrawable bg:list)bg.setAlpha(alpha);
    }
    private static int dp(MainActivity a,int value){
        return Math.round(a.getResources().getDisplayMetrics().density*value);
    }
    private static int ink(boolean light){return light?Color.rgb(46,48,42):Color.rgb(246,247,239);}
    private static int muted(boolean light){return light?Color.rgb(98,102,92):Color.rgb(205,214,202);}
    private static int gold(boolean light){return light?Color.rgb(127,91,42):Color.rgb(246,214,159);}
    private static TextView text(MainActivity a,String s,int sp,int color,boolean weight){
        TextView t=new TextView(a);
        t.setText(s);
        t.setTextSize(sp);
        t.setTextColor(color);
        t.setGravity(Gravity.CENTER_VERTICAL);
        if(weight)t.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        return t;
    }
    private static GradientDrawable round(MainActivity a,int bg,int stroke,int radius){
        GradientDrawable g=new GradientDrawable();
        g.setColor(bg);
        g.setCornerRadius(dp(a,radius));
        if(stroke!=0)g.setStroke(dp(a,1),stroke);
        return g;
    }
    private static GradientDrawable glass(MainActivity a,boolean light,int radius,int alphaPercent){
        int strength=Math.max(0,Math.min(100,100-alphaPercent));
        int base=light?Color.argb(198,248,247,237):Color.argb(181,37,46,43);
        int stroke=light?Color.argb(155,255,255,255):Color.argb(103,237,240,222);
        GradientDrawable bg=round(a,base,stroke,radius);
        return track(a,bg,alphaPercent);
    }
    private static LinearLayout.LayoutParams block(MainActivity a,int top,int bottom){
        LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,-2);
        lp.topMargin=dp(a,top);lp.bottomMargin=dp(a,bottom);
        return lp;
    }
    private static TextView section(MainActivity a,String title,boolean light){
        TextView v=text(a,title,10,gold(light),true);
        v.setLetterSpacing(.12f);
        v.setPadding(dp(a,3),dp(a,5),0,dp(a,2));
        return v;
    }
    private static View hero(MainActivity a,boolean light,int opacity){
        FrameLayout panel=new FrameLayout(a);
        GradientDrawable backdrop=new GradientDrawable(GradientDrawable.Orientation.TL_BR,
            light?new int[]{Color.argb(245,246,240,218),Color.argb(225,220,235,216),
                Color.argb(239,248,244,229)}:
                new int[]{Color.argb(239,42,70,59),Color.argb(230,44,51,50),
                Color.argb(233,92,67,47)});
        backdrop.setCornerRadius(dp(a,24));
        backdrop.setStroke(dp(a,1),light?Color.argb(190,255,255,255):
            Color.argb(125,242,225,190));
        track(a,backdrop,opacity);
        panel.setBackground(backdrop);
        panel.setClipToOutline(true);
        panel.setElevation(dp(a,5));
        // Two concentric warm rings + the real owner-supplied PokeSearch brand.
        View ring1=new View(a);
        GradientDrawable circle=round(a,Color.TRANSPARENT,0,200);
        circle.setShape(GradientDrawable.OVAL);
        circle.setStroke(dp(a,1),light?Color.argb(105,136,116,81):
            Color.argb(131,240,215,171));
        ring1.setBackground(circle);
        FrameLayout.LayoutParams ringLp=new FrameLayout.LayoutParams(dp(a,184),dp(a,184),
            Gravity.TOP|Gravity.RIGHT);
        ringLp.rightMargin=dp(a,-69);ringLp.topMargin=dp(a,-30);
        panel.addView(ring1,ringLp);
        View ring2=new View(a);
        GradientDrawable circle2=round(a,Color.TRANSPARENT,0,200);
        circle2.setShape(GradientDrawable.OVAL);
        circle2.setStroke(dp(a,1),light?Color.argb(90,136,116,81):
            Color.argb(102,240,215,171));
        ring2.setBackground(circle2);
        FrameLayout.LayoutParams ring2Lp=new FrameLayout.LayoutParams(dp(a,122),dp(a,122),
            Gravity.TOP|Gravity.RIGHT);
        ring2Lp.rightMargin=dp(a,-37);ring2Lp.topMargin=dp(a,1);
        panel.addView(ring2,ring2Lp);
        ImageView emblem=new ImageView(a);
        emblem.setImageResource(R.drawable.ps_home_brand_transparent);
        emblem.setScaleType(ImageView.ScaleType.FIT_CENTER);
        emblem.setAlpha(.84f);
        FrameLayout.LayoutParams emblemLp=new FrameLayout.LayoutParams(dp(a,76),dp(a,76),
            Gravity.TOP|Gravity.RIGHT);
        emblemLp.rightMargin=dp(a,9);emblemLp.topMargin=dp(a,54);
        panel.addView(emblem,emblemLp);

        LinearLayout column=new LinearLayout(a);
        column.setOrientation(LinearLayout.VERTICAL);
        column.setPadding(dp(a,18),dp(a,16),dp(a,17),dp(a,17));
        panel.addView(column,new FrameLayout.LayoutParams(-1,-2));
        TextView kicker=text(a,"◈   POKESEARCH  /  CENTRAL DE CAÇA",9,gold(light),true);
        kicker.setLetterSpacing(.10f);
        column.addView(kicker);
        TextView headline=text(a,"ENCONTRE O\nEXTRAORDINÁRIO.",23,ink(light),true);
        headline.setLineSpacing(dp(a,1),1f);
        LinearLayout.LayoutParams titleLp=block(a,10,4);
        column.addView(headline,titleLp);
        TextView subtitle=text(a,"Seu universo Pokémon GO,\nmais perto de você.",12,muted(light),false);
        column.addView(subtitle);
        TextView edition=text(a,"✦   PRECISÃO  ·  CONTROLE  ·  DESCOBERTA",9,
            gold(light),true);
        LinearLayout.LayoutParams editionLp=block(a,16,0);
        column.addView(edition,editionLp);
        return panel;
    }
    private static View premiumLane(MainActivity a,boolean light,int opacity,Runnable action){
        LinearLayout row=new LinearLayout(a);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.setPadding(dp(a,15),dp(a,11),dp(a,12),dp(a,11));
        row.setBackground(glass(a,light,17,opacity));
        LinearLayout copy=new LinearLayout(a);
        copy.setOrientation(LinearLayout.VERTICAL);
        row.addView(copy,new LinearLayout.LayoutParams(0,-2,1));
        boolean premium=PremiumAccess.permitted(true);
        TextView eyebrow=text(a,"✦  EXPERIÊNCIA PREMIUM",9,gold(light),true);
        eyebrow.setLetterSpacing(.09f);
        copy.addView(eyebrow);
        TextView headline=text(a,premium?"Sua licença está ativa":
            "Duas caçadas. Uma experiência.",13,ink(light),true);
        headline.setMaxLines(2);
        copy.addView(headline);
        TextView sub=text(a,"Pokébola 2  ·  filtros independentes",10,muted(light),false);
        copy.addView(sub);
        TextView button=text(a,"CONTA  ›",10,ink(light),true);
        button.setGravity(Gravity.CENTER);
        button.setPadding(dp(a,12),dp(a,9),dp(a,12),dp(a,9));
        button.setBackground(round(a,light?Color.argb(161,255,255,249):
            Color.argb(106,244,231,210),light?Color.argb(110,194,176,142):
            Color.argb(103,242,227,195),12));
        row.addView(button,new LinearLayout.LayoutParams(-2,-2));
        row.setOnClickListener(v->action.run());
        row.setContentDescription("Gerenciar a assinatura Premium");
        return row;
    }
    private static View shortcut(MainActivity a,boolean light,String glyph,String title,
                                 Runnable action,int opacity){
        LinearLayout col=new LinearLayout(a);
        col.setGravity(Gravity.CENTER);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setPadding(dp(a,4),dp(a,9),dp(a,4),dp(a,9));
        col.setBackground(glass(a,light,16,opacity));
        TextView icon=text(a,glyph,21,gold(light),true);
        icon.setGravity(Gravity.CENTER);
        col.addView(icon);
        TextView caption=text(a,title,11,ink(light),true);
        caption.setGravity(Gravity.CENTER);
        caption.setSingleLine(true);
        caption.setEllipsize(TextUtils.TruncateAt.END);
        col.addView(caption,new LinearLayout.LayoutParams(-1,-2));
        col.setContentDescription("Abrir "+title);
        col.setOnClickListener(v->action.run());
        return col;
    }
    static TextView[] restylePokeballs(MainActivity a,boolean light,LinearLayout row,int opacity){
        row.setPadding(0,0,0,0);
        row.setBackgroundColor(Color.TRANSPARENT);
        TextView[] states=new TextView[2];
        for(int i=0;i<2;i++){
            LinearLayout item=(LinearLayout)row.getChildAt(i);
            ImageView icon=(ImageView)item.getChildAt(0);
            TextView title=(TextView)item.getChildAt(1);
            item.removeView(icon);
            item.removeView(title);
            item.setOrientation(LinearLayout.VERTICAL);
            item.setGravity(Gravity.CENTER);
            item.setPadding(dp(a,7),dp(a,7),dp(a,7),dp(a,8));
            int border=light?Color.argb(153,238,233,216):Color.argb(104,246,234,206);
            GradientDrawable bg=new GradientDrawable(GradientDrawable.Orientation.TL_BR,
                light?new int[]{Color.argb(230,255,252,239),Color.argb(211,223,236,225)}:
                    new int[]{Color.argb(221,48,67,60),Color.argb(206,39,47,49)});
            bg.setCornerRadius(dp(a,20));
            bg.setStroke(dp(a,1),border);
            track(a,bg,opacity);
            item.setBackground(bg);
            icon.setPadding(dp(a,3),dp(a,3),dp(a,3),dp(a,3));
            item.addView(icon,new LinearLayout.LayoutParams(dp(a,49),dp(a,49)));
            title.setTextSize(13);
            title.setTextColor(ink(light));
            title.setGravity(Gravity.CENTER);
            item.addView(title,new LinearLayout.LayoutParams(-1,-2));
            TextView status=text(a,"○  DESATIVADA",9,muted(light),true);
            status.setGravity(Gravity.CENTER);
            status.setLetterSpacing(.04f);
            LinearLayout.LayoutParams slp=block(a,3,0);
            item.addView(status,slp);
            states[i]=status;
            LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(0,-1,1);
            if(i==0)lp.rightMargin=dp(a,5);else lp.leftMargin=dp(a,5);
            item.setLayoutParams(lp);
            item.setContentDescription("Controlar Pokébola "+(i+1));
        }
        return states;
    }
    static void assemble(MainActivity a,boolean light,int opacity,LinearLayout screen,
        View header,View balls,View account,View updates,View stats,View share,
        View community,View footer,Runnable favorites,Runnable settings,
        Runnable communityAction,Runnable premiumAction){
        // All existing original widgets have already been constructed and bound;
        // detach them only from the Home hierarchy, never recreate their data sources.
        screen.removeAllViews();
        screen.setOrientation(LinearLayout.VERTICAL);
        screen.setPadding(dp(a,13),dp(a,9),dp(a,13),dp(a,18));
        header.setBackground(glass(a,light,18,opacity));
        header.setPadding(dp(a,8),0,dp(a,8),0);
        screen.addView(header,new LinearLayout.LayoutParams(-1,dp(a,65)));
        screen.addView(hero(a,light,opacity),block(a,10,10));
        screen.addView(section(a,"01   SUAS POKÉBOLAS",light),block(a,0,3));
        screen.addView(balls,new LinearLayout.LayoutParams(-1,dp(a,122)));
        LinearLayout quick=new LinearLayout(a);
        quick.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams qlp=block(a,10,11);
        screen.addView(quick,qlp);
        String[] labels={"Favoritos","Configurar","Comunidade"};
        String[] glyphs={"☆","⚙","☷"};
        Runnable[] actions={favorites,settings,communityAction};
        for(int i=0;i<3;i++){
            LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(0,dp(a,67),1);
            if(i==1){lp.leftMargin=dp(a,6);lp.rightMargin=dp(a,6);}
            quick.addView(shortcut(a,light,glyphs[i],labels[i],actions[i],opacity),lp);
        }
        if(PremiumAccess.controlled())screen.addView(
            premiumLane(a,light,opacity,premiumAction),block(a,0,12));
        screen.addView(section(a,"02   PERFIL DO TREINADOR",light),block(a,0,3));
        account.setBackground(glass(a,light,19,opacity));
        screen.addView(account,block(a,0,8));
        screen.addView(updates,block(a,0,1));
        screen.addView(section(a,"03   POKESEARCH AO VIVO",light),block(a,2,3));
        screen.addView(stats,new LinearLayout.LayoutParams(-1,dp(a,50)));
        if(community!=null){
            screen.addView(section(a,"04   COMUNIDADE",light),block(a,12,3));
            screen.addView(community,block(a,0,6));
        }
        screen.addView(share,block(a,10,10));
        screen.addView(footer,new LinearLayout.LayoutParams(-1,dp(a,30)));
    }
}

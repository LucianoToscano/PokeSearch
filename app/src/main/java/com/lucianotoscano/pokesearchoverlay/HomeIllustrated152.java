package com.lucianotoscano.pokesearchoverlay;

import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

/** LT152. Photo-led Pokémon GO Home following the owner's supplied references.
 * Visual-only: no API calls, Premium grants or stateful filters are implemented here.
 */
final class HomeIllustrated152 {
    private HomeIllustrated152(){}
    private static int dp(MainActivity a,int n){
        return Math.round(a.getResources().getDisplayMetrics().density*n);
    }
    private static int white(){return Color.rgb(246,250,255);}
    private static TextView text(MainActivity a,String value,int sp,boolean bold){
        TextView v=new TextView(a);
        v.setText(value);
        v.setTextColor(white());
        v.setTextSize(sp);
        v.setGravity(Gravity.CENTER_VERTICAL);
        if(bold)v.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        return v;
    }
    private static GradientDrawable glass(MainActivity a,int radius,int opacity){
        GradientDrawable bg=new GradientDrawable(GradientDrawable.Orientation.TL_BR,
            new int[]{Color.argb(177,27,76,98),Color.argb(112,83,143,147),
                Color.argb(156,28,67,83)});
        bg.setCornerRadius(dp(a,radius));
        bg.setStroke(dp(a,1),Color.argb(161,247,255,253));
        bg.setAlpha(Math.round((100-Math.max(0,Math.min(85,opacity)))*255f/100f));
        return bg;
    }
    private static ImageView sprite(MainActivity a,String path){
        ImageView image=new ImageView(a);
        image.setScaleType(ImageView.ScaleType.FIT_CENTER);
        try(java.io.InputStream input=a.getAssets().open(path)){
            android.graphics.Bitmap bitmap=android.graphics.BitmapFactory.decodeStream(input);
            if(bitmap!=null)image.setImageBitmap(bitmap);
        }catch(java.io.IOException ignored){
            // Verified offline bundle may be absent only during developer preview.
        }
        return image;
    }
    private static GradientDrawable green(MainActivity a,boolean enabled){
        GradientDrawable d=new GradientDrawable();
        d.setColor(enabled?Color.rgb(36,219,121):Color.argb(173,169,185,190));
        d.setCornerRadius(dp(a,20));
        return d;
    }
    private static LinearLayout.LayoutParams margin(MainActivity a,int top,int bottom){
        LinearLayout.LayoutParams l=new LinearLayout.LayoutParams(-1,-2);
        l.topMargin=dp(a,top);l.bottomMargin=dp(a,bottom);return l;
    }
    static final class State {
        private final TextView profileName,profileTier,firstStatus,secondStatus;
        private final TextView firstLabel,secondLabel,firstIvs,secondIvs;
        private State(TextView n,TextView t,TextView s1,TextView s2,
                      TextView l1,TextView l2,TextView i1,TextView i2){
            profileName=n;profileTier=t;firstStatus=s1;secondStatus=s2;
            firstLabel=l1;secondLabel=l2;firstIvs=i1;secondIvs=i2;
        }
        void refresh(MainActivity a){
            SharedPreferences p=a.getSharedPreferences("prefs",0);
            String name=p.getString("profileDisplayName","");
            String fallback=PremiumGoogleLogin.isGoogleSignedIn(a)?
                PremiumGoogleLogin.email(a):"Entrar na minha conta";
            profileName.setText(name==null||name.trim().isEmpty()?fallback:name.trim());
            boolean premium=PremiumAccess.controlled()&&PremiumAccess.permitted(true);
            profileTier.setText(premium?"♛  Premium ativo":
                PremiumGoogleLogin.isGoogleSignedIn(a)?"Minha conta":"Conectar");
            firstStatus.setText(OverlayService.isRunning()?"● ATIVA":"○ DESATIVADA");
            secondStatus.setText(OverlayService.isSecondaryRunning()?"● ATIVA":
                PremiumAccess.controlled()&&!premium?"♛ PREMIUM":"○ DESATIVADA");
            firstStatus.setTextColor(OverlayService.isRunning()?Color.rgb(113,255,161):white());
            secondStatus.setTextColor(OverlayService.isSecondaryRunning()?Color.rgb(113,255,161):white());
            setMode(a,p,firstLabel,firstIvs,true);
            setMode(a,a.getSharedPreferences("prefs_secondary",0),secondLabel,secondIvs,false);
        }
        private void setMode(MainActivity a,SharedPreferences p,TextView label,
                             TextView ivs,boolean first){
            String mode=p.getString("mode",first?"100":"raw");
            if(mode==null)mode="";
            String value;
            int attack=p.getInt("rawAttack",first?15:0);
            int defense=p.getInt("rawDefense",first?15:0);
            int stamina=p.getInt("rawStamina",first?15:0);
            if("raw".equalsIgnoreCase(mode)||"iv".equalsIgnoreCase(mode)){
                if(attack==15&&defense==15&&stamina==15)value="100%";
                else if(attack==0&&defense==0&&stamina==0)value="0%";
                else value="IV";
                ivs.setText(attack+"/"+defense+"/"+stamina);
            }else if(mode.toLowerCase(java.util.Locale.ROOT).contains("ultra")||
                      mode.equalsIgnoreCase("ul")){
                value="UL";ivs.setText("Rank PvP");
            }else if(mode.toLowerCase(java.util.Locale.ROOT).contains("great")||
                      mode.equalsIgnoreCase("gl")){
                value="GL";ivs.setText("Rank PvP");
            }else if(mode.equals("0")||mode.equals("0%")){
                value="0%";ivs.setText("0/0/0");
            }else if(mode.equals("100")||mode.equals("100%")){
                value="100%";ivs.setText("15/15/15");
            }else{
                value=first?"100%":"0%";
                ivs.setText(first?"15/15/15":"0/0/0");
            }
            label.setText(value);
        }
    }
    private static View profile(MainActivity a,ImageView sourceAvatar,
        TextView[] result,int opacity,Runnable openAccount){
        LinearLayout panel=new LinearLayout(a);
        panel.setGravity(Gravity.CENTER_VERTICAL);
        panel.setPadding(dp(a,13),dp(a,12),dp(a,14),dp(a,12));
        panel.setBackground(glass(a,23,opacity));
        panel.setElevation(dp(a,3));
        ViewGroup avatarParent=sourceAvatar.getParent() instanceof ViewGroup?
            (ViewGroup)sourceAvatar.getParent():null;
        View icon=avatarParent!=null?avatarParent:sourceAvatar;
        if(icon.getParent() instanceof ViewGroup)
            ((ViewGroup)icon.getParent()).removeView(icon);
        LinearLayout.LayoutParams avatarLp=new LinearLayout.LayoutParams(dp(a,61),dp(a,61));
        avatarLp.rightMargin=dp(a,12);
        panel.addView(icon,avatarLp);
        LinearLayout copy=new LinearLayout(a);
        copy.setOrientation(LinearLayout.VERTICAL);
        panel.addView(copy,new LinearLayout.LayoutParams(0,-2,1));
        TextView name=text(a,"Minha conta",17,true);
        name.setSingleLine(true);name.setEllipsize(TextUtils.TruncateAt.END);
        copy.addView(name);
        TextView tier=text(a,"Conectar",12,true);
        tier.setTextColor(Color.rgb(255,227,130));
        copy.addView(tier);
        TextView chevron=text(a,"›",30,true);
        chevron.setGravity(Gravity.CENTER);
        panel.addView(chevron,new LinearLayout.LayoutParams(dp(a,26),dp(a,52)));
        panel.setOnClickListener(v->openAccount.run());
        panel.setContentDescription("Abrir perfil e licença Premium");
        result[0]=name;result[1]=tier;return panel;
    }
    private static TextView[] ball(MainActivity a,LinearLayout item,boolean second,int opacity){
        ImageView icon=(ImageView)item.getChildAt(0);
        TextView title=(TextView)item.getChildAt(1);
        item.removeAllViews();
        item.setGravity(Gravity.CENTER);
        item.setOrientation(LinearLayout.VERTICAL);
        item.setPadding(dp(a,5),dp(a,8),dp(a,5),dp(a,8));
        item.setBackground(glass(a,22,opacity));
        icon.setImageResource(second?R.drawable.personalizado:R.drawable.sem_filtro);
        icon.setBackgroundColor(Color.TRANSPARENT);
        icon.setPadding(0,0,0,0);
        icon.setScaleType(ImageView.ScaleType.FIT_CENTER);
        item.addView(icon,new LinearLayout.LayoutParams(dp(a,55),dp(a,55)));
        title.setText(second?"Pokébola 2":"Pokébola 1");
        title.setTextColor(white());title.setTextSize(12);
        title.setGravity(Gravity.CENTER);
        item.addView(title,new LinearLayout.LayoutParams(-1,-2));
        TextView stars=text(a,second?"☆☆☆":"★★★",17,true);
        stars.setTextColor(second?Color.rgb(193,213,225):Color.rgb(255,219,92));
        stars.setGravity(Gravity.CENTER);
        item.addView(stars);
        TextView label=text(a,second?"0%":"100%",22,true);
        label.setGravity(Gravity.CENTER);
        item.addView(label);
        TextView iv=text(a,second?"0/0/0":"15/15/15",12,true);
        iv.setGravity(Gravity.CENTER);
        item.addView(iv);
        TextView status=text(a,"○ DESATIVADA",9,true);
        status.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams slp=margin(a,5,0);
        item.addView(status,slp);
        // Do not change the original item.OnClickListener: P1 and P2 remain independent.
        item.setContentDescription("Ativar ou desativar "+(second?"Pokébola 2":"Pokébola 1"));
        return new TextView[]{status,label,iv};
    }
    private static LinearLayout horizontal(MainActivity a){
        LinearLayout l=new LinearLayout(a);l.setOrientation(LinearLayout.HORIZONTAL);
        l.setGravity(Gravity.CENTER_VERTICAL);return l;
    }
    private static TextView heading(MainActivity a,String name){
        TextView t=text(a,name,15,true);
        t.setPadding(dp(a,2),0,0,0);return t;
    }
    private static View news(MainActivity a,int opacity,Runnable showNotes){
        LinearLayout outer=new LinearLayout(a);
        outer.setOrientation(LinearLayout.VERTICAL);
        outer.setPadding(dp(a,13),dp(a,12),dp(a,13),dp(a,12));
        outer.setBackground(glass(a,22,opacity));
        LinearLayout top=horizontal(a);
        outer.addView(top);
        top.addView(heading(a,"Última atualização"),new LinearLayout.LayoutParams(0,-2,1));
        TextView all=text(a,"Ver todas  ›",11,false);
        top.addView(all);
        LinearLayout preview=horizontal(a);
        outer.addView(preview,margin(a,4,0));
        LinearLayout summary=new LinearLayout(a);
        summary.setOrientation(LinearLayout.VERTICAL);
        preview.addView(summary,new LinearLayout.LayoutParams(0,-2,1));
        TextView version=text(a,"v"+BuildConfig.VERSION_NAME,17,true);
        summary.addView(version);
        TextView subtitle=text(a,"Novidades e melhorias do PokeSearch",11,false);
        subtitle.setMaxLines(2);subtitle.setEllipsize(TextUtils.TruncateAt.END);
        summary.addView(subtitle);
        ImageView pikachu=sprite(a,"pokemon-sprites/base/25.png");
        pikachu.setContentDescription("Pikachu");
        preview.addView(pikachu,new LinearLayout.LayoutParams(dp(a,69),dp(a,69)));
        outer.setOnClickListener(v->showNotes.run());
        return outer;
    }
    private static View community(MainActivity a,int opacity,Runnable openChat){
        LinearLayout panel=new LinearLayout(a);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setPadding(dp(a,13),dp(a,12),dp(a,13),dp(a,13));
        panel.setBackground(glass(a,22,opacity));
        LinearLayout heading=horizontal(a);panel.addView(heading);
        heading.addView(heading(a,"Destaques da comunidade"),
            new LinearLayout.LayoutParams(0,-2,1));
        TextView more=text(a,"Ver mais  ›",11,false);heading.addView(more);
        LinearLayout categories=horizontal(a);
        LinearLayout.LayoutParams clp=margin(a,10,0);
        panel.addView(categories,clp);
        String[] labels={"Shiny","Eventos","Raids","Dicas","PvP"};
        String[] sprites={
            "pokemon-sprites/shiny/133.png",
            "pokemon-sprites/base/150.png",
            "pokemon-sprites/base/250.png",
            "pokemon-sprites/base/448.png",
            "pokemon-sprites/base/445.png"
        };
        int[] colors={0xAA316D6B,0xAA51559C,0xAA8D6040,0xAA476D97,0xAA315D72};
        for(int i=0;i<labels.length;i++){
            LinearLayout tile=new LinearLayout(a);
            tile.setGravity(Gravity.CENTER);
            tile.setOrientation(LinearLayout.VERTICAL);
            tile.setPadding(dp(a,2),0,dp(a,2),0);
            GradientDrawable bg=new GradientDrawable(
                GradientDrawable.Orientation.TL_BR,
                new int[]{colors[i],Color.argb(160,13,46,68)});
            bg.setCornerRadius(dp(a,13));
            bg.setStroke(dp(a,1),Color.argb(120,255,255,255));
            tile.setBackground(bg);
            ImageView picture=sprite(a,sprites[i]);
            picture.setContentDescription(labels[i]);
            picture.setPadding(dp(a,3),dp(a,4),dp(a,3),dp(a,1));
            tile.addView(picture,new LinearLayout.LayoutParams(-1,0,1));
            TextView label=text(a,labels[i],10,true);label.setGravity(Gravity.CENTER);
            tile.addView(label);
            LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(0,dp(a,85),1);
            if(i!=labels.length-1)lp.rightMargin=dp(a,5);
            categories.addView(tile,lp);
            tile.setOnClickListener(v->openChat.run());
        }
        panel.setOnClickListener(v->openChat.run());
        return panel;
    }
    private static View chat(MainActivity a,int opacity,Runnable openChat){
        LinearLayout box=horizontal(a);
        box.setPadding(dp(a,15),dp(a,13),dp(a,12),dp(a,13));
        box.setBackground(glass(a,20,opacity));
        TextView bubble=text(a,"☏",23,true);bubble.setGravity(Gravity.CENTER);
        bubble.setBackground(glass(a,40,0));
        box.addView(bubble,new LinearLayout.LayoutParams(dp(a,44),dp(a,44)));
        LinearLayout copy=new LinearLayout(a);
        copy.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams copyLp=new LinearLayout.LayoutParams(0,-2,1);
        copyLp.leftMargin=dp(a,10);
        box.addView(copy,copyLp);
        copy.addView(text(a,"Chat da Comunidade",14,true));
        TextView sub=text(a,"Conversar e compartilhar capturas",11,false);
        sub.setSingleLine(true);sub.setEllipsize(TextUtils.TruncateAt.END);
        copy.addView(sub);
        box.addView(text(a,"›",28,true));
        box.setOnClickListener(v->openChat.run());
        return box;
    }
    private static void dock(MainActivity a,FrameLayout frame,int opacity,
                             Runnable[] actions){
        LinearLayout bar=horizontal(a);
        bar.setPadding(dp(a,5),dp(a,5),dp(a,5),dp(a,5));
        bar.setBackground(glass(a,32,opacity));
        bar.setElevation(dp(a,8));
        String[] glyphs={"⌂","◉","◉","☆","✦","☷","⚙"};
        for(int i=0;i<glyphs.length;i++){
            final int index=i;
            TextView button=text(a,glyphs[i],21,i==0);
            button.setGravity(Gravity.CENTER);
            if(i==0){
                button.setTextColor(Color.rgb(83,223,255));
                GradientDrawable active=new GradientDrawable();
                active.setColor(Color.argb(84,67,188,246));
                active.setCornerRadius(dp(a,26));
                button.setBackground(active);
            }
            button.setContentDescription(new String[]{
                "Início","Pokébola 1","Pokébola 2","Favoritos",
                "Novidades","Comunidade","Configurações"}[i]);
            bar.addView(button,new LinearLayout.LayoutParams(0,dp(a,46),1));
            button.setOnClickListener(v->actions[index].run());
        }
        FrameLayout.LayoutParams lp=new FrameLayout.LayoutParams(-1,dp(a,58),
            Gravity.BOTTOM|Gravity.CENTER_HORIZONTAL);
        lp.leftMargin=dp(a,12);lp.rightMargin=dp(a,12);lp.bottomMargin=dp(a,15);
        frame.addView(bar,lp);
    }
    static State assemble(MainActivity a,FrameLayout frame,LinearLayout screen,
        View header,LinearLayout balls,ImageView accountAvatar,
        View accountDetails,View updates,LinearLayout stats,View share,View communityPanel,
        TextView footer,int opacity,Runnable account,Runnable first,Runnable second,
        Runnable favorites,Runnable notes,Runnable openChat,Runnable settings){
        screen.removeAllViews();
        screen.setOrientation(LinearLayout.VERTICAL);
        screen.setPadding(dp(a,15),dp(a,6),dp(a,15),dp(a,90));
        screen.addView(header,new LinearLayout.LayoutParams(-1,dp(a,79)));
        TextView[] profileTexts=new TextView[2];
        screen.addView(profile(a,accountAvatar,profileTexts,opacity,account),margin(a,17,8));
        balls.setBackgroundColor(Color.TRANSPARENT);
        balls.setPadding(0,0,0,0);
        LinearLayout one=(LinearLayout)balls.getChildAt(0);
        LinearLayout two=(LinearLayout)balls.getChildAt(1);
        TextView[] b1=ball(a,one,false,opacity);
        TextView[] b2=ball(a,two,true,opacity);
        one.setLayoutParams(new LinearLayout.LayoutParams(0,-1,1));
        LinearLayout.LayoutParams lp2=new LinearLayout.LayoutParams(0,-1,1);
        lp2.leftMargin=dp(a,10);two.setLayoutParams(lp2);
        screen.addView(balls,new LinearLayout.LayoutParams(-1,dp(a,207)));
        // Original FirebaseStats TextViews are kept alive, no invented counts.
        for(int i=0;i<stats.getChildCount();i++)
            stats.getChildAt(i).setBackgroundColor(Color.TRANSPARENT);
        stats.setPadding(dp(a,4),dp(a,3),dp(a,4),dp(a,3));
        stats.setBackground(glass(a,19,opacity));
        screen.addView(stats,margin(a,9,10));
        screen.addView(updates,margin(a,0,5)); // shown only when actually eligible
        screen.addView(news(a,opacity,notes),margin(a,0,9));
        screen.addView(community(a,opacity,openChat),margin(a,0,9));
        screen.addView(chat(a,opacity,openChat),margin(a,0,8));
        footer.setText("PokeSearch  ·  v"+BuildConfig.VERSION_NAME);
        footer.setBackgroundColor(Color.TRANSPARENT);
        screen.addView(footer,margin(a,7,0));
        dock(a,frame,opacity,new Runnable[]{
            ()->{},first,second,favorites,notes,openChat,settings
        });
        return new State(profileTexts[0],profileTexts[1],b1[0],b2[0],
            b1[1],b2[1],b1[2],b2[2]);
    }
}

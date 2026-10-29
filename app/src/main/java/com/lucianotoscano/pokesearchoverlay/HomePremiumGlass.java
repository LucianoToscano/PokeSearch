package com.lucianotoscano.pokesearchoverlay;

import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

/**
 * LT150: the new native Premium Home hero, not a WebView or a replacement
 * for the existing login/menu/overlay flows. All its copy is presentation.
 * Only PremiumAccess (server issued lease) may report P2 as active.
 */
final class HomePremiumGlass {
    private HomePremiumGlass(){}
    private static int dp(MainActivity a,int n){
        return Math.round(a.getResources().getDisplayMetrics().density*n);
    }
    private static TextView text(MainActivity a,String value,int sp,int color,boolean bold){
        TextView v=new TextView(a);
        v.setText(value);
        v.setTextSize(sp);
        v.setTextColor(color);
        v.setGravity(Gravity.CENTER_VERTICAL);
        if(bold)v.setTypeface(Typeface.DEFAULT,Typeface.BOLD);
        return v;
    }
    private static GradientDrawable surface(MainActivity a,int color,int stroke,int radius){
        GradientDrawable bg=new GradientDrawable();
        bg.setColor(color);
        bg.setCornerRadius(dp(a,radius));
        if(stroke!=0)bg.setStroke(dp(a,1),stroke);
        return bg;
    }
    static View create(MainActivity activity,boolean light,int transparency,
                       Runnable onAccount){
        final MainActivity a=activity;
        final int primary=light?Color.rgb(49,49,45):Color.rgb(249,245,234);
        final int secondary=light?Color.rgb(97,93,85):Color.rgb(216,214,205);
        final int gold=light?Color.rgb(137,102,49):Color.rgb(248,220,162);
        final int strength=Math.max(0,100-Math.min(100,Math.max(0,transparency)));

        LinearLayout hero=new LinearLayout(a);
        hero.setOrientation(LinearLayout.VERTICAL);
        hero.setPadding(dp(a,15),dp(a,12),dp(a,15),dp(a,12));
        GradientDrawable gradient=new GradientDrawable(
            GradientDrawable.Orientation.TL_BR,
            light?new int[]{Color.argb(224,252,250,239),Color.argb(195,229,232,224)}:
                new int[]{Color.argb(215,68,66,63),Color.argb(183,38,47,45)});
        gradient.setCornerRadius(dp(a,19));
        gradient.setStroke(dp(a,1),light?Color.argb(180,255,255,255):
            Color.argb(113,255,244,212));
        gradient.setAlpha(Math.round(strength*255f/100f));
        hero.setBackground(gradient);
        hero.setElevation(dp(a,2));
        hero.setContentDescription("Apresentação Premium PokeSearch");

        LinearLayout top=new LinearLayout(a);
        top.setGravity(Gravity.CENTER_VERTICAL);
        hero.addView(top,new LinearLayout.LayoutParams(-1,-2));
        TextView eyebrow=text(a,"✦  POKESEARCH PREMIUM",10,gold,true);
        eyebrow.setLetterSpacing(.07f);
        top.addView(eyebrow,new LinearLayout.LayoutParams(0,-2,1));
        TextView tier=text(a,PremiumAccess.permitted(true)?"● ATIVO":"◇ CONHEÇA",9,gold,true);
        tier.setGravity(Gravity.CENTER);
        tier.setPadding(dp(a,8),dp(a,4),dp(a,8),dp(a,4));
        tier.setBackground(surface(a,light?Color.argb(146,244,222,181):
            Color.argb(80,230,190,126),light?Color.argb(110,171,137,77):
            Color.argb(108,251,230,183),11));
        top.addView(tier,new LinearLayout.LayoutParams(-2,-2));

        TextView heading=text(a,"Seu universo de caça.",19,primary,true);
        LinearLayout.LayoutParams headingLp=new LinearLayout.LayoutParams(-1,-2);
        headingLp.topMargin=dp(a,6);
        hero.addView(heading,headingLp);

        TextView intro=text(a,"Pokémon GO, filtros e comunidade em uma experiência exclusiva.",
            11,secondary,false);
        intro.setMaxLines(2);
        LinearLayout.LayoutParams introLp=new LinearLayout.LayoutParams(-1,-2);
        introLp.topMargin=dp(a,2);
        hero.addView(intro,introLp);

        LinearLayout footer=new LinearLayout(a);
        footer.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams footerLp=new LinearLayout.LayoutParams(-1,-2);
        footerLp.topMargin=dp(a,9);
        hero.addView(footer,footerLp);
        TextView features=text(a,"◈ IV & PvP     ✨ Shiny     ♡ Favoritos",
            10,secondary,true);
        features.setSingleLine(true);
        features.setEllipsize(TextUtils.TruncateAt.END);
        footer.addView(features,new LinearLayout.LayoutParams(0,-2,1));

        TextView account=text(a,PremiumGoogleLogin.isGoogleSignedIn(a)?
            "Minha conta ›":"Premium ›",11,primary,true);
        account.setGravity(Gravity.CENTER);
        account.setPadding(dp(a,10),dp(a,7),dp(a,10),dp(a,7));
        account.setContentDescription("Abrir conta Premium PokeSearch");
        account.setBackground(surface(a,light?Color.argb(183,255,255,255):
            Color.argb(77,240,231,218),light?Color.argb(108,165,151,130):
            Color.argb(112,242,230,207),11));
        LinearLayout.LayoutParams accountLp=new LinearLayout.LayoutParams(-2,-2);
        accountLp.leftMargin=dp(a,8);
        footer.addView(account,accountLp);
        account.setOnClickListener(v->onAccount.run());
        return hero;
    }
}

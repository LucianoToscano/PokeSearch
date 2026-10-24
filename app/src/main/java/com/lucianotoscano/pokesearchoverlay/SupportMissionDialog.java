package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.app.Dialog;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

/** One compact native, accessible, functional dialog for the four persisted mission themes. */
public final class SupportMissionDialog {
    private SupportMissionDialog() {}
    private static int dp(Activity a, float n) {
        return (int)(a.getResources().getDisplayMetrics().density*n + .5f);
    }
    private static GradientDrawable shape(int color, int stroke) {
        GradientDrawable bg=new GradientDrawable();
        bg.setColor(color);
        bg.setCornerRadius(24);
        bg.setStroke(2,stroke);
        return bg;
    }
    private static TextView text(Activity a,String label,int size,int color,boolean bold) {
        TextView t=new TextView(a);
        t.setText(label);
        t.setTextColor(color);
        t.setTextSize(size);
        t.setGravity(Gravity.CENTER);
        if(bold)t.setTypeface(null,android.graphics.Typeface.BOLD);
        return t;
    }
    private static ImageView art(Activity a,int drawable,int width,int height,String alt) {
        ImageView v=new ImageView(a);
        v.setImageResource(drawable);
        v.setScaleType(ImageView.ScaleType.FIT_CENTER);
        v.setAdjustViewBounds(true);
        v.setBackgroundColor(Color.TRANSPARENT);
        v.setContentDescription(alt);
        v.setLayoutParams(new LinearLayout.LayoutParams(dp(a,width),dp(a,height)));
        return v;
    }
    private static void centered(LinearLayout root,View view) {
        LinearLayout.LayoutParams lp=(LinearLayout.LayoutParams)view.getLayoutParams();
        lp.gravity=Gravity.CENTER_HORIZONTAL;
        root.addView(view,lp);
    }
    private static void arts(Activity a,LinearLayout body,int... resources) {
        LinearLayout row=new LinearLayout(a);
        row.setGravity(Gravity.CENTER);
        row.setOrientation(LinearLayout.HORIZONTAL);
        LinearLayout.LayoutParams rowLp=new LinearLayout.LayoutParams(-1,dp(a,90));
        rowLp.topMargin=dp(a,8);
        body.addView(row,rowLp);
        for(int id:resources) row.addView(art(a,id,76,78,"Arte original da missão"));
    }
    private static int accent(int style) {
        switch(style){
            case 1:return Color.rgb(21,156,175);
            case 2:return Color.rgb(165,111,237);
            case 3:return Color.rgb(237,103,148);
            default:return Color.rgb(239,153,59);
        }
    }
    public static void show(Activity activity,int style,boolean light,Runnable afterDismiss) {
        if(style<0||style>=4||activity.isFinishing()||activity.isDestroyed())return;
        final Dialog dialog=new Dialog(activity);
        final boolean[] dismissed={false};
        final Runnable flee=()->{
            if(dismissed[0])return;
            dismissed[0]=true;
            SupportMissionState.dismiss(activity);
            dialog.dismiss();
            afterDismiss.run();
        };
        dialog.setCancelable(true);
        dialog.setCanceledOnTouchOutside(false);
        dialog.setOnCancelListener(d->flee.run());
        int bg=light?Color.rgb(251,253,255):Color.rgb(23,31,48);
        int fg=light?Color.rgb(28,46,62):Color.WHITE;
        int sub=light?Color.rgb(73,92,108):Color.rgb(216,228,242);
        int accent=accent(style);

        LinearLayout layout=new LinearLayout(activity);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(dp(activity,16),dp(activity,12),dp(activity,16),dp(activity,12));
        layout.setBackground(shape(bg,accent));
        ScrollView scroll=new ScrollView(activity);
        scroll.setFillViewport(false);
        scroll.addView(layout);

        LinearLayout heading=new LinearLayout(activity);
        heading.setOrientation(LinearLayout.HORIZONTAL);
        heading.setGravity(Gravity.CENTER_VERTICAL);
        layout.addView(heading,new LinearLayout.LayoutParams(-1,dp(activity,34)));
        TextView pretitle=text(activity,"MISSÃO ESPECIAL • APOIO OPCIONAL",10,accent,true);
        pretitle.setGravity(Gravity.LEFT|Gravity.CENTER_VERTICAL);
        heading.addView(pretitle,new LinearLayout.LayoutParams(0,-1,1));
        TextView close=text(activity,"✕",20,fg,true);
        close.setContentDescription("Dispensar a missão por 15 dias");
        heading.addView(close,new LinearLayout.LayoutParams(dp(activity,40),dp(activity,34)));
        close.setOnClickListener(v->flee.run());

        String title,body;
        switch(style){
            case 0:
                title="PESQUISA ESPECIAL — EVOLUA O POKESEARCH!";
                body="Treinador, uma missão especial apareceu! Seu apoio ajuda o PokeSearch a continuar evoluindo com melhorias, correções e novidades. Qualquer valor é super efetivo!";
                break;
            case 1:
                title="VOCÊ ENCONTROU UM PRESENTE ESPECIAL!";
                body="Seu apoio é um presente para o PokeSearch! Ajude o projeto a continuar evoluindo. Qualquer valor ajuda, e participar é totalmente opcional!";
                break;
            case 2:
                title="UM MEWTWO SHINY 100% COM FUNDO?!";
                body="CALMA! 😂 Ele não entra na sua Pokédex! Mas seu apoio é super efetivo para ajudar o PokeSearch a continuar evoluindo!";
                break;
            default:
                title="ALERTA! O PIKACHU DO POKESEARCH FOI INTERNADO! 😂";
                body="Depois de enfrentar 999 bugs, Pikachu usou TRABALHAR DEMAIS!\n\nFoi super efetivo... contra ele mesmo! 💀\n\nSeu apoio ajuda o projeto a sobreviver à próxima atualização!";
                break;
        }
        TextView titleView=text(activity,title,19,fg,true);
        LinearLayout.LayoutParams titleLp=new LinearLayout.LayoutParams(-1,-2);
        titleLp.topMargin=dp(activity,10);
        layout.addView(titleView,titleLp);

        if(style==0){
            arts(activity,layout,R.drawable.support_home_new,
                R.drawable.support_pikachu_sticker,R.drawable.support_pikachu_coin);
            arts(activity,layout,R.drawable.support_coins_small,
                R.drawable.support_donate_button,R.drawable.support_heart);
        }else if(style==1){
            arts(activity,layout,R.drawable.support_donate_button,
                R.drawable.support_pikachu_coin,R.drawable.support_coin_bag);
            arts(activity,layout,R.drawable.support_coins_small,
                R.drawable.support_coin_stacks,R.drawable.support_thankyou);
        }else if(style==2){
            centered(layout,art(activity,R.drawable.support_mewtwo_shundo,260,250,
                "Arte original Mewtwo dourado com armadura, Nova York roxa, IV 15/15/15"));
        }else{
            centered(layout,art(activity,R.drawable.support_pikachu_meme,280,210,
                "Arte original do Pikachu internado"));
            arts(activity,layout,R.drawable.support_slowpoke,R.drawable.support_pikachu_raichu);
        }

        TextView message=text(activity,body,14,fg,false);
        message.setLineSpacing(dp(activity,3),1.06f);
        LinearLayout.LayoutParams messageLp=new LinearLayout.LayoutParams(-1,-2);
        messageLp.topMargin=dp(activity,10);
        layout.addView(message,messageLp);

        TextView hint=text(activity,"PIX • Qualquer valor\nConfira os dados no aplicativo do banco.",12,sub,false);
        LinearLayout.LayoutParams hintLp=new LinearLayout.LayoutParams(-1,-2);
        hintLp.topMargin=dp(activity,10);
        layout.addView(hint,hintLp);

        LinearLayout actions=new LinearLayout(activity);
        actions.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams actionsLp=new LinearLayout.LayoutParams(-1,dp(activity,104));
        actionsLp.topMargin=dp(activity,5);
        layout.addView(actions,actionsLp);
        ImageView fleeButton=art(activity,R.drawable.support_flee_button,104,92,
            "FUGIR — dispensar missão por 15 dias");
        fleeButton.setOnClickListener(v->flee.run());
        actions.addView(fleeButton);
        ImageView donateButton=art(activity,R.drawable.support_donate_button,102,92,
            "APOIAR — abrir Pix verdadeiro e copiar código");
        donateButton.setOnClickListener(v->PixSupport.show(activity));
        actions.addView(donateButton);

        dialog.setContentView(scroll);
        Window window=dialog.getWindow();
        if(window!=null)window.setBackgroundDrawableResource(android.R.color.transparent);
        dialog.show();
        if(window!=null){
            int available=activity.getResources().getDisplayMetrics().widthPixels;
            window.setLayout(Math.min(available-dp(activity,24),dp(activity,380)),
                WindowManager.LayoutParams.WRAP_CONTENT);
            window.setGravity(Gravity.CENTER);
            window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        }
    }
}

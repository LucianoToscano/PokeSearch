package com.lucianotoscano.pokesearchoverlay;

import android.app.Dialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.media.MediaPlayer;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

/** Compact overlay actions: no Home/Activity navigation on sound or Pix click.
 * The panel is content-sized and passes outside touches to the underlying app.
 * Existing owner-provided QR and all 36 sounds are reused unchanged. */
final class OverlayQuickMenus {
    private OverlayQuickMenus(){}
    private static int dp(Context c,int value){
        return (int)(c.getResources().getDisplayMetrics().density*value+.5f);
    }
    static int panelColor(Context c){
        int transparency=50;boolean light=false;
        try{
            org.json.JSONObject p=new org.json.JSONObject(c.getSharedPreferences("prefs",0)
                .getString("visualPrefsJson","{}"));
            transparency=Math.max(0,Math.min(100,p.optInt("menuTransparency",50)));
            light="light".equals(p.optString("menuBgMode","dark"));
        }catch(org.json.JSONException ignored){}
        int alpha=(int)Math.round(255*(1-Math.pow(transparency/100.0,2.8)));
        return light?Color.argb(alpha,255,255,255):Color.argb(alpha,15,19,26);
    }
    private static int foreground(Context c){
        try{
            org.json.JSONObject p=new org.json.JSONObject(c.getSharedPreferences("prefs",0)
                .getString("visualPrefsJson","{}"));
            return "light".equals(p.optString("menuBgMode","dark"))?
                Color.rgb(20,33,48):Color.rgb(244,247,255);
        }catch(org.json.JSONException ignored){return Color.WHITE;}
    }
    private static GradientDrawable panelBackground(Context c){
        GradientDrawable d=new GradientDrawable();
        d.setColor(panelColor(c));d.setCornerRadius(dp(c,10));
        d.setStroke(dp(c,1),0x667E91A5);return d;
    }
    private static TextView text(Context c,String s,int sp){
        TextView t=new TextView(c);t.setText(s);t.setTextSize(sp);
        t.setTextColor(foreground(c));t.setGravity(Gravity.CENTER_VERTICAL);
        return t;
    }
    private static Button button(Context c,String s){
        Button b=new Button(c);b.setAllCaps(false);
        b.setText(s);b.setTextSize(11);b.setMinHeight(0);b.setMinimumHeight(0);
        b.setPadding(dp(c,5),0,dp(c,5),0);
        b.setTextColor(foreground(c));
        GradientDrawable d=new GradientDrawable();d.setColor(0x55394A5C);
        d.setCornerRadius(dp(c,6));d.setStroke(dp(c,1),0x557E91A5);
        b.setBackground(d);return b;
    }
    private static LinearLayout root(Context c){
        LinearLayout root=new LinearLayout(c);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(c,9),dp(c,9),dp(c,9),dp(c,9));
        root.setBackground(panelBackground(c));
        return root;
    }
    private static Dialog show(Context context,LinearLayout root,int anchorY,int widthDp){
        Context themed=new android.view.ContextThemeWrapper(context,
            android.R.style.Theme_Material_NoActionBar);
        // Root was inflated with the service context. Theme only supplies the
        // Dialog window; TYPE_APPLICATION_OVERLAY is explicitly selected.
        Dialog dialog=new Dialog(themed,android.R.style.Theme_Material_NoActionBar);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setContentView(root);
        dialog.setCanceledOnTouchOutside(true);
        Window window=dialog.getWindow();
        if(window!=null)window.setType(WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY);
        dialog.show();
        window=dialog.getWindow();
        if(window!=null){
            final Window w=window;
            w.setBackgroundDrawableResource(android.R.color.transparent);
            w.addFlags(WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL);
            w.clearFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND|
                WindowManager.LayoutParams.FLAG_BLUR_BEHIND);
            w.setDimAmount(0f);
            if(Build.VERSION.SDK_INT>=31){
                try{
                    org.json.JSONObject p=new org.json.JSONObject(context
                        .getSharedPreferences("prefs",0).getString("visualPrefsJson","{}"));
                    w.setBackgroundBlurRadius(dp(context,Math.max(0,
                        Math.min(16,p.optInt("menuBlur",4)))));
                }catch(Exception ignored){}
            }
            int screenW=context.getResources().getDisplayMetrics().widthPixels;
            int width=Math.min(screenW-dp(context,16),dp(context,widthDp));
            w.setLayout(width,WindowManager.LayoutParams.WRAP_CONTENT);
            w.getDecorView().post(()->{
                if(!w.getDecorView().isAttachedToWindow())return;
                int screenH=context.getResources().getDisplayMetrics().heightPixels;
                int actualH=w.getDecorView().getHeight();
                if(actualH<=0)return;
                int topBelow=anchorY+dp(context,8);
                int topAbove=anchorY-actualH-dp(context,8);
                int top=topBelow+actualH<screenH-dp(context,8)?topBelow:
                    Math.max(dp(context,8),topAbove);
                WindowManager.LayoutParams lp=w.getAttributes();
                lp.gravity=Gravity.TOP|Gravity.CENTER_HORIZONTAL;
                lp.x=0;lp.y=Math.min(Math.max(dp(context,8),top),
                    Math.max(dp(context,8),screenH-actualH-dp(context,8)));
                w.setAttributes(lp);
            });
        }
        return dialog;
    }
    static Dialog showPix(Context context,int anchorY){
        LinearLayout content=root(context);
        LinearLayout header=new LinearLayout(context);header.setGravity(Gravity.CENTER_VERTICAL);
        TextView title=text(context,"Apoiar · Pix",15);
        header.addView(title,new LinearLayout.LayoutParams(0,dp(context,28),1));
        Button close=button(context,"×");header.addView(close,new LinearLayout.LayoutParams(dp(context,32),dp(context,28)));
        content.addView(header);
        ImageView qr=new ImageView(context);
        // Byte-identical QR supplied by the owner; no regeneration.
        qr.setImageResource(R.drawable.support_pix_qr_original);
        qr.setScaleType(ImageView.ScaleType.FIT_CENTER);
        qr.setBackgroundColor(Color.WHITE);
        qr.setContentDescription("Código Pix original");
        LinearLayout.LayoutParams q=new LinearLayout.LayoutParams(dp(context,212),dp(context,212));
        q.gravity=Gravity.CENTER_HORIZONTAL;q.topMargin=dp(context,5);
        content.addView(qr,q);
        TextView note=text(context,"Qualquer valor · confira os dados no banco",11);
        note.setGravity(Gravity.CENTER);content.addView(note);
        Button copy=button(context,"⧉ Copiar código Pix");
        LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-1,dp(context,34));
        cp.topMargin=dp(context,6);content.addView(copy,cp);
        Dialog d=show(context,content,anchorY,255);
        close.setOnClickListener(v->d.dismiss());
        copy.setOnClickListener(v->{
            ClipboardManager clipboard=(ClipboardManager)context.getSystemService(Context.CLIPBOARD_SERVICE);
            if(clipboard!=null){
                clipboard.setPrimaryClip(ClipData.newPlainText("Pix · PokeSearch",PixSupport.PAYLOAD));
                Toast.makeText(context,"Código Pix copiado · confirme no banco",
                    Toast.LENGTH_LONG).show();
            }
        });
        return d;
    }
    static Dialog showTone(Context context,String target,int anchorY,Runnable changed){
        if(!"general".equals(target)&&!"favorites".equals(target))return null;
        LinearLayout content=root(context);
        LinearLayout titleRow=new LinearLayout(context);titleRow.setGravity(Gravity.CENTER_VERTICAL);
        TextView title=text(context,
            "Som · "+("favorites".equals(target)?"Favoritos":"Novos Pokémon"),13);
        titleRow.addView(title,new LinearLayout.LayoutParams(0,dp(context,30),1));
        Button exit=button(context,"×");
        titleRow.addView(exit,new LinearLayout.LayoutParams(dp(context,32),dp(context,30)));
        content.addView(titleRow);
        TextView help=text(context,"Toque para ouvir · ✓ confirma o som",10);
        content.addView(help);
        ScrollView scroll=new ScrollView(context);
        scroll.setFillViewport(false);
        LinearLayout items=new LinearLayout(context);items.setOrientation(LinearLayout.VERTICAL);
        scroll.addView(items);
        content.addView(scroll,new LinearLayout.LayoutParams(-1,dp(context,270)));
        final int[] selection={-1};
        final MediaPlayer[] preview={null};
        final Ringtone[] system={null};
        final Runnable stop=()->{
            if(system[0]!=null){try{system[0].stop();}catch(Exception ignored){}system[0]=null;}
            if(preview[0]!=null){
                try{preview[0].stop();}catch(Exception ignored){}
                try{preview[0].release();}catch(Exception ignored){}preview[0]=null;
            }
        };
        for(int i=-2;i<PokeSoundLibrary.size();i++){
            if(i==-1)continue; // -1 is reserved for no selection
            final int index=i;
            final String label=i==-2?"Padrão":PokeSoundLibrary.LABELS[i];
            Button option=button(context,label);
            option.setGravity(Gravity.CENTER_VERTICAL|Gravity.LEFT);
            LinearLayout.LayoutParams ol=new LinearLayout.LayoutParams(-1,dp(context,33));
            ol.bottomMargin=dp(context,2);items.addView(option,ol);
            option.setOnClickListener(v->{
                stop.run();selection[0]=index;
                help.setText("Selecionado: "+label+" · toque ✓ Usar áudio");
                if(index==-2){
                    try{
                        system[0]=RingtoneManager.getRingtone(context,
                            RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION));
                        if(system[0]!=null)system[0].play();
                    }catch(Exception ignored){}
                }else{
                    try{
                        Uri uri=PokeSoundLibrary.soundUri(context,index);
                        preview[0]=MediaPlayer.create(context,uri);
                        if(preview[0]!=null)preview[0].start();
                    }catch(Exception ignored){}
                }
            });
        }
        Button apply=button(context,"✓ Usar áudio");
        LinearLayout.LayoutParams ap=new LinearLayout.LayoutParams(-1,dp(context,34));
        ap.topMargin=dp(context,5);content.addView(apply,ap);
        Dialog d=show(context,content,anchorY,275);
        exit.setOnClickListener(v->d.dismiss());
        d.setOnDismissListener(ignore->stop.run());
        apply.setOnClickListener(v->{
            if(selection[0]==-1){help.setText("Escolha um áudio acima");return;}
            String chosen=selection[0]==-2?"":String.valueOf(
                PokeSoundLibrary.soundUri(context,selection[0]));
            String key="favorites".equals(target)?WatchAlerts.PREF_FAVORITE_TONE:
                WatchAlerts.PREF_GENERAL_TONE;
            context.getSharedPreferences("prefs",0).edit().putString(key,chosen).apply();
            if(changed!=null)changed.run();
            d.dismiss();
            Toast.makeText(context,"✓ Som configurado",Toast.LENGTH_SHORT).show();
        });
        return d;
    }
}

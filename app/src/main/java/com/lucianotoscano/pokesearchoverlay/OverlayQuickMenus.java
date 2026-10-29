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
        // Read the committed sound: both the saved choice and any newly tapped
        // preview remain visibly selected until the user confirms.
        android.content.SharedPreferences tonePrefs=context.getSharedPreferences("prefs",0);
        String toneKey="favorites".equals(target)?WatchAlerts.PREF_FAVORITE_TONE:
            WatchAlerts.PREF_GENERAL_TONE;
        // Favoritos without an explicit preference really plays the bundled
        // Portuguese BR clip, not Android's generic notification ringtone.
        String saved="favorites".equals(target)&&!tonePrefs.contains(toneKey)?
            PokeSoundLibrary.favoriteDefaultUri(context).toString():
            tonePrefs.getString(toneKey,"");
        int savedIndex=-2; // empty preference is Android's default notification
        if(!saved.isEmpty())for(int i=0;i<PokeSoundLibrary.size();i++){
            Uri uri=PokeSoundLibrary.soundUri(context,i);
            if(uri!=null&&saved.equals(uri.toString())){savedIndex=i;break;}
        }
        final int[] selection={savedIndex};
        final java.util.ArrayList<Button> toneButtons=new java.util.ArrayList<>();
        final java.util.ArrayList<Integer> toneIndices=new java.util.ArrayList<>();
        final Runnable markSelected=()->{
            for(int i=0;i<toneButtons.size();i++){
                Button b=toneButtons.get(i);
                int index=toneIndices.get(i);
                boolean checked=index==selection[0];
                String name=index==-2?"Padrão":PokeSoundLibrary.LABELS[index];
                b.setSelected(checked);
                b.setText((checked?"✓  ":"    ")+name);
                b.setContentDescription(name+(checked?" · selecionado":" · toque para selecionar e ouvir"));
                b.setTextColor(checked?
                    (Color.luminance(foreground(context))>.5?0xFFCEFFE0:0xFF17513C):
                    foreground(context));
                GradientDrawable bg=new GradientDrawable();
                bg.setCornerRadius(dp(context,6));
                bg.setColor(checked?0xAA295E49:0x55394A5C);
                bg.setStroke(dp(context,checked?2:1),checked?0xFF70E6A6:0x557E91A5);
                b.setBackground(bg);
            }
        };
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
            toneButtons.add(option);toneIndices.add(index);
            LinearLayout.LayoutParams ol=new LinearLayout.LayoutParams(-1,dp(context,33));
            ol.bottomMargin=dp(context,2);items.addView(option,ol);
            option.setOnClickListener(v->{
                stop.run();selection[0]=index;
                markSelected.run();
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
        markSelected.run();
        help.setText("Selecionado: "+(selection[0]==-2?"Padrão":
            selection[0]>=0?PokeSoundLibrary.LABELS[selection[0]]:"Escolha um som")+
            " · toque ✓ Usar áudio");
        if("favorites".equals(target)){
            // Preview tests the MP3 only. This explicitly tests the REAL
            // Android notification channel, permissions and device volume.
            Button testSound=button(context,"🔔 Testar notificação de favorito");
            LinearLayout.LayoutParams tp=new LinearLayout.LayoutParams(-1,dp(context,35));
            tp.topMargin=dp(context,4);content.addView(testSound,tp);
            testSound.setOnClickListener(v->{
                stop.run();
                boolean delivered=WatchAlerts.test(context);
                String diagnostic=WatchAlerts.soundDiagnostic(context);
                help.setText(delivered?"Teste enviado · "+diagnostic:diagnostic);
                Toast.makeText(context,
                    delivered?"Teste enviado · "+diagnostic:diagnostic,
                    Toast.LENGTH_LONG).show();
            });
        }
        Button apply=button(context,"✓ Usar áudio");
        LinearLayout.LayoutParams ap=new LinearLayout.LayoutParams(-1,dp(context,34));
        ap.topMargin=dp(context,5);content.addView(apply,ap);
        Dialog d=show(context,content,anchorY,275);
        // Expose the currently configured sound even among 36 scrollable options.
        final int selectedRow=selection[0]==-2?0:selection[0]+1;
        scroll.post(()->{
            if(selectedRow>=0&&selectedRow<toneButtons.size())
                scroll.scrollTo(0,Math.max(0,toneButtons.get(selectedRow).getTop()-dp(context,24)));
        });
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
    /** LT175: shares the Pokébola native quick-menu colors, opacity and blur. */
    interface CandyActions {
        String coordinates();
        int radius();
        int period();
        boolean infos();
        void saveLocation(String coords,int radius);
        void refresh();
        void updatePeriod(int minutes);
        void updateInfos(boolean visible);
    }
    static Dialog showCandy(Context context,int anchorY,CandyActions actions){
        LinearLayout content=root(context);
        TextView title=text(context,"🍬  Doce Raro",14);
        title.setTypeface(null,android.graphics.Typeface.BOLD);
        content.addView(title,new LinearLayout.LayoutParams(-1,dp(context,32)));
        Button loc=button(context,"⌖   Localização");
        content.addView(loc,new LinearLayout.LayoutParams(-1,dp(context,36)));
        Button refresh=button(context,"↻   Atualizar agora");
        LinearLayout.LayoutParams rlp=new LinearLayout.LayoutParams(-1,dp(context,36));
        rlp.topMargin=dp(context,5);
        content.addView(refresh,rlp);
        TextView hint=text(context,"Atualização automática",11);
        LinearLayout.LayoutParams hlp=new LinearLayout.LayoutParams(-1,dp(context,28));
        hlp.topMargin=dp(context,4);
        content.addView(hint,hlp);
        LinearLayout buttons=new LinearLayout(context);
        buttons.setOrientation(LinearLayout.HORIZONTAL);
        for(int value:new int[]{1,3,5}){
            Button b=button(context,value+"m"+(value==actions.period()?" ✓":""));
            LinearLayout.LayoutParams bp=new LinearLayout.LayoutParams(0,dp(context,34),1);
            if(value!=1)bp.leftMargin=dp(context,4);
            buttons.addView(b,bp);
        }
        content.addView(buttons);
        Button infos=button(context,actions.infos()?"◉   Infos: Mostrar":"◎   Infos: Ocultar");
        LinearLayout.LayoutParams ilp=new LinearLayout.LayoutParams(-1,dp(context,38));
        ilp.topMargin=dp(context,7);content.addView(infos,ilp);
        TextView explanation=text(context,"Localização · Despawn · Distância",10);
        content.addView(explanation,new LinearLayout.LayoutParams(-1,dp(context,24)));
        Dialog dialog=show(context,content,anchorY,245);
        loc.setOnClickListener(v->{
            dialog.dismiss();
            showCandyLocation(context,anchorY,actions);
        });
        refresh.setOnClickListener(v->{actions.refresh();dialog.dismiss();});
        for(int i=0;i<buttons.getChildCount();i++){
            final int value=new int[]{1,3,5}[i];
            buttons.getChildAt(i).setOnClickListener(v->{
                actions.updatePeriod(value);
                dialog.dismiss();
            });
        }
        infos.setOnClickListener(v->{actions.updateInfos(!actions.infos());dialog.dismiss();});
        return dialog;
    }
    private static Dialog showCandyLocation(Context context,int anchorY,CandyActions actions){
        LinearLayout body=root(context);
        body.addView(text(context,"⌖  Localização · Doce Raro",14),
            new LinearLayout.LayoutParams(-1,dp(context,35)));
        android.widget.EditText coords=new android.widget.EditText(context);
        coords.setSingleLine(true);
        coords.setTextSize(12);
        coords.setTextColor(foreground(context));
        coords.setHintTextColor(0xFF9AABC3);
        coords.setHint("Latitude,Longitude");
        coords.setText(actions.coordinates());
        coords.setSelectAllOnFocus(true);
        body.addView(coords,new LinearLayout.LayoutParams(-1,dp(context,42)));
        android.widget.EditText radius=new android.widget.EditText(context);
        radius.setTextSize(12);radius.setTextColor(foreground(context));
        radius.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);
        radius.setHint("Raio (0–1000 km)");radius.setHintTextColor(0xFF9AABC3);
        radius.setText(String.valueOf(actions.radius()));
        body.addView(radius,new LinearLayout.LayoutParams(-1,dp(context,42)));
        LinearLayout buttons=new LinearLayout(context);
        Button apply=button(context,"✓ Aplicar");
        Button clear=button(context,"✕ Limpar");
        buttons.addView(clear,new LinearLayout.LayoutParams(0,dp(context,36),1));
        buttons.addView(apply,new LinearLayout.LayoutParams(0,dp(context,36),1));
        body.addView(buttons);
        Dialog dialog=show(context,body,anchorY,265);
        apply.setOnClickListener(v->{
            String center=coords.getText().toString().trim();
            int distance;
            try{distance=Integer.parseInt(radius.getText().toString().trim());}
            catch(NumberFormatException error){Toast.makeText(context,"Raio inválido",Toast.LENGTH_SHORT).show();return;}
            if(distance<0||distance>1000||(!center.isEmpty()&&!center.matches(
                "-?[0-9]{1,2}(?:\\.[0-9]+)?\\s*,\\s*-?[0-9]{1,3}(?:\\.[0-9]+)?"))){
                Toast.makeText(context,"Informe coordenadas e raio válidos",Toast.LENGTH_LONG).show();return;
            }
            if(!center.isEmpty()){
                String[] ll=center.split(",");
                try{
                    double lat=Double.parseDouble(ll[0].trim());
                    double lng=Double.parseDouble(ll[1].trim());
                    if(Math.abs(lat)>90||Math.abs(lng)>180)throw new NumberFormatException();
                    center=ll[0].trim()+","+ll[1].trim();
                }catch(NumberFormatException error){
                    Toast.makeText(context,"Latitude ou longitude inválida",Toast.LENGTH_LONG).show();return;
                }
            }
            actions.saveLocation(center,distance);dialog.dismiss();
        });
        clear.setOnClickListener(v->{actions.saveLocation("",1000);dialog.dismiss();});
        return dialog;
    }

}

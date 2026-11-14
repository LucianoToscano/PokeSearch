package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Point;
import android.graphics.drawable.GradientDrawable;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Menu overlay in the compact visual language of the owner's PokeSearch.
 * Uses TYPE_ACCESSIBILITY_OVERLAY; does not modify PokeSearch or PGSharp.
 */
final class PgsAutoMenus {
    interface Actions {
        void teach(String species);
        void retryNow();
        void closeOverlay();
        void testNotification(String type);
        void modelsChanged();
    }
    private final Context context;
    private final WindowManager wm;
    private final Actions actions;
    private View toolbar,panel;
    private android.media.Ringtone tonePreview;
    private void stopTonePreview(){
        if(tonePreview!=null){
            try{tonePreview.stop();}catch(Exception ignored){}
            tonePreview=null;
        }
    }
    private void markChosen(Button b,boolean chosen){
        b.setSelected(chosen);
        b.setTextColor(chosen?0xFF70E6A6:fg());
        b.setBackground(bg(chosen?0xAA295E49:0x55394A5C,
            chosen?0xFF70E6A6:0x557E91A5,6));
    }
    private int anchorX,anchorY;
    private static final int BG=0xEC10151F, TILE=0xD9222A38, BORDER=0xFF728095;
    private static final int WHITE=0xFFF4F7FF, SECONDARY=0xFFD0D6E0,GOLD=0xFFFFD47B;
    PgsAutoMenus(Context c,WindowManager w,Actions a){context=c;wm=w;actions=a;}
    private int dp(float value){return Math.round(value*context.getResources().getDisplayMetrics().density);}
    private Point size(){Point p=new Point();wm.getDefaultDisplay().getRealSize(p);return p;}
    private GradientDrawable bg(int fill,int stroke,int radius){
        GradientDrawable d=new GradientDrawable();d.setColor(fill);d.setCornerRadius(dp(radius));
        if(stroke!=0)d.setStroke(dp(1),stroke);return d;
    }
    private int fg(){
        try{org.json.JSONObject p=new org.json.JSONObject(context.getSharedPreferences("prefs",0).getString("visualPrefsJson","{}"));
            return "light".equals(p.optString("menuBgMode","dark"))?0xFF142130:0xFFF4F7FF;
        }catch(Exception ignored){return 0xFFF4F7FF;}
    }
    private TextView label(String value,int sp,boolean strong){
        TextView t=new TextView(context);t.setText(value);t.setTextSize(sp);
        t.setTextColor(fg());t.setGravity(Gravity.CENTER_VERTICAL);
        if(strong)t.setTypeface(null,android.graphics.Typeface.BOLD);
        return t;
    }
    private Button button(String value,int sp){
        Button b=new Button(context);b.setAllCaps(false);b.setText(value);b.setTextSize(sp);
        b.setTextColor(fg());b.setMinHeight(0);b.setMinimumHeight(0);
        b.setMinWidth(0);b.setMinimumWidth(0);b.setPadding(dp(5),0,dp(5),0);
        b.setBackground(bg(0x55394A5C,0x557E91A5,6));return b;
    }
    private LinearLayout vertical(){LinearLayout l=new LinearLayout(context);l.setOrientation(LinearLayout.VERTICAL);return l;}
    private LinearLayout horizontal(){LinearLayout l=new LinearLayout(context);l.setGravity(Gravity.CENTER_VERTICAL);return l;}
    private LinearLayout.LayoutParams margined(int w,int h,int top){
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(w,h);p.topMargin=dp(top);return p;
    }
    void toggle(int x,int y){if(toolbar!=null){dismissAll();return;}showToolbar(x,y);}
    void dismissAll(){hidePanel();hideToolbar();}
    private void hidePanel(){stopTonePreview();if(panel!=null){try{wm.removeView(panel);}catch(Exception ignored){}panel=null;}}
    private void hideToolbar(){if(toolbar!=null){try{wm.removeView(toolbar);}catch(Exception ignored){}toolbar=null;}}
    boolean isOpen(){return panel!=null||toolbar!=null;}
    void showToolbar(int x,int y){
        dismissAll();anchorX=x;anchorY=y;
        LinearLayout bar=horizontal();bar.setPadding(dp(5),dp(4),dp(5),dp(4));
        bar.setBackground(bg(OverlayQuickMenus.panelColor(context),0x667E91A5,10));
        // PGS: a mesma fileira compacta das Pokébolas, sem submenus redundantes.
        String[] icons={"⌕","⏱","🔔","×"};
        String[] descriptions={"Buscas","Tempos da busca","Alertas Buscar Pokémon","Fechar Buscar Pokémon"};
        Runnable[] handlers={this::showSearch,this::showTime,this::showNotifications,
            ()->{dismissAll();actions.closeOverlay();}};
        for(int i=0;i<icons.length;i++){
            final int n=i;
            Button b=button(icons[i],i==0?25:i==3?23:21);
            b.setContentDescription(descriptions[i]);
            LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(dp(44),dp(44));
            if(i>0)p.leftMargin=dp(4);
            bar.addView(b,p);
            b.setOnClickListener(v->handlers[n].run());
        }
        toolbar=bar;
        Point screen=size();
        int width=dp(5+4*44+3*4+5),h=dp(54);
        int left=Math.max(dp(6),Math.min(screen.x-width-dp(6),x-width/2));
        int top=y+dp(53);
        if(top+h+dp(8)>screen.y)top=Math.max(dp(15),y-h-dp(6));
        WindowManager.LayoutParams lp=new WindowManager.LayoutParams(width,h,
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT);
        lp.gravity=Gravity.TOP|Gravity.LEFT;lp.x=left;lp.y=top;
        try{wm.addView(toolbar,lp);}catch(Exception ignored){toolbar=null;}
    }
    private LinearLayout panelRoot(String heading,String right){
        LinearLayout root=vertical();root.setPadding(dp(10),dp(10),dp(10),dp(10));
        root.setBackground(bg(OverlayQuickMenus.panelColor(context),0x667E91A5,10));
        LinearLayout head=horizontal();
        TextView title=label(heading,15,true);
        head.addView(title,new LinearLayout.LayoutParams(0,dp(35),1));
        if(right!=null){TextView meta=label(right,11,true);meta.setTextColor(GOLD);head.addView(meta);}
        Button exit=button("×",19);
        LinearLayout.LayoutParams x=new LinearLayout.LayoutParams(dp(32),dp(32));x.leftMargin=dp(7);
        head.addView(exit,x);exit.setOnClickListener(v->hidePanel());
        root.addView(head);
        return root;
    }
    private void mount(LinearLayout root){
        hidePanel();panel=root;
        Point screen=size();int width=Math.min(screen.x-dp(20),dp(340));
        // The popup uses the same compact 44dp controls as PokeSearch.
        int estimated=dp(520);
        int top=anchorY+dp(55);
        if(top+estimated>screen.y-dp(18))top=Math.max(dp(14),anchorY-estimated-dp(10));
        if(top+estimated>screen.y)top=Math.max(dp(14),screen.y-estimated-dp(20));
        WindowManager.LayoutParams lp=new WindowManager.LayoutParams(width,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            PixelFormat.TRANSLUCENT);
        lp.gravity=Gravity.LEFT|Gravity.TOP;
        lp.x=Math.max(dp(10),Math.min(screen.x-width-dp(10),anchorX-width/2));lp.y=top;
        lp.softInputMode=WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE;
        try{wm.addView(panel,lp);}catch(Exception e){
            panel=null;Toast.makeText(context,"Não foi possível abrir menu: "+e.getMessage(),Toast.LENGTH_LONG).show();
        }
    }
    private List<PgsAutoTemplateStore.Model> imagesFor(PgsAutoCatalog.Pokemon p){
        List<PgsAutoTemplateStore.Model> result=new ArrayList<>();
        for(PgsAutoTemplateStore.Model model:PgsAutoTemplateStore.list(context))
            if(PgsAutoCatalog.findNumber(context,model.name)==p.number)result.add(model);
        return result;
    }

    /** Nenhum modelo desaparece ao desmarcar uma espécie. Só o botão Excluir remove PNG. */
    private void showModelActions(PgsAutoCatalog.Pokemon pokemon,PgsAutoTemplateStore.Model model){
        LinearLayout root=panelRoot(pokemon.name,null);
        try{
            ImageView preview=new ImageView(context);
            preview.setImageBitmap(PgsAutoTemplateStore.decode(context,model));
            preview.setScaleType(ImageView.ScaleType.FIT_CENTER);
            LinearLayout.LayoutParams pp=margined(-1,dp(74),5);
            root.addView(preview,pp);
        }catch(Exception ignored){}
        Button delete=button("× Excluir imagem",12);
        root.addView(delete,margined(-1,dp(37),5));
        delete.setOnClickListener(v->{
            // O usuário tocou explicitamente na imagem e solicitou exclusão.
            PgsAutoTemplateStore.delete(context,model.id);
            actions.modelsChanged();
            showSearch();
        });
        Button another=button("＋ Selecionar outra imagem",12);
        root.addView(another,margined(-1,dp(37),4));
        another.setOnClickListener(v->{
            dismissAll();actions.teach(pokemon.name);
        });
        Button back=button("Voltar",12);
        root.addView(back,margined(-1,dp(34),4));
        back.setOnClickListener(v->showSearch());
        mount(root);
    }

    void showSearch(){
        LinearLayout root=panelRoot("⌕ BUSCAS",PgsAutoCatalog.selected(context).size()+"/50");
        TextView title=(TextView)((LinearLayout)root.getChildAt(0)).getChildAt(1);
        EditText input=new EditText(context);
        input.setTextSize(13);input.setSingleLine(true);
        input.setTextColor(fg());input.setHintTextColor(0xFF9CA8B8);
        input.setHint("Nome ou #");
        input.setPadding(dp(8),0,dp(8),0);
        input.setBackground(bg(TILE,0x667E91A5,7));
        root.addView(input,margined(-1,dp(36),5));
        LinearLayout rows=vertical();
        ScrollView scroll=new ScrollView(context);
        scroll.setVerticalScrollBarEnabled(false);
        scroll.addView(rows);
        root.addView(scroll,margined(-1,dp(252),5));
        Button clear=button("Limpar seleção",11);
        root.addView(clear,margined(-1,dp(31),5));
        final Runnable[] render={null};
        render[0]=()->{
            rows.removeAllViews();
            title.setText(PgsAutoCatalog.selected(context).size()+"/50");
            List<PgsAutoCatalog.Pokemon> found=
                PgsAutoCatalog.search(context,input.getText().toString().trim(),50);
            if(found.isEmpty()){
                rows.addView(label("Nenhum Pokémon",12,false));
                return;
            }
            for(PgsAutoCatalog.Pokemon pokemon:found){
                boolean selected=PgsAutoCatalog.isSelected(context,pokemon.number);
                LinearLayout line=horizontal();
                line.setPadding(dp(3),dp(2),dp(3),dp(2));
                line.setBackground(bg(TILE,0x557E91A5,7));
                rows.addView(line,margined(-1,dp(47),3));
                ImageView dex=new ImageView(context);
                try(java.io.InputStream in=VerifiedSpriteCache.bundledSprite(context,pokemon.number,false)){
                    if(in!=null)dex.setImageBitmap(android.graphics.BitmapFactory.decodeStream(in));
                }catch(Exception ignored){}
                dex.setContentDescription(pokemon.name);
                line.addView(dex,new LinearLayout.LayoutParams(dp(26),dp(35)));
                int priority=PgsAutoCatalog.selected(context).indexOf(pokemon.number);
                TextView label=label((priority>=0?(priority+1)+". ":"")+pokemon.name,11,true);
                label.setSingleLine(true);label.setEllipsize(android.text.TextUtils.TruncateAt.END);
                line.addView(label,new LinearLayout.LayoutParams(0,dp(38),1f));
                if(selected){
                    List<PgsAutoTemplateStore.Model> models=imagesFor(pokemon);
                    for(int i=0;i<Math.min(2,models.size());i++){
                        final PgsAutoTemplateStore.Model model=models.get(i);
                        ImageView thumb=new ImageView(context);
                        try{
                            thumb.setImageBitmap(PgsAutoTemplateStore.decode(context,model));
                        }catch(Exception ignored){}
                        thumb.setScaleType(ImageView.ScaleType.FIT_CENTER);
                        thumb.setBackground(bg(0x66313C4B,0xFF728095,4));
                        thumb.setContentDescription("Imagem monitorada de "+pokemon.name+
                            ". Toque para excluir ou selecionar outra.");
                        line.addView(thumb,new LinearLayout.LayoutParams(dp(27),dp(31)));
                        thumb.setOnClickListener(v->showModelActions(pokemon,model));
                    }
                    Button teach=button(models.isEmpty()?"◎":"＋",14);
                    teach.setContentDescription("Gravar imagem para clicar em "+pokemon.name);
                    line.addView(teach,new LinearLayout.LayoutParams(dp(27),dp(33)));
                    teach.setOnClickListener(v->{
                        dismissAll();actions.teach(pokemon.name);
                    });
                    Button up=button("↑",12);
                    line.addView(up,new LinearLayout.LayoutParams(dp(24),dp(33)));
                    up.setOnClickListener(v->{
                        PgsAutoCatalog.move(context,pokemon.number,-1);
                        render[0].run();
                    });
                    Button down=button("↓",12);
                    line.addView(down,new LinearLayout.LayoutParams(dp(24),dp(33)));
                    down.setOnClickListener(v->{
                        PgsAutoCatalog.move(context,pokemon.number,1);
                        render[0].run();
                    });
                }
                Button choose=button(selected?"−":"＋",14);
                choose.setContentDescription(selected?"Desmarcar "+pokemon.name:"Adicionar "+pokemon.name);
                line.addView(choose,new LinearLayout.LayoutParams(dp(27),dp(33)));
                choose.setOnClickListener(v->{
                    if(!selected&&PgsAutoCatalog.selected(context).size()>=50){
                        Toast.makeText(context,"Limite de 50 Pokémon.",Toast.LENGTH_SHORT).show();
                        return;
                    }
                    PgsAutoCatalog.toggle(context,pokemon.number);
                    actions.modelsChanged();
                    render[0].run();
                });
            }
        };
        input.addTextChangedListener(new TextWatcher(){
            public void beforeTextChanged(CharSequence s,int st,int count,int after){}
            public void onTextChanged(CharSequence s,int st,int before,int count){render[0].run();}
            public void afterTextChanged(Editable s){}
        });
        clear.setOnClickListener(v->{
            PgsAutoCatalog.clear(context);
            actions.modelsChanged();
            render[0].run();
        });
        render[0].run();
        mount(root);
    }
    void showTime(){
        LinearLayout root=panelRoot("⏱ TEMPOS · BUSCA",null);
        root.addView(label("Como funciona:",13,true),margined(-1,dp(28),4));
        root.addView(label("1. Toca no ícone e aguarda o mapa e os PokéStops.",12,false),
            margined(-1,dp(37),2));
        root.addView(label("2. Se em 60 segundos não carregar, segue para o próximo.",12,false),
            margined(-1,dp(38),2));
        root.addView(label("3. Se carregar, verifica aviso Shiny da mesma espécie por 2 s.",12,false),
            margined(-1,dp(43),2));
        root.addView(label("4. Sem Shiny confirmado, procura automaticamente o próximo.",12,false),
            margined(-1,dp(43),2));
        SharedPreferences prefs=PgsAutoClickService.cyclePrefs(context);
        String[] names={"Limite de carregamento do mapa","Espera de Shiny após carregar"};
        String[] keys={"load_timeout","post_load"};
        int[] defaults={60,2},low={20,1},high={120,10};
        EditText[] fields=new EditText[keys.length];
        for(int i=0;i<keys.length;i++){
            LinearLayout line=horizontal();line.setPadding(0,dp(3),0,dp(3));
            TextView title=label(names[i]+" (segundos)",12,false);
            line.addView(title,new LinearLayout.LayoutParams(0,dp(54),1));
            EditText input=new EditText(context);input.setSingleLine(true);input.setTextSize(14);
            input.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);
            input.setTextColor(fg());input.setGravity(Gravity.CENTER);
            input.setBackground(bg(TILE,0xFF4E5F73,6));
            int value=prefs.getInt(keys[i],defaults[i]);
            value=i==0?PgsAutoCyclePolicy.mapTimeoutSeconds(value):
                PgsAutoCyclePolicy.shinyCheckSeconds(value);
            input.setText(String.valueOf(value));fields[i]=input;
            line.addView(input,new LinearLayout.LayoutParams(dp(67),dp(41)));
            root.addView(line);
        }
        root.addView(label("Sem ícones no feed: tenta novamente a cada 3 s. "+
            "Sem botão de repetição: o ciclo já é automático.",11,false),
            margined(-1,dp(51),7));
        Button save=button("✓ Salvar tempos",13);
        root.addView(save,margined(-1,dp(42),7));
        save.setOnClickListener(v->{
            try{
                int[] values=new int[fields.length];
                for(int i=0;i<fields.length;i++){
                    values[i]=Integer.parseInt(fields[i].getText().toString().trim());
                    if(values[i]<low[i]||values[i]>high[i]){
                        Toast.makeText(context,"Mapa: 20–120 s · Shiny: 1–10 s.",
                            Toast.LENGTH_LONG).show();return;
                    }
                }
                prefs.edit().putInt(keys[0],values[0]).putInt(keys[1],values[1]).apply();
                Toast.makeText(context,"Tempos salvos para as próximas buscas.",
                    Toast.LENGTH_SHORT).show();
                hidePanel();
            }catch(NumberFormatException error){
                Toast.makeText(context,"Digite dois tempos em segundos.",Toast.LENGTH_LONG).show();
            }
        });
        mount(root);
    }
    void showNotifications(){
        LinearLayout root=panelRoot("🔔 NOTIFICAÇÕES · PGS",null);
        SharedPreferences prefs=context.getSharedPreferences("pgs_auto_settings_v1",Context.MODE_PRIVATE);
        root.addView(label("Configuração independente da Pokébola 1 e 2.",11,false),
            margined(-1,dp(25),2));
        final String[] names={"Novos Pokémon","Pokémon de Buscas","Shiny / brilhante"};
        final String[] keys={PgsAutoNotificationPolicy.NEW,
            PgsAutoNotificationPolicy.SEARCH,PgsAutoNotificationPolicy.SHINY};
        final String[] explanations={
            "Alvo novo confirmado 2 vezes no feed",
            "Alvo de busca selecionado para teleporte",
            "Aviso Shiny real do PGSharp quando suportado"
        };
        for(int i=0;i<keys.length;i++){
            final String key=keys[i];
            TextView title=label(names[i],13,true);
            root.addView(title,margined(-1,dp(27),9));
            root.addView(label(explanations[i],11,false),margined(-1,dp(24),0));
            LinearLayout controls=horizontal();
            final String[] modes={"default","strong","mute"};
            final String[] labels={"Padrão","Forte","Mudo"};
            String selected=PgsAutoNotificationPolicy.mode(key,
                prefs.getString(key,PgsAutoNotificationPolicy.defaultMode(key)));
            Button[] buttons=new Button[3];
            for(int j=0;j<3;j++){
                final String mode=modes[j];
                Button choice=button(labels[j],11);
                markChosen(choice,selected.equals(mode));
                buttons[j]=choice;
                LinearLayout.LayoutParams bp=new LinearLayout.LayoutParams(0,dp(38),1);
                if(j>0)bp.leftMargin=dp(5);
                controls.addView(choice,bp);
            }
            Button custom=button("♫ Personalizado · escolher som",11);
            markChosen(custom,"custom".equals(selected));
            for(int j=0;j<3;j++){
                final int index=j;
                buttons[j].setOnClickListener(v->{
                    prefs.edit().putString(key,modes[index]).apply();
                    for(int k=0;k<3;k++)markChosen(buttons[k],k==index);
                    markChosen(custom,false);
                });
            }
            root.addView(controls,margined(-1,dp(38),4));
            root.addView(custom,margined(-1,dp(34),4));
            custom.setOnClickListener(v->showSoundPicker(key));
            Button test=button("🔔 Testar "+names[i],11);
            root.addView(test,margined(-1,dp(34),4));
            test.setOnClickListener(v->actions.testNotification(key));
        }
        CheckBox vibrate=new CheckBox(context);
        vibrate.setText("Vibrar com notificação Shiny");
        vibrate.setTextColor(fg());
        vibrate.setChecked(prefs.getBoolean("shinyVibrate",true));
        vibrate.setOnCheckedChangeListener((view,on)->
            prefs.edit().putBoolean("shinyVibrate",on).apply());
        root.addView(vibrate,margined(-1,dp(41),7));
        root.addView(label("O teste não significa captura Shiny real. As permissões, o volume e o Não Perturbe do Android continuam valendo.",10,false),
            margined(-1,dp(48),3));
        // Painel rolável: não extrapolar a tela nos aparelhos compactos.
        ScrollView scroll=new ScrollView(context);
        scroll.setFillViewport(false);scroll.setVerticalScrollBarEnabled(false);
        scroll.addView(root);
        LinearLayout shell=vertical();
        int maxHeight=Math.max(dp(210),size().y-dp(150));
        shell.addView(scroll,new LinearLayout.LayoutParams(-1,Math.min(dp(510),maxHeight)));
        mount(shell);
    }
    private void showSoundPicker(String key){
        if(!PgsAutoNotificationPolicy.validKind(key))return;
        SharedPreferences prefs=context.getSharedPreferences("pgs_auto_settings_v1",Context.MODE_PRIVATE);
        LinearLayout root=panelRoot("♫ SOM · BUSCA POKÉMON",null);
        root.addView(label("Toque para ouvir. ✓ confirma somente o som do PGS.",11,false),
            margined(-1,dp(32),3));
        ScrollView scroll=new ScrollView(context);
        LinearLayout list=vertical();
        Button[] buttons=new Button[PokeSoundLibrary.size()];
        int saved=prefs.getInt(key+"SoundIndex",PgsAutoNotificationPolicy.SHINY.equals(key)?21:0);
        if(saved<0||saved>=buttons.length)saved=0;
        final int[] selected={saved};
        for(int i=0;i<buttons.length;i++){
            final int index=i;
            Button option=button(PokeSoundLibrary.LABELS[i],11);
            option.setGravity(Gravity.LEFT|Gravity.CENTER_VERTICAL);
            buttons[i]=option;
            markChosen(option,i==selected[0]);
            list.addView(option,margined(-1,dp(35),2));
            option.setOnClickListener(v->{
                stopTonePreview();
                selected[0]=index;
                for(int j=0;j<buttons.length;j++)
                    markChosen(buttons[j],j==index);
                try{
                    android.net.Uri uri=PokeSoundLibrary.soundUri(context,index);
                    if(uri!=null){
                        tonePreview=android.media.RingtoneManager.getRingtone(context,uri);
                        if(tonePreview!=null)tonePreview.play();
                    }
                }catch(Exception ignored){}
            });
        }
        scroll.addView(list);
        root.addView(scroll,new LinearLayout.LayoutParams(-1,dp(310)));
        Button apply=button("✓ Usar áudio",12);
        root.addView(apply,margined(-1,dp(42),6));
        apply.setOnClickListener(v->{
            stopTonePreview();
            prefs.edit().putString(key,"custom")
                .putInt(key+"SoundIndex",selected[0]).apply();
            Toast.makeText(context,"Som exclusivo do PGS salvo.",Toast.LENGTH_SHORT).show();
            showNotifications();
        });
        mount(root);
        scroll.post(()->scroll.scrollTo(0,
            Math.max(0,buttons[selected[0]].getTop()-dp(28))));
    }

}

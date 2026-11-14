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
        String[] icons={"⌕","⏱","🔔","↻","×"};
        String[] descriptions={"Buscas","Tempo","Notificações PGS","Reiniciar buscas","Fechar Busca Pokémon"};
        Runnable[] handlers={this::showSearch,this::showTime,this::showNotifications,
            ()->{dismissAll();actions.retryNow();},
            ()->{dismissAll();actions.closeOverlay();}};
        for(int i=0;i<icons.length;i++){
            final int n=i;
            Button b=button(icons[i],i==0?25:i==4?23:21);
            b.setContentDescription(descriptions[i]);
            LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(dp(44),dp(44));
            if(i>0)p.leftMargin=dp(4);
            bar.addView(b,p);
            b.setOnClickListener(v->handlers[n].run());
        }
        toolbar=bar;
        Point screen=size();
        int width=dp(5+5*44+4*4+5),h=dp(54);
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
    void showSearch(){
        List<Integer> chosen=PgsAutoCatalog.selected(context);
        LinearLayout root=panelRoot("⌕ BUSCAS","Selecionados "+chosen.size()+"/50");
        TextView countText=(TextView)((LinearLayout)root.getChildAt(0)).getChildAt(1);
        HorizontalScrollView chips=new HorizontalScrollView(context);chips.setHorizontalScrollBarEnabled(false);
        LinearLayout chipContent=horizontal();chips.addView(chipContent);
        root.addView(chips,new LinearLayout.LayoutParams(-1,dp(48)));
        EditText input=new EditText(context);input.setTextSize(15);input.setSingleLine(true);
        input.setTextColor(WHITE);input.setHintTextColor(0xFF9EA9B8);
        input.setHint("Digite nome ou nº da Pokédex");
        input.setPadding(dp(10),0,dp(9),0);input.setBackground(bg(0xC31C2330,0xFF758396,9));
        root.addView(input,margined(-1,dp(47),6));
        LinearLayout rows=vertical();
        ScrollView scroll=new ScrollView(context);scroll.setFillViewport(false);scroll.addView(rows);
        root.addView(scroll,margined(-1,dp(272),7));
        TextView note=label("Toque para selecionar. Ícones novos precisam de uma amostra do feed.",11,false);
        root.addView(note,margined(-1,dp(37),3));
        LinearLayout footer=horizontal();
        Button clear=button("Limpar",12);Button teach=button("Capturar ícone",12);
        footer.addView(clear,new LinearLayout.LayoutParams(0,dp(38),1));
        LinearLayout.LayoutParams tf=new LinearLayout.LayoutParams(0,dp(38),2f);tf.leftMargin=dp(6);
        footer.addView(teach,tf);root.addView(footer,margined(-1,dp(38),2));
        Runnable drawChips=()->{
            chipContent.removeAllViews();
            List<Integer> selected=PgsAutoCatalog.selected(context);
            if(selected.isEmpty()){chipContent.addView(label("Nenhum Pokémon selecionado",11,false));return;}
            for(Integer id:selected){
                for(PgsAutoCatalog.Pokemon p:PgsAutoCatalog.all(context))if(p.number==id){
                    Button chip=button(p.name+(PgsAutoCatalog.hasTemplate(context,id)?" ✓":" · ⚠"),10);
                    chip.setTextColor(PgsAutoCatalog.hasTemplate(context,id)?GOLD:SECONDARY);
                    LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-2,dp(32));cp.rightMargin=dp(5);
                    chipContent.addView(chip,cp);
                    chip.setOnClickListener(v->{input.setText(p.name);input.setSelection(input.length());});
                    break;
                }
            }
        };
        final Runnable[] render={null};
        render[0]=()->{
            rows.removeAllViews();drawChips.run();
            countText.setText("Selecionados "+PgsAutoCatalog.selected(context).size()+"/50");
            String query=input.getText().toString().trim();
            List<PgsAutoCatalog.Pokemon> matches=PgsAutoCatalog.search(context,query,28);
            if(matches.isEmpty()){
                rows.addView(label(query.isEmpty()?"Pesquise por Pokémon para adicionar.":"Nenhum Pokémon encontrado.",13,false));return;
            }
            for(PgsAutoCatalog.Pokemon pokemon:matches){
                LinearLayout line=horizontal();line.setPadding(dp(7),dp(2),dp(6),dp(2));
                line.setBackground(bg(TILE,0xFF4D5A6B,8));
                LinearLayout.LayoutParams rowp=new LinearLayout.LayoutParams(-1,dp(49));rowp.bottomMargin=dp(4);
                rows.addView(line,rowp);
                boolean selected=PgsAutoCatalog.isSelected(context,pokemon.number);
                android.widget.ImageView sprite=new android.widget.ImageView(context);
                try(java.io.InputStream in=VerifiedSpriteCache.bundledSprite(context,pokemon.number,false)){
                    if(in!=null)sprite.setImageBitmap(android.graphics.BitmapFactory.decodeStream(in));
                }catch(Exception ignored){}
                sprite.setContentDescription("Sprite de "+pokemon.name);
                line.addView(sprite,new LinearLayout.LayoutParams(dp(29),dp(35)));
                TextView id=label(String.format(Locale.ROOT,"#%03d",pokemon.number),11,false);
                id.setTextColor(0xFF9CA8B8);line.addView(id,new LinearLayout.LayoutParams(dp(42),dp(40)));
                TextView name=label(pokemon.name,14,true);line.addView(name,new LinearLayout.LayoutParams(0,dp(40),1));
                Button choose=button(selected?"✓":"＋",17);choose.setContentDescription(selected?"Remover "+pokemon.name:"Selecionar "+pokemon.name);
                if(selected)choose.setTextColor(GOLD);
                line.addView(choose,new LinearLayout.LayoutParams(dp(37),dp(39)));
                View.OnClickListener pick=v->{
                    if(!selected && PgsAutoCatalog.selected(context).size()>=50){
                        Toast.makeText(context,"Máximo de 50 buscas.",Toast.LENGTH_SHORT).show();return;
                    }
                    PgsAutoCatalog.toggle(context,pokemon.number);
                    render[0].run();
                    if(!selected && !PgsAutoCatalog.hasTemplate(context,pokemon.number))
                        Toast.makeText(context,"Selecionado. Cadastre a imagem pequena de "+pokemon.name+" para reconhecer no PGSharp.",Toast.LENGTH_LONG).show();
                };
                line.setOnClickListener(pick);choose.setOnClickListener(pick);
                if(selected&&!PgsAutoCatalog.hasTemplate(context,pokemon.number)){
                    Button camera=button("◎",17);camera.setContentDescription("Ensinar ícone de "+pokemon.name);
                    LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(dp(37),dp(39));cp.leftMargin=dp(4);
                    line.addView(camera,cp);
                    camera.setOnClickListener(v->{
                        PgsAutoTemplateStore.startTeaching(context,pokemon.name);
                        dismissAll();
                        Toast.makeText(context,"Abra o feed do PGSharp e segure o botão Busca Pokémon para capturar o ícone de "+pokemon.name+".",Toast.LENGTH_LONG).show();
                    });
                }
            }
        };
        input.addTextChangedListener(new TextWatcher(){
            public void beforeTextChanged(CharSequence s,int start,int count,int after){}
            public void onTextChanged(CharSequence s,int start,int before,int count){render[0].run();}
            public void afterTextChanged(Editable e){}
        });
        clear.setOnClickListener(v->{PgsAutoCatalog.clear(context);render[0].run();});
        teach.setOnClickListener(v->{
            String pending=PgsAutoTemplateStore.pending(context);
            if(pending.isEmpty()){
                Toast.makeText(context,"Selecione um Pokémon sem modelo e toque ◎ para ensinar a imagem.",Toast.LENGTH_LONG).show();return;
            }
            dismissAll();actions.teach(pending);
        });
        render[0].run();mount(root);
    }
    void showTime(){
        LinearLayout root=panelRoot("⏱ TEMPO",null);
        TextView help=label("Valores em segundos. As tentativas continuam sem pausar se o feed estiver vazio.",12,false);
        root.addView(help,margined(-1,dp(43),3));
        String[] labels={"Após mapa carregado","Limite de carregamento","Sem ícones: 1ª tentativa","Sem ícones: 2ª tentativa","Repetição depois de 120s"};
        String[] keys={"post_load","load_timeout","first_empty","second_empty","repeat_interval"};
        int[] defaults={5,60,60,120,120};
        EditText[] fields=new EditText[keys.length];
        SharedPreferences prefs=context.getSharedPreferences("pgs_buscas_auto_v1",Context.MODE_PRIVATE);
        for(int i=0;i<keys.length;i++){
            LinearLayout line=horizontal();line.setPadding(0,dp(3),0,dp(3));
            TextView title=label(labels[i],12,false);line.addView(title,new LinearLayout.LayoutParams(0,dp(43),1));
            EditText input=new EditText(context);input.setSingleLine(true);input.setTextSize(14);
            input.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);input.setTextColor(WHITE);
            input.setGravity(Gravity.CENTER);
            input.setBackground(bg(TILE,0xFF4E5F73,6));
            input.setText(String.valueOf(prefs.getInt(keys[i],defaults[i])));
            fields[i]=input;
            final String preferenceKey=keys[i];
            input.addTextChangedListener(new TextWatcher(){
                public void beforeTextChanged(CharSequence str,int start,int count,int after){}
                public void onTextChanged(CharSequence str,int start,int before,int count){
                    try{
                        int n=Integer.parseInt(str.toString().trim());
                        if(n>=1&&n<=7200)prefs.edit().putInt(preferenceKey,n).apply();
                    }catch(Exception ignored){}
                }
                public void afterTextChanged(Editable editable){}
            });
            line.addView(input,new LinearLayout.LayoutParams(dp(76),dp(39)));
            root.addView(line);
        }
        CheckBox loop=new CheckBox(context);loop.setText("Repetir buscas sem pausar");loop.setTextColor(WHITE);
        loop.setChecked(prefs.getBoolean("repeat",true));
        loop.setOnCheckedChangeListener((v,on)->prefs.edit().putBoolean("repeat",on).apply());
        root.addView(loop,margined(-1,dp(41),5));
        Button save=button("✓ Salvar tempos",13);root.addView(save,margined(-1,dp(43),7));
        save.setOnClickListener(v->{
            try{
                int[] values=new int[keys.length];
                for(int i=0;i<keys.length;i++)values[i]=Integer.parseInt(fields[i].getText().toString().trim());
                if(values[0]<3||values[0]>30||values[1]<30||values[1]>180||
                   values[2]<10||values[2]>3600||values[3]<values[2]||
                   values[3]>7200||values[4]<10||values[4]>7200){
                    Toast.makeText(context,"Informe tempos válidos (60 ≤ 120; sem valores negativos).",Toast.LENGTH_LONG).show();return;
                }
                SharedPreferences.Editor e=prefs.edit();
                for(int i=0;i<keys.length;i++)e.putInt(keys[i],values[i]);
                e.putBoolean("repeat",loop.isChecked()).apply();
                Toast.makeText(context,"Tempos salvos.",Toast.LENGTH_SHORT).show();hidePanel();
            }catch(Exception err){Toast.makeText(context,"Preencha os campos com números.",Toast.LENGTH_LONG).show();}
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
        shell.addView(scroll,new LinearLayout.LayoutParams(-1,Math.min(dp(570),maxHeight)));
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

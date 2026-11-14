package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.app.Dialog;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.widget.*;
import java.io.InputStream;
import java.util.List;

/** Home do PGS Buscas Auto; o motor experimental depende da ativação explícita. */
final class PgsBuscasPanel {
    private static final String PREFS="pgs_buscas_auto_v1";
    // Home e menu flutuante compartilham o mesmo catalogo, preferencia
    // e regra de ativacao dos modelos: nenhuma segunda fonte de estado.
    private static List<Integer> selected(Context c){
        return PgsAutoCatalog.selected(c);
    }
    private static boolean toggle(Context c,int id){
        boolean alreadySelected=PgsAutoCatalog.isSelected(c,id);
        boolean selectedNow=PgsAutoCatalog.toggle(c,id);
        return alreadySelected||selectedNow; // false somente ao atingir 50
    }
    private static int dp(Context c,int value){
        return Math.round(c.getResources().getDisplayMetrics().density*value);
    }
    private static TextView text(Context c,String value){
        TextView v=new TextView(c);v.setText(value);v.setTextColor(foreground(c));v.setTextSize(13);
        v.setGravity(Gravity.CENTER_VERTICAL);v.setPadding(dp(c,7),dp(c,6),dp(c,7),dp(c,6));return v;
    }
    private static Button button(Context c,String value){
        Button b=new Button(c);b.setAllCaps(false);b.setTextSize(11);b.setText(value);
        b.setMinHeight(0);b.setMinimumHeight(0);b.setPadding(dp(c,5),0,dp(c,5),0);
        b.setTextColor(foreground(c));GradientDrawable bg=new GradientDrawable();
        bg.setColor(0x55394A5C);bg.setCornerRadius(dp(c,6));
        bg.setStroke(dp(c,1),0x557E91A5);b.setBackground(bg);return b;
    }
    private static int foreground(Context c){
        try{org.json.JSONObject p=new org.json.JSONObject(c.getSharedPreferences("prefs",0)
            .getString("visualPrefsJson","{}"));
            return "light".equals(p.optString("menuBgMode","dark"))?
                Color.rgb(20,33,48):Color.rgb(244,247,255);
        }catch(Exception ignored){return Color.WHITE;}
    }
    static void show(Activity a){
        Dialog dialog=new Dialog(a);
        LinearLayout root=new LinearLayout(a);root.setOrientation(1);root.setPadding(dp(a,9),dp(a,9),dp(a,9),dp(a,9));
        GradientDrawable bg=new GradientDrawable();bg.setColor(OverlayQuickMenus.panelColor(a));
        bg.setCornerRadius(dp(a,10));bg.setStroke(dp(a,1),0x667E91A5);root.setBackground(bg);
        TextView heading=text(a,"🔎 BUSCAS");
        root.addView(heading);
        LinearLayout tabs=new LinearLayout(a);
        LinearLayout content=new LinearLayout(a);content.setOrientation(1);
        String[] names={"🔎 Buscas","⏱ Tempo","🔔 Alertas","••• Mais"};
        for(int i=0;i<4;i++){
            final int index=i;Button b=button(a,names[i]);
            tabs.addView(b,new LinearLayout.LayoutParams(0,dp(a,44),1));
            b.setOnClickListener(v->render(a,content,heading,index,dialog));
        }
        root.addView(tabs);root.addView(content,new LinearLayout.LayoutParams(-1,dp(a,400)));
        render(a,content,heading,0,dialog);
        dialog.setContentView(root);dialog.show();
        dialog.getWindow().setLayout(Math.min(dp(a,350),a.getResources().getDisplayMetrics().widthPixels-dp(a,18)),-2);
    }
    private static void render(Activity a,LinearLayout content,TextView heading,int tab,Dialog dialog){
        content.removeAllViews();SharedPreferences prefs=a.getSharedPreferences(PREFS,0);
        if(tab==0){
            heading.setText("🔎 BUSCAS · Selecionados "+selected(a).size()+"/50");
            EditText search=new EditText(a);search.setSingleLine(true);search.setTextColor(foreground(a));
            search.setHint("Nome ou número");search.setHintTextColor(0xFFBFC8D5);content.addView(search);
            HorizontalScrollView chips=new HorizontalScrollView(a);
            chips.setHorizontalScrollBarEnabled(false);
            LinearLayout chipRow=new LinearLayout(a);chipRow.setGravity(Gravity.CENTER_VERTICAL);
            chips.addView(chipRow);content.addView(chips,new LinearLayout.LayoutParams(-1,dp(a,38)));
            Button clear=button(a,"Limpar seleção");content.addView(clear);
            ScrollView scroll=new ScrollView(a);LinearLayout list=new LinearLayout(a);list.setOrientation(1);
            scroll.addView(list);content.addView(scroll,new LinearLayout.LayoutParams(-1,0,1));
            final Runnable[] refresh=new Runnable[1];
            refresh[0]=()->{
                list.removeAllViews();chipRow.removeAllViews();List<Integer> ids=selected(a);
                for(Integer chosenId:ids){
                    for(PgsAutoCatalog.Pokemon p:PgsAutoCatalog.all(a))if(p.number==chosenId){
                        Button chip=button(a,p.name+" ×");
                        chipRow.addView(chip);
                        chip.setOnClickListener(v->{toggle(a,p.number);refresh[0].run();});
                        break;
                    }
                }
                heading.setText("🔎 BUSCAS · Selecionados "+ids.size()+"/50");
                String q=PgsAutoCatalog.normalize(search.getText().toString());int count=0;
                for(PgsAutoCatalog.Pokemon s:PgsAutoCatalog.all(a)){
                    boolean chosen=ids.contains(s.number);
                    if(q.isEmpty()&&!chosen)continue;
                    if(!q.isEmpty()&&!PgsAutoCatalog.normalize(s.name).contains(q)&&!String.valueOf(s.number).startsWith(q))continue;
                    LinearLayout row=new LinearLayout(a);row.setGravity(Gravity.CENTER_VERTICAL);
                    ImageView sprite=new ImageView(a);
                    try(InputStream in=VerifiedSpriteCache.bundledSprite(a,s.number,false)){
                        if(in!=null){
                            android.graphics.BitmapFactory.Options opt=new android.graphics.BitmapFactory.Options();
                            opt.inSampleSize=4;
                            sprite.setImageBitmap(android.graphics.BitmapFactory.decodeStream(in,null,opt));
                        }
                    }catch(Exception ignored){}
                    sprite.setContentDescription("Sprite de "+s.name);
                    row.addView(sprite,new LinearLayout.LayoutParams(dp(a,30),dp(a,34)));
                    row.addView(text(a,(chosen?"✓ ":"")+"#"+s.number+" "+s.name),
                        new LinearLayout.LayoutParams(0,dp(a,44),1));
                    Button pick=button(a,chosen?"−":"+");row.addView(pick);
                    pick.setOnClickListener(v->{
                        if(!toggle(a,s.number))Toast.makeText(a,"Limite de 50 espécies",Toast.LENGTH_SHORT).show();
                        refresh[0].run();
                    });
                    if(chosen&&!PgsAutoCatalog.hasTemplate(a,s.number)){
                        Button teach=button(a,"◎");
                        teach.setContentDescription("Cadastrar ícone pequeno de "+s.name);
                        row.addView(teach);
                        teach.setOnClickListener(v->{
                            PgsAutoTemplateStore.startTeaching(a,s.name);
                            dialog.dismiss();
                            if(PgsAutoClickService.instance==null){
                                Toast.makeText(a,
                                    "Ative a Acessibilidade do PokeSearch para capturar o ícone de "+s.name+".",
                                    Toast.LENGTH_LONG).show();
                                a.startActivity(new android.content.Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS));
                            }else{
                                PgsAutoClickService.restoreBubble();
                                PgsAutoClickService.requestTeaching(s.name);
                                Toast.makeText(a,
                                    "Abra o feed do PGSharp. A captura de "+s.name+
                                    " abrirá automaticamente para tocar no ícone.",
                                    Toast.LENGTH_LONG).show();
                            }

                        });
                    }
                    if(chosen){
                        Button up=button(a,"↑");row.addView(up);
                        up.setOnClickListener(v->{
                            PgsAutoCatalog.move(a,s.number,-1);refresh[0].run();
                        });
                    }
                    list.addView(row);if(++count>=100)break;
                }
                if(count==0)list.addView(text(a,"Nenhum resultado"));
                list.addView(text(a,"Sem modelo visual confiável: cadastrar ícone antes da automação."));
            };
            clear.setOnClickListener(v->{PgsAutoCatalog.clear(a);refresh[0].run();});
            search.addTextChangedListener(new TextWatcher(){
                public void beforeTextChanged(CharSequence s,int st,int count,int after){}
                public void onTextChanged(CharSequence s,int st,int before,int count){refresh[0].run();}
                public void afterTextChanged(Editable e){}
            });
            refresh[0].run();
        }else if(tab==1){
            PgsAutoClickService.cyclePrefs(a);
            heading.setText("⏱ TEMPOS · BUSCAS");
            content.addView(text(a,"1. Toque no Pokémon: esperar mapa e PokéStops (até 60 s)."));
            content.addView(text(a,"2. Com mapa pronto: conferir aviso Shiny do mesmo Pokémon por 2 s."));
            content.addView(text(a,"3. Sem Shiny confirmado: próximo ícone, automaticamente."));
            final String[] keys={"load_timeout","post_load"};
            final String[] names={"Máximo para carregar o mapa","Esperar Shiny com mapa visível"};
            final int[] defaults={60,2};
            for(int i=0;i<keys.length;i++){
                final String key=keys[i];final int index=i;
                LinearLayout row=new LinearLayout(a);
                row.addView(text(a,names[i]+" (s)"),new LinearLayout.LayoutParams(0,dp(a,53),1));
                EditText input=new EditText(a);
                input.setSingleLine(true);
                input.setInputType(android.text.InputType.TYPE_CLASS_NUMBER);
                input.setTextColor(foreground(a));
                int value=prefs.getInt(key,defaults[i]);
                value=i==0?PgsAutoCyclePolicy.mapTimeoutSeconds(value):
                    PgsAutoCyclePolicy.shinyCheckSeconds(value);
                input.setText(String.valueOf(value));
                row.addView(input,new LinearLayout.LayoutParams(dp(a,60),dp(a,48)));
                input.addTextChangedListener(new TextWatcher(){
                    public void beforeTextChanged(CharSequence s,int st,int count,int after){}
                    public void onTextChanged(CharSequence s,int st,int before,int count){
                        try{
                            int n=Integer.parseInt(s.toString().trim());
                            if((index==0&&n>=20&&n<=120)||(index==1&&n>=1&&n<=10))
                                prefs.edit().putInt(key,n).apply();
                        }catch(Exception ignored){}
                    }
                    public void afterTextChanged(Editable e){}
                });
                content.addView(row);
            }
            content.addView(text(a,"Sem ícones no feed: nova leitura em 3 s. A confirmação Shiny usa notificações identificando a espécie, não o Pokémon 3D."));
        }else if(tab==2){
            heading.setText("🔔 NOTIFICAÇÕES");
            content.addView(text(a,"Novos Pokémon · Pokémon de Buscas · Shiny"));
            content.addView(text(a,"Shiny: apenas notificação Android reconhecida do PGSharp. Não existe detecção visual/3D; requer permissão de notificações."));
            Button access=button(a,"Permitir leitura de notificações");
            access.setOnClickListener(v->{
                if(android.os.Build.VERSION.SDK_INT>=33 &&
                   a.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)!=
                       android.content.pm.PackageManager.PERMISSION_GRANTED){
                    a.requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS},339);
                }
                a.startActivity(new android.content.Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS"));
                dialog.dismiss();
            });
            content.addView(access);
            Button test=button(a,"Testar alerta (sem pausar busca)");
            test.setOnClickListener(v->{
                if(PgsAutoClickService.instance==null)
                    Toast.makeText(a,"Ative o botão Busca Pokémon PGS antes de testar o alarme",Toast.LENGTH_LONG).show();
                else PgsAutoClickService.testShinyAlert();
            });
            content.addView(test);
            SharedPreferences alertPrefs=a.getSharedPreferences("pgs_auto_settings_v1",0);
            Switch vibrate=new Switch(a);vibrate.setText("Vibração Shiny");vibrate.setTextColor(foreground(a));
            vibrate.setChecked(alertPrefs.getBoolean("shinyVibrate",true));
            vibrate.setOnCheckedChangeListener((v,on)->alertPrefs.edit().putBoolean("shinyVibrate",on).apply());
            content.addView(vibrate);
        }else{
            heading.setText("••• MAIS");
            content.addView(text(a,"Ative o serviço de Acessibilidade do PokeSearch. Toques só após reconhecimento local e confirmação."));
            Button activate=button(a,"Ativar / mostrar Busca Pokémon");
            activate.setOnClickListener(v->{
                if(PgsAutoClickService.instance!=null){
                    PgsAutoClickService.restoreBubble();
                    Toast.makeText(a,"Busca Pokémon PGS exibida",Toast.LENGTH_SHORT).show();
                }else {
                    a.startActivity(new android.content.Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS));
                    Toast.makeText(a,"Ative PokeSearch · Buscas Auto em Acessibilidade",Toast.LENGTH_LONG).show();
                }
                dialog.dismiss();
            });
            content.addView(activate);
            Button report=button(a,"Reportar");
            report.setOnClickListener(v->{
                String issue=a.getSharedPreferences("pgs_auto_settings_v1",0).getString("lastError","sem erro registrado");
                android.content.Intent send=new android.content.Intent(android.content.Intent.ACTION_SEND);
                send.setType("text/plain");
                send.putExtra(android.content.Intent.EXTRA_SUBJECT,"PokeSearch · PGS Buscas Auto");
                send.putExtra(android.content.Intent.EXTRA_TEXT,
                    BugReport.export(a,"PGS Buscas · último erro: "+DiagnosticSanitizer.clean(issue)));
                a.startActivity(android.content.Intent.createChooser(send,"Revisar e compartilhar relatório"));
            });
            content.addView(report);
            Button donate=button(a,"Doar");donate.setOnClickListener(v->PixSupport.show(a));content.addView(donate);
            Button close=button(a,"Fechar");
            close.setOnClickListener(v->{PgsAutoClickService.closeHand();dialog.dismiss();});
            content.addView(close);
        }
    }
}

package com.lucianotoscano.pokesearchoverlay;

import android.app.AlertDialog;
import android.text.InputType;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import java.util.HashMap;
import java.util.Map;

/** Hidden owner entry; every action is also checked by Firebase custom claims. */
final class PremiumAdminDialog {
    private PremiumAdminDialog(){}
    static void show(MainActivity activity){
        PremiumAccess.adminOverview(activity,(overview,error)->{
            if(error!=null){
                android.widget.Toast.makeText(activity,"Acesso administrativo não autorizado.",
                    android.widget.Toast.LENGTH_SHORT).show();
                return;
            }
            LinearLayout box=new LinearLayout(activity);
            box.setOrientation(LinearLayout.VERTICAL);
            int d=(int)(12*activity.getResources().getDisplayMetrics().density);
            box.setPadding(d,d,d,d);
            TextView state=new TextView(activity);
            state.setText("Controle do servidor (sem prazos para os APKs)\n"+
                "Geral: "+(Boolean.TRUE.equals(overview.get("globalEnabled"))?"ATIVO":"BLOQUEADO")+
                " · Pix: "+(Boolean.TRUE.equals(overview.get("salesEnabled"))?"ON":"OFF"));
            box.addView(state);
            button(activity,box,"Liberar todas as versões",()->global(activity,true,state));
            button(activity,box,"Bloquear todas as versões",()->global(activity,false,state));
            TextView label=new TextView(activity);
            label.setText("Controle por versionCode (ex.: 54328):");
            box.addView(label);
            EditText version=new EditText(activity);
            version.setHint("VersionCode exato");
            version.setInputType(InputType.TYPE_CLASS_NUMBER);
            box.addView(version);
            button(activity,box,"Liberar esta versão",()->version(activity,version,true,state));
            button(activity,box,"Bloquear esta versão",()->version(activity,version,false,state));
            EditText price=new EditText(activity);
            price.setInputType(InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_FLAG_DECIMAL);
            Object cents=overview.get("priceCents");
            price.setHint("Preço em reais (ex.: 9.90)");
            if(cents instanceof Number && ((Number)cents).intValue()>0)
                price.setText(String.format(java.util.Locale.US,"%.2f",
                        ((Number)cents).doubleValue()/100));
            box.addView(price);
            button(activity,box,"Salvar preço Premium",()->{
                try{
                    java.math.BigDecimal amount=new java.math.BigDecimal(
                       price.getText().toString().trim().replace(",","."));
                    long value=amount.movePointRight(2).longValueExact();
                    if(value<100||value>100000)throw new NumberFormatException();
                    Map<String,Object> data=new HashMap<>();
                    data.put("action","price");data.put("priceCents",value);
                    PremiumAccess.adminSettings(activity,data,(r,e)->
                         state.setText(e==null?"Preço atualizado no servidor.":e));
                }catch(Exception ex){state.setText("Informe preço válido em reais.");}
            });
            button(activity,box,"Ativar vendas Pix",()->sales(activity,true,state));
            button(activity,box,"Desativar vendas Pix",()->sales(activity,false,state));
            new AlertDialog.Builder(activity).setTitle("PokeSearch · Administração")
                .setView(box).setPositiveButton("Concluir",null).show();
        });
    }
    private static void button(MainActivity activity,LinearLayout box,String title,Runnable act){
        Button b=new Button(activity);b.setText(title);b.setAllCaps(false);
        box.addView(b);b.setOnClickListener(v->act.run());
    }
    private static void global(MainActivity a,boolean allow,TextView status){
        PremiumAccess.adminDistribution(a,true,0,allow,(r,e)->
            status.setText(e==null?"Controle geral atualizado.":e));
    }
    private static void version(MainActivity a,EditText input,boolean allow,TextView status){
        try{
            int code=Integer.parseInt(input.getText().toString().trim());
            if(code<1)throw new NumberFormatException();
            PremiumAccess.adminDistribution(a,false,code,allow,(r,e)->
                status.setText(e==null?"Versão "+code+" atualizada.":e));
        }catch(NumberFormatException e){status.setText("versionCode inválido.");}
    }
    private static void sales(MainActivity a,boolean enabled,TextView status){
        Map<String,Object> data=new HashMap<>();
        data.put("action","sales");data.put("enabled",enabled);
        PremiumAccess.adminSettings(a,data,(r,e)->
            status.setText(e==null?"Vendas Pix atualizadas.":e));
    }
}

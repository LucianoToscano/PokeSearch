package com.lucianotoscano.pokesearchoverlay;

import android.app.AlertDialog;
import android.text.InputType;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import java.util.HashMap;
import java.util.Map;
import java.util.Locale;

/** Owner-only controls. Cloud Functions enforce the admin claim independently. */
final class PremiumAdminDialog {
    private PremiumAdminDialog(){}
    static void show(MainActivity activity){
        PremiumAccess.adminOverview(activity,(overview,error)->{
            if(error!=null){
                android.widget.Toast.makeText(activity,"Acesso administrativo não autorizado.",
                    android.widget.Toast.LENGTH_SHORT).show();return;
            }
            LinearLayout box=new LinearLayout(activity);
            box.setOrientation(LinearLayout.VERTICAL);
            int d=(int)(12*activity.getResources().getDisplayMetrics().density);
            box.setPadding(d,d,d,d);
            TextView state=new TextView(activity);
            state.setText("APKs sem prazo · Premium 30 dias · 10 vitalícias + 20 presentes anuais\n"+
                "Geral: "+(Boolean.TRUE.equals(overview.get("globalEnabled"))?"ATIVO":"BLOQUEADO")+
                " · Pix: "+(Boolean.TRUE.equals(overview.get("salesEnabled"))?"ON":"OFF"));
            box.addView(state);
            button(activity,box,"Liberar todas as versões",()->global(activity,true,state));
            button(activity,box,"Bloquear todas as versões",()->global(activity,false,state));

            label(activity,box,"Bloqueio individual por versionCode");
            EditText version=input(activity,box,"VersionCode exato",true);
            button(activity,box,"Liberar esta versão",()->version(activity,version,true,state));
            button(activity,box,"Bloquear esta versão",()->version(activity,version,false,state));

            label(activity,box,"Preços por 30 dias (Pix)");
            EditText regular=input(activity,box,"Preço normal (R$)",false);
            regular.setText(reais(overview.get("regularPriceCents"),10));
            EditText promotion=input(activity,box,"Preço promocional (R$)",false);
            promotion.setText(reais(overview.get("promotionalPriceCents"),5));
            button(activity,box,"Salvar preço normal",()->
                setPrice(activity,regular,"regularPrice",state));
            button(activity,box,"Salvar preço promocional",()->
                setPrice(activity,promotion,"promotionalPrice",state));
            button(activity,box,"Ativar promoção (R$ 5,00 inicialmente)",()->
                switchValue(activity,"promotion",true,state));
            button(activity,box,"Desativar promoção (voltar ao normal)",()->
                switchValue(activity,"promotion",false,state));
            label(activity,box,Boolean.TRUE.equals(overview.get("promotionEnabled"))?
                "Promoção: ATIVA":"Promoção: DESATIVADA");
            button(activity,box,"Ativar recebimentos Pix",()->
                switchValue(activity,"sales",true,state));
            button(activity,box,"Desativar recebimentos Pix",()->
                switchValue(activity,"sales",false,state));

            label(activity,box,"Presentes especiais — somente 10 vitalícias");
            button(activity,box,"Gerar/ver as 10 chaves vitalícias",()->
                PremiumAccess.lifetimePool(activity,(result,e)->{
                    if(e!=null)state.setText(e);
                    else PremiumKeyListDialog.show(activity,
                        "10 licenças vitalícias — duas chaves de 12 meses por amigo",result);
                }));

            label(activity,box,"Aumentar duração de uma licença temporária");
            EditText uid=input(activity,box,"UID Firebase do beneficiário",false);
            uid.setInputType(InputType.TYPE_CLASS_TEXT);
            EditText extra=input(activity,box,"Dias adicionais (ex.: 30, 365)",true);
            button(activity,box,"Acrescentar dias",()->{
                try{
                    int days=Integer.parseInt(extra.getText().toString().trim());
                    PremiumAccess.adjustExpiry(activity,uid.getText().toString().trim(),days,
                        (result,e)->statusExpiry(state,result,e));
                }catch(NumberFormatException ex){state.setText("Informe número válido de dias.");}
            });
            EditText endDate=input(activity,box,"Nova data UTC (AAAA-MM-DD)",false);
            button(activity,box,"Definir vencimento maior",()->{
                try{
                    java.time.LocalDate day=java.time.LocalDate.parse(
                        endDate.getText().toString().trim());
                    long ms=day.plusDays(1).atStartOfDay(java.time.ZoneOffset.UTC)
                        .toInstant().toEpochMilli()-1L;
                    PremiumAccess.setExpiry(activity,uid.getText().toString().trim(),ms,
                        (result,e)->statusExpiry(state,result,e));
                }catch(java.time.format.DateTimeParseException ex){
                    state.setText("Data inválida. Use AAAA-MM-DD (UTC).");
                }
            });
            label(activity,box,"Vitalícias não vencem. Datas não podem ser reduzidas. "+
                "Chaves-presente duram 12 meses contados da ativação.");

            ScrollView scroller=new ScrollView(activity);
            scroller.addView(box);
            new AlertDialog.Builder(activity).setTitle("PokeSearch · Administração")
                .setView(scroller).setPositiveButton("Concluir",null).show();
        });
    }
    private static void label(MainActivity activity,LinearLayout box,String title){
        TextView txt=new TextView(activity);
        txt.setText(title);txt.setTextSize(13);
        box.addView(txt);
    }
    private static EditText input(MainActivity activity,LinearLayout box,String hint,boolean integer){
        EditText edit=new EditText(activity);edit.setHint(hint);edit.setSingleLine(true);
        edit.setInputType(integer?InputType.TYPE_CLASS_NUMBER:
            InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_FLAG_DECIMAL);
        box.addView(edit);return edit;
    }
    private static String reais(Object cents,int fallback){
        double n=cents instanceof Number?((Number)cents).doubleValue()/100:fallback;
        return String.format(Locale.US,"%.2f",n);
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
    private static void switchValue(MainActivity a,String action,boolean enabled,TextView status){
        Map<String,Object> data=new HashMap<>();
        data.put("action",action);data.put("enabled",enabled);
        PremiumAccess.adminSettings(a,data,(r,e)->
            status.setText(e==null?
                ("promotion".equals(action)?"Promoção ":"Vendas ")+
                (enabled?"ativadas.":"desativadas."):e));
    }
    private static void setPrice(MainActivity a,EditText input,String action,TextView status){
        try{
            java.math.BigDecimal amount=new java.math.BigDecimal(
                input.getText().toString().trim().replace(",","."));
            long value=amount.movePointRight(2).longValueExact();
            if(value<100||value>100000)throw new NumberFormatException();
            Map<String,Object> data=new HashMap<>();
            data.put("action",action);data.put("priceCents",value);
            PremiumAccess.adminSettings(a,data,(r,e)->
                status.setText(e==null?"Preço atualizado no servidor.":e));
        }catch(Exception e){status.setText("Informe preço válido em reais.");}
    }
    private static void statusExpiry(TextView status,Map<String,Object> result,String error){
        if(error!=null){status.setText(error);return;}
        Object expiry=result.get("expiresAt");
        status.setText("Licença ampliada. Novo vencimento UTC (ms): "+expiry);
    }
}

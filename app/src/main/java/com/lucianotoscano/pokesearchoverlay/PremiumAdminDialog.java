package com.lucianotoscano.pokesearchoverlay;

import android.app.AlertDialog;
import android.text.InputType;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Spinner;
import android.widget.ArrayAdapter;
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
            state.setText("APKs sem prazo · Premium Pix 30 dias · Licenças livres\n"+
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

            label(activity,box,"Gerar chave individual (presente ou uso próprio)");
            label(activity,box,"Você escolhe a validade de CADA chave, sem limite de quantidade.");
            Spinner duration=new Spinner(activity);
            final String[] labels={"15 dias","1 mês","3 meses","6 meses","12 meses","Vitalícia"};
            final String[] durationIds={"15d","1m","3m","6m","12m","lifetime"};
            ArrayAdapter<String> adapter=new ArrayAdapter<>(activity,
                android.R.layout.simple_spinner_item,labels);
            adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
            duration.setAdapter(adapter);
            box.addView(duration);
            EditText beneficiary=input(activity,box,
                "UID Firebase (opcional; vazio = chave para presente)",false);
            beneficiary.setInputType(InputType.TYPE_CLASS_TEXT);
            button(activity,box,"Gerar licença selecionada",()->{
                String selected=durationIds[duration.getSelectedItemPosition()];
                String target=beneficiary.getText().toString().trim();
                // When a UID is entered, grant immediately; otherwise the key activates on first use.
                PremiumAccess.issueLicense(activity,selected,target,false,(issued,error)->{
                    if(error!=null){state.setText(error);return;}
                    showIssuedKey(activity,issued);
                    state.setText("Licença "+labels[duration.getSelectedItemPosition()]+
                        " gerada com sucesso.");
                });
            });
            button(activity,box,"Estender licença desta conta pelo período escolhido",()->{
                String selected=durationIds[duration.getSelectedItemPosition()];
                String target=beneficiary.getText().toString().trim();
                if(target.isEmpty()){state.setText("Informe o UID para estender a licença.");return;}
                PremiumAccess.issueLicense(activity,selected,target,true,(issued,error)->{
                    if(error!=null){state.setText(error);return;}
                    showIssuedKey(activity,issued);
                    state.setText("Prazo ajustado conforme a opção escolhida.");
                });
            });

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
            label(activity,box,"A licença vitalícia não tem vencimento. "+
                "Chaves-presente começam a contar na ativação.");

            ScrollView scroller=new ScrollView(activity);
            scroller.addView(box);
            new AlertDialog.Builder(activity).setTitle("PokeSearch · Administração")
                .setView(scroller).setPositiveButton("Concluir",null).show();
        });
    }
    private static void showIssuedKey(MainActivity activity,Map<String,Object> info){
        Object code=info.get("licenseKey");
        if(!(code instanceof String))return;
        String duration=String.valueOf(info.get("duration"));
        boolean assigned=Boolean.TRUE.equals(info.get("assigned"));
        String details="Duração: "+duration+"\n"+
            (assigned?"Licença já vinculada ao UID informado.":"Ainda não ativada. "+
              "O prazo começa quando o destinatário usar a chave.")+
            "\n\nGuarde este código. Ele será mostrado somente agora.";
        TextView detailsText=new TextView(activity);
        int d=(int)(14*activity.getResources().getDisplayMetrics().density);
        detailsText.setPadding(d,d,d,d);
        detailsText.setText(details+"\n\n"+code);
        detailsText.setTextIsSelectable(true);
        new AlertDialog.Builder(activity).setTitle("Licença Premium gerada")
            .setView(detailsText)
            .setPositiveButton("Copiar chave",(dialog,which)->{
                android.content.ClipboardManager clip=
                    (android.content.ClipboardManager)activity.getSystemService(
                         android.content.Context.CLIPBOARD_SERVICE);
                if(clip!=null)clip.setPrimaryClip(android.content.ClipData.newPlainText(
                    "Chave Premium",String.valueOf(code)));
            })
            .setNegativeButton("Fechar",null).show();
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

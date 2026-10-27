package com.lucianotoscano.pokesearchoverlay;

import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.text.InputType;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import java.util.Map;
import java.util.Locale;

/** Compact Pix checkout. It never captures card credentials or stores CPF locally. */
final class PremiumPurchaseDialog {
    private PremiumPurchaseDialog(){}
    static void show(MainActivity activity,Runnable whenActivated){
        LinearLayout col=new LinearLayout(activity);
        col.setOrientation(LinearLayout.VERTICAL);
        int p=(int)(activity.getResources().getDisplayMetrics().density*14);
        col.setPadding(p,p,p,p);
        TextView description=new TextView(activity);
        description.setText("LT134 · Teste do login Google Premium. As duas Pokébolas continuam como na LT133; cobranças e bloqueios não estão ativados.");
        col.addView(description);
        TextView googleAccount=new TextView(activity);
        googleAccount.setTextSize(13);
        googleAccount.setPadding(0,p/2,0,p/2);
        col.addView(googleAccount);
        Button googleLogin=new Button(activity);
        googleLogin.setText("Entrar com Google para Premium");
        googleLogin.setAllCaps(false);
        col.addView(googleLogin);
        Button googleLogout=new Button(activity);
        googleLogout.setText("Sair da conta Premium");
        googleLogout.setAllCaps(false);
        col.addView(googleLogout);
        TextView pricePreview=new TextView(activity);
        pricePreview.setText("Consultando preço no servidor...");
        pricePreview.setTextSize(16);
        col.addView(pricePreview);
        EditText email=new EditText(activity);
        email.setHint("Seu e-mail para o Pix");
        email.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS);
        email.setSingleLine(true);
        col.addView(email);
        EditText restore=new EditText(activity);
        restore.setHint("Já tenho chave Premium (PS-...)");
        restore.setSingleLine(true);
        col.addView(restore);
        Button activate=new Button(activity);
        activate.setText("Ativar minha chave");activate.setAllCaps(false);
        col.addView(activate);
        TextView note=new TextView(activity);
        note.setText("O Pix usa apenas e-mail na API de Orders. A licença Premium "+
                     "fica vinculada à sua conta Google no Firebase, inclusive após reinstalar.");
        note.setTextSize(11);
        col.addView(note);
        Button create=new Button(activity);
        create.setAllCaps(false);create.setText("Gerar Pix");
        create.setEnabled(false);
        col.addView(create);
        TextView status=new TextView(activity);
        status.setText("Nenhum pagamento iniciado.");
        status.setPadding(0,p/2,0,p/2);
        col.addView(status);
        Button copyPix=new Button(activity);
        copyPix.setText("Copiar Pix");copyPix.setAllCaps(false);copyPix.setVisibility(View.GONE);
        col.addView(copyPix);
        Button check=new Button(activity);
        check.setText("Verificar pagamento");check.setAllCaps(false);check.setVisibility(View.GONE);
        col.addView(check);
        Button keyCopy=new Button(activity);
        keyCopy.setText("Copiar chave Premium");keyCopy.setAllCaps(false);
        keyCopy.setVisibility(View.GONE);
        col.addView(keyCopy);
        ScrollView scroller=new ScrollView(activity);scroller.addView(col);
        AlertDialog dialog=new AlertDialog.Builder(activity).setTitle("Pokébola 2 · Premium")
                .setView(scroller).setNegativeButton("Fechar",null).create();
        // This local order ID is only a bookmark; the SERVER still verifies ownership.
        android.content.SharedPreferences pending=activity.getSharedPreferences("premium_order_reference",0);
        final String identityUid=PremiumGoogleLogin.uid(activity);
        // A pending payment belongs only to the Firebase UID that created it.
        final String pendingId=identityUid.isEmpty()||
                !identityUid.equals(pending.getString("latestOrderUid",""))?""
                :pending.getString("latestOrderId","");
        final String[] activeOrder={pendingId},pix={""},key={""};
        final Handler handler=new Handler(Looper.getMainLooper());
        final boolean[] polling={false};
        final Runnable[] scheduled={null};
        Runnable stop=()->{
            polling[0]=false;
            if(scheduled[0]!=null)handler.removeCallbacks(scheduled[0]);
        };
        final boolean[] canSell={false};
        Runnable refreshIdentity=()->{
            boolean signed=PremiumGoogleLogin.isGoogleSignedIn(activity);
            String account=PremiumGoogleLogin.email(activity);
            googleAccount.setText(signed?"Premium conectado: "+account:
                    "Entre com Google para ativar ou recuperar sua licença Premium.");
            googleLogin.setVisibility(signed?View.GONE:View.VISIBLE);
            googleLogout.setVisibility(signed?View.VISIBLE:View.GONE);
            activate.setEnabled(signed);
            create.setEnabled(signed&&canSell[0]);
        };
        refreshIdentity.run();
        googleLogin.setOnClickListener(v->{
            googleLogin.setEnabled(false);
            PremiumGoogleLogin.signIn(activity,(ok,message)->{
                googleLogin.setEnabled(true);
                if(!dialog.isShowing())return;
                status.setText(message);
                if(ok){
                    // Do not adopt a pending order from an anonymous/previous account.
                    activeOrder[0]="";
                    stop.run();
                    email.setText(PremiumGoogleLogin.email(activity));
                    PremiumAccess.verify(activity,(allowed,premium)->{
                        if(dialog.isShowing()&&PremiumAccess.controlled()&&premium){
                            dialog.dismiss();
                            if(whenActivated!=null)whenActivated.run();
                        }
                    });
                }
                refreshIdentity.run();
            });
        });
        googleLogout.setOnClickListener(v->PremiumGoogleLogin.signOut(activity,()->{
            if(!dialog.isShowing())return;
            activeOrder[0]="";
            stop.run();
            status.setText("Conta Premium desconectada. Sua licença permanece no Firebase.");
            refreshIdentity.run();
        }));
        Runnable[] poll={null};
        poll[0]=()->{
            if(!dialog.isShowing()||activeOrder[0].isEmpty()){stop.run();return;}
            PremiumAccess.order(activity,activeOrder[0],(result,error)->{
                if(!dialog.isShowing())return;
                if(error!=null){status.setText(error);return;}
                String state=String.valueOf(result.get("status"));
                if("approved".equals(state)){
                    stop.run();status.setText("Pagamento aprovado e registrado. LT134 permanece em homologação.");
                    key[0]=String.valueOf(result.get("licenseKey"));
                    if(!key[0].isEmpty()&&!"null".equals(key[0]))keyCopy.setVisibility(View.VISIBLE);
                    copyPix.setVisibility(View.GONE);check.setVisibility(View.GONE);
                    PremiumAccess.verify(activity,(allowed,premium)->{
                        if(dialog.isShowing()&&PremiumAccess.controlled()&&premium&&whenActivated!=null)whenActivated.run();
                    });
                }else if("pending".equals(state)){
                    status.setText("Aguardando confirmação do Pix. A verificação é automática.");
                }else status.setText("Situação do pedido: "+state);
            });
            if(polling[0]){
                scheduled[0]=poll[0];handler.postDelayed(scheduled[0],12000L);
            }
        };
        activate.setOnClickListener(v->{
            String input=restore.getText().toString().trim();
            if(!input.matches("(?i)^PS-([0-9A-F]{6}-){3}[0-9A-F]{6}$")){
                status.setText("Confira o formato da chave Premium.");return;
            }
            activate.setEnabled(false);
            PremiumAccess.redeem(activity,input,(result,error)->{
                if(!dialog.isShowing())return;
                activate.setEnabled(true);
                if(error!=null){status.setText(error);return;}
                status.setText("Chave ativada no Firebase para sua conta Google. LT134 mantém as duas Pokébolas sem bloqueio.");
                PremiumAccess.verify(activity,(allowed,premium)->{
                    if(dialog.isShowing()&&PremiumAccess.controlled()&&premium&&whenActivated!=null)whenActivated.run();
                });
            });
        });
        create.setOnClickListener(v->{
            String mail=email.getText().toString().trim();
            if(!mail.contains("@")||!mail.contains(".")){
                status.setText("Informe um e-mail válido.");return;
            }
            create.setEnabled(false);
            status.setText("Gerando o Pix no Mercado Pago...");
            PremiumAccess.createPix(activity,mail,"",(result,error)->{
                if(!dialog.isShowing())return;
                create.setEnabled(true);
                if(error!=null){status.setText(error);return;}
                activeOrder[0]=String.valueOf(result.get("orderId"));
                pending.edit().putString("latestOrderId",activeOrder[0])
                        .putString("latestOrderUid",PremiumGoogleLogin.uid(activity)).apply();
                pix[0]=String.valueOf(result.get("pixCode"));
                Object cents=result.get("priceCents");
                long amount=cents instanceof Number?((Number)cents).longValue():0;
                status.setText(String.format(Locale.forLanguageTag("pt-BR"),
                  "Pix gerado: R$ %.2f. Copie o código e pague no aplicativo do banco.",
                  amount/100.0));
                copyPix.setVisibility(View.VISIBLE);check.setVisibility(View.VISIBLE);
                stop.run();polling[0]=true;
                scheduled[0]=poll[0];handler.postDelayed(scheduled[0],12000L);
            });
        });
        copyPix.setOnClickListener(v->copy(activity,"Pix copia e cola",pix[0]));
        keyCopy.setOnClickListener(v->copy(activity,"Chave Premium",key[0]));
        check.setOnClickListener(v->poll[0].run());
        dialog.setOnDismissListener(v->stop.run());
        dialog.show();
        PremiumAccess.offer(activity,(result,error)->{
            if(!dialog.isShowing())return;
            if(error!=null){
                pricePreview.setText("Não foi possível consultar o preço.");
                create.setEnabled(false);return;
            }
            Object current=result.get("priceCents");
            long cents=current instanceof Number?((Number)current).longValue():0L;
            Object regular=result.get("regularPriceCents");
            long usual=regular instanceof Number?((Number)regular).longValue():0L;
            boolean promo=Boolean.TRUE.equals(result.get("promotionEnabled"));
            String label=String.format(Locale.forLanguageTag("pt-BR"),
                "Premium 30 dias: R$ %.2f",cents/100.0);
            if(promo&&usual>cents)label+=String.format(Locale.forLanguageTag("pt-BR"),
                " (promoção, antes R$ %.2f)",usual/100.0);
            boolean enabled=Boolean.TRUE.equals(result.get("salesEnabled"))&&cents>=100;
            pricePreview.setText(enabled?label:label+" · Pagamentos indisponíveis");
            canSell[0]=enabled;
            refreshIdentity.run();
        });
        if(!activeOrder[0].isEmpty()){
            polling[0]=true;
            scheduled[0]=poll[0];
            handler.postDelayed(scheduled[0],1000L);
        }
    }
    private static void copy(Context ctx,String label,String data){
        if(data==null||data.isEmpty())return;
        ClipboardManager clipboard=(ClipboardManager)ctx.getSystemService(Context.CLIPBOARD_SERVICE);
        if(clipboard!=null)clipboard.setPrimaryClip(ClipData.newPlainText(label,data));
    }
}

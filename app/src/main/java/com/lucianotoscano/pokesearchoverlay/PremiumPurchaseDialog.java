package com.lucianotoscano.pokesearchoverlay;

import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.res.ColorStateList;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.text.TextUtils;
import android.view.WindowManager;
import android.widget.ImageView;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.common.BitMatrix;
import java.util.EnumMap;
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
        final int surface=0xFF101D2E, elevated=0xFF192C43, text=0xFFF3F8FF;
        final int subtext=0xFFAABED7, blue=0xFF4F9DFF, teal=0xFF45D4C5;
        final int p=dp(activity,16);
        LinearLayout col=new LinearLayout(activity);
        col.setOrientation(LinearLayout.VERTICAL);
        col.setPadding(p,p,p,dp(activity,12));
        col.setBackground(round(activity,surface,24,0xFF38516E));

        LinearLayout header=new LinearLayout(activity);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(android.view.Gravity.CENTER_VERTICAL);
        android.widget.ImageView emblem=new android.widget.ImageView(activity);
        emblem.setImageResource(R.drawable.pokesearch_icon);
        emblem.setScaleType(android.widget.ImageView.ScaleType.FIT_CENTER);
        LinearLayout.LayoutParams emblemLp=new LinearLayout.LayoutParams(dp(activity,38),dp(activity,38));
        emblemLp.rightMargin=dp(activity,10);
        header.addView(emblem,emblemLp);
        LinearLayout headCopy=new LinearLayout(activity);
        headCopy.setOrientation(LinearLayout.VERTICAL);
        TextView heading=label(activity,"Pokébola 2 · Premium",20,text,true);
        headCopy.addView(heading);
        headCopy.addView(label(activity,"Pokébola 1 sempre gratuita",12,subtext,false));
        header.addView(headCopy,new LinearLayout.LayoutParams(0,-2,1));
        TextView close=label(activity,"✕",18,subtext,false);
        close.setGravity(android.view.Gravity.CENTER);
        close.setContentDescription("Fechar janela Premium");
        close.setBackground(round(activity,elevated,25,0xFF3B516A));
        header.addView(close,new LinearLayout.LayoutParams(dp(activity,36),dp(activity,36)));
        col.addView(header,space(activity,0,0,0,dp(activity,14)));

        LinearLayout identity=new LinearLayout(activity);
        identity.setPadding(dp(activity,12),dp(activity,8),dp(activity,8),dp(activity,8));
        identity.setGravity(android.view.Gravity.CENTER_VERTICAL);
        identity.setBackground(round(activity,elevated,15,0xFF344E69));
        LinearLayout identityText=new LinearLayout(activity);
        identityText.setOrientation(LinearLayout.VERTICAL);
        identityText.addView(label(activity,"CONTA GOOGLE",10,subtext,true));
        TextView googleAccount=label(activity,"Verificando login...",12,text,false);
        googleAccount.setSingleLine(true);
        googleAccount.setEllipsize(android.text.TextUtils.TruncateAt.END);
        identityText.addView(googleAccount);
        identity.addView(identityText,new LinearLayout.LayoutParams(0,-2,1));
        Button googleLogin=button(activity,"Entrar",false,blue);
        identity.addView(googleLogin,new LinearLayout.LayoutParams(-2,dp(activity,39)));
        Button googleLogout=button(activity,"Trocar",false,0xFF253F5C);
        identity.addView(googleLogout,new LinearLayout.LayoutParams(-2,dp(activity,39)));
        col.addView(identity,space(activity,0,0,0,dp(activity,13)));

        LinearLayout plan=new LinearLayout(activity);
        plan.setOrientation(LinearLayout.VERTICAL);
        plan.setPadding(dp(activity,13),dp(activity,12),dp(activity,13),dp(activity,12));
        plan.setBackground(round(activity,0xFF162C45,16,0xFF438EDE));
        LinearLayout planTop=new LinearLayout(activity);
        planTop.setOrientation(LinearLayout.HORIZONTAL);
        planTop.setGravity(android.view.Gravity.CENTER_VERTICAL);
        TextView planTitle=label(activity,"30 dias de Premium",17,text,true);
        planTop.addView(planTitle,new LinearLayout.LayoutParams(0,-2,1));
        TextView promo=label(activity,"PROMOÇÃO",10,0xFF0C2537,true);
        promo.setPadding(dp(activity,9),dp(activity,5),dp(activity,9),dp(activity,5));
        promo.setBackground(round(activity,teal,20,teal));
        planTop.addView(promo);
        plan.addView(planTop);
        TextView pricePreview=label(activity,"Consultando preço...",19,0xFF83C5FF,true);
        plan.addView(pricePreview,space(activity,0,dp(activity,5),0,0));
        plan.addView(label(activity,"Outras durações: ativação por chave Premium",11,subtext,false),
            space(activity,0,dp(activity,3),0,0));
        col.addView(plan,space(activity,0,0,0,dp(activity,13)));

        TextView mailLabel=label(activity,"E-mail para o Pix",11,subtext,true);
        col.addView(mailLabel,space(activity,0,0,0,dp(activity,4)));
        EditText email=input(activity,"Seu e-mail");
        email.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS);
        col.addView(email,space(activity,0,0,0,dp(activity,10)));

        Button create=button(activity,"◇  Gerar Pix",true,0xFF2378E9);
        col.addView(create,new LinearLayout.LayoutParams(-1,dp(activity,47)));
        create.setEnabled(false);
        TextView status=label(activity,"Aguardando geração do Pix",12,subtext,false);
        status.setGravity(android.view.Gravity.CENTER_VERTICAL);
        status.setMinHeight(dp(activity,30));
        col.addView(status,space(activity,0,dp(activity,4),0,0));

        LinearLayout pixPanel=new LinearLayout(activity);
        pixPanel.setOrientation(LinearLayout.VERTICAL);
        pixPanel.setPadding(dp(activity,10),dp(activity,10),dp(activity,10),dp(activity,9));
        pixPanel.setBackground(round(activity,0xFF1B3149,15,0xFF3C5A75));
        pixPanel.setVisibility(View.GONE);
        LinearLayout pixHeader=new LinearLayout(activity);
        pixHeader.setGravity(android.view.Gravity.CENTER_VERTICAL);
        pixHeader.addView(label(activity,"Pix copia e cola",13,text,true),
            new LinearLayout.LayoutParams(0,-2,1));
        TextView pixAmount=label(activity,"",15,teal,true);
        pixHeader.addView(pixAmount);
        pixPanel.addView(pixHeader);
        android.widget.ImageView qrImage=new android.widget.ImageView(activity);
        qrImage.setScaleType(android.widget.ImageView.ScaleType.FIT_CENTER);
        qrImage.setBackground(round(activity,0xFFFFFFFF,12,0xFFFFFFFF));
        qrImage.setPadding(dp(activity,7),dp(activity,7),dp(activity,7),dp(activity,7));
        LinearLayout.LayoutParams qrLp=new LinearLayout.LayoutParams(dp(activity,156),dp(activity,156));
        qrLp.gravity=android.view.Gravity.CENTER_HORIZONTAL;
        qrLp.topMargin=dp(activity,8);
        qrLp.bottomMargin=dp(activity,8);
        pixPanel.addView(qrImage,qrLp);
        LinearLayout actions=new LinearLayout(activity);
        actions.setGravity(android.view.Gravity.CENTER_VERTICAL);
        Button copyPix=button(activity,"Copiar Pix",false,0xFF28466B);
        actions.addView(copyPix,new LinearLayout.LayoutParams(0,dp(activity,43),1));
        Button check=button(activity,"Verificar",false,0xFF28466B);
        LinearLayout.LayoutParams checkLp=new LinearLayout.LayoutParams(0,dp(activity,43),1);
        checkLp.leftMargin=dp(activity,8);
        actions.addView(check,checkLp);
        pixPanel.addView(actions);
        copyPix.setVisibility(View.GONE);check.setVisibility(View.GONE);
        col.addView(pixPanel,space(activity,0,dp(activity,5),0,dp(activity,7)));

        TextView keyToggle=label(activity,"Tenho uma chave Premium  ›",13,0xFF8FC6FF,true);
        keyToggle.setGravity(android.view.Gravity.CENTER_VERTICAL);
        keyToggle.setMinHeight(dp(activity,40));
        col.addView(keyToggle);
        LinearLayout redeemArea=new LinearLayout(activity);
        redeemArea.setOrientation(LinearLayout.VERTICAL);
        redeemArea.setVisibility(View.GONE);
        EditText restore=input(activity,"PS-XXXXXX-XXXXXX-XXXXXX-XXXXXX");
        restore.setSingleLine(true);
        redeemArea.addView(restore,space(activity,0,0,0,dp(activity,8)));
        Button activate=button(activity,"Ativar minha chave",false,0xFF28466B);
        redeemArea.addView(activate,new LinearLayout.LayoutParams(-1,dp(activity,44)));
        col.addView(redeemArea,space(activity,0,0,0,dp(activity,5)));
        keyToggle.setOnClickListener(v->{
            boolean show=redeemArea.getVisibility()!=View.VISIBLE;
            redeemArea.setVisibility(show?View.VISIBLE:View.GONE);
            keyToggle.setText(show?"Ocultar chave Premium  ⌄":"Tenho uma chave Premium  ›");
        });
        Button keyCopy=button(activity,"Copiar chave ativada",false,0xFF28466B);
        keyCopy.setVisibility(View.GONE);
        col.addView(keyCopy,space(activity,0,dp(activity,5),0,0));
        TextView note=label(activity,
            "Pagamento seguro via Mercado Pago · licença vinculada à sua conta Google.",
            10,subtext,false);
        note.setGravity(android.view.Gravity.CENTER);
        col.addView(note,space(activity,0,dp(activity,9),0,0));

        ScrollView scroller=new ScrollView(activity);
        scroller.setFillViewport(false);
        scroller.setVerticalScrollBarEnabled(false);
        scroller.setClipToPadding(false);
        scroller.addView(col);
        AlertDialog dialog=new AlertDialog.Builder(activity).setView(scroller).create();
        close.setOnClickListener(v->dialog.dismiss());
        // Keep the popup compact, with scrolling only if the device cannot fit it.
        final int maxHeight=(int)(activity.getResources().getDisplayMetrics().heightPixels*0.78f);
        Runnable fitPopup=()->{
            if(!dialog.isShowing())return;
            col.post(()->{
                if(!dialog.isShowing())return;
                int natural=col.getHeight();
                int current=scroller.getLayoutParams().height;
                if(natural>0&&(natural>maxHeight||current>natural)){
                    android.view.ViewGroup.LayoutParams layout=scroller.getLayoutParams();
                    layout.height=Math.min(natural,maxHeight);
                    scroller.setLayoutParams(layout);
                }
            });
        };
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
            googleAccount.setText(signed?account:"Entre para continuar");
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
                        if(dialog.isShowing()&&premium){
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
            status.setText("Conta desconectada. Sua licença continua salva no Firebase.");
            pixPanel.setVisibility(View.GONE);
            qrImage.setImageDrawable(null);
            fitPopup.run();
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
                    stop.run();status.setText("Pagamento aprovado! Segunda Pokébola liberada por 30 dias.");
                    key[0]=String.valueOf(result.get("licenseKey"));
                    if(!key[0].isEmpty()&&!"null".equals(key[0]))keyCopy.setVisibility(View.VISIBLE);
                    copyPix.setVisibility(View.GONE);check.setVisibility(View.GONE);
                    pixPanel.setVisibility(View.GONE);
                    fitPopup.run();
                    PremiumAccess.verify(activity,(allowed,premium)->{
                        if(dialog.isShowing()&&premium&&whenActivated!=null)whenActivated.run();
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
                status.setText("Chave ativada! Segunda Pokébola liberada.");
                PremiumAccess.verify(activity,(allowed,premium)->{
                    if(dialog.isShowing()&&premium&&whenActivated!=null)whenActivated.run();
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
                Bitmap qr=makePixQr(pix[0]);
                qrImage.setImageBitmap(qr);
                qrImage.setVisibility(qr==null?View.GONE:View.VISIBLE);
                pixPanel.setVisibility(View.VISIBLE);
                pixAmount.setText(String.format(Locale.forLanguageTag("pt-BR"),
                    "R$ %.2f",amount/100.0));
                status.setText(qr==null?
                    "Pix gerado. Use o botão Copiar Pix para pagar.":
                    "Pix gerado • Escaneie ou copie o código.");
                copyPix.setVisibility(View.VISIBLE);check.setVisibility(View.VISIBLE);
                fitPopup.run();
                stop.run();polling[0]=true;
                scheduled[0]=poll[0];handler.postDelayed(scheduled[0],12000L);
            });
        });
        copyPix.setOnClickListener(v->copy(activity,"Pix copia e cola",pix[0]));
        keyCopy.setOnClickListener(v->copy(activity,"Chave Premium",key[0]));
        check.setOnClickListener(v->poll[0].run());
        dialog.setOnDismissListener(v->stop.run());
        dialog.show();
        if(dialog.getWindow()!=null){
            dialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
            dialog.getWindow().setDimAmount(0.60f);
            dialog.getWindow().addFlags(WindowManager.LayoutParams.FLAG_DIM_BEHIND);
            dialog.getWindow().setLayout(
                (int)(activity.getResources().getDisplayMetrics().widthPixels*0.93f),
                WindowManager.LayoutParams.WRAP_CONTENT);
        }
        fitPopup.run();
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
            status.setText("Pagamento anterior encontrado. Verificando confirmação.");
            polling[0]=true;
            scheduled[0]=poll[0];
            handler.postDelayed(scheduled[0],1000L);
        }
    }
    private static int dp(Context context,float value){
        return Math.round(context.getResources().getDisplayMetrics().density*value);
    }
    private static GradientDrawable round(Context context,int color,int radius,int outline){
        GradientDrawable drawable=new GradientDrawable();
        drawable.setColor(color);
        drawable.setCornerRadius(dp(context,radius));
        drawable.setStroke(dp(context,1),outline);
        return drawable;
    }
    private static LinearLayout.LayoutParams space(Context context,int left,int top,int right,int bottom){
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);
        p.setMargins(dp(context,left),dp(context,top),dp(context,right),dp(context,bottom));
        return p;
    }
    private static TextView label(Context context,String value,int size,int color,boolean bold){
        TextView view=new TextView(context);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(color);
        if(bold)view.setTypeface(android.graphics.Typeface.DEFAULT,
            android.graphics.Typeface.BOLD);
        return view;
    }
    private static EditText input(Context context,String hint){
        EditText view=new EditText(context);
        view.setSingleLine(true);
        view.setTextSize(13);
        view.setTextColor(Color.WHITE);
        view.setHintTextColor(0xFF8FA9C8);
        view.setHint(hint);
        view.setPadding(dp(context,12),0,dp(context,12),0);
        view.setBackground(round(context,0xFF182B42,11,0xFF3B536F));
        view.setMinHeight(dp(context,44));
        return view;
    }
    private static Button button(Context context,String text,boolean prominent,int color){
        Button view=new Button(context);
        view.setText(text);
        view.setTextSize(prominent?15:12);
        view.setAllCaps(false);
        view.setTextColor(Color.WHITE);
        view.setBackgroundTintList(null);
        view.setBackground(round(context,color,12,color));
        view.setPadding(dp(context,10),0,dp(context,10),0);
        view.setMinimumHeight(0);
        view.setMinHeight(0);
        return view;
    }
    /** The image always encodes the exact Pix payload returned by Mercado Pago.
     * No QR is shown before generation, and no bank/account key is fabricated.
     */
    private static Bitmap makePixQr(String payload){
        if(payload==null||payload.trim().isEmpty())return null;
        try{
            int n=640;
            EnumMap<EncodeHintType,Object> hints=new EnumMap<>(EncodeHintType.class);
            hints.put(EncodeHintType.MARGIN,2);
            hints.put(EncodeHintType.CHARACTER_SET,"UTF-8");
            BitMatrix matrix=new MultiFormatWriter().encode(payload,
                BarcodeFormat.QR_CODE,n,n,hints);
            int[] px=new int[n*n];
            for(int y=0;y<n;y++)for(int x=0;x<n;x++)
                px[y*n+x]=matrix.get(x,y)?Color.BLACK:Color.WHITE;
            Bitmap image=Bitmap.createBitmap(n,n,Bitmap.Config.ARGB_8888);
            image.setPixels(px,0,n,0,0,n,n);
            return image;
        }catch(Exception e){return null;}
    }
    private static void copy(Context ctx,String label,String data){
        if(data==null||data.isEmpty())return;
        ClipboardManager clipboard=(ClipboardManager)ctx.getSystemService(Context.CLIPBOARD_SERVICE);
        if(clipboard!=null)clipboard.setPrimaryClip(ClipData.newPlainText(label,data));
    }
}

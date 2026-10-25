package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ClipboardManager;
import android.content.ClipData;
import android.content.Context;
import android.graphics.Color;
import android.view.Gravity;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

/** Owner-verified Pix: preserve payment data, never surface civil recipient name. */
public final class PixSupport {
    // Original EMV payload, validated against the QR provided by the owner.
    public static final String PAYLOAD="00020126580014br.gov.bcb.pix01369417c350-2b62-47a2-97f7-10ebd5a0e04d5204000053039865802BR5924LUCIANO CARECHA SALDANHA6009Sao Paulo62230519daqr155656798608654630446FA";
    private PixSupport() {}
    private static int dp(Activity a,int px){return (int)(a.getResources().getDisplayMetrics().density*px+0.5f);}
    public static void show(Activity a){
        if(a==null || a.isFinishing() || a.isDestroyed())return;
        LinearLayout root=new LinearLayout(a);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER_HORIZONTAL);
        root.setPadding(dp(a,18),dp(a,12),dp(a,18),dp(a,12));
        root.setBackgroundColor(Color.rgb(22,37,53));
        TextView intro=new TextView(a);
        intro.setText("PIX • Qualquer valor");
        intro.setTextColor(Color.WHITE);
        intro.setGravity(Gravity.CENTER_HORIZONTAL);
        intro.setTextSize(17);
        root.addView(intro,new LinearLayout.LayoutParams(-1,-2));
        ImageView qr=new ImageView(a);
        // Byte-identical owner-supplied JPEG: no redraw, crop or overlay.
        qr.setImageResource(R.drawable.support_pix_qr_original);
        qr.setScaleType(ImageView.ScaleType.FIT_CENTER);
        qr.setBackgroundColor(Color.WHITE);
        qr.setContentDescription("QR Code Pix original do PokeSearch");
        LinearLayout.LayoutParams qrLayout=new LinearLayout.LayoutParams(dp(a,260),dp(a,260));
        qrLayout.gravity=Gravity.CENTER_HORIZONTAL;
        qrLayout.topMargin=dp(a,8);
        root.addView(qr,qrLayout);
        TextView receiver=new TextView(a);
        receiver.setText("Confira os dados no aplicativo do banco.");
        receiver.setTextColor(Color.LTGRAY);
        receiver.setGravity(Gravity.CENTER_HORIZONTAL);
        receiver.setTextSize(12);
        LinearLayout.LayoutParams note=new LinearLayout.LayoutParams(-1,-2);
        note.topMargin=dp(a,8);
        root.addView(receiver,note);
        new AlertDialog.Builder(a)
            .setTitle("Apoiar o PokeSearch")
            .setView(root)
            .setPositiveButton("⧉ Copiar Pix",(dialog,which)->{
                ClipboardManager clipboard=(ClipboardManager)a.getSystemService(Context.CLIPBOARD_SERVICE);
                if(clipboard!=null){
                    clipboard.setPrimaryClip(ClipData.newPlainText("Pix · PokeSearch",PAYLOAD));
                    Toast.makeText(a,"Código Pix copiado. Confira os dados no seu banco.",Toast.LENGTH_LONG).show();
                }
            })
            .setNegativeButton("Fechar",null)
            .show();
    }
}
